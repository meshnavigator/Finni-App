import type { PeriodState } from '../domain/economy.ts';

type NextStepInput = Readonly<{
  state: PeriodState; hasFood: boolean; hasCare: boolean; hasGoal: boolean;
  allGoals: boolean; savings: number; large: boolean; demo: boolean;
}>;
export type HomeNextStep = Readonly<{
  label: string; route: 'open-day' | 'План' | 'Покупки' | 'Копилка' | 'results' | 'waiting' | 'advance-demo-day';
}>;

/** A contextual route, never a financial command or an automatic day close. */
export function homeNextStep(input: NextStepInput): HomeNextStep {
  switch (input.state) {
    case 'READY': return { label: 'Начать день', route: 'open-day' };
    case 'DRAFT': return { label: 'Составить план', route: 'План' };
    case 'ACTIVE':
      if (!input.hasFood || !input.hasCare) return { label: input.large ? 'Еда и уход' : 'Выбрать еду и уход', route: 'Покупки' };
      if (!input.hasGoal && !input.allGoals) return { label: 'Выбрать мечту', route: 'Копилка' };
      if (input.hasGoal && input.savings === 0) return { label: input.large ? 'Копить на мечту' : 'Отложить на мечту', route: 'Копилка' };
      return { label: 'Проверить итоги', route: 'results' };
    case 'CLOSED': return { label: 'Итоги дня', route: 'results' };
    case 'WAITING': return input.demo
      ? { label: 'Следующий демо-день', route: 'advance-demo-day' }
      : { label: input.large ? 'День позже' : 'Следующий день позже', route: 'waiting' };
    default: return { label: input.large ? 'День позже' : 'Следующий день позже', route: 'waiting' };
  }
}
