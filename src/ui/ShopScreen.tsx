import { useRef, useState } from 'react';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';
import { CATALOG, type CatalogItem, type PurchaseSlot } from '../domain/catalog.ts';
import { itemSource } from './room-assets.ts';

type Preview = Readonly<{ after: { available: number } | null; missing: number | null; occupiedSlot: boolean; planOverrun: boolean }>;
type Props = Readonly<{
  snapshot: AppSnapshot;
  busy: boolean;
  onPreview: (itemId: string) => Promise<Preview>;
  onPurchase: (itemId: string, acknowledgedPlanOverrun: boolean) => Promise<boolean>;
  onPlan: () => void;
  onHome: () => void;
}>;

const slotName: Record<PurchaseSlot, string> = { food: 'Еда', care: 'Уход', activity: 'Занятие' };

function Button(props: Readonly<{ label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(props.disabled) }} disabled={props.disabled} onPress={props.onPress}
    style={({ pressed }) => [styles.button, props.secondary && styles.secondaryButton, props.disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, props.secondary && styles.secondaryText]}>{props.label}</Text>
  </Pressable>;
}

export default function ShopScreen(props: Props) {
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const previewRequest = useRef(0);
  const purchases = props.snapshot.commerce?.purchases ?? [];
  const active = props.snapshot.lifecycle?.state === 'ACTIVE';
  const draft = props.snapshot.lifecycle?.state === 'DRAFT';
  const chosenInSlot = (slot: PurchaseSlot) => purchases.find(({ item }) => item.slot === slot)?.item;
  const close = () => { previewRequest.current += 1; setSelected(null); };

  const open = async (item: CatalogItem) => {
    const request = ++previewRequest.current;
    setSelected(item);
    setPreview(null);
    setChecking(false);
    setDetailError(null);
    if (!active || chosenInSlot(item.slot)) return;
    setChecking(true);
    try {
      const result = await props.onPreview(item.id);
      if (request === previewRequest.current) setPreview(result);
    } catch {
      if (request === previewRequest.current) setDetailError('Не получилось проверить покупку. Попробуй ещё раз. Монеты не изменились.');
    } finally {
      if (request === previewRequest.current) setChecking(false);
    }
  };

  const buy = async () => {
    if (!selected || !preview?.after || checking || props.busy) return;
    setChecking(true);
    setDetailError(null);
    try {
      if (await props.onPurchase(selected.id, preview.planOverrun)) close();
      else setDetailError('Покупка не получилась. Монеты не изменились. Попробуй ещё раз.');
    } finally {
      setChecking(false);
    }
  };

  const chosen = selected ? chosenInSlot(selected.slot) : undefined;
  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>Покупки</Text>
      <Text style={styles.intro}>На день нужны еда и уход для Финни. Занятие — по желанию. В каждой группе можно выбрать только один вариант.</Text>
      {!active && <Text style={styles.notice}>{draft ? 'Сначала подтверди план на день. Сейчас можно посмотреть покупки.' : 'Покупать снова можно будет в новом игровом дне. Пока можно посмотреть варианты.'}</Text>}
      {CATALOG.map((item) => {
        const picked = chosenInSlot(item.slot);
        const bought = picked?.id === item.id;
        const status = bought ? 'Куплено сегодня' : picked ? `Сегодня уже выбрано: ${picked.name}` : 'Можно выбрать сегодня';
        return <View key={item.id} style={[styles.card, bought && styles.boughtCard]}>
          <View style={styles.cardHeader}>
            {itemSource(item.id) && <Image accessibilityIgnoresInvertColors source={itemSource(item.id)!} style={styles.thumbnail} />}
            <View style={styles.cardCopy}>
              <Text style={[styles.category, item.category === 'need' ? styles.need : styles.want]}>{item.category === 'need' ? 'Нужно' : 'По желанию'} · {slotName[item.slot]}</Text>
              <Text style={styles.name}>{item.name} — {item.price} монет</Text>
              <Text style={styles.effect}>{item.effect}</Text>
              <Text accessibilityLiveRegion="polite" style={[styles.status, bought && styles.boughtStatus]}>{status}</Text>
            </View>
          </View>
          <Button disabled={props.busy} label="Подробнее" onPress={() => void open(item)} secondary />
        </View>;
      })}
      <View style={styles.nextCard}>
        <Text style={styles.nextTitle}>Что дальше?</Text>
        <Text style={styles.intro}>Вернись в Домик: там видно, что нужно Финни сегодня, и какой шаг следующий.</Text>
        <Button label="В Домик" onPress={props.onHome} />
      </View>
    </ScrollView>
    <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={close} accessibilityViewIsModal>
      <View style={styles.overlay}>
        {selected && <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
          <Text accessibilityRole="header" style={styles.detailTitle}>{selected.name}</Text>
          <Text style={styles.detailBody}>{selected.category === 'need' ? 'Нужно для заботы' : 'По желанию'} · {slotName[selected.slot]}</Text>
          <Text style={styles.detailBody}>{selected.effect}. Цена: {selected.price} монет.</Text>
          {chosen ? <Text accessibilityLiveRegion="polite" style={styles.detailBody}>{chosen.id === selected.id
            ? 'Уже куплено сегодня. Завтра можно выбрать снова.'
            : `Сегодня уже выбрано: ${chosen.name}. Другой вариант можно выбрать завтра.`}</Text>
            : !active ? <Text style={styles.detailBody}>{draft ? 'Покупки откроются после подтверждения плана на день.' : 'Новая покупка будет доступна в следующем игровом дне.'}</Text>
            : checking && !preview ? <Text style={styles.detailBody}>Проверяем монеты…</Text>
            : preview?.occupiedSlot ? <Text style={styles.detailBody}>Сегодня этот вид покупки уже выбран.</Text>
            : preview && !preview.after ? <Text accessibilityLiveRegion="polite" style={styles.detailBody}>Не хватает {preview.missing ?? 0} монет. Можно накопить или выбрать другой вариант.</Text>
            : preview?.after ? <>
              <Text style={styles.detailBody}>В кошельке: {props.snapshot.lifecycle?.available ?? 0} → {preview.after.available} монет.</Text>
              {preview.planOverrun && <Text style={styles.warning}>Это больше, чем ты запланировал на {selected.category === 'need' ? 'нужное' : 'желания'}.</Text>}
              <Button disabled={props.busy || checking} label={preview.planOverrun ? `Всё равно купить за ${selected.price}` : `Купить за ${selected.price}`} onPress={() => void buy()} />
            </> : null}
          {detailError && <Text accessibilityLiveRegion="polite" style={styles.warning}>{detailError}</Text>}
          {!active && <Button label={draft ? 'К плану' : 'В Домик'} onPress={() => { close(); if (draft) props.onPlan(); else props.onHome(); }} />}
          <Button label="Назад к покупкам" onPress={close} secondary />
        </ScrollView>}
      </View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F0E6' }, content: { gap: 12, padding: 18, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#3D352D' }, intro: { color: '#665444', fontSize: 16, lineHeight: 22 },
  notice: { color: '#5A493A', fontSize: 16, lineHeight: 22, backgroundColor: '#F2E4CC', padding: 12, borderRadius: 14 },
  card: { gap: 10, borderWidth: 1, borderColor: '#E4D6C1', borderRadius: 18, padding: 12, backgroundColor: '#FFFCF6' },
  boughtCard: { borderColor: '#719078', backgroundColor: '#F5FAF2' },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 }, cardCopy: { flex: 1, gap: 3 }, thumbnail: { height: 64, width: 64 },
  category: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, fontSize: 13, fontWeight: '700' },
  need: { color: '#315A3A', backgroundColor: '#DCEBDD' }, want: { color: '#765122', backgroundColor: '#FFF0CC' },
  effect: { color: '#665444', fontSize: 14, lineHeight: 20 }, name: { fontSize: 16, fontWeight: '600', color: '#3D352D' },
  status: { color: '#665444', fontSize: 14, lineHeight: 20 }, boughtStatus: { color: '#315A3A', fontWeight: '700' },
  button: { minHeight: 48, padding: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#AE482A', borderRadius: 16 },
  secondaryButton: { backgroundColor: '#F1E7D8', borderWidth: 1, borderColor: '#D9C8AD' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }, secondaryText: { color: '#5C3C2E' },
  pressed: { transform: [{ scale: .96 }] }, disabled: { opacity: 0.5 },
  nextCard: { gap: 10, borderRadius: 18, padding: 16, backgroundColor: '#EFE9D9' }, nextTitle: { color: '#3D352D', fontSize: 18, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#00000066' },
  detail: { flexGrow: 0, maxHeight: '85%', borderRadius: 24, backgroundColor: '#FFFCF6' }, detailContent: { gap: 12, padding: 20 },
  detailTitle: { color: '#3D352D', fontSize: 24, fontWeight: '700' },
  detailBody: { color: '#51473B', fontSize: 16, lineHeight: 22 }, warning: { color: '#8B3A22', fontSize: 16, lineHeight: 22 },
});
