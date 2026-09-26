# S7-002 — blocker художественного vertical slice

## Вердикт

**BLOCKED / NOT STARTED.** Device evidence временно не блокирует подготовку,
но проверять художественное качество пока нечего.

## Evidence

- `reference/finni-home-approved.png` (`REF-001`) — утверждённый concept,
  не 3D-модель;
- `S6-002_v3_scene-preview.png` — ImageGen preview, не production asset;
- единственный GLB — `Finni App/assets/3d/diagnostic/Fox.glb`, явно
  diagnostic-only и не Финни;
- `PET-MASTER`, `ROOM-BASE`, `OBJ-CHEST`, `CLIP-001..014` в
  `asset-manifest.json` имеют `to_produce`, пустые `productionFiles`,
  `licenseStatus: to_document`, `qaStatus: not_tested`;
- production licenses/provenance отсутствуют; art и technical owners не
  назначены.

## Что нужно для старта

- назначить art и technical owners;
- поставить licensed/provenanced full-body Finni GLB и editable source с
  rig/morph/materials/textures;
- добавить idle, blink и 1–2 характерных движения;
- поставить room fragment и chest;
- записать hashes, размеры, лицензии и production paths в manifest;
- выполнить non-device glTF/model/texture/build и side-by-side review.

До аппаратной проверки результат может быть только provisional. Sprint 8
остаётся заблокирован art slice и S7-003, а не отсутствием устройства.
