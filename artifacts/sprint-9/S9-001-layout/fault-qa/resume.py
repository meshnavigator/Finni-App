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

for name in ('QA-missing','QA-corrupt','QA-object'):
    if name=='QA-missing': q.adb('shell','rm','-f','/data/data/com.meshnavigator.finni/files/missing-room.png')
    if name=='QA-corrupt':
        bad=ROOT/'corrupt.png';bad.write_bytes(b'not a valid PNG')
        q.adb('push',str(bad),'/data/local/tmp/finni-corrupt.png')
        q.adb('shell','cp /data/local/tmp/finni-corrupt.png /data/data/com.meshnavigator.finni/files/corrupt-room.png && chmod 644 /data/data/com.meshnavigator.finni/files/corrupt-room.png && chown 10080:10080 /data/data/com.meshnavigator.finni/files/corrupt-room.png && restorecon -F /data/data/com.meshnavigator.finni/files/corrupt-room.png')
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
        q.adb('shell',f'cp /data/local/tmp/finni-recovered-room.png /data/data/com.meshnavigator.finni/files/{target} && chmod 644 /data/data/com.meshnavigator.finni/files/{target} && chown 10080:10080 /data/data/com.meshnavigator.finni/files/{target} && restorecon -F /data/data/com.meshnavigator.finni/files/{target}')
    q.adb('shell','input','keyevent','4');time.sleep(.5)
    recovered=q.capture(name+'-recovered')
    if any(n.get('resource-id')=='finni-home-scene-fallback' for n in recovered):
        q.start(360 if name!='QA-object' else 390, 640 if name!='QA-object' else 844, 2 if name!='QA-object' else 1)
        recovered=q.capture(name+'-recovered-restart')
        recovery='process-restart'
    else: recovery='home-return'
    assert not any(n.get('resource-id')=='finni-home-scene-fallback' for n in recovered)
    results.append({'case':name,'pass':True,'recovery':recovery})


(ROOT/'resource-results.json').write_text(json.dumps(results,indent=2))
print(results)
