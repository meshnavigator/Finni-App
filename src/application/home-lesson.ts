import type { Mode } from '../domain/contracts.ts';
import type { HomeLessonHistory } from '../persistence/lesson-repository.ts';

/** SRS §11.7: unfinished → first unfinished in manifest → circular practice. */
export function recommendHomeLesson<T extends Readonly<{ definition: Readonly<{ lessonId: string }>; unlockPeriod: number; title: string }>>(
  mode: Mode,
  period: number | null,
  history: readonly HomeLessonHistory[],
  catalog: readonly T[],
  manifestOrder: readonly string[],
): T | null {
  const available = manifestOrder.flatMap((id) => {
    const item = catalog.find((entry) => entry.definition.lessonId === id);
    return item && (mode === 'demo' || item.unlockPeriod <= (period ?? 0)) ? [item] : [];
  });
  const rows = [...history].sort((a, b) => b.sequence - a.sequence);
  const unfinished = rows.find((entry) => ['draft', 'evaluated', 'explanation_seen'].includes(entry.phase)
    && available.some((item) => item.definition.lessonId === entry.lessonId));
  if (unfinished) return available.find((item) => item.definition.lessonId === unfinished.lessonId)!;
  const completed = new Set(rows.filter((entry) => entry.phase === 'completed').map((entry) => entry.lessonId));
  const first = available.find((item) => !completed.has(item.definition.lessonId));
  if (first) return first;
  const last = rows.find((entry) => entry.phase === 'completed' && available.some((item) => item.definition.lessonId === entry.lessonId));
  if (!available.length) return null;
  const index = available.findIndex((item) => item.definition.lessonId === last?.lessonId);
  return available[(index + 1) % available.length]!;
}
