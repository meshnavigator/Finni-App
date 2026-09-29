
from pathlib import Path
import importlib.util,json,re,sqlite3,time,hashlib
R=Path(__file__).resolve().parent;F=R/'fault';F.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=F
original_capture=q.capture
def capture(name):
    for attempt in range(3):
        try:return original_capture(name)
        except AssertionError as error:
            if attempt==2:raise
            print('Retry fresh UIAutomator dump:',name,repr(error),flush=True);time.sleep(.8)
q.capture=capture
results=[]
def adb(*args):return q.adb(*args)
def save():
    (F/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
def prepare(name,large=False):
    q.fixture()
    with sqlite3.connect(q.FIXTURE) as db:db.execute('UPDATE profile SET pet_name=?',(name,))
    adb('push',str(q.FIXTURE),'/data/local/tmp/finni-s9-home.db')
    adb('shell',f'cp /data/local/tmp/finni-s9-home.db {q.REMOTE} && chown 10080:10080 {q.REMOTE} && chmod 600 {q.REMOTE}')
    q.start(360 if large else 390,640 if large else 844,2 if large else 1)
    return q.capture(name)
def tap(n):
    x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));adb('shell','input','tap',str((x+r)//2),str((y+b)//2))
def find(nodes,part):return next(n for n in nodes if part in n.get('content-desc','') or n.get('resource-id')==part)
def shot(name):(F/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
def log(name):
    pid=adb('shell','pidof',q.PKG).decode().strip()
    raw=adb('logcat','-d','--pid='+pid,'-s','ReactNativeJS:I').decode('utf-8',errors='replace')
    (F/(name+'.log')).write_text(raw,encoding='utf-8')
    return raw
original=adb('shell','settings','get','global','transition_animation_scale').decode().strip()
(F/'original-animation-scale.json').write_text(json.dumps(original))
apk=Path('android/app/build/outputs/apk/release/app-release.apk')
(F/'apk-sha256.txt').write_text(hashlib.sha256(apk.read_bytes()).hexdigest())
adb('install','-r',str(apk.resolve()))
try:
    adb('shell','settings','put','global','transition_animation_scale','1')
    for name in ('happy','thoughtful','inspired','reduced'):
        nodes=prepare('QA-'+name,large=name=='thoughtful')
        tap(find(nodes,'стадия'));time.sleep(.5);shot(name+'-expression')
        time.sleep(3);shot(name+'-neutral');raw=log(name)
        assert 'QA expression-loaded' in raw and 'QA finished' in raw,raw
        assert ('QA static-expression' if name=='reduced' else 'QA transition') in raw,raw
        results.append({'case':name,'pass':True});save();print(name,'PASS',flush=True)
    adb('shell','settings','put','global','transition_animation_scale','0');time.sleep(1)
    nodes=prepare('QA-happy');tap(find(nodes,'стадия'));time.sleep(.5);shot('system-reduced');time.sleep(3);raw=log('system-reduced')
    assert 'QA static-expression' in raw and 'QA finished' in raw,raw
    results.append({'case':'system-reduced','pass':True});save()
    adb('shell','settings','put','global','transition_animation_scale','1')
    nodes=prepare('QA-inspired',True);tap(find(nodes,'стадия'));time.sleep(.25);tap(find(nodes,'home-sections'));time.sleep(.3);shot('skip');time.sleep(3);raw=log('skip')
    assert 'QA static-expression' in raw and 'QA finished' in raw,raw
    results.append({'case':'skip','pass':True});save()
    nodes=prepare('QA-happy');tap(find(nodes,'стадия'));time.sleep(.25);adb('shell','input','keyevent','3');time.sleep(.4)
    adb('shell','am','start','-n',q.PKG+'/.MainActivity');time.sleep(.5);raw=log('background')
    assert 'QA cancelled' in raw and 'QA finished' not in raw,raw
    results.append({'case':'background-cancel','pass':True});save()
    nodes=prepare('QA-inspired',True);tap(find(nodes,'стадия'));time.sleep(.25);tap(find(nodes,'home-sections'));time.sleep(.2);tap(find(nodes,'home-sections'));time.sleep(.4);raw=log('modal')
    assert 'QA cancelled' in raw and 'QA finished' not in raw,raw
    opened=q.capture('modal-open');assert not any(n.get('resource-id')=='home-primary' for n in opened)
    adb('shell','input','keyevent','4');time.sleep(.3);closed=q.capture('modal-closed')
    assert any(n.get('resource-id')=='home-primary' for n in closed)
    results.append({'case':'modal-pause-back','pass':True});save()
    for name in ('QA-missing','QA-corrupt','QA-goal'):
        adb('shell','am','force-stop',q.PKG)
        adb('shell','rm','-f','/data/data/com.meshnavigator.finni/files/qa-home-pet.png','/data/data/com.meshnavigator.finni/files/qa-missing-goal.png')
        if name=='QA-corrupt':
            bad=F/'invalid.png';bad.write_bytes(b'not a PNG')
            adb('push',str(bad),'/data/local/tmp/finni-invalid.png')
            adb('shell','cp /data/local/tmp/finni-invalid.png /data/data/com.meshnavigator.finni/files/qa-home-pet.png && chown 10080:10080 /data/data/com.meshnavigator.finni/files/qa-home-pet.png && chmod 600 /data/data/com.meshnavigator.finni/files/qa-home-pet.png && restorecon -F /data/data/com.meshnavigator.finni/files/qa-home-pet.png')
        nodes=prepare(name,large=name!='QA-goal');raw=log(name)
        assert ('QA goal-error' if name=='QA-goal' else 'QA decode-error') in raw,raw
        ids={n.get('resource-id') for n in nodes}
        assert {'home-finances','home-care','home-lesson','home-primary'}.issubset(ids),ids
        if name!='QA-goal':assert 'finni-home-scene-fallback' in ids,ids
        tap(find(nodes,'home-goal'));time.sleep(.5)
        route=q.capture(name+'-route');assert any('КОПИЛКА' in n.get('text','')+n.get('content-desc','') for n in route)
        if name!='QA-goal':
            adb('push','assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png','/data/local/tmp/finni-recovery.png')
            adb('shell','cp /data/local/tmp/finni-recovery.png /data/data/com.meshnavigator.finni/files/qa-home-pet.png && chown 10080:10080 /data/data/com.meshnavigator.finni/files/qa-home-pet.png && chmod 600 /data/data/com.meshnavigator.finni/files/qa-home-pet.png && restorecon -F /data/data/com.meshnavigator.finni/files/qa-home-pet.png')
        adb('shell','input','keyevent','4');time.sleep(.5);recovered=q.capture(name+'-recovered')
        assert any(n.get('resource-id')=='finni-home-scene' for n in recovered)
        assert not any(n.get('resource-id')=='finni-home-scene-fallback' for n in recovered)
        results.append({'case':name,'pass':True,'recoverOnRemount':name!='QA-goal'});save();print(name,'PASS',flush=True)
finally:
    adb('shell','settings','put','global','transition_animation_scale',original)
    adb('shell','rm','-f','/data/data/com.meshnavigator.finni/files/qa-home-pet.png','/data/data/com.meshnavigator.finni/files/qa-missing-goal.png','/data/local/tmp/finni-invalid.png','/data/local/tmp/finni-recovery.png')
print('PASS',len(results),'fault/animation checks',flush=True)

