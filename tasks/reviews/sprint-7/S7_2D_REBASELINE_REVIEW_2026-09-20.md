# Sprint 7–10 2D cutout/2.5D rebaseline review

## Summary

Owner acceptance of layered 2D cutout/2.5D is recorded by
`docs/DEC-2026-09-19-006_2d-cutout-target.md`. Completed/partial Sprint 6 and
S7-001 history remains unchanged. The new delivery path is S7-004 art and
provenance acceptance, S7-005 runtime/release spike, future Accepted
DEC-2026-09-19-007, then S7-006 controlled 3D-stack retirement.

## Evidence and classification

| Area | Classification | Evidence | Action |
|---|---|---|---|
| Visual-medium decision | Compliant | Explicit owner acceptance; DEC-006 | Treat 2D cutout/2.5D as target, without granting POC production PASS |
| Sprint 6 history | Compliant | S6-001/S6-002 partial reports | Preserve history and renderer-neutral HUD/catalog constraints |
| S7-001 3D spike | Compliant historical evidence | `done/S7-001_partial.md` | Do not reopen; remove runtime stack only through S7-006 |
| S7-002 | Documentation drift | Task still describes 3D PASS gate | Close partial/superseded and retain R1–R4 plus 2D POC comparative evidence |
| S7-003 | Planned supersession | Worklets/Babel blocker is specific to current 3D stack | Preserve blocker evidence; final cancellation waits for S7-006 signed release |
| S7-004–006 | Current planned scope | New task files | Execute in dependency order |
| Sprint 8 | Documentation drift | Tasks still require 3D rig/models/clips | Rewrite to layered masters, 2D room/catalog and transform/image-swap/sprite contracts |
| Sprint 9 | Documentation drift | S9-001 is 3D-specific; S9-002 is renderer-neutral in substance | Replace HomeScene renderer boundary; keep persisted-result invariants |
| Sprint 10 | Documentation drift | Performance task measures 3D resources | Measure PNG decode/cache/memory/lifecycle and 2D fallback; retain device/accessibility/full-flow gates |
| Production code | Compliant with isolation claim | Belief map: `AppRoot`; isolated `HomeSceneSpike` boundary and two dependents | S7-005 adds opt-in 2D diagnostic; S7-006 removes 3D imports/dependencies after PASS |

## Current code boundary

- production shell: `Finni App/App.tsx` → `src/ui/AppRoot.tsx` →
  `application/ui-model.ts` / `application/app-runtime.ts` → domain/persistence;
- opt-in 3D diagnostic: `src/ui/HomeSceneSpike.tsx` →
  `src/ui/home-scene-spike-contract.ts`;
- direct dependents: `HomeSceneSpikeFinniCandidate.tsx` and
  `HomeSceneSpikeFoxDiagnostic.tsx`;
- Filament/Worklets remain installed and are not removed by this planning change.

## Dependency order

1. DEC-006 Accepted.
2. S7-004 and S7-005 may run in parallel with diagnostic-only art labeling.
3. Accept or reject DEC-007 from S7-005 evidence.
4. S7-006 after S7-004 PASS, S7-005 PASS and DEC-007 Accepted.
5. Layered-2D Sprint 8 production tasks.
6. S9-001 integration, then S9-002; S9-003/004 retain Sprint 2–3 dependencies.
7. S10-001 device/performance regression, then S10-002 independent acceptance.

## Unverified areas

- art owner and product/legal owner have not accepted the generated derivative;
- exact service/backend metadata and competition/public APK permission remain
  incomplete in the POC provenance;
- no 2D asset is integrated into `Finni App`;
- no clean signed release, API 26 run, decode/cache/memory/frame measurement or
  device accessibility evidence exists for the 2D path;
- stages, all 27 appearance combinations, room/catalog production assets and
  full animation set are future Sprint 8 scope;
- canonical registry files still require synchronization with the additive
  DEC/task records if filesystem patching is unavailable.

## Verdict

**REBASELINE ACCEPTED; IMPLEMENTATION NOT STARTED.** The direction is approved
and independently scoped, while art, legal, runtime, release and device gates
remain open. No code or dependency was changed by this review.
