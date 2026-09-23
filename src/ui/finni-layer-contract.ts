import type { PetPatternId, PetShapeId } from '../domain/pet-profile.ts';

/** S8-001 presentation contract. Coordinates refer to the S7-004 master canvas. */
export const FINNI_CANVAS = Object.freeze({ width: 941, height: 1672 });

export const FINNI_LAYER_ORDER = Object.freeze([
  'room-base',
  'pet-back',
  'pet-body',
  'pet-pattern',
  'pet-ear-shape',
  'pet-face',
  'pet-expression',
  'pet-accessory',
  'room-foreground',
] as const);

export type FinniLayerId = (typeof FINNI_LAYER_ORDER)[number];
export type FinniExpression = 'neutral' | 'blink' | 'happy' | 'thoughtful' | 'inspired';
export type FinniStage = 1 | 2 | 3;

export const FINNI_ANCHORS = Object.freeze({
  feet: Object.freeze({ x: 470, y: 1272 }),
  face: Object.freeze({ x: 469, y: 919 }),
  leftEar: Object.freeze({ x: 365, y: 805 }),
  rightEar: Object.freeze({ x: 559, y: 820 }),
  collar: Object.freeze({ x: 466, y: 1022 }),
  attachment: Object.freeze({ x: 470, y: 1014 }),
});

/** Stage changes presentation size about the same floor contact point. */
export const FINNI_STAGE_SCALE = Object.freeze({ 1: 0.86, 2: 1, 3: 1.12 });

export type FinniPresentation = Readonly<{
  stage: FinniStage;
  shapeId: PetShapeId;
  patternId: PetPatternId;
  expression: FinniExpression;
}>;

export function stageTransform(stage: FinniStage): Readonly<{
  scale: number;
  translateY: number;
}> {
  const scale = FINNI_STAGE_SCALE[stage];
  // RN scales around the canvas centre. Offset restores the fixed feet anchor.
  return Object.freeze({
    scale,
    translateY: (FINNI_ANCHORS.feet.y - FINNI_CANVAS.height / 2) * (1 - scale),
  });
}
