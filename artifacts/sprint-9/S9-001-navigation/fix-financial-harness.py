from pathlib import Path
R=Path('artifacts/sprint-9/S9-001-navigation');s=(R/'routes.py').read_text(encoding='utf-8')
a=s.index('for scale in (1,1.19):');b=s.index('# Real commands on the isolated fixture:')
s=s[:a]+s[b:]
s=s.replace("(R/'routes.json')", "(R/'financial.json')")
for case in ('purchase','care','transfer'):
 s=s.replace("nodes=capture('"+case+"-committed');money", "committed=capture('"+case+"-committed');tap(find(committed,'root-tab-home'));nodes=capture('"+case+"-home');money")
s=s.replace("nodes=capture('close-committed');money", "capture('close-committed');nodes=back('close-home');money")
(R/'financial.py').write_text(s,encoding='utf-8')
