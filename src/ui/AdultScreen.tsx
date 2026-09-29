import DetailBack from './DetailBack.tsx';
import { palette, screenStyles as ui } from './screen-theme.ts';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ADULT_ACCESSIBLE_QUESTION,
  ADULT_HOLD_DURATION_MS,
  isAdultAccessibleAnswer,
} from '../application/adult-access.ts';
import type { AppSnapshot } from '../application/app-runtime.ts';
import type { Mode } from '../domain/contracts.ts';
import type { PresentationPreferences } from '../persistence/app-control-sqlite.ts';
import { petCatalogText } from './pet-copy.ts';

function AdultGate(props: Readonly<{ onUnlock: () => void; onExit: () => void }>) {
  const [progress, setProgress] = useState(0);
  const [alternative, setAlternative] = useState(false);
  const [answer, setAnswer] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (ticker.current) clearInterval(ticker.current);
    timer.current = null;
    ticker.current = null;
    setProgress(0);
  };
  useEffect(() => stop, []);

  const start = () => {
    stop();
    startedAt.current = Date.now();
    setProgress(1);
    ticker.current = setInterval(() => {
      setProgress(Math.min(99, Math.round(((Date.now() - startedAt.current) / ADULT_HOLD_DURATION_MS) * 100)));
    }, 100);
    timer.current = setTimeout(() => {
      stop();
      props.onUnlock();
    }, ADULT_HOLD_DURATION_MS);
  };

  return (
    <View style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <DetailBack onPress={props.onExit} />
        <Text style={styles.eyebrow}>РАЗДЕЛ ДЛЯ ВЗРОСЛОГО</Text>
        <Text accessibilityRole="header" style={styles.title}>Защита от случайного входа</Text>
        <Text style={styles.body}>Это простой барьер, а не проверка возраста, личности или родительских прав.</Text>
        <Pressable
          accessibilityHint="Удерживайте около трёх секунд. Для TalkBack доступен арифметический вариант ниже."
          accessibilityLabel={`Удерживать для входа. Выполнено ${progress} процентов`}
          accessibilityRole="button"
          onPressIn={start}
          onPressOut={stop}
          style={({ pressed }) => [styles.holdButton, pressed && styles.pressed]}
        >
          <Text style={styles.holdText}>{progress > 0 ? `Удерживайте… ${progress}%` : 'Удерживать 3 секунды'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: alternative }} onPress={() => setAlternative((value) => !value)} style={styles.secondary}>
          <Text style={styles.secondaryText}>Доступный вариант без удержания</Text>
        </Pressable>
        {alternative && (
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>{ADULT_ACCESSIBLE_QUESTION}</Text>
            <TextInput
              accessibilityLabel="Ответ на простой арифметический вопрос"
              keyboardType="number-pad"
              onChangeText={setAnswer}
              style={styles.input}
              value={answer}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !isAdultAccessibleAnswer(answer) }}
              disabled={!isAdultAccessibleAnswer(answer)}
              onPress={props.onUnlock}
              style={[styles.primary, !isAdultAccessibleAnswer(answer) && styles.disabled]}
            >
              <Text style={styles.primaryText}>Проверить ответ</Text>
            </Pressable>
          </View>
        )}
        <Pressable accessibilityRole="button" onPress={props.onExit} style={styles.secondary}>
          <Text style={styles.secondaryText}>Вернуться</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export default function AdultScreen(props: Readonly<{
  unlocked: boolean;
  mode: Mode;
  snapshot: AppSnapshot;
  busy: boolean;
  message: string | null;
  presentationPreferences: PresentationPreferences;
  onMotionEnabledChange: (enabled: boolean) => void;
  onSoundEnabledChange: (enabled: boolean) => void;
  onUnlock: () => void;
  onActivity: () => void;
  onExit: () => void;
  onSwitchMode: (mode: Mode) => void;
  onResetDemo: () => void;
  onDeleteSelected: () => void;
}>) {
  if (!props.unlocked) return <AdultGate onExit={props.onExit} onUnlock={props.onUnlock} />;
  const lifecycle = props.snapshot.lifecycle;
  const goal = props.snapshot.commerce?.selectedGoal;
  const petName = props.snapshot.profile?.name ?? 'Питомец';
  const modeLabel = props.mode === 'normal' ? 'обычная игра' : 'демонстрация';
  const confirmReset = () => Alert.alert(
    'Сбросить демонстрацию?',
    'Будут удалены только профиль, история и монеты демонстрации. Обычная игра останется без изменений.',
    [{ text: 'Отмена', style: 'cancel' }, { text: 'Сбросить демо', style: 'destructive', onPress: props.onResetDemo }],
  );
  const confirmDelete = () => Alert.alert(
    `Удалить данные: ${modeLabel}?`,
    `Будут удалены профиль, игровые монеты, копилка, покупки и история режима «${modeLabel}». Другой режим останется без изменений.`,
    [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить выбранный режим', style: 'destructive', onPress: props.onDeleteSelected }],
  );
  return (
    <View style={styles.page}>
      <ScrollView onScrollBeginDrag={props.onActivity} contentContainerStyle={styles.content}>
        <DetailBack onPress={props.onExit} label="Выйти из взрослого раздела" disabled={props.busy} />
        <Text style={styles.eyebrow}>ВЗРОСЛОМУ</Text>
        <Text accessibilityRole="header" style={styles.title}>Факты о прогрессе</Text>
        <Text style={styles.body}>{petName} помогает ребёнку пробовать планирование, покупки и накопления в локальной игре. Это не оценка способностей и не исследование развития ребёнка.</Text>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Текущий режим</Text>
          <Text style={styles.value}>{modeLabel}</Text>
          <Text style={styles.body}>Обычная игра и демонстрация хранятся раздельно только на этом устройстве.</Text>
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Сводка без рейтинга</Text>
          <Text style={styles.body}>Стадия питомца: {lifecycle?.petStage ?? 1} из 3</Text>
          <Text style={styles.body}>Завершено игровых дней: {lifecycle?.closedPeriods ?? 0}</Text>
          <Text style={styles.body}>Шагов роста: {lifecycle?.lifetimeGrowth ?? 0}</Text>
          <Text style={styles.body}>Текущая мечта: {goal ? `${petCatalogText(goal.name, petName)}, ${goal.cost} монет` : 'не выбрана'}</Text>
          <Text style={styles.body}>Завершённые занятия и сохранённые разборы доступны в «Прогрессе».</Text>
        </View>
        {props.mode === 'demo' && lifecycle && (
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.cardTitle}>Управление демонстрацией</Text>
            <Text style={styles.body}>День {lifecycle.periodIndex ?? 0} · виртуальная дата {lifecycle.calendarDate}</Text>
            <Text style={styles.body}>{lifecycle.state === 'WAITING'
              ? 'День закрыт. Перейдите в Домик и нажмите «Следующий демо-день».'
              : lifecycle.state === 'READY'
                ? 'Следующий день готов. Перейдите в Домик и нажмите «Начать день».'
                : 'После закрытия дня кнопка «Следующий демо-день» появится в Домике.'}</Text>
          </View>
        )}
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Восприятие</Text>
          <Text style={styles.body}>Настройки сохраняются на устройстве и не влияют на деньги, награды или рост.</Text>
          <Pressable
            accessibilityLabel={`Движение ${petName}`}
            accessibilityRole="switch"
            accessibilityState={{ checked: props.presentationPreferences.motionEnabled, disabled: props.busy }}
            disabled={props.busy}
            onPress={() => props.onMotionEnabledChange(!props.presentationPreferences.motionEnabled)}
            style={[styles.secondary, props.busy && styles.disabled]}
          >
            <Text style={styles.secondaryText}>Движение: {props.presentationPreferences.motionEnabled ? 'включено' : 'выключено'}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Звуки ${petName}`}
            accessibilityRole="switch"
            accessibilityState={{ checked: props.presentationPreferences.soundEnabled, disabled: props.busy }}
            disabled={props.busy}
            onPress={() => props.onSoundEnabledChange(!props.presentationPreferences.soundEnabled)}
            style={[styles.secondary, props.busy && styles.disabled]}
          >
            <Text style={styles.secondaryText}>Звуки: {props.presentationPreferences.soundEnabled ? 'включены' : 'выключены'}</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Для разговора</Text>
          <Text style={styles.body}>«Как ты выбрал, на что потратить и что оставить?»</Text>
        </View>
        {props.message && <Text accessibilityLiveRegion="polite" style={styles.error}>{props.message}</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: props.busy || props.mode === 'normal' }} disabled={props.busy || props.mode === 'normal'} onPress={() => props.onSwitchMode('normal')} style={[styles.primary, (props.busy || props.mode === 'normal') && styles.disabled]}>
          <Text style={styles.primaryText}>Перейти в обычную игру</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: props.busy || props.mode === 'demo' }} disabled={props.busy || props.mode === 'demo'} onPress={() => props.onSwitchMode('demo')} style={[styles.primary, (props.busy || props.mode === 'demo') && styles.disabled]}>
          <Text style={styles.primaryText}>Открыть демонстрацию</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: props.busy || props.mode !== 'demo' }} disabled={props.busy || props.mode !== 'demo'} onPress={confirmReset} style={[styles.danger, (props.busy || props.mode !== 'demo') && styles.disabled]}>
          <Text style={styles.dangerText}>Сбросить демонстрацию</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: props.busy }} disabled={props.busy} onPress={confirmDelete} style={[styles.danger, props.busy && styles.disabled]}>
          <Text style={styles.dangerText}>Удалить данные выбранного режима</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={props.onExit} style={styles.secondary}>
          <Text style={styles.secondaryText}>Выйти из взрослого раздела</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: ui.page, content: ui.content, eyebrow: ui.eyebrow, title: ui.title, body: ui.body,
  card: ui.card, cardTitle: ui.cardTitle,
  value: { color: palette.accent, fontSize: 20, fontWeight: '600' }, input: ui.input,
  holdButton: { ...ui.button, minHeight: 80 }, holdText: { ...ui.buttonText, fontSize: 18, fontVariant: ['tabular-nums'] },
  primary: ui.button, primaryText: ui.buttonText,
  secondary: { ...ui.button, ...ui.secondary }, secondaryText: { ...ui.buttonText, ...ui.secondaryText },
  danger: { ...ui.button, backgroundColor: palette.errorSurface, borderColor: palette.error, borderWidth: 1 },
  dangerText: { ...ui.buttonText, color: palette.error },
  error: ui.error, disabled: ui.disabled, pressed: ui.pressed,
});
