from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/native.py');s=p.read_text(encoding='utf-8')
s=s.replace('results=[];shots=[]','results=[];shots=[];CURRENT=None')
s=s.replace("def capture(name,review=False):\n", "def capture(name,review=False):\n global CURRENT\n")
s=s.replace("try:nodes=q.capture(name);break","""try:
   if name in ('current','scroll','history-scroll'):
    q.adb('shell','uiautomator','dump','/sdcard/finni-s9.xml')
    raw=q.adb('shell','cat','/sdcard/finni-s9.xml');(q.OUT/(name+'.xml')).write_bytes(raw)
    nodes=[dict(x.attrib) for x in q.ET.fromstring(raw).iter('node')]
   else:nodes=q.capture(name)
   break""")
s=s.replace(" return nodes\ndef tap", " CURRENT=nodes\n return nodes\ndef tap")
s=s.replace("nodes=nodes or capture('current')","nodes=nodes or CURRENT or capture('current')")
s=s.replace("nodes or capture('current'),label", "nodes or CURRENT or capture('current'),label")
p.write_text(s,encoding='utf-8')
p=Path('artifacts/sprint-9/S9-003-004-details/matrix.py');s=p.read_text(encoding='utf-8')
s=s.replace("route(360,640,1,'Все занятия'", """n.q.fixture();n.start()
for label,name in [('Все занятия','catalog-final'),('Прогресс','history-final'),('Имя и внешность','pet-final'),('Как играть','help-final'),('Для взрослого','adult-final')]:
 n.detail(label);audit(name);n.back()
route(360,640,1,'Все занятия'""")
p.write_text(s,encoding='utf-8')

