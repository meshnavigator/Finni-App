import { useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { FINNI_PUPPET_ASSETS, FINNI_GESTURE_ASSETS } from './finni-puppet-assets.ts';
import { FINNI_CANVAS, FINNI_STAGE_SCALE, type FinniExpression, type FinniStage } from './finni-layer-contract.ts';
import type { FinniAppearanceId } from './finni-appearance-policy.ts';
import type { FinniClipId } from './finni-animation-set.ts';
import { finniBodyPose, MOTION_KEYS, type BodyPose } from './finni-body-motion.ts';
import { OBJECT_SOURCES, itemSource, goalSource } from './room-assets.ts';

export default function FinniPuppet(props: Readonly<{
  appearance: FinniAppearanceId; expression: FinniExpression; blink: boolean;
  clip: FinniClipId | null; progress: Animated.Value; breath: Animated.Value;
  width: number; height: number; stage: FinniStage; objectId: string | null; value: number;
  onError: () => void; onReady: (key: string) => void;
}>) {
  const s = props.width / FINNI_CANVAS.width;
  const layers = FINNI_PUPPET_ASSETS[props.appearance];
  const pattern = props.appearance.split('/')[1] as 'plain' | 'spots' | 'stripes';
  const curves = useMemo(() => {
    const samples = MOTION_KEYS.map(p => finniBodyPose(props.clip, p, props.value < 0 ? -1 : 1));
    const scalar = (key: keyof BodyPose, multiplier = 1) => props.progress.interpolate({ inputRange: [...MOTION_KEYS], outputRange: samples.map(p => p[key] * multiplier) });
    const angle = (key: 'head' | 'tail') => props.progress.interpolate({ inputRange: [...MOTION_KEYS], outputRange: samples.map(p => `${p[key]}deg`) });
    return { head: angle('head'), tail: angle('tail'), headY: scalar('headY', s), gesture: scalar('gesture'), normal: scalar('gesture').interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), prop: scalar('prop'), propX: scalar('propX', s), propY: scalar('propY', s) };
  }, [props.clip, props.progress, props.value, s]);
  const readyKey = `${props.appearance}/${props.expression}`;
  const loaded = useRef(new Map<string, Set<string>>());
  const didLoad = (part: string) => {
    const set = loaded.current.get(readyKey) ?? new Set<string>();
    set.add(part); loaded.current.set(readyKey, set);
    if (set.size === 5) props.onReady(readyKey);
  };
  const wave = props.clip === 'AN-004' || props.clip === 'AN-008';
  const image = (source: ImageSourcePropType, key: string, hidden = false) => <Image key={`${readyKey}/${key}`} source={source} fadeDuration={0} resizeMode="stretch" onLoad={() => didLoad(key)} onError={props.onError} style={{ position: 'absolute', left: 0, top: 0, width: props.width, height: props.height, opacity: hidden ? 0 : 1 }} />;
  const headSource = layers.heads[props.blink ? 'blink' : props.expression];
  const stageScale = props.clip === 'AN-014' ? props.progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [FINNI_STAGE_SCALE[props.stage === 1 ? 1 : props.stage === 2 ? 1 : 2] / FINNI_STAGE_SCALE[props.stage], 1, 1] }) : 1;
  const object = props.clip === 'AN-009' ? itemSource(props.objectId ?? 'IT-01')
    : props.clip === 'AN-010' ? itemSource('IT-03')
    : props.clip === 'AN-011' ? OBJECT_SOURCES['OBJ-PLANNER']
    : props.clip === 'AN-013' ? goalSource(props.objectId) : null;
  return <Animated.View pointerEvents="none" style={{ width: props.width, height: props.height, transformOrigin: [470 * s, 1272 * s, 0], transform: [{ scale: stageScale }] }} testID={`finni-puppet-${props.clip ?? 'idle'}`}>
    {image(layers.heads.blink, 'blink-preload', true)}
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [575 * s, 1200 * s, 0], transform: [{ rotate: curves.tail }, { scale: 1.015 }] }]}>{image(layers.back, 'tail')}</Animated.View>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: wave ? curves.normal : 1 }]}>
      <View style={{ position: 'absolute', left: 0, top: 994 * s, width: props.width, height: 54 * s, overflow: 'hidden' }}>
        <Image source={layers.body} fadeDuration={0} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: -1002 * s, width: props.width, height: props.height }} />
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [470 * s, 1272 * s, 0], transform: [{ scaleX: 1.005 }, { scaleY: props.breath.interpolate({ inputRange: [-4, 0], outputRange: [1.006, 1] }) }] }]}>
        {image(layers.body, 'body')}
      </Animated.View>
    </Animated.View>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: wave ? curves.gesture : 0 }]}>
      <Image key={`${readyKey}/gesture`} source={FINNI_GESTURE_ASSETS[pattern]} fadeDuration={0} resizeMode="stretch" onLoad={() => didLoad('gesture')} onError={props.onError} style={{ position: 'absolute', left: 0, top: 0, width: props.width, height: props.height }} />
    </Animated.View>
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [466 * s, 1022 * s, 0], transform: [{ translateY: curves.headY }, { rotate: curves.head }] }]}>
      {image(headSource, 'head')}
    </Animated.View>
    {object && <Animated.Image source={object} fadeDuration={0} onError={props.onError} resizeMode="contain" style={{ position: 'absolute', left: (props.clip === 'AN-010' ? 540 : 382) * s, top: (props.clip === 'AN-010' ? 1010 : props.clip === 'AN-009' ? 1120 : 1100) * s, width: 155 * s, height: 130 * s, opacity: curves.prop, transform: [{ translateX: curves.propX }, { translateY: curves.propY }] }} />}
    {props.clip === 'AN-011' && <Animated.Text style={{ position: 'absolute', left: 438 * s, top: 1130 * s, fontSize: 42 * s, color: '#35795C', opacity: curves.prop }}>✓</Animated.Text>}
    {props.clip === 'AN-012' && <View style={StyleSheet.absoluteFill}>{[0, 1, 2].map(i => <Animated.Image key={i} source={OBJECT_SOURCES['OBJ-COIN']} fadeDuration={0} resizeMode="contain" style={{ position: 'absolute', left: (400 + i * 36) * s, top: 1125 * s, width: 40 * s, height: 40 * s, opacity: curves.prop, transform: [{ translateX: curves.propX }, { translateY: curves.propY }] }} />)}</View>}
  </Animated.View>;
}
