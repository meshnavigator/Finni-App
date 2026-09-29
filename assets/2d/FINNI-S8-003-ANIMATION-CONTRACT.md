# FINNI-S8-003 animation contract v2

Status: body choreography and new gesture art accepted by the owner, 2026-09-28.
Engineering regression is recorded in the final native report; physical-device/performance gates remain open.

## Source and layer binding

`src/ui/finni-animation-set.ts` is the versioned registry and transition reducer.
It consumes `FINNI-S8-001-LAYER-CONTRACT.md` and its full-canvas layer IDs,
expressions, fixed feet anchor and stage scale. `FinniPuppet` uses native
Image/Animated and deterministic group exports from accepted FINNI-MATRIX-V1
and FINNI-EXPRESSIONS-V1. `export-puppet-groups.py` preserves selected source
RGBA pixels and records SHA256 lineage. Head, torso and tail transform separately;
breathing does not inflate the head or move feet. No renderer dependency is added.

`FINNI-GESTURE-V1` supplies three new generated lower-body wave poses; accepted
heads/ears/expressions stay above them. The owner accepted these poses and the demonstrated animation art on
2026-09-28; owner-acceptance.json binds that approval to exact source/export hashes. Original generated masters and alpha exports are both retained. The
discarded five-legged draft is never registered. All nine appearances and stage
scales share the same anchor recipe. Full-size assets decode before playback;
blink heads are preloaded. Head/neck overlap avoids detached parts and sampling
seams between independently resized partition masks.

## Sequences and timing guidelines

| ID | Recipe | Guideline | Static result |
| --- | --- | ---: | --- |
| AN-001 | subtle body breath about fixed feet | 5400 ms loop | neutral |
| AN-002 | blink image swap | 180 ms | neutral/open eyes |
| AN-003 | ears/tail interest | 1500 ms, 12–25 s apart | neutral |
| AN-004 | wave greeting | 1100 ms | neutral |
| AN-005 | head tilt touch | 750 ms | neutral |
| AN-006 | thoughtful head tilt | 900 ms | thoughtful |
| AN-007 | smile and tail | 1100 ms | happy |
| AN-008 | inspired gesture | 1400 ms | inspired |
| AN-009 | bowl interaction | 2000 ms | happy plus committed purchase |
| AN-010 | brush interaction | 1600 ms | happy plus committed purchase |
| AN-011 | planner mark | 500 ms | neutral plus final plan |
| AN-012 | 3–5 symbolic coins | 800 ms | neutral plus exact UI value |
| AN-013 | goal item reveal | 3000 ms | happy plus claimed item |
| AN-014 | stage image swap | 2200 ms | inspired plus final stage |

`finni-body-motion.ts` owns canvas-space keyframes, executed by Animated on the
native driver with linear time. Blink gaps vary between 3.7 and 6.2 seconds;
interest gaps between 14 and 23 seconds. Greeting occurs once per JS session;
pet touch uses the bounded optional queue. Bowl contact bows the head; a brush
moves over fur; planner receives a check; three symbolic coins reverse direction
for withdrawal; goal reveals its item; stage interpolates about fixed feet.
The large-text portrait uses the accepted static expression, preserving face
visibility instead of moving it outside the crop.

All timings are creative guidelines, not measured device performance. The
controller never computes purchases, awards, balances or stage. Callers supply
the authoritative committed `FinniPresentation` on every `play`; final values
and explanations are rendered by the owning screen independently of playback.

## AN-015 transitions

Priority: critical modal pauses playback; operation result (80) takes precedence
over milestone (70), touch (30), greeting (20), ambient (10). Results replace
decorative reactions. Ambient interest and blinking run only during neutral idle.
Blink never overlaps another facial expression. A repeated optional reaction may
hold one replacement in the queue; a result drops that queue. Finish callbacks
carry a generation number, so a cancelled or skipped clip cannot complete a
newer clip. Screen leave, profile change, modal open and backgrounding cancel
the effect and queue. After return, the view uses current committed state.
Goal and stage clips expose skip. Skipping ends only presentation playback. A per-presentation completion latch
allows exactly one finish/skip/cancel callback, including effect cleanup.

## AN-016 settings

`motionEnabled`, `soundEnabled` and `systemReduceMotion` are independent inputs.
Motion is allowed only if enabled by the app and system and the scene is visible.
When blocked, no idle, blink, interest or active effect runs; the current
presentation's static expression and final values remain. Sound off does not
cancel motion. The app preferences persist independently in the existing
`finni-control.db` via `SqliteAppControlStorage.readPresentationPreferences`,
`setMotionEnabled` and `setSoundEnabled`. System reduce-motion remains a runtime
input. The animation module has no domain or persistence imports. No sound file
is registered until source, license and playback QA exist.

## Remaining gates

Evidence and exact scope: `artifacts/sprint-8/S8-003-body-runtime/README.md`.
Native API26 emulator captures do not replace physical-device video/performance,
TalkBack speech or Sprint10 external gates. Owner art acceptance is recorded
separately and does not assert runtime correctness. The historical Metro TypeError did not reproduce in clean sessions; its old
stack is unavailable. Final transition/lifecycle evidence and exact limitations
are recorded in artifacts/sprint-8/S8-003-body-runtime/regression/README.md. No sound
asset or sound playback was added. Sound preference remains independent.
