# Requirements: LCR Availability Dashboard

**Defined:** 2026-04-05
**Core Value:** Nunca deixar um certificado confiante operar sem cobertura válida de revogação

## v1 Requirements

### Monitoring & Coverage
- [ ] **MON-01**: O sistema poll dos a cada LCR/certificado no intervalo configurado (10 min padrão quando nada é especificado) e registra disponibilidade, tempo fora do ar e métricas de cobertura perdida até reaparecer uma lista válida.
- [ ] **MON-02**: Cada janela sem nenhuma LCR válida gera um registro de “cobertura perdida” (start timestamp, duração, listas afetadas) para alimentar relatórios de SLA.

### Integrity & Storage
- [ ] **INT-01**: Cada LCR baixada passa por validação de assinatura e hash (comparando com o hash da última LCR verificada) antes de ser persistida; os blobs históricos ficam disponíveis para futuras verificações.
- [ ] **CFG-01**: Uma camada de inventário permite adicionar certificados individuais e listas TSL sociais, atribuir intervalo, timeout e regras de alerta específicas e editar metadados sem editar código.

### Alerting & SLA
- [ ] **ALT-01**: Alertas por e-mail disparam sempre que o status HTTP ≠ 200, o timeout configurado expira ou uma lista expira sem substituto; os alertas persistem até a cobertura voltar, respeitam overrides por lista, podem ser desativados por admin e usam cooldowns para evitar tempestades.
- [ ] **ALT-02**: Métricas SLA (disponibilidade %, MTTR, janelas de cobertura perdida) são calculadas e expostas para cada lista/agregação, com dados suficientes para enviar alertas de warning (por ex. 50% do orçamento) antes de um SLA completo ser violado.

### Reporting & Compliance
- [ ] **REP-01**: Dashboard de compliance exibe tabelas coloridas, drill-downs e exportações (CSV/PDF) com status de cada lista, indicadores SLA e históricos de alertas para auditoria.
- [ ] **REP-02**: Logs de alertas, registros de cobertura perdida e snapshots de LCR são disponibilizados para justificar SLA e apoiar auditorias quando for preciso mostrar evidências de cobertura.

## v2 Requirements

### Differentiators
- **DIF-01**: Implementar detecção de falhas de publicação antes da expiração (pre-failure alerts) para dar tempo de recuperação sem quebrar SLAs.
- **DIF-02**: Adicionar visão consolidada de múltiplos PKIs/TSLs com tags (ex.: europeia vs terceiros) para harmonizar relatórios em grandes organizações.
- **DIF-03**: Expor SLOs, burn rates e budgets de erro históricos para ajudar liderança a priorizar incidentes e validar que a cobertura está dentro de limites aceitáveis.

## Out of Scope
| Feature | Reason |
|---|---|
| Cobertura de micro-segundos | O SLA se mede em minutos; qualquer granularidade menor gera custo desproporcional pelo ganho de visibilidade |
| Integrações de notificação fora do e-mail (SMS/push) | O foco inicial é compliance + engenharia usando e-mail; canais adicionais ficam para etapas futuras |
| Painel móvel dedicado | O consumo será via desktop/tablets pelo time de compliance e engenharia; não há necessidade de um app separado |

## Traceability
| Requirement | Phase | Status |
|-------------|-------|--------|
| MON-01 | Phase 1 | Pending |
| MON-02 | Phase 1 | Pending |
| INT-01 | Phase 1 | Pending |
| CFG-01 | Phase 1 | Pending |
| ALT-01 | Phase 2 | Pending |
| ALT-02 | Phase 2 | Pending |
| REP-01 | Phase 3 | Pending |
| REP-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after initial definition*
