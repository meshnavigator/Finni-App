from pathlib import Path
import importlib.util,json,re,time,hashlib
from PIL import Image
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'delivery';q.OUT.mkdir(exist_ok=True)
results=[];apk=Path('android/app/build/outputs/apk/release/app-release.apk')
def save():(R/'delivery.json').write_text(json.dumps({'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
def ok(name,**kw):results.append({'case':name,'pass':True,**kw});save();print(name,'PASS',flush=True)
def capture(name):
 for i in range(3):
  try:return q.capture(name)
  except AssertionError:
   if i==2:raise
   time.sleep(.5)
def find(nodes,label):
 candidates=[n for n in nodes if n.get('resource-id')==label or n.get('content-desc')==label or n.get('text','').lower()==label.lower()]
 return candidates[0] if candidates else None
def tap(n):
 assert n,'target not found'
 x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.45)
def scrollfind(nodes,label,h=640):
 for i in range(9):
  n=find(nodes,label)
  if n:
   x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
   if b-y>=40:return n
  q.adb('shell','input','swipe','180',str(h-150),'180','180','300');time.sleep(.2);nodes=capture('scroll')
 raise AssertionError(label)
def back(name):q.adb('shell','input','keyevent','4');time.sleep(.4);return capture(name)
def selected(nodes,tab):
 tabs=[n for n in nodes if n.get('resource-id','').startswith('root-tab-')]
 assert len(tabs)==5,(tab,tabs)
 assert [n['resource-id'] for n in tabs if n.get('selected')=='true']==['root-tab-'+tab],tabs
 for n in tabs:
  x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));assert r-x>=48 and b-y>=48,n
 assert any(n.get('resource-id')=='root-navigation' for n in nodes)
def money(nodes,a=100,s=0):
 labels=[n.get('content-desc') for n in nodes]
 assert f'Доступно: {a} монет' in labels and f'Копилка: {s} монет' in labels,labels

def preview(name,w,h):
 im=Image.open(q.OUT/(name+'.png'));factor=min(im.width/w,im.height/h);x=(im.width-w*factor)/2;y=(im.height-h*factor)/2
 im.crop((round(x),round(y),round(x+w*factor),round(y+h*factor))).resize((w,h),Image.Resampling.LANCZOS).save(R/'review'/(name+'.png'))

q.adb('install','-r',str(apk.resolve()))
q.fixture();q.start(390,844,1);nodes=capture('home')
for tab in ('plan','shop','savings','more','home'):
 tap(find(nodes,'root-tab-'+tab));nodes=capture('root-'+tab);selected(nodes,tab);preview('root-'+tab,390,844);ok('delivery-root-'+tab)
tap(find(nodes,'root-tab-more'));nodes=capture('more-editor-start');tap(find(nodes,'Имя и внешность'));editor=capture('editor-before-save');tap(scrollfind(editor,'Готово',844));nodes=capture('editor-saved');selected(nodes,'more');ok('editor-save-returns-more')
tap(find(nodes,'Имя и внешность'));editor=capture('editor-before-cancel');tap(scrollfind(editor,'Отмена',844));nodes=capture('editor-cancelled');selected(nodes,'more');ok('editor-cancel-returns-more')
tap(find(nodes,'root-tab-home'));nodes=capture('final-home');money(nodes)
# A prior catalog visit from More must not hijack the direct Home lesson's Back destination.
tap(find(nodes,'root-tab-more'));more=capture('lesson-origin-more');tap(find(more,'Все занятия'));capture('lesson-origin-catalog');more=back('lesson-origin-back-more');tap(find(more,'root-tab-home'));home=capture('lesson-origin-home');tap(find(home,'home-lesson'));capture('lesson-direct');catalog=back('lesson-direct-back-catalog');assert not find(catalog,'root-navigation');home=back('lesson-direct-back-home');selected(home,'home');nodes=home;ok('direct-home-lesson-clears-prior-more-origin')

tap(find(nodes,'root-tab-savings'));savings=capture('final-transfer-root');tap(find(savings,'Сумма перевода'));q.adb('shell','input','text','20');q.adb('shell','input','keyevent','4');time.sleep(.2);savings=capture('final-transfer-input');tap(find(savings,'Положить'));dialog=capture('final-transfer-confirm');assert not find(dialog,'root-navigation');tap(find(dialog,'Отмена'));nodes=back('final-transfer-cancel-home');money(nodes);ok('delivery-transfer-cancel')
q.start(360,640,2);nodes=capture('large-home');tap(find(nodes,'home-sections'));menu=capture('large-menu');preview('large-menu',360,640)
tap(scrollfind(menu,'root-tab-more'));nodes=capture('large-more');preview('large-more',360,640);tap(scrollfind(nodes,'Для взрослого'));adult=capture('large-adult');assert not find(adult,'root-navigation');assert any('Защита от случайного входа' in n.get('text','') for n in adult);nodes=back('large-adult-back');assert find(nodes,'more-screen');ok('delivery-large-adult-barrier-back')
# Real TalkBack availability and offline bundle evidence are recorded separately.
print('PASS',len(results),'exact delivery checks',flush=True)
