import type { ReactElement, ReactNode } from "react";
import { getCurrentPrincipal } from "../auth/authorization";
import { resolvePrincipalLocale } from "../i18n";
import { getUserSettings } from "../settings/preferences";

const THEMES = {
  dark: {
    background: "#0f172a",
    foreground: "#e2e8f0",
    panelBackground: "#1e293b",
    panelBorder: "#334155",
    muted: "#94a3b8",
    link: "#93c5fd",
  },
  light: {
    background: "#f8fafc",
    foreground: "#0f172a",
    panelBackground: "#ffffff",
    panelBorder: "#cbd5e1",
    muted: "#475569",
    link: "#2563eb",
  },
} as const;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  const principal = await getCurrentPrincipal();
  const preferredTheme = principal ? (await getUserSettings(principal.userId)).preferredTheme : "dark";
  const locale = await resolvePrincipalLocale(principal);
  const theme = THEMES[preferredTheme];

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: theme.background,
          color: theme.foreground,
          ["--panel-bg" as string]: theme.panelBackground,
          ["--panel-border" as string]: theme.panelBorder,
          ["--muted-color" as string]: theme.muted,
          ["--link-color" as string]: theme.link,
        }}
      >
        {children}
      </body>
    </html>
  );
}
