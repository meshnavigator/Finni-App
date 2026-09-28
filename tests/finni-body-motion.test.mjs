import test from 'node:test';
import assert from 'node:assert/strict';
import { finniBodyPose, MOTION_KEYS, BLINK_GAPS_MS, INTEREST_GAPS_MS } from '../src/ui/finni-body-motion.ts';
import { FINNI_ANIMATION_SET, initialFinniAnimationState, reduceFinniAnimation } from '../src/ui/finni-animation-set.ts';

test('every body recipe returns to its anchors and stays within the reserved silhouette', () => {
  const still = finniBodyPose(null, 0);
  for (const clip of Object.keys(FINNI_ANIMATION_SET)) {
    assert.deepEqual(finniBodyPose(clip, 0), still);
    assert.deepEqual(finniBodyPose(clip, 1), still);
    for (const p of MOTION_KEYS) {
      const pose = finniBodyPose(clip, p);
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.ok(Math.abs(pose.head) <= 6 && Math.abs(pose.tail) <= 7);
      assert.ok(pose.headY >= 0 && pose.headY <= 170);
      assert.ok(pose.gesture >= 0 && pose.gesture <= 1);
    }
  }
  for (const clip of ['AN-003','AN-004','AN-005','AN-006','AN-007','AN-008','AN-009','AN-010','AN-013','AN-014']) {
    assert.ok(MOTION_KEYS.some(p => { const v = finniBodyPose(clip, p); return v.head || v.tail || v.headY || v.gesture; }), clip);
  }
});

test('symbolic withdrawal travels opposite to deposit, never computes money', () => {
  for (const p of MOTION_KEYS) {
    assert.equal(finniBodyPose('AN-012', p, -1).propX || 0, -finniBodyPose('AN-012', p, 1).propX || 0);
  }
  assert.ok(new Set(BLINK_GAPS_MS).size > 1);
  assert.ok(INTEREST_GAPS_MS.every(ms => ms >= 12000 && ms <= 25000));
});

test('ambient interest is playable only over neutral idle and is displaced by receipts', () => {
  const presentation = { stage: 1, shapeId: 'pointy', patternId: 'plain', expression: 'neutral' };
  const start = initialFinniAnimationState(presentation, { motionEnabled: true, soundEnabled: false, systemReduceMotion: false });
  const interest = reduceFinniAnimation(start, { type: 'play', clip: 'AN-003', presentation });
  assert.equal(interest.active, 'AN-003');
  const result = reduceFinniAnimation(interest, { type: 'play', clip: 'AN-009', presentation: { ...presentation, expression: 'happy' } });
  assert.equal(result.active, 'AN-009');
  assert.equal(reduceFinniAnimation(result, { type: 'play', clip: 'AN-003', presentation: result.presentation }).active, 'AN-009');
  assert.equal(reduceFinniAnimation(start, { type: 'play', clip: 'AN-001', presentation }).active, null);
});
