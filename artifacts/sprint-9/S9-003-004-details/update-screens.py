from pathlib import Path
P=Path('src/ui')
def write(name,s): (P/name).write_text(s.rstrip()+'\n',encoding='utf-8')
def read(name): return (P/name).read_text(encoding='utf-8')
def rep(s,a,b):
 assert a in s,a[:120]
 return s.replace(a,b)
def styles(s,value): return s[:s.index('const styles = StyleSheet.create(')]+value
imports="import DetailBack from './DetailBack.tsx';\nimport { palette, screenStyles as ui } from './screen-theme.ts';\n"

# The outer AppRoot owns native insets. Details remain ordinary Views; Help has
# its own SafeAreaView because it is a native modal.
for name in ['AdultScreen.tsx','HelpScreen.tsx','HistoryScreen.tsx','PeriodResultScreen.tsx','LessonShell.tsx']:
 s=read(name).replace('SafeAreaView, ', '').replace('  SafeAreaView,\n','').replace('<SafeAreaView','<View').replace('</SafeAreaView>','</View>')
 s=imports+s
 s=s.replace('<Text style={styles.title}>','<Text accessibilityRole="header" style={styles.title}>')
 s=s.replace('<Text style={styles.cardTitle}>','<Text accessibilityRole="header" style={styles.cardTitle}>')
 write(name,s)

s=read('HelpScreen.tsx')
s=rep(s,'<ScrollView contentContainerStyle={styles.content}>','<ScrollView contentContainerStyle={styles.content}>\n        <DetailBack onPress={props.onBack} label="Закрыть справку" />')
s=styles(s,"""const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title,
  intro: { ...ui.body, backgroundColor: palette.soft, borderRadius: 18, padding: 14 },
  card: ui.card, term: ui.cardTitle, definition: ui.body,
  button: ui.button, buttonText: ui.buttonText,
});
""")
write('HelpScreen.tsx',s)

s=read('HistoryScreen.tsx')
s=rep(s,'<ScrollView contentContainerStyle={styles.content}>','<ScrollView contentContainerStyle={styles.content}>\n        <DetailBack onPress={props.onBack} />')
s=s.replace('<Text style={styles.sectionTitle}>','<Text accessibilityRole="header" style={styles.sectionTitle}>')
s=rep(s,'style={styles.discoveryToggle}','style={({ pressed }) => [styles.discoveryToggle, expanded && styles.discoveryOpen, pressed && ui.pressed]}')
s=styles(s,"""const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title,
  sectionTitle: { ...ui.cardTitle, fontSize: 22, marginTop: 8 },
  card: ui.card,
  operation: { ...ui.card, gap: 6 },
  discovery: { backgroundColor: palette.background, borderRadius: 14, borderColor: palette.line, borderWidth: 1 },
  discoveryToggle: { justifyContent: 'center', minHeight: 56, gap: 6, padding: 12, borderRadius: 14 },
  discoveryOpen: { backgroundColor: palette.selected },
  discoveryDetail: { gap: 12, padding: 12 },
  cardTitle: ui.cardTitle,
  value: { color: palette.accent, fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  caption: ui.body, empty: { ...ui.body, backgroundColor: palette.soft, borderRadius: 14, padding: 12 },
  primary: ui.button, primaryText: ui.buttonText,
  secondary: { ...ui.button, ...ui.secondary }, secondaryText: { ...ui.buttonText, ...ui.secondaryText },
});
""")
write('HistoryScreen.tsx',s)

s=read('AdultScreen.tsx')
s=rep(s,'<ScrollView contentContainerStyle={styles.content}>','<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>\n        <DetailBack onPress={props.onExit} />')
s=rep(s,'<ScrollView onScrollBeginDrag={props.onActivity} contentContainerStyle={styles.content}>','<ScrollView onScrollBeginDrag={props.onActivity} contentContainerStyle={styles.content}>\n        <DetailBack onPress={props.onExit} label="Выйти из взрослого раздела" disabled={props.busy} />')
s=rep(s,'Завершённые занятия: данных пока нет — учебный модуль ещё не подключён.','Завершённые занятия и сохранённые разборы доступны в «Прогрессе».')
s=s.replace('accessibilityRole="button" onPress={() => setAlternative', 'accessibilityRole="button" accessibilityState={{ expanded: alternative }} onPress={() => setAlternative')
s=rep(s,'disabled={!isAdultAccessibleAnswer(answer)}','accessibilityState={{ disabled: !isAdultAccessibleAnswer(answer) }}\n              disabled={!isAdultAccessibleAnswer(answer)}')
s=s.replace('accessibilityRole="button" disabled={props.busy || props.mode === \'normal\'}','accessibilityRole="button" accessibilityState={{ disabled: props.busy || props.mode === \'normal\' }} disabled={props.busy || props.mode === \'normal\'}')
s=s.replace('accessibilityRole="button" disabled={props.busy || props.mode === \'demo\'}','accessibilityRole="button" accessibilityState={{ disabled: props.busy || props.mode === \'demo\' }} disabled={props.busy || props.mode === \'demo\'}')
s=s.replace('accessibilityRole="button" disabled={props.busy || props.mode !== \'demo\'}','accessibilityRole="button" accessibilityState={{ disabled: props.busy || props.mode !== \'demo\' }} disabled={props.busy || props.mode !== \'demo\'}')
s=s.replace('accessibilityRole="button" disabled={props.busy}', 'accessibilityRole="button" accessibilityState={{ disabled: props.busy }} disabled={props.busy}')
s=styles(s,"""const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title, body: ui.body,
  card: ui.card, cardTitle: ui.cardTitle,
  value: { color: palette.accent, fontSize: 20, fontWeight: '600' }, input: ui.input,
  holdButton: { ...ui.button, minHeight: 80 }, holdText: { ...ui.buttonText, fontSize: 18, fontVariant: ['tabular-nums'] },
  primary: ui.button, primaryText: ui.buttonText,
  secondary: { ...ui.button, ...ui.secondary }, secondaryText: { ...ui.buttonText, ...ui.secondaryText },
  danger: { ...ui.button, backgroundColor: palette.errorSurface, borderColor: palette.error, borderWidth: 1 },
  dangerText: { ...ui.buttonText, color: palette.error },
  error: ui.error, disabled: ui.disabled, pressed: ui.pressed,
});
""")
write('AdultScreen.tsx',s)

