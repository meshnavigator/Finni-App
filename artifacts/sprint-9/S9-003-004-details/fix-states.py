from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/states.py');s=p.read_text(encoding='utf-8')
s=s.replace("nodes=n.capture('boot-error-200',True);assert n.match(nodes,'Попробовать снова');","nodes=n.capture('boot-error-200',True);n.scrollfind(nodes,'Попробовать снова');n.capture('boot-error-200-actions',True);")
p.write_text(s,encoding='utf-8')

