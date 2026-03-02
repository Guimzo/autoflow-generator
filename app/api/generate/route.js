// app/api/generate/route.js
// Cette fonction tourne côté serveur sur Vercel — ta clé API reste secrète

const SYSTEM_PROMPT = `Tu es un expert en automatisation no-code. L'utilisateur te décrit un workflow qu'il veut automatiser. Tu dois générer 3 fichiers JSON importables dans Make, Zapier et n8n.

RÈGLES CRITIQUES :
1. Réponds UNIQUEMENT en JSON valide, pas de texte avant ou après, pas de backticks markdown
2. Chaque blueprint doit être fonctionnel et importable
3. Utilise les vrais noms de modules/nodes de chaque plateforme

FORMAT DE RÉPONSE (JSON strict) :
{
  "workflow_name": "Nom court du workflow",
  "description": "Description en 1-2 phrases",
  "apps_used": ["App1", "App2", "App3"],
  "estimated_time_saved": "X heures/semaine",
  "steps_summary": [
    {"step": 1, "action": "Description de l'étape", "app": "NomApp"}
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
        "metadata": {
          "designer": {"x": 0, "y": 0},
          "comment": "Description du module"
        }
      }
    ],
    "metadata": {
      "version": 1,
      "scenario": {
        "roundtrips": 1,
        "maxErrors": 3,
        "autoCommit": true,
        "autoCommitTriggerLast": true,
        "sequential": false,
        "confidential": false,
        "dataloss": false
      },
      "designer": {"orphans": []},
      "zone": "eu2.make.com"
    }
  },
  "zapier_blueprint": {
    "type": "zap",
    "title": "Nom du Zap",
    "steps": [
      {
        "id": 1,
        "type": "trigger",
        "app": "NomApp",
        "action_type": "nom_du_trigger",
        "params": {},
        "description": "Description"
      },
      {
        "id": 2,
        "type": "action",
        "app": "NomApp",
        "action_type": "nom_de_action",
        "params": {},
        "description": "Description"
      }
    ]
  },
  "n8n_blueprint": {
    "name": "Nom du workflow",
    "nodes": [
      {
        "parameters": {},
        "name": "Nom du Node",
        "type": "n8n-nodes-base.typeNode",
        "typeVersion": 1,
        "position": [250, 300]
      }
    ],
    "connections": {
      "Nom du Node": {
        "main": [[{"node": "Nom du Node Suivant", "type": "main", "index": 0}]]
      }
    },
    "settings": {
      "executionOrder": "v1"
    }
  }
}

IMPORTANT :
- Pour Make : utilise les vrais identifiants de modules (ex: "google-sheets:addRow", "gmail:sendEmail", "slack:sendMessage", "http:makeRequest", "json:parseJSON", "builtin:BasicRouter", "typeform:watchResponses", "airtable:createRecord")
- Pour Zapier : utilise les vrais noms d'apps et triggers/actions (ex: app "typeform", action_type "new_entry"; app "gmail", action_type "send_email")
- Pour n8n : utilise les vrais types de nodes (ex: "n8n-nodes-base.googleSheets", "n8n-nodes-base.gmail", "n8n-nodes-base.slack", "n8n-nodes-base.httpRequest", "n8n-nodes-base.webhook", "n8n-nodes-base.set", "n8n-nodes-base.if")
- Place les nodes n8n avec des positions cohérentes (espacés de 200px horizontalement)
- Inclus toujours les connections entre les nodes n8n
- Le workflow doit être logique et réaliste
- Génère des paramètres réalistes avec des placeholders (ex: "{{votre_email}}", "{{votre_channel_slack}}")
- RÉPONDS UNIQUEMENT EN JSON, rien d'autre`;

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return Response.json(
        { error: "Description trop courte. Décrivez votre automatisation en détail." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Clé API non configurée. Ajoutez ANTHROPIC_API_KEY dans les variables d'environnement Vercel." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Génère les 3 blueprints d'automatisation (Make, Zapier, n8n) pour ce besoin :\n\n${prompt.trim()}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Anthropic API error:", errData);
      return Response.json(
        { error: errData?.error?.message || "Erreur lors de l'appel à l'API Claude." },
        { status: response.status }
      );
    }

    const data = await response.json();

    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Parse la réponse JSON de Claude
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw text:", text.slice(0, 500));
      return Response.json(
        { error: "L'IA a généré une réponse invalide. Réessayez avec une description plus précise." },
        { status: 500 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Erreur serveur. Réessayez dans quelques instants." },
      { status: 500 }
    );
  }
}
