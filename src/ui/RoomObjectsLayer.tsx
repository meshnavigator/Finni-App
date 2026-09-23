import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { goalSource, OBJECT_SOURCES } from './room-assets.ts';

type ObjectId = 'OBJ-PLANNER' | 'OBJ-CHEST' | 'OBJ-CARE' | 'OBJ-GOAL-DISPLAY';

export type RoomObjectsLayerProps = Readonly<{
  selectedGoalId: string | null;
  onOpenPlanner: () => void;
  onOpenSavings: () => void;
  onOpenShop: () => void;
}>;

/** Presentation only. Parent owns navigation, goal state and all transactions. */
export default function RoomObjectsLayer(props: RoomObjectsLayerProps) {
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const fail = (id: string) => setFailed((previous) => new Set(previous).add(id));
  const objects: readonly Readonly<{
    id: ObjectId;
    label: string;
    position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    onPress: () => void;
  }>[] = [
    { id: 'OBJ-PLANNER', label: 'Планер', position: 'topLeft', onPress: props.onOpenPlanner },
    { id: 'OBJ-GOAL-DISPLAY', label: 'Цель', position: 'topRight', onPress: props.onOpenSavings },
    { id: 'OBJ-CARE', label: 'Забота', position: 'bottomLeft', onPress: props.onOpenShop },
    { id: 'OBJ-CHEST', label: 'Копилка', position: 'bottomRight', onPress: props.onOpenSavings },
  ];

  return (
    <View pointerEvents="box-none" style={styles.layer} testID="room-objects-layer">
      {objects.map((object) => {
        const selectedGoal = object.id === 'OBJ-GOAL-DISPLAY' ? goalSource(props.selectedGoalId) : null;
        const source = selectedGoal ?? OBJECT_SOURCES[object.id];
        return (
          <Pressable
            key={object.id}
            accessibilityLabel={object.label}
            accessibilityRole="button"
            onPress={object.onPress}
            style={({ pressed }) => [styles.object, styles[object.position], pressed && styles.pressed]}
            testID={`room-object-${object.id}`}
          >
            {failed.has(object.id) ? (
              <Text style={styles.fallback}>{object.label}</Text>
            ) : (
              <Image
                accessibilityIgnoresInvertColors
                onError={() => fail(object.id)}
                resizeMode="contain"
                source={source}
                style={styles.image}
              />
            )}
            <Text style={styles.label}>{object.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  object: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 250, 238, 0.88)',
    borderColor: '#8BABA6',
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 72,
    minWidth: 68,
    padding: 3,
    position: 'absolute',
    width: 72,
  },
  image: { height: 47, width: 47 },
  fallback: { color: '#14324A', fontSize: 12, minHeight: 47, textAlign: 'center', textAlignVertical: 'center' },
  label: { color: '#14324A', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.72 },
  topLeft: { left: 8, top: 8 },
  topRight: { right: 8, top: 8 },
  bottomLeft: { bottom: 8, left: 8 },
  bottomRight: { bottom: 8, right: 8 },
});
