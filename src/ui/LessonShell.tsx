import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  HintLevel,
  LessonAttempt,
  LessonEvaluation,
  LessonRewardReason,
} from '../domain/lesson.ts';
import {
  LessonRendererRegistry,
  type LessonRendererProps,
} from './lesson-renderer-registry.ts';

type ShellCopy = Readonly<{
  title: string;
  intro: string;
  hints: readonly [string, string];
}>;

function ActionButton(props: Readonly<{
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
      style={[
        styles.button,
        props.secondary && styles.buttonSecondary,
        props.disabled && styles.disabled,
      ]}
    >
      <Text style={[
        styles.buttonText,
        props.secondary && styles.buttonSecondaryText,
      ]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function rewardText(reason: LessonRewardReason | null): string | null {
  if (reason === null) return null;
  if (reason === 'GRANTED') return 'Получено 20 монет за первое занятие сегодня.';
  if (reason === 'ALREADY_GRANTED') return 'Награда за занятие сегодня уже получена.';
  return 'Это тренировочное прохождение без награды.';
}

export default function LessonShell(props: Readonly<{
  attempt: LessonAttempt;
  evaluation: LessonEvaluation | null;
  copy: ShellCopy;
  registry: LessonRendererRegistry;
  busy: boolean;
  rewardReason: LessonRewardReason | null;
  onSolutionChange: LessonRendererProps['onChange'];
  onRevealHint: (level: HintLevel) => void;
  onEvaluate: () => void;
  onViewExplanation: (evaluationId: string) => void;
  onComplete: (evaluationId: string) => void;
  onBack: () => void;
}>) {
  const evaluation = props.evaluation;
  const explanationVisible = Boolean(
    evaluation &&
    (props.attempt.phase === 'explanation_seen' ||
      props.attempt.phase === 'completed') &&
    props.attempt.explanationEvaluationId === evaluation.evaluationId,
  );
  const invalid = evaluation?.outcome === 'invalid_input';
  const completeLabel = evaluation?.outcome === 'needs_review'
    ? 'Завершить с разбором'
    : 'Завершить занятие';
  const reward = rewardText(props.rewardReason);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ЗАНЯТИЕ</Text>
        <Text style={styles.title}>{props.copy.title}</Text>
        <Text style={styles.body}>{props.copy.intro}</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            В примере свои монеты. Монеты твоего дня не тратятся.
          </Text>
          <Text style={styles.noticeText}>
            {props.attempt.rewardEligibleAtStart
              ? 'За первое занятие сегодня — 20 монет. Остальные можно пройти для тренировки.'
              : 'Это тренировочное прохождение без награды.'}
          </Text>
        </View>

        {props.registry.render(props.attempt.mechanic, {
          lessonId: props.attempt.lessonId,
          parameters: props.attempt.parameters,
          solution: props.attempt.solution,
          disabled: props.busy || props.attempt.phase === 'completed',
          onChange: props.onSolutionChange,
        })}

        <View style={styles.hints}>
          {(['L1', 'L2'] as const).map((level, index) => {
            const shown = props.attempt.shownHints.includes(level);
            return shown ? (
              <Text key={level} style={styles.hintText}>
                {level}: {props.copy.hints[index]}
              </Text>
            ) : (
              <ActionButton
                key={level}
                label={level === 'L1' ? 'Подсказка' : 'Показать пример'}
                onPress={() => props.onRevealHint(level)}
                disabled={props.busy || props.attempt.phase === 'completed'}
                secondary
              />
            );
          })}
        </View>

        {props.attempt.phase === 'draft' && (
          <ActionButton
            label="Проверить решение"
            onPress={props.onEvaluate}
            disabled={props.busy}
          />
        )}

        {evaluation && props.attempt.phase !== 'draft' && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Что получилось</Text>
            <Text style={styles.body}>{evaluation.consequence}</Text>
            {!explanationVisible && (
              <ActionButton
                label="Показать объяснение"
                onPress={() => props.onViewExplanation(evaluation.evaluationId)}
                disabled={props.busy}
              />
            )}
            {explanationVisible && (
              <>
                <Text style={styles.resultTitle}>Почему так</Text>
                <Text style={styles.body}>{evaluation.explanation}</Text>
                <Text style={styles.resultTitle}>Следующий шаг</Text>
                <Text style={styles.body}>{evaluation.nextStep}</Text>
                {invalid ? (
                  <Text style={styles.error}>
                    Исправь ответ: невалидный ввод нельзя завершить.
                  </Text>
                ) : props.attempt.phase !== 'completed' ? (
                  <ActionButton
                    label={completeLabel}
                    onPress={() => props.onComplete(evaluation.evaluationId)}
                    disabled={props.busy}
                  />
                ) : null}
              </>
            )}
          </View>
        )}

        {reward && <Text style={styles.reward}>{reward}</Text>}
        <ActionButton label="Вернуться в свой день" onPress={props.onBack} secondary />
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  ink: '#14324A',
  muted: '#4B6878',
  sky: '#EAF6FB',
  teal: '#146B78',
  line: '#C7DEE5',
  yellow: '#FFF3C7',
  coral: '#B54135',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.sky },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  notice: { backgroundColor: colors.yellow, borderRadius: 14, gap: 4, padding: 12 },
  noticeText: { color: colors.ink, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  hints: { gap: 8 },
  hintText: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 15, lineHeight: 21, padding: 12 },
  result: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 8, padding: 14 },
  resultTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  error: { color: colors.coral, fontSize: 14, fontWeight: '700' },
  reward: { backgroundColor: colors.yellow, borderRadius: 12, color: colors.ink, fontSize: 15, fontWeight: '800', padding: 12 },
  button: { alignItems: 'center', backgroundColor: colors.teal, borderRadius: 14, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: colors.teal, borderWidth: 1.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  buttonSecondaryText: { color: colors.teal },
  disabled: { opacity: 0.45 },
});
