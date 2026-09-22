import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { LessonRendererProps } from './lesson-renderer-registry.ts';

type Item = Readonly<{ id: string; group: string; label: string; total: number; unitLabel: string; evidence?: string }>;
const numberValue = (value: string) => value.trim() === '' ? value : Number(value);

function Field(props: Readonly<{ label: string; value: unknown; disabled: boolean; onChange: (value: unknown) => void }>) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput accessibilityLabel={props.label} editable={!props.disabled} keyboardType="number-pad" onChangeText={(value) => props.onChange(numberValue(value))} style={styles.input} value={props.value === undefined ? '' : String(props.value)} /></View>;
}

export function AllocationRenderer(props: LessonRendererProps) {
  const p = props.parameters as Readonly<{ budget?: number }> | undefined;
  return <View style={styles.card} accessibilityLabel="Учебное распределение"><Text style={styles.title}>Распредели учебные монеты</Text><Text style={styles.caption}>Доступно: {p?.budget ?? 0}. Остаток можно оставить незадействованным.</Text><Field label="Нужное" value={props.solution.need} disabled={props.disabled} onChange={(need) => props.onChange({ ...props.solution, need })} /><Field label="Желания" value={props.solution.want} disabled={props.disabled} onChange={(want) => props.onChange({ ...props.solution, want })} /><Field label="На мечту" value={props.solution.save} disabled={props.disabled} onChange={(save) => props.onChange({ ...props.solution, save })} /></View>;
}

export function BasketRenderer(props: LessonRendererProps) {
  const p = props.parameters as Readonly<{ budget?: number; items?: readonly Item[] }> | undefined;
  const selected = Array.isArray(props.solution.selectedIds) ? props.solution.selectedIds.filter((id): id is string => typeof id === 'string') : [];
  const revealed = Array.isArray(props.solution.revealedIds) ? props.solution.revealedIds.filter((id): id is string => typeof id === 'string') : [];
  const items = p?.items ?? [];
  const total = selected.reduce((sum, id) => sum + (items.find((item) => item.id === id)?.total ?? 0), 0);
  const toggle = (id: string) => props.onChange({ ...props.solution, selectedIds: selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id] });
  const reveal = (id: string) => props.onChange({ ...props.solution, revealedIds: revealed.includes(id) ? revealed : [...revealed, id] });
  return <View style={styles.card} accessibilityLabel="Учебная корзина"><Text style={styles.title}>Собери учебную корзину</Text><Text style={styles.caption}>Бюджет: {p?.budget ?? 0}. В корзине: {total}. Цена указана за всю позицию, не за другой размер упаковки.</Text>{items.map((item) => <View key={item.id} style={styles.item}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(item.id), disabled: props.disabled }} disabled={props.disabled} onPress={() => toggle(item.id)} style={[styles.choice, selected.includes(item.id) && styles.selected]}><Text style={styles.itemTitle}>{item.label}</Text><Text style={styles.caption}>{item.unitLabel}; всего {item.total}</Text></Pressable>{item.evidence && <Pressable accessibilityRole="button" disabled={props.disabled} onPress={() => reveal(item.id)} style={styles.evidence}><Text style={styles.evidenceText}>{revealed.includes(item.id) ? item.evidence : 'Открыть сведения'}</Text></Pressable>}</View>)}<Field label="Сколько останется" value={props.solution.remainder} disabled={props.disabled} onChange={(remainder) => props.onChange({ ...props.solution, remainder })} /></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 10, padding: 14 },
  title: { color: '#14324A', fontSize: 18, fontWeight: '800' }, caption: { color: '#4B6878', fontSize: 14, lineHeight: 19 },
  field: { gap: 4 }, label: { color: '#14324A', fontSize: 15, fontWeight: '800' }, input: { backgroundColor: '#F7FBFC', borderColor: '#C7DEE5', borderRadius: 10, borderWidth: 1, color: '#14324A', fontSize: 17, minHeight: 48, paddingHorizontal: 12 },
  item: { gap: 5 }, choice: { borderColor: '#C7DEE5', borderRadius: 10, borderWidth: 1, minHeight: 48, padding: 10 }, selected: { backgroundColor: '#D5EEF0', borderColor: '#146B78', borderWidth: 2 }, itemTitle: { color: '#14324A', fontSize: 16, fontWeight: '800' }, evidence: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 }, evidenceText: { color: '#146B78', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
});
