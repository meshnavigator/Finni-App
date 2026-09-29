import native as n
import json
n.save=lambda:(n.R/'extras.json').write_text(json.dumps({'apkSha256':n.hashlib.sha256(n.APK.read_bytes()).hexdigest(),'checks':n.results,'screens':n.shots},ensure_ascii=False,indent=2),encoding='utf-8')
n.q.fixture();n.start()
n.detail('Для взрослого')
nodes=n.capture('adult-hold-before')
button=n.match(nodes,'Удерживать для входа');a,b,c,d=n.bounds(button)
n.q.adb('shell','input','swipe',str((a+c)//2),str((b+d)//2),str((a+c)//2),str((b+d)//2),'3400')
nodes=n.capture('adult-hold-unlocked',True);assert n.match(nodes,'Факты о прогрессе');n.ok('adult-real-hold-unlock')
# Existing preferences keep their persisted commands.
old=n.scrollfind(n.CURRENT,'Движение Финни')['checked'];n.go('Движение Финни');nodes=n.capture('adult-motion-switched',True);assert n.find(nodes,'Движение Финни')['checked']!=old;n.ok('adult-motion-switch')
old=n.scrollfind(n.CURRENT,'Звуки Финни')['checked'];n.go('Звуки Финни');nodes=n.capture('adult-sound-switched',True);assert n.find(nodes,'Звуки Финни')['checked']!=old;n.ok('adult-sound-switch')
n.go('Удалить данные выбранного режима');nodes=n.capture('adult-delete-confirm',True)
assert n.match(nodes,'Удалить данные: обычная игра?');assert not n.find(nodes,'root-navigation')
n.go('Отмена');n.ok('adult-delete-cancel')
n.back();n.root('home');nodes=n.capture('adult-cancel-wallet',True);assert n.find(nodes,'Доступно: 100 монет');n.ok('adult-cancel-preserves-wallet')
# Background invalidates the adult session.
n.detail('Для взрослого');n.go('Доступный вариант без удержания');n.typevalue('Ответ на простой арифметический вопрос',5);n.go('Проверить ответ')
n.q.adb('shell','input','keyevent','3');n.q.adb('shell','am','start','-n',n.q.PKG+'/.MainActivity');n.time.sleep(1)
nodes=n.capture('adult-background-relocked',True);assert n.match(nodes,'Защита от случайного входа');n.ok('adult-background-relocks')
# Full accessible alternative and administrative controls at largest text.
n.q.fixture();n.start(360,640,2);n.detail('Для взрослого');n.go('Доступный вариант без удержания')
n.typevalue('Ответ на простой арифметический вопрос',4);nodes=n.capture('adult-arithmetic-invalid-200',True)
button=n.scrollfind(nodes,'Проверить ответ');assert button.get('enabled')=='false';n.ok('adult-wrong-answer-disabled-200')
n.typevalue('Ответ на простой арифметический вопрос',5);n.go('Проверить ответ');n.capture('adult-controls-200-top',True)
n.scrollfind(n.CURRENT,'Удалить данные выбранного режима');n.capture('adult-controls-200-end',True);n.ok('adult-unlocked-controls-200-scrollable')
# System night mode; app's warm palette is intentionally fixed, native dialog
# must remain readable against its dimmed underlying screen.
original=n.q.adb('shell','cmd','uimode','night').decode().strip();assert original=='Night mode: no'
(n.R/'night-original.json').write_text(json.dumps({'original':original}))
try:
 n.q.adb('shell','cmd','uimode','night','yes');n.q.fixture();n.start();n.root('shop');n.capture('system-night-shop',True)
 n.go('Посмотреть и купить');nodes=n.capture('system-night-confirm',True);assert not n.find(nodes,'root-navigation');n.go('Отмена');n.ok('night-native-confirm-cancel')
finally:n.q.adb('shell','cmd','uimode','night','no')
print('Adult and night-mode checks complete',flush=True)

