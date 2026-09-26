import native as n
import json
n.save=lambda:(n.R/'matrix.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
def audit(name):
 nodes=n.capture(name,True);full=[];clipped=[];edge=n.clipped_keys(n.q.OUT/(name+'.xml'))
 for x in nodes:
  if x.get('package')!=n.q.PKG or x.get('clickable')!='true':continue
  a,b,c,d=n.bounds(x)
  if (x.get('bounds'),x.get('content-desc'),x.get('text')) in edge or b<=24 or d>=n.H-48:clipped.append(x.get('content-desc') or x.get('text'));continue
  assert c-a>=48 and d-b>=48,(name,x)
  full.append({'label':x.get('content-desc') or x.get('text'),'bounds':x['bounds']})
 # The same app inset boundary is present at every profile.
 assert all(n.bounds(x)[0]>=0 and n.bounds(x)[2]<=n.W for x in nodes if x.get('clickable')=='true'),name
 n.ok(name,fullyVisibleTargets=full,scrollClippedTargets=clipped)
 return nodes
def route(w,h,scale,label,name,target=None):
 n.q.fixture();n.start(w,h,scale);n.detail(label);nodes=audit(name+'-top')
 if target:
  n.scrollfind(nodes,target);audit(name+'-end')
 n.back()
def study(w,h,scale,lid,target):
 n.q.fixture();n.start(w,h,scale);n.detail('Все занятия');n.lesson(lid);nodes=audit(lid+'-'+str(w)+'-'+str(scale)+'-top')
 n.scrollfind(nodes,target);audit(lid+'-'+str(w)+'-'+str(scale)+'-control')
 n.scrollfind(n.capture('current'),'Проверить решение');audit(lid+'-'+str(w)+'-'+str(scale)+'-actions')
 n.back();n.back()
n.q.fixture();n.start()
for tab in ('home','plan','shop','savings','more'):
 nodes=n.root(tab);tabs=[x for x in nodes if x.get('resource-id','').startswith('root-tab-')]
 assert len(tabs)==5 and [x['resource-id'] for x in tabs if x.get('selected')=='true']==['root-tab-'+tab]
 audit('root-final-'+tab)
for label,name in [('Все занятия','catalog-final'),('Прогресс','history-final'),('Имя и внешность','pet-final'),('Как играть','help-final'),('Для взрослого','adult-final')]:
 n.detail(label);audit(name);n.back()
route(360,640,1,'Все занятия','catalog-360-100','Вернуться в «Ещё»')
route(360,640,1.19,'Имя и внешность','pet-360-119','Готово')
route(360,640,1.5,'Как играть','help-360-150','Вернуться туда, где я был')
route(360,640,2,'Для взрослого','adult-360-200','Доступный вариант без удержания')
route(390,844,1.19,'Прогресс','history-390-119','Вернуться')
route(390,844,1.5,'Имя и внешность','pet-390-150','Готово')
study(390,844,2,'LS-B01','Нужное')
route(412,915,1,'Как играть','help-412-100','Вернуться туда, где я был')
study(412,915,1.19,'LS-B03','○ Сделать')
study(412,915,1.5,'LS-P03','Исправленный итог')
study(412,915,2,'LS-S02','Оставить покупку на потом')
study(360,640,2,'LS-P01','Добавить food_30')
study(360,640,2,'LS-P03','Исправленный итог')
study(360,640,2,'LS-B03','○ Сделать')
route(360,640,2,'Имя и внешность','pet-360-200','Готово')
route(360,640,2,'Как играть','help-360-200','Вернуться туда, где я был')
route(360,640,2,'Прогресс','history-360-200','Вернуться')
route(360,640,2,'Все занятия','catalog-360-200','Вернуться в «Ещё»')
print('Matrix complete',flush=True)

