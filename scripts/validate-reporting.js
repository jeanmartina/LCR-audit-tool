const fs = require("fs");
const {
  createPdfBytesFromHtml,
  hasPdfSignature,
  stripHtmlToText,
} = require("../src/exports/pdf-engine.js");
const {
  renderExecutiveReportHtml,
  renderOperationalReportHtml,
} = require("../src/exports/pdf-templates.js");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(content, fragment, message) {
  if (!content.includes(fragment)) {
    throw new Error(message);
  }
}

function validateReadModels() {
  const readModels = read("src/reporting/read-models.ts");
  const queryState = read("src/reporting/query-state.ts");
  const timeline = read("src/reporting/timeline.ts");

  assertIncludes(queryState, 'mode?: ReportMode', "Missing report mode filter");
  assertIncludes(queryState, 'trustSource?: string', "Missing trustSource filter");
  assertIncludes(queryState, 'pki?: string', "Missing pki filter");
  assertIncludes(queryState, 'jurisdiction?: string', "Missing jurisdiction filter");
  assertIncludes(queryState, 'predictiveType?: PredictiveFilterType', "Missing predictive type filter");
  assertIncludes(readModels, 'rowType: "certificate" | "crl"', "Missing certificate/CRL row model");
  assertIncludes(readModels, 'predictiveSeverity', "Missing predictive state in dashboard rows");
  assertIncludes(readModels, 'structuredTags: StructuredTags', "Missing structured tag support");
  assertIncludes(readModels, 'buildCrlDashboardRows', "Missing CRL reporting projection");
  assertIncludes(timeline, 'type: "predictive"', "Timeline is missing predictive events");
  console.log("Reporting read models ready");
}

function validateDashboard() {
  const dashboard = read("src/app/reporting/page.tsx");
  const dashboardCsvRoute = read("src/app/reporting/export/dashboard.csv/route.ts");
  const executivePdfRoute = read("src/app/reporting/export/executive.pdf/route.ts");

  assertIncludes(dashboard, 't("reporting.title")', "Dashboard heading missing");
  assertIncludes(dashboard, 't("reporting.mode.certificate")', "Certificate mode switch missing");
  assertIncludes(dashboard, 't("reporting.mode.crl")', "CRL mode switch missing");
  assertIncludes(dashboard, 't("reporting.filter.trustSource")', "Structured tag filter missing");
  assertIncludes(dashboard, 't("reporting.exportExecutivePdf")', "Executive PDF action missing");
  assertIncludes(dashboard, 't("reporting.settings")', "Settings page link missing");
  assertIncludes(dashboardCsvRoute, "exportDashboardCsv(filters, principal)", "Dashboard CSV route not principal-aware");
  assertIncludes(executivePdfRoute, "buildExecutivePdf(filters, principal)", "Executive PDF route not principal-aware");
  console.log("Reporting dashboard wired");
}

function validateDetail() {
  const detail = read("src/app/reporting/[targetId]/page.tsx");
  const pollsRoute = read("src/app/reporting/[targetId]/export/polls.csv/route.ts");
  const coverageRoute = read("src/app/reporting/[targetId]/export/coverage-gaps.csv/route.ts");
  const alertsRoute = read("src/app/reporting/[targetId]/export/alerts.csv/route.ts");
  const snapshotsRoute = read("src/app/reporting/[targetId]/export/snapshots.csv/route.ts");
  const operationalRoute = read("src/app/reporting/[targetId]/export/operational.pdf/route.ts");

  assertIncludes(detail, 't("reporting.detail.predictiveState")', "Detail summary block missing predictive state");
  assertIncludes(detail, 't("reporting.detail.derivedCrls")', "Derived CRLs section missing");
  assertIncludes(detail, 't("common.actions.apply")', "Detail Apply action missing");
  assertIncludes(detail, 't("common.actions.clear")', "Detail Clear action missing");
  assertIncludes(detail, 't(`reporting.tab.${tab.key}`)', "Timeline tab missing");
  assertIncludes(detail, 't("reporting.detail.export.pdf")', "Operational PDF action missing");
  assertIncludes(pollsRoute, "assertCertificatePermission", "Poll export route is not certificate-scoped");
  assertIncludes(coverageRoute, "assertCertificatePermission", "Coverage route is not certificate-scoped");
  assertIncludes(alertsRoute, "assertCertificatePermission", "Alert route is not certificate-scoped");
  assertIncludes(snapshotsRoute, "assertCertificatePermission", "Snapshot route is not certificate-scoped");
  assertIncludes(operationalRoute, "assertCertificatePermission", "Operational PDF route is not certificate-scoped");
  console.log("Reporting detail wired");
}

