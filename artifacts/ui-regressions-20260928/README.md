# UI regression check — Android API 26, 2026-09-28

- Offline `:app:assembleRelease` succeeded with embedded JS; APK:
  `android/app/build/outputs/apk/release/app-release.apk`.
- SHA-256: `C43E26A35B083528E36A4FE06DA4485BCE057BA25ACC8F8DCABEE5C7A2718031`.
- `adb -s emulator-5554 install -r` returned `Success`. Existing profile and
  wallet 100/0 remained after the update. The emulator has only
  `com.meshnavigator.finni` installed; no QA package remains.
- In DRAFT, `Посмотреть и купить` shows the requirement to confirm the plan.
  After confirming a 40/0/0 plan, the same button opened the native preview
  `Полезный корм: 30 монет. Останется 70.` Purchase was cancelled.
- The ACTIVE check used the existing `Финни` profile, not a separate test
  profile. Day 1 changed from DRAFT to ACTIVE with a confirmed 40/0/0 plan.
  Wallet/savings stayed 100/0. There is no verified safe way to restore the
  previous DRAFT state through the UI, so the period was left ACTIVE.
- With the numeric keyboard open, scrolling exposed `Подтвердить план`,
  `История операций`, and the lesson's `Проверить решение` and return button.
  Lesson labels `Короткая подсказка`, `Подсказка`, and `Показать пример` were
  visible in the installed APK.

Screenshots: `plan-keyboard-after.png`, `savings-keyboard-after.png`,
`lesson-keyboard-after.png`, `shop-preview-after.png`.

Physical device and spoken TalkBack were not checked. A real purchase was not
committed in this run.
