import type { ImageSourcePropType } from 'react-native';
import type { FinniAppearanceId } from './finni-appearance-policy.ts';

type AppearanceAssets = Readonly<{ neutral: ImageSourcePropType; blink: ImageSourcePropType; preview: ImageSourcePropType }>;

export const FINNI_APPEARANCE_ASSETS: Readonly<Record<FinniAppearanceId, AppearanceAssets>> = {
  'pointy/plain': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-plain/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-plain/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-plain/preview.png'),
  },
  'pointy/spots': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-spots/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-spots/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-spots/preview.png'),
  },
  'pointy/stripes': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-stripes/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-stripes/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/pointy-stripes/preview.png'),
  },
  'round/plain': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-plain/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-plain/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-plain/preview.png'),
  },
  'round/spots': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-spots/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-spots/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-spots/preview.png'),
  },
  'round/stripes': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-stripes/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-stripes/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/round-stripes/preview.png'),
  },
  'floppy/plain': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-plain/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-plain/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-plain/preview.png'),
  },
  'floppy/spots': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-spots/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-spots/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-spots/preview.png'),
  },
  'floppy/stripes': {
    neutral: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-stripes/neutral.png'),
    blink: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-stripes/blink.png'),
    preview: require('../../assets/2d/variants/FINNI-MATRIX-V1/floppy-stripes/preview.png'),
  },
};
