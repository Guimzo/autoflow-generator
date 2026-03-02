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
  bg: "#07070a",
  surface: "#0e0e14",
  surfaceHover: "#13131b",
  card: "#0c0c12",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  borderActive: "rgba(255,255,255,0.18)",
  text: "#e8e8ed",
  textSecondary: "#8a8a9a",
  textTertiary: "#55556a",
  white: "#ffffff",
  glow: "rgba(255,255,255,0.03)",
  accentGlow: "rgba(200,180,255,0.06)",
  success: "#34d399",
  successBg: "rgba(52,211,153,0.08)",
  successBorder: "rgba(52,211,153,0.15)",
  warning: "#fbbf24",
  warningBg: "rgba(251,191,36,0.08)",
  warningBorder: "rgba(251,191,36,0.12)",
  error: "#f87171",
  errorBg: "rgba(248,113,113,0.08)",
  make: { color: "#9b6dff", bg: "rgba(155,109,255,0.06)", border: "rgba(155,109,255,0.15)", glow: "rgba(155,109,255,0.08)" },
  zapier: { color: "#ff6b35", bg: "rgba(255,107,53,0.06)", border: "rgba(255,107,53,0.15)", glow: "rgba(255,107,53,0.08)" },
  n8n: { color: "#ff6d8a", bg: "rgba(255,109,138,0.06)", border: "rgba(255,109,138,0.15)", glow: "rgba(255,109,138,0.08)" },
};

