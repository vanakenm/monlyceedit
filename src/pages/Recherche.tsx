import { useMemo, useState } from 'react'
import type { Donnees } from '../data'
import { distanceKm, normaliser, personneDe } from '../data'
import { LyceeCarte } from '../components/LyceeCarte'
import { Carte } from '../components/Carte'

export interface Filtres {
  q: string
  dep: string
  statut: '' | 'Public' | 'Privé'
  voie: '' | 'G' | 'T' | 'P'
  personnalite: '' | 'oui' | 'citations'
  vue: 'liste' | 'carte'
  position: { lat: number; lon: number } | null
}

export const FILTRES_INITIAUX: Filtres = { q: '', dep: '', statut: '', voie: '', personnalite: '', vue: 'liste', position: null }

const PAR_PAGE = 24

interface Props {
  donnees: Donnees
  filtres: Filtres
  setFiltres: (f: Filtres) => void
}

export function Recherche({ donnees, filtres, setFiltres }: Props) {
  const { lycees, index } = donnees
  const [limite, setLimite] = useState(PAR_PAGE)
  const [geoEtat, setGeoEtat] = useState<'' | 'attente' | 'erreur'>('')
  const maj = (p: Partial<Filtres>) => {
    setFiltres({ ...filtres, ...p })
    setLimite(PAR_PAGE)
  }

  // Texte indexé par lycée (nom, commune, CP, département, personnalité)
  const indexTexte = useMemo(
    () =>
      lycees.map((l) => {
        const p = personneDe(l, index)
        return normaliser([l.nom, l.commune, l.cp, l.dep, l.depNom, l.region, p?.personne.nom ?? ''].join(' '))
      }),
    [lycees, index],
  )

  const departements = useMemo(() => {
    const m = new Map<string, string>()
    lycees.forEach((l) => m.set(l.dep, l.depNom))
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr', { numeric: true }))
  }, [lycees])

  const classement = useMemo(() => {
    const compte = new Map<string, number>()
    lycees.forEach((l) => {
      const p = personneDe(l, index)
      if (p) compte.set(p.qid, (compte.get(p.qid) ?? 0) + 1)
    })
    return [...compte.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([qid, n]) => ({ qid, n, personne: index.personnes[qid] }))
  }, [lycees, index])

  const resultats = useMemo(() => {
    const termes = normaliser(filtres.q).split(' ').filter(Boolean)
    let r = lycees
      .map((l, i) => ({ l, i, p: personneDe(l, index) }))
      .filter(({ l, i, p }) => {
        if (filtres.dep && l.dep !== filtres.dep) return false
        if (filtres.statut && l.statut !== filtres.statut) return false
        if (filtres.voie && !l.voies.includes(filtres.voie)) return false
        if (filtres.personnalite === 'oui' && !p) return false
        if (filtres.personnalite === 'citations' && !(p && p.personne.nbCitations > 0)) return false
        return termes.every((t) => indexTexte[i].includes(t))
      })
      .map(({ l, p }) => ({
        l,
        p,
        d: filtres.position && l.lat != null && l.lon != null ? distanceKm(filtres.position, { lat: l.lat, lon: l.lon }) : undefined,
      }))
    if (filtres.position) r = r.sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity))
    return r
  }, [lycees, index, indexTexte, filtres])

  const autourDeMoi = () => {
    if (filtres.position) return maj({ position: null })
    if (!navigator.geolocation) return setGeoEtat('erreur')
    setGeoEtat('attente')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoEtat('')
        maj({ position: { lat: pos.coords.latitude, lon: pos.coords.longitude } })
      },
      () => setGeoEtat('erreur'),
      { timeout: 10000 },
    )
  }

  const filtresActifs = filtres.q || filtres.dep || filtres.statut || filtres.voie || filtres.personnalite || filtres.position
  const select = 'w-full border-0 border-b-2 border-gris-texte bg-gris-fond px-3 py-2.5 text-sm focus:border-bleu focus:outline-none'

  return (
    <>
      {/* Bandeau de recherche */}
      <section className="-mx-4 mb-8 bg-bleu-tres-clair px-4 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-3xl text-3xl leading-tight font-extrabold text-gris-texte md:text-[2.5rem]">
            Trouver un lycée,{' '}
            <span className="text-bleu">découvrir celles et ceux dont il porte le nom</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gris-doux">
            {donnees.meta.total.toLocaleString('fr-FR')} lycées en France métropolitaine et outre-mer. Recherchez par nom, ville, code
            postal, département ou personnalité.
          </p>

          <form className="mt-6 flex max-w-3xl" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="q" className="sr-only">
              Rechercher un lycée
            </label>
            <input
              id="q"
              type="search"
              autoFocus
              value={filtres.q}
              onChange={(e) => maj({ q: e.target.value })}
              placeholder="Ex. : Victor Hugo, Lyon, 33000, Marie Curie…"
              className="min-w-0 flex-1 border-0 border-b-2 border-bleu bg-white px-4 py-3 text-base shadow-sm focus:outline-none"
            />
            <button type="submit" className="bg-bleu px-6 font-semibold text-white hover:bg-bleu-hover">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Filtres */}
      <section aria-label="Filtres" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Département</span>
          <select className={select} value={filtres.dep} onChange={(e) => maj({ dep: e.target.value })}>
            <option value="">Tous les départements</option>
            {departements.map(([code, nom]) => (
              <option key={code} value={code}>
                {code} – {nom}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Secteur</span>
          <select className={select} value={filtres.statut} onChange={(e) => maj({ statut: e.target.value as Filtres['statut'] })}>
            <option value="">Public et privé</option>
            <option value="Public">Public</option>
            <option value="Privé">Privé</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Voie</span>
          <select className={select} value={filtres.voie} onChange={(e) => maj({ voie: e.target.value as Filtres['voie'] })}>
            <option value="">Toutes les voies</option>
            <option value="G">Générale</option>
            <option value="T">Technologique</option>
            <option value="P">Professionnelle</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Nom du lycée</span>
          <select
            className={select}
            value={filtres.personnalite}
            onChange={(e) => maj({ personnalite: e.target.value as Filtres['personnalite'] })}
          >
            <option value="">Tous</option>
            <option value="oui">Portant le nom d'une personnalité</option>
            <option value="citations">… avec des citations</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={autourDeMoi}
            aria-pressed={!!filtres.position}
            className={`w-full border px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${
              filtres.position ? 'border-bleu bg-bleu text-white' : 'border-bleu bg-white text-bleu hover:bg-bleu-tres-clair'
            }`}
          >
            {geoEtat === 'attente' ? 'Localisation…' : filtres.position ? '✓ Autour de moi' : '◎ Autour de moi'}
          </button>
        </div>
      </section>
      {geoEtat === 'erreur' && (
        <p className="-mt-3 mb-4 text-sm text-rouge">Impossible d'obtenir votre position. Vérifiez les autorisations du navigateur.</p>
      )}

      {/* Barre de résultats */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gris-bordure pb-3">
        <p className="font-semibold" aria-live="polite">
          {resultats.length.toLocaleString('fr-FR')} lycée{resultats.length > 1 ? 's' : ''}
          {filtres.position && <span className="font-normal text-gris-doux"> · triés par distance</span>}
          {filtresActifs && (
            <button type="button" className="lien ml-3 text-sm font-normal" onClick={() => setFiltres(FILTRES_INITIAUX)}>
              Réinitialiser
            </button>
          )}
        </p>
        <div className="flex border border-bleu text-sm font-semibold" role="group" aria-label="Affichage">
          {(['liste', 'carte'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={filtres.vue === v}
              onClick={() => maj({ vue: v })}
              className={`px-4 py-1.5 ${filtres.vue === v ? 'bg-bleu text-white' : 'text-bleu hover:bg-bleu-tres-clair'}`}
            >
              {v === 'liste' ? 'Liste' : 'Carte'}
            </button>
          ))}
        </div>
      </div>

      {!filtresActifs && filtres.vue === 'liste' && (
        <section className="mb-10">
          <h2 className="mb-1 text-2xl font-bold">Les personnalités les plus honorées</h2>
          <p className="mb-4 text-gris-doux">Les noms que l'on retrouve le plus souvent au fronton des lycées.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {classement.map(({ qid, n, personne }) => (
              <li key={qid}>
                <button
                  type="button"
                  onClick={() => maj({ q: personne.nom })}
                  className="group flex h-full w-full flex-col border border-gris-bordure bg-white text-left hover:shadow-[0_6px_18px_rgba(0,0,18,0.16)]"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-gris-fond">
                    {personne.image && (
                      <img src={personne.image} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="leading-tight font-bold text-bleu group-hover:underline">{personne.nom}</div>
                    <div className="mt-1 text-sm text-gris-doux">{n} lycées</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {filtres.vue === 'carte' ? (
        <Carte lycees={resultats.map((r) => r.l)} />
      ) : resultats.length === 0 ? (
        <div className="bg-gris-fond p-8 text-center">
          <p className="font-semibold">Aucun lycée ne correspond à votre recherche.</p>
          <p className="mt-1 text-sm text-gris-doux">Essayez un autre nom, ou retirez un filtre.</p>
        </div>
      ) : (
        <>
          {!filtresActifs && <h2 className="mb-4 text-2xl font-bold">Tous les lycées</h2>}
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resultats.slice(0, limite).map(({ l, p, d }) => (
              <li key={l.id}>
                <LyceeCarte lycee={l} personne={p?.personne ?? null} distance={d} />
              </li>
            ))}
          </ul>
          {limite < resultats.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setLimite(limite + PAR_PAGE * 2)}
                className="border border-bleu px-6 py-2.5 font-semibold text-bleu hover:bg-bleu-tres-clair"
              >
                Afficher plus de lycées ({(resultats.length - limite).toLocaleString('fr-FR')} restants)
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
