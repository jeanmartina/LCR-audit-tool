import { exportDashboardCsv } from "../../../../exports/csv";
import { assertAuthenticated } from "../../../../auth/authorization";
import { parseReportFilters } from "../../../../reporting/query-state";

export async function GET(request: Request): Promise<Response> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    return Response.json({ error: "authentication-required" }, { status: 401 });
  }
  const filters = parseReportFilters(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  const result = await exportDashboardCsv(filters, principal);

  return new Response(result.content, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${result.fileName}"`,
    },
  });
}
