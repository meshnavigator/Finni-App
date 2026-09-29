
from pathlib import Path
import importlib.util,json,re,hashlib
from PIL import Image
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qa',R.parent/'S9-001-layout/android-qa.py')
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'android';q.OUT.mkdir(exist_ok=True)
out=R/'review';out.mkdir(exist_ok=True)
apk=Path('android/app/build/outputs/apk/release/app-release.apk')
q.adb('install','-r',str(apk.resolve()))
results=[]
for name,w,h,scale,long in [('prototype-200-stress',360,640,2,True),('prototype-ordinary',390,844,1,False),('prototype-short',360,640,1,False)]:
    q.fixture(long=long);q.start(w,h,scale);nodes=q.capture(name)
    values=[];targets=[];issues=[]
    for n in nodes:
        if n.get('resource-id','').startswith('home-') or n.get('text') or n.get('content-desc'):values.append(n)
        if n.get('clickable')!='true':continue
        x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
        desc=n.get('content-desc') or n.get('resource-id')
        if r-x<48 or b-y<48 or y<24 or b>h-48:issues.append({'target':desc,'bounds':n['bounds']})
        targets.append((desc,x,y,r,b))
    for i,(a,x,y,r,b) in enumerate(targets):
        for c,xx,yy,rr,bb in targets[i+1:]:
            if min(r,rr)>max(x,xx) and min(b,bb)>max(y,yy):issues.append({'overlap':[a,c]})
    im=Image.open(q.OUT/(name+'.png'));factor=min(im.width/w,im.height/h)
    x=(im.width-w*factor)/2;y=(im.height-h*factor)/2
    im.crop((round(x),round(y),round(x+w*factor),round(y+h*factor))).resize((w,h),Image.Resampling.LANCZOS).save(out/(name+'.png'))
    results.append({'case':name,'issues':issues,'nodes':values})
    print(name,json.dumps(issues),flush=True)
(R/'prototype.json').write_text(json.dumps({'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'results':results},ensure_ascii=False,indent=2),encoding='utf-8')

