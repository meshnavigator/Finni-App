import { useEffect, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  type AppStateStatus,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FINNI_ANCHORS, FINNI_CANVAS, FINNI_STAGE_SCALE, type FinniExpression, type FinniStage } from './finni-layer-contract.ts';

import { homePetFrame, homePetPortraitFrame, type SceneRect } from './home-scene-layout.ts';
import { FINNI_APPEARANCE_ASSETS } from './finni-appearance-assets.ts';
import { homeFinniAppearance, type FinniAppearance } from './finni-appearance-policy.ts';
import { FINNI_EXPRESSION_ASSETS } from './finni-expression-assets.ts';
import { FINNI_ANIMATION_SET, finniAnimationFrame, initialFinniAnimationState, reduceFinniAnimation, type FinniClipId } from './finni-animation-set.ts';
import { goalSource, itemSource, OBJECT_SOURCES } from './room-assets.ts';

const ROOM_SOURCE = require('../../assets/2d/master/FINNI-2D-MASTER-V1/room_clean_v1.png');

const IDLE_DURATION_MS = FINNI_ANIMATION_SET['AN-001'].durationMs;
const BLINK_FRAME_MS = FINNI_ANIMATION_SET['AN-002'].durationMs;
const BLINK_CYCLE_FRAMES = 24;
export type HomeReaction = Readonly<{
  id: number;
  expression: Extract<FinniExpression, 'happy' | 'thoughtful' | 'inspired'>;
  clip: FinniClipId;
  objectId: string | null;
  value: number;
  skippable: boolean;
}>;

