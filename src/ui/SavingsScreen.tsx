import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import { goalSource } from './room-assets.ts';
import { petCatalogText } from './pet-copy.ts';
import { useKeyboardScrollInset } from './use-keyboard-scroll-inset.ts';

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
  const keyboardInset = useKeyboardScrollInset();
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState('Перевод между кошельком и копилкой не меняет общую сумму.');
  const transfer = useMemo(() => {
    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) return null;
    const parsed = Number(normalized);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }, [value]);
  const lifecycle = props.snapshot.lifecycle!;
  const petName = props.snapshot.profile?.name ?? 'питомец';
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
      `${petCatalogText(selected.name, petName)}: из копилки спишется ${selected.cost} монет, превышение сохранится.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Получить', onPress: () => props.onClaim(selected.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: 20 + keyboardInset }]}>
        <Text style={styles.eyebrow}>КОПИЛКА</Text>
        <Text style={styles.title}>{lifecycle.savings} монет на мечту</Text>
        <Text style={styles.balance}>В кошельке: {lifecycle.available}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.notice}>{props.message ?? notice}</Text>

        {selected && <View style={styles.goalCard}>
          <Text style={styles.cardTitle}>Мечта · {petCatalogText(selected.name, petName)}</Text>
          {lifecycle.savings < selected.cost
            ? <Text style={styles.caption}>Осталось накопить {selected.cost - lifecycle.savings}</Text>
            : <Button disabled={props.busy} label="Получить цель" onPress={claim} />}
        </View>}

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
              <View style={styles.goalHeader}>{goalSource(goal.id) && <Image accessibilityIgnoresInvertColors source={goalSource(goal.id)!} style={styles.goalThumbnail} />}<Text style={styles.goalName}>{petCatalogText(goal.name, petName)} — {goal.cost}</Text></View>
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
            <Button disabled={props.busy} label="Снять выбор цели" onPress={() => selectGoal(null)} secondary />
          </>
        )}
        <Button label="История операций" onPress={props.onHistory} secondary />
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  ink: '#3D352D', muted: '#665444', sky: '#F6F0E6', teal: '#AE482A', pale: '#FFFCF6', line: '#E4D6C1', yellow: '#F1E5CB',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.sky },
  content: { gap: 12, padding: 18, paddingBottom: 20 },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '600', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '600' },
  balance: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  notice: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  transferCard: { backgroundColor: '#FFFCF6', borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 10, padding: 12 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '600' },
  input: { backgroundColor: colors.pale, borderColor: colors.line, borderRadius: 18, borderWidth: 1, color: colors.ink, fontSize: 18, fontWeight: '600', minHeight: 48, paddingVertical: 10, paddingHorizontal: 12 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  goalCard: { backgroundColor: '#FFFCF6', borderColor: colors.line, borderRadius: 22, borderWidth: 1, gap: 7, padding: 12 },
  goalSelected: { backgroundColor: colors.yellow, borderColor: '#9B7847' },
  goalHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  goalThumbnail: { height: 64, width: 64 },
  goalName: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '600' },
  caption: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  button: { alignItems: 'center', backgroundColor: colors.teal, borderRadius: 18, justifyContent: 'center', minHeight: 48, paddingVertical: 10, paddingHorizontal: 12 },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: colors.teal, borderWidth: 1.5 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  buttonSecondaryText: { color: colors.teal },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: .96 }] },
});
