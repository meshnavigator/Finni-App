from pathlib import Path
import json
p=Path('artifacts/sprint-8/S8-001-matrix-v3');old=p.with_name('S8-001-matrix-v1')/'variants';rows=[]
for name in ['pointy-plain','pointy-spots','pointy-stripes']:
 for f in (old/name).rglob('*'):
  if f.is_file():
   equal=f.read_bytes()==(p/'variants'/f.relative_to(old)).read_bytes();assert equal;rows.append({'path':f.relative_to(old).as_posix(),'byteIdentical':equal})
(p/'pointy-preservation.json').write_text(json.dumps({'status':'PASS','fileCount':len(rows),'files':rows},indent=2)+'\n',encoding='utf-8')
print(len(rows),'pointy files identical')
