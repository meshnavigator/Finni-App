import native as n
import sqlite3,json
n.APK=n.R/'finni-details-resource-qa.apk'
n.save=lambda:(n.R/'resource-qa.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'qaOnly':True,'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
n.q.adb('install','-r',str(n.APK.resolve()))
try:
 n.q.adb('shell','rm','-f','/data/data/'+n.q.PKG+'/files/finni-qa-resource.png')
 n.q.fixture();n.start();n.detail('Имя и внешность');n.time.sleep(1);nodes=n.capture('fallback-missing',True)
 assert not any(x.get('resource-id','').startswith('pet-preview-') for x in nodes);n.ok('real-image-onerror-missing')
 bad=n.R/'qa-corrupt-image.png';bad.write_bytes(b'QA invalid PNG')
 n.q.adb('push',str(bad),'/data/local/tmp/finni-qa-resource.png');n.q.adb('shell',f'cp /data/local/tmp/finni-qa-resource.png /data/data/{n.q.PKG}/files/finni-qa-resource.png && chown 10080:10080 /data/data/{n.q.PKG}/files/finni-qa-resource.png && chmod 600 /data/data/{n.q.PKG}/files/finni-qa-resource.png && restorecon -F /data/data/{n.q.PKG}/files/finni-qa-resource.png')
 n.q.fixture();n.start(360,640,2);n.detail('Имя и внешность');n.time.sleep(1);nodes=n.capture('fallback-corrupt-200',True)
 assert not any(x.get('resource-id','').startswith('pet-preview-') for x in nodes);n.ok('real-image-onerror-corrupt-200')
 for w,h,scale in [(390,844,1),(360,640,2)]:
  n.q.fixture()
  with sqlite3.connect(n.q.FIXTURE) as db:db.execute("UPDATE profile SET pet_name='QA-Loading'")
  n.q.adb('push',str(n.q.FIXTURE),'/data/local/tmp/finni-qa-loading.db');n.q.adb('shell',f'cp /data/local/tmp/finni-qa-loading.db {n.q.REMOTE} && chown 10080:10080 {n.q.REMOTE} && chmod 600 {n.q.REMOTE} && rm -f {n.q.REMOTE}-wal {n.q.REMOTE}-shm')
  nodes=n.start(w,h,scale);n.capture('loading-qa-'+str(scale),True);assert n.match(nodes,'Готовим домик…');n.ok('loading-presentation-'+str(scale),systemUiVisibility=n.dark_status('loading-qa-'+str(scale)))
finally:
 n.q.adb('shell','am','force-stop',n.q.PKG)
 n.q.adb('shell','rm','-f','/data/data/'+n.q.PKG+'/files/finni-qa-resource.png','/data/local/tmp/finni-qa-resource.png')
 n.q.adb('install','-r',str((n.R/'finni-details-review.apk').resolve()))
print('QA resource scenarios complete; delivery reinstalled',flush=True)
