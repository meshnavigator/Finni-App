# M1 — матрица требований и доказательств для версии 1.0.0

Базовый срез исходников: `ui/pet-reaction-name-demo@1e2b287`, 29.09.2026;
последующее изменение номера версии зафиксировано в
[паспорте поставки](RELEASE_HANDOFF_2026-09-29.md). Матрица показывает
ближайшее evidence и незакрытые проверки; она не является протоколом
физической или независимой приёмки.
Идентификаторы и формулировки взяты из SRS v1.3; при конфликте действуют
официальное ТЗ и Accepted-решения governance-проекта.

`Код/тест` означает путь проверки в исходниках, а не пройденный release APK.
`Открыто` означает, что требуемого фактического evidence пока нет. Общий
автоматизированный baseline финальной версии указан в паспорте поставки;
этот файл не повышает его до device PASS.

## Функциональные требования

| ID | Код и ближайшая автоматизированная проверка | Открытый gate |
| --- | --- | --- |
| FR-01 | [src/ui/HelpScreen.tsx](../src/ui/HelpScreen.tsx); [tests/profile-ui.test.mjs](../tests/profile-ui.test.mjs) | Повтор открытия на release APK |
| FR-02 | [src/persistence/profile-repository.ts](../src/persistence/profile-repository.ts); [tests/persistence.test.mjs](../tests/persistence.test.mjs) | Локальность на release APK |
| FR-03 | [src/domain/pet-profile.ts](../src/domain/pet-profile.ts); [tests/profile-ui.test.mjs](../tests/profile-ui.test.mjs) | Визуальная проверка 9 комбинаций |
| FR-04 | [src/ui/HomeScreen.tsx](../src/ui/HomeScreen.tsx); [tests/home-integration.test.mjs](../tests/home-integration.test.mjs) | 360 dp/200% и TalkBack |
| FR-05 | [src/ui/RootNavigation.tsx](../src/ui/RootNavigation.tsx); [tests/root-navigation.test.mjs](../tests/root-navigation.test.mjs) | Системный Back на устройстве |
| FR-06 | [src/domain/lifecycle.ts](../src/domain/lifecycle.ts); [tests/lifecycle.test.mjs](../tests/lifecycle.test.mjs) | Demo/restart release-прогон |
| FR-07 | [src/persistence/lesson-repository.ts](../src/persistence/lesson-repository.ts); [tests/lesson-persistence.test.mjs](../tests/lesson-persistence.test.mjs) | Demo/restart release-прогон |
| FR-08 | [src/ui/BudgetPlanScreen.tsx](../src/ui/BudgetPlanScreen.tsx); [tests/budget-plan.test.mjs](../tests/budget-plan.test.mjs) | 360 dp/200% |
| FR-09 | [src/domain/economy.ts](../src/domain/economy.ts); [tests/budget-plan.test.mjs](../tests/budget-plan.test.mjs) | Ошибочный ввод на APK |
| FR-10 | [src/persistence/budget-plan-repository.ts](../src/persistence/budget-plan-repository.ts); [tests/budget-plan.test.mjs](../tests/budget-plan.test.mjs) | План/факт в demo APK |
| FR-11 | [src/domain/catalog.ts](../src/domain/catalog.ts); [tests/commerce.test.mjs](../tests/commerce.test.mjs) | Восемь карточек на APK |
| FR-12 | [src/persistence/commerce-repository.ts](../src/persistence/commerce-repository.ts); [tests/commerce.test.mjs](../tests/commerce.test.mjs) | Повтор нажатия на APK |
| FR-13 | [src/domain/economy.ts](../src/domain/economy.ts); [tests/commerce.test.mjs](../tests/commerce.test.mjs) | Отказ IT-08 в полном demo |
| FR-14 | [src/ui/LedgerScreen.tsx](../src/ui/LedgerScreen.tsx); [tests/commerce.test.mjs](../tests/commerce.test.mjs) | История в release APK |
| FR-15 | [src/ui/SavingsScreen.tsx](../src/ui/SavingsScreen.tsx); [tests/savings-commerce.test.mjs](../tests/savings-commerce.test.mjs) | Три цели на APK |
| FR-16 | [src/persistence/commerce-repository.ts](../src/persistence/commerce-repository.ts); [tests/savings-commerce.test.mjs](../tests/savings-commerce.test.mjs) | Перевод на APK |
| FR-17 | [src/ui/SavingsScreen.tsx](../src/ui/SavingsScreen.tsx); [tests/savings-commerce.test.mjs](../tests/savings-commerce.test.mjs) | Снятие на APK |
| FR-18 | [src/persistence/commerce-repository.ts](../src/persistence/commerce-repository.ts); [tests/savings-commerce.test.mjs](../tests/savings-commerce.test.mjs) | Смена цели на APK |
| FR-19 | [src/persistence/commerce-repository.ts](../src/persistence/commerce-repository.ts); [tests/savings-commerce.test.mjs](../tests/savings-commerce.test.mjs) | Получение GL-01 в полном demo |
| FR-20 | [content/bundles/1.2.0/](../content/bundles/1.2.0/); [tests/content-validation.test.mjs](../tests/content-validation.test.mjs) | Восемь заданий в release APK |
| FR-21 | [src/ui/lesson-renderer-registry.ts](../src/ui/lesson-renderer-registry.ts); [tests/content-evaluator-integration.test.mjs](../tests/content-evaluator-integration.test.mjs) | Ручная проверка механик |
| FR-22 | [src/application/learning-service.ts](../src/application/learning-service.ts); [tests/lesson-domain.test.mjs](../tests/lesson-domain.test.mjs) | Исходы на APK |
| FR-23 | [scripts/validate-content.mjs](../scripts/validate-content.mjs); [tests/content-validation.test.mjs](../tests/content-validation.test.mjs) | Девятое тестовое задание отдельно |
| FR-24 | [src/application/receipt-presentation.ts](../src/application/receipt-presentation.ts); [tests/receipt-presentation.test.mjs](../tests/receipt-presentation.test.mjs) | Receipt на APK |
| FR-25 | [src/ui/home-next-step.ts](../src/ui/home-next-step.ts); [tests/home-next-step.test.mjs](../tests/home-next-step.test.mjs) | Неудачные ветки на APK |
| FR-26 | [src/domain/pet-profile.ts](../src/domain/pet-profile.ts); [tests/domain-five-period.test.mjs](../tests/domain-five-period.test.mjs) | Три стадии в полном demo |
| FR-27 | [src/ui/HistoryScreen.tsx](../src/ui/HistoryScreen.tsx); [tests/adult-history-control.test.mjs](../tests/adult-history-control.test.mjs) | История на APK |
| FR-28 | [src/ui/HelpScreen.tsx](../src/ui/HelpScreen.tsx); [tests/lesson-discovery.test.mjs](../tests/lesson-discovery.test.mjs) | Контекстный возврат на APK |
| FR-29 | [src/application/adult-access.ts](../src/application/adult-access.ts); [tests/adult-history-control.test.mjs](../tests/adult-history-control.test.mjs) | Background/exit на APK |
| FR-30 | [src/ui/AdultScreen.tsx](../src/ui/AdultScreen.tsx); [tests/adult-history-control.test.mjs](../tests/adult-history-control.test.mjs) | Проверка текста взрослым |
| FR-31 | [src/application/app-control.ts](../src/application/app-control.ts); [tests/adult-history-control.test.mjs](../tests/adult-history-control.test.mjs) | Delete/reset/backup на APK |
| FR-32 | [src/persistence/migrations.ts](../src/persistence/migrations.ts); [tests/core-regression.test.mjs](../tests/core-regression.test.mjs) | Process kill/restart на APK |
| FR-33 | [src/application/demo-scenario.ts](../src/application/demo-scenario.ts); [tests/demo-runtime.test.mjs](../tests/demo-runtime.test.mjs) | A.1–A.12 трижды на release APK |
| FR-34 | [src/application/production-app-controller.ts](../src/application/production-app-controller.ts); [tests/demo-runtime.test.mjs](../tests/demo-runtime.test.mjs) | Normal/demo isolation на APK |
| FR-35 | [src/domain/clocks.ts](../src/domain/clocks.ts); [tests/lifecycle.test.mjs](../tests/lifecycle.test.mjs) | Календарные сценарии на APK |
| FR-36 | [src/application/lifecycle-coordinator.ts](../src/application/lifecycle-coordinator.ts); [tests/lifecycle-coordinator.test.mjs](../tests/lifecycle-coordinator.test.mjs) | Коррекция часов на APK |
| FR-37 | [content/bundles/1.2.0/lessons/](../content/bundles/1.2.0/lessons/); [tests/content-validation.test.mjs](../tests/content-validation.test.mjs) | Каталог на APK |
| FR-38 | [src/ui/budget-purchase-renderers.tsx](../src/ui/budget-purchase-renderers.tsx); [tests/budget-purchase-renderers.test.mjs](../tests/budget-purchase-renderers.test.mjs) | Интерактивная проверка |
| FR-39 | [src/lessons/budget-purchase-lessons.ts](../src/lessons/budget-purchase-lessons.ts); [tests/budget-purchase-lessons.test.mjs](../tests/budget-purchase-lessons.test.mjs) | P02 на APK |
| FR-40 | [src/lessons/receipt-workshop-lessons.ts](../src/lessons/receipt-workshop-lessons.ts); [tests/receipt-workshop-lessons.test.mjs](../tests/receipt-workshop-lessons.test.mjs) | P03 на APK |
| FR-41 | [src/lessons/receipt-workshop-lessons.ts](../src/lessons/receipt-workshop-lessons.ts); [tests/receipt-workshop-lessons.test.mjs](../tests/receipt-workshop-lessons.test.mjs) | B03 на APK |
| FR-42 | [src/application/learning-service.ts](../src/application/learning-service.ts); [tests/content-evaluator-integration.test.mjs](../tests/content-evaluator-integration.test.mjs) | Изоляция учебных сумм на APK |
| FR-43 | [src/persistence/lesson-repository.ts](../src/persistence/lesson-repository.ts); [tests/lesson-persistence.test.mjs](../tests/lesson-persistence.test.mjs) | Два урока/restart на APK |
| FR-44 | [src/ui/LessonShell.tsx](../src/ui/LessonShell.tsx); [tests/lesson-shell.test.mjs](../tests/lesson-shell.test.mjs) | Подсказки/объяснения на APK |
| FR-45 | [src/ui/lesson-discovery-summary.ts](../src/ui/lesson-discovery-summary.ts); [tests/lesson-discovery.test.mjs](../tests/lesson-discovery.test.mjs) | Исторический просмотр на APK |
| FR-46 | [src/ui/lesson-return.ts](../src/ui/lesson-return.ts); [tests/lesson-discovery.test.mjs](../tests/lesson-discovery.test.mjs) | Возврат без проводки на APK |
| FR-47 | [src/persistence/lesson-repository.ts](../src/persistence/lesson-repository.ts); [tests/lesson-stability.test.mjs](../tests/lesson-stability.test.mjs) | Варианты на APK |
| FR-48 | [src/persistence/lesson-repository.ts](../src/persistence/lesson-repository.ts); [tests/lesson-persistence.test.mjs](../tests/lesson-persistence.test.mjs) | Kill/restart во время урока |
| FR-49 | [src/application/demo-scenario.ts](../src/application/demo-scenario.ts); [tests/demo-runtime.test.mjs](../tests/demo-runtime.test.mjs) | Восемь занятий на APK |
| FR-50 | [content/bundles/1.2.0/](../content/bundles/1.2.0/); [tests/content-validation.test.mjs](../tests/content-validation.test.mjs) | Family UI и настройка не подтверждены |
| FR-51 | [content/bundles/1.2.0/](../content/bundles/1.2.0/); [tests/content-validation.test.mjs](../tests/content-validation.test.mjs) | Family UI не подтверждён |
| FR-52 | [content/bundles/1.2.0/](../content/bundles/1.2.0/); [tests/content-validation.test.mjs](../tests/content-validation.test.mjs) | Отметка взрослого не подтверждена |
| FR-53 | [src/application/app-control.ts](../src/application/app-control.ts); [tests/adult-history-control.test.mjs](../tests/adult-history-control.test.mjs) | Удаление всех локальных копий не подтверждено |
| FR-54 | [docs/M1_DEMO_ROUTE.md](../docs/M1_DEMO_ROUTE.md); текущая матрица | Финальный состав одной версии |
| FR-55 | [src/application/app-runtime.ts](../src/application/app-runtime.ts); [tests/demo-runtime.test.mjs](../tests/demo-runtime.test.mjs) | Разный порядок действий на APK |
| FR-56 | [src/ui/LessonShell.tsx](../src/ui/LessonShell.tsx); [tests/lesson-shell.test.mjs](../tests/lesson-shell.test.mjs) | Помощь до ответа на APK |

