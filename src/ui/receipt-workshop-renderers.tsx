import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { LessonRendererProps } from './lesson-renderer-registry.ts';

const array = (value: unknown): readonly string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const numberValue = (value: string): unknown => value.trim() === '' ? '' : Number(value);

function Amount(props: Readonly<{ label: string; value: unknown; disabled: boolean; onChange: (value: unknown) => void }>) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput accessibilityLabel={props.label} editable={!props.disabled} keyboardType="number-pad" onChangeText={(text) => props.onChange(numberValue(text))} style={styles.input} value={props.value === undefined ? '' : String(props.value)} /></View>;
}

type Line = Readonly<{ id: string; itemId: string; quantity: number; unitPrice: number }>;
const lines = (value: unknown): readonly Line[] => Array.isArray(value) ? value.filter((item): item is Line => typeof item === 'object' && item !== null && typeof item.id === 'string' && typeof item.itemId === 'string' && typeof item.quantity === 'number' && typeof item.unitPrice === 'number') : [];
const itemName = (id: string): string => ({ food: 'Еда', care: 'Уход', ball: 'Мяч' })[id as 'food' | 'care' | 'ball'] ?? id;

export function ReceiptAuditRenderer(props: LessonRendererProps) {
  const basket = lines(props.parameters.originalBasket);
  const receipt = lines(props.parameters.receiptLines);
  const flagged = array(props.solution.flaggedLineIds);
  const toggle = (id: string) => props.onChange({ ...props.solution, flaggedLineIds: flagged.includes(id) ? flagged.filter((item) => item !== id) : [...flagged, id] });
  return <View style={styles.card} accessibilityLabel="Проверка учебного чека"><Text style={styles.title}>Сравни корзину и чек</Text><Text style={styles.caption}>Корзина — независимый список того, что выбрали. Отметь лишнюю строку, если она есть. Верный чек оставь без отметок.</Text><Text style={styles.label}>Корзина</Text>{basket.map((line) => <Text key={line.id} style={styles.row}>{itemName(line.itemId)} · {line.quantity} × {line.unitPrice}</Text>)}<Text style={styles.label}>Учебный чек</Text>{receipt.map((line) => <Pressable key={line.id} accessibilityRole="checkbox" accessibilityState={{ checked: flagged.includes(line.id) }} disabled={props.disabled} onPress={() => toggle(line.id)} style={styles.choice}><Text style={styles.choiceText}>{flagged.includes(line.id) ? '☑' : '☐'} {itemName(line.itemId)} · {line.quantity} × {line.unitPrice}</Text></Pressable>)}<Text style={styles.caption}>Напечатано: итог {String(props.parameters.reportedTotal ?? '')}, сдача {String(props.parameters.reportedChange ?? '')} из {String(props.parameters.tendered ?? '')}.</Text><Amount label="Исправленный итог" value={props.solution.correctedTotal} disabled={props.disabled} onChange={(correctedTotal) => props.onChange({ ...props.solution, flaggedLineIds: flagged, correctedTotal })} /><Amount label="Ожидаемая сдача" value={props.solution.expectedChange} disabled={props.disabled} onChange={(expectedChange) => props.onChange({ ...props.solution, flaggedLineIds: flagged, expectedChange })} /></View>;
}

