import { useEffect, useState } from 'react'
import type { Lycee, Meta, PersonneDetail, PersonneResume, PersonnesIndex } from './types'

const BASE = import.meta.env.BASE_URL

export interface Donnees {
  lycees: Lycee[]
  index: PersonnesIndex
  meta: Meta
}

let promise: Promise<Donnees> | null = null

export function chargerDonnees(): Promise<Donnees> {
  promise ??= Promise.all([
    fetch(`${BASE}data/lycees.json`).then((r) => r.json()),
    fetch(`${BASE}data/personnes.json`).then((r) => r.json()),
    fetch(`${BASE}data/meta.json`).then((r) => r.json()),
  ]).then(([lycees, index, meta]) => ({ lycees, index, meta }))
  return promise
}

export function useDonnees() {
  const [donnees, setDonnees] = useState<Donnees | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  useEffect(() => {
    chargerDonnees().then(setDonnees, (e) => setErreur(String(e)))
  }, [])
  return { donnees, erreur }
}

const detailCache = new Map<string, Promise<PersonneDetail>>()

export function chargerPersonne(qid: string): Promise<PersonneDetail> {
  if (!detailCache.has(qid)) detailCache.set(qid, fetch(`${BASE}data/personnes/${qid}.json`).then((r) => r.json()))
  return detailCache.get(qid)!
}

export function usePersonneDetail(qid: string | null) {
  const [detail, setDetail] = useState<PersonneDetail | null>(null)
  useEffect(() => {
    if (!qid) return
    let actif = true
    chargerPersonne(qid).then((d) => actif && setDetail(d))
    return () => {
      actif = false
    }
  }, [qid])
  return detail?.qid === qid ? detail : null
}

export function personneDe(l: Lycee, index: PersonnesIndex): { qid: string; personne: PersonneResume } | null {
  const qid = l.patronyme ? index.patronymes[l.patronyme] : undefined
  return qid ? { qid, personne: index.personnes[qid] } : null
}

/** Minuscules, sans accents ni ponctuation : pour une recherche tolérante. */
export const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Distance en km (formule de haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const VOIES: Record<string, string> = { G: 'Générale', T: 'Technologique', P: 'Professionnelle' }

const annee = (y: number) => (y < 0 ? `${-y} av. J.-C.` : String(y))

export function dates(p: PersonneResume) {
  if (p.naissance && p.deces) return `${annee(p.naissance)} – ${annee(p.deces)}`
  if (p.naissance) return `depuis ${annee(p.naissance)}`
  return null
}
