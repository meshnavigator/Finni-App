import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { ROOT_ROUTES, isRootRoute, usesLargeNavigation } from '../src/ui/root-navigation.ts';
import { homeScreenModel } from '../src/application/ui-model.ts';
import { homeNextStep } from '../src/ui/home-next-step.ts';
import { homeColors } from '../src/ui/home-colors.ts';
const require = createRequire(import.meta.url);

// Execute the real JSX with host primitives; layout is verified separately on Android.
function component(file, dimensions = { width: 360, height: 640, fontScale: 1 }) {
  const values = []; let cursor = 0;
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL('../src/ui/' + file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: (id) => {
    if (id === 'react') return {
      useState: (initial) => { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], (value) => { values[index] = value; }]; },
      useEffect: () => {}, useCallback: (callback) => callback,
    };
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'react-native') return { ...Object.fromEntries(['View', 'Text', 'Pressable', 'Image', 'Modal', 'ScrollView'].map((x) => [x, x])), StyleSheet: { create: (x) => x, absoluteFill: {} }, useWindowDimensions: () => dimensions };
    if (id === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
    if (id.endsWith('root-navigation.ts')) return { ROOT_ROUTES, usesLargeNavigation };
    if (id.endsWith('ui-model.ts')) return { homeScreenModel };
    if (id.endsWith('home-next-step.ts')) return { homeNextStep };
    if (id.endsWith('home-colors.ts')) return { homeColors };
    if (id.endsWith('room-assets.ts')) return { goalSource: () => null };
    if (id.endsWith('FinniHomeScene.tsx')) return 'FinniHomeScene';
    if (id.endsWith('.png')) return id;
    throw new Error('Unexpected dependency: ' + id);
  } });
  return (name, props) => { cursor = 0; return module.exports[name](props); };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function content(tree) {
  if (Array.isArray(tree)) return tree.map(content).join('');
  if (tree === null || tree === undefined || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? content(tree.props?.children) : String(tree);
}

test('persistent tabs route to five peers and expose exactly the active screen', () => {
  const render = component('RootNavigation.tsx');
  for (const selected of ROOT_ROUTES) {
    const calls = [];
    const tree = render('RootNavigation', { selected: selected.id, onNavigate: (id) => calls.push(id) });
    const tabs = nodes(tree).filter((n) => n.props.accessibilityRole === 'tab');
    assert.equal(tabs.length, 5);
    assert.deepEqual(tabs.filter((n) => n.props.accessibilityState.selected).map((n) => n.props.accessibilityLabel), [selected.label]);
    tabs.forEach((n) => n.props.onPress());
    assert.deepEqual(calls, ROOT_ROUTES.map(({ id }) => id));
  }
  for (const detail of ['pet', 'lesson', 'result', 'adult', 'history']) assert.equal(isRootRoute(detail), false);
});

test('More actions keep their intent; menu dismiss is a button without a forward arrow', () => {
  const render = component('RootNavigation.tsx'); const calls = [];
  const tree = render('MoreScreen', { name: 'Финни', day: 'День 1', demo: false, busy: false,
    onLessons: () => calls.push('lessons'), onProgress: () => calls.push('progress'), onPet: () => calls.push('pet'), onHelp: () => calls.push('help'), onAdult: () => calls.push('adult') });
  const actions = nodes(tree).filter((n) => n.type === 'Pressable');
  assert.deepEqual(actions.map(content), ['Все занятия', 'Прогресс', 'Имя и внешность', 'Как играть', 'Для взрослого']);
  actions.forEach((n) => n.props.onPress());
  assert.deepEqual(calls, ['lessons', 'progress', 'pet', 'help', 'adult']);
  let closed = 0;
  const menu = render('RootMenu', { visible: true, selected: 'shop', onClose: () => closed++, onNavigate: () => {} });
  const close = nodes(menu).find((n) => n.props.testID === 'root-menu-close');
  assert.equal(nodes(close).filter((n) => n.type === 'Image').length, 0);
  close.props.onPress(); menu.props.onRequestClose(); assert.equal(closed, 2);
});

test('enlarged Home menu remains navigation during a reaction; skip targets only that reaction', () => {
  const render = component('HomeScreen.tsx', { width: 360, height: 640, fontScale: 2 });
  const calls = [];
  const props = { snapshot: { profile: { name: 'Финни', shapeId: 'pointy', patternId: 'plain' }, lifecycle: { state: 'ACTIVE', available: 100, savings: 300, petStage: 2 }, commerce: { selectedGoal: { id: 'GL-03', name: 'Домик для Финни', cost: 300 }, purchases: [], claimedGoalIds: [] } },
    busy: false, notice: null, reaction: { id: 42, expression: 'inspired', skippable: true }, onMenu: () => calls.push('menu'), onSection: (id) => calls.push(id), onReactionFinished: () => {}, onReactionCancelled: () => {} };
  let tree = render('default', props);
  nodes(tree).find((n) => n.props.testID === 'home-sections').props.onPress();
  assert.deepEqual(calls, ['menu']);
  nodes(tree).find((n) => n.props.testID === 'home-skip-reaction').props.onPress();
  tree = render('default', props);
  assert.equal(nodes(tree).find((n) => n.type === 'FinniHomeScene').props.skipReactionId, 42);
  assert.equal(nodes(tree).some((n) => n.props.testID === 'home-skip-reaction'), false);
  assert.equal(nodes(tree).find((n) => n.props.testID === 'home-sections').props.accessibilityLabel, 'Меню');
  assert.match(content(tree), /Можно получить мечту/);
  assert.doesNotMatch(content(tree), /ещё 0/);
  nodes(tree).find((n) => n.props.testID === 'home-goal').props.onPress();
  assert.deepEqual(calls, ['menu', 'Копилка']);
});


test('Android float32 fontScale keeps the 120 percent setting in the ordinary layout', () => {
  for (const scale of [1, 1.19, 1.2, Math.fround(1.2)]) assert.equal(usesLargeNavigation(scale), false);
  for (const scale of [1.21, 1.5, 2]) assert.equal(usesLargeNavigation(scale), true);
});
