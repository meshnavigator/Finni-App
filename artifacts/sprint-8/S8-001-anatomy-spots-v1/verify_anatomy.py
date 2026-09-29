"""Read-only contract checks for the anatomical ORA and its nine PNG exports."""
from pathlib import Path
from PIL import Image
from xml.etree import ElementTree as ET
import io,json,zipfile,hashlib
P=Path(__file__).resolve().parent;APP=P.parents[2]
SRC=APP/'artifacts/sprint-8/S8-001-layer-prototype/layers'
ORDER=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground']
PARTS=['rear-left','rear-right','torso','chest','foreleg-left','foreleg-right']
def read(path):return Image.open(path).convert('RGBA')
def diff(a,b):return sum(x!=y and (x[3]>0 or y[3]>0) for x,y in zip(a.getdata(),b.getdata()))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def oraCheck(path,expectedBody):
 with zipfile.ZipFile(path) as z:
  assert z.testzip() is None and z.namelist()[0]=='mimetype'
  assert z.read('mimetype')==b'image/openraster'
  root=ET.fromstring(z.read('stack.xml'));assert (root.attrib['w'],root.attrib['h'])==('941','1672')
  stack=root.find('stack');assert [n.attrib['name'] for n in stack]==list(reversed(ORDER))
  body=next(n for n in stack if n.attrib['name']=='pet-body')
  assert [n.attrib['name'] for n in body]==list(reversed(PARTS))
  for part in body:
   assert [n.attrib['name'] for n in part]==[part.attrib['name']+'-pattern',part.attrib['name']+'-base']
  def render(node):
   if node.tag=='layer':
    assert node.attrib['x']=='0' and node.attrib['y']=='0' and node.attrib['composite-op']=='svg:src-over'
    im=read(io.BytesIO(z.read(node.attrib['src'])));assert im.size==(941,1672);return im
   out=Image.new('RGBA',(941,1672))
   for child in reversed(list(node)):out=Image.alpha_composite(out,render(child))
   return out
  bodyDiff=diff(render(body),expectedBody);assert bodyDiff==0
  merged=read(io.BytesIO(z.read('mergedimage.png')))
  mergedDiff=diff(render(stack),merged);assert mergedDiff==0
  return {'zipCrc':'PASS','rootLayerCount':len(stack),'bodyGroups':len(body),'bodyDifference':bodyDiff,'mergedDifference':mergedDiff}
masterPath=APP/'assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png'
assert sha(masterPath)=='8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'
master=read(masterPath);trial=read(P/'review/spots-neutral.png')
neutral=read(P/'review/neutral-reassembled.png');assert diff(master,neutral)==0
exports={n:read(P/'export'/f'{n}.png') for n in ORDER}
assert len(list((P/'export').glob('*.png')))==9
for im in exports.values():assert im.size==(941,1672)
protected={n:sha(SRC/(n+'.png'))==sha(P/'export'/f'{n}.png') for n in ORDER if n!='pet-body'}
assert all(protected.values())
allowed=Image.open(P/'masks/paintable.png').convert('L')
outside=sum(a!=b and (a[3]>0 or b[3]>0) and k==0 for a,b,k in zip(master.getdata(),trial.getdata(),allowed.getdata()));assert outside==0
raw=read(P/'input/imagegen-pattern-registered.png')
clipped=sum(v[3]>0 and k==0 for v,k in zip(raw.getdata(),allowed.getdata()));assert clipped==0,'Generated marks touch protection boundary'
counts={n:sum(px[3]>0 for px in read(P/'patterns'/f'{n}.png').getdata()) for n in ['rear-left','rear-right','foreleg-left','foreleg-right']}
assert all(v>0 for v in counts.values())
report={'status':'PASS','neutralDifference':diff(master,neutral),'protectedExportByteHashes':protected,'outsideAllowedChangedPixels':outside,'clippedRegisteredPatternPixels':clipped,'patternPixelsPerLimb':counts,'neutralOra':oraCheck(P/'source/finni-visible-anatomy-neutral.ora',read(SRC/'pet-body.png')),'spotsOra':oraCheck(P/'source/finni-visible-anatomy-spots.ora',exports['pet-body']),'exportCount':9,'canvas':[941,1672],'origin':[0,0],'masterSha256':sha(masterPath),'artStatus':'candidate for owner review, not production; static neutral only'}
(P/'contract-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
