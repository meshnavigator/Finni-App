from pathlib import Path
p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
def rep(a,b):
 global s
 assert a in s,a
 s=s.replace(a,b)
rep('  View,\n', '  View,\n  useWindowDimensions,\n')
rep("import { AdultAccessSession }", "import { SafeAreaView as RootSafeAreaView } from 'react-native-safe-area-context';\nimport { RootNavigation, RootMenu, MoreScreen } from './RootNavigation.tsx';\nimport { isRootRoute, type RootRoute } from './root-navigation.ts';\nimport { AdultAccessSession }")
rep('  homeScreenModel,','  homeScreenModel,') if '  homeScreenModel,' in s else rep('  errorScreenModel,','  errorScreenModel,\n  homeScreenModel,')
rep("'intro' | 'pet' | 'home'", "'intro' | 'pet' | 'more' | 'home'")
rep("  const returnScreen = useRef<Screen>('home');", "  const returnScreen = useRef<Screen>('home');\n  const detailOrigin = useRef<RootRoute>('home');\n  const { fontScale } = useWindowDimensions();\n  const [rootMenuOpen, setRootMenuOpen] = useState(false);")
rep("  const [boot, setBoot] = useState(0);", "  const [boot, setBoot] = useState(0);\n  const root = isRootRoute(screen);\n  const navigateRoot = (route: RootRoute) => {\n    if (busy) return;\n    setRootMenuOpen(false);\n    setMessage(null);\n    setScreen(route);\n  };\n  const editPet = (origin: RootRoute) => { detailOrigin.current = origin; setMessage(null); setScreen('pet'); };\n  const openCatalog = (origin: RootRoute) => { detailOrigin.current = origin; setMessage(null); setScreen('lesson-catalog'); };")
rep("            setHelpOpen(false);", "            setHelpOpen(false);\n            setRootMenuOpen(false);")
rep("      setReaction(null);\n      setScreen('home');", "      setReaction(null);\n      setScreen(snapshot?.profile ? detailOrigin.current : 'home');")
rep("  const leaveAdult = () => {\n    lockAdult();\n    setMessage(null);\n    setScreen(snapshot?.profile ? 'home' : 'intro');", "  const leaveAdult = () => {\n    lockAdult();\n    setMessage(null);\n    setScreen(snapshot?.profile ? returnScreen.current : 'intro');")
# Hardware Back uses each detail's origin; root peers go home.
rep("      if (screen === 'adult') { adultAccess.current.lock(); setAdultUnlocked(false); }\n      setMessage(null);\n      setScreen(snapshot?.profile ? 'home' : 'intro');", "      if (rootMenuOpen) { setRootMenuOpen(false); return true; }\n      if (screen === 'adult') { adultAccess.current.lock(); setAdultUnlocked(false); }\n      setMessage(null);\n      if (screen === 'lesson') { leaveLesson(); return true; }\n      const back = screen === 'history' || screen === 'adult' ? returnScreen.current\n        : screen === 'pet' || screen === 'lesson-catalog' ? detailOrigin.current : 'home';\n      setScreen(snapshot?.profile ? back : 'intro');")
rep("  }, [busy, screen, snapshot?.profile]);", "  });")
# Root safe area is owned once by the shared shell, detail shells stay as before.
rep('    <>\n      <StatusBar style="dark" />', '''    <RootSafeAreaView style={{ flex: 1, backgroundColor: '#F6F0E6' }} edges={root ? ['top', 'right', 'bottom', 'left'] : []}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }} accessibilityElementsHidden={rootMenuOpen || helpOpen || (screen === 'home' && Boolean(message))}
        importantForAccessibility={rootMenuOpen || helpOpen || (screen === 'home' && message) ? 'no-hide-descendants' : 'auto'}
        pointerEvents={rootMenuOpen || helpOpen || (screen === 'home' && message) ? 'none' : 'auto'}>''')
