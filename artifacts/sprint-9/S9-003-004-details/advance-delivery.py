from pathlib import Path
import shutil
r=Path('artifacts/sprint-9/S9-003-004-details')
for name in ['final-smoke.log','final-smoke.json']:
 a,b=name.rsplit('.',1);shutil.copy2(r/name,r/(a+'-adb-interrupted.'+b))
shutil.copy2('android/app/build/outputs/apk/release/app-release.apk',r/'finni-details-review.apk')
