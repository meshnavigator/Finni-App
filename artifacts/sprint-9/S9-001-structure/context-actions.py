
"""Synthetic presentation-only fixtures; no financial command is committed."""
from pathlib import Path
import importlib.util,json,sqlite3,time,re,hashlib
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'delivery'
def tap(n):
    x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.4)
def find(nodes,label):
    return next(n for n in nodes if n.get('resource-id')==label or n.get('text','').lower()==label.lower() or label in n.get('content-desc',''))
results=[]
for kind,saved,empty,label in [('choose',0,True,'Выбрать мечту'),('save',0,False,'Отложить на мечту'),('review',10,False,'Проверить итоги')]:
    q.fixture(empty=empty)
    with sqlite3.connect(q.FIXTURE) as db:
        profile=db.execute('select id from profile').fetchone()[0];period=db.execute('select id from period where state=?',('ACTIVE',)).fetchone()[0]
        db.execute('UPDATE wallet_projection SET savings=?',(saved,))
        for slot,item_id,name,price,effect in [('food','IT-01','Полезный корм',30,'Финни сыт'),('care','IT-03','Щётка для шерсти',10,'Уход за Финни')]:
            item={'id':item_id,'name':name,'price':price,'category':'need','slot':slot,'effect':effect}
            db.execute('INSERT OR REPLACE INTO purchase(id,command_id,profile_id,period_id,slot,item_id,item_snapshot,price,created_at) VALUES(?,?,?,?,?,?,?,?,?)',('qa-'+slot,'qa-'+slot,profile,period,slot,item_id,json.dumps(item,ensure_ascii=False),price,'2026-09-25'))
    q.adb('push',str(q.FIXTURE),'/data/local/tmp/finni-s9-home.db')
    q.adb('shell',f'cp /data/local/tmp/finni-s9-home.db {q.REMOTE} && chown 10080:10080 {q.REMOTE} && chmod 600 {q.REMOTE}')
    q.start(390,844,1);nodes=q.capture('next-'+kind)
    primary=find(nodes,'home-primary');assert label in primary['content-desc'],primary
    tap(primary);opened=q.capture('next-'+kind+'-opened')
    content=' '.join(n.get('text','')+n.get('content-desc','') for n in opened)
    assert ('ПРЕДВАРИТЕЛЬНЫЙ ИТОГ' if kind=='review' else 'КОПИЛКА') in content,content
    if kind=='review':
        for i in range(4):
            candidates=[n for n in opened if 'Завершить день' in n.get('content-desc','') and n.get('clickable')=='true']
            if candidates:break
            q.adb('shell','input','swipe','190','650','190','280','300');time.sleep(.3);opened=q.capture('review-scroll-'+str(i))
        assert candidates
        tap(candidates[0]);dialog=q.capture('close-day-confirm')
        assert any('Завершить день?' in n.get('text','') for n in dialog),dialog
        tap(find(dialog,'Вернуться'))
    q.adb('shell','input','keyevent','4');time.sleep(.4);home=q.capture('next-'+kind+'-returned')
    assert any(n.get('resource-id')=='home-primary' for n in home)
    for value in ('Доступно: 100 монет','Копилка: '+str(saved)+' монет'):
        assert any(n.get('content-desc')==value for n in home),value
    results.append({'case':kind,'label':label,'moneyUnchanged':True,'pass':True})
(R/'context-actions.json').write_text(json.dumps({'apkSha256':hashlib.sha256(Path('android/app/build/outputs/apk/release/app-release.apk').read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS',len(results),'context actions; day-close confirmation cancelled')

