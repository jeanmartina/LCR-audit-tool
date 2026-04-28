import { rejectCrossOriginRequest } from "../../../../auth/request-security";
import { assertPlatformAdmin } from "../../../../auth/authorization";
import { savePlatformSettings } from "../../../../settings/preferences";

export async function POST(request: Request): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  try {
    await assertPlatformAdmin();
  } catch {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  await savePlatformSettings({
    predictiveEnabled: formData.get("predictiveEnabled") === "on",
    predictiveWindowDays: Number.parseInt(String(formData.get("predictiveWindowDays") || "3"), 10),
  });

  return new Response(null, { status: 303, headers: { Location: "/settings?saved=platform" } });
}
