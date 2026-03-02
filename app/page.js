"use client";

import { useState, useEffect, useRef } from "react";

// ─── Rate Limiting via localStorage ───
const DAILY_LIMIT = 5;
const getRateLimitKey = () => `autogen_${new Date().toISOString().slice(0, 10)}`;

function getUsageCount() {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem(getRateLimitKey());
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function incrementUsage() {
  if (typeof window === "undefined") return 0;
  try {
    const key = getRateLimitKey();
    const current = getUsageCount();
    localStorage.setItem(key, String(current + 1));
    // Nettoyage des vieux compteurs
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("autogen_") && k !== key) localStorage.removeItem(k);
    });
    return current + 1;
  } catch {
    return 0;
  }
}

// ─── Colors ───
const c = {
  bg: "#09090b",
  card: "#18181b",
  cardHover: "#1f1f23",
  border: "#27272a",
  borderLight: "#3f3f46",
  text: "#fafafa",
  muted: "#a1a1aa",
  dim: "#71717a",
  accent: "#6366f1",
  accentLight: "#818cf8",
  accentGlow: "rgba(99,102,241,0.15)",
  success: "#22c55e",
  successBg: "rgba(34,197,94,0.1)",
  warning: "#f59e0b",
  warningBg: "rgba(245,158,11,0.1)",
  error: "#ef4444",
  make: "#6d28d9",
  makeBg: "rgba(109,40,217,0.1)",
  zapier: "#ff4a00",
  zapierBg: "rgba(255,74,0,0.1)",
  n8n: "#ea4b71",
  n8nBg: "rgba(234,75,113,0.1)",
};

// ─── Loading messages ───
const loadingMsgs = [
  { text: "Analyse de votre besoin...", icon: "🔍" },
  { text: "Identification des applications...", icon: "🔗" },
  { text: "Construction du scénario Make...", icon: "🟣" },
  { text: "Génération du Zap Zapier...", icon: "🟠" },
  { text: "Création du workflow n8n...", icon: "🔴" },
  { text: "Validation des blueprints...", icon: "✅" },
  { text: "Finalisation...", icon: "🚀" },
];

// ─── Examples ───
const examples = [
  "Quand un lead remplit mon formulaire Typeform, l'ajouter dans Google Sheets, envoyer un email de bienvenue via Gmail et notifier mon équipe sur Slack",
  "Publier automatiquement mes articles de blog WordPress sur LinkedIn, Twitter et Facebook avec un résumé généré par IA",
  "Chaque lundi, récupérer les stats Google Analytics de mes clients, générer un rapport dans Google Docs et l'envoyer par email",
  "Quand un client signe un devis sur PandaDoc, créer un projet dans Notion, envoyer une séquence d'onboarding par email et créer une facture",
  "Surveiller les mentions de ma marque sur le web, résumer avec l'IA et envoyer un digest quotidien sur Slack",
];

