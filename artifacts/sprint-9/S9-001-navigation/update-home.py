from pathlib import Path
p=Path('src/ui/HomeScreen.tsx');s=p.read_text(encoding='utf-8')
def rep(a,b):
 global s
 assert a in s,a
 s=s.replace(a,b)
rep('Pressable, ScrollView, StyleSheet','Pressable, StyleSheet')
rep("import { SafeAreaView } from 'react-native-safe-area-context';\n",'')
rep('onHelp: () => void; onLesson: () => void; onAllLessons: () => void;', 'onMenu: () => void; onLesson: () => void;')
a=s.index('const ROUTES = [');b=s.index('function Icon',a);s=s[:a]+s[b:]
rep('  const [menu, setMenu] = useState(false);\n','')
rep('  const navigate = (action: () => void) => { setMenu(false); action(); };\n','')
a=s.index('  const menuButton =');b=s.index('  const state =',a)
s=s[:a]+'''  const menuButton = <Pressable accessibilityRole="button" accessibilityLabel="Меню" onPress={props.onMenu}
    style={({ pressed }) => [styles.menuButton, styles.largeMenuButton, pressed && styles.pressed]} testID="home-sections">
    <Text style={styles.caption}>Меню</Text>
  </Pressable>;
  const skipButton = canSkip && <Pressable accessibilityRole="button" accessibilityLabel="Пропустить анимацию" onPress={() => setSkipReactionId(props.reaction!.id)}
    testID="home-skip-reaction" style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}><Text style={styles.caption}>Пропуск</Text></Pressable>;
'''+s[b:]
rep('!large && <Icon name={item.name} size={18}', '!large && !short && <Icon name={item.name} size={16}')
a=s.index('  const navigation =');b=s.index('  return <SafeAreaView',a);s=s[:a]+s[b:]
rep('      </View>)}\n  </View>;','      </View>)}\n    {large && skipButton}\n  </View>;')
rep('<SafeAreaView style={styles.safe}>','<View style={styles.safe}>');rep('</SafeAreaView>;','</View>;')
rep('menu || Boolean(props.notice)','Boolean(props.notice)');rep("menu || props.notice ?", "props.notice ?")
rep("short && !large ? ' · ещё ' + remaining : ' монет'", "short && !large ? (remaining === 0 ? '' : ' · ещё ' + remaining) : ' монет'")
rep('(!short || large) && <Text','(!short || large || remaining === 0) && <Text')
rep('{!large && <Icon name="arrow" size={18} />}','<View style={large && styles.goalChevron}><Icon name="arrow" size={large ? 14 : 18} /></View>')
rep('{ height: portraitSize }]]}', '{ height: canSkip ? Math.max(144, portraitSize) : portraitSize }]]}')
rep('<View style={styles.sceneMenu}>{menuButton}</View>','{canSkip && <View style={styles.sceneMenu}>{skipButton}</View>}')
rep('{!large && <Icon name="arrow" size={20} />}','<View style={large && styles.lessonChevron}><Icon name="arrow" size={20} /></View>')
rep('      {!large && navigation}\n','')
a=s.index('    <Modal visible={menu}');b=s.index('    <Modal visible={Boolean(props.notice)}',a);s=s[:a]+s[b:]
rep("  largeGoal: { minHeight: 48, paddingTop: 6 },", "  largeGoal: { minHeight: 48, paddingTop: 6 },\n  goalChevron: { position: 'absolute', right: 0, bottom: 0 },\n  lessonChevron: { position: 'absolute', right: 10, top: 10 },")
rep("  sceneMenu:", "  skipButton: { minWidth: 80, minHeight: 48, padding: 6, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: '#FFFCF6' },\n  sceneMenu:")
rep('stateText: { fontSize: 11, lineHeight: 14','stateText: { fontSize: 13, lineHeight: 17')
rep("fontSize: 15, lineHeight: 19, fontWeight: '600'", "fontSize: 16, lineHeight: 20, fontWeight: '600'")
# Navigation belongs to the root shell. Remove unused local navigation/menu styles.
for line in ['  nav:','  navItem:','  navText:','  menuContent:','  menuNav:']:
 s='\n'.join(x for x in s.split('\n') if not x.startswith(line))
rep(', shortNav: { minHeight: 56 }, shortNavItem: { minHeight: 48 }','')
p.write_text(s,encoding='utf-8')
