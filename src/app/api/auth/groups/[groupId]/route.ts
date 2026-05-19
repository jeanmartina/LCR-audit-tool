import { rejectCrossOriginRequest } from "../../../../../auth/request-security";
import { assertPermission } from "../../../../../auth/authorization";
import { deleteGroup, updateGroup } from "../../../../../auth/models";

function getMethodOverride(formData: FormData): string {
  return String(formData.get("_method") ?? "").trim().toUpperCase();
}

function redirectBack(): Response {
  return new Response(null, { status: 303, headers: { Location: "/settings?tab=groups&saved=group" } });
}

async function handlePatch(request: Request, groupId: string): Promise<Response> {
  try {
    const principal = await assertPermission("members.manage", groupId);
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();
    if (!name || !slug) {
      return Response.json({ error: "name-and-slug-required" }, { status: 400 });
    }
    await updateGroup({
      actorUserId: principal.userId,
      groupId,
      name,
      slug,
    });
    return redirectBack();
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "group-update-failed" }, { status: 403 });
  }
}

async function handleDelete(groupId: string): Promise<Response> {
  try {
    const principal = await assertPermission("members.manage", groupId);
    await deleteGroup({
      actorUserId: principal.userId,
      groupId,
    });
    return redirectBack();
  } catch (error) {
    const message = error instanceof Error ? error.message : "group-delete-failed";
    const status = message === "group-delete-blocked" ? 409 : 403;
    return Response.json({ error: message }, { status });
  }
}

export async function POST(request: Request, context: { params: Promise<{ groupId: string }> }): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { groupId } = await context.params;
  const form = await request.clone().formData();
  const method = getMethodOverride(form);
  if (method === "DELETE") {
    return handleDelete(groupId);
  }
  return handlePatch(request, groupId);
}

export async function PATCH(request: Request, context: { params: Promise<{ groupId: string }> }): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { groupId } = await context.params;
  return handlePatch(request, groupId);
}

export async function DELETE(request: Request, context: { params: Promise<{ groupId: string }> }): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { groupId } = await context.params;
  return handleDelete(groupId);
}
