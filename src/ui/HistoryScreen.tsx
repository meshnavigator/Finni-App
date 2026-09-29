import DetailBack from './DetailBack.tsx';
import { palette, screenStyles as ui } from './screen-theme.ts';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LOCAL_DEMO_LESSONS } from '../content/local-lesson-catalog.ts';
import type { LessonDiscovery } from '../persistence/lesson-repository.ts';
import { discoveryAction, discoveryHelp, discoveryOutcome } from './lesson-discovery-summary.ts';
import type { AppSnapshot } from '../application/app-runtime.ts';
import { petCatalogText } from './pet-copy.ts';

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
  discoveries: readonly LessonDiscovery[];
  onBack: () => void;
  onHelp: () => void;
  onPractice: (lessonId: string, previousVariantId: string) => void;
}>) {
  const lifecycle = props.snapshot.lifecycle!;
  const petName = props.snapshot.profile?.name ?? 'питомец';
  const commerce = props.snapshot.commerce;
  const summary = lifecycle.latestSummary;
  const history = commerce?.history ?? [];
  const goal = commerce?.selectedGoal;
  const [openDiscoveryId, setOpenDiscoveryId] = useState<string | null>(null);
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <DetailBack onPress={props.onBack} />
        <Text style={styles.eyebrow}>ПРОГРЕСС И ИСТОРИЯ</Text>
        <Text accessibilityRole="header" style={styles.title}>Что уже получилось</Text>

        <View style={styles.card} accessible accessibilityLabel={`Стадия питомца ${petName}: ${lifecycle.petStage} из 3`}>
          <Text accessibilityRole="header" style={styles.cardTitle}>{petName} растёт вместе с решениями</Text>
          <Text style={styles.value}>Стадия {lifecycle.petStage} из 3</Text>
          <Text style={styles.caption}>Завершено игровых дней: {lifecycle.closedPeriods}</Text>
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Текущая мечта</Text>
          <Text style={styles.value}>{goal ? `${petCatalogText(goal.name, petName)} · ${goal.cost} монет` : 'Мечта пока не выбрана'}</Text>
          <Text style={styles.caption}>В копилке: {lifecycle.savings}</Text>
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Совместные открытия</Text>
          <Text style={styles.caption}>Здесь записаны разобранные учебные ситуации. Подсказки показывают только то, что открывали в приложении.</Text>
          {props.discoveries.length === 0 && (
            <Text style={styles.empty}>Здесь появятся ситуации, которые мы разберём вместе.</Text>
          )}
          {props.discoveries.map((discovery) => {
            const id = discovery.attempt.attemptId;
            const lesson = LOCAL_DEMO_LESSONS.find((item) => item.definition.lessonId === discovery.attempt.lessonId);
            const title = lesson?.title ?? 'Учебное занятие';
            const expanded = openDiscoveryId === id;
            return (
              <View key={id} style={styles.discovery}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpenDiscoveryId(expanded ? null : id)}
                  style={({ pressed }) => [styles.discoveryToggle, expanded && styles.discoveryOpen, pressed && ui.pressed]}
                >
                  <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>
                  <Text style={styles.caption}>{discoveryOutcome(discovery)} · {expanded ? 'Скрыть' : 'Посмотреть'}</Text>
                </Pressable>
                {expanded && (
                  <View style={styles.discoveryDetail}>
                    <Text style={styles.caption}>Что мы разбирали: {discoveryAction(discovery)}</Text>
                    <Text style={styles.caption}>Что получилось: {discovery.evaluation.consequence}</Text>
                    <Text style={styles.caption}>Почему так: {discovery.evaluation.explanation}</Text>
                    <Text style={styles.caption}>{discoveryHelp(discovery)}</Text>
                    <Text style={styles.caption}>Это учебный результат; он не подтверждает освоение навыка.</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => props.onPractice(discovery.attempt.lessonId, discovery.attempt.variantId)}
                      style={styles.secondary}
                    >
                      <Text style={styles.secondaryText}>{lesson && lesson.variants.length > 1 ? 'Посмотреть другой вариант' : 'Потренироваться ещё'}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Последний закрытый день</Text>
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

        <Text accessibilityRole="header" style={styles.sectionTitle}>Операции</Text>
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
              <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title,
  sectionTitle: { ...ui.cardTitle, fontSize: 22, marginTop: 8 },
  card: ui.card,
  operation: { ...ui.card, gap: 6 },
  discovery: { backgroundColor: palette.background, borderRadius: 14, borderColor: palette.line, borderWidth: 1 },
  discoveryToggle: { justifyContent: 'center', minHeight: 56, gap: 6, padding: 12, borderRadius: 14 },
  discoveryOpen: { backgroundColor: palette.selected },
  discoveryDetail: { gap: 12, padding: 12 },
  cardTitle: ui.cardTitle,
  value: { color: palette.accent, fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  caption: ui.body, empty: { ...ui.body, backgroundColor: palette.soft, borderRadius: 14, padding: 12 },
  primary: ui.button, primaryText: ui.buttonText,
  secondary: { ...ui.button, ...ui.secondary }, secondaryText: { ...ui.buttonText, ...ui.secondaryText },
});
