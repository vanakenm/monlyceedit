export interface Lycee {
  id: string
  nom: string
  statut: 'Public' | 'Privé'
  adresse: string
  cp: string
  commune: string
  dep: string
  depNom: string
  region: string
  lat: number | null
  lon: number | null
  web: string | null
  tel: string | null
  voies: string
  patronyme: string | null
}

export interface PersonneResume {
  nom: string
  description: string | null
  naissance: number | null
  deces: number | null
  image: string | null
  nbCitations: number
}

export interface PersonnesIndex {
  patronymes: Record<string, string>
  personnes: Record<string, PersonneResume>
}

export interface Citation {
  texte: string
  source: string | null
  origine: 'wikiquote' | 'manuelle'
}

export interface PersonneDetail {
  qid: string
  titre: string
  wikipedia: string
  wikiquote: string | null
  bio: string[]
  citations: Citation[]
}

export interface Meta {
  source: string
  date: string
  total: number
}
