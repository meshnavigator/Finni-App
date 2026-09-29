from pathlib import Path
import shutil
r=Path('artifacts/sprint-9/S9-003-004-details');p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
line='        {props.message && <Text accessibilityLiveRegion="polite" style={ui.error}>{props.message}</Text>}\n'
assert s.count(line)==1;s=s.replace(line,'');target='        <DetailBack onPress={props.onBack} label={props.backLabel} />\n';assert s.count(target)==1;s=s.replace(target,target+line);p.write_text(s,encoding='utf-8')
for ext in ['png','xml']:shutil.copy2(r/'android'/('catalog-storage-error-200.'+ext),r/'before-native'/('catalog-error-under-heading-200.'+ext))
shutil.copy2(r/'review/catalog-storage-error-200.png',r/'review/catalog-error-under-heading-200.png')
p=r/'states.py';s=p.read_text(encoding='utf-8');old="assert n.match(nodes,'Занятие не открылось. Монеты твоего дня не изменились.')";new="error=n.match(nodes,'Занятие не открылось. Монеты твоего дня не изменились.');assert error\na,b,c,d=n.bounds(error);assert b>=24 and d<=n.H-48 and d-b>=48,error";s=s.replace(old,new);p.write_text(s,encoding='utf-8')
