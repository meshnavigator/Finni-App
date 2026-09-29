import DetailBack from './DetailBack.tsx';
import { palette, screenStyles as ui } from './screen-theme.ts';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView as RootSafeAreaView } from 'react-native-safe-area-context';
import { RootNavigation, RootMenu, MoreScreen } from './RootNavigation.tsx';
import { isRootRoute, usesLargeNavigation, type RootRoute } from './root-navigation.ts';
import { AdultAccessSession } from '../application/adult-access.ts';
import type { AppRuntime, AppSnapshot } from '../application/app-runtime.ts';
import { ProductionAppController } from '../application/production-app-controller.ts';
import { ReceiptPresentationController, type PresentationEvent } from '../application/receipt-presentation.ts';
import {
  errorScreenModel,
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
import type { CommandReceipt, Mode } from '../domain/contracts.ts';
import type { HintLevel, LessonAttempt, LessonEvaluation } from '../domain/lesson.ts';
import { LOCAL_DEMO_LESSONS, HOME_LESSON_ORDER, type LocalLessonPresentation, type LessonVariantPresentation } from '../content/local-lesson-catalog.ts';
import AdultScreen from './AdultScreen.tsx';
import BudgetPlanScreen from './BudgetPlanScreen.tsx';
import HelpScreen from './HelpScreen.tsx';
import HistoryScreen from './HistoryScreen.tsx';
import PeriodResultScreen from './PeriodResultScreen.tsx';
import SavingsScreen from './SavingsScreen.tsx';
import ShopScreen from './ShopScreen.tsx';
import { type HomeReaction } from './FinniHomeScene.tsx';
import HomeScreen from './HomeScreen.tsx';
import { recommendHomeLesson } from '../application/home-lesson.ts';
import { FINNI_APPEARANCE_ASSETS } from './finni-appearance-assets.ts';
import { renderedFinniAppearance } from './finni-appearance-policy.ts';
import LessonShell from './LessonShell.tsx';
import { LessonRendererRegistry } from './lesson-renderer-registry.ts';
import { AllocationRenderer, BasketRenderer } from './budget-purchase-renderers.tsx';
import { ReceiptAuditRenderer, ResourceChoiceRenderer } from './receipt-workshop-renderers.tsx';
import SavingsLessonRenderer from './SavingsLessonRenderer.tsx';
import { lessonReturnLabel, lessonReturnScreen, nextLessonVariant } from './lesson-return.ts';
import type { LessonDiscovery } from '../persistence/lesson-repository.ts';
import type { PresentationPreferences } from '../persistence/app-control-sqlite.ts';

type Screen = 'intro' | 'pet' | 'more' | 'home' | 'plan' | 'shop' | 'savings' | 'history' | 'result' | 'adult' | 'section' | 'lesson-catalog' | 'lesson';
type Phase = 'loading' | 'ready' | 'error';

const EMPTY_SNAPSHOT: AppSnapshot = Object.freeze({
  profile: null,
  lifecycle: null,
  budget: null,
  commerce: null,
});

function homeReaction(event: PresentationEvent | null): HomeReaction | null {
  return event ? { id: event.id, expression: event.expression, clip: event.clip, objectId: event.objectId,
    value: event.after.savings - event.before.savings, skippable: event.skippable } : null;
}

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
  const renderedAppearance = renderedFinniAppearance(props);
  const [failedAppearance, setFailedAppearance] = useState<string | null>(null);
  if (renderedAppearance && failedAppearance !== renderedAppearance) {
    return (
      <View
        accessible
        accessibilityLabel={`${props.name}: ${PET_SHAPES.find((item) => item.id === props.shapeId)?.label}, ${PET_PATTERNS.find((item) => item.id === props.patternId)?.label}`}
        style={{ height: size, width: size }}
        testID={`pet-preview-${renderedAppearance.replace('/', '-')}`}
      >
        <Image
          accessibilityIgnoresInvertColors
          onError={() => setFailedAppearance(renderedAppearance)}
          resizeMode="contain"
          source={FINNI_APPEARANCE_ASSETS[renderedAppearance].preview}
          style={{ height: size, width: size }}
        />
      </View>
    );
  }
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
    <RootSafeAreaView style={styles.page}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Загрузка приложения">
      <PetAvatar name="Финни" shapeId="round" patternId="plain" size={104} />
      <Text accessibilityRole="header" style={styles.title}>{loadingScreenModel.title}</Text>
      <Text style={styles.body}>{loadingScreenModel.message}</Text>
    </ScrollView></RootSafeAreaView>
  );
}

