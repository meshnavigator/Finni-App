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
  Home --> GrowthHelp[Как растёт: условия трёх стадий]
  Scene --> ReactionLabel[Именная плашка: действие и конкретный результат]
  Runtime --> PetName[Имя активного профиля]
  PetName --> ReactionLabel
  Preferences[Настройки движения и системное снижение анимаций] --> ReactionLabel
  ReactionLabel --> BannerMotion[Плавный вход и выход или статичный текст]
  Scene --> Pet[Принятые PNG / expressions / fallback]
  Home --> Skip[Отдельный временный Пропуск]
  Skip --> Pet
  DB --> History[История занятий]
  History --> Latest[Последнее состояние каждого занятия]
  Latest --> Recommendation[Незавершённое или первое доступное непройденное]
  History --> Completed[Сохранённые завершения]
  Completed --> CatalogBadge[Метка Пройдено в списке занятий]
  Completed --> Recommendation
  Recommendation --> Home
  Home --> Mood[Настроение питомца: прилагательное]
  Home --> Lesson[Одно рекомендованное занятие со статусом]
  Home --> Next[Контекстный следующий маршрут]
  Next -->|Demo и WAITING| DemoDay[Следующий демо-день: подтверждение на Home]
  DemoDay --> Commands
  Next -->|Normal и WAITING| Wait[Следующий день позже: недоступно]
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
  Peers --> Shop[Покупки: категории / статус выбранного варианта]
  Shop --> ShopDetail[Подробнее: цена / эффект / остаток / причина блокировки]
  ShopDetail --> Buy[Купить за сумму]
  Buy --> Commands
  Peers --> Confirm[Native Alert: transfer / claim]
  Details --> Close[Native Alert: close period]
  Confirm --> Commands[Существующие domain commands]
  Close --> Commands
  Commands --> DB
  DB --> Receipt[Persisted command receipt + snapshot]
  Receipt --> Guard[ReceiptPresentationController: id/profile/mode/epoch/revision]
  Receipt -->|Успешная покупка| Home
  Guard --> Withdrawal{Снятие из копилки?}
  Withdrawal -->|Да| Calm[Очистить прежние эмоции; neutral + AN-012]
  Withdrawal -->|Нет| Queue[Ограниченная очередь; приоритет goal/stage]
  Calm --> Scene
  Queue --> Scene
  Scene --> Done[Finish / skip / cancel только presentation]
  Root --> Clear[Navigation / mode / profile / reset: clear queue]
  Clear -. invalidates .-> Queue
  Large --> Modal[Modal isolation: taps и accessibility подложки закрыты]
  Modal --> Pause[Pause / cancel reaction]
  Back[Android Back] --> Dismiss[Сначала dismiss modal]
  Back --> Origin[Detail → origin; root → Домик]
```

Основная кнопка Home открывает контекстный маршрут, а в закрытом демо-дне подтверждает переход виртуальной даты. Финансовое подтверждение выполняется внутри существующего экрана; панель не показывается поверх native Alert. Подписанные вкладки постоянны на пяти roots и отражают текущий экран; в крупном режиме используется тот же набор IDs списком. Незавершённая анимация не заменяет меню действием пропуска.

В Покупках «Подробнее» открывает детали без списания. Покупка подтверждается отдельной кнопкой с суммой; занятый дневной слот и нехватка видны в деталях и карточке. После успешного сохранения покупки Home показывает реакцию с подписью. «Как растёт?» на Home объясняет сроки и признаки стадий без изменения формулы роста.

S9-002: реакция после покупки, перевода, цели, награды или смены стадии берётся из сохранённого receipt и нового snapshot. Вход в Home показывает ожидающий финансовый/стадийный эффект; награда занятия показывается на экране LessonShell из точного `before/after`, чтобы сохранить обычный маршрут возврата. Переход на иной маршрут уничтожает очередь или активный эффект. Finish/skip не вызывает команду и не изменяет сумму. Boot загружает snapshot без replay декоративных событий.

Рекомендация урока учитывает последнее состояние по каждому ID, поэтому старый черновик не перекрывает более позднее завершение. Если все доступные занятия уже пройдены, Домик предлагает повторение и явно помечает его. Каталог помечает каждый урок с сохранённым завершением как «Пройдено»; это не оценка освоения навыка.

Обязательная сводка остаётся одновременно видна в 360×640/200%. CLOSED проверяется как presentation state; сохранённый закрытый период lifecycle проецирует в READY/WAITING. Новые bitmap assets и изменение экономики не требуются.


## S9-003/004: вложенные экраны

Каталог, пять типов учебных форм, история, редактор питомца, Adult и предварительный итог используют общую тёплую presentation-систему. `AppRoot` учитывает insets до рендера обычной детали; `Help` является отдельным native Modal со своей safe area. Loading/boot error используют самостоятельную safe area и ScrollView. `DetailBack` вызывает существующий callback возврата, не создаёт новый navigation stack.

После подтверждения закрытия периода приложение возвращается на Home; сохранённый итог читается в History. Ни финансовые команды, ни владение SQLite, ни последовательность confirmation/cancel этим пакетом не изменены. Недостижимые fallback/closed render branches не представлены как самостоятельные маршруты. Native evidence: `Finni App/artifacts/sprint-9/S9-003-004-details/README.md`.
