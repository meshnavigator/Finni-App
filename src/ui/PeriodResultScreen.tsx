import DetailBack from './DetailBack.tsx';
import { palette, screenStyles as ui } from './screen-theme.ts';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';
import { petNarrativeText } from './pet-copy.ts';

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
      <Text style={[styles.buttonText, props.secondary && styles.buttonSecondaryText]}>{props.label}</Text>
    </Pressable>
  );
}

function Direction(props: Readonly<{ label: string; planned: number; actual: number }>) {
  return (
    <View style={styles.direction} accessible accessibilityLabel={`${props.label}: план ${props.planned}, получилось ${props.actual}`}>
      <Text style={styles.directionLabel}>{props.label}</Text>
      <Text style={styles.directionValue}>План {props.planned} · получилось {props.actual}</Text>
    </View>
  );
}

export default function PeriodResultScreen(props: Readonly<{
  snapshot: AppSnapshot;
  busy: boolean;
  message: string | null;
  onClosePeriod: () => void;
  onBack: () => void;
}>) {
  const lifecycle = props.snapshot.lifecycle!;
  const petName = props.snapshot.profile?.name ?? 'питомец';
  const budget = props.snapshot.budget;
  const summary = lifecycle.latestSummary;
  const active = lifecycle.state === 'ACTIVE';
  const purchases = props.snapshot.commerce?.purchases ?? [];
  const food = purchases.some((entry) => entry.item.slot === 'food');
  const care = purchases.some((entry) => entry.item.slot === 'care');
  const original = summary?.plan.original ?? budget?.original;
  const effective = summary?.plan.effective ?? budget?.effective;
  const facts = summary?.facts ?? (budget ? {
    actualNeed: budget.facts.need,
    actualWant: budget.facts.want,
    deposits: budget.facts.deposits,
    withdrawals: budget.facts.withdrawals,
  } : null);

  const confirmClose = () => Alert.alert(
    'Завершить день?',
    food && care
      ? `Итог и развитие питомца «${petName}» сохранятся. Изменить решения этого дня после завершения нельзя.`
      : `Не все нужды выбраны сегодня. Питомец «${petName}» не заболеет и ничего не потеряет — итог просто подскажет следующий шаг.`,
    [
      { text: 'Вернуться', style: 'cancel' },
      { text: 'Завершить', onPress: props.onClosePeriod },
    ],
  );

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <DetailBack onPress={props.onBack} label={active ? "Вернуться к дню" : "В домик"} disabled={props.busy} />
        <Text style={styles.eyebrow}>{active ? 'ПРЕДВАРИТЕЛЬНЫЙ ИТОГ' : 'ИТОГ ДНЯ'}</Text>
        <Text accessibilityRole="header" style={styles.title}>День {lifecycle.periodIndex ?? 0}</Text>
        <Text style={styles.balance}>Доступно {lifecycle.available} · в копилке {lifecycle.savings}</Text>

        {original && effective && facts && (
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>План и результат</Text>
            <Direction label="Нужно" planned={effective.need} actual={facts.actualNeed} />
            <Direction label="Хочется" planned={effective.want} actual={facts.actualWant} />
            <Direction label="На мечту" planned={effective.save} actual={facts.deposits - facts.withdrawals} />
            {budget && <Text style={styles.caption}>Поступило после плана: {budget.postPlanIncome}</Text>}
          </View>
        )}

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Забота о питомце «{petName}»</Text>
          <Text style={styles.caption}>Еда: {summary ? summary.facts.foodPurchased ? 'выбрана' : 'сегодня не выбрана' : food ? 'выбрана' : 'пока не выбрана'}</Text>
          <Text style={styles.caption}>Уход: {summary ? summary.facts.carePurchased ? 'выбран' : 'сегодня не выбран' : care ? 'выбран' : 'пока не выбран'}</Text>
        </View>

        {summary && (
          <>
            <View accessibilityLiveRegion="polite" style={styles.resultCard}>
              <Text accessibilityRole="header" style={styles.cardTitle}>Что получилось</Text>
              <Text style={styles.growth}>+{summary.periodGrowth} шагов роста</Text>
              <Text style={styles.caption}>Стадия: {summary.stageAfter} из 3{summary.stageAfter > summary.stageBefore ? ' — новая стадия!' : ''}</Text>
              <Text style={styles.body}>{petNarrativeText(summary.explanation, petName)}</Text>
            </View>
            <View style={styles.nextCard}>
              <Text accessibilityRole="header" style={styles.cardTitle}>Что можно попробовать дальше</Text>
              <Text style={styles.body}>{summary.nextSafeStep}</Text>
            </View>
          </>
        )}

        {props.message && <Text accessibilityLiveRegion="polite" style={styles.error}>{props.message}</Text>}
        {active && <Button disabled={props.busy} label={props.busy ? 'Сохраняем итог…' : 'Завершить день'} onPress={confirmClose} />}
        <Button label={active ? 'Вернуться к дню' : 'Вернуться в домик'} onPress={props.onBack} secondary />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
