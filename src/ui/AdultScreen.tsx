import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ADULT_ACCESSIBLE_QUESTION,
  ADULT_HOLD_DURATION_MS,
  isAdultAccessibleAnswer,
} from '../application/adult-access.ts';
import type { AppSnapshot } from '../application/app-runtime.ts';
import type { Mode } from '../domain/contracts.ts';
import type { PresentationPreferences } from '../persistence/app-control-sqlite.ts';

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
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>РАЗДЕЛ ДЛЯ ВЗРОСЛОГО</Text>
        <Text style={styles.title}>Защита от случайного входа</Text>
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
        <Pressable accessibilityRole="button" onPress={() => setAlternative((value) => !value)} style={styles.secondary}>
          <Text style={styles.secondaryText}>Доступный вариант без удержания</Text>
        </Pressable>
        {alternative && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{ADULT_ACCESSIBLE_QUESTION}</Text>
            <TextInput
              accessibilityLabel="Ответ на простой арифметический вопрос"
              keyboardType="number-pad"
              onChangeText={setAnswer}
              style={styles.input}
              value={answer}
            />
            <Pressable
              accessibilityRole="button"
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
    </SafeAreaView>
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
    <SafeAreaView style={styles.page}>
      <ScrollView onScrollBeginDrag={props.onActivity} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ВЗРОСЛОМУ</Text>
        <Text style={styles.title}>Факты о прогрессе</Text>
        <Text style={styles.body}>Финни помогает ребёнку пробовать планирование, покупки и накопления в локальной игре. Это не оценка способностей и не исследование развития ребёнка.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Текущий режим</Text>
          <Text style={styles.value}>{modeLabel}</Text>
          <Text style={styles.body}>Данные normal и demo хранятся раздельно только на устройстве.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Сводка без рейтинга</Text>
          <Text style={styles.body}>Стадия питомца: {lifecycle?.petStage ?? 1} из 3</Text>
          <Text style={styles.body}>Завершено игровых дней: {lifecycle?.closedPeriods ?? 0}</Text>
          <Text style={styles.body}>Шагов роста: {lifecycle?.lifetimeGrowth ?? 0}</Text>
          <Text style={styles.body}>Текущая мечта: {goal ? `${goal.name}, ${goal.cost} монет` : 'не выбрана'}</Text>
          <Text style={styles.body}>Завершённые занятия: данных пока нет — учебный модуль ещё не подключён.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Восприятие</Text>
          <Text style={styles.body}>Настройки сохраняются на устройстве и не влияют на деньги, награды или рост.</Text>
          <Pressable
            accessibilityLabel="Движение Финни"
            accessibilityRole="switch"
            accessibilityState={{ checked: props.presentationPreferences.motionEnabled, disabled: props.busy }}
            disabled={props.busy}
            onPress={() => props.onMotionEnabledChange(!props.presentationPreferences.motionEnabled)}
            style={[styles.secondary, props.busy && styles.disabled]}
          >
            <Text style={styles.secondaryText}>Движение: {props.presentationPreferences.motionEnabled ? 'включено' : 'выключено'}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Звуки Финни"
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
          <Text style={styles.cardTitle}>Для разговора</Text>
          <Text style={styles.body}>«Как ты выбрал, на что потратить и что оставить?»</Text>
        </View>
        {props.message && <Text accessibilityLiveRegion="polite" style={styles.error}>{props.message}</Text>}
        <Pressable accessibilityRole="button" disabled={props.busy || props.mode === 'normal'} onPress={() => props.onSwitchMode('normal')} style={[styles.primary, (props.busy || props.mode === 'normal') && styles.disabled]}>
          <Text style={styles.primaryText}>Перейти в обычную игру</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={props.busy || props.mode === 'demo'} onPress={() => props.onSwitchMode('demo')} style={[styles.primary, (props.busy || props.mode === 'demo') && styles.disabled]}>
          <Text style={styles.primaryText}>Открыть демонстрацию</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={props.busy || props.mode !== 'demo'} onPress={confirmReset} style={[styles.danger, (props.busy || props.mode !== 'demo') && styles.disabled]}>
          <Text style={styles.dangerText}>Сбросить демонстрацию</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={props.busy} onPress={confirmDelete} style={[styles.danger, props.busy && styles.disabled]}>
          <Text style={styles.dangerText}>Удалить данные выбранного режима</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={props.onExit} style={styles.secondary}>
          <Text style={styles.secondaryText}>Выйти из взрослого раздела</Text>
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
  body: { color: '#4B6878', fontSize: 15, lineHeight: 21 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 14, borderWidth: 1, gap: 7, padding: 13 },
  cardTitle: { color: '#14324A', fontSize: 17, fontWeight: '800' },
  value: { color: '#146B78', fontSize: 18, fontWeight: '900' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#C7DEE5', borderRadius: 12, borderWidth: 1.5, color: '#14324A', fontSize: 18, minHeight: 48, paddingHorizontal: 14 },
  holdButton: { alignItems: 'center', backgroundColor: '#146B78', borderRadius: 14, justifyContent: 'center', minHeight: 72, paddingHorizontal: 16 },
  holdText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  primary: { alignItems: 'center', backgroundColor: '#146B78', borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondary: { alignItems: 'center', borderColor: '#146B78', borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  secondaryText: { color: '#146B78', fontSize: 16, fontWeight: '800' },
  danger: { alignItems: 'center', borderColor: '#B54135', borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  dangerText: { color: '#B54135', fontSize: 16, fontWeight: '800' },
  error: { color: '#B54135', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});
