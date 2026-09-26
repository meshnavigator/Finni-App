
from pathlib import Path
p=Path('src/ui/HomeScreen.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('onHelp: () => void; onLesson: () => void; onSection:', 'onHelp: () => void; onLesson: () => void; onAllLessons: () => void; onSection:')
s=s.replace('<MenuRow label="Прогресс"', '<MenuRow label="Все занятия" onPress={() => navigate(props.onAllLessons)} />\n        <MenuRow label="Прогресс"')
p.write_text(s,encoding='utf-8')
p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('          onOpenDay={() => void openDay()}', "          onAllLessons={() => { setMessage(null); setScreen('lesson-catalog'); }}\n          onOpenDay={() => void openDay()}")
p.write_text(s,encoding='utf-8')

