const fs = require('fs');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assertIncludes(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(`${message} (missing: ${needle})`);
  }
}

const mode = process.argv[2];
const runtimeStore = read('src/storage/runtime-store.ts');
const authConfig = read('src/auth/config.ts');
const authSession = read('src/auth/session.ts');
const authInvitations = read('src/auth/invitations.ts');
const authorization = read('src/auth/authorization.ts');
const groupsRoute = read('src/app/api/auth/groups/route.ts');
const groupInvitesRoute = read('src/app/api/auth/groups/[groupId]/invites/route.ts');
const providerStartRoute = read('src/app/api/auth/provider/start/[provider]/route.ts');
const providerCallbackRoute = read('src/app/api/auth/callback/[provider]/route.ts');
const providerFlow = read('src/auth/provider-flow.ts');
const providers = read('src/auth/providers.ts');
const settingsPage = read('src/app/settings/page.tsx');
const platformRoute = read('src/app/api/settings/platform/route.ts');
const providerStatusRoute = read('src/app/api/settings/platform/providers/[provider]/route.ts');
const dashboardRoute = read('src/app/reporting/export/dashboard.csv/route.ts');
const executiveRoute = read('src/app/reporting/export/executive.pdf/route.ts');
const detailRoute = read('src/app/reporting/[targetId]/export/operational.pdf/route.ts');
const readModels = read('src/reporting/read-models.ts');
const readme = read('README.md');
const operatorGuide = read('docs/operators.md');

if (mode === 'schema') {
  assertIncludes(runtimeStore, 'create table if not exists auth_users', 'Missing auth users schema');
  assertIncludes(runtimeStore, 'create table if not exists group_invites', 'Missing invites schema');
  assertIncludes(runtimeStore, 'create table if not exists audit_events', 'Missing audit events schema');
  assertIncludes(runtimeStore, 'create table if not exists auth_transactions', 'Missing auth transaction schema');
  assertIncludes(runtimeStore, 'create table if not exists provider_verification_status', 'Missing provider verification schema');
  assertIncludes(runtimeStore, 'create unique index if not exists auth_accounts_provider_account_uidx', 'Missing provider account uniqueness index');
  assertIncludes(runtimeStore, 'createUserRecord', 'Missing user persistence helper');
  assertIncludes(runtimeStore, 'createGroupMembershipRecord', 'Missing membership helper');
  console.log('Auth foundation schema ready');
  process.exit(0);
}

if (mode === 'auth') {
  assertIncludes(authConfig, 'AUTH_PROVIDERS', 'Missing provider config list');
  assertIncludes(authConfig, 'SESSION_INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000', 'Missing 8-hour inactivity timeout');
  assertIncludes(authInvitations, 'invite.email.toLowerCase() !== input.email.toLowerCase()', 'Missing invite email match enforcement');
  assertIncludes(authInvitations, 'invite.status !== "pending"', 'Missing invite status enforcement');
  assertIncludes(authSession, 'completePasswordReset', 'Missing password reset completion');
  assertIncludes(authSession, 'logoutAllSessions', 'Missing logout-all support');
  assertIncludes(providerStartRoute, 'createProviderAuthStart', 'Missing provider auth start route');
  assertIncludes(providerFlow, 'createAuthTransactionRecord', 'Missing auth transaction creation');
  assertIncludes(providerFlow, 'expectedNonce', 'Missing nonce validation');
  assertIncludes(providerFlow, 'findAuthTransactionByState', 'Missing state lookup');
  assertIncludes(providerFlow, 'grant_type: "authorization_code"', 'Missing real code exchange');
  assertIncludes(providerCallbackRoute, 'completeProviderCallback', 'Missing callback completion flow');
  if (
    providerCallbackRoute.includes('formData.get("providerAccountId")') ||
    providerCallbackRoute.includes("formData.get('providerAccountId')")
  ) {
    throw new Error('Callback route still trusts posted providerAccountId');
  }
  assertIncludes(providerCallbackRoute, 'provider.linked', 'Missing provider callback linking audit');
  assertIncludes(readme, 'Real provider validation', 'Missing README provider proof guidance');
  assertIncludes(operatorGuide, 'Provider callback proof procedure', 'Missing operator provider proof guidance');
  console.log('Invitation auth flows ready');
  process.exit(0);
}

if (mode === 'permissions') {
  assertIncludes(authorization, 'rolePermissions', 'Missing role permission map');
  assertIncludes(authorization, 'assertTargetPermission', 'Missing target permission helper');
  assertIncludes(authorization, 'assertCertificatePermission', 'Missing certificate permission helper');
  if (!readModels.includes('isTargetVisibleToPrincipal') && !readModels.includes('isCertificateVisibleToPrincipal')) {
    throw new Error('Missing read-model authorization filtering');
  }
  assertIncludes(groupsRoute, 'assertPlatformAdmin', 'Missing platform admin group creation guard');
  assertIncludes(groupInvitesRoute, 'assertPermission("members.manage"', 'Missing group invite permission guard');
  assertIncludes(providerStatusRoute, 'assertPlatformAdmin', 'Missing provider status platform admin guard');
  assertIncludes(platformRoute, 'assertPlatformAdmin', 'Missing platform settings guard');
  assertIncludes(settingsPage, '/api/settings/platform/providers/', 'Missing provider status settings surface');
  assertIncludes(providers, 'listProviderStatusEntries', 'Missing provider status query helper');
  assertIncludes(dashboardRoute, 'assertAuthenticated', 'Missing dashboard export auth guard');
  assertIncludes(executiveRoute, 'assertAuthenticated', 'Missing executive pdf auth guard');
  assertIncludes(detailRoute, 'assertCertificatePermission', 'Missing target export auth guard');
  console.log('Auth permission boundaries ready');
  process.exit(0);
}

throw new Error('Usage: node scripts/validate-auth-foundation.js <schema|auth|permissions>');
