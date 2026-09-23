import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  type AppStateStatus,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FINNI_ANCHORS, FINNI_CANVAS, FINNI_STAGE_SCALE, type FinniStage } from './finni-layer-contract.ts';

const ROOM_SOURCE = require('../../assets/2d/master/FINNI-2D-MASTER-V1/room_clean_v1.png');
const NEUTRAL_SOURCE = require('../../assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png');
const BLINK_SOURCE = require('../../assets/2d/master/FINNI-2D-MASTER-V1/pet_blink_canvas_v1.png');

const IDLE_DURATION_MS = 3600;
const BLINK_FRAME_MS = 140;
const BLINK_CYCLE_FRAMES = 24;

export default function FinniHomeScene(props: Readonly<{
  accessibilityLabel: string;
  careLabel: string;
  height: number;
  paused: boolean;
  motionEnabled: boolean;
  stage: FinniStage;
  showCaption?: boolean;
}>) {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [blinkPhase, setBlinkPhase] = useState(0);
  const [decodeError, setDecodeError] = useState(false);
  const [translateY] = useState(() => new Animated.Value(0));
  const animationActive = appState === 'active' && !props.paused && props.motionEnabled && !reduceMotion && !decodeError;
  const stageScale = FINNI_STAGE_SCALE[props.stage];
  const petFrame = {
    width: `${stageScale * 100}%` as const,
    height: `${stageScale * 100}%` as const,
    left: `${(1 - stageScale) * FINNI_ANCHORS.feet.x / FINNI_CANVAS.width * 100}%` as const,
    top: `${(1 - stageScale) * FINNI_ANCHORS.feet.y / FINNI_CANVAS.height * 100}%` as const,
  };

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

  if (decodeError) {
    return (
      <View
        accessible
        accessibilityLabel={`${props.accessibilityLabel}. Изображение недоступно, показан безопасный локальный вариант.`}
        style={[styles.fallback, { height: props.height }]}
        testID="finni-home-scene-fallback"
      >
        <Text style={styles.fallbackTitle}>Финни рядом</Text>
        <Text style={styles.fallbackText}>{props.careLabel}</Text>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={props.accessibilityLabel}
      style={[styles.scene, { height: props.height }]}
      testID="finni-home-scene"
    >
      <Image
        accessibilityIgnoresInvertColors
        onError={() => setDecodeError(true)}
        resizeMode="cover"
        source={ROOM_SOURCE}
        style={styles.layer}
      />
      <Animated.Image
        accessibilityIgnoresInvertColors
        onError={() => setDecodeError(true)}
        resizeMode="contain"
        source={animationActive && blinkPhase === BLINK_CYCLE_FRAMES - 1
          ? BLINK_SOURCE
          : NEUTRAL_SOURCE}
        style={[styles.petLayer, petFrame, { transform: [{ translateY }] }]}
      />
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
  fallbackTitle: { color: '#14324A', fontSize: 18, fontWeight: '800' },
  fallbackText: { color: '#4B6878', fontSize: 14, marginTop: 4, textAlign: 'center' },
});
