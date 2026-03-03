export const runtime = 'edge';

const SYSTEM_PROMPT = `Expert automatisation no-code. Génère 3 blueprints JSON (Make, Zapier, n8n) + plans d'action.
Réponds UNIQUEMENT en JSON valide. Pas de texte, pas de backticks.

{
  "workflow_name": "Nom",
  "description": "1 phrase",
  "apps_used": ["App1"],
  "estimated_time_saved": "X heures/semaine",
  "steps_summary": [{"step": 1, "action": "Desc", "app": "App"}],
  "make_blueprint": {"name": "Nom", "flow": [{"id": 1, "module": "app:action", "version": 1, "parameters": {}, "mapper": {}, "metadata": {"designer": {"x": 0, "y": 0}}}], "metadata": {"version": 1}},
  "zapier_blueprint": {"type": "zap", "title": "Nom", "steps": [{"id": 1, "type": "trigger", "app": "App", "action_type": "action", "params": {}}]},
  "n8n_blueprint": {"name": "Nom", "nodes": [{"parameters": {}, "name": "Node", "type": "n8n-nodes-base.type", "typeVersion": 1, "position": [250, 300]}], "connections": {}},
  "action_plans": {
    "make": {"steps": [{"step": 1, "title": "T", "description": "D", "tip": null}]},
    "zapier": {"steps": [{"step": 1, "title": "T", "description": "D", "tip": null}]},
    "n8n": {"steps": [{"step": 1, "title": "T", "description": "D", "tip": null}]}
  }
}

Vrais modules Make (google-sheets:addRow, gmail:sendEmail). Vrais nodes n8n (n8n-nodes-base.googleSheets). Plans en français, 4-6 étapes. JSON UNIQUEMENT.`;

function extractJSON(text) {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  
  // Try parsing directly
  try { return JSON.parse(cleaned); } catch {}
  
  // Find the first { and last } to extract JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(jsonStr); } catch {}
  }
  
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.prompt || typeof body.prompt !== "string" || body.prompt.trim().length < 10) {
      return Response.json({ error: "Description trop courte." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Clé API manquante." }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: body.prompt.trim() }],
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let msg = "Erreur API (code " + response.status + ")";
      try { msg = JSON.parse(responseText)?.error?.message || msg; } catch {}
      return Response.json({ error: msg }, { status: response.status });
    }

    let data;
    try { data = JSON.parse(responseText); } catch {
      return Response.json({ error: "Réponse API invalide." }, { status: 502 });
    }

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!text) return Response.json({ error: "Réponse vide." }, { status: 500 });

    const parsed = extractJSON(text);
    if (!parsed) {
      return Response.json({ error: "JSON malformé. Réessayez." }, { status: 500 });
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: "Erreur: " + (err.message || "inconnue") }, { status: 500 });
  }
}
