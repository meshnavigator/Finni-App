import { Pressable, StyleSheet, Text } from 'react-native';
import { palette, screenStyles } from './screen-theme.ts';

export default function DetailBack({ onPress, label = 'Назад', disabled = false }: Readonly<{
  onPress: () => void; label?: string; disabled?: boolean;
}>) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} testID="detail-back"
    style={({ pressed }) => [styles.back, disabled && screenStyles.disabled, pressed && !disabled && screenStyles.pressed]}>
    <Text accessible={false} style={styles.arrow}>‹</Text>
    <Text style={styles.label}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: palette.surface },
  arrow: { color: palette.muted, fontSize: 28, lineHeight: 32 },
  label: { flexShrink: 1, color: palette.ink, fontSize: 16, lineHeight: 22 },
});
