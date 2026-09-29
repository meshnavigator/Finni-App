import type { FinniExpression, FinniPresentation } from './finni-layer-contract.ts';

/** Presentation-only choreography. Callers pass already committed results. */
export type FinniClipId =
  | 'AN-001' | 'AN-002' | 'AN-003' | 'AN-004' | 'AN-005' | 'AN-006'
  | 'AN-007' | 'AN-008' | 'AN-009' | 'AN-010' | 'AN-011' | 'AN-012'
  | 'AN-013' | 'AN-014';

export type FinniAnimationSettings = Readonly<{
  motionEnabled: boolean;
  soundEnabled: boolean;
  systemReduceMotion: boolean;
}>;

export type FinniClip = Readonly<{
  id: FinniClipId;
  kind: 'ambient' | 'optional' | 'result' | 'milestone';
  priority: number;
  durationMs: number;
  staticExpression: FinniExpression;
  skippable: boolean;
  /** A recipe consumes full-canvas layers from FINNI-S8-001, never moves feet. */
  recipe: 'breath' | 'blink-swap' | 'ears-tail' | 'wave' | 'head-tilt'
    | 'expression-tail' | 'expression-gesture' | 'bowl' | 'brush'
    | 'planner' | 'symbolic-coins' | 'goal-reveal' | 'stage-swap';
}>;

export const FINNI_ANIMATION_SET: Readonly<Record<FinniClipId, FinniClip>> = Object.freeze({
  'AN-001': { id: 'AN-001', kind: 'ambient', priority: 10, durationMs: 5400, staticExpression: 'neutral', skippable: false, recipe: 'breath' },
  'AN-002': { id: 'AN-002', kind: 'ambient', priority: 10, durationMs: 180, staticExpression: 'neutral', skippable: false, recipe: 'blink-swap' },
  'AN-003': { id: 'AN-003', kind: 'ambient', priority: 10, durationMs: 1500, staticExpression: 'neutral', skippable: false, recipe: 'ears-tail' },
  'AN-004': { id: 'AN-004', kind: 'optional', priority: 20, durationMs: 1100, staticExpression: 'neutral', skippable: false, recipe: 'wave' },
  'AN-005': { id: 'AN-005', kind: 'optional', priority: 30, durationMs: 750, staticExpression: 'neutral', skippable: false, recipe: 'head-tilt' },
  'AN-006': { id: 'AN-006', kind: 'result', priority: 80, durationMs: 900, staticExpression: 'thoughtful', skippable: false, recipe: 'head-tilt' },
  'AN-007': { id: 'AN-007', kind: 'result', priority: 80, durationMs: 1100, staticExpression: 'happy', skippable: false, recipe: 'expression-tail' },
  'AN-008': { id: 'AN-008', kind: 'result', priority: 80, durationMs: 1400, staticExpression: 'inspired', skippable: false, recipe: 'expression-gesture' },
  'AN-009': { id: 'AN-009', kind: 'result', priority: 80, durationMs: 2000, staticExpression: 'happy', skippable: false, recipe: 'bowl' },
  'AN-010': { id: 'AN-010', kind: 'result', priority: 80, durationMs: 1600, staticExpression: 'happy', skippable: false, recipe: 'brush' },
  'AN-011': { id: 'AN-011', kind: 'result', priority: 80, durationMs: 500, staticExpression: 'neutral', skippable: false, recipe: 'planner' },
  'AN-012': { id: 'AN-012', kind: 'result', priority: 80, durationMs: 800, staticExpression: 'neutral', skippable: false, recipe: 'symbolic-coins' },
  'AN-013': { id: 'AN-013', kind: 'milestone', priority: 70, durationMs: 3000, staticExpression: 'inspired', skippable: true, recipe: 'goal-reveal' },
  'AN-014': { id: 'AN-014', kind: 'milestone', priority: 70, durationMs: 2200, staticExpression: 'inspired', skippable: true, recipe: 'stage-swap' },
});

export type FinniAnimationState = Readonly<{
  active: FinniClipId | null;
  queuedOptional: FinniClipId | null;
  presentation: FinniPresentation;
  settings: FinniAnimationSettings;
  visible: boolean;
  modalOpen: boolean;
  generation: number;
}>;

