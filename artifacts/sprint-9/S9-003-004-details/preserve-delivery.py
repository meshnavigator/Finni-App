from pathlib import Path
import hashlib,json,difflib
r=Path('artifacts/sprint-9/S9-003-004-details')
before=json.loads((r/'before-hashes.json').read_text(encoding='utf-8'))
print('\n'.join(str(p.relative_to(r/'before')) for p in (r/'before').rglob('*') if p.is_file()))
review=r/'finni-details-review.apk'
review.write_bytes(Path('android/app/build/outputs/apk/release/app-release.apk').read_bytes())
assert hashlib.sha256(review.read_bytes()).hexdigest()==json.loads((r/'lessons.json').read_text(encoding='utf-8'))['apkSha256']
print('Delivery APK preserved:',review,review.stat().st_size)
print('Root files unchanged:',{p:hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in before.items() if Path(p).name in ('BudgetPlanScreen.tsx','ShopScreen.tsx','SavingsScreen.tsx')})
