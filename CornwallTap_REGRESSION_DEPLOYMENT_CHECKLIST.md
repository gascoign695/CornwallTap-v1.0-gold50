# CornwallTap Regression & Deployment Checklist

Use this checklist for every meaningful code change, especially changes to `game.js`, Daily Challenge logic, saved state, analytics, sharing, caching/version checks, or mobile behaviour.

## 1. Before Editing

- Confirm you are starting from the latest deployed `main`.
- Pull/sync the repository before making changes.
- Check the current branch name in VS Code.
- For anything beyond a tiny text-only change, create a temporary branch.
- Confirm the exact live files that will be changed.
- Do not use an older replacement file as the base.
- Keep the change as small and isolated as possible.
- Avoid unrelated “while we’re here” tweaks.

## 2. Code Change Rules

- One logical change per branch where practical.
- Preserve existing Daily Challenge history and saved-player state unless the change explicitly requires otherwise.
- Do not change location IDs.
- Difficulty changes must not reset repeat history.
- Do not alter the authoritative Daily schedule unless intentionally changing future Dailies.
- Do not change today’s Daily after it has gone live.
- If changing `clientBuildVersion`, update `/api/version.js` in the same deployment.
- If changing cache/version behaviour, test mobile as well as desktop.
- If changing analytics, confirm it does not add unnecessary D1 reads/writes.
- If changing UI copy, avoid modifying surrounding logic.

## 3. Local Desktop Smoke Test

### Home
- Home screen loads correctly.
- No unexpected layout/spacing changes.
- No red errors in DevTools Console.
- Daily button shows the expected state:
  - Play Today’s Challenge
  - Continue Today’s Challenge
  - View Today’s Result
- Statistics button works.

### Practice
- Practice starts normally.
- Location/map loads.
- Guess can be submitted.
- Correct answer marker and connecting line appear.
- Score appears.
- Distance displays in the selected unit.
- Continue works.
- Final result works.

### Daily
- Daily starts/resumes correctly where testable.
- Correct authoritative Daily is used on non-local environments.
- Scoring works normally.
- Progress persists if interrupted.
- Completed Daily cannot be played again.
- Saved Daily result can be reopened.

### Result / Review
- Round result modal appears correctly.
- “Did you know?” fact appears.
- Continue / See final result works.
- Final score is correct.
- Journey list displays all five rounds.
- Individual Review buttons work.
- View all 5 on map works.
- Return/home navigation works.

### Share
- Share CTA wording is correct.
- Share button opens native share sheet where supported.
- Clipboard fallback works on desktop.
- Shared text contains:
  - CornwallTap
  - correct date/mode
  - five result squares
  - correct score
  - challenge line
  - cornwalltap.co.uk
- `share_clicked` analytics is still recorded.

### Statistics
- Statistics screen opens.
- Streaks display.
- Daily history graph displays.
- Miles/km setting still works.
- Back button returns correctly.

## 4. Mobile Test

Always test on a real phone for changes involving:

- saved Daily state
- buttons / tap interactions
- result modal
- share functionality
- responsive layout
- caching/version checks
- map interaction

Check:

- Home layout fits without horizontal scrolling.
- Daily button responds to tap.
- View Today’s Result opens immediately.
- Result modal scrolls correctly.
- Review buttons work.
- Share button opens the phone share sheet.
- Back/home navigation works.
- No control is hidden behind browser chrome or off-screen.

For mobile-only bugs, use a Cloudflare preview branch where possible.

## 5. Daily Challenge Safety Checks

Before deploying any change touching locations, selector logic, `daily.js`, or `game.js` Daily selection:

- Today’s already-live challenge is unchanged.
- Tomorrow’s five locations are known and sensible.
- Round bands are correct:
  - R1 = difficulty 1–2
  - R2 = difficulty 3–4
  - R3 = difficulty 5–6
  - R4 = difficulty 7–8
  - R5 = difficulty 9–10
- Minimum 15 km separation still holds.
- R1–R3 repeat protection remains 19 days.
- R4–R5 repeat protection remains 16 days.
- Repeat protection uses location IDs, not difficulty.
- Practice-only locations remain excluded from Daily.
- Recent locations do not reappear just because their difficulty changed.
- Authoritative `/api/daily` output matches the intended schedule.

## 6. Analytics / D1 Safety Checks

For changes touching analytics:

- No new high-read dashboard query has been introduced.
- Dashboard refresh does not scan raw `game_events` unnecessarily.
- `daily_players` / summary tables are used where intended.
- No accidental duplicate event writes.
- Daily and Practice modes are still distinguished correctly.
- `game_started`, `round_completed`, `game_completed`, and `share_clicked` continue to fire as expected.

## 7. Preview Branch Test

For medium/high-risk changes:

1. Create a branch from latest `main`.
2. Make only the intended change.
3. Test locally.
4. Commit.
5. Publish the branch.
6. Wait for Cloudflare Preview deployment.
7. Test the preview URL on desktop.
8. Test on a real phone where relevant.
9. Only then merge into `main`.

Do not assume preview localStorage matches production; saved Daily results are origin-specific.

## 8. Production Deployment

Before merge:

- Review changed files in Source Control.
- Confirm no unexpected files are included.
- Confirm diff is limited to the intended feature/fix.
- Use a clear commit message.
- Merge into `main`.
- Push/sync.
- Wait for Cloudflare Production deployment to complete.

Immediately after deploy:

- Open cornwalltap.co.uk in a fresh/private tab.
- Confirm home screen loads.
- Confirm `/api/version` returns the expected build if version changed.
- Confirm `/api/daily` still returns the expected Daily.
- Check mobile.
- Check the specific feature that was changed.
- Check one unrelated core path to catch regressions.

## 9. Rollback Rule

If a deployment causes a serious regression:

- Stop making further fixes on top of it.
- Roll back the Cloudflare deployment to the last known-good version.
- Reproduce the issue on a branch.
- Fix and test there.
- Redeploy only after the regression checklist passes.

## 10. Definition of “Safe to Deploy”

A change is ready only when:

- the intended feature works;
- no console errors appear;
- Daily state still behaves correctly;
- saved results still reopen;
- Practice still works;
- final result/review still works;
- Share still works;
- Statistics still works;
- mobile has been checked where relevant;
- no unexpected files are in the diff.

---

## Current Core Invariants

These should be treated as protected unless we deliberately decide to change them:

- Daily Challenge = 5 rounds, max 500 points.
- Same Daily for everyone.
- Daily selection comes from the authoritative Daily API in production.
- R1 1–2, R2 3–4, R3 5–6, R4 7–8, R5 9–10.
- Minimum 15 km separation between Daily locations.
- R1–R3: 19-day same-round protection.
- R4–R5: 16-day shared protection.
- Location IDs carry repeat history even if difficulty changes.
- Localhost may bypass some Daily locking for development.
- Production saved results must reopen without unnecessary network dependency.
- CSV is the source of truth for locations; `locations.js` is generated from it.
