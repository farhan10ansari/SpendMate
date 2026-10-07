# Future transactions — integration and Android UI test report

Date: 7 October 2026.

## Outcome

The ordinary transaction workflows passed. The initial audit reproduced a
calendar-rollover cache defect, a date-picker configuration warning and four
existing lint errors. These have now been fixed at the user's request; see the
verification below. This is not a blanket claim that every feature or platform
has passed end-to-end testing. No release build or commit was made.

## Authorized fixes and verification — 7 October 2026

- Added one shared local-midnight timer plus foreground/resume reconciliation.
  Only statistics/activity queries with changed ranges or average denominators
  are invalidated. Active affected queries refetch; inactive ones become stale
  and fetch on reuse. Fixed historical/future periods and All Time stay cached
  during ordinary midnight rollover. Timezone changes also invalidate affected
  calendar ranges/averages. No polling, SQL changes, migration or new index.
- Replaced the two diagnostic bug reproductions with passing regression tests
  for the correct totals/activity and current-month average after rollover.
  Six further tests cover selective cache reuse, active refetch counts, timer
  scheduling, background cancellation, resume, cleanup, timezone changes and DST.
- Registered the package's English picker translation once at root initialization.
  On Android, opened the transaction date/time pickers and reminder time picker
  without saving changes. Date navigation shows `Previous`/`Next`, and time
  controls show `Cancel`/`Ok`. No missing-translation warning appeared in the
  checked log interval. A separate development-server connection warning was
  logged; the existing Metro process was still running and its status endpoint
  responded. No new server was launched.
- Resolved all four lint errors without disabling their rules: snackbar dismiss
  subscribes to navigation events; secure-login-disabled state is derived and
  native authentication changes are asynchronous; onboarding configuration is
  a stable constant; backup listing uses a folder-keyed query. Folder selection
  no longer refreshes the previous URI. Authentication children remain mounted
  behind the overlay, and cancellation does not unlock it.
- ESLint excludes generated `.expo` files and unrelated `.kilo/worktrees`.
  Full `bunx eslint .` passes with **zero errors and 19 existing warnings**.
- All **103 tests / 426 assertions** pass in both Asia/Kolkata and
  America/New_York. TypeScript and `git diff --check` pass.
- Android Home, Settings and Backup & Restore (no selected folder) open without
  runtime errors. Home was restored to All Time. This follow-up did not create,
  edit or delete transactions or change reminder/security/folder settings.

Still needed manually: actual overnight/resume behavior, secure-login success,
cancel and inactivity re-lock, and backup folder selection/switching/refresh on
device. Simulated-clock/lifecycle tests are not substitutes for those native
checks. Existing phase approvals remain unchanged.

## Initial audit (before fixes)

## Test coverage and results

- All 97 Bun tests pass in both Asia/Kolkata and America/New_York, with 386
  assertions per run. Four new tests exercise real repository CRUD and record
  the rollover findings. Tests named `audit reproduction` deliberately confirm
  the observed defect; their passing status does not mean the defect is fixed.
- `bunx tsc --noEmit` passes.
- Focused lint on the future-transaction implementation and test files passes.
- Current application source lint reports four errors and 21 warnings.
- Actual Android emulator checks used the existing running development app
  and Metro session; no app build, new server, dependency or migration was added.
- AndroidRuntime/ReactNativeJS error-level logs showed no errors during the
  checked flows. Warning-level logs did show missing date-picker translations.

Android UI checks performed:

1. Selected Today and added a labelled Food expense for INR 1.23.
   Home expense totals changed from 479.00 to 480.23 without manual refresh.
   The entry appeared in Recent Activity automatically.
2. Added a labelled Salary income for INR 2.34 dated 19 November 2026.
   It correctly remained excluded from Today.
3. Selected November 2026. Home showed expenses 54.00, income 2.34 and net
   income -51.66. Daily averages were 1.80 and 0.08 for the 30-day future month.
   Recent Activity included the future income and the existing future expense.
4. Opened expense and income More Stats. Totals and breakdowns matched Home,
   with the single group showing 100%. This verifies summary/breakdown display,
   not every chart mode or animation.
