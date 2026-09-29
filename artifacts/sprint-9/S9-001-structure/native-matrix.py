
"""Real Android UIAutomator + screencap evidence for the structural Home."""
from pathlib import Path
import importlib.util,json,re,time,hashlib,sqlite3
from PIL import Image
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'android';q.OUT.mkdir(exist_ok=True)
results=[]
apk=Path('android/app/build/outputs/apk/release/app-release.apk')
def save():
    (R/'native-matrix.json').write_text(json.dumps({'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
def rect(n):return list(map(int,re.findall(r'\d+',n['bounds'])))
def preview(name,w,h):
    out=R/'review';out.mkdir(exist_ok=True)
    im=Image.open(q.OUT/(name+'.png'));scale=min(im.width/w,im.height/h)
    x=(im.width-w*scale)/2;y=(im.height-h*scale)/2
    im.crop((round(x),round(y),round(x+w*scale),round(y+h*scale))).resize((w,h),Image.Resampling.LANCZOS).save(out/(name+'.png'))
def check(name,w,h,scale):
    q.start(w,h,scale);nodes=q.capture(name);issues=[];targets=[];boxes={}
    for n in nodes:
        if n.get('resource-id','').startswith('home-'):boxes[n['resource-id']]=rect(n)
        if n.get('clickable')!='true':continue
        x,y,r,b=rect(n);desc=n.get('content-desc') or n.get('resource-id')
        if r-x<48 or b-y<48 or y<24 or b>h-48:issues.append({'target':desc,'bounds':n['bounds']})
        targets.append((desc,x,y,r,b))
    for i,(a,x,y,r,b) in enumerate(targets):
        for c,xx,yy,rr,bb in targets[i+1:]:
            if min(r,rr)>max(x,xx) and min(b,bb)>max(y,yy):issues.append({'overlap':[a,c]})
    for expected in ('home-finances','home-care','home-lesson','home-primary','home-pet-target'):
        if expected not in boxes:issues.append({'missing':expected})
        elif boxes[expected][1]<24 or boxes[expected][3]>h-48:issues.append({'offscreen':expected,'bounds':boxes[expected]})
    required=['home-finances','home-care','home-lesson','home-footer']
    for a,b in zip(required,required[1:]):
        if a in boxes and b in boxes and boxes[a][3]>boxes[b][1]:issues.append({'contentOverlap':[a,b]})
    content=' '.join(n.get('text','')+' '+n.get('content-desc','') for n in nodes)
    for label in ('Доступно','Копилка','Еда:','Уход:','Спокойно','Занятие'):
        if label not in content:issues.append({'missingText':label})
    if name.startswith('stress') and 'Что изменится, если взять из копилки?' not in content:issues.append({'missingFullLesson':True})
    geometry={}
    if scale<=1.2 and 'home-scene-space' in boxes:
        x,y,r,b=boxes['home-scene-space'];short=h<720
        rw=r-x-48;rh=b-y-(54 if short else 84)
        base=min((rw-8)/520,(rh-12)/568)/1.12
        geometry={'stage2SilhouetteHeight':round(552*base,2),'floorAnchorY':b-(46 if short else 50)}
    results.append({'case':name,'width':w,'height':h,'scale':scale,'issues':issues,'boxes':boxes,'geometry':geometry})
    preview(name,w,h);save();print(name,'PASS' if not issues else json.dumps(issues,ensure_ascii=False),flush=True)
    return nodes
# logcat was cleared by the explicit ADB check before this run.
for long in (False,True):
    q.fixture(long=long)
    for w,h in ((360,640),(390,844),(412,915)):
        for scale in (1,1.5,2):check(('stress' if long else 'normal')+'-'+str(w)+'-'+str(scale),w,h,scale)
for state in ('DRAFT','READY','WAITING'):
    q.fixture(long=True,state=state)
    for scale in (1,1.5,2):check(state+'-360-'+str(scale),360,640,scale)
q.fixture(empty=True)
for scale in (1,1.5,2):check('empty-'+str(scale),360,640,scale)
for long in (False,True):
    q.fixture(long=long);check('boundary119-'+str(long),360,640,1.19)
for shape in ('pointy','round','floppy'):
    for pattern in ('plain','spots','stripes'):
        for stage in (1,2,3):
            q.fixture(shape=shape,pattern=pattern,stage=stage)
            check('appearance-'+shape+'-'+pattern+'-'+str(stage),390,844,1)
        check('portrait-'+shape+'-'+pattern,360,640,2)
for stage in (1,3):
    q.fixture(stage=stage,shape='floppy',pattern='stripes');check('short-stage'+str(stage),360,640,1)
for goal in ('GL-01','GL-02'):
    q.fixture()
    with sqlite3.connect(q.FIXTURE) as db:db.execute('UPDATE goal_selection SET goal_id=?',(goal,))
    q.adb('push',str(q.FIXTURE),'/data/local/tmp/finni-s9-home.db')
    q.adb('shell',f'cp /data/local/tmp/finni-s9-home.db {q.REMOTE} && chown 10080:10080 {q.REMOTE} && chmod 600 {q.REMOTE}')
    for scale in (1,2):check('goal-'+goal+'-'+str(scale),360,640,scale)
raw=q.adb('logcat','-d','-s','ReactNativeJS:E','AndroidRuntime:E').decode('utf-8',errors='replace')
(R/'runtime-errors.log').write_text(raw,encoding='utf-8')
assert not any(r['issues'] for r in results),[(r['case'],r['issues']) for r in results if r['issues']]
print('PASS',len(results),'profiles',flush=True)

