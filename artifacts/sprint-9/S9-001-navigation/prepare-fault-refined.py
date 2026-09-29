from pathlib import Path
R=Path('artifacts/sprint-9/S9-001-navigation');s=(R/'fault-run.py').read_text(encoding='utf-8');a=s.index(' # Opening navigation');b=s.index('finally:',a)
s=s[:a]+''' nodes=prepare('QA-thoughtful',1.19,True);tap(find(nodes,'home-pet-target'));time.sleep(.4);active=capture('thoughtful-119');geometry(active);review('thoughtful-119')
 for n in active:
  if n.get('text','').startswith(('Еда:','Уход:','Задумчиво')):
   x,y,r,b=map(int,re.findall(r'\\d+',n['bounds']));assert b-y<=23,n
 ok('thoughtful-119-readable')
'''+s[b:]
s=s.replace("(F/'results.json')", "(F/'results-refined.json')")
s=s.replace("targets=geometry(active);review(name)", "targets=geometry(active);review(name)\n  if scale<=1.2:\n   for n in active:\n    if n.get('text','').startswith(('Еда:','Уход:','Вдохновлён')):\n     x,y,r,b=map(int,re.findall(r'\\d+',n['bounds']));assert b-y<=23,n")
(R/'fault-refined.py').write_text(s,encoding='utf-8')
