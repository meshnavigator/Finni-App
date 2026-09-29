from pathlib import Path
import json,hashlib
root=Path('artifacts/sprint-9/S9-001-polish')
delivery=json.loads((root/'delivery.json').read_text())
matrix=json.loads((root/'native-matrix.json').read_text(encoding='utf-8'))
restore=json.loads((root/'restore.json').read_text())
assert len(matrix['results'])==32 and not any(r['issues'] for r in matrix['results'])
assert len(delivery['checks'])==8 and all(x['pass'] for x in delivery['checks'])
assert all(restore['files'].values())
assert delivery['homeSourceSha256']==hashlib.sha256(Path('src/ui/HomeScreen.tsx').read_bytes()).hexdigest()
body="""# S9-001 — финальная доработка материала и адаптации Home

2026-09-25. Статус: implemented for owner review. Художественная приёмка владельцу не приписана.

## Итоговые Android снимки

- [Обычный 390×844](review/ordinary.png).
- [Короткий 360×640](review/small.png).
- [Крупный текст 200%](review/large.png).
- [200%, длинные суммы и занятие](review/large-stress.png).
- [119%, исправленный граничный профиль](review/short-119-stress.png).

Это реальные снимки delivery APK на API 26 AVD. Review previews только обрезают чёрные поля framebuffer и приводятся к логическому размеру; UI не дорисован. Исходные screencap/XML — android/. Макеты mockup-*.png являются дизайн-fixtures.

## Источники и область изменения

Визуально просмотрены утверждённый docs/Finni_3D_Addendum_v1.0/reference/finni-home-approved.png, предыдущие ordinary/small/large screenshots, оба прохода новых макетов и реальные Android результаты. Решение следует прямому уточнению владельца, S6-002_v4_2_COMPOSITION_SPEC.md, S9-001 и Accepted DEC-2026-09-25-012 о строгой одновременной сводке по ТЗ §2.5.3.

Production-изменения ограничены src/ui/HomeScreen.tsx. Применены direct-model-routing, make-interfaces-feel-better, project-map и verify-task. Карта показала HomeScreen → FinniHomeScene/home-scene-layout/room-assets/ui-model, единственный UI dependent — AppRoot; изменения application/domain/SQLite не понадобились.

## Материал, компоновка и типографика

| Before | After |
| --- | --- |
| Белые непрозрачные поверхности закрывали комнату | Общий HOME_SURFACE rgba(255,248,235,.78), лёгкий светлый контур, тёплый цвет комнаты виден сквозь HUD, боковые действия и навигацию |
| Вторичные серые подписи рассчитаны на белый фон | #514537; расчётный минимум 5,22:1 даже над чёрным подложенным фоном. Основной текст 7,67:1, line icons 3,67:1; текст/изображения имеют полную opacity |
| Финансовая карточка высотой 133 dp | 119 dp на обоих базовых профилях: согласованные отступы, чуть меньшие декоративные иконки, более тонкий контрастный progress track |
| Состояние и занятие имели вложенные непрозрачные заливки | Одна полупрозрачная поверхность; lesson без собственной повторной заливки, ширина берётся из измеренной сцены |
| Только подписи предметов были на белых плашках; предметы терялись | Иллюстрация и подпись внутри одной нажимаемой панели 78×72 dp; у планера удалена прежняя условная подставка, панели имеют единый материал и выравнивание |
| Short использовал тесную центральную область | Отдельные отступы, забота/планер слева, копилка справа, увеличенный центральный Финни. Высота расчётного силуэта стадии 2: 125,8→155,4 dp; данные и подписанные маршруты сохранены |
| Боковые кнопки и нижняя навигация занимали больше места | Обычные rail targets от 66 dp, short от 52 dp; согласованные размеры иконок и интервалы. Навигация 60 dp с targets 50 dp, CTA short 48 dp; фактические targets проверены |
| Промежуточный 119% раскрывал перенос числа/слова и пересечения | Short в диапазоне >105–120% убирает декоративные денежные картинки, расширяет rail до 84 dp, отдаёт место цифрам; предметные панели 64 dp оставляют ≥8 dp после длинного занятия. Текст масштабируется полностью |
| Large имел отдельный материал и почти исчезнувшую комнату | Тот же материал панелей, roomOpacity .18, сохранены полные данные и modal «Разделы». Горизонтальный padding финансов компенсирует новый контур, поэтому цель не получает лишнего переноса |
| Press-feedback уменьшал opacity текста | Только scale .96; feedback добавлен также CTA и предметам, контраст текста сохраняется |
| Неиспользуемые стили условной подставки/якоря оставались в Home | Удалены только относящиеся к заменённой презентации стили; маршруты, fallback-подписи и обработчики сохраняются |

Данные размеров — geometry-comparison.json, консервативный sRGB расчёт контраста — contrast.json/contrast.py. Оценка качества дополнительно выполнена визуально; geometry PASS не используется как художественная приёмка.

## Фактический Verify

- npm run verify — PASS: lint, TypeScript, 136/136 tests, content, fixtures; verify-final.log.
- Полная Android матрица — PASS, 32 проверки; native-matrix.json/native-matrix.log. 23 профиля плюс 7 route/Back checks, неизменность видимой денежной сводки после переходов и modal/Back isolation.
- Покрытие: 360×640, 390×844, 412×915; 100/150/200%; длинные суммы/занятие; DRAFT/READY/WAITING; пустая цель; short стадии 1/3 и обычный/large стадия 3.
- Конкретный граничный дефект 119% воспроизведён и исправлен. Сохранён отрицательный результат font-boundary-iteration1.json и исходный screenshot; исправленная проверка font-boundary.json — PASS.
- После полной матрицы финальный diff добавил только высоту 64 dp у предметных панелей промежуточного short, чтобы получить визуальный зазор. Точный delivery APK повторно проверен по 8 профилям: ordinary, small, large, large-stress, empty, empty-small, short-119, short-119-stress. Все targets ≥48 dp, пересечений нет, зазор после занятия ≥8 dp; delivery.json — PASS.
- Финальные ordinary/short/200%/119% и stress/empty/stage screenshots просмотрены визуально. Барьер взрослого раздела сохраняется.
- Offline Gradle :app:assembleRelease -PreactNativeArchitectures=x86_64 --offline — PASS; build-final.log. В APK есть assets/index.android.bundle, запуск release на API26 выполнен.
- Full belief-map rebuild — PASS; belief-map.log. git diff --check — PASS; diff-check.log. Новый HomeScreen дополнительно проверен на trailing whitespace, поскольку ещё не tracked в текущем Git.
- Нового архитектурного решения и изменения workflow нет. CURRENT_IMPLEMENTATION, evidence DEC-2026-09-25-012 и task-файл уточнены; topology S9_001_HOME_LAYERS не меняется.

## APK и тестовое состояние

APK: android/app/build/outputs/apk/release/app-release.apk относительно code root.
Delivery SHA256: APK_HASH.
Production HomeScreen SHA256: SOURCE_HASH.

QA APK x86_64 использует общеизвестный локальный debug keystore и не является production подписанной поставкой. Полная матрица и delivery имеют собственные SHA256, зафиксированные в JSON: последняя правка касается только промежуточного short и проверена точным delivery APK.

Свежий перенос данных AVD в backup был отклонён автоматической approval review. Применена безопасная альтернатива: без извлечения БД сравнены SHA256 всех восьми исходных файлов с уже существующей копией предыдущего QA; все совпали. По завершении восстановлены эти восемь файлов и исходные wm size/density/fontScale; проверены on-device hashes. Новая приватная БД из AVD не копировалась. Evidence: original-state.json, restore.json. Приложение остановлено.

## Границы

Физический Android/performance и настоящее озвучивание TalkBack — NOT RUN. Их gates и полное закрытие S9-001 не подменяются этой доработкой. Проверка интерфейса в AVD и контраста не является полноценным аудитом доступности. Художественная оценка нового результата остаётся у владельца. Commit/push не выполнялись; исходные Sprint 8/9 изменения сохранены.

EXECUTION_MODE: DIRECT
MODEL: gpt-6-astra
REASONING: xhigh
OTHER_MODELS_USED_FOR_CONTENT: NO
"""
body=body.replace('APK_HASH',delivery['apkSha256']).replace('SOURCE_HASH',delivery['homeSourceSha256'])
(root/'README.md').write_text(body,encoding='utf-8')
check_paths=[Path('src/ui/HomeScreen.tsx'),root/'README.md']
bad=[]
for p in check_paths:
    for i,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
        if line!=line.rstrip():bad.append((str(p),i))
assert not bad,bad
(root/'final-check.json').write_text(json.dumps({'deliveryChecks':8,'nativeMatrixChecks':32,'unitTests':136,'sourceMatchesDelivery':True,'whitespace':True,'restoredFiles':len(restore['files']),'directModel':'gpt-6-astra','reasoning':'xhigh'},indent=2),encoding='utf-8')
print('Final report written. APK:',delivery['apkSha256'])

