from pathlib import Path
import importlib.util,json,re,time,sqlite3
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',root.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=root/'android';q.OUT.mkdir(exist_ok=True)
results=[]
def check(name,w,h,scale):
    q.start(w,h,scale);nodes=q.capture(name);issues=[];targets=[]
    for n in nodes:
        if n.get('clickable')!='true':continue
        x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
        desc=n.get('content-desc') or n.get('resource-id')
        if r-x<48 or b-y<48 or b>h-48:issues.append({'target':desc,'bounds':n['bounds']})
        targets.append((desc,x,y,r,b))
    for i,(a,x,y,r,b) in enumerate(targets):
        for c,xx,yy,rr,bb in targets[i+1:]:
            if min(r,rr)>max(x,xx) and min(b,bb)>max(y,yy):
                issues.append({'overlap':[a,c]})
    for expected in ('home-finances','home-care','home-lesson','home-primary'):
        if not any(n.get('resource-id')==expected for n in nodes):issues.append({'missing':expected})
    results.append({'case':name,'width':w,'height':h,'scale':scale,'issues':issues})
    (root/'native-matrix.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print(name,issues,flush=True);return nodes
q.fixture(long=True)
for w,h in ((360,640),(390,844),(412,915)):
    for scale in (1,1.5,2):check('stress-'+str(w)+'-'+str(scale),w,h,scale)
for state in ('DRAFT','READY','WAITING'):
    q.fixture(long=True,state=state);check(state,360,640,2)
q.fixture(empty=True);check('empty',360,640,2)
q.fixture()
nodes=check('smoke-home',390,844,1)
def tap(n):
    x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.5)
def find(nodes,text):return next(n for n in nodes if text in n.get('content-desc','') or n.get('resource-id')==text)
for label in ('room-object-OBJ-PLANNER','room-object-OBJ-CARE','room-object-OBJ-CHEST','Прогресс','Для\nвзрослого','Как играть'):
    tap(find(nodes,label));opened=q.capture('smoke-'+str(len(results)))
    assert not any(n.get('resource-id')=='home-primary' for n in opened),label
    q.adb('shell','input','keyevent','4');time.sleep(.5);nodes=q.capture('smoke-return')
    assert any(n.get('resource-id')=='home-primary' for n in nodes),label
    results.append({'case':'route-'+label,'issues':[]})
q.start(360,640,2);nodes=q.capture('menu-before');tap(find(nodes,'home-sections'));nodes=q.capture('menu-open')
assert not any(n.get('resource-id')=='home-primary' for n in nodes)
q.adb('shell','input','keyevent','4');time.sleep(.3)
assert any(n.get('resource-id')=='home-primary' for n in q.capture('menu-closed'))
results.append({'case':'modal-back-isolation','issues':[]})
q.adb('shell','am','force-stop',q.PKG)
db=root/'smoke-wallet.db';db.write_bytes(q.adb('exec-out','cat',q.REMOTE))
with sqlite3.connect(db) as conn:wallet=conn.execute('select available,savings from wallet_projection').fetchall()
assert wallet==[(100,0)],wallet
results.append({'case':'navigation-keeps-wallet','wallet':wallet,'issues':[]})
(root/'native-matrix.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
assert not any(r['issues'] for r in results),results