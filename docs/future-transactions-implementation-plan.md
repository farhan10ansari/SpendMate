# Future-dated transactions implementation plan

Status: Phases 1, 2, and 4 done; Phases 3, 5, 6, 7, 8, and 9 await manual approval.
Phase 8 was brought forward at the user's explicit request. All phases now have
implementation or verification results; final manual approvals remain pending.

## Goal

Make future-dated expenses and income accessible without losing the current
query efficiency. Fix one affected place at a time, verify it, and wait for
the user's manual-testing approval before marking that phase done and starting
the next phase.

## Working agreement

1. Implement only the active phase.
2. Run focused automated checks and record their results below.
3. Set the phase to **Awaiting manual testing** and give the user test steps.
4. Address issues reported during that phase before continuing.
5. Mark it **Done** only after the user confirms manual testing passed.
6. Move to the next phase after that confirmation. Do not combine phases silently.

Use these statuses: Planned, In progress, Awaiting manual testing, Done, Blocked.
Document any change in scope or agreed behavior before implementing it.

## Confirmed behavior and constraints

- Expense and income lists start at the current month and paginate backward.
  Future months are skipped, but future dates within the current month appear.
- Expense month tabs and their All count omit future months.
- Before Phase 4, the statistics period selector only discovered current and past periods.
- Statistics and recent activity already include future dates inside the
  selected period. All Time statistics already include future transactions.
- Saving, fetching transaction details by ID, and backups do not exclude
  future-dated entries.
- Keep statistics scoped to the selected period; do not add out-of-period
  transactions to Today, This Month, or other bounded periods.
- Phase 8's daily-average policy is approved below.

## Query and data rules

- Use stable calendar keys such as `2026-11` for new month selections and cursors.
  Avoid cached selections whose meaning changes when today's month changes.
- Keep local calendar boundaries consistent with the existing app. For SQLite
  grouping, verify timestamp units and local-time handling against those boundaries.
- Prefer half-open ranges: `dateTime >= monthStart AND dateTime < nextMonthStart`.
- Use SQLite aggregation for month counts; do not load transaction IDs to count them.
- Use `ORDER BY dateTime DESC, id DESC LIMIT 1` to find the latest transaction
  or next older populated month. Preserve deterministic transaction ordering.
- Discover older populated months directly rather than querying every empty month.
- Retain existing React Query caching and ensure mutation invalidation covers
  every changed query, including date edits that move an entry between months.
- Existing indexes cover `(isTrashed, dateTime, id)` on both tables. Check query
  plans before adding indexes; this feature should not need a schema migration
  unless measurements justify one.
- A grouped month-discovery query may scan active rows. Keep it cached and run
  it only when needed; do not describe it as a constant-time indexed lookup.
- No dependency, app-version, or native-build changes are part of this plan.

## Shared manual test data

Use a development database or an existing backup before changing test data.
Create identifiable expenses and income for:

- A past month, today, and a future day within the current month.
- Next month and a future year.
- Two populated months separated by several empty months.
- Several entries with the same timestamp.
- A date near a local month boundary.

Record expected amounts and counts. Also test editing an entry into a future
month, moving it back, deleting it, and an empty database where appropriate.
Dates in this plan are relative to the actual testing date.

## Progress

| Phase | Place | Status | Manual approval |
| --- | --- | --- | --- |
| 1 | Expense All list | Done | Passed — user confirmed |
| 2 | Expense month tabs and All count | Done | Passed — user confirmed |
| 3 | Income list | Awaiting manual testing | Pending |
| 4 | Statistics period-selection sheet | Done | Passed — user confirmed |
| 5 | Home statistics | Awaiting manual testing | Pending |
| 6 | Expense More Stats | Awaiting manual testing | Pending |
| 7 | Income More Stats | Awaiting manual testing | Pending |
| 8 | Daily-average calculation | Awaiting manual testing | Pending |
| 9 | Home recent activity | Awaiting manual testing | Pending |

