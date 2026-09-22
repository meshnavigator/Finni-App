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

export type LocalLessonPresentation = Readonly<{
  definition: LessonDefinition;
  title: string;
  intro: string;
  evidence: readonly LessonEvidence[];
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
  'LS-P01',
  'LS-P02',
  'LS-S01',
  'LS-S02',
] as const;

function presentation(lessonId: (typeof DEMO_LESSON_IDS)[number]): LocalLessonPresentation {
  const lesson = LOCAL_BUNDLE.lessons.get(lessonId);
  if (!lesson) throw new TypeError(`Bundled demo lesson ${lessonId} is missing`);
  const definition = lessonDefinitionSnapshot(lesson);
  const variant = variantById(lesson, definition.variantId);
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

/** Built-in content is validated before the demo catalog becomes reachable by UI. */
export const LOCAL_DEMO_LESSONS = Object.freeze(DEMO_LESSON_IDS.map(presentation));
