import { palette, screenStyles as ui } from './screen-theme.ts';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { LessonRendererProps } from './lesson-renderer-registry.ts';

type Offer = Readonly<{
  id: string;
  kind: string;
  packSize: number;
  packPrice: number;
  maxPackages: number;
  properties: readonly string[];
}>;

const numberValue = (value: string) => value.trim() === '' ? value : Number(value);

function Field(props: Readonly<{ label: string; value: unknown; disabled: boolean; onChange: (value: unknown) => void }>) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput accessibilityLabel={props.label} editable={!props.disabled} keyboardType="number-pad" onChangeText={(value) => props.onChange(numberValue(value))} style={styles.input} value={props.value === undefined ? '' : String(props.value)} /></View>;
}

function offers(value: unknown): readonly Offer[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Offer => typeof item === 'object' && item !== null &&
    typeof (item as Offer).id === 'string' && typeof (item as Offer).kind === 'string' &&
    Number.isSafeInteger((item as Offer).packSize) && Number.isSafeInteger((item as Offer).packPrice) &&
    Number.isSafeInteger((item as Offer).maxPackages) && Array.isArray((item as Offer).properties));
}

function packageCounts(value: unknown): Readonly<Record<string, number>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, count]) => Number.isSafeInteger(count) && count >= 0)) as Readonly<Record<string, number>>;
}

export function AllocationRenderer(props: LessonRendererProps) {
  const p = props.parameters as Readonly<{ budget?: number; needMinimum?: number; savingTarget?: number; initialPlan?: Readonly<{ need: number; want: number; save: number }> }>;
  return <View style={styles.card} accessibilityLabel="Учебное распределение"><Text accessibilityRole="header" style={styles.title}>Распредели учебные монеты</Text><Text style={styles.caption}>Доступно: {p.budget ?? 0}. На нужное — не меньше {p.needMinimum ?? 0}, на мечту — не меньше {p.savingTarget ?? 0}.</Text>{p.initialPlan && <Text style={styles.caption}>Старый учебный черновик: нужное {p.initialPlan.need}, желания {p.initialPlan.want}, мечта {p.initialPlan.save}. Измени его под новое условие.</Text>}<Field label="Нужное" value={props.solution.need} disabled={props.disabled} onChange={(need) => props.onChange({ ...props.solution, need })} /><Field label="Желания" value={props.solution.want} disabled={props.disabled} onChange={(want) => props.onChange({ ...props.solution, want })} /><Field label="На мечту" value={props.solution.save} disabled={props.disabled} onChange={(save) => props.onChange({ ...props.solution, save })} /></View>;
}

export function BasketRenderer(props: LessonRendererProps) {
  const p = props.parameters as Readonly<{ budget?: number; offers?: unknown }>;
  const budget = typeof p.budget === 'number' ? p.budget : 0;
  const items = offers(p.offers);
  const counts = packageCounts(props.solution.packageCountByOfferId);
  const total = items.reduce((sum, item) => sum + (counts[item.id] ?? 0) * item.packPrice, 0);
  const revealed = new Set(props.revealedEvidenceIds ?? []);
  const changeCount = (offer: Offer, delta: number) => {
    const nextCount = Math.max(0, Math.min(offer.maxPackages, (counts[offer.id] ?? 0) + delta));
    const next = { ...counts, [offer.id]: nextCount };
    props.onChange({
      packageCountByOfferId: next,
      statedTotal: props.solution.statedTotal ?? '',
      statedRemainder: props.solution.statedRemainder ?? '',
    });
  };
  return <View style={styles.card} accessibilityLabel="Учебная корзина"><Text accessibilityRole="header" style={styles.title}>Собери учебную корзину</Text><Text style={styles.caption}>Бюджет: {budget}. В корзине сейчас: {total}. Цена указана за всю упаковку, не за другую единицу товара.</Text>{(props.evidence ?? []).map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ disabled: props.disabled }} disabled={props.disabled} onPress={() => props.onRevealEvidence?.(item.id)} style={styles.evidence}><Text style={styles.evidenceText}>{revealed.has(item.id) ? item.text : 'Открыть сведения'}</Text></Pressable>)}{items.map((item) => <View key={item.id} style={styles.item}><Text style={styles.itemTitle}>{item.properties.join(' · ') || item.kind}</Text><Text style={styles.caption}>{item.packSize} шт. за упаковку; всего {item.packPrice}</Text><View style={styles.counter}><Pressable accessibilityRole="button" accessibilityLabel={'Убрать ' + item.id} accessibilityState={{ disabled: props.disabled || (counts[item.id] ?? 0) === 0 }} disabled={props.disabled || (counts[item.id] ?? 0) === 0} onPress={() => changeCount(item, -1)} style={[styles.countButton, (props.disabled || (counts[item.id] ?? 0) === 0) && ui.disabled]}><Text style={styles.countText}>−</Text></Pressable><Text accessibilityLabel={'Количество ' + item.id} style={styles.count}>{counts[item.id] ?? 0} из {item.maxPackages}</Text><Pressable accessibilityRole="button" accessibilityLabel={'Добавить ' + item.id} accessibilityState={{ disabled: props.disabled || (counts[item.id] ?? 0) >= item.maxPackages }} disabled={props.disabled || (counts[item.id] ?? 0) >= item.maxPackages} onPress={() => changeCount(item, 1)} style={[styles.countButton, (props.disabled || (counts[item.id] ?? 0) >= item.maxPackages) && ui.disabled]}><Text style={styles.countText}>+</Text></Pressable></View></View>)}<Field label="Итог по чеку" value={props.solution.statedTotal} disabled={props.disabled} onChange={(statedTotal) => props.onChange({ ...props.solution, packageCountByOfferId: counts, statedTotal })} /><Field label="Сколько останется" value={props.solution.statedRemainder} disabled={props.disabled} onChange={(statedRemainder) => props.onChange({ ...props.solution, packageCountByOfferId: counts, statedRemainder })} /></View>;
}

const styles = StyleSheet.create({
  card: ui.card, title: ui.cardTitle, caption: ui.body,
  field: { gap: 6 }, label: { color: palette.ink, fontSize: 16, fontWeight: '600' }, input: ui.input,
  item: { backgroundColor: palette.background, borderRadius: 14, gap: 10, padding: 12 }, itemTitle: ui.cardTitle,
  evidence: { ...ui.button, ...ui.secondary, alignItems: 'flex-start' }, evidenceText: { ...ui.body, color: palette.accent },
  counter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  countButton: { ...ui.button, ...ui.secondary, minWidth: 52, paddingHorizontal: 12, paddingVertical: 8 },
  countText: { color: palette.accent, fontSize: 22, fontWeight: '600' },
  count: { color: palette.ink, fontSize: 16, fontWeight: '600', flexShrink: 1, fontVariant: ['tabular-nums'] },
});