const platforms = {
  make: {
    key: "make", name: "Make", blueprintKey: "make_blueprint",
    ...t.make,
    logo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#9b6dff"/><rect x="8" y="8" width="8" height="8" rx="1" fill="#fff" opacity="0.9"/><rect x="10" y="10" width="4" height="4" rx="0.5" fill="#9b6dff"/></svg>,
  },
  zapier: {
    key: "zapier", name: "Zapier", blueprintKey: "zapier_blueprint",
    ...t.zapier,
    logo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ff6b35"/><path d="M12 7v10M7 12h10M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  n8n: {
    key: "n8n", name: "n8n", blueprintKey: "n8n_blueprint",
    ...t.n8n,
    logo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ff6d8a"/><circle cx="9" cy="12" r="2.2" fill="#fff"/><circle cx="15" cy="12" r="2.2" fill="#fff"/><rect x="11" y="11.2" width="2" height="1.6" rx="0.8" fill="#fff"/></svg>,
  },
};

// ─── Loading ───
const loadingMsgs = [
  { text: "Analyse du besoin", icon: "◆" },
  { text: "Identification des services", icon: "◆" },
  { text: "Génération Make", icon: "◆" },
  { text: "Génération Zapier", icon: "◆" },
  { text: "Génération n8n", icon: "◆" },
  { text: "Rédaction du plan d'action", icon: "◆" },
  { text: "Validation", icon: "◆" },
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

// ─── Shared Styles ───
const glass = {
  background: t.surface,
  border: `1px solid ${t.border}`,
  backdropFilter: "blur(20px)",
};

const glassHover = {
  background: t.surfaceHover,
  border: `1px solid ${t.borderHover}`,
};

// ─── Tab Content ───
function TabContent({ platformKey, blueprint, actionPlan, workflowName }) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const p = platforms[platformKey];
  const fname = `${(workflowName || "workflow").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${platformKey}.json`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, animation: "fadeUp 0.35s ease" }}>
      {/* JSON Card */}
      <div style={{ ...glass, borderRadius: 16, overflow: "hidden" }}>
        <div style={{
          padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${t.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>
              Blueprint {p.name}
            </span>
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
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
            }}>
              {showJson ? "Masquer" : "Aperçu"}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
              padding: "7px 14px", borderRadius: 8, border: `1px solid ${t.border}`,
              background: "transparent", color: copied ? t.success : t.textSecondary,
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
            }}>
              {copied ? "✓ Copié" : "Copier"}
            </button>
            <button onClick={() => downloadJSON(blueprint, fname)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: p.color, color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "opacity 0.15s", display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7.5M3 6.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 10.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Télécharger
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
              width: 32, height: 32, borderRadius: 10, background: p.bg, border: `1px solid ${p.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>📋</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>
                Plan d'action
              </h3>
              <p style={{ fontSize: 12, color: t.textTertiary, margin: 0, marginTop: 2 }}>
                Suivez ces étapes pour configurer votre automatisation sur {p.name}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {/* Timeline line */}
            <div style={{
              position: "absolute", left: 19, top: 28, bottom: 28, width: 1,
              background: `linear-gradient(to bottom, ${p.color}30, transparent)`,
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
                  flex: 1, ...glass, borderRadius: 14, padding: "18px 22px",
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 6, letterSpacing: "-0.01em" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>
                    {s.description}
                  </div>
                  {s.tip && (
                    <div style={{
                      marginTop: 12, padding: "10px 14px", borderRadius: 10,
                      background: t.warningBg, border: `1px solid ${t.warningBorder}`,
                      fontSize: 12, color: t.warning, lineHeight: 1.6,
                      display: "flex", gap: 8, alignItems: "flex-start",
                    }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}>💡</span>
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

// ─── Main ───
export default function Home() {
  const [screen, setScreen] = useState("landing");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const [activeTab, setActiveTab] = useState("make");
  const textareaRef = useRef(null);

  useEffect(() => { setUsageCount(getUsageCount()); }, []);
  const remaining = DAILY_LIMIT - usageCount;

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
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erreur");
      setResult(data); setUsageCount(incrementUsage()); setScreen("results");
    } catch (err) { setError(err.message); setScreen("landing"); }
  };

  const handleReset = () => { setScreen("landing"); setPrompt(""); setResult(null); setError(null); };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: "-30%", left: "50%", transform: "translateX(-50%)",
        width: "80vw", height: "60vh", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(120,100,200,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      {/* Grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.3,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 1,
        borderBottom: `1px solid ${t.border}`, padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#lg)" />
            <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <defs><linearGradient id="lg" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#e8e8ed"/><stop offset="1" stopColor="#8a8a9a"/></linearGradient></defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.04em", color: t.white }}>
            AutoFlow
          </span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8,
          ...glass, fontSize: 12, fontWeight: 600,
          color: remaining > 2 ? t.textSecondary : remaining > 0 ? t.warning : t.error,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: remaining > 2 ? t.success : remaining > 0 ? t.warning : t.error,
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
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px",
                borderRadius: 20, ...glass, fontSize: 12, fontWeight: 500, color: t.textSecondary,
                marginBottom: 24,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.success, animation: "glow 2s ease infinite" }} />
                Génération gratuite • Make, Zapier, n8n
              </div>
              <h1 style={{
                fontSize: "clamp(32px, 5.5vw, 56px)", fontWeight: 800, lineHeight: 1.08,
                letterSpacing: "-0.04em", margin: 0, color: t.white,
              }}>
                Décrivez. Générez.
                <br />
                <span style={{ color: t.textSecondary }}>Automatisez.</span>
              </h1>
              <p style={{
                fontSize: 16, color: t.textTertiary, marginTop: 20, lineHeight: 1.7,
                maxWidth: 440, marginLeft: "auto", marginRight: "auto", letterSpacing: "-0.01em",
              }}>
                Transformez une idée en scénarios d'automatisation prêts à importer, accompagnés d'un plan de configuration complet.
              </p>
            </div>

            {/* Input */}
            <div style={{
              ...glass, borderRadius: 20, padding: 2, marginBottom: 40,
              animation: "fadeUp 0.6s ease 0.1s both",
              boxShadow: "0 0 80px rgba(120,100,200,0.03), 0 1px 3px rgba(0,0,0,0.3)",
            }}>
              <div style={{ padding: 24 }}>
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
                    letterSpacing: "-0.01em",
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                />
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}`,
                  flexWrap: "wrap", gap: 12,
                }}>
                  <span style={{ fontSize: 11, color: t.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>
                    {remaining <= 0 ? "Limite quotidienne atteinte" : "⌘+Enter"}
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || remaining <= 0}
                    style={{
                      padding: "11px 24px", borderRadius: 10, border: "none",
                      background: !prompt.trim() || remaining <= 0 ? "rgba(255,255,255,0.04)" : t.white,
                      color: !prompt.trim() || remaining <= 0 ? t.textTertiary : t.bg,
                      fontWeight: 700, fontSize: 13, letterSpacing: "-0.01em",
                      cursor: !prompt.trim() || remaining <= 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxShadow: !prompt.trim() || remaining <= 0 ? "none" : "0 2px 12px rgba(255,255,255,0.08)",
                    }}
                  >
                    Générer les scénarios
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                ...glass, background: t.errorBg, borderColor: "rgba(248,113,113,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 32, color: t.error, fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {remaining <= 0 && (
              <div style={{
                ...glass, background: t.errorBg, borderRadius: 16, padding: 32,
                textAlign: "center", marginBottom: 40, borderColor: "rgba(248,113,113,0.1)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.error, marginBottom: 4 }}>Limite atteinte</div>
                <div style={{ color: t.textTertiary, fontSize: 13 }}>Revenez demain pour 5 nouvelles générations.</div>
              </div>
            )}

            {/* Examples */}
            <div style={{ animation: "fadeUp 0.6s ease 0.2s both" }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: t.textTertiary, textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 14,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Exemples
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setPrompt(ex); textareaRef.current?.focus(); }}
                    style={{
                      ...glass, borderRadius: 12, padding: "14px 18px",
                      color: t.textSecondary, fontSize: 13, lineHeight: 1.6,
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em",
                    }}
                    onMouseEnter={(e) => { Object.assign(e.currentTarget.style, glassHover); e.currentTarget.style.color = t.text; }}
                    onMouseLeave={(e) => { Object.assign(e.currentTarget.style, glass); e.currentTarget.style.color = t.textSecondary; }}
                  >
                    <span style={{ color: t.textTertiary, marginRight: 10 }}>→</span>{ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: 64, paddingTop: 24, borderTop: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              color: t.textTertiary, fontSize: 12,
            }}>
              Propulsé par <span style={{ fontWeight: 700, color: t.textSecondary, letterSpacing: "-0.02em" }}>NIROAD IA</span>
            </div>
          </div>
        )}

        {/* ═══ LOADING ═══ */}
        {screen === "loading" && (
          <div style={{ paddingTop: 120, paddingBottom: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, ...glass,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 36, animation: "float 3s ease-in-out infinite",
              boxShadow: "0 0 40px rgba(120,100,200,0.06)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#lg2)" />
                <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <defs><linearGradient id="lg2" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#e8e8ed"/><stop offset="1" stopColor="#8a8a9a"/></linearGradient></defs>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.03em" }}>Génération en cours</h2>
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
                    width: 6, height: 6, borderRadius: 2, transform: "rotate(45deg)",
                    background: i < loadingStep ? t.success : i === loadingStep ? t.white : t.textTertiary,
                    transition: "all 0.3s",
                  }} />
                  <span style={{
                    fontSize: 13, fontWeight: i === loadingStep ? 600 : 400,
                    color: i < loadingStep ? t.success : i === loadingStep ? t.text : t.textTertiary,
                    letterSpacing: "-0.01em",
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
            <button
              onClick={handleReset}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "transparent",
                border: "none", color: t.textTertiary, fontSize: 13, cursor: "pointer",
                padding: "8px 0", marginBottom: 28, fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "-0.01em", transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textTertiary)}
            >
              ← Nouvelle automatisation
            </button>

            {/* Header Card */}
            <div style={{
              ...glass, borderRadius: 20, padding: "28px 32px", marginBottom: 28,
              animation: "fadeUp 0.5s ease",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13, background: t.successBg,
                  border: `1px solid ${t.successBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
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
                  }}>
                    {result.estimated_time_saved}
                  </div>
                )}
              </div>
              {result.apps_used && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 18 }}>
                  {result.apps_used.map((app, i) => (
                    <span key={i} style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: "rgba(255,255,255,0.04)", border: `1px solid ${t.border}`,
                      color: t.textSecondary, letterSpacing: "-0.01em",
                    }}>{app}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Steps Flow */}
            {result.steps_summary && (
              <div style={{ marginBottom: 28, animation: "fadeUp 0.5s ease 0.1s both" }}>
                <div style={{
                  display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap",
                  padding: "16px 20px", ...glass, borderRadius: 14,
                }}>
                  {result.steps_summary.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: t.textSecondary,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{s.step}</span>
                        <span style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{s.app}</span>
                      </div>
                      {i < result.steps_summary.length - 1 && (
                        <svg width="20" height="20" viewBox="0 0 20 20" style={{ margin: "0 8px", color: t.textTertiary }}>
                          <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TABS ═══ */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 28, padding: 4, borderRadius: 14,
              ...glass, animation: "fadeUp 0.5s ease 0.15s both",
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
                      letterSpacing: "-0.01em",
                      boxShadow: active ? `0 0 20px ${p.glow}` : "none",
                      position: "relative",
                    }}
                  >
                    {p.logo}
                    {p.name}
                    {active && <div style={{
                      position: "absolute", bottom: 0, left: "30%", right: "30%", height: 2,
                      background: p.color, borderRadius: 1,
                    }} />}
                  </button>
                );
              })}
            </div>

            {/* Active Tab Content */}
            {Object.entries(platforms).map(([key, p]) => (
              activeTab === key && result[p.blueprintKey] ? (
                <TabContent
                  key={key}
                  platformKey={key}
                  blueprint={result[p.blueprintKey]}
                  actionPlan={result.action_plans?.[key]}
                  workflowName={result.workflow_name}
                />
              ) : null
            ))}

            {/* Footer */}
            <div style={{
              marginTop: 56, paddingTop: 24, borderTop: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              color: t.textTertiary, fontSize: 12,
            }}>
              Propulsé par <span style={{ fontWeight: 700, color: t.textSecondary }}>NIROAD IA</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
