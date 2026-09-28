// QA entry point only. App.tsx is restored after the native recording.
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import FinniHomeScene, { type HomeReaction } from '../../../src/ui/FinniHomeScene.tsx';
import type { FinniClipId } from '../../../src/ui/finni-animation-set.ts';
import type { FinniAppearance } from '../../../src/ui/finni-appearance-policy.ts';
import { FINNI_ANIMATION_SET } from '../../../src/ui/finni-animation-set.ts';

export default function AnimationReview() {
  const [reaction, setReaction] = useState<HomeReaction | null>(null);
  const [appearance, setAppearance] = useState<FinniAppearance>({ shapeId: 'pointy', patternId: 'plain' });
  const [motion, setMotion] = useState(true);
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState<1 | 2 | 3>(2);
  useEffect(() => {
    const errors = (globalThis as unknown as { ErrorUtils?: { getGlobalHandler: () => (error: Error, fatal?: boolean) => void; setGlobalHandler: (handler: (error: Error, fatal?: boolean) => void) => void } }).ErrorUtils;
    const original = errors?.getGlobalHandler();
    errors?.setGlobalHandler((error, fatal) => { console.error('QA_ERROR_STACK', error.stack ?? String(error)); original?.(error, fatal); });
    console.info('QA_SESSION_START');
    return () => { if (original) errors?.setGlobalHandler(original); };
  }, []);
  const finish = useCallback((id: number) => { console.info('QA_TERMINAL', JSON.stringify({ id, kind: 'finish' })); setReaction(v => v?.id === id ? null : v); }, []);
  const cancel = useCallback((id: number) => { console.info('QA_TERMINAL', JSON.stringify({ id, kind: 'cancel' })); setReaction(v => v?.id === id ? null : v); }, []);
  const sequence = useRef(0);
  const play = useCallback((clip: FinniClipId) => { const id = ++sequence.current; console.info('QA_PLAY', JSON.stringify({ id, clip })); setReaction({ id, clip, expression: FINNI_ANIMATION_SET[clip].staticExpression === 'neutral' ? 'happy' : FINNI_ANIMATION_SET[clip].staticExpression as 'happy' | 'thoughtful' | 'inspired', objectId: clip === 'AN-009' ? 'IT-01' : clip === 'AN-013' ? 'GL-01' : null, value: 20, skippable: FINNI_ANIMATION_SET[clip].skippable }); }, []);
  return <View style={{ flex: 1, backgroundColor: '#F8F1E8' }}>
    <Text style={styles.label}>AN QA · {appearance.shapeId}/{appearance.patternId} · {stage} · {reaction?.clip ?? 'idle'}</Text>
    <View style={{ height: 360 }}><FinniHomeScene accessibilityLabel="Финни" careLabel="QA" height={360} paused={paused} motionEnabled={motion} soundEnabled={false} stage={stage} appearance={appearance} reaction={reaction} onReactionFinished={finish} onReactionCancelled={cancel} sceneStyle="quiet" fullscreen showCaption={false} petRegion={{ x: 25, y: 0, width: 310, height: 355 }} /></View>
    <View style={styles.row}>{Object.keys(FINNI_ANIMATION_SET).slice(2).map(id => <Pressable key={id} style={styles.button} onPress={() => play(id as FinniClipId)}><Text>{id}</Text></Pressable>)}</View>
    <View style={styles.row}>{(['pointy','round','floppy'] as const).map(shapeId => <Pressable key={shapeId} style={styles.button} onPress={() => setAppearance(v => ({ ...v, shapeId }))}><Text>{shapeId}</Text></Pressable>)}</View>
    <View style={styles.row}>{(['plain','spots','stripes'] as const).map(patternId => <Pressable key={patternId} style={styles.button} onPress={() => setAppearance(v => ({ ...v, patternId }))}><Text>{patternId}</Text></Pressable>)}</View>
    <View style={styles.row}><Pressable style={styles.button} onPress={() => setMotion(v => !v)}><Text>motion {String(motion)}</Text></Pressable><Pressable style={styles.button} onPress={() => setPaused(v => !v)}><Text>pause {String(paused)}</Text></Pressable><Pressable style={styles.button} onPress={() => setStage(v => v === 3 ? 1 : v === 2 ? 3 : 2)}><Text>stage {stage}</Text></Pressable></View>
  </View>;
}
const styles = StyleSheet.create({ label: { color: '#14324A', fontSize: 15, padding: 8 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, margin: 4 }, button: { backgroundColor: '#DDD4C7', paddingHorizontal: 8, paddingVertical: 8, minWidth: 68 } });

