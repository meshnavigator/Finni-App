"""Independent PNG/ORA/state/identity validation; never manufactures artwork."""
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
from xml.etree import ElementTree as ET
import io,json,hashlib,zipfile
P=Path(__file__).resolve().parent;APP=P.parents[2];SIZE=(941,1672)
ORDER=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground']
def load(p):return Image.open(p).convert('RGBA')
def different(a,b):return sum(x!=y and (x[3] or y[3]) for x,y in zip(a.getdata(),b.getdata()))
def compose(images):
 out=Image.new('RGBA',SIZE)
 for im in images:out=Image.alpha_composite(out,im)
 return out
def render(node,z,root=False):
 out=Image.new('RGBA',SIZE)
 for child in reversed(list(node)):
  if child.attrib.get('visibility')=='hidden':continue
  im=load(io.BytesIO(z.read(child.attrib['src']))) if child.tag=='layer' else render(child,z)
  out=Image.alpha_composite(out,im)
 return out
manifest=json.loads((P/'manifest.json').read_text(encoding='utf-8'));results=[];hashes=set();master=load(APP/'assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png');baseBlink=load(APP/'assets/2d/master/FINNI-2D-MASTER-V1/pet_blink_canvas_v1.png')
for v in manifest['variants']:
 folder=P/'variants'/v['id'];frames={f:load(folder/f'{f}.png') for f in ['neutral','blink']};hashes.add(v['neutralSha256'])
 for frame,im in frames.items():
  assert im.size==SIZE
  layers=[load(folder/'export'/frame/f'{n}.png') for n in ORDER]
  assert all(x.size==SIZE for x in layers)
  assert different(compose(layers[1:-1]),im)==0,(v['id'],frame,'layers')
  original=master if frame=='neutral' else baseBlink
  # Eye/muzzle core is never supplied by donor artwork, including blink.
  for box in [(380,900,442,959),(472,920,555,986),(401,968,521,1023),(425,805,520,970),(375,838,450,891)]:
   assert different(im.crop(box),original.crop(box))==0,(v['id'],frame,'eyes/muzzle')
  # Feet and tail must remain original for the same base frame.
  for box in [(275,1220,705,1290),(590,1040,710,1220)]:
   assert different(im.crop(box),original.crop(box))==0,(v['id'],frame,'feet/tail')
 with zipfile.ZipFile(folder/'source.ora') as z:
  assert z.testzip() is None
  root=ET.fromstring(z.read('stack.xml'));groups=root.find('stack')
  assert len(groups)==2
  for group in groups:
   assert [x.attrib['name'] for x in reversed(list(group))]==ORDER
   frame=group.attrib['name'];full=render(group,z);png=compose([load(folder/'export'/frame/f'{n}.png') for n in ORDER]);assert different(full,png)==0
  assert different(render(groups,z),load(io.BytesIO(z.read('mergedimage.png'))))==0
 results.append({'id':v['id'],'frames':2,'layersPerFrame':9,'ora':'PASS','identityCore':'unchanged','feetTail':'unchanged','pixelReassembly':'exact'})
assert len(results)==9 and len(hashes)==9
previous=P.with_name('S8-001-matrix-v1')
surgical=[]
for v in manifest['variants']:
 for frame in ['neutral','blink']:
  before=load(previous/'variants'/v['id']/f'{frame}.png');after=load(P/'variants'/v['id']/f'{frame}.png')
  assert different(before.crop((0,1035,941,1672)),after.crop((0,1035,941,1672)))==0,(v['id'],frame,'approved coat changed')
  if v['shapeId']=='pointy':assert (previous/'variants'/v['id']/f'{frame}.png').read_bytes()==(P/'variants'/v['id']/f'{frame}.png').read_bytes()
  surgical.append({'id':v['id'],'frame':frame,'approvedBodyDifferences':0,'pointyUnchanged':v['shapeId']=='pointy'})

assert different(load(P/'variants/pointy-plain/neutral.png'),master)==0
assert different(load(P/'variants/pointy-spots/neutral.png'),load(APP/'assets/2d/variants/FINNI-POINTY-SPOTS-V1/neutral.png'))==0
report={'status':'PASS','variants':results,'uniqueNeutralRenders':len(hashes),'frameCount':18,'layerPngCount':162,'oraCount':9,'surgicalChecks':surgical,'scope':'pixel/contract proof; visual assessment required separately'}
(P/'verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))
# Three stages, nine distinct appearances at each stage, always same feet anchor.
sheet=Image.new('RGB',(1530,1620),'#faf5eb');d=ImageDraw.Draw(sheet)
for stage,scale in enumerate([.86,1,1.12]):
 for i,v in enumerate(manifest['variants']):
  pet=load(P/'variants'/v['id']/'neutral.png');scaled=pet.resize((round(941*scale),round(1672*scale)),Image.Resampling.LANCZOS);full=Image.new('RGBA',SIZE);full.alpha_composite(scaled,(round(470*(1-scale)),round(1272*(1-scale))));crop=full.crop((195,610,765,1330));crop.thumbnail((160,210));sheet.paste(crop,(i*170+5,stage*540+35),crop);d.text((i*170+4,stage*540+8),f'S{stage+1} '+v['id'],fill='#253944')
 sheetCrop=sheet.crop((0,stage*540,1530,stage*540+265));sheetCrop.save(P/'review'/f'stage-{stage+1}-nine.jpg')
