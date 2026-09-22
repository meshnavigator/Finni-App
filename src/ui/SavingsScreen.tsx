import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';
import { GOALS } from '../domain/catalog.ts';

type TransferKind = 'deposit' | 'withdraw';
type SavingsPreview = Readonly<{
  after: Readonly<{ available: number; savings: number }> | null;
  missing: number | null;
}>;

type Props = Readonly<{
  snapshot: AppSnapshot;
  busy: boolean;
  message: string | null;
  onPreview: (kind: TransferKind, value: number) => Promise<SavingsPreview>;
  onTransfer: (kind: TransferKind, value: number) => void;
  onSelectGoal: (goalId: string | null) => void;
  onClaim: (goalId: string) => void;
  onHistory: () => void;
  onBack: () => void;
}>;

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

export default function SavingsScreen(props: Props) {
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState('Перевод между кошельком и копилкой не меняет общую сумму.');
  const transfer = useMemo(() => {
    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) return null;
    const parsed = Number(normalized);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }, [value]);
  const lifecycle = props.snapshot.lifecycle!;
  const selected = props.snapshot.commerce?.selectedGoal ?? null;
  const claimed = new Set(props.snapshot.commerce?.claimedGoalIds ?? []);

  const previewTransfer = async (kind: TransferKind) => {
    if (transfer === null) {
      setNotice('Введи целое число монет больше нуля.');
      return;
    }
    try {
      const preview = await props.onPreview(kind, transfer);
      if (!preview.after) {
        setNotice(kind === 'deposit'
          ? `В кошельке не хватает ${preview.missing ?? 0} монет.`
          : `В копилке не хватает ${preview.missing ?? 0} монет.`);
        return;
      }
      const title = kind === 'deposit' ? 'Положить в копилку?' : 'Снять из копилки?';
      Alert.alert(
        title,
        `Кошелёк: ${lifecycle.available} → ${preview.after.available}. Копилка: ${lifecycle.savings} → ${preview.after.savings}.`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Подтвердить', onPress: () => props.onTransfer(kind, transfer) },
        ],
      );
    } catch {
      setNotice('Не получилось проверить перевод. Деньги не изменились.');
    }
  };

  const selectGoal = (goalId: string | null) => {
    if (selected && selected.id !== goalId) {
      Alert.alert(
        goalId ? 'Сменить цель?' : 'Снять выбор цели?',
        'Монеты останутся в копилке.',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Подтвердить', onPress: () => props.onSelectGoal(goalId) },
        ],
      );
      return;
    }
    props.onSelectGoal(goalId);
  };

  const claim = () => {
    if (!selected) return;
    Alert.alert(
      'Получить цель?',
      `${selected.name}: из копилки спишется ${selected.cost} монет, превышение сохранится.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Получить', onPress: () => props.onClaim(selected.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>КОПИЛКА</Text>
        <Text style={styles.title}>{lifecycle.savings} монет на мечту</Text>
        <Text style={styles.balance}>В кошельке: {lifecycle.available}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.notice}>{props.message ?? notice}</Text>

        <View style={styles.transferCard}>
          <Text style={styles.cardTitle}>Перевести монеты</Text>
          <TextInput
            accessibilityLabel="Сумма перевода"
            inputMode="numeric"
            keyboardType="number-pad"
            onChangeText={setValue}
            placeholder="Например, 20"
            style={styles.input}
            value={value}
          />
          <View style={styles.row}>
            <View style={styles.flex}><Button disabled={props.busy} label="Положить" onPress={() => void previewTransfer('deposit')} /></View>
            <View style={styles.flex}><Button disabled={props.busy} label="Снять" onPress={() => void previewTransfer('withdraw')} secondary /></View>
          </View>
        </View>

        <Text style={styles.cardTitle}>Выбери цель</Text>
        {GOALS.map((goal) => {
          const isSelected = selected?.id === goal.id;
          const isClaimed = claimed.has(goal.id);
          const saved = Math.min(lifecycle.savings, goal.cost);
          return (
            <View key={goal.id} style={[styles.goalCard, isSelected && styles.goalSelected]}>
              <Text style={styles.goalName}>{goal.name} — {goal.cost}</Text>
              <Text style={styles.caption}>{isClaimed ? 'Уже получено' : `Накоплено ${saved} из ${goal.cost}`}</Text>
              <Button
                disabled={props.busy || isSelected || isClaimed}
                label={isClaimed ? 'Получено' : isSelected ? 'Текущая цель' : selected ? 'Сменить цель' : 'Выбрать цель'}
                onPress={() => selectGoal(goal.id)}
                secondary
              />
            </View>
          );
        })}

        {selected && (
          <>
            <Button
              disabled={props.busy || lifecycle.savings < selected.cost}
              label={lifecycle.savings < selected.cost ? `Осталось накопить ${selected.cost - lifecycle.savings}` : 'Получить цель'}
              onPress={claim}
            />
            <Button disabled={props.busy} label="Снять выбор цели" onPress={() => selectGoal(null)} secondary />
          </>
        )}
        <Button label="История операций" onPress={props.onHistory} secondary />
        <Button label="Вернуться в домик" onPress={props.onBack} secondary />
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  ink: '#14324A', muted: '#4B6878', sky: '#EAF6FB', teal: '#146B78', pale: '#F7FBFC', line: '#C7DEE5', yellow: '#FFF3C7',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.sky },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800' },
  balance: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  notice: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  transferCard: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 10, padding: 12 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  input: { backgroundColor: colors.pale, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 18, fontWeight: '800', minHeight: 48, paddingHorizontal: 12 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  goalCard: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 7, padding: 12 },
  goalSelected: { backgroundColor: colors.yellow, borderColor: '#D5A623' },
  goalName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  button: { alignItems: 'center', backgroundColor: colors.teal, borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: colors.teal, borderWidth: 1.5 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  buttonSecondaryText: { color: colors.teal },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});
