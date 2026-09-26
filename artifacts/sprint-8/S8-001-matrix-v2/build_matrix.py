"""Mechanical component registration/assembly only; all new fur is Image Gen artwork."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops,ImageFilter
import importlib.util,hashlib,io,json,zipfile,sys,shutil
from xml.etree import ElementTree as ET
P=Path(__file__).resolve().parent;APP=P.parents[2];SIZE=(941,1672)
SRC=APP/'artifacts/sprint-8/S8-001-layer-prototype/layers';SPOT=APP/'assets/2d/variants/FINNI-POINTY-SPOTS-V1'
MASTER=APP/'assets/2d/master/FINNI-2D-MASTER-V1'
ORDER=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground']
SHAPES=['pointy','round','floppy'];PATTERNS=['plain','spots','stripes']
def load(p):return Image.open(p).convert('RGBA')
def save(im,p):p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def compose(layers):
 out=Image.new('RGBA',SIZE)
 for im in layers:out=Image.alpha_composite(out,im)
 return out
def mask(polys):
 m=Image.new('L',SIZE);d=ImageDraw.Draw(m)
 for poly in polys:d.polygon(poly,fill=255)
 return m
spec=importlib.util.spec_from_file_location('original_partition',SRC.parent/'build_layers.py');part=importlib.util.module_from_spec(spec);spec.loader.exec_module(part)
original={n:load(SRC/(n+'.png')) for n in ORDER};neutral=load(MASTER/'pet_neutral_canvas_v1.png');blink=load(MASTER/'pet_blink_canvas_v1.png')
assert sha(MASTER/'pet_neutral_canvas_v1.png')=='8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'
# Full-canvas masks, not painting. Donor ear colors are never synthesized.
earRemove=mask(part.POLYGONS['pet-ear-shape'])
earPolys={
 'round': [[(270,885),(270,680),(470,680),(470,815),(410,827),(365,850),(320,880)],[(515,790),(565,755),(700,755),(705,1000),(610,1000),(577,927),(566,872),(538,830)]],
 'floppy': [[(248,891),(248,818),(258,782),(294,756),(339,734),(384,734),(416,760),(430,788),(419,793),(400,797),(384,808),(370,827),(356,850),(340,871),(318,886),(297,899),(272,901)],[(554,808),(590,800),(625,820),(647,847),(665,885),(687,921),(700,954),(684,987),(654,1012),(633,1013),(615,982),(595,957),(583,930),(582,907),(581,877),(575,850),(565,831)]]}
ears={};earMasks={}
for shape in ['round','floppy']:
 donor=load(P/'input'/f'{shape}-donor.png');m=mask(earPolys[shape]);a=ImageChops.multiply(donor.getchannel('A'),m);ear=donor.copy();ear.putalpha(a)
 # Register each anatomical root independently; prior +6/+12 misplaced both ears.
 placed=Image.new('RGBA',SIZE)
 shifts=[(-6,-4),(-10,-4)] if shape=='round' else [(-3,-10),(-12,-7)]
 for side,shift in enumerate(shifts):
  piece=donor.copy();piece.putalpha(ImageChops.multiply(donor.getchannel('A'),mask([earPolys[shape][side]])));placed.alpha_composite(piece,shift)
 ears[shape]=placed
 shifted=Image.new('L',SIZE)
 for side,shift in enumerate(shifts):
  shiftedPart=Image.new('L',SIZE);shiftedPart.paste(mask([earPolys[shape][side]]),shift);shifted=ImageChops.lighter(shifted,shiftedPart)
 earMasks[shape]=shifted
 save(placed,P/'components'/f'{shape}-ears.png');save(shifted,P/'masks'/f'{shape}-ear-region.png')
# Register stripe body as in the accepted spotted pipeline, preserving original anatomical alpha.
donor=load(P/'input/stripes-donor.png');sb=donor.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox();tb=neutral.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
sx=(tb[2]-tb[0])/(sb[2]-sb[0]);sy=(tb[3]-tb[1])/(sb[3]-sb[1]);tx=tb[0]-sb[0]*sx;ty=tb[1]-sb[1]*sy
aligned=donor.transform(SIZE,Image.Transform.AFFINE,(1/sx,0,-tx/sx,0,1/sy,-ty/sy),Image.Resampling.BICUBIC);save(aligned,P/'components/stripes-registered.png')
parts=['rear-left','rear-right','torso','chest','foreleg-left','foreleg-right'];colored={};allowed=Image.new('L',SIZE)
for name in parts:
 base=load(APP/'artifacts/sprint-8/S8-001-anatomy-spots-v1/anatomy'/f'{name}.png');matte=Image.new('L',SIZE)
 if name not in ['torso','chest']:
  occ=base.getchannel('A').point(lambda a:255 if a>=128 else 0);limit=Image.new('L',SIZE);ImageDraw.Draw(limit).rectangle((0,1035,940,1188 if name.startswith('rear') else 1207),fill=255)
  matte=ImageChops.multiply(occ.filter(ImageFilter.MinFilter(5)),limit).filter(ImageFilter.GaussianBlur(1.2));matte=ImageChops.multiply(ImageChops.multiply(matte,occ),limit);matte=ImageChops.multiply(matte,aligned.getchannel('A').point(lambda a:255 if a>=128 else 0))
  rgb=Image.composite(aligned.convert('RGB'),base.convert('RGB'),matte);baseOut=rgb.convert('RGBA');baseOut.putalpha(base.getchannel('A'))
 else:baseOut=base
 colored[name]=baseOut;allowed=ImageChops.lighter(allowed,matte);save(baseOut,P/'components/anatomy'/f'{name}-stripes.png')
stripeBody=compose(colored.values());save(stripeBody,P/'components/stripes-body.png');save(allowed,P/'masks/stripes-transfer.png')
baseCoats={'plain':neutral,'spots':load(SPOT/'neutral.png')}
stripeLayers=dict(original);stripeLayers['pet-body']=stripeBody;baseCoats['stripes']=compose(stripeLayers[n] for n in ORDER[1:-1])
# Partition each flattened frame via original geometry. Fully reconstructs every source pixel.
def split(im):
 result={n:Image.new('RGBA',SIZE) for n in ORDER};result['room-base']=original['room-base'];remaining=Image.new('L',SIZE,255)
 for name in ['pet-accessory','pet-ear-shape','pet-face','pet-back']:
  m=ImageChops.multiply(mask(part.POLYGONS[name]),remaining);remaining=ImageChops.subtract(remaining,m);result[name]=Image.composite(im,Image.new('RGBA',SIZE),m)
 result['pet-body']=Image.composite(im,Image.new('RGBA',SIZE),remaining);return result
rootCache={}
renders={};manifest={'canvas':list(SIZE),'origin':[0,0],'feetAnchor':[470,1272],'stageScales':[.86,1,1.12],'status':'art-review-candidate','stripeRegistration':{'source':sb,'target':tb,'scale':[sx,sy],'translation':[tx,ty]},'variants':[]}
for shape in SHAPES:
 for pattern in PATTERNS:
  key=shape+'-'+pattern;frames={};exports={}
  if '--round-only' in sys.argv and shape!='round':
   renders[key]=load(P/'variants'/key/'neutral.png')
   manifest['variants'].append({'id':key,'shapeId':shape,'patternId':pattern,'neutralSha256':sha(P/'variants'/key/'neutral.png'),'blinkSha256':sha(P/'variants'/key/'blink.png'),'oraSha256':sha(P/'variants'/key/'source.ora')})
   continue
  coat=baseCoats[pattern];changed=Image.new('L',SIZE);changed.putdata([255 if a!=b and (a[3] or b[3]) else 0 for a,b in zip(neutral.getdata(),coat.getdata())])
  for frame in ['neutral','blink']:
   raw=coat if frame=='neutral' else Image.composite(coat,blink,changed)
   if frame=='blink':raw.putalpha(blink.getchannel('A'))
   layers=split(raw)
   if shape!='pointy':
    if frame not in rootCache:
     rootBacking=layers['pet-ear-shape'].copy()
     rootBand=layers['pet-face'].getchannel('A').point(lambda a:255 if a>0 else 0).filter(ImageFilter.MaxFilter(61))
     rootLimit=Image.new('L',SIZE);ImageDraw.Draw(rootLimit).rectangle((0,780,940,1010),fill=255)
     rootBacking.putalpha(ImageChops.multiply(rootBacking.getchannel('A'),ImageChops.multiply(rootBand,rootLimit)))
     rootCache[frame]=rootBacking
    rootBacking=rootCache[frame]
    layers['pet-ear-shape']=compose([rootBacking,ears[shape]])
    # Remove only residual source ear-edge wisps outside the exact original partition.
    residual=earRemove.filter(ImageFilter.MaxFilter(9))
    upper=Image.new('L',SIZE);ImageDraw.Draw(upper).rectangle((0,0,940,785),fill=255)
    residual=ImageChops.multiply(residual,upper)
    layers['pet-face'].putalpha(ImageChops.subtract(layers['pet-face'].getchannel('A'),residual))
    if shape=='round':
     faceOccupancy=layers['pet-face'].getchannel('A').point(lambda a:255 if a>0 else 0)
     trueHead=Image.new('L',SIZE);ImageDraw.Draw(trueHead).rectangle((0,800,940,1671),fill=255)
     faceOccupancy=ImageChops.multiply(faceOccupancy,trueHead)
     roundBack=ears[shape].copy();roundBack.putalpha(ImageChops.multiply(roundBack.getchannel('A'),ImageChops.invert(faceOccupancy)))
     layers['pet-ear-shape']=compose([rootBacking,roundBack])
    if shape=='floppy':
     # Preserve the original head under translucent fur edges. Binary deletion
     # previously punched alpha holes and changed the apparent face placement.
     face=layers['pet-face'];occupancy=face.getchannel('A').point(lambda a:255 if a>0 else 0)
     front=ears[shape].copy();front.putalpha(ImageChops.multiply(front.getchannel('A'),occupancy))
     back=ears[shape].copy();back.putalpha(ImageChops.multiply(back.getchannel('A'),ImageChops.invert(occupancy)))
     layers['pet-ear-shape']=compose([rootBacking,back]);layers['pet-face']=Image.alpha_composite(face,front)
   pet=compose(layers[n] for n in ORDER[1:-1]);frames[frame]=pet;exports[frame]=layers
   save(pet,P/'variants'/key/f'{frame}.png')
   for n in ORDER:save(layers[n],P/'variants'/key/'export'/frame/f'{n}.png')
  frames['neutral'].crop((230,680,740,1320)).save(P/'variants'/key/'preview.png');renders[key]=frames['neutral']
  # Editable nine-layer states, neutral visible and blink hidden.
  root=ET.Element('image',{'version':'0.0.1','w':'941','h':'1672','name':key});stack=ET.SubElement(root,'stack',{'name':'Finni'});files={}
  for frame in ['blink','neutral']:
   group=ET.SubElement(stack,'stack',{'name':frame,'visibility':'visible' if frame=='neutral' else 'hidden','composite-op':'svg:src-over'})
   for n in reversed(ORDER):
    path=f'data/{frame}/{n}.png';b=io.BytesIO();exports[frame][n].save(b,format='PNG');files[path]=b.getvalue();ET.SubElement(group,'layer',{'name':n,'src':path,'x':'0','y':'0','opacity':'1.0','visibility':'visible','composite-op':'svg:src-over'})
  ora=P/'variants'/key/'source.ora'
  with zipfile.ZipFile(ora,'w',zipfile.ZIP_DEFLATED) as z:
   z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED);z.writestr('stack.xml',ET.tostring(root,encoding='utf-8'));b=io.BytesIO();compose(exports['neutral'][n] for n in ORDER).save(b,format='PNG');z.writestr('mergedimage.png',b.getvalue())
   for f,data in files.items():z.writestr(f,data)
  if shape=='pointy':shutil.copyfile(P.with_name('S8-001-matrix-v1')/'variants'/key/'source.ora',ora)
  manifest['variants'].append({'id':key,'shapeId':shape,'patternId':pattern,'neutralSha256':sha(P/'variants'/key/'neutral.png'),'blinkSha256':sha(P/'variants'/key/'blink.png'),'oraSha256':sha(ora)})
sheet=Image.new('RGB',(1020,1410),'#f8f3e9');d=ImageDraw.Draw(sheet)
for row,shape in enumerate(SHAPES):
 for col,pattern in enumerate(PATTERNS):
  key=shape+'-'+pattern;im=renders[key].crop((230,680,740,1320));im.thumbnail((330,414));sheet.paste(im,(col*340+5,row*470+40),im);d.text((col*340+12,row*470+12),key,fill='#263b47')
(P/'review').mkdir(exist_ok=True);sheet.save(P/'review/matrix-nine.jpg');(P/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Built 9 variants, 18 frames, 162 layer PNG, 9 editable ORA')
