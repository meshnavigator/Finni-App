from pathlib import Path
R=Path('artifacts/sprint-9/S9-001-navigation');s=(R/'native-matrix.py').read_text(encoding='utf-8');a=s.index('# logcat was cleared');s=s[:a]+'''q.adb('install','-r',str(apk.resolve()))
for long in (False,True):
    q.fixture(long=long);check('boundary-1.2-'+str(long),360,640,1.2)
for name,w,h,scale,long in [('delivery-small',360,640,1,False),('delivery-119-stress',360,640,1.19,True),('delivery-200-stress',360,640,2,True)]:
    q.fixture(long=long);check(name,w,h,scale)
assert not any(r['issues'] for r in results),[(r['case'],r['issues']) for r in results if r['issues']]
print('PASS',len(results),'final boundary/layout checks',flush=True)
''';s=s.replace("q.OUT=R/'android'", "q.OUT=R/'boundary-final'").replace("(R/'native-matrix.json')", "(R/'boundary-final.json')");(R/'boundary-final.py').write_text(s,encoding='utf-8')
