from pathlib import Path
import difflib,json,hashlib
R=Path('artifacts/sprint-9/S9-001-navigation');parts=[];stats=[]
for path in ['src/ui/AppRoot.tsx','src/ui/HomeScreen.tsx','src/ui/BudgetPlanScreen.tsx','src/ui/ShopScreen.tsx','src/ui/SavingsScreen.tsx','tests/profile-ui.test.mjs','tests/finni-home-scene.test.mjs']:
 p=Path(path);before=R/'before'/(p.name+'.txt');a=before.read_text(encoding='utf-8-sig');b=p.read_text(encoding='utf-8-sig');d=list(difflib.unified_diff(a.splitlines(True),b.splitlines(True),fromfile=path+' (before this task)',tofile=path));parts.extend(d);stats.append({'path':path,'added':sum(x.startswith('+') and not x.startswith('+++') for x in d),'removed':sum(x.startswith('-') and not x.startswith('---') for x in d)})
for path in ['src/ui/root-navigation.ts','src/ui/RootNavigation.tsx','tests/root-navigation.test.mjs']:
 p=Path(path);parts.extend(difflib.unified_diff([],p.read_text(encoding='utf-8-sig').splitlines(True),fromfile='/dev/null',tofile=path))
(R/'package.diff').write_text(''.join(parts),encoding='utf-8');(R/'product-hashes.json').write_text(json.dumps({str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in map(Path,[x['path'] for x in stats]+['src/ui/root-navigation.ts','src/ui/RootNavigation.tsx','tests/root-navigation.test.mjs'])},indent=2),encoding='utf-8');print(json.dumps(stats,indent=2))
