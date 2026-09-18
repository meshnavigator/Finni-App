import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
} from 'react-native-filament';
import { StyleSheet, Text, View } from 'react-native';

/**
 * S7-001 native-boundary slice.
 *
 * This component intentionally contains no production model yet. It proves
 * that the native renderer can coexist with a regular React Native overlay
 * before Home is migrated or a licensed GLB is introduced.
 */
export function HomeSceneSpike() {
  return (
    <View style={styles.root} testID="home-scene-spike">
      <FilamentScene>
        <FilamentView style={styles.scene}>
          <DefaultLight />
          <Camera cameraPosition={[0, 0.8, 4]} cameraTarget={[0, 0.6, 0]} />
        </FilamentView>
      </FilamentScene>

      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.evidenceBadge}>
          <Text style={styles.evidenceText}>S7-001 · renderer spike</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#dce9df',
  },
  scene: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    padding: 12,
  },
  evidenceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 252, 244, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  evidenceText: {
    color: '#263338',
    fontSize: 14,
    fontWeight: '700',
  },
});
