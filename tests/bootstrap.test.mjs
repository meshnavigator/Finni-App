import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appConfig = JSON.parse(
  await readFile(new URL('../app.json', import.meta.url), 'utf8'),
).expo;
const packageManifest = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const babelConfig = await readFile(
  new URL('../babel.config.js', import.meta.url),
  'utf8',
);
const androidBuild = await readFile(
  new URL('../android/app/build.gradle', import.meta.url),
  'utf8',
);
const androidProperties = await readFile(
  new URL('../android/gradle.properties', import.meta.url),
  'utf8',
);
const releaseScript = await readFile(
  new URL('../scripts/build-release.ps1', import.meta.url),
  'utf8',
);

test('Android release contract targets package and portrait orientation', () => {
  assert.equal(appConfig.name, 'Питомец Финни');
  assert.equal(appConfig.slug, 'finni');
  assert.equal(appConfig.version, '1.0.0');
  assert.equal(appConfig.orientation, 'portrait');
  assert.equal(appConfig.android.package, 'com.meshnavigator.finni');
});

test('API 26 is declared through expo-build-properties', () => {
  const buildPropertiesPlugins = appConfig.plugins.filter(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
  );
  const buildProperties = buildPropertiesPlugins[0];

  assert.equal(buildPropertiesPlugins.length, 1);
  assert.equal(buildProperties?.[1]?.android?.minSdkVersion, 26);
  assert.match(androidProperties, /^android\.minSdkVersion=26$/m);
});

test('release build requires external signing and has no debug fallback', () => {
  assert.match(androidBuild, /signingConfig signingConfigs\.release/);
  assert.doesNotMatch(
    androidBuild,
    /release\s*\{[^}]*signingConfig signingConfigs\.debug/s,
  );
  assert.match(androidBuild, /FINNI_RELEASE_STORE_FILE/);
});

test('Babel config uses only the Expo preset and no superseded native renderer plugin', () => {
  assert.match(babelConfig, /presets:\s*\['babel-preset-expo'\]/);
  assert.equal(
    packageManifest.devDependencies['babel-preset-expo'],
    '~57.0.12',
  );
  assert.doesNotMatch(babelConfig, /worklets|filament/i);
  assert.equal(packageManifest.dependencies['react-native-filament'], undefined);
  assert.equal(packageManifest.dependencies['react-native-worklets-core'], undefined);
});

test('release build clears only the generated app CMake cache before Gradle clean', () => {
  assert.match(releaseScript, /android\\app\\\.cxx/);
  assert.match(
    releaseScript,
    /Remove-Item -LiteralPath \$appCxxDirectory -Recurse -Force/,
  );
  assert.match(releaseScript, /& \.\\gradlew\.bat clean :app:assembleRelease/);
});
