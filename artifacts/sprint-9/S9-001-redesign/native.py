from pathlib import Path
import importlib.util,json,re,sys
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',root.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=root/'android';q.OUT.mkdir(exist_ok=True)
q.adb('install','-r',str(Path('android/app/build/outputs/apk/release/app-release.apk').resolve()))
results=[]
for name,w,h,scale,long in [('ordinary',390,844,1,False),('small',360,640,1,False),('large',360,640,2,False),('large-stress',360,640,2,True)]:
    q.fixture(long=long);q.start(w,h,scale);nodes=q.capture(name)
    issues=[]
    for n in nodes:
        if n.get('clickable')=='true':
            x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
            if r-x<48 or b-y<48 or b>h-48:issues.append({'target':n.get('content-desc'),'bounds':n['bounds']})
    results.append({'case':name,'issues':issues})
    print(name,issues,flush=True)
(root/'first-native.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')