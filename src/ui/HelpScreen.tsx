import DetailBack from './DetailBack.tsx';
import { palette, screenStyles as ui } from './screen-theme.ts';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <DetailBack onPress={props.onBack} label="Закрыть справку" />
        <Text style={styles.eyebrow}>СПРАВКА</Text>
        <Text accessibilityRole="header" style={styles.title}>Короткий словарь</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title,
  intro: { ...ui.body, backgroundColor: palette.soft, borderRadius: 18, padding: 14 },
  card: ui.card, term: ui.cardTitle, definition: ui.body,
  button: ui.button, buttonText: ui.buttonText,
});
