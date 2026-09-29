import assert from 'node:assert/strict';
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
  assert.match(consumer, /screen-theme\.ts/);
  assert.match(consumer, /ui\.button/);
  for (const key of ['button', 'input']) {
    assert.ok(module.exports.screenStyles[key].minHeight >= 48, key + ' needs a 48dp target');
    assert.ok(module.exports.screenStyles[key].paddingVertical >= 8, key + ' needs space around enlarged text');
  }
}
