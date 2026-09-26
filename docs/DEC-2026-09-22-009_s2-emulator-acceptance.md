# DEC-2026-09-22-009 — Emulator acceptance для Sprint 2 и перенос physical-device gate

- Status: Accepted
- Date: 2026-09-22
- Scope: S2-006, граница emulator/device evidence и финальная аппаратная приёмка
- Related tasks: S2-001–S2-006, S0-006, S10-001, S10-002

## Контекст

S2-001–S2-005 реализованы и проходят автоматизированную file-backed регрессию,
но их Android runtime-проверка была вынесена в S2-006. Пользователь явно решил
закрыть Sprint 2 сейчас на Android-эмуляторе, а проверку на физическом устройстве
провести в последнем аппаратном спринте.

## Решение

- S2-006 может быть закрыта по воспроизводимому AVD evidence: install/run без
  Metro, пользовательские финансовые маршруты, restart/force-stop, recovery,
  upgrade с сохранением данных, 360 dp/48 dp и emulator timing observations.
- Process-kill и storage pressure на AVD проверяют application recovery, но не
  заменяют поведение конкретного физического накопителя, low-memory killer,
  нагрев, battery и OEM lifecycle.
- Software-emulated frame/latency numbers не являются physical performance PASS.
- Физическое устройство, TalkBack/system-bars на целевом устройстве, thermal/
  memory/performance budgets и финальная release acceptance остаются в
  S10-001/S10-002; S0-006 сохраняется как исторический carry-over до их закрытия.
- Отчёты обязаны отдельно маркировать `EMULATOR PASS` и `DEVICE NOT RUN`.

## Последствия

Sprint 2 не блокируется отсутствием подключённого устройства после успешного
S2-006 emulator-run. При этом обязательная аппаратная приёмка не отменяется и
не считается пройденной досрочно.

## Verify

- пользователь подтвердил решение 2026-09-22;
- emulator evidence и точные команды фиксируются в отчёте S2-006;
- physical-device evidence будет получено только в Sprint 10.
