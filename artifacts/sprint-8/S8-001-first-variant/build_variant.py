from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
from scipy.ndimage import distance_transform_edt
from xml.etree import ElementTree as ET
import numpy as np
import hashlib, json, io, zipfile

root=Path(__file__).resolve().parent
app=root.parents[2]
prototype=app/'artifacts/sprint-8/S8-001-layer-prototype'
master=app/'assets/2d/master/FINNI-2D-MASTER-V1/pet_neutral_canvas_v1.png'
expected='8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'
size=(941,1672)
order=('room-base','pet-back','pet-body','pet-pattern','pet-ear-shape','pet-face','pet-expression','pet-accessory','room-foreground')
sha=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
def save(im,p):
 p.parent.mkdir(parents=True,exist_ok=True); im.save(p,'PNG',optimize=False)
def png(im):
 b=io.BytesIO(); im.save(b,'PNG',optimize=False); return b.getvalue()
def compose(layers):
 result=Image.new('RGBA',size)
 for name in order[1:-1]: result=Image.alpha_composite(result,layers[name])
 return result
def make_ora(layers,merged,path):
 root_xml=ET.Element('image',{'version':'0.0.1','w':'941','h':'1672','name':'Finni pointy/spots first candidate'})
 stack=ET.SubElement(root_xml,'stack',{'name':'Finni pointy/spots'})
 for name in reversed(order):
  ET.SubElement(stack,'layer',{'name':name,'src':f'data/{name}.png','visibility':'visible','composite-op':'svg:src-over','x':'0','y':'0'})
 path.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(path,'w') as z:
  def write(name,data,compression=zipfile.ZIP_DEFLATED):
   item=zipfile.ZipInfo(name,(2026,9,23,0,0,0)); item.compress_type=compression; item.external_attr=0o644<<16; z.writestr(item,data)
  write('mimetype','image/openraster',zipfile.ZIP_STORED)
  write('stack.xml',ET.tostring(root_xml,encoding='utf-8',xml_declaration=True))
  write('mergedimage.png',png(merged))
  thumb=merged.copy(); thumb.thumbnail((256,256),Image.Resampling.LANCZOS)
  write('Thumbnails/thumbnail.png',png(thumb))
  for name in order: write(f'data/{name}.png',png(layers[name]))
 with zipfile.ZipFile(path) as z:
  assert z.testzip() is None and z.namelist()[0]=='mimetype'


if sha(master)!=expected: raise RuntimeError('Accepted master hash changed')
records=json.loads((prototype/'prototype-manifest.json').read_text(encoding='utf-8'))['layers']
layers={}
for record in records:
 path=prototype/record['path']
 if sha(path)!=record['sha256']: raise RuntimeError('Prototype layer hash changed: '+record['name'])
 layers[record['name']]=Image.open(path).convert('RGBA')
 assert layers[record['name']].size==size
accepted=Image.open(master).convert('RGBA')
assert ImageChops.difference(accepted,compose(layers)).getbbox() is None

# Extend neighboring forehead fur only beneath nearly opaque accepted ear pixels.
face=np.asarray(layers['pet-face']).copy()
face_rgb=np.asarray(layers['pet-face'].convert('RGB'))
alpha=face[:,:,3]
ear_alpha=np.asarray(layers['pet-ear-shape'].getchannel('A'))
distance,nearest=distance_transform_edt(~(alpha>=248),return_indices=True)
yy,xx=np.indices(alpha.shape)
head_dome=1-((xx-440)/180)**2-((yy-900)/120)**2
under=(alpha==0)&(ear_alpha>0)&(distance<=80)&(head_dome>0)&(xx>=285)&(xx<=650)&(yy>=780)&(yy<=945)
from scipy.ndimage import gaussian_filter
swatch_path=root/'source/golden-fur-swatch.png'
if sha(swatch_path)!='dc898f5a419ae5bea5deb1ec78d9bd625f94aa8c75538036e4606c8d6a1f1fad':
 raise RuntimeError('Fur swatch hash changed')
swatch=Image.open(swatch_path).convert('RGB').crop((280,280,970,970))
swatch=swatch.resize((366,166),Image.Resampling.LANCZOS)
swatch_rgb=np.asarray(swatch,dtype=np.float32)
swatch_detail=swatch_rgb-gaussian_filter(swatch_rgb,sigma=(8,8,0))
nearest_rgb=face_rgb[nearest[0],nearest[1]].astype(np.float32)
soft_base=gaussian_filter(nearest_rgb,sigma=(5,5,0))
detail=swatch_detail[yy[under]-780,xx[under]-285]
paint=np.clip(soft_base[under]+0.62*detail,0,255).astype(np.uint8)
face[under,:3]=paint
face[under,3]=(ear_alpha[under]*np.clip(head_dome[under]*12,0,1)).astype(np.uint8)

# Marks live on the upper shoulder/flank. The paw/leg area is protected.
rng=np.random.default_rng(801)
rough=gaussian_filter(rng.standard_normal(alpha.shape),6)
fine=gaussian_filter(rng.standard_normal(alpha.shape),1.4)
rough/=max(float(rough.std()),1e-8)
fine/=max(float(fine.std()),1e-8)
marks=[
 (339,1055,16,13,-0.20),
 (350,1085,13,12,0.27),
 (541,1076,16,16,0.15),
]
field=np.zeros(alpha.shape,dtype=np.float32)
for cx,cy,rx,ry,angle in marks:
 c,s=np.cos(angle),np.sin(angle)
 u=(xx-cx)*c+(yy-cy)*s
 v=-(xx-cx)*s+(yy-cy)*c
 radius=np.sqrt((u/rx)**2+(v/ry)**2)
 edge=np.clip((1.04-radius+0.14*rough+0.03*fine)/0.24,0,1)
 field=np.maximum(field,edge)
