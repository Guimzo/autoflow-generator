# CLAUDE.md — AutoFlow Generator (NIROAD)

Contexte pour Claude Code sur ce repo. Deux volets : le **produit** (l'app) et le **business** (NIROAD, importé en bas de fichier).

---

## Le produit

**AutoFlow Generator** — l'utilisateur décrit une automatisation en français, l'app renvoie 3 blueprints prêts à importer (Make, Zapier, n8n) + un plan d'action par plateforme.

### Stack

- **Next.js 14** (App Router), **React 18**, JavaScript — pas de TypeScript
- Pas de framework CSS : styles inline + objet thème `t` en haut de `app/page.js`, keyframes globales dans `app/layout.js`
- Pas de tests, pas de linter configuré
- Déploiement : Vercel (procédure complète dans `GUIDE-DEPLOIEMENT.md`)

### Arborescence

```
app/
├── layout.js                 ← <html lang="fr">, meta SEO, reset CSS + keyframes
├── page.js                   ← toute l'UI (client component, ~800 lignes)
└── api/generate/route.js     ← Edge function, appelle l'API Anthropic
```

### Commandes

```bash
npm run dev      # dev local sur :3000
npm run build    # build de prod
npm start        # serveur de prod
```

### Fonctionnement

**`app/api/generate/route.js`** (`runtime = 'edge'`)
- POST `{ prompt }` → validation (≥ 10 caractères) → appel `https://api.anthropic.com/v1/messages` en `fetch` direct (pas de SDK)
- Modèle : `claude-haiku-4-5-20251001`, `max_tokens: 4000`
- Le system prompt impose une réponse **JSON strict** avec `make_blueprint`, `zapier_blueprint`, `n8n_blueprint` et `action_plans`
- `extractJSON()` nettoie les backticks et retombe sur un découpage `{ … }` si le parse direct échoue
- Erreurs renvoyées en français, statut HTTP explicite

**`app/page.js`** (`"use client"`)
- Appelle `/api/generate`, affiche les 3 blueprints (copier / télécharger en `.json`) et les plans d'action
- Rate limit côté client : `DAILY_LIMIT = 5` générations/jour, compteur `af_<YYYY-MM-DD>` en `localStorage`, purge des clés des jours précédents
- Historique des générations dans `localStorage` sous `af_history`

### Environnement

- `ANTHROPIC_API_KEY` — **serveur uniquement**, jamais préfixée `NEXT_PUBLIC_`. En local : `.env.local` (voir `.env.example`). En prod : variable d'environnement Vercel.

### Conventions à respecter

- Toute la copy visible et les messages d'erreur sont **en français**
- Nouvelles couleurs → passer par l'objet thème `t`, ne pas coder de hex en dur dans le JSX
- La clé API ne sort jamais du serveur : toute nouvelle interaction modèle passe par une route sous `app/api/`
- Si on touche au format de sortie du modèle, mettre à jour le `SYSTEM_PROMPT` **et** le rendu correspondant dans `page.js` — les deux sont couplés

---

## Le business

Le produit sert la stratégie commerciale de NIROAD. Avant tout conseil GTM, offre, pricing, script d'appel ou prospection, lire le contexte ci-dessous et s'y tenir — en particulier : **niche figée** (cabinets de recrutement 3-10 personnes), **angle sourcing uniquement**, **décideurs uniquement**. Ne jamais proposer de changer de niche.

@NIROAD-CONTEXT.md
