export type LessonReturnScreen = 'home' | 'plan' | 'shop' | 'savings' | 'history';

export function lessonReturnScreen(
  lessonId: string,
  periodState: string | null | undefined,
): LessonReturnScreen {
  if (periodState === 'CLOSED' || periodState === 'WAITING' || !periodState) {
    return 'home';
  }
  if (lessonId.startsWith('LS-B')) return 'plan';
  if (lessonId === 'LS-P03') return 'history';
  if (lessonId.startsWith('LS-P')) return 'shop';
  if (lessonId.startsWith('LS-S')) return 'savings';
  return 'home';
}

export function lessonReturnLabel(target: LessonReturnScreen): string {
  if (target === 'plan') return 'К плану и факту дня';
  if (target === 'shop') return 'К покупкам дня';
  if (target === 'savings') return 'К копилке дня';
  if (target === 'history') return 'К истории дня';
  return 'Вернуться в домик';
}
export function nextLessonVariant<T extends Readonly<{ definition: Readonly<{ variantId: string }> }>>(
  variants: readonly T[],
  previousVariantId: string,
): T {
  if (variants.length === 0) throw new TypeError('Lesson has no variants');
  const previousIndex = variants.findIndex((item) => item.definition.variantId === previousVariantId);
  return variants[(previousIndex + 1) % variants.length];
}