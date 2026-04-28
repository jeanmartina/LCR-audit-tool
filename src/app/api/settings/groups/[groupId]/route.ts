import { rejectCrossOriginRequest } from "../../../../../auth/request-security";
import { assertPermission } from "../../../../../auth/authorization";
import { saveGroupSettings } from "../../../../../settings/preferences";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { groupId } = await params;
  try {
    await assertPermission("members.manage", groupId);
  } catch {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  await saveGroupSettings({
    groupId,
    defaultTrustSource: String(formData.get("defaultTrustSource") || "").trim() || null,
    defaultPki: String(formData.get("defaultPki") || "").trim() || null,
    defaultJurisdiction: String(formData.get("defaultJurisdiction") || "").trim() || null,
    predictiveEnabled: formData.get("predictiveEnabled") === "on",
    predictiveWindowDays: Number.parseInt(String(formData.get("predictiveWindowDays") || "3"), 10),
  });

  return new Response(null, { status: 303, headers: { Location: "/settings?saved=group" } });
}
