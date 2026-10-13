# Mon lycée dit

Application web statique (React + Tailwind, sans backend) pour rechercher parmi tous les lycées de France et découvrir la
biographie et les citations des personnalités dont ils portent le nom.

> **Site non officiel** — sans lien avec le ministère de l'Éducation nationale.

## Démarrage

```bash
npm install
npm run dev        # serveur de développement
npm run build      # site statique dans dist/ (servable depuis n'importe quel dossier)
```

## Déploiement

Le site est hébergé sur Netlify (projet `monlyceedit`, compte `vanakenm`) : <https://monlyceedit.fr>, alias
<https://monlyceedit.netlify.app>. Netlify est connecté au dépôt GitHub : chaque push sur `main` déclenche un build
(`npm run build`) et une mise en production. La configuration du build et les en-têtes de cache sont dans
`netlify.toml`.

En cas de besoin, on peut encore mettre en production un build local sans passer par GitHub :

```bash
npm run build
npx netlify-cli deploy --prod --dir dist --no-build --site 554ee0d0-a08a-4219-8fcf-ce0f6f5b2ee8
```

## Données

Les données sont déjà présentes dans `public/data/`. Pour les régénérer :

```bash
npm run data            # = data:lycees puis data:personnes
npm run data:lycees     # Annuaire de l'éducation → public/data/lycees.json (~1 s)
npm run data:personnes  # Wikipédia / Wikidata / Wikiquote → public/data/personnes*.json (~15 min la 1re fois)
npm run data:citations  # ajoute les citations manuelles (lancé automatiquement par data:personnes)
```

Les citations saisies à la main sont dans `scripts/citations-manuelles.json` (clé : identifiant Wikidata). Elles
s'affichent avant celles de Wikiquote. Ne modifiez pas directement `public/data/personnes/` : ce dossier est recréé à
chaque génération.

| Fichier                            | Contenu                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `public/data/lycees.json`          | Tous les lycées ouverts : nom, adresse, GPS, département, voies, contact   |
| `public/data/personnes.json`       | Index : patronyme → identifiant Wikidata, et résumé de chaque personnalité |
| `public/data/personnes/<qid>.json` | Biographie et citations, chargées à la demande sur la fiche du lycée       |
| `public/data/meta.json`            | Source et date d'extraction                                                |

### Comment les personnalités sont trouvées

1. `scripts/patronyme.mjs` retire les mentions administratives du nom (« Section d'enseignement professionnel du Lycée
   polyvalent privé … ») pour obtenir un patronyme candidat.
2. Le candidat est cherché sur fr.wikipedia (titre exact avec redirections, puis recherche plein texte avec contrôle de
   correspondance des mots du nom).
3. Wikidata (SPARQL) confirme qu'il s'agit d'un être humain (`P31 = Q5`) et fournit dates, description et lien Wikiquote.
   Pour un nom d'un seul mot (« Descartes »), seules les personnalités très connues (≥ 40 wikis) sont acceptées.
4. La biographie est l'introduction de l'article Wikipédia ; les citations sont les modèles `{{citation}}` de fr.wikiquote,
   hors sections « sur … », « attribuées », « apocryphes ».

Les réponses des API sont mises en cache dans `scripts/.cache/` : relancer le script est rapide. Supprimez ce dossier pour
tout retélécharger.

## Licences des contenus

- Annuaire de l'éducation : Licence Ouverte / Etalab 2.0
- Wikipédia, Wikiquote : CC BY-SA 4.0 (attribution sur chaque fiche)
- Fonds de carte : © contributeurs OpenStreetMap