### Phase 1 — Expense All list

Primary files: `features/Expense/components/ExpenseList.tsx`,
`repositories/ExpenseRepo.ts`.

Steps:

1. Add a backward-compatible month-page query using a stable month cursor.
   Preserve the existing specific-month query until Phase 2 migrates its caller.
2. Start All at the latest active expense month, including future months.
3. Return the next populated older month as the next-page cursor.
4. Preserve day grouping, totals, refresh, empty state, and detail navigation.
5. Check mutation invalidation when a newly added entry belongs to a newer month
   than the cached first page; refreshed pages must not omit or duplicate entries.

Verification: focused pagination checks for future-only data, sparse months,
equal timestamps, no entries, and a newly inserted latest month; lint and inspect
query plans for month ranges and cursor lookups.

Manual testing: open Expenses with All selected; confirm future months appear
first, older entries load without gaps or duplicates, and day totals match.
Add, edit, delete, refresh, and open future entries. Month tabs remain pending
Phase 2 and may still show the old count during this phase.

Results: Implemented `getExpensesByMonthCursor` and connected only the All list.
The first cursor is null so refetch discovers the latest active month again.
Subsequent cursors are stable local calendar month keys and skip empty months.
Existing expense mutation invalidation covers the new query key. Specific-month
tabs and their count remain unchanged for Phase 2.

Automated verification: five SQLite-backed Bun tests cover empty/trashed-only
data, future and sparse months, equal timestamps/local boundaries, refresh after
insert/edit/delete, and indexed query plans without temporary sorting.
Manual approval: Passed — user confirmed Phase 1 testing passed.

### Phase 2 — Expense month tabs and All count

Primary files: `repositories/ExpenseRepo.ts`,
`features/Expense/components/MonthTabsContainer.tsx`, `app/(tabs)/expenses.tsx`,
`features/Expense/components/ExpenseList.tsx`.

Steps:

1. Replace backward month discovery with one grouped active-expense query.
2. Return stable month keys, display labels, and SQL counts, newest first.
3. Use those keys for selected-month queries and migrate the remaining caller.
4. Derive All count from grouped counts; handle future-only and empty data.
5. Remove obsolete offset-based code only after its callers are migrated.

Verification: compare grouped counts with known data; test local month boundaries,
selection identity, mutation invalidation, and list consistency; run focused lint.

Manual testing: select next month and a future-year month; confirm only that
month appears, its count matches, and All includes every active expense.
Move/delete entries and confirm both tabs and All count update.

Results: Month discovery now uses a grouped SQLite query, including future months,
with SQL counts and stable calendar keys. Individual tabs use the Phase 1 range
query without an older-month lookup. All count sums grouped counts, and selection
returns to All when edits/deletions remove the selected month. The obsolete
expense offset-based pagination query was removed. Prefetch uses the same new
cache key; existing mutation invalidation and pull-to-refresh cover both queries.

Query-plan verification: discovery uses the existing covering index. Grouping
needs temporary aggregation/sorting because the index stores timestamps rather
than computed month keys; no new index or migration was added. Normal discovery
is one query. A boundary check compares each group's earliest/latest timestamps
with JavaScript's local calendar; SQLite's distant-year DST mismatches trigger
indexed recounts only for affected months, avoiding incorrect counts.

Automated verification: ten SQLite-backed tests pass in UTC, Asia/Kolkata, and
America/New_York, including future discovery/counts, local month boundaries,
single-query selected-month loading, calendar rollover, edits/deletions, and
distant-future DST boundaries. Focused ESLint and TypeScript checks pass.

Test command: `TZ=Asia/Kolkata bun test tests/expense-month-pagination.test.js`.
Set TZ at process startup so Bun and SQLite agree on the test timezone.
Manual approval: Passed — user confirmed Phase 2 works fine.

### Phase 3 — Income list

Primary files: `repositories/IncomeRepo.ts`, `app/(tabs)/incomes.tsx`.

Steps:

