import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROOT_ROUTES, type RootRoute } from './root-navigation.ts';

const icons = {
  home: require('../../assets/ui/home-v2/home.png'), plan: require('../../assets/ui/home-v2/plan.png'),
  shop: require('../../assets/ui/home-v2/shop.png'), savings: require('../../assets/ui/home-v2/savings.png'),
  menu: require('../../assets/ui/home-v2/menu.png'), arrow: require('../../assets/ui/home-v2/arrow.png'),
};

export function RootNavigation({ selected, onNavigate, list = false, disabled = false }: Readonly<{
  selected: RootRoute; onNavigate: (route: RootRoute) => void; list?: boolean; disabled?: boolean;
}>) {
  return <View accessibilityRole="tablist" style={[styles.bar, list && styles.list]} testID="root-navigation">
    {ROOT_ROUTES.map(({ id, label, icon }) => <Pressable key={id} accessibilityRole="tab" accessibilityLabel={label}
      accessibilityState={{ selected: id === selected, disabled }} disabled={disabled} onPress={() => onNavigate(id)}
      testID={'root-tab-' + id} style={({ pressed }) => [styles.tab, list && styles.listTab, id === selected && styles.selected, pressed && styles.pressed]}>
      <Image accessible={false} source={icons[icon]} style={styles.icon} />
      <Text style={[styles.label, list && styles.listLabel, id === selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>)}
  </View>;
}

export function RootMenu({ visible, selected, onClose, onNavigate }: Readonly<{
  visible: boolean; selected: RootRoute; onClose: () => void; onNavigate: (route: RootRoute) => void;
}>) {
  return <Modal visible={visible} onRequestClose={onClose} animationType="none" accessibilityViewIsModal>
    <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>Разделы</Text>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.close} testID="root-menu-close"><Text style={styles.body}>Закрыть меню</Text></Pressable>
      <RootNavigation selected={selected} onNavigate={onNavigate} list />
    </ScrollView></SafeAreaView>
  </Modal>;
}

export function MoreScreen({ name, day, demo, busy, notice, onLessons, onProgress, onPet, onHelp, onAdult }: Readonly<{
  name: string; day: string; demo: boolean; busy: boolean; notice: string | null;
  onLessons: () => void; onProgress: () => void; onPet: () => void; onHelp: () => void; onAdult: () => void;
}>) {
  return <ScrollView contentContainerStyle={styles.content} testID="more-screen">
    <Text accessibilityRole="header" style={styles.title}>Ещё</Text>
    <Text style={styles.body}>{name} · {day}{demo ? ' · Демо' : ''}</Text>
    {notice && <Text accessibilityLiveRegion="polite" style={styles.body}>{notice}</Text>}
    {[
      { label: 'Все занятия', action: onLessons }, { label: 'Прогресс', action: onProgress },
      { label: 'Имя и внешность', action: onPet }, { label: 'Как играть', action: onHelp },
      { label: 'Для взрослого', action: onAdult },
    ].map(({ label, action }) => <Pressable key={label} accessibilityRole="button" disabled={busy}
      accessibilityState={{ disabled: busy }} onPress={action} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Text style={[styles.body, styles.rowText]}>{label}</Text><Image accessible={false} source={icons.arrow} style={styles.icon} />
    </Pressable>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F0E6' },
  content: { padding: 18, paddingBottom: 28, gap: 14 },
  title: { color: '#3D352D', fontSize: 26, fontWeight: '600' },
  body: { color: '#665444', fontSize: 16, lineHeight: 22 },
  row: { minHeight: 64, padding: 16, borderRadius: 22, backgroundColor: '#FFFCF6', flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, color: '#3D352D' },
  close: { minHeight: 56, alignSelf: 'flex-start', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#A78E72', borderRadius: 16 },
  bar: { marginHorizontal: 10, marginBottom: 10, padding: 4, gap: 2, flexDirection: 'row', borderRadius: 22, backgroundColor: '#FFFCF6' },
  tab: { flex: 1, minWidth: 48, minHeight: 48, paddingVertical: 4, gap: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  icon: { width: 24, height: 24 },
  label: { color: '#665444', fontSize: 12, lineHeight: 15, includeFontPadding: false },
  selected: { backgroundColor: '#EEDFCA' }, selectedLabel: { color: '#603C24', fontWeight: '700' },
  list: { margin: 0, marginHorizontal: 0, marginBottom: 0, padding: 0, flexDirection: 'column', gap: 10, backgroundColor: 'transparent' },
  listTab: { flex: 0, padding: 16, gap: 16, minHeight: 64, flexDirection: 'row', justifyContent: 'flex-start', backgroundColor: '#FFFCF6' },
  listLabel: { fontSize: 16, lineHeight: 22, flexShrink: 1 },
  pressed: { transform: [{ scale: .96 }] },
});
