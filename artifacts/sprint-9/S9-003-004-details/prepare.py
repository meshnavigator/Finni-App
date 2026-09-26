from pathlib import Path
import hashlib,json,subprocess,shutil
R=Path(__file__).resolve().parent
P=Path.cwd()
A='C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe'
PKG='com.meshnavigator.finni'
def adb(*a):return subprocess.run([A,*a],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60).stdout
adb('shell','am','force-stop',PKG)
old=json.loads((R.parent/'S9-001-navigation/original-state.json').read_text(encoding='utf-8'))
B=Path('C:/tmp/finni-s9-home-original')
checks={rel:hashlib.sha256((B/rel).read_bytes()).hexdigest()==adb('shell','sha256sum',f'/data/data/{PKG}/{rel}').decode().split()[0] for rel in old['existingBackupMatches']}
assert all(checks.values()),checks
old['existingBackupMatches']=checks
(R/'original-state.json').write_text(json.dumps(old,indent=2),encoding='utf-8')
files=['src/ui/'+f for f in ['AppRoot.tsx','AdultScreen.tsx','HelpScreen.tsx','HistoryScreen.tsx','PeriodResultScreen.tsx','LessonShell.tsx','SavingsLessonRenderer.tsx','budget-purchase-renderers.tsx','receipt-workshop-renderers.tsx','BudgetPlanScreen.tsx','ShopScreen.tsx','SavingsScreen.tsx']]
files+=['../docs/'+f for f in ['CURRENT_IMPLEMENTATION.md','IMPLEMENTATION_DECISIONS.md','mermaid/S9_001_HOME_LAYERS.md']]
files+=['../tasks/sprint-9/'+f for f in ['S9-003_financial-screens-visual-language.md','S9-004_lessons-history-adult-visual-language.md']]
manifest={}
for f in files:
 p=P/f; dst=R/'before'/f.replace('../','governance/')
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dst)
 manifest[f]=hashlib.sha256(p.read_bytes()).hexdigest()
(R/'before-hashes.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
shutil.copy2(R.parent/'S9-001-navigation/restore.py',R/'restore.py')
print('Baseline and 8 AVD hashes verified; source backups saved.')
