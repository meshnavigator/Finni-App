import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';

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
      ? 'Итог и развитие Финни сохранятся. Изменить решения этого дня после завершения нельзя.'
      : 'Не все нужды выбраны сегодня. Финни не заболеет и ничего не потеряет — итог просто подскажет следующий шаг.',
    [
      { text: 'Вернуться', style: 'cancel' },
      { text: 'Завершить', onPress: props.onClosePeriod },
    ],
  );

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{active ? 'ПРЕДВАРИТЕЛЬНЫЙ ИТОГ' : 'ИТОГ ДНЯ'}</Text>
        <Text style={styles.title}>День {lifecycle.periodIndex ?? 0}</Text>
        <Text style={styles.balance}>Доступно {lifecycle.available} · в копилке {lifecycle.savings}</Text>

        {original && effective && facts && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>План и результат</Text>
            <Direction label="Нужно" planned={effective.need} actual={facts.actualNeed} />
            <Direction label="Хочется" planned={effective.want} actual={facts.actualWant} />
            <Direction label="На мечту" planned={effective.save} actual={facts.deposits - facts.withdrawals} />
            {budget && <Text style={styles.caption}>Поступило после плана: {budget.postPlanIncome}</Text>}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Забота о Финни</Text>
          <Text style={styles.caption}>Еда: {summary ? summary.facts.foodPurchased ? 'выбрана' : 'сегодня не выбрана' : food ? 'выбрана' : 'пока не выбрана'}</Text>
          <Text style={styles.caption}>Уход: {summary ? summary.facts.carePurchased ? 'выбран' : 'сегодня не выбран' : care ? 'выбран' : 'пока не выбран'}</Text>
        </View>

        {summary && (
          <>
            <View accessibilityLiveRegion="polite" style={styles.resultCard}>
              <Text style={styles.cardTitle}>Что получилось</Text>
              <Text style={styles.growth}>+{summary.periodGrowth} шагов роста</Text>
              <Text style={styles.caption}>Стадия: {summary.stageAfter} из 3{summary.stageAfter > summary.stageBefore ? ' — новая стадия!' : ''}</Text>
              <Text style={styles.body}>{summary.explanation}</Text>
            </View>
            <View style={styles.nextCard}>
              <Text style={styles.cardTitle}>Что можно попробовать дальше</Text>
              <Text style={styles.body}>{summary.nextSafeStep}</Text>
            </View>
          </>
        )}

        {props.message && <Text accessibilityLiveRegion="polite" style={styles.error}>{props.message}</Text>}
        {active && <Button disabled={props.busy} label={props.busy ? 'Сохраняем итог…' : 'Завершить день'} onPress={confirmClose} />}
        <Button label={active ? 'Вернуться к дню' : 'Вернуться в домик'} onPress={props.onBack} secondary />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EAF6FB' },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  eyebrow: { color: '#146B78', fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#14324A', fontSize: 26, fontWeight: '800' },
  balance: { color: '#14324A', fontSize: 17, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 7, padding: 12 },
  resultCard: { backgroundColor: '#FFF3C7', borderRadius: 14, gap: 8, padding: 14 },
  nextCard: { backgroundColor: '#F7FBFC', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 8, padding: 14 },
  cardTitle: { color: '#14324A', fontSize: 18, fontWeight: '800' },
  direction: { borderTopColor: '#DCEAED', borderTopWidth: 1, gap: 2, paddingTop: 7 },
  directionLabel: { color: '#14324A', fontSize: 15, fontWeight: '800' },
  directionValue: { color: '#4B6878', fontSize: 14 },
  growth: { color: '#146B78', fontSize: 22, fontWeight: '900' },
  caption: { color: '#4B6878', fontSize: 14, lineHeight: 20 },
  body: { color: '#14324A', fontSize: 15, lineHeight: 21 },
  error: { color: '#B54135', fontSize: 14, fontWeight: '700' },
  button: { alignItems: 'center', backgroundColor: '#146B78', borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: '#146B78', borderWidth: 1.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  buttonSecondaryText: { color: '#146B78' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});
