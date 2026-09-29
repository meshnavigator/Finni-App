from pathlib import Path
import native as n
import sqlite3,json,time
n.save=lambda:(n.R/'states.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
def publish(path):
 n.q.adb('shell','am','force-stop',n.q.PKG)
 uid=n.q.adb('shell','stat','-c','%u',n.q.REMOTE).decode().strip();assert uid.isdigit()
 n.q.adb('push',str(path),'/data/local/tmp/finni-s9-detail-fixture.db')
 n.q.adb('shell',f'cp /data/local/tmp/finni-s9-detail-fixture.db {n.q.REMOTE} && chown {uid}:{uid} {n.q.REMOTE} && chmod 600 {n.q.REMOTE} && rm -f {n.q.REMOTE}-wal {n.q.REMOTE}-shm')
def edit(sql):
 with sqlite3.connect(n.q.FIXTURE) as db:db.executescript(sql)
 publish(n.q.FIXTURE)
# Native SQLite failure leaves app open, displays the real catalog error and
# does not add an attempt or change wallet. The trigger exists only in QA data.
n.q.fixture();edit("CREATE TRIGGER qa_lesson_failure BEFORE INSERT ON lesson_attempt BEGIN SELECT RAISE(ABORT,'QA storage failure'); END;")
n.start(360,640,2);n.detail('Все занятия');n.lesson('LS-S02');nodes=n.capture('catalog-storage-error-200',True)
error=n.match(nodes,'Занятие не открылось. Монеты твоего дня не изменились.');assert error
a,b,c,d=n.bounds(error);assert b>=24 and d<=n.H-48 and d-b>=48,error
n.ok('catalog-storage-error-visible')
n.back();n.root('home');nodes=n.capture('error-wallet',True);assert n.find(nodes,'Доступно: 100 монет');n.ok('catalog-storage-failure-money-unchanged')
# The delivery APK's actual boot error (no injected component/source).
n.q.fixture();bad=n.R/'qa-corrupt.db';bad.write_bytes(b'QA deliberately invalid SQLite fixture')
publish(bad);n.start(360,640,2);nodes=n.capture('boot-error-200',True);n.scrollfind(nodes,'Попробовать снова');n.capture('boot-error-200-actions',True);n.ok('actual-corrupt-database-error-scrollable')
# Fresh empty SQLite goes through actual migrations and onboarding.
n.q.fixture();empty=n.R/'qa-empty.db';empty.write_bytes(b'')
publish(empty);n.start(412,915,1);nodes=n.capture('onboarding-412',True)
# The primary intro action opens the real creation form.
n.start(360,640,2);n.capture('onboarding-200',True);n.go('Познакомиться с Финни');nodes=n.capture('pet-create-200',True);n.go('Готово');nodes=n.capture('profile-created-200',True)
assert n.find(nodes,'home-sections') or n.find(nodes,'root-menu-button');n.ok('onboarding-create-profile')
# DRAFT plan at 200% including explicit low-need acknowledgement.
n.q.fixture(state='DRAFT');n.start(360,640,2);n.root('plan');n.capture('draft-plan-200',True)
for label,value in [('Сумма Нужно',20),('Сумма Хочется',30),('Сумма На мечту',30)]:n.typevalue(label,value)
n.scrollfind(n.capture('current'),'На необходимое меньше 40. Я понимаю и хочу продолжить.');nodes=n.capture('draft-warning-200',True)
n.go('На необходимое меньше 40. Я понимаю и хочу продолжить.');n.go('Подтвердить план');n.capture('draft-confirmed-200',True);n.ok('draft-plan-warning-explicit-confirmation')
# Empty selection and missing-funds state use the real savings form.
n.q.fixture(empty=True);n.start(390,844,1);n.root('savings');n.capture('savings-empty-goal',True)
n.typevalue('Сумма перевода',999);n.go('Положить');nodes=n.capture('savings-transfer-error',True);assert n.match(nodes,'В кошельке не хватает 899 монет.');n.ok('savings-invalid-transfer-visible')
print('Transient, onboarding and financial form states complete',flush=True)

