import type { ReactNode } from 'react'

export function Avertissement() {
  return (
    <div className="border-b border-ambre-texte/20 bg-ambre text-ambre-texte">
      <p className="mx-auto max-w-6xl px-4 py-2 text-sm">
        <strong className="font-semibold">Site non officiel.</strong> Ce projet indépendant n'est ni affilié, ni approuvé par le
        ministère de l'Éducation nationale. Il réutilise des données publiques ouvertes.{' '}
        <a href="#/a-propos" className="underline underline-offset-2">
          En savoir plus
        </a>
      </p>
    </div>
  )
}

function Logo() {
  return (
    <a href="#/" className="group flex items-center gap-3" aria-label="Mon lycée dit — accueil">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-bleu font-serif text-3xl leading-none text-white">
        «
      </span>
      <span className="leading-tight">
        <span className="block text-xl font-bold text-gris-texte group-hover:text-bleu">Mon lycée dit</span>
        <span className="block text-sm text-gris-doux">Les lycées de France et celles et ceux dont ils portent le nom</span>
      </span>
    </a>
  )
}

export const URL_CSV = `${import.meta.env.BASE_URL}data/lycees.csv`

/** Icône de téléchargement de la liste complète des lycées (CSV généré au build). */
function LienTelechargement() {
  return (
    <a
      href={URL_CSV}
      download="lycees-monlyceedit.csv"
      title="Télécharger la liste des lycées (CSV : nom, adresse, personnalité, lien Wikipédia)"
      aria-label="Télécharger la liste des lycées au format CSV"
      className="ml-1 flex items-center justify-center border border-bleu px-2.5 py-2 text-bleu hover:bg-bleu-tres-clair"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3v12m0 0-5-5m5 5 5-5M4 17v3h16v-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

export function EnTete() {
  return (
    <header className="border-b border-gris-bordure bg-white shadow-[0_1px_3px_rgba(0,0,18,0.08)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Logo />
        <nav className="flex gap-1 text-sm font-semibold">
          <a href="#/" className="px-3 py-2 text-bleu hover:bg-gris-fond">
            Rechercher
          </a>
          <a href="#/citations" className="px-3 py-2 text-bleu hover:bg-gris-fond">
            Citations
          </a>
          <a href="#/a-propos" className="px-3 py-2 text-bleu hover:bg-gris-fond">
            À propos
          </a>
          <LienTelechargement />
        </nav>
      </div>
      <div className="h-1 bg-gradient-to-r from-bleu via-white to-rouge" aria-hidden />
    </header>
  )
}

export function PiedDePage({ dateDonnees }: { dateDonnees?: string }) {
  return (
    <footer className="mt-16 border-t-2 border-bleu bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-gris-doux md:grid-cols-[1fr_2fr]">
        <div className="font-bold text-gris-texte">Mon lycée dit</div>
        <div className="space-y-2">
          <p>
            Site indépendant et <strong>non officiel</strong>, sans lien avec le ministère de l'Éducation nationale ni avec aucune
            administration.
          </p>
          <p>
            Données : <a className="lien" href="https://data.education.gouv.fr/explore/dataset/fr-en-annuaire-education/">Annuaire de l'éducation</a>{' '}
            (Licence Ouverte Etalab){dateDonnees && <>, extraites le {new Date(dateDonnees).toLocaleDateString('fr-FR')}</>}. Biographies :{' '}
            <a className="lien" href="https://fr.wikipedia.org">Wikipédia</a>, citations :{' '}
            <a className="lien" href="https://fr.wikiquote.org">Wikiquote</a> (licence CC BY-SA 4.0).
          </p>
          <p>
            <a className="lien" href={URL_CSV} download="lycees-monlyceedit.csv">
              Télécharger la liste des lycées (CSV)
            </a>{' '}
            : nom, adresse, coordonnées, personnalité et lien Wikipédia.
          </p>
        </div>
      </div>
    </footer>
  )
}

export function Conteneur({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4">{children}</main>
}
