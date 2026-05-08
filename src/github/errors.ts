export type IntakeFailureKind = "transport" | "semantic" | "business";

/**
 * User-visible copy when intake cannot proceed and the harness shows a degraded path.
 * Intentionally generic; classified errors should use {@link formatIntakeErrorMessage} instead.
 */
export const ISSUE_INTAKE_DEGRADED_STUB =
  "Issue intake stub: gh fetch failed or is unavailable";

export class IntakeError extends Error {
  readonly kind: IntakeFailureKind;

  constructor(kind: IntakeFailureKind, message: string) {
    super(message);
    this.name = "IntakeError";
    this.kind = kind;
  }
}

export function formatIntakeErrorMessage(err: IntakeError): string {
  return `[${err.kind}] ${err.message}`;
}
