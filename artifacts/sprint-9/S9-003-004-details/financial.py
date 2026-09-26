from pathlib import Path
import importlib.util,json,re,time,hashlib
from PIL import Image
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'routes';q.OUT.mkdir(exist_ok=True)
results=[];apk=Path('android/app/build/outputs/apk/release/app-release.apk')
def save():(R/'financial.json').write_text(json.dumps({'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
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

# Real commands on the isolated fixture: purchase/care/transfer/close and their cancel paths.
q.fixture();q.start(390,844,1);nodes=capture('finance-home')
tap(find(nodes,'root-tab-shop'));shop=capture('purchase-root');tap(find(shop,'Посмотреть и купить'));dialog=capture('purchase-confirm')
assert not find(dialog,'root-navigation');tap(find(dialog,'Отмена'));nodes=back('purchase-cancel-home');money(nodes);ok('purchase-cancel-isolated')
tap(find(nodes,'root-tab-shop'));shop=capture('purchase-again');tap(find(shop,'Посмотреть и купить'));dialog=capture('purchase-commit-confirm');tap(find(dialog,'Купить') or find(dialog,'Потратить сверх плана'));committed=capture('purchase-committed');tap(find(committed,'root-tab-home'));nodes=capture('purchase-home');money(nodes,70,0);ok('purchase-confirmed')
# Care is the third item. Scroll until the card text is visible, then its following button.
tap(find(nodes,'root-tab-shop'));shop=capture('care-root')
for i in range(6):
 card=find(shop,'Щётка для шерсти — 10 монет')
 if card:
  cy=int(re.findall(r'\d+',card['bounds'])[1]);buttons=[n for n in shop if n.get('content-desc')=='Посмотреть и купить' and int(re.findall(r'\d+',n['bounds'])[1])>cy]
  if buttons:break
 q.adb('shell','input','swipe','190','620','190','300','300');time.sleep(.3);shop=capture('care-scroll')
tap(buttons[0]);dialog=capture('care-confirm');tap(find(dialog,'Купить') or find(dialog,'Потратить сверх плана'));committed=capture('care-committed');tap(find(committed,'root-tab-home'));nodes=capture('care-home');money(nodes,60,0);ok('care-confirmed')
tap(find(nodes,'root-tab-savings'));savings=capture('transfer-root');tap(scrollfind(savings,'Сумма перевода',844));q.adb('shell','input','text','20');q.adb('shell','input','keyevent','4');time.sleep(.2);savings=capture('transfer-input');tap(find(savings,'Положить'));dialog=capture('transfer-confirm');assert not find(dialog,'root-navigation');tap(find(dialog,'Отмена'));nodes=back('transfer-cancel-home');money(nodes,60,0);ok('transfer-cancel-isolated')
tap(find(nodes,'root-tab-savings'));savings=capture('transfer-again');tap(scrollfind(savings,'Сумма перевода',844));q.adb('shell','input','text','20');q.adb('shell','input','keyevent','4');time.sleep(.2);savings=capture('transfer-input2');tap(find(savings,'Положить'));dialog=capture('transfer-commit-confirm');tap(find(dialog,'Подтвердить'));committed=capture('transfer-committed');tap(find(committed,'root-tab-home'));nodes=capture('transfer-home');money(nodes,40,20);ok('transfer-confirmed')
tap(find(nodes,'home-primary'));detail=capture('result-root');preview('result-root',390,844);assert not find(detail,'root-navigation');tap(scrollfind(detail,'Завершить день',844));dialog=capture('close-confirm');preview('close-confirm',390,844);assert not find(dialog,'root-navigation');tap(find(dialog,'Вернуться'));nodes=back('close-cancel-home');money(nodes,40,20);ok('close-cancel-isolated')
tap(find(nodes,'home-primary'));detail=capture('result-again');tap(scrollfind(detail,'Завершить день',844));dialog=capture('close-commit-confirm');tap(find(dialog,'Завершить'));capture('close-committed');preview('close-committed',390,844);nodes=back('close-home');money(nodes,40,20);assert any('Следующий день позже' in n.get('content-desc','') or 'Следующий день позже' in n.get('text','') for n in nodes);ok('close-confirmed')
print('PASS',len(results),'native route/financial checks',flush=True)