function ErrorScreen(props: Readonly<{ message?: string; onRetry: () => void; onAdult?: () => void }>) {
  const model = errorScreenModel(props.message);
  return (
    <RootSafeAreaView style={styles.page}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Ошибка загрузки">
      <Text style={styles.errorIcon}>!</Text>
      <Text accessibilityRole="header" style={styles.title}>{model.title}</Text>
      <Text style={styles.body}>{model.message}</Text>
      <ActionButton label={model.action} onPress={props.onRetry} />
      {props.onAdult && <ActionButton label="Удалить повреждённые данные" onPress={props.onAdult} secondary />}
    </ScrollView></RootSafeAreaView>
  );
}

function IntroScreen(props: Readonly<{
  repeat?: boolean;
  onContinue: () => void;
  onClose?: () => void;
  onAdult?: () => void;
}>) {
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.introContent}>
        <PetAvatar name="Финни" shapeId="round" patternId="spots" size={96} />
        <Text style={styles.eyebrow}>ПИТОМЕЦ ФИННИ</Text>
        <Text accessibilityRole="header" style={styles.title}>{onboardingScreenModel.title}</Text>
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
    </View>
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
      <RootSafeAreaView accessibilityViewIsModal style={styles.helpOverlay} testID="home-help-overlay">
        <HelpScreen onBack={props.onClose} />
      </RootSafeAreaView>
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
        {props.selected ? '✓ ' : ''}{props.label}
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
  const name = props.initial?.name ?? 'Финни';
  const nameInput = useRef<TextInput>(null);
  const [nameDraft, setNameDraft] = useState(name);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [shapeId, setShapeId] = useState<PetShapeId>(props.initial?.shapeId ?? 'round');
  const [patternId, setPatternId] = useState<PetPatternId>(props.initial?.patternId ?? 'plain');
  const validation = petNameError(name);
  const draftValidation = petNameError(nameDraft);
  const { fontScale } = useWindowDimensions();
  const largeChoices = usesLargeNavigation(fontScale);
  const closeNameDialog = () => {
    if (!props.busy) setNameDialogOpen(false);
  };
  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.builderContent}
        >
          <DetailBack onPress={props.onCancel} label={props.initial ? "Назад" : "К знакомству"} disabled={props.busy} />
          <Text style={styles.eyebrow}>{props.initial ? 'О ПИТОМЦЕ' : 'НОВЫЙ ДРУГ'}</Text>
          <Text accessibilityRole="header" style={styles.title}>{props.initial ? 'Имя и внешность' : 'Как выглядит Финни?'}</Text>
          <View style={styles.builderPreview}><PetAvatar name={name || 'Питомец'} shapeId={shapeId} patternId={patternId} size={136} /></View>
          <View style={styles.profileForm}>
          <Text style={styles.fieldLabel}>Форма</Text>
          <View accessibilityRole="radiogroup" style={[styles.choiceRow, largeChoices && styles.choiceColumn]}>
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
          <View accessibilityRole="radiogroup" style={[styles.choiceRow, largeChoices && styles.choiceColumn]}>
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
          <Pressable
            accessibilityLabel={`Игровое имя питомца: ${name}. Изменить`}
            accessibilityRole="button"
            disabled={props.busy}
            onPress={() => { setNameDraft(name); setNameDialogOpen(true); }}
            style={[styles.input, styles.nameField]}
          >
            <Text style={styles.nameFieldText}>{name}</Text>
            <Text style={styles.nameFieldAction}>Изменить</Text>
          </Pressable>
          {validation && <Text accessibilityLiveRegion="polite" style={styles.validation}>{validation}</Text>}
          {props.saveError && <Text accessibilityLiveRegion="polite" style={styles.validation}>{props.saveError}</Text>}
          </View>
          <ActionButton
            label={props.busy ? 'Сохраняем…' : 'Готово'}
            disabled={props.busy || Boolean(validation)}
            onPress={() => props.onSave(petAppearance({ name, shapeId, patternId }))}
          />
          <ActionButton label="Отмена" onPress={props.onCancel} secondary />
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        accessibilityViewIsModal
        animationType="fade"
        onRequestClose={closeNameDialog}
        onShow={() => nameInput.current?.focus()}
        transparent
        visible={nameDialogOpen}
      >
        <RootSafeAreaView style={styles.nameDialogBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.nameDialogContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.nameDialogCard} testID="pet-name-dialog">
                <Text accessibilityRole="header" style={styles.title}>Имя питомца</Text>
                <Text style={styles.fieldLabel}>Новое имя</Text>
                <TextInput
                  accessibilityLabel="Новое имя питомца"
                  autoCapitalize="sentences"
                  maxLength={32}
                  onChangeText={setNameDraft}
                  placeholder="Финни"
                  ref={nameInput}
                  selectTextOnFocus
                  style={[styles.input, draftValidation && styles.inputError]}
                  value={nameDraft}
                />
                {draftValidation && <Text accessibilityLiveRegion="polite" style={styles.validation}>{draftValidation}</Text>}
                {props.saveError && <Text accessibilityLiveRegion="polite" style={styles.validation}>{props.saveError}</Text>}
                <ActionButton
                  label={props.busy ? 'Сохраняем…' : 'Сохранить'}
                  disabled={props.busy || Boolean(draftValidation)}
                  onPress={() => props.onSave(petAppearance({ name: nameDraft, shapeId, patternId }))}
                />
                <ActionButton label="Отмена" disabled={props.busy} onPress={closeNameDialog} secondary />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </RootSafeAreaView>
      </Modal>
    </View>
  );
}

