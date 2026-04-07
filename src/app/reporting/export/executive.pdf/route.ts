import { buildExecutivePdf } from "../../../../exports/pdf";
import { parseReportFilters } from "../../../../reporting/query-state";

export async function GET(request: Request): Promise<Response> {
  const filters = parseReportFilters(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  const result = await buildExecutivePdf(filters);

  return new Response(result.bytes as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${result.fileName}"`,
    },
  });
}