s=read('PeriodResultScreen.tsx')
s=rep(s,'<ScrollView contentContainerStyle={styles.content}>','<ScrollView contentContainerStyle={styles.content}>\n        <DetailBack onPress={props.onBack} label={active ? "Вернуться к дню" : "В домик"} disabled={props.busy} />')
s=styles(s,"""const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title,
  balance: { ...ui.body, color: palette.ink, fontVariant: ['tabular-nums'] },
  card: ui.card,
  resultCard: { ...ui.card, backgroundColor: palette.soft }, nextCard: ui.card,
  cardTitle: ui.cardTitle,
  direction: { borderTopColor: palette.line, borderTopWidth: 1, gap: 5, paddingTop: 10 },
  directionLabel: { color: palette.ink, fontSize: 16, fontWeight: '600' },
  directionValue: { ...ui.body, fontVariant: ['tabular-nums'] },
  growth: { color: palette.accent, fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  caption: ui.body, body: ui.body, error: ui.error,
  button: ui.button, buttonSecondary: ui.secondary,
  buttonText: ui.buttonText, buttonSecondaryText: ui.secondaryText,
  disabled: ui.disabled, pressed: ui.pressed,
});
""")
write('PeriodResultScreen.tsx',s)

s=read('LessonShell.tsx')
s=rep(s,'<ScrollView contentContainerStyle={styles.content}>','<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>\n        <DetailBack onPress={props.onBack} label={props.returnLabel} disabled={props.busy} />')
s=rep(s,'L0 · Ситуация для твоего решения','Ситуация для твоего решения')
s=s.replace('<Text style={styles.resultTitle}>','<Text accessibilityRole="header" style={styles.resultTitle}>')
s=rep(s,'style={[\n        styles.button,','style={({ pressed }) => [\n        styles.button,\n        pressed && !props.disabled && ui.pressed,')
s=rep(s,'props.disabled && styles.disabled,\n      ]}', 'props.disabled && styles.disabled,\n      ]}')
s=s.replace('{props.message && <Text style={styles.error}>','        {props.message && <Text accessibilityLiveRegion="polite" style={styles.error}>')
s=s[:s.index('const colors = {')]+"""const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title, body: ui.body,
  levelLabel: { color: palette.ink, fontSize: 16, fontWeight: '600' },
  notice: { backgroundColor: palette.soft, borderRadius: 18, gap: 8, padding: 14 },
  noticeText: ui.body, hints: { gap: 10 },
  hintText: { ...ui.body, ...ui.card },
  result: ui.card, resultTitle: ui.cardTitle, error: ui.error,
  reward: { ...ui.body, backgroundColor: palette.soft, borderRadius: 18, color: palette.ink, padding: 14 },
  button: ui.button, buttonSecondary: ui.secondary,
  buttonText: ui.buttonText, buttonSecondaryText: ui.secondaryText, disabled: ui.disabled,
});
"""
write('LessonShell.tsx',s)

# Renderer data, evaluators and callbacks remain byte-for-byte the same; only
# controls, state cues and their layout are changed.
for name in ['budget-purchase-renderers.tsx','receipt-workshop-renderers.tsx','SavingsLessonRenderer.tsx']:
 s="import { palette, screenStyles as ui } from './screen-theme.ts';\n"+read(name)
 s=s.replace('<Text style={styles.title}>','<Text accessibilityRole="header" style={styles.title}>')
 write(name,s)
