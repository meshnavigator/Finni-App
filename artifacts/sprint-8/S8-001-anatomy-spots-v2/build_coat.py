"""Register Image Gen coat artwork and assemble through accepted anatomical mattes.
No procedural spots, recoloring, generated shapes or changes to the accepted master.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageDraw
from xml.etree import ElementTree as ET
import io,json,hashlib,zipfile,shutil
P=Path(__file__).resolve().parent;APP=P.parents[2]
PREV=APP/'artifacts/sprint-8/S8-001-anatomy-spots-v1'
SRC=APP/'artifacts/sprint-8/S8-001-layer-prototype/layers'
MASTER=APP/'assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png'
SIZE=(941,1672);PARTS=['rear-left','rear-right','torso','chest','foreleg-left','foreleg-right']
ORDER=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground']
def load(p):return Image.open(p).convert('RGBA')
def save(im,p):p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def png(im):b=io.BytesIO();im.save(b,format='PNG');return b.getvalue()
def diff(a,b):return sum(x!=y and (x[3]>0 or y[3]>0) for x,y in zip(a.getdata(),b.getdata()))
def comp(images):
 out=Image.new('RGBA',SIZE)
 for im in images:out=Image.alpha_composite(out,im)
 return out
assert sha(MASTER)=='8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'
master=load(MASTER);donor=load(P/'input/imagegen-spotted-coat.png');assert donor.size==SIZE
# Registration uses the visible silhouette bounds only; final matte is original.
sourceBox=donor.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
targetBox=master.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
sx=(targetBox[2]-targetBox[0])/(sourceBox[2]-sourceBox[0]);sy=(targetBox[3]-targetBox[1])/(sourceBox[3]-sourceBox[1])
tx=targetBox[0]-sourceBox[0]*sx;ty=targetBox[1]-sourceBox[1]*sy
aligned=donor.transform(SIZE,Image.Transform.AFFINE,(1/sx,0,-tx/sx,0,1/sy,-ty/sy),resample=Image.Resampling.BICUBIC)
save(aligned,P/'input/imagegen-coat-registered.png')
bases={n:load(PREV/'anatomy'/f'{n}.png') for n in PARTS}
layers={n:load(SRC/(n+'.png')) for n in ORDER};colored={};mattes={};allowed=Image.new('L',SIZE)
for n in PARTS:
 base=bases[n]
 if n in ['chest','torso']:
  matte=Image.new('L',SIZE);colored[n]=base.copy()
 else:
  # Feather only at anatomical boundaries; never repaint or infer pigment.
  occupancy=base.getchannel('A').point(lambda a:255 if a>=128 else 0)
  matte=occupancy.filter(ImageFilter.MinFilter(5))
  limit=Image.new('L',SIZE);ImageDraw.Draw(limit).rectangle((0,1035,940,1188 if n.startswith('rear') else 1207),fill=255)
  matte=ImageChops.multiply(matte,limit).filter(ImageFilter.GaussianBlur(1.2))
  matte=ImageChops.multiply(matte,occupancy)
  # Source alpha holes must not transplant black/empty pixels.
  matte=ImageChops.multiply(matte,aligned.getchannel('A').point(lambda a:255 if a>=128 else 0))
  # Keep all pixels beyond the toe-protection line strictly original.
  matte=ImageChops.multiply(matte,limit)
  rgb=Image.composite(aligned.convert('RGB'),base.convert('RGB'),matte)
  colored[n]=rgb.convert('RGBA');colored[n].putalpha(base.getchannel('A'))
 mattes[n]=matte;allowed=ImageChops.lighter(allowed,matte)
 save(base,P/'anatomy'/f'{n}-base.png');save(colored[n],P/'anatomy'/f'{n}-spotted.png');save(matte,P/'masks'/f'{n}-transfer.png')
save(allowed,P/'masks'/'coat-transfer.png')
neutral=comp(layers[n] for n in ORDER[1:-1]);assert diff(master,neutral)==0
outLayers=dict(layers);outLayers['pet-body']=comp(colored[n] for n in PARTS)
trial=comp(outLayers[n] for n in ORDER[1:-1]);home=comp(outLayers[n] for n in ORDER)
assert ImageChops.difference(master.getchannel('A'),trial.getchannel('A')).getbbox() is None
outside=sum(a!=b and (a[3]>0 or b[3]>0) and m==0 for a,b,m in zip(master.getdata(),trial.getdata(),allowed.getdata()));assert outside==0
for n in ORDER:
 if n=='pet-body':save(outLayers[n],P/'export'/f'{n}.png')
 else:(P/'export').mkdir(exist_ok=True);shutil.copyfile(SRC/(n+'.png'),P/'export'/f'{n}.png')
save(trial,P/'review'/'spots-neutral.png');save(home,P/'review'/'spots-home.png')
# Editable source: original pixel layer hidden below the visible painted-fur replacement.
root=ET.Element('image',{'version':'0.0.1','w':'941','h':'1672','name':'Finni expressive spotted coat candidate'})
stack=ET.SubElement(root,'stack',{'name':'Finni'});files={}
def add(parent,name,im,visible='visible'):
 key='data/'+name+'.png';files[key]=png(im)
 ET.SubElement(parent,'layer',{'name':name,'src':key,'x':'0','y':'0','opacity':'1.0','visibility':visible,'composite-op':'svg:src-over'})
for n in reversed(ORDER):
 if n!='pet-body':add(stack,n,layers[n]);continue
 body=ET.SubElement(stack,'stack',{'name':'pet-body','isolation':'isolate','visibility':'visible','composite-op':'svg:src-over'})
 for part in reversed(PARTS):
  group=ET.SubElement(body,'stack',{'name':part,'isolation':'isolate','visibility':'visible','composite-op':'svg:src-over'})
  add(group,part+'-painted-fur',colored[part]);add(group,part+'-original',bases[part],'hidden')
sourcePath=P/'source'/'finni-expressive-spots.ora';sourcePath.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(sourcePath,'w',compression=zipfile.ZIP_DEFLATED) as z:
 z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
 z.writestr('stack.xml',ET.tostring(root,encoding='utf-8',xml_declaration=True));z.writestr('mergedimage.png',png(home))
 thumbnail=home.copy();thumbnail.thumbnail((256,256));z.writestr('Thumbnails/thumbnail.png',png(thumbnail))
 for k,v in files.items():z.writestr(k,v)
# Art review sheets, not runtime captures.
crop=(240,690,730,1310);cream=(248,244,235,255)
compare=Image.new('RGBA',(980,650),cream)
for i,(im,label) in enumerate([(master,'PLAIN / ACCEPTED'),(trial,'SPOTS / CANDIDATE V2')]):
 ImageDraw.Draw(compare).text((i*490+12,8),label,fill=(45,35,25,255));compare.alpha_composite(im.crop(crop),(i*490,30))
save(compare,P/'review'/'plain-vs-spots.png')
previous=load(PREV/'review/spots-neutral.png')
compare3=Image.new('RGBA',(1470,650),cream)
for i,(im,label) in enumerate([(master,'PLAIN'),(previous,'REJECTED FRECKLES'),(trial,'SPOTTED COAT V2')]):
 ImageDraw.Draw(compare3).text((i*490+12,8),label,fill=(45,35,25,255));compare3.alpha_composite(im.crop(crop),(i*490,30))
save(compare3,P/'review'/'plain-vs-rejected-vs-spots.png')
homeCompare=Image.new('RGBA',(940,836),cream)
homeCompare.alpha_composite(comp(layers[n] for n in ORDER).resize((470,836),Image.Resampling.LANCZOS),(0,0));homeCompare.alpha_composite(home.resize((470,836),Image.Resampling.LANCZOS),(470,0));save(homeCompare,P/'review'/'home-scale-comparison.png')
stages=Image.new('RGBA',(1410,866),cream)
for i,scale in enumerate([.86,1.,1.12]):
 scaled=trial.resize((round(SIZE[0]*scale),round(SIZE[1]*scale)),Image.Resampling.LANCZOS)
 frame=layers['room-base'].copy();frame.alpha_composite(scaled,(round(470*(1-scale)),round(1272*(1-scale))))
 ImageDraw.Draw(stages).text((i*470+12,8),f'STAGE {i+1} / {scale}',fill=(45,35,25,255));stages.alpha_composite(frame.resize((470,836),Image.Resampling.LANCZOS),(i*470,30))
save(stages,P/'review'/'three-stage-preview.png')
report={'status':'art-review-candidate-not-production','sourceSha256':sha(MASTER),'donorSha256':sha(P/'input/imagegen-spotted-coat.png'),'registration':{'sourceAlpha128Box':sourceBox,'targetAlpha128Box':targetBox,'scale':[sx,sy],'translation':[tx,ty],'method':'global affine registration, original anatomical mattes and original alpha retained'},'neutralDifference':diff(master,neutral),'changedVisiblePixels':diff(master,trial),'changedOutsideCoatMatte':outside,'silhouetteAlphaDifferences':0,'chestAndTorsoOriginal':all(diff(bases[n],colored[n])==0 for n in ['chest','torso']),'changedPixelsPerPart':{n:diff(bases[n],colored[n]) for n in PARTS},'protectedExportByteHashesEqual':{n:sha(SRC/(n+'.png'))==sha(P/'export'/f'{n}.png') for n in ORDER if n!='pet-body'},'canvas':list(SIZE),'origin':[0,0],'sourceBodyGroups':PARTS,'exportLayerCount':9}
(P/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
