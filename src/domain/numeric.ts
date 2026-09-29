import { failure } from './errors.ts';

export const AMOUNT_LIMIT = 1_000_000_000;

declare const amountBrand: unique symbol;
declare const moneyDeltaBrand: unique symbol;
declare const counterBrand: unique symbol;
declare const netFlowBrand: unique symbol;

export type Amount = number & { readonly [amountBrand]: true };
export type MoneyDelta = number & { readonly [moneyDeltaBrand]: true };
export type Counter = number & { readonly [counterBrand]: true };
export type NetFlow = number & { readonly [netFlowBrand]: true };

export function requireSafeInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw failure('INVALID_AMOUNT');
  }

  return value;
}

function boundedInteger(value: unknown, min: number, max: number): number {
  const integer = requireSafeInteger(value);
  if (integer < min || integer > max) {
    throw failure('INVALID_AMOUNT', { min, max });
  }

  return integer;
}

export function amount(value: unknown): Amount {
  return boundedInteger(value, 0, AMOUNT_LIMIT) as Amount;
}

export function positiveAmount(value: unknown): Amount {
  return boundedInteger(value, 1, AMOUNT_LIMIT) as Amount;
}

export function moneyDelta(value: unknown): MoneyDelta {
  return boundedInteger(value, -AMOUNT_LIMIT, AMOUNT_LIMIT) as MoneyDelta;
}

export function counter(value: unknown): Counter {
  return boundedInteger(value, 0, Number.MAX_SAFE_INTEGER) as Counter;
}

export function netFlow(value: unknown): NetFlow {
  return requireSafeInteger(value) as NetFlow;
}

export function safeAdd(left: unknown, right: unknown): number {
  const result = requireSafeInteger(left) + requireSafeInteger(right);
  if (!Number.isSafeInteger(result)) {
    throw failure('NUMERIC_LIMIT');
  }

  return result;
}

export function safeSubtract(left: unknown, right: unknown): number {
  const result = requireSafeInteger(left) - requireSafeInteger(right);
  if (!Number.isSafeInteger(result)) {
    throw failure('NUMERIC_LIMIT');
  }

  return result;
}

export function addCounter(left: unknown, right: unknown): Counter {
  return counter(safeAdd(counter(left), counter(right)));
}

export function subtractNetFlow(left: unknown, right: unknown): NetFlow {
  return netFlow(safeSubtract(counter(left), counter(right)));
}
