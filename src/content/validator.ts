import { LESSON_MECHANICS, type LessonMechanic, type LessonOutcome } from '../domain/lesson.ts';
import {
  ACTIVE_CONTENT_VERSION,
  CONTENT_ECONOMY_VERSION,
  CONTENT_FORMATS,
  CONTENT_MODES,
  CONTENT_OUTCOMES,
  CONTENT_RENDERERS,
  CONTENT_SCHEMA_VERSION,
  CONTENT_TOPICS,
  type ContentAllocation,
  type ContentFixtureEvaluator,
  type ContentLesson,
  type ContentManifest,
  type ContentVariant,
  type ManifestFile,
} from './schema-v3.ts';

const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SHA256 = /^[a-f0-9]{64}$/;
const BUNDLE_PATH = /^(?:lessons|catalogs)\/[A-Za-z0-9._-]+\.json$/;
const MAX_AMOUNT = 1_000_000_000;

export class ContentValidationError extends TypeError {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Content validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    this.name = 'ContentValidationError';
    this.issues = issues;
  }
}

type ObjectValue = Record<string, unknown>;

function fail(path: string, message: string): never {
  throw new ContentValidationError([`${path}: ${message}`]);
}

function object(value: unknown, path: string): ObjectValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, 'expected object');
  }
  return value as ObjectValue;
}

function exact(value: ObjectValue, keys: readonly string[], path: string): void {
  const allowed = new Set(keys);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) fail(path, `unknown field(s): ${unknown.join(', ')}`);
  const missing = keys.filter((key) => !(key in value));
  if (missing.length > 0) fail(path, `missing field(s): ${missing.join(', ')}`);
}

function exactOptional(
  value: ObjectValue,
  required: readonly string[],
  optional: readonly string[],
  path: string,
): void {
  const allowed = new Set([...required, ...optional]);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) fail(path, `unknown field(s): ${unknown.join(', ')}`);
  const missing = required.filter((key) => !(key in value));
  if (missing.length > 0) fail(path, `missing field(s): ${missing.join(', ')}`);
}

function text(value: unknown, path: string, maximum = 600): string {
  if (typeof value !== 'string' || value.trim().length === 0) fail(path, 'expected non-empty text');
  if (value.length > maximum) fail(path, `must be at most ${maximum} characters`);
  if (/https?:\/\/|javascript:|<script|\b(?:SELECT|INSERT|UPDATE|DELETE)\s+/iu.test(value)) {
    fail(path, 'URLs and executable code are forbidden');
  }
  return value;
}

function id(value: unknown, path: string): string {
  const result = text(value, path, 64);
  if (!ID.test(result)) fail(path, 'invalid identifier');
  return result;
}

function integer(value: unknown, path: string, minimum = 0, maximum = MAX_AMOUNT): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    fail(path, `expected safe integer in ${minimum}..${maximum}`);
  }
  return value as number;
}

function array(value: unknown, path: string, minimum = 0, maximum = 50): unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    fail(path, `expected array length ${minimum}..${maximum}`);
  }
  return value;
}

function unique(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) fail(path, 'values must be unique');
}

