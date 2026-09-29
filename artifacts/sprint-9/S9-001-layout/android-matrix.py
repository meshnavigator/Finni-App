"""Native AVD geometry evidence; never substitutes for physical/TalkBack gates."""
import importlib.util
import json
import re

spec = importlib.util.spec_from_file_location('qa', __file__.replace('android-matrix.py', 'android-qa.py'))
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)
results = []

def check(name, width, height, scale):
    qa.start(width, height, scale)
    nodes = qa.capture(name)
    issues = []
    for node in nodes:
        if node.get('clickable') != 'true':
            continue
        x1, y1, x2, y2 = map(int, re.findall(r'\d+', node['bounds']))
        if x2-x1 < 48 or y2-y1 < 48:
            issues.append({'target': node.get('content-desc'), 'bounds': node['bounds']})
    ids = {node.get('resource-id') for node in nodes}
    for expected in ('home-finances', 'home-care', 'home-lesson', 'home-primary'):
        if expected not in ids:
            issues.append({'missing': expected})
    results.append({'name': name, 'width': width, 'height': height, 'scale': scale, 'issues': issues})
    (qa.OUT / 'matrix.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(name, 'PASS' if not issues else issues, flush=True)

for state in ('ACTIVE', 'DRAFT', 'READY', 'WAITING'):
    qa.fixture(long=True, state=state)
    for width, height in ((360,640), (390,844), (412,915)):
        for scale in (1,1.5,2):
            check(f'{state}-{width}-{height}-{scale}', width, height, scale)
qa.fixture(empty=True)
for scale in (1,1.5,2):
    check(f'empty-360-640-{scale}',360,640,scale)
for shape in ('pointy','round','floppy'):
    for pattern in ('plain','spots','stripes'):
        for stage in (1,2,3):
            qa.fixture(shape=shape,pattern=pattern,stage=stage)
            check(f'{shape}-{pattern}-{stage}',390,844,1)
raise SystemExit(1 if any(result['issues'] for result in results) else 0)
