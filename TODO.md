# TODOs

## Quick wins

- [x] **Centralize `@null` sentinel handling** — `NullSentinel.ts` helper, used in `StatsQuery.ts`, `StatsClient.ts`, and `useDashboardStateWithUrlSynchronization.ts`
- [x] **Format percentage with 1 decimal** — `DistributionTable.tsx`
- [x] **Show country full name in active filters** — `ActiveFiltersBar.tsx`
- [x] **Handle NULL display value in active filters** — `ActiveFiltersBar.tsx`
- [x] **Consolidate +1/−1 date offset logic** — `Period.inclusiveEndToInstant()` and `Period.instantToInclusiveEnd()` helpers

## Timezone handling

- [x] **Resolve timezone in `Period.ts`** — `Temporal.Now.plainDateISO()` with no timezone ([Period.ts:33](src/website/femodels/Period.ts))
- [x] **Resolve timezone in `PeriodModal.tsx`** — same issue in from/to state init ([PeriodModal.tsx:13-15](src/website/comps/dashboard/PeriodModal.tsx))
- [x] **Resolve timezone in `TokensTab.tsx`** — ([TokensTab.tsx:58](src/website/comps/dashboard/TokensTab.tsx))

## UX / component improvements

- [x] **Redo PeriodPicker component** — opens in awkward directions, not mobile friendly ([PeriodPicker.tsx:15](src/website/comps/dashboard/PeriodPicker.tsx))
- [x] **Fix 90d + page filter reset bug** — reset doesn't work when a period and page filter are both active ([websites.$ref.page.tsx:85](src/website/pages/websites.$ref.page.tsx))

## Code quality

- [x] **Simplify `Prettify` helper** — has grown unwieldy ([Prettify.ts:4](src/helpers/Prettify.ts))
- [x] **Type `ServerMessage.data`** — currently `unknown` ([ServerMessage.ts:13](src/socket/ServerMessage.ts))

## Backend / data layer

- [x] **WebSocket lifecycle** — register/unregister sockets in services on open/close ([Server.ts:62-65](src/Server.ts))
- [x] **Notify TokenService on website creation** — message event so it updates its array ([WebsiteService.ts:59](src/services/WebsiteService.ts))
- [x] **Handle unique violations in TokenRepository** — return `undefined` on PK collision ([TokenRepository.ts:24](src/repositories/TokenRepository.ts))
- [x] **Handle unique violations in WebsiteRepository** — return `undefined` if id/hostname exists ([WebsiteRepository.ts:30](src/repositories/WebsiteRepository.ts))
- [x] **Add DB indexes** — dual index on `(website, created)` and index on `client_page_id` ([AnalyticsEventRepository.ts:37-38](src/repositories/AnalyticsEventRepository.ts))
- [x] **Restrict old event updates** — only allow updates within last 30 days ([AnalyticsEventRepository.ts:39](src/repositories/AnalyticsEventRepository.ts))
- [x] **Proper error handling for StatsService** — public API needs a `StatsError` type ([StatsService.ts:37](src/services/StatsService.ts))

## Unit and Deployment tests

- [x] **Implement unit tests** - and also deployment tests

## E2E tests

- [x] **Tracker location** - there's a bug in `package.json` because it incorrectly assumes a fixed location for writing the tracker script (could drift away from the .env files)
- [x] **Tracker bundle size** — ensure `vis.js` stays under 1.5kb ([vis.ts:3](src/tracker/vis.ts))
- [x] **WebSocket live functionality** — verify live pageview count updates via WebSocket
- [ ] **Stats endpoint** — verify error responses for invalid data
- [ ] **Stats endpoint** — verify error responses for invalid data

## Infrastructure

- [ ] **Add Postgres support?** — currently SQLite only ([sqlite.ts:10](src/drizzle/sqlite.ts))
