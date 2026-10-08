// Extraction des citations depuis le wikitexte d'une page fr.wikiquote.

export const MAX_QUOTES = 6

export const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'd', 'l', 'saint', 'sainte', 'st'])
export const tokens = (s) => norm(s).split(' ').filter((t) => t.length > 1 && !STOP.has(t))

function findTemplates(text, name) {
  // renvoie [{start, end, body}] pour chaque {{name|...}} (gestion des accolades imbriquées)
  const out = []
  const re = new RegExp(`\\{\\{\\s*${name}\\s*\\|`, 'gi')
  let m
  while ((m = re.exec(text))) {
    let depth = 0
    let i = m.index
    for (; i < text.length; i++) {
      if (text.startsWith('{{', i)) (depth++, i++)
      else if (text.startsWith('}}', i)) {
        depth--
        i++
        if (depth === 0) break
      }
    }
    out.push({ start: m.index, end: i + 1, body: text.slice(m.index + m[0].length, i - 1) })
    re.lastIndex = i + 1
  }
  return out
}

function param(body, name) {
  // paramètre nommé de premier niveau
  let depth = 0
  const parts = []
  let cur = ''
  for (let i = 0; i < body.length; i++) {
    if (body.startsWith('{{', i) || body.startsWith('[[', i)) (depth++, (cur += body[i] + body[i + 1]), i++)
    else if (body.startsWith('}}', i) || body.startsWith(']]', i)) (depth--, (cur += body[i] + body[i + 1]), i++)
    else if (body[i] === '|' && depth === 0) (parts.push(cur), (cur = ''))
    else cur += body[i]
  }
  parts.push(cur)
  if (name === 1) return parts.find((p) => !/^\s*[\w éèàç'-]+\s*=/.test(p))?.trim()
  const p = parts.find((p) => new RegExp(`^\\s*${name}\\s*=`, 'i').test(p))
  return p?.replace(/^[^=]*=/, '').trim()
}

function wikiToText(s) {
  if (!s) return ''
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{(?:lang|langue)\|[^|}]*\|(?:texte=)?([^}]*)\}\}/gi, '$1')
    .replace(/\{\{(?:s|siècle|sp)\|([IVXLC]+)[^{}]*\}\}/gi, '$1e')
    .replace(/\{\{(?:w|lien)\|(?:[^|{}]*\|)?([^|{}]*)\}\}/gi, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s([^\]]*)\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/^[:;*#]+\s*/gm, '')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

// Section de niveau 2 regroupant des propos tenus par d'autres SUR la personne (« Citations sur X », « À propos »…).
// Attention : un sous-titre « Sur la défense de la nature » est un thème, pas un propos sur la personne.
const SECTION_SUR_LA_PERSONNE = /^(citations?\s+|propos\s+)?(sur|à propos|a propos|au sujet|concernant)\b|à son (sujet|propos|égard)|hommage|évocation|citée?s? par/i
// Sections douteuses ou annexes, à n'importe quel niveau.
// NB : « Citations rapportées » (propos de la personne rapportés par un tiers) est conservé.
const SECTION_EXCLUE = /attribu|apocryph|douteu|faussement|contesté|voir aussi|liens|références|notes|bibliographie/i

const MAX_LEN = 450

/** Citation trop longue (discours, lettre) : on garde les premières phrases, suivies de « […] ». */
function extrait(texte) {
  if (texte.length <= MAX_LEN) return texte
  const phrases = texte.match(/[^.!?…]+(?:[.!?…]+[»"”]?|$)/g) ?? [texte]
  let out = ''
  for (const p of phrases) {
    if ((out + p).length > MAX_LEN) break
    out += p
    if (out.length >= 180) break
  }
  out = out.trim()
  return out.length >= 40 ? `${out} […]` : null
}

export function extractQuotes(wikitext) {
  if (!wikitext) return []
  // positions des titres de section
  const headings = [...wikitext.matchAll(/^(={2,4})\s*(.+?)\s*\1\s*$/gm)].map((m) => ({ pos: m.index, level: m[1].length, title: wikiToText(m[2]) }))
  const ctx = (pos) => {
    let h2 = null
    let last = null
    for (const h of headings) {
      if (h.pos > pos) break
      if (h.level === 2) h2 = h.title
      last = h.title
    }
    return { h2, last }
  }

  const quotes = []
  for (const t of findTemplates(wikitext, 'citation')) {
    const { h2, last } = ctx(t.start)
    if (h2 && (SECTION_SUR_LA_PERSONNE.test(h2) || SECTION_EXCLUE.test(h2))) continue
    if (last && SECTION_EXCLUE.test(last)) continue
    const brut = wikiToText(param(t.body, 'citation') ?? param(t.body, 1))
    if (!brut || brut.length < 25) continue
    const texte = extrait(brut)
    if (!texte) continue
    // Source : le modèle {{réf ...}} qui suit immédiatement, sinon le titre de section
    let source = null
    // Contexte jusqu'à la citation suivante
    const suivante = wikitext.slice(t.end).search(/\{\{\s*citation\s*\|/i)
    const after = wikitext.slice(t.end, t.end + (suivante < 0 ? 1500 : Math.min(suivante, 1500)))
    const choisie = /\{\{\s*Choisie citation du jour/i.test(after)
    const ref = after.match(/^\s*\{\{\s*réf\s+\w+/i)
    if (ref) {
      const [r] = findTemplates(after, 'réf\\s+\\w+')
      if (r) {
        const titre = wikiToText(param(r.body, 'titre') ?? param(r.body, 'titre chapitre') ?? '')
        const annee = param(r.body, "année d'origine") ?? param(r.body, 'année') ?? param(r.body, 'date')
        source = [titre, wikiToText(annee ?? '')].filter(Boolean).join(', ') || null
      }
    }
    if (!source && last && last !== h2) source = last
    if (source && source.length > 160) source = source.slice(0, 157) + '…'
    quotes.push({ texte, source, choisie })
  }
  return selectionner(quotes)
}

function selectionner(quotes) {
  // Classement : « citation du jour » d'abord, puis les citations courtes et autonomes ; 2 par œuvre au plus
  const score = (q, i) => {
    const l = q.texte.length
    return (q.choisie ? 0 : 10) + (l < 40 ? 3 : l <= 220 ? 0 : l <= 350 ? 2 : 5) + (q.texte.includes('\n') ? 1 : 0) + i / 1000
  }
  const parSource = {}
  return quotes
    .map((q, i) => ({ q, i, s: score(q, i) }))
    .sort((a, b) => a.s - b.s)
    .filter(({ q }) => (parSource[q.source] = (parSource[q.source] ?? 0) + 1) <= 2)
    .slice(0, MAX_QUOTES)
    .sort((a, b) => a.i - b.i)
    .map(({ q: { texte, source } }) => ({ texte, source }))
}


