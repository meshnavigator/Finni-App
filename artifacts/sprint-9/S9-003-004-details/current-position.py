from pathlib import Path
import xml.etree.ElementTree as E
r=Path('artifacts/sprint-9/S9-003-004-details')
print((r/'matrix.log').read_text(encoding='utf-8-sig')[-700:])
print([(n.get('text') or n.get('content-desc'),n.get('bounds')) for n in E.parse(r/'android/scroll.xml').iter('node') if n.get('text') or n.get('content-desc')][-12:])
