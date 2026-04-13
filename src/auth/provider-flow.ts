import { randomBytes, createPublicKey, webcrypto } from "crypto";
import { URLSearchParams } from "url";
import { normalizeLocale } from "../i18n";
import {
  createAuthTransactionRecord,
  findAuthTransactionByState,
  markAuthTransactionConsumed,
  type AuthTransactionRecord,
} from "../storage/runtime-store";
import { AUTH_PROVIDERS, type AuthProvider, resolvePublicOrigin } from "./config";

const AUTH_TRANSACTION_TTL_MS = 15 * 60 * 1000;
const GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";

type ProviderFlow = Extract<AuthProvider, "google" | "entra-id" | "oidc">;

interface OidcMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
}

interface ProviderIdentity {
  email: string;
  providerAccountId: string;
  displayName: string | null;
}

const metadataCache = new Map<ProviderFlow, Promise<OidcMetadata>>();

function getProviderConfig(provider: ProviderFlow): { clientId: string; clientSecret: string; issuer?: string } {
  if (provider === "google") {
    return {
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? "",
    };
  }
  if (provider === "entra-id") {
    const tenant = process.env.AUTH_ENTRA_TENANT_ID ?? "";
    return {
      clientId: process.env.AUTH_ENTRA_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_ENTRA_CLIENT_SECRET ?? "",
      issuer: tenant ? `https://login.microsoftonline.com/${tenant}/v2.0` : "",
    };
  }
  return {
    clientId: process.env.AUTH_OIDC_CLIENT_ID ?? "",
    clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET ?? "",
    issuer: process.env.AUTH_OIDC_ISSUER ?? "",
  };
}

export function getProviderCallbackUrl(provider: ProviderFlow): string {
  return `${resolvePublicOrigin()}/api/auth/callback/${provider}`;
}

export async function createProviderAuthStart(input: {
  provider: ProviderFlow;
  inviteCode: string;
  expectedEmail: string;
  displayName?: string | null;
  locale?: string;
}): Promise<string> {
  const metadata = await getProviderMetadata(input.provider);
  const state = randomBytes(24).toString("hex");
  const nonce = randomBytes(24).toString("hex");
  await createAuthTransactionRecord({
    state,
    provider: input.provider,
    inviteCode: input.inviteCode,
    expectedEmail: input.expectedEmail.toLowerCase(),
    displayName: input.displayName ?? null,
    preferredLocale: normalizeLocale(input.locale ?? "en") ?? "en",
    nonce,
    expiresAt: new Date(Date.now() + AUTH_TRANSACTION_TTL_MS),
  });

  const config = getProviderConfig(input.provider);
  if (!config.clientId || !config.clientSecret) {
    throw new Error("provider-not-configured");
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getProviderCallbackUrl(input.provider),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
  });
  if (input.provider === "google") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }
  if (input.provider === "entra-id") {
    params.set("response_mode", "query");
  }

  return `${metadata.authorization_endpoint}?${params.toString()}`;
}

export async function completeProviderCallback(input: {
  provider: ProviderFlow;
  code: string;
  state: string;
}): Promise<{ transaction: AuthTransactionRecord; identity: ProviderIdentity }> {
  const transaction = await findAuthTransactionByState(input.state);
  if (!transaction || transaction.provider !== input.provider) {
    throw new Error("auth-transaction-not-found");
  }
  if (transaction.consumedAt) {
    throw new Error("auth-transaction-consumed");
  }
  if (transaction.expiresAt.getTime() <= Date.now()) {
    throw new Error("auth-transaction-expired");
  }

  const metadata = await getProviderMetadata(input.provider);
  const config = getProviderConfig(input.provider);
  if (!config.clientId || !config.clientSecret) {
    throw new Error("provider-not-configured");
  }

  const tokenResponse = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: getProviderCallbackUrl(input.provider),
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) {
    throw new Error(`provider-token-exchange-failed:${tokenResponse.status}`);
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
  };
  if (!tokenPayload.id_token) {
    throw new Error("provider-id-token-missing");
  }

  const claims = await verifyIdToken({
    idToken: tokenPayload.id_token,
    jwksUri: metadata.jwks_uri,
    expectedAudience: config.clientId,
    expectedIssuer: metadata.issuer,
    expectedNonce: transaction.nonce,
    provider: input.provider,
  });

  let email = String(claims.email ?? "").trim().toLowerCase();
  let displayName = String(claims.name ?? "").trim() || transaction.displayName || null;
  if (!email && metadata.userinfo_endpoint && tokenPayload.access_token) {
    const userInfo = await fetch(metadata.userinfo_endpoint, {
      headers: { authorization: `Bearer ${tokenPayload.access_token}` },
      cache: "no-store",
    });
    if (userInfo.ok) {
      const payload = (await userInfo.json()) as { email?: string; name?: string; sub?: string };
      email = String(payload.email ?? "").trim().toLowerCase();
      displayName = String(payload.name ?? "").trim() || displayName;
      if (!claims.sub && payload.sub) {
        claims.sub = payload.sub;
      }
    }
  }

  if (!email) {
    throw new Error("provider-email-missing");
  }
  if (email !== transaction.expectedEmail.toLowerCase()) {
    throw new Error("invite-email-mismatch");
  }
  if (!claims.sub) {
    throw new Error("provider-account-id-missing");
  }

  await markAuthTransactionConsumed(transaction.id);
  return {
    transaction,
    identity: {
      email,
      providerAccountId: String(claims.sub),
      displayName,
    },
  };
}

