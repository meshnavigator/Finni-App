from pathlib import Path
import shutil,json,hashlib
r=Path('artifacts/sprint-9/S9-003-004-details');p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
old='''  backLabel: string;
}>) {
  return (
    <View style={styles.page} accessibilityLabel="Каталог учебных занятий">
      <ScrollView contentContainerStyle={styles.catalogContent}>'''
new='''  backLabel: string;
}>) {
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (props.message) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [props.message]);
  return (
    <View style={styles.page} accessibilityLabel="Каталог учебных занятий">
      <ScrollView ref={scroll} contentContainerStyle={styles.catalogContent}>'''
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s,encoding='utf-8')
for name in ['build.log','verify.log','states.log']:
 shutil.copy2(r/name,r/(name.replace('.log','-before-error-focus.log')))
for ext in ['xml','png']:
 shutil.copy2(r/'android'/('catalog-storage-error-200.'+ext),r/'before-native'/('catalog-error-unnoticed-200.'+ext))
shutil.copy2(r/'review/catalog-storage-error-200.png',r/'review/catalog-error-unnoticed-200.png')
shutil.copy2(r/'finni-details-review.apk',r/'finni-details-before-error-focus.apk')
(r/'error-focus-change.json').write_text(json.dumps({'beforeApkSha256':hashlib.sha256((r/'finni-details-before-error-focus.apk').read_bytes()).hexdigest(),'change':'Catalog scrollTo(0) on visible error; no geometry, content, domain, data or navigation route changes','reproduction':'Open LS-S02 from bottom of catalog at 360x640/200%; SQLite trigger rejects attempt INSERT; message outside viewport before fix'},indent=2),encoding='utf-8')
