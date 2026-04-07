function renderFilters(filtersApplied) {
  const entries = Object.entries(filtersApplied || {});
  if (entries.length === 0) {
    return "<p>No filters applied</p>";
  }

  return `<ul>${entries
    .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
    .join("")}</ul>`;
}

function renderSection(title, body) {
  return `
    <section>
      <h2>${title}</h2>
      ${body}
    </section>
  `;
}

function renderExecutiveReportHtml(input) {
  const {
    generatedAt,
    filtersApplied,
    summary,
  } = input;

  return `
    <html>
      <body>
        <h1>Executive availability report</h1>
        <p>Generated at: ${generatedAt}</p>
        <p>Report scope: dashboard executive summary</p>
        <p>Period: ${summary.dateRange.from} -> ${summary.dateRange.to}</p>
        ${renderSection("Filters applied", renderFilters(filtersApplied))}
        ${renderSection(
          "Availability summary",
          `<ul>
            <li>Targets: ${summary.totalTargets}</li>
            <li>Healthy: ${summary.healthyTargets}</li>
            <li>Degraded: ${summary.degradedTargets}</li>
            <li>Offline: ${summary.offlineTargets}</li>
          </ul>`
        )}
        ${renderSection(
          "SLA and alert posture",
          `<ul>
            <li>Average SLA: ${summary.averageSlaPercent}</li>
            <li>Open alerts: ${summary.openAlerts}</li>
            <li>Upcoming expirations: ${summary.upcomingExpirations}</li>
          </ul>`
        )}
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
  } = input;

  return `
    <html>
      <body>
        <h1>Operational evidence report</h1>
        <p>Generated at: ${generatedAt}</p>
        <p>Target: ${target}</p>
        <p>Report scope: target operational evidence</p>
        ${renderSection("Filters applied", renderFilters(filtersApplied))}
        ${renderSection(
          "Target summary",
          `<ul>
            <li>Status: ${summary.currentStatus}</li>
            <li>Latest incident: ${summary.latestIncidentAt}</li>
            <li>SLA: ${summary.slaPercent}</li>
            <li>Next expiration: ${summary.nextExpiration}</li>
            <li>Open alerts: ${summary.openAlerts}</li>
          </ul>`
        )}
        ${renderSection("Timeline", `<ul>${timeline.map((item) => `<li>${item}</li>`).join("")}</ul>`)}
        ${renderSection("Coverage gaps", `<ul>${coverageWindows.map((item) => `<li>${item}</li>`).join("")}</ul>`)}
        ${renderSection("Alerts", `<ul>${alertHistory.map((item) => `<li>${item}</li>`).join("")}</ul>`)}
        ${renderSection(
          "Validation failures",
          `<ul>${validationFailures.map((item) => `<li>${item}</li>`).join("")}</ul>`
        )}
        ${renderSection("Snapshots", `<ul>${snapshots.map((item) => `<li>${item}</li>`).join("")}</ul>`)}
      </body>
    </html>
  `;
}

module.exports = {
  renderExecutiveReportHtml,
  renderOperationalReportHtml,
};
