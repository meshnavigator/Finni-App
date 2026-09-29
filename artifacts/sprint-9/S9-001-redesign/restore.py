from pathlib import Path
import subprocess,json,hashlib
A='C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe';P='com.meshnavigator.finni'
R=Path('artifacts/sprint-9/S9-001-redesign');B=Path('C:/tmp/finni-s9-home-original')
def adb(*args):return subprocess.run([A,*args],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60).stdout
adb('shell','am','force-stop',P)
for name in ('finni-main.db-wal','finni-main.db-shm'):
    if not (B/'files/SQLite'/name).exists():adb('shell','rm','-f',f'/data/data/{P}/files/SQLite/{name}')
checks={}
for f in B.rglob('*'):
    if not f.is_file():continue
    rel=f.relative_to(B).as_posix();dest=f'/data/data/{P}/{rel}'
    adb('push',str(f),'/data/local/tmp/finni-s9-restore-file')
    adb('shell',f'cp /data/local/tmp/finni-s9-restore-file {dest} && chown 10080:10080 {dest} && chmod 600 {dest} && restorecon -F {dest}')
    checks[rel]=hashlib.sha256(f.read_bytes()).hexdigest()==hashlib.sha256(adb('exec-out','cat',dest)).hexdigest()
adb('shell','wm','size','reset');adb('shell','wm','density','reset')
adb('shell','settings','delete','system','font_scale')
adb('shell','settings','put','global','transition_animation_scale','0')
out={'files':checks,'apkSha256':hashlib.sha256(Path('android/app/build/outputs/apk/release/app-release.apk').read_bytes()).hexdigest(),'wmSize':adb('shell','wm','size').decode().strip(),'wmDensity':adb('shell','wm','density').decode().strip(),'fontScaleSetting':adb('shell','settings','get','system','font_scale').decode().strip(),'appStoppedAfterRestore':True}
(R/'restore.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
assert all(checks.values());print(json.dumps(out))