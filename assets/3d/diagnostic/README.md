# S7-001 diagnostic GLB contract

В этом каталоге намеренно нет GLB. На 2026-09-18 `PET-MASTER` и `CLIP-001…014`
в каноническом asset manifest имеют `status: to_produce` и
`licenseStatus: to_document`.

Чтобы выполнить runtime spike на устройстве, положите сюда **один** локальный
`.glb`, затем передайте в `HomeSceneSpike` объект `diagnosticAsset` с путём
`assets/3d/diagnostic/<name>.glb`, источником, условиями использования и датой
проверки лицензии. Если GLB содержит skeletal animation, укажите её проверенный
zero-based `skeletalClipIndex`. Нельзя добавлять remote URL, file URI, asset без
лицензии или выдавать sample за production-ресурс Финни.

`HomeSceneSpike` не подключается к обычному Home и служит только отдельным
диагностическим экраном. Его runtime evidence не становится production PASS.
