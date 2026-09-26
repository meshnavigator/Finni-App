import { useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';
import { CATALOG } from '../domain/catalog.ts';
import { itemSource } from './room-assets.ts';

type Props = Readonly<{
  snapshot: AppSnapshot;
  busy: boolean;
  onPreview: (itemId: string) => Promise<Readonly<{ after: { available: number } | null; missing: number | null; occupiedSlot: boolean; planOverrun: boolean }>>;
  onPurchase: (itemId: string, acknowledgedPlanOverrun: boolean) => void;
}>;

function Button(props: Readonly<{ label: string; onPress: () => void; disabled?: boolean }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(props.disabled) }} disabled={props.disabled} onPress={props.onPress} style={({ pressed }) => [styles.button, props.disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.buttonText}>{props.label}</Text></Pressable>;
}

export default function ShopScreen(props: Props) {
  const [notice, setNotice] = useState('Выбери одну еду, один уход или одно занятие на этот день.');
  const select = async (itemId: string) => {
    const preview = await props.onPreview(itemId);
    if (preview.occupiedSlot) { setNotice('Этот вид покупки уже выбран сегодня.'); return; }
    if (!preview.after) { setNotice(`Не хватает ${preview.missing ?? 0} монет. Можно накопить или выбрать другой вариант.`); return; }
    const item = CATALOG.find((entry) => entry.id === itemId)!;
    const confirm = () => props.onPurchase(itemId, preview.planOverrun);
    Alert.alert('Подтвердить покупку?', `${item.name}: ${item.price} монет. Останется ${preview.after.available}.`, preview.planOverrun
      ? [{ text: 'Отмена', style: 'cancel' }, { text: 'Потратить сверх плана', onPress: confirm }]
      : [{ text: 'Отмена', style: 'cancel' }, { text: 'Купить', onPress: confirm }]);
  };
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Покупки</Text><Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>
    {CATALOG.map((item) => <View key={item.id} style={styles.card}><View style={styles.cardHeader}>{itemSource(item.id) && <Image accessibilityIgnoresInvertColors source={itemSource(item.id)!} style={styles.thumbnail} />}<View style={styles.cardCopy}><Text style={styles.name}>{item.name} — {item.price} монет</Text><Text style={styles.effect}>{item.effect}</Text></View></View><Button disabled={props.busy} label={props.busy ? 'Проверяем…' : 'Посмотреть и купить'} onPress={() => void select(item.id)} /></View>)}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F6F0E6' }, content: { gap: 12, padding: 18, paddingBottom: 32 }, title: { fontSize: 28, fontWeight: '700', color: '#3D352D' }, notice: { color: '#665444', fontSize: 16, lineHeight: 22 }, card: { gap: 6, borderWidth: 1, borderColor: '#E4D6C1', borderRadius: 18, padding: 12, backgroundColor: '#FFFCF6' }, cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 }, cardCopy: { flex: 1, gap: 3 }, thumbnail: { height: 64, width: 64 }, effect: { color: '#665444', fontSize: 14, lineHeight: 20 }, name: { fontSize: 16, fontWeight: '600', color: '#3D352D' }, button: { minHeight: 48, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#AE482A', borderRadius: 18 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }, pressed: { transform: [{ scale: .96 }] }, disabled: { opacity: 0.5 } });
