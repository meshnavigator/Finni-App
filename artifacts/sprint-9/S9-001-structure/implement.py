
from pathlib import Path
p=Path('src/ui/home-scene-layout.ts');s=p.read_text(encoding='utf-8')
s += """
/** Optical head framing at large text sizes; the accepted canvas is never edited. */
export function homePetPortraitFrame(region: SceneRect) {
  const scale = Math.min((region.width - 8) / 520, (region.height - 8) / 440);
  return Object.freeze({
    width: FINNI_CANVAS.width * scale,
    height: FINNI_CANVAS.height * scale,
    left: region.x + region.width / 2 - FINNI_ANCHORS.feet.x * scale,
    top: region.y + 6 - HOME_PET_BOUNDS.top * scale,
    scale,
  });
}
"""
p.write_text(s,encoding='utf-8')
p=Path('src/ui/FinniHomeScene.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('import { homePetFrame, type SceneRect }','import { homePetFrame, homePetPortraitFrame, type SceneRect }')
s=s.replace('  roomOpacity?: number;','  roomOpacity?: number;\n  sceneStyle?: \'room\' | \'quiet\';\n  portrait?: boolean;')
s=s.replace('const petFrame = props.petRegion ? homePetFrame(props.petRegion, props.stage) : {','const petFrame = props.petRegion ? props.portrait ? homePetPortraitFrame(props.petRegion) : homePetFrame(props.petRegion, props.stage) : {')
s=s.replace('const petMotion = props.petRegion ?', 'const petMotion = props.portrait ? {} : props.petRegion ?')
s=s.replace("props.fullscreen && { borderRadius: 0, backgroundColor: '#F8F1E8' },", "props.fullscreen && { borderRadius: 0, backgroundColor: props.sceneStyle === 'quiet' ? 'transparent' : '#F8F1E8' },")
s=s.replace('      <Image\n        accessibilityIgnoresInvertColors','      {props.sceneStyle !== \'quiet\' && <Image\n        accessibilityIgnoresInvertColors',1)
s=s.replace('style={[styles.layer, { opacity: props.roomOpacity ?? 1 }]}\n      />','style={[styles.layer, { opacity: props.roomOpacity ?? 1 }]}\n      />}')
p.write_text(s,encoding='utf-8')
p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
old="onLesson={() => { setMessage(null); setScreen('lesson-catalog'); }}"
new="""onLesson={() => {
            const lesson = recommendHomeLesson(mode, snapshot.lifecycle!.periodIndex, snapshot.homeLessons ?? [], LOCAL_DEMO_LESSONS, HOME_LESSON_ORDER);
            if (lesson) void openLesson(lesson);
            else { setMessage(null); setScreen('lesson-catalog'); }
          }}"""
assert old in s;s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
r=Path('artifacts/sprint-9/S9-001-structure')
s=Path('artifacts/sprint-9/S9-001-polish/check-original.py').read_text();s=s.replace('S9-001-polish','S9-001-structure');(r/'check-original.py').write_text(s)
s=Path('artifacts/sprint-9/S9-001-polish/restore.py').read_text();(r/'restore.py').write_text(s)
s=Path('artifacts/sprint-9/S9-001-polish/build.ps1').read_text();s=s.replace('S9-001-polish/build-final.log','S9-001-structure/build-prototype.log');(r/'build.ps1').write_text(s)

