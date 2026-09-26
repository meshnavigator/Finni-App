import xml.etree.ElementTree as E
from pathlib import Path
r=Path('artifacts/sprint-9/S9-003-004-details')
p=r/'android/goal-claim-cancel-dialog.xml'
print([n.get('text') for n in E.parse(p).iter('node') if n.get('text')])
print((r/'children.log').read_text(encoding='utf-8-sig'))
