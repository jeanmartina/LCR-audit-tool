import { buildExecutivePdf } from "../../../../exports/pdf";
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
  const result = await buildExecutivePdf(filters, principal);

  return new Response(result.bytes as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${result.fileName}"`,
    },
  });
}