body_source=np.asarray(layers['pet-body'])
body_alpha=body_source[:,:,3].astype(np.float32)/255
upper_torso=np.clip((1105-yy)/12,0,1)
foreleg_guard=np.where(yy>=1088,np.clip((365-xx)/8,0,1)+np.clip((xx-515)/8,0,1),1)
foreleg_guard=np.clip(foreleg_guard,0,1)
opacity=np.clip(175*field*(0.91+0.07*fine),0,190)*body_alpha*upper_torso*foreleg_guard
overlay=np.zeros((*alpha.shape,4),dtype=np.uint8)
# Darken the underlying fur instead of laying a uniform brown fill over it.
overlay[:,:,:3]=np.clip(
 body_source[:,:,:3].astype(np.float32)*np.array([0.80,0.54,0.37],dtype=np.float32)+np.array([12,8,2],dtype=np.float32),
 0,255
).astype(np.uint8)
overlay[:,:,3]=opacity.astype(np.uint8)
paw_overlap=int(np.count_nonzero(overlay[1110:,:,3]))
front_overlap=int(np.count_nonzero(overlay[1096:1110,373:507,3]))
if paw_overlap or front_overlap: raise RuntimeError(f'Pattern crosses protected legs/paws: {paw_overlap}, {front_overlap}')

candidate=dict(layers)
body=np.asarray(layers['pet-body']).copy()
body[under]=face[under]
candidate['pet-body']=Image.fromarray(body,'RGBA')
candidate['pet-pattern']=Image.fromarray(overlay,'RGBA')
variant=compose(candidate)
changed=np.any(np.asarray(variant)!=np.asarray(accepted),axis=2)
outside=int((changed&(body_alpha==0)&(ear_alpha==0)).sum())
if outside: raise RuntimeError(f'{outside} pixels changed outside body and concealed ear seam')
if int(changed.sum())<300: raise RuntimeError('Pattern not visible')
for name,im in candidate.items(): save(im,root/'layers'/f'{name}.png')
save(variant,root/'review/finni-pointy-spots.png')
room=layers['room-base']
save(Image.alpha_composite(room,variant),root/'review/finni-pointy-spots-home.png')
crop=(245,700,705,1290)
comparison=Image.new('RGBA',(920,620),(248,244,235,255))
comparison.alpha_composite(accepted.crop(crop),(0,25))
comparison.alpha_composite(variant.crop(crop),(460,25))
lab=ImageDraw.Draw(comparison)
lab.text((12,5),'Accepted pointy/plain',fill=(55,45,35))
lab.text((472,5),'Candidate pointy/spots',fill=(55,45,35))
save(comparison,root/'review/comparison.png')
shoulders=Image.new('RGBA',(1120,260),(248,244,235,255))
shoulders.alpha_composite(accepted.crop((295,1020,575,1130)).resize((560,220),Image.Resampling.LANCZOS),(0,30))
shoulders.alpha_composite(variant.crop((295,1020,575,1130)).resize((560,220),Image.Resampling.LANCZOS),(560,30))
ImageDraw.Draw(shoulders).text((12,6),'Accepted coat',fill=(55,45,35))
ImageDraw.Draw(shoulders).text((572,6),'Revised shoulder spots',fill=(55,45,35))
save(shoulders,root/'review/shoulder-detail.png')
stages=Image.new('RGBA',(3*470,836),(248,244,235,255))
for index,scale in enumerate((0.86,1.0,1.12)):
 if scale==1.0:
  scaled=variant
 else:
  scaled=variant.resize((round(size[0]*scale),round(size[1]*scale)),Image.Resampling.LANCZOS)
 stage_pet=Image.new('RGBA',size)
 stage_pet.alpha_composite(scaled,(round(470*(1-scale)),round(1272*(1-scale))))
 stage=Image.alpha_composite(room,stage_pet)
 stages.alpha_composite(stage.resize((470,836),Image.Resampling.LANCZOS),(index*470,0))
save(stages,root/'review/stage-1-2-3.png')
no_ears=dict(candidate); no_ears['pet-ear-shape']=Image.new('RGBA',size)
save(compose(no_ears),root/'review/underfur-with-ears-hidden.png')
ora=root/'source/finni_pointy_spots_candidate.ora'
make_ora(candidate,Image.alpha_composite(room,variant),ora)
manifest={
 'packageId':'S8-001-FIRST-APPEARANCE-CANDIDATE','revision':2,'status':'art-review-candidate-not-runtime',
 'appearance':{'earShape':'pointy','furPattern':'spots'},
 'source':'accepted S7-004 pixels and accepted S8-001 layer separation; local paint overlay',
 'sourceMasterSha256':expected,'furSwatchSha256':sha(swatch_path),'canvas':list(size),'layerOrderBackToFront':list(order),
 'underfurPixelsBeneathEarBases':int(under.sum()),
 'patternPixelsOnProtectedLegsAndPaws':paw_overlap+front_overlap,
 'changedPixelsOutsideBodyAndConcealedEarSeam':outside,'changedPixelsTotal':int(changed.sum()),
 'ora':{'path':str(ora.relative_to(root)),'sha256':sha(ora)},
 'layers':[{'name':name,'path':f'layers/{name}.png','sha256':sha(root/'layers'/f'{name}.png'),'alphaBounds':candidate[name].getchannel('A').getbbox()} for name in order]
}
(root/'candidate-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Underfur pixels:',int(under.sum()))
print('Changed pixels:',int(changed.sum()),'outside body and concealed ear seam:',outside)
print('ORA:',ora)
