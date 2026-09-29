"""Export animation groups from the existing editable layer package.

This is a deterministic source export, not new artwork: retain accepted RGBA
pixels, combine the partition masks before scaling so RN does not introduce
separate antialiased sampling seams. Original PNGs/ORA are never modified.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/2d/poses/FINNI-PUPPET-V1'
OUT.mkdir(parents=True, exist_ok=True)
records = []
for shape in ('pointy', 'round', 'floppy'):
    for pattern in ('plain', 'spots', 'stripes'):
        appearance = f'{shape}-{pattern}'
        for expression in ('neutral', 'blink', 'happy', 'thoughtful', 'inspired'):
            package = 'FINNI-MATRIX-V1' if expression in ('neutral', 'blink') else 'FINNI-EXPRESSIONS-V1'
            source = ROOT / 'assets/2d/variants' / package / appearance
            original = np.array(Image.open(source / f'{expression}.png').convert('RGBA'))
            groups = {'head': ('ear-shape', 'face', 'expression')}
            if expression == 'neutral':
                groups['body'] = ('body', 'pattern', 'accessory')
            for group, parts in groups.items():
                masks = [np.array(Image.open(source / 'export' / expression / f'pet-{part}.png').convert('RGBA'))[:, :, 3] for part in parts]
                selection = np.maximum.reduce(masks) > 0
                exported = original.copy()
                exported[:, :, 3] = np.where(selection, original[:, :, 3], 0)
                target = OUT / appearance / f'{expression}-{group}.png'
                target.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(exported).save(target)
                assert np.array_equal(exported[selection], original[selection])
                records.append({'path': str(target.relative_to(OUT)).replace('\\', '/'), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'source': str((source / f'{expression}.png').relative_to(ROOT)).replace('\\', '/'), 'sourceSha256': hashlib.sha256((source / f'{expression}.png').read_bytes()).hexdigest(), 'selectedPixelDifference': 0})
(OUT / 'asset-manifest.json').write_text(json.dumps({'packageId': 'FINNI-PUPPET-V1', 'canvas': [941,1672], 'status': 'deterministic-export-runtime-review', 'sourceArt': 'owner-accepted FINNI-MATRIX-V1 and FINNI-EXPRESSIONS-V1', 'assets': records}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Exported {len(records)} groups; all selected RGBA pixels unchanged')

# Package the generated lower-body pose with a concealed, curved neck overlap.
# The raw ImageGen images remain unmodified alongside these renderer exports.
head = np.array(Image.open(OUT / 'pointy-plain/neutral-head.png'))[:, :, 3]
bottom = np.max(np.where(head > 0, np.arange(1672)[:, None], 0), axis=0)
gesture_root = ROOT / 'assets/2d/poses/FINNI-GESTURE-V1'
gesture_records = []
for pattern in ('plain','spots','stripes'):
    source = gesture_root / f'{pattern}.png'
    data = np.array(Image.open(source).convert('RGBA'))
    h,w = data.shape[:2]
    columns = np.minimum(940, np.arange(w) * 941 // w)
    cut = np.maximum(1010, bottom[columns] - 8) * h / 1672
    data[:, :, 3] = np.where(np.arange(h)[:, None] < cut[None, :], 0, data[:, :, 3])
    target = gesture_root / f'{pattern}-body.png'
    Image.fromarray(data).save(target)
    gesture_records.append({'pattern':pattern,'source':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'path':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'dimensions':[w,h]})
# Acceptance applies only to the exact source/export hashes reviewed by the owner.
acceptance_path = gesture_root / 'owner-acceptance.json'
acceptance = json.loads(acceptance_path.read_text(encoding='utf-8')) if acceptance_path.exists() else {}
reviewed = [{key: asset[key] for key in ('pattern', 'sourceSha256', 'sha256')} for asset in gesture_records]
accepted = acceptance.get('status') == 'owner-accepted' and acceptance.get('assets') == reviewed
manifest = {'packageId':'FINNI-GESTURE-V1','status':'owner-accepted' if accepted else 'candidate-owner-art-review-pending','source':'Built-in ImageGen; original project character reference','rights':'Generated for this project from its accepted character reference; no third-party stock used','export':'Lower-body alpha selection; RGB retained; 8px concealed overlap with accepted head silhouette','assets':gesture_records}
if accepted:
    manifest['ownerAcceptance'] = {'record':acceptance_path.name,'date':acceptance['date'],'scope':acceptance['scope']}
(gesture_root / 'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
