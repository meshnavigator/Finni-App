import { CATALOG, GOALS } from '../domain/catalog.ts';
import type { HomeReaction } from './FinniHomeScene.tsx';
import { petCatalogText } from './pet-copy.ts';

export type ReactionMessage = Readonly<{
  tag: string;
  title: string;
  detail: string;
  icon: 'book' | 'care' | 'food' | 'mood' | 'plan' | 'savings';
  tone: 'ochre' | 'lilac' | 'teal' | 'coral';
}>;

export function homeReactionMessage(reaction: HomeReaction, petName: string): ReactionMessage {
  const item = CATALOG.find((entry) => entry.id === reaction.objectId);
  switch (reaction.clip) {
    case 'AN-006': return { tag: 'Мечта', title: `${petName} выбирает мечту!`, detail: 'Новая цель выбрана', icon: 'savings', tone: 'lilac' };
    case 'AN-007': return item
      ? { tag: 'Игра', title: `${petName} радуется!`, detail: `Выбрано: ${petCatalogText(item.name, petName)}`, icon: 'mood', tone: 'coral' }
      : { tag: 'Ура!', title: `${petName} радуется!`, detail: 'Ещё один полезный шаг', icon: 'mood', tone: 'coral' };
    case 'AN-009': return { tag: 'Еда', title: `${petName} ест и радуется!`, detail: item ? `Выбрано: ${petCatalogText(item.name, petName)}` : 'Еда на сегодня выбрана', icon: 'food', tone: 'ochre' };
    case 'AN-010': return { tag: 'Забота', title: `${petName} радуется уходу!`, detail: item ? `Выбрано: ${petCatalogText(item.name, petName)}` : 'Уход на сегодня выбран', icon: 'care', tone: 'lilac' };
    case 'AN-011': return { tag: 'План', title: `${petName} строит план!`, detail: 'План на день сохранён', icon: 'plan', tone: 'teal' };
    case 'AN-012': return reaction.value > 0
      ? { tag: 'Копилка', title: `${petName} копит на мечту!`, detail: `В копилке +${reaction.value} монет`, icon: 'savings', tone: 'teal' }
      : { tag: 'Монеты', title: `${petName} считает монеты!`, detail: reaction.value < 0 ? `В кошельке +${Math.abs(reaction.value)} монет` : 'Баланс обновлён', icon: 'savings', tone: 'teal' };
    case 'AN-013': {
      const goal = GOALS.find((entry) => entry.id === reaction.objectId);
      return { tag: 'Мечта', title: `${petName} встречает мечту!`, detail: goal ? petCatalogText(goal.name, petName) : 'Мечта получена', icon: 'savings', tone: 'coral' };
    }
    case 'AN-014': return { tag: 'Рост', title: `${petName} растёт!`, detail: 'Новая стадия открыта', icon: 'mood', tone: 'coral' };
    default: return { tag: 'Выбор', title: `${petName} радуется!`, detail: 'Новый шаг сделан', icon: 'mood', tone: 'teal' };
  }
}
