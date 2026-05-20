import type { CSSProperties, ReactElement, ReactNode } from "react";
import { ActionButton, ActionLink, LocalSubnav, Panel, SelectInput, UX_DENSITY } from "./ui/primitives";

export interface PublicShellAction {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}

export interface PublicShellProps {
  locale: string;
  localeLabel: string;
  applyLabel: string;
  localeAction: string;
  localeOptions: Array<{
    value: string;
    label: string;
  }>;
  brandLabel: string;
  brandBadge: string;
  kicker: string;
  title: string;
  description: string;
  asideText: string;
  actions: PublicShellAction[];
  localSubnavLabel?: string;
  localSubnav?: ReactNode;
  children: ReactNode;
}

const shellLayout: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  overflow: "hidden",
  padding: "24px 20px 32px",
};

const shellFrame: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gap: UX_DENSITY.sectionGap,
  maxWidth: "1240px",
  margin: "0 auto",
};

const shellBackdrop: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.95,
};

function ShellMark(): ReactElement {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, rgba(37, 99, 235, 0.92), rgba(14, 165, 233, 0.72))",
        color: "#eff6ff",
        fontWeight: 800,
        letterSpacing: "0.06em",
        boxShadow: "0 18px 38px rgba(15, 23, 42, 0.24)",
        border: "1px solid rgba(255, 255, 255, 0.28)",
      }}
    >
      LS
    </div>
  );
}

export function PublicShell({
  locale,
  localeLabel,
  applyLabel,
  localeAction,
  localeOptions,
  brandLabel,
  brandBadge,
  kicker,
  title,
  description,
  asideText,
  actions,
  localSubnavLabel,
  localSubnav,
  children,
}: PublicShellProps): ReactElement {
  return (
    <main
      style={{
        ...shellLayout,
        background:
          "radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.18), transparent 26%), radial-gradient(circle at 90% 12%, rgba(14, 165, 233, 0.14), transparent 22%), radial-gradient(circle at 50% 0%, rgba(148, 163, 184, 0.10), transparent 30%)",
      }}
    >
      <div style={{ ...shellBackdrop, background: "linear-gradient(180deg, rgba(2, 6, 23, 0.06), transparent 30%)" }} />
      <div style={{ ...shellBackdrop, backgroundImage: "linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px)", backgroundSize: "42px 42px", maskImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.65), transparent 96%)", opacity: 0.28 }} />

      <div style={shellFrame}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: "14px" }}>
            <form
              action={localeAction}
              method="get"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "999px",
                border: "1px solid var(--panel-border)",
                background: "var(--panel-bg)",
                boxShadow: "0 12px 30px var(--shadow-color)",
                width: "fit-content",
                flexWrap: "wrap",
              }}
            >
              <label style={{ display: "grid", gap: "2px", fontSize: "12px", color: "var(--muted-color)" }}>
                <span>{localeLabel}</span>
                <SelectInput
                  name="locale"
                  defaultValue={locale}
                  style={{
                    width: "auto",
                    minWidth: "172px",
                    padding: "6px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {localeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </label>
              <ActionButton>{applyLabel}</ActionButton>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <ShellMark />
              <div style={{ display: "grid", gap: "4px" }}>
                <span
                  style={{
                    width: "fit-content",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "1px solid var(--pill-neutral-border)",
                    background: "var(--pill-neutral-bg)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  {brandBadge}
                </span>
                <strong style={{ fontSize: "22px", lineHeight: 1.05 }}>{brandLabel}</strong>
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {actions.map((action) => (
              <ActionLink key={action.href} href={action.href} tone={action.tone === "primary" ? "primary" : "secondary"}>
                {action.label}
              </ActionLink>
            ))}
          </nav>
        </header>

        {localSubnav ? <LocalSubnav label={localSubnavLabel ?? "Local navigation"}>{localSubnav}</LocalSubnav> : null}

        <Panel>
          <div
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "minmax(0, 1fr)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "var(--muted-color)",
                fontSize: "13px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {kicker}
            </p>
            <div
              style={{
                display: "grid",
                gap: "14px",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: "12px" }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                    lineHeight: 0.98,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {title}
                </h1>
                <p style={{ margin: 0, color: "var(--muted-color)", maxWidth: "780px", lineHeight: 1.65, fontSize: "17px" }}>
                  {description}
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  alignContent: "start",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid var(--panel-border)",
                  background: "var(--subtle-bg)",
                }}
              >
                <span style={{ fontSize: "13px", color: "var(--muted-color)", fontWeight: 700, textTransform: "uppercase" }}>
                  {brandBadge}
                </span>
                <span style={{ lineHeight: 1.55 }}>{asideText}</span>
              </div>
            </div>
          </div>
        </Panel>

        <div style={{ display: "grid", gap: "20px" }}>{children}</div>
      </div>
    </main>
  );
}
