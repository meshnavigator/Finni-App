from pathlib import Path
r=Path('artifacts/sprint-9/S9-003-004-details')
(r/'build-node-env-first.log').write_bytes((r/'build.log').read_bytes())
for name in ['build.ps1','build-qa.ps1']:
 p=r/name;s=p.read_text(encoding='utf-8-sig');s=s.replace("$ErrorActionPreference = 'Stop'", "$ErrorActionPreference = 'Stop'\n$env:NODE_ENV = 'production'");p.write_text(s,encoding='utf-8')
