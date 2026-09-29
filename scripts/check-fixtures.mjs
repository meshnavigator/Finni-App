import { readFile } from 'node:fs/promises';
import { DEMO_INITIAL_DATE } from '../src/application/demo-scenario.ts';
import { catalogItem, savingsGoal } from '../src/domain/catalog.ts';

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
  demo.schemaVersion !== 2 ||
  demo.mode !== 'demo' ||
  demo.initialDate !== DEMO_INITIAL_DATE ||
  demo.periods.length !== 5 ||
  demo.expected.realWaits !== 0 ||
  demo.expected.incomeEntries !== 5 ||
  demo.expected.incomeOnlyAvailable !== 500
) {
  throw new Error('Demo fixture должна фиксировать runtime дату и пять периодов без ожидания.');
}
let available = 0;
let savings = 0;
const completedLessons = new Set();
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
  const economyPeriod = economy.fivePeriods[offset];
  if (period.plan.join(',') !== economyPeriod.plan.join(',')) {
    throw new Error(`План demo-дня ${period.index} отличается от economy-v2.`);
  }
  for (const lessonId of period.lessons) {
    if (completedLessons.has(lessonId)) throw new Error(`Повторное занятие в demo: ${lessonId}`);
    completedLessons.add(lessonId);
  }
  const purchases = period.purchases.map(catalogItem);
  const need = purchases.filter((item) => item.category === 'need').reduce((sum, item) => sum + item.price, 0);
  const want = purchases.filter((item) => item.category === 'want').reduce((sum, item) => sum + item.price, 0);
  if (need !== economyPeriod.actual.need || want !== economyPeriod.actual.want ||
      period.deposit !== economyPeriod.actual.deposit) {
    throw new Error(`Покупки или взнос demo-дня ${period.index} отличаются от economy-v2.`);
  }
  if (period.rejectedPurchase &&
      catalogItem(period.rejectedPurchase).price <= available + period.income + economyPeriod.reward - need) {
    throw new Error('Попытка покупки в demo должна действительно не хватать средств.');
  }
  const claim = period.claimGoal ? savingsGoal(period.claimGoal).cost : 0;
  if (claim !== economyPeriod.actual.claim || (period.claimGoal && period.claimGoal !== demo.goalId)) {
    throw new Error(`Получение цели demo-дня ${period.index} отличается от economy-v2.`);
  }
  available += period.income + economyPeriod.reward - need - want - period.deposit;
  savings += period.deposit - claim;
  if (available !== period.expected.available || savings !== period.expected.savings ||
      period.expected.lifetimeGrowth !== economyPeriod.expected.lifetimeGrowth ||
      period.expected.stage !== economyPeriod.expected.stage) {
    throw new Error(`Итог demo-дня ${period.index} отличается от эталона.`);
  }
}
if (completedLessons.size !== demo.expected.completedLessons ||
    demo.expected.rewardEntries !== demo.periods.length ||
    available !== demo.expected.finalAvailable || savings !== demo.expected.finalSavings ||
    demo.periods.at(-1).expected.stage !== demo.expected.finalStage) {
  throw new Error('Финал demo-маршрута не совпадает с эталоном SRS §19.');
}

console.log('Fixtures bootstrap, economy-v2 и demo A.1–A.12 валидны.');
