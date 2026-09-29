
from pathlib import Path
import json,hashlib
R=Path('artifacts/sprint-9/S9-001-structure')
def rgb(h):return [int(h[i:i+2],16)/255 for i in (1,3,5)]
def lum(h):
    v=[a/12.92 if a<=.04045 else ((a+.055)/1.055)**2.4 for a in rgb(h)]
    return sum(a*b for a,b in zip(v,(.2126,.7152,.0722)))
def ratio(a,b):
    x,y=sorted((lum(a),lum(b)));return round((y+.05)/(x+.05),2)
pairs=[('primary text','#FFFFFF','#AE482A'),('disabled text','#FFFFFF','#806C5B'),('body','#3D352D','#FFFCF6'),('caption','#665444','#FFFCF6'),('state','#665444','#F9F2E7'),('selected nav','#603C24','#EEDFCA'),('icons','#725741','#FFFCF6'),('name','#594737','#EDE2CD')]
(R/'contrast.json').write_text(json.dumps([{'element':n,'foreground':a,'background':b,'ratio':ratio(a,b)} for n,a,b in pairs],ensure_ascii=False,indent=2),encoding='utf-8')
# Untracked presentation files are not covered by the repository diff check.
files=['src/ui/HomeScreen.tsx','src/ui/home-next-step.ts','src/ui/home-scene-layout.ts','tests/home-next-step.test.mjs']
issues=[{'file':p,'line':i} for p in files for i,line in enumerate(Path(p).read_text(encoding='utf-8-sig').splitlines(),1) if line.rstrip()!=line]
(R/'untracked-whitespace.json').write_text(json.dumps(issues),encoding='utf-8')
print(json.dumps({'contrast':[(n,ratio(a,b)) for n,a,b in pairs],'whitespaceIssues':issues}))

