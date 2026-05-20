const SEMVER_CORE = /^v?(\d+)\.(\d+)\.(\d+)$/;

function normalizeRuntimeVersion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = SEMVER_CORE.exec(trimmed);
  if (!match) return null;
  return `v${match[1]}.${match[2]}.${match[3]}`;
}

export function resolveRuntimeVersion(): string | null {
  const appVersion = normalizeRuntimeVersion(process.env.APP_VERSION);
  if (appVersion) return appVersion;

  const packageVersion = normalizeRuntimeVersion(process.env.npm_package_version);
  if (packageVersion) return packageVersion;

  return null;
}
