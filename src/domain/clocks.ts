import type { Clock } from './contracts.ts';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function assertCalendarDate(value: string): string {
  const match = ISO_DATE.exec(value);
  if (!match) throw new TypeError('calendarDate must use YYYY-MM-DD');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const checked = new Date(Date.UTC(year, month - 1, day));
  if (
    checked.getUTCFullYear() !== year ||
    checked.getUTCMonth() !== month - 1 ||
    checked.getUTCDate() !== day
  ) {
    throw new TypeError('calendarDate must be a real date');
  }
  return value;
}

export function assertTimeZone(value: string): string {
  if (value.trim().length === 0) throw new TypeError('timeZone must not be empty');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date(0));
  } catch {
    throw new TypeError('timeZone must be a supported IANA identifier');
  }
  return value;
}

export function calendarDateAt(instant: Date, timeZone: string): string {
  if (Number.isNaN(instant.getTime())) throw new TypeError('instant must be valid');
  const zone = assertTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): string => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new TypeError(`Unable to resolve ${type}`);
    return value;
  };
  return `${read('year')}-${read('month')}-${read('day')}`;
}

/** Calendar arithmetic deliberately does not model a day as 86,400,000 ms. */
export function nextCalendarDate(value: string): string {
  const checked = assertCalendarDate(value);
  const [year, month, day] = checked.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);
  return [
    date.getUTCFullYear().toString().padStart(4, '0'),
    (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    date.getUTCDate().toString().padStart(2, '0'),
  ].join('-');
}

export class NormalClock implements Clock {
  readonly #zone: string;
  readonly #now: () => Date;

  constructor(timeZone: string, now: () => Date = () => new Date()) {
    this.#zone = assertTimeZone(timeZone);
    this.#now = now;
  }

  nowUtc(): Date {
    const value = this.#now();
    if (Number.isNaN(value.getTime())) throw new TypeError('Clock returned invalid time');
    return new Date(value.getTime());
  }

  calendarDate(timeZone: string = this.#zone): string {
    return calendarDateAt(this.nowUtc(), timeZone);
  }

  timeZone(): string {
    return this.#zone;
  }
}

export class VirtualClock implements Clock {
  #date: string;
  readonly #zone: string;
  readonly #now: () => Date;

  constructor(
    calendarDate: string,
    timeZone: string,
    now: () => Date = () => new Date(),
  ) {
    this.#date = assertCalendarDate(calendarDate);
    this.#zone = assertTimeZone(timeZone);
    this.#now = now;
  }

  nowUtc(): Date {
    const value = this.#now();
    if (Number.isNaN(value.getTime())) throw new TypeError('Clock returned invalid time');
    return new Date(value.getTime());
  }

  calendarDate(): string {
    return this.#date;
  }

  timeZone(): string {
    return this.#zone;
  }

  advance(): string {
    this.#date = nextCalendarDate(this.#date);
    return this.#date;
  }
}
