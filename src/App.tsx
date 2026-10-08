import { useState } from 'react'
import { useDonnees } from './data'
import { useRoute } from './router'
import { Avertissement, Conteneur, EnTete, PiedDePage } from './components/Layout'
import { FILTRES_INITIAUX, Recherche, type Filtres } from './pages/Recherche'
import { LyceePage } from './pages/LyceePage'
import { APropos } from './pages/APropos'

export default function App() {
  const route = useRoute()
  const { donnees, erreur } = useDonnees()
  // Les filtres vivent ici pour être conservés lors du retour depuis une fiche
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_INITIAUX)

  let contenu
  if (route.page === 'apropos') contenu = <APropos meta={donnees?.meta} />
  else if (erreur) contenu = <p className="py-16 text-center text-rouge">Impossible de charger les données : {erreur}</p>
  else if (!donnees)
    contenu = (
      <div className="py-24 text-center text-gris-doux" role="status">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-bleu-clair border-t-bleu" />
        Chargement des lycées…
      </div>
    )
  else if (route.page === 'lycee') contenu = <LyceePage id={route.id} donnees={donnees} />
  else contenu = <Recherche donnees={donnees} filtres={filtres} setFiltres={setFiltres} />

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:p-2">
        Aller au contenu
      </a>
      <Avertissement />
      <EnTete />
      <div id="contenu" className="flex-1">
        <Conteneur>{contenu}</Conteneur>
      </div>
      <PiedDePage dateDonnees={donnees?.meta.date} />
    </div>
  )
}
