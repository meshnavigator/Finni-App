from pathlib import Path
import shutil,json
r=Path('artifacts/sprint-9/S9-003-004-details');p=r/'states.py';s=p.read_text(encoding='utf-8');s=s.replace("assert n.find(nodes,'root-navigation');n.ok('onboarding-create-profile')","assert n.find(nodes,'home-sections') or n.find(nodes,'root-menu-button');n.ok('onboarding-create-profile')");p.write_text(s,encoding='utf-8')
for name in ['states.log','states.json','build.log','verify.log']:
 shutil.copy2(r/name,r/(name.rsplit('.',1)[0]+'-intermediate.'+name.rsplit('.',1)[1]))
(r/'intermediate-resolution.json').write_text(json.dumps({'supersededErrorCheck':'XML contained an offscreen zero/negative-height text node; screenshot disproved visibility. Final test requires positive full bounds in viewport.','onboardingHarness':'Profile created successfully; at fontScale 2 root uses Menu rather than root-navigation. Assertion corrected to actual large-navigation IDs.','apkSha256':'5a5b70e814d8d1bc1147f65d7e330835a833fb78eae7914f05bd2a0975d6a3ec'},indent=2),encoding='utf-8')
