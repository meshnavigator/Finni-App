from pathlib import Path
import native as n
import json,sys
n.save=lambda:(n.R/'lessons.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
n.q.adb('install','-r',str(n.APK.resolve()))
if '--resume' not in sys.argv:n.q.fixture()
else:
 saved=json.loads((n.R/'lessons.json').read_text(encoding='utf-8'));n.results=saved['checks'];n.shots=saved['screens']
names=['LS-B01','LS-B02','LS-B03','LS-P01','LS-P02','LS-P03','LS-S01','LS-S02']
completed={x['case'].replace('-history-reopen','') for x in n.results if x['case'].endswith('-history-reopen')}
for lid in names:
 if lid in completed:continue
 n.start();n.detail('Все занятия');nodes,data,v=n.lesson(lid)
 n.capture(lid+'-intro',True)
 solution=v['fixtures'][0]['solution'];p=v['params'];mechanic=data['mechanic']
 if mechanic=='allocation':
  for key,label in [('need','Нужное'),('want','Желания'),('save','На мечту')]:
   n.typevalue(label,solution[key])
 elif mechanic=='basket':
  for key,count in solution['packageCountByOfferId'].items():
   for _ in range(count):n.go('Добавить '+key)
  n.typevalue('Итог по чеку',solution['statedTotal']);n.typevalue('Сколько останется',solution['statedRemainder'])
 elif mechanic=='resource_choice':
  for item in p['requiredResources']:
   if item['id'] in solution['checkedOwnedResourceIds']:n.go('☐ '+item['title']+' · если докупать, '+str(item['packPrice']))
  n.go('○ Сделать')
  n.capture(lid+'-selected',True)
  for key,label in [('need','На нужное'),('want','На выбранный способ'),('save','На мечту')]:n.typevalue(label,solution['allocation'][key])
 elif mechanic=='receipt_audit':
  n.go('☐ Мяч · 1 × 20');n.capture(lid+'-selected',True)
  n.typevalue('Исправленный итог',solution['correctedTotal']);n.typevalue('Ожидаемая сдача',solution['expectedChange'])
 elif 'deposits' in solution:
  for i,amount in enumerate(solution['deposits']):n.typevalue(f"Игровой день {i+1}: до {p['maxDeposits'][i]}",amount)
 else:
  n.typevalue(f"Снять из копилки (от 0 до {p['savings']})",solution['withdrawal']);n.go('Купить занятие за '+str(p['itemCost']))
 n.capture(lid+'-solution',True)
 n.go('Проверить решение');n.capture(lid+'-evaluated',True)
 n.go('Показать объяснение');n.capture(lid+'-explanation',True)
 if lid=='LS-P03':
  n.go('Кажется, мяч указан дважды. Давайте проверим');n.go('Проверить решение');n.go('Показать объяснение')
 n.go('Завершить занятие');nodes=n.capture(lid+'-completed',True)
 # Completion is persisted; the reward is granted only for the first lesson.
 assert n.match(nodes,'Мы сохранили это открытие') or n.match(nodes,'Получено 20') or n.match(nodes,'Награда за занятие'),lid
 n.ok(lid+'-complete')
 n.start();n.detail('Прогресс');nodes=n.go(data['title']+' '+ 'unused') if False else n.capture('history-current')
 # Read the discovery in the real progress screen, scrolling by the visible title.
 target=None
 for _ in range(24):
  target=n.find(nodes,data['title'])
  if target and n.bounds(target)[3]-n.bounds(target)[1]>=20:break
  n.swipe();nodes=n.capture('history-scroll')
 assert target,lid
 n.tap(target);n.capture(lid+'-history',True);n.ok(lid+'-history-reopen')
n.start();home=n.capture('lessons-wallet',True);assert n.find(home,'Доступно: 120 монет');assert n.find(home,'Копилка: 0 монет')
n.ok('eight-completions-only-one-reward-wallet120')
print('All eight lessons completed through native UI',flush=True)

