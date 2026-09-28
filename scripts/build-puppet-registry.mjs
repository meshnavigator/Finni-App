import { writeFile } from 'node:fs/promises';

// Literal Metro requires of existing, owner-accepted full-canvas exports.
const rows = [];
for (const shape of ['pointy', 'round', 'floppy']) {
  for (const pattern of ['plain', 'spots', 'stripes']) {
    const id = `${shape}-${pattern}`;
    rows.push(`  '${shape}/${pattern}': {\n    back: require('../../assets/2d/variants/FINNI-MATRIX-V1/${id}/export/neutral/pet-back.png'),\n    body: require('../../assets/2d/poses/FINNI-PUPPET-V1/${id}/neutral-body.png'),\n    heads: {\n${['neutral','blink','happy','thoughtful','inspired'].map(e => `      ${e}: require('../../assets/2d/poses/FINNI-PUPPET-V1/${id}/${e}-head.png'),`).join('\n')}\n    },\n  },`);
  }
}
await writeFile(new URL('../src/ui/finni-puppet-assets.ts', import.meta.url), `// Literal asset registry; regenerate with node scripts/build-puppet-registry.mjs.\nimport type { ImageSourcePropType } from 'react-native';\nimport type { FinniAppearanceId } from './finni-appearance-policy.ts';\nimport type { FinniExpression } from './finni-layer-contract.ts';\nexport const FINNI_PUPPET_ASSETS: Readonly<Record<FinniAppearanceId, Readonly<{ back: ImageSourcePropType; body: ImageSourcePropType; heads: Readonly<Record<FinniExpression, ImageSourcePropType>> }>>> = {\n${rows.join('\n')}\n};\nexport const FINNI_GESTURE_ASSETS = {\n${['plain','spots','stripes'].map(p => `  ${p}: require('../../assets/2d/poses/FINNI-GESTURE-V1/${p}-body.png'),`).join('\n')}\n};\n`);
