import type { ImageSourcePropType } from 'react-native';
import type { FinniAppearanceId } from './finni-appearance-policy.ts';

type ExpressionAssets = Readonly<Record<'happy' | 'thoughtful' | 'inspired', ImageSourcePropType>>;

/** S8-001 expression package. Accepted neutral/blink assets remain separate. */
export const FINNI_EXPRESSION_ASSETS: Readonly<Record<FinniAppearanceId, ExpressionAssets>> = {
  'pointy/plain': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-plain/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-plain/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-plain/inspired.png'),
  },
  'pointy/spots': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-spots/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-spots/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-spots/inspired.png'),
  },
  'pointy/stripes': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-stripes/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-stripes/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/pointy-stripes/inspired.png'),
  },
  'round/plain': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-plain/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-plain/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-plain/inspired.png'),
  },
  'round/spots': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-spots/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-spots/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-spots/inspired.png'),
  },
  'round/stripes': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-stripes/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-stripes/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/round-stripes/inspired.png'),
  },
  'floppy/plain': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-plain/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-plain/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-plain/inspired.png'),
  },
  'floppy/spots': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-spots/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-spots/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-spots/inspired.png'),
  },
  'floppy/stripes': {
    happy: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-stripes/happy.png'),
    thoughtful: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-stripes/thoughtful.png'),
    inspired: require('../../assets/2d/variants/FINNI-EXPRESSIONS-V1/floppy-stripes/inspired.png'),
  },
};
