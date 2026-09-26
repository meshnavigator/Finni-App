from pathlib import Path
import json,hashlib
r=Path(__file__).resolve().parent
load=lambda f:json.loads((r/f).read_text(encoding='utf-8-sig'))
count=lambda f:len(load(f).get('checks',load(f).get('results',[])))
assert all(load('restore.json')['files'].values())
apk=hashlib.sha256((r/'finni-details-review.apk').read_bytes()).hexdigest()
base=Path('..')
p=base/'docs/CURRENT_IMPLEMENTATION.md';s=p.read_text(encoding='utf-8')
old='Полный инвентарь, результаты фактического Verify, screenshots/APK hashes и ограничения: `Finni App/artifacts/sprint-9/S9-003-004-details/`. Состояние runtime-проверки и итоговые числа фиксируются в README после прогона; безусловное закрытие sprint-задач или physical/TalkBack PASS не заявляются.'
new=f'''Итоговый configured Verify:142 tests/lint/typecheck/content/fixtures PASS; offline APK, whitespace и full belief-map PASS. Native evidence:8 завершённых уроков и17 проверок сохранения,53 matrix checkpoints,7 финансовых e2e; после исправления error-focus на предпоследнем delivery APK (перед локальной правкой StatusBar) — {count('states.json')} states, {count('children.json')} дочерних финансовых, {count('extras.json')} adult/night ; на точном финальном APK — {count('final-smoke.json')} delivery checks и {count('transient-final.json')} boot-error/retry checks PASS. Ошибка открытия последнего урока при200% теперь полностью видна сразу под Back; каталог возвращается к ней без анимации. Superseded UIA assertion и промежуточные negative logs сохранены.

Missing/corrupt image fallback и loading100/200%: {count('resource-qa.json')} PASS на отдельной QA сборке. Product source побайтно восстановлен, установленный delivery SHA256 проверен; source/APK lineage не смешивается. Delivery SHA256: `{apk}`. Восемь исходных AVD файлов и настройки восстановлены по SHA256. Реальный TalkBack, физический perf/устройство и внешнее детское/методическое ревью NOT RUN. Native old-schema migration отдельно не повторялась; schema6 install-over сохраняет все8 файлов.

Полный инвентарь, точные журналы/версии, screenshots и ограничения: `Finni App/artifacts/sprint-9/S9-003-004-details/README.md`. S9-003/004 фиксируют внедрение; внешняя приёмка остаётся открытой. S9-002 не реализован этим пакетом.'''
assert old in s;s=s.replace(old,new);p.write_text(s,encoding='utf-8')
p=r/'INVENTORY.md';s=p.read_text(encoding='utf-8').replace('Фактические результаты Verify будут записаны в README после завершения native проверок.','Фактические результаты Verify, lineage сборок, промежуточные дефекты и ограничения записаны в README.');p.write_text(s,encoding='utf-8')
for number,slug in [('003','financial-screens-visual-language'),('004','lessons-history-adult-visual-language')]:
 p=base/f'tasks/sprint-9/S9-{number}_{slug}.md';s=p.read_text(encoding='utf-8');s=s.replace('Этот раздел фиксирует внедрение; безусловное закрытие задачи до окончательного Verify и внешней приёмки не заявляется.','Реализация и перечисленный ниже Verify выполнены; внешняя приёмка остаётся открытой.')
 s+=f'''\n### Итоговый Verify\n\nConfigured142tests/lint/typecheck/content/fixtures PASS. Native8lessons/17checks,53matrix,7financial; delivery до StatusBar:states{count('states.json')}, financial-children{count('children.json')}, adult/night{count('extras.json')}, финальный APK delivery{count('final-smoke.json')} и boot-error/retry{count('transient-final.json')} PASS. Resource/loading QA{count('resource-qa.json')} PASS на отдельно маркированной сборке; product source и delivery восстановлены. Full map, whitespace,8/8 AVD SHA256 restore PASS.\n\nФизическое устройство/performance, озвучивание TalkBack, внешнее детское и методическое ревью NOT RUN. Install-over проверен со schema6; отдельная native old-schema migration не повторялась. Полная lineage и superseded отрицательные результаты — в evidence README.\n''';p.write_text(s,encoding='utf-8')
print('Current implementation, inventory and task evidence finalized')
