from pathlib import Path
import subprocess,json,hashlib
A='C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe';P='com.meshnavigator.finni';B=Path('C:/tmp/finni-s9-home-original')
def adb(*a):return subprocess.run([A,*a],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60).stdout
matches={}
for f in B.rglob('*'):
    if f.is_file():
        rel=f.relative_to(B).as_posix()
        matches[rel]=hashlib.sha256(f.read_bytes()).hexdigest()==adb('shell','sha256sum',f'/data/data/{P}/{rel}').decode().split()[0]
state={'existingBackupMatches':matches,'size':adb('shell','wm','size').decode().strip(),'density':adb('shell','wm','density').decode().strip(),'fontScale':adb('shell','settings','get','system','font_scale').decode().strip(),'transitionScale':adb('shell','settings','get','global','transition_animation_scale').decode().strip(),'method':'Read-only hashes compared to existing prior-QA backup; no AVD database copied out'}
Path('artifacts/sprint-9/S9-001-polish/original-state.json').write_text(json.dumps(state,indent=2),encoding='utf-8')
print(json.dumps(state))
assert all(matches.values())

