const fs = require('node:fs/promises');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const excludedDomains = [
  'root',
  'file',
  'database',
  'sharedpref',
  'external',
  'device_root',
  'device_file',
  'device_database',
  'device_sharedpref',
];

const blockedReleasePermissions = [
  'INTERNET',
  'READ_EXTERNAL_STORAGE',
  'SYSTEM_ALERT_WINDOW',
  'VIBRATE',
  'WRITE_EXTERNAL_STORAGE',
];

function exclusions(indent) {
  return excludedDomains.map((domain) => `${indent}<exclude domain="${domain}" path="." />`).join('\n');
}

const backupRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <!-- Exclude every local profile, AppControl DB, WAL/SHM sidecar and temporary copy on Android 11 and earlier. -->
${exclusions('  ')}
</full-backup-content>
`;

const dataExtractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <!-- Cloud and device transfer must not restore a deleted profile or AppControl state. -->
  <cloud-backup>
${exclusions('    ')}
  </cloud-backup>
  <device-transfer>
${exclusions('    ')}
  </device-transfer>
</data-extraction-rules>
`;

const releaseManifest = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
${blockedReleasePermissions.map((permission) => `  <uses-permission android:name="android.permission.${permission}" tools:node="remove"/>`).join('\n')}
</manifest>
`;

module.exports = function withFinniAndroidSecurity(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application[0].$;
    application['android:fullBackupContent'] = '@xml/backup_rules';
    application['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const xmlDirectory = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
    const releaseDirectory = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'release');
    await fs.mkdir(xmlDirectory, { recursive: true });
    await fs.mkdir(releaseDirectory, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(xmlDirectory, 'backup_rules.xml'), backupRules),
      fs.writeFile(path.join(xmlDirectory, 'data_extraction_rules.xml'), dataExtractionRules),
      fs.writeFile(path.join(releaseDirectory, 'AndroidManifest.xml'), releaseManifest),
    ]);
    return mod;
  }]);
};
