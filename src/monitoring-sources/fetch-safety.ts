import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_FETCH_TIMEOUT_MS = 30000;
const DEFAULT_MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_EXTRACTED_TEXT_BYTES = 200000;
const DEFAULT_MAX_REDIRECTS = 3;

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function getMonitoringSourceFetchTimeoutMs(): number {
  return envNumber("MONITORING_SOURCE_FETCH_TIMEOUT_MS", DEFAULT_FETCH_TIMEOUT_MS);
}

export function getMonitoringSourceMaxDocumentBytes(): number {
  return envNumber("MONITORING_SOURCE_MAX_DOCUMENT_BYTES", DEFAULT_MAX_DOCUMENT_BYTES);
}

export function getMonitoringSourceMaxExtractedTextBytes(): number {
  return envNumber("MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES", DEFAULT_MAX_EXTRACTED_TEXT_BYTES);
}

export function getMonitoringSourceMaxRedirects(): number {
  return envNumber("MONITORING_SOURCE_MAX_REDIRECTS", DEFAULT_MAX_REDIRECTS);
}

export function isMonitoringSourceLocalhostAllowed(): boolean {
  return process.env.MONITORING_SOURCE_ALLOW_LOCALHOST === "true";
}

function isLocalhostName(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isPrivateAddress(address: string): boolean {
  if (address === "::" || address === "::1") return true;
  const lowered = address.toLowerCase();
  if (lowered.startsWith("fe80:") || lowered.startsWith("fc") || lowered.startsWith("fd")) return true;
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b, c, d] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a >= 224 && a <= 239) ||
    (a === 255 && b === 255 && c === 255 && d === 255)
  );
}

async function assertPublicHostname(parsed: URL): Promise<void> {
  if (isLocalhostName(parsed.hostname)) {
    if (isMonitoringSourceLocalhostAllowed()) return;
    throw new Error("monitoring-source-url-private-address-blocked");
  }
  const records = isIP(parsed.hostname)
    ? [{ address: parsed.hostname }]
    : await lookup(parsed.hostname, { all: true, verbatim: true });
  if (records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("monitoring-source-url-private-address-blocked");
  }
}

export async function assertPublicMonitoringSourceUrl(url: string): Promise<URL> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("monitoring-source-url-invalid-scheme");
  }
  await assertPublicHostname(parsed);
  return parsed;
}

export async function fetchMonitoringSourceBytes(url: string): Promise<{
  finalUrl: string;
  status: number;
  contentType: string | null;
  contentLength: number;
  body: Buffer;
  durationMs: number;
}> {
  const startedAt = Date.now();
  let currentUrl = url;
  let response: Response | null = null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getMonitoringSourceFetchTimeoutMs());
  try {
    for (let redirects = 0; redirects <= getMonitoringSourceMaxRedirects(); redirects += 1) {
      const parsed = await assertPublicMonitoringSourceUrl(currentUrl);
      response = await fetch(parsed, { signal: controller.signal, redirect: "manual" });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location) throw new Error("monitoring-source-redirect-missing-location");
      if (redirects === getMonitoringSourceMaxRedirects()) {
        throw new Error("monitoring-source-too-many-redirects");
      }
      currentUrl = new URL(location, parsed).toString();
      await assertPublicMonitoringSourceUrl(currentUrl);
    }
    if (!response) throw new Error("monitoring-source-fetch-failed");
    if (!response.ok) throw new Error(`monitoring-source-fetch-failed:${response.status}`);
    const maxBytes = getMonitoringSourceMaxDocumentBytes();
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > maxBytes) throw new Error("monitoring-source-document-too-large");
    const body = Buffer.from(await response.arrayBuffer());
    if (body.byteLength > maxBytes) throw new Error("monitoring-source-document-too-large");
    return {
      finalUrl: currentUrl,
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentLength: body.byteLength,
      body,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
