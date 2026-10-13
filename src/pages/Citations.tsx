import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Donnees } from '../data'
import { chargerPersonne, dates, personneDe } from '../data'
import { lienLycee } from '../router'
import type { Citation, Lycee, PersonneResume } from '../types'

const NB = 4
// Les citations trop longues (discours, extraits) ne se prêtent pas à cette page
const LONGUEUR_MAX = 280
const LYCEES_MAX = 3

interface Tirage {
  qid: string
  personne: PersonneResume
  citation: Citation
}

function melanger<T>(t: T[]): T[] {
  const r = [...t]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/** Tire NB citations courtes, chacune d'une personnalité différente. */
async function tirer(candidats: [string, PersonneResume][]): Promise<Tirage[]> {
  const tirages: Tirage[] = []
  const file = melanger(candidats)
  while (tirages.length < NB && file.length) {
    const lot = file.splice(0, NB - tirages.length)
    const details = await Promise.all(lot.map(([q]) => chargerPersonne(q)))
    details.forEach((d, i) => {
      const courtes = d.citations.filter((c) => c.texte.length <= LONGUEUR_MAX)
      if (courtes.length) tirages.push({ qid: lot[i][0], personne: lot[i][1], citation: melanger(courtes)[0] })
    })
  }
  return tirages
}

function Lycees({ lycees }: { lycees: Lycee[] }) {
  const reste = lycees.length - LYCEES_MAX
  return (
    <div className="mt-4 text-sm">
      <span className="font-semibold">
        {lycees.length > 1 ? `Ont donné son nom à ${lycees.length} lycées :` : 'A donné son nom au lycée :'}
      </span>
      <ul className="mt-1 space-y-0.5">
        {lycees.slice(0, LYCEES_MAX).map((l) => (
          <li key={l.id}>
            <a className="lien" href={lienLycee(l.id)}>
              {l.nom}
            </a>{' '}
            <span className="text-gris-doux">
              — {l.commune} ({l.dep})
            </span>
          </li>
        ))}
        {reste > 0 && (
          <li className="text-gris-doux">
            et {reste} autre{reste > 1 ? 's' : ''}
          </li>
        )}
      </ul>
    </div>
  )
}

export function Citations({ donnees }: { donnees: Donnees }) {
  const { lycees, index } = donnees

  // qid → lycées portant le nom de la personnalité
  const lyceesPar = useMemo(() => {
    const m = new Map<string, Lycee[]>()
    for (const l of lycees) {
      const p = personneDe(l, index)
      if (p) m.set(p.qid, [...(m.get(p.qid) ?? []), l])
    }
    for (const t of m.values()) t.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    return m
  }, [lycees, index])

  const candidats = useMemo(
    () => Object.entries(index.personnes).filter(([q, p]) => p.nbCitations > 0 && lyceesPar.has(q)),
    [index, lyceesPar],
  )

  const [tirages, setTirages] = useState<Tirage[] | null>(null)
  const relancer = useCallback(() => {
    setTirages(null)
    tirer(candidats).then(setTirages)
  }, [candidats])

  useEffect(() => {
    let actif = true
    window.scrollTo(0, 0)
    document.title = 'Citations – Mon lycée dit'
    tirer(candidats).then((t) => actif && setTirages(t))
    return () => {
      actif = false
      document.title = 'Mon lycée dit'
    }
  }, [candidats])

  return (
    <article className="py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Citations</h1>
          <p className="mt-2 text-lg text-gris-doux">Qui l'a dit ? Et quel lycée porte son nom ?</p>
        </div>
        <button
          type="button"
          onClick={relancer}
          disabled={!tirages}
          className="bg-bleu px-4 py-2 font-semibold text-white hover:bg-bleu/90 disabled:opacity-60"
        >
          D'autres citations
        </button>
      </header>

      {!tirages ? (
        <p className="py-16 text-center text-gris-doux" role="status">
          Chargement des citations…
        </p>
      ) : (
        <ul className="space-y-6" aria-live="polite">
          {tirages.map(({ qid, personne, citation }) => {
            const periode = dates(personne)
            return (
              <li key={qid} className="relative bg-bleu-tres-clair p-6 pt-10 md:p-8 md:pt-12">
                <span aria-hidden className="absolute top-1 left-4 font-serif text-6xl leading-none text-bleu/30 md:left-6">
                  «
                </span>
                <figure>
                  <blockquote className="font-serif text-xl leading-relaxed whitespace-pre-line text-gris-texte md:text-2xl">
                    {citation.texte}
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    {personne.image && (
                      <img src={personne.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover object-top" />
                    )}
                    <span>
                      <span className="block font-bold">{personne.nom}</span>
                      {(personne.description || periode) && (
                        <span className="block text-sm text-gris-doux">
                          {personne.description}
                          {personne.description && periode && ' · '}
                          {periode}
                        </span>
                      )}
                    </span>
                  </figcaption>
                </figure>
                <Lycees lycees={lyceesPar.get(qid)!} />
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
