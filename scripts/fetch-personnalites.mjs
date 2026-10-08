// Pour chaque patronyme candidat (cf. patronyme.mjs), cherche la personne sur fr.wikipedia,
// vérifie via Wikidata qu'il s'agit bien d'un être humain (P31 = Q5), puis récupère :
//   - la biographie (introduction de l'article Wikipédia) et la photo ;
//   - quelques citations depuis fr.wikiquote.
// Sorties :
//   public/data/personnes.json        index léger { patronymes: {candidat: qid}, personnes: {qid: {...}} }
//   public/data/personnes/<qid>.json  détail (bio + citations), chargé à la demande
// Les réponses des API sont mises en cache dans scripts/.cache pour pouvoir relancer rapidement.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extractQuotes, tokens } from './wikiquote.mjs'

const UA = 'monlyceedit/0.1 (projet personnel, non officiel; martin@joyouscoding.com)'
const CACHE_FILE = 'scripts/.cache/wiki.json'

// ---------------------------------------------------------------- utilitaires
const cache = existsSync(CACHE_FILE) ? JSON.parse(await readFile(CACHE_FILE, 'utf8')) : {}
let dirty = 0
async function saveCache(force = false) {
  if (!force && dirty < 50) return
  await mkdir('scripts/.cache', { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(cache))
  dirty = 0
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Wikimedia limite fortement les clients anonymes : une requête à la fois, espacées.
const MIN_INTERVAL = 300
let queue = Promise.resolve()
function throttle() {
  const p = queue.then(() => sleep(MIN_INTERVAL))
  queue = p
  return p
}

async function api(host, params) {
  const key = host + '?' + new URLSearchParams(params)
  if (cache[key]) return cache[key]
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', ...params })
  for (let attempt = 0; attempt < 7; attempt++) {
    await throttle()
    let wait = 2000 * 2 ** attempt
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } })
      if (res.status === 429 || res.status >= 500) {
        wait = Math.max(wait, Number(res.headers.get('retry-after') ?? 0) * 1000)
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      cache[key] = json
      dirty++
      await saveCache()
      return json
    } catch (e) {
      console.warn(`  ! ${e.message}, nouvel essai dans ${wait} ms`)
      await sleep(wait)
    }
  }
  throw new Error('Échec API ' + url)
}

async function pool(items, n, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx], idx)
      }
    }),
  )
  return out
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

// ---------------------------------------------------------------- Wikipédia
const WP = 'fr.wikipedia.org'
const WQ = 'fr.wikiquote.org'

