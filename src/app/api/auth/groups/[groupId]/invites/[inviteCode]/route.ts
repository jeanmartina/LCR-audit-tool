import { rejectCrossOriginRequest } from "../../../../../../../auth/request-security";
import { assertPermission } from "../../../../../../../auth/authorization";
import { editPendingInvite, resendInvite, revokeInvite } from "../../../../../../../auth/invitations";
import type { GroupRole } from "../../../../../../../auth/config";

function isGroupRole(value: string): value is GroupRole {
  return value === "viewer" || value === "operator" || value === "group-admin";
}

function redirectBack(groupId: string): Response {
  return new Response(null, { status: 303, headers: { Location: `/settings?tab=invites&saved=invite&groupId=${groupId}` } });
}

function getMethodOverride(formData: FormData): string {
  return String(formData.get("_method") ?? "").trim().toUpperCase();
}

async function handlePatch(request: Request, groupId: string, inviteCode: string): Promise<Response> {
  try {
    const principal = await assertPermission("members.manage", groupId);
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const role = String(form.get("role") ?? "").trim();
    const expiresAtInput = String(form.get("expiresAt") ?? "").trim();
    const expiresAt = expiresAtInput ? new Date(expiresAtInput) : null;
    if (!email || !isGroupRole(role) || !expiresAt || Number.isNaN(expiresAt.getTime())) {
      return Response.json({ error: "valid-email-role-and-expiresAt-required" }, { status: 400 });
    }
    await editPendingInvite({
      actorUserId: principal.userId,
      inviteCode,
      email,
      role,
      expiresAt,
    });
    return redirectBack(groupId);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invite-update-failed" }, { status: 403 });
  }
}

async function handlePost(groupId: string, inviteCode: string): Promise<Response> {
  try {
    const principal = await assertPermission("members.manage", groupId);
    await resendInvite({
      actorUserId: principal.userId,
      inviteCode,
    });
    return redirectBack(groupId);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invite-resend-failed" }, { status: 403 });
  }
}

async function handleDelete(groupId: string, inviteCode: string): Promise<Response> {
  try {
    const principal = await assertPermission("members.manage", groupId);
    await revokeInvite({
      actorUserId: principal.userId,
      inviteCode,
    });
    return redirectBack(groupId);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invite-revoke-failed" }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string; inviteCode: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { groupId, inviteCode } = await context.params;
  const form = await request.clone().formData();
  const method = getMethodOverride(form);
  if (method === "DELETE") {
    return handleDelete(groupId, inviteCode);
  }
  if (method === "PATCH") {
    return handlePatch(request, groupId, inviteCode);
  }
  return handlePost(groupId, inviteCode);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ groupId: string; inviteCode: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { groupId, inviteCode } = await context.params;
  return handlePatch(request, groupId, inviteCode);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ groupId: string; inviteCode: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { groupId, inviteCode } = await context.params;
  return handleDelete(groupId, inviteCode);
}
