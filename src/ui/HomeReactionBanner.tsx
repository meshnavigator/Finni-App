import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import type { ReactionMessage } from './home-reaction-copy.ts';

const icons = {
  book: require('../../assets/ui/home-v2/book.png'), care: require('../../assets/ui/home-v2/care.png'),
  food: require('../../assets/ui/home-v2/food.png'), mood: require('../../assets/ui/home-v2/mood.png'),
  plan: require('../../assets/ui/home-v2/plan.png'), savings: require('../../assets/ui/home-v2/savings.png'),
};
const tones = {
  ochre: { ink: '#89501F', surface: '#F7E4C8' },
  lilac: { ink: '#715187', surface: '#EEE1F2' },
  teal: { ink: '#286D70', surface: '#DCEDEC' },
  coral: { ink: '#A8432A', surface: '#F8E1D8' },
};

export default function HomeReactionBanner(props: Readonly<{
  eventId: number | null; message: ReactionMessage | null; motionEnabled: boolean; large: boolean; exiting: boolean;
}>) {
  const [progress] = useState(() => new Animated.Value(0));
  const [iconProgress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (mounted) setReduceMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!props.message || props.eventId === null) return;
    const animate = props.motionEnabled && !reduceMotion;
    progress.stopAnimation();
    iconProgress.stopAnimation();
    progress.setValue(animate ? 0 : 1);
    iconProgress.setValue(animate ? 0 : 1);
    if (!animate) return;
    const animation = Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(95),
        Animated.timing(iconProgress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [props.eventId, props.message, props.motionEnabled, reduceMotion, progress, iconProgress]);

  useEffect(() => {
    if (!props.exiting || !props.motionEnabled || reduceMotion) return;
    const animation = Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [props.exiting, props.motionEnabled, reduceMotion, progress]);

  if (!props.message) return null;
  const tone = tones[props.message.tone];
  return <Animated.View pointerEvents="none" accessible accessibilityLiveRegion="polite"
    accessibilityLabel={`${props.message.title}. ${props.message.detail}`}
    style={[styles.position, props.large && styles.largePosition, { opacity: progress, transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ] }]} testID="home-reaction-banner">
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: tone.ink }]} />
      <Animated.View style={[styles.iconWrap, { backgroundColor: tone.surface, opacity: iconProgress, transform: [{ scale: iconProgress.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }] }]}>
        <Image accessible={false} source={icons[props.message.icon]} style={[styles.icon, { tintColor: tone.ink }]} />
      </Animated.View>
      <View style={styles.copy}>
        <Text style={[styles.tag, { color: tone.ink }]}>{props.message.tag.toUpperCase()}</Text>
        <Text style={[styles.title, props.large && styles.largeTitle]}>{props.message.title}</Text>
        <Text style={[styles.detail, props.large && styles.largeDetail]}>{props.message.detail}</Text>
      </View>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  position: { position: 'absolute', zIndex: 5, top: 6, left: 6, right: 6 },
  largePosition: { left: 158, right: 0, top: 0 },
  card: { minHeight: 68, borderRadius: 20, backgroundColor: '#FFFCF6', padding: 9, paddingLeft: 13,
    flexDirection: 'row', alignItems: 'center', gap: 9, overflow: 'hidden',
    shadowColor: '#3D352D', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  accent: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 4, borderRadius: 3 },
  iconWrap: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 22, height: 22 },
  copy: { flex: 1, gap: 1 },
  tag: { fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 0.9 },
  title: { color: '#3D352D', fontSize: 15, lineHeight: 19, fontWeight: '800', includeFontPadding: false },
  detail: { color: '#665444', fontSize: 12, lineHeight: 16, includeFontPadding: false },
  largeTitle: { fontSize: 13, lineHeight: 17 },
  largeDetail: { fontSize: 11, lineHeight: 14 },
});
