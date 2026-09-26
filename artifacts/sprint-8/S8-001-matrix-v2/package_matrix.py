from pathlib import Path
import shutil,json,hashlib
from PIL import Image
P=Path('artifacts/sprint-8/S8-001-matrix-v2');OUT=Path('assets/2d/variants/FINNI-MATRIX-V1');OUT.mkdir(parents=True,exist_ok=True)
m=json.loads((P/'manifest.json').read_text(encoding='utf-8'));m['packageId']='FINNI-MATRIX-V1';m['revision']='ear-fit-v2';m['coatAcceptance']='all three coat patterns owner-accepted 2026-09-25';m['artStatus']='implemented-for-owner-review';m['rights']='Image Gen outputs generated for this project; provenance in S8-001-matrix-v2; original master retained';m['layerOrder']=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground'];m['assets']=[]
for v in m['variants']:
 src=P/'variants'/v['id'];dst=OUT/v['id'];shutil.copytree(src,dst,dirs_exist_ok=True)
 v['artStatus']='owner-accepted' if v['id'] in ['pointy-plain','pointy-spots','pointy-stripes'] else 'pending-owner-review'
 for f in sorted(dst.rglob('*')):
  if not f.is_file():continue
  a={'path':f.relative_to(OUT).as_posix(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
  if f.suffix=='.png':
   with Image.open(f) as im:a['dimensions']=list(im.size)
  m['assets'].append(a)
(OUT/'asset-manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Packaged 9 shapes/coats; runtime mapping is maintained in TypeScript')
