# LCR Availability Dashboard

## What This Is
Um dashboard para compliance e engenharia que monitora, em tempo próximo de real, a disponibilidade das listas de certificados revogados (LCR) associadas às listas de confiança no padrão europeu e quaisquer certificados individuais que o time queira acompanhar manualmente. Ele combina métricas de SLA, registros históricos das LCRs verificadas e alertas por e-mail configuráveis para garantir que nunca percamos a cobertura crítica.

## Core Value
Nunca deixar um certificado confiante operar sem cobertura válida de revogação — quando a lista falha, toda a equipe precisa saber imediatamente e ver quanto tempo ficou sem LCR.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **LCR-01**: O sistema monitora cada LCR e certificado individual em background e registra disponibilidade, tempo fora do ar e tempo até voltar disponível.
- [ ] **LCR-02**: Cada lista / certificado tem um intervalo de checagem configurável; quando nenhum intervalo é informado, usa o padrão de 10 minutos.
- [ ] **LCR-03**: Alertas por e-mail disparam até a LCR ficar disponível novamente, com destino padrão e overrides por lista, e podem ser desativados por admin.
- [ ] **LCR-04**: Sempre que uma LCR é baixada com sucesso o hash/assinatura é validado contra o emissor e comparado com o hash da última LCR válida; a LCR baixada é armazenada para uso futuro.
- [ ] **LCR-05**: Detecção de indisponibilidade considera qualquer HTTP status ≠ 200, timeouts configuráveis (segundos) e expirações sem substituto — isso marca o recurso como “fora do ar permanente” até a próxima lista.
- [ ] **LCR-06**: O sistema registra janelas de “cobertura perdida” (períodos inteiros sem nenhuma LCR válida) para alimentar relatórios de SLA.
- [ ] **LCR-07**: Métricas de SLA incluem tempo até a próxima LCR disponível, tempo total fora do ar e frequência das janelas de cobertura perdida, com visualização amigável em tabelas.
- [ ] **LCR-08**: Funcionalidade de nível admin permite adicionar certificados individuais aos mesmos fluxos de monitoramento de disponibilidade e alertas.

### Out of Scope

- [Cobertura de micro-segundos] — o monitor precisa trabalhar com minutos; resoluções menores não são necessárias para reportar o SLA.
- [Integrações externas] — disparo de alertas apenas por e-mail, sem SMS/push neste momento.
- [Painel móvel dedicado] — acesso se dá via dashboard web/tabelas para compliance/engenharia.

## Context
- Público principal: equipes de compliance e engenharia que respondem à disponibilidade de listas de confiança.
- Precisamos operar sobre listas TSL europeias e certificados avulsos, sempre verificando assinatura/hash e mantendo histórico das LCRs baixadas para usos futuros de verificação documental.
- O dashboard deve expor tabelas com SLA, status atual, cobertura perdida e permitir ajustes por lista (intervalo, destino de alertas, timeout).
- A infra deve rodar um mecanismo em background (daemon/cron) que puxa cada LCR no intervalo definido e mede o tempo absoluto até que a lista esteja novamente acessível.

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
| Priorizar cobertura contínua e registro histórico | É essencial saber exatamente quando as LCRs falham e ter as listas verificadas para futuros usos | — Pending |
| Alertas por e-mail até a recuperação | Já gera urgência e dá ao time de compliance/engenharia tempo real da indisponibilidade | — Pending |
| Permitir certificados individuais além das TSLs | Precisa suportar monitoramento de assets adjacentes sem depender de atualizações oficiais | — Pending |

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
*Last updated: 2026-04-05 after initial definition*
