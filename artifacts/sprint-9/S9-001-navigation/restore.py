"""Restore only the previously verified existing backup. No databases copied out."""
from pathlib import Path
import subprocess,json,hashlib,time
A='C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe';P='com.meshnavigator.finni'
R=Path(__file__).resolve().parent;B=Path('C:/tmp/finni-s9-home-original')
original=json.loads((R/'original-state.json').read_text(encoding='utf-8'))
assert all(original['existingBackupMatches'].values())
def adb(*a):return subprocess.run([A,*a],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60).stdout
adb('shell','am','force-stop',P)
uid=adb('shell','stat','-c','%u',f'/data/data/{P}/files/SQLite/finni-main.db').decode().strip()
assert uid.isdigit()
for name in ('finni-main.db-wal','finni-main.db-shm'):
    if not (B/'files/SQLite'/name).exists():adb('shell','rm','-f',f'/data/data/{P}/files/SQLite/{name}')
checks={}
for rel in original['existingBackupMatches']:
    assert '..' not in Path(rel).parts
    source=B/rel;destination=f'/data/data/{P}/{rel}'
    adb('push',str(source),'/data/local/tmp/finni-s9-polish-restore')
    adb('shell',f'cp /data/local/tmp/finni-s9-polish-restore {destination} && chown {uid}:{uid} {destination} && chmod 600 {destination} && restorecon -F {destination}')
    checks[rel]=hashlib.sha256(source.read_bytes()).hexdigest()==adb('shell','sha256sum',destination).decode().split()[0]
adb('shell','rm','-f','/data/local/tmp/finni-s9-polish-restore')
assert original['size']=='Physical size: 1080x1920' and original['density']=='Physical density: 420'
adb('shell','wm','size','reset');adb('shell','wm','density','reset')
if original['fontScale']=='null':adb('shell','settings','delete','system','font_scale')
else:adb('shell','settings','put','system','font_scale',original['fontScale'])
time.sleep(2)
if original['fontScale']=='null':adb('shell','settings','delete','system','font_scale')
result={'files':checks,'wmSize':adb('shell','wm','size').decode().strip(),'wmDensity':adb('shell','wm','density').decode().strip(),'fontScale':adb('shell','settings','get','system','font_scale').decode().strip(),'transitionScale':adb('shell','settings','get','global','transition_animation_scale').decode().strip(),'appStoppedAfterRestore':True,'method':'Restore already existing prior-QA backup after matching all eight baseline SHA256; verify on-device hashes without copying a database out.'}
assert all(checks.values())
assert result['wmSize']==original['size'] and result['wmDensity']==original['density'] and result['fontScale']==original['fontScale']
assert result['transitionScale']==original['transitionScale']
(R/'restore.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))

