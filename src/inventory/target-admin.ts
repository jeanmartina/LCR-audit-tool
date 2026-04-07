import { loadTargets, persistTarget, Target } from "./targets";

export async function upsertRuntimeTarget(target: Partial<Target>): Promise<Target> {
  return persistTarget(target);
}

export async function listRuntimeTargets(): Promise<Target[]> {
  return loadTargets();
}
