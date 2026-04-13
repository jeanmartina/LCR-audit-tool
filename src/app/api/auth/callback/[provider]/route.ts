import {
  createAuditEventRecord,
  findAuthTransactionByState,
} from "../../../../../storage/runtime-store";
import { assertRateLimit } from "../../../../../auth/rate-limit";
import { acceptInviteWithProvider, recordFailedInviteAcceptance } from "../../../../../auth/invitations";
import { AUTH_PROVIDERS, type AuthProvider } from "../../../../../auth/config";
import { resolvePublicOrigin } from "../../../../../auth/config";
import { linkAuthAccount } from "../../../../../auth/models";
import { completeProviderCallback } from "../../../../../auth/provider-flow";
import { createSession, SESSION_COOKIE_NAME } from "../../../../../auth/session";

function isAuthProvider(value: string): value is AuthProvider {
  return AUTH_PROVIDERS.some((provider) => provider.id === value);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> }
): Promise<Response> {
  const { provider: providerParam } = await context.params;
  if (!isAuthProvider(providerParam) || providerParam === "credentials") {
    return Response.json({ error: "unsupported-provider" }, { status: 400 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const providerError = url.searchParams.get("error")?.trim();

  if (providerError) {
    return Response.json({ error: `provider-error:${providerError}` }, { status: 400 });
  }
  if (!code || !state) {
    return Response.json({ error: "provider-callback-missing-code-or-state" }, { status: 400 });
  }

  try {
    assertRateLimit(`provider-callback:${providerParam}:${state}`, 10, 15 * 60 * 1000);

    const result = await completeProviderCallback({
      provider: providerParam,
      code,
      state,
    });

    const accepted = await acceptInviteWithProvider({
      inviteCode: result.transaction.inviteCode,
      email: result.identity.email,
      provider: providerParam,
      providerAccountId: result.identity.providerAccountId,
      displayName: result.identity.displayName,
      preferredLocale: result.transaction.preferredLocale,
    });

    await linkAuthAccount({
      userId: accepted.user.id,
      provider: providerParam,
      providerAccountId: result.identity.providerAccountId,
      providerEmail: result.identity.email,
    });

    await createAuditEventRecord({
      actorUserId: accepted.user.id,
      targetUserId: accepted.user.id,
      targetEmail: accepted.user.email,
      groupId: accepted.invite.groupId,
      eventType: "provider.linked",
      details: {
        provider: providerParam,
        providerAccountId: result.identity.providerAccountId,
      },
    });

    await createAuditEventRecord({
      actorUserId: accepted.user.id,
      targetUserId: accepted.user.id,
      targetEmail: accepted.user.email,
      groupId: accepted.invite.groupId,
      eventType: "login.succeeded",
      details: { provider: providerParam },
    });

    const session = await createSession(accepted.user);
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/reporting", resolvePublicOrigin()).toString(),
        "set-cookie": `${SESSION_COOKIE_NAME}=${session.token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (error) {
    const transaction = await findAuthTransactionByState(state);
    await recordFailedInviteAcceptance({
      inviteCode: transaction?.inviteCode ?? state,
      email: transaction?.expectedEmail ?? null,
      reason: error instanceof Error ? error.message : "provider-invite-acceptance-failed",
    });
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "provider-invite-acceptance-failed",
      },
      { status: 400 }
    );
  }
}
