import { useCallback, useEffect, useState } from 'react';
import { Animator, Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { diagnosticAssetProblem, isDiagnosticAssetReady, type LocalGlbDiagnosticAsset } from './home-scene-spike-contract';

export function HomeSceneSpike({ diagnosticAsset }: Readonly<{ diagnosticAsset?: LocalGlbDiagnosticAsset }>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRendererPaused, setIsRendererPaused] = useState(AppState.currentState !== 'active');
  const [pickedEntity, setPickedEntity] = useState<string | null>(null);
  const assetProblem = diagnosticAssetProblem(diagnosticAsset);
  const canRenderAsset = isDiagnosticAssetReady(diagnosticAsset);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const handleModelPress = useCallback((entity: { id: number }) => {
    setPickedEntity(String(entity.id));
    setIsModalOpen(true);
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => setIsRendererPaused(nextState !== 'active'));
    return () => subscription.remove();
  }, []);

  return <View style={styles.root} testID="home-scene-spike">
    <FilamentScene>
      {!isRendererPaused ? <FilamentView style={styles.scene}>
        <DefaultLight /><Camera cameraPosition={[0, 0.8, 4]} cameraTarget={[0, 0.6, 0]} />
        {canRenderAsset ? <Model source={diagnosticAsset.module} onPress={handleModelPress}>
          {diagnosticAsset.skeletalClipIndex != null ? <Animator animationIndex={diagnosticAsset.skeletalClipIndex} /> : null}
        </Model> : null}
      </FilamentView> : null}
    </FilamentScene>
    <View pointerEvents="box-none" style={styles.overlay}><View style={styles.badge}>
      <Text style={styles.title}>S7-001 · renderer spike</Text>
      <Text style={styles.detail}>{assetProblem ?? 'Локальный GLB зарегистрирован; проверь на устройстве.'}</Text>
      {pickedEntity != null ? <Text style={styles.detail}>Hit-test: entity {pickedEntity}</Text> : null}
    </View></View>
    <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.scrim} testID="home-scene-spike-modal"><View style={styles.card}>
        <Text style={styles.title}>Diagnostic model tap</Text><Text style={styles.detail}>Entity {pickedEntity ?? 'unknown'} selected.</Text>
        <Pressable accessibilityRole="button" onPress={closeModal} style={styles.close}><Text style={styles.closeText}>Закрыть</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#dce9df' }, scene: { flex: 1 }, overlay: { ...StyleSheet.absoluteFill, padding: 12 },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255, 252, 244, 0.92)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  title: { color: '#263338', fontSize: 14, fontWeight: '700' }, detail: { color: '#45565a', fontSize: 12, marginTop: 4 },
  scrim: { alignItems: 'center', backgroundColor: 'rgba(20, 31, 35, 0.56)', flex: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fffaf2', borderRadius: 20, maxWidth: 360, padding: 20, width: '100%' },
  close: { alignSelf: 'flex-start', backgroundColor: '#2d6a4f', borderRadius: 12, justifyContent: 'center', marginTop: 16, minHeight: 48, paddingHorizontal: 16 },
  closeText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
