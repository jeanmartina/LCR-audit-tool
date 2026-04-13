import { assertPermission } from "../../../../../../auth/authorization";
import { issueInvite } from "../../../../../../auth/invitations";
import type { GroupRole } from "../../../../../../auth/config";

function isGroupRole(value: string): value is GroupRole {
  return value === "viewer" || value === "operator" || value === "group-admin";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
): Promise<Response> {
  const { groupId } = await context.params;

  try {
    const principal = await assertPermission("members.manage", groupId);
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const role = String(form.get("role") ?? "").trim();

    if (!email || !isGroupRole(role)) {
      return Response.json({ error: "valid-email-and-role-required" }, { status: 400 });
    }

    const invite = await issueInvite({
      actorUserId: principal.userId,
      email,
      groupId,
      role,
    });

    return Response.json({ invite }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "invite-create-failed" },
      { status: 403 }
    );
  }
}
