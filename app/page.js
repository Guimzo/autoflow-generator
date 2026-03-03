"use client";

import { useState, useEffect, useRef } from "react";

// ─── Rate Limiting ───
const DAILY_LIMIT = 5;
const getRateLimitKey = () => `af_${new Date().toISOString().slice(0, 10)}`;
function getUsageCount() {
  if (typeof window === "undefined") return 0;
  try { const s = localStorage.getItem(getRateLimitKey()); return s ? parseInt(s, 10) : 0; } catch { return 0; }
}
function incrementUsage() {
  if (typeof window === "undefined") return 0;
  try {
    const k = getRateLimitKey(), n = getUsageCount() + 1;
    localStorage.setItem(k, String(n));
    Object.keys(localStorage).forEach((x) => { if (x.startsWith("af_") && x !== k) localStorage.removeItem(x); });
    return n;
  } catch { return 0; }
}

// ─── Theme ───
const t = {
  bg: "#06060a",
  surface: "#0d0d15",
  surfaceHover: "#111120",
  card: "#0b0b13",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  text: "#e8e8ed",
  textSecondary: "#8a8a9a",
  textTertiary: "#55556a",
  white: "#ffffff",
  // Accent colors
  primary: "#785aff",
  primaryLight: "#9d85ff",
  primaryBg: "rgba(120,90,255,0.08)",
  primaryBorder: "rgba(120,90,255,0.2)",
  primaryGlow: "rgba(120,90,255,0.15)",
  secondary: "#00d4aa",
  secondaryBg: "rgba(0,212,170,0.08)",
  secondaryBorder: "rgba(0,212,170,0.15)",
  cyan: "#00c2ff",
  pink: "#ff5cab",
  pinkBg: "rgba(255,92,171,0.08)",
  gradient: "linear-gradient(135deg, #785aff, #00c2ff, #00d4aa)",
  gradientHot: "linear-gradient(135deg, #785aff, #ff5cab, #ff8c42)",
  success: "#00d4aa",
  successBg: "rgba(0,212,170,0.08)",
  successBorder: "rgba(0,212,170,0.18)",
  warning: "#ffb224",
  warningBg: "rgba(255,178,36,0.08)",
  warningBorder: "rgba(255,178,36,0.12)",
  error: "#ff5c6a",
  errorBg: "rgba(255,92,106,0.08)",
  make: { color: "#9b6dff", bg: "rgba(155,109,255,0.07)", border: "rgba(155,109,255,0.18)", glow: "rgba(155,109,255,0.12)" },
  zapier: { color: "#ff6b35", bg: "rgba(255,107,53,0.07)", border: "rgba(255,107,53,0.18)", glow: "rgba(255,107,53,0.12)" },
  n8n: { color: "#ff6d8a", bg: "rgba(255,109,138,0.07)", border: "rgba(255,109,138,0.18)", glow: "rgba(255,109,138,0.12)" },
};

