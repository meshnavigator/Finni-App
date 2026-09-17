export const ERROR_CODES = [
  'INVALID_AMOUNT',
  'PLAN_OVER_BUDGET',
  'INSUFFICIENT_FUNDS',
  'INSUFFICIENT_SAVINGS',
  'STALE_STATE',
  'PERIOD_NOT_ACTIVE',
  'NEXT_DAY_NOT_AVAILABLE',
  'DAILY_SLOT_USED',
  'REWARD_ALREADY_CLAIMED',
  'GOAL_ALREADY_CLAIMED',
  'IDEMPOTENCY_CONFLICT',
  'CONTENT_INVALID',
  'UNSUPPORTED_VERSION',
  'STORAGE_WRITE_FAILED',
  'PROFILE_MODE_MISMATCH',
  'LIMIT_REACHED',
  'NUMERIC_LIMIT',
  'EXTRA_INCOME_EXCEEDED',
  'SESSION_EXPIRED',
  'ADMIN_OPERATION_PENDING',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type DomainError = Readonly<{
  code: ErrorCode;
  retryable: boolean;
  params?: Readonly<Record<string, string | number>>;
}>;

export class DomainFailure extends Error {
  readonly domain: DomainError;

  constructor(
    code: ErrorCode,
    params?: Readonly<Record<string, string | number>>,
    retryable = false,
  ) {
    super(code);
    this.name = 'DomainFailure';
    this.domain = Object.freeze({
      code,
      retryable,
      ...(params ? { params: Object.freeze({ ...params }) } : {}),
    });
  }
}

export function failure(
  code: ErrorCode,
  params?: Readonly<Record<string, string | number>>,
  retryable = false,
): DomainFailure {
  return new DomainFailure(code, params, retryable);
}
