function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderFilters(filtersApplied, labels) {
  const entries = Object.entries(filtersApplied || {});
  if (entries.length === 0) {
    return `<p>${labels.noFilters}</p>`;
  }

  return `<ul>${entries
    .map(([key, value]) => `<li><strong>${escapeHtml(labels.filterLabels?.[key] ?? key)}:</strong> ${escapeHtml(value)}</li>`)
    .join("")}</ul>`;
}

function renderSection(title, body) {
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      ${body}
    </section>
  `;
}

function renderExecutiveList(items) {
  return `<ul>${(items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderExecutiveReportHtml(input) {
  const { generatedAt, filtersApplied, summary, labels } = input;

  const derivedSourceRows = [
    `${labels.derivedSources?.ocsp ?? "OCSP"}: ${summary.derivedSourceHealth?.ocsp ?? "-"}`,
    `${labels.derivedSources?.policyDocuments ?? "Policy documents"}: ${summary.derivedSourceHealth?.policyDocuments ?? "-"}`,
  ];

  return `
    <html>
      <body>
        <h1>${escapeHtml(labels.title)}</h1>
        ${renderSection(
          labels.sections.scope ?? labels.scope,
          `<p>${escapeHtml(labels.scope)}</p>
           <p><strong>${escapeHtml(labels.generatedAt)}:</strong> ${escapeHtml(generatedAt)}</p>
           <p><strong>${escapeHtml(labels.period)}:</strong> ${escapeHtml(summary.dateRange.from)} -> ${escapeHtml(summary.dateRange.to)}</p>
           <div><strong>${escapeHtml(labels.sections.filters)}:</strong>${renderFilters(filtersApplied, labels)}</div>`
        )}
        ${renderSection(
          labels.sections.summary,
          `<ul>
            <li>${escapeHtml(labels.metrics.targets)}: ${summary.totalTargets}</li>
            <li>${escapeHtml(labels.metrics.healthy)}: ${summary.healthyTargets}</li>
            <li>${escapeHtml(labels.metrics.degraded)}: ${summary.degradedTargets}</li>
            <li>${escapeHtml(labels.metrics.offline)}: ${summary.offlineTargets}</li>
            <li>${escapeHtml(labels.metrics.atRisk)}: ${summary.atRiskTargets}</li>
            <li>${escapeHtml(labels.metrics.averageSla)}: ${escapeHtml(summary.averageSlaPercent)}</li>
            <li>${escapeHtml(labels.metrics.openAlerts)}: ${summary.openAlerts}</li>
            <li>${escapeHtml(labels.metrics.upcomingExpirations)}: ${summary.upcomingExpirations}</li>
          </ul>`
        )}
        ${renderSection(labels.sections.derivedSourceStatus ?? "Derived source status", renderExecutiveList(derivedSourceRows))}
        ${renderSection(labels.sections.topRisks, renderExecutiveList(summary.topRisks))}
        ${renderSection(labels.sections.trend, renderExecutiveList(summary.trend))}
        ${renderSection(labels.sections.finalNotes ?? "Final notes", `<p>${escapeHtml(labels.finalNotesBody ?? "This report is generated from executive summary data.")}</p>`)}
      </body>
    </html>
  `;
}

function renderOperationalReportHtml(input) {
  const {
    generatedAt,
    filtersApplied,
    target,
    summary,
    coverageWindows,
    alertHistory,
    validationFailures,
    snapshots,
    timeline,
    labels,
  } = input;

  return `
    <html>
      <body>
        <h1>${labels.title}</h1>
        <p>${labels.generatedAt}: ${generatedAt}</p>
        <p>${labels.target}: ${escapeHtml(target)}</p>
        <p>${labels.scope}</p>
        ${renderSection(labels.sections.filters, renderFilters(filtersApplied, labels))}
        ${renderSection(
          labels.sections.summary,
          `<ul>
            <li>${labels.metrics.status}: ${summary.currentStatus}</li>
            <li>${labels.metrics.latestIncident}: ${summary.latestIncidentAt}</li>
            <li>${labels.metrics.sla}: ${summary.slaPercent}</li>
            <li>${labels.metrics.nextExpiration}: ${summary.nextExpiration}</li>
            <li>${labels.metrics.openAlerts}: ${summary.openAlerts}</li>
          </ul>`
        )}
        ${renderSection(labels.sections.timeline, `<ul>${timeline.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`)}
        ${renderSection(labels.sections.coverage, `<ul>${coverageWindows.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`)}
        ${renderSection(labels.sections.alerts, `<ul>${alertHistory.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`)}
        ${renderSection(
          labels.sections.validation,
          `<ul>${validationFailures.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        )}
        ${renderSection(labels.sections.snapshots, `<ul>${snapshots.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`)}
      </body>
    </html>
  `;
}

module.exports = {
  renderExecutiveReportHtml,
  renderOperationalReportHtml,
};
