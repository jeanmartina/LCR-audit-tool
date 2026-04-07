# Phase 3: Reporting & Compliance Governance - Research

**Researched:** 2026-04-06  
**Domain:** Next.js 16 dashboards, reporting exports, audit-trail UX  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Dashboard Information Hierarchy

- The main dashboard must show current status per list/certificate with detail.
- The main dashboard must show the latest unavailability event.
- SLA must be explorable by period, with time-based slicing.
- Upcoming LCR expirations must be visible without drill-down.
- Open alerts and recent alerts must be visible from the main view.
- The dashboard must support filters by source, issuer, criticality, and owner/responsible party.

### Drill-Down And Audit Trail

- Detail views for a list or certificate must include poll history with timestamp, HTTP status, and timeout outcomes.
- Coverage loss windows must be shown with start, end, and duration.
- Alert history must show severity and recipients.
- The UI must expose the latest valid LCR metadata and previous snapshots.
- Validation failures must show the exact failure reason.
- A unified timeline must combine poll, alert, expiration, validation failure, recovery, and coverage-loss events.

### Export Formats

- CSV exports must support the filtered main table.
- CSV exports must support per-list or per-certificate detail reports.
- CSV exports must support coverage gap history.
- CSV exports must support alert history.
- CSV exports must support the inventory of LCR artifacts and snapshots.
- The system must generate two PDF variants:
  - operational PDF with detailed evidence
  - executive PDF with consolidated summary
- Every CSV and PDF must record the applied filters and the export generation timestamp.

### Retention And Evidence Access

- Polls, alerts, and coverage gaps must use a configurable retention policy per certificate/target.
- The system must define a non-conservative default retention when no per-target override exists.
- LCR snapshots are retained permanently.
- The UI must support date-range search and compound filters over evidence records.

### Claude's Discretion

- The exact default retention window can be chosen during planning, as long as it is pragmatic and clearly documented as the system default.
- The exact dashboard composition can be split across summary cards, tables, and detail drawers/pages during planning, as long as the required information hierarchy remains intact.
- Export generation can be implemented synchronously or asynchronously depending on stack constraints, provided the user-facing audit guarantees remain the same.

### Deferred Ideas (OUT OF SCOPE)

- Advanced executive benchmarking across issuers or countries.
- Predictive risk scoring beyond the currently recorded SLA and coverage evidence.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REP-01 | Dashboard de compliance exibe tabelas coloridas, drill-downs e exportações (CSV/PDF) com status de cada lista, indicadores SLA e históricos de alertas para auditoria. | Padrões de tabela densa, filtros e drill-downs em Next.js/Tailwind + exportação CSV/PDF via Route Handlers. [CITED: .planning/REQUIREMENTS.md] |
| REP-02 | Logs de alertas, registros de cobertura perdida e snapshots de LCR são disponibilizados para justificar SLA e apoiar auditorias quando for preciso mostrar evidências de cobertura. | Modelo de trilha de auditoria baseado em PollRow/CoverageGap, timeline unificada e acesso a snapshots com retenção configurável. [CITED: .planning/REQUIREMENTS.md] |
</phase_requirements>

## Summary

