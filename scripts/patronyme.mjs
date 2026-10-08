// Extrait le « patronyme » candidat d'un nom d'établissement :
// « Section d'enseignement professionnel du Lycée polyvalent privé Saint Thomas d'Aquin » → « Saint Thomas d'Aquin »
// Le résultat n'est qu'un candidat : la résolution (est-ce une personne ?) se fait via Wikipédia/Wikidata.

// Fin de mot compatible avec les lettres accentuées (\b ne les gère pas en JS)
const END = String.raw`(?![\p{L}\p{N}])`
const re = (src) => new RegExp(`^(?:${src})${END}\\s*`, 'iu')

const PREFIXES = [
  re(`section d'enseignement (?:général(?:e)?(?: et technologique)?|professionnel(?:le)?|technologique)`),
  re(`section (?:professionnelle|générale|technologique|d'enseignement)`),
  re(`annexe du lycée|SEP|SGT|SEGT|micro-lycée`),
  re(`lycée|lycee|LEGTA|LEGT|LGT|LPO|LPA|LPP|LP|LTP|LGTA|EREA|lycée-collège|collège-lycée|collège et lycée`),
  re(`établissement|etablissement|ensemble scolaire|institution|institut|cité scolaire|école|ecole|campus`),
  re(
    [
      'polyvalent(?:e)?',
      'général(?:e)?',
      'technologique',
      'technique',
      'professionnel(?:le)?',
      "d'enseignement (?:général|professionnel|technologique|agricole)",
      'agricole',
      'agroalimentaire',
      'horticole',
      'maritime',
      'hôtelier',
      'hotelier',
      'régional',
      'regional',
      'privée?',
      'privéee',
      'prive',
      'publique?',
      'des métiers',
      'rural',
      'militaire',
      'international(?:e)?',
      'catholique',
      'protestant',
      'européen(?:ne)?',
      'forestier',
      'viticole',
      'secondaire',
      'supérieure?',
      'du second degré',
      '(?:hors|sous) contrat',
      'de production',
      'et',
      'du',
      'des',
      'de',
      "d'",
    ].join('|'),
  ),
]

export function extractPatronyme(nom) {
  if (!nom) return null
  let s = nom
    .replace(/’/g, "'")
    .replace(/(?<=\p{L})[.,](?=\s)/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  // on coupe les compléments : « X - site de Y », « X (annexe) », « X site de Y »
  s = s.split(/\s+[-–—]\s+|\s*\(|\s+site\s+(?:de\s+)?/i)[0]

  let changed = true
  while (changed) {
    changed = false
    for (const r of PREFIXES) {
      const next = s.replace(r, '').replace(/^d'/i, '')
      if (next !== s) {
        s = next.trim()
        changed = true
      }
    }
  }
  if (!s || s.length < 3) return null
  // Doit commencer par une majuscule (sinon c'est un lieu ou un descriptif)
  if (!/^\p{Lu}/u.test(s)) return null
  // Les noms en MAJUSCULES (« Nelson MANDELA ») sont normalisés
  s = s.replace(/(?<![\p{L}])(\p{Lu})(\p{Lu}{2,})(?![\p{L}])/gu, (_, a, b) => a + b.toLowerCase())
  return s
}
