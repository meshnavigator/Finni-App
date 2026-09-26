# S8-001 — выбор внешности в runtime

2026-09-25. Все9 combinations подключены; API26 debug UI sweep PASS. Pointy×3 и все окрасы приняты; round/floppy ear-fit-v2 ожидают художественной оценки владельца.

```mermaid
flowchart TD
  P[Сохранённый профиль shapeId / patternId] --> R{Appearance policy}
  R -->|Каждая из 9 валидных комбинаций| S[FINNI-MATRIX-V1: собственные neutral / blink / preview]
  R -->|Неизвестные или повреждённые IDs| F[pointy/plain fallback]
  S --> H[Home: stage transform и preloaded neutral / blink]
  F --> H
  H --> D[onLoad gate и переключение opacity]
  S --> V[Растровый PetAvatar preview]
```

Persistence, экономика, domain IDs и transitions стадий не изменены. Контракт canvas941×1672, feet470/1272, stages .86/1/1.12. Девять ORA содержат neutral/blink stacks с девятью слоями каждый. Полная S8-001 ещё включает отдельные expression states и оставшиеся gates.


2026-09-25: художественно приняты все9внешностей ear-seams-v3; прежние pending-ear подписи исторические. Topology диаграммы не меняется. Остаток expressions и этапных проверок — S8-001.