1. Apply the verified stable-month pagination approach to income.
2. Start at the latest active income month and skip empty months.
3. Preserve month headings, totals, counts, detail navigation, and refresh.
4. Verify invalidation when transactions move between months or create a new
   latest month.

Verification: future-only, empty, sparse, and equal-timestamp cases; pagination
without duplicates; focused lint and query-plan inspection.

Manual testing: confirm future income appears at the top, month totals match,
and add/edit/delete/refresh work while older months remain accessible.

Results: Replaced income offset-based pagination with `getIncomesByMonthCursor`.
The first null cursor resolves the latest active income month, including future
months. Later pages use stable calendar keys and skip empty months. Month
headings, totals/counts, navigation, and refresh rendering remain unchanged.
Existing income add/edit/delete invalidation covers the new cache key.

Automated verification: five income tests cover empty/trashed-only data,
future/sparse months with totals/counts, local boundaries/equal timestamps,
refresh after insert/edit/delete, and query plans. All 15 expense/income tests
pass in Asia/Kolkata and America/New_York. First-page loading uses three indexed
queries, later pages two, with no temporary sorting. Focused ESLint and
TypeScript checks pass. No schema migration added.
Manual approval: Pending.

### Phase 4 — Statistics period-selection sheet

Primary files: `repositories/CommonRepo.ts`,
`app/helper-screens/select-stats-period.tsx`, `features/Stats/components/PeriodCard.tsx`.

Steps:

1. Replace backward discovery with grouped populated-period queries covering
   active expenses and income, including future months and years.
2. Deduplicate periods shared by both transaction types and keep current-period
   quick selections available even without transactions.
3. Use stable selected-period identities. Convert a calendar key to a relative
   offset at the query boundary if needed during migration; stored selection
   must keep referring to the same calendar period after month rollover.
4. Support existing saved selections without breaking Today, Week, Month, Year,
   and All Time. Avoid a database migration for selection state.

Verification: expense-only, income-only, mixed, future-only, and empty data;
shared periods, local boundaries, persisted-selection compatibility and calendar
rollover; focused lint.

Manual testing: open the sheet from Home and each More Stats page. Confirm future
months/years appear, selection labels are correct, and current/past picks work.

Results: Replaced backward period discovery with grouped queries for active
expenses and income. Their local month keys are merged/deduplicated, sorted
newest first, and used to derive unique years without another database scan.
The proven grouped-month logic (including distant-year DST corrections) is now
shared with expense month tabs in `repositories/lib/transactionMonths.ts`.

The normal discovery path uses two grouped covering-index queries, irrespective
of gaps between populated months; exceptional boundary corrections remain indexed.
Results are cached under the shared available-periods prefix, so existing
add/edit/delete invalidation still applies.

Month/year options now carry stable `calendarKey` values. The shared range helper
supports these keys while retaining legacy offsets, and selection highlighting
compares actual ranges. Current Month/Year moved to quick picks so they remain
available even in an empty database. Populated current periods also have fixed,
explicit calendar options in the month/year sections. The stats store is
in-memory rather than persisted; no storage/schema migration was necessary.

Automated verification: all 24 tests pass in Asia/Kolkata and America/New_York.
New cases cover mixed/expense-only/income-only/empty data, deduplication, two-query
discovery, local month/year boundaries, distant future dates, calendar rollover,
legacy selection matching, and actual future-period repository totals/averages.
Focused ESLint, TypeScript, and diff checks pass.
Manual approval: Passed — user confirmed Phase 4 is fine. Test steps retained:
open the sheet from Home and both More Stats pages;
select a populated future month/year, verify labels/totals, and confirm quick
picks and past selections work. Add/edit/delete data and reopen the sheet to
check available-period updates.

### Phase 5 — Home statistics

Primary files: `app/(tabs)/index.tsx`, statistics query adapters and period helper.

Steps:

1. Verify Home reads the stable period selected in Phase 4.
2. Change query adapters or cache keys only where needed; retain SQL aggregates.
3. Check expense/income totals, counts, net income, savings rate, top category/source,
   and biggest/smallest transactions for future selections.