const platforms = {
  make: {
    key: "make", name: "Make", blueprintKey: "make_blueprint", ...t.make,
    logo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#9b6dff"/><rect x="8" y="8" width="8" height="8" rx="1" fill="#fff" opacity="0.9"/><rect x="10" y="10" width="4" height="4" rx="0.5" fill="#9b6dff"/></svg>,
  },
  zapier: {
    key: "zapier", name: "Zapier", blueprintKey: "zapier_blueprint", ...t.zapier,
    logo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ff6b35"/><path d="M12 7v10M7 12h10M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  n8n: {
    key: "n8n", name: "n8n", blueprintKey: "n8n_blueprint", ...t.n8n,
    logo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ff6d8a"/><circle cx="9" cy="12" r="2.2" fill="#fff"/><circle cx="15" cy="12" r="2.2" fill="#fff"/><rect x="11" y="11.2" width="2" height="1.6" rx="0.8" fill="#fff"/></svg>,
  },
};

const loadingMsgs = [
  { text: "Analyse du besoin", color: t.primary },
  { text: "Identification des services", color: t.cyan },
  { text: "Génération Make", color: "#9b6dff" },
  { text: "Génération Zapier", color: "#ff6b35" },
  { text: "Génération n8n", color: "#ff6d8a" },
  { text: "Rédaction du plan d'action", color: t.secondary },
  { text: "Validation", color: t.success },
];

const examples = [
  "Quand un lead remplit mon formulaire Typeform, l'ajouter dans Google Sheets, envoyer un email de bienvenue via Gmail et notifier mon équipe sur Slack",
  "Publier automatiquement mes articles WordPress sur LinkedIn, Twitter et Facebook avec un résumé IA",
  "Chaque lundi, récupérer les stats Google Analytics, générer un rapport Google Docs et l'envoyer par email",
  "Quand un client signe sur PandaDoc, créer un projet Notion, envoyer un onboarding email et générer la facture",
  "Surveiller les mentions de ma marque, résumer avec l'IA et envoyer un digest Slack quotidien",
];

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── Tab Content ───
function TabContent({ platformKey, blueprint, actionPlan, workflowName }) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const p = platforms[platformKey];
  const fname = `${(workflowName || "workflow").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${platformKey}.json`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, animation: "fadeUp 0.35s ease" }}>
      {/* JSON Card */}
      <div style={{
        background: t.surface, border: `1px solid ${p.border}`, borderRadius: 16, overflow: "hidden",
        boxShadow: `0 0 30px ${p.glow}`,
      }}>
        <div style={{
          padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${t.border}`,
          background: `linear-gradient(135deg, ${p.bg}, transparent)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, boxShadow: `0 0 8px ${p.color}66` }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Blueprint {p.name}</span>
            <span style={{
              padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              background: p.bg, color: p.color, border: `1px solid ${p.border}`,
            }}>.json</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowJson(!showJson)} style={{
              padding: "7px 14px", borderRadius: 8, border: `1px solid ${t.border}`,
              background: showJson ? "rgba(255,255,255,0.04)" : "transparent",
              color: t.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {showJson ? "Masquer" : "Aperçu"}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
              padding: "7px 14px", borderRadius: 8, border: `1px solid ${t.border}`,
              background: "transparent", color: copied ? t.success : t.textSecondary,
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {copied ? "✓ Copié" : "Copier"}
            </button>
            <button onClick={() => downloadJSON(blueprint, fname)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: p.color, color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: `0 2px 12px ${p.glow}`,
            }}>
              ↓ Télécharger
            </button>
          </div>
        </div>
        {showJson && (
          <div style={{
            padding: 22, background: "#08080d", maxHeight: 320, overflow: "auto",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: t.textTertiary,
            lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all",
          }}>
            {JSON.stringify(blueprint, null, 2)}
          </div>
        )}
      </div>

      {/* Action Plan */}
      {actionPlan?.steps && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: p.bg, border: `1px solid ${p.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>📋</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>
                Plan d'action <span style={{ color: p.color }}>{p.name}</span>
              </h3>
              <p style={{ fontSize: 12, color: t.textTertiary, margin: 0, marginTop: 2 }}>
                Suivez ces étapes pour configurer votre automatisation
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            <div style={{
              position: "absolute", left: 19, top: 28, bottom: 28, width: 2,
              background: `linear-gradient(to bottom, ${p.color}40, ${p.color}05)`, borderRadius: 1,
            }} />

            {actionPlan.steps.map((s, i) => (
              <div key={i} style={{
                display: "flex", gap: 16, padding: "10px 0", position: "relative",
                animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0, zIndex: 1,
                  background: i === 0 ? p.color : t.surface,
                  border: i === 0 ? `1px solid ${p.color}` : `1px solid ${t.border}`,
                  color: i === 0 ? "#fff" : t.textSecondary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  boxShadow: i === 0 ? `0 0 20px ${p.glow}` : "none",
                }}>
                  {s.step}
                </div>
                <div style={{
                  flex: 1, background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 14, padding: "18px 22px",
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>{s.description}</div>
                  {s.tip && (
                    <div style={{
                      marginTop: 12, padding: "10px 14px", borderRadius: 10,
                      background: t.warningBg, border: `1px solid ${t.warningBorder}`,
                      fontSize: 12, color: t.warning, lineHeight: 1.6,
                      display: "flex", gap: 8, alignItems: "flex-start",
                    }}>
                      <span style={{ flexShrink: 0 }}>💡</span>
                      <span>{s.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History ───
function getHistory() {
  if (typeof window === "undefined") return [];
  try {
    const h = localStorage.getItem("af_history");
    return h ? JSON.parse(h) : [];
  } catch { return []; }
}
function saveToHistory(promptText, result) {
  try {
    const history = getHistory();
    const entry = {
      id: Date.now(),
      prompt: promptText.slice(0, 120),
      name: result.workflow_name || "Workflow",
      apps: result.apps_used || [],
      time: result.estimated_time_saved || "",
      date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      result: result,
    };
    history.unshift(entry);
    if (history.length > 10) history.pop();
    try {
      localStorage.setItem("af_history", JSON.stringify(history));
    } catch (storageErr) {
      // If too large, try without blueprints in older entries
      history.forEach((h, i) => {
        if (i > 0 && h.result) {
          h.result = {
            workflow_name: h.result.workflow_name,
            description: h.result.description,
            apps_used: h.result.apps_used,
            estimated_time_saved: h.result.estimated_time_saved,
            steps_summary: h.result.steps_summary,
          };
        }
      });
      try {
        localStorage.setItem("af_history", JSON.stringify(history));
      } catch {
        // Last resort: only keep latest
        localStorage.setItem("af_history", JSON.stringify([entry]));
      }
    }
  } catch (e) { console.error("saveToHistory error:", e); }
}
function removeFromHistory(id) {
  try {
    const history = getHistory().filter(h => h.id !== id);
    localStorage.setItem("af_history", JSON.stringify(history));
  } catch {}
}

// ─── Main ───
export default function Home() {
  const [screen, setScreen] = useState("landing");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const [activeTab, setActiveTab] = useState("make");
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setUsageCount(getUsageCount());
    setHistory(getHistory());
  }, []);
  const remaining = mounted ? DAILY_LIMIT - usageCount : DAILY_LIMIT;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  useEffect(() => {
    if (screen !== "loading") return;
    const interval = setInterval(() => {
      setLoadingStep((p) => (p < loadingMsgs.length - 1 ? p + 1 : p));
    }, 2200);
    return () => clearInterval(interval);
  }, [screen]);

  const handleGenerate = async () => {
    if (!prompt.trim() || remaining <= 0) return;
    setScreen("loading"); setLoadingStep(0); setError(null); setActiveTab("make");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erreur");
      console.log("Generation success, saving to history...");
      saveToHistory(prompt.trim(), data);
      const newHistory = getHistory();
      console.log("History after save:", newHistory.length, "items");
      setHistory(newHistory);
      setResult(data); setUsageCount(incrementUsage()); setScreen("results");
    } catch (err) { setError(err.name === "AbortError" ? "La génération a pris trop de temps. Réessayez avec une description plus simple." : err.message); setScreen("landing"); }
  };

  const handleReset = () => { setScreen("landing"); setPrompt(""); setResult(null); setError(null); setHistory(getHistory()); };

  const handleLoadHistory = (item) => {
    setResult(item.result); setActiveTab("make"); setScreen("results");
  };

  const handleDeleteHistory = (id, e) => {
    e.stopPropagation();
    removeFromHistory(id);
    setHistory(getHistory());
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" }}>
      {/* Background glows */}
      <div style={{
        position: "fixed", top: "-20%", left: "20%", width: "40vw", height: "40vh",
        background: "radial-gradient(ellipse, rgba(120,90,255,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(40px)",
      }} />
      <div style={{
        position: "fixed", top: "10%", right: "10%", width: "35vw", height: "35vh",
        background: "radial-gradient(ellipse, rgba(0,194,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(40px)",
      }} />
      <div style={{
        position: "fixed", bottom: "0%", left: "30%", width: "40vw", height: "30vh",
        background: "radial-gradient(ellipse, rgba(255,92,171,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(40px)",
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 1,
        borderBottom: `1px solid ${t.border}`, padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: t.gradient, padding: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: 7, background: t.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 7h6M7 4v6" stroke="url(#hg)" strokeWidth="2" strokeLinecap="round"/>
                <defs><linearGradient id="hg" x1="4" y1="4" x2="10" y2="10"><stop stopColor="#785aff"/><stop offset="0.5" stopColor="#00c2ff"/><stop offset="1" stopColor="#00d4aa"/></linearGradient></defs>
              </svg>
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.04em", color: t.white }}>AutoFlow</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20,
          background: remaining > 2 ? t.primaryBg : remaining > 0 ? t.warningBg : t.errorBg,
          border: `1px solid ${remaining > 2 ? t.primaryBorder : remaining > 0 ? t.warningBorder : "rgba(255,92,106,0.15)"}`,
          fontSize: 12, fontWeight: 600,
          color: remaining > 2 ? t.primaryLight : remaining > 0 ? t.warning : t.error,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: remaining > 2 ? t.primary : remaining > 0 ? t.warning : t.error,
            boxShadow: `0 0 6px ${remaining > 2 ? t.primary : remaining > 0 ? t.warning : t.error}88`,
            animation: "glow 2s ease infinite",
          }} />
          {remaining}/{DAILY_LIMIT}
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>

        {/* ═══ LANDING ═══ */}
        {screen === "landing" && (
          <div style={{ paddingTop: 80, paddingBottom: 80 }}>
            <div style={{ textAlign: "center", marginBottom: 56, animation: "fadeUp 0.6s ease" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px",
                borderRadius: 20, background: t.primaryBg, border: `1px solid ${t.primaryBorder}`,
                fontSize: 12, fontWeight: 600, color: t.primaryLight, marginBottom: 28,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.secondary, animation: "glow 2s ease infinite", boxShadow: `0 0 6px ${t.secondary}66` }} />
                Génération gratuite • Make, Zapier, n8n
              </div>
              <h1 style={{
                fontSize: "clamp(34px, 5.5vw, 58px)", fontWeight: 800, lineHeight: 1.08,
                letterSpacing: "-0.04em", margin: 0,
              }}>
                <span style={{ color: t.white }}>Décrivez. Générez.</span>
                <br />
                <span style={{
                  background: t.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundSize: "200% 200%", animation: "gradientShift 6s ease infinite",
                }}>Automatisez.</span>
              </h1>
              <p style={{
                fontSize: 16, color: t.textSecondary, marginTop: 20, lineHeight: 1.7,
                maxWidth: 460, marginLeft: "auto", marginRight: "auto",
              }}>
                Transformez une idée en scénarios d'automatisation prêts à importer, avec un plan de configuration pas à pas.
              </p>
            </div>

            {/* Input */}
            <div style={{
              borderRadius: 20, padding: 1, marginBottom: 40,
              background: `linear-gradient(135deg, ${t.primaryBorder}, ${t.border}, rgba(0,194,255,0.12), ${t.border})`,
              animation: "fadeUp 0.6s ease 0.1s both",
              boxShadow: `0 0 60px ${t.primaryGlow}, 0 0 120px rgba(0,194,255,0.03)`,
            }}>
              <div style={{ background: t.surface, borderRadius: 19, padding: 24 }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={"Décrivez l'automatisation que vous voulez créer..."}
                  disabled={remaining <= 0}
                  style={{
                    width: "100%", minHeight: 100, background: "transparent", border: "none",
                    outline: "none", color: t.text, fontSize: 15, lineHeight: 1.7,
                    resize: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                />
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}`, flexWrap: "wrap", gap: 12,
                }}>
                  <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>
                    {remaining <= 0 ? "Limite quotidienne atteinte" : "⌘+Enter"}
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || remaining <= 0}
                    style={{
                      padding: "11px 26px", borderRadius: 10, border: "none",
                      background: !prompt.trim() || remaining <= 0 ? "rgba(255,255,255,0.04)" : t.gradient,
                      color: !prompt.trim() || remaining <= 0 ? t.textTertiary : "#fff",
                      fontWeight: 700, fontSize: 13,
                      cursor: !prompt.trim() || remaining <= 0 ? "not-allowed" : "pointer",
                      transition: "all 0.3s", fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxShadow: !prompt.trim() || remaining <= 0 ? "none" : `0 4px 20px ${t.primaryGlow}`,
                      backgroundSize: "200% 200%", animation: prompt.trim() && remaining > 0 ? "gradientShift 4s ease infinite" : "none",
                    }}
                  >
                    Générer les scénarios →
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                background: t.errorBg, border: "1px solid rgba(255,92,106,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 32, color: t.error, fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {remaining <= 0 && (
              <div style={{
                background: t.errorBg, border: "1px solid rgba(255,92,106,0.1)", borderRadius: 16,
                padding: 32, textAlign: "center", marginBottom: 40,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.error, marginBottom: 4 }}>Limite atteinte</div>
                <div style={{ color: t.textTertiary, fontSize: 13 }}>Revenez demain pour 5 nouvelles générations.</div>
              </div>
            )}

            {/* Examples */}
            <div style={{ animation: "fadeUp 0.6s ease 0.2s both" }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: t.textTertiary, textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 14, fontFamily: "'JetBrains Mono', monospace",
              }}>
                Exemples
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setPrompt(ex); textareaRef.current?.focus(); }}
                    style={{
                      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
                      padding: "14px 18px", color: t.textSecondary, fontSize: 13, lineHeight: 1.6,
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.primaryBorder; e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.boxShadow = `0 0 20px ${t.primaryGlow}`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSecondary; e.currentTarget.style.background = t.surface; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <span style={{ color: t.primary, marginRight: 10, fontWeight: 700 }}>→</span>{ex}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            {mounted && history.length > 0 && (
              <div style={{ marginTop: 48, animation: "fadeUp 0.6s ease 0.3s both" }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: t.textTertiary, textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 14, fontFamily: "'JetBrains Mono', monospace",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.primary }} />
                  Mes générations
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadHistory(item)}
                      style={{
                        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
                        padding: "14px 18px", color: t.text, fontSize: 13, lineHeight: 1.5,
                        cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                        fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex",
                        alignItems: "center", gap: 14, position: "relative",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.primaryBorder; e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.boxShadow = `0 0 20px ${t.primaryGlow}`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, background: t.successBg,
                        border: `1px solid ${t.successBorder}`, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                      }}>✓</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: t.white, marginBottom: 3 }}>{item.name}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {item.apps.slice(0, 3).map((app, i) => (
                            <span key={i} style={{
                              padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                              background: t.primaryBg, border: `1px solid ${t.primaryBorder}`, color: t.primaryLight,
                            }}>{app}</span>
                          ))}
                          {item.apps.length > 3 && <span style={{ fontSize: 10, color: t.textTertiary }}>+{item.apps.length - 3}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>{item.date}</span>
                        <div
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          style={{
                            width: 26, height: 26, borderRadius: 6, display: "flex",
                            alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: t.textTertiary, fontSize: 14, transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = t.error; e.currentTarget.style.background = t.errorBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = t.textTertiary; e.currentTarget.style.background = "transparent"; }}
                        >×</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              marginTop: 64, paddingTop: 24, borderTop: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              color: t.textTertiary, fontSize: 12,
            }}>
              Propulsé par <span style={{
                fontWeight: 700, background: t.gradient,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>NIROAD IA</span>
            </div>
          </div>
        )}

        {/* ═══ LOADING ═══ */}
        {screen === "loading" && (
          <div style={{ paddingTop: 120, paddingBottom: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, padding: 1,
              background: t.gradient, marginBottom: 36, animation: "float 3s ease-in-out infinite",
              boxShadow: `0 0 40px ${t.primaryGlow}`,
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: 15, background: t.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
                  <path d="M4 7h6M7 4v6" stroke="url(#lg3)" strokeWidth="2" strokeLinecap="round"/>
                  <defs><linearGradient id="lg3" x1="4" y1="4" x2="10" y2="10"><stop stopColor="#785aff"/><stop offset="0.5" stopColor="#00c2ff"/><stop offset="1" stopColor="#00d4aa"/></linearGradient></defs>
                </svg>
              </div>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.03em" }}>
              Génération en cours
            </h2>
            <p style={{ color: t.textTertiary, fontSize: 14, marginBottom: 44 }}>Construction des scénarios et du plan d'action</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 360 }}>
              {loadingMsgs.map((msg, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 16px", borderRadius: 10, height: 44,
                  background: i <= loadingStep ? t.surface : "transparent",
                  border: `1px solid ${i <= loadingStep ? t.border : "transparent"}`,
                  opacity: i <= loadingStep ? 1 : 0.2, transition: "all 0.4s ease",
                  animation: i === loadingStep ? "fadeUp 0.3s ease" : "none",
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: i < loadingStep ? t.success : i === loadingStep ? msg.color : t.textTertiary,
                    boxShadow: i === loadingStep ? `0 0 8px ${msg.color}66` : i < loadingStep ? `0 0 6px ${t.success}44` : "none",
                    transition: "all 0.3s",
                  }} />
                  <span style={{
                    fontSize: 13, fontWeight: i === loadingStep ? 600 : 400,
                    color: i < loadingStep ? t.success : i === loadingStep ? t.text : t.textTertiary,
                  }}>{msg.text}</span>
                  {i < loadingStep && <span style={{ marginLeft: "auto", color: t.success, fontSize: 12, fontWeight: 600 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {screen === "results" && result && (
          <div style={{ paddingTop: 40, paddingBottom: 80 }}>
            <button onClick={handleReset} style={{
              display: "flex", alignItems: "center", gap: 6, background: "transparent",
              border: "none", color: t.textTertiary, fontSize: 13, cursor: "pointer",
              padding: "8px 0", marginBottom: 28, fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "color 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textTertiary)}
            >← Nouvelle automatisation</button>

            {/* Header Card */}
            <div style={{
              background: t.surface, borderRadius: 20, padding: "28px 32px", marginBottom: 28,
              border: `1px solid ${t.successBorder}`, animation: "fadeUp 0.5s ease",
              boxShadow: `0 0 40px ${t.successBg}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13, background: t.successBg,
                  border: `1px solid ${t.successBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                  boxShadow: `0 0 16px ${t.successBg}`,
                }}>✓</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 6, letterSpacing: "-0.03em", color: t.white }}>
                    {result.workflow_name || "Workflow généré"}
                  </h2>
                  <p style={{ fontSize: 14, color: t.textSecondary, margin: 0, lineHeight: 1.6 }}>{result.description}</p>
                </div>
                {result.estimated_time_saved && (
                  <div style={{
                    padding: "7px 14px", borderRadius: 8, background: t.successBg,
                    border: `1px solid ${t.successBorder}`, color: t.success,
                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                    fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: `0 0 12px rgba(0,212,170,0.08)`,
                  }}>
                    ⏱ {result.estimated_time_saved}
                  </div>
                )}
              </div>
              {result.apps_used && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 18 }}>
                  {result.apps_used.map((app, i) => (
                    <span key={i} style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: t.primaryBg, border: `1px solid ${t.primaryBorder}`,
                      color: t.primaryLight,
                    }}>{app}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Steps Flow */}
            {result.steps_summary && (
              <div style={{
                marginBottom: 28, animation: "fadeUp 0.5s ease 0.1s both",
                display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap",
                padding: "16px 20px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
              }}>
                {result.steps_summary.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6, background: t.primaryBg,
                        border: `1px solid ${t.primaryBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: t.primaryLight,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>{s.step}</span>
                      <span style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{s.app}</span>
                    </div>
                    {i < result.steps_summary.length - 1 && (
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ margin: "0 8px", color: t.primary, opacity: 0.5 }}>
                        <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ═══ TABS ═══ */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 28, padding: 4, borderRadius: 14,
              background: t.surface, border: `1px solid ${t.border}`,
              animation: "fadeUp 0.5s ease 0.15s both",
            }}>
              {Object.entries(platforms).map(([key, p]) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "13px 20px", borderRadius: 10, border: "none",
                      background: active ? p.bg : "transparent",
                      color: active ? p.color : t.textTertiary,
                      fontWeight: active ? 700 : 500, fontSize: 14,
                      cursor: "pointer", transition: "all 0.2s",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxShadow: active ? `0 0 20px ${p.glow}, inset 0 0 20px ${p.glow}` : "none",
                      position: "relative",
                      borderBottom: active ? `2px solid ${p.color}` : "2px solid transparent",
                    }}
                  >
                    {p.logo}
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Active Tab */}
            {Object.entries(platforms).map(([key, p]) => (
              activeTab === key && result[p.blueprintKey] ? (
                <TabContent key={key} platformKey={key} blueprint={result[p.blueprintKey]}
                  actionPlan={result.action_plans?.[key]} workflowName={result.workflow_name} />
              ) : null
            ))}

            {/* Footer */}
            <div style={{
              marginTop: 56, paddingTop: 24, borderTop: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              color: t.textTertiary, fontSize: 12,
            }}>
              Propulsé par <span style={{
                fontWeight: 700, background: t.gradient,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>NIROAD IA</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
