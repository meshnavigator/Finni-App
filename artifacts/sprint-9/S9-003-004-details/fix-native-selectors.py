from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/native.py');s=p.read_text(encoding='utf-8')
s=s.replace("return next((n for n in nodes if n.get('resource-id')==label or n.get('content-desc')==label or n.get('text','').casefold()==label.casefold()),None)","return next((n for n in nodes if n.get('resource-id')==label),None) or next((n for n in nodes if n.get('content-desc')==label),None) or next((n for n in nodes if n.get('text','').casefold()==label.casefold()),None)")
p.write_text(s,encoding='utf-8')
p=Path('artifacts/sprint-9/S9-003-004-details/lessons.py');s=p.read_text(encoding='utf-8')
s=s.replace("target=n.scrollfind(nodes,data['title']);n.tap(target);", """target=None
 for _ in range(24):
  target=n.find(nodes,data['title'])
  if target and n.bounds(target)[3]-n.bounds(target)[1]>=20:break
  n.swipe();nodes=n.capture('history-scroll')
 assert target,lid
 n.tap(target);""")
p.write_text(s,encoding='utf-8')

