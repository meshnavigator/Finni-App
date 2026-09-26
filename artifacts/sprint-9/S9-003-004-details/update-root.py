from pathlib import Path
P=Path('src/ui/AppRoot.tsx');s=P.read_text(encoding='utf-8')
def rep(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b)
rep("import { StatusBar }", "import DetailBack from './DetailBack.tsx';\nimport { palette, screenStyles as ui } from './screen-theme.ts';\nimport { StatusBar }")
rep('  SafeAreaView,\n','')
s=s.replace('<SafeAreaView','<View').replace('</SafeAreaView>','</View>')
rep("edges={root ? ['top', 'right', 'bottom', 'left'] : []}","edges={['top', 'right', 'bottom', 'left']}")
rep('<View accessibilityViewIsModal style={styles.helpOverlay} testID="home-help-overlay">','<RootSafeAreaView accessibilityViewIsModal style={styles.helpOverlay} testID="home-help-overlay">')
rep('<HelpScreen onBack={props.onClose} />\n      </View>','<HelpScreen onBack={props.onClose} />\n      </RootSafeAreaView>')
rep('<View style={styles.centered} accessibilityLabel="Загрузка приложения">','<RootSafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Загрузка приложения">')
rep('<Text style={styles.body}>{loadingScreenModel.message}</Text>\n    </View>','<Text style={styles.body}>{loadingScreenModel.message}</Text>\n    </ScrollView></RootSafeAreaView>')
rep('<View style={styles.centered} accessibilityLabel="Ошибка загрузки">','<RootSafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Ошибка загрузки">')
rep('<ActionButton label="Удалить повреждённые данные" onPress={props.onAdult} secondary />}\n    </View>','<ActionButton label="Удалить повреждённые данные" onPress={props.onAdult} secondary />}\n    </ScrollView></RootSafeAreaView>')
rep('const validation = petNameError(name);','const validation = petNameError(name);\n  const { fontScale } = useWindowDimensions();\n  const largeChoices = usesLargeNavigation(fontScale);')
rep('<Text style={styles.eyebrow}>{props.initial ?', '<DetailBack onPress={props.onCancel} label={props.initial ? "Назад" : "К знакомству"} disabled={props.busy} />\n          <Text style={styles.eyebrow}>{props.initial ?')
rep("'Настрой питомца' : 'Как выглядит Финни?'", "'Имя и внешность' : 'Как выглядит Финни?'")
rep("<PetAvatar name={name || 'Питомец'} shapeId={shapeId} patternId={patternId} size={112} />", "<View style={styles.builderPreview}><PetAvatar name={name || 'Питомец'} shapeId={shapeId} patternId={patternId} size={136} /></View>\n          <View style={styles.profileForm}>")
rep('<View accessibilityRole="radiogroup" style={styles.choiceRow}>','<View accessibilityRole="radiogroup" style={[styles.choiceRow, largeChoices && styles.choiceColumn]}>')
rep('<Text style={styles.validation}>{validation}</Text>', '<Text accessibilityLiveRegion="polite" style={styles.validation}>{validation}</Text>')
rep('{props.saveError && <Text style={styles.validation}>{props.saveError}</Text>}','{props.saveError && <Text accessibilityLiveRegion="polite" style={styles.validation}>{props.saveError}</Text>}\n          </View>')
rep('{props.label}\n      </Text>\n    </Pressable>\n  );\n}\n\nfunction PetBuilder',"{props.selected ? '✓ ' : ''}{props.label}\n      </Text>\n    </Pressable>\n  );\n}\n\nfunction PetBuilder")
rep('<ScrollView contentContainerStyle={styles.introContent}>\n        <Text style={styles.eyebrow}>УЧЕБНЫЕ ЗАНЯТИЯ</Text>','<ScrollView contentContainerStyle={styles.catalogContent}>\n        <DetailBack onPress={props.onBack} label={props.backLabel} />\n        <Text style={styles.eyebrow}>УЧЕБНЫЕ ЗАНЯТИЯ</Text>')
rep('<Text style={styles.body}>Это задания для тренировки:', '<Text style={ui.body}>Это задания для тренировки:')
rep('<Text style={styles.summaryValue}>{lesson.title}</Text>','<Text accessibilityRole="header" style={styles.catalogTitle}>{lesson.title}</Text>')
rep('style={styles.variantButton}','style={({ pressed }) => [styles.variantButton, pressed && ui.pressed]}')
rep('<Text style={styles.variantTitle}>Ситуация {index + 1}</Text>', '<View style={styles.variantHeading}><Text style={styles.variantTitle}>Ситуация {index + 1}</Text><Text accessible={false} style={styles.variantArrow}>›</Text></View>')
s=s.replace('<Text style={styles.title}>','<Text accessibilityRole="header" style={styles.title}>')
start=s.index('const colors = {');end=s.index('const styles = StyleSheet.create(',start)
s=s[:start]+"""const colors = {
  ink: palette.ink, muted: palette.muted, sky: palette.background,
  teal: palette.accent, pale: palette.surface, line: palette.line,
  coral: palette.error, yellow: palette.soft,
};

"""+s[end:]
# Targeted style replacement keeps unrelated legacy/renderer styles intact.
import re
def style(key,value):
 global s
 s,n=re.subn(r'^  '+key+r': \{[^\n]*\},?$', '  '+key+': '+value+',',s,flags=re.M)
 assert n==1,(key,n)
