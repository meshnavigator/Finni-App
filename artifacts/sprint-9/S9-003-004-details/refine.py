from pathlib import Path
import re
p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('  lessons: readonly LocalLessonPresentation[];','  lessons: readonly LocalLessonPresentation[];\n  busy: boolean;\n  message: string | null;')
s=s.replace('<Text style={ui.body}>Это задания для тренировки: покупки и переводы из копилки здесь не выполняются.</Text>','<Text style={ui.body}>Это задания для тренировки: покупки и переводы из копилки здесь не выполняются.</Text>\n        {props.message && <Text accessibilityLiveRegion="polite" style={ui.error}>{props.message}</Text>}')
s=s.replace('                accessibilityRole="button"','                accessibilityRole="button"\n                accessibilityState={{ disabled: props.busy }}\n                disabled={props.busy}')
s=s.replace('          lessons={LOCAL_DEMO_LESSONS}','          lessons={LOCAL_DEMO_LESSONS}\n          busy={busy}\n          message={message}')
p.write_text(s,encoding='utf-8')
p=Path('src/ui/AdultScreen.tsx');s=p.read_text(encoding='utf-8').replace('Данные normal и demo хранятся раздельно только на устройстве.','Обычная игра и демонстрация хранятся раздельно только на этом устройстве.');p.write_text(s,encoding='utf-8')
helper="""import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const module = { exports: {} };
const source = ts.transpileModule(readFileSync(new URL('../src/ui/screen-theme.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(source, { module, exports: module.exports, require: (id) => {
  assert.equal(id, 'react-native');
  return { StyleSheet: { create: (styles) => styles } };
} });

export function assertSharedControlTargets(consumer) {
  assert.match(consumer, /screen-theme\\.ts/);
  assert.match(consumer, /ui\\.button/);
  for (const key of ['button', 'input']) {
    assert.ok(module.exports.screenStyles[key].minHeight >= 48, key + ' needs a 48dp target');
    assert.ok(module.exports.screenStyles[key].paddingVertical >= 8, key + ' needs space around enlarged text');
  }
}
"""
Path('tests/ui-control-contract.mjs').write_text(helper,encoding='utf-8')
root=Path('artifacts/sprint-9/S9-003-004-details/before/tests');root.mkdir(parents=True,exist_ok=True)
for n in ['budget-purchase-renderers.test.mjs','lesson-shell.test.mjs','period-close.test.mjs','receipt-workshop-renderers.test.mjs','savings-lesson.test.mjs']:
 p=Path('tests')/n
 (root/(n+'.txt')).write_bytes(p.read_bytes())
 s="import { assertSharedControlTargets } from './ui-control-contract.mjs';\n"+re.sub(r'assert.match\((renderer|source|screen), /minHeight: 48/g?\);',r'assertSharedControlTargets(\1);',p.read_text(encoding='utf-8'))
 p.write_text(s,encoding='utf-8')
print('Visible catalog error and shared style test contracts updated')