export type FinniAnimationEvent =
  | Readonly<{ type: 'play'; clip: FinniClipId; presentation: FinniPresentation }>
  | Readonly<{ type: 'finish'; clip: FinniClipId; generation: number }>
  | Readonly<{ type: 'skip'; clip: 'AN-013' | 'AN-014'; generation: number }>
  | Readonly<{ type: 'cancel' | 'leave' | 'profile-change' }>
  | Readonly<{ type: 'modal'; open: boolean }>
  | Readonly<{ type: 'visibility'; visible: boolean }>
  | Readonly<{ type: 'settings'; settings: FinniAnimationSettings }>
  | Readonly<{ type: 'presentation'; presentation: FinniPresentation }>;

export function initialFinniAnimationState(
  presentation: FinniPresentation,
  settings: FinniAnimationSettings,
): FinniAnimationState {
  return { active: null, queuedOptional: null, presentation, settings, visible: true, modalOpen: false, generation: 0 };
}

/** Sequence numbers invalidate stale timers after replacement, skip and unmount. */
export function reduceFinniAnimation(
  state: FinniAnimationState,
  event: FinniAnimationEvent,
): FinniAnimationState {
  switch (event.type) {
    case 'presentation':
      return { ...state, presentation: event.presentation };
    case 'settings':
      if (motionAllowed(event.settings, state)) return { ...state, settings: event.settings };
      return { ...state, settings: event.settings, active: null, queuedOptional: null, generation: state.generation + 1 };
    case 'visibility':
      if (event.visible) return { ...state, visible: true };
      return { ...state, visible: false, active: null, queuedOptional: null, generation: state.generation + 1 };
    case 'modal':
      return { ...state, modalOpen: event.open, active: event.open ? null : state.active,
        queuedOptional: event.open ? null : state.queuedOptional, generation: state.generation + 1 };
    case 'cancel':
    case 'leave':
    case 'profile-change':
      return { ...state, active: null, queuedOptional: null, generation: state.generation + 1 };
    case 'play': {
      // A committed stage/goal is visible immediately, even when playback is blocked.
      const next = { ...state, presentation: event.presentation };
      const clip = FINNI_ANIMATION_SET[event.clip];
      if (!motionAllowed(state.settings, state) || state.modalOpen) return next;
      if (clip.kind === 'ambient' && (event.clip !== 'AN-003' || state.active || state.presentation.expression !== 'neutral')) return next;
      if (state.active === event.clip && clip.kind === 'optional') return { ...next, queuedOptional: event.clip };
      if (state.active && FINNI_ANIMATION_SET[state.active].priority > clip.priority) {
        return next;
      }
      if (state.active && FINNI_ANIMATION_SET[state.active].priority === clip.priority && clip.kind === 'optional') {
        return { ...next, queuedOptional: event.clip };
      }
      return { ...next, active: event.clip, queuedOptional: null, generation: state.generation + 1 };
    }
    case 'finish':
    case 'skip': {
      if (event.generation !== state.generation || state.active !== event.clip) return state;
      if (event.type === 'skip' && !FINNI_ANIMATION_SET[event.clip].skippable) return state;
      const queued = state.queuedOptional;
      return { ...state, active: queued, queuedOptional: null, generation: state.generation + 1 };
    }
  }
}

function motionAllowed(settings: FinniAnimationSettings, state: Pick<FinniAnimationState, 'visible'>): boolean {
  return settings.motionEnabled && !settings.systemReduceMotion && state.visible;
}

/** AN-015 compatibility: no face swap over a result; blink only over neutral idle. */
export function finniAnimationFrame(state: FinniAnimationState): Readonly<{
  clip: FinniClipId | null;
  expression: FinniExpression;
  idle: boolean;
  blink: boolean;
  interest: boolean;
  soundEnabled: boolean;
  canSkip: boolean;
}> {
  const moving = motionAllowed(state.settings, state) && !state.modalOpen;
  const active = moving ? state.active : null;
  const expression = active ? FINNI_ANIMATION_SET[active].staticExpression : state.presentation.expression;
  const neutralIdle = moving && active === null && expression === 'neutral';
  return {
    clip: active,
    expression,
    idle: neutralIdle,
    blink: neutralIdle,
    interest: neutralIdle,
    soundEnabled: state.settings.soundEnabled,
    canSkip: active !== null && FINNI_ANIMATION_SET[active].skippable,
  };
}

/** One terminal notification per presentation, including effect cleanup races. */
export function createFinniReactionCompletion(id: number | null) {
  let settled = false;
  return (callback: (id: number) => void): boolean => {
    if (id === null || settled) return false;
    settled = true;
    callback(id);
    return true;
  };
}
