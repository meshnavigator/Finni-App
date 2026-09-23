import type { LessonMechanic, LessonOutcome } from '../domain/lesson.ts';

export const CONTENT_SCHEMA_VERSION = 3 as const;
export const ACTIVE_CONTENT_VERSION = '1.2.0' as const;
export const CONTENT_ECONOMY_VERSION = 'economy-v2' as const;

export const CONTENT_TOPICS = ['budget', 'purchases', 'savings'] as const;
export type ContentTopic = (typeof CONTENT_TOPICS)[number];

export const CONTENT_FORMATS = ['standard', 'detective', 'workshop'] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const CONTENT_RENDERERS = [
  'allocation',
  'basket',
  'savings',
  'receipt_audit',
  'resource_choice',
] as const;
export type ContentRendererId = (typeof CONTENT_RENDERERS)[number];

export const CONTENT_OUTCOMES = [
  'meets_goal',
  'valid_alternative',
  'needs_review',
  'invalid_input',
] as const satisfies readonly LessonOutcome[];

export const CONTENT_MODES = {
  allocation: ['basic', 'changed_need'],
  basket: ['shopping_list', 'compare_offers'],
  savings: ['schedule', 'withdrawal_preview'],
  receipt_audit: ['duplicate_line'],
  resource_choice: ['make_or_buy'],
} as const satisfies Readonly<Record<LessonMechanic, readonly string[]>>;

export type ContentMode<M extends LessonMechanic = LessonMechanic> =
  (typeof CONTENT_MODES)[M][number];

export type ContentAllocation = Readonly<{
  need: number;
  want: number;
  save: number;
}>;

export type ContentFixture = Readonly<{
  solution: unknown;
  expectedOutcome: LessonOutcome;
}>;

export type ContentCopy = Readonly<{
  intro: string;
  hints: readonly [string, string];
  feedback: Readonly<Record<LessonOutcome, string>>;
}>;

export type ContentEvidence = Readonly<{
  id: string;
  text: string;
  assetId?: string;
}>;

export type ContentVariant = Readonly<{
  id: string;
  params: Readonly<Record<string, unknown>>;
  copy: ContentCopy;
  evidence: readonly ContentEvidence[];
  fixtures: readonly ContentFixture[];
}>;

export type ContentLesson = Readonly<{
  schemaVersion: typeof CONTENT_SCHEMA_VERSION;
  id: string;
  title: string;
  contentVersion: string;
  topic: ContentTopic;
  format: ContentFormat;
  level: 1 | 2 | 3;
  observableAction: string;
  explanation: string;
  unlockPeriod: number;
  competencyIds: readonly string[];
  sourceRefs: readonly string[];
  defaultVariantId: string;
  returnTarget: 'home' | 'shop' | 'budget' | 'history' | 'savings';
  mechanic: LessonMechanic;
  mode: ContentMode;
  rendererId: ContentRendererId;
  variants: readonly ContentVariant[];
}>;

export type ManifestFileKind =
  | 'lesson'
  | 'competencies'
  | 'family_activities'
  | 'goals'
  | 'assets';

export type ManifestFile = Readonly<{
  path: string;
  sha256: string;
  kind: ManifestFileKind;
  dependsOn: readonly string[];
}>;

export type ContentManifest = Readonly<{
  schemaVersion: typeof CONTENT_SCHEMA_VERSION;
  contentVersion: string;
  economyVersion: string;
  lessonIds: readonly string[];
  familyActivityIds: readonly string[];
  lessons: Readonly<Record<string, string>>;
  competencyCatalogPath: string;
  familyActivitiesPath: string;
  goalsPath: string;
  assetsPath: string;
  files: readonly ManifestFile[];
}>;

/** Adapter used at integration to compare content fixtures with concrete evaluators. */
export type ContentFixtureEvaluator = (
  lesson: ContentLesson,
  variant: ContentVariant,
  solution: unknown,
) => LessonOutcome;
