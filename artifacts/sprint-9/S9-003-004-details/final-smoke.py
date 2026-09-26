import native as n
import json,zipfile
n.APK=n.R/'finni-details-review.apk'
n.save=lambda:(n.R/'final-smoke.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
n.q.fixture();n.start();n.q.adb('shell','am','force-stop',n.q.PKG)
files=json.loads((n.R/'original-state.json').read_text(encoding='utf-8'))['existingBackupMatches']
def hashes():return {p:n.q.adb('shell','sha256sum',f'/data/data/{n.q.PKG}/{p}').decode().split()[0] for p in files}
a=hashes();n.q.adb('install','-r',str(n.APK.resolve()));b=hashes();assert a==b;n.ok('install-over-preserves-eight-files',fileHashesUnchanged={p:a[p]==b[p] for p in a})
path=n.q.adb('shell','pm','path',n.q.PKG).decode().strip().split('package:')[1];device=n.q.adb('shell','sha256sum',path).decode().split()[0]
assert device==n.hashlib.sha256(n.APK.read_bytes()).hexdigest();n.ok('installed-delivery-apk-exact-sha256')
nodes=n.start();assert n.find(nodes,'Доступно: 100 монет');n.capture('final-delivery-home',True)
for tab in ('home','plan','shop','savings','more'):
 n.root(tab);n.capture('final-root-'+tab,True);n.ok('final-root-'+tab)
for label,name in [('Все занятия','catalog'),('Имя и внешность','pet'),('Прогресс','history'),('Как играть','help'),('Для взрослого','adult')]:
 n.detail(label);n.capture('final-delivery-'+name,True);nodes=n.back();assert n.find(nodes,'more-screen');n.ok('final-delivery-back-'+name)
for lid in ('LS-B01','LS-P01','LS-B03','LS-P03','LS-S01','LS-S02'):
 n.detail('Все занятия');n.lesson(lid);n.capture('final-'+lid,True);n.back();n.back();n.ok('final-renderer-'+lid)
with zipfile.ZipFile(n.APK) as z:
 bundles=[x for x in z.namelist() if x.endswith('index.android.bundle')];assert bundles
 raw=z.read(bundles[0]);assert b'QA-Loading' not in raw and b'finni-qa-resource.png' not in raw
 n.ok('embedded-bundle-no-qa-markers',bundleBytes=len(raw))
print('Final delivery checks complete',flush=True)
