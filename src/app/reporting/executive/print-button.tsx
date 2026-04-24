"use client";

import type { ReactElement } from "react";

export function ExecutivePrintButton({ label }: { label: string }): ReactElement {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1px solid var(--button-border)",
        background: "transparent",
        color: "inherit",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
