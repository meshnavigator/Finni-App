import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';
import { CATALOG } from '../domain/catalog.ts';

type Props = Readonly<{
  snapshot: AppSnapshot;
  busy: boolean;
  onPreview: (itemId: string) => Promise<Readonly<{ after: { available: number } | null; missing: number | null; occupiedSlot: boolean; planOverrun: boolean }>>;
  onPurchase: (itemId: string, acknowledgedPlanOverrun: boolean) => void;
  onBack: () => void;
}>;

function Button(props: Readonly<{ label: string; onPress: () => void; disabled?: boolean }>) {
  return <Text accessibilityRole="button" accessibilityState={{ disabled: Boolean(props.disabled) }} onPress={props.disabled ? undefined : props.onPress} style={[styles.button, props.disabled && styles.disabled]}>{props.label}</Text>;
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
    {CATALOG.map((item) => <View key={item.id} style={styles.card}><Text style={styles.name}>{item.name} — {item.price} монет</Text><Text>{item.effect}</Text><Button disabled={props.busy} label={props.busy ? 'Проверяем…' : 'Посмотреть и купить'} onPress={() => void select(item.id)} /></View>)}
    <Button label="Вернуться в домик" onPress={props.onBack} />
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#EAF6FB' }, content: { gap: 12, padding: 18, paddingBottom: 32 }, title: { fontSize: 28, fontWeight: '700', color: '#14324A' }, notice: { color: '#4B6878' }, card: { gap: 6, borderWidth: 1, borderColor: '#C7DEE5', borderRadius: 12, padding: 12, backgroundColor: '#F7FBFC' }, name: { fontWeight: '700', color: '#14324A' }, button: { minHeight: 48, padding: 14, textAlign: 'center', backgroundColor: '#146B78', color: '#fff', borderRadius: 10, overflow: 'hidden' }, disabled: { opacity: 0.5 } });
