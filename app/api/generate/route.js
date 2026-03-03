export const runtime = 'edge';

const SYSTEM_PROMPT = `Tu es un expert en automatisation no-code. L'utilisateur te décrit un workflow. Génère 3 JSON importables (Make, Zapier, n8n) + un plan d'action par plateforme.

RÈGLES :
1. Réponds UNIQUEMENT en JSON valide, pas de texte avant/après, pas de backticks
2. Blueprints fonctionnels et importables
3. Vrais noms de modules/nodes

FORMAT JSON :
{
  "workflow_name": "Nom court",
  "description": "1-2 phrases",
  "apps_used": ["App1", "App2"],
  "estimated_time_saved": "X heures/semaine",
  "steps_summary": [{"step": 1, "action": "Description", "app": "App"}],
  "make_blueprint": {
    "name": "Nom",
    "flow": [{"id": 1, "module": "app:action", "version": 1, "parameters": {}, "mapper": {}, "metadata": {"designer": {"x": 0, "y": 0}, "comment": ""}}],
    "metadata": {"version": 1, "scenario": {"roundtrips": 1, "maxErrors": 3, "autoCommit": true, "autoCommitTriggerLast": true, "sequential": false, "confidential": false, "dataloss": false}, "designer": {"orphans": []}, "zone": "eu2.make.com"}
  },
  "zapier_blueprint": {
    "type": "zap", "title": "Nom",
    "steps": [{"id": 1, "type": "trigger", "app": "App", "action_type": "action", "params": {}, "description": ""}]
  },
  "n8n_blueprint": {
    "name": "Nom",
    "nodes": [{"parameters": {}, "name": "Node", "type": "n8n-nodes-base.type", "typeVersion": 1, "position": [250, 300]}],
    "connections": {"Node": {"main": [[{"node": "Next", "type": "main", "index": 0}]]}},
    "settings": {"executionOrder": "v1"}
  },
  "action_plans": {
    "make": {"steps": [{"step": 1, "title": "Titre", "description": "Détail", "tip": "Astuce ou null"}]},
    "zapier": {"steps": [{"step": 1, "title": "Titre", "description": "Détail", "tip": "Astuce ou null"}]},
    "n8n": {"steps": [{"step": 1, "title": "Titre", "description": "Détail", "tip": "Astuce ou null"}]}
  }
}

BLUEPRINTS : Make=vrais modules (google-sheets:addRow, gmail:sendEmail, slack:sendMessage). Zapier=vrais noms d'apps. n8n=vrais nodes (n8n-nodes-base.googleSheets). Positions espacées de 200px.

PLANS D'ACTION (5-8 étapes par plan, en français) :
1. Importer le blueprint (instructions exactes par plateforme)
2. Connecter chaque service (OÙ cliquer, QUOI autoriser)
3. Configurer les paramètres
4. Tester
5. Activer

JSON UNIQUEMENT.`;

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Description trop courte." }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Clé API non configurée." }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: "Génère les 3 blueprints (Make, Zapier, n8n) avec plans d'action pour :\n\n" + prompt.trim(),
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: err?.error?.message || "Erreur API Claude." }), {
        status: response.status, headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: "Réponse IA invalide. Réessayez." }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erreur serveur." }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
