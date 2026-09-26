from pathlib import Path
import importlib.util,json,re,hashlib,zipfile
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',root.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q);q.OUT=root/'android'
apk=Path('android/app/build/outputs/apk/release/app-release.apk')
result={'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'homeSourceSha256':hashlib.sha256(Path('src/ui/HomeScreen.tsx').read_bytes()).hexdigest(),'checks':[]}
with zipfile.ZipFile(apk) as z:assert 'assets/index.android.bundle' in z.namelist()
result['bundledJavascript']=True
q.adb('install','-r',str(apk.resolve()))
for name,w,h,scale,long,empty in [('ordinary',390,844,1,False,False),('small',360,640,1,False,False),('large',360,640,2,False,False),('large-stress',360,640,2,True,False),('empty',360,640,2,False,True),('empty-small',360,640,1,False,True),('short-119',360,640,1.19,False,False),('short-119-stress',360,640,1.19,True,False)]:
    q.fixture(long=long,empty=empty);q.start(w,h,scale);nodes=q.capture(name);targets=[]
    for expected in ('home-finances','home-care','home-lesson','home-primary','home-pet-target'):
        assert any(n.get('resource-id')==expected for n in nodes),(name,expected)
    if empty and scale==2:assert any('Монеты' in n.get('text','') or 'Монеты' in n.get('content-desc','') for n in nodes)
    for n in nodes:
        if n.get('clickable')!='true':continue
        x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
        assert r-x>=48 and b-y>=48 and y>=24 and b<=h-48,(name,n)
        targets.append((n.get('content-desc') or n.get('resource-id'),x,y,r,b))
    for i,(a,x,y,r,b) in enumerate(targets):
        for c,xx,yy,rr,bb in targets[i+1:]:
            assert min(r,rr)<=max(x,xx) or min(b,bb)<=max(y,yy),(name,a,c)
    if scale==1.19:
        care=next(n for n in nodes if n.get('resource-id')=='room-object-OBJ-CARE')
        lesson=next(n for n in nodes if n.get('resource-id')=='home-lesson')
        care_y=list(map(int,re.findall(r'\d+',care['bounds'])))[1]
        lesson_bottom=list(map(int,re.findall(r'\d+',lesson['bounds'])))[3]
        assert care_y-lesson_bottom>=8,(name,'visual gap',care_y-lesson_bottom)
    result['checks'].append({'case':name,'pass':True})
    (root/'delivery.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(name,'PASS',flush=True)

