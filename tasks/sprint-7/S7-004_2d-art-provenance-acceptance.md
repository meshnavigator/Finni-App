# S7-004: Принять layered 2D art master и provenance

## Статус

**DONE, 2026-09-21.** Editable `FINNI-2D-MASTER-V1`, clean-room Home slice,
exact hashes и provenance зарегистрированы. Скоробагатько Константин
Владимирович, руководитель разработки, принял visual identity и разрешил
использование exact package в конкурсном и публичном APK. RuStore во время
конкурса не входит в разрешённый scope; historical POC/3D evidence сохранены.

## Цель

Зафиксировать узнаваемый layered 2D master Финни и минимальный Home art slice,
которые сохраняют `REF-001`, имеют проверяемое происхождение и допускаются к
production use отдельными art и product/legal решениями.

## Контекст

R1–R4 не получили art/identity PASS. 2D POC визуально ближе к `REF-001`, но
создан генеративным workflow с неполной backend metadata. Он не становится
production asset только из-за принятия направления DEC-2026-09-19-006.

## Состав работ

- провести side-by-side review `finni_ref001_cutout_v1.png` и blink-варианта с
  исходным `REF-001` на одинаковом масштабе;
- определить master layers, края/альфа-канал, neutral/blink poses и clean room
  fragment без выдуманных финансовых данных;
- назначить art owner и product/legal owner, записать отдельные вердикты;
- дополнить provenance: сервис/модель и доступная версия, дата, референсы,
  условия использования, разрешённое competition/public APK use, ручная
  доработка и ограничения;
- создать неизменяемые production IDs, paths, dimensions и SHA-256, не
  перезаписывая POC, R1–R4 или 3D addendum;
- описать правила получения 3 стадий и девяти сочетаний без изменения
  `shapeId`/`patternId`.

## Источники

- DEC-2026-09-19-006; `Finni_S7-002_2D_POC/README.md`, `VERIFY.md`,
  `PROVENANCE.md` и `SHA256SUMS.txt`;
- `Finni_3D_Addendum_v1.0/reference/finni-home-approved.png` (`REF-001`);
- SRS v1.3 §§2.2, 8, 11–12, 22.8; ответы S05-15;
- historical evidence S7-002 R1–R4.

## Критерии приёмки

- art owner письменно принимает identity/silhouette/eyes/color/character либо
  фиксирует точные исправления;
- product/legal owner принимает конкретные hashes и допустимый release scope;
- editable layered source, exports, IDs, dimensions, alpha rules и hashes
  зарегистрированы;
- master предусматривает стадии 1–3 и все 3×3 варианты без новых domain IDs;
- POC и historical 3D assets остаются неизменными evidence packages.

## Зависимости

- Accepted DEC-2026-09-19-006;
- доступность оригинального `REF-001` и владельцев art/product/legal review.

## Verify

- side-by-side acceptance sheet и независимые art/legal verdicts;
- image dimensions, alpha bounds, file decode и SHA-256 checks;
- provenance/terms/link/date review и inventory production paths;
- проверка отсутствия фиктивных catalog IDs и финансовых строк.

## Out of scope

- интеграция в приложение и выбор 2D runtime technology;
- Android runtime/performance и signed release;
- производство всех 27 exports, полного room/catalog и animation set.
