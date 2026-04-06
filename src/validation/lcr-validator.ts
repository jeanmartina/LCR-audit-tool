export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateLcr(signature: string | null, hash: string | null, issuer: string | null): ValidationResult {
  if (!signature) {
    return { valid: false, reason: "missing-signature" };
  }
  if (!hash) {
    return { valid: false, reason: "missing-hash" };
  }
  if (!issuer) {
    return { valid: false, reason: "missing-issuer" };
  }

  return { valid: true };
}
