import assert from 'node:assert/strict';
import test from 'node:test';
import * as d from '../src/domain/index.ts';

const assertCode = (code) => (error) => error?.domain?.code === code;

test('Amount projection overflow rejects the whole calculation as NUMERIC_LIMIT', () => {
  assert.throws(
    () =>
      d.calculateBalances({
        before: {
          available: d.amount(d.AMOUNT_LIMIT),
          savings: d.amount(0),
        },
        income: d.amount(1),
      }),
    assertCode('NUMERIC_LIMIT'),
  );
});
