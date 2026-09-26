from pathlib import Path
p=Path('../docs/mermaid/S9_001_HOME_LAYERS.md');s=p.read_text(encoding='utf-8-sig');s=s.replace('  More --> Details[Detail screens: без root bar]','  More --> Details[Detail screens: без root bar]\n  Root --> SafeDetails[Общие SafeArea insets деталей и onboarding]\n  SafeDetails --> Details\n  Theme[screen-theme + DetailBack] --> Details\n  Details --> Help[Help Modal: собственные SafeArea insets]\n  Help --> Origin')
s+='''

## S9-003/004: вложенные экраны

Каталог, пять типов учебных форм, история, редактор питомца, Adult и предварительный итог используют общую тёплую presentation-систему. `AppRoot` учитывает insets до рендера обычной детали; `Help` является отдельным native Modal со своей safe area. Loading/boot error используют самостоятельную safe area и ScrollView. `DetailBack` вызывает существующий callback возврата, не создаёт новый navigation stack.

После подтверждения закрытия периода приложение возвращается на Home; сохранённый итог читается в History. Ни финансовые команды, ни владение SQLite, ни последовательность confirmation/cancel этим пакетом не изменены. Недостижимые fallback/closed render branches не представлены как самостоятельные маршруты. Native evidence: `Finni App/artifacts/sprint-9/S9-003-004-details/README.md`.
''';p.write_text(s,encoding='utf-8')
for code,slug,scope in [('003','financial-screens-visual-language','Знакомство, создание/редактирование питомца, предварительный итог, loading/recovery получили общий стиль. Принятые root Plan/Shop/Savings сохранены побайтно относительно baseline начала пакета; дочерние финансовые состояния проверяются вместе с новым chrome.'),('004','lessons-history-adult-visual-language','Каталог всех восьми тем, LessonShell и пять типов форм, Progress/History, Help Modal, Adult barrier и controls получили общий стиль. Устранена невидимая ошибка открытия занятия; образовательный контент, evaluator, rewards и SQLite не менялись.')]:
 p=Path(f'../tasks/sprint-9/S9-{code}_{slug}.md');s=p.read_text(encoding='utf-8-sig');s+=f'''

## Выполнение 2026-09-25 — продолжение принятого S9-001

{scope}

Основание: принятое владельцем оформление пяти roots, прямое поручение внедрить остальные экраны в том же стиле, Accepted DEC-2026-09-25-013. Режим DIRECT `gpt-6-astra` / `xhigh`, один содержательный исполнитель.

Детальный inventory, пакетный diff относительно исходного dirty tree, точные native/configured Verify результаты, lineage APK, ограничения и восстановление AVD: `Finni App/artifacts/sprint-9/S9-003-004-details/README.md`. Этот раздел фиксирует внедрение; безусловное закрытие задачи до окончательного Verify и внешней приёмки не заявляется.
''';p.write_text(s,encoding='utf-8')
p=Path('../tasks/TASKS.md');s=p.read_text(encoding='utf-8-sig');s=s.replace('— Перенести визуальный язык на финансовые экраны\n','— Перенести визуальный язык на финансовые экраны (UI внедрён; evidence S9-003-004-details, приёмка открыта)\n').replace('— Перенести визуальный язык на задания, историю и adult-раздел\n','— Перенести визуальный язык на задания, историю и adult-раздел (UI внедрён; evidence S9-003-004-details, приёмка открыта)\n');p.write_text(s,encoding='utf-8')
