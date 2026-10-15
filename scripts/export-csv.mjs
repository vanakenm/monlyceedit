// Génère public/data/lycees.csv à partir des données déjà téléchargées :
// un lycée par ligne, avec la personnalité associée et son article Wikipédia.
// Lancé automatiquement avant `npm run dev` et `npm run build` (fichier non versionné).
import { readFile, writeFile } from 'node:fs/promises'

const lycees = JSON.parse(await readFile('public/data/lycees.json', 'utf8'))
const index = JSON.parse(await readFile('public/data/personnes.json', 'utf8'))

const details = {}
for (const qid of Object.keys(index.personnes)) {
  details[qid] = JSON.parse(await readFile(`public/data/personnes/${qid}.json`, 'utf8'))
}

const COLONNES = [
  ['uai', (l) => l.id],
  ['nom', (l) => l.nom],
  ['adresse', (l) => l.adresse],
  ['code_postal', (l) => l.cp],
  ['commune', (l) => l.commune],
  ['code_departement', (l) => l.dep],
  ['departement', (l) => l.depNom],
  ['region', (l) => l.region],
  ['secteur', (l) => l.statut],
  ['latitude', (l) => l.lat],
  ['longitude', (l) => l.lon],
  ['personnalite', (l, p) => p && index.personnes[p].nom],
  ['wikipedia', (l, p) => p && decodeURI(details[p].wikipedia)],
  ['wikidata', (l, p) => p && `https://www.wikidata.org/wiki/${p}`],
]

// Séparateur « ; » et BOM UTF-8 : le fichier s'ouvre directement dans un tableur configuré en français
const cellule = (v) => {
  if (v == null) return ''
  const s = String(v)
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const lignes = [COLONNES.map(([nom]) => nom).join(';')]
for (const l of lycees) {
  const qid = l.patronyme ? index.patronymes[l.patronyme] : undefined
  lignes.push(COLONNES.map(([, f]) => cellule(f(l, qid))).join(';'))
}

await writeFile('public/data/lycees.csv', '﻿' + lignes.join('\r\n') + '\r\n')
console.log(`Écrit public/data/lycees.csv (${lycees.length} lycées)`)
