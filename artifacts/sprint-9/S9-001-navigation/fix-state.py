from pathlib import Path
R=Path('artifacts/sprint-9/S9-001-navigation');p=Path('src/ui/HomeScreen.tsx');s=p.read_text(encoding='utf-8');s=s.replace("? 'Вдохновлённо' : 'Спокойно'", "? 'Вдохновлён' : 'Спокойно'");s=s.replace('style={[styles.state, large &&', 'style={[styles.state, short && !large && styles.shortState, large &&');s=s.replace("  stateItem:", "  shortState: { paddingHorizontal: 2, gap: 2 },\n  stateItem:");p.write_text(s,encoding='utf-8')
# Keep first visual evidence, including the rejected 119% wrapping.
for name in ('skip-visible-1.19.png','skip-visible-1.19.xml'):
 src=R/'fault'/name
 (R/'fault'/('rejected-'+name)).write_bytes(src.read_bytes())
(R/'fault/results-first.json').write_bytes((R/'fault/results.json').read_bytes())
(R/'fault-run-first.log').write_bytes((R/'fault-run.log').read_bytes())
