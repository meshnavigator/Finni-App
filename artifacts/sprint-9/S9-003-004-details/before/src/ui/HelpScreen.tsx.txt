import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const glossary = Object.freeze([
  ['Бюджет', 'План: сколько монет есть и на что ты хочешь их использовать.'],
  ['Доход', 'Монеты, которые появились у тебя. Рядом написано, откуда они пришли.'],
  ['Нужно', 'То, что нужно питомцу сегодня: еда и уход.'],
  ['Хочется', 'То, что добавляет радости. Можно выбрать сегодня или перенести.'],
  ['Накопления', 'Монеты, которые ты отложил отдельно, чтобы использовать позже.'],
  ['Мечта / цель', 'То, на что ты решил накопить. У мечты есть цена.'],
  ['План', 'Как ты решил распределить монеты до начала дня.'],
  ['Факт / получилось', 'Как ты использовал монеты на самом деле.'],
  ['Остаток', 'Монеты, которые ещё можно использовать.'],
  ['Снятие', 'Ты берёшь часть монет из копилки. Они снова доступны для покупок.'],
] as const);

export default function HelpScreen(props: Readonly<{ onBack: () => void }>) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>СПРАВКА</Text>
        <Text style={styles.title}>Короткий словарь</Text>
        <Text style={styles.intro}>Настоящие деньги здесь не используются. Все монеты — часть игры.</Text>
        {glossary.map(([term, definition]) => (
          <View key={term} accessible accessibilityLabel={`${term}. ${definition}`} style={styles.card}>
            <Text style={styles.term}>{term}</Text>
            <Text style={styles.definition}>{definition}</Text>
          </View>
        ))}
        <Pressable accessibilityRole="button" onPress={props.onBack} style={styles.button}>
          <Text style={styles.buttonText}>Вернуться туда, где я был</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EAF6FB' },
  content: { gap: 10, padding: 18, paddingBottom: 36 },
  eyebrow: { color: '#146B78', fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#14324A', fontSize: 25, fontWeight: '800' },
  intro: { color: '#4B6878', fontSize: 15, lineHeight: 21 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 12, borderWidth: 1, gap: 4, padding: 12 },
  term: { color: '#14324A', fontSize: 16, fontWeight: '800' },
  definition: { color: '#4B6878', fontSize: 15, lineHeight: 21 },
  button: { alignItems: 'center', backgroundColor: '#146B78', borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
