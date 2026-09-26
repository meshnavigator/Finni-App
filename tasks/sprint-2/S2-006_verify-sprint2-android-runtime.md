# S2-006: Проверить финансовый цикл Sprint 2 на Android emulator

## Цель
Закрыть Android runtime-критерии S2-001–S2-005 на production-representative
API 26 AVD без подмены их Node SQLite или source-тестами. Physical-device gate
сохранить для Sprint 10 по DEC-2026-09-22-009.

## Evidence и причина
Автоматизированная реализация Sprint 2 проходит `npm run test:core` 52/52 и
полный suite 69/69. Для S2-006 восстановлен официальный Android SDK, собран
signed release APK и поднят API 26 AVD; физическое устройство пользователь
явно перенёс в финальный аппаратный спринт.

## Состав работ
- собрать и установить signed release APK с `com.meshnavigator.finni`;
- пройти Shop, Savings, Ledger, PeriodResult, History, Help и Adult gate;
- проверить normal↔demo, reset demo, delete normal и изоляцию данных;
- выполнить force-stop/cold recovery до записи и после подтверждённой записи;
- обновить controlled schema-v4 APK до v5 тем же package/signing certificate;
- проверить 360 dp, минимум 48 dp и пять cold starts;
- провести безопасный bounded storage-pressure test с обязательным cleanup.

## Критерии приёмки
- ни один сценарий не создаёт частичное состояние или повторную проводку;
- restart и controlled upgrade сохраняют профиль, кошелёк и schema state;
- reset/delete не затрагивают другой режим и переживают force-stop/relaunch;
- обязательные controls доступны на 360 dp и имеют минимум 48 dp;
- сохранены AVD/ОС/ОЗУ, APK hash, signing lineage, дата и runtime evidence;
- emulator PASS не объявляется physical-device/performance PASS.

## Зависимости
- S2-001–S2-005 automated scope;
- Android SDK/adb/emulator, API 26 image и локальные release credentials.

## Verify
- configured lint, typecheck, tests, content и fixtures;
- signed release build/install/cold-start без Metro;
- UI XML/runtime smoke и same-signing controlled v4→v5 upgrade;
- `git diff --check` и evidence review.

## Out of scope
- физическое устройство, OEM lifecycle/storage, thermal/battery и настоящий
  full-disk; они остаются в S10-001/S10-002;
- визуальная production-поставка Sprint 8–10;
- движок уроков Sprint 3;
- новые финансовые правила или catalog IDs.