4. Preserve the daily-average rules implemented in Phase 8.

Verification: compare bounded-period and All Time results with expected totals;
confirm excluded out-of-period transactions do not affect the result.

Manual testing: switch among current, future month, future year, and All Time;
confirm amounts and counts. Refresh after adding or editing future transactions.

Results: Verified Home reads the same selected period for expense/income queries,
and renders their existing SQL aggregate results. Four new tests exercise Home's
actual financial-summary helper and repository data: future-month metric
agreement, past/current/future-year/All Time totals and averaging, empty and
one-sided data, and QueryObserver-based cache switching/invalidation.

Found and fixed one existing summary mismatch: savings rate was forced to zero
when expenses exceeded positive income, contrary to the Home info dialog's
actual-rate explanation. It now returns the actual negative percentage when
income is positive. Zero-income behavior remains zero internally (Home shows
the unavailable indicator); the progress meter remains clamped to 0–100%.
Removed three unused imports from the same helper file.

Automated verification: all 28 SQLite/cache tests pass in Asia/Kolkata and
America/New_York. Focused ESLint and TypeScript checks pass. No new SQL queries
were added: each bounded transaction-type summary still uses two queries, and
cache reuse on returning to an unchanged period issues none. Existing
add/edit/delete invalidation prefixes cover the active Home queries.

Manual approval: Pending. Check a future month with known expenses/income and
compare every card. Switch to current, past, future year, and All Time; edit a
transaction across periods, add/delete entries, and verify automatic updates.
For overspending with positive income, enable negative statistics if hidden and
confirm the rate is negative while the meter stays empty. Test empty/income-only
periods as well. UI rendering and animations still need this device testing.

### Phase 6 — Expense More Stats

Primary file: `features/Stats/ExpenseStatsScreen.tsx` and its query adapters.

Steps:

1. Verify future-period selection reaches the existing aggregate query correctly.
2. Check summary cards, category totals/counts, and chart data agree.
3. Make only necessary fixes; record verification-only completion if already correct.

Verification: selected-period aggregates, category sums, empty-period behavior,
and consistency with Home, including Phase 8's averaging rules.

Manual testing: select a future month/year and All Time; compare summary and
category/chart totals against test data and Home.

Results: Verification-only phase; no runtime change was necessary. Expense More
Stats uses the same period, query key, repository, and summary component as Home.
Both the category card and chart receive the selected summary's category array.
Their amount/percentage mapping and empty-state wiring were inspected directly;
chart rendering is reserved for manual device testing.

Four new SQLite/cache tests cover future-month category sums/counts and summary
metrics, future-year/All Time boundaries, empty and deleted-only data, removing
the final entry in a category, and two observers sharing Home/More Stats cache.
Mutation tests cover add, amount/category edits, moving an entry across months,
and deletion; both observers receive the same updated aggregate object.

Automated verification: all 32 tests pass in Asia/Kolkata and America/New_York.
Focused ESLint, TypeScript, and diff checks pass. No additional production
queries, dependency changes, or schema migration were added. Opening the same
unchanged cached period does not fetch another summary.

Manual approval: Pending. Open expense More Stats for a future month/year and
All Time; compare totals/counts/averages/extrema with Home. Check category amounts,
percentages, and counts; switch pie/bar and amounts/percentages, including an
empty period. Add/edit/delete an expense and verify both summary and breakdown
update. Reloading is sufficient; no native rebuild is required.

### Phase 7 — Income More Stats

Primary file: `features/Stats/IncomeStatsScreen.tsx` and its query adapters.

Steps:

1. Verify stable future-period selection reaches the income aggregate query.
2. Check summary cards, source totals/counts, and chart data agree.
3. Make only necessary fixes; record verification-only completion if already correct.

Verification: selected-period aggregates, source sums, empty-period behavior,
and consistency with Home, including Phase 8's averaging rules.

