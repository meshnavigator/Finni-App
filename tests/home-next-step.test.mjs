import assert from 'node:assert/strict';
import test from 'node:test';
import { homeNextStep } from '../src/ui/home-next-step.ts';
import { homePetPortraitFrame, HOME_PET_BOUNDS } from '../src/ui/home-scene-layout.ts';
const base = { state: 'ACTIVE', hasFood: true, hasCare: true, hasGoal: true, allGoals: false, savings: 10, large: false, demo: false };
test('Home next step matches its destination and never bypasses a financial confirmation', () => {
  for (const large of [false, true]) {
    for (const [state, route] of [['READY', 'open-day'], ['DRAFT', 'План'], ['CLOSED', 'results'], ['WAITING', 'waiting']]) {
      assert.equal(homeNextStep({ ...base, state, large }).route, route);
    }
    for (const [hasFood, hasCare] of [[false, false], [true, false], [false, true]]) {
      assert.equal(homeNextStep({ ...base, hasFood, hasCare, large }).route, 'Покупки');
    }
    assert.equal(homeNextStep({ ...base, hasGoal: false, large }).label, 'Выбрать мечту');
    assert.equal(homeNextStep({ ...base, savings: 0, large }).route, 'Копилка');
    assert.deepEqual(homeNextStep({ ...base, large }), { label: 'Проверить итоги', route: 'results' });
    assert.equal(homeNextStep({ ...base, hasGoal: false, allGoals: true, large }).route, 'results');
    assert.equal(homeNextStep({ ...base, state: 'WAITING', hasFood: false, large }).route, 'waiting');
    assert.deepEqual(homeNextStep({ ...base, state: 'WAITING', demo: true, large }),
      { label: 'Следующий демо-день', route: 'advance-demo-day' });
  }
});
test('large text portrait keeps ear-top clearance on the accepted canvas', () => {
  for (const size of [120, 152]) {
    const f = homePetPortraitFrame({ x: 0, y: 0, width: size, height: size });
    assert.ok(Math.abs(f.top + HOME_PET_BOUNDS.top * f.scale - 6) < 1e-8);
    assert.ok(f.width > size);
    assert.ok(f.height > size);
  }
});
