import type { Meta } from '../types'

export function APropos({ meta }: { meta?: Meta }) {
  return (
    <article className="max-w-3xl py-10 leading-relaxed">
      <h1 className="mb-6 text-3xl font-extrabold">À propos</h1>

      <div className="mb-8 border-l-4 border-rouge bg-gris-fond p-5">
        <p className="font-bold">Ce site n'est pas un site officiel.</p>
        <p className="mt-1">
          « Mon lycée dit » est un projet indépendant. Il n'est ni affilié, ni soutenu, ni approuvé par le ministère de l'Éducation
          nationale, les académies ou toute autre administration française. Pour toute démarche officielle, consultez{' '}
          <a className="lien" href="https://www.education.gouv.fr/" target="_blank" rel="noreferrer">
            education.gouv.fr
          </a>
          .
        </p>
      </div>

      <h2 className="mt-8 mb-2 text-xl font-bold">D'où viennent les données ?</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          La liste des lycées (nom, adresse, coordonnées GPS, département…) provient de l'
          <a className="lien" href={meta?.source ?? 'https://data.education.gouv.fr/'} target="_blank" rel="noreferrer">
            Annuaire de l'éducation
          </a>
          , publié sur data.education.gouv.fr sous Licence Ouverte (Etalab)
          {meta && <> — extraction du {new Date(meta.date).toLocaleDateString('fr-FR')}</>}.
        </li>
        <li>
          Les biographies et portraits proviennent de{' '}
          <a className="lien" href="https://fr.wikipedia.org" target="_blank" rel="noreferrer">
            Wikipédia
          </a>
          , les citations de{' '}
          <a className="lien" href="https://fr.wikiquote.org" target="_blank" rel="noreferrer">
            Wikiquote
          </a>
          , sous licence CC BY-SA 4.0. Chaque fiche renvoie vers l'article d'origine.
        </li>
        <li>Les fonds de carte sont fournis par les contributeurs d'OpenStreetMap.</li>
      </ul>

      <h2 className="mt-8 mb-2 text-xl font-bold">Comment les personnalités sont-elles identifiées ?</h2>
      <p>
        Le nom de chaque établissement est débarrassé de ses mentions administratives (« Lycée polyvalent », « Section
        d'enseignement professionnel »…). Le nom restant est recherché sur Wikipédia, puis vérifié via Wikidata : seules les
        entrées correspondant à un être humain sont retenues. Cette correspondance est automatique et peut comporter des erreurs ou
        des homonymies.
      </p>

      <h2 className="mt-8 mb-2 text-xl font-bold">Fonctionnement</h2>
      <p>
        Le site est entièrement statique : les données sont téléchargées une fois, puis servies sous forme de fichiers JSON. Aucune
        donnée personnelle n'est collectée ; la fonction « Autour de moi » utilise votre position uniquement dans votre navigateur.
      </p>
    </article>
  )
}
