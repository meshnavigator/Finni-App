import native as n
import json
n.save=lambda:(n.R/'transient-final.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
n.q.fixture();bad=n.R/'qa-corrupt.db';bad.write_bytes(b'QA deliberately invalid SQLite fixture')
n.q.adb('push',str(bad),'/data/local/tmp/finni-s9-detail-fixture.db');n.q.adb('shell',f'cp /data/local/tmp/finni-s9-detail-fixture.db {n.q.REMOTE} && chown 10080:10080 {n.q.REMOTE} && chmod 600 {n.q.REMOTE} && rm -f {n.q.REMOTE}-wal {n.q.REMOTE}-shm')
nodes=n.start(360,640,2);n.capture('system-bars-error-200',True)
button=n.scrollfind(nodes,'Попробовать снова');assert button.get('enabled')=='true';n.capture('system-bars-error-200-actions',True);n.ok('boot-error-retry-visible-200',systemUiVisibility=n.dark_status('system-bars-error-200'))
n.go('Попробовать снова');nodes=n.capture('system-bars-error-after-retry',True);assert n.match(nodes,'Домик пока не открылся');n.ok('failed-retry-remains-recoverable')
n.q.fixture();nodes=n.start();n.capture('latest-delivery-home',True);assert n.find(nodes,'Доступно: 100 монет');n.ok('final-binary-normal-start-after-qa-fixture-repair')
print('Final transient checks complete',flush=True)