5. Checked the income list: future February/January 2027 and November 2026
   appeared before current/past months; scrolling loaded older months.
   Expense month tabs showed the future November month and its transaction.
6. Opened the new income from Recent Activity, edited its date back to today,
   and saved. It disappeared from November activity/totals automatically and
   appeared in Today. Its detail page updated as well.
7. Pulled down to refresh Home; the selected-period totals remained consistent.
8. Edited the new expense from 1.23 to 2.46. Its detail display and Recent
   Activity updated, then both labelled entries were deleted through their
   detail-page confirmation dialogs. Activity removed them automatically.
9. Opened the deleted expense's deep link: it displayed Expense Not Found and
   did not offer edit/delete actions. The repository retains trashed rows by
   design; the detail UI guards against displaying them as active transactions.

After cleanup, the active database totals match the pre-test values:
1,004 expenses totalling 51,586.98 and 23 incomes totalling 92,972.47.
Only the two labelled test entries were soft-deleted (expense ID 1005, income
ID 26). They remain stored as trashed records, excluded from active views;
existing records were not edited/deleted. Tests used in-memory databases for
all other CRUD and simulated-time scenarios.

## Findings

### 1. Medium — cached statistics and activity do not follow calendar rollover

Confirmed by simulated-time integration tests using the production repositories
and the same QueryClient settings/cache-key shapes as Home.

Home and both More Stats pages include the selected period object in their keys
but no resolved calendar date/range. The root QueryClient uses infinite
`staleTime` and disables window-focus refetching. The relative period object
does not change when the clock crosses a day/week/month/year boundary.

Reproduction: fetch Today with an expense, advance to the next day without a
mutation/invalidation, then request the same cached query. It still returns the
previous day's amount while a direct repository query returns zero. Equivalent
week, month and year boundary cases reproduce. Recent Activity behaves likewise.

A fixed current-month selection has a related average issue: on day 7, 70.00
averages to 10.00; on day 8 the repository correctly calculates 8.75, but the
cached screen result stays at 10.00 until refreshed.

Affected: Home expense/income totals and averages, financial summary derived
from them, Recent Activity, and both More Stats pages. All Time's transaction
range and fixed non-current periods do not change merely because a day passes.

Suggested follow-up: a shared lightweight calendar clock updated at local
midnight and app resume, with calendar-aware cache identity/invalidation. Keep
historical/future fixed-period caches and indexed repository queries intact;
do not solve this with continuous polling or frequent full-history fetching.
The device clock was not changed; native app-resume/midnight behavior still
needs device verification after implementing that fix.

### 2. Low — English date/time-picker translations are not registered

The emulator logs repeatedly warn that locale `en` is not registered when the
date picker opens/navigates. DateInput, TimeInput and the reminder picker request
`en`; no application `registerTranslation` call was found. Controls can expose
raw fallback keys such as `typeInDate`, `previous`, and `next` in accessibility.

Suggested follow-up: register the package's English translations once before
rendering any picker, then check date, time and reminder controls.

### 3. Existing code-quality failures outside this feature

Lint reports four errors in unchanged files:

- `contexts/GlobalSnackbarProvider.tsx:43`: state updates triggered in an effect.
- `contexts/LocalAuthProvider.tsx:190`: state update in an effect.
- `features/Onboarding/Onboarding.tsx:26`: ref access during render.
- `features/backup-restore/useBackupManager.ts:304`: state updates triggered in
  an effect.

These files match HEAD; these failures were not introduced by this phased work.
They are lint findings, not proof of crashes in the tested transaction flows.
Running ESLint over `.` additionally traverses `.kilo/worktrees` and generated
`.expo` files; use the current application source directories to isolate app
results, and review ignores separately.

## Remaining scope

No iOS testing, release-build testing, full theme/authentication/backup/restore
UI testing, exhaustive chart-mode testing, device timezone switching, or native
midnight simulation was performed. Existing unit tests cover some of those
features, but they are not substitutes for native UI checks.

Manual phase approvals remain separate from these automated/device results.
