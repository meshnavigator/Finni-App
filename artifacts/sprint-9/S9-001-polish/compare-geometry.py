from pathlib import Path
import xml.etree.ElementTree as E,re,json
root=Path('artifacts/sprint-9')
out={}
for name in ['ordinary','small','large','large-stress']:
    out[name]={}
    for version,folder in [('before','S9-001-redesign'),('after','S9-001-polish')]:
        nodes=[n.attrib for n in E.parse(root/folder/'android'/f'{name}.xml').iter('node')]
        def box(id):
            n=next(n for n in nodes if n.get('resource-id')==id)
            x,y,r,b=map(int,re.findall(r'\d+',n['bounds']))
            return {'x':x,'y':y,'width':r-x,'height':b-y}
        pet=next(n for n in nodes if n.get('clickable')=='true' and 'Изменить питомца' in n.get('content-desc',''))
        x,y,r,b=map(int,re.findall(r'\d+',pet['bounds']))
        height=b-y-(4 if name=='small' else 0)
        scale=min((r-x-8)/520,(height-12)/568)/1.12
        out[name][version]={'finances':box('home-finances'),'lesson':box('home-lesson'),'petTarget':{'x':x,'y':y,'width':r-x,'height':b-y},'stage2ProtectedSilhouette':{'width':round(504*scale,1),'height':round(552*scale,1)}}
(root/'S9-001-polish/geometry-comparison.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(out,ensure_ascii=False))

