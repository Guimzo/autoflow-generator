# 🚀 Guide de déploiement — AutoFlow Generator

## Ce que contient le projet

```
autoflow-generator/
├── app/
│   ├── layout.js          ← Layout HTML + meta SEO
│   ├── page.js            ← L'interface complète (tout le front)
│   └── api/
│       └── generate/
│           └── route.js   ← Serverless Function (protège ta clé API)
├── public/                ← Fichiers statiques (vide pour l'instant)
├── package.json           ← Dépendances du projet
├── next.config.js         ← Config Next.js
├── .env.example           ← Exemple de variables d'environnement
└── .gitignore             ← Fichiers à ne pas envoyer sur GitHub
```

---

## ÉTAPE 1 — Créer un compte GitHub (si pas déjà fait)

1. Va sur **https://github.com**
2. Clique **Sign up**
3. Crée ton compte avec ton email

---

## ÉTAPE 2 — Créer un repo GitHub

1. Une fois connecté sur GitHub, clique le bouton **+** en haut à droite → **New repository**
2. Nom du repo : `autoflow-generator`
3. Description : `Générateur d'automatisations Make/Zapier/n8n par IA`
4. Laisse en **Public** (nécessaire pour le plan gratuit Vercel)
5. **NE COCHE PAS** "Add a README" ni ".gitignore" (on les a déjà)
6. Clique **Create repository**

---

## ÉTAPE 3 — Uploader les fichiers sur GitHub

### Option A — Via l'interface web GitHub (le plus simple) 🟢

1. Sur la page de ton repo vide, clique **"uploading an existing file"**
2. Fais glisser **TOUT le contenu du dossier** `autoflow-generator/` (les fichiers et le dossier `app/`)
3. En bas, écris un message : "Initial commit"
4. Clique **Commit changes**

⚠️ **ATTENTION** : GitHub web ne gère pas bien les sous-dossiers imbriqués. Si ça ne marche pas, utilise l'Option B.

### Option B — Via la ligne de commande (recommandé)

Ouvre un terminal (Terminal sur Mac, CMD sur Windows) et tape :

```bash
# 1. Va dans le dossier du projet
cd chemin/vers/autoflow-generator

# 2. Initialise Git
git init

# 3. Ajoute tous les fichiers
git add .

# 4. Premier commit
git commit -m "Initial commit"

# 5. Connecte à ton repo GitHub (remplace TON-USERNAME)
git remote add origin https://github.com/TON-USERNAME/autoflow-generator.git

# 6. Pousse le code
git branch -M main
git push -u origin main
```

Si git te demande de t'authentifier, connecte-toi avec ton compte GitHub.

---

## ÉTAPE 4 — Obtenir ta clé API Anthropic

1. Va sur **https://console.anthropic.com**
2. Crée un compte ou connecte-toi
3. Va dans **API Keys** (dans le menu de gauche)
4. Clique **Create Key**
5. Donne-lui un nom : `autoflow-generator`
6. **COPIE LA CLÉ** — elle ne sera plus affichée après !
   - Elle ressemble à : `sk-ant-api03-xxxxxxxxxxxx...`
7. Ajoute du crédit : va dans **Plans & Billing** → ajoute 5$ (ça te fait ~150 générations)

---

## ÉTAPE 5 — Déployer sur Vercel

1. Va sur **https://vercel.com**
2. Clique **Sign Up** → **Continue with GitHub** (connecte ton compte GitHub)
3. Une fois connecté, clique **Add New...** → **Project**
4. Tu vas voir ton repo `autoflow-generator` dans la liste → clique **Import**
5. Sur la page de configuration :
   - **Framework Preset** : devrait détecter automatiquement **Next.js**
   - **Root Directory** : laisse vide (`.`)
   - **Environment Variables** : C'EST CRUCIAL ⬇️
     - Clique **Environment Variables**
     - Name : `ANTHROPIC_API_KEY`
     - Value : colle ta clé API (`sk-ant-api03-xxxx...`)
     - Clique **Add**
6. Clique **Deploy**
7. Attends 1-2 minutes... ✅ C'est déployé !

Tu reçois une URL du type : `https://autoflow-generator.vercel.app`

---

## ÉTAPE 6 — Tester

1. Ouvre l'URL que Vercel t'a donnée
2. Tape une description d'automatisation, par ex :
   > "Quand un lead remplit mon formulaire Typeform, l'ajouter dans Google Sheets et envoyer un email de bienvenue"
3. Clique **Générer les scénarios**
4. Tu devrais voir les 3 blueprints apparaître
5. Télécharge un .json et essaie de l'importer dans Make/Zapier/n8n

---

## ÉTAPE 7 — Domaine personnalisé (optionnel, gratuit)

Si tu veux une URL propre comme `autoflow.niroad.com` :

1. Dans Vercel, va dans **Settings** → **Domains**
2. Tape `autoflow.niroad.com`
3. Vercel te donne un enregistrement DNS à ajouter
4. Va dans les DNS de ton domaine niroad.com (chez ton registrar)
5. Ajoute un **CNAME** : `autoflow` → `cname.vercel-dns.com`
6. Attends 5-10 minutes → c'est actif

---

## Dépannage

### "Erreur : Clé API non configurée"
→ Vérifie que tu as bien ajouté `ANTHROPIC_API_KEY` dans Vercel (Settings → Environment Variables). Redéploie après l'ajout.

### "L'IA a généré une réponse invalide"
→ Réessaie avec une description plus détaillée et précise.

### Le site ne se charge pas
→ Vérifie dans Vercel → Deployments que le build est passé sans erreurs.

### Les fichiers JSON ne s'importent pas dans Make/Zapier/n8n
→ C'est normal au début — les blueprints générés par IA peuvent nécessiter des ajustements. C'est un point qu'on peut améliorer en itérant sur le prompt système.

---

## Coûts récapitulatifs

| Service | Coût |
|---------|------|
| GitHub | 0€ |
| Vercel hosting | 0€ |
| API Claude (~0.03€/appel) | ~5€ pour 150 utilisations |
| Domaine custom | 0€ si tu utilises .vercel.app |

---

## Pour la suite

- **Améliorer les blueprints** : Teste chaque plateforme et affine le prompt système
- **Ajouter la capture email** : Webhook Make → Google Sheet → Beehiiv
- **Analytics** : Ajoute Vercel Analytics (gratuit) pour voir le trafic
- **LinkedIn** : Prépare un post "commente pour recevoir le lien"
