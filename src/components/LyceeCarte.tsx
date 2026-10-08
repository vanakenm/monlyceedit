import type { Lycee, PersonneResume } from '../types'
import { VOIES } from '../data'
import { lienLycee } from '../router'

interface Props {
  lycee: Lycee
  personne: PersonneResume | null
  distance?: number
}

export function Pastille({ children, ton = 'neutre' }: { children: React.ReactNode; ton?: 'neutre' | 'bleu' | 'prive' }) {
  const styles = {
    neutre: 'bg-gris-fond text-gris-texte',
    bleu: 'bg-bleu-clair text-bleu',
    prive: 'bg-[#fee9e6] text-[#8d1a1a]',
  }[ton]
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${styles}`}>{children}</span>
}

export function LyceeCarte({ lycee: l, personne, distance }: Props) {
  return (
    <a
      href={lienLycee(l.id)}
      className="group flex h-full flex-col border border-gris-bordure bg-white transition-shadow hover:shadow-[0_6px_18px_rgba(0,0,18,0.16)]"
    >
      <div className="flex flex-1 gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Pastille ton={l.statut === 'Privé' ? 'prive' : 'bleu'}>{l.statut}</Pastille>
            {l.voies.split('').map((v) => (
              <Pastille key={v}>{VOIES[v]}</Pastille>
            ))}
          </div>
          <h3 className="text-lg leading-snug font-bold text-bleu group-hover:underline">{l.nom}</h3>
          <p className="mt-1 text-sm text-gris-doux">
            {l.commune} ({l.dep}) · {l.depNom}
            {distance != null && <> · <strong className="text-gris-texte">{distance < 10 ? distance.toFixed(1) : Math.round(distance)} km</strong></>}
          </p>
          {personne && (
            <p className="mt-3 border-l-2 border-rouge pl-3 text-sm">
              <span className="font-semibold">{personne.nom}</span>
              {personne.description && <span className="text-gris-doux"> — {personne.description}</span>}
              {personne.nbCitations > 0 && (
                <span className="ml-1 whitespace-nowrap text-bleu">
                  · {personne.nbCitations} citation{personne.nbCitations > 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>
        {personne?.image && (
          <img
            src={personne.image}
            alt=""
            loading="lazy"
            className="h-20 w-16 shrink-0 object-cover object-top grayscale-[30%] group-hover:grayscale-0"
          />
        )}
      </div>
      <div className="flex justify-end px-5 pb-3 text-bleu" aria-hidden>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </a>
  )
}
