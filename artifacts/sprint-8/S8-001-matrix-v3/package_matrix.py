from pathlib import Path
import shutil,json,hashlib
from PIL import Image
P=Path('artifacts/sprint-8/S8-001-matrix-v3');OUT=Path('assets/2d/variants/FINNI-MATRIX-V1');OUT.mkdir(parents=True,exist_ok=True)
m=json.loads((P/'manifest.json').read_text(encoding='utf-8'));assert len(m['variants'])==9, 'Do not package a draft';m['packageId']='FINNI-MATRIX-V1';m['revision']='ear-seams-v3';m['coatAcceptance']='all three coat patterns owner-accepted 2026-09-25';m['artStatus']='implemented-for-owner-review';m['rights']='Image Gen outputs generated for this project; provenance in S8-001-matrix-v3; original master retained';m['layerOrder']=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground'];m['assets']=[]
approval=json.loads((P/'acceptance.json').read_text(encoding='utf-8'))
accepted={v['id']:v for v in approval['variants']}
def is_accepted(v):return all(v[k]==accepted.get(v['id'],{}).get(k) for k in ['neutralSha256','blinkSha256','oraSha256'])
allAccepted=all(is_accepted(v) for v in m['variants'])
m['status']=m['artStatus']='owner-accepted' if allAccepted else 'art-review-candidate'
if allAccepted:m['artAcceptance']={'date':approval['date'],'revision':approval['revision'],'record':'artifacts/sprint-8/S8-001-matrix-v3/acceptance.json','scope':approval['scope']}
else:m.pop('artAcceptance',None)
for v in m['variants']:
 src=P/'variants'/v['id'];dst=OUT/v['id'];shutil.copytree(src,dst,dirs_exist_ok=True)
 v['artStatus']='owner-accepted' if is_accepted(v) else 'pending-owner-review'
 for f in sorted(dst.rglob('*')):
  if not f.is_file():continue
  a={'path':f.relative_to(OUT).as_posix(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
  if f.suffix=='.png':
   with Image.open(f) as im:a['dimensions']=list(im.size)
  m['assets'].append(a)
(OUT/'asset-manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Packaged 9 shapes/coats; runtime mapping is maintained in TypeScript')
