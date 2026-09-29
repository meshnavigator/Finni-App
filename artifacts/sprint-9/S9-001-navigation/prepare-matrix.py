from pathlib import Path
R=Path('artifacts/sprint-9/S9-001-navigation');s=Path('artifacts/sprint-9/S9-001-structure/native-matrix.py').read_text(encoding='utf-8')
s=s.replace("results=[]", "original_capture=q.capture\ndef capture(name):\n    for i in range(3):\n        try:return original_capture(name)\n        except AssertionError:\n            if i==2:raise\n            time.sleep(.5)\nq.capture=capture\nresults=[]")
s=s.replace("for long in (False,True):\n    q.fixture(long=long);check('boundary119-'+str(long),360,640,1.19)", "for long in (False,True):\n    q.fixture(long=long)\n    for scale in (1.19,1.2):check('boundary-'+str(scale)+'-'+str(long),360,640,scale)")
s=s.replace("    content=' '.join", "    if scale<=1.2:\n        tabs=[n for n in nodes if n.get('resource-id','').startswith('root-tab-')]\n        if len(tabs)!=5:issues.append({'tabs':len(tabs)})\n        if [n.get('resource-id') for n in tabs if n.get('selected')=='true']!=['root-tab-home']:issues.append({'selected':tabs})\n    content=' '.join")
(R/'native-matrix.py').write_text(s,encoding='utf-8')
