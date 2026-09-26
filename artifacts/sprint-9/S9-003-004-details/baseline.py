from pathlib import Path
import importlib.util,time,re
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('q',R.parent/'S9-001-layout/android-qa.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=R/'before-native';q.OUT.mkdir(exist_ok=True)
def tap(n):
 x,y,r,b=map(int,re.findall(r'\d+',n['bounds']));q.adb('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.5)
q.fixture();q.start(390,844,1)
nodes=q.capture('home')
tap(next(n for n in nodes if n.get('resource-id')=='home-lesson'))
q.capture('lesson-before')
print('Current lesson screenshot saved')
