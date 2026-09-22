import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';

const labels: Readonly<Record<string, string>> = Object.freeze({
  PERIOD_INCOME: 'Монеты на новый день',
  LESSON_REWARD: 'Награда за занятие',
  PURCHASE: 'Покупка',
  SAVINGS_DEPOSIT: 'В копилку',
  SAVINGS_WITHDRAWAL: 'Из копилки',
  GOAL_CLAIM: 'Получена цель',
});

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export default function LedgerScreen(props: Readonly<{
  snapshot: AppSnapshot;
  onBack: () => void;
}>) {
  const history = props.snapshot.commerce?.history ?? [];
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ИСТОРИЯ</Text>
        <Text style={styles.title}>Откуда пришли и куда ушли монеты</Text>
        {history.length === 0 && <Text style={styles.empty}>Операций пока нет.</Text>}
        {history.map((entry) => {
          const title = labels[entry.type] ?? entry.reasonCode;
          const accessibilityLabel = `${title}. Сумма ${entry.amount}. Кошелёк ${signed(entry.deltaAvailable)}. Копилка ${signed(entry.deltaSavings)}.`;
          return (
            <View key={entry.seq} accessible accessibilityLabel={accessibilityLabel} style={styles.card}>
              <View style={styles.headingRow}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.amount}>{entry.amount}</Text>
              </View>
              <Text style={styles.delta}>Кошелёк {signed(entry.deltaAvailable)} · Копилка {signed(entry.deltaSavings)}</Text>
              <Text style={styles.date}>{new Date(entry.createdAt).toLocaleString('ru-RU')}</Text>
            </View>
          );
        })}
        <Pressable accessibilityRole="button" onPress={props.onBack} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Вернуться в копилку</Text>
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
  empty: { color: '#4B6878', fontSize: 16, lineHeight: 22 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 5, padding: 12 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cardTitle: { color: '#14324A', flex: 1, fontSize: 16, fontWeight: '800' },
  amount: { color: '#14324A', fontSize: 18, fontWeight: '900' },
  delta: { color: '#4B6878', fontSize: 14, lineHeight: 19 },
  date: { color: '#4B6878', fontSize: 12 },
  button: { alignItems: 'center', borderColor: '#146B78', borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  buttonText: { color: '#146B78', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
