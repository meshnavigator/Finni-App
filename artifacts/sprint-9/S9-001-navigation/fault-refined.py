from pathlib import Path
import importlib.util,json,re,sqlite3,time,hashlib
from PIL import Image
R=Path(__file__).resolve().parent;F=R/'fault';F.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q);q.OUT=F
results=[];apk=Path('android/app/build/outputs/apk/release/app-release.apk')
def save():(F/'results-refined.json').write_text(json.dumps({'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
def ok(name,**kw):results.append({'case':name,'pass':True,**kw});save();print(name,'PASS',flush=True)
def capture(name):
 for i in range(3):
  try:return q.capture(name)
  except AssertionError:
   if i==2:raise
   time.sleep(.5)
def find(nodes,label):return next(n for n in nodes if n.get('resource-id')==label or n.get('content-desc')==label)
def tap(n):
 x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.15)
def prepare(name,scale=1,long=False):
 q.fixture(long=long)
 with sqlite3.connect(q.FIXTURE) as db:db.execute('UPDATE profile SET pet_name=?',(name,))
 q.adb('push',str(q.FIXTURE),'/data/local/tmp/finni-s9-home.db');q.adb('shell',f'cp /data/local/tmp/finni-s9-home.db {q.REMOTE} && chown 10080:10080 {q.REMOTE} && chmod 600 {q.REMOTE}')
 q.start(360,640,scale);return capture(name+'-'+str(scale))
def logs(name):
 pid=q.adb('shell','pidof',q.PKG).decode().strip();raw=q.adb('logcat','-d','--pid='+pid,'-s','ReactNativeJS:I').decode('utf-8',errors='replace');(F/(name+'.log')).write_text(raw,encoding='utf-8');return raw

def geometry(nodes):
 targets=[]
 for n in nodes:
  if n.get('clickable')!='true':continue
  x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));assert r-x>=48 and b-y>=48 and y>=24 and b<=592,n
  targets.append((n.get('resource-id') or n.get('content-desc'),x,y,r,b))
 for i,(a,x,y,r,b) in enumerate(targets):
  for c,xx,yy,rr,bb in targets[i+1:]:assert min(r,rr)<=max(x,xx) or min(b,bb)<=max(y,yy),(a,c)
 for id in ('home-finances','home-care','home-lesson','home-primary'):
  n=find(nodes,id);x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));assert y>=24 and b<=592,n
 return targets

def review(name):
 im=Image.open(F/(name+'.png'));factor=min(im.width/360,im.height/640);x=(im.width-360*factor)/2;y=(im.height-640*factor)/2
 im.crop((round(x),round(y),round(x+360*factor),round(y+640*factor))).resize((360,640),Image.Resampling.LANCZOS).save(R/'review'/(name+'.png'))
q.adb('install','-r',str(apk.resolve()));original=q.adb('shell','settings','get','global','transition_animation_scale').decode().strip()
try:
 q.adb('shell','settings','put','global','transition_animation_scale','1')
 for scale in (1,1.19,2):
  nodes=prepare('QA-inspired',scale,True);tap(find(nodes,'home-pet-target'));time.sleep(.4);name='skip-visible-'+str(scale);active=capture(name);targets=geometry(active);review(name)
  if scale<=1.2:
   for n in active:
    if n.get('text','').startswith(('Еда:','Уход:','Вдохновлён')):
     x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));assert b-y<=23,n
  if scale==2:assert find(active,'home-sections')['content-desc']=='Меню'
  else:assert find(active,'root-tab-more')['content-desc']=='Ещё'
  tap(find(active,'home-skip-reaction'));time.sleep(.4);after=capture('skip-pressed-'+str(scale));assert not any(n.get('resource-id')=='home-skip-reaction' for n in after)
  time.sleep(10);raw=logs('skip-'+str(scale));assert 'QA static-expression' in raw and raw.count('QA finished ')==1,raw;ok('skip-independent-'+str(scale),targets=targets)
 nodes=prepare('QA-thoughtful',1.19,True);tap(find(nodes,'home-pet-target'));time.sleep(.4);active=capture('thoughtful-119');geometry(active);review('thoughtful-119')
 for n in active:
  if n.get('text','').startswith(('Еда:','Уход:','Задумчиво')):
   x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));assert b-y<=23,n
 ok('thoughtful-119-readable')
finally:
 q.adb('shell','settings','put','global','transition_animation_scale',original)
print('PASS',len(results),'reaction/resource checks',flush=True)
