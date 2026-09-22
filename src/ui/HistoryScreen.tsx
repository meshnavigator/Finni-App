import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';

const operationLabels: Readonly<Record<string, string>> = Object.freeze({
  PERIOD_INCOME: 'Монеты на новый день',
  LESSON_REWARD: 'Награда за занятие',
  PURCHASE: 'Покупка',
  SAVINGS_DEPOSIT: 'В копилку',
  SAVINGS_WITHDRAWAL: 'Из копилки',
  GOAL_CLAIM: 'Получена мечта',
});

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export default function HistoryScreen(props: Readonly<{
  snapshot: AppSnapshot;
  onBack: () => void;
  onHelp: () => void;
}>) {
  const lifecycle = props.snapshot.lifecycle!;
  const commerce = props.snapshot.commerce;
  const summary = lifecycle.latestSummary;
  const history = commerce?.history ?? [];
  const goal = commerce?.selectedGoal;
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ПРОГРЕСС И ИСТОРИЯ</Text>
        <Text style={styles.title}>Что уже получилось</Text>

        <View style={styles.card} accessible accessibilityLabel={`Стадия Финни ${lifecycle.petStage} из 3`}>
          <Text style={styles.cardTitle}>Финни растёт вместе с решениями</Text>
          <Text style={styles.value}>Стадия {lifecycle.petStage} из 3</Text>
          <Text style={styles.caption}>Завершено игровых дней: {lifecycle.closedPeriods}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Текущая мечта</Text>
          <Text style={styles.value}>{goal ? `${goal.name} · ${goal.cost} монет` : 'Мечта пока не выбрана'}</Text>
          <Text style={styles.caption}>В копилке: {lifecycle.savings}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Завершённые занятия</Text>
          <Text style={styles.empty}>Завершённых занятий пока нет. Каталог занятий появится в следующем рабочем пакете.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Последний закрытый день</Text>
          {summary ? (
            <>
              <Text style={styles.value}>+{summary.periodGrowth} шагов роста</Text>
              <Text style={styles.caption}>Нужно: план {summary.plan.effective.need}, получилось {summary.facts.actualNeed}</Text>
              <Text style={styles.caption}>Хочется: план {summary.plan.effective.want}, получилось {summary.facts.actualWant}</Text>
              <Text style={styles.caption}>На мечту: план {summary.plan.effective.save}, чистое пополнение {summary.criteria.netSaving}</Text>
              <Text style={styles.caption}>{summary.explanation}</Text>
            </>
          ) : <Text style={styles.empty}>Закрытых дней пока нет. Первый итог появится после завершения игрового дня.</Text>}
        </View>

        <Text style={styles.sectionTitle}>Операции</Text>
        {history.length === 0 && <Text style={styles.empty}>Операций пока нет.</Text>}
        {history.map((entry) => {
          const title = operationLabels[entry.type] ?? entry.reasonCode;
          return (
            <View
              key={entry.seq}
              accessible
              accessibilityLabel={`${title}. Сумма ${entry.amount}. Кошелёк ${signed(entry.deltaAvailable)}. Копилка ${signed(entry.deltaSavings)}.`}
              style={styles.operation}
            >
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.caption}>Сумма {entry.amount} · кошелёк {signed(entry.deltaAvailable)} · копилка {signed(entry.deltaSavings)}</Text>
            </View>
          );
        })}

        <Pressable accessibilityRole="button" onPress={props.onHelp} style={styles.secondary}>
          <Text style={styles.secondaryText}>Открыть словарь</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={props.onBack} style={styles.primary}>
          <Text style={styles.primaryText}>Вернуться</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EAF6FB' },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  eyebrow: { color: '#146B78', fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#14324A', fontSize: 25, fontWeight: '800' },
  sectionTitle: { color: '#14324A', fontSize: 20, fontWeight: '800', marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 6, padding: 13 },
  operation: { backgroundColor: '#F7FBFC', borderColor: '#C7DEE5', borderRadius: 12, borderWidth: 1, gap: 4, padding: 12 },
  cardTitle: { color: '#14324A', fontSize: 16, fontWeight: '800' },
  value: { color: '#146B78', fontSize: 18, fontWeight: '900' },
  caption: { color: '#4B6878', fontSize: 14, lineHeight: 20 },
  empty: { color: '#4B6878', fontSize: 15, lineHeight: 21 },
  primary: { alignItems: 'center', backgroundColor: '#146B78', borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondary: { alignItems: 'center', borderColor: '#146B78', borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  secondaryText: { color: '#146B78', fontSize: 16, fontWeight: '800' },
});
