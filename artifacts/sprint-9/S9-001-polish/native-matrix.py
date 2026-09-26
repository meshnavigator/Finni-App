from pathlib import Path
import importlib.util,json,re,time,hashlib
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',root.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=root/'android';q.OUT.mkdir(exist_ok=True)
results=[]
apk=Path('android/app/build/outputs/apk/release/app-release.apk')
q.adb('install','-r',str(apk.resolve()))
def save():
    (root/'native-matrix.json').write_text(json.dumps({'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
def check(name,w,h,scale):
    q.start(w,h,scale);nodes=q.capture(name);issues=[];targets=[]
    for n in nodes:
        if n.get('clickable')!='true':continue
        x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
        desc=n.get('content-desc') or n.get('resource-id')
        if r-x<48 or b-y<48 or y<24 or b>h-48:issues.append({'target':desc,'bounds':n['bounds']})
        targets.append((desc,x,y,r,b))
    for i,(a,x,y,r,b) in enumerate(targets):
        for c,xx,yy,rr,bb in targets[i+1:]:
            if min(r,rr)>max(x,xx) and min(b,bb)>max(y,yy):issues.append({'overlap':[a,c]})
    for expected in ('home-finances','home-care','home-lesson','home-primary','home-pet-target'):
        if not any(n.get('resource-id')==expected for n in nodes):issues.append({'missing':expected})
    if scale==1:
        for obj in ('PLANNER','CARE','CHEST'):
            n=next(n for n in nodes if n.get('resource-id')=='room-object-OBJ-'+obj)
            x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
            assert (r-x,b-y)==(78,72),(name,obj,n['bounds'])
    results.append({'case':name,'width':w,'height':h,'scale':scale,'issues':issues})
    save();print(name,issues,flush=True);return nodes
for name,w,h,scale,long in [('ordinary',390,844,1,False),('small',360,640,1,False),('large',360,640,2,False),('large-stress',360,640,2,True)]:
    q.fixture(long=long);check(name,w,h,scale)
q.fixture(long=True)
for w,h in ((360,640),(390,844),(412,915)):
    for scale in (1,1.5,2):check('stress-'+str(w)+'-'+str(scale),w,h,scale)
for state in ('DRAFT','READY','WAITING'):
    q.fixture(long=True,state=state);check(state,360,640,2)
q.fixture(empty=True);nodes=check('empty',360,640,2)
assert any('Монеты' in n.get('text','') or 'Монеты' in n.get('content-desc','') for n in nodes)
q.fixture(empty=True);check('empty-small',360,640,1)
for name,w,h,scale,stage,shape,pattern in [('small-stage1',360,640,1,1,'floppy','stripes'),('small-stage3',360,640,1,3,'round','spots'),('ordinary-stage3',390,844,1,3,'floppy','plain'),('large-stage3',360,640,2,3,'round','stripes')]:
    q.fixture(stage=stage,shape=shape,pattern=pattern);check(name,w,h,scale)
q.fixture();nodes=check('smoke-home',390,844,1)
def tap(n):
    x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.5)
def find(nodes,text):return next(n for n in nodes if text in n.get('content-desc','') or n.get('resource-id')==text)
for label in ('room-object-OBJ-PLANNER','room-object-OBJ-CARE','room-object-OBJ-CHEST','home-goal','Прогресс','Для\nвзрослого','Как играть'):
    tap(find(nodes,label));opened=q.capture('route-'+str(len(results)))
    assert not any(n.get('resource-id')=='home-primary' for n in opened),label
    q.adb('shell','input','keyevent','4');time.sleep(.5);nodes=q.capture('route-return')
    assert any(n.get('resource-id')=='home-primary' for n in nodes),label
    results.append({'case':'route-'+label,'issues':[]});save()
# Read public Home presentation only; no private database is copied from the AVD.
for expected in ('Доступно: 100 монет','Копилка: 0 монет'):
    assert any(n.get('content-desc')==expected for n in nodes),expected
results.append({'case':'navigation-keeps-visible-wallet','available':100,'savings':0,'issues':[]})
q.start(360,640,2);nodes=q.capture('menu-before');tap(find(nodes,'home-sections'));nodes=q.capture('menu-open')
assert not any(n.get('resource-id')=='home-primary' for n in nodes)
q.adb('shell','input','keyevent','4');time.sleep(.3)
assert any(n.get('resource-id')=='home-primary' for n in q.capture('menu-closed'))
results.append({'case':'modal-back-isolation','issues':[]})
save()
assert not any(r['issues'] for r in results),results
print('PASS',len(results),'checks',flush=True)

