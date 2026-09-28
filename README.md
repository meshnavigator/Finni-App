# Питомец Финни

Expo SDK 57 / React Native / TypeScript приложение версии 0.1.0 для команды
Better Together. Локальный финансовый цикл включает профиль, план, магазин,
копилку, восемь занятий, историю и пятидневную demo-fixture поверх SQLite.
Android package: `com.meshnavigator.finni`.
Ориентация: portrait. Минимальная
поддерживаемая версия Android: API 26 (Android 8.0).

## Локальная проверка

```powershell
npm ci
npm run verify
```

Каталог `android` сохранён в проекте. Обычная release-сборка не запускает
prebuild. Намеренная регенерация выполняется только отдельным изменением с
review native diff; известный Windows workaround для пути с кириллицей описан
в `docs/environment.md`.

## Release APK

Сначала подготовьте Android SDK и внешний release keystore. Ключ, пароли и
файлы `.env` никогда не добавляются в Git. Затем задайте в текущем PowerShell:

```powershell
$env:JAVA_HOME = '<путь к JDK 17>'
$env:ANDROID_SDK_ROOT = '<путь к Android SDK>'
$env:FINNI_RELEASE_STORE_FILE = '<путь к release keystore вне репозитория>'
$env:FINNI_RELEASE_STORE_PASSWORD = '...'
$env:FINNI_RELEASE_KEY_ALIAS = '...'
$env:FINNI_RELEASE_KEY_PASSWORD = '...'
npm run android:release
```

Скрипт не выводит пароли, не использует debug fallback и перед Gradle запускает
`lint`, `typecheck`, `test`, `content` и `fixtures`. APK появляется по пути
`android/app/build/outputs/apk/release/app-release.apk`.

Точные версии toolchain и необходимые SDK packages перечислены в
`docs/environment.md`. Проверка установки и запуска на физическом устройстве
API 26 без Metro считается отдельным gate и требует фактического протокола.

## Demo, архитектура и статус M1

Пятидневный [маршрут Приложения А](docs/M1_DEMO_ROUTE.md) задаёт действия,
эталонные суммы и A.1–A.12. Взрослый открывает Demo через «Ещё» → «Для
взрослого» после барьера. «Следующий демо-день» доступен из WAITING;
«Сбросить демонстрацию» создаёт новый demo-профиль, сохраняя normal-данные.
Перед прогоном запишите APK hash, commit и устройство. Инструкция не заменяет
журнал трёх фактических release-прогонов.

Денежные правила, календарь и профиль находятся в `src/domain/`; SQLite и
атомарные команды — в `src/persistence/`; lifecycle, demo и обучение — в
`src/application/`; экраны и 2D-представление — в `src/ui/`. Контент находится
в `content/bundles/1.2.0/`, fixture — в `fixtures/`. Учебные суммы не вызывают
операции магазина или копилки.

[Матрица M1](docs/M1_TRACEABILITY.md) отделяет автоматизированное и emulator
evidence от открытых release, physical и TalkBack gate. До завершения этих
gate этот checkout не объявляется сданным M1.

[Черновик карточки](docs/M1_STORE_DRAFT.md) содержит текст и перечень
необходимых изображений; публикация в него не входит.
