from pathlib import Path
import json,hashlib,subprocess
r=Path(__file__).resolve().parent
source=Path('src/ui/AppRoot.tsx');original=source.read_bytes();(r/'qa-AppRoot-delivery.tsx.txt').write_bytes(original)
manifest={'deliverySourceSha256':hashlib.sha256(original).hexdigest(),'deliveryApkSha256':hashlib.sha256((r/'finni-details-review.apk').read_bytes()).hexdigest(),'purpose':'QA-only image URI onError and forced loading presentation; not delivery code or timing proof'}
s=original.decode('utf-8');old='source={FINNI_APPEARANCE_ASSETS[renderedAppearance].preview}';assert s.count(old)==1
s=s.replace(old,"source={{ uri: 'file:///data/data/com.meshnavigator.finni/files/finni-qa-resource.png' }}")
old="if (phase === 'loading') return <LoadingScreen />;";assert s.count(old)==1
s=s.replace(old,"if (phase === 'loading' || snapshot.profile?.name === 'QA-Loading') return <LoadingScreen />;")
try:
 source.write_text(s,encoding='utf-8')
 result=subprocess.run(['powershell','-NoProfile','-File',str(r/'build-qa.ps1')])
 assert result.returncode==0,result.returncode
 qa=Path('android/app/build/outputs/apk/release/app-release.apk');(r/'finni-details-resource-qa.apk').write_bytes(qa.read_bytes());manifest['qaApkSha256']=hashlib.sha256(qa.read_bytes()).hexdigest()
finally:
 source.write_bytes(original)
 Path('android/app/build/outputs/apk/release/app-release.apk').write_bytes((r/'finni-details-review.apk').read_bytes())
 manifest['sourceRestored']=hashlib.sha256(source.read_bytes()).hexdigest()==manifest['deliverySourceSha256']
 (r/'qa-lineage.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(manifest))
