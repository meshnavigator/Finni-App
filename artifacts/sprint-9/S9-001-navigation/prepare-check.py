from pathlib import Path
p=Path('src/ui/SavingsScreen.tsx');s=p.read_text(encoding='utf-8')
a=s.index('            <Button\n              disabled={props.busy || lifecycle.savings < selected.cost}')
b=s.index('            <Button disabled={props.busy} label="Снять выбор цели"',a)
claim=s[a:b]
s=s[:a]+s[b:]
anchor='        <View style={styles.transferCard}>'
s=s.replace(anchor,'''        {selected && <View style={styles.goalCard}>
          <Text style={styles.cardTitle}>Мечта · {selected.name}</Text>
'''+claim+'''        </View>}

'''+anchor)
p.write_text(s,encoding='utf-8')
# Update existing source-level guard to assert isolation owned by the new shell.
p=Path('tests/profile-ui.test.mjs');s=p.read_text(encoding='utf-8');a=s.index("  assert.match(source, /react-native-safe-area-context/);");b=s.index("  assert.match(app, /function HelpOverlay/);",a)
s=s[:a]+'''  assert.match(source, /importantForAccessibility=\\{props\\.notice \\? 'no-hide-descendants'/);
  assert.match(source, /minHeight: 48/);
  for (const label of ['Доступно', 'Копилка', 'Цель', 'Занятие']) assert.ok(source.includes(label));
  assert.doesNotMatch(source, /numberOfLines|maxFontSizeMultiplier|reviewConflict/);
  const app = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');
  assert.match(app, /react-native-safe-area-context/);
  assert.match(app, /importantForAccessibility=\\{rootMenuOpen \\|\\| helpOpen/);
  const navigation = readFileSync(new URL('../src/ui/RootNavigation.tsx', import.meta.url), 'utf8');
  assert.match(navigation, /onRequestClose=\\{onClose\\}/);
  assert.match(navigation, /Для взрослого/);
'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('artifacts/sprint-9/S9-001-navigation/build.ps1');s=Path('artifacts/sprint-9/S9-001-structure/build.ps1').read_text(encoding='utf-8').replace('S9-001-structure/build-final.log','S9-001-navigation/build-prototype.log');p.write_text(s,encoding='utf-8')
