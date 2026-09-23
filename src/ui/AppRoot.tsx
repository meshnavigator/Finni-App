import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { AdultAccessSession } from '../application/adult-access.ts';
import type { AppRuntime, AppSnapshot } from '../application/app-runtime.ts';
import { ProductionAppController } from '../application/production-app-controller.ts';
import {
  errorScreenModel,
  homeResponsiveLayout,
  homeScreenModel,
  loadingScreenModel,
  onboardingScreenModel,
} from '../application/ui-model.ts';
import {
  PET_PATTERNS,
  PET_SHAPES,
  petAppearance,
  petNameError,
  type PetAppearance,
  type PetPatternId,
  type PetShapeId,
} from '../domain/pet-profile.ts';
import type { Plan } from '../domain/economy.ts';
import type { Mode } from '../domain/contracts.ts';
import type { HintLevel, LessonAttempt, LessonEvaluation } from '../domain/lesson.ts';
import { LOCAL_DEMO_LESSONS, type LocalLessonPresentation, type LessonVariantPresentation } from '../content/local-lesson-catalog.ts';
import AdultScreen from './AdultScreen.tsx';
import BudgetPlanScreen from './BudgetPlanScreen.tsx';
import HelpScreen from './HelpScreen.tsx';
import HistoryScreen from './HistoryScreen.tsx';
import PeriodResultScreen from './PeriodResultScreen.tsx';
import SavingsScreen from './SavingsScreen.tsx';
import ShopScreen from './ShopScreen.tsx';
import FinniHomeScene from './FinniHomeScene.tsx';
import LessonShell from './LessonShell.tsx';
import { LessonRendererRegistry } from './lesson-renderer-registry.ts';
import { AllocationRenderer, BasketRenderer } from './budget-purchase-renderers.tsx';
import { ReceiptAuditRenderer, ResourceChoiceRenderer } from './receipt-workshop-renderers.tsx';
import SavingsLessonRenderer from './SavingsLessonRenderer.tsx';
import { lessonReturnLabel, lessonReturnScreen, nextLessonVariant } from './lesson-return.ts';
import type { LessonDiscovery } from '../persistence/lesson-repository.ts';

type Screen = 'intro' | 'pet' | 'home' | 'plan' | 'shop' | 'savings' | 'history' | 'result' | 'adult' | 'section' | 'lesson-catalog' | 'lesson';
type Phase = 'loading' | 'ready' | 'error';

const EMPTY_SNAPSHOT: AppSnapshot = Object.freeze({
  profile: null,
  lifecycle: null,
  budget: null,
  commerce: null,
});

const lessonRenderers = new LessonRendererRegistry()
  .register('allocation', AllocationRenderer)
  .register('basket', BasketRenderer)
  .register('savings', SavingsLessonRenderer)
  .register('receipt_audit', ReceiptAuditRenderer)
  .register('resource_choice', ResourceChoiceRenderer);

function ActionButton(props: Readonly<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  accessibilityHint?: string;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={props.accessibilityHint}
      accessibilityState={{ disabled: Boolean(props.disabled) }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.action,
        props.secondary && styles.actionSecondary,
        props.disabled && styles.actionDisabled,
        pressed && !props.disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, props.secondary && styles.actionSecondaryText]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

export function PetAvatar(props: Readonly<{
  shapeId: PetShapeId;
  patternId: PetPatternId;
  name: string;
  size?: number;
}>) {
  const size = props.size ?? 96;
  const pointy = props.shapeId === 'pointy';
  const floppy = props.shapeId === 'floppy';
  return (
    <View
      accessible
      accessibilityLabel={`${props.name}: ${PET_SHAPES.find((item) => item.id === props.shapeId)?.label}, ${PET_PATTERNS.find((item) => item.id === props.patternId)?.label}`}
      style={[styles.petFrame, { height: size, width: size }]}
    >
      <View
        style={[
          styles.ear,
          styles.earLeft,
          pointy && styles.earPointy,
          floppy && styles.earFloppyLeft,
        ]}
      />
      <View
        style={[
          styles.ear,
          styles.earRight,
          pointy && styles.earPointy,
          floppy && styles.earFloppyRight,
        ]}
      />
      <View style={[styles.petHead, pointy && styles.petHeadPointy]}>
        {props.patternId === 'spots' && (
          <>
            <View style={[styles.spot, styles.spotOne]} />
            <View style={[styles.spot, styles.spotTwo]} />
          </>
        )}
        {props.patternId === 'stripes' && (
          <View style={styles.stripes}>
            <View style={styles.stripe} />
            <View style={styles.stripe} />
            <View style={styles.stripe} />
          </View>
        )}
        <Text style={styles.petFace}>• ᴗ •</Text>
      </View>
    </View>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.centered} accessibilityLabel="Загрузка приложения">
      <PetAvatar name="Финни" shapeId="round" patternId="plain" size={104} />
      <Text style={styles.title}>{loadingScreenModel.title}</Text>
      <Text style={styles.body}>{loadingScreenModel.message}</Text>
    </SafeAreaView>
  );
}

