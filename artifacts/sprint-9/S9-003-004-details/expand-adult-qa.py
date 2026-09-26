from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/extras.py');s=p.read_text(encoding='utf-8');mark='# System night mode;'
add="""# Full accessible alternative and administrative controls at largest text.
n.q.fixture();n.start(360,640,2);n.detail('Для взрослого');n.go('Доступный вариант без удержания')
n.typevalue('Ответ на простой арифметический вопрос',4);nodes=n.capture('adult-arithmetic-invalid-200',True)
button=n.scrollfind(nodes,'Проверить ответ');assert button.get('enabled')=='false';n.ok('adult-wrong-answer-disabled-200')
n.typevalue('Ответ на простой арифметический вопрос',5);n.go('Проверить ответ');n.capture('adult-controls-200-top',True)
n.scrollfind(n.CURRENT,'Удалить данные выбранного режима');n.capture('adult-controls-200-end',True);n.ok('adult-unlocked-controls-200-scrollable')
"""
s=s.replace(mark,add+mark);p.write_text(s,encoding='utf-8')
