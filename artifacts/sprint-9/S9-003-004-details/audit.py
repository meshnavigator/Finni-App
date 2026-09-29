from pathlib import Path
import json,xml.etree.ElementTree as ET,re,itertools
import native as native
R=Path(__file__).resolve().parent
def lum(h):
 c=[int(h[i:i+2],16)/255 for i in (1,3,5)];c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]
 return .2126*c[0]+.7152*c[1]+.0722*c[2]
pairs=[('body/surface','#665444','#FFFCF6'),('body/background','#665444','#F6F0E6'),('body/notice','#665444','#F1E5CB'),('title/surface','#3D352D','#FFFCF6'),('accent/surface','#AE482A','#FFFCF6'),('primary','#FFFFFF','#AE482A'),('error','#A33629','#FBE6DE'),('input-boundary','#A78E72','#FFFCF6')]
contrast=[]
for name,a,b in pairs:
 ratio=(max(lum(a),lum(b))+.05)/(min(lum(a),lum(b))+.05);minimum=3 if name=='input-boundary' else 4.5
 contrast.append({'pair':name,'ratio':round(ratio,2),'minimum':minimum,'pass':ratio>=minimum})
assert all(x['pass'] for x in contrast),contrast
geometries=[]
for report in ['lessons.json','matrix.json','states.json','extras.json','final-smoke.json','resource-qa.json','children.json','transient-final.json']:
 if not (R/report).exists():continue
 data=json.loads((R/report).read_text(encoding='utf-8'))
 for shot in data['screens']:
  p=R/'android'/(shot['name']+'.xml')
  if not p.exists():continue
  controls=[];partial=0;edge=native.clipped_keys(p)
  for n in ET.parse(p).iter('node'):
   if n.get('package')!='com.meshnavigator.finni' or n.get('clickable')!='true':continue
   a,b,c,d=map(int,re.findall(r'\d+',n.get('bounds','')))
   if (n.get('bounds'),n.get('content-desc'),n.get('text')) in edge or b<=24 or d>=shot['height']-48:partial+=1;continue
   if c<=a or d<=b:continue
   assert c-a>=48 and d-b>=48,(shot,n.attrib)
   controls.append((a,b,c,d,n.get('content-desc') or n.get('text')))
  overlaps=[]
  for a,b in itertools.combinations(controls,2):
   if min(a[2],b[2])>max(a[0],b[0]) and min(a[3],b[3])>max(a[1],b[1]):overlaps.append((a[4],b[4]))
  assert not overlaps,(shot['name'],overlaps)
  geometries.append({'report':report,'apkSha256':data['apkSha256'],'qaOnly':data.get('qaOnly',False),'shot':shot['name'],'profile':[shot['width'],shot['height'],shot['fontScale']],'fullControls':len(controls),'scrollClippedControls':partial,'pass':True})
out={'contrast':contrast,'geometry':geometries,'note':'Only fully visible targets are measured; scroll-clipped elements are explicitly excluded, not counted as passed targets. TalkBack tree is not spoken TalkBack.'}
(R/'accessibility-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print('Contrast',len(contrast),'PASS; geometry',len(geometries),'screens PASS')

