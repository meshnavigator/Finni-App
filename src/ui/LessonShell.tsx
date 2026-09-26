import DetailBack from './DetailBack.tsx';
import { palette, screenStyles as ui } from './screen-theme.ts';
import {
  Pressable,
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
import type { PresentationEvent } from '../application/receipt-presentation.ts';
import {
  LessonRendererRegistry,
  type LessonRendererProps,
} from './lesson-renderer-registry.ts';

type ShellCopy = Readonly<{
  title: string;
  intro: string;

  evidence: readonly Readonly<{ id: string; text: string }>[];
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
      style={({ pressed }) => [
        styles.button,
        pressed && !props.disabled && ui.pressed,
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

function rewardText(reason: LessonRewardReason | null, event: PresentationEvent | null): string | null {
  if (reason === null) return null;
  if (reason === 'GRANTED') return event
    ? `Финни радуется! Получено ${event.after.available - event.before.available} монет за первое занятие сегодня.`
    : 'Получено 20 монет за первое занятие сегодня.';
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
  rewardEvent: PresentationEvent | null;
  message: string | null;
  onSolutionChange: LessonRendererProps['onChange'];
  revealedEvidenceIds: readonly string[];
  onRevealEvidence: (evidenceId: string) => void;
  onRevealHint: (level: HintLevel) => void;
  onEvaluate: () => void;
  onViewExplanation: (evaluationId: string) => void;
  onComplete: (evaluationId: string) => void;
  onHelp: () => void;
  returnLabel: string;
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
  const reward = rewardText(props.rewardReason, props.rewardEvent);

  return (
    <View style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <DetailBack onPress={props.onBack} label={props.returnLabel} disabled={props.busy} />
        <Text style={styles.eyebrow}>ЗАНЯТИЕ</Text>
        <Text accessibilityRole="header" style={styles.title}>{props.copy.title}</Text>
        <Text style={styles.body}>{props.copy.intro}</Text>
        <Text style={styles.levelLabel}>Ситуация для твоего решения</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            В примере свои монеты. Монеты твоего дня не тратятся.
          </Text>
          <Text style={styles.noticeText}>
            {props.attempt.rewardEligibleAtStart
              ? '20 монет выдаются только за первое завершённое занятие дня. Остальные — для тренировки.'
              : 'Это тренировочное прохождение без награды.'}
          </Text>
        </View>

        {props.registry.render(props.attempt.mechanic, {
          lessonId: props.attempt.lessonId,
          parameters: props.attempt.parameters,
          solution: props.attempt.solution,
          disabled: props.busy || props.attempt.phase === 'completed',
          onChange: props.onSolutionChange,
          evidence: props.copy.evidence,
          revealedEvidenceIds: props.revealedEvidenceIds,
          onRevealEvidence: props.onRevealEvidence,
        })}

        <View style={styles.hints}>
          <ActionButton label="Короткая справка" onPress={props.onHelp} secondary />
          {(['L1', 'L2'] as const).map((level, index) => {
            const shown = props.attempt.shownHints.includes(level);
            return shown ? (
              <Text key={level} style={styles.hintText}>
                {level === 'L1' ? 'На что посмотреть' : 'Опора для расчёта'}: {props.attempt.hints[index]}
              </Text>
            ) : (
              <ActionButton
                key={level}
                label={level === 'L1' ? 'Подсказка L1' : 'Показать пример L2'}
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
            <Text accessibilityRole="header" style={styles.resultTitle}>Что получилось</Text>
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
                <Text accessibilityRole="header" style={styles.resultTitle}>Почему так</Text>
                <Text style={styles.body}>{evaluation.explanation}</Text>
                <Text accessibilityRole="header" style={styles.resultTitle}>Следующий шаг</Text>
                <Text style={styles.body}>{evaluation.nextStep}</Text>
                {props.attempt.mechanic === 'receipt_audit' && evaluation.calculation.awaitingSellerResponse === true && (
                  <ActionButton
                    label="Кажется, мяч указан дважды. Давайте проверим"
                    onPress={() => props.onSolutionChange({ ...props.attempt.solution, sellerResponse: 'neutral_question' })}
                    disabled={props.busy}
                  />
                )}
                {evaluation.outcome === 'needs_review' && evaluation.calculation.awaitingSellerResponse !== true && (
                  <Text style={styles.body}>Измени ответ выше, затем снова нажми «Проверить решение».</Text>
                )}
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

        {props.attempt.phase === 'completed' && (
          <Text style={styles.body}>Мы сохранили это открытие в прогрессе. Его можно посмотреть без нового начисления монет.</Text>
        )}
        {props.message && <Text accessibilityLiveRegion="polite" style={styles.error}>{props.message}</Text>}
        {reward && <Text accessibilityLiveRegion="polite" style={styles.reward}>{reward}</Text>}
        <ActionButton label={props.returnLabel} onPress={props.onBack} disabled={props.busy} secondary />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title, body: ui.body,
  levelLabel: { color: palette.ink, fontSize: 16, fontWeight: '600' },
  notice: { backgroundColor: palette.soft, borderRadius: 18, gap: 8, padding: 14 },
  noticeText: ui.body, hints: { gap: 10 },
  hintText: { ...ui.body, ...ui.card },
  result: ui.card, resultTitle: ui.cardTitle, error: ui.error,
  reward: { ...ui.body, backgroundColor: palette.soft, borderRadius: 18, color: palette.ink, padding: 14 },
  button: ui.button, buttonSecondary: ui.secondary,
  buttonText: ui.buttonText, buttonSecondaryText: ui.secondaryText, disabled: ui.disabled,
});
