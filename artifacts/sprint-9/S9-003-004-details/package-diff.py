from pathlib import Path
import difflib,json,hashlib
r=Path('artifacts/sprint-9/S9-003-004-details');out=[];files=[]
for folder in ['src','tests']:
 for old in sorted((r/'before'/folder).rglob('*.txt')):
  rel=old.relative_to(r/'before').as_posix()[:-4];new=Path(rel)
  a=old.read_text(encoding='utf-8-sig');b=new.read_text(encoding='utf-8-sig')
  if a!=b:
   out.extend(difflib.unified_diff(a.splitlines(True),b.splitlines(True),fromfile='before/'+rel,tofile=rel));files.append(rel)
for rel in ['src/ui/screen-theme.ts','src/ui/DetailBack.tsx','tests/ui-control-contract.mjs']:
 out.extend(difflib.unified_diff([],Path(rel).read_text(encoding='utf-8-sig').splitlines(True),fromfile='/dev/null',tofile=rel));files.append(rel)
(r/'package-only.diff').write_text(''.join(out),encoding='utf-8')
(r/'source-files.json').write_text(json.dumps({p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in files},indent=2),encoding='utf-8')
print('\n'.join(files))
