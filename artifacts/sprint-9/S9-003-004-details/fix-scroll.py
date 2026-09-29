from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/native.py');s=p.read_text(encoding='utf-8')
s=s.replace("str(H-140 if down else 150),str(W//2),str(140 if down else H-140),'300'","str(int(H*.75) if down else int(H*.28)),str(W//2),str(int(H*.28) if down else int(H*.75)),'750'")
s=s.replace('def scrollfind(nodes,label,limit=22):','def scrollfind(nodes,label,limit=40):')
p.write_text(s,encoding='utf-8')
p=Path('artifacts/sprint-9/S9-003-004-details/lessons.py');s=p.read_text(encoding='utf-8')
s=s.replace('import json','import json,sys')
s=s.replace("n.q.fixture()","""if '--resume' not in sys.argv:n.q.fixture()
else:
 saved=json.loads((n.R/'lessons.json').read_text(encoding='utf-8'));n.results=saved['checks'];n.shots=saved['screens']""")
s=s.replace("for lid in names:","""completed={x['case'].replace('-history-reopen','') for x in n.results if x['case'].endswith('-history-reopen')}
for lid in names:
 if lid in completed:continue""")
p.write_text(s,encoding='utf-8')

