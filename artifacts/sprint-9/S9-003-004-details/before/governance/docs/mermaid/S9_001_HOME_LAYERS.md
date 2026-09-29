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
