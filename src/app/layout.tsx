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
    inputBackground: "#0f172a",
    inputBorder: "#475569",
    buttonBackground: "#2563eb",
    buttonForeground: "#ffffff",
    buttonBorder: "#60a5fa",
    subtleBackground: "rgba(15, 23, 42, 0.55)",
    shadow: "rgba(2, 6, 23, 0.18)",
    example: "#bfdbfe",
  },
  light: {
    background: "#f8fafc",
    foreground: "#0f172a",
    panelBackground: "#ffffff",
    panelBorder: "#cbd5e1",
    muted: "#475569",
    link: "#2563eb",
    inputBackground: "#ffffff",
    inputBorder: "#94a3b8",
    buttonBackground: "#1d4ed8",
    buttonForeground: "#ffffff",
    buttonBorder: "#2563eb",
    subtleBackground: "#f1f5f9",
    shadow: "rgba(15, 23, 42, 0.08)",
    example: "#1d4ed8",
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
          ["--input-bg" as string]: theme.inputBackground,
          ["--input-border" as string]: theme.inputBorder,
          ["--button-bg" as string]: theme.buttonBackground,
          ["--button-fg" as string]: theme.buttonForeground,
          ["--button-border" as string]: theme.buttonBorder,
          ["--subtle-bg" as string]: theme.subtleBackground,
          ["--shadow-color" as string]: theme.shadow,
          ["--example-color" as string]: theme.example,
          ["--notice-info-bg" as string]: "rgba(37, 99, 235, 0.10)",
          ["--notice-info-border" as string]: "rgba(96, 165, 250, 0.45)",
          ["--notice-success-bg" as string]: "rgba(34, 197, 94, 0.10)",
          ["--notice-success-border" as string]: "rgba(74, 222, 128, 0.50)",
          ["--notice-warning-bg" as string]: "rgba(245, 158, 11, 0.12)",
          ["--notice-warning-border" as string]: "rgba(251, 191, 36, 0.55)",
          ["--pill-neutral-bg" as string]: "rgba(148, 163, 184, 0.16)",
          ["--pill-neutral-border" as string]: "rgba(148, 163, 184, 0.40)",
          ["--pill-success-bg" as string]: "rgba(34, 197, 94, 0.14)",
          ["--pill-success-border" as string]: "rgba(74, 222, 128, 0.50)",
          ["--pill-warning-bg" as string]: "rgba(245, 158, 11, 0.14)",
          ["--pill-warning-border" as string]: "rgba(251, 191, 36, 0.55)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
