
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parent;F=R/'fault'
hashes=json.loads((F/'production-hashes.json').read_text())
for name,expected in hashes.items():
    p=Path(name);data=(F/(p.name+'.production.txt')).read_bytes()
    assert hashlib.sha256(data).hexdigest()==expected
    p.write_bytes(data)
assert not any('QA_ONLY_STRUCTURAL_HOME' in Path(name).read_text(encoding='utf-8') for name in hashes)
print('Production source restored byte-for-byte')

