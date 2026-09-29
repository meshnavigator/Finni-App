import { StyleSheet } from 'react-native';

/** The warm surfaces and readable controls shared by the non-scene screens. */
export const palette = Object.freeze({
  ink: '#3D352D', muted: '#665444', background: '#F6F0E6', surface: '#FFFCF6',
  accent: '#AE482A', line: '#E4D6C1', inputLine: '#A78E72',
  soft: '#F1E5CB', selected: '#EEDFCA', error: '#A33629', errorSurface: '#FBE6DE',
});

export const screenStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  content: { gap: 14, padding: 18, paddingBottom: 28 },
  eyebrow: { color: palette.accent, fontSize: 13, fontWeight: '600', letterSpacing: 1.2 },
  title: { color: palette.ink, fontSize: 26, fontWeight: '600' },
  body: { color: palette.muted, fontSize: 16, lineHeight: 23 },
  cardTitle: { color: palette.ink, fontSize: 18, fontWeight: '600' },
  card: { backgroundColor: palette.surface, borderColor: palette.line, borderRadius: 22, borderWidth: 1, gap: 10, padding: 16 },
  input: { backgroundColor: palette.surface, borderColor: palette.inputLine, borderRadius: 14, borderWidth: 1, color: palette.ink, fontSize: 18, minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, fontVariant: ['tabular-nums'] },
  button: { alignItems: 'center', backgroundColor: palette.accent, borderRadius: 18, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  secondary: { backgroundColor: palette.surface, borderColor: palette.inputLine, borderWidth: 1 },
  secondaryText: { color: palette.ink },
  error: { backgroundColor: palette.errorSurface, borderRadius: 14, color: palette.error, fontSize: 16, lineHeight: 23, padding: 12 },
  selected: { backgroundColor: palette.selected, borderColor: palette.accent, borderWidth: 2 },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.96 }] },
});