s=read('budget-purchase-renderers.tsx')
s=s.replace('accessibilityRole="button" disabled={props.disabled}', 'accessibilityRole="button" accessibilityState={{ disabled: props.disabled }} disabled={props.disabled}')
s=s.replace("accessibilityLabel={'Убрать ' + item.id}","accessibilityLabel={'Убрать ' + item.id} accessibilityState={{ disabled: props.disabled || (counts[item.id] ?? 0) === 0 }}")
s=s.replace("accessibilityLabel={'Добавить ' + item.id}","accessibilityLabel={'Добавить ' + item.id} accessibilityState={{ disabled: props.disabled || (counts[item.id] ?? 0) >= item.maxPackages }}")
s=s.replace('style={styles.countButton}><Text style={styles.countText}>−','style={[styles.countButton, (props.disabled || (counts[item.id] ?? 0) === 0) && ui.disabled]}><Text style={styles.countText}>−')
s=s.replace('style={styles.countButton}><Text style={styles.countText}>+','style={[styles.countButton, (props.disabled || (counts[item.id] ?? 0) >= item.maxPackages) && ui.disabled]}><Text style={styles.countText}>+')
s=styles(s,"""const styles = StyleSheet.create({
  card: ui.card, title: ui.cardTitle, caption: ui.body,
  field: { gap: 6 }, label: { color: palette.ink, fontSize: 16, fontWeight: '600' }, input: ui.input,
  item: { backgroundColor: palette.background, borderRadius: 14, gap: 10, padding: 12 }, itemTitle: ui.cardTitle,
  evidence: { ...ui.button, ...ui.secondary, alignItems: 'flex-start' }, evidenceText: { ...ui.body, color: palette.accent },
  counter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  countButton: { ...ui.button, ...ui.secondary, minWidth: 52, paddingHorizontal: 12, paddingVertical: 8 },
  countText: { color: palette.accent, fontSize: 22, fontWeight: '600' },
  count: { color: palette.ink, fontSize: 16, fontWeight: '600', flexShrink: 1, fontVariant: ['tabular-nums'] },
});
""")
write('budget-purchase-renderers.tsx',s)
s=read('receipt-workshop-renderers.tsx')
s=s.replace('checked: flagged.includes(line.id) }','checked: flagged.includes(line.id), disabled: props.disabled }')
s=s.replace('checked: checked.includes(item.id) }','checked: checked.includes(item.id), disabled: props.disabled }')
s=s.replace("selected: method === 'make' }","selected: method === 'make', disabled: props.disabled }").replace("selected: method === 'buy' }","selected: method === 'buy', disabled: props.disabled }")
s=s.replace('style={styles.choice}><Text style={styles.choiceText}>{flagged', 'style={[styles.choice, flagged.includes(line.id) && ui.selected, props.disabled && ui.disabled]}><Text style={styles.choiceText}>{flagged')
s=s.replace('style={styles.choice}><Text style={styles.choiceText}>{checked', 'style={[styles.choice, checked.includes(item.id) && ui.selected, props.disabled && ui.disabled]}><Text style={styles.choiceText}>{checked')
s=s.replace("style={styles.choice}><Text style={styles.choiceText}>{method === 'make'", "style={[styles.choice, method === 'make' && ui.selected, props.disabled && ui.disabled]}><Text style={styles.choiceText}>{method === 'make'")
s=s.replace("style={styles.choice}><Text style={styles.choiceText}>{method === 'buy'", "style={[styles.choice, method === 'buy' && ui.selected, props.disabled && ui.disabled]}><Text style={styles.choiceText}>{method === 'buy'")
s=styles(s,"""const styles = StyleSheet.create({
  card: ui.card, title: ui.cardTitle, caption: ui.body,
  label: { color: palette.ink, fontSize: 16, fontWeight: '600' },
  row: { ...ui.body, color: palette.ink, fontVariant: ['tabular-nums'] },
  field: { gap: 6 }, input: ui.input,
  choice: { ...ui.button, ...ui.secondary, alignItems: 'stretch', borderRadius: 14 },
  choiceText: { ...ui.body, color: palette.ink }, methods: { gap: 10 },
});
""")
write('receipt-workshop-renderers.tsx',s)
s=read('SavingsLessonRenderer.tsx')
s=rep(s,'<Text style={styles.choiceText}>{props.label}</Text>','<Text style={styles.choiceText}>{props.selected ? \'✓ \' : \'\'}{props.label}</Text>')
s=styles(s,"""const styles = StyleSheet.create({
  card: ui.card, title: ui.cardTitle, body: ui.body,
  field: { gap: 6 }, label: { color: palette.ink, fontSize: 16, fontWeight: '600' }, input: ui.input,
  preview: { ...ui.body, backgroundColor: palette.soft, borderRadius: 14, color: palette.ink, padding: 12, fontVariant: ['tabular-nums'] },
  choice: { ...ui.button, ...ui.secondary, borderRadius: 14 }, choiceSelected: ui.selected,
  choiceText: { ...ui.buttonText, color: palette.ink }, note: ui.body, disabled: ui.disabled,
});
""")
write('SavingsLessonRenderer.tsx',s)
print('Detail screens and five lesson renderers updated')
