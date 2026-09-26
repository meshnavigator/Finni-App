"""Independent read-only check of candidate exports and visible/hidden ORA structure."""
from pathlib import Path
from PIL import Image,ImageChops
from xml.etree import ElementTree as ET
import io,zipfile,json,hashlib
P=Path(__file__).resolve().parent;APP=P.parents[2]
SRC=APP/'artifacts/sprint-8/S8-001-layer-prototype/layers'
MASTER=APP/'assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png'
ORDER=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground']
PARTS=['rear-left','rear-right','torso','chest','foreleg-left','foreleg-right']
def read(p):return Image.open(p).convert('RGBA')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def diff(a,b):return sum(x!=y and (x[3]>0 or y[3]>0) for x,y in zip(a.getdata(),b.getdata()))
master=read(MASTER);trial=read(P/'review/spots-neutral.png');matte=Image.open(P/'masks/coat-transfer.png').convert('L')
assert sha(MASTER)=='8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'
assert ImageChops.difference(master.getchannel('A'),trial.getchannel('A')).getbbox() is None
outside=sum(a!=b and (a[3]>0 or b[3]>0) and m==0 for a,b,m in zip(master.getdata(),trial.getdata(),matte.getdata()));assert outside==0
exports={n:read(P/'export'/f'{n}.png') for n in ORDER};assert len(list((P/'export').glob('*.png')))==9
for im in exports.values():assert im.size==(941,1672)
protected={n:sha(SRC/(n+'.png'))==sha(P/'export'/f'{n}.png') for n in ORDER if n!='pet-body'};assert all(protected.values())
partStats={}
for n in PARTS:
 a=read(P/'anatomy'/f'{n}-base.png');b=read(P/'anatomy'/f'{n}-spotted.png')
 assert ImageChops.difference(a.getchannel('A'),b.getchannel('A')).getbbox() is None
 partStats[n]=diff(a,b)
 if n in ['chest','torso']:assert partStats[n]==0
 else:assert partStats[n]>0
with zipfile.ZipFile(P/'source/finni-expressive-spots.ora') as z:
 assert z.testzip() is None and z.namelist()[0]=='mimetype' and z.read('mimetype')==b'image/openraster'
 root=ET.fromstring(z.read('stack.xml'));assert(root.attrib['w'],root.attrib['h'])==('941','1672')
 stack=root.find('stack');assert [e.attrib['name'] for e in stack]==list(reversed(ORDER))
 body=next(e for e in stack if e.attrib['name']=='pet-body');assert[e.attrib['name'] for e in body]==list(reversed(PARTS))
 for group in body:
  assert len(group)==2 and group[0].attrib['visibility']=='visible' and group[1].attrib['visibility']=='hidden'
  assert group[0].attrib['name']==group.attrib['name']+'-painted-fur' and group[1].attrib['name']==group.attrib['name']+'-original'
  original=read(io.BytesIO(z.read(group[1].attrib['src'])))
  assert diff(original,read(P/'anatomy'/(group.attrib['name']+'-base.png')))==0
 def render(e):
  if e.attrib.get('visibility')=='hidden':return Image.new('RGBA',(941,1672))
  if e.tag=='layer':
   assert e.attrib['x']=='0' and e.attrib['y']=='0' and e.attrib['composite-op']=='svg:src-over'
   im=read(io.BytesIO(z.read(e.attrib['src'])));assert im.size==(941,1672);return im
  im=Image.new('RGBA',(941,1672))
  for child in reversed(list(e)):im=Image.alpha_composite(im,render(child))
  return im
 bodyDiff=diff(render(body),exports['pet-body']);mergedDiff=diff(render(stack),read(io.BytesIO(z.read('mergedimage.png'))));assert bodyDiff==0 and mergedDiff==0
out=Image.new('RGBA',(941,1672))
for n in ORDER[1:-1]:out=Image.alpha_composite(out,exports[n])
assert diff(out,trial)==0
report={'status':'PASS','canvas':[941,1672],'origin':[0,0],'exportCount':9,'sourceBodyGroups':6,'originalLayersPreservedHidden':True,'outsideTransferChangedPixels':outside,'wholeCharacterAlphaDifferences':0,'protectedExportByteHashes':protected,'changedPixelsPerPart':partStats,'oraZipCrc':'PASS','oraBodyVsExportDifference':bodyDiff,'oraMergedDifference':mergedDiff,'exportVsPreviewDifference':diff(out,trial),'masterSha256':sha(MASTER),'scope':'static neutral art candidate; not proof of nine completed variants or contest acceptance'}
(P/'contract-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
