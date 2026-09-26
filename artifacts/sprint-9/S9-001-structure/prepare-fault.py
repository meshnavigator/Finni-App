
"""Build-time QA injection only. restore-production.py restores exact source bytes."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parent;F=R/'fault';F.mkdir(exist_ok=True)
paths=['src/ui/HomeScreen.tsx','src/ui/FinniHomeScene.tsx']
hashes={}
for name in paths:
    p=Path(name);data=p.read_bytes();(F/(p.name+'.production.txt')).write_bytes(data);hashes[name]=hashlib.sha256(data).hexdigest()
(F/'production-hashes.json').write_text(json.dumps(hashes,indent=2))
p=Path(paths[0]);s=p.read_text(encoding='utf-8')
marker="""  // QA_ONLY_STRUCTURAL_HOME: removed before delivery.
  const [qaReaction, setQaReaction] = useState<HomeReaction | null>(null);
  const qaFinished = useCallback((id: number) => { console.info('QA finished ' + id); setQaReaction(null); }, []);
  const qaCancelled = useCallback((id: number) => { console.info('QA cancelled ' + id); setQaReaction(null); }, []);
  const qaName = props.snapshot.profile!.name;
  if (qaName.startsWith('QA-')) {
    props = { ...props,
      reaction: qaReaction,
      motionEnabled: qaName !== 'QA-reduced',
      onEditPet: () => setQaReaction({ id: Date.now(), expression: qaName === 'QA-thoughtful' ? 'thoughtful' : qaName === 'QA-inspired' ? 'inspired' : 'happy', skippable: qaName === 'QA-inspired' }),
      onReactionFinished: qaFinished,
      onReactionCancelled: qaCancelled,
    };
  }
"""
s=s.replace('import { useState }', 'import { useCallback, useState }')
s=s.replace('  const viewport = useWindowDimensions();',marker+'  const viewport = useWindowDimensions();')
s=s.replace('source={goalImage}',"source={profile.name === 'QA-goal' ? { uri: 'file:///data/data/com.meshnavigator.finni/files/qa-missing-goal.png' } : goalImage}")
s=s.replace('onError={() => setFailedGoal(goal!.id)}',"onError={() => { console.info('QA goal-error'); setFailedGoal(goal!.id); }}")
p.write_text(s,encoding='utf-8')
p=Path(paths[1]);s=p.read_text(encoding='utf-8')
s=s.replace('const animationActive = motionActive && !reaction;', 'const animationActive = false; // QA: freeze idle only for UIAutomator; expression transitions remain native.')
s=s.replace('const sources = FINNI_APPEARANCE_ASSETS[appearanceId];',"""const qaName = (props.appearance as { name?: string }).name;
  const sources = qaName === 'QA-missing' || qaName === 'QA-corrupt'
    ? { neutral: { uri: 'file:///data/data/com.meshnavigator.finni/files/qa-home-pet.png' }, blink: FINNI_APPEARANCE_ASSETS[appearanceId].blink }
    : FINNI_APPEARANCE_ASSETS[appearanceId];""")
s=s.replace('onError={() => setDecodeError(true)}',"onError={() => { console.info('QA decode-error'); setDecodeError(true); }}")
s=s.replace('onLoad={() => setLoadedExpression(expressionKey)}',"onLoad={() => { console.info('QA expression-loaded'); setLoadedExpression(expressionKey); }}")
s=s.replace('      expressionOpacity.setValue(1);',"      console.info('QA static-expression');\n      expressionOpacity.setValue(1);")
s=s.replace('    const transition = Animated.timing(expressionOpacity', "    console.info('QA transition');\n    const transition = Animated.timing(expressionOpacity")
p.write_text(s,encoding='utf-8')
print('QA sources prepared; restore hashes saved')

