import type { FinniPresentation } from './finni-layer-contract.ts';
export type FinniAppearance = Pick<FinniPresentation, 'shapeId' | 'patternId'>;
export type FinniAppearanceId = `${FinniAppearance['shapeId']}/${FinniAppearance['patternId']}`;

/** Every domain combination has its own rendered shape and coat. */
export function renderedFinniAppearance(appearance: FinniAppearance): FinniAppearanceId | null {
  if (!['pointy', 'round', 'floppy'].includes(appearance.shapeId)
    || !['plain', 'spots', 'stripes'].includes(appearance.patternId)) return null;
  return `${appearance.shapeId}/${appearance.patternId}`;
}

/** Unknown/corrupt appearance IDs use the stable original local fallback. */
export function homeFinniAppearance(appearance: FinniAppearance): FinniAppearanceId {
  return renderedFinniAppearance(appearance) ?? 'pointy/plain';
}
