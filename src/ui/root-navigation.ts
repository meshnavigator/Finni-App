/** Root tabs are peers. Details keep their origin outside the tab bar. */
export const ROOT_ROUTES = [
  { id: 'home', label: 'Домик', icon: 'home' },
  { id: 'plan', label: 'План', icon: 'plan' },
  { id: 'shop', label: 'Покупки', icon: 'shop' },
  { id: 'savings', label: 'Копилка', icon: 'savings' },
  { id: 'more', label: 'Ещё', icon: 'menu' },
] as const;

export type RootRoute = typeof ROOT_ROUTES[number]['id'];

export function isRootRoute(screen: string): screen is RootRoute {
  return ROOT_ROUTES.some(({ id }) => id === screen);
}

/** Android reports float32 scales such as 1.2000000477 for the 120% setting.
 * Normalize the layout decision only; text keeps its complete system scaling.
 */
export function usesLargeNavigation(fontScale: number): boolean {
  return Math.round(fontScale * 100) > 120;
}
