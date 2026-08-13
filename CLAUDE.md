# CLAUDE.md — AutoFlow Generator (NIROAD)

Deux volets : le **business** (NIROAD, ci-dessous — à lire en premier) et le **produit** (l'app).

---

# LE BUSINESS — NIROAD

**NIROAD** — agence d'automatisation IA. Site : niroadia.fr.

## Niche — FIGÉE, ne jamais proposer d'en changer

**Cabinets de recrutement de 3 à 10 personnes**, code NAF 78.10Z, en France.

Niches déjà écartées — ne pas les reproposer :
agences de marketing digital, coachs sportifs, sociétés de nettoyage,
complexes de padel, agences de voyage, courtiers en énergie.

## Offre — en construction

Automatisation du **sourcing / recherche de candidats** : système no-code n8n
de tri et de qualification des candidats.

- Prix cible : **~2 000 €**
- **L'angle administratif est INTERDIT** (facturation, relances) — consigne du coach.
  Ne jamais le proposer, même en bonus ou en accroche secondaire.

## Terrain — 12 appels de découverte passés

- Douleur n°1 confirmée : **la recherche de candidats**
- **Aucun cabinet interrogé n'utilise réellement l'IA**
- Objection récurrente : « LinkedIn fait déjà ça », et rejet réflexe dès qu'on
  prononce le mot IA
- Contacter **uniquement les décideurs**, jamais les standards

## Prospection

- **88 cabinets validés** avec nom du dirigeant
- **13 numéros mobiles** récupérés

**Le blocage actuel est l'enrichissement des numéros et le volume d'appels — pas le manque de méthode.**

## Règle — skills Hormozi

Quand j'invoque une skill `hormozi-*`, l'appliquer à **CE contexte**, jamais en générique.
Skills installées : `hormozi-offers`, `hormozi-sales`, `hormozi-gtm-acquisition`.

Contraintes à respecter dans toute sortie de skill :

1. Cible = cabinets de recrutement 3-10 personnes, France. Jamais de changement de niche.
2. Angle sourcing uniquement. Aucun angle administratif.
3. Décideurs uniquement, jamais les standards.
4. Traiter explicitement les deux objections terrain : « LinkedIn fait déjà ça » et le rejet
   réflexe du mot IA (envisager de vendre le résultat sans prononcer « IA »).
5. Le goulot est opérationnel, pas théorique : privilégier ce qui débloque des appels réels
   (enrichissement, volume) plutôt qu'une couche de méthode supplémentaire.
6. Citer la skill utilisée et créditer Alex Hormozi.

Ordre de travail recommandé : `hormozi-offers` (finaliser l'offre et son prix) →
`hormozi-sales` (script d'appel + réponses aux 2 objections) → appeler →
`hormozi-gtm-acquisition` une fois les 88 cabinets épuisés.

## Annexe détaillée

Données non résumées ci-dessus : tableau des 4 conversations exploitables (MAHE, Alphéa
Conseil, Altaide, Adeis RH), contraintes outils (Apollo, Pappers, Lusha), source de la liste
de 88 cabinets.

@NIROAD-CONTEXT.md

---

# LE PRODUIT — AutoFlow Generator

L'utilisateur décrit une automatisation en français, l'app renvoie 3 blueprints prêts à
importer (Make, Zapier, n8n) + un plan d'action par plateforme.

## Stack

- **Next.js 14** (App Router), **React 18**, JavaScript — pas de TypeScript
- Pas de framework CSS : styles inline + objet thème `t` en haut de `app/page.js`,
  keyframes globales dans `app/layout.js`
- Pas de tests, pas de linter configuré
- Déploiement : Vercel (procédure complète dans `GUIDE-DEPLOIEMENT.md`)

## Arborescence

```
app/
├── layout.js                 ← <html lang="fr">, meta SEO, reset CSS + keyframes
├── page.js                   ← toute l'UI (client component, ~800 lignes)
└── api/generate/route.js     ← Edge function, appelle l'API Anthropic
```

## Commandes

```bash
npm run dev      # dev local sur :3000
npm run build    # build de prod
npm start        # serveur de prod
```

## Fonctionnement

**`app/api/generate/route.js`** (`runtime = 'edge'`)
- POST `{ prompt }` → validation (≥ 10 caractères) → appel `https://api.anthropic.com/v1/messages`
  en `fetch` direct (pas de SDK)
- Modèle : `claude-haiku-4-5-20251001`, `max_tokens: 4000`
- Le system prompt impose une réponse **JSON strict** avec `make_blueprint`,
  `zapier_blueprint`, `n8n_blueprint` et `action_plans`
- `extractJSON()` nettoie les backticks et retombe sur un découpage `{ … }` si le parse
  direct échoue
- Erreurs renvoyées en français, statut HTTP explicite

**`app/page.js`** (`"use client"`)
- Appelle `/api/generate`, affiche les 3 blueprints (copier / télécharger en `.json`) et
  les plans d'action
- Rate limit côté client : `DAILY_LIMIT = 5` générations/jour, compteur `af_<YYYY-MM-DD>`
  en `localStorage`, purge des clés des jours précédents
- Historique des générations dans `localStorage` sous `af_history`

## Environnement

- `ANTHROPIC_API_KEY` — **serveur uniquement**, jamais préfixée `NEXT_PUBLIC_`.
  En local : `.env.local` (voir `.env.example`). En prod : variable d'environnement Vercel.

## Conventions à respecter

- Toute la copy visible et les messages d'erreur sont **en français**
- Nouvelles couleurs → passer par l'objet thème `t`, ne pas coder de hex en dur dans le JSX
- La clé API ne sort jamais du serveur : toute nouvelle interaction modèle passe par une
  route sous `app/api/`
- Si on touche au format de sortie du modèle, mettre à jour le `SYSTEM_PROMPT` **et** le
  rendu correspondant dans `page.js` — les deux sont couplés
