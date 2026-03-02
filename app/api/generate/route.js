const SYSTEM_PROMPT = `Tu es un expert en automatisation no-code. L'utilisateur te décrit un workflow qu'il veut automatiser. Tu dois générer 3 fichiers JSON importables dans Make, Zapier et n8n, PLUS un plan d'action détaillé pour chaque plateforme.

RÈGLES CRITIQUES :
1. Réponds UNIQUEMENT en JSON valide, pas de texte avant ou après, pas de backticks markdown
2. Chaque blueprint doit être fonctionnel et importable
3. Utilise les vrais noms de modules/nodes de chaque plateforme
4. Le plan d'action doit guider l'utilisateur étape par étape pour terminer la configuration

FORMAT DE RÉPONSE (JSON strict) :
{
  "workflow_name": "Nom court du workflow",
  "description": "Description en 1-2 phrases",
  "apps_used": ["App1", "App2", "App3"],
  "estimated_time_saved": "X heures/semaine",
  "steps_summary": [
    {"step": 1, "action": "Description courte", "app": "NomApp"}
  ],
  "make_blueprint": {
    "name": "Nom du scénario",
    "flow": [
      {
        "id": 1,
        "module": "module:trigger_ou_action",
        "version": 1,
        "parameters": {},
        "mapper": {},
        "metadata": {"designer": {"x": 0, "y": 0}, "comment": "Description"}
      }
    ],
    "metadata": {
      "version": 1,
      "scenario": {"roundtrips": 1, "maxErrors": 3, "autoCommit": true, "autoCommitTriggerLast": true, "sequential": false, "confidential": false, "dataloss": false},
      "designer": {"orphans": []},
      "zone": "eu2.make.com"
    }
  },
  "zapier_blueprint": {
    "type": "zap",
    "title": "Nom du Zap",
    "steps": [
      {"id": 1, "type": "trigger", "app": "NomApp", "action_type": "nom_du_trigger", "params": {}, "description": "Description"}
    ]
  },
  "n8n_blueprint": {
    "name": "Nom du workflow",
    "nodes": [
      {"parameters": {}, "name": "Nom du Node", "type": "n8n-nodes-base.typeNode", "typeVersion": 1, "position": [250, 300]}
    ],
    "connections": {
      "Nom du Node": {"main": [[{"node": "Nom du Node Suivant", "type": "main", "index": 0}]]}
    },
    "settings": {"executionOrder": "v1"}
  },
  "action_plans": {
    "make": {
      "steps": [{"step": 1, "title": "Titre court", "description": "Explication détaillée", "tip": "Astuce ou null"}]
    },
    "zapier": {
      "steps": [{"step": 1, "title": "Titre court", "description": "Explication détaillée", "tip": "Astuce ou null"}]
    },
    "n8n": {
      "steps": [{"step": 1, "title": "Titre court", "description": "Explication détaillée", "tip": "Astuce ou null"}]
    }
  }
}

INSTRUCTIONS BLUEPRINTS :
- Make : vrais modules (google-sheets:addRow, gmail:sendEmail, slack:sendMessage, typeform:watchResponses)
- Zapier : vrais noms d'apps et actions
- n8n : vrais types de nodes (n8n-nodes-base.googleSheets, n8n-nodes-base.gmail)
- Positions n8n espacées de 200px, paramètres réalistes avec placeholders

INSTRUCTIONS PLANS D'ACTION :
- Spécifique à chaque plateforme
- Étape 1 = importer le blueprint avec instructions exactes
- Étapes suivantes = connecter chaque service (OÙ cliquer, QUOI autoriser)
- Configuration des paramètres personnalisés
- Étape de test + activation
- Tips concrets, 5-10 étapes, tout en français

RÉPONDS UNIQUEMENT EN JSON.`;

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return Response.json({ error: "Description trop courte. Décrivez votre automatisation en détail." }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Clé API non configurée." }, { status: 500 });
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: "Génère les 3 blueprints (Make, Zapier, n8n) avec plans d'action pour :\n\n" + prompt.trim() }],
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return Response.json({ error: err?.error?.message || "Erreur API Claude." }, { status: response.status });
    }
    const data = await response.json();
    const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { return Response.json({ error: "Réponse IA invalide. Réessayez avec plus de détails." }, { status: 500 }); }
    return Response.json(parsed);
  } catch (err) {
    console.error("Server error:", err);
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
