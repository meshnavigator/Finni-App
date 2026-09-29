import { amount, type Amount } from './numeric.ts';

export type PurchaseCategory = 'need' | 'want';
export type PurchaseSlot = 'food' | 'care' | 'activity';
export type CatalogItem = Readonly<{ id: string; name: string; price: Amount; category: PurchaseCategory; slot: PurchaseSlot; effect: string }>;
export type SavingsGoal = Readonly<{ id: string; name: string; cost: Amount }>;

function item(id: string, name: string, price: number, category: PurchaseCategory, slot: PurchaseSlot, effect: string): CatalogItem {
  return Object.freeze({ id, name, price: amount(price), category, slot, effect });
}

export const CATALOG: readonly CatalogItem[] = Object.freeze([
  item('IT-01', 'Полезный корм', 30, 'need', 'food', 'Финни сыт'),
  item('IT-02', 'Праздничное меню', 40, 'need', 'food', 'Финни сыт и рад'),
  item('IT-03', 'Щётка для шерсти', 10, 'need', 'care', 'Уход за Финни'),
  item('IT-04', 'Набор заботы', 15, 'need', 'care', 'Финни ухожен'),
  item('IT-05', 'Мячик', 20, 'want', 'activity', 'Весёлая игра'),
  item('IT-06', 'Книга историй', 30, 'want', 'activity', 'Тихая радость'),
  item('IT-07', 'Набор для прогулки', 45, 'want', 'activity', 'Большое приключение'),
  item('IT-08', 'Праздник для Финни', 90, 'want', 'activity', 'Особенный день'),
]);

export const GOALS: readonly SavingsGoal[] = Object.freeze([
  Object.freeze({ id: 'GL-01', name: 'Воздушный змей', cost: amount(150) }),
  Object.freeze({ id: 'GL-02', name: 'Самокат', cost: amount(220) }),
  Object.freeze({ id: 'GL-03', name: 'Домик для Финни', cost: amount(300) }),
]);

export function catalogItem(itemId: string): CatalogItem {
  const found = CATALOG.find((entry) => entry.id === itemId);
  if (!found) throw new TypeError(`Unknown catalog item: ${itemId}`);
  return found;
}

export function savingsGoal(goalId: string): SavingsGoal {
  const found = GOALS.find((entry) => entry.id === goalId);
  if (!found) throw new TypeError(`Unknown savings goal: ${goalId}`);
  return found;
}
