import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { AppSnapshot } from '../application/app-runtime.ts';
import { homeScreenModel } from '../application/ui-model.ts';
import FinniHomeScene, { type HomeReaction } from './FinniHomeScene.tsx';
import { goalSource } from './room-assets.ts';
import { homeNextStep } from './home-next-step.ts';
import { usesLargeNavigation } from './root-navigation.ts';
import type { SceneRect } from './home-scene-layout.ts';
import { homeColors } from './home-colors.ts';

export type HomeScreenProps = Readonly<{
  snapshot: AppSnapshot; busy: boolean; notice: string | null; scenePaused: boolean;
  motionEnabled: boolean; soundEnabled: boolean; reaction: HomeReaction | null; lessonTitle: string | null; demo: boolean;
  onReactionFinished: (id: number) => void; onReactionCancelled: (id: number) => void;
  onDismissNotice: () => void; onOpenDay: () => void; onResults: () => void; onEditPet: () => void;
  onMenu: () => void; onLesson: () => void; onSection: (title: string) => void;
}>;

const ICONS = {
  book: require('../../assets/ui/home-v2/book.png'),
  food: require('../../assets/ui/home-v2/food.png'), care: require('../../assets/ui/home-v2/care.png'),
  mood: require('../../assets/ui/home-v2/mood.png'), arrow: require('../../assets/ui/home-v2/arrow.png'),
};
const REACTION_CAPTIONS: Record<string, string> = {
  'AN-006': 'Финни задумался о мечте', 'AN-007': 'Финни радуется!',
  'AN-009': 'Финни ест и радуется!', 'AN-010': 'Финни ухаживает за шерстью!',
  'AN-011': 'План сохранён. Финни его заметил!', 'AN-012': 'Финни следит за монетами',
  'AN-013': 'Мечта получена!', 'AN-014': 'Финни вырос: новая стадия!',
};
function Icon({ name, size = 24, color }: Readonly<{ name: keyof typeof ICONS; size?: number; color?: string }>) {
  return <Image accessible={false} source={ICONS[name]} style={{ width: size, height: size, tintColor: color }} />;
}
function MenuRow({ label, onPress }: Readonly<{ label: string; onPress: () => void }>) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}><Text style={styles.body}>{label}</Text><Icon name="arrow" /></Pressable>;
}

