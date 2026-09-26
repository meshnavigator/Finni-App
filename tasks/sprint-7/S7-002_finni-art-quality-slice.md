# S7-002: Проверить художественное качество первого образца Финни

## Статус

**PARTIAL / SUPERSEDED, 2026-09-19.** Физическое устройство по
DEC-2026-09-18-005 не блокирует non-device работу. R1 отклонена: prop `Chest`
перезаписывал joint `FinniRig` и становился target анимации `idle`. R2 —
воспроизводимый технически валидный diagnostic candidate с hash/validator и
diagnostic evidence, но не production asset и не identity/art PASS. Открыты
side-by-side с оригиналом `REF-001`, product/legal provenance decision,
Android runtime/performance и S7-003 release. R3 visual references получены
только для art direction. Audited visual-source package содержал отклонённый R1
binary и не заменяет R2 GLB; отдельная R3 Blender model candidate прошла только
technical non-device evidence, без art PASS и без интеграции в приложение.
R4 также прошла technical contract, но отклонена visual review как непохожий
clay/prototype. DEC-2026-09-19-006 заменила обязательный 3D medium на layered
2D cutout/2.5D. `Finni_S7-002_2D_POC` принят как comparative evidence, а не
production art/runtime PASS; остаток перенесён в S7-004–S7-006.

## Цель
Подтвердить на устройстве, что технический pipeline способен воспроизвести
утверждённый образ Финни и часть комнаты в допустимом графическом бюджете.

## Контекст
Серый манекен проверяет только импорт. Художественный gate требует характерные
мордочку, глаза, шерсть, уши, хвост, свет и связь питомца с комнатой.

## Состав работ
- подготовить importable slice Финни, фрагмент комнаты и сундук;
- добавить idle/blink и ещё 1–2 характерных движения;
- сопоставить размер, силуэт, глаза, цвет, материалы и свет с эталоном;
- проверить мерцание шерсти, пересечения, root sliding и контактную тень;
- измерить budgets на том же устройстве, где сделаны screenshots/video;
- принять качество либо зафиксировать конкретные art/tech blockers.

## Источники
- 3D-дополнение §§2–4, 12–14; VIS-001–007, PET-001–003, QA-001–004;
- VR-004; `reference/finni-home-approved.png`; DEC-2026-09-18-004;
- результат S7-001.

## Критерии приёмки
- рабочая сцена содержит узнаваемого полнофигурного Финни, не placeholder;
- 3–4 движения не дают мерцания, скольжения и разрывов поз;
- сравнение выполнено на одинаковом масштабе реального телефона;
- измеренный бюджет принят либо blocker документирован;
- до PASS не открывается массовое производство Sprint 8.

## Зависимости
- композиционный baseline V4.2 по DEC-2026-09-18-004;
- non-device evidence S7-001 и устранение release blocker S7-003;
- R2 candidate, R3 visual references и отдельная R3 Blender model candidate
  поставлены только для non-device review; roles назначены, но identity/
  provenance decision и art acceptance остаются обязательными;
- аппаратная приёмка выполняется позднее в S10-001/S10-002 и не блокирует
  подготовку art slice.

## Verify
- до устройства: glTF/model/texture validation, manifest/provenance и
  side-by-side review с эталоном;
- на позднем gate: screenshot/video, frame-time, память, нагрев и artifact
  inspection;
- отдельные решения art owner и technical owner.

## Закрытие 2026-09-19

Задача закрыта `partial/superseded`, не `done`: R1–R4 сохраняются historical
evidence, а 2D POC подтверждает направление, но не production acceptance.
Identity/art/provenance перенесены в S7-004, runtime/release — в S7-005,
technology decision — в DEC-2026-09-19-007, cleanup — в S7-006. Evidence:
[S7-002_partial_superseded.md](done/S7-002_partial_superseded.md).

Исторический blocker evidence:
[S7-002_ART_SLICE_BLOCKER_2026-09-18.md](../reviews/sprint-7/S7-002_ART_SLICE_BLOCKER_2026-09-18.md).

Текущий R2 evidence и открытые gates:
[S7-002_VERTICAL_SLICE_R2_REVIEW_2026-09-19.md](../reviews/sprint-7/S7-002_VERTICAL_SLICE_R2_REVIEW_2026-09-19.md).

R3 visual-reference evidence:
[S7-002_R3_VISUAL_REFERENCES_REVIEW_2026-09-19.md](../reviews/sprint-7/S7-002_R3_VISUAL_REFERENCES_REVIEW_2026-09-19.md).

R3 technical model evidence (не является art acceptance):
[S7-002_R3_MODEL_TECHNICAL_REVIEW_2026-09-19.md](../reviews/sprint-7/S7-002_R3_MODEL_TECHNICAL_REVIEW_2026-09-19.md).

## Out of scope
- все 27 сочетаний внешности;
- полный AN-001–016 и финальная комната;
- offline render как единственное доказательство.
- ретроспективное объявление любой R1–R4 production asset.
