// Ajoute les citations saisies à la main (scripts/citations-manuelles.json) aux données générées
// par fetch-personnalites.mjs. Elles passent avant celles de Wikiquote, sans doublon.
// Idempotent : les citations manuelles déjà présentes sont retirées puis réinsérées.
import { readFile, writeFile } from 'node:fs/promises'

const manuelles = JSON.parse(await readFile('scripts/citations-manuelles.json', 'utf8'))
const index = JSON.parse(await readFile('public/data/personnes.json', 'utf8'))

const cle = (t) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

let total = 0
for (const [q, { nom, citations }] of Object.entries(manuelles)) {
  const fichier = `public/data/personnes/${q}.json`
  if (!index.personnes[q]) {
    console.warn(`  ! ${q} (${nom}) absent des données, ignoré`)
    continue
  }
  const detail = JSON.parse(await readFile(fichier, 'utf8'))
  const ajoutees = citations.map((texte) => ({ texte, source: null, origine: 'manuelle' }))
  const cles = new Set(ajoutees.map((c) => cle(c.texte)))
  const autres = detail.citations.filter((c) => c.origine !== 'manuelle' && !cles.has(cle(c.texte)))
  detail.citations = [...ajoutees, ...autres]
  index.personnes[q].nbCitations = detail.citations.length
  await writeFile(fichier, JSON.stringify(detail))
  total += ajoutees.length
}
await writeFile('public/data/personnes.json', JSON.stringify(index))
console.log(`${total} citations manuelles ajoutées pour ${Object.keys(manuelles).length} personnalités.`)
