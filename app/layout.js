export const metadata = {
  title: "AutoFlow Generator — Générateur d'automatisations IA",
  description:
    "Décrivez votre idée, obtenez des scénarios Make, Zapier et n8n prêts à importer. Gratuit.",
  openGraph: {
    title: "AutoFlow Generator — Générateur d'automatisations IA",
    description:
      "Décrivez votre idée, obtenez des scénarios Make, Zapier et n8n prêts à importer.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #09090b; color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
          ::selection { background: rgba(99,102,241,0.3); }
          textarea::placeholder { color: #52525b; }
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.8} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