/** titres → { titre: {title, qid, disambig} } (suit les redirections) */
async function lookupTitles(titles) {
  const result = {}
  for (const batch of chunk(titles, 50)) {
    const r = await api(WP, { action: 'query', titles: batch.join('|'), redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item|disambiguation' })
    const q = r.query ?? {}
    const map = Object.fromEntries(batch.map((t) => [t, t]))
    const follow = (list) => {
      for (const { from, to } of list ?? []) for (const k in map) if (map[k] === from) map[k] = to
    }
    follow(q.normalized)
    follow(q.redirects)
    const pages = Object.fromEntries((q.pages ?? []).map((p) => [p.title, p]))
    for (const t of batch) {
      const p = pages[map[t]]
      if (p && !p.missing && p.pageprops?.wikibase_item)
        result[t] = { title: p.title, qid: p.pageprops.wikibase_item, disambig: 'disambiguation' in p.pageprops }
    }
  }
  return result
}

async function search(term) {
  const r = await api(WP, { action: 'query', list: 'search', srsearch: term, srlimit: '5', srnamespace: '0', srprop: '' })
  return (r.query?.search ?? []).map((s) => s.title)
}

// ---------------------------------------------------------------- Wikidata
const entities = {}
async function loadEntities(qids) {
  const todo = [...new Set(qids)].filter((q) => !(q in entities))
  for (const batch of chunk(todo, 150)) {
    const r = await sparql(`
      SELECT ?item (SAMPLE(?h) AS ?human) (MIN(?b) AS ?birth) (MIN(?d) AS ?death) (SAMPLE(?desc) AS ?description)
             (SAMPLE(?wqt) AS ?wikiquote) (SAMPLE(?n) AS ?sitelinks) WHERE {
        VALUES ?item { ${batch.map((q) => 'wd:' + q).join(' ')} }
        ?item wikibase:sitelinks ?n.
        OPTIONAL { ?item wdt:P31 wd:Q5. BIND(true AS ?h) }
        OPTIONAL { ?item wdt:P569 ?b }
        OPTIONAL { ?item wdt:P570 ?d }
        OPTIONAL { ?item schema:description ?desc. FILTER(LANG(?desc) = "fr") }
        OPTIONAL { ?wq schema:about ?item; schema:isPartOf <https://fr.wikiquote.org/>; schema:name ?wqt }
      } GROUP BY ?item`)
    const year = (b) => {
      if (!b) return null
      const y = parseInt(b.value.slice(0, b.value.indexOf('-', 1)), 10)
      return Number.isFinite(y) ? y : null
    }
    for (const q of batch) entities[q] = { human: false, notoriete: 0 }
    for (const b of r.results.bindings) {
      const id = b.item.value.split('/').pop()
      entities[id] = {
        human: b.human?.value === 'true',
        naissance: year(b.birth),
        deces: year(b.death),
        description: b.description?.value ?? null,
        wikiquote: b.wikiquote?.value ?? null,
        notoriete: Number(b.sitelinks?.value ?? 0),
      }
    }
  }
}

async function sparql(query) {
  const key = 'sparql:' + query
  if (cache[key]) return cache[key]
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch('https://query.wikidata.org/sparql', {
        method: 'POST',
        headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ query }),
      })
      if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`)
      const json = await res.json()
      cache[key] = json
      dirty++
      await saveCache()
      return json
    } catch (e) {
      const wait = 2000 * 2 ** attempt
      console.warn(`  ! ${e.message}, nouvel essai dans ${wait} ms`)
      await sleep(wait)
    }
  }
  throw new Error('Échec SPARQL')
}

// ---------------------------------------------------------------- résolution
/** Variantes à essayer pour un candidat. */
function variants(c) {
  const v = [c]
  const m = c.match(/^(\S+) et (\S+) (.+)$/) // « Pierre et Marie Curie » → « Marie Curie », « Pierre Curie »
  if (m) v.push(`${m[2]} ${m[3]}`, `${m[1]} ${m[3]}`)
  if (/^Saint[- ]/.test(c) && !/^Saint-(Exupéry|John-Perse|Just|Simon)/.test(c)) v.push(c.replace(/^Saint[- ]/, 'Saint '))
  if (c.includes('-')) v.push(c.replace(/-/g, ' '))
  return [...new Set(v)]
}

/** Le titre trouvé correspond-il raisonnablement au candidat ? */
function matches(candidate, title) {
  const ct = tokens(candidate)
  const sansParenthese = title.replace(/\s*\(.*\)$/, '')
  const tt = tokens(sansParenthese)
  if (ct.length === 0) return false
  // Un seul mot : ce doit être le nom de famille (« Laplace » → « Pierre-Simon de Laplace », pas « Rey » → « Rey Mysterio »)
  // y compris « Marie de Rabutin-Chantal, marquise de Sévigné »
  if (ct.length === 1) return tt.at(-1) === ct[0] || tokens(sansParenthese.replace(/,.*$/, '')).at(-1) === ct[0]
  // Plusieurs mots : présents dans le même ordre (« Mercier Saint-Paul » ≠ « Jean-Paul Mercier »)
  let j = 0
  for (const t of tt) if (t === ct[j]) j++
  return j === ct.length
}

// Correspondances manifestement fausses, ou patronymes qui ne désignent pas une personne
const EXCLUS_CANDIDATS = /^(Stam$|Présentation|Sacré|Immaculée|Assomption|Annonciation)\b/
const EXCLUS_DESCRIPTION = /\b(tueur|criminel|meurtri[eè]re?|escroc|catcheur)\b/i

const candidates = [
  ...new Set(JSON.parse(await readFile('public/data/lycees.json', 'utf8')).map((l) => l.patronyme).filter(Boolean)),
].filter((c) => !EXCLUS_CANDIDATS.test(c))
console.log(`${candidates.length} patronymes candidats`)

// Étape 1 : titre exact (avec redirections)
const allVariants = [...new Set(candidates.flatMap(variants))]
const exact = await lookupTitles(allVariants)
await loadEntities(Object.values(exact).map((x) => x.qid))

const resolved = {} // candidat → { title, qid }
const pending = []
for (const c of candidates) {
  const hit = variants(c)
    .map((v) => exact[v])
    .find((x) => x && !x.disambig && entities[x.qid]?.human)
  if (hit) resolved[c] = hit
  else pending.push(c)
}
console.log(`Étape 1 (titre exact) : ${Object.keys(resolved).length} personnes`)

// Étape 2 : recherche plein texte, avec contrôle de correspondance du nom
let n = 0
const hits = {} // variante → titres correspondants
await pool(pending, 3, async (c) => {
  if (++n % 100 === 0) console.log(`  recherche ${n}/${pending.length}`)
  for (const v of variants(c)) {
    try {
      hits[v] = (await search(v)).filter((t) => matches(v, t))
    } catch (e) {
      console.warn(`  ! recherche « ${v} » abandonnée : ${e.message}`)
    }
  }
})
const found = await lookupTitles([...new Set(Object.values(hits).flat())])
await loadEntities(Object.values(found).map((x) => x.qid))
for (const c of pending) {
  outer: for (const v of variants(c)) {
    for (const t of hits[v] ?? []) {
      const x = found[t]
      const e = x && entities[x.qid]
      if (!e?.human || x.disambig) continue
      // Un seul mot (« Descartes », « Robert ») : on n'accepte que des personnalités très connues
      // et décédées (évite « Rey » → Lana Del Rey, « Stam » → Jaap Stam)
      if (tokens(v).length < 2 && (e.notoriete < 40 || !e.deces)) continue
      resolved[c] = x
      break outer
    }
  }
}
for (const [c, x] of Object.entries(resolved)) if (EXCLUS_DESCRIPTION.test(entities[x.qid].description ?? '')) delete resolved[c]
await saveCache(true)
console.log(`Étape 2 (recherche) : ${Object.keys(resolved).length} personnes au total`)

// ---------------------------------------------------------------- contenus
const qids = [...new Set(Object.values(resolved).map((x) => x.qid))]
const titleOf = Object.fromEntries(Object.values(resolved).map((x) => [x.qid, x.title]))

// Biographies + images (extracts : 20 max par requête en mode exintro)
const pageInfo = {}
for (const batch of chunk(qids.map((q) => titleOf[q]), 20)) {
  const r = await api(WP, {
    action: 'query',
    titles: batch.join('|'),
    prop: 'extracts|pageimages',
    exintro: '1',
    explaintext: '1',
    exlimit: '20',
    piprop: 'thumbnail',
    pithumbsize: '400',
    pilimit: '20',
  })
  for (const p of r.query?.pages ?? []) pageInfo[p.title] = { extrait: p.extract ?? '', image: p.thumbnail?.source ?? null }
}
await saveCache(true)

function cleanBio(text) {
  if (!text) return []
  return text
    .replace(/\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/, (m) => (m.length > 120 ? '' : m)) // parenthèse de prononciation trop longue
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !/^=+/.test(p))
    .slice(0, 4)
}

// ---------------------------------------------------------------- Wikiquote
// Certaines pages Wikiquote ne sont pas reliées à Wikidata : on les cherche par titre.
const sansLien = qids.filter((q) => !entities[q].wikiquote)
for (const batch of chunk(sansLien, 50)) {
  const r = await api(WQ, { action: 'query', titles: batch.map((q) => titleOf[q]).join('|'), redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item|disambiguation' })
  const q_ = r.query ?? {}
  const suivre = (t) => {
    for (const list of [q_.normalized, q_.redirects]) for (const { from, to } of list ?? []) if (from === t) t = to
    return t
  }
  const pages = Object.fromEntries((q_.pages ?? []).map((p) => [p.title, p]))
  for (const q of batch) {
    const p = pages[suivre(titleOf[q])]
    if (!p || p.missing || p.pageprops?.disambiguation !== undefined) continue
    // Page reliée à une autre entité Wikidata : homonyme, on l'ignore
    if (p.pageprops?.wikibase_item && p.pageprops.wikibase_item !== q) continue
    entities[q].wikiquote = p.title
  }
}

const quotesByQid = {}
const withQuotes = qids.filter((q) => entities[q].wikiquote)
console.log(`Citations : ${withQuotes.length} pages Wikiquote à lire (${withQuotes.length - (qids.length - sansLien.length)} trouvées par titre)`)
await pool(withQuotes, 4, async (q) => {
  let r
  try {
    r = await api(WQ, { action: 'parse', page: entities[q].wikiquote, prop: 'wikitext', redirects: '1' })
    quotesByQid[q] = extractQuotes(r.parse?.wikitext)
  } catch (e) {
    console.warn(`  ! citations ${entities[q].wikiquote}: ${e.message}`)
    quotesByQid[q] = []
  }
})
await saveCache(true)
for (const q of Object.keys(quotesByQid)) quotesByQid[q] = quotesByQid[q].map((c) => ({ ...c, origine: 'wikiquote' }))

// ---------------------------------------------------------------- écriture
await rm('public/data/personnes', { recursive: true, force: true })
await mkdir('public/data/personnes', { recursive: true })

const index = { patronymes: {}, personnes: {} }
for (const [c, x] of Object.entries(resolved)) index.patronymes[c] = x.qid

for (const q of qids) {
  const e = entities[q]
  const title = titleOf[q]
  const info = pageInfo[title] ?? {}
  const citations = quotesByQid[q] ?? []
  index.personnes[q] = {
    nom: title.replace(/\s*\(.*\)$/, ''),
    description: e.description,
    naissance: e.naissance,
    deces: e.deces,
    image: info.image ?? null,
    nbCitations: citations.length,
  }
  await writeFile(
    `public/data/personnes/${q}.json`,
    JSON.stringify({
      qid: q,
      titre: title,
      wikipedia: `https://fr.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      wikiquote: e.wikiquote ? `https://fr.wikiquote.org/wiki/${encodeURIComponent(e.wikiquote.replace(/ /g, '_'))}` : null,
      bio: cleanBio(info.extrait),
      citations,
    }),
  )
}
await writeFile('public/data/personnes.json', JSON.stringify(index))

const nbQ = Object.values(index.personnes).filter((p) => p.nbCitations > 0).length
console.log(`Écrit ${qids.length} personnalités (${nbQ} avec citations) pour ${Object.keys(index.patronymes).length} patronymes.`)
