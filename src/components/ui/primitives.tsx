import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from "react";
import Link from "next/link";

export const stackStyle = (gap = "16px"): CSSProperties => ({ display: "grid", gap });

const inputBase: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: "10px",
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "inherit",
};

export function PageShell({ children }: { children: ReactNode }): ReactElement {
  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px", maxWidth: "1280px", margin: "0 auto" }}>
      {children}
    </main>
  );
}

export function PageHeader({
  backHref,
  backLabel,
  kicker,
  title,
  description,
}: {
  backHref?: string;
  backLabel?: string;
  kicker: string;
  title: string;
  description: string;
}): ReactElement {
  return (
    <header style={{ display: "grid", gap: "8px" }}>
      {backHref && backLabel ? (
        <Link href={backHref} style={{ color: "var(--link-color)", width: "fit-content" }}>
          {backLabel}
        </Link>
      ) : null}
      <p style={{ margin: 0, color: "var(--muted-color)", fontSize: "14px", letterSpacing: "0.03em", textTransform: "uppercase" }}>
        {kicker}
      </p>
      <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1 }}>{title}</h1>
      <p style={{ margin: 0, color: "var(--muted-color)", maxWidth: "840px", fontSize: "16px", lineHeight: 1.55 }}>
        {description}
      </p>
    </header>
  );
}

export function Panel({
  children,
  title,
  description,
  compact = false,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  compact?: boolean;
}): ReactElement {
  return (
    <section
      style={{
        border: "1px solid var(--panel-border)",
        borderRadius: "18px",
        padding: compact ? "16px" : "20px",
        background: "var(--panel-bg)",
        boxShadow: "0 18px 48px var(--shadow-color)",
      }}
    >
      {title ? <h2 style={{ margin: 0, marginBottom: description ? "8px" : "16px" }}>{title}</h2> : null}
      {description ? <p style={{ margin: 0, marginBottom: "16px", color: "var(--muted-color)", lineHeight: 1.5 }}>{description}</p> : null}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  example,
  children,
}: {
  label: string;
  hint?: string;
  example?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      {children}
      {hint ? <span style={{ color: "var(--muted-color)", fontSize: "13px", lineHeight: 1.45 }}>{hint}</span> : null}
      {example ? <code style={{ color: "var(--example-color)", fontSize: "12px" }}>{example}</code> : null}
    </label>
  );
}

export function CheckboxField({
  name,
  value,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  value?: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}): ReactElement {
  return (
    <label style={{ display: "grid", gap: "4px", alignContent: "start" }}>
      <span>
        <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} /> {label}
      </span>
      {hint ? <span style={{ color: "var(--muted-color)", fontSize: "13px", lineHeight: 1.45 }}>{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: ComponentPropsWithoutRef<"input">): ReactElement {
  return <input {...props} style={{ ...inputBase, ...(props.style ?? {}) }} />;
}

export function SelectInput(props: ComponentPropsWithoutRef<"select">): ReactElement {
  return <select {...props} style={{ ...inputBase, ...(props.style ?? {}) }} />;
}

export function TextAreaInput(props: ComponentPropsWithoutRef<"textarea">): ReactElement {
  return <textarea {...props} style={{ ...inputBase, minHeight: "96px", ...(props.style ?? {}) }} />;
}

export function ActionButton({ children }: { children: ReactNode }): ReactElement {
  return (
    <button
      type="submit"
      style={{
        width: "fit-content",
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1px solid var(--button-border)",
        background: "var(--button-bg)",
        color: "var(--button-fg)",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning";
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section
      role="status"
      style={{
        border: `1px solid var(--notice-${tone}-border)`,
        borderRadius: "14px",
        padding: "14px 16px",
        background: `var(--notice-${tone}-bg)`,
        display: "grid",
        gap: "4px",
      }}
    >
      <strong>{title}</strong>
      <span style={{ color: "var(--muted-color)", lineHeight: 1.45 }}>{children}</span>
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section
      style={{
        border: "1px dashed var(--panel-border)",
        borderRadius: "14px",
        padding: "18px",
        background: "var(--subtle-bg)",
        display: "grid",
        gap: "6px",
      }}
    >
      <strong>{title}</strong>
      <span style={{ color: "var(--muted-color)", lineHeight: 1.45 }}>{children}</span>
    </section>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }): ReactElement {
  return (
    <span
      style={{
        width: "fit-content",
        padding: "4px 8px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        border: `1px solid var(--pill-${tone}-border)`,
        background: `var(--pill-${tone}-bg)`,
      }}
    >
      {children}
    </span>
  );
}
