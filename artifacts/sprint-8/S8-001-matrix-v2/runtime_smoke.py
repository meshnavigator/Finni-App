"""Drive the observed native UI through adb; no app/database shortcuts."""
from pathlib import Path
import subprocess,xml.etree.ElementTree as ET,re,json
P=Path(__file__).resolve().parent;OUT=P/'runtime';OUT.mkdir(exist_ok=True)
ADB='C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe'
def adb(*args):return subprocess.run([ADB,*args],check=True,stdout=subprocess.PIPE).stdout
def ui(name=None):
 adb('shell','uiautomator','dump','/sdcard/matrix-ui.xml');raw=adb('shell','cat','/sdcard/matrix-ui.xml')
 if name:(OUT/(name+'.xml')).write_bytes(raw)
 return ET.fromstring(raw)
def tap(label):
 root=ui();nodes=[n for n in root.iter('node') if n.attrib.get('content-desc')==label or n.attrib.get('text')==label];assert nodes,label
 n=nodes[0];b=list(map(int,re.findall(r'\d+',n.attrib['bounds'])));adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
def capture(name):(OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
shapes=[('round','Круглые','Круглые ушки'),('floppy','Мягкие','Мягкие ушки')];patterns=[('plain','Без узора'),('spots','Пятнышки'),('stripes','Полоски')];report=[]
for attempt in range(15):
 tree=ui()
 if any(n.attrib.get('content-desc')=='Домик Финни' for n in tree.iter('node')):break
else:raise RuntimeError('startup Home not ready')
for shape,label,spoken in shapes:
 for pattern,patternLabel in patterns:
  key=shape+'-'+pattern;tap('О питомце: Финни');tap(label);tap(patternLabel);tree=ui(key+'-constructor');assert any(n.attrib.get('content-desc')==f'Финни: {spoken}, {patternLabel}' for n in tree.iter('node'))
  capture(key+'-constructor');tap('Готово');tree=ui(key+'-home');assert any(n.attrib.get('content-desc')=='Домик Финни' for n in tree.iter('node'));assert not any('Изображение недоступно' in n.attrib.get('content-desc','') for n in tree.iter('node'));capture(key+'-home');report.append({'id':key,'constructor':'PASS','saveHome':'PASS'});print(key+' PASS',flush=True)
# Cancel must preserve final floppy/stripes.
tap('О питомце: Финни');tap('Круглые');tap('Без узора');tap('Отмена');ui();adb('shell','am','force-stop','com.meshnavigator.finni');adb('shell','am','start','-n','com.meshnavigator.finni/.MainActivity')
# Native UI startup is polled with actual snapshots, not assumed completed.
for _ in range(12):
 tree=ui()
 if any(n.attrib.get('content-desc')=='Домик Финни' for n in tree.iter('node')):break
else:raise RuntimeError('cold Home not ready')
capture('cold-final-home');tap('О питомце: Финни');tree=ui('cold-final-profile');assert any(n.attrib.get('content-desc')=='Финни: Мягкие ушки, Полоски' for n in tree.iter('node'));tap('Отмена')
(OUT/'smoke.json').write_text(json.dumps({'status':'PASS','variants':report,'cancelAndColdPersistence':'floppy/stripes preserved','scope':'API26 debug + Metro, stage1'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('cancel/cold persistence PASS',flush=True)