export function getConfigPresence(provider: ProviderFlow): boolean {
  const config = getProviderConfig(provider);
  return Boolean(config.clientId && config.clientSecret && (provider !== "entra-id" || config.issuer) && (provider !== "oidc" || config.issuer));
}

async function getProviderMetadata(provider: ProviderFlow): Promise<OidcMetadata> {
  const cached = metadataCache.get(provider);
  if (cached) {
    return cached;
  }
  const pending = loadProviderMetadata(provider);
  metadataCache.set(provider, pending);
  return pending;
}

async function loadProviderMetadata(provider: ProviderFlow): Promise<OidcMetadata> {
  if (!AUTH_PROVIDERS.some((item) => item.id === provider)) {
    throw new Error("unsupported-provider");
  }
  let discoveryUrl = GOOGLE_DISCOVERY_URL;
  if (provider === "entra-id") {
    const issuer = getProviderConfig(provider).issuer;
    if (!issuer) {
      throw new Error("provider-not-configured");
    }
    discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  }
  if (provider === "oidc") {
    const issuer = getProviderConfig(provider).issuer;
    if (!issuer) {
      throw new Error("provider-not-configured");
    }
    discoveryUrl = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
  }

  const response = await fetch(discoveryUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`provider-discovery-failed:${provider}`);
  }
  const metadata = (await response.json()) as OidcMetadata;
  if (!metadata.authorization_endpoint || !metadata.token_endpoint || !metadata.jwks_uri || !metadata.issuer) {
    throw new Error("provider-discovery-incomplete");
  }
  return metadata;
}

async function verifyIdToken(input: {
  idToken: string;
  jwksUri: string;
  expectedAudience: string;
  expectedIssuer: string;
  expectedNonce: string;
  provider: ProviderFlow;
}): Promise<Record<string, string>> {
  const [headerPart, payloadPart, signaturePart] = input.idToken.split(".");
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error("provider-id-token-invalid");
  }
  const header = JSON.parse(base64UrlDecode(headerPart)) as { alg?: string; kid?: string };
  const payload = JSON.parse(base64UrlDecode(payloadPart)) as Record<string, string | number | boolean>;
  if (header.alg !== "RS256") {
    throw new Error("provider-id-token-unsupported-alg");
  }

  const signature = base64UrlToBuffer(signaturePart);
  const jwksResponse = await fetch(input.jwksUri, { cache: "no-store" });
  if (!jwksResponse.ok) {
    throw new Error("provider-jwks-fetch-failed");
  }
  const jwks = (await jwksResponse.json()) as { keys?: Array<JsonWebKey & { kid?: string; alg?: string; kty?: string }> };
  const jwk = jwks.keys?.find((item) => item.kid === header.kid && item.kty === "RSA");
  if (!jwk) {
    throw new Error("provider-jwk-missing");
  }

  const keyData = createPublicKey({ key: jwk, format: "jwk" }).export({ format: "jwk" }) as JsonWebKey;
  const cryptoKey = await webcrypto.subtle.importKey(
    "jwk",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const verified = await webcrypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    new Uint8Array(signature),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  );
  if (!verified) {
    throw new Error("provider-id-token-signature-invalid");
  }

  const issuer = String(payload.iss ?? "");
  const acceptedIssuers =
    input.provider === "google"
      ? [input.expectedIssuer, "accounts.google.com", "https://accounts.google.com"]
      : [input.expectedIssuer];
  if (!acceptedIssuers.includes(issuer)) {
    throw new Error("provider-id-token-issuer-invalid");
  }
  if (String(payload.aud ?? "") !== input.expectedAudience) {
    throw new Error("provider-id-token-audience-invalid");
  }
  if (String(payload.nonce ?? "") !== input.expectedNonce) {
    throw new Error("provider-id-token-nonce-invalid");
  }
  const exp = Number(payload.exp ?? 0);
  if (!exp || exp * 1000 <= Date.now()) {
    throw new Error("provider-id-token-expired");
  }

  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, String(value)]));
}

function base64UrlDecode(value: string): string {
  return base64UrlToBuffer(value).toString("utf8");
}

function base64UrlToBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}