type Resource = Readonly<{ id: string; title: string; packPrice: number }>;
const resources = (value: unknown): readonly Resource[] => Array.isArray(value) ? value.filter((item): item is Resource => typeof item === 'object' && item !== null && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.packPrice === 'number') : [];
const allocation = (value: unknown): Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function ResourceChoiceRenderer(props: LessonRendererProps) {
  const items = resources(props.parameters.requiredResources);
  const checked = array(props.solution.checkedOwnedResourceIds);
  const owned = array(props.parameters.ownedResourceIds);
  const plan = allocation(props.solution.allocation);
  const makeCost = items.filter((item) => !owned.includes(item.id)).reduce((sum, item) => sum + item.packPrice, 0);
  const method = props.solution.method;
  const methodCost = method === 'make' ? makeCost : props.parameters.readyPrice;
  const validPreview = checked.length === owned.length && checked.every((id) => owned.includes(id)) &&
    (method === 'make' || method === 'buy') && typeof plan.need === 'number' && typeof plan.want === 'number' && typeof plan.save === 'number' &&
    plan.need >= Number(props.parameters.needMinimum) && plan.want >= Number(methodCost) && plan.save >= Number(props.parameters.savingTarget) &&
    plan.need + plan.want + plan.save <= Number(props.parameters.budget);
  const toggle = (id: string) => props.onChange({ ...props.solution, checkedOwnedResourceIds: checked.includes(id) ? checked.filter((item) => item !== id) : [...checked, id] });
  const choose = (choice: 'make' | 'buy') => props.onChange({ ...props.solution, checkedOwnedResourceIds: checked, method: choice, allocation: plan });
  const setAmount = (key: string, value: unknown) => props.onChange({ ...props.solution, checkedOwnedResourceIds: checked, allocation: { ...plan, [key]: value } });
  return <View style={styles.card} accessibilityLabel="Учебная мастерская"><Text style={styles.title}>Как устроить запуск кораблика?</Text><Text style={styles.caption}>Общий учебный бюджет: {String(props.parameters.budget ?? '')}. На нужное — хотя бы {String(props.parameters.needMinimum ?? '')}, на мечту — хотя бы {String(props.parameters.savingTarget ?? '')}. Покупки здесь не совершаются.</Text><Text style={styles.label}>Отметь, что уже есть в учебной коробке</Text>{items.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: checked.includes(item.id) }} disabled={props.disabled} onPress={() => toggle(item.id)} style={styles.choice}><Text style={styles.choiceText}>{checked.includes(item.id) ? '☑' : '☐'} {item.title} · если докупать, {item.packPrice}</Text></Pressable>)}<Text style={styles.caption}>Недостающее для изготовления: {makeCost}. Готовый кораблик: {String(props.parameters.readyPrice ?? '')}. Цена изготовления зависит от того, что уже есть.</Text><Text style={styles.label}>Выбери способ</Text><View style={styles.methods}><Pressable accessibilityRole="radio" accessibilityState={{ selected: method === 'make' }} disabled={props.disabled} onPress={() => choose('make')} style={styles.choice}><Text style={styles.choiceText}>{method === 'make' ? '◉' : '○'} Сделать</Text></Pressable><Pressable accessibilityRole="radio" accessibilityState={{ selected: method === 'buy' }} disabled={props.disabled} onPress={() => choose('buy')} style={styles.choice}><Text style={styles.choiceText}>{method === 'buy' ? '◉' : '○'} Купить готовый</Text></Pressable></View><Amount label="На нужное" value={plan.need} disabled={props.disabled} onChange={(value) => setAmount('need', value)} /><Amount label="На выбранный способ" value={plan.want} disabled={props.disabled} onChange={(value) => setAmount('want', value)} /><Amount label="На мечту" value={plan.save} disabled={props.disabled} onChange={(value) => setAmount('save', value)} /><Text style={styles.caption}>{validPreview ? `Что получится по плану: ${method === 'make' ? 'самодельный кораблик' : 'готовый кораблик'}. Можно выбрать другой способ и сравнить.` : `Что ещё нужно проверить: список материалов, нужное, стоимость способа и сумму на мечту. Недостающие материалы: ${items.filter((item) => !owned.includes(item.id)).map((item) => item.title).join(', ') || 'нет'}.`}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 10, padding: 14 },
  title: { color: '#14324A', fontSize: 18, fontWeight: '800' }, caption: { color: '#4B6878', fontSize: 14, lineHeight: 19 },
  label: { color: '#14324A', fontSize: 15, fontWeight: '800' }, row: { color: '#14324A', fontSize: 15 },
  field: { gap: 4 }, input: { backgroundColor: '#F7FBFC', borderColor: '#C7DEE5', borderRadius: 10, borderWidth: 1, color: '#14324A', fontSize: 17, minHeight: 48, paddingHorizontal: 12 },
  choice: { borderColor: '#C7DEE5', borderRadius: 10, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 }, choiceText: { color: '#14324A', fontSize: 15 }, methods: { gap: 8 },
});
