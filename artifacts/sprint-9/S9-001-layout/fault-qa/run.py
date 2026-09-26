from pathlib import Path
import importlib.util, json, re, sqlite3, time

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('qa', ROOT.parent / 'android-qa.py')
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)
results = []

def prepare(name, large=False):
    q.fixture()
    with sqlite3.connect(q.FIXTURE) as db:
        db.execute('UPDATE profile SET pet_name=?', (name,))
    q.adb('push', str(q.FIXTURE), '/data/local/tmp/finni-s9-home.db')
    q.adb('shell', f'cp /data/local/tmp/finni-s9-home.db {q.REMOTE} && chown 10080:10080 {q.REMOTE} && chmod 600 {q.REMOTE}')
    q.start(360 if large else 390, 640 if large else 844, 2 if large else 1)
    return q.capture(name)

def tap(node):
    x,y,r,b = map(int,re.findall(r'\d+',node['bounds']))
    q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2))

def shot(name):
    (ROOT/(name+'.png')).write_bytes(q.adb('exec-out','screencap','-p'))

def log(name):
    pid=q.adb('shell','pidof',q.PKG).decode().strip()
    raw=q.adb('logcat','-d','--pid='+pid,'-s','ReactNativeJS:I').decode('utf-8',errors='replace')
    (ROOT/(name+'.log')).write_text(raw,encoding='utf-8')
    return raw

original_scale=q.adb('shell','settings','get','global','transition_animation_scale').decode().strip()
saved=ROOT/'original-animation-scale.json'
if saved.exists(): original_scale=json.loads(saved.read_text())
else: saved.write_text(json.dumps(original_scale))
q.adb('shell','settings','put','global','transition_animation_scale','1')
for expression in ('happy','thoughtful','inspired','reduced'):
    nodes=prepare('QA-'+expression)
    tap(next(n for n in nodes if 'стадия' in n.get('content-desc','')))
    time.sleep(.6);shot(expression+'-expression')
    time.sleep(3);shot(expression+'-neutral')
    raw=log(expression)
    assert 'expression-loaded' in raw and 'finished' in raw, raw
    assert ('static-expression' if expression=='reduced' else 'transition') in raw,raw
    results.append({'case':expression,'pass':True})

q.adb('shell','settings','put','global','transition_animation_scale','0')
nodes=prepare('QA-happy')
tap(next(n for n in nodes if 'стадия' in n.get('content-desc','')))
time.sleep(.5);shot('system-reduced');time.sleep(3)
raw=log('system-reduced');assert 'static-expression' in raw and 'finished' in raw
q.adb('shell','settings','put','global','transition_animation_scale','1')
results.append({'case':'system-reduced','pass':True})

nodes=prepare('QA-inspired',large=True)
tap(next(n for n in nodes if 'стадия' in n.get('content-desc','')))
time.sleep(.25)
tap(next(n for n in nodes if n.get('resource-id')=='home-sections'))
time.sleep(.3);shot('skip');time.sleep(3)
raw=log('skip');assert 'static-expression' in raw and 'finished' in raw
results.append({'case':'skip','pass':True})

nodes=prepare('QA-happy')
tap(next(n for n in nodes if 'стадия' in n.get('content-desc','')))
time.sleep(.25);q.adb('shell','input','keyevent','3');time.sleep(.4)
q.adb('shell','am','start','-n',q.PKG+'/.MainActivity');time.sleep(.5)
raw=log('background');assert 'cancelled' in raw and 'finished' not in raw
results.append({'case':'background-cancel','pass':True})

nodes=prepare('QA-inspired',large=True)
tap(next(n for n in nodes if 'стадия' in n.get('content-desc','')))
time.sleep(.25);tap(next(n for n in nodes if n.get('resource-id')=='home-sections'))
time.sleep(.2);tap(next(n for n in nodes if n.get('resource-id')=='home-sections'))
time.sleep(.4);raw=log('modal-pause');assert 'cancelled' in raw and 'finished' not in raw
nodes=q.capture('QA-modal-pause');assert not any(n.get('resource-id')=='home-primary' for n in nodes)
results.append({'case':'modal-pause-cancel','pass':True})

for name in ('QA-missing','QA-corrupt','QA-object'):
    if name=='QA-missing': q.adb('shell','rm','-f','/data/data/com.meshnavigator.finni/files/missing-room.png')
    if name=='QA-corrupt':
        bad=ROOT/'corrupt.png';bad.write_bytes(b'not a valid PNG')
        q.adb('push',str(bad),'/data/local/tmp/finni-corrupt.png')
        q.adb('shell','cp /data/local/tmp/finni-corrupt.png /data/data/com.meshnavigator.finni/files/corrupt-room.png && chmod 644 /data/data/com.meshnavigator.finni/files/corrupt-room.png')
    nodes=prepare(name,large=name!='QA-object')
    raw=log(name)
    assert ('object-error' if name=='QA-object' else 'decode-error') in raw
    ids={n.get('resource-id') for n in nodes}
    assert 'home-finances' in ids and 'home-primary' in ids
    if name!='QA-object': assert 'finni-home-scene-fallback' in ids
    shot(name+'-fallback')
    tap(next(n for n in nodes if n.get('resource-id')=='home-goal'))
    time.sleep(.5);after=q.capture(name+'-route')
    assert any('КОПИЛКА' in (n.get('text','')+n.get('content-desc','')) for n in after)
    if name!='QA-object':
        target='missing-room.png' if name=='QA-missing' else 'corrupt-room.png'
        q.adb('push','assets/2d/master/FINNI-2D-MASTER-V1/room_clean_v1.png','/data/local/tmp/finni-recovered-room.png')
        q.adb('shell',f'cp /data/local/tmp/finni-recovered-room.png /data/data/com.meshnavigator.finni/files/{target} && chmod 644 /data/data/com.meshnavigator.finni/files/{target}')
    q.adb('shell','input','keyevent','4');time.sleep(.5)
    recovered=q.capture(name+'-recovered')
    assert any(n.get('resource-id')=='finni-home-scene' for n in recovered)
    assert not any(n.get('resource-id')=='finni-home-scene-fallback' for n in recovered)
    results.append({'case':name,'pass':True})

(ROOT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results),flush=True)
