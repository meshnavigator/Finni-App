import type { FinniClipId } from './finni-animation-set.ts';

/** Canvas-space choreography. All recipes start and finish at the same anchors. */
export const MOTION_KEYS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] as const;
export type BodyPose = Readonly<{ head: number; headY: number; tail: number; gesture: number; prop: number; propX: number; propY: number }>;
const STILL: BodyPose = { head: 0, headY: 0, tail: 0, gesture: 0, prop: 0, propX: 0, propY: 0 };
const pulse = (p: number) => Math.sin(Math.PI * p) ** 2;

/** No clock, randomness, React or persisted state: preview and native share this. */
export function finniBodyPose(clip: FinniClipId | null, progress: number, direction = 1): BodyPose {
  const p = Math.max(0, Math.min(1, progress));
  if (!clip || p === 0 || p === 1) return STILL;
  const envelope = pulse(p);
  const wag = Math.sin(p * Math.PI * 4) * envelope;
  const prop = Math.min(1, p / 0.15, (1 - p) / 0.15);
  switch (clip) {
    case 'AN-003': return { ...STILL, head: 1.4 * envelope, tail: 5 * wag };
    case 'AN-004': return { ...STILL, headY: 12 * prop, gesture: prop };
    case 'AN-005': return { ...STILL, head: 3 * envelope };
    case 'AN-006': return { ...STILL, head: -3.5 * envelope };
    case 'AN-007': return { ...STILL, head: -1.2 * envelope, tail: 7 * wag };
    case 'AN-008': return { ...STILL, headY: 12 * prop, gesture: prop, tail: 4 * wag };
    case 'AN-009': return { ...STILL, head: -6 * envelope, headY: 170 * envelope, tail: 2 * wag, prop };
    case 'AN-010': return { ...STILL, head: 2 * envelope, tail: 3 * wag, prop, propX: 8 * wag, propY: 32 * wag };
    case 'AN-011': return { ...STILL, head: 1.5 * envelope, prop };
    case 'AN-012': return { ...STILL, tail: 2 * wag, prop, propX: direction * (p - 0.5) * 180, propY: -35 * envelope };
    case 'AN-013': return { ...STILL, head: -2 * envelope, tail: 5 * wag, prop, propY: 20 * (1 - p) };
    case 'AN-014': return { ...STILL, head: -2 * envelope, tail: 3 * wag };
    default: return STILL;
  }
}

/** Deterministic irregular blink gaps; no per-frame JS timer. */
export const BLINK_GAPS_MS = [3700, 5100, 4300, 6200, 3900] as const;
export const INTEREST_GAPS_MS = [17000, 23000, 14000, 19000] as const;
