/** Contract for the deliberately isolated S7-001 renderer diagnostic. */
export type LocalGlbDiagnosticAsset = Readonly<{
  id: string;
  /** Native bundled-asset path understood by react-native-filament. */
  bundleUri: string;
  license: Readonly<{ source: string; terms: string; reviewedAt: string }>;
  /** Zero-based glTF skeletal animation index, if the asset contains one. */
  skeletalClipIndex?: number;
}>;

export const DIAGNOSTIC_GLB_DIRECTORY = 'assets/3d/diagnostic/';

export const diagnosticAssetProblem = (asset: LocalGlbDiagnosticAsset | undefined): string | null => {
  if (asset == null) return 'Локальный GLB ещё не зарегистрирован для diagnostic runtime.';
  if (!asset.bundleUri.startsWith(DIAGNOSTIC_GLB_DIRECTORY)) {
    return `GLB должен быть bundled asset внутри ${DIAGNOSTIC_GLB_DIRECTORY}`;
  }
  if (/^(https?:|file:)/i.test(asset.bundleUri)) return 'Diagnostic runtime не принимает удалённый URL или внешний file URI.';
  if (!asset.bundleUri.endsWith('.glb')) return 'Diagnostic asset должен иметь расширение .glb.';
  if (!asset.license.source || !asset.license.terms || !asset.license.reviewedAt) {
    return 'Для GLB обязательны source, terms и дата проверки лицензии.';
  }
  if (asset.skeletalClipIndex != null && (!Number.isInteger(asset.skeletalClipIndex) || asset.skeletalClipIndex < 0)) {
    return 'Индекс skeletal clip должен быть неотрицательным целым числом.';
  }
  return null;
};

export const isDiagnosticAssetReady = (asset: LocalGlbDiagnosticAsset | undefined): asset is LocalGlbDiagnosticAsset =>
  diagnosticAssetProblem(asset) == null;