/** Presentation only: next steps open existing routes; money is confirmed there. */
export default function HomeScreen(props: HomeScreenProps) {
  const viewport = useWindowDimensions();
  const large = usesLargeNavigation(viewport.fontScale);
  const short = viewport.height < 720;
  const profile = props.snapshot.profile!;
  const life = props.snapshot.lifecycle!;
  const model = homeScreenModel(profile, life);
  const goal = props.snapshot.commerce?.selectedGoal;
  const purchases = props.snapshot.commerce?.purchases ?? [];
  const [skipReactionId, setSkipReactionId] = useState<number | null>(null);
  const [failedGoal, setFailedGoal] = useState<string | null>(null);
  const [growthOpen, setGrowthOpen] = useState(false);
  const [recentCaption, setRecentCaption] = useState<string | null>(null);
  const [sceneSize, setSceneSize] = useState({ width: viewport.width - 24, height: 260 });
  const canSkip = props.reaction?.skippable && skipReactionId !== props.reaction.id;
  const hasFood = purchases.some(({ item }) => item.slot === 'food');
  const hasCare = purchases.some(({ item }) => item.slot === 'care');
  const closed = life.state === 'CLOSED' || life.state === 'WAITING';
  const food = hasFood ? 'Еда: есть' : closed ? 'Еда: нет' : 'Еда: выберем';
  const care = hasCare ? 'Уход: есть' : closed ? 'Уход: нет' : 'Уход: выберем';
  const mood = props.reaction?.expression === 'happy' ? 'Радостно' : props.reaction?.expression === 'thoughtful' ? 'Задумчиво'
    : props.reaction?.expression === 'inspired' ? 'Вдохновлён' : 'Спокойно';
  const reactionCaption = props.reaction
    ? REACTION_CAPTIONS[props.reaction.clip] ?? 'Финни заметил твой выбор!'
    : recentCaption;
  useEffect(() => {
    if (!recentCaption) return;
    const timer = setTimeout(() => setRecentCaption(null), 3000);
    return () => clearTimeout(timer);
  }, [recentCaption]);
  const activeReactionId = props.reaction?.id;
  const activeReactionClip = props.reaction?.clip;
  const onReactionFinished = props.onReactionFinished;
  const onReactionCancelled = props.onReactionCancelled;
  const handleReactionFinished = useCallback((id: number) => {
    if (activeReactionId === id && activeReactionClip) setRecentCaption(REACTION_CAPTIONS[activeReactionClip] ?? 'Финни заметил твой выбор!');
    onReactionFinished(id);
  }, [activeReactionId, activeReactionClip, onReactionFinished]);
  const handleReactionCancelled = useCallback((id: number) => {
    setRecentCaption(null);
    onReactionCancelled(id);
  }, [onReactionCancelled]);
  const allGoals = (props.snapshot.commerce?.claimedGoalIds.length ?? 0) === 3;
  const goalName = goal?.name ?? (allGoals ? 'Все мечты получены' : 'Выбери мечту');
  const remaining = goal ? Math.max(0, goal.cost - life.savings) : null;
  const goalImage = goalSource(goal?.id ?? null);
  const next = homeNextStep({ state: life.state, hasFood, hasCare, hasGoal: Boolean(goal), allGoals, savings: life.savings, large });
  const runNext = () => {
    if (next.route === 'open-day') props.onOpenDay();
    else if (next.route === 'results') props.onResults();
    else if (next.route !== 'waiting') props.onSection(next.route);
  };
  const portraitSize = short ? 120 : 152;
  const blocked = props.busy || !model.action.enabled;
  const petRegion: SceneRect = large
    ? { x: 0, y: 0, width: portraitSize, height: portraitSize }
    : { x: 24, y: short ? 8 : 34, width: Math.max(80, sceneSize.width - 48), height: Math.max(48, sceneSize.height - (short ? 46 : 84)) };
  const primary = <Pressable accessibilityRole="button" accessibilityState={{ disabled: blocked }} disabled={blocked} onPress={runNext}
    style={({ pressed }) => [styles.primary, short && styles.shortPrimary, large && styles.largePrimary, blocked && styles.disabled, pressed && styles.pressed]} testID="home-primary">
    <Text style={[styles.primaryText, large && styles.largePrimaryText]}>{props.busy ? 'Подождите…' : next.label}</Text>
  </Pressable>;
  const menuButton = <Pressable accessibilityRole="button" accessibilityLabel="Меню" onPress={props.onMenu}
    style={({ pressed }) => [styles.menuButton, styles.largeMenuButton, pressed && styles.pressed]} testID="home-sections">
    <Text style={styles.caption}>Меню</Text>
  </Pressable>;
  const skipButton = canSkip && <Pressable accessibilityRole="button" accessibilityLabel="Пропустить анимацию" onPress={() => setSkipReactionId(props.reaction!.id)}
    testID="home-skip-reaction" style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}><Text style={styles.caption}>Пропуск</Text></Pressable>;
  const state = <View style={[styles.state, short && !large && styles.shortState, large && [styles.largeState, { marginLeft: portraitSize + 10 }]]} testID="home-care">
    {([{ name: 'food', text: food, color: homeColors.ochre.ink }, { name: 'care', text: care, color: homeColors.lilac.ink }, { name: 'mood', text: mood, color: homeColors.teal.ink }] as const).map((item) =>
      <View key={item.name} style={[styles.stateItem, large && styles.largeStateItem]}>
        {!large && !short && <Icon name={item.name} size={16} color={item.color} />}
        <Text accessibilityLabel={item.name === 'mood' ? 'Настроение: ' + mood : undefined} style={[styles.caption, !large && styles.stateText]}>{item.text}</Text>
      </View>)}
    {large && skipButton}
  </View>;
  return <View style={styles.safe}>
    <View style={[styles.home, short && styles.shortHome, large && styles.largeHome]} testID={large ? 'home-large-summary' : 'home-v42'}
      accessibilityElementsHidden={Boolean(props.notice) || growthOpen} importantForAccessibility={props.notice || growthOpen ? 'no-hide-descendants' : 'auto'}
      pointerEvents={props.notice || growthOpen ? 'none' : 'auto'}>
      <View style={[styles.finances, short && !large && styles.shortFinances, large && styles.largeFinances]} testID="home-finances">
        <View style={[styles.money, short && !large && styles.shortMoney, large && styles.largeMoney]}>
          {([['Доступно', life.available], ['Копилка', life.savings]] as const).map(([label, value]) =>
            <View key={label} accessible accessibilityLabel={label + ': ' + value + ' монет'} style={[styles.metric, large && styles.largeMetric]}>
              <Text style={styles.caption}>{large ? label : label + ', монет'}</Text>
              <Text style={[styles.amount, short && !large && styles.shortAmount, large && styles.largeAmount]}>{value}</Text>
            </View>)}
        </View>
        <Pressable accessibilityRole="button" accessibilityHint="Открывает цель и накопления" onPress={() => props.onSection('Копилка')}
          style={[styles.goal, short && !large && styles.shortGoal, large && styles.largeGoal]} testID="home-goal">
          {!large && goalImage && failedGoal !== goal?.id && <View style={[styles.goalArt, short && styles.shortGoalArt]}>
            <Image accessible={false} source={goalImage} onError={() => setFailedGoal(goal!.id)} resizeMode="contain" style={[styles.goalImage, short && styles.shortGoalImage]} />
          </View>}
          <View style={styles.goalCopy}>
            <Text style={[styles.goalTitle, large && styles.largeGoalTitle]}>{large ? 'Цель: ' : 'Мечта · '}{goalName}</Text>
            {goal ? <>
              <Text style={styles.caption}>{life.savings} из {goal.cost}{short && !large ? (remaining === 0 ? '' : ' · ещё ' + remaining) : ' монет'}</Text>
              {!large && <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: goal.cost, now: Math.min(life.savings, goal.cost) }} style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(100, life.savings / goal.cost * 100)}%` }]} />
              </View>}
              {(!short || large || remaining === 0) && <Text style={styles.caption}>{remaining === 0 ? 'Можно получить мечту' : 'Осталось ' + remaining}</Text>}
            </> : <Text style={styles.caption}>{allGoals ? 'Ты умеешь копить!' : 'На что будем копить?'}</Text>}
          </View>
          <View style={large && styles.goalChevron}><Icon name="arrow" size={large ? 14 : 18} /></View>
        </Pressable>
      </View>

      <View style={[styles.scene, short && styles.shortScene, large && [styles.largeScene, { height: canSkip ? Math.max(144, portraitSize) : portraitSize }]]} onLayout={({ nativeEvent: { layout } }) => setSceneSize(layout)} testID="home-scene-space">
        {reactionCaption && <Text pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.reactionCaption, large && styles.largeReactionCaption]}>{reactionCaption}</Text>}
        {!large && <>
          <View pointerEvents="none" style={styles.roomArch} /><View pointerEvents="none" style={styles.roomLight} />
          <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={styles.roomWindow}>
            <View style={styles.windowVertical} /><View style={styles.windowHorizontal} />
          </View>
          <View pointerEvents="none" style={styles.roomFloor} />
          <View pointerEvents="none" style={[styles.rug, { top: petRegion.y + petRegion.height - 18 }]} />
          {!short && <View style={styles.identity}><Text style={styles.petName}>{profile.name}</Text><Text style={styles.caption}>{model.dayLabel}{props.demo ? ' · Демо' : ''}</Text></View>}
          {canSkip && <View style={styles.sceneMenu}>{skipButton}</View>}
        </>}
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={large ? [styles.portrait, { width: portraitSize, height: portraitSize }] : StyleSheet.absoluteFill}>
          <FinniHomeScene key={profile.shapeId + '-' + profile.patternId} accessibilityLabel={profile.name + '. ' + food + '. ' + care + '. ' + mood}
            careLabel={food + '. ' + care} height={large ? portraitSize : sceneSize.height} paused={props.scenePaused || Boolean(props.notice) || growthOpen}
            motionEnabled={props.motionEnabled} soundEnabled={props.soundEnabled} stage={life.petStage} appearance={profile} reaction={props.reaction}
            onReactionFinished={handleReactionFinished} onReactionCancelled={handleReactionCancelled}
            showCaption={false} sceneStyle="quiet" portrait={large} fullscreen petRegion={petRegion} hideSkip skipReactionId={skipReactionId} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={profile.name + ', стадия ' + life.petStage + '. ' + mood + '. Изменить питомца'} onPress={props.onEditPet}
          style={large ? [styles.portraitTarget, { width: portraitSize, height: portraitSize }] : [styles.petTarget, { left: petRegion.x, top: petRegion.y + (short ? 48 : 24), width: petRegion.width, height: Math.max(48, petRegion.height - (short ? 48 : 24)) }]} testID="home-pet-target" />
        <Pressable accessibilityRole="button" accessibilityLabel="Как растёт Финни" onPress={() => setGrowthOpen(true)}
          style={({ pressed }) => [styles.growthButton, large && styles.largeGrowthButton, pressed && styles.pressed]} testID="home-growth-help">
          <Text style={styles.growthButtonText}>Как растёт?</Text>
        </Pressable>
        {state}
      </View>

      <Pressable accessibilityRole="button" accessibilityHint="Открывает это занятие" disabled={props.busy} accessibilityState={{ disabled: props.busy }} onPress={props.onLesson}
        style={({ pressed }) => [styles.lesson, short && !large && styles.shortLesson, large && styles.largeLesson, pressed && styles.pressed]} testID="home-lesson">
        {!large && <View style={styles.lessonIcon}><Icon name="book" size={26} /></View>}
        <View style={styles.lessonCopy}><Text style={styles.caption}>Занятие</Text><Text style={[styles.lessonTitle, large && styles.largeLessonTitle]}>{props.lessonTitle ?? 'Выбери занятие'}</Text></View>
        <View style={large && styles.lessonChevron}><Icon name="arrow" size={20} /></View>
      </Pressable>
      <View style={[styles.footer, large && styles.largeFooter]} testID="home-footer">{large && menuButton}{primary}</View>
    </View>

    <Modal visible={Boolean(props.notice)} transparent onRequestClose={props.onDismissNotice} accessibilityViewIsModal>
      <View style={styles.noticeOverlay}><View style={styles.noticeCard}><Text accessibilityLiveRegion="polite" style={styles.body}>{props.notice}</Text><MenuRow label="Понятно" onPress={props.onDismissNotice} /></View></View>
    </Modal>
    <Modal visible={growthOpen} transparent onRequestClose={() => setGrowthOpen(false)} accessibilityViewIsModal>
      <View style={styles.noticeOverlay}><ScrollView style={styles.growthCard} contentContainerStyle={styles.growthContent}>
        <Text accessibilityRole="header" style={styles.growthTitle}>Как растёт Финни?</Text>
        <Text style={styles.body}>Сейчас стадия {life.petStage} из 3: {life.petStage === 1 ? 'Малыш' : life.petStage === 2 ? 'Исследователь' : 'Мастер планов'}.</Text>
        <Text style={styles.body}>Финни делает шаги роста после завершения дня. Помогают еда и уход, выполненный план и новые монеты в копилке. Покупка сама по себе не меняет стадию.</Text>
        <Text style={styles.body}>Исследователем он станет после 2 завершённых дней и 6 шагов роста. Мастером планов — после 5 дней, 12 шагов и новых накоплений хотя бы в 3 днях.</Text>
        <Text style={styles.body}>В итогах дня видно, сколько шагов он получил и почему.</Text>
        <MenuRow label="Понятно" onPress={() => setGrowthOpen(false)} />
      </ScrollView></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F0E6' },
  home: { flex: 1, padding: 12, gap: 10 }, shortHome: { padding: 10, gap: 6 }, largeHome: { padding: 10, gap: 8 },
  body: { color: '#3D352D', includeFontPadding: false, fontSize: 16, lineHeight: 22 },
  caption: { color: '#665444', includeFontPadding: false, fontSize: 12, lineHeight: 15 },
  finances: { borderRadius: 24, backgroundColor: '#FFFCF6', padding: 14, paddingBottom: 12 },
  shortFinances: { padding: 10 }, shortMoney: { paddingBottom: 6 }, shortAmount: { fontSize: 20, lineHeight: 23 },
  shortGoal: { minHeight: 54, paddingTop: 6, gap: 8 }, shortGoalArt: { width: 48, height: 48, borderRadius: 14 }, shortGoalImage: { width: 46, height: 46 },
  largeFinances: { padding: 10, borderRadius: 22 },
  money: { flexDirection: 'row', gap: 16, paddingBottom: 10 }, largeMoney: { flexDirection: 'column', gap: 2, paddingBottom: 6 },
  metric: { flex: 1, gap: 2 }, largeMetric: { flex: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  amount: { color: '#3D352D', includeFontPadding: false, fontSize: 24, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  largeAmount: { fontSize: 16, lineHeight: 18, fontWeight: '600' },
  goal: { minHeight: 72, borderTopWidth: 1, borderTopColor: '#EAE0D1', paddingTop: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  largeGoal: { minHeight: 48, paddingTop: 6 },
  goalChevron: { position: 'absolute', right: 0, bottom: 0 },
  lessonChevron: { position: 'absolute', right: 10, top: 10 },
  goalArt: { width: 62, height: 64, borderRadius: 17, backgroundColor: '#F4E8D0', alignItems: 'center', justifyContent: 'center' },
  goalImage: { width: 58, height: 58 }, goalCopy: { flex: 1, gap: 3 },
  goalTitle: { color: '#3D352D', includeFontPadding: false, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  largeGoalTitle: { fontSize: 14, lineHeight: 16 },
  track: { height: 5, borderRadius: 3, backgroundColor: '#E8DECC', marginVertical: 1 },
  fill: { height: 5, borderRadius: 3, backgroundColor: '#5F7754' },
  scene: { flex: 1, minHeight: 180, borderRadius: 28, backgroundColor: '#EDE2CD', overflow: 'hidden' },
  shortScene: { minHeight: 130 },
  reactionCaption: { position: 'absolute', zIndex: 4, top: 6, left: 6, right: 6, overflow: 'hidden', borderRadius: 12, padding: 8, backgroundColor: '#FFFCF6', color: '#3D352D', textAlign: 'center', fontSize: 15, lineHeight: 20, fontWeight: '700' },
  largeReactionCaption: { left: 158, right: 0, top: 0 },
  growthButton: { position: 'absolute', zIndex: 3, right: 6, bottom: 46, minHeight: 40, justifyContent: 'center', borderRadius: 14, paddingHorizontal: 10, backgroundColor: '#FFFCF6' },
  largeGrowthButton: { bottom: 0, right: 0 },
  growthButtonText: { color: '#5C3C2E', fontSize: 14, fontWeight: '700' },
  roomArch: { position: 'absolute', width: '76%', height: '105%', top: '9%', left: '12%', borderTopLeftRadius: 160, borderTopRightRadius: 160, backgroundColor: '#F5ECDC' },
  roomLight: { position: 'absolute', top: -30, left: -24, width: 110, height: '110%', backgroundColor: '#FBF3E2', opacity: .55, transform: [{ rotate: '24deg' }] },
  roomFloor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%', backgroundColor: '#DDC9A8' },
  rug: { position: 'absolute', left: '12%', width: '76%', height: 42, borderRadius: '50%', backgroundColor: homeColors.rug, borderWidth: 5, borderColor: homeColors.rugEdge },
  roomWindow: { position: 'absolute', top: 16, right: 14, width: 64, height: 76, borderRadius: 20, borderWidth: 6, borderColor: homeColors.windowFrame, backgroundColor: homeColors.sky, overflow: 'hidden' },
  windowVertical: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 3, marginLeft: -1.5, backgroundColor: homeColors.windowFrame },
  windowHorizontal: { position: 'absolute', left: 0, right: 0, top: '50%', height: 3, marginTop: -1.5, backgroundColor: homeColors.windowFrame },
  identity: { position: 'absolute', left: 16, top: 13 },
  petName: { color: '#594737', fontSize: 18, lineHeight: 23, fontWeight: '600', includeFontPadding: false },
  skipButton: { minWidth: 80, minHeight: 48, padding: 6, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: '#FFFCF6' },
  sceneMenu: { position: 'absolute', top: 6, right: 6, zIndex: 2 },
  menuButton: { minWidth: 60, minHeight: 48, padding: 8, gap: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#FFFCF6' },
  largeMenuButton: { minWidth: 86, minHeight: 56, padding: 8 },
  petTarget: { position: 'absolute', minWidth: 48, minHeight: 48 },
  state: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', padding: 7, gap: 5, backgroundColor: '#F9F2E7' },
  shortState: { paddingHorizontal: 2, gap: 2 },
  stateItem: { flexDirection: 'row', gap: 4, alignItems: 'center', flexShrink: 1 }, stateText: { fontSize: 13, lineHeight: 17, flexShrink: 1 },
  largeScene: { flex: 0, minHeight: 112, height: 112, overflow: 'visible', backgroundColor: 'transparent', flexDirection: 'row', borderRadius: 0 },
  portrait: { position: 'absolute', width: 112, height: 112, borderRadius: 28, overflow: 'hidden', backgroundColor: '#EBDDCA' },
  portraitTarget: { position: 'absolute', left: 0, top: 0, width: 112, height: 112 },
  largeState: { position: 'relative', marginLeft: 122, flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 1, padding: 0, backgroundColor: 'transparent' },
  largeStateItem: { flexDirection: 'row', flexShrink: 0 },
  lesson: { minHeight: 68, borderRadius: 22, backgroundColor: '#FFFCF6', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  lessonIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEE7D5', alignItems: 'center', justifyContent: 'center' },
  shortLesson: { minHeight: 56, padding: 8 }, shortPrimary: { minHeight: 48 },
  lessonCopy: { flex: 1, gap: 3 },
  lessonTitle: { color: '#3D352D', includeFontPadding: false, fontSize: 16, lineHeight: 20, fontWeight: '600' },
  largeLesson: { minHeight: 48, padding: 10, borderRadius: 20 }, largeLessonTitle: { fontSize: 14, lineHeight: 16 },
  footer: { flexShrink: 0 },
  largeFooter: { marginTop: 'auto', flexDirection: 'row', gap: 8 },
  primary: { minHeight: 50, padding: 10, paddingHorizontal: 16, backgroundColor: '#AE482A', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  largePrimary: { minHeight: 56, flex: 1, padding: 8, justifyContent: 'center' },
  primaryText: { flexShrink: 1, color: '#FFFFFF', includeFontPadding: false, fontSize: 16, lineHeight: 21, fontWeight: '600' },
  largePrimaryText: { fontSize: 14, lineHeight: 17, textAlign: 'center' },
  disabled: { backgroundColor: '#806C5B' },
  pressed: { transform: [{ scale: .96 }] },
  menuRow: { minHeight: 56, borderRadius: 18, padding: 14, backgroundColor: '#FFFCF6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  noticeOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000066' },
  noticeCard: { padding: 20, borderRadius: 24, backgroundColor: '#FFFCF6', gap: 16 },
  growthCard: { flexGrow: 0, maxHeight: '85%', borderRadius: 24, backgroundColor: '#FFFCF6' },
  growthContent: { gap: 14, padding: 20 },
  growthTitle: { color: '#3D352D', fontSize: 23, fontWeight: '700' },
});