style('centered',"{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: colors.sky }")
style('introContent',"{ alignItems: 'center', gap: 16, padding: 20, paddingBottom: 28 }")
style('builderContent',"{ gap: 14, padding: 18, paddingBottom: 28 }")
style('title',"{ ...ui.title }")
style('eyebrow',"{ ...ui.eyebrow }")
style('body',"{ ...ui.body }")
style('caption',"{ ...ui.body }")
style('cardTitle',"{ ...ui.cardTitle }")
style('action',"{ ...ui.button, alignSelf: 'stretch' }")
style('actionSecondary',"{ ...ui.secondary }")
style('actionText',"{ ...ui.buttonText }")
style('actionSecondaryText',"{ ...ui.secondaryText }")
style('pressed',"{ ...ui.pressed }")
style('directionCard',"{ ...ui.card, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }")
style('directionNumber',"{ backgroundColor: colors.yellow, borderRadius: 18, color: colors.ink, fontSize: 16, fontWeight: '600', textAlign: 'center', minWidth: 36, padding: 6 }")
style('expertLink',"{ color: colors.muted, fontSize: 16, textDecorationLine: 'underline', textAlign: 'center' }")
style('choiceRow',"{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' }")
style('choice',"{ ...ui.button, ...ui.secondary, flexGrow: 1, paddingHorizontal: 12, borderRadius: 14 }")
style('choiceSelected',"{ ...ui.selected }")
style('choiceText',"{ ...ui.buttonText, color: colors.ink }")
style('choiceTextSelected',"{ color: colors.ink }")
style('fieldLabel',"{ color: colors.ink, fontSize: 16, fontWeight: '600', marginTop: 4 }")
style('input',"{ ...ui.input }")
style('validation',"{ ...ui.error }")
style('variantButton',"{ backgroundColor: colors.sky, borderRadius: 14, justifyContent: 'center', minHeight: 56, gap: 6, padding: 12 }")
style('variantTitle',"{ color: colors.teal, fontSize: 16, fontWeight: '600', flex: 1 }")
style('lessonCard',"{ ...ui.card }")
style('helpOverlay',"{ flex: 1, backgroundColor: palette.background }")
s=s.replace('  builderContent:', "  catalogContent: ui.content,\n  catalogTitle: ui.cardTitle,\n  variantHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },\n  variantArrow: { color: palette.muted, fontSize: 26 },\n  builderPreview: { alignSelf: 'center', padding: 12, borderRadius: 28, backgroundColor: palette.soft },\n  profileForm: { ...ui.card, gap: 12 },\n  choiceColumn: { flexDirection: 'column' },\n  builderContent:")
P.write_text(s,encoding='utf-8')
print('AppRoot details, insets, onboarding, pet editor and catalog updated')
