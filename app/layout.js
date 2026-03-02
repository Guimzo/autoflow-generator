export const metadata = {
  title: "AutoFlow — Générateur d'automatisations IA",
  description: "Décrivez votre idée, obtenez des scénarios Make, Zapier et n8n prêts à importer avec un plan d'action complet.",
  openGraph: {
    title: "AutoFlow — Générateur d'automatisations IA",
    description: "Décrivez votre idée, obtenez des scénarios Make, Zapier et n8n prêts à importer.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #07070a;
            color: #e8e8ed;
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
          }
          ::selection { background: rgba(255,255,255,0.12); }
          textarea::placeholder { color: #3a3a4a; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #1e1e2a; border-radius: 3px; }
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.7} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
