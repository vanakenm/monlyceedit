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

export function EnTete() {
  return (
    <header className="border-b border-gris-bordure bg-white shadow-[0_1px_3px_rgba(0,0,18,0.08)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Logo />
        <nav className="flex gap-1 text-sm font-semibold">
          <a href="#/" className="px-3 py-2 text-bleu hover:bg-gris-fond">
            Rechercher
          </a>
          <a href="#/a-propos" className="px-3 py-2 text-bleu hover:bg-gris-fond">
            À propos
          </a>
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
        </div>
      </div>
    </footer>
  )
}

export function Conteneur({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4">{children}</main>
}