O stack atual (Next.js 16 + React 19 + Tailwind 4 + TypeScript 6) está alinhado com dashboards densos e rotas de exportação; a pesquisa confirma que Route Handlers usam as APIs Web Request/Response, adequadas para gerar CSV/PDF com headers de download. [VERIFIED: npm registry] [CITED: https://nextjs.org/docs/app/building-your-application/routing/route-handlers]  
Para tabelas operacionais densas, o padrão recomendado é usar containers com `overflow-x-auto`/`overflow-y-auto`, cabeçalhos “sticky” e colunas fixas, preservando legibilidade sem perder amplitude de dados. [CITED: https://tailwindcss.com/docs/overflow] [CITED: https://tailwindcss.com/docs/top-right-bottom-left/]  
Para exportações, a combinação `csv-stringify` (escapamento seguro) + `pdf-lib` (PDFs programáticos) evita problemas de quoting e formatação; o download deve usar `Content-Disposition` com `attachment` e `filename`. [CITED: https://csv.js.org/stringify/options/quoted_string/] [CITED: https://pdf-lib.js.org/] [CITED: https://developer.mozilla.org/ko/docs/Web/HTTP/Reference/Headers/Content-Disposition]

**Primary recommendation:** Implementar o dashboard e exports via App Router (Server Components + Route Handlers) com timeline auditável baseada em `polls`, `coverage_gaps`, alertas e snapshots, adicionando retenção por alvo em `targets`. [CITED: https://nextjs.org/learn/dashboard-app/fetching-data] [CITED: src/storage/coverage-records.ts] [CITED: src/inventory/targets.ts]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.2 | App Router + Route Handlers para dashboard e exports | Versão atual do npm e já usada no projeto. [VERIFIED: npm registry] [CITED: package.json] |
| React | 19.2.4 | UI base para componentes e visualizações | Versão atual do npm e já usada no projeto. [VERIFIED: npm registry] [CITED: package.json] |
| Tailwind CSS | 4.2.2 | Layout denso e tabelas com utilitários | Versão atual do npm e já usada no projeto. [VERIFIED: npm registry] [CITED: package.json] |
| TypeScript | 6.0.2 | Tipagem para dados de auditoria/exports | Versão atual do npm e já usada no projeto. [VERIFIED: npm registry] [CITED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| csv-stringify | 6.7.0 | Geração de CSV com quoting seguro | Exportações CSV do dashboard e relatórios detalhados. [VERIFIED: npm registry] [CITED: https://csv.js.org/stringify/options/quoted_string/] |
| pdf-lib | 1.17.1 | Geração de PDF programática | PDF operacional e executivo com evidências. [VERIFIED: npm registry] [CITED: https://pdf-lib.js.org/] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdf-lib | Playwright PDF | Requer runtime headless e aumenta custo operacional; útil apenas se layout HTML completo for obrigatório. [ASSUMED] |
| csv-stringify | CSV manual (`Array.join`) | Risco de escaping incorreto em campos com vírgula/aspas. [ASSUMED] |

**Installation:**
```bash
npm install csv-stringify pdf-lib
```

**Version verification:**
```bash
npm view next version
npm view react version
npm view react-dom version
npm view tailwindcss version
npm view typescript version
npm view csv-stringify version
npm view pdf-lib version
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx           # visão principal com filtros
│   │   ├── [targetId]/
│   │   │   └── page.tsx       # drill-down por target
│   │   └── components/        # tabelas, badges, filtros
│   └── api/
│       └── reports/
│           ├── csv/route.ts   # export CSV
│           └── pdf/route.ts   # export PDF
├── reporting/
│   ├── queries.ts             # queries por período/filtros
│   ├── timeline.ts            # união de eventos para auditoria
│   └── exports.ts             # mapeamento para CSV/PDF
└── storage/
```
[ASSUMED]

### Pattern 1: Server Components para dados de dashboard
**What:** Buscar dados diretamente no servidor com Server Components para evitar expor credenciais e reduzir round-trips. [CITED: https://nextjs.org/learn/dashboard-app/fetching-data]  
**When to use:** Listas principais, métricas SLA, últimos alerts e coverage gaps. [CITED: https://nextjs.org/learn/dashboard-app/fetching-data]  
**Example:**
```tsx
// Source: https://nextjs.org/learn/dashboard-app/fetching-data
export default async function DashboardPage() {
  const data = await getDashboardData(); // server-side
  return <DashboardTable data={data} />;
}
```

### Pattern 2: Route Handlers para exports CSV/PDF
**What:** Implementar `app/api/reports/*/route.ts` usando Web Request/Response APIs para gerar arquivos. [CITED: https://nextjs.org/docs/app/building-your-application/routing/route-handlers]  
**When to use:** Exportações filtradas e auditáveis para CSV/PDF. [CITED: https://nextjs.org/docs/app/building-your-application/routing/route-handlers]  
**Example:**
```ts
// Source: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
export async function GET() {
  const body = "col1,col2\nvalue1,value2\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=\"report.csv\"",
    },
  });
}
```

### Pattern 3: Timeline de evidências unificada
**What:** Unificar eventos de polls, coverage gaps, alertas e snapshots em uma linha do tempo. [CITED: src/storage/coverage-records.ts]  
**When to use:** Drill-down e visão de auditoria por target. [CITED: src/storage/coverage-records.ts]  
**Example (mapa de eventos):**
```ts
// Source: src/storage/coverage-records.ts
type TimelineEvent =
  | { type: "poll"; at: Date; status: number }
  | { type: "coverage_gap"; start: Date; end: Date | null };
```

### Anti-Patterns to Avoid
- **Exportar CSV com `Array.join` sem quoting:** risco de colunas quebradas por vírgulas e aspas nos dados. [ASSUMED]
- **Drill-down sem timeline única:** obriga auditor a cruzar tabelas manualmente e enfraquece a narrativa de evidência. [ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Escapar CSV corretamente | `Array.join` com replace manual | `csv-stringify` | Regras de quoting e campos nulos são frágeis. [CITED: https://csv.js.org/stringify/options/quoted_string/] |
| PDF de evidências | Render HTML sem lib | `pdf-lib` | Geração programática e estável em Node. [CITED: https://pdf-lib.js.org/] |

**Key insight:** exportações são parte do compliance; erros de formatação invalidam evidências. [ASSUMED]

## Common Pitfalls

### Pitfall 1: Tabela densa sem scroll controlado
**What goes wrong:** header some, colunas quebram e o usuário perde contexto ao navegar. [ASSUMED]  
**Why it happens:** faltam containers com `overflow-x-auto`/`overflow-y-auto` e cabeçalhos fixos. [CITED: https://tailwindcss.com/docs/overflow]  
**How to avoid:** encapsular tabelas em containers com overflow e usar `sticky` + `top-0`. [CITED: https://tailwindcss.com/docs/overflow] [CITED: https://tailwindcss.com/docs/top-right-bottom-left/]  
**Warning signs:** usuários precisam exportar para ler; feedback de “tabela confusa”. [ASSUMED]

### Pitfall 2: Export sem registrar filtros/timestamp
**What goes wrong:** auditor não consegue provar contexto do relatório. [ASSUMED]  
**Why it happens:** ausência de metadados no CSV/PDF. [ASSUMED]  
**How to avoid:** incluir filtros e timestamp no header do arquivo e na linha de metadados. [ASSUMED]

## Code Examples

### CSV com csv-stringify
```ts
// Source: https://csv.js.org/stringify/options/quoted_string/
import { stringify } from "csv-stringify/sync";

const csv = stringify(
  [
    ["target", "status"],
    ["lcr-1", "OK"],
  ],
  { quoted: true }
);
```

### PDF básico com pdf-lib
```ts
// Source: https://pdf-lib.js.org/
import { PDFDocument, StandardFonts } from "pdf-lib";

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage();
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
page.drawText("Compliance Report", { x: 50, y: 750, font });
const bytes = await pdfDoc.save();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSV manual | csv-stringify | Atual (ecosistema Node) | Reduz risco de CSV inválido. [ASSUMED] |
| PDF via HTML print | PDF programático | Atual (Node server) | Relatórios previsíveis e sem dependência de navegador. [ASSUMED] |

**Deprecated/outdated:**
- Gerar CSV manualmente sem quoting consistente. [ASSUMED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Default de retenção sugerido: 180 dias para polls/alerts/coverage gaps. | Summary / Architecture | Pode ser curto ou longo demais para compliance do cliente. |

## Open Questions

1. **Retenção default deve ser maior que 180 dias?**
   - What we know: a retenção é configurável por target e precisa de default não conservador. [CITED: .planning/phases/03-reporting-compliance-governance/03-CONTEXT.md]  
   - What's unclear: exigências regulatórias do cliente. [ASSUMED]  
   - Recommendation: validar com stakeholders e ajustar default antes de hardcode. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | ✓ | 22.22.0 | — | [CITED: local env] |
| npm | instalação de libs | ✓ | 11.12.1 | — | [CITED: local env] |

**Missing dependencies with no fallback:**
- None. [ASSUMED]

**Missing dependencies with fallback:**
- None. [ASSUMED]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Nenhum detectado. [CITED: repo scan] |
| Config file | Nenhum. [CITED: repo scan] |
| Quick run command | — |
| Full suite command | — |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REP-01 | Dashboard + exports CSV/PDF | manual | — | ❌ Wave 0 |
| REP-02 | Evidências auditáveis (alerts/gaps/snapshots) | manual | — | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** —  
- **Per wave merge:** —  
- **Phase gate:** validação manual antes de `/gsd-verify-work`. [ASSUMED]

### Wave 0 Gaps
- [ ] Infra de testes (ex.: Vitest/Jest) ausente. [CITED: repo scan]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | — (sem auth no escopo atual). [ASSUMED] |
| V3 Session Management | no | — (sem sessões no escopo atual). [ASSUMED] |
| V4 Access Control | no | — (sem RBAC no escopo atual). [ASSUMED] |
| V5 Input Validation | yes | Validação server-side dos filtros e parâmetros de export. [ASSUMED] |
| V6 Cryptography | no | — (não há criptografia nova nesta fase). [ASSUMED] |

### Known Threat Patterns for Next.js dashboards

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Injection via filtros | Tampering | Validar tipos/intervalos no server. [ASSUMED] |
| Export sem escopo | Information Disclosure | Aplicar filtros no servidor e registrar metadata. [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/building-your-application/routing/route-handlers — Route Handlers e uso de Web Request/Response. [CITED: https://nextjs.org/docs/app/building-your-application/routing/route-handlers]
- https://nextjs.org/learn/dashboard-app/fetching-data — Server Components e data fetching no servidor. [CITED: https://nextjs.org/learn/dashboard-app/fetching-data]
- https://tailwindcss.com/docs/overflow — utilitários de overflow. [CITED: https://tailwindcss.com/docs/overflow]
- https://tailwindcss.com/docs/top-right-bottom-left/ — utilitários `top-0` e posicionamento. [CITED: https://tailwindcss.com/docs/top-right-bottom-left/]
- https://developer.mozilla.org/ko/docs/Web/HTTP/Reference/Headers/Content-Disposition — header de download. [CITED: https://developer.mozilla.org/ko/docs/Web/HTTP/Reference/Headers/Content-Disposition]
- https://csv.js.org/stringify/options/quoted_string/ — opções de quoting CSV. [CITED: https://csv.js.org/stringify/options/quoted_string/]
- https://pdf-lib.js.org/ — API de PDF programático. [CITED: https://pdf-lib.js.org/]

### Secondary (MEDIUM confidence)
- package.json — stack atual do projeto. [CITED: package.json]
- src/storage/coverage-records.ts — estruturas de poll/coverage gap. [CITED: src/storage/coverage-records.ts]
- src/inventory/targets.ts — configuração por target. [CITED: src/inventory/targets.ts]

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versões confirmadas no npm. [VERIFIED: npm registry]
- Architecture: MEDIUM — padrões baseados em docs e integração com codebase. [CITED: https://nextjs.org/docs/app/building-your-application/routing/route-handlers] [CITED: src/storage/coverage-records.ts]
- Pitfalls: MEDIUM — baseados em boas práticas e utilitários oficiais. [CITED: https://tailwindcss.com/docs/overflow]

**Research date:** 2026-04-06  
**Valid until:** 2026-05-06
