export const ADULT_HOLD_DURATION_MS = 3000;
export const ADULT_IDLE_TIMEOUT_MS = 120000;
export const ADULT_ACCESSIBLE_QUESTION = 'Сколько будет 2 + 3?';

export function isAdultAccessibleAnswer(value: string): boolean {
  return value.trim() === '5';
}

/** Memory-only accidental-entry barrier. It is not identity or age verification. */
export class AdultAccessSession {
  #lastActivityAt: number | null = null;

  unlock(now: number): void {
    this.#lastActivityAt = now;
  }

  lock(): void {
    this.#lastActivityAt = null;
  }

  recordActivity(now: number): boolean {
    if (!this.isUnlocked(now)) return false;
    this.#lastActivityAt = now;
    return true;
  }

  isUnlocked(now: number): boolean {
    if (this.#lastActivityAt === null) return false;
    if (now - this.#lastActivityAt >= ADULT_IDLE_TIMEOUT_MS) {
      this.lock();
      return false;
    }
    return true;
  }

  handleAppState(state: string): void {
    if (state !== 'active') this.lock();
  }
}
