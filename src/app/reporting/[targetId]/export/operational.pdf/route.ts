import { buildOperationalPdf } from "../../../../../exports/pdf";
import { assertCertificatePermission } from "../../../../../auth/authorization";
import { parseReportFilters } from "../../../../../reporting/query-state";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ targetId: string }> }
): Promise<Response> {
  const { targetId } = await params;
  let principal;
  try {
    principal = await assertCertificatePermission("export.view", targetId);
  } catch {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const filters = parseReportFilters(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  const result = await buildOperationalPdf(targetId, filters, principal);

  return new Response(result.bytes as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${result.fileName}"`,
    },
  });
}