export default function FinniHomeScene(props: Readonly<{
  accessibilityLabel: string;
  careLabel: string;
  height: number;
  paused: boolean;
  motionEnabled: boolean;
  soundEnabled: boolean;
  stage: FinniStage;
  appearance: FinniAppearance;
  reaction?: HomeReaction | null;
  onReactionFinished?: (id: number) => void;
  onReactionCancelled?: (id: number) => void;
  showCaption?: boolean;
  fullscreen?: boolean;
  roomOpacity?: number;
  sceneStyle?: 'room' | 'quiet';
  portrait?: boolean;
  petRegion?: SceneRect;
  hideSkip?: boolean;
  skipReactionId?: number | null;
}>) {
  const { reaction, onReactionFinished, onReactionCancelled } = props;
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [blinkPhase, setBlinkPhase] = useState(0);
  const [decodeError, setDecodeError] = useState(false);
  const [loadedBlinkAppearance, setLoadedBlinkAppearance] = useState<string | null>(null);
  const [loadedExpression, setLoadedExpression] = useState<string | null>(null);
  const skippedReactionId = useRef<number | null>(null);
  const [animation, dispatch] = useReducer(reduceFinniAnimation, null, () => initialFinniAnimationState(
    { stage: props.stage, shapeId: props.appearance.shapeId, patternId: props.appearance.patternId, expression: 'neutral' },
    { motionEnabled: props.motionEnabled, soundEnabled: props.soundEnabled, systemReduceMotion: false },
  ));
  const [translateY] = useState(() => new Animated.Value(0));
  const [expressionOpacity] = useState(() => new Animated.Value(0));
  const [effectProgress] = useState(() => new Animated.Value(0));
  const motionActive = appState === 'active' && !props.paused && props.motionEnabled && !reduceMotion && !decodeError;
  const frame = finniAnimationFrame(animation);
  const animationActive = motionActive && frame.idle;
  const stageScale = FINNI_STAGE_SCALE[props.stage];
  const appearanceId = homeFinniAppearance(props.appearance);
  const sources = FINNI_APPEARANCE_ASSETS[appearanceId];
  const expressionKey = reaction && frame.expression !== 'neutral' ? `${appearanceId}/${frame.expression}/${reaction.id}` : null;
  const expressionReady = expressionKey === null || loadedExpression === expressionKey;
  const showBlink = motionActive && frame.blink && loadedBlinkAppearance === appearanceId
    && blinkPhase === BLINK_CYCLE_FRAMES - 1;
  const petFrame = props.petRegion ? props.portrait ? homePetPortraitFrame(props.petRegion) : homePetFrame(props.petRegion, props.stage) : {
    width: `${stageScale * 100}%` as const,
    height: `${stageScale * 100}%` as const,
    left: `${(1 - stageScale) * FINNI_ANCHORS.feet.x / FINNI_CANVAS.width * 100}%` as const,
    top: `${(1 - stageScale) * FINNI_ANCHORS.feet.y / FINNI_CANVAS.height * 100}%` as const,
  };

  const petMotion = props.portrait ? {} : props.petRegion ? { transformOrigin: [FINNI_ANCHORS.feet.x * (petFrame as ReturnType<typeof homePetFrame>).scale, FINNI_ANCHORS.feet.y * (petFrame as ReturnType<typeof homePetFrame>).scale, 0], transform: [{ scaleY: translateY.interpolate({ inputRange: [-4, 0], outputRange: [1.006, 1] }) }] } : {};

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const appStateSubscription = AppState.addEventListener('change', setAppState);
    const motionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      appStateSubscription.remove();
      motionSubscription.remove();
    };
  }, []);

  useEffect(() => {
    dispatch({ type: 'settings', settings: { motionEnabled: props.motionEnabled, soundEnabled: props.soundEnabled, systemReduceMotion: reduceMotion } });
  }, [props.motionEnabled, props.soundEnabled, reduceMotion]);

  useEffect(() => {
    dispatch({ type: 'visibility', visible: appState === 'active' && !decodeError });
  }, [appState, decodeError]);

  useEffect(() => {
    dispatch({ type: 'modal', open: props.paused });
  }, [props.paused]);

  useEffect(() => {
    const presentation = {
      stage: props.stage, shapeId: props.appearance.shapeId, patternId: props.appearance.patternId,
      expression: reaction?.expression ?? 'neutral' as const,
    };
    if (reaction) dispatch({ type: 'play', clip: reaction.clip, presentation });
    else dispatch({ type: 'presentation', presentation });
  }, [reaction, props.stage, props.appearance.shapeId, props.appearance.patternId]);

  useEffect(() => {
    if (!animationActive) {
      translateY.stopAnimation();
      translateY.setValue(0);
      return;
    }

    const idle = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          duration: IDLE_DURATION_MS / 2,
          toValue: -4,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: IDLE_DURATION_MS / 2,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const blinkTimer = setInterval(() => {
      setBlinkPhase((value) => (value + 1) % BLINK_CYCLE_FRAMES);
    }, BLINK_FRAME_MS);
    idle.start();

    return () => {
      idle.stop();
      clearInterval(blinkTimer);
      translateY.setValue(0);
    };
  }, [animationActive, translateY]);

  useEffect(() => {
    expressionOpacity.stopAnimation();
    if (!expressionReady) {
      expressionOpacity.setValue(0);
      return;
    }
    if (!motionActive || props.skipReactionId === reaction?.id) {
      expressionOpacity.setValue(1);
      return;
    }
    expressionOpacity.setValue(0);
    const transition = Animated.timing(expressionOpacity, { duration: reaction?.skippable ? 900 : 140, toValue: 1, useNativeDriver: true });
    transition.start();
    return () => transition.stop();
  }, [expressionOpacity, expressionKey, expressionReady, motionActive, reaction, props.skipReactionId]);

  useEffect(() => {
    effectProgress.stopAnimation();
    effectProgress.setValue(0);
    if (!frame.clip || !motionActive) return;
    const transition = Animated.timing(effectProgress, {
      duration: FINNI_ANIMATION_SET[frame.clip].durationMs,
      toValue: 1,
      useNativeDriver: true,
    });
    transition.start();
    return () => transition.stop();
  }, [effectProgress, frame.clip, animation.generation, motionActive]);

  useEffect(() => {
    if (!reaction) return;
    const id = reaction.id;
    if (props.paused || appState !== 'active' || decodeError) {
      onReactionCancelled?.(id);
      return;
    }
    if (!expressionReady) return;
    const generation = animation.generation;
    const timer = setTimeout(() => {
      dispatch({ type: 'finish', clip: reaction.clip, generation });
      onReactionFinished?.(id);
    }, motionActive ? FINNI_ANIMATION_SET[reaction.clip].durationMs : 900);
    return () => clearTimeout(timer);
  }, [appState, decodeError, expressionReady, onReactionCancelled, onReactionFinished, props.paused, reaction, motionActive, animation.generation]);

  useEffect(() => {
    if (!reaction || props.skipReactionId !== reaction.id || skippedReactionId.current === reaction.id) return;
    skippedReactionId.current = reaction.id;
    dispatch({ type: 'skip', clip: reaction.clip as 'AN-013' | 'AN-014', generation: animation.generation });
    onReactionFinished?.(reaction.id);
  }, [props.skipReactionId, reaction, animation.generation, onReactionFinished]);

  useEffect(() => {
    if (!reaction) return;
    const id = reaction.id;
    return () => onReactionCancelled?.(id);
  }, [onReactionCancelled, reaction]);

  if (decodeError) {
    return (
      <View
        accessible
        accessibilityLabel={`${props.accessibilityLabel}. Изображение недоступно, показан безопасный локальный вариант.`}
        style={[styles.fallback, props.petRegion ? { position: "absolute", left: props.petRegion.x, top: props.petRegion.y, width: props.petRegion.width, height: props.petRegion.height, padding: 2, justifyContent: "center" } : { height: props.height }]}
        testID="finni-home-scene-fallback"
      >
        <Text style={[styles.fallbackTitle, props.fullscreen && styles.fullscreenFallbackTitle]}>Финни рядом</Text>
        {!props.fullscreen && <Text style={styles.fallbackText}>{props.careLabel}</Text>}
      </View>
    );
  }

  return (
    <View
      accessible={false}
      style={[styles.scene, props.fullscreen && { borderRadius: 0, backgroundColor: props.sceneStyle === 'quiet' ? 'transparent' : '#F8F1E8' }, { height: props.height }]}
      testID="finni-home-scene"
    >
      {props.sceneStyle !== 'quiet' && <Image
        accessibilityIgnoresInvertColors
        onError={() => setDecodeError(true)}
        resizeMode="cover"
        source={ROOM_SOURCE}
        style={[styles.layer, { opacity: props.roomOpacity ?? 1 }]}
      />}
      <Animated.Image
        key={`${appearanceId}-neutral`}
        accessible={!props.fullscreen}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityIgnoresInvertColors
        fadeDuration={0}
        onError={() => setDecodeError(true)}
        resizeMode="contain"
        source={sources.neutral}
        style={[styles.petLayer, petFrame, { opacity: showBlink ? 0 : 1, ...petMotion }]}
      />
      <Animated.Image
        key={`${appearanceId}-blink`}
        accessibilityIgnoresInvertColors
        fadeDuration={0}
        onError={() => setDecodeError(true)}
        onLoad={() => setLoadedBlinkAppearance(appearanceId)}
        resizeMode="contain"
        source={sources.blink}
        style={[styles.petLayer, petFrame, { opacity: showBlink ? 1 : 0, ...petMotion }]}
      />
      {reaction && expressionKey && (
        <Animated.Image
          key={expressionKey}
          accessibilityIgnoresInvertColors
          fadeDuration={0}
          onError={() => setDecodeError(true)}
          onLoad={() => setLoadedExpression(expressionKey)}
          resizeMode="contain"
          source={FINNI_EXPRESSION_ASSETS[appearanceId][frame.expression as 'happy' | 'thoughtful' | 'inspired']}
          style={[styles.petLayer, petFrame, { opacity: expressionReady ? expressionOpacity : 0 }]}
          testID={`finni-expression-${frame.expression}`}
        />
      )}
      {reaction && frame.clip && motionActive && ['AN-009', 'AN-010', 'AN-011', 'AN-012', 'AN-013', 'AN-014'].includes(frame.clip) && (
        <Animated.View pointerEvents="none" style={[styles.effect, {
          opacity: effectProgress.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: effectProgress.interpolate({ inputRange: [0, 1], outputRange: [9, -9] }) }],
        }]} testID={`finni-effect-${frame.clip}`}>
          {(frame.clip === 'AN-009' || frame.clip === 'AN-010') && reaction.objectId && itemSource(reaction.objectId) &&
            <Image source={itemSource(reaction.objectId)!} resizeMode="contain" style={styles.effectImage} />}
          {frame.clip === 'AN-011' && <Image source={OBJECT_SOURCES['OBJ-PLANNER']} resizeMode="contain" style={styles.effectImage} />}
          {frame.clip === 'AN-012' && <View style={styles.coins}>{[0, 1, 2].map((index) =>
            <Image key={index} source={OBJECT_SOURCES['OBJ-COIN']} resizeMode="contain" style={styles.coinImage} />)}</View>}
          {frame.clip === 'AN-013' && reaction.objectId && goalSource(reaction.objectId) &&
            <Image source={goalSource(reaction.objectId)!} resizeMode="contain" style={styles.effectImage} />}
          {frame.clip === 'AN-014' && <Text style={styles.effectLabel}>Новая ступень · {props.stage}</Text>}
          {frame.clip === 'AN-012' && <Text style={styles.effectLabel}>{reaction.value > 0 ? '+' : ''}{reaction.value} монет</Text>}
        </Animated.View>
      )}
      {!props.hideSkip && reaction?.skippable && frame.canSkip && motionActive && (
        <Pressable accessibilityRole="button" onPress={() => {
          dispatch({ type: 'skip', clip: reaction.clip as 'AN-013' | 'AN-014', generation: animation.generation });
          onReactionFinished?.(reaction.id);
        }} style={styles.skip} testID="finni-reaction-skip">
          <Text style={styles.skipText}>Пропустить анимацию</Text>
        </Pressable>
      )}
      {props.showCaption !== false && (
        <View pointerEvents="none" style={styles.caption}>
          <Text style={styles.captionTitle}>Финни дома</Text>
          <Text style={styles.captionText}>{props.careLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: '#D9F0E6',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  layer: {
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  petLayer: { position: 'absolute' },
  effect: { alignItems: 'center', backgroundColor: 'rgba(255, 252, 246, 0.94)', borderRadius: 18, justifyContent: 'center', left: '37%', minHeight: 64, minWidth: 76, padding: 7, position: 'absolute', top: '12%' },
  effectImage: { height: 50, width: 50 },
  coins: { flexDirection: 'row' },
  coinImage: { height: 26, width: 26 },
  effectLabel: { color: '#14324A', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'center' },
  skip: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.92)', borderRadius: 10, justifyContent: 'center', left: '28%', minHeight: 48, paddingHorizontal: 8, position: 'absolute', right: '28%', top: 10 },
  skipText: { color: '#14324A', fontSize: 13, fontWeight: '700' },
  caption: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 12,
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
  },
  captionTitle: { color: '#14324A', fontSize: 16, fontWeight: '800' },
  captionText: { color: '#4B6878', fontSize: 13, lineHeight: 17 },
  fallback: {
    alignItems: 'center',
    backgroundColor: '#D9F0E6',
    borderColor: '#146B78',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 16,
    width: '100%',
  },
  fullscreenFallbackTitle: { fontSize: 14, lineHeight: 16, textAlign: "center" },
  fallbackTitle: { color: '#14324A', fontSize: 18, fontWeight: '800' },
  fallbackText: { color: '#4B6878', fontSize: 14, marginTop: 4, textAlign: 'center' },
});
