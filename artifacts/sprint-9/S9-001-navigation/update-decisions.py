from pathlib import Path
R=Path('artifacts/sprint-9/S9-001-navigation')
p=Path('../docs/IMPLEMENTATION_DECISIONS.md');s=p.read_text(encoding='utf-8');(R/'before/IMPLEMENTATION_DECISIONS.md.txt').write_text(s,encoding='utf-8')
s+='''

### Уточнение Accepted scope DEC-2026-09-25-013 — постоянная навигация, 2026-09-25

Основание: после независимого read-only обзора владелец ответил «Согласен с твоими предложениями, давай сделаем». Это расширяет presentation scope предыдущего решения до общей оболочки пяти детских корневых экранов; исполнитель сохраняет DIRECT Astra XHigh.

- AppRoot владеет peer roots «Домик / План / Покупки / Копилка / Ещё». При fontScale ≤1.2 одна постоянная панель видна на каждом из пяти экранов; selected-state отражает фактический экран. «Ещё» — отдельный корневой экран с каталогом, прогрессом, «Имя и внешность», справкой и прежним взрослым барьером.
- При fontScale >1.2 корневые маршруты показаны крупным вертикальным списком в modal «Разделы». Home сохраняет «Меню» рядом с контекстным действием; другие roots — доступную кнопку «Меню». Закрытие меню является dismiss action без стрелки перехода. Размер текста не ограничивается.
- Lesson/editor/history/adult/result остаются деталями без панели. Детали, открытые из «Ещё», возвращаются в «Ещё»; история операций — в копилку. Back с корневых разделов возвращает в Домик. Подтверждения покупки/перевода/получения цели/закрытия дня остаются native Alert с прежними командами и изоляцией ввода.
- «Пропуск» — отдельное временное действие около Финни. Назначение навигации не зависит от реакции. Крупные карточки цели/занятия сохраняют chevrons; достигнутая цель сообщает «Можно получить мечту», в копилке получение видно до списка остальных целей.
- У состояний обычного Home текст 13 sp вместо 11, у названия занятия 16 вместо15. Крупная сводка использует прежние исходные 12/14/16 sp с реальным системным scaling для соблюдения §2.5.3; это локально обоснованная плотность по §3.6, без fontScale cap или обрезки текста.
- План, Покупки и Копилка получают общую тёплую палитру, карточки/кнопки и safe-area оболочку. Перестройка учебных, итоговых и взрослого экранов остаётся в S9-002/004; финансовые контракты, SQLite, принятые assets и renderer не меняются.

Evidence: `Finni App/artifacts/sprint-9/S9-001-navigation/README.md`. Native emulator evidence не заменяет физический Android/performance, TalkBack-озвучивание, детский user test или художественную приёмку владельца. Подготовлены A/B материалы и сценарий будущего теста; runtime default — «Ещё».
'''
p.write_text(s,encoding='utf-8')
p=Path('../docs/mermaid/S9_001_HOME_LAYERS.md');(R/'before/S9_001_HOME_LAYERS.md.txt').write_bytes(p.read_bytes());p.write_text('''# S9-001: общая навигация и Home

Актуальная структура: DEC-2026-09-25-013, уточнение постоянной навигации.

```mermaid
flowchart TD
  DB[(SQLite)] --> Runtime[AppRuntime snapshot]
  Runtime --> Root[AppRoot: screen / detail origin / modal state]
  Insets[SafeAreaProvider: реальные insets] --> Root
  Root --> Peers[Домик / План / Покупки / Копилка / Ещё]
  Root --> Nav[Одна root navigation model + selected screen]
  Nav --> Ordinary[До 120%: постоянная нижняя панель]
  Nav --> Large[Свыше 120%: Меню и список разделов]
  Ordinary --> Peers
  Large --> Peers
  Peers --> Home[HomeScreen: обязательная сводка]
  Home --> Money[Деньги / мечта / прогресс / остаток]
  Home --> Scene[Сцена или крупный портрет Финни]
  Scene --> Pet[Принятые PNG / expressions / fallback]
  Home --> Skip[Отдельный временный Пропуск]
  Skip --> Pet
  DB --> History[История занятий]
  History --> Recommendation[Рекомендация из local catalog]
  Recommendation --> Home
  Home --> Lesson[Одно рекомендованное занятие]
  Home --> Next[Контекстный следующий маршрут]
  Peers --> More[Ещё: каталог / прогресс / имя и внешность / справка / взрослый]
  More --> Details[Detail screens: без root bar]
  Lesson --> Details
  Next --> Peers
  Next --> Details
  Money --> Savings[Копилка: видимое получение достигнутой цели]
  Peers --> Confirm[Native Alert: purchase / transfer / claim]
  Details --> Close[Native Alert: close period]
  Confirm --> Commands[Существующие domain commands]
  Close --> Commands
  Commands --> DB
  Large --> Modal[Modal isolation: taps и accessibility подложки закрыты]
  Modal --> Pause[Pause / cancel reaction]
  Back[Android Back] --> Dismiss[Сначала dismiss modal]
  Back --> Origin[Detail → origin; root → Домик]
```

Home и общая панель только открывают маршруты. Финансовое подтверждение выполняется внутри существующего экрана; панель не показывается поверх native Alert. Подписанные вкладки постоянны на пяти roots и отражают текущий экран; в крупном режиме используется тот же набор IDs списком. Незавершённая анимация не заменяет меню действием пропуска.

Обязательная сводка остаётся одновременно видна в 360×640/200%. CLOSED проверяется как presentation state; сохранённый закрытый период lifecycle проецирует в READY/WAITING. Новые bitmap assets и изменение экономики не требуются.
''',encoding='utf-8')
