from pathlib import Path
R=Path('artifacts/sprint-9/S9-003-004-details')
s=(R.parent/'S9-001-navigation/financial.py').read_text(encoding='utf-8')
s=s.replace("detail=capture('result-root');","detail=capture('result-root');preview('result-root',390,844);")
s=s.replace("dialog=capture('close-confirm');","dialog=capture('close-confirm');preview('close-confirm',390,844);")
s=s.replace("capture('close-committed');","capture('close-committed');preview('close-committed',390,844);")
(R/'financial.py').write_text(s,encoding='utf-8')

