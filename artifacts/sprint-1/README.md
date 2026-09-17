# Sprint 1 runtime artifact

`finni-0.1.0-s1-004-release.apk` — исходный clean signed build S1-004. Его
неизменяемый runtime-прогон выявил перекрытие Android status bar; SHA-256:
`066830FD54824AE9C6DC0D73167E6D4819B91FFEA8FBA165DE3E59798ABD9930`.

`finni-0.1.0-s1-004-r4-release.apk` — финальный подписанный build после
runtime-исправлений safe-area и компактных подписей. SHA-256:
`3486DA3B6F0BFC46FC03D52CE2E2C825DF818CEE62A222D24732BF0EDD6B2804`.
Hash хранится в соседнем `.sha256`.

Финальный APK прошёл onboarding, два вида питомца, cancel edit, offline
force-stop/relaunch, 360×640 dp и fontScale 1/2 на AVD Android API 36. Полный
протокол и screenshots/XML: `runtime/S1-006_RUNTIME_EVIDENCE.md`.
Физический API 26 остаётся отдельной задачей S0-006.
