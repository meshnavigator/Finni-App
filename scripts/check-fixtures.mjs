import { readFile } from 'node:fs/promises';

const launchFixtures = JSON.parse(
  await readFile(new URL('../fixtures/launch-scenarios.json', import.meta.url), 'utf8'),
);
const economy = JSON.parse(
  await readFile(new URL('../fixtures/economy-v2.json', import.meta.url), 'utf8'),
);
const demo = JSON.parse(
  await readFile(new URL('../fixtures/demo-five-periods.json', import.meta.url), 'utf8'),
);

const api26Scenario = launchFixtures.find(
  (fixture) => fixture.id === 'android-api-26-release',
);
if (!api26Scenario?.required || !api26Scenario.description.includes('без Metro')) {
  throw new Error('Не зафиксирован обязательный сценарий запуска API 26 без Metro.');
}

if (economy.economyVersion !== 'economy-v2' || economy.fivePeriods.length !== 5) {
  throw new Error('Fixture economy-v2 должна содержать пять последовательных периодов.');
}

const finalPeriod = economy.fivePeriods.at(-1)?.expected;
if (
  finalPeriod?.available !== 40 ||
  finalPeriod?.savings !== 30 ||
  finalPeriod?.lifetimeGrowth !== 13 ||
  finalPeriod?.stage !== 3
) {
  throw new Error('Финал пяти периодов не соответствует эталону SRS §19.1.');
}

const totalIncome = economy.fivePeriods.reduce(
  (sum, period) => sum + period.income + period.reward,
  0,
);
const totalPurchases = economy.fivePeriods.reduce(
  (sum, period) => sum + period.actual.need + period.actual.want,
  0,
);
const totalClaims = economy.fivePeriods.reduce(
  (sum, period) => sum + period.actual.claim,
  0,
);
if (totalIncome !== 600 || totalPurchases !== 380 || totalClaims !== 150) {
  throw new Error('Сводные суммы fixture не соответствуют SRS §19.1.');
}
if (totalIncome - totalPurchases - totalClaims !== economy.final.totalFunds) {
  throw new Error('Fixture нарушает сохранение B+S.');
}
if (economy.counterexamples.negativeNetFlow.netSaving !== -20) {
  throw new Error('Fixture должна сохранять знаковый D-W.');
}
if (economy.counterexamples.recovery.newSaving.join(',') !== '40,0,0,5') {
  throw new Error('Fixture не фиксирует защиту повторного зачёта накоплений.');
}

if (
  demo.mode !== 'demo' ||
  demo.periods.length !== 5 ||
  demo.expected.realWaits !== 0 ||
  demo.expected.incomeEntries !== 5 ||
  demo.expected.available !== 500
) {
  throw new Error('Demo fixture должна фиксировать пять периодов без ожидания.');
}
for (const [offset, period] of demo.periods.entries()) {
  const expected = new Date(`${demo.initialDate}T00:00:00.000Z`);
  expected.setUTCDate(expected.getUTCDate() + offset);
  if (
    period.index !== offset + 1 ||
    period.calendarDate !== expected.toISOString().slice(0, 10) ||
    period.income !== 100
  ) {
    throw new Error('Demo fixture нарушает последовательность VirtualClock/дохода.');
  }
}

console.log('Fixtures bootstrap, economy-v2 и demo lifecycle валидны.');
