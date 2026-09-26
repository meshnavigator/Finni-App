from pathlib import Path
import json,re,hashlib
R=Path('artifacts/sprint-9/S9-001-navigation')
paths=['src/ui/AppRoot.tsx','src/ui/HomeScreen.tsx','src/ui/BudgetPlanScreen.tsx','src/ui/ShopScreen.tsx','src/ui/SavingsScreen.tsx','src/ui/RootNavigation.tsx','src/ui/root-navigation.ts','tests/profile-ui.test.mjs','tests/finni-home-scene.test.mjs','tests/root-navigation.test.mjs']
issues=[]
for name in paths:
 p=Path(name);raw=p.read_bytes()
 if b'\r\r\n' in raw:issues.append([name,'double CR'])
 for number,line in enumerate(raw.decode('utf-8-sig').splitlines(),1):
  if re.search(r'[ \t]+$',line):issues.append([name,number])
 if not raw.endswith(b'\n'):issues.append([name,'missing final newline'])
(R/'untracked-whitespace.json').write_text(json.dumps({'files':paths,'issues':issues},indent=2),encoding='utf-8');assert not issues,issues
print('PASS whitespace',len(paths),'changed product/test files')
