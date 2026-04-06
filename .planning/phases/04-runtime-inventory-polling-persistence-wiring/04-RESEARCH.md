# Phase 4: Runtime Inventory, Polling, and Persistence Wiring - Research

**Researched:** 2026-04-06 [VERIFIED: env]
**Domain:** Persistência e wiring de runtime (inventário → polling → validação → alertas) [VERIFIED: context]
**Confidence:** MEDIUM [ASSUMED]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- The inventory source of truth is the database. [VERIFIED: context]
- Targets must no longer depend on `DEFAULT_TARGETS` or any placeholder in-memory list as the runtime source. [VERIFIED: context]
- Per-target runtime configuration continues to live with the target record, including intervals, timeouts, alert routing, and retention settings. [VERIFIED: context]
- Persistence introduced in this phase must be production-grade, not just local/dev scaffolding. [VERIFIED: context]
- Polls, alerts, coverage gaps, snapshots, and verification events must be modeled so they can support later reporting and audit queries without redesign. [VERIFIED: context]
- The runtime path must survive process restarts and provide durable evidence for later phases. [VERIFIED: context]
- When validation fails, the invalid artifact is still persisted for audit purposes. [VERIFIED: context]
- A validation failure also marks the resource unavailable in the runtime flow. [VERIFIED: context]
- When a newly fetched artifact has the same hash as the last valid one, the system must not store a duplicate blob. [VERIFIED: context]
- Hash repeats still produce a verification/event record so the runtime history remains visible. [VERIFIED: context]
- Alert events must be persisted before delivery is attempted. [VERIFIED: context]
- Delivery outcomes can be recorded afterward, but the system of record is the persisted alert event. [VERIFIED: context]
- This ordering is required so reporting and audit trails never depend on mail delivery success. [VERIFIED: context]
- Phase 4 delivers backend/runtime closure plus minimal read contracts for downstream consumers. [VERIFIED: context]
- Phase 5 owns UI consumption, filters, exports, and full reporting surface wiring. [VERIFIED: context]
- If endpoints or read adapters are needed now, they exist only to expose the persisted runtime data cleanly to Phase 5. [VERIFIED: context]

### Claude's Discretion
- The specific schema split between poll records, validation events, alert events, and snapshot/blob records can be decided during planning as long as the audit requirements above hold. [VERIFIED: context]
- The exact transport for email delivery can remain implementation-defined, provided alert persistence remains first. [VERIFIED: context]
- The exact shape of the minimal read contracts can be decided during planning as long as they are sufficient for Phase 5 reporting work. [VERIFIED: context]

### Deferred Ideas (OUT OF SCOPE)
- UI wiring, filter controls, and export actions remain in Phase 5. [VERIFIED: context]
- Full reporting endpoints/pages remain in Phase 5 unless a minimal backend contract is required as part of runtime closure. [VERIFIED: context]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MON-01 | O sistema poll dos a cada LCR/certificado no intervalo configurado (10 min padrão quando nada é especificado) e registra disponibilidade, tempo fora do ar e métricas de cobertura perdida até reaparecer uma lista válida. [VERIFIED: requirements] | Padronização de persistência de polls + coverage gaps + defaults de interval/timeout já definidos em `src/inventory/targets.ts`. [VERIFIED: codebase] |
| INT-01 | Cada LCR baixada passa por validação de assinatura e hash (comparando com o hash da última LCR verificada) antes de ser persistida; os blobs históricos ficam disponíveis para futuras verificações. [VERIFIED: requirements] | Modelo de snapshots/blobs com dedupe por hash e registro de eventos de validação, preservando histórico. [ASSUMED] |
| CFG-01 | Uma camada de inventário permite adicionar certificados individuais e listas TSL sociais, atribuir intervalo, timeout e regras de alerta específicas e editar metadados sem editar código. [VERIFIED: requirements] | Inventário como fonte no banco com campos `intervalSeconds`, `timeoutSeconds`, `alertEmail` e `retention` já presentes no Target. [VERIFIED: codebase] |
| ALT-01 | Alertas por e-mail disparam sempre que o status HTTP ≠ 200, o timeout configurado expira ou uma lista expira sem substituto; os alertas persistem até a cobertura voltar, respeitam overrides por lista, podem ser desativados por admin e usam cooldowns para evitar tempestades. [VERIFIED: requirements] | Persistência de eventos de alerta antes da entrega, com cooldown e estado resolvido. [ASSUMED] |
</phase_requirements>

## Summary

