import type { LessonDefinition } from '../domain/lesson.ts';
import type { ContentLesson, ContentManifest, ContentVariant } from './schema-v3.ts';
import { validateLesson, validateManifest } from './validator.ts';

export type ContentDocuments = Readonly<Record<string, unknown>>;

function cloneAndFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => cloneAndFreeze(item))) as T;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, cloneAndFreeze(item)] as const);
    return Object.freeze(Object.fromEntries(entries)) as T;
  }
  return value;
}

export type LoadedContentBundle = Readonly<{
  manifest: ContentManifest;
  lessons: ReadonlyMap<string, ContentLesson>;
}>;

export function loadContentBundle(
  rawManifest: unknown,
  documents: ContentDocuments,
): LoadedContentBundle {
  const manifest = validateManifest(rawManifest);
  const lessons = new Map<string, ContentLesson>();
  for (const lessonId of manifest.lessonIds) {
    const path = manifest.lessons[lessonId];
    if (!(path in documents)) throw new TypeError(`Missing content document ${path}`);
    const lesson = validateLesson(documents[path]);
    if (lesson.id !== lessonId) throw new TypeError(`Manifest key ${lessonId} points to ${lesson.id}`);
    if (lesson.contentVersion !== manifest.contentVersion) throw new TypeError(`Version mismatch for ${lessonId}`);
    lessons.set(lessonId, cloneAndFreeze(lesson));
  }
  return Object.freeze({ manifest: cloneAndFreeze(manifest), lessons });
}

/**
 * Creates the immutable S3-001 attempt snapshot. Mode is included in parameters
 * so evaluator adapters can dispatch without re-reading the active bundle.
 */
export function lessonDefinitionSnapshot(
  lesson: ContentLesson,
  variantId: string = lesson.defaultVariantId,
): LessonDefinition {
  const variant = lesson.variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new TypeError(`Unknown variant ${variantId} for ${lesson.id}`);
  return cloneAndFreeze({
    lessonId: lesson.id,
    contentVersion: lesson.contentVersion,
    variantId: variant.id,
    mechanic: lesson.mechanic,
    parameters: {
      mode: lesson.mode,
      rendererId: lesson.rendererId,
      ...variant.params,
    },
    hints: [...variant.copy.hints] as [string, string],
  });
}

export function variantById(lesson: ContentLesson, variantId: string): ContentVariant {
  const variant = lesson.variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new TypeError(`Unknown variant ${variantId} for ${lesson.id}`);
  return variant;
}
