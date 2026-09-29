from pathlib import Path
R=Path('artifacts/sprint-9/S9-001-navigation');s=(R/'routes.py').read_text(encoding='utf-8');s=s[:s.index('for scale in (1,1.19):')];s=s.replace("(R/'routes.json')", "(R/'delivery.json')").replace("q.OUT=R/'routes'", "q.OUT=R/'delivery'")
s+='''q.adb('install','-r',str(apk.resolve()))
q.fixture();q.start(390,844,1);nodes=capture('home')
for tab in ('plan','shop','savings','more','home'):
 tap(find(nodes,'root-tab-'+tab));nodes=capture('root-'+tab);selected(nodes,tab);preview('root-'+tab,390,844);ok('delivery-root-'+tab)
tap(find(nodes,'root-tab-more'));nodes=capture('more-editor-start');tap(find(nodes,'Имя и внешность'));editor=capture('editor-before-save');tap(scrollfind(editor,'Готово',844));nodes=capture('editor-saved');selected(nodes,'more');ok('editor-save-returns-more')
tap(find(nodes,'Имя и внешность'));editor=capture('editor-before-cancel');tap(scrollfind(editor,'Отмена',844));nodes=capture('editor-cancelled');selected(nodes,'more');ok('editor-cancel-returns-more')
tap(find(nodes,'root-tab-home'));nodes=capture('final-home');money(nodes)
tap(find(nodes,'root-tab-savings'));savings=capture('final-transfer-root');tap(find(savings,'Сумма перевода'));q.adb('shell','input','text','20');q.adb('shell','input','keyevent','4');time.sleep(.2);savings=capture('final-transfer-input');tap(find(savings,'Положить'));dialog=capture('final-transfer-confirm');assert not find(dialog,'root-navigation');tap(find(dialog,'Отмена'));nodes=back('final-transfer-cancel-home');money(nodes);ok('delivery-transfer-cancel')
q.start(360,640,2);nodes=capture('large-home');tap(find(nodes,'home-sections'));menu=capture('large-menu');preview('large-menu',360,640)
tap(scrollfind(menu,'root-tab-more'));nodes=capture('large-more');preview('large-more',360,640);tap(scrollfind(nodes,'Для взрослого'));adult=capture('large-adult');assert not find(adult,'root-navigation');assert any('Защита от случайного входа' in n.get('text','') for n in adult);nodes=back('large-adult-back');assert find(nodes,'more-screen');ok('delivery-large-adult-barrier-back')
# Real TalkBack availability and offline bundle evidence are recorded separately.
print('PASS',len(results),'exact delivery checks',flush=True)
'''
(R/'delivery.py').write_text(s,encoding='utf-8')