## Нефункциональные требования

| ID | Код/документ и проверка | Открытый gate |
| --- | --- | --- |
| NFR-01 | [android/app/build.gradle](../android/app/build.gradle); [tests/bootstrap.test.mjs](../tests/bootstrap.test.mjs) | Физический API 26, safe area |
| NFR-02 | S4-004 checklist | Физическое устройство 3 ГБ+ |
| NFR-03 | [artifacts/sprint-4/M1-security-api26-qa/README.md](../artifacts/sprint-4/M1-security-api26-qa/README.md) | Полный offline demo на поставочном APK |
| NFR-04 | S4-004 checklist | Пять измерений cold start |
| NFR-05 | S4-004 checklist | Измерения четырёх действий |
| NFR-06 | [tests/demo-runtime.test.mjs](../tests/demo-runtime.test.mjs) | Три полных release-прогона |
| NFR-07 | [tests/domain-five-period.test.mjs](../tests/domain-five-period.test.mjs); [tests/persistence.test.mjs](../tests/persistence.test.mjs) | Полный APK-маршрут |
| NFR-08 | [plugins/with-finni-android-security.js](../plugins/with-finni-android-security.js); [tests/bootstrap.test.mjs](../tests/bootstrap.test.mjs) | Итоговый release manifest |
| NFR-09 | [src/application/app-control.ts](../src/application/app-control.ts); [tests/adult-history-control.test.mjs](../tests/adult-history-control.test.mjs) | Uninstall/reinstall/restore |
| NFR-10 | [src/ui/](../src/ui/); UI tests | 360 dp/200%, TalkBack, 48 dp |
| NFR-11 | [src/ui/finni-animation-set.ts](../src/ui/finni-animation-set.ts); [tests/finni-presentation-preferences.test.mjs](../tests/finni-presentation-preferences.test.mjs) | Системные настройки на APK |
| NFR-12 | [scripts/build-release.ps1](../scripts/build-release.ps1); [tests/bootstrap.test.mjs](../tests/bootstrap.test.mjs) | Чистая сборка и secret scan |
| NFR-13 | [scripts/validate-content.mjs](../scripts/validate-content.mjs); [tests/content-validation.test.mjs](../tests/content-validation.test.mjs) | Девятое задание отдельно |
| NFR-14 | Asset manifests и S4-003 inventory | Полная лицензия каждого материала |
| NFR-15 | [src/domain/economy.ts](../src/domain/economy.ts); content validator | Внешняя методическая оценка |
| NFR-16 | [docs/M1_DEMO_ROUTE.md](../docs/M1_DEMO_ROUTE.md); эта матрица | Версионный release-протокол |
| NFR-17 | S4-006 | Tag, hashes и freeze |
| NFR-18 | S3-007 report | Независимое пользовательское ревью |
| NFR-19 | S4-003 inventory | Происхождение всех generative assets |
| NFR-20 | [src/application/production-app-controller.ts](../src/application/production-app-controller.ts); [tests/lifecycle-coordinator.test.mjs](../tests/lifecycle-coordinator.test.mjs) | Device kill/mode race |
| NFR-21 | [scripts/build-release.ps1](../scripts/build-release.ps1); [tests/bootstrap.test.mjs](../tests/bootstrap.test.mjs) | Проверка release процесса |
| NFR-22 | S4-006 | Финальные MD/DOCX/hash/link проверки |