O código atual define o formato de targets e retention, mas ainda usa `DEFAULT_TARGETS` em memória e não carrega o inventário do banco. [VERIFIED: codebase] O polling hoje grava resultados em arrays locais e apenas simula persistência com um schema SQL de referência, o que não atende a exigência de persistência durável e auditável. [VERIFIED: codebase] A pesquisa aponta um caminho de wiring que preserva os módulos existentes (inventário, scheduler, validação, alertas, storage), substituindo os arrays por escrita em banco e adicionando um modelo explícito para eventos de validação e alertas. [ASSUMED]

Para cumprir os requisitos, a persistência deve tratar polls, gaps de cobertura, snapshots/blobs e eventos de validação como tabelas duráveis com chaves determinísticas (hash + target + timestamp), além de registrar alertas antes da tentativa de entrega. [ASSUMED] Os contratos mínimos de leitura para a Phase 5 devem expor status atual, histórico de polls, gaps e alertas por target, sem introduzir preocupações de UI. [ASSUMED]

**Primary recommendation:** adotar Postgres como fonte de verdade do inventário e persistir polling/validação/alertas em tabelas normalizadas com dedupe por hash e eventos auditáveis, mantendo o scheduler como orquestrador do fluxo. [ASSUMED]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 16.13 | Persistência durável dos registros de runtime. [VERIFIED: env] | Já há cliente `psql` disponível e servidor ativo. [VERIFIED: env] |
| pg | 8.20.0 | Cliente Node para acesso SQL ao Postgres. [VERIFIED: npm registry] | Integração direta com SQL e baixa abstração para modelos customizados. [ASSUMED] |
| Node.js | 22.22.0 | Runtime dos módulos `src/*`. [VERIFIED: env] | Compatível com `fetch` e timers usados no scheduler. [VERIFIED: codebase] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TimescaleDB (extensão) | — | Retenção por tempo e queries de séries temporais. [ASSUMED] | Quando for necessário compor relatórios por janela de tempo sem redesign. [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pg | drizzle-orm | Mais ergonomia, mas adiciona camada de abstração e migrações próprias. [ASSUMED] |
| Postgres | SQLite | Menos operação, porém pior alinhamento com retenção e concorrência do runtime. [ASSUMED] |

**Installation:**
```bash
npm install pg
```

**Version verification:** `pg@8.20.0` publicado em 2026-03-04. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```
src/
├── inventory/        # Carregamento e normalização de targets
├── polling/          # Scheduler e execução de polls
├── validation/       # Validação LCR/certificado
├── alerting/         # Políticas e emissão de alertas
├── storage/          # Persistência e contratos de leitura/escrita
└── db/               # Conexão e helpers SQL (novo)
```
[ASSUMED]

### Pattern 1: Inventory DB → Scheduler
**What:** Scheduler busca targets no banco, normaliza defaults e filtra `enabled` antes de executar polls. [ASSUMED]  
**When to use:** Sempre que a fonte de verdade do inventário for o banco. [VERIFIED: context]  
**Example:**
```typescript
// Source: codebase pattern
const targets = await loadTargetsFromDb();
const enabled = targets.map(normalizeTarget).filter((t) => t.enabled);
```
[ASSUMED]

### Pattern 2: Poll → Validation → Persistence → Alert
**What:** O polling executa o fetch, valida LCR, persiste poll + evento de validação, persiste alertas (se houver) e só depois dispara a entrega. [ASSUMED]  
**When to use:** Em toda execução de polling para garantir auditabilidade e ordenação correta de alertas. [VERIFIED: context]  
**Example:**
```typescript
// Source: derived wiring pattern
const poll = await persistPoll(...);
const validation = await persistValidation(...);
const alertEvent = await persistAlertEventIfNeeded(...);
if (alertEvent) await deliverAlert(alertEvent);
```
[ASSUMED]

### Pattern 3: Blob Dedup por Hash
**What:** Blobs de LCR são armazenados por hash único; hashes repetidos não geram novo blob, mas geram evento de verificação. [VERIFIED: context]  
**When to use:** Sempre que o hash recebido coincide com o último hash válido. [VERIFIED: context]  
**Example:**
```sql
-- Source: persistence guidance
insert into lcr_blobs (hash, body) values ($1, $2)
on conflict (hash) do nothing;
```
[ASSUMED]

### Anti-Patterns to Avoid
- **Persistência em memória:** arrays locais em `coverage-records.ts` e `alert-policy.ts` não sobrevivem a restart. [VERIFIED: codebase]
- **Alertar antes de persistir:** quebra o requisito de auditoria e ordenação. [VERIFIED: context]

## Minimal Read Contracts (Phase 5 Ready)

Objetivo: expor somente leitura dos dados persistidos para que a Phase 5 possa montar UI/relatórios sem mudar o runtime. [VERIFIED: context]  
Escopo: endpoints/adapters de leitura, sem filtros avançados nem exportação. [VERIFIED: context]

Contratos mínimos sugeridos (shape lógico, não UI):
- `listTargets()` → retorna targets normalizados + status básico (enabled, interval, timeout, alertEmail, retention). [ASSUMED]
- `getTargetStatus(targetId)` → último poll, lastSuccess, coverageGap aberto e última validação. [ASSUMED]
- `listPolls(targetId, { since, limit })` → histórico de polls persistidos. [ASSUMED]
- `listCoverageGaps(targetId, { since })` → gaps persistidos por target. [ASSUMED]
- `listAlerts(targetId, { since, state })` → eventos de alerta persistidos e estado resolvido. [ASSUMED]
- `listSnapshots(targetId, { since })` → metadados de snapshots/blobs (hash, issuer, thisUpdate, nextUpdate). [ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deduplicação de blobs | Controle manual em memória | Unique index em `hash` no banco | Evita race conditions e garante consistência. [ASSUMED] |
| Retenção por tempo | Cleanup manual por código | TTL/particionamento por tempo no banco | Reduz risco de vazamento de dados e simplifica retenção. [ASSUMED] |

**Key insight:** a confiabilidade de auditoria depende de garantias transacionais do banco, não de estado em memória. [ASSUMED]

## Common Pitfalls

### Pitfall 1: Persistir apenas “sucessos”
**What goes wrong:** eventos de validação inválida desaparecem e o histórico fica incompleto. [VERIFIED: context]  
**Why it happens:** tentativa de otimizar armazenamento ignorando auditabilidade. [ASSUMED]  
**How to avoid:** persistir sempre o artefato, mesmo inválido, e marcar indisponibilidade. [VERIFIED: context]  
**Warning signs:** gaps de histórico quando a validação falha. [ASSUMED]

### Pitfall 2: Misturar estados de alerta e entrega
**What goes wrong:** relatórios dependem do sucesso de envio de e-mail. [VERIFIED: context]  
**Why it happens:** ausência de evento persistido como fonte de verdade. [ASSUMED]  
**How to avoid:** persistir alert event antes da entrega e registrar outcome depois. [VERIFIED: context]  
**Warning signs:** inconsistência entre “alerta enviado” e “alerta registrado”. [ASSUMED]

## Code Examples

Verified patterns from codebase:

### Retention Defaults
```typescript
export function getDefaultRetentionPolicy(): RetentionPolicy {
  return {
    pollsDays: DEFAULT_RETENTION_DAYS,
    alertsDays: DEFAULT_RETENTION_DAYS,
    coverageGapsDays: DEFAULT_RETENTION_DAYS,
    snapshotRetention: "permanent",
  };
}
```
[VERIFIED: codebase]

### Poll Recording (Current In-Memory)
```typescript
polls.push({
  targetId,
  status,
  durationMs,
  occurredAt: new Date(),
  coverageLost,
  hash,
  issuer: metadata?.issuer ?? null,
  thisUpdate: metadata?.thisUpdate ?? null,
  nextUpdate: metadata?.nextUpdate ?? null,
  statusLabel: metadata?.statusLabel ?? null,
});
```
[VERIFIED: codebase]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Arrays em memória para polls/alertas | Persistência em banco com eventos auditáveis | A definir | Permite retenção, reprocessamento e auditoria. [ASSUMED] |

**Deprecated/outdated:**
- Persistência em memória como fonte de verdade de runtime. [VERIFIED: codebase]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A persistência recomendada deve usar Postgres como base. | Summary / Standard Stack | Pode conflitar com a infraestrutura real escolhida. |
| A2 | `pg` é o cliente preferido para o runtime atual. | Standard Stack | Pode divergir de um ORM já adotado ou desejado. |
| A3 | TimescaleDB é desejável para retenção/series temporais. | Standard Stack | Pode aumentar complexidade desnecessariamente. |
| A4 | Contratos mínimos de leitura serão expostos via storage/adapters, não UI. | Summary | Pode exigir ajustes se Phase 5 pedir APIs específicas. |
| A5 | Dedup por hash via unique index é suficiente para blobs. | Architecture / Don’t Hand-Roll | Pode falhar se houver necessidade de versionamento diferente. |
| A6 | Retenção por TTL/particionamento será preferível ao cleanup manual. | Don’t Hand-Roll | Pode conflitar com capacidade do banco/infra. |
| A7 | Scheduler continuará como orquestrador principal do fluxo. | Architecture Patterns | Pode exigir redesign se houver worker/distributed queue. |
| A8 | Esquema proposto de eventos (poll/validation/alert) atende auditoria. | Summary / Requirements | Pode faltar campos exigidos por compliance futura. |

## Open Questions

1. **Qual é o mecanismo oficial de persistência (Postgres puro vs extensão Timescale)?**
   - What we know: há referência a “Timescale schema” no módulo de storage. [VERIFIED: codebase]
   - What's unclear: se a infra já provisiona Timescale em produção. [ASSUMED]
   - Recommendation: confirmar com a infra antes de fixar o schema definitivo. [ASSUMED]

2. **Qual contrato mínimo de leitura a Phase 5 precisa?**
   - What we know: Phase 5 exige dados persistidos e contratos mínimos. [VERIFIED: context]
   - What's unclear: se serão endpoints HTTP, adapters internos ou ambos. [ASSUMED]
   - Recommendation: alinhar com o plano da Phase 5 e limitar a superfície a reads. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime polling/persistence | ✓ | 22.22.0 | — [VERIFIED: env] |
| npm | Instalação de dependências | ✓ | 11.12.1 | — [VERIFIED: env] |
| PostgreSQL (server) | Persistência durável | ✓ | 16.13 | — [VERIFIED: env] |
| psql (client) | Operação/diagnóstico | ✓ | 16.13 | — [VERIFIED: env] |

**Missing dependencies with no fallback:**
- None identified. [VERIFIED: env]

**Missing dependencies with fallback:**
- None identified. [VERIFIED: env]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none detected | [VERIFIED: codebase] |
| Config file | none | [VERIFIED: codebase] |
| Quick run command | — | [ASSUMED] |
| Full suite command | — | [ASSUMED] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| MON-01 | Polling conforme intervalo e registro de coverage gap | integration | — | ❌ [ASSUMED] |
| INT-01 | Validação antes de persistir e dedupe por hash | unit/integration | — | ❌ [ASSUMED] |
| CFG-01 | Inventário com configs por target | unit | — | ❌ [ASSUMED] |
| ALT-01 | Persistência de alertas antes da entrega | integration | — | ❌ [ASSUMED] |

### Sampling Rate
- **Per task commit:** — [ASSUMED]
- **Per wave merge:** — [ASSUMED]
- **Phase gate:** Full suite green before `/gsd-verify-work` [ASSUMED]

### Wave 0 Gaps
- [ ] Estruturar framework de testes (Vitest/Jest) e scripts `test`. [ASSUMED]
- [ ] Criar testes mínimos para MON-01/INT-01/ALT-01. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | N/A (serviço interno) [ASSUMED] |
| V3 Session Management | no | N/A [ASSUMED] |
| V4 Access Control | yes | Restringir operações de escrita por role/admin. [ASSUMED] |
| V5 Input Validation | yes | Validar payloads de inventário e eventos. [ASSUMED] |
| V6 Cryptography | no | Hashing já é dado de entrada (não gerar crypto próprio). [ASSUMED] |

### Known Threat Patterns for Node + Postgres

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Queries parametrizadas no cliente `pg`. [ASSUMED] |
| Log/alert poisoning | Repudiation | Persistir eventos imutáveis com timestamps. [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- `src/inventory/targets.ts` - defaults de target/retention e loader placeholder. [VERIFIED: codebase]
- `src/polling/scheduler.ts` - loop de polling e timeout/fetch. [VERIFIED: codebase]
- `src/validation/lcr-validator.ts` - contrato de validação. [VERIFIED: codebase]
- `src/alerting/alert-policy.ts` - política e estado atual de alertas em memória. [VERIFIED: codebase]
- `src/storage/coverage-records.ts` - registros in-memory e schema SQL de referência. [VERIFIED: codebase]
- `.planning/phases/04-runtime-inventory-polling-persistence-wiring/04-CONTEXT.md` - decisões e limites da fase. [VERIFIED: context]
- `.planning/REQUIREMENTS.md` - requisitos MON-01/CFG-01/INT-01/ALT-01. [VERIFIED: requirements]

### Secondary (MEDIUM confidence)
- npm registry (`pg@8.20.0`, publicado em 2026-03-04). [VERIFIED: npm registry]

### Tertiary (LOW confidence)
- None. [VERIFIED: codebase]

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Postgres/pg verificados, mas Timescale e escolhas de ORM são assumidas. [ASSUMED]
- Architecture: MEDIUM - baseado nos módulos existentes, porém schema detalhado ainda é decisão de planejamento. [ASSUMED]
- Pitfalls: MEDIUM - diretamente das decisões da fase e riscos operacionais conhecidos. [ASSUMED]

**Research date:** 2026-04-06 [VERIFIED: env]
**Valid until:** 2026-05-06 (30 dias) [ASSUMED]
