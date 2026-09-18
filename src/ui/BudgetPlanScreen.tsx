import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';
import {
  additionalIncomeDraftModel,
  planDraftModel,
  planFactRows,
  type PlanDraftFields,
} from '../application/budget-plan-model.ts';
import type { Plan } from '../domain/economy.ts';

type FieldKey = keyof PlanDraftFields;

const labels: Readonly<Record<FieldKey, string>> = Object.freeze({
  need: 'Нужно',
  want: 'Хочется',
  save: 'На мечту',
});

const emptyFields = (): PlanDraftFields => Object.freeze({
  need: '',
  want: '',
  save: '',
});

function Button(props: Readonly<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(props.disabled) }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        props.secondary && styles.buttonSecondary,
        props.disabled && styles.disabled,
        pressed && !props.disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, props.secondary && styles.buttonSecondaryText]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function CategoryEditor(props: Readonly<{
  field: FieldKey;
  value: string;
  onChange: (value: string) => void;
}>) {
  const adjust = (delta: number) => {
    const current = /^\d+$/.test(props.value.trim()) ? Number(props.value) : 0;
    props.onChange(String(Math.max(0, current + delta)));
  };
  return (
    <View style={styles.categoryCard}>
      <Text style={styles.categoryTitle}>{labels[props.field]}</Text>
      <View style={styles.editorRow}>
        <Pressable
          accessibilityLabel={`Уменьшить ${labels[props.field]} на 10`}
          accessibilityRole="button"
          onPress={() => adjust(-10)}
          style={styles.stepButton}
        >
          <Text style={styles.stepText}>−10</Text>
        </Pressable>
        <TextInput
          accessibilityLabel={`Сумма ${labels[props.field]}`}
          inputMode="numeric"
          keyboardType="number-pad"
          onChangeText={props.onChange}
          placeholder="0"
          style={styles.amountInput}
          value={props.value}
        />
        <Pressable
          accessibilityLabel={`Увеличить ${labels[props.field]} на 10`}
          accessibilityRole="button"
          onPress={() => adjust(10)}
          style={styles.stepButton}
        >
          <Text style={styles.stepText}>+10</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Editors(props: Readonly<{
  fields: PlanDraftFields;
  onChange: (field: FieldKey, value: string) => void;
}>) {
  return (
    <View style={styles.editorList}>
      {(['need', 'want', 'save'] as const).map((field) => (
        <CategoryEditor
          key={field}
          field={field}
          value={props.fields[field]}
          onChange={(value) => props.onChange(field, value)}
        />
      ))}
    </View>
  );
}

export default function BudgetPlanScreen(props: Readonly<{
  snapshot: AppSnapshot;
  busy: boolean;
  message: string | null;
  onBack: () => void;
  onConfirm: (values: Plan, acknowledgedLowNeed: boolean) => void;
  onAllocate: (values: Plan) => void;
}>) {
  const lifecycle = props.snapshot.lifecycle!;
  const budget = props.snapshot.budget;
  const [fields, setFields] = useState<PlanDraftFields>(emptyFields);
  const [acknowledgedLowNeed, setAcknowledgedLowNeed] = useState(false);
  const [showAddition, setShowAddition] = useState(false);
  const [additionFields, setAdditionFields] = useState<PlanDraftFields>(emptyFields);
  const draft = useMemo(
    () => planDraftModel(fields, lifecycle.available, acknowledgedLowNeed),
    [acknowledgedLowNeed, fields, lifecycle.available],
  );
  const addition = useMemo(
    () => budget ? additionalIncomeDraftModel(additionFields, budget) : null,
    [additionFields, budget],
  );
  const change = (
    setter: (value: PlanDraftFields) => void,
    current: PlanDraftFields,
    field: FieldKey,
    value: string,
  ) => setter(Object.freeze({ ...current, [field]: value }));

  if (lifecycle.state === 'DRAFT') {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>ПЛАН НА ДЕНЬ</Text>
          <Text style={styles.title}>Распредели {lifecycle.available} монет</Text>
          <Text style={styles.body}>Можно оставить часть суммы свободной и изменить план до подтверждения.</Text>
          <Editors
            fields={fields}
            onChange={(field, value) => change(setFields, fields, field, value)}
          />
          <View style={styles.summary}>
            <Text style={styles.summaryText}>Распределено: {draft.distributed}</Text>
            <Text style={styles.summaryText}>Осталось: {draft.remaining}</Text>
          </View>
          {draft.overBudgetBy > 0 && (
            <Text style={styles.error}>Уменьши план на {draft.overBudgetBy} монет.</Text>
          )}
          {!draft.valid && draft.values === null && (
            <Text style={styles.error}>Введи целые неотрицательные суммы.</Text>
          )}
          {draft.lowNeedWarning && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acknowledgedLowNeed }}
              onPress={() => setAcknowledgedLowNeed((value) => !value)}
              style={styles.warning}
            >
              <Text style={styles.warningText}>
                {acknowledgedLowNeed ? '✓ ' : ''}На необходимое меньше 40. Я понимаю и хочу продолжить.
              </Text>
            </Pressable>
          )}
          {props.message && <Text style={styles.error}>{props.message}</Text>}
          <Button
            label={props.busy ? 'Сохраняем план…' : 'Подтвердить план'}
            disabled={props.busy || !draft.confirmEnabled || !draft.values}
            onPress={() => draft.values && props.onConfirm(draft.values, acknowledgedLowNeed)}
          />
          <Button label="Вернуться в домик" onPress={props.onBack} secondary />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const rows = budget ? planFactRows(budget) : [];
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ПЛАН / ПОЛУЧИЛОСЬ</Text>
        <Text style={styles.title}>План остаётся на месте</Text>
        <Text style={styles.body}>Новый доход показан отдельно и не меняет прошлые решения.</Text>
        {rows.map((row) => (
          <View key={row.key} style={styles.factCard}>
            <Text style={styles.categoryTitle}>{row.label}</Text>
            <Text style={styles.factLine}>Первоначальный план: {row.original}</Text>
            <Text style={styles.factLine}>Добавлено: {row.added}</Text>
            <Text style={styles.factLine}>Текущий ориентир: {row.effective}</Text>
            <Text style={styles.factValue}>Получилось: {row.actual}</Text>
          </View>
        ))}
        {budget && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>Новый доход после плана: {budget.postPlanIncome}</Text>
            <Text style={styles.summaryText}>Ещё можно распределить: {budget.availableIncome}</Text>
            <Text style={styles.caption}>Получение мечты: {budget.facts.goalClaims}</Text>
          </View>
        )}
        {budget?.additions.map((entry, index) => (
          <Text key={entry.id} style={styles.historyLine}>
            Дополнение {index + 1}: {entry.values.need} / {entry.values.want} / {entry.values.save}
          </Text>
        ))}
        {budget?.state === 'ACTIVE' && budget.availableIncome > 0 && !showAddition && (
          <Button label="Распределить новый доход" onPress={() => setShowAddition(true)} />
        )}
        {budget?.state === 'ACTIVE' && budget.availableIncome === 0 && (
          <Text style={styles.caption}>Доход уже распределён или пока не получен.</Text>
        )}
        {showAddition && budget && addition && (
          <View style={styles.additionPanel}>
            <Text style={styles.categoryTitle}>Добавить к плану</Text>
            <Editors
              fields={additionFields}
              onChange={(field, value) => change(setAdditionFields, additionFields, field, value)}
            />
            <Text style={styles.caption}>Останется нового дохода: {addition.remainingAfter}</Text>
            <Button
              label={props.busy ? 'Добавляем…' : 'Добавить к плану'}
              disabled={props.busy || !addition.valid || !addition.values}
              onPress={() => addition.values && props.onAllocate(addition.values)}
            />
            <Button label="Оставить пока" onPress={() => setShowAddition(false)} secondary />
          </View>
        )}
        {props.message && <Text style={styles.error}>{props.message}</Text>}
        <Button label="Вернуться в домик" onPress={props.onBack} secondary />
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  ink: '#14324A',
  muted: '#4B6878',
  sky: '#EAF6FB',
  teal: '#146B78',
  pale: '#F7FBFC',
  line: '#C7DEE5',
  coral: '#B54135',
  yellow: '#FFF3C7',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.sky },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  caption: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  editorList: { gap: 10 },
  categoryCard: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 8, padding: 12 },
  categoryTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  editorRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  stepButton: { alignItems: 'center', borderColor: colors.teal, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 48, minWidth: 60 },
  stepText: { color: colors.teal, fontSize: 16, fontWeight: '800' },
  amountInput: { backgroundColor: colors.pale, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, flex: 1, fontSize: 19, fontWeight: '800', minHeight: 48, paddingHorizontal: 12, textAlign: 'center' },
  summary: { backgroundColor: colors.yellow, borderRadius: 14, gap: 4, padding: 12 },
  summaryText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  warning: { backgroundColor: colors.yellow, borderColor: '#D5A623', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 48, padding: 12 },
  warningText: { color: colors.ink, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  error: { color: colors.coral, fontSize: 14, fontWeight: '700' },
  button: { alignItems: 'center', backgroundColor: colors.teal, borderRadius: 14, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: colors.teal, borderWidth: 1.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  buttonSecondaryText: { color: colors.teal },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  factCard: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 3, padding: 12 },
  factLine: { color: colors.muted, fontSize: 14 },
  factValue: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  historyLine: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  additionPanel: { backgroundColor: colors.pale, borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 10, padding: 12 },
});
