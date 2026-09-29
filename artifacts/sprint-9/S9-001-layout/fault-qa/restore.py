from pathlib import Path
import subprocess,json,hashlib,time
A='C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe'; P='com.meshnavigator.finni'; R=Path('artifacts/sprint-9/S9-001-layout'); B=Path('C:/tmp/finni-s9-home-original')
def adb(*args): return subprocess.run([A,*args],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60).stdout
adb('shell','am','force-stop',P)
adb('install','-r','C:/tmp/finni-s9-production.apk')
adb('shell','am','start','-n',P+'/.MainActivity');time.sleep(3)
(R/'android/production-final-smoke.png').write_bytes(adb('exec-out','screencap','-p'))
adb('shell','am','force-stop',P)
for name in ('finni-main.db-wal','finni-main.db-shm'):
    if not (B/'files/SQLite'/name).exists(): adb('shell','rm','-f',f'/data/data/{P}/files/SQLite/{name}')
for name in ('missing-room.png','corrupt-room.png'): adb('shell','rm','-f',f'/data/data/{P}/files/{name}')
checks={}
for f in B.rglob('*'):
    if not f.is_file(): continue
    rel=f.relative_to(B).as_posix(); dest=f'/data/data/{P}/{rel}'
    adb('push',str(f),'/data/local/tmp/finni-s9-restore-file')
    adb('shell',f'cp /data/local/tmp/finni-s9-restore-file {dest} && chown 10080:10080 {dest} && chmod 600 {dest} && restorecon -F {dest}')
    checks[rel]=hashlib.sha256(f.read_bytes()).hexdigest()==hashlib.sha256(adb('exec-out','cat',dest)).hexdigest()
adb('shell','wm','size','reset');adb('shell','wm','density','reset');adb('shell','settings','delete','system','font_scale')
adb('shell','settings','put','global','transition_animation_scale','0')
source=json.loads((R/'fault-qa/restored-sources.json').read_text())
sourceChecks={k:hashlib.sha256(Path(k).read_bytes()).hexdigest()==v for k,v in source.items()}
out={'files':checks,'productionSources':sourceChecks,'apkSha256':hashlib.sha256(Path('C:/tmp/finni-s9-production.apk').read_bytes()).hexdigest(),'wmSize':adb('shell','wm','size').decode().strip(),'wmDensity':adb('shell','wm','density').decode().strip(),'fontScaleSetting':adb('shell','settings','get','system','font_scale').decode().strip(),'transitionAnimationScale':adb('shell','settings','get','global','transition_animation_scale').decode().strip(),'appStoppedAfterRestore':True}
(R/'android/restore-final.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
assert all(checks.values()) and all(sourceChecks.values())
print(json.dumps(out))
