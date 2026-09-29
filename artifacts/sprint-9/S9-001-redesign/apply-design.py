from pathlib import Path
p=Path('src/ui/HomeScreen.tsx');s=p.read_text()
Path('artifacts/sprint-9/S9-001-redesign/HomeScreen.before.tsx.txt').write_text(s,encoding='utf-8')
a=s.index('function RouteButton');b=s.index('/** Home owns')
s=s[:a]+"""const HOME_ICONS = {
  home: require('../../assets/ui/home/home.png'),
  progress: require('../../assets/ui/home/progress.png'),
  adult: require('../../assets/ui/home/adult.png'),
  help: require('../../assets/ui/home/help.png'),
};
function RouteButton({ label, onPress, selected = false, icon }: Readonly<{ label: string; onPress: () => void; selected?: boolean; icon?: keyof typeof HOME_ICONS }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.route, icon && styles.railRoute, pressed && styles.pressed]}>{icon && <Image accessible={false} source={HOME_ICONS[icon]} style={styles.routeIcon} />}<Text style={styles.routeText}>{label}</Text></Pressable>;
}

"""+s[b:]
s=s.replace('styles.primaryText, large && styles.largeText','styles.primaryText, large && styles.largePrimaryText')
s=s.replace('<Text style={text}>{food}</Text><Text style={text}>{care}</Text><Text accessibilityLabel=', '<Text style={large ? small : styles.statusText}>{food}</Text><Text style={large ? small : styles.statusText}>{care}</Text><Text accessibilityLabel=')
s=s.replace('style={text}>{mood}', 'style={large ? small : styles.statusText}>{mood}')
a=s.index('        {!large && <View style={styles.header}');b=s.index('        <View style={[styles.summary',a);s=s[:a]+s[b:]
s=s.replace('          {large && <Text style={small}>Монеты</Text>}\n','')
a=s.index('          <View style={[styles.money');b=s.index('          <Pressable accessibilityRole="button" accessibilityHint="Открывает цель',a)
s=s[:a]+"""          <View style={[styles.money, large && styles.largeMoney]}>{[['Доступно', life.available], ['Копилка', life.savings]].map(([label, value]) => <View key={label} accessible accessibilityLabel={label + ': ' + value + ' монет'} style={[styles.metric, large && styles.largeMetric]}>{!large && <Image accessible={false} source={OBJECT_SOURCES[label === 'Доступно' ? 'OBJ-COIN' : 'OBJ-CHEST']} style={styles.moneyIcon} />}<View style={large ? styles.largeMetricContent : styles.metricContent}><Text style={small}>{large ? label : label + ', монет'}</Text><Text style={[styles.amount, large && styles.largeAmount]}>{value}</Text></View></View>)}</View>
"""+s[b:]
s=s.replace('{large && <Text style={small}>Цель</Text>}','')
s=s.replace('>{large ? goalName :', '>{false ? goalName :')
s=s.replace('<Text style={text}>{life.savings} / {goal.cost}</Text><Text style={text}>Осталось {remaining}</Text>','<Text style={small}>{life.savings} из {goal.cost} монет</Text><Text style={small}>Осталось {remaining}</Text>')
s=s.replace('{life.savings} / {goal.cost} монет', '{life.savings} из {goal.cost} монет')
s=s.replace('x: layout.x + 2, y: layout.y, width: layout.width * .27', 'x: layout.x, y: layout.y, width: 104')
a=s.index('          <View style={styles.inlineState}>');b=s.index('            <Pressable accessibilityRole="button" accessibilityLabel=',a)
s=s[:a]+"""          <View style={styles.sceneSpace} onLayout={({ nativeEvent: { layout } }) => setRegion({ x: layout.x + 4, y: layout.y + 140, width: Math.max(80, layout.width - 92), height: Math.max(60, layout.height - 208) })}>
            <View style={styles.sceneCopy}><Pressable accessibilityRole="button" accessibilityLabel={'О питомце: ' + profile.name + '. ' + model.dayLabel} onPress={props.onEditPet} style={styles.identity}><Text style={[styles.text, styles.bold]}>{profile.name}</Text><Text style={styles.small}>{model.dayLabel}{props.demo ? ' · Демо' : ''}</Text></Pressable><View style={styles.inlineState}>{state}</View>{lesson}</View>
"""+s[b:]
a=s.index('            <View style={styles.rightRail}>');b=s.index('              <View pointerEvents=',a)
s=s[:a]+"""            <View style={styles.rightRail}><RouteButton icon="progress" label="Прогресс" onPress={() => props.onSection('Прогресс')} /><RouteButton icon="adult" label={'Для\\nвзрослого'} onPress={() => props.onSection('Для взрослого')} /><RouteButton icon="help" label={canSkip ? 'Пропустить' : 'Как играть'} onPress={canSkip ? () => setSkipReactionId(props.reaction!.id) : props.onHelp} /></View>
"""+s[b:]
s=s.replace("['OBJ-PLANNER', 'Планер', 'План'], ['OBJ-GOAL-DISPLAY', 'Цель', 'Копилка'], ['OBJ-CARE', 'Забота', 'Покупки'], ['OBJ-CHEST', 'Копилка', 'Копилка'],", "['OBJ-PLANNER', 'Планер', 'План'], ['OBJ-CARE', 'Забота', 'Покупки'], ['OBJ-CHEST', 'Копилка', 'Копилка'],")
s=s.replace('style={styles.navItem}><Text',"""style={[styles.navItem, label === 'Домик' && styles.navSelected]}>{label === 'Домик' ? <Image accessible={false} source={HOME_ICONS.home} style={styles.navIcon} /> : <Image accessible={false} source={OBJECT_SOURCES[label === 'План' ? 'OBJ-PLANNER' : label === 'Покупки' ? 'OBJ-CARE' : 'OBJ-CHEST']} style={styles.navIcon} />}<Text""")
s=s[:s.index('const styles = StyleSheet.create')]+"""const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F1E8' },
  home: { flex: 1 }, hud: { padding: 12, gap: 10 }, largeHud: { padding: 10, gap: 8, backgroundColor: '#F8F1E8E8' },
  text: { color: '#302D2A', fontSize: 15, lineHeight: 19 }, largeText: { fontSize: 14, lineHeight: 16.5 },
  small: { color: '#645B50', fontSize: 12, lineHeight: 16 }, largeSmall: { fontSize: 12, lineHeight: 14 },
  bold: { fontWeight: '600' }, statusText: { color: '#51493F', fontSize: 12, lineHeight: 17 },
  identity: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, paddingTop: 6 },
  summary: { backgroundColor: '#FFFAF4', padding: 12, borderRadius: 22 }, largeSummary: { padding: 10, borderRadius: 20 },
  money: { flexDirection: 'row', gap: 10 }, largeMoney: { flexDirection: 'column', gap: 2 },
  metric: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }, metricContent: { flex: 1 },
  moneyIcon: { width: 28, height: 28, resizeMode: 'contain' },
  largeMetric: { flex: 0 }, largeMetricContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  amount: { color: '#302D2A', fontSize: 20, lineHeight: 25, fontWeight: '700', fontVariant: ['tabular-nums'] },
  largeAmount: { fontSize: 16, lineHeight: 18, fontWeight: '600' },
  goal: { minHeight: 48, paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: '#E9DFD1' },
  largeGoal: { paddingTop: 6, marginTop: 6 },
  track: { height: 5, borderRadius: 3, backgroundColor: '#E9E1D4', marginTop: 6 }, fill: { height: 5, backgroundColor: '#688863', borderRadius: 3 },
  sceneCopy: { width: '74%', backgroundColor: '#FFFAF4', borderRadius: 20 },
  state: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 0 },
  inlineState: { paddingHorizontal: 12, paddingBottom: 6 },
  largeState: { flexDirection: 'column', flexWrap: 'nowrap', gap: 0, marginLeft: 112, padding: 8, borderRadius: 20, backgroundColor: '#FFFAF4', flex: 1 },
  lesson: { backgroundColor: '#FFFAF4', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, minHeight: 54, justifyContent: 'center' },
  largeLesson: { padding: 10, borderRadius: 20 },
  sceneSpace: { flex: 1, minHeight: 260 },
  rightRail: { position: 'absolute', right: 0, top: 0, width: 78, gap: 8 },
  route: { backgroundColor: '#FFFAF4', borderRadius: 18, minHeight: 48, minWidth: 48, padding: 10, justifyContent: 'center' },
  railRoute: { minHeight: 70, paddingVertical: 8, paddingHorizontal: 3 },
  routeIcon: { width: 28, height: 28, alignSelf: 'center', marginBottom: 4 },
  routeText: { fontSize: 12, lineHeight: 15, color: '#514537', textAlign: 'center' },
  pressed: { opacity: .8, transform: [{ scale: .96 }] },
  objects: { position: 'absolute', left: 0, bottom: 0, right: 0, height: 62 },
  plannerAnchor: { left: 0, bottom: 0 }, careAnchor: { left: '41%', bottom: 0 }, goalAnchor: { right: 0, top: 0 }, chestAnchor: { right: 0, bottom: 0 },
  object: { position: 'absolute', width: 68, height: 62, alignItems: 'center', justifyContent: 'center' },
  objectImage: { width: 46, height: 42 }, objectLabel: { backgroundColor: '#FFFAF4', borderRadius: 8, color: '#514537', fontSize: 12, lineHeight: 16, paddingHorizontal: 6, paddingVertical: 1 },
  table: { position: 'absolute', left: 3, right: 3, top: 37, height: 5, borderRadius: 2, backgroundColor: '#9C7047' }, tableLeftLeg: { position: 'absolute', left: 5, top: 5, height: 12, width: 4, backgroundColor: '#805737' }, tableRightLeg: { position: 'absolute', right: 5, top: 5, height: 12, width: 4, backgroundColor: '#805737' }, plannerImage: { position: 'absolute', top: 0 }, plannerLabel: { position: 'absolute', bottom: 0 },
  ordinaryPetTarget: { position: 'absolute', left: 4, top: 140, bottom: 68, right: 88 },
  largePetRow: { minHeight: 108, flexDirection: 'row' }, petTarget: { position: 'absolute', left: 0, width: 104, top: 0, bottom: 0, minHeight: 48, minWidth: 48 },
  footer: { gap: 8, flexShrink: 0 },
  primary: { backgroundColor: '#AE482A', borderRadius: 18, minHeight: 52, padding: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 16, lineHeight: 20, fontWeight: '600', textAlign: 'center' }, largePrimaryText: { color: '#FFFFFF', fontSize: 14, lineHeight: 17 },
  disabled: { backgroundColor: '#84705D' },
  nav: { height: 62, flexDirection: 'row', borderRadius: 22, backgroundColor: '#FFFAF4', padding: 5, gap: 4 },
  navItem: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  navSelected: { backgroundColor: '#F8E6D7' }, navIcon: { width: 24, height: 24, resizeMode: 'contain', marginBottom: 2 },
  largeFooter: { marginTop: 'auto', flexDirection: 'row', gap: 8, minHeight: 56 }, sections: { minHeight: 56, minWidth: 48, backgroundColor: '#FFFAF4', borderRadius: 18, justifyContent: 'center', alignItems: 'center', padding: 8 }, largePrimary: { flex: 1, minHeight: 56 },
  menu: { flex: 1, backgroundColor: '#F8F1E8' }, menuContent: { padding: 16, gap: 8 },
  noticeOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000066' },
});
"""
p.write_text(s,encoding='utf-8')