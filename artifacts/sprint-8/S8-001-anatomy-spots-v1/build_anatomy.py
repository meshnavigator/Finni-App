"""Mechanical lossless anatomy split and Image Gen overlay assembly; no procedural painting."""
from pathlib import Path
import io, json, hashlib, zipfile, shutil
from xml.etree import ElementTree as ET
from PIL import Image, ImageChops, ImageDraw, ImageFilter
P=Path(__file__).resolve().parent
APP=P.parents[2]
SRC=APP/'artifacts/sprint-8/S8-001-layer-prototype/layers'
MASTER=APP/'assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png'
SIZE=(941,1672)
ORDER=['room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground']
PARTS=['rear-left','rear-right','torso','chest','foreleg-left','foreleg-right']
# Viewer left/right. Visible-neutral boundaries only: no hidden anatomy invented.
POLYS={
 'rear-left':[(0,1060),(319,1060),(331,1090),(338,1120),(344,1150),(352,1180),(360,1206),(354,1217),(346,1230),(344,1270),(0,1270)],
 'rear-right':[(548,1060),(941,1060),(941,1270),(493,1270),(493,1230),(495,1209),(502,1184),(512,1158),(520,1134),(529,1111),(540,1083)],
 'chest':[(367,1022),(395,1033),(421,1040),(450,1041),(478,1034),(496,1028),(493,1052),(480,1077),(465,1102),(448,1126),(432,1148),(419,1136),(405,1118),(389,1091),(375,1064)],
 'foreleg-left':[(334,1017),(368,1020),(376,1062),(390,1090),(407,1118),(419,1136),(424,1165),(423,1200),(420,1232),(415,1270),(340,1270),(343,1230),(358,1206),(350,1178),(343,1150),(337,1120),(329,1089)],
 'foreleg-right':[(496,1026),(524,1022),(548,1060),(540,1083),(529,1111),(520,1134),(512,1158),(502,1184),(495,1209),(497,1240),(497,1270),(415,1270),(420,1232),(423,1200),(424,1165),(432,1148),(448,1126),(465,1102),(480,1077),(493,1052)],
}
def save(im,path):
 path.parent.mkdir(parents=True,exist_ok=True);im.save(path)
def png(im):
 b=io.BytesIO();im.save(b,format='PNG');return b.getvalue()
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def mask(poly):
 m=Image.new('L',SIZE);ImageDraw.Draw(m).polygon(poly,fill=255);return m
def diff(a,b):return sum(x!=y and (x[3]>0 or y[3]>0) for x,y in zip(a.getdata(),b.getdata()))
def rgba(im,m):return Image.composite(im,Image.new('RGBA',SIZE),m)
def composite(images):
 out=Image.new('RGBA',SIZE)
 for im in images:out=Image.alpha_composite(out,im)
 return out

def ora(path,layers,bases,patterns,merged):
 root=ET.Element('image',{'version':'0.0.1','w':'941','h':'1672','name':'Finni visible anatomy trial'})
 stack=ET.SubElement(root,'stack',{'name':'Finni'})
 files={}
 def add(parent,name,im):
  key='data/'+name+'.png';files[key]=png(im)
  ET.SubElement(parent,'layer',{'name':name,'src':key,'x':'0','y':'0','opacity':'1.0','visibility':'visible','composite-op':'svg:src-over'})
 for name in reversed(ORDER):
  if name=='pet-body':
   body=ET.SubElement(stack,'stack',{'name':'pet-body','isolation':'isolate','opacity':'1.0','visibility':'visible','composite-op':'svg:src-over'})
   for part in reversed(PARTS):
    group=ET.SubElement(body,'stack',{'name':part,'isolation':'isolate','opacity':'1.0','visibility':'visible','composite-op':'svg:src-over'})
    add(group,part+'-pattern',patterns[part]);add(group,part+'-base',bases[part])
  else:add(stack,name,layers[name])
 path.parent.mkdir(exist_ok=True,parents=True)
 with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED) as z:
  z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
  z.writestr('stack.xml',ET.tostring(root,encoding='utf-8',xml_declaration=True))
  z.writestr('mergedimage.png',png(merged))
  thumb=merged.copy();thumb.thumbnail((256,256));z.writestr('Thumbnails/thumbnail.png',png(thumb))
  for key,data in files.items():z.writestr(key,data)
 with zipfile.ZipFile(path) as z:assert z.testzip() is None

assert sha(MASTER)=='8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'
layers={n:Image.open(SRC/(n+'.png')).convert('RGBA') for n in ORDER}
body=layers['pet-body'];left=Image.new('L',SIZE,255);masks={}
# Chest and foreground legs own all overlaps; rear parts get remaining pixels.
for part in ['chest','foreleg-left','foreleg-right','rear-left','rear-right']:
 masks[part]=ImageChops.multiply(mask(POLYS[part]),left);left=ImageChops.subtract(left,masks[part])
masks['torso']=left
bases={n:rgba(body,masks[n]) for n in PARTS}
for n in PARTS:save(bases[n],P/'anatomy'/f'{n}.png');save(masks[n],P/'masks'/f'{n}.png')
assert diff(body,composite(bases[n] for n in PARTS))==0
master=Image.open(MASTER).convert('RGBA')
neutral=composite(layers[n] for n in ORDER[1:-1]);assert diff(master,neutral)==0
patterns={n:Image.new('RGBA',SIZE) for n in PARTS}
allowed=Image.new('L',SIZE)
for n in ['rear-left','rear-right','foreleg-left','foreleg-right']:
 # Keep sockets/outer silhouette and white toes clean; structural safety crop only.
 a=body.getchannel('A').point(lambda x:255 if x>=128 else 0)
 a=ImageChops.multiply(a,masks[n]).filter(ImageFilter.MinFilter(7))
 limit=Image.new('L',SIZE);ImageDraw.Draw(limit).rectangle((0,1095,940,1189 if n.startswith('rear') else 1180),fill=255)
 a=ImageChops.multiply(a,limit);save(a,P/'masks'/f'{n}-paintable.png');allowed=ImageChops.lighter(allowed,a)
save(allowed,P/'masks'/'paintable.png')
ora(P/'source'/'finni-visible-anatomy-neutral.ora',layers,bases,patterns,composite(layers[n] for n in ORDER))
save(neutral,P/'review'/'neutral-reassembled.png')
report={'canvas':list(SIZE),'origin':[0,0],'sourceSha256':sha(MASTER),'neutralVisiblePixelDifferences':diff(master,neutral),'bodySplitVisiblePixelDifferences':diff(body,composite(bases[n] for n in PARTS)),'parts':PARTS,'externalLayers':ORDER,'hiddenAnatomy':'not created; visible neutral extraction only','chestPattern':'empty by composition choice','sourceParts':{n:{'alphaBounds':bases[n].getchannel('A').getbbox(),'sha256':sha(P/'anatomy'/f'{n}.png')} for n in PARTS}}
# A review contact sheet of the exact extracted pixels; labels are outside the art.
crop=(270,990,605,1270);sheet=Image.new('RGBA',(3*335,2*310),(248,244,235,255))
for i,n in enumerate(PARTS):
 x=(i%3)*335;y=(i//3)*310;ImageDraw.Draw(sheet).text((x+8,y+8),n,fill=(45,38,30,255));sheet.alpha_composite(bases[n].crop(crop),(x,y+30))
save(sheet,P/'review'/'anatomy-parts.png')
# Outline audit shows mask boundaries over unchanged art, not a new character drawing.
audit=Image.new('RGBA',(3*335,2*310),(248,244,235,255))
for i,n in enumerate(PARTS):
 panel=Image.alpha_composite(Image.new('RGBA',SIZE,(248,244,235,255)),master)
 m=ImageChops.multiply(masks[n],body.getchannel('A').point(lambda v:255 if v>8 else 0))
 edge=ImageChops.subtract(m.filter(ImageFilter.MaxFilter(3)),m.filter(ImageFilter.MinFilter(3)))
 ink=Image.new('RGBA',SIZE,(0,153,193,0));ink.putalpha(edge);panel.alpha_composite(ink)
 x=(i%3)*335;y=(i//3)*310;ImageDraw.Draw(audit).text((x+8,y+8),n,fill=(45,38,30,255));audit.alpha_composite(panel.crop(crop),(x,y+30))
save(audit,P/'review'/'anatomy-contours.png')
overlayPath=P/'input'/'imagegen-pattern-registered.png'
if overlayPath.exists():
 overlay=Image.open(overlayPath).convert('RGBA');assert overlay.size==SIZE,'Image Gen overlay canvas mismatch'
 for n in PARTS:
  if n in ['chest','torso']:continue
  paint=Image.open(P/'masks'/f'{n}-paintable.png').convert('L')
  patterns[n]=rgba(overlay,paint);save(patterns[n],P/'patterns'/f'{n}.png')
 parts={n:Image.alpha_composite(bases[n],patterns[n]) for n in PARTS}
 trialLayers=dict(layers);trialLayers['pet-body']=composite(parts[n] for n in PARTS)
 trial=composite(trialLayers[n] for n in ORDER[1:-1])
 for n in ORDER:
  if n=='pet-body':save(trialLayers[n],P/'export'/f'{n}.png')
  else:shutil.copyfile(SRC/(n+'.png'),P/'export'/f'{n}.png')
 save(trial,P/'review'/'spots-neutral.png')
 save(composite(trialLayers[n] for n in ORDER),P/'review'/'spots-home.png')
 ora(P/'source'/'finni-visible-anatomy-spots.ora',trialLayers,bases,patterns,composite(trialLayers[n] for n in ORDER))
 visiblePattern=composite(patterns[n] for n in PARTS).getchannel('A')
 changed=0;outside=0
 for old,new,ok in zip(master.getdata(),trial.getdata(),allowed.getdata()):
  if old!=new and (old[3]>0 or new[3]>0):changed+=1;outside+=int(ok==0)
 assert outside==0
 report.update({'generatedOverlaySha256':sha(overlayPath),'changedVisiblePixels':changed,'changedOutsidePaintable':outside,'patternVisiblePixels':sum(v>0 for v in visiblePattern.getdata()),'patternAlphaBounds':visiblePattern.getbbox(),'protectedLayerHashesEqual':all(png(layers[n])==png(trialLayers[n]) for n in ORDER if n!='pet-body'),'exportCount':len(ORDER)})
 comparison=Image.new('RGBA',(980,620),(248,244,235,255))
 comparison.alpha_composite(master.crop((240,690,730,1310)),(0,0));comparison.alpha_composite(trial.crop((240,690,730,1310)),(490,0));save(comparison,P/'review'/'plain-vs-spots.png')
 # Readable Home-scale art preview only; no runtime/device result is asserted.
 homeCompare=Image.new('RGBA',(940,836),(248,244,235,255))
 originalHome=composite(layers[n] for n in ORDER)
 candidateHome=composite(trialLayers[n] for n in ORDER)
 homeCompare.alpha_composite(originalHome.resize((470,836),Image.Resampling.LANCZOS),(0,0))
 homeCompare.alpha_composite(candidateHome.resize((470,836),Image.Resampling.LANCZOS),(470,0))
 save(homeCompare,P/'review'/'home-scale-comparison.png')
(P/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
