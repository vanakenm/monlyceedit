import { useEffect, useMemo } from 'react'
import type { Donnees } from '../data'
import { dates, personneDe, usePersonneDetail, VOIES } from '../data'
import { Carte } from '../components/Carte'
import { LyceeCarte, Pastille } from '../components/LyceeCarte'
import type { Lycee, PersonneResume } from '../types'

function Fil({ nom }: { nom: string }) {
  return (
    <nav aria-label="Fil d'Ariane" className="py-4 text-sm text-gris-doux">
      <a href="#/" className="lien">
        Rechercher un lycée
      </a>
      <span className="mx-2">›</span>
      <span>{nom}</span>
    </nav>
  )
}

function Infos({ l }: { l: Lycee }) {
  const ligne = 'flex flex-col gap-0.5 border-b border-gris-bordure py-3 last:border-0'
  return (
    <dl className="text-sm">
      <div className={ligne}>
        <dt className="font-semibold">Adresse</dt>
        <dd>
          {l.adresse}
          <br />
          {l.cp} {l.commune}
        </dd>
      </div>
      <div className={ligne}>
        <dt className="font-semibold">Département</dt>
        <dd>
          {l.depNom} ({l.dep}) · {l.region}
        </dd>
      </div>
      {l.tel && (
        <div className={ligne}>
          <dt className="font-semibold">Téléphone</dt>
          <dd>
            <a className="lien" href={`tel:${l.tel.replace(/\s/g, '')}`}>
              {l.tel}
            </a>
          </dd>
        </div>
      )}
      {l.web && (
        <div className={ligne}>
          <dt className="font-semibold">Site web</dt>
          <dd className="break-all">
            <a className="lien" href={/^https?:/.test(l.web) ? l.web : `http://${l.web}`} target="_blank" rel="noreferrer">
              {l.web.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </dd>
        </div>
      )}
      {l.lat != null && (
        <div className={ligne}>
          <dt className="font-semibold">Coordonnées</dt>
          <dd>
            {l.lat.toFixed(5)}, {l.lon?.toFixed(5)} ·{' '}
            <a
              className="lien"
              href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lon}#map=17/${l.lat}/${l.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              Itinéraire
            </a>
          </dd>
        </div>
      )}
      <div className={ligne}>
        <dt className="font-semibold">Code UAI</dt>
        <dd className="font-mono">{l.id}</dd>
      </div>
    </dl>
  )
}

function Personnalite({ qid, personne }: { qid: string; personne: PersonneResume }) {
  const detail = usePersonneDetail(qid)
  const periode = dates(personne)

  return (
    <section aria-labelledby="personnalite" className="mt-10">
      <p className="mb-2 text-sm font-bold tracking-wide text-rouge uppercase">Le nom de ce lycée</p>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div>
          {personne.image ? (
            <img src={personne.image} alt={`Portrait de ${personne.nom}`} className="w-full max-w-[220px] border border-gris-bordure object-cover" />
          ) : (
            <div className="flex aspect-[4/5] w-full max-w-[220px] items-center justify-center bg-bleu-clair font-serif text-6xl text-bleu">
              {personne.nom.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h2 id="personnalite" className="text-3xl font-extrabold">
            {personne.nom}
          </h2>
          {(personne.description || periode) && (
            <p className="mt-1 text-lg text-gris-doux">
              {personne.description}
              {personne.description && periode && ' · '}
              {periode}
            </p>
          )}
        </div>
      </div>

      {detail && detail.citations.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">
            {personne.nom.split(' ').length > 1 ? `Citations de ${personne.nom}` : `Citations`}
          </h2>
          <ul className="grid gap-5 md:grid-cols-2">
            {detail.citations.map((c, i) => (
              <li key={i} className="relative bg-bleu-tres-clair p-6 pt-10">
                <span aria-hidden className="absolute top-1 left-4 font-serif text-6xl leading-none text-bleu/30">
                  «
                </span>
                <blockquote className="font-serif text-lg leading-relaxed whitespace-pre-line text-gris-texte">{c.texte}</blockquote>
                {c.source && <p className="mt-3 text-sm text-gris-doux">— {c.source}</p>}
              </li>
            ))}
          </ul>
          {detail.wikiquote && detail.citations.some((c) => c.origine === 'wikiquote') && (
            <p className="mt-4 text-sm text-gris-doux">
              {detail.citations.every((c) => c.origine === 'wikiquote') ? 'Citations issues de' : 'Citations en partie issues de'}{' '}
              <a className="lien" href={detail.wikiquote} target="_blank" rel="noreferrer">
                Wikiquote
              </a>{' '}
              (CC BY-SA 4.0).
            </p>
          )}
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Biographie</h2>
        <div className="max-w-3xl space-y-3 leading-relaxed">
          {detail ? detail.bio.map((p, i) => <p key={i}>{p}</p>) : <p className="text-gris-doux">Chargement de la biographie…</p>}
        </div>
        {detail && (
          <p className="mt-3 text-sm text-gris-doux">
            Source :{' '}
            <a className="lien" href={detail.wikipedia} target="_blank" rel="noreferrer">
              article « {detail.titre} » sur Wikipédia
            </a>{' '}
            (CC BY-SA 4.0)
          </p>
        )}
      </div>
    </section>
  )
}

export function LyceePage({ id, donnees }: { id: string; donnees: Donnees }) {
  const { lycees, index } = donnees
  const l = lycees.find((x) => x.id === id)
  const p = l ? personneDe(l, index) : null

  // Autres lycées portant le même nom
  const homonymes = useMemo(
    () => (p ? lycees.filter((x) => x.id !== id && personneDe(x, index)?.qid === p.qid) : []),
    [lycees, index, id, p],
  )

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = l ? `${l.nom} – Mon lycée dit` : 'Mon lycée dit'
    return () => {
      document.title = 'Mon lycée dit'
    }
  }, [l])

  if (!l)
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Lycée introuvable</h1>
        <p className="mt-2">
          <a className="lien" href="#/">
            Retour à la recherche
          </a>
        </p>
      </div>
    )

  return (
    <article>
      <Fil nom={l.nom} />
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Pastille ton={l.statut === 'Privé' ? 'prive' : 'bleu'}>{l.statut}</Pastille>
          {l.voies.split('').map((v) => (
            <Pastille key={v}>Voie {VOIES[v].toLowerCase()}</Pastille>
          ))}
        </div>
        <h1 className="text-3xl leading-tight font-extrabold md:text-[2.5rem]">{l.nom}</h1>
        <p className="mt-2 text-lg text-gris-doux">
          {l.commune} · {l.depNom}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="border border-gris-bordure bg-white px-5 py-2">
          <Infos l={l} />
        </div>
        {l.lat != null && l.lon != null && <Carte lycees={[l]} centre={[l.lat, l.lon]} surbrillance={l.id} hauteur="h-[360px]" />}
      </div>

      {p ? (
        <Personnalite qid={p.qid} personne={p.personne} />
      ) : (
        l.patronyme && (
          <p className="mt-10 bg-gris-fond p-5 text-sm text-gris-doux">
            Nous n'avons pas trouvé de personnalité correspondant à « {l.patronyme} » sur Wikipédia.
          </p>
        )
      )}

      {homonymes.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-2xl font-bold">
            {homonymes.length} autre{homonymes.length > 1 ? 's' : ''} lycée{homonymes.length > 1 ? 's' : ''} porte
            {homonymes.length > 1 ? 'nt' : ''} ce nom
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {homonymes.slice(0, 9).map((h) => (
              <li key={h.id}>
                <LyceeCarte lycee={h} personne={null} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
