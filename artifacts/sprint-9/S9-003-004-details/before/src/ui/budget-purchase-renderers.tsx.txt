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
  return <View style={styles.card} accessibilityLabel="Учебное распределение"><Text style={styles.title}>Распредели учебные монеты</Text><Text style={styles.caption}>Доступно: {p.budget ?? 0}. На нужное — не меньше {p.needMinimum ?? 0}, на мечту — не меньше {p.savingTarget ?? 0}.</Text>{p.initialPlan && <Text style={styles.caption}>Старый учебный черновик: нужное {p.initialPlan.need}, желания {p.initialPlan.want}, мечта {p.initialPlan.save}. Измени его под новое условие.</Text>}<Field label="Нужное" value={props.solution.need} disabled={props.disabled} onChange={(need) => props.onChange({ ...props.solution, need })} /><Field label="Желания" value={props.solution.want} disabled={props.disabled} onChange={(want) => props.onChange({ ...props.solution, want })} /><Field label="На мечту" value={props.solution.save} disabled={props.disabled} onChange={(save) => props.onChange({ ...props.solution, save })} /></View>;
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
  return <View style={styles.card} accessibilityLabel="Учебная корзина"><Text style={styles.title}>Собери учебную корзину</Text><Text style={styles.caption}>Бюджет: {budget}. В корзине сейчас: {total}. Цена указана за всю упаковку, не за другую единицу товара.</Text>{(props.evidence ?? []).map((item) => <Pressable key={item.id} accessibilityRole="button" disabled={props.disabled} onPress={() => props.onRevealEvidence?.(item.id)} style={styles.evidence}><Text style={styles.evidenceText}>{revealed.has(item.id) ? item.text : 'Открыть сведения'}</Text></Pressable>)}{items.map((item) => <View key={item.id} style={styles.item}><Text style={styles.itemTitle}>{item.properties.join(' · ') || item.kind}</Text><Text style={styles.caption}>{item.packSize} шт. за упаковку; всего {item.packPrice}</Text><View style={styles.counter}><Pressable accessibilityRole="button" accessibilityLabel={'Убрать ' + item.id} disabled={props.disabled || (counts[item.id] ?? 0) === 0} onPress={() => changeCount(item, -1)} style={styles.countButton}><Text style={styles.countText}>−</Text></Pressable><Text accessibilityLabel={'Количество ' + item.id} style={styles.count}>{counts[item.id] ?? 0} из {item.maxPackages}</Text><Pressable accessibilityRole="button" accessibilityLabel={'Добавить ' + item.id} disabled={props.disabled || (counts[item.id] ?? 0) >= item.maxPackages} onPress={() => changeCount(item, 1)} style={styles.countButton}><Text style={styles.countText}>+</Text></Pressable></View></View>)}<Field label="Итог по чеку" value={props.solution.statedTotal} disabled={props.disabled} onChange={(statedTotal) => props.onChange({ ...props.solution, packageCountByOfferId: counts, statedTotal })} /><Field label="Сколько останется" value={props.solution.statedRemainder} disabled={props.disabled} onChange={(statedRemainder) => props.onChange({ ...props.solution, packageCountByOfferId: counts, statedRemainder })} /></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 10, padding: 14 },
  title: { color: '#14324A', fontSize: 18, fontWeight: '800' }, caption: { color: '#4B6878', fontSize: 14, lineHeight: 19 },
  field: { gap: 4 }, label: { color: '#14324A', fontSize: 15, fontWeight: '800' }, input: { backgroundColor: '#F7FBFC', borderColor: '#C7DEE5', borderRadius: 10, borderWidth: 1, color: '#14324A', fontSize: 17, minHeight: 48, paddingHorizontal: 12 },
  item: { borderColor: '#C7DEE5', borderRadius: 10, borderWidth: 1, gap: 5, padding: 10 }, itemTitle: { color: '#14324A', fontSize: 16, fontWeight: '800' }, evidence: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 }, evidenceText: { color: '#146B78', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  counter: { alignItems: 'center', flexDirection: 'row', gap: 10 }, countButton: { alignItems: 'center', borderColor: '#146B78', borderRadius: 10, borderWidth: 1, justifyContent: 'center', minHeight: 48, minWidth: 48 }, countText: { color: '#146B78', fontSize: 22, fontWeight: '800' }, count: { color: '#14324A', fontSize: 15, fontWeight: '800' },
});