function SectionScreen(props: Readonly<{ title: string; onBack: () => void }>) {
  return (
    <View style={styles.centered}>
      <Text style={styles.eyebrow}>РАЗДЕЛ</Text>
      <Text accessibilityRole="header" style={styles.title}>{props.title}</Text>
      <Text style={styles.body}>Основа навигации готова. Действия откроются, когда выполнены денежные предусловия.</Text>
      <ActionButton label="Вернуться в домик" onPress={props.onBack} />
    </View>
  );
}

function LessonCatalogScreen(props: Readonly<{
  lessons: readonly LocalLessonPresentation[];
  busy: boolean;
  message: string | null;
  onSelect: (lesson: LessonVariantPresentation) => void;
  onBack: () => void;
  backLabel: string;
}>) {
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (props.message) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [props.message]);
  return (
    <View style={styles.page} accessibilityLabel="Каталог учебных занятий">
      <ScrollView ref={scroll} contentContainerStyle={styles.catalogContent}>
        <DetailBack onPress={props.onBack} label={props.backLabel} />
        {props.message && <Text accessibilityLiveRegion="polite" style={ui.error}>{props.message}</Text>}
        <Text style={styles.eyebrow}>УЧЕБНЫЕ ЗАНЯТИЯ</Text>
        <Text accessibilityRole="header" style={styles.title}>Выбери пример</Text>
        <Text style={ui.body}>Это задания для тренировки: покупки и переводы из копилки здесь не выполняются.</Text>
        {props.lessons.map((lesson) => (
          <View key={lesson.definition.lessonId} style={styles.lessonCard}>
            <Text accessibilityRole="header" style={styles.catalogTitle}>{lesson.title}</Text>
            {lesson.variants.map((variant, index) => (
              <Pressable
                key={variant.definition.variantId}
                accessibilityRole="button"
                accessibilityState={{ disabled: props.busy }}
                disabled={props.busy}
                accessibilityLabel={`${lesson.title}. Ситуация ${index + 1}. ${variant.intro}`}
                onPress={() => props.onSelect(variant)}
                style={({ pressed }) => [styles.variantButton, pressed && ui.pressed]}
              >
                <View style={styles.variantHeading}><Text style={styles.variantTitle}>Ситуация {index + 1}</Text><Text accessible={false} style={styles.variantArrow}>›</Text></View>
                <Text style={styles.caption}>{variant.intro}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <ActionButton label={props.backLabel} onPress={props.onBack} secondary />
      </ScrollView>
    </View>
  );
}

export default function AppRoot() {
  const controller = useRef<ProductionAppController | null>(null);
  const presentation = useRef(new ReceiptPresentationController());
  const commandBusy = useRef(false);
  const adultAccess = useRef(new AdultAccessSession());
  const returnScreen = useRef<Screen>('home');
  const [detailOrigin, setDetailOrigin] = useState<RootRoute>('home');
  const { fontScale } = useWindowDimensions();
  const largeNavigation = usesLargeNavigation(fontScale);
  const [rootMenuOpen, setRootMenuOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [screen, setScreen] = useState<Screen>('intro');
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [reaction, setReaction] = useState<HomeReaction | null>(null);
  const clearReaction = useCallback((id: number) => {
    const next = homeReaction(presentation.current.complete(id));
    setReaction((current) => current?.id === id ? next : current);
  }, []);
  const cancelReaction = useCallback((id: number) => {
    presentation.current.cancelActive(id);
    setReaction((current) => current?.id === id ? null : current);
  }, []);
  const [mode, setMode] = useState<Mode>('normal');
  const [presentationPreferences, setPresentationPreferences] = useState<PresentationPreferences>({ motionEnabled: true, soundEnabled: true });
  const [adultUnlocked, setAdultUnlocked] = useState(false);
  const [adultRecoveryAvailable, setAdultRecoveryAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [lessonAttempt, setLessonAttempt] = useState<LessonAttempt | null>(null);
  const [lessonEvaluation, setLessonEvaluation] = useState<LessonEvaluation | null>(null);
  const lessonSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const lessonEditVersion = useRef(0);
  const lessonSaveFailed = useRef(false);
  const [lessonPresentation, setLessonPresentation] = useState<LessonVariantPresentation | null>(null);
  const [revealedEvidenceIds, setRevealedEvidenceIds] = useState<readonly string[]>([]);
  const [lessonRewardReason, setLessonRewardReason] = useState<null | 'GRANTED' | 'TRAINING' | 'PERIOD_NOT_ACTIVE' | 'ALREADY_GRANTED'>(null);
  const [lessonRewardEvent, setLessonRewardEvent] = useState<PresentationEvent | null>(null);
  const [lessonDiscoveries, setLessonDiscoveries] = useState<readonly LessonDiscovery[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [boot, setBoot] = useState(0);
  const root = isRootRoute(screen);
  const previousScreen = useRef<Screen>(screen);
  useEffect(() => {
    if (previousScreen.current !== screen) {
      if (screen === 'home') setReaction(homeReaction(presentation.current.next()));
      else {
        presentation.current.cancel();
        setReaction(null);
      }
      previousScreen.current = screen;
    }
  }, [screen]);
  const navigateRoot = (route: RootRoute) => {
    if (busy) return;
    setRootMenuOpen(false);
    setMessage(null);
    setScreen(route);
  };
  const editPet = (origin: RootRoute) => { setDetailOrigin(origin); setMessage(null); setScreen('pet'); };
  const openCatalog = (origin: RootRoute) => { setDetailOrigin(origin); setMessage(null); setScreen('lesson-catalog'); };

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
      presentation.current = new ReceiptPresentationController();
      setReaction(null);
      try {
        await controller.current?.close();
        controller.current = null;
        setAdultRecoveryAvailable(false);
        const initialized = await ProductionAppController.initialize(async () => {
          adultAccess.current.lock();
          if (!cancelled) {
            setAdultUnlocked(false);
            setHelpOpen(false);
            setRootMenuOpen(false);
            setSnapshot(null);
            setScreen('intro');
          }
        });
        if (cancelled) {
          await initialized.controller.close();
          return;
        }
        controller.current = initialized.controller;
        presentation.current.bind(initialized.controller.session());
        setReaction(null);
        setPresentationPreferences(await initialized.controller.presentationPreferences());
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

  const updatePresentationPreference = async (kind: 'motion' | 'sound', enabled: boolean) => {
    if (!controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      if (kind === 'motion') await controller.current.setMotionEnabled(enabled);
      else await controller.current.setSoundEnabled(enabled);
      setPresentationPreferences((previous) => ({
        ...previous,
        [kind === 'motion' ? 'motionEnabled' : 'soundEnabled']: enabled,
      }));
    } catch {
      setMessage('Настройка не сохранилась. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const savePet = async (appearance: PetAppearance) => {
    if (!controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      const loaded = snapshot?.profile
        ? await controller.current.runSnapshot((runtime) => runtime.updatePet(snapshot.profile!, appearance))
        : await controller.current.runSnapshot((runtime) => runtime.createProfile(appearance));
      setSnapshot(loaded);
      presentation.current.bind(controller.current.session());
      presentation.current.cancel();
      setReaction(null);
      setScreen(snapshot?.profile ? detailOrigin : 'home');
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
    await updateCommerce(
      (runtime, current) => runtime.confirmPlanReceipt(current, values, acknowledgedLowNeed),
      'План не сохранился. Проверь суммы и попробуй ещё раз.',
    );
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
    action: (runtime: AppRuntime, current: AppSnapshot) => Promise<CommandReceipt>,
    errorMessage: string,
  ): Promise<boolean> => {
    if (!controller.current || !snapshot || commandBusy.current) return false;
    commandBusy.current = true;
    const currentController = controller.current;
    const captured = currentController.session();
    let committed = false;
    setBusy(true);
    setMessage(null);
    try {
      const receipt = await currentController.submit((runtime) => action(runtime, snapshot));
      if (!receipt.result.ok) throw new Error('Command rejected');
      committed = true;
      const loaded = await currentController.load();
      setSnapshot(loaded);
      presentation.current.accept(receipt, captured, loaded.lifecycle?.revision ?? -1);
      if (screen === 'home') setReaction(homeReaction(presentation.current.next()));
      return true;
    } catch {
      setMessage(committed ? 'Действие сохранено. Не удалось обновить экран — открой приложение снова.' : errorMessage);
      return false;
    } finally {
      commandBusy.current = false;
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
    setScreen(snapshot?.profile ? returnScreen.current : 'intro');
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
      presentation.current.bind(controller.current.session());
      setMode(target);
      setSnapshot(loaded);
      setReaction(null);
      lockAdult();
      setScreen(loaded.profile ? 'home' : 'intro');
    } catch {
      setMessage('Режим не переключился. Данные не смешаны; попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const advanceDemoDay = async () => {
    if (!controller.current || !snapshot || mode !== 'demo' || busy || commandBusy.current) return;
    if (!adultAccess.current.recordActivity(Date.now())) {
      setAdultUnlocked(false);
      return;
    }
    commandBusy.current = true;
    setBusy(true);
    setMessage(null);
    try {
      setSnapshot(await controller.current.runSnapshot((runtime) => runtime.advanceDemoDay(snapshot)));
      setMessage('Демо-дата переведена. Откройте следующий день в Домике.');
    } catch {
      setMessage('Демо-дата не изменилась. Закройте текущий день и попробуйте ещё раз.');
    } finally {
      commandBusy.current = false;
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
      presentation.current.bind(controller.current.session());
      setSnapshot(loaded);
      setReaction(null);
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
      lessonSaveQueue.current = Promise.resolve();
      lessonEditVersion.current += 1;
      lessonSaveFailed.current = false;
      setLessonEvaluation(null);
      setLessonPresentation(presentation);
      setRevealedEvidenceIds([]);
      setLessonRewardReason(null);
      setLessonRewardEvent(null);
      setScreen('lesson');
    } catch {
      setMessage('Занятие не открылось. Монеты твоего дня не изменились.');
    } finally {
      setBusy(false);
    }
  };

  const saveLessonDraft = (solution: Readonly<Record<string, unknown>>) => {
    if (!lessonAttempt || !controller.current) return;
    const attemptId = lessonAttempt.attemptId;
    const currentController = controller.current;
    const version = ++lessonEditVersion.current;
    lessonSaveFailed.current = false;
    setLessonAttempt((current) => current?.attemptId === attemptId
      ? { ...current, solution, phase: 'draft' } : current);
    setLessonEvaluation(null);
    lessonSaveQueue.current = lessonSaveQueue.current.then(async () => {
      const saved = await currentController.submit((runtime) => runtime.saveLesson(attemptId, solution));
      if (version === lessonEditVersion.current) {
        setLessonAttempt((current) => current?.attemptId === attemptId ? saved : current);
        setMessage(null);
      }
    }).catch(() => {
      if (version === lessonEditVersion.current) {
        lessonSaveFailed.current = true;
        setMessage('Ответ не сохранился. Попробуй ввести его ещё раз.');
      }
    });
  };

  const withLesson = async (work: (runtime: AppRuntime, attempt: LessonAttempt) => Promise<LessonAttempt | Readonly<{ attempt: LessonAttempt; evaluation?: LessonEvaluation }>>) => {
    if (!lessonAttempt || !controller.current) return;
    setBusy(true);
    setMessage(null);
    try {
      await lessonSaveQueue.current;
      if (lessonSaveFailed.current) throw new Error('Lesson draft was not saved');
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
    if (!snapshot || !lessonAttempt || !lessonEvaluation || !controller.current || commandBusy.current) return;
    commandBusy.current = true;
    const currentController = controller.current;
    const captured = currentController.session();
    let committed = false;
    setBusy(true);
    setMessage(null);
    try {
      const receipt = await currentController.submit((runtime) => runtime.completeLesson(snapshot, lessonAttempt.attemptId, lessonEvaluation.evaluationId));
      if (!receipt.result.ok) throw new Error('Lesson completion failed');
      committed = true;
      setLessonRewardReason(receipt.result.data.reward.reason);
      setLessonAttempt((current) => current ? { ...current, phase: 'completed' } : current);
      try {
        const loaded = await currentController.load();
        setSnapshot(loaded);
        if (presentation.current.accept(receipt, captured, loaded.lifecycle?.revision ?? -1)) {
          setLessonRewardEvent(presentation.current.next());
        }
      } catch {
        setMessage('Занятие сохранено. Не удалось обновить день — открой приложение снова.');
      }
    } catch {
      if (!committed) setMessage('Завершение не сохранилось. Попробуй ещё раз.');
    } finally {
      commandBusy.current = false;
      setBusy(false);
    }
  };

  const lessonTarget = lessonAttempt?.phase === 'completed'
    ? lessonReturnScreen(lessonAttempt.lessonId, snapshot?.lifecycle?.state)
    : null;
  const leaveLesson = () => {
    if (busy) return;
    if (lessonRewardEvent) presentation.current.cancelActive(lessonRewardEvent.id);
    setLessonRewardEvent(null);
    setMessage(null);
    if (!lessonTarget) {
      setScreen('lesson-catalog');
    } else if (lessonTarget === 'history') {
      void openHistory('home');
    } else {
      setScreen(lessonTarget);
    }
  };

  useEffect(() => {
    if (screen !== 'home' || !controller.current) return;
    let current = true;
    void controller.current.load().then((loaded) => { if (current) setSnapshot(loaded); }).catch(() => { if (current) setMessage('Не удалось обновить домик. Подтверждённые данные сохранены.'); });
    return () => { current = false; };
  }, [screen, mode]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy) return true;
      if (screen === 'home' || screen === 'intro') return false;
      if (rootMenuOpen) { setRootMenuOpen(false); return true; }
      if (screen === 'adult') { adultAccess.current.lock(); setAdultUnlocked(false); }
      setMessage(null);
      if (screen === 'lesson') { leaveLesson(); return true; }
      const back = screen === 'history' || screen === 'adult' ? returnScreen.current
        : screen === 'pet' || screen === 'lesson-catalog' ? detailOrigin : 'home';
      setScreen(snapshot?.profile ? back : 'intro');
      return true;
    });
    return () => subscription.remove();
  });

  if (phase === 'loading') return <LoadingScreen />;
  if (phase === 'error') return (
    <ErrorScreen
      onAdult={adultRecoveryAvailable ? () => { setPhase('ready'); openAdult(); } : undefined}
      onRetry={() => setBoot((value) => value + 1)}
    />
  );

  return (
    <RootSafeAreaView style={{ flex: 1, backgroundColor: '#F6F0E6' }} edges={['top', 'right', 'bottom', 'left']}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }} accessibilityElementsHidden={rootMenuOpen || helpOpen || (screen === 'home' && Boolean(message))}
        importantForAccessibility={rootMenuOpen || helpOpen || (screen === 'home' && message) ? 'no-hide-descendants' : 'auto'}
        pointerEvents={rootMenuOpen || helpOpen || (screen === 'home' && message) ? 'none' : 'auto'}>
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
          onCancel={() => setScreen(snapshot?.profile ? detailOrigin : 'intro')}
          onSave={(appearance) => void savePet(appearance)}
        />
      )}
      {screen === 'home' && snapshot?.profile && snapshot.lifecycle && (
        <HomeScreen
          key={`${mode}-${snapshot.profile.id}`}
          snapshot={snapshot}
          demo={mode === 'demo'}
          lessonTitle={recommendHomeLesson(mode, snapshot.lifecycle.periodIndex, snapshot.homeLessons ?? [], LOCAL_DEMO_LESSONS, HOME_LESSON_ORDER)?.title ?? null}
          onDismissNotice={() => setMessage(null)}
          busy={busy}
          notice={message}
          scenePaused={helpOpen || rootMenuOpen}
          motionEnabled={presentationPreferences.motionEnabled}
          soundEnabled={presentationPreferences.soundEnabled}
          reaction={reaction}
          onReactionFinished={clearReaction}
          onReactionCancelled={cancelReaction}
          onEditPet={() => editPet('home')}
          onMenu={() => setRootMenuOpen(true)}
          onLesson={() => {
            setDetailOrigin('home');
            const lesson = recommendHomeLesson(mode, snapshot.lifecycle!.periodIndex, snapshot.homeLessons ?? [], LOCAL_DEMO_LESSONS, HOME_LESSON_ORDER);
            if (lesson) void openLesson(lesson);
            else openCatalog('home');
          }}
          onOpenDay={() => void openDay()}
          onResults={() => { setMessage(null); setScreen('result'); }}
          onSection={openSection}
        />
      )}
      {screen === 'lesson-catalog' && (
        <LessonCatalogScreen
          lessons={LOCAL_DEMO_LESSONS}
          busy={busy}
          message={message}
          backLabel={detailOrigin === 'more' ? 'Вернуться в «Ещё»' : 'Вернуться в домик'}
          onBack={() => setScreen(detailOrigin)}
          onSelect={(lesson) => void openLesson(lesson)}
        />
      )}
      {screen === 'plan' && snapshot?.profile && snapshot.lifecycle && (
        <BudgetPlanScreen
          snapshot={snapshot}
          busy={busy}
          message={message}
          onAllocate={(values) => void allocateIncome(values)}
          onConfirm={(values, acknowledged) =>
            void confirmBudgetPlan(values, acknowledged)}
        />
      )}
      {screen === 'shop' && snapshot && (
        <ShopScreen
          snapshot={snapshot}
          busy={busy}
          onPreview={(itemId) => controller.current!.submit((runtime) => runtime.previewPurchase(snapshot, itemId))}
          onPurchase={async (itemId, acknowledged) => {
            const purchased = await updateCommerce(
              (runtime, current) => runtime.purchaseReceipt(current, itemId, acknowledged),
              'Покупка не выполнена. Деньги не изменились.',
            );
            if (purchased) {
              setReaction(homeReaction(presentation.current.next()));
              setScreen('home');
            }
            return purchased;
          }}
          onPlan={() => setScreen('plan')}
          onHome={() => setScreen('home')}
        />
      )}
      {screen === 'savings' && snapshot && (
        <SavingsScreen
          snapshot={snapshot}
          busy={busy}
          message={message}
          onClaim={(goalId) => void updateCommerce(
            (runtime, current) => runtime.claimGoalReceipt(current, goalId),
            'Цель не получена. Монеты не изменились.',
          )}
          onHistory={() => void openHistory('savings')}
          onPreview={(kind, value) => controller.current!.submit((runtime) => runtime.previewSavings(snapshot, kind, value))}
          onSelectGoal={(goalId) => void updateCommerce(
            (runtime, current) => runtime.selectGoalReceipt(current, goalId),
            'Цель не изменилась. Попробуй ещё раз.',
          )}
          onTransfer={(kind, value) => void updateCommerce(
            (runtime, current) => kind === 'deposit'
              ? runtime.depositSavingsReceipt(current, value)
              : runtime.withdrawSavingsReceipt(current, value),
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
            (runtime, current) => runtime.closePeriodReceipt(current),
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
          presentationPreferences={presentationPreferences}
          onMotionEnabledChange={(enabled) => void updatePresentationPreference('motion', enabled)}
          onSoundEnabledChange={(enabled) => void updatePresentationPreference('sound', enabled)}
          onUnlock={() => { adultAccess.current.unlock(Date.now()); setAdultUnlocked(true); }}
          onActivity={() => {
            if (!adultAccess.current.recordActivity(Date.now())) {
              setAdultUnlocked(false);
            }
          }}
          onExit={leaveAdult}
          onSwitchMode={(target) => void switchMode(target)}
          onNextDemoDay={() => void advanceDemoDay()}
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
          rewardEvent={lessonRewardEvent}
          message={message}
          onSolutionChange={saveLessonDraft}
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
      {screen === 'more' && snapshot?.profile && snapshot.lifecycle && <MoreScreen
        name={snapshot.profile.name} day={homeScreenModel(snapshot.profile, snapshot.lifecycle).dayLabel} demo={mode === 'demo'} busy={busy} notice={message}
        onLessons={() => openCatalog('more')} onProgress={() => void openHistory('more')} onPet={() => editPet('more')}
        onHelp={() => setHelpOpen(true)} onAdult={openAdult} />}
      {root && !largeNavigation && <RootNavigation selected={screen} disabled={busy} onNavigate={navigateRoot} />}
      {root && largeNavigation && screen !== 'home' && <Pressable accessibilityRole="button" accessibilityLabel="Меню"
        onPress={() => setRootMenuOpen(true)} style={styles.rootMenuButton} testID="root-menu-button"><Text style={styles.rootMenuText}>Меню</Text></Pressable>}
      </View>
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {root && <RootMenu visible={rootMenuOpen} selected={screen} onClose={() => setRootMenuOpen(false)} onNavigate={navigateRoot} />}
    </RootSafeAreaView>
  );
}

const colors = {
  ink: palette.ink, muted: palette.muted, sky: palette.background,
  teal: palette.accent, pale: palette.surface, line: palette.line,
  coral: palette.error, yellow: palette.soft,
};

const styles = StyleSheet.create({
  rootMenuButton: { minHeight: 56, margin: 10, padding: 10, borderRadius: 18, backgroundColor: '#FFFCF6', alignItems: 'center', justifyContent: 'center' },
  rootMenuText: { color: '#3D352D', fontSize: 16, lineHeight: 22 },
  flex: { flex: 1 },
  page: { flex: 1, backgroundColor: colors.sky },
  homePage: { paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0 },
  centered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: colors.sky },
  introContent: { alignItems: 'center', gap: 16, padding: 20, paddingBottom: 28 },
  catalogContent: ui.content,
  catalogTitle: ui.cardTitle,
  variantHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  variantArrow: { color: palette.muted, fontSize: 26 },
  builderPreview: { alignSelf: 'center', padding: 12, borderRadius: 28, backgroundColor: palette.soft },
  profileForm: { ...ui.card, gap: 12 },
  nameField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  nameFieldText: { color: colors.ink, fontSize: 16, flexShrink: 1 },
  nameFieldAction: { color: colors.teal, fontSize: 15, fontWeight: '600', marginLeft: 12 },
  nameDialogBackdrop: { flex: 1, backgroundColor: 'rgba(35, 31, 28, 0.48)' },
  nameDialogContent: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  nameDialogCard: { ...ui.card, alignSelf: 'center', gap: 12, maxWidth: 440, width: '100%' },
  choiceColumn: { flexDirection: 'column' },
  builderContent: { gap: 14, padding: 18, paddingBottom: 28 },
  homeContent: { gap: 8, minHeight: '100%', paddingHorizontal: 14, paddingBottom: 8 },
  homeContentLargeText: { paddingBottom: 24 },
  eyebrow: { ...ui.eyebrow },
  title: { ...ui.title },
  body: { ...ui.body },
  caption: { ...ui.body },
  roomFrame: { position: 'relative', width: '100%' },
  roomStatus: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 5 },
  cardTitle: { ...ui.cardTitle },
  action: { ...ui.button, alignSelf: 'stretch' },
  actionSecondary: { ...ui.secondary },
  actionDisabled: { opacity: 0.45 },
  actionText: { ...ui.buttonText },
  actionSecondaryText: { ...ui.secondaryText },
  pressed: { ...ui.pressed },
  errorIcon: { backgroundColor: colors.coral, borderRadius: 30, color: '#FFFFFF', fontSize: 28, fontWeight: '900', lineHeight: 56, overflow: 'hidden', textAlign: 'center', width: 56 },
  directionList: { alignSelf: 'stretch', gap: 8, marginVertical: 4 },
  directionCard: { ...ui.card, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  directionNumber: { backgroundColor: colors.yellow, borderRadius: 18, color: colors.ink, fontSize: 16, fontWeight: '600', textAlign: 'center', minWidth: 36, padding: 6 },
  expertLink: { color: colors.muted, fontSize: 16, textDecorationLine: 'underline', textAlign: 'center' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  choice: { ...ui.button, ...ui.secondary, flexGrow: 1, paddingHorizontal: 12, borderRadius: 14 },
  choiceSelected: { ...ui.selected },
  choiceText: { ...ui.buttonText, color: colors.ink },
  choiceTextSelected: { color: colors.ink },
  fieldLabel: { color: colors.ink, fontSize: 16, fontWeight: '600', marginTop: 4 },
  input: { ...ui.input },
  inputError: { borderColor: colors.coral },
  validation: { ...ui.error },
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
  variantButton: { backgroundColor: colors.sky, borderRadius: 14, justifyContent: 'center', minHeight: 56, gap: 6, padding: 12 },
  variantTitle: { color: colors.teal, fontSize: 16, fontWeight: '600', flex: 1 },
  lessonCard: { ...ui.card },
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
  helpOverlay: { flex: 1, backgroundColor: palette.background },
});