rep("          onCancel={() => setScreen(snapshot?.profile ? 'home' : 'intro')}", "          onCancel={() => setScreen(snapshot?.profile ? detailOrigin.current : 'intro')}")
rep('          scenePaused={helpOpen}', '          scenePaused={helpOpen || rootMenuOpen}')
rep("          onEditPet={() => { setMessage(null); setScreen('pet'); }}\n          onHelp={() => setHelpOpen(true)}", "          onEditPet={() => editPet('home')}\n          onMenu={() => setRootMenuOpen(true)}")
rep("            else { setMessage(null); setScreen('lesson-catalog'); }", "            else openCatalog('home');")
rep("          onAllLessons={() => { setMessage(null); setScreen('lesson-catalog'); }}\n",'')
rep("          onBack={() => setScreen('home')}\n          onSelect", "          onBack={() => setScreen(detailOrigin.current)}\n          onSelect")
rep('      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}\n','')
# Remove duplicate root return buttons (navigation is persistent).
rep("          onBack={() => { setMessage(null); setScreen('home'); }}\n          onConfirm", "          onConfirm")
rep("          onBack={() => setScreen('home')}\n          onPreview", "          onPreview")
rep("          onBack={() => { setMessage(null); setScreen('home'); }}\n          onClaim", "          onClaim")
rep("      {screen === 'section' && <SectionScreen title={sectionTitle} onBack={() => setScreen('home')} />}\n    </>", '''      {screen === 'section' && <SectionScreen title={sectionTitle} onBack={() => setScreen('home')} />}
      {screen === 'more' && snapshot?.profile && snapshot.lifecycle && <MoreScreen
        name={snapshot.profile.name} day={homeScreenModel(snapshot.profile, snapshot.lifecycle).dayLabel} demo={mode === 'demo'} busy={busy}
        onLessons={() => openCatalog('more')} onProgress={() => void openHistory('more')} onPet={() => editPet('more')}
        onHelp={() => setHelpOpen(true)} onAdult={openAdult} />}
      {root && fontScale <= 1.2 && <RootNavigation selected={screen} disabled={busy} onNavigate={navigateRoot} />}
      {root && fontScale > 1.2 && screen !== 'home' && <Pressable accessibilityRole="button" accessibilityLabel="Меню"
        onPress={() => setRootMenuOpen(true)} style={styles.rootMenuButton} testID="root-menu-button"><Text style={styles.rootMenuText}>Меню</Text></Pressable>}
      </View>
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {root && <RootMenu visible={rootMenuOpen} selected={screen} onClose={() => setRootMenuOpen(false)} onNavigate={navigateRoot} />}
    </RootSafeAreaView>''')
rep('const styles = StyleSheet.create({', "const styles = StyleSheet.create({\n  rootMenuButton: { minHeight: 56, margin: 10, padding: 10, borderRadius: 18, backgroundColor: '#FFFCF6', alignItems: 'center', justifyContent: 'center' },\n  rootMenuText: { color: '#3D352D', fontSize: 16, lineHeight: 22 },")
p.write_text(s,encoding='utf-8')
# Palette/spacing only. Keep domain commands and confirmations intact.
for f in ('BudgetPlanScreen.tsx','SavingsScreen.tsx','ShopScreen.tsx'):
 p=Path('src/ui')/f;s=p.read_text(encoding='utf-8')
 s=s.replace('  onBack: () => void;\n','')
 s=s.replace('          <Button label="Вернуться в домик" onPress={props.onBack} secondary />\n','').replace('        <Button label="Вернуться в домик" onPress={props.onBack} secondary />\n','').replace('    <Button label="Вернуться в домик" onPress={props.onBack} />\n','')
 for a,b in {'#14324A':'#3D352D','#4B6878':'#665444','#EAF6FB':'#F6F0E6','#146B78':'#AE482A','#F7FBFC':'#FFFCF6','#C7DEE5':'#E4D6C1','#FFF3C7':'#F1E5CB','#D5A623':'#9B7847',"backgroundColor: '#FFFFFF'":"backgroundColor: '#FFFCF6'", "fontWeight: '800'":"fontWeight: '600'",'borderRadius: 14':'borderRadius: 22', 'borderRadius: 12':'borderRadius: 18', 'paddingBottom: 36':'paddingBottom: 20', "pressed: { opacity: 0.72 }":"pressed: { transform: [{ scale: .96 }] }"}.items():s=s.replace(a,b)
 s=s.replace('minHeight: 48, paddingHorizontal:', 'minHeight: 48, paddingVertical: 10, paddingHorizontal:')
 if f=='ShopScreen.tsx':
  s=s.replace('Alert, Image, SafeAreaView', 'Alert, Image, Pressable, SafeAreaView')
  s=s.replace('  return <Text accessibilityRole="button" accessibilityState={{ disabled: Boolean(props.disabled) }} onPress={props.disabled ? undefined : props.onPress} style={[styles.button, props.disabled && styles.disabled]}>{props.label}</Text>;', '  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(props.disabled) }} disabled={props.disabled} onPress={props.onPress} style={({ pressed }) => [styles.button, props.disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.buttonText}>{props.label}</Text></Pressable>;')
  s=s.replace('<Text>{item.effect}</Text>', '<Text style={styles.effect}>{item.effect}</Text>')
  s=s.replace("notice: { color: '#665444' }", "notice: { color: '#665444', fontSize: 16, lineHeight: 22 }")
  s=s.replace("name: { fontWeight: '700'", "effect: { color: '#665444', fontSize: 14, lineHeight: 20 }, name: { fontSize: 16, fontWeight: '600'")
  s=s.replace("button: { minHeight: 48, padding: 14, textAlign: 'center', backgroundColor: '#AE482A', color: '#fff', borderRadius: 10, overflow: 'hidden' }", "button: { minHeight: 48, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#AE482A', borderRadius: 18 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }, pressed: { transform: [{ scale: .96 }] }")
 p.write_text(s,encoding='utf-8')
