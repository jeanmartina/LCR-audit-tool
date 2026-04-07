import type { ReactElement, ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#0f172a", color: "#e2e8f0" }}>
        {children}
      </body>
    </html>
  );
}
