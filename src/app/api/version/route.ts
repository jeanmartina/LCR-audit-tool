import { resolveRuntimeVersion } from "../../../lib/runtime-version";

export async function GET(): Promise<Response> {
  return Response.json({ version: resolveRuntimeVersion() });
}
