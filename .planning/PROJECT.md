# LCR Availability Dashboard

## What This Is
Uma ferramenta de auditoria de LCRs para compliance e engenharia que monitora listas de certificados revogados e certificados avulsos, valida integridade, registra evidências históricas e expõe reporting exportável para provar cobertura de revogação.

## Core Value
Nunca deixar um certificado confiante operar sem cobertura válida de revogação — quando a lista falha, toda a equipe precisa saber imediatamente e ver quanto tempo ficou sem LCR.

## Current State

- **Shipped version:** `v1.0` em 2026-04-07
- **Monitoring runtime:** inventário persistido em banco, polling por alvo com intervalo/timeout configuráveis, persistência de polls, gaps, snapshots, validações e alertas
- **Integrity path:** validação de assinatura/hash, rejeição de artefatos inválidos e retenção de evidência para auditoria
- **Reporting:** dashboard com filtros, drill-down por alvo, timeline de auditoria, exports CSV e PDFs executivo/operacional
- **Readiness:** gate único com `npm run quality` e smoke real com Postgres via `npm run smoke:runtime`

## Requirements

### Validated

- ✓ **LCR-01**: Monitoramento contínuo de cada LCR/certificado com disponibilidade, downtime e recovery lag — `v1.0`
- ✓ **LCR-02**: Intervalo configurável por alvo com padrão global de 10 minutos — `v1.0`
- ✓ **LCR-03**: Alertas por e-mail com destino padrão/override, repetição até recuperação e desativação por admin — `v1.0`
- ✓ **LCR-04**: Validação de assinatura/hash e armazenamento histórico de LCRs verificadas — `v1.0`
- ✓ **LCR-05**: Indisponibilidade por HTTP != 200, timeout e expiração sem substituto — `v1.0`
- ✓ **LCR-06**: Registro de janelas de cobertura perdida para auditoria de SLA — `v1.0`
- ✓ **LCR-07**: Métricas de SLA e visualização por período — `v1.0`
- ✓ **LCR-08**: Administração de certificados avulsos no mesmo fluxo de monitoramento — `v1.0`

### Active

- [ ] **DIF-01**: Detectar falhas de publicação antes da expiração da próxima LCR para alertar antes da quebra do SLA.
- [ ] **DIF-02**: Consolidar múltiplos PKIs/TSLs com tags e visões agrupadas.
- [ ] **DIF-03**: Expor SLOs, burn rates e budgets de erro históricos para priorização executiva.

## Next Milestone Goals

- fechar alertas preditivos antes da expiração/publicação
- ampliar a visão consolidada para múltiplas fontes de confiança
- enriquecer a leitura executiva com burn rate, budgets e agregados históricos

<details>
<summary>v1.0 original definition snapshot</summary>

O escopo original partiu de um dashboard para compliance e engenharia com polling em background, cadência padrão de 10 minutos, alertas por e-mail recorrentes, armazenamento histórico de LCRs e foco em janelas de cobertura perdida.

</details>

### Out of Scope

- [Cobertura de micro-segundos] — o monitor precisa trabalhar com minutos; resoluções menores não são necessárias para reportar o SLA.
- [Integrações externas] — disparo de alertas apenas por e-mail, sem SMS/push neste momento.
- [Painel móvel dedicado] — acesso se dá via dashboard web/tabelas para compliance/engenharia.

## Context
- Público principal: equipes de compliance e engenharia que respondem à disponibilidade de listas de confiança.
- Precisamos operar sobre listas TSL europeias e certificados avulsos, sempre verificando assinatura/hash e mantendo histórico das LCRs baixadas para usos futuros de verificação documental.
- O dashboard agora expõe filtros, drill-down, exports CSV/PDF, timeline e métricas por período sobre dados persistidos.
- A stack atual já possui runtime com Postgres, rotas Next.js para reporting/export e smoke de readiness.

## Constraints
- **Interface**: foco em tabelas configuráveis para engenharia/compliance, sem necessidade de design mobile ou animações complexas.
- **Cadência padrão**: 10 minutos, mas configurável por lista; precisa haver um valor global para quando uma lista nova não traz um intervalo próprio.
- **Timeout configurável**: o componente que acessa a LCR deve respeitar um timeout de poucos segundos (ajustável) antes de marcar indisponível.
- **Assinatura/hash**: qualquer LCR baixada só é considerada válida após verificar assinatura contra o emissor; comparações subsequentes usam hash para detectar alterações.
- **Alertas**: e-mails disparam até a LCR voltar, com overrides por lista e opção de desativar alertas por administrador.
- **Cobertura perdida**: o sistema registra janelas de tempo sem nenhuma LCR disponível e exibe esses períodos para auditoria do SLA.
- **Configuração granular**: cada lista ou certificado pode ter intervalo, timeout, destinatários e frequência de alertas individuais, mesmo que venha de uma TSL de confiança.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Priorizar cobertura contínua e registro histórico | É essencial saber exatamente quando as LCRs falham e ter as listas verificadas para futuros usos | ✓ Good |
| Alertas por e-mail até a recuperação | Já gera urgência e dá ao time de compliance/engenharia tempo real da indisponibilidade | ✓ Good |
| Permitir certificados individuais além das TSLs | Precisa suportar monitoramento de assets adjacentes sem depender de atualizações oficiais | ✓ Good |
| Persistir alertas antes da entrega | A trilha de auditoria não pode depender do sucesso do canal de envio | ✓ Good |
| Usar Postgres como source of truth runtime | Inventory e evidence precisam sobreviver a restart e alimentar reporting real | ✓ Good |
| Separar PDF executivo e operacional | Compliance e gestão precisam de densidades diferentes sobre o mesmo escopo de dados | ✓ Good |

## Evolution
Este documento evolui a cada transição de fase e milestone.

**Depois de cada fase:**
1. Requisitos invalidados entram em *Out of Scope* com razão.
2. Requisitos validados migram para *Validated* com referência da fase.
3. Novos requisitos emergentes são adicionados a *Active*.
4. Decisões relevantes ganham novas linhas na tabela.
5. A seção “What This Is” é revisada para garantir precisão.

**Depois de cada milestone:**
1. Revisão completa de todas as seções.
2. Confirmar que o Core Value continua verdadeiro.
3. Auditar *Out of Scope* para manter a justificativa atualizada.
4. Atualizar o contexto com o estado atual das LCRs e alertas ativos.

---
*Last updated: 2026-04-07 after v1.0 milestone*