function validateSettings() {
  const layout = read("src/app/layout.tsx");
  const settingsPage = read("src/app/settings/page.tsx");
  const profileRoute = read("src/app/api/settings/profile/route.ts");

  assertIncludes(layout, "preferredTheme", "App shell is not theme-aware");
  assertIncludes(settingsPage, 't("settings.title")', "Settings page heading missing");
  assertIncludes(settingsPage, 't("settings.theme.dark")', "Dark theme option missing");
  assertIncludes(settingsPage, 't("settings.theme.light")', "Light theme option missing");
  assertIncludes(settingsPage, 'name="preferredLocale"', "Locale preference option missing");
  assertIncludes(settingsPage, 't("settings.savePreferences")', "User settings form missing");
  assertIncludes(profileRoute, "saveUserSettings", "Profile settings route not wired");
  console.log("Settings and theme surface wired");
}

function validatePdfBytes() {
  const executiveHtml = renderExecutiveReportHtml({
    generatedAt: "2026-04-07T00:00:00.000Z",
    filtersApplied: { status: "offline", mode: "crl" },
    summary: {
      totalTargets: 2,
      healthyTargets: 1,
      degradedTargets: 0,
      offlineTargets: 1,
      averageSlaPercent: "99.10",
      openAlerts: 3,
      upcomingExpirations: 1,
      dateRange: {
        from: "2026-03-08T00:00:00.000Z",
        to: "2026-04-07T00:00:00.000Z",
      },
    },
    labels: {
      title: "Executive availability report",
      generatedAt: "Generated at",
      scope: "Report scope: dashboard executive summary",
      period: "Period",
      noFilters: "No filters applied",
      filterLabels: { status: "Status", mode: "Mode" },
      sections: {
        filters: "Filters applied",
        summary: "Availability summary",
        posture: "SLA and alert posture",
      },
      metrics: {
        targets: "Targets",
        healthy: "Healthy",
        degraded: "Degraded",
        offline: "Offline",
        averageSla: "Average SLA",
        openAlerts: "Open alerts",
        upcomingExpirations: "Upcoming expirations",
      },
    },
  });
  const bytes = createPdfBytesFromHtml(executiveHtml);

  if (!hasPdfSignature(bytes)) {
    throw new Error("Generated bytes do not contain a valid PDF signature");
  }

  console.log("Reporting PDFs are real");
}

function validatePdfRoutes() {
  const executivePdfRoute = read("src/app/reporting/export/executive.pdf/route.ts");
  const operationalPdfRoute = read("src/app/reporting/[targetId]/export/operational.pdf/route.ts");

  assertIncludes(executivePdfRoute, "\"content-type\": \"application/pdf\"", "Executive PDF route does not return application/pdf");
  assertIncludes(operationalPdfRoute, "\"content-type\": \"application/pdf\"", "Operational PDF route does not return application/pdf");
  assertIncludes(executivePdfRoute, "result.bytes", "Executive PDF route is not returning PDF bytes");
  assertIncludes(operationalPdfRoute, "result.bytes", "Operational PDF route is not returning PDF bytes");
  console.log("Reporting PDF routes wired");
}

