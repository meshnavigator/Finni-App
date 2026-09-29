from pathlib import Path
p=Path('src/ui/AppRoot.tsx');s=p.read_text(encoding='utf-8')
a=s.index('function LessonCatalogScreen(');b=s.index('export default function AppRoot',a);sub=s[a:b];sub=sub.replace('  onBack: () => void;', '  onBack: () => void;\n  backLabel: string;');sub=sub.replace('label="Вернуться в домик"', 'label={props.backLabel}');s=s[:a]+sub+s[b:]
s=s.replace('          onLesson={() => {\n            const lesson', "          onLesson={() => {\n            detailOrigin.current = 'home';\n            const lesson")
s=s.replace('          lessons={LOCAL_DEMO_LESSONS}\n          onBack', "          lessons={LOCAL_DEMO_LESSONS}\n          backLabel={detailOrigin.current === 'more' ? 'Вернуться в «Ещё»' : 'Вернуться в домик'}\n          onBack")
p.write_text(s,encoding='utf-8')
p=Path('artifacts/sprint-9/S9-001-navigation/delivery.py');s=p.read_text(encoding='utf-8');a=s.index("tap(find(nodes,'root-tab-home'));nodes=capture('final-home');money(nodes)")+len("tap(find(nodes,'root-tab-home'));nodes=capture('final-home');money(nodes)");s=s[:a]+'''
# A prior catalog visit from More must not hijack the direct Home lesson's Back destination.
tap(find(nodes,'root-tab-more'));more=capture('lesson-origin-more');tap(find(more,'Все занятия'));capture('lesson-origin-catalog');more=back('lesson-origin-back-more');tap(find(more,'root-tab-home'));home=capture('lesson-origin-home');tap(find(home,'home-lesson'));capture('lesson-direct');catalog=back('lesson-direct-back-catalog');assert not find(catalog,'root-navigation');home=back('lesson-direct-back-home');selected(home,'home');nodes=home;ok('direct-home-lesson-clears-prior-more-origin')
'''+s[a:];p.write_text(s,encoding='utf-8')