function enumeration<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(path, `expected one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

function recordOfIntegers(value: unknown, path: string, maximum = MAX_AMOUNT): Record<string, number> {
  const result = object(value, path);
  for (const [key, item] of Object.entries(result)) {
    id(key, `${path}.${key}`);
    integer(item, `${path}.${key}`, 0, maximum);
  }
  return result as Record<string, number>;
}

function validateAllocation(value: unknown, path: string): ContentAllocation {
  const result = object(value, path);
  exact(result, ['need', 'want', 'save'], path);
  integer(result.need, `${path}.need`);
  integer(result.want, `${path}.want`);
  integer(result.save, `${path}.save`);
  return result as ContentAllocation;
}

function validateCopy(value: unknown, mechanic: LessonMechanic, path: string): void {
  const copy = object(value, path);
  exact(copy, ['intro', 'hints', 'feedback'], path);
  validateTemplatedText(copy.intro, mechanic, `${path}.intro`);
  const hints = array(copy.hints, `${path}.hints`, 2, 2);
  hints.forEach((hint, index) => validateTemplatedText(hint, mechanic, `${path}.hints[${index}]`));
  const feedback = object(copy.feedback, `${path}.feedback`);
  exact(feedback, CONTENT_OUTCOMES, `${path}.feedback`);
  for (const outcome of CONTENT_OUTCOMES) {
    validateTemplatedText(feedback[outcome], mechanic, `${path}.feedback.${outcome}`);
  }
}

const PLACEHOLDERS: Readonly<Record<LessonMechanic, readonly string[]>> = {
  allocation: ['need', 'want', 'save', 'total', 'remainder'],
  basket: ['total', 'remainder', 'missing', 'extraUnits'],
  savings: ['total', 'remaining', 'wallet', 'savings'],
  receipt_audit: ['comparisonSummary', 'total', 'change'],
  resource_choice: ['missing', 'total', 'save', 'cost'],
};

function validateTemplatedText(value: unknown, mechanic: LessonMechanic, path: string): void {
  const result = text(value, path);
  const braces = [...result.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]);
  const withoutPlaceholders = result.replace(/\{[^{}]+\}/g, '');
  if (/[{}]/.test(withoutPlaceholders)) fail(path, 'malformed placeholder');
  for (const placeholder of braces) {
    if (!PLACEHOLDERS[mechanic].includes(placeholder)) {
      fail(path, `unknown placeholder {${placeholder}} for ${mechanic}`);
    }
  }
}

function validateEvidence(value: unknown, path: string): void {
  const items = array(value, path, 0, 20);
  const ids = items.map((item, index) => {
    const evidence = object(item, `${path}[${index}]`);
    exactOptional(evidence, ['id', 'text'], ['assetId'], `${path}[${index}]`);
    const evidenceId = id(evidence.id, `${path}[${index}].id`);
    text(evidence.text, `${path}[${index}].text`);
    if (evidence.assetId !== undefined) id(evidence.assetId, `${path}[${index}].assetId`);
    return evidenceId;
  });
  unique(ids, path);
}

function validateOffer(value: unknown, path: string): void {
  const offer = object(value, path);
  exactOptional(
    offer,
    ['id', 'kind', 'packSize', 'packPrice', 'maxPackages', 'qualityKey', 'properties'],
    ['alternativeGroup'],
    path,
  );
  id(offer.id, `${path}.id`);
  id(offer.kind, `${path}.kind`);
  integer(offer.packSize, `${path}.packSize`, 1, 1000);
  integer(offer.packPrice, `${path}.packPrice`);
  integer(offer.maxPackages, `${path}.maxPackages`, 1, 100);
  id(offer.qualityKey, `${path}.qualityKey`);
  array(offer.properties, `${path}.properties`, 1, 10).forEach((item, index) => text(item, `${path}.properties[${index}]`, 120));
  if (offer.alternativeGroup !== undefined) id(offer.alternativeGroup, `${path}.alternativeGroup`);
}

function validateReceiptLine(value: unknown, path: string): void {
  const line = object(value, path);
  exact(line, ['id', 'itemId', 'quantity', 'unitPrice'], path);
  id(line.id, `${path}.id`);
  id(line.itemId, `${path}.itemId`);
  integer(line.quantity, `${path}.quantity`, 1, 100);
  integer(line.unitPrice, `${path}.unitPrice`);
}

function validateParams(mechanic: LessonMechanic, mode: string, value: unknown, path: string): void {
  const params = object(value, path);
  if (mechanic === 'allocation') {
    exactOptional(params, ['budget', 'needMinimum', 'savingTarget'], ['initialPlan'], path);
    integer(params.budget, `${path}.budget`);
    integer(params.needMinimum, `${path}.needMinimum`);
    integer(params.savingTarget, `${path}.savingTarget`);
    if (params.initialPlan !== undefined) validateAllocation(params.initialPlan, `${path}.initialPlan`);
    return;
  }
  if (mechanic === 'basket') {
    exact(params, ['budget', 'requiredUnits', 'offers', 'preferLowerCostForEqualCoverage'], path);
    integer(params.budget, `${path}.budget`);
    recordOfIntegers(params.requiredUnits, `${path}.requiredUnits`, 1000);
    const offers = array(params.offers, `${path}.offers`, 1, 20);
    const offerIds = offers.map((offer, index) => {
      validateOffer(offer, `${path}.offers[${index}]`);
      return (offer as ObjectValue).id as string;
    });
    unique(offerIds, `${path}.offers`);
    if (typeof params.preferLowerCostForEqualCoverage !== 'boolean') fail(`${path}.preferLowerCostForEqualCoverage`, 'expected boolean');
    return;
  }
  if (mechanic === 'savings' && mode === 'schedule') {
    exact(params, ['initialSavings', 'goalCost', 'maxDeposits'], path);
    integer(params.initialSavings, `${path}.initialSavings`);
    integer(params.goalCost, `${path}.goalCost`);
    array(params.maxDeposits, `${path}.maxDeposits`, 1, 10).forEach((item, index) => integer(item, `${path}.maxDeposits[${index}]`));
    return;
  }
  if (mechanic === 'savings') {
    exact(params, ['available', 'savings', 'goalCost', 'itemCost'], path);
    integer(params.available, `${path}.available`);
    integer(params.savings, `${path}.savings`);
    integer(params.goalCost, `${path}.goalCost`);
    integer(params.itemCost, `${path}.itemCost`);
    return;
  }
  if (mechanic === 'receipt_audit') {
    exact(params, ['originalBasket', 'receiptLines', 'tendered', 'reportedTotal', 'reportedChange'], path);
    for (const field of ['originalBasket', 'receiptLines'] as const) {
      const lines = array(params[field], `${path}.${field}`, 1, 20);
      const lineIds = lines.map((line, index) => {
        validateReceiptLine(line, `${path}.${field}[${index}]`);
        return (line as ObjectValue).id as string;
      });
      unique(lineIds, `${path}.${field}`);
    }
    integer(params.tendered, `${path}.tendered`);
    integer(params.reportedTotal, `${path}.reportedTotal`);
    integer(params.reportedChange, `${path}.reportedChange`);
    return;
  }
  exact(params, ['budget', 'needMinimum', 'savingTarget', 'requiredResources', 'ownedResourceIds', 'readyPrice'], path);
  integer(params.budget, `${path}.budget`);
  integer(params.needMinimum, `${path}.needMinimum`);
  integer(params.savingTarget, `${path}.savingTarget`);
  const resources = array(params.requiredResources, `${path}.requiredResources`, 1, 20);
  const resourceIds = resources.map((resource, index) => {
    const item = object(resource, `${path}.requiredResources[${index}]`);
    exact(item, ['id', 'title', 'packPrice'], `${path}.requiredResources[${index}]`);
    const resourceId = id(item.id, `${path}.requiredResources[${index}].id`);
    text(item.title, `${path}.requiredResources[${index}].title`, 120);
    integer(item.packPrice, `${path}.requiredResources[${index}].packPrice`);
    return resourceId;
  });
  unique(resourceIds, `${path}.requiredResources`);
  const owned = array(params.ownedResourceIds, `${path}.ownedResourceIds`, 0, resources.length).map((item, index) => id(item, `${path}.ownedResourceIds[${index}]`));
  unique(owned, `${path}.ownedResourceIds`);
  if (owned.some((ownedId) => !resourceIds.includes(ownedId))) fail(`${path}.ownedResourceIds`, 'unknown resource ID');
  integer(params.readyPrice, `${path}.readyPrice`);
}

function validateSolution(mechanic: LessonMechanic, mode: string, params: ObjectValue, value: unknown, path: string): void {
  if (mechanic === 'allocation') {
    validateAllocation(value, path);
    return;
  }
  const solution = object(value, path);
  if (mechanic === 'basket') {
    exact(solution, ['packageCountByOfferId', 'statedTotal', 'statedRemainder'], path);
    recordOfIntegers(solution.packageCountByOfferId, `${path}.packageCountByOfferId`, 100);
    integer(solution.statedTotal, `${path}.statedTotal`);
    integer(solution.statedRemainder, `${path}.statedRemainder`);
    return;
  }
  if (mechanic === 'savings' && mode === 'schedule') {
    exact(solution, ['deposits'], path);
    const maximums = params.maxDeposits as unknown[];
    array(solution.deposits, `${path}.deposits`, maximums.length, maximums.length).forEach((item, index) => integer(item, `${path}.deposits[${index}]`));
    return;
  }
  if (mechanic === 'savings') {
    exact(solution, ['withdrawal', 'action'], path);
    integer(solution.withdrawal, `${path}.withdrawal`);
    enumeration(solution.action, ['buy', 'postpone'] as const, `${path}.action`);
    return;
  }
  if (mechanic === 'receipt_audit') {
    exact(solution, ['flaggedLineIds', 'correctedTotal', 'expectedChange'], path);
    const flagged = array(solution.flaggedLineIds, `${path}.flaggedLineIds`, 0, 20).map((item, index) => id(item, `${path}.flaggedLineIds[${index}]`));
    unique(flagged, `${path}.flaggedLineIds`);
    integer(solution.correctedTotal, `${path}.correctedTotal`);
    integer(solution.expectedChange, `${path}.expectedChange`);
    return;
  }
  exact(solution, ['checkedOwnedResourceIds', 'method', 'allocation'], path);
  const checked = array(solution.checkedOwnedResourceIds, `${path}.checkedOwnedResourceIds`, 0, 20).map((item, index) => id(item, `${path}.checkedOwnedResourceIds[${index}]`));
  unique(checked, `${path}.checkedOwnedResourceIds`);
  enumeration(solution.method, ['make', 'buy'] as const, `${path}.method`);
  validateAllocation(solution.allocation, `${path}.allocation`);
}

function safeOutcome(
  evaluator: ContentFixtureEvaluator,
  lesson: ContentLesson,
  variant: ContentVariant,
  solution: unknown,
): LessonOutcome {
  try {
    return evaluator(lesson, variant, solution);
  } catch (error) {
    if (error instanceof ContentValidationError || error instanceof TypeError) return 'invalid_input';
    throw error;
  }
}

function basketMinimum(params: ObjectValue): number {
  const offers = params.offers as ObjectValue[];
  const required = params.requiredUnits as Record<string, number>;
  let best = Number.POSITIVE_INFINITY;
  const walk = (index: number, counts: number[], total: number): void => {
    if (index === offers.length) {
      const selectedGroups = new Set<string>();
      for (let offset = 0; offset < offers.length; offset += 1) {
        const group = offers[offset].alternativeGroup;
        if (counts[offset] > 0 && typeof group === 'string') {
          if (selectedGroups.has(group)) return;
          selectedGroups.add(group);
        }
      }
      const units: Record<string, number> = {};
      for (let offset = 0; offset < offers.length; offset += 1) {
        const offer = offers[offset];
        units[offer.kind as string] = (units[offer.kind as string] ?? 0) + counts[offset] * (offer.packSize as number);
      }
      if (Object.entries(required).every(([kind, count]) => (units[kind] ?? 0) >= count)) best = Math.min(best, total);
      return;
    }
    const offer = offers[index];
    for (let count = 0; count <= (offer.maxPackages as number); count += 1) {
      walk(index + 1, [...counts, count], total + count * (offer.packPrice as number));
    }
  };
  walk(0, [], 0);
  return best;
}

export const evaluateContentFixture: ContentFixtureEvaluator = (lesson, variant, rawSolution) => {
  const params = variant.params as ObjectValue;
  try {
    validateSolution(lesson.mechanic, lesson.mode, params, rawSolution, 'fixture.solution');
  } catch (error) {
    if (error instanceof ContentValidationError) return 'invalid_input';
    throw error;
  }
  const solution = rawSolution as ObjectValue;
  if (lesson.mechanic === 'allocation') {
    const allocation = solution as ContentAllocation;
    const total = allocation.need + allocation.want + allocation.save;
    if (!Number.isSafeInteger(total) || total > (params.budget as number)) return 'invalid_input';
    return allocation.need >= (params.needMinimum as number) && allocation.save >= (params.savingTarget as number)
      ? 'meets_goal' : 'needs_review';
  }
  if (lesson.mechanic === 'basket') {
    const offers = params.offers as ObjectValue[];
    const counts = solution.packageCountByOfferId as Record<string, number>;
    const offerIds = new Set(offers.map((offer) => offer.id as string));
    if (Object.keys(counts).some((offerId) => !offerIds.has(offerId))) return 'invalid_input';
    const selectedGroups = new Set<string>();
    const units: Record<string, number> = {};
    let total = 0;
    for (const offer of offers) {
      const count = counts[offer.id as string] ?? 0;
      if (count > (offer.maxPackages as number)) return 'invalid_input';
      if (count > 0 && offer.alternativeGroup) {
        if (selectedGroups.has(offer.alternativeGroup as string)) return 'invalid_input';
        selectedGroups.add(offer.alternativeGroup as string);
      }
      total += count * (offer.packPrice as number);
      units[offer.kind as string] = (units[offer.kind as string] ?? 0) + count * (offer.packSize as number);
    }
    if (!Number.isSafeInteger(total) || total > (params.budget as number)) return 'invalid_input';
    const correctArithmetic = solution.statedTotal === total && solution.statedRemainder === (params.budget as number) - total;
    const covered = Object.entries(params.requiredUnits as Record<string, number>).every(([kind, count]) => (units[kind] ?? 0) >= count);
    if (!correctArithmetic || !covered) return 'needs_review';
    return params.preferLowerCostForEqualCoverage && total > basketMinimum(params)
      ? 'valid_alternative' : 'meets_goal';
  }
  if (lesson.mechanic === 'savings' && lesson.mode === 'schedule') {
    const deposits = solution.deposits as number[];
    const maximums = params.maxDeposits as number[];
    if (deposits.some((deposit, index) => deposit > maximums[index])) return 'invalid_input';
    const total = (params.initialSavings as number) + deposits.reduce((sum, deposit) => sum + deposit, 0);
    if (!Number.isSafeInteger(total) || total > MAX_AMOUNT) return 'invalid_input';
    return total >= (params.goalCost as number) ? 'meets_goal' : 'needs_review';
  }
  if (lesson.mechanic === 'savings') {
    const withdrawal = solution.withdrawal as number;
    if (withdrawal > (params.savings as number)) return 'invalid_input';
    const availableAfterWithdrawal = (params.available as number) + withdrawal;
    if (!Number.isSafeInteger(availableAfterWithdrawal) || availableAfterWithdrawal > MAX_AMOUNT) return 'invalid_input';
    if (solution.action === 'buy' && availableAfterWithdrawal < (params.itemCost as number)) return 'invalid_input';
    return 'meets_goal';
  }
  if (lesson.mechanic === 'receipt_audit') {
    const lines = params.receiptLines as ObjectValue[];
    const flagged = new Set(solution.flaggedLineIds as string[]);
    if ([...flagged].some((lineId) => !lines.some((line) => line.id === lineId))) return 'invalid_input';
    const key = (line: ObjectValue): string => `${line.itemId}|${line.quantity}|${line.unitPrice}`;
    const expected = (params.originalBasket as ObjectValue[]).map(key).sort();
    const remaining = lines.filter((line) => !flagged.has(line.id as string)).map(key).sort();
    if (expected.join('\n') !== remaining.join('\n')) return 'needs_review';
    const total = (params.originalBasket as ObjectValue[]).reduce((sum, line) => sum + (line.quantity as number) * (line.unitPrice as number), 0);
    if (!Number.isSafeInteger(total) || total > MAX_AMOUNT || total > (params.tendered as number)) return 'invalid_input';
    return solution.correctedTotal === total && solution.expectedChange === (params.tendered as number) - total
      ? 'meets_goal' : 'needs_review';
  }
  const checked = [...(solution.checkedOwnedResourceIds as string[])].sort();
  const owned = [...(params.ownedResourceIds as string[])].sort();
  if (checked.join('\n') !== owned.join('\n')) return 'needs_review';
  const allocation = solution.allocation as ContentAllocation;
  const total = allocation.need + allocation.want + allocation.save;
  if (!Number.isSafeInteger(total) || total > (params.budget as number)) return 'invalid_input';
  const resources = params.requiredResources as ObjectValue[];
  const missingCost = resources
    .filter((resource) => !owned.includes(resource.id as string))
    .reduce((sum, resource) => sum + (resource.packPrice as number), 0);
  const methodCost = solution.method === 'make' ? missingCost : params.readyPrice as number;
  return allocation.need >= (params.needMinimum as number) &&
    allocation.want >= methodCost && allocation.save >= (params.savingTarget as number)
    ? 'meets_goal' : 'needs_review';
};

export function validateLesson(
  raw: unknown,
  evaluator: ContentFixtureEvaluator = evaluateContentFixture,
): ContentLesson {
  const lesson = object(raw, 'lesson');
  exact(lesson, [
    'schemaVersion', 'id', 'title', 'contentVersion', 'topic', 'format', 'level',
    'observableAction', 'explanation', 'unlockPeriod', 'competencyIds', 'sourceRefs',
    'defaultVariantId', 'returnTarget', 'mechanic', 'mode', 'rendererId', 'variants',
  ], 'lesson');
  if (lesson.schemaVersion !== CONTENT_SCHEMA_VERSION) fail('lesson.schemaVersion', 'must equal 3');
  const lessonId = id(lesson.id, 'lesson.id');
  if (!/^LS-[BPS]\d{2}$/.test(lessonId)) fail('lesson.id', 'expected canonical LS-* identifier');
  text(lesson.title, 'lesson.title', 120);
  if (lesson.contentVersion !== ACTIVE_CONTENT_VERSION || !SEMVER.test(lesson.contentVersion as string)) fail('lesson.contentVersion', `must equal ${ACTIVE_CONTENT_VERSION}`);
  enumeration(lesson.topic, CONTENT_TOPICS, 'lesson.topic');
  enumeration(lesson.format, CONTENT_FORMATS, 'lesson.format');
  integer(lesson.level, 'lesson.level', 1, 3);
  text(lesson.observableAction, 'lesson.observableAction', 240);
  text(lesson.explanation, 'lesson.explanation', 500);
  integer(lesson.unlockPeriod, 'lesson.unlockPeriod', 1, 5);
  const competencies = array(lesson.competencyIds, 'lesson.competencyIds', 1, 10).map((item, index) => id(item, `lesson.competencyIds[${index}]`));
  unique(competencies, 'lesson.competencyIds');
  array(lesson.sourceRefs, 'lesson.sourceRefs', 1, 10).forEach((item, index) => text(item, `lesson.sourceRefs[${index}]`, 160));
  const defaultVariantId = id(lesson.defaultVariantId, 'lesson.defaultVariantId');
  enumeration(lesson.returnTarget, ['home', 'shop', 'budget', 'history', 'savings'] as const, 'lesson.returnTarget');
  const mechanic = enumeration(lesson.mechanic, LESSON_MECHANICS, 'lesson.mechanic');
  enumeration(lesson.mode, CONTENT_MODES[mechanic], 'lesson.mode');
  const rendererId = enumeration(lesson.rendererId, CONTENT_RENDERERS, 'lesson.rendererId');
  if (rendererId !== mechanic) fail('lesson.rendererId', 'must match mechanic in schema v3');
  const variants = array(lesson.variants, 'lesson.variants', 1, 12);
  const variantIds = variants.map((rawVariant, variantIndex) => {
    const path = `lesson.variants[${variantIndex}]`;
    const variant = object(rawVariant, path);
    exact(variant, ['id', 'params', 'copy', 'evidence', 'fixtures'], path);
    const variantId = id(variant.id, `${path}.id`);
    validateParams(mechanic, lesson.mode as string, variant.params, `${path}.params`);
    validateCopy(variant.copy, mechanic, `${path}.copy`);
    validateEvidence(variant.evidence, `${path}.evidence`);
    const fixtures = array(variant.fixtures, `${path}.fixtures`, 2, 30);
    const outcomes = fixtures.map((rawFixture, fixtureIndex) => {
      const fixturePath = `${path}.fixtures[${fixtureIndex}]`;
      const fixture = object(rawFixture, fixturePath);
      exact(fixture, ['solution', 'expectedOutcome'], fixturePath);
      const expected = enumeration(fixture.expectedOutcome, CONTENT_OUTCOMES, `${fixturePath}.expectedOutcome`);
      const actual = safeOutcome(evaluator, lesson as unknown as ContentLesson, variant as unknown as ContentVariant, fixture.solution);
      if (actual !== expected) fail(fixturePath, `fixture contradiction: expected ${expected}, evaluator returned ${actual}`);
      return expected;
    });
    if (!outcomes.includes('invalid_input')) fail(`${path}.fixtures`, 'requires an invalid_input fixture');
    if (!outcomes.some((outcome) => outcome === 'meets_goal' || outcome === 'valid_alternative')) {
      fail(`${path}.fixtures`, 'requires a feasible meets_goal or valid_alternative fixture');
    }
    return variantId;
  });
  unique(variantIds, 'lesson.variants');
  if (!variantIds.includes(defaultVariantId)) fail('lesson.defaultVariantId', 'must reference a variant');
  return lesson as unknown as ContentLesson;
}

function manifestPath(value: unknown, path: string): string {
  const result = text(value, path, 160);
  if (!BUNDLE_PATH.test(result) || result.includes('..') || result.includes('\\')) {
    fail(path, 'must be a local bundle-relative JSON path');
  }
  return result;
}

function validateManifestFile(value: unknown, path: string): ManifestFile {
  const file = object(value, path);
  exact(file, ['path', 'sha256', 'kind', 'dependsOn'], path);
  manifestPath(file.path, `${path}.path`);
  if (typeof file.sha256 !== 'string' || !SHA256.test(file.sha256)) fail(`${path}.sha256`, 'expected lowercase SHA-256');
  enumeration(file.kind, ['lesson', 'competencies', 'family_activities', 'goals', 'assets'] as const, `${path}.kind`);
  const dependencies = array(file.dependsOn, `${path}.dependsOn`, 0, 10).map((item, index) => manifestPath(item, `${path}.dependsOn[${index}]`));
  unique(dependencies, `${path}.dependsOn`);
  return file as unknown as ManifestFile;
}

function assertAcyclic(files: readonly ManifestFile[]): void {
  const paths = new Set(files.map((file) => file.path));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (path: string): void => {
    if (visiting.has(path)) fail('manifest.files', `dependency cycle at ${path}`);
    if (visited.has(path)) return;
    visiting.add(path);
    const file = files.find((candidate) => candidate.path === path);
    if (!file) fail('manifest.files', `broken dependency ${path}`);
    for (const dependency of file.dependsOn) {
      if (!paths.has(dependency)) fail('manifest.files', `broken dependency ${dependency}`);
      visit(dependency);
    }
    visiting.delete(path);
    visited.add(path);
  };
  files.forEach((file) => visit(file.path));
}

export function validateManifest(raw: unknown): ContentManifest {
  const manifest = object(raw, 'manifest');
  exact(manifest, [
    'schemaVersion', 'contentVersion', 'economyVersion', 'lessonIds',
    'familyActivityIds', 'lessons', 'competencyCatalogPath', 'familyActivitiesPath',
    'goalsPath', 'assetsPath', 'files',
  ], 'manifest');
  if (manifest.schemaVersion !== CONTENT_SCHEMA_VERSION) fail('manifest.schemaVersion', 'must equal 3');
  if (manifest.contentVersion !== ACTIVE_CONTENT_VERSION) fail('manifest.contentVersion', `must equal ${ACTIVE_CONTENT_VERSION}`);
  if (manifest.economyVersion !== CONTENT_ECONOMY_VERSION) fail('manifest.economyVersion', `must equal ${CONTENT_ECONOMY_VERSION}`);
  const lessonIds = array(manifest.lessonIds, 'manifest.lessonIds', 8, 8).map((item, index) => id(item, `manifest.lessonIds[${index}]`));
  unique(lessonIds, 'manifest.lessonIds');
  const familyIds = array(manifest.familyActivityIds, 'manifest.familyActivityIds', 3, 3).map((item, index) => id(item, `manifest.familyActivityIds[${index}]`));
  unique(familyIds, 'manifest.familyActivityIds');
  const lessons = object(manifest.lessons, 'manifest.lessons');
  exact(lessons, lessonIds, 'manifest.lessons');
  for (const lessonId of lessonIds) manifestPath(lessons[lessonId], `manifest.lessons.${lessonId}`);
  const catalogs = [
    manifestPath(manifest.competencyCatalogPath, 'manifest.competencyCatalogPath'),
    manifestPath(manifest.familyActivitiesPath, 'manifest.familyActivitiesPath'),
    manifestPath(manifest.goalsPath, 'manifest.goalsPath'),
    manifestPath(manifest.assetsPath, 'manifest.assetsPath'),
  ];
  const files = array(manifest.files, 'manifest.files', 12, 12).map((file, index) => validateManifestFile(file, `manifest.files[${index}]`));
  const filePaths = files.map((file) => file.path);
  unique(filePaths, 'manifest.files');
  for (const referenced of [...Object.values(lessons), ...catalogs]) {
    if (!filePaths.includes(referenced as string)) fail('manifest', `broken link ${referenced as string}`);
  }
  assertAcyclic(files);
  return manifest as unknown as ContentManifest;
}
