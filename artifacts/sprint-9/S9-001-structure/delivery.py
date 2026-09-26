
from pathlib import Path
import importlib.util,json,re,time,hashlib
from PIL import Image
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'delivery';q.OUT.mkdir(exist_ok=True)
apk=Path('android/app/build/outputs/apk/release/app-release.apk')
results=[]
def save():(R/'delivery.json').write_text(json.dumps({'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
def find(nodes,label):
    exact=[n for n in nodes if n.get('content-desc')==label or n.get('resource-id')==label or n.get('text','').lower()==label.lower()]
    return exact[0] if exact else next(n for n in nodes if label in n.get('content-desc',''))
def tap(n):
    x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.5)
def money(nodes):
    return [n.get('content-desc') for n in nodes if n.get('content-desc','').startswith(('Доступно:','Копилка:'))]
def back():
    q.adb('shell','input','keyevent','4');time.sleep(.5)
    return q.capture('returned-home')
def checked(nodes):
    assert any(n.get('resource-id')=='home-primary' for n in nodes)
    assert money(nodes)==['Доступно: 100 монет','Копилка: 0 монет'],money(nodes)
q.adb('install','-r',str(apk.resolve()))
q.fixture();q.start(390,844,1);nodes=q.capture('home');checked(nodes)
for label in ('План','Покупки','Копилка','home-goal','home-primary','home-pet-target','home-lesson'):
    tap(find(nodes,label));opened=q.capture('route-'+label.replace(' ','-'))
    assert not any(n.get('resource-id')=='home-primary' for n in opened),label
    if label=='Покупки':
        tap(find(opened,'Посмотреть и купить'));dialog=q.capture('purchase-confirm')
        assert any('Подтвердить покупку?' in n.get('text','')+n.get('content-desc','') for n in dialog)
        tap(find(dialog,'Отмена'));q.capture('purchase-cancelled')
        results.append({'case':'purchase-confirm-cancel','pass':True});save()
    if label=='Копилка':
        tap(find(opened,'Сумма перевода'));q.adb('shell','input','text','20')
        q.adb('shell','input','keyevent','4');time.sleep(.3)
        transfer=q.capture('savings-input');tap(find(transfer,'Положить'));dialog=q.capture('savings-confirm')
        assert any('Положить в копилку?' in n.get('text','')+n.get('content-desc','') for n in dialog)
        tap(find(dialog,'Отмена'));q.capture('savings-cancelled')
        results.append({'case':'savings-confirm-cancel','pass':True});save()
    if label=='home-lesson':
        content=' '.join(n.get('text','')+n.get('content-desc','') for n in opened)
        assert 'На что хватит сегодня?' in content,content
        assert 'Выбери занятие' not in content
    nodes=back();checked(nodes)
    results.append({'case':'route-'+label,'moneyUnchanged':True,'pass':True});save()
for label in ('Все занятия','Прогресс','О питомце','Как играть','Для взрослого'):
    tap(find(nodes,'home-sections'));menu=q.capture('menu-'+label)
    assert not any(n.get('resource-id')=='home-primary' for n in menu)
    target=find(menu,label);tap(target);opened=q.capture('menu-route-'+label)
    assert not any(n.get('resource-id')=='home-primary' for n in opened),label
    if label=='Для взрослого':
        content=' '.join(n.get('text','')+n.get('content-desc','') for n in opened)
        assert 'Сбросить' not in content,content
    nodes=back();checked(nodes)
    results.append({'case':'menu-route-'+label,'moneyUnchanged':True,'pass':True});save()
tap(find(nodes,'home-sections'));q.capture('modal-open');nodes=back();checked(nodes)
results.append({'case':'modal-back','pass':True});save()
q.start(360,640,2);nodes=q.capture('large-home')
tap(find(nodes,'home-sections'));menu=q.capture('large-menu')
assert any(n.get('selected')=='true' and 'Домик' in n.get('content-desc','') for n in menu),menu
for label in ('План','Покупки','Копилка'):assert any(label in n.get('content-desc','') for n in menu),label
tap(find(menu,'Покупки'));nodes=back();checked(nodes)
results.append({'case':'large-navigation','pass':True});save()
for name,w,h,scale,long in [('ordinary',390,844,1,False),('small',360,640,1,False),('large',360,640,2,False),('large-stress',360,640,2,True),('short-119-stress',360,640,1.19,True)]:
    q.fixture(long=long);q.start(w,h,scale);nodes=q.capture(name);issues=[];targets=[]
    for n in nodes:
        if n.get('clickable')!='true':continue
        x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
        if r-x<48 or b-y<48 or y<24 or b>h-48:issues.append(n)
        targets.append((n.get('content-desc'),x,y,r,b))
    for i,(a,x,y,r,b) in enumerate(targets):
        for c,xx,yy,rr,bb in targets[i+1:]:
            if min(r,rr)>max(x,xx) and min(b,bb)>max(y,yy):issues.append({'overlap':[a,c]})
    im=Image.open(q.OUT/(name+'.png'));factor=min(im.width/w,im.height/h);x=(im.width-w*factor)/2;y=(im.height-h*factor)/2
    im.crop((round(x),round(y),round(x+w*factor),round(y+h*factor))).resize((w,h),Image.Resampling.LANCZOS).save(R/'review'/(name+'.png'))
    assert not issues,(name,issues)
    results.append({'case':'final-'+name,'pass':True});save()
print('PASS',len(results),'delivery checks',flush=True)

