from pathlib import Path
import importlib.util,json,re,hashlib
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',root.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q);q.OUT=root/'android'
apk=Path('android/app/build/outputs/apk/release/app-release.apk')
q.adb('install','-r',str(apk.resolve()))
result={'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'checks':[]}
for name,w,h,scale,empty in [('ordinary',390,844,1,False),('large',360,640,2,False),('empty-delivery',360,640,2,True)]:
    q.fixture(empty=empty);q.start(w,h,scale);nodes=q.capture(name)
    for expected in ('home-finances','home-care','home-lesson','home-primary'):
        assert any(n.get('resource-id')==expected for n in nodes),expected
    if empty:assert any('Монеты' in n.get('text','') or 'Монеты' in n.get('content-desc','') for n in nodes)
    for n in nodes:
        if n.get('clickable')=='true':
            x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));assert r-x>=48 and b-y>=48 and b<=h-48,n
    result['checks'].append({'case':name,'pass':True})
    print(name,'PASS',flush=True)
(root/'delivery.json').write_text(json.dumps(result,indent=2),encoding='utf-8')