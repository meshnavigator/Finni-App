# S0-005: Создать каркас приложения и первый release APK

## Цель
Получить воспроизводимый Expo SDK 57 + React Native + TypeScript проект и release APK для Android API 26 без Metro.

## Контекст
`Finni App` пуст; стек ещё не подтверждён. Первый устанавливаемый release — главный технический блокер roadmap.

## Состав работ
- создать приложение с зафиксированными версиями и lockfile;
- настроить Android 8+, portrait и выбранный applicationId;
- сохранить нативный `android` и исключить его регенерацию обычной сборкой;
- добавить scripts lint/typecheck/tests/content/fixtures;
- описать Windows/JDK/Android окружение и собрать release APK.

## Источники
- официальное ТЗ, §§3.1–3.4;
- SRS v1.3, §§14.1, 14.3, 20.2 DEV-01/02, 22.1–22.3;
- S0-004.

## Критерии приёмки
- версии закреплены lockfile;
- clean release build воспроизводим по инструкции;
- APK запускается на API 26 без Metro;
- секреты и ключи не находятся в репозитории.

## Зависимости
- S0-004.

## Verify
- install, lint, typecheck и минимальный test;
- clean release build и проверка APK;
- установка/запуск на API 26;
- `git diff --check`.

## Out of scope
- финансовая логика и SQLite;
- финальный дизайн, RuStore и AAB.
