# S0-006: Проверить первый release APK на физическом Android API 26

## Цель

Закрыть единственный недостающий runtime-критерий S0-005: установить
подписанный release APK на физическое устройство Android API 26 и подтвердить
автономный запуск без Metro и Expo Go.

## Evidence

- S0-005 закрыта как `partial`: каркас, lockfile, локальные проверки, clean
  release build, подпись и manifest APK подтверждены.
- Артефакт:
  `Finni App/artifacts/sprint-0/finni-0.1.0-release.apk`.
- SHA-256:
  `062590A99C4541BB860F1F95DADA904D9F6D232ABBF4C63FE2BE3CC19273257F`.
- `adb devices -l` 2026-09-17 не обнаружил подключённых устройств; установка
  и запуск не выполнялись.
- Более поздняя S4-004 покрывает полную физическую и производительную
  регрессию, но не заменяет этот ранний bootstrap-gate.

## Состав работ

- подключить физическое устройство и подтвердить USB debugging;
- подтвердить Android API 26 и записать производителя, модель, версию Android
  и объём ОЗУ; полный serial в отчёте не публиковать;
- повторно проверить SHA-256 APK;
- убедиться, что Metro не запущен, установить APK через ADB и запустить
  `com.meshnavigator.finni/.MainActivity`;
- зафиксировать команды, exit codes, результат установки, foreground/process
  evidence и наблюдаемый стартовый экран;
- при обнаружении device-specific дефекта исправить его отдельным изменением,
  пересобрать APK и заново выполнить все проверки S0-005.

## Критерии приёмки

- ADB видит физическое устройство в состоянии `device`, а
  `ro.build.version.sdk` равен `26`;
- хеш устанавливаемого APK совпадает с зафиксированным артефактом;
- `adb install -r` завершается `Success`;
- приложение запускается после `force-stop` без Metro и Expo Go, процесс и
  foreground activity подтверждены через ADB;
- в completion evidence записаны модель, Android, API, ОЗУ, версия/hash APK,
  команды и фактические наблюдения;
- S0-005 не переименовывается задним числом в `done`: закрытие runtime-gate
  трассируется отдельным отчётом S0-006.

## Зависимости

- `S0-005_partial`;
- доступное физическое устройство Android API 26 и USB debugging.

## Verify

- `adb devices -l`;
- `adb shell getprop ro.build.version.sdk` и свойства модели/Android;
- проверка `/proc/meminfo`;
- `Get-FileHash -Algorithm SHA256` для APK;
- `adb install -r <apk>`;
- `adb shell am force-stop com.meshnavigator.finni`;
- `adb shell am start -W -n com.meshnavigator.finni/.MainActivity`;
- `adb shell pidof com.meshnavigator.finni` и проверка foreground activity;
- подтверждение отсутствия запущенного Metro;
- `git diff --check`, если в ходе проверки менялись файлы репозитория.

## Out of scope

- полная регрессия пользовательского цикла и производительности из S4-004;
- тестирование на API выше 26 вместо обязательного API 26;
- Expo Go, debug APK, эмулятор или mock как замена физическому evidence;
- публикация APK и любые внешние GitHub-действия.
