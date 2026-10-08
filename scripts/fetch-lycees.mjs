// Télécharge la liste des lycées depuis l'Annuaire de l'éducation (data.education.gouv.fr)
// et écrit une version compacte dans public/data/lycees.json.
import { writeFile, mkdir } from 'node:fs/promises'
import { extractPatronyme } from './patronyme.mjs'

const DATASET = 'fr-en-annuaire-education'
const FIELDS = [
  'identifiant_de_l_etablissement',
  'nom_etablissement',
  'statut_public_prive',
  'adresse_1',
  'code_postal',
  'nom_commune',
  'code_departement',
  'libelle_departement',
  'libelle_region',
  'latitude',
  'longitude',
  'web',
  'telephone',
  'voie_generale',
  'voie_technologique',
  'voie_professionnelle',
]

const url =
  `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/${DATASET}/exports/json?` +
  new URLSearchParams({
    where: 'type_etablissement="Lycée" AND etat="OUVERT"',
    select: FIELDS.join(','),
  })

console.log('Téléchargement…', url)
const res = await fetch(url)
if (!res.ok) throw new Error(`HTTP ${res.status}`)
const raw = await res.json()
console.log(`${raw.length} lycées reçus`)

const round = (n) => (n == null ? null : Math.round(n * 1e5) / 1e5)
const voies = (r) =>
  [r.voie_generale === '1' && 'G', r.voie_technologique === '1' && 'T', r.voie_professionnelle === '1' && 'P']
    .filter(Boolean)
    .join('')

const lycees = raw
  .map((r) => ({
    id: r.identifiant_de_l_etablissement,
    nom: r.nom_etablissement,
    statut: r.statut_public_prive === 'Privé' ? 'Privé' : 'Public',
    adresse: r.adresse_1 ?? '',
    cp: r.code_postal ?? '',
    commune: r.nom_commune ?? '',
    dep: (r.code_departement ?? '').replace(/^0(?=\d{2}$|\d[AB]$)/, ''),
    depNom: r.libelle_departement ?? '',
    region: r.libelle_region ?? '',
    lat: round(r.latitude),
    lon: round(r.longitude),
    web: r.web ?? null,
    tel: r.telephone ?? null,
    voies: voies(r),
    patronyme: extractPatronyme(r.nom_etablissement),
  }))
  .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

await mkdir('public/data', { recursive: true })
await writeFile('public/data/lycees.json', JSON.stringify(lycees))
await writeFile(
  'public/data/meta.json',
  JSON.stringify({ source: `https://data.education.gouv.fr/explore/dataset/${DATASET}/`, date: new Date().toISOString().slice(0, 10), total: lycees.length }),
)
console.log(`Écrit public/data/lycees.json (${lycees.length} lycées, ${lycees.filter((l) => l.patronyme).length} avec un patronyme candidat)`)
