import type { PeriodState } from '../domain/economy.ts';
import type { ProfileSnapshot } from '../persistence/profile-repository.ts';
import type { LifecycleSnapshot } from '../persistence/lifecycle-repository.ts';

export type HomeAction = Readonly<{
  label: string;
  route: 'open-day' | 'plan' | 'day' | 'results' | 'waiting' | 'retry';
  enabled: boolean;
}>;

export const loadingScreenModel = Object.freeze({
  title: 'Питомец Финни',
  message: 'Готовим домик…',
  finite: true,
});

export function errorScreenModel(message?: string) {
  return Object.freeze({
    title: 'Домик пока не открылся',
    message: message ?? 'Данные остались на месте. Попробуй открыть ещё раз.',
    action: 'Попробовать снова',
  });
}

export const onboardingScreenModel = Object.freeze({
  title: 'Деньги помогают заботиться и мечтать',
  directions: Object.freeze([
    Object.freeze({ id: 'need', title: 'Нужно питомцу', hint: 'Еда и забота' }),
    Object.freeze({ id: 'want', title: 'Для радости', hint: 'Приятные покупки' }),
    Object.freeze({ id: 'save', title: 'На мечту', hint: 'Копим понемногу' }),
  ]),
  primaryAction: 'Познакомиться с Финни',
  secondaryAction: 'Уже понятно',
});

export function homeActionForState(state: PeriodState): HomeAction {
  switch (state) {
    case 'READY':
      return Object.freeze({ label: 'Начать день', route: 'open-day', enabled: true });
    case 'DRAFT':
      return Object.freeze({ label: 'Составить план', route: 'plan', enabled: true });
    case 'ACTIVE':
      return Object.freeze({ label: 'Продолжить день', route: 'day', enabled: true });
    case 'CLOSED':
      return Object.freeze({ label: 'Посмотреть итоги', route: 'results', enabled: true });
    case 'WAITING':
      return Object.freeze({ label: 'Следующий день позже', route: 'waiting', enabled: false });
    case 'STORAGE_ERROR':
      return Object.freeze({ label: 'Попробовать снова', route: 'retry', enabled: true });
    case 'NO_PROFILE':
      return Object.freeze({ label: 'Создать питомца', route: 'retry', enabled: false });
  }
}

export type HomeScreenModel = Readonly<{
  petName: string;
  dayLabel: string;
  availableLabel: string;
  savingsLabel: string;
  goalLabel: string;
  careLabel: string;
  lessonLabel: string;
  action: HomeAction;
  planAvailable: boolean;
  spendingAvailable: boolean;
  savingsAvailable: boolean;
}>;

export function homeScreenModel(
  profile: ProfileSnapshot,
  lifecycle: LifecycleSnapshot,
): HomeScreenModel {
  const day = lifecycle.periodIndex === null ? 'День ещё не начат' : `День ${lifecycle.periodIndex}`;
  const planAvailable = lifecycle.state === 'DRAFT' || lifecycle.state === 'ACTIVE';
  const moneyActionsAvailable = lifecycle.state === 'ACTIVE';
  return Object.freeze({
    petName: profile.name,
    dayLabel: day,
    availableLabel: `${lifecycle.available} монет`,
    savingsLabel: `${lifecycle.savings} монет`,
    goalLabel: 'Цель пока не выбрана',
    careLabel: 'Еда и уход — пока нет',
    lessonLabel: planAvailable
      ? 'Задание ждёт после плана'
      : 'Начни день, чтобы открыть занятие',
    action: homeActionForState(lifecycle.state),
    planAvailable,
    spendingAvailable: moneyActionsAvailable,
    savingsAvailable: moneyActionsAvailable,
  });
}