Manual testing: select a future month/year and All Time; compare summaries and
source/chart totals against test data and Home.

Results: Verification-only phase; no runtime change was needed. Income More
Stats shares Home's selected period, income query key, repository, and summary
component. The source breakdown card and chart use that same summary's source
array. Their amount/percentage mapping, missing-source fallback, and empty-state
wiring were inspected directly; rendered charts still need device testing.

Four new SQLite/cache tests cover future-month source totals/counts and summary
metrics, future leap-year/All Time date boundaries, empty/deleted-only periods,
and Home/More Stats observers sharing the same cached data. Mutation checks
cover add, amount/source edits, moving entries between months, and deleting
the final source entry.

Automated verification: all 36 tests pass in Asia/Kolkata and America/New_York.
Focused ESLint, TypeScript, and diff checks pass. No production queries,
dependencies, or migrations were added. Cached summary reuse causes no SQL fetch.

Manual approval: Pending. Select a future month/year and All Time on income
More Stats; compare cards with Home and check source totals/counts/percentages.
Switch pie/bar and amounts/percentages, check an empty period, and add/edit/delete
income to verify updates. Reloading is sufficient; no native rebuild required.

### Phase 8 — Daily-average calculation

Primary files: statistics averaging logic in `repositories/ExpenseRepo.ts` and
`repositories/IncomeRepo.ts`; extract shared logic if appropriate.

Approved rule: current week/month/year divide by inclusive local calendar days
from the period start through today. Other selected weeks/months/years divide
by the whole period's calendar days; Today uses one day. All Time uses the
inclusive calendar-day span from the earliest to the latest active transaction,
including empty days. Each transaction type has its own All Time date span.
Future transactions within the selected period remain included in its total.

Examples: on March 13, This Month uses 13 days even if it contains an expense on
March 25. February 2024 uses 29 days. All Time transactions dated March 9 at
11 p.m. and March 11 at 1 a.m. span three calendar days, regardless of elapsed hours.

Steps:

1. Document the approved averaging rule and examples.
2. Reuse the existing period boundaries and indexed earliest/latest lookups;
   add no database queries solely for averaging.
3. Calculate inclusive local calendar days consistently for expense and income,
   including daylight-saving transitions; preserve rounding and zero handling.

Verification: current period without future data, with future data, future-only
data, wholly future periods, All Time, empty data, and calendar-day boundaries.

Manual testing: compare known totals divided by the approved day count on Home
and both More Stats screens. Confirm the new behavior is understandable.

Results: Added shared `getAverageDayCount` using date-fns
`differenceInCalendarDays`, and connected both statistics repositories. The
period range and day count share the same captured current time. Date-range
filters, totals, rounding, and query counts remain unchanged.

Automated verification: all 19 tests pass in Asia/Kolkata and America/New_York.
New cases cover current/past/future periods, leap February, partial-day All Time
boundaries, empty days, DST, future amounts in current-period totals, and empty
data. Repository checks verify no additional SQL queries. Focused ESLint and
TypeScript checks pass.
Manual approval: Pending. Reload, verify current Month/Week/Year averages against
elapsed inclusive days, then compare All Time with the earliest/latest recorded
calendar dates. Verify a historical month against its full day count.

### Phase 9 — Home recent activity

Primary files: `repositories/RecentActivityRepo.ts`, `app/(tabs)/index.tsx`.

Steps:

1. Verify stable period selection is reflected in recent-activity query keys
   and range filters.
2. Preserve each query's five-row limit, SQL ordering, and small in-memory merge.
3. Confirm future entries appear within the selected period and in All Time.
4. Make changes only if verification finds a mismatch.

Verification: mixed expenses/income, future-only data, equal timestamps, the
five-entry limit, period switching, and mutation invalidation.

Manual testing: select a future month and All Time; check ordering, limits,
detail navigation, and refresh after edits. Out-of-period entries stay excluded.

