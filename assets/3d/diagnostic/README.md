# S7-001 diagnostic GLB contract

В этом каталоге намеренно нет GLB. На 2026-09-18 `PET-MASTER` и `CLIP-001…014`
в каноническом asset manifest имеют `status: to_produce` и
`licenseStatus: to_document`.

Чтобы выполнить runtime spike на устройстве, положите сюда **один** локальный
`.glb` и в TypeScript-файле рядом с ним передайте в `HomeSceneSpike` объект
`diagnosticAsset`. Поле `module` обязательно должно быть opaque module ID от
**статического** Metro require; `bundlePath` — только проверяемая metadata, а не
динамический URI загрузки:

```ts
const diagnosticAsset = {
  id: 'licensed-diagnostic-sample',
  bundlePath: 'assets/3d/diagnostic/licensed.glb',
  module: require('./licensed.glb'),
  license: { source: '...', terms: 'diagnostic-only', reviewedAt: '2026-09-18' },
  skeletalClipIndex: 0,
};
```

Metro не обязан упаковывать GLB по строковому пути. Если GLB содержит skeletal
animation, укажите её проверенный zero-based `skeletalClipIndex`. Нельзя
добавлять remote URL, file URI, asset без лицензии или выдавать sample за
production-ресурс Финни.

`HomeSceneSpike` не подключается к обычному Home и служит только отдельным
диагностическим экраном. Его runtime evidence не становится production PASS.