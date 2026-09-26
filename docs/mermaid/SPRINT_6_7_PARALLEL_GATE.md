# Sprint 6–7 — переход на layered 2D gate

Схема фиксирует завершённые S7-004–S7-006 и Accepted
DEC-2026-09-19-006/007. Старый 3D gate сохранён в истории, но удалён из
runtime. Physical-device evidence остаётся в S0-006/S10.

```mermaid
flowchart LR
    Ref[REF-001<br/>обязательный visual reference] --> Art[S7-004 PASS<br/>layered art + provenance]
    POC[2D POC<br/>historical feasibility] --> Runtime[S7-005 PASS<br/>core runtime + signed spike]
    Art --> Gate{DEC-007<br/>Accepted}
    Runtime --> Gate
    Gate -->|да| Retire[S7-006 PASS<br/>3D removed + signed release]
    Retire --> S8[Sprint 8<br/>production 2D assets]
    S8 --> S9[Sprint 9<br/>HomeScene + HUD]
    Device[S0-006 / S10<br/>device evidence deferred] -. late gate .-> Acceptance[final acceptance]
    S9 --> Acceptance
```

Layered 2D presentation остаётся отдельным эффектом после persisted result:
анимация не вычисляет деньги, рост или lifecycle state. React Native HUD
остаётся источником точных данных и интеракций. POC не является принятием
production art/runtime; переход к S8 теперь открыт выполненными S7 gates.
