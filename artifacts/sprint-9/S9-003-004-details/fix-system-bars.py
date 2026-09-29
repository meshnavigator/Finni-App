from pathlib import Path
import shutil,json
r=Path('artifacts/sprint-9/S9-003-004-details');p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('<RootSafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Загрузка приложения">','<RootSafeAreaView style={styles.page}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Загрузка приложения">')
s=s.replace('<RootSafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Ошибка загрузки">','<RootSafeAreaView style={styles.page}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.centered} accessibilityLabel="Ошибка загрузки">')
assert s.count('<RootSafeAreaView style={styles.page}><StatusBar style="dark" />')==2;p.write_text(s,encoding='utf-8')
for file in ['verify.log','build.log','qa-lineage.json','resource-qa.json','resource-qa.log']:
 a,b=file.rsplit('.',1);shutil.copy2(r/file,r/(a+'-before-system-bars.'+b))
for name in ['fallback-missing','fallback-corrupt-200','loading-qa-1','loading-qa-2']:
 for ext in ['png','xml']:shutil.copy2(r/'android'/(name+'.'+ext),r/'before-native'/('old-'+name+'.'+ext))
(r/'system-bars-change.json').write_text(json.dumps({'beforeApkSha256':'a2341a9a00b75b99c7150c6d6cf9d1149c807a8382d29346d0df908e542deee0','change':'Only LoadingScreen and ErrorScreen now render StatusBar dark; normal routes and layouts unchanged','evidence':'Real boot-error and QA loading screenshots showed white system icons on warm light background'},indent=2),encoding='utf-8')
