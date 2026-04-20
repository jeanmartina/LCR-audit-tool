import { assertAuthenticated } from "../../../../auth/authorization";
import { normalizeLocale } from "../../../../i18n";
import { saveUserSettings } from "../../../../settings/preferences";

function hasValue(formData: FormData, key: string, value: string): boolean {
  return formData.getAll(key).map(String).includes(value);
}

export async function POST(request: Request): Promise<Response> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    return Response.json({ error: "authentication-required" }, { status: 401 });
  }

  const formData = await request.formData();
  const theme = formData.get("preferredTheme") === "light" ? "light" : "dark";
  await saveUserSettings({
    userId: principal.userId,
    preferredLocale: normalizeLocale(String(formData.get("preferredLocale") ?? "")) ?? "en",
    preferredTheme: theme,
    predictiveEnabled: formData.get("predictiveEnabled") === "on",
    predictiveGroupIds: formData.getAll("predictiveGroupIds").map(String),
    predictiveSeverities: ["warning", "critical"].filter((value) =>
      hasValue(formData, "predictiveSeverities", value)
    ) as Array<"warning" | "critical">,
    predictiveTypes: ["upcoming-expiration", "publication-delayed"].filter((value) =>
      hasValue(formData, "predictiveTypes", value)
    ) as Array<"upcoming-expiration" | "publication-delayed">,
  });

  return new Response(null, { status: 303, headers: { Location: "/settings?saved=profile" } });
}
