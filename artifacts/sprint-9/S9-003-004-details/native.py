from pathlib import Path
import importlib.util,json,re,time,hashlib,sqlite3
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('q',R.parent/'S9-001-layout/android-qa.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'android';q.OUT.mkdir(exist_ok=True)
(R/'review').mkdir(exist_ok=True)
W,H,S=390,844,1
results=[];shots=[];CURRENT=None
APK=R/'finni-details-review.apk'
def save():
 (R/'runtime.json').write_text(json.dumps({'apkSha256':hashlib.sha256(APK.read_bytes()).hexdigest(),'checks':results,'screens':shots},ensure_ascii=False,indent=2),encoding='utf-8')
def ok(name,**kw):
 results.append({'case':name,'pass':True,**kw});save();print(name,'PASS',flush=True)
def bounds(n):return list(map(int,re.findall(r'\d+',n['bounds'])))
def find(nodes,label):
 return next((n for n in nodes if n.get('resource-id')==label),None) or next((n for n in nodes if n.get('content-desc')==label),None) or next((n for n in nodes if n.get('text','').casefold()==label.casefold()),None)
def match(nodes,text):return next((n for n in nodes if text in n.get('text','') or text in n.get('content-desc','')),None)
def capture(name,review=False):
 global CURRENT
 for i in range(3):
  try:
   if name in ('current','scroll','history-scroll'):
    q.adb('shell','uiautomator','dump','/sdcard/finni-s9.xml')
    raw=q.adb('shell','cat','/sdcard/finni-s9.xml');(q.OUT/(name+'.xml')).write_bytes(raw)
    nodes=[dict(x.attrib) for x in q.ET.fromstring(raw).iter('node')]
   else:nodes=q.capture(name)
   break
  except (AssertionError,ValueError):
   if i==2:raise
   time.sleep(.5)
 if review:
  im=Image.open(q.OUT/(name+'.png'));f=min(im.width/W,im.height/H);x=(im.width-W*f)/2;y=(im.height-H*f)/2
  im.crop((round(x),round(y),round(x+W*f),round(y+H*f))).resize((W,H),Image.Resampling.LANCZOS).save(R/'review'/(name+'.png'))
  shots.append({'name':name,'width':W,'height':H,'fontScale':S});save()
 CURRENT=nodes
 return nodes
def tap(n):
 assert n,'Target missing'
 x,y,r,b=bounds(n);assert r>x and b>y,n
 q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.3)
def swipe(down=True):
 q.adb('shell','input','swipe',str(W//2),str(int(H*.75) if down else int(H*.28)),str(W//2),str(int(H*.28) if down else int(H*.75)),'750');time.sleep(.2)
def scrollfind(nodes,label,limit=40):
 for i in range(limit):
  n=find(nodes,label)
  if n:
   x,y,r,b=bounds(n)
   if b-y>=46 and y>=24 and b<=H-48:return n
  swipe();nodes=capture('scroll')
 raise AssertionError('Scroll target: '+label)
def go(label,nodes=None):
 nodes=nodes or CURRENT or capture('current');tap(scrollfind(nodes,label));return capture('current')
def back():q.adb('shell','input','keyevent','4');time.sleep(.3);return capture('current')
def top():
 for i in range(6):swipe(False)
 return capture('current')
def start(w=390,h=844,scale=1):
 global W,H,S
 W,H,S=w,h,scale;q.start(w,h,scale);return capture('current')
def root(tab,nodes=None):
 nodes=nodes or CURRENT or capture('current')
 if S>1.2:
  menu=find(nodes,'home-sections') or find(nodes,'root-menu-button');tap(menu);nodes=capture('current')
 return go('root-tab-'+tab,nodes)
def detail(label,nodes=None):return go(label,root('more',nodes))
def typevalue(label,value,nodes=None):
 n=scrollfind(nodes or CURRENT or capture('current'),label);tap(n)
 q.adb('shell','input','keyevent','KEYCODE_MOVE_END');q.adb('shell','input','keyevent','--longpress','KEYCODE_DEL')
 # Numeric fields used here have at most four existing characters.
 for _ in range(4):q.adb('shell','input','keyevent','KEYCODE_DEL')
 q.adb('shell','input','text',str(value));time.sleep(.6)
 if b'mInputShown=true' in q.adb('shell','dumpsys','input_method'):q.adb('shell','input','keyevent','4')
 time.sleep(.3)
 return capture('current')
def lesson(lesson_id,variant=0):
 data=json.loads(Path('content/bundles/1.2.0/lessons/'+lesson_id+'.json').read_text(encoding='utf-8'))
 v=data['variants'][variant];label=f"{data['title']}. Ситуация {variant+1}. {v['copy']['intro']}"
 return go(label),data,v
def preview():
 q.adb('install','-r',str(APK.resolve()));q.fixture();nodes=start()
 for label,name in [('Все занятия','catalog'),('Прогресс','history'),('Имя и внешность','pet'),('Как играть','help'),('Для взрослого','adult-gate')]:
  detail(label);capture(name,True);nodes=back();assert find(nodes,'more-screen');ok('back-'+name)
 detail('Все занятия');lesson('LS-B01');capture('lesson-allocation',True)
 go('Короткая справка');capture('lesson-help',True);back();ok('lesson-help-modal-back')
 nodes=back();assert match(nodes,'Выбери пример');back()
 detail('Для взрослого');go('Доступный вариант без удержания');capture('adult-accessible',True);typevalue('Ответ на простой арифметический вопрос',5);go('Проверить ответ');capture('adult-controls',True);ok('adult-accessible-unlock')
 back();nodes=detail('Для взрослого');assert match(nodes,'Защита от случайного входа');ok('adult-relocked-on-exit');back()
 start(360,640,2);detail('Имя и внешность');capture('pet-200-top',True);go('Готово');capture('pet-200-saved',True);ok('pet-save-200')
 print('preview complete',flush=True)
if __name__=='__main__':preview()


def clipped_keys(xml_path):
 clipped=set()
 def visit(node,viewports):
  box=bounds(node.attrib) if node.get('bounds') else None
  if box and node.get('clickable')=='true':
   a,b,c,d=box
   if any(a<=v[0] or b<=v[1] or c>=v[2] or d>=v[3] for v in viewports):
    clipped.add((node.get('bounds'),node.get('content-desc'),node.get('text')))
  if box and node.get('scrollable')=='true':viewports=viewports+[box]
  for child in node:visit(child,viewports)
 visit(q.ET.parse(xml_path).getroot(),[])
 return clipped


def dark_status(name):
 raw=q.adb('shell','dumpsys','window','windows').decode('utf-8',errors='replace')
 (R/'android'/(name+'-window.txt')).write_text(raw,encoding='utf-8')
 blocks=re.split(r'(?=  Window #\d+ Window)',raw)
 block=next(b for b in blocks if q.PKG+'/' in b.splitlines()[0])
 flag=int(re.search(r'mSystemUiVisibility=0x([0-9a-fA-F]+)',block).group(1),16)
 assert flag & 0x2000,(name,hex(flag))
 return hex(flag)
