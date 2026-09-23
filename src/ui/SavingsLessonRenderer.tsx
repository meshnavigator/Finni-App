import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  SAVINGS_SCHEDULE,
} from '../domain/savings-lesson.ts';
import type { LessonRendererProps } from './lesson-renderer-registry.ts';

function amount(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : fallback;
}

function parse(text: string): number | null {
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

function Field(props: Readonly<{
  label: string;
  value: string;
  disabled: boolean;
  onChangeText: (text: string) => void;
}>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        editable={!props.disabled}
        keyboardType="number-pad"
        onChangeText={props.onChangeText}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

function Choice(props: Readonly<{
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled, selected: props.selected }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={[styles.choice, props.selected && styles.choiceSelected, props.disabled && styles.disabled]}
    >
      <Text style={styles.choiceText}>{props.label}</Text>
    </Pressable>
  );
}

function Schedule(props: LessonRendererProps) {
  const initialSavings = amount(props.parameters.initialSavings, 30);
  const goalCost = amount(props.parameters.goalCost, 90);
  const limits = Array.isArray(props.parameters.maxDeposits)
    ? props.parameters.maxDeposits.map((value) => amount(value, 0))
    : [30, 30, 30];
  const stored = Array.isArray(props.solution.deposits) ? props.solution.deposits : [];
  const values = [0, 1, 2].map((index) => typeof stored[index] === 'number' ? String(stored[index]) : '');
  const deposits = values.map(parse);
  const forecast = deposits.every((deposit) => deposit !== null)
    ? initialSavings + deposits.reduce<number>((sum, deposit) => sum + (deposit ?? 0), 0)
    : null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Три будущих игровых дня</Text>
      <Text style={styles.body}>В копилке {initialSavings}. Мечта стоит {goalCost}.</Text>
      {[0, 1, 2].map((index) => (
        <Field
          key={index}
          disabled={props.disabled}
          label={'Игровой день ' + (index + 1) + ': до ' + limits[index]}
          value={values[index]}
          onChangeText={(text) => {
            const next = values.map((value, entryIndex) => entryIndex === index ? parse(text) : parse(value));
            props.onChange({ deposits: next });
          }}
        />
      ))}
      <Text style={styles.preview}>
        {forecast === null ? 'Введи целые суммы для всех трёх дней.' : 'По плану будет ' + forecast + '.'}
      </Text>
    </View>
  );
}

function WithdrawalPreview(props: LessonRendererProps) {
  const available = amount(props.parameters.available, 10);
  const savings = amount(props.parameters.savings, 60);
  const goalCost = amount(props.parameters.goalCost, 90);
  const itemCost = amount(props.parameters.itemCost, 20);
  const withdrawal = typeof props.solution.withdrawal === 'number' ? String(props.solution.withdrawal) : '';
  const parsed = parse(withdrawal);
  const value = parsed ?? 0;
  const action = props.solution.action === 'buy' ? 'buy' : 'postpone';
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Посмотри последствия выбора</Text>
      <Text style={styles.body}>Учебный кошелёк: {available}. Копилка: {savings}. Мечта: {goalCost}.</Text>
      <Field
        disabled={props.disabled}
        label={'Снять из копилки (от 0 до ' + savings + ')'}
        value={withdrawal}
        onChangeText={(text) => props.onChange({ withdrawal: parse(text), action })}
      />
      <Text style={styles.preview}>
        После снятия: кошелёк {available + value}, копилка {savings - value}, до мечты {goalCost - (savings - value)}.
      </Text>
      <Choice
        disabled={props.disabled}
        label={'Купить занятие за ' + itemCost}
        onPress={() => props.onChange({ withdrawal: parsed, action: 'buy' })}
        selected={action === 'buy'}
      />
      <Choice
        disabled={props.disabled}
        label="Оставить покупку на потом"
        onPress={() => props.onChange({ withdrawal: parsed, action: 'postpone' })}
        selected={action === 'postpone'}
      />
      <Text style={styles.note}>Это preview: монеты твоего игрового дня не меняются.</Text>
    </View>
  );
}

export default function SavingsLessonRenderer(props: LessonRendererProps) {
  return props.parameters.mode === SAVINGS_SCHEDULE
    ? <Schedule {...props} />
    : <WithdrawalPreview {...props} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 10, padding: 14 },
  title: { color: '#14324A', fontSize: 18, fontWeight: '800' },
  body: { color: '#4B6878', fontSize: 16, lineHeight: 22 },
  field: { gap: 4 },
  label: { color: '#14324A', fontSize: 15, fontWeight: '700' },
  input: { backgroundColor: '#F4FAFC', borderColor: '#91B9C5', borderRadius: 10, borderWidth: 1, color: '#14324A', fontSize: 18, minHeight: 48, paddingHorizontal: 12 },
  preview: { backgroundColor: '#FFF3C7', borderRadius: 10, color: '#14324A', fontSize: 15, fontWeight: '700', padding: 10 },
  choice: { alignItems: 'center', borderColor: '#146B78', borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  choiceSelected: { backgroundColor: '#DFF2F2' },
  choiceText: { color: '#146B78', fontSize: 16, fontWeight: '800' },
  note: { color: '#4B6878', fontSize: 14, lineHeight: 19 },
  disabled: { opacity: 0.45 },
});