function ErrorScreen(props: Readonly<{ message?: string; onRetry: () => void; onAdult?: () => void }>) {
  const model = errorScreenModel(props.message);
  return (
    <SafeAreaView style={styles.centered} accessibilityLabel="Ошибка загрузки">
      <Text style={styles.errorIcon}>!</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.body}>{model.message}</Text>
      <ActionButton label={model.action} onPress={props.onRetry} />
      {props.onAdult && <ActionButton label="Удалить повреждённые данные" onPress={props.onAdult} secondary />}
    </SafeAreaView>
  );
}

function IntroScreen(props: Readonly<{
  repeat?: boolean;
  onContinue: () => void;
  onClose?: () => void;
  onAdult?: () => void;
}>) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.introContent}>
        <PetAvatar name="Финни" shapeId="round" patternId="spots" size={96} />
        <Text style={styles.eyebrow}>ПИТОМЕЦ ФИННИ</Text>
        <Text style={styles.title}>{onboardingScreenModel.title}</Text>
        <Text style={styles.body}>Выбирай сам — Финни поможет увидеть результат.</Text>
        <View style={styles.directionList}>
          {onboardingScreenModel.directions.map((item, index) => (
            <View key={item.id} style={styles.directionCard}>
              <Text style={styles.directionNumber}>{index + 1}</Text>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.caption}>{item.hint}</Text>
              </View>
            </View>
          ))}
        </View>
        <ActionButton
          label={props.repeat ? 'Вернуться в домик' : onboardingScreenModel.primaryAction}
          onPress={props.repeat ? props.onClose! : props.onContinue}
        />
        {!props.repeat && (
          <ActionButton
            label={onboardingScreenModel.secondaryAction}
            onPress={props.onContinue}
            secondary
          />
        )}
        {!props.repeat && (
          <Pressable accessibilityRole="button" onPress={props.onAdult} style={styles.adultButton}>
            <Text style={styles.expertLink}>Раздел для взрослого</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Help is intentionally a native modal rather than a second Home route. This
 * leaves the current Home state intact while preventing the scene and bottom
 * navigation from receiving touches. Android Back is routed to
 * `onRequestClose`, before any underlying navigation can run.
 */
function HelpOverlay(props: Readonly<{ onClose: () => void }>) {
  return (
    <Modal
      accessibilityViewIsModal
      animationType="slide"
      onRequestClose={props.onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      visible
    >
      <View accessibilityViewIsModal style={styles.helpOverlay} testID="home-help-overlay">
        <HelpScreen onBack={props.onClose} />
      </View>
    </Modal>
  );
}

function ChoiceButton(props: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.choice,
        props.selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.choiceText, props.selected && styles.choiceTextSelected]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function PetBuilder(props: Readonly<{
  initial?: PetAppearance;
  busy: boolean;
  saveError: string | null;
  onSave: (appearance: PetAppearance) => void;
  onCancel: () => void;
}>) {
  const [name, setName] = useState(props.initial?.name ?? 'Финни');
  const [shapeId, setShapeId] = useState<PetShapeId>(props.initial?.shapeId ?? 'round');
  const [patternId, setPatternId] = useState<PetPatternId>(props.initial?.patternId ?? 'plain');
  const validation = petNameError(name);
  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.builderContent}
        >
          <Text style={styles.eyebrow}>{props.initial ? 'О ПИТОМЦЕ' : 'НОВЫЙ ДРУГ'}</Text>
          <Text style={styles.title}>{props.initial ? 'Настрой питомца' : 'Как выглядит Финни?'}</Text>
          <PetAvatar name={name || 'Питомец'} shapeId={shapeId} patternId={patternId} size={112} />
          <Text style={styles.fieldLabel}>Форма</Text>
          <View accessibilityRole="radiogroup" style={styles.choiceRow}>
            {PET_SHAPES.map((shape) => (
              <ChoiceButton
                key={shape.id}
                label={shape.label.replace(' ушки', '')}
                selected={shape.id === shapeId}
                onPress={() => setShapeId(shape.id)}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Узор</Text>
          <View accessibilityRole="radiogroup" style={styles.choiceRow}>
            {PET_PATTERNS.map((pattern) => (
              <ChoiceButton
                key={pattern.id}
                label={pattern.label}
                selected={pattern.id === patternId}
                onPress={() => setPatternId(pattern.id)}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Придумай имя питомцу</Text>
          <TextInput
            accessibilityLabel="Игровое имя питомца"
            autoCapitalize="sentences"
            maxLength={32}
            onChangeText={setName}
            placeholder="Финни"
            style={[styles.input, validation && styles.inputError]}
            value={name}
          />
          {validation && <Text style={styles.validation}>{validation}</Text>}
          {props.saveError && <Text style={styles.validation}>{props.saveError}</Text>}
          <ActionButton
            label={props.busy ? 'Сохраняем…' : 'Готово'}
            disabled={props.busy || Boolean(validation)}
            onPress={() => props.onSave(petAppearance({ name, shapeId, patternId }))}
          />
          <ActionButton label="Отмена" onPress={props.onCancel} secondary />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Metric(props: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.metric} accessible accessibilityLabel={`${props.label}: ${props.value}`}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

function HomeScreen(props: Readonly<{
  snapshot: AppSnapshot;
  busy: boolean;
  notice: string | null;
  scenePaused: boolean;
  onOpenDay: () => void;
  onResults: () => void;
  onEditPet: () => void;
  onHelp: () => void;
  onLesson: () => void;
  onSection: (title: string) => void;
}>) {
  const viewport = useWindowDimensions();
  const profile = props.snapshot.profile!;
  const lifecycle = props.snapshot.lifecycle!;
  const model = homeScreenModel(profile, lifecycle);
  const layout = homeResponsiveLayout(viewport);
  const primary = () => {
    if (model.action.route === 'open-day') props.onOpenDay();
    else if (model.action.route === 'plan') props.onSection('План');
    else if (model.action.route === 'day' || model.action.route === 'results') props.onResults();
    else props.onSection(model.action.label);
  };
  const primaryAction = (
    <ActionButton
      label={props.busy ? 'Открываем день…' : model.action.label}
      disabled={props.busy || !model.action.enabled}
      onPress={primary}
    />
  );
  const petScene = (
    <FinniHomeScene
      accessibilityLabel={`Финни дома. ${model.careLabel}. Настроение: спокойно`}
      careLabel={model.careLabel}
      height={Math.max(layout.sceneMinHeight, layout.mode === 'ordinary' ? 220 : 180)}
      paused={props.scenePaused}
    />
  );
  return (
    <SafeAreaView style={[styles.page, styles.homePage]}>
      <ScrollView
        accessibilityLabel={layout.reviewConflict
          ? 'Домик Финни. Увеличенный текст: доступен прокручиваемый вариант; одновременная видимость всех элементов требует review.'
          : 'Домик Финни'}
        contentContainerStyle={[styles.homeContent, layout.mode !== 'ordinary' && styles.homeContentLargeText]}
      >
        <View style={styles.homeHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`О питомце: ${model.petName}`}
            hitSlop={8}
            onPress={props.onEditPet}
            style={styles.petNameButton}
          >
            <Text numberOfLines={2} style={styles.homeName}>{model.petName}</Text>
            <Text style={styles.caption}>О питомце</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" onPress={() => props.onSection('Прогресс')} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>Прогресс</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={props.onHelp} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>Как играть</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.dayLabel}>{model.dayLabel}</Text>
        <View style={styles.moneyRow}>
          <Metric label="Доступно" value={model.availableLabel} />
          <Metric label="Копилка" value={model.savingsLabel} />
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ТЕКУЩАЯ ЦЕЛЬ</Text>
          <Text style={styles.summaryValue}>{model.goalLabel}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={props.onLesson} style={styles.lessonCard}>
          <Text style={styles.summaryLabel}>АКТИВНОЕ ЗАНЯТИЕ</Text>
          <Text style={styles.summaryValue}>{model.lessonLabel}</Text>
        </Pressable>
        {layout.reviewConflict && (
          <Text accessibilityLiveRegion="polite" style={styles.reviewConflict}>
            Проверка макета: при 200% доступен прокручиваемый вариант; одновременная видимость всех обязательных элементов требует review.
          </Text>
        )}
        {props.notice && <Text style={styles.notice}>{props.notice}</Text>}
        {layout.primaryBeforeScene && primaryAction}
        {petScene}
        {!layout.primaryBeforeScene && primaryAction}
        <View style={[styles.nav, layout.mode !== 'ordinary' && styles.navLargeText]} accessibilityRole="tablist">
          {[
            ['Домик', true],
            ['План', model.planAvailable],
            ['Покупки', model.spendingAvailable],
            ['Копилка', model.savingsAvailable],
          ].map(([label, enabled]) => (
            <Pressable
              key={String(label)}
              accessibilityRole="tab"
              accessibilityState={{ selected: label === 'Домик', disabled: !enabled }}
              disabled={!enabled}
              onPress={() => props.onSection(String(label))}
              style={[styles.navItem, layout.mode !== 'ordinary' && styles.navItemLargeText, !enabled && styles.navItemDisabled]}
            >
              <Text style={[styles.navLabel, label === 'Домик' && styles.navLabelActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityHint="Открывает раздел с защитным барьером для взрослого"
          accessibilityRole="button"
          onPress={() => props.onSection('Для взрослого')}
          style={styles.adultButton}
        >
          <Text style={styles.adultLabel}>Для взрослого</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
function SectionScreen(props: Readonly<{ title: string; onBack: () => void }>) {
  return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.eyebrow}>РАЗДЕЛ</Text>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.body}>Основа навигации готова. Действия откроются, когда выполнены денежные предусловия.</Text>
      <ActionButton label="Вернуться в домик" onPress={props.onBack} />
    </SafeAreaView>
  );
}

function LessonCatalogScreen(props: Readonly<{
  lessons: readonly LocalLessonPresentation[];
  onSelect: (lesson: LessonVariantPresentation) => void;
  onBack: () => void;
}>) {
  return (
    <SafeAreaView style={styles.page} accessibilityLabel="Каталог учебных занятий">
      <ScrollView contentContainerStyle={styles.introContent}>
        <Text style={styles.eyebrow}>УЧЕБНЫЕ ЗАНЯТИЯ</Text>
        <Text style={styles.title}>Выбери пример</Text>
        <Text style={styles.body}>Это задания для тренировки: покупки и переводы из копилки здесь не выполняются.</Text>
        {props.lessons.map((lesson) => (
          <View key={lesson.definition.lessonId} style={styles.lessonCard}>
            <Text style={styles.summaryValue}>{lesson.title}</Text>
            {lesson.variants.map((variant, index) => (
              <Pressable
                key={variant.definition.variantId}
                accessibilityRole="button"
                accessibilityLabel={`${lesson.title}. Ситуация ${index + 1}. ${variant.intro}`}
                onPress={() => props.onSelect(variant)}
                style={styles.variantButton}
              >
                <Text style={styles.variantTitle}>Ситуация {index + 1}</Text>
                <Text style={styles.caption}>{variant.intro}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <ActionButton label="Вернуться в домик" onPress={props.onBack} secondary />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AppRoot() {
  const controller = useRef<ProductionAppController | null>(null);
  const adultAccess = useRef(new AdultAccessSession());
  const returnScreen = useRef<Screen>('home');
  const [phase, setPhase] = useState<Phase>('loading');
  const [screen, setScreen] = useState<Screen>('intro');
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [mode, setMode] = useState<Mode>('normal');
  const [adultUnlocked, setAdultUnlocked] = useState(false);
  const [adultRecoveryAvailable, setAdultRecoveryAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [lessonAttempt, setLessonAttempt] = useState<LessonAttempt | null>(null);
  const [lessonEvaluation, setLessonEvaluation] = useState<LessonEvaluation | null>(null);
  const [lessonPresentation, setLessonPresentation] = useState<LessonVariantPresentation | null>(null);
  const [revealedEvidenceIds, setRevealedEvidenceIds] = useState<readonly string[]>([]);
  const [lessonRewardReason, setLessonRewardReason] = useState<null | 'GRANTED' | 'TRAINING' | 'PERIOD_NOT_ACTIVE' | 'ALREADY_GRANTED'>(null);
  const [lessonDiscoveries, setLessonDiscoveries] = useState<readonly LessonDiscovery[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [boot, setBoot] = useState(0);

  const lockAdult = () => {
    adultAccess.current.lock();
    setAdultUnlocked(false);
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      adultAccess.current.handleAppState(state);
      if (state !== 'active') setAdultUnlocked(false);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!adultUnlocked) return undefined;
    const timer = setInterval(() => {
      if (!adultAccess.current.isUnlocked(Date.now())) setAdultUnlocked(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [adultUnlocked]);

  useEffect(() => () => {
    void controller.current?.close();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      setPhase('loading');
      setMessage(null);
      try {
        await controller.current?.close();
        controller.current = null;
        setAdultRecoveryAvailable(false);
        const initialized = await ProductionAppController.initialize(async () => {
          adultAccess.current.lock();
          if (!cancelled) {
            setAdultUnlocked(false);
            setHelpOpen(false);
            setSnapshot(null);
            setScreen('intro');
          }
        });
        if (cancelled) {
          await initialized.controller.close();
          return;
        }
        controller.current = initialized.controller;
        setAdultRecoveryAvailable(true);
        setMode(initialized.controller.mode());
        if (initialized.startupError) {
          setSnapshot(null);
          setPhase('error');
        } else {
          setSnapshot(initialized.snapshot);
          setScreen(initialized.snapshot?.profile ? 'home' : 'intro');
          setPhase('ready');
        }
      } catch {
        if (!cancelled) setPhase('error');
      }
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [boot]);

  const savePet = async (appearance: PetAppearance) => {
    if (!controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      const loaded = snapshot?.profile
        ? await controller.current.runSnapshot((runtime) => runtime.updatePet(snapshot.profile!, appearance))
        : await controller.current.runSnapshot((runtime) => runtime.createProfile(appearance));
      setSnapshot(loaded);
      setScreen('home');
    } catch {
      setMessage('Не получилось сохранить. Проверь данные и попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const openDay = async () => {
    if (!controller.current || !snapshot) return;
    setBusy(true);
    setMessage(null);
    try {
      setSnapshot(await controller.current.runSnapshot((runtime) => runtime.openDay(snapshot)));
    } catch {
      setMessage('День не открылся. Деньги не начислены — попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const confirmBudgetPlan = async (values: Plan, acknowledgedLowNeed: boolean) => {
    if (!controller.current || !snapshot) return;
    setBusy(true);
    setMessage(null);
    try {
      setSnapshot(await controller.current.runSnapshot((runtime) => runtime.confirmPlan(snapshot, values, acknowledgedLowNeed)));
    } catch {
      setMessage('План не сохранился. Проверь суммы и попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const allocateIncome = async (values: Plan) => {
    if (!controller.current || !snapshot) return;
    setBusy(true);
    setMessage(null);
    try {
      setSnapshot(await controller.current.runSnapshot((runtime) => runtime.allocateAdditionalIncome(snapshot, values)));
    } catch {
      setMessage('Доход изменился. Проверь доступный остаток и подтверди ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const updateCommerce = async (
    action: (runtime: AppRuntime, current: AppSnapshot) => Promise<AppSnapshot>,
    errorMessage: string,
  ) => {
    if (!controller.current || !snapshot) return;
    setBusy(true);
    setMessage(null);
    try {
      setSnapshot(await controller.current.runSnapshot((runtime) => action(runtime, snapshot)));
    } catch {
      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const openHistory = async (back: Screen) => {
    if (!snapshot?.profile || !controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      const discoveries = await controller.current.submit((runtime) => runtime.listLessonDiscoveries(snapshot.profile!.id));
      setLessonDiscoveries(discoveries);
      returnScreen.current = back;
      setScreen('history');
    } catch {
      setMessage('Не удалось открыть историю занятий. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const openAdult = () => {
    returnScreen.current = screen === 'adult' ? 'home' : screen;
    lockAdult();
    setMessage(null);
    setScreen('adult');
  };

  const leaveAdult = () => {
    lockAdult();
    setMessage(null);
    setScreen(snapshot?.profile ? 'home' : 'intro');
  };

  const switchMode = async (target: Mode) => {
    if (!controller.current || target === mode) return;
    if (!adultAccess.current.recordActivity(Date.now())) {
      setAdultUnlocked(false);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const loaded = await controller.current.switchMode(target);
      setMode(target);
      setSnapshot(loaded);
      lockAdult();
      setScreen(loaded.profile ? 'home' : 'intro');
    } catch {
      setMessage('Режим не переключился. Данные не смешаны; попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const runAdmin = async (operation: 'RESET_PROFILE' | 'DELETE_PROFILE') => {
    if (!controller.current) return;
    if (!adultAccess.current.recordActivity(Date.now())) {
      setAdultUnlocked(false);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const loaded = await controller.current.runAdmin(operation);
      setSnapshot(loaded);
      setMode(controller.current.mode());
      lockAdult();
      setScreen('intro');
      setPhase('ready');
    } catch {
      setMessage('Не удалось завершить удаление. Операция сохранена и будет продолжена при следующем запуске.');
    } finally {
      setBusy(false);
    }
  };

  const openSection = (title: string) => {
    setMessage(null);
    if (title === 'План') {
      setScreen('plan');
      return;
    }
    if (title === 'Покупки') {
      setScreen('shop');
      return;
    }
    if (title === 'Копилка') {
      setScreen('savings');
      return;
    }
    if (title === 'Прогресс') {
      void openHistory('home');
      return;
    }
    if (title === 'Для взрослого') {
      openAdult();
      return;
    }
    setSectionTitle(title);
    setScreen('section');
  };

  const openLesson = async (presentation: LessonVariantPresentation) => {
    if (!snapshot || !controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      const attempt = await controller.current.submit((runtime) => runtime.startLesson(snapshot, presentation.definition));
      setLessonAttempt(attempt);
      setLessonEvaluation(null);
      setLessonPresentation(presentation);
      setRevealedEvidenceIds([]);
      setLessonRewardReason(null);
      setScreen('lesson');
    } catch {
      setMessage('Занятие не открылось. Монеты твоего дня не изменились.');
    } finally {
      setBusy(false);
    }
  };

  const withLesson = async (work: (runtime: AppRuntime, attempt: LessonAttempt) => Promise<LessonAttempt | Readonly<{ attempt: LessonAttempt; evaluation?: LessonEvaluation }>>) => {
    if (!lessonAttempt || !controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await controller.current.submit((runtime) => work(runtime, lessonAttempt));
      const next = 'attempt' in result ? result.attempt : result;
      setLessonAttempt(next);
      if ('evaluation' in result && result.evaluation) setLessonEvaluation(result.evaluation);
    } catch {
      setMessage('Действие не сохранилось. Можно попробовать ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const completeLesson = async () => {
    if (!snapshot || !lessonAttempt || !lessonEvaluation || !controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      const receipt = await controller.current.submit((runtime) => runtime.completeLesson(snapshot, lessonAttempt.attemptId, lessonEvaluation.evaluationId));
      if (!receipt.result.ok) throw new Error('Lesson completion failed');
      setLessonRewardReason(receipt.result.data.reward.reason);
      setLessonAttempt((current) => current ? { ...current, phase: 'completed' } : current);
      try {
        setSnapshot(await controller.current.load());
      } catch {
        setMessage('Занятие сохранено. Не удалось обновить день — открой приложение снова.');
      }
    } catch {
      setMessage('Завершение не сохранилось. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const lessonTarget = lessonAttempt?.phase === 'completed'
    ? lessonReturnScreen(lessonAttempt.lessonId, snapshot?.lifecycle?.state)
    : null;
  const leaveLesson = () => {
    if (busy) return;
    setMessage(null);
    if (!lessonTarget) {
      setScreen('lesson-catalog');
    } else if (lessonTarget === 'history') {
      void openHistory('home');
    } else {
      setScreen(lessonTarget);
    }
  };

  if (phase === 'loading') return <LoadingScreen />;
  if (phase === 'error') return (
    <ErrorScreen
      onAdult={adultRecoveryAvailable ? () => { setPhase('ready'); openAdult(); } : undefined}
      onRetry={() => setBoot((value) => value + 1)}
    />
  );

  return (
    <>
      <StatusBar style="dark" />
      {screen === 'intro' && <IntroScreen onAdult={openAdult} onContinue={() => setScreen('pet')} />}
      {screen === 'pet' && (
        <PetBuilder
          key={snapshot?.profile ? `${snapshot.profile.id}-${snapshot.profile.revision}` : 'new'}
          initial={snapshot?.profile ? {
            name: snapshot.profile.name,
            shapeId: snapshot.profile.shapeId,
            patternId: snapshot.profile.patternId,
          } : undefined}
          busy={busy}
          saveError={message}
          onCancel={() => setScreen(snapshot?.profile ? 'home' : 'intro')}
          onSave={(appearance) => void savePet(appearance)}
        />
      )}
      {screen === 'home' && snapshot?.profile && snapshot.lifecycle && (
        <HomeScreen
          snapshot={snapshot}
          busy={busy}
          notice={message}
          scenePaused={helpOpen}
          onEditPet={() => { setMessage(null); setScreen('pet'); }}
          onHelp={() => setHelpOpen(true)}
          onLesson={() => { setMessage(null); setScreen('lesson-catalog'); }}
          onOpenDay={() => void openDay()}
          onResults={() => { setMessage(null); setScreen('result'); }}
          onSection={openSection}
        />
      )}
      {screen === 'lesson-catalog' && (
        <LessonCatalogScreen
          lessons={LOCAL_DEMO_LESSONS}
          onBack={() => setScreen('home')}
          onSelect={(lesson) => void openLesson(lesson)}
        />
      )}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {screen === 'plan' && snapshot?.profile && snapshot.lifecycle && (
        <BudgetPlanScreen
          snapshot={snapshot}
          busy={busy}
          message={message}
          onAllocate={(values) => void allocateIncome(values)}
          onBack={() => { setMessage(null); setScreen('home'); }}
          onConfirm={(values, acknowledged) =>
            void confirmBudgetPlan(values, acknowledged)}
        />
      )}
      {screen === 'shop' && snapshot && (
        <ShopScreen
          snapshot={snapshot}
          busy={busy}
          onBack={() => setScreen('home')}
          onPreview={(itemId) => controller.current!.submit((runtime) => runtime.previewPurchase(snapshot, itemId))}
          onPurchase={(itemId, acknowledged) => {
            void updateCommerce(
              (runtime, current) => runtime.purchase(current, itemId, acknowledged),
              'Покупка не выполнена. Деньги не изменились.',
            );
          }}
        />
      )}
      {screen === 'savings' && snapshot && (
        <SavingsScreen
          snapshot={snapshot}
          busy={busy}
          message={message}
          onBack={() => { setMessage(null); setScreen('home'); }}
          onClaim={(goalId) => void updateCommerce(
            (runtime, current) => runtime.claimGoal(current, goalId),
            'Цель не получена. Монеты не изменились.',
          )}
          onHistory={() => void openHistory('savings')}
          onPreview={(kind, value) => controller.current!.submit((runtime) => runtime.previewSavings(snapshot, kind, value))}
          onSelectGoal={(goalId) => void updateCommerce(
            (runtime, current) => runtime.selectGoal(current, goalId),
            'Цель не изменилась. Попробуй ещё раз.',
          )}
          onTransfer={(kind, value) => void updateCommerce(
            (runtime, current) => kind === 'deposit'
              ? runtime.depositSavings(current, value)
              : runtime.withdrawSavings(current, value),
            'Перевод не выполнен. Монеты не изменились.',
          )}
        />
      )}
      {screen === 'history' && snapshot && (
        <HistoryScreen
          snapshot={snapshot}
          discoveries={lessonDiscoveries}
          onBack={() => setScreen(returnScreen.current)}
          onHelp={() => setHelpOpen(true)}
          onPractice={(lessonId, previousVariantId) => {
            const lesson = LOCAL_DEMO_LESSONS.find((item) => item.definition.lessonId === lessonId);
            if (lesson) void openLesson(nextLessonVariant(lesson.variants, previousVariantId));
          }}
        />
      )}
      {screen === 'result' && snapshot && (
        <PeriodResultScreen
          snapshot={snapshot}
          busy={busy}
          message={message}
          onBack={() => { setMessage(null); setScreen('home'); }}
          onClosePeriod={() => void updateCommerce(
            (runtime, current) => runtime.closePeriod(current),
            'Итог не сохранился. День остался открытым.',
          )}
        />
      )}
      {screen === 'adult' && (
        <AdultScreen
          unlocked={adultUnlocked}
          mode={mode}
          snapshot={snapshot ?? EMPTY_SNAPSHOT}
          busy={busy}
          message={message}
          onUnlock={() => { adultAccess.current.unlock(Date.now()); setAdultUnlocked(true); }}
          onActivity={() => {
            if (!adultAccess.current.recordActivity(Date.now())) {
              setAdultUnlocked(false);
            }
          }}
          onExit={leaveAdult}
          onSwitchMode={(target) => void switchMode(target)}
          onResetDemo={() => void runAdmin('RESET_PROFILE')}
          onDeleteSelected={() => void runAdmin('DELETE_PROFILE')}
        />
      )}
      {screen === 'lesson' && lessonAttempt && lessonPresentation && (
        <LessonShell
          attempt={lessonAttempt}
          evaluation={lessonEvaluation}
          copy={{ title: lessonPresentation.title, intro: lessonPresentation.intro, evidence: lessonPresentation.evidence }}
          registry={lessonRenderers}
          busy={busy}
          rewardReason={lessonRewardReason}
          message={message}
          onSolutionChange={(solution) => void withLesson((runtime, attempt) => runtime.saveLesson(attempt.attemptId, solution))}
          revealedEvidenceIds={revealedEvidenceIds}
          onRevealEvidence={(evidenceId) => setRevealedEvidenceIds((current) => current.includes(evidenceId) ? current : [...current, evidenceId])}
          onRevealHint={(level: HintLevel) => void withLesson((runtime, attempt) => runtime.revealLessonHint(attempt.attemptId, level))}
          onEvaluate={() => void withLesson((runtime, attempt) => runtime.evaluateLesson(attempt.attemptId))}
          onViewExplanation={(evaluationId) => void withLesson((runtime, attempt) => runtime.viewLessonExplanation(attempt.attemptId, evaluationId))}
          onComplete={() => void completeLesson()}
          onHelp={() => setHelpOpen(true)}
          returnLabel={lessonTarget ? lessonReturnLabel(lessonTarget) : 'К выбору занятий'}
          onBack={leaveLesson}
        />
      )}
      {screen === 'section' && <SectionScreen title={sectionTitle} onBack={() => setScreen('home')} />}
    </>
  );
}

const colors = {
  ink: '#14324A',
  muted: '#4B6878',
  sky: '#EAF6FB',
  teal: '#146B78',
  pale: '#F7FBFC',
  line: '#C7DEE5',
  coral: '#D95D4F',
  yellow: '#F7C85E',
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flex: 1, backgroundColor: colors.sky },
  homePage: { paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.sky },
  introContent: { alignItems: 'center', gap: 10, padding: 20, paddingBottom: 28 },
  builderContent: { alignItems: 'center', gap: 8, padding: 18, paddingBottom: 36 },
  homeContent: { gap: 8, minHeight: '100%', paddingHorizontal: 14, paddingBottom: 8 },
  homeContentLargeText: { paddingBottom: 24 },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 22, maxWidth: 340, textAlign: 'center' },
  caption: { color: colors.muted, fontSize: 13, lineHeight: 17 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  action: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.teal, borderRadius: 14, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  actionSecondary: { backgroundColor: 'transparent', borderColor: colors.teal, borderWidth: 1.5 },
  actionDisabled: { opacity: 0.45 },
  actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  actionSecondaryText: { color: colors.teal },
  pressed: { opacity: 0.72 },
  errorIcon: { backgroundColor: colors.coral, borderRadius: 30, color: '#FFFFFF', fontSize: 28, fontWeight: '900', lineHeight: 56, overflow: 'hidden', textAlign: 'center', width: 56 },
  directionList: { alignSelf: 'stretch', gap: 8, marginVertical: 4 },
  directionCard: { alignItems: 'center', backgroundColor: colors.pale, borderColor: colors.line, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 58, paddingHorizontal: 12 },
  directionNumber: { backgroundColor: colors.yellow, borderRadius: 18, color: colors.ink, fontSize: 16, fontWeight: '900', lineHeight: 36, textAlign: 'center', width: 36 },
  expertLink: { color: colors.muted, fontSize: 13, marginTop: 4, textDecorationLine: 'underline' },
  choiceRow: { flexDirection: 'row', gap: 7, width: '100%' },
  choice: { alignItems: 'center', backgroundColor: colors.pale, borderColor: colors.line, borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 4 },
  choiceSelected: { backgroundColor: '#D5EEF0', borderColor: colors.teal, borderWidth: 2 },
  choiceText: { color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  choiceTextSelected: { color: colors.teal },
  fieldLabel: { alignSelf: 'flex-start', color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 3 },
  input: { alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 12, borderWidth: 1.5, color: colors.ink, fontSize: 17, minHeight: 48, paddingHorizontal: 14 },
  inputError: { borderColor: colors.coral },
  validation: { alignSelf: 'stretch', color: colors.coral, fontSize: 14, fontWeight: '700' },
  petFrame: { alignItems: 'center', justifyContent: 'center' },
  petHead: { alignItems: 'center', backgroundColor: '#F1B86B', borderColor: colors.ink, borderRadius: 42, borderWidth: 3, height: '72%', justifyContent: 'center', overflow: 'hidden', width: '76%' },
  petHeadPointy: { borderRadius: 24 },
  ear: { backgroundColor: '#F1B86B', borderColor: colors.ink, borderRadius: 14, borderWidth: 3, height: '34%', position: 'absolute', top: '3%', width: '30%' },
  earLeft: { left: '10%', transform: [{ rotate: '-15deg' }] },
  earRight: { right: '10%', transform: [{ rotate: '15deg' }] },
  earPointy: { borderRadius: 4, transform: [{ rotate: '0deg' }] },
  earFloppyLeft: { left: '2%', top: '26%', transform: [{ rotate: '35deg' }] },
  earFloppyRight: { right: '2%', top: '26%', transform: [{ rotate: '-35deg' }] },
  petFace: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 16 },
  spot: { backgroundColor: '#9A5D4A', borderRadius: 12, height: 16, position: 'absolute', width: 16 },
  spotOne: { left: 10, top: 16 },
  spotTwo: { right: 8, top: 26 },
  stripes: { flexDirection: 'row', gap: 5, position: 'absolute', top: 5 },
  stripe: { backgroundColor: '#9A5D4A', borderRadius: 3, height: 19, transform: [{ rotate: '10deg' }], width: 5 },
  homeHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 },
  petNameButton: { flexShrink: 1, justifyContent: 'center', minHeight: 48, maxWidth: '48%', paddingRight: 4 },
  homeName: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  headerActions: { flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  textButton: { flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 6 },
  textButtonLabel: { color: colors.teal, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  dayLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: -8 },
  moneyRow: { flexDirection: 'row', gap: 8 },
  metric: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 54, paddingHorizontal: 11, paddingVertical: 6 },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  metricValue: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  summaryCard: { backgroundColor: '#FFF8E4', borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  summaryValue: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  variantButton: { backgroundColor: '#F7FBFC', borderColor: '#C7DEE5', borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 48, padding: 10 },
  variantTitle: { color: '#146B78', fontSize: 15, fontWeight: '800' },
  lessonCard: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 56, paddingHorizontal: 12 },
  notice: { color: colors.coral, fontSize: 13, fontWeight: '700' },
  reviewConflict: { backgroundColor: '#FFF1EF', borderColor: colors.coral, borderRadius: 12, borderWidth: 1, color: '#7A3028', fontSize: 14, fontWeight: '800', lineHeight: 19, padding: 10 },
  nav: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: 14, borderWidth: 1, flexDirection: 'row', minHeight: 56 },
  navLargeText: { flexWrap: 'wrap' },
  navItem: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 56, paddingHorizontal: 4 },
  navItemLargeText: { flexBasis: '24%', flexGrow: 1 },
  navItemDisabled: { opacity: 0.35 },
  navLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  navLabelActive: { color: colors.teal, fontWeight: '900' },
  adultButton: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  adultLabel: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  helpOverlay: { flex: 1 },
});
