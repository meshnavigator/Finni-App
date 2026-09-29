from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/matrix.py');s=p.read_text(encoding='utf-8')
s=s.replace("n.q.fixture();n.start()\nfor label", """n.q.fixture();n.start()
for tab in ('home','plan','shop','savings','more'):
 nodes=n.root(tab);tabs=[x for x in nodes if x.get('resource-id','').startswith('root-tab-')]
 assert len(tabs)==5 and [x['resource-id'] for x in tabs if x.get('selected')=='true']==['root-tab-'+tab]
 audit('root-final-'+tab)
for label""")
p.write_text(s,encoding='utf-8')