Results: Verification-only; no runtime changes needed. The shared period helper
already supports fixed future month/year selections, and Home includes the period
in both recent-activity cache keys. Existing expense/income mutation invalidation
and Home pull-to-refresh cover both queries. Detail routes remain kind-specific.

Four added regression tests verify future month/year and All Time, local period
boundaries, future dates inside current periods, trashed/out-of-period exclusion,
empty results, mixed ordering, equal timestamps, limits, cache reuse, and refresh
after adding/editing/moving/deleting either transaction type. Equal timestamps
retain the existing deterministic policy: descending IDs within each type,
expenses before income across types. These are transaction-date ordered entries,
not a log ordered by when the user created a record.

Each query still returns at most five rows, and the merge produces at most five
visible entries. EXPLAIN on the actual generated SQL confirms both bounded-period
and All Time queries use the existing indexes without temporary sorting. Cached
revisits execute no SQL; invalidating one kind refetches only its one active
recent-activity query in the test. No new index or migration is required.

All 40 regression tests (237 assertions) pass in Asia/Kolkata and America/New_York.
Focused ESLint and TypeScript checks pass. Native UI/navigation require manual
testing; no app build was run.

Manual approval: Pending. Select a future month/year and All Time, verify the
five-entry limit and descending transaction dates, tap an expense and income to
check detail navigation, then edit dates into/out of the selected period and
delete entries. Check auto-refresh and pull-to-refresh, plus an empty period.

## Final completion checklist

Final integration/Android audit: see
[testing report](future-transactions-testing-report.md). Ordinary CRUD and
selected-period flows passed. The authorized follow-up fixed calendar-rollover
caching, picker locale registration and all four recorded lint errors. All 103
tests pass in two timezones; TypeScript and full lint pass (19 existing warnings).
Native midnight/resume, secure-login and backup-folder checks still need manual
approval; see the report for exact coverage.

- [ ] All nine phases have recorded automated results and manual approval.
- [ ] Lists, tabs, totals, period selections, charts, and recent activity agree.
- [ ] No duplicate/missing entries across pagination or edits.
- [ ] Future-only and empty databases behave correctly.
- [ ] Local month boundaries and saved selections are handled consistently.
- [ ] Query plans and caching have been reviewed; no unnecessary migration added.
- [ ] Final targeted lint/type checks pass; record any unrelated existing failures.
- [ ] User approves the completed feature before any requested release work.

## Execution log

Record phase, date, changed files, checks/results, manual feedback, and approval
as work progresses.

- Audit follow-up: Fixed the calendar refresh, English picker registration and
  four lint errors at the user's request. Added six calendar lifecycle/cache
  tests and converted two diagnostic reproductions into correct-behavior tests.
  No SQL/index/migration/build/commit changes. Manual native verification pending.

- Phase 1: Implemented expense All month-cursor pagination; user confirmed manual
  testing passed. Marked Done.
- Phase 2: Implemented calendar-month expense tabs and corrected All counts.
  User confirmed manual testing passed. Marked Done.
- Phase 3: Implemented income month-cursor pagination. Automated verification
  passed; awaiting manual testing.
- Phase 8: Brought forward at user request. Implemented the approved inclusive
  calendar-day averaging rules; automated checks passed; awaiting manual testing.
- Phase 4: Implemented future period discovery and fixed calendar selections.
  User confirmed manual testing passed. Marked Done.
- Phase 5: Verified Home metrics and cache updates; fixed the actual savings rate
  for overspending. Automated checks passed; awaiting manual testing.
- Phase 6: Expense More Stats verification passed with four additional tests.
  Runtime already correct; awaiting manual chart/UI testing.
- Phase 7: Proceeded at user request. Income More Stats verification passed with
  four additional tests; runtime already correct; awaiting manual chart/UI testing.
- Phase 9: Proceeded at user request. Recent Activity verification passed with
  four additional tests and actual SQL query-plan checks; runtime already correct.
  All 40 tests pass in two timezones; awaiting manual UI/navigation testing.
