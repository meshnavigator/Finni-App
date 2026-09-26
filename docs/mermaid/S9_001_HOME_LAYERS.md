# S9-001: общая навигация и Home

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
  Root --> SafeDetails[Общие SafeArea insets деталей и onboarding]
  SafeDetails --> Details
  Theme[screen-theme + DetailBack] --> Details
  Details --> Help[Help Modal: собственные SafeArea insets]
  Help --> Origin
  Lesson --> Details
  Next --> Peers
  Next --> Details
  Money --> Savings[Копилка: видимое получение достигнутой цели]
  Peers --> Confirm[Native Alert: purchase / transfer / claim]
  Details --> Close[Native Alert: close period]
  Confirm --> Commands[Существующие domain commands]
  Close --> Commands
  Commands --> DB
  DB --> Receipt[Persisted command receipt + snapshot]
  Receipt --> Guard[ReceiptPresentationController: id/profile/mode/epoch/revision]
  Guard --> Queue[Ограниченная очередь; приоритет goal/stage]
  Queue --> Scene
  Scene --> Done[Finish / skip / cancel только presentation]
  Root --> Clear[Navigation / mode / profile / reset: clear queue]
  Clear -. invalidates .-> Queue
  Large --> Modal[Modal isolation: taps и accessibility подложки закрыты]
  Modal --> Pause[Pause / cancel reaction]
  Back[Android Back] --> Dismiss[Сначала dismiss modal]
  Back --> Origin[Detail → origin; root → Домик]
```

Home и общая панель только открывают маршруты. Финансовое подтверждение выполняется внутри существующего экрана; панель не показывается поверх native Alert. Подписанные вкладки постоянны на пяти roots и отражают текущий экран; в крупном режиме используется тот же набор IDs списком. Незавершённая анимация не заменяет меню действием пропуска.

S9-002: реакция после покупки, перевода, цели, награды или смены стадии берётся из сохранённого receipt и нового snapshot. Вход в Home показывает ожидающий финансовый/стадийный эффект; награда занятия показывается на экране LessonShell из точного `before/after`, чтобы сохранить обычный маршрут возврата. Переход на иной маршрут уничтожает очередь или активный эффект. Finish/skip не вызывает команду и не изменяет сумму. Boot загружает snapshot без replay декоративных событий.

Обязательная сводка остаётся одновременно видна в 360×640/200%. CLOSED проверяется как presentation state; сохранённый закрытый период lifecycle проецирует в READY/WAITING. Новые bitmap assets и изменение экономики не требуются.


## S9-003/004: вложенные экраны

Каталог, пять типов учебных форм, история, редактор питомца, Adult и предварительный итог используют общую тёплую presentation-систему. `AppRoot` учитывает insets до рендера обычной детали; `Help` является отдельным native Modal со своей safe area. Loading/boot error используют самостоятельную safe area и ScrollView. `DetailBack` вызывает существующий callback возврата, не создаёт новый navigation stack.

После подтверждения закрытия периода приложение возвращается на Home; сохранённый итог читается в History. Ни финансовые команды, ни владение SQLite, ни последовательность confirmation/cancel этим пакетом не изменены. Недостижимые fallback/closed render branches не представлены как самостоятельные маршруты. Native evidence: `Finni App/artifacts/sprint-9/S9-003-004-details/README.md`.
