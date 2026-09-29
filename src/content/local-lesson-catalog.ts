import type { LessonDefinition } from '../domain/lesson.ts';
import {
  lessonDefinitionSnapshot,
  loadContentBundle,
  variantById,
} from './loader.ts';

export type LessonEvidence = Readonly<{
  id: string;
  text: string;
}>;

export type LessonVariantPresentation = Readonly<{
  definition: LessonDefinition;
  title: string;
  intro: string;
  evidence: readonly LessonEvidence[];
}>;

export type LocalLessonPresentation = LessonVariantPresentation & Readonly<{
  variants: readonly LessonVariantPresentation[];
  unlockPeriod: number;
}>;

const rawManifest = require('../../content/bundles/1.2.0/manifest.json') as unknown;

const LOCAL_BUNDLE = loadContentBundle(rawManifest, {
  'lessons/LS-B01.json': require('../../content/bundles/1.2.0/lessons/LS-B01.json'),
  'lessons/LS-B02.json': require('../../content/bundles/1.2.0/lessons/LS-B02.json'),
  'lessons/LS-B03.json': require('../../content/bundles/1.2.0/lessons/LS-B03.json'),
  'lessons/LS-P01.json': require('../../content/bundles/1.2.0/lessons/LS-P01.json'),
  'lessons/LS-P02.json': require('../../content/bundles/1.2.0/lessons/LS-P02.json'),
  'lessons/LS-P03.json': require('../../content/bundles/1.2.0/lessons/LS-P03.json'),
  'lessons/LS-S01.json': require('../../content/bundles/1.2.0/lessons/LS-S01.json'),
  'lessons/LS-S02.json': require('../../content/bundles/1.2.0/lessons/LS-S02.json'),
});

const DEMO_LESSON_IDS = [
  'LS-B01',
  'LS-B02',
  'LS-B03',
  'LS-P01',
  'LS-P02',
  'LS-P03',
  'LS-S01',
  'LS-S02',
] as const;

function presentation(
  lessonId: (typeof DEMO_LESSON_IDS)[number],
  variantId: string,
): LessonVariantPresentation {
  const lesson = LOCAL_BUNDLE.lessons.get(lessonId);
  if (!lesson) throw new TypeError(`Bundled demo lesson ${lessonId} is missing`);
  const definition = lessonDefinitionSnapshot(lesson, variantId);
  const variant = variantById(lesson, variantId);
  return Object.freeze({
    definition,
    title: lesson.title,
    intro: variant.copy.intro,
    evidence: Object.freeze(variant.evidence.map((item) => Object.freeze({
      id: item.id,
      text: item.text,
    }))),
  });
}

function catalogEntry(lessonId: (typeof DEMO_LESSON_IDS)[number]): LocalLessonPresentation {
  const lesson = LOCAL_BUNDLE.lessons.get(lessonId);
  if (!lesson) throw new TypeError(`Bundled demo lesson ${lessonId} is missing`);
  const variants = Object.freeze(lesson.variants.map((variant) => presentation(lessonId, variant.id)));
  const defaultPresentation = variants.find((item) => item.definition.variantId === lesson.defaultVariantId);
  if (!defaultPresentation) throw new TypeError(`Default variant for ${lessonId} is missing`);
  return Object.freeze({ ...defaultPresentation, variants, unlockPeriod: lesson.unlockPeriod });
}

/** Eight lesson topics, with every validated built-in variant selectable in the demo. */
export const LOCAL_DEMO_LESSONS = Object.freeze(DEMO_LESSON_IDS.map(catalogEntry));
/** Manifest order is the recommendation order; presentation registry may group topics differently. */
export const HOME_LESSON_ORDER = Object.freeze(LOCAL_BUNDLE.manifest.lessonIds);
