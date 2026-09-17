import { assertCalendarDate } from './clocks.ts';
import type { Mode } from './contracts.ts';
import { failure } from './errors.ts';
import type { PeriodState } from './economy.ts';

export type StoredPeriodState = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export type PeriodAvailability = Readonly<{
  profileExists: boolean;
  mode: Mode;
  currentDate: string;
  openPeriodState: 'DRAFT' | 'ACTIVE' | null;
  hasClosedPeriod: boolean;
  maxOpenedDate: string | null;
  nextEligibleDate: string | null;
}>;

export function assertPeriodTransition(
  from: StoredPeriodState,
  to: StoredPeriodState,
): void {
  const allowed =
    (from === 'DRAFT' && to === 'ACTIVE') ||
    (from === 'ACTIVE' && to === 'CLOSED');
  if (!allowed) throw failure('PERIOD_NOT_ACTIVE', { from, to });
}

export function isDateEligible(
  currentDate: string,
  maxOpenedDate: string | null,
  nextEligibleDate: string | null,
): boolean {
  const current = assertCalendarDate(currentDate);
  const maximum = maxOpenedDate === null ? null : assertCalendarDate(maxOpenedDate);
  const next = nextEligibleDate === null ? null : assertCalendarDate(nextEligibleDate);
  return (maximum === null || current > maximum) && (next === null || current >= next);
}

/** READY/WAITING are projections; only DRAFT/ACTIVE/CLOSED are persisted periods. */
export function derivePeriodState(input: PeriodAvailability): PeriodState {
  if (!input.profileExists) return 'NO_PROFILE';
  if (input.openPeriodState) return input.openPeriodState;
  if (!input.hasClosedPeriod) return 'READY';
  return isDateEligible(
    input.currentDate,
    input.maxOpenedDate,
    input.nextEligibleDate,
  )
    ? 'READY'
    : 'WAITING';
}

export function requireOpenPeriodDate(
  currentDate: string,
  maxOpenedDate: string | null,
  nextEligibleDate: string | null,
): string {
  const checked = assertCalendarDate(currentDate);
  if (!isDateEligible(checked, maxOpenedDate, nextEligibleDate)) {
    throw failure('NEXT_DAY_NOT_AVAILABLE', {
      currentDate: checked,
      ...(maxOpenedDate ? { maxOpenedDate } : {}),
      ...(nextEligibleDate ? { nextEligibleDate } : {}),
    });
  }
  return checked;
}
