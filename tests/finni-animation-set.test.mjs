import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FINNI_ANIMATION_SET,
  finniAnimationFrame,
  initialFinniAnimationState,
  reduceFinniAnimation,
} from '../src/ui/finni-animation-set.ts';

const presentation = Object.freeze({ stage: 1, shapeId: 'round', patternId: 'plain', expression: 'neutral' });
const settings = Object.freeze({ motionEnabled: true, soundEnabled: true, systemReduceMotion: false });
const initial = () => initialFinniAnimationState(presentation, settings);
const play = (state, clip, nextPresentation = presentation) => reduceFinniAnimation(state, { type: 'play', clip, presentation: nextPresentation });

test('AN-001–014 have bounded recipes, static poses and skippable milestones', () => {
  assert.deepEqual(Object.keys(FINNI_ANIMATION_SET), Array.from({ length: 14 }, (_, i) => `AN-${String(i + 1).padStart(3, '0')}`));
  for (const clip of Object.values(FINNI_ANIMATION_SET)) {
    assert.ok(clip.durationMs > 0 && clip.durationMs <= 5400);
    assert.ok(clip.recipe);
    assert.ok(clip.staticExpression);
    assert.equal(clip.skippable, clip.id === 'AN-013' || clip.id === 'AN-014');
  }
});

test('result replaces optional reaction; background cannot interrupt result', () => {
  let state = play(initial(), 'AN-005');
  state = play(state, 'AN-009');
  assert.equal(state.active, 'AN-009');
  state = play(state, 'AN-005');
  assert.equal(state.active, 'AN-009');
  assert.equal(state.queuedOptional, null);
  assert.equal(finniAnimationFrame(state).blink, false);
});

test('rapid taps keep at most one optional reaction and stale completion cannot end replacement', () => {
  let state = play(initial(), 'AN-005');
  const generation = state.generation;
  for (let i = 0; i < 100; i++) state = play(state, 'AN-005');
  assert.equal(state.queuedOptional, 'AN-005');
  state = reduceFinniAnimation(state, { type: 'finish', clip: 'AN-005', generation });
  assert.equal(state.active, 'AN-005');
  assert.equal(state.queuedOptional, null);
  assert.equal(reduceFinniAnimation(state, { type: 'finish', clip: 'AN-005', generation }), state);
});

test('goal and stage skip display committed presentation and invalidate old timer', () => {
  assert.equal(FINNI_ANIMATION_SET['AN-013'].staticExpression, 'inspired');
  for (const clip of ['AN-013', 'AN-014']) {
    const committed = { ...presentation, stage: 3, expression: 'inspired' };
    let state = play(initial(), clip, committed);
    const generation = state.generation;
    assert.equal(finniAnimationFrame(state).canSkip, true);
    state = reduceFinniAnimation(state, { type: 'skip', clip, generation });
    assert.equal(state.active, null);
    assert.deepEqual(state.presentation, committed);
    assert.equal(finniAnimationFrame(state).expression, 'inspired');
    assert.equal(reduceFinniAnimation(state, { type: 'finish', clip, generation }), state);
  }
});

test('modal, leave and profile change cancel effects without mutating committed presentation', () => {
  const committed = { ...presentation, stage: 2 };
  let state = play(initial(), 'AN-014', committed);
  state = reduceFinniAnimation(state, { type: 'modal', open: true });
  assert.equal(state.active, null);
  assert.deepEqual(state.presentation, committed);
  state = reduceFinniAnimation(state, { type: 'modal', open: false });
  state = play(state, 'AN-005');
  state = reduceFinniAnimation(state, { type: 'leave' });
  assert.equal(state.active, null);
  state = play(state, 'AN-005');
  state = reduceFinniAnimation(state, { type: 'profile-change' });
  assert.equal(state.active, null);
  assert.equal(state.queuedOptional, null);
});

test('motion, system preference and sound are independent of committed state', () => {
  const committed = { ...presentation, stage: 3, expression: 'happy' };
  let state = play(initial(), 'AN-013', committed);
  const generation = state.generation;
  state = reduceFinniAnimation(state, { type: 'settings', settings: { ...settings, soundEnabled: false } });
  assert.equal(state.generation, generation);
  assert.equal(state.active, 'AN-013');
  assert.equal(finniAnimationFrame(state).soundEnabled, false);
  state = reduceFinniAnimation(state, { type: 'settings', settings: { ...settings, systemReduceMotion: true } });
  assert.equal(state.active, null);
  assert.deepEqual(state.presentation, committed);
  assert.equal(finniAnimationFrame(state).expression, 'happy');
  assert.equal(finniAnimationFrame(state).idle, false);
  assert.equal(finniAnimationFrame(state).blink, false);
});
