# FINNI-S8-003 animation contract v1

Status: engineering sequence contract. Visual and device acceptance remain open.

## Source and layer binding

`src/ui/finni-animation-set.ts` is the versioned registry and transition reducer.
It consumes `FINNI-S8-001-LAYER-CONTRACT.md` and its full-canvas layer IDs,
expressions, fixed feet anchor and stage scale. Existing accepted
`FINNI-2D-MASTER-V1` neutral/blink PNGs remain the only production pet image
sources known to this branch; this contract creates no replacement artwork.
Recipes requiring ears, tail, arms, object overlays or additional expressions
remain awaiting matching S8-001/S8-002 exports and visual QA. They must not be
represented by a whole-pet bounce or by reusing neutral art as a purported
finished clip.

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
Goal and stage clips expose skip. Skipping ends only presentation playback.

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

The S8-001/S8-002 production layer/object exports, expression coverage, asset
manifest paths/hashes/licenses, UI hookup, frame-by-frame video review on the
target Android device and QA-002/QA-016 visual checks remain open. Unit tests
cover transition rules, interruption, skip, cancel and rapid taps only.
