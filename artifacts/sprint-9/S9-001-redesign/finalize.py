from pathlib import Path
import json,subprocess
r=Path('artifacts/sprint-9/S9-001-redesign')
p=r/'README.md';s=p.read_text(encoding='utf-8')
s=s.replace('имя и день остаются в доступном pet target и меню','имя остаётся в доступном pet target, имя и день — в меню крупного режима')
s=s.replace('Окончательные результаты дополняются после delivery APK/restore. Полный configured Verify: verify-final.log; 136 тестов.', 'Финальный configured Verify PASS: npm run verify — lint, typecheck, 136/136 tests, content и fixtures; verify-final.log. Full belief-map rebuild PASS; git diff --check PASS. Native-матрица PASS: 14 профилей и 8 route/modal/wallet checks (22 записи без issues). Delivery APK дополнительно проверен в normal, 200% и empty; delivery.json.')
s=s.replace('| Проверялись размеры clickable targets, но не их пересечения |','| Нажатие только снижало opacity | Добавлен scale .96 к RouteButton, сохранена минимальная зона касания |\n| Проверялись размеры clickable targets, но не их пересечения |')
s += '\n## APK и восстановление\n\nAPK: android/app/build/outputs/apk/release/app-release.apk (от code root). SHA256: 3c9595dc3f109e9487de640c04e9a21da320ac02b903a05f4cabd841385d17bf. Build delivery PASS, API26 AVD запуск без Metro PASS. Восстановлены все восемь исходных файлов с совпадением SHA256, wm size/density и отсутствие записи font_scale; приложение остановлено. После первого reset Android создал default font_scale=1.0, поэтому запись удалена ещё раз после стабилизации конфигурации; конечное значение null. Проверка: restore.json.\n'
p.write_text(s,encoding='utf-8')
p=r/'restore.json';v=json.loads(p.read_text());v['fontScaleSetting']=subprocess.check_output(['C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe','shell','settings','get','system','font_scale']).decode().strip();v['fontScaleSettingDeletedAgainAfterReset']=True;p.write_text(json.dumps(v,indent=2),encoding='utf-8')
for name in ['src/ui/HomeScreen.tsx','src/ui/FinniHomeScene.tsx']:
    assert not any(line.rstrip()!=line for line in Path(name).read_text(encoding='utf-8').splitlines()),name