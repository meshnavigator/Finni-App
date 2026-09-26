# M1 / S4-003 — локальная QA-сборка и Android API 26

Дата: 2026-09-26. Проверка выполнена на `finni_s7_005_api26` в режиме
`-read-only -no-snapshot`; после проверки эмулятор остановлен. Сохранённое
состояние AVD не менялось.

APK: `android/app/build/outputs/apk/release/app-release.apk`, SHA-256
`143F6920C418F7811E1B2F2F0B5BAF4DE1E8AFD0277106C08E7705644648D444`.
Это **тестовый release-вариант с Android Debug сертификатом**, собранный
локально через `:app:assembleRelease --offline` с временными signing
variables. Он проверяет release manifest/runtime, но не является подписанным
поставочным APK. После пересборки путь может указывать уже на другой файл;
сопоставляйте именно SHA-256.

## APK audit

- `aapt dump permissions`: только служебное
  `com.meshnavigator.finni.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`.
  INTERNET, READ/WRITE_EXTERNAL_STORAGE, SYSTEM_ALERT_WINDOW и VIBRATE
  отсутствуют.
- `aapt dump xmltree AndroidManifest.xml`: `allowBackup=false`, ссылки на
  `xml/backup_rules` и `xml/data_extraction_rules` присутствуют.
- `aapt dump resources`: оба XML включены как ресурсы `0x7f130000` и
  `0x7f130001`. Исходные правила исключают все локальные domains в cloud
  backup и device transfer.
- `apksigner verify --print-certs`: сертификат `CN=Android Debug`.

## Экранный прогон

1. Установка и запуск APK без Metro. Создан demo-профиль. До закрытия
   первого дня взрослая кнопка перехода недоступна, дата `2026-09-17`:
   [day1-locked.png](day1-locked.png).
2. Открыт первый день, подтверждён план 40/20/40; куплены IT-01 и IT-03,
   выбрана GL-01, внесено 40. День закрыт через итоги. B20/S40,
   рост +3, стадия 1. Взрослая кнопка стала активна:
   [day1-ready.png](day1-ready.png).
3. После подтверждения «Следующий демо-день» дата стала `2026-09-18`,
   кнопка снова заблокирована, B/S не изменились:
   [day2-date.png](day2-date.png).
4. После открытия второго дня B120/S40 и «День 2»: доход начислен один раз:
   [day2-open.png](day2-open.png).
5. В системных настройках включён Airplane mode и отключён Wi-Fi;
   `dumpsys connectivity` не показал активных NetworkAgent. После
   `am force-stop` приложение запустилось и восстановило B120/S40 и день 2:
   [day2-offline-restart.png](day2-offline-restart.png).

Пять полных дней, все задания и строки A.1–A.12, reset/normal isolation на
этом APK, backup/restore и визуальные клипы AN-001–014 здесь не проверялись.
Три автоматических пятидневных SQLite-прогона и правила fixture проверяются
отдельно `npm run verify`.
