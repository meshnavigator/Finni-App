"""Place existing Image Gen raster marks into anatomy; never synthesize their pixels."""
from PIL import Image
from collections import deque
from pathlib import Path
import json
P=Path(__file__).resolve().parent
im=Image.open(P/'input/imagegen-pattern-overlay.png').convert('RGBA')
w,h=im.size
alpha=im.getchannel('A')
pixels=alpha.load();seen=set();parts=[]
for y in range(h):
 for x in range(w):
  if pixels[x,y]<160 or (x,y) in seen:continue
  todo=deque([(x,y)]);seen.add((x,y));coords=[]
  while todo:
   a,b=todo.popleft();coords.append((a,b))
   for c,d in ((a-1,b),(a+1,b),(a,b-1),(a,b+1)):
    if 0<=c<w and 0<=d<h and (c,d) not in seen and pixels[c,d]>=160:seen.add((c,d));todo.append((c,d))
  if len(coords)<35:continue
  xs=[a for a,b in coords];ys=[b for a,b in coords]
  box=(max(0,min(xs)-7),max(0,min(ys)-7),min(w,max(xs)+8),min(h,max(ys)+8))
  parts.append({'bbox':box,'area':len(coords),'cx':sum(xs)/len(xs),'cy':sum(ys)/len(ys)})
assert len(parts)==12,f'Expected 12 independently generated marks, got {len(parts)}'
parts.sort(key=lambda p:p['cx'])
centers=[[(313,1128),(321,1150),(314,1171)],[(371,1117),(381,1138),(388,1160)],[(485,1116),(476,1138),(468,1159)],[(546,1127),(554,1148),(550,1170)]]
labels=['rear-left','foreleg-left','foreleg-right','rear-right']
out=Image.new('RGBA',im.size);placements=[]
for group in range(4):
 cluster=sorted(parts[group*3:(group+1)*3],key=lambda p:p['cy'])
 for index,part in enumerate(cluster):
  mark=im.crop(part['bbox']);scale=min(13/mark.width,16/mark.height)
  dimensions=(max(1,round(mark.width*scale)),max(1,round(mark.height*scale)))
  mark=mark.resize(dimensions,Image.Resampling.LANCZOS)
  cx,cy=centers[group][index];xy=(cx-mark.width//2,cy-mark.height//2)
  out.alpha_composite(mark,xy)
  placements.append({'part':labels[group],'sourceBox':part['bbox'],'sourceOpaqueArea':part['area'],'targetCenter':[cx,cy],'size':list(dimensions),'transform':'crop, uniform downscale, translation; no pixel painting/recoloring'})
out.save(P/'input/imagegen-pattern-registered.png')
(P/'registration.json').write_text(json.dumps({'sourceSize':list(im.size),'canvas':list(out.size),'markCount':12,'placements':placements},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(placements,indent=2))
