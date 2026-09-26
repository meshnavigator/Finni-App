from pathlib import Path
r=Path('artifacts/sprint-9/S9-003-004-details')
p=r/'native.py';s=p.read_text(encoding='utf-8-sig');s += '''

def clipped_keys(xml_path):
 clipped=set()
 def visit(node,viewports):
  box=bounds(node.attrib) if node.get('bounds') else None
  if box and node.get('clickable')=='true':
   a,b,c,d=box
   if any(a<=v[0] or b<=v[1] or c>=v[2] or d>=v[3] for v in viewports):
    clipped.add((node.get('bounds'),node.get('content-desc'),node.get('text')))
  if box and node.get('scrollable')=='true':viewports=viewports+[box]
  for child in node:visit(child,viewports)
 visit(q.ET.parse(xml_path).getroot(),[])
 return clipped
''';p.write_text(s,encoding='utf-8')
p=r/'matrix.py';s=p.read_text(encoding='utf-8-sig').replace("nodes=n.capture(name,True);full=[];clipped=[]","nodes=n.capture(name,True);full=[];clipped=[];edge=n.clipped_keys(n.q.OUT/(name+'.xml'))").replace("if b<=24 or d>=n.H-48:","if (x.get('bounds'),x.get('content-desc'),x.get('text')) in edge or b<=24 or d>=n.H-48:");p.write_text(s,encoding='utf-8')
p=r/'audit.py';s=p.read_text(encoding='utf-8-sig').replace('import json,xml.etree.ElementTree as ET,re,itertools','import json,xml.etree.ElementTree as ET,re,itertools\nimport native as native').replace('controls=[];partial=0','controls=[];partial=0;edge=native.clipped_keys(p)').replace("a,b,c,d=map(int,re.findall(r'\\\\d+',n.get('bounds',''))) if False else map(int,re.findall(r'\\d+',n.get('bounds','')))","a,b,c,d=map(int,re.findall(r'\\d+',n.get('bounds','')))").replace("if b<=24 or d>=shot['height']-48:","if (n.get('bounds'),n.get('content-desc'),n.get('text')) in edge or b<=24 or d>=shot['height']-48:");p.write_text(s,encoding='utf-8')
(r/'matrix-viewport-first.log').write_bytes((r/'matrix.log').read_bytes())