## Приложение А

| ID | Ближайшее evidence | Открытый gate |
| --- | --- | --- |
| A.1 | [docs/M1_DEMO_ROUTE.md](../docs/M1_DEMO_ROUTE.md); [tests/bootstrap.test.mjs](../tests/bootstrap.test.mjs) | Проверяемый release APK офлайн |
| A.2 | [tests/profile-ui.test.mjs](../tests/profile-ui.test.mjs) | Локальный профиль на APK |
| A.3 | [tests/profile-ui.test.mjs](../tests/profile-ui.test.mjs) | Вторая комбинация после reset |
| A.4 | [tests/demo-runtime.test.mjs](../tests/demo-runtime.test.mjs) | День 1 и GL-01 на APK |
| A.5 | [tests/budget-plan.test.mjs](../tests/budget-plan.test.mjs) | План 40/20/40 на APK |
| A.6 | [tests/lesson-persistence.test.mjs](../tests/lesson-persistence.test.mjs) | LS-P02 и одна награда на APK |
| A.7 | [tests/commerce.test.mjs](../tests/commerce.test.mjs) | IT-08 отказ без проводки на APK |
| A.8 | [tests/savings-commerce.test.mjs](../tests/savings-commerce.test.mjs) | B20/S40 на APK |
| A.9 | [tests/period-close.test.mjs](../tests/period-close.test.mjs) | Итоги дня 1 на APK |
| A.10 | [tests/domain-five-period.test.mjs](../tests/domain-five-period.test.mjs) | Пять дат и стадии на APK |
| A.11 | [tests/demo-runtime.test.mjs](../tests/demo-runtime.test.mjs) | B40/S30 после kill/restart APK |
| A.12 | [tests/adult-history-control.test.mjs](../tests/adult-history-control.test.mjs) | Барьер/reset/normal isolation APK |

## Незакрыто для версии M1

- S4-001: фактический A.1–A.12 и три последовательных release-прогона.
- S4-002: 360 dp/200%, низкий экран и spoken TalkBack по основному маршруту.
- S4-003: конечный manifest, offline, delete/restore, secret/license/asset audit.
- S4-004: физический Android, измерения, restart/kill и три demo-прогона.
- S4-005: clean build по README, иконка 512, три финальных скриншота,
  привязанные к тому же APK, и карточка.
- S4-006: tag, manifest, hashes, независимый доступ и freeze.
