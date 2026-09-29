from pathlib import Path
import importlib.util,json,re
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',root.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q);q.OUT=root/'android'
results=[]
for name,scale,long in [('short-119',1.19,False),('short-119-stress',1.19,True)]:
    q.fixture(long=long);q.start(360,640,scale);nodes=q.capture(name);targets=[];issues=[]
    for n in nodes:
        if n.get('clickable')!='true':continue
        x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));desc=n.get('content-desc') or n.get('resource-id')
        if r-x<48 or b-y<48 or y<24 or b>592:issues.append({'target':desc,'bounds':n['bounds']})
        targets.append((desc,x,y,r,b))
    for i,(a,x,y,r,b) in enumerate(targets):
        for c,xx,yy,rr,bb in targets[i+1:]:
            if min(r,rr)>max(x,xx) and min(b,bb)>max(y,yy):issues.append({'overlap':[a,c]})
    results.append({'case':name,'issues':issues})
    print(name,issues,flush=True)
(root/'font-boundary.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
assert not any(x['issues'] for x in results)