function validatePdfAudit() {
  const pdfModule = read("src/exports/pdf.ts");
  const executiveText = stripHtmlToText(
    renderExecutiveReportHtml({
      generatedAt: "2026-04-07T00:00:00.000Z",
      filtersApplied: { owner: "compliance", mode: "certificate" },
      summary: {
        totalTargets: 5,
        healthyTargets: 3,
        degradedTargets: 1,
        offlineTargets: 1,
        averageSlaPercent: "98.52",
        openAlerts: 4,
        upcomingExpirations: 2,
        dateRange: {
          from: "2026-03-08T00:00:00.000Z",
          to: "2026-04-07T00:00:00.000Z",
        },
      },
      labels: {
        title: "Executive availability report",
        generatedAt: "Generated at",
        scope: "Report scope: dashboard executive summary",
        period: "Period",
        noFilters: "No filters applied",
        filterLabels: { owner: "Owner", mode: "Mode" },
        sections: {
          filters: "Filters applied",
          summary: "Availability summary",
          posture: "SLA and alert posture",
        },
        metrics: {
          targets: "Targets",
          healthy: "Healthy",
          degraded: "Degraded",
          offline: "Offline",
          averageSla: "Average SLA",
          openAlerts: "Open alerts",
          upcomingExpirations: "Upcoming expirations",
        },
      },
    })
  );
  const operationalText = stripHtmlToText(
    renderOperationalReportHtml({
      generatedAt: "2026-04-07T00:00:00.000Z",
      filtersApplied: { severity: "critical" },
      target: "sample-certificate",
      summary: {
        currentStatus: "offline",
        latestIncidentAt: "2026-04-07T00:00:00.000Z",
        slaPercent: "97.00",
        nextExpiration: "2026-04-10T00:00:00.000Z",
        openAlerts: 2,
      },
      timeline: ["2026-04-07T00:00:00.000Z - predictive - warning upcoming-expiration"],
      coverageWindows: ["2026-04-06T23:00:00.000Z -> open (3600000ms)"],
      alertHistory: ["2026-04-07T00:00:00.000Z - critical - ops@example.com"],
      validationFailures: ["2026-04-07T00:00:00.000Z - invalid signature - abc123"],
      snapshots: ["2026-04-07T00:00:00.000Z - abc123 - valid"],
      labels: {
        title: "Operational evidence report",
        generatedAt: "Generated at",
        target: "Target",
        scope: "Report scope: target operational evidence",
        noFilters: "No filters applied",
        filterLabels: { severity: "Severity" },
        sections: {
          filters: "Filters applied",
          summary: "Target summary",
          timeline: "Timeline",
          coverage: "Coverage gaps",
          alerts: "Alerts",
          validation: "Validation failures",
          snapshots: "Snapshots",
        },
        metrics: {
          status: "Status",
          latestIncident: "Latest incident",
          sla: "SLA",
          nextExpiration: "Next expiration",
          openAlerts: "Open alerts",
        },
      },
    })
  );

  assertIncludes(pdfModule, "createPdfBytesFromHtml", "PDF module is not using the real PDF renderer");
  assertIncludes(executiveText, "Executive availability report", "Executive PDF content is missing its report heading");
  assertIncludes(executiveText, "Filters applied", "Executive PDF content is missing applied filters");
  assertIncludes(operationalText, "Operational evidence report", "Operational PDF content is missing its report heading");
  assertIncludes(operationalText, "Timeline", "Operational PDF content is missing the timeline section");
  assertIncludes(operationalText, "Validation failures", "Operational PDF content is missing validation content");
  console.log("Reporting PDF audit gap closed");
}

const mode = process.argv[2];

if (mode === "read-models") {
  validateReadModels();
} else if (mode === "dashboard") {
  validateDashboard();
} else if (mode === "detail") {
  validateDetail();
} else if (mode === "settings") {
  validateSettings();
} else if (mode === "pdf-bytes") {
  validatePdfBytes();
} else if (mode === "pdf-routes") {
  validatePdfRoutes();
} else if (mode === "pdf-audit") {
  validatePdfAudit();
} else {
  throw new Error(`Unknown validation mode: ${mode}`);
}
