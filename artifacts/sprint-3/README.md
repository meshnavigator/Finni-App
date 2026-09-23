# Sprint 3 — review APK S3-007

- Source: `S3-007/editorial-methodical-review`, commit `1451673` (кодовые исправления S3-007 поверх локального `dev` `d3be0c4`).
- Artifact: `finni-0.1.0-s3-007-review-1451673-release.apk`, 78 947 453 байта.
- SHA-256: `564C6E9DC94A1C43152C48D1928947E1C99D9B4F00AC9A14548FAD99751ED24F`.
- Дата сборки: 2026-09-23. Копия исходников в ASCII-пути `C:\tmp\finni-s3-007-review-1451673`; исходный Git checkout после копирования не изменялся.
- `scripts/build-release.ps1`: `npm run verify` PASS, `BUILD SUCCESSFUL in 8m 59s`, 262 задачи Gradle (261 выполнена, 1 up-to-date).
- `apksigner verify`: v2 PASS, один подписант `CN=Better Together, O=Better Together, C=RU`, RSA 4096.
- `aapt dump badging`: `com.meshnavigator.finni`, version `0.1.0` / code `1`, minSdk 26, targetSdk 36, arm64-v8a/armeabi-v7a/x86/x86_64.
- Чистый Android API 26 AVD: установка и запуск без Metro, Home, каталог, исправление LS-B02 — PASS. Подробности в [runtime evidence](runtime/S3-007_RUNTIME_EVIDENCE.md).

Это сборка для повторного экспертного просмотра. Первый переданный отзыв Ханина Виктора Ивановича относится к демо неизвестной версии; повторный просмотр этого APK специалистом ещё не состоялся. Физическое устройство Samsung Galaxy A54 из первого отзыва не отождествляется с данным AVD.