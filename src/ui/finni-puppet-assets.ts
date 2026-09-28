// Literal asset registry; regenerate with node scripts/build-puppet-registry.mjs.
import type { ImageSourcePropType } from 'react-native';
import type { FinniAppearanceId } from './finni-appearance-policy.ts';
import type { FinniExpression } from './finni-layer-contract.ts';
export const FINNI_PUPPET_ASSETS: Readonly<Record<FinniAppearanceId, Readonly<{ back: ImageSourcePropType; body: ImageSourcePropType; heads: Readonly<Record<FinniExpression, ImageSourcePropType>> }>>> = {
  'pointy/plain': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-plain/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-plain/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-plain/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-plain/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-plain/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-plain/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-plain/inspired-head.png'),
    },
  },
  'pointy/spots': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-spots/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-spots/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-spots/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-spots/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-spots/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-spots/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-spots/inspired-head.png'),
    },
  },
  'pointy/stripes': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-stripes/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-stripes/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-stripes/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-stripes/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-stripes/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-stripes/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/pointy-stripes/inspired-head.png'),
    },
  },
  'round/plain': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-plain/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-plain/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-plain/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-plain/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-plain/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-plain/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-plain/inspired-head.png'),
    },
  },
  'round/spots': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-spots/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-spots/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-spots/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-spots/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-spots/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-spots/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-spots/inspired-head.png'),
    },
  },
  'round/stripes': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-stripes/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-stripes/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-stripes/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-stripes/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-stripes/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-stripes/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/round-stripes/inspired-head.png'),
    },
  },
  'floppy/plain': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-plain/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-plain/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-plain/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-plain/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-plain/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-plain/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-plain/inspired-head.png'),
    },
  },
  'floppy/spots': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-spots/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-spots/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-spots/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-spots/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-spots/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-spots/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-spots/inspired-head.png'),
    },
  },
  'floppy/stripes': {
    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-stripes/export/neutral/pet-back.png'),
    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-stripes/neutral-body.png'),
    heads: {
      neutral: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-stripes/neutral-head.png'),
      blink: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-stripes/blink-head.png'),
      happy: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-stripes/happy-head.png'),
      thoughtful: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-stripes/thoughtful-head.png'),
      inspired: require('../../assets/2d/poses/FINNI-PUPPET-V1/floppy-stripes/inspired-head.png'),
    },
  },
};
export const FINNI_GESTURE_ASSETS = {
  plain: require('../../assets/2d/poses/FINNI-GESTURE-V1/plain-body.png'),
  spots: require('../../assets/2d/poses/FINNI-GESTURE-V1/spots-body.png'),
  stripes: require('../../assets/2d/poses/FINNI-GESTURE-V1/stripes-body.png'),
};