// ─── Download helper ───
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Platform Card ───
function PlatformCard({ platform, color, bgColor, icon, blueprint, workflowName }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const filename = `${(workflowName || "workflow").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${platform.toLowerCase()}.json`;

  return (
    <div
      style={{
        background: hovered ? c.cardHover : c.card,
        border: `1px solid ${hovered ? color : c.border}`,
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 12, background: bgColor,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: c.text }}>{platform}</div>
          <div style={{ fontSize: 13, color: c.dim }}>Blueprint .json</div>
        </div>
      </div>

      <div
        style={{
          background: c.bg, borderRadius: 10, padding: 14,
          fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12,
          color: c.dim, maxHeight: 120, overflow: "hidden", lineHeight: 1.5, position: "relative",
        }}
      >
        {JSON.stringify(blueprint, null, 2).slice(0, 300)}...
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${c.bg})` }} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => downloadJSON(blueprint, filename)}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 10, border: "none",
            background: color, color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: "pointer", transition: "opacity 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <span>↓</span> Télécharger
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            padding: "12px 16px", borderRadius: 10, border: `1px solid ${c.border}`,
            background: "transparent", color: copied ? c.success : c.muted,
            fontWeight: 500, fontSize: 14, cursor: "pointer", transition: "all 0.2s", minWidth: 100,
          }}
        >
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function Home() {
  const [screen, setScreen] = useState("landing");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    setUsageCount(getUsageCount());
  }, []);

  const remaining = DAILY_LIMIT - usageCount;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  // Loading animation
  useEffect(() => {
    if (screen !== "loading") return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMsgs.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [screen]);

  // ─── Generate ───
  const handleGenerate = async () => {
    if (!prompt.trim() || remaining <= 0) return;

    setScreen("loading");
    setLoadingStep(0);
    setError(null);

    try {
      // Appel à NOTRE route API (pas directement à Claude)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Erreur lors de la génération");
      }

      setResult(data);
      setUsageCount(incrementUsage());
      setScreen("results");
    } catch (err) {
      setError(err.message);
      setScreen("landing");
    }
  };

  const handleReset = () => {
    setScreen("landing");
    setPrompt("");
    setResult(null);
    setError(null);
    setLoadingStep(0);
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text }}>
      {/* ── Header ── */}
      <header
        style={{
          borderBottom: `1px solid ${c.border}`, padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          maxWidth: 900, margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}
          >
            ⚡
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>AutoFlow Generator</span>
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 20,
            background: remaining > 2 ? c.accentGlow : remaining > 0 ? c.warningBg : "rgba(239,68,68,0.1)",
            border: `1px solid ${remaining > 2 ? c.accent : remaining > 0 ? c.warning : c.error}33`,
            fontSize: 13, fontWeight: 500,
            color: remaining > 2 ? c.accentLight : remaining > 0 ? c.warning : c.error,
          }}
        >
          <span>{remaining}/{DAILY_LIMIT}</span>
          <span style={{ color: c.dim, fontWeight: 400 }}>restantes</span>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>

        {/* ═══ LANDING ═══ */}
        {screen === "landing" && (
          <div style={{ paddingTop: 60, paddingBottom: 60 }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, margin: 0, letterSpacing: "-0.02em" }}>
                Décrivez votre idée.
                <br />
                <span style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight}, #c084fc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  On génère l'automatisation.
                </span>
              </h1>
              <p style={{ fontSize: 17, color: c.muted, marginTop: 16, lineHeight: 1.6, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
                Obtenez des scénarios prêts à importer dans Make, Zapier et n8n. Gratuit, instantané.
              </p>
            </div>

            {/* Input */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 24, marginBottom: 32 }}>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={"Décrivez l'automatisation que vous voulez créer...\n\nEx: Quand un lead remplit mon formulaire, l'ajouter dans mon CRM, envoyer un email de bienvenue et notifier mon équipe sur Slack"}
                disabled={remaining <= 0}
                style={{
                  width: "100%", minHeight: 120, background: "transparent", border: "none",
                  outline: "none", color: c.text, fontSize: 16, lineHeight: 1.6,
                  resize: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontSize: 12, color: c.dim }}>
                  {remaining <= 0 ? "Limite atteinte — revenez demain" : "⌘ + Enter pour générer"}
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || remaining <= 0}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "none",
                    background: !prompt.trim() || remaining <= 0 ? c.borderLight : `linear-gradient(135deg, ${c.accent}, ${c.accentLight})`,
                    color: !prompt.trim() || remaining <= 0 ? c.dim : "#fff",
                    fontWeight: 600, fontSize: 15,
                    cursor: !prompt.trim() || remaining <= 0 ? "not-allowed" : "pointer",
                    transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <span>⚡</span> Générer les scénarios
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 16, marginBottom: 32, color: c.error, fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* Rate limit warning */}
            {remaining <= 0 && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 6, color: c.text }}>
                  Vous avez utilisé vos 5 générations du jour
                </div>
                <div style={{ color: c.muted, fontSize: 14 }}>Revenez demain pour 5 nouvelles générations gratuites.</div>
              </div>
            )}

            {/* Examples */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                Exemples pour vous inspirer
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setPrompt(ex); textareaRef.current?.focus(); }}
                    style={{
                      background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
                      padding: "14px 18px", color: c.muted, fontSize: 14, lineHeight: 1.5,
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.accent + "66"; e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.cardHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.muted; e.currentTarget.style.background = c.card; }}
                  >
                    <span style={{ marginRight: 8 }}>→</span>{ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: c.dim, fontSize: 13 }}>
              <span>Propulsé par</span>
              <span style={{ fontWeight: 600, color: c.muted }}>NIROAD IA</span>
            </div>
          </div>
        )}

        {/* ═══ LOADING ═══ */}
        {screen === "loading" && (
          <div style={{ paddingTop: 100, paddingBottom: 100, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: c.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 32, animation: "pulse 2s ease-in-out infinite" }}>
              ⚡
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Génération en cours...</h2>
            <p style={{ color: c.muted, fontSize: 15, marginBottom: 40, textAlign: "center" }}>
              L'IA construit vos 3 scénarios d'automatisation
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 400 }}>
              {loadingMsgs.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 10,
                    background: i <= loadingStep ? c.card : "transparent",
                    border: `1px solid ${i <= loadingStep ? c.border : "transparent"}`,
                    opacity: i <= loadingStep ? 1 : 0.3,
                    transition: "all 0.4s ease",
                    animation: i === loadingStep ? "fadeIn 0.4s ease" : "none",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{msg.icon}</span>
                  <span style={{ fontSize: 14, color: i < loadingStep ? c.success : i === loadingStep ? c.text : c.dim, fontWeight: i === loadingStep ? 600 : 400 }}>
                    {msg.text}
                  </span>
                  {i < loadingStep && <span style={{ marginLeft: "auto", color: c.success, fontSize: 14 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {screen === "results" && result && (
          <div style={{ paddingTop: 40, paddingBottom: 60 }}>
            {/* Back */}
            <button
              onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: c.muted, fontSize: 14, cursor: "pointer", padding: "8px 0", marginBottom: 24, fontFamily: "inherit" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = c.muted)}
            >
              ← Nouvelle automatisation
            </button>

            {/* Header */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 20, padding: 28, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: c.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>✅</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 6 }}>{result.workflow_name || "Workflow généré"}</h2>
                  <p style={{ fontSize: 15, color: c.muted, margin: 0, lineHeight: 1.5 }}>{result.description}</p>
                </div>
                {result.estimated_time_saved && (
                  <div style={{ padding: "8px 16px", borderRadius: 10, background: c.successBg, border: "1px solid rgba(34,197,94,0.2)", color: c.success, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
                    ⏱ {result.estimated_time_saved} économisées
                  </div>
                )}
              </div>
              {result.apps_used && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  {result.apps_used.map((app, i) => (
                    <span key={i} style={{ padding: "5px 12px", borderRadius: 8, background: c.accentGlow, color: c.accentLight, fontSize: 12, fontWeight: 500 }}>{app}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Steps */}
            {result.steps_summary && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: c.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Étapes du workflow</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.steps_summary.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: c.card, borderRadius: 10, border: `1px solid ${c.border}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: c.accentGlow, color: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: c.text, fontWeight: 500 }}>{s.action}</div>
                        <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>{s.app}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Cards */}
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Téléchargez vos blueprints</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
              {result.make_blueprint && <PlatformCard platform="Make" color={c.make} bgColor={c.makeBg} icon="🟣" blueprint={result.make_blueprint} workflowName={result.workflow_name} />}
              {result.zapier_blueprint && <PlatformCard platform="Zapier" color={c.zapier} bgColor={c.zapierBg} icon="🟠" blueprint={result.zapier_blueprint} workflowName={result.workflow_name} />}
              {result.n8n_blueprint && <PlatformCard platform="n8n" color={c.n8n} bgColor={c.n8nBg} icon="🔴" blueprint={result.n8n_blueprint} workflowName={result.workflow_name} />}
            </div>

            {/* Import Instructions */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 16 }}>Comment importer votre scénario</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <div style={{ padding: "12px 0" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: c.make }}>🟣 Make</div>
                  <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.6 }}>Nouveau scénario → Menu ··· → Import Blueprint → Sélectionnez le .json</div>
                </div>
                <div style={{ padding: "12px 0" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: c.zapier }}>🟠 Zapier</div>
                  <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.6 }}>Settings → Security & Data → Upload my Zaps → Sélectionnez le .json</div>
                </div>
                <div style={{ padding: "12px 0" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: c.n8n }}>🔴 n8n</div>
                  <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.6 }}>Menu ··· → Import from File → Sélectionnez le .json</div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: c.warningBg, border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, fontSize: 13, color: c.warning, lineHeight: 1.5 }}>
                💡 Après l'import, vous devrez reconnecter vos comptes (Gmail, Slack, Google Sheets, etc.) dans chaque plateforme. Les identifiants ne sont jamais inclus dans les fichiers JSON pour des raisons de sécurité.
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 32, textAlign: "center", color: c.dim, fontSize: 13 }}>
              Propulsé par <span style={{ fontWeight: 600, color: c.muted }}>NIROAD IA</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
