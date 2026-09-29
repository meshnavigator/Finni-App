from pathlib import Path
p=Path('src/ui/root-navigation.ts');s=p.read_text(encoding='utf-8');s+='''
/** Android reports float32 scales such as 1.2000000477 for the 120% setting.
 * Normalize the layout decision only; text keeps its complete system scaling.
 */
export function usesLargeNavigation(fontScale: number): boolean {
  return Math.round(fontScale * 100) > 120;
}
''';p.write_text(s,encoding='utf-8')
p=Path('src/ui/HomeScreen.tsx');s=p.read_text(encoding='utf-8');s=s.replace("import { homeNextStep } from './home-next-step.ts';", "import { homeNextStep } from './home-next-step.ts';\nimport { usesLargeNavigation } from './root-navigation.ts';");s=s.replace('const large = viewport.fontScale > 1.2;', 'const large = usesLargeNavigation(viewport.fontScale);');p.write_text(s,encoding='utf-8')
p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8');s=s.replace('isRootRoute, type RootRoute','isRootRoute, usesLargeNavigation, type RootRoute');s=s.replace('  const { fontScale } = useWindowDimensions();', '  const { fontScale } = useWindowDimensions();\n  const largeNavigation = usesLargeNavigation(fontScale);');s=s.replace('root && fontScale <= 1.2', 'root && !largeNavigation').replace('root && fontScale > 1.2', 'root && largeNavigation');p.write_text(s,encoding='utf-8')
p=Path('tests/root-navigation.test.mjs');s=p.read_text(encoding='utf-8');s=s.replace('ROOT_ROUTES, isRootRoute }','ROOT_ROUTES, isRootRoute, usesLargeNavigation }');s=s.replace('return { ROOT_ROUTES };', 'return { ROOT_ROUTES, usesLargeNavigation };');s+='''

test('Android float32 fontScale keeps the 120 percent setting in the ordinary layout', () => {
  for (const scale of [1, 1.19, 1.2, Math.fround(1.2)]) assert.equal(usesLargeNavigation(scale), false);
  for (const scale of [1.21, 1.5, 2]) assert.equal(usesLargeNavigation(scale), true);
});
''';p.write_text(s,encoding='utf-8')
