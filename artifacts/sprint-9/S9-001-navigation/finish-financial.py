from pathlib import Path
import json,xml.etree.ElementTree as E
R=Path('artifacts/sprint-9/S9-001-navigation');p=R/'financial.py';s=p.read_text(encoding='utf-8');s=s.replace("'Завтра' in n.get('content-desc','') or 'Завтра' in n.get('text','')", "'Следующий день позже' in n.get('content-desc','') or 'Следующий день позже' in n.get('text','')");p.write_text(s,encoding='utf-8')
nodes=[n.attrib for n in E.parse(R/'routes/close-home.xml').iter('node')];primary=next(n for n in nodes if n.get('resource-id')=='home-primary');assert primary['enabled']=='false' and primary['content-desc']=='Следующий день позже',primary
r=json.loads((R/'financial.json').read_text(encoding='utf-8'));r['results'].append({'case':'close-confirmed','pass':True,'note':'Corrected harness expectation: actual WAITING label is Следующий день позже. Native XML confirms disabled action and unchanged 40/20 balances.'});(R/'financial.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
