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

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Requête invalide." }, 400);
    }

    const prompt = body?.prompt;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return jsonResponse({ error: "Description trop courte (min 10 caractères)." }, 400);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: "Clé API non configurée. Vérifiez ANTHROPIC_API_KEY dans Vercel." }, 500);
    }

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 5000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: "Génère les 3 blueprints (Make, Zapier, n8n) avec plans d'action pour :\n\n" + prompt.trim(),
          }],
        }),
      });
    } catch (fetchErr) {
      return jsonResponse({ error: "Impossible de contacter Claude: " + fetchErr.message }, 502);
    }

    let responseText;
    try {
      responseText = await response.text();
    } catch {
      return jsonResponse({ error: "Erreur lecture réponse API." }, 502);
    }

    if (!response.ok) {
      try {
        const errData = JSON.parse(responseText);
        return jsonResponse({ error: errData?.error?.message || "Erreur API (code " + response.status + ")" }, response.status);
      } catch {
        return jsonResponse({ error: "Erreur API (code " + response.status + "): " + responseText.slice(0, 200) }, response.status);
      }
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return jsonResponse({ error: "Réponse API invalide." }, 502);
    }

    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    if (!text) {
      return jsonResponse({ error: "Réponse IA vide." }, 500);
    }

    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return jsonResponse({ error: "JSON malformé. Réessayez." }, 500);
    }

    return jsonResponse(parsed);
  } catch (err) {
    return jsonResponse({ error: "Erreur serveur: " + (err.message || "inconnue") }, 500);
  }
}
