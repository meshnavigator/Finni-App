from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil
p=Path('artifacts/sprint-8/S8-001-matrix-v2');old=p.with_name('S8-001-matrix-v1')
prov={'date':'2026-09-25','newImageGenCalls':0,'sourcePrompts':'../S8-001-matrix-v1/imagegen-prompts.json','sourceDonors':[],'changes':'mechanical registration, exact ear-fold masks, source root-fur backing, correct alpha occlusion; no pigment or facial painting','earTranslations':{'round':[[-6,-4],[-10,-4]],'floppy':[[-3,-10],[-12,-7]]},'rootBacking':'accepted original ear pixels within 30px of face; y780..1010','artAcceptance':{'pointyAll':'owner-accepted','allBodyPatterns':'owner-accepted','roundFloppyEarFitV2':'pending-owner-review'}}
for f in (p/'input').glob('*.png'):prov['sourceDonors'].append({'path':f.relative_to(p).as_posix(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'sameAsV1':f.read_bytes()==(old/'input'/f.name).read_bytes()})
(p/'provenance.json').write_text(json.dumps(prov,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out=Image.new('RGB',(780,900),'#faf5eb');d=ImageDraw.Draw(out)
for row,shape in enumerate(['round','floppy']):
 for col,pattern in enumerate(['plain','spots','stripes']):
  im=Image.open(p/'runtime'/f'{shape}-{pattern}-home.png').crop((410,945,695,1260)).resize((240,265));x=col*260;y=row*450;out.paste(im,(x+10,y+30));d.text((x+12,y+10),shape+'/'+pattern,fill='#253a44')
out=out.crop((0,0,780,760));out.save(p/'runtime/six-home-review.jpg')
