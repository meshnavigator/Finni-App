import native as n
import sqlite3,json,re
n.save=lambda:(n.R/'children.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
def seek(text):
 for _ in range(35):
  nodes=n.capture('current');node=n.match(nodes,text)
  if node and n.bounds(node)[3]>n.bounds(node)[1]:return node
  n.swipe()
 raise AssertionError(text)
# Obtain additional income through the real completed lesson, then use both form paths.
n.q.fixture();n.start();n.detail('Все занятия');nodes,data,v=n.lesson('LS-B01')
for key,label in [('need','Нужное'),('want','Желания'),('save','На мечту')]:n.typevalue(label,v['fixtures'][0]['solution'][key])
for label in ['Проверить решение','Показать объяснение','Завершить занятие']:n.go(label)
n.back();n.back();n.root('plan');n.go('Распределить новый доход')
for label,value in [('Сумма Нужно',10),('Сумма Хочется',0),('Сумма На мечту',5)]:n.typevalue(label,value)
n.capture('additional-income-form',True);n.go('Оставить пока');n.capture('additional-income-cancel',True)
seek('Ещё можно распределить: 20');n.ok('additional-income-cancel')
n.go('Распределить новый доход');n.go('Добавить к плану');seek('Дополнение 1: 10 / 0 / 5');n.capture('additional-income-committed',True);n.ok('additional-income-confirm')
n.root('home');nodes=n.capture('additional-income-wallet',True);assert n.find(nodes,'Доступно: 120 монет');n.ok('additional-income-keeps-wallet')
# Reached-goal UI fixture; only QA projection changes, then actual withdraw/claim commands.
n.q.fixture()
with sqlite3.connect(n.q.FIXTURE) as db:db.execute('UPDATE wallet_projection SET savings=500')
n.q.adb('push',str(n.q.FIXTURE),'/data/local/tmp/finni-qa-reached.db');n.q.adb('shell',f'cp /data/local/tmp/finni-qa-reached.db {n.q.REMOTE} && chown 10080:10080 {n.q.REMOTE} && chmod 600 {n.q.REMOTE} && rm -f {n.q.REMOTE}-wal {n.q.REMOTE}-shm')
n.start();n.root('savings');n.go('Получить цель');n.capture('goal-claim-cancel-dialog',True);n.go('Отмена');n.root('home');nodes=n.capture('goal-cancel-wallet',True);assert n.find(nodes,'Копилка: 500 монет');n.ok('goal-claim-cancel')
n.root('savings');n.typevalue('Сумма перевода',10);n.go('Снять');n.capture('withdraw-confirm-dialog',True);n.go('Подтвердить');n.root('home');nodes=n.capture('withdraw-committed',True);assert n.find(nodes,'Доступно: 110 монет') and n.find(nodes,'Копилка: 490 монет');n.ok('withdraw-confirm')
n.root('savings');n.go('Получить цель');nodes=n.capture('goal-claim-confirm-dialog',True)
text=' '.join(x.get('text','')+' '+x.get('content-desc','') for x in nodes);cost=int(re.search(r'спишется (\d+) монет',text).group(1));n.go('Получить');n.root('home');nodes=n.capture('goal-claimed-home',True)
assert n.find(nodes,f'Копилка: {490-cost} монет') and n.find(nodes,'Доступно: 110 монет');n.ok('goal-claim-confirm-excess-retained',goalCost=cost)
print('Additional income / withdrawal / goal states complete',flush=True)
