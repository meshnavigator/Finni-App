import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonReturnLabel, lessonReturnScreen, nextLessonVariant } from '../src/ui/lesson-return.ts';
import {
  discoveryAction,
  discoveryHelp,
  discoveryOutcome,
} from '../src/ui/lesson-discovery-summary.ts';

function discovery(mechanic, solution, outcome = 'meets_goal', shownHints = []) {
  return {
    attempt: { mechanic, solution, shownHints },
    evaluation: { outcome },
    completionKind: outcome === 'needs_review' ? 'reviewed' : 'completed',
  };
}

test('all eight lessons return to the right day section without triggering an operation', () => {
  const cases = [
    ['LS-P01', 'shop'], ['LS-P02', 'shop'], ['LS-P03', 'history'],
    ['LS-B01', 'plan'], ['LS-B02', 'plan'], ['LS-B03', 'plan'],
    ['LS-S01', 'savings'], ['LS-S02', 'savings'],
  ];
  for (const [lessonId, target] of cases) {
    assert.equal(lessonReturnScreen(lessonId, 'ACTIVE'), target);
    assert.equal(lessonReturnScreen(lessonId, 'DRAFT'), target);
    assert.equal(lessonReturnScreen(lessonId, 'CLOSED'), 'home');
    assert.equal(lessonReturnScreen(lessonId, 'WAITING'), 'home');
    assert.ok(lessonReturnLabel(target).length > 0);
  }
});

test('discovery copy reports saved choices for all mechanics without claiming mastery', () => {
  const cases = [
    [discovery('allocation', { need: 40, want: 20, save: 40 }), /Нужно 40.*мечту 40/],
    [discovery('basket', { packageCountByOfferId: { food: 2 }, statedTotal: 60, statedRemainder: 40 }), /упаковок: 2.*60/],
    [discovery('savings', { deposits: [5, 10, 15] }), /5, 10, 15/],
    [discovery('savings', { withdrawal: 20, action: 'postpone' }), /отложить покупку/],
    [discovery('receipt_audit', { flaggedLineIds: ['receipt-2'], correctedTotal: 60, expectedChange: 40 }), /строк: 1.*сдача: 40/],
    [discovery('resource_choice', { method: 'make', allocation: { need: 40, want: 10, save: 50 } }), /Изготовить.*мечту 50/],
  ];
  for (const [item, pattern] of cases) {
    assert.match(discoveryAction(item), pattern);
    assert.doesNotMatch(discoveryOutcome(item), /освоил|научил|умеешь/i);
  }
  assert.equal(discoveryOutcome(discovery('allocation', {}, 'needs_review')), 'Завершили с разбором');
  assert.equal(discoveryOutcome(discovery('basket', {}, 'valid_alternative')), 'Допустимый другой вариант');
  assert.match(discoveryHelp(discovery('allocation', {}, 'meets_goal', ['L2'])), /L2/);
  assert.match(discoveryHelp(discovery('allocation', {})), /не открывались/);
});
test('repeat cycles through variants of one lesson and does not create a ninth topic', () => {
  const variants = [
    { definition: { lessonId: 'LS-P02', variantId: 'equal_goods' } },
    { definition: { lessonId: 'LS-P02', variantId: 'quantity_two' } },
    { definition: { lessonId: 'LS-P02', variantId: 'quantity_three' } },
  ];
  assert.equal(nextLessonVariant(variants, 'equal_goods').definition.variantId, 'quantity_two');
  assert.equal(nextLessonVariant(variants, 'quantity_two').definition.variantId, 'quantity_three');
  assert.equal(nextLessonVariant(variants, 'quantity_three').definition.variantId, 'equal_goods');
  assert.equal(nextLessonVariant(variants, 'unknown').definition.variantId, 'equal_goods');
  assert.equal(new Set(variants.map((item) => item.definition.lessonId)).size, 1);
});