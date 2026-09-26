# S4-003: Провести аудит безопасности, офлайн-работы и происхождения ассетов

## Цель
Подтвердить локальность ядра, минимум разрешений, корректное удаление/backup rules и законное происхождение зависимостей и ассетов.

## Контекст
Приложение не собирает персональные данные и не требует сети. Секреты, signing keys и необоснованные разрешения запрещены.

## Состав работ
- проверить Android manifest, network calls и permissions;
- настроить backup/exclusion rules и подтвердить удаление данных;
- провести secret scan и проверить release contents;
- составить SBOM/реестр библиотек, шрифтов, звуков, изображений и AI-origin;
- проверить offline mandatory flow.

## Источники
- официальное ТЗ, §§2.7, 3.1, 3.4–3.5, 5;
- SRS v1.3, §§17.2–17.4, 22.4, 22.8;
- NFR-08/09/15/19; DEV-26; TC-073/074, TC-081/082, TC-148/149.

## Критерии приёмки
- лишние permissions/network SDK отсутствуют;
- backup не восстанавливает удалённый профиль вопреки обещанию;
- секретов и ключей нет в истории/артефакте;
- у каждого стороннего материала есть источник и условия использования.

## Зависимости
- S0-005, S2-004; после стабилизации ассетов S4-002.

## Verify
- manifest/network/secret scans;
- offline airplane-mode run;
- uninstall/reinstall/delete/backup checks на Android;
- dependency/license inventory review.

## Out of scope
- юридическое заключение по публикации;
- телеметрия, реклама и облако.

## Прогресс 2026-09-26 — Android manifest

Два ранее собранных release APK содержали INTERNET, READ/WRITE_EXTERNAL_STORAGE,
SYSTEM_ALERT_WINDOW и VIBRATE; `allowBackup=true` без правил исключения.
В исходном приложении не обнаружено необходимости в сети, внешнем хранилище,
overlay или вибрации. Основной manifest теперь запрещает backup и задаёт
правила исключения для cloud backup и device transfer, включая SQLite БД и
их sidecar-файлы. Release overlay удаляет пять разрешений; debug сохраняет
INTERNET для Metro. Expo config plugin восстанавливает изменения после
`prebuild --clean`.

Объединённый debug manifest проверен: INTERNET сохранён, backup выключен.
С временным тестовым signing environment собран release-вариант APK, SHA-256
`143F6920C418F7811E1B2F2F0B5BAF4DE1E8AFD0277106C08E7705644648D444`:
в упакованном manifest осталась только служебная permission, backup выключен,
оба XML-ресурса включены. На Android API 26 APK открылся после перезапуска
при Airplane mode и отключённом Wi-Fi. Подробности и границы
[QA evidence](../../Finni%20App/artifacts/sprint-4/M1-security-api26-qa/README.md).
Поставочный APK с внешним release-ключом, uninstall/reinstall/backup-restore,
secret scan, SBOM и лицензии остаются открытыми; задача не закрыта.
