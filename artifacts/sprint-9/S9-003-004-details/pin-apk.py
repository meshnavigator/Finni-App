from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/native.py');s=p.read_text(encoding='utf-8');s=s.replace("APK=Path('android/app/build/outputs/apk/release/app-release.apk')","APK=R/'finni-details-review.apk'");p.write_text(s,encoding='utf-8')
