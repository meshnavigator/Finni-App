"""Package owner-approved spotted coat; compose its body onto the accepted blink frame."""
from pathlib import Path
from PIL import Image, ImageChops
import hashlib,json,shutil
P=Path(__file__).resolve().parent;APP=P.parents[3]
ART=APP/'artifacts/sprint-8/S8-001-anatomy-spots-v2'
MASTER=APP/'assets/2d/master/FINNI-2D-MASTER-V1'
ORDER=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground']
def load(p):return Image.open(p).convert('RGBA')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def diff(a,b):return sum(x!=y and (x[3]>0 or y[3]>0) for x,y in zip(a.getdata(),b.getdata()))
neutral=load(MASTER/'pet_neutral_canvas_v1.png');originalBlink=load(MASTER/'pet_blink_canvas_v1.png')
approved=load(ART/'review/spots-neutral.png')
assert sha(MASTER/'pet_neutral_canvas_v1.png')=='8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'
assert sha(MASTER/'pet_blink_canvas_v1.png')=='2797ab29e3d6b91d4342f80a71c892a574751513833c569c53e7f8c077b51905'
shutil.copyfile(ART/'review/spots-neutral.png',P/'neutral.png')
# Only the approved coat pixels change; blink head, pose and alpha stay accepted.
selection=Image.new('L',neutral.size)
selection.putdata([255 if a!=b and (a[3]>0 or b[3]>0) else 0 for a,b in zip(neutral.getdata(),approved.getdata())])
blink=Image.composite(approved,originalBlink,selection);blink.putalpha(originalBlink.getchannel('A'));blink.save(P/'blink.png')
assert ImageChops.difference(blink.getchannel('A'),originalBlink.getchannel('A')).getbbox() is None
assert not any(a!=b and (a[3]>0 or b[3]>0) and k==0 for a,b,k in zip(blink.getdata(),originalBlink.getdata(),selection.getdata()))
crop=(240,690,730,1310)
approved.crop(crop).save(P/'preview.png');neutral.crop(crop).save(P/'plain-preview.png')
(P/'layers').mkdir(exist_ok=True)
for n in ORDER:shutil.copyfile(ART/'export'/f'{n}.png',P/'layers'/f'{n}.png')
(P/'source').mkdir(exist_ok=True);shutil.copyfile(ART/'source/finni-expressive-spots.ora',P/'source/finni-expressive-spots.ora')
files=[]
for rel in ['neutral.png','blink.png','preview.png','plain-preview.png']+[f'layers/{n}.png' for n in ORDER]:
 im=load(P/rel);files.append({'path':rel,'sha256':sha(P/rel),'dimensions':list(im.size)})
manifest={'packageId':'FINNI-POINTY-SPOTS-V1','artStatus':'owner-accepted-2026-09-25','integrationScope':'pointy/spots only; other seven unapproved combinations not covered','appearance':{'shapeId':'pointy','patternId':'spots'},'canvas':[941,1672],'origin':[0,0],'feetAnchor':[470,1272],'stageScales':[.86,1,1.12],'runtimeFrames':['neutral','blink'],'neutralExportLayerOrder':ORDER,'source':{'approvedCandidate':'S8-001-anatomy-spots-v2','approvedNeutralSha256':sha(ART/'review/spots-neutral.png'),'originalNeutralSha256':sha(MASTER/'pet_neutral_canvas_v1.png'),'originalBlinkSha256':sha(MASTER/'pet_blink_canvas_v1.png'),'oraSha256':sha(P/'source/finni-expressive-spots.ora')},'verification':{'neutralDifferenceFromApproved':diff(approved,load(P/'neutral.png')),'blinkDifferenceOutsideCoat':0,'blinkAlphaDifference':0,'changedCoatPixelCount':sum(k>0 for k in selection.getdata())},'assets':files}
(P/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Two frames together for a visual blink continuity audit.
review=Image.new('RGBA',(980,620),(248,244,235,255));review.alpha_composite(approved.crop(crop),(0,0));review.alpha_composite(blink.crop(crop),(490,0))
run=APP/'artifacts/sprint-8/S8-001-spots-runtime';run.mkdir(exist_ok=True);review.save(run/'neutral-blink-audit.png')
print(json.dumps(manifest['verification']))
