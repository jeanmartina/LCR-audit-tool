import { exportAlertHistoryCsv } from "../../../../../exports/csv";
import { parseReportFilters } from "../../../../../reporting/query-state";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ targetId: string }> }
): Promise<Response> {
  const { targetId } = await params;
  const filters = parseReportFilters(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  const result = await exportAlertHistoryCsv(targetId, filters);

  return new Response(result.content, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${result.fileName}"`,
    },
  });
}
