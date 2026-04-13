import { assertPlatformAdmin } from "../../../../auth/authorization";
import { assignGroupRole, createGroup } from "../../../../auth/models";

export async function POST(request: Request): Promise<Response> {
  try {
    const principal = await assertPlatformAdmin();
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();

    if (!name || !slug) {
      return Response.json({ error: "name-and-slug-required" }, { status: 400 });
    }

    const group = await createGroup({
      name,
      slug,
      createdByUserId: principal.userId,
    });

    await assignGroupRole({
      actorUserId: principal.userId,
      userId: principal.userId,
      groupId: group.id,
      role: "group-admin",
    });

    return Response.json({ group }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "group-create-failed" },
      { status: 403 }
    );
  }
}
