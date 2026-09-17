import { readFile } from 'node:fs/promises';

const launchFixtures = JSON.parse(
  await readFile(new URL('../fixtures/launch-scenarios.json', import.meta.url), 'utf8'),
);
const economy = JSON.parse(
  await readFile(new URL('../fixtures/economy-v2.json', import.meta.url), 'utf8'),
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

console.log('Fixtures bootstrap и economy-v2 валидны.');
