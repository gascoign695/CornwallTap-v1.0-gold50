# CornwallTap — Master Handover Dossier

**Snapshot date:** 29 September 2026  
**Purpose:** Canonical working handover for future CornwallTap development conversations.  
**Repository:** `gascoign695/CornwallTap-v1.0-gold50`  
**Production site:** `https://cornwalltap.co.uk`  
**Current production branch:** `main`  
**Current production code snapshot:** latest `main` commit at the time of this dossier is `0b171d93a45a80aca0cdb1a0430e8faa9e612420` (`fix`, 25 Sep 2026 12:51:55 UTC).

---

# 0. READ THIS FIRST — instructions for any future ChatGPT working on CornwallTap

This document exists because CornwallTap is now a live product with hundreds of Daily players and small mistakes can cause real downtime. A fresh conversation must **not** rely on memory, old snippets, guessed file contents or a previous version of the codebase.

Before proposing or making a change:

1. **Treat the latest deployed `main` branch as the primary code truth.** Pull/sync and inspect the current files before editing.
2. **Use this dossier as product/operational context, not as a substitute for current code.** If the dossier conflicts with current `main`, investigate the change rather than blindly restoring the dossier state.
3. **Do not rewrite large files casually.** CornwallTap is plain HTML/CSS/JavaScript and much of the application lives in `js/game.js`; a “clean rewrite” can silently break Daily state, analytics, sharing, cache/version logic, mobile behaviour or saved results.
4. **Make one small, isolated change at a time.** Branch from current `main`, test locally, publish a Preview branch, test on desktop and a real phone where relevant, then merge only after the regression checklist passes.
5. **The Daily Challenge is the protected core.** Never change an already-live Daily, never regenerate historical Dailies from current difficulty values, never change location IDs, and never weaken saved-attempt/saved-result protections without a deliberate migration plan.
6. **Never deploy a `game.js` release unless all three build values are identical:**
   - `js/game.js` → `clientBuildVersion`
   - `index.html` → `js/game.js?v=...`
   - `functions/api/version.js` → returned `build`

   A mismatch here caused the 25 September 2026 Daily outage. This is now a hard release invariant, not a suggestion.
7. **Do not trust `tools/check_daily.js` in its current state.** As of this snapshot it is stale and conflicts with the current v6c runtime rules. It must be updated before being used as proof that a future Daily schedule is safe.
8. **Do not assume Cloudflare Preview has the production D1 binding.** A previous Preview failed with `Cannot read properties of undefined (reading 'prepare')` because the `DB` binding was absent. Preview is still valuable for client/UI/static testing, but D1-backed functionality must be tested with awareness of environment bindings.
9. **If production breaks badly, rollback first.** Do not stack improvised fixes on top of a broken deployment while hundreds of players are affected.
10. **Reliability currently outranks feature velocity.** The game is retaining well and the core experience is healthy. Protect the existing audience before adding complexity.

## Evidence labels used in this dossier

- **VERIFIED — current repo:** directly confirmed in the current `main` files or GitHub history.
- **VERIFIED — observed:** confirmed from production/D1 output or analytics screenshots supplied by Mike.
- **PROJECT CONTEXT:** established in prior CornwallTap work and operational discussion, but not necessarily encoded in the repo.
- **RECOMMENDATION:** proposed next step, not yet implemented.
- **UNKNOWN / VERIFY:** not captured reliably enough to assert; inspect the live environment before acting.

---

# 1. What CornwallTap is

CornwallTap is a fast, browser-based Cornwall geography game. The central product promise shown on the live site is:

> **Five places. One Cornwall challenge.**

The player is shown five named locations, one per round. They pan/zoom a satellite map and tap where they think each place is. The game reveals the answer, shows the distance, assigns up to 100 points for the round, and produces a final score out of 500.

The landing-page explanation is deliberately simple:

> Five locations. Find them on the map.  
> Zoom and move around, then tap to place your guess.  
> The closer you are, the more points you score.

The product currently has two public modes:

- **Daily Challenge:** the same five locations for everybody, one scored attempt per Cornwall/UK calendar day.
- **Practice Mode:** random five-location games, unlimited plays.

The site also has a local-only draft/test mode used during development when a small draft location set is loaded.

## Product philosophy

The following principles are strongly supported by the current design, code and previous decisions:

- **Low friction.** No login is required. A player can arrive, play immediately and share.
- **A short daily habit, not a long session game.** Five rounds, generally around two minutes for current players, with one meaningful Daily result.
- **Shared experience.** Everyone receives the same Daily, making scores naturally comparable and shareable.
- **Local knowledge should feel rewarding rather than punitive.** Scoring profiles are intentionally more generous for landmarks and natural features where recognising the correct area matters more than tapping an arbitrary exact coordinate.
- **Difficulty should rise through the five rounds.** The round labels intentionally move from “Warm-up” to “The Legend Round”.
- **Replay value comes from Practice, not replaying the scored Daily.** Daily is protected; Practice is unlimited.
- **The core mechanic should remain simple.** Current retention/completion evidence does not suggest a need to make Daily longer or more complicated.
- **Reliability is now a product feature.** With hundreds of regular players, downtime damages habit and trust.

---

# 2. Current system at a glance

## Front end

**VERIFIED — current repo**

- Plain `index.html`, `css/style.css`, `js/game.js`, `js/locations.js`.
- No front-end framework or bundler is required for runtime.
- Leaflet 1.9.4 is loaded from `unpkg.com`.
- Google Poppins font is loaded from Google Fonts.
- Satellite imagery uses an Esri ArcGIS Wayback World Imagery tile endpoint.
- Player state is largely stored in browser `localStorage`.

## Hosting/backend

**VERIFIED — current repo / PROJECT CONTEXT**

- Static site is deployed on **Cloudflare Pages**.
- Server-side endpoints are **Cloudflare Pages Functions** under `functions/api/`.
- Analytics and score comparison use **Cloudflare D1** via a binding named `DB`.
- Production deploys from GitHub `main`.
- Branches can produce Cloudflare Preview deployments.

## Repository

`gascoign695/CornwallTap-v1.0-gold50`

Despite the original “gold50” name, the live data now contains **200 locations**.

Mike’s local working folder was later renamed **“CornwallTap – Live Version”**. The safe workflow established for the project is:

`main` → new branch → small change → local test → Preview → phone test → merge to `main` → production check.

## Core production APIs

- `/api/daily` — authoritative Daily schedule.
- `/api/version` — server build sentinel used by the Daily freshness guard.
- `/api/event` — analytics event writer to D1.
- `/api/analytics` — aggregated admin analytics endpoint.
- `/api/daily-percentile` — live comparison of a Daily score against completed scores for that date.

---

# 3. Project history and evolution

This timeline is reconstructed from Git history and known production events. It is useful because many current guardrails exist specifically because of earlier bugs.

## 5 August 2026 — Gold50 foundation

- `81c9d47049` — **CornwallTap v1.0 Gold50**.
- `8dcdaab23a` — v2.0 release candidate.
- `91c641ecfc` — v2.1 Daily statistics and streaks.

The early product already centred on a Daily Challenge and player habit rather than only free-play geography guessing.

## 6 August — location growth and sharing

- `62280b54f8` — Gold 70 release.
- `a7d9af3f23` — Gold 100 complete; verified locations 91–100.
- `db9db9ebe0` — v2.3.1 Compact Share Update.

## 7 August — public launch and branding

- `3efae9dbd0` — **Launch on cornwalltap.co.uk**.
- `a7edc8664f` — CornwallTap branding/favicons.
- `53b16e0a2d` — share screen update.
- `e6085dcc42` — Apple update.

## 9–12 August — analytics, dashboard and difficulty data

- `09651bae60` — landing page/branding polish.
- `f152ba7751` — brand cleanup/remove remaining emojis from some UI.
- `4a2f64443f` — first gameplay analytics endpoint.
- `a8c3d4e7bb` — client analytics tracking.
- `58232f4cdc` — anonymous browser player IDs.
- `316dc465f7` — fix player analytics DB insert.
- `e46ac8cd0a` / `2aca05a60b` / `5da736e58b` / `fc27889f9c` — analytics API/dashboard work.
- `be5454235c` — clearer start-screen instructions.
- `aa011965b8` — dashboard refocused on Daily Challenge.
- `313ec26f54` — sortable location analytics and difficulty tracking.

## 13 August — Daily selection/version protection

- `680a3ef06f` — Fix Daily Challenge selection and versioning.

This is part of the lineage of the current build freshness guard. The intent was correct: prevent clients from playing a stale Daily. The 25 September incident later demonstrated that the guard itself must be deployed atomically.

## 25 August — richer results, retention, 150 locations

- `5f5da7fe1c` — fix Daily R4/R5 repeat protection.
- `b95b6fd4a3` — all-time location performance analytics.
- `41f2ebdac6` — improved post-round map review.
- `67494c95dd` — end-of-game guess review/map summary.
- `1d301d1ce4` — Daily retention analytics.
- `15713e601e` — expand pool to 150 and improve Daily rotation.
- `aa0d5f96bd` — final tweaks/merge/cache.

## 27–29 August — communication, true-retention experiment, Daily restart loophole

- `3ac5bc9281` — Facebook/contact links.
- `789fb94913` — attempted “true retention” dashboard update.
- `eb495b2e39` — rollback after analytics error.
- `5a926b73fb` — **fix Daily restart loophole with attempt resume**.
- `3635ecf06a` — Daily starts = unique Daily players.

The restart fix is strategically important: in-progress Daily state must survive interruption so reloading cannot be used to restart a scored attempt.

## 1 September — 200 locations and modern statistics

- `c6858b088f` — expand to **200 locations** and Daily selector v5.
- `5eac3b1483` — home-screen Daily streak.
- `67a460d14f` — redesigned player statistics/streak display.
- `c816781196` — Daily score history and Stats v2.
- map/cache refinements followed during the day.

## 2 September — server-authoritative Daily and D1 cost control

- `b5e843c238` — **Make Daily Challenge server-authoritative**.
- `c8fd273dc6` — stale cache server fix.
- `ad632377f2` — Growth v1.
- `6c20197f87` — km/miles toggle.
- `ceaf4c9078` — optimize analytics queries/caching.
- `db77762728`, `7b879bebc6`, `5ff5791a84`, `13e61d22a7`, `f4b468ad83` — successive D1 read optimizations.

A key optimization was introduction of the small `daily_players` lookup so “new vs returning” no longer required scanning all historical `game_events` on each dashboard request.

## 3–5 September — v6c recalibration and authoritative schedule

- `2e8e723fbd` — recalibrate Daily difficulty bands and update authoritative schedule.
- `ceca8d107f` — fix mobile saved Daily result.
- `725f15bb76` — Devon border Easter egg.
- `c8381da53d` — cache bust for Devon update.
- `81da2b6ffd` — recalibrate locations and update Daily schedule.

The current selector is **v6c**, with historical ID-based protection so difficulty recalibration cannot accidentally make a recently used place eligible again.

## 18–20 September — press-driven growth

**VERIFIED — observed / PROJECT CONTEXT**

CornwallTap received a major press-driven traffic spike. Before press coverage, Daily usage was roughly **35–50 players/day**. On 19 September, the game reached **1,263 Daily players**.

The following days demonstrated that the spike created a much larger retained audience rather than disappearing completely.

## 21 September — session safety and challenge-date fix

- `79a65217db` — **Fix Daily session safety and challenge date**.

This release added/strengthened:

- `analyticsChallengeDate`, so a Daily attempt remains tied to the date it started even if the clock/date changes.
- date-aware saved-attempt/result keys.
- `dailyStartInProgress`, locking the Daily button synchronously before async version/API checks to prevent rapid-tap duplicate sessions.
- defense-in-depth checks inside `startMode("daily")`.
- correct Daily date in share text, analytics, statistics and resume logic.
- build `20260921-session-safety`.

## 24–25 September — percentile release and production outage

- `ebd9493d12` — Add Daily player percentile comparison.
- `f716d2b0f3` — Load Daily percentile on saved results.
- `5bc7165607` — Bump Daily percentile build cache.
- `0b171d93a4` — one-line fix restoring build alignment.

This sequence caused the most important production lesson so far; see the incident report in Section 17.

---

# 4. Repository/file map — what each important file does

## `index.html`

**VERIFIED — current repo**

Responsibilities:

- page `<head>` metadata, canonical URL, Open Graph/Twitter metadata;
- favicons/manifest;
- Poppins and Leaflet includes;
- core Home, Statistics, Game, Results modal and navigation markup;
- Facebook/contact links;
- script/style cache-busting query strings;
- small inline CSS block for the end-of-game growth/share CTA.

Critical current asset references:

```html
<link rel="stylesheet" href="css/style.css?v=4.8-miles1">
<script src="js/locations.js?v=20260905-recalibration1"></script>
<script src="js/game.js?v=20260925-daily-percentile2"></script>
```

The `game.js` query string is part of the hard build-version invariant.

## `css/style.css`

Core responsive styling for the public app. Treat UI changes as isolated CSS changes where possible rather than mixing them into gameplay logic.

## `js/game.js`

This is the heart of the application and therefore the highest-risk file.

It currently owns:

- game mode selection;
- map setup and map interactions;
- Daily and Practice round selection;
- scoring profiles/interpolation;
- Daily state locking/resume/save;
- local player statistics and streaks;
- result/review UI;
- share formatting and native/clipboard share;
- analytics event creation;
- Daily build freshness/version check;
- Daily percentile UI;
- local-only draft test behaviour;
- Devon Easter egg.

Because so much logic is concentrated here, do **not** replace the whole file to implement a small feature.

Current header still labels it `CornwallTap v2.3.1 - Delight Update`; that comment is historical and does not represent the full modern feature version.

## `js/locations.js`

Generated runtime location dataset. Current file contains **200 locations**.

Its first lines say:

```js
// GENERATED FILE - DO NOT EDIT MANUALLY
// Source: data/locations.csv
```

The first instruction is correct: **do not edit this file manually**.

The second line is stale relative to the actual repo: the current master CSV is named `data/cornwalltap_200_locations_MASTER_v6c_2026-09-03_2.csv`. See technical debt.

## `data/cornwalltap_200_locations_MASTER_v6c_2026-09-03_2.csv`

Current 200-location master data file in the repo. Columns include:

`ID, Name, Category, Difficulty, Score Profile, Latitude, Longitude, Tolerance (km), Fact, Status, Region, Parish, Alternate Names, Tags, Last Reviewed, Notes, Daily Pool Recommendation, Review Reason`

The regression checklist states that the CSV is the **source of truth** and `locations.js` is generated from it.

## `tools/build_locations.html`

Browser-based CSV validator/converter that generates `locations.js`.

It validates, among other things:

- IDs/data fields;
- difficulty as integer 1–10;
- accepted score profiles;
- status as Draft / Verified / Live.

Its instructions still refer to `data/locations.csv`, which is not the current filename. This must be cleaned up before the next location-data workflow to reduce the chance of editing the wrong file.

## `functions/api/daily.js`

**Authoritative production Daily schedule.**

Contains `DAILY_BY_DATE`, a hard-coded mapping from date to exactly five location IDs. In production, `game.js` fetches this endpoint; the browser does not independently decide the Daily.

The current schedule starts at `2026-09-02` and extends through **`2027-09-02`**.

Operational consequence: the schedule must be extended **before 3 September 2027**, otherwise `/api/daily` will return 404 and the Daily will be unavailable.

## `functions/api/version.js`

Tiny no-store endpoint returning the production build string.

Current value:

```js
build: "20260925-daily-percentile2"
```

It exists to make sure a stale browser does not begin the Daily with mismatched client logic.

## `functions/api/event.js`

POST endpoint for D1 analytics writes. Inserts events into `game_events` and maintains `daily_players` for first-ever Daily date.

## `functions/api/analytics.js`

Aggregated admin analytics endpoint. It:

- supports selected report dates;
- calculates Daily audience, completion, score, median duration, sharing;
- calculates seven-day new/returning activity;
- calculates Day-1 retention and multi-Daily milestones;
- calculates Daily vs Practice mode usage;
- caches today for 120 seconds and historical dates for 3600 seconds;
- offers `?debug=1` to bypass cache and return D1 `rows_read` diagnostics.

## `functions/api/daily-percentile.js`

Calculates the player’s score percentile against `game_completed` Daily scores for a date. Minimum sample = 20.

## `admin/analytics.html`

Admin analytics dashboard. It is marked `noindex,nofollow`, but there is **no application-level authentication code in the repo**.

**UNKNOWN / VERIFY:** Cloudflare Access or another external protection may exist outside the repo. Never assume `/admin/analytics.html` is private merely because search engines are told not to index it.

## `CornwallTap_REGRESSION_DEPLOYMENT_CHECKLIST.md`

The project’s formal deployment/regression checklist. It is already strong and should be used for every meaningful code change.

It now needs one explicit post-incident improvement: the version requirement should state the **three-way** equality (`game.js`, `index.html`, `version.js`) and preferably be enforced automatically.

## `tools/check_daily.js`

**DO NOT RELY ON THIS CURRENTLY.** It is stale.

As of 29 Sep it conflicts with the live v6c rules in several ways:

- its R5 band is `[7,10]` instead of current `9–10`;
- it excludes `[20,45,46,47,50]` whereas current runtime excludes only `[45,46,47]`;
- it uses `r45Protect = 12`, while current runtime uses 16 days;
- it models older v3/v4 selector generations, not current v6c.

This tool is historical residue and is a safety risk if a future chat assumes “the checker passed, therefore the schedule is valid.” Update or replace it first.

## Spreadsheet files

- `cornwall tap location stats.xlsx`
- `cornwall tap social sharing.xlsx`

These are manual/historical analysis assets, not runtime dependencies.

---

# 5. Hosting, architecture and data flow

## Production request flow

A normal Daily start works approximately like this:

1. User loads `index.html`, `locations.js`, `game.js` and styles.
2. Home screen reads local saved Daily result/attempt and statistics.
3. On Daily button tap:
   - completed saved result is opened locally without network dependency;
   - otherwise `dailyStartInProgress` locks further taps;
   - `currentBuildBeforeDaily()` calls `/api/version` with cache bypass;
   - if client and server build match, proceed;
   - if there is an in-progress attempt, resume it;
   - otherwise fetch `/api/daily?date=YYYY-MM-DD`;
   - only after the authoritative Daily succeeds does a new session start and `game_started` analytics fire.
4. Each map guess produces a score and `round_completed` event.
5. After Round 5, local Daily statistics are recorded.
6. The final summary saves the Daily result, clears the in-progress attempt, sends `game_completed`, and calls `/api/daily-percentile`.
7. Sharing sends `share_clicked` when the player presses the share action.

## Why Daily is server-authoritative

The same five places must be served to everybody. The browser contains selector code for localhost/testing/history, but production uses `/api/daily` as the source of truth.

This decouples a deployed schedule from subtle differences in client cache, location recalibration or selector implementation.

## Cloudflare D1

Runtime functions refer to `context.env.DB`, so the binding is named **`DB`**.

**UNKNOWN / VERIFY:** D1 database name, account identifiers, exact table DDL, migrations, indexes and Cloudflare Pages project settings are not stored in this repo snapshot. They should be documented/version-controlled in future.

---

# 6. Daily Challenge rules and invariants

## Public gameplay

- 5 rounds.
- 100 points maximum each.
- 500 total maximum.
- Same five locations for all players for a given Europe/London date.
- One scored attempt/day per browser local state.
- Interrupted attempts resume rather than restart.
- Completed Daily reopens as a saved result rather than starting again.

## Daily round difficulty bands

Current protected bands:

| Round | Difficulty | UI stage |
|---|---:|---|
| 1 | 1–2 | Warm-up |
| 2 | 3–4 | Finding your feet |
| 3 | 5–6 | Local knowledge |
| 4 | 7–8 | Expert territory |
| 5 | 9–10 | The Legend Round |

## Current Daily exclusions

Runtime `dailyExcludedLocationIds`:

- ID 45 — Trethevy Quoit — difficulty 9
- ID 46 — King Doniert’s Stone — difficulty 10
- ID 47 — Dupath Well — difficulty 10

These remain available to Practice unless separately excluded there; Practice currently has no equivalent exclusion list.

## Daily schedule endpoint

`/api/daily` uses Europe/London date. It accepts an optional date parameter and returns:

```json
{
  "ok": true,
  "date": "YYYY-MM-DD",
  "location_ids": [1,2,3,4,5]
}
```

Responses are `no-store`.

## Current day example — 29 September 2026

Current authoritative IDs:

`[98,82,106,118,20]`

Which map to:

1. Tresco — difficulty 2
2. St Columb Major — difficulty 4
3. Trebarwith Strand — difficulty 6
4. Portscatho — difficulty 7
5. Lanyon Quoit — difficulty 10

This correctly follows the 1–2 / 3–4 / 5–6 / 7–8 / 9–10 structure.

---

# 7. Daily selector v6c — constraints and historical protection

The selector logic remains in `game.js` mainly for localhost/testing and schedule generation reasoning. Production itself follows the hard-coded server schedule.

Current constants:

```text
dailyV6SelectorVersion        = v6c
dailyV6EpochKey               = 2026-09-06
frozenDailyHistoryStartKey    = 2026-08-14
dailyRepeatProtectionDays     = 19
dailyR45RepeatProtectionDays  = 16
dailyMinimumSeparationKm      = 15
```

## Frozen real history

The real Daily challenges from **14 August through 5 September 2026** are frozen by **location ID**, not rebuilt from current location difficulty.

This is critical. Difficulty values can change after player-performance calibration. If historical Dailies were regenerated by today’s difficulty bands, a recently used location could appear to have no history in its new band and be selected again too soon.

## Repeat protection

Current runtime implementation protects recent **location IDs globally**:

- R1–R3: last 19 Daily challenges.
- R4–R5: last 16 Daily challenges.

R4/R5 are especially constrained because the hard-location pool is smaller.

## 15 km separation rule

All five locations in a Daily must be at least **15 km apart** from one another.

## Backtracking/build order

The selector places rounds in this order:

`R5 → R1 → R2 → R4 → R3`

or indexes `[4,0,1,3,2]`.

R5 goes first because its eligible pool is the smallest. Backtracking allows easier rounds to move around a constrained hard-round choice instead of weakening repeat/separation rules.

## Rules for future schedule work

- Never change an already-live Daily.
- Never change location IDs.
- Never regenerate frozen history from current difficulties.
- A difficulty recalibration must preserve repeat history by ID.
- Check tomorrow’s five manually before deployment.
- Validate every future scheduled day against current location data, bands, exclusions, repeat history and 15 km separation.
- Replace/update `tools/check_daily.js` before using automated schedule validation.

---

# 8. Practice Mode

Practice intentionally has far fewer restrictions than Daily.

- Unlimited games.
- Five random locations.
- Uses the same round difficulty bands as Daily.
- Prevents a duplicate location **within the current Practice game** via `practiceUsedIds`.
- Does not maintain cross-game repeat protection.
- Does not use the authoritative Daily schedule.
- Practice completion increments the local `practiceCompleted` count only.
- Practice does **not** change Daily averages, Daily total score, perfect-round total, distance totals or Daily streak.

Current analytics indicate that Practice has strong depth among the people who use it. For example, on 28 Sep only 61 unique Practice players generated 499 starts and 445 completions — roughly 8 starts per Practice player. That suggests the underlying mechanic has replay value beyond maintaining a Daily streak.

---

# 9. Location data, difficulty and calibration

## Current location count

**200 locations.**

## Current difficulty distribution

| Difficulty | Count |
|---:|---:|
| 1 | 7 |
| 2 | 22 |
| 3 | 12 |
| 4 | 29 |
| 5 | 29 |
| 6 | 24 |
| 7 | 33 |
| 8 | 12 |
| 9 | 24 |
| 10 | 8 |

R5 has the smallest combined pool (9–10 = 32 before exclusions), which explains why hard-round repeat protection is the tightest scheduling constraint.

## Region distribution

| Region | Count |
|---|---:|
| West Cornwall | 43 |
| Mid Cornwall | 70 |
| North Cornwall | 35 |
| East Cornwall | 44 |
| Isles of Scilly | 8 |

## Largest categories

- Village — 66
- Town — 26
- Beach — 13
- Harbour — 11
- Natural Feature — 11
- Historic Building — 9
- Headland — 8
- Cove — 8
- Island — 7
- Castle — 6
- Landmark — 6
- Prehistoric Monument — 6

## Important distinction: difficulty vs scoring

Difficulty determines **where a location can appear in the five-round progression**.

It does **not** currently multiply or change distance scoring. `difficultyDistanceMultiplier()` returns `1`.

Actual scoring sensitivity comes from:

- the location’s `scoreProfile`;
- its `tolerance` (perfect-score radius).

This separation is deliberate and useful: a location can move between round difficulty bands based on real player performance without changing how a correct/nearby guess is scored.

## Current score-profile distribution

| Profile | Locations |
|---|---:|
| settlement_standard | 71 |
| natural_remote | 32 |
| landmark_standard | 26 |
| natural_standard | 23 |
| settlement_easy | 21 |
| landmark_remote | 18 |
| landmark_easy | 9 |

## Data pipeline

Safe location-data workflow should be:

1. Edit the master CSV, not `locations.js`.
2. Preserve existing IDs.
3. Save CSV UTF-8.
4. Validate/generate using `tools/build_locations.html`.
5. Replace generated `js/locations.js`.
6. Update its cache-buster in `index.html` when necessary.
7. Revalidate the authoritative future Daily schedule against the updated data.
8. Confirm no recently used IDs become unintentionally eligible due to difficulty changes.
9. Preview/test Practice, Daily, facts, map coordinates and mobile.

Before the next location update, first fix the stale `data/locations.csv` references in the generator/generated-file comment so there is only one clearly documented source-of-truth filename.

---

# 10. Scoring system

Each round is worth 0–100 points.

## Perfect score

If distance from guess to answer is less than or equal to the location’s `tolerance`, score = **100**.

Outside tolerance, score is linearly interpolated between profile thresholds and capped to 99 until the zero-score distance.

## Profiles

### `settlement_easy`

| km | score |
|---:|---:|
| 0.8 | 97 |
| 1.8 | 93 |
| 3.5 | 82 |
| 6 | 65 |
| 10 | 40 |
| 16 | 15 |
| 20 | 0 |

### `settlement_standard`

| km | score |
|---:|---:|
| 1 | 97 |
| 2 | 93 |
| 4 | 82 |
| 7 | 65 |
| 12 | 40 |
| 18 | 15 |
| 22 | 0 |

### `landmark_easy`

| km | score |
|---:|---:|
| 1.2 | 97 |
| 2.5 | 92 |
| 5 | 82 |
| 9 | 68 |
| 14 | 48 |
| 22 | 25 |
| 35 | 10 |
| 50 | 0 |

### `landmark_standard`

| km | score |
|---:|---:|
| 1.5 | 97 |
| 3 | 92 |
| 6 | 82 |
| 10 | 70 |
| 16 | 52 |
| 25 | 35 |
| 35 | 25 |
| 50 | 15 |
| 65 | 0 |

### `landmark_remote`

| km | score |
|---:|---:|
| 2 | 97 |
| 4 | 92 |
| 8 | 82 |
| 14 | 68 |
| 22 | 50 |
| 35 | 32 |
| 50 | 20 |
| 65 | 10 |
| 80 | 0 |

### `natural_standard`

| km | score |
|---:|---:|
| 2 | 97 |
| 4 | 92 |
| 8 | 82 |
| 14 | 68 |
| 22 | 50 |
| 32 | 35 |
| 45 | 22 |
| 60 | 10 |
| 75 | 0 |

### `natural_remote`

| km | score |
|---:|---:|
| 2.5 | 97 |
| 5 | 92 |
| 10 | 82 |
| 18 | 68 |
| 28 | 50 |
| 42 | 34 |
| 58 | 20 |
| 75 | 10 |
| 90 | 0 |

## Final score titles

| Total | Title |
|---:|---|
| 450–500 | Kernow Legend |
| 350–449 | Cornwall Expert |
| 250–349 | Local Guide |
| 150–249 | Adventurer |
| 0–149 | Explorer |

## Round result feedback

- 100 — Perfect
- 90+ — Excellent
- 75+ — Great knowledge
- 60+ — Good local knowledge
- 40+ — Good guess
- 20+ — Roughly right
- 1–19 — Not this time
- 0 — One to remember

Do not casually alter scoring thresholds based on one unusual Daily. Use sufficient location-level performance data and consider score profile/tolerance separately from difficulty placement.

---

# 11. Map and UI/UX behaviour

## Map

Current map setup:

- Leaflet.
- start centre: **Lanivet** `[50.44437, -4.76287]`.
- start zoom: `9`.
- min zoom: `8`.
- max zoom: `18`.
- max bounds approx SW `[49.40,-7.20]`, NE `[51.02,-3.85]`, allowing Cornwall + Scilly plus enough surrounding area to interact naturally.
- Esri satellite imagery.

After a guess, the game shows:

- player guess marker;
- answer marker;
- line between guess and answer;
- tolerance circle where appropriate;
- fit-to-bounds view.

## Devon Easter egg

A conservative polygon based on published Cornwall boundary points detects clicks clearly across the Devon border. It uses a ~1.5 km dead zone around the border to avoid mislabelling borderline taps.

Message:

> 🚨 Devon alert! You've crossed the border. Get back to Cornwall!

## End-of-round and final review

The game stores enough review data to revisit each guess, including guess/answer coordinates, score, distance, round and location. The final result can show the five-round journey and map reviews, including “View all 5 on map”.

## Share experience

Current Daily share text format is approximately:

```text
CornwallTap • 29 Sep
95🎯 82🟢 64🟡 45🟠 18🔴
304/500 • Local Guide
Think you can beat my score?
cornwalltap.co.uk
```

Round symbol thresholds:

- 95+ `🎯`
- 80+ `🟢`
- 60+ `🟡`
- 40+ `🟠`
- otherwise `🔴`

The final-result card also contains a prominent CTA:

> Think your friends can beat [score]?  
> Share your score  
> Challenge your friends and see who knows Cornwall best.

Native `navigator.share` is used where available; clipboard fallback is used on desktop.

Important analytics nuance: `share_clicked` fires when the Share action is pressed, **before** confirmation that the native share sheet was completed. “Shares” in the dashboard are therefore best interpreted as **share intent/clickers**, not guaranteed delivered messages/posts.

---

# 12. Browser local state and statistics

CornwallTap intentionally uses browser-local identity/state rather than accounts.

## Key localStorage keys

- `cornwallTapAnalyticsPlayerId` — anonymous browser player UUID.
- `cornwallTapStatistics-v3-profile-pipeline` — player statistics.
- `cornwallTapDistanceUnit` — `km` or default miles.
- `cornwallTapDailyResult-YYYY-MM-DD` — completed Daily result.
- `cornwallTapDailyAttempt-YYYY-MM-DD` — in-progress Daily attempt.

## Anonymous player identity caveat

A “player” in analytics is a browser-local ID, **not a verified unique human**.

A person can appear as multiple players if they:

- use different devices;
- use different browser profiles;
- clear local storage;
- use private browsing.

Conversely, shared browser storage can represent multiple people as one ID.

This limitation should be remembered when describing retention figures externally.

## Statistics fields

Current local stats include:

- games played / Daily completed;
- Practice games completed;
- total Daily score / average / best;
- perfect rounds;
- total distance and guesses;
- current and longest Daily streak;
- Daily rounds ≥75;
- zero-score Daily rounds;
- round score totals/count;
- Daily score history;
- last Daily date.

Daily history stores the last **90** entries; the visible score-history graph uses the last **30** Dailies.

## Distance units

Default display is miles. Player can select km. Underlying stored distances/analytics remain km.

## Daily streak

Streak follows Europe/London calendar dates and increments only on consecutive completed Dailies. Practice never changes it.

## Daily attempt resume

Saved in-progress attempt stores:

- date;
- accumulated score;
- round scores;
- round distances;
- round location names;
- round review data;
- analytics session ID;
- original start timestamp.

On resume, the same session ID and start time are restored so analytics do not create a new Daily session just because the tab/browser was interrupted.

---

# 13. Analytics event model and D1 data

## `game_events`

The runtime requires/uses these columns:

- `created_at` — seen in production D1 queries; exact default definition not stored in repo.
- `event_type`
- `game_mode`
- `challenge_date`
- `session_id`
- `player_id`
- `device_type`
- `final_score`
- `duration_seconds`
- `round_number`
- `location_name`
- `location_category`
- `location_difficulty`
- `round_score`
- `distance_km`

**UNKNOWN / VERIFY:** exact SQL types, primary key, indexes and timestamp default are not version-controlled in this repository.

The client currently does **not** send `location_difficulty`, although the API accepts/stores it. The admin page instead attempts to recover current difficulty from `locations.js` by location name.

## Event types

### `game_started`

Sent once a new game session actually starts. For a new production Daily, this occurs after the authoritative Daily has successfully loaded.

### `round_completed`

Sent after each guess, containing:

- round number;
- location name/category;
- round score;
- distance in km (3 decimal places in client payload).

### `game_completed`

Sent when the final summary is shown, with final score and duration.

### `share_clicked`

Sent when Share is pressed, with score/duration.

## `daily_players`

A compact lookup used to avoid expensive historical scans.

Known columns:

- `player_id`
- `first_daily_date`

On each Daily `game_started`, `/api/event` performs `INSERT OR IGNORE`. A historical backfill was performed when this approach was introduced.

**UNKNOWN / VERIFY:** exact DDL/unique constraint and backfill script are not present in the repo.

## Analytics write behaviour

Localhost/127.0.0.1 deliberately sends no production analytics.

The write is fire-and-forget from the browser with `keepalive: true`; analytics failure is warned in console rather than breaking gameplay.

---

# 14. Dashboard metric definitions — exact meanings

These definitions matter because the labels are easy to misinterpret.

## Unique Daily players

Distinct `player_id` with a Daily `game_started` on the report date.

## Daily games started

Distinct Daily `session_id` with `game_started` on the report date.

Because restart/duplicate protections are now strong, Daily players and Daily starts commonly match.

## Players completing all 5

Distinct Daily players who recorded a `round_completed` event for Round 5.

This intentionally does **not** require `game_completed`, because a player has objectively made all five guesses even if they close the page before clicking through to the final summary.

## Completion rate

`players with Round 5 / unique Daily starters`.

## Average Daily score

Average `final_score` from `game_completed` events, not Round-5 completion events.

This creates a small possible denominator difference from “players completing all 5”.

## Typical Daily game time

Median `duration_seconds` from Daily `game_completed` events.

Median is used instead of mean so abandoned/open tabs do not dominate the headline.

## Shares / Daily share rate

“Shares” = distinct Daily `player_id` with `share_clicked` on the report date.

Share rate = distinct sharers / distinct players completing Round 5.

Again, this measures Share button usage/intention, not proven delivery.

## New players

Daily starter whose `daily_players.first_daily_date` equals report date.

## Returning players

Daily starter whose first Daily date is earlier than report date.

## Returning share

Returning starters / all unique Daily starters for the date.

This is **not** the same as next-day retention.

## Day-1 retention

Of the unique Daily players who started on the previous calendar day, the percentage who started another Daily on the selected report date.

This is the clean next-day cohort measure.

## 2+ / 3+ / 5+ / 7+ Daily completions

Number of player IDs that have completed Round 5 on at least that many distinct Daily dates up to the selected date.

## Daily vs Practice

For each `game_mode`, the dashboard counts:

- distinct player starters;
- distinct session starters;
- distinct sessions that recorded Round 5.

## Analytics cache

- current day: 120 seconds;
- historical date: 3600 seconds;
- `?debug=1`: bypass cache and include rows-read diagnostics.

---

# 15. Admin dashboard technical note

`admin/analytics.html` still contains a **Location performance** table and client-side logic to render `data.locations`.

However, `functions/api/analytics.js` stopped returning location aggregates on 2 September to reduce D1 reads (`db77762728` and subsequent optimization work).

Therefore this section is effectively empty/stale in the current production code.

This is not a reason to reintroduce an expensive raw-table query casually. Options for future cleanup:

1. remove/hide the stale Location performance panel; or
2. create an intentionally efficient summary table/materialized approach; or
3. provide a separate on-demand endpoint with appropriate caching/cost controls.

Do not undo the D1 cost optimizations simply because the old HTML remains.

---

# 16. Daily percentile feature

Introduced 24–25 September 2026.

## Endpoint

`GET /api/daily-percentile?date=YYYY-MM-DD&score=N`

Validation:

- date required;
- numeric score required;
- score must be 0–500.

Query source:

- Daily `game_completed` events;
- same `challenge_date`;
- non-null `final_score`.

## Minimum sample

20 completed `game_completed` Daily scores.

Before that the player sees:

> 🌅 Early bird! Player comparisons will appear as more scores come in.

## Formula

Uses mid-rank handling for ties:

`percentile = round(100 × (lower_count + 0.5 × equal_count) / completion_count)`

Display:

> 🏆 You beat **X%** of players so far today.

## Live nature

The percentile is explicitly “so far today”. It can change as more scores arrive.

## Saved results

Commit `f716d2b0f3` added percentile loading when reopening a saved Daily result, not only immediately after completion.

## Denominator nuance

The dashboard defines “completed all 5” using Round 5 completion, while percentile samples use `game_completed`. Therefore a player can count as a completed Daily on the dashboard without contributing a final score to percentile if they never reach the final-summary event.

This is acceptable but should be remembered if counts differ slightly.

---

# 17. INCIDENT REPORT — Daily outage, Friday 25 September 2026

This incident must remain in the handover because it defines the most important deployment guardrail.

## What happened

A Daily percentile release changed the server build and HTML cache-buster but failed to change the build constant **inside `game.js` itself**.

Exact sequence:

### 24 Sep 19:03 UTC — `ebd9493d12`

**Add Daily player percentile comparison.**

Added the percentile endpoint and client result UI.

### 25 Sep 08:40 UTC — `f716d2b0f3`

**Load Daily percentile on saved results.**

### 25 Sep 09:27 UTC — `5bc7165607`

**Bump Daily percentile build cache.**

This changed:

- `functions/api/version.js` from `20260921-session-safety` → `20260925-daily-percentile2`;
- `index.html` `game.js?v=` from the old session-safety value → `20260925-daily-percentile2`.

But it did **not** change:

- `js/game.js` → `clientBuildVersion`, which remained `20260921-session-safety`.

## Why that broke Daily but not Practice

Before a new Daily begins, `currentBuildBeforeDaily()` fetches `/api/version` no-store.

If server build ≠ client build, it adds `?build=<serverBuild>` to the page URL and reloads to try to force a fresh page/assets.

Because the newly loaded `game.js` still declared the old build, the mismatch was permanent:

```text
server: 20260925-daily-percentile2
client: 20260921-session-safety
```

Reloading could never resolve it. New Daily starts were effectively blocked/reload-looped.

Practice does not run the Daily build freshness check, so Practice continued working.

## Fix

### 25 Sep 12:51:55 UTC — `0b171d93a45a80aca0cdb1a0430e8faa9e612420`

One-line commit `fix`:

```diff
- const clientBuildVersion = "20260921-session-safety";
+ const clientBuildVersion = "20260925-daily-percentile2";
```

## Recovery evidence

Production D1 showed a fresh Daily:

`game_started` at **2026-09-25 12:53:01**.

The last normal completed Daily visible before the outage period was at **09:30:12**.

Therefore the defensible observed gap was up to:

**3 hours 22 minutes 49 seconds — approximately 3h23m.**

The actual unavailable period may have been slightly shorter depending on exact Cloudflare deployment completion and which clients had which cached page.

## User impact

- The outage hit a Friday morning, a valuable acquisition/sharing period.
- A user later emailed saying Daily still did not work; by then starts were already rising strongly, so that report was likely an old tab/stale session. A normal refresh/close-reopen was the appropriate first response.
- Mike posted on the CornwallTap Facebook page to tell people it was working again and encourage retries.
- Daily recovered to **458 players** by end of day despite the outage.

## What did *not* break

- Practice continued.
- Stored completed Daily results remained local/reopenable.
- D1/analytics itself was not the root cause.
- The authoritative Daily schedule was still valid.

## Permanent lesson

The build freshness mechanism itself can become a single point of failure if its values are manually updated inconsistently.

From now on the release invariant is **three-way equality**:

```text
js/game.js                   clientBuildVersion
index.html                   js/game.js?v=
functions/api/version.js     build
```

All three must be the exact same build token.

## Required prevention

**RECOMMENDATION — highest priority maintenance change:** add an automated build guard that exits non-zero if any of those values is missing or mismatched.

Suggested implementation shape:

- `tools/check_build_version.js`
- read the three files;
- extract the three version strings;
- print the values;
- fail with a clear message on mismatch;
- run it before any production deployment and, ideally, in GitHub Actions or the Cloudflare build command once that integration is configured deliberately.

Do not rely on human memory — including ChatGPT’s memory — for this again.

---

# 18. Cloudflare Preview D1 limitation

A previous Preview branch produced:

> `Cannot read properties of undefined (reading 'prepare')`

The cause was the Preview environment missing the production `DB` D1 binding, not necessarily bad application code.

## Practical consequences

- Cloudflare Preview remains excellent for HTML/CSS/client JS/mobile layout/state testing.
- D1-backed Functions such as `/api/event`, `/api/analytics` and `/api/daily-percentile` may fail if the Preview binding is absent.
- Do not “fix” production code to compensate for a Preview-only missing binding.
- If D1-dependent Preview testing becomes important, configure an explicit safe Preview D1 binding/environment rather than pointing casually at production data.
- Production and Preview have different origins, so their `localStorage` states differ. A completed Daily on production will not automatically exist on a Preview URL.

---

# 19. Build/version/cache guardrails

## Current values — must remain aligned

As of this snapshot:

```text
js/game.js clientBuildVersion      20260925-daily-percentile2
index.html game.js?v=              20260925-daily-percentile2
/api/version build                 20260925-daily-percentile2
```

## Current version-check behaviour

Before new Daily play:

1. fetch `/api/version?t=<timestamp>` with `cache: no-store`;
2. validate response;
3. if server build matches client build, continue;
4. if mismatch, reload page with `?build=<serverBuild>`;
5. if version endpoint itself errors, log warning and **fail open** so the version service alone does not block Daily.

That fail-open decision is intentional because the authoritative `/api/daily` still protects which five locations are played.

## Cache-busting principles

- Whenever `game.js` materially changes, bump its `index.html` query token and matching build values.
- Whenever `locations.js` changes, bump its query token.
- Do not change cache strings independently without understanding the freshness path.
- Test on a real phone, including an existing browser tab and a fresh/private load, because mobile browser cache behaviour can expose issues desktop testing misses.

---

# 20. Safe development/deployment workflow

This reflects the established project workflow and the repo checklist.

## Before editing

- Sync/pull latest `main`.
- Confirm branch and working tree.
- Inspect exact current implementation of the feature being changed.
- Create a temporary branch for anything beyond trivial copy.
- Keep the change narrow.
- Do not use an older whole-file replacement as the base.

## Local desktop smoke test

### Home

- loads normally;
- no unexpected layout changes;
- no console errors;
- correct Daily button state: Play / Continue / View Result;
- Statistics opens.

### Practice

- game starts;
- location/map loads;
- map tap submits;
- answer/line/score appears;
- distance unit displays correctly;
- Continue works;
- final result works.

### Daily

- correct Daily starts/resumes;
- production/non-local test uses authoritative API;
- progress persists after interruption;
- completed Daily cannot restart;
- saved result reopens.

### Results/review

- round modal;
- fact/feedback;
- final score;
- five-round journey;
- individual Review;
- View all 5;
- back navigation.

### Share

- correct Daily date;
- five result scores/symbols;
- correct total/title;
- challenge line/domain;
- native share or clipboard fallback;
- analytics still fires where applicable.

### Statistics

- streak;
- score history;
- units;
- back navigation.

## Real-phone test

Mandatory for changes touching:

- Daily saved state;
- taps/buttons;
- modal scrolling;
- share sheet;
- responsive layout;
- caching/versioning;
- map interaction.

## Preview branch

1. Branch from latest main.
2. Make the intended small change.
3. Local test.
4. Commit and publish branch.
5. Wait for Cloudflare Preview.
6. Desktop test.
7. Real-phone test where relevant.
8. Remember D1 binding limitation.
9. Merge only after passing checks.

## Before merge

- inspect changed-file list;
- inspect diff, not just final visual result;
- make sure no unrelated file changed;
- for any `game.js` release, run the three-way build-version check;
- if Daily selection/location changes, verify today unchanged and tomorrow sane.

## Production smoke test — immediately after deployment

At minimum:

- open `cornwalltap.co.uk` fresh/private;
- confirm Home;
- call/check `/api/version` build;
- call/check `/api/daily` for today;
- test the changed feature;
- test one unrelated core path;
- check on mobile;
- if analytics were touched, confirm fresh event rows begin appearing as expected.

For high-risk Daily releases, it is worth querying D1 shortly after deploy to confirm a new `game_started` and `round_completed` sequence rather than waiting for user reports.

## Rollback rule

If a deployment causes a serious regression:

1. stop adding fixes directly on top of broken production;
2. rollback Cloudflare to the last known-good deployment;
3. reproduce on a branch;
4. fix and test there;
5. redeploy only after regression checks pass.

The 25 September outage is the reason this must be taken seriously.

---

# 21. Current audience, growth and retention position

## Before the press spike

**PROJECT CONTEXT / observed historical baseline:** roughly **35–50 Daily players/day**.

## Press spike and subsequent audience

| Date | Daily players | New | Returning | Returning share |
|---|---:|---:|---:|---:|
| 19 Sep | 1,263 | 1,093 | 170 | 13.5% |
| 20 Sep | 895 | 582 | 313 | 35.0% |
| 21 Sep | 771 | 379 | 392 | 50.8% |
| 22 Sep | 717 | 298 | 419 | 58.4% |
| 23 Sep | 646 | 197 | 449 | 69.5% |
| 24 Sep | 628 | 204 | 424 | 67.5% |
| 25 Sep* | 458 | 73 | 385 | 84.1% |
| 26 Sep | 428 | 79 | 349 | 81.5% |
| 27 Sep | 460 | 89 | 371 | 80.7% |
| 28 Sep | 462 | 76 | 386 | 83.5% |

`*` 25 Sep is outage-affected and should not be treated as a clean traffic comparison day.

The key strategic interpretation is that the one-off press acquisition spike fell away, but the remaining audience stabilised around the mid-400s by 26–28 September — roughly **9–13× the old 35–50 baseline**.

## Clean weekend/Monday quality indicators

| Metric | 26 Sep | 27 Sep | 28 Sep |
|---|---:|---:|---:|
| Daily players | 428 | 460 | 462 |
| Completed all 5 | 409 | 437 | 437 |
| Completion rate | 95.6% | 95.0% | 94.6% |
| Avg Daily score | 330.3 | 329.1 | 332.0 |
| Median time | 1m59s | 1m54s | 1m46s |
| Share rate | 24.2% | 24.7% | 23.1% |
| Day-1 retention | 52.2% | 58.9% | 57.2% |

Two consecutive clean D1 retention readings around **57–59%** are particularly encouraging.

## Habit depth by 28 September

- 2+ Daily completions: **1,093** players
- 3+: **738**
- 5+: **421**
- 7+: **266**

The 7+ cohort is important: these are not merely press-click visitors who returned once; hundreds have developed repeated behaviour.

## Sharing

- 25 Sep: 89 share clickers / 20.6%
- 26 Sep: 99 / 24.2%
- 27 Sep: 108 / 24.7%
- 28 Sep: 101 / 23.1%

Roughly one in four completed Daily players is pressing Share on clean recent days.

## Strategic reading

The immediate problem is **not core-game retention**. The core is showing:

- ~95% completion;
- ~2-minute median play time;
- >80% returning share;
- ~57–59% next-day retention on recent clean days;
- strong repeated completion cohorts;
- stable share intent around 23–25%.

The next growth challenge is **acquisition/attribution**, not making Daily longer or more complicated.

---

# 22. Known bugs, technical debt and operational risks

## 1. No automated build-version guard yet

**Severity: high. Priority: highest.**

The 25 Sep outage can recur if the three build values diverge.

Implement a script/CI guard before significant feature work.

## 2. `tools/check_daily.js` is stale

**Severity: high if trusted.**

It does not represent v6c rules and could give false confidence.

Update it to validate the actual authoritative `DAILY_BY_DATE` against current `locations.js`, current exclusions, bands, separation and repeat history.

## 3. Location source filename/documentation mismatch

`locations.js` and `tools/build_locations.html` refer to `data/locations.csv`; repo currently stores `data/cornwalltap_200_locations_MASTER_v6c_2026-09-03_2.csv`.

Resolve to one canonical documented filename before next location update.

## 4. D1 schema is not version-controlled

No SQL migration/schema files are present for:

- `game_events`;
- `daily_players`;
- indexes;
- historical backfill.

This makes disaster recovery, onboarding and environment recreation harder.

**RECOMMENDATION:** add a `migrations/` or documented schema snapshot without exposing secrets.

## 5. Admin Location performance UI is stale

HTML remains but API no longer returns `locations`, intentionally removed to control D1 reads.

Either hide/remove or redesign efficiently.

## 6. `location_difficulty` analytics field is accepted but not populated

Endpoint schema includes it, current client round event does not send it. Current location difficulty can change over time, so reconstructing historical difficulty from today’s `locations.js` can be misleading after recalibration.

If historical difficulty-at-play matters, begin sending it prospectively; do not retroactively invent old values.

## 7. Daily schedule horizon ends 2 Sep 2027

A future hard outage will occur on 3 Sep 2027 if the schedule is not extended.

Set a calendar/maintenance reminder well in advance rather than waiting until the final week.

## 8. Admin protection is external/unknown

No auth appears in repo. Verify Cloudflare Access or equivalent before assuming analytics are private.

## 9. Preview D1 binding inconsistency

Preview may not have `DB`; this reduces confidence in D1-backed branch tests.

## 10. Large `game.js`

At ~90 KB and thousands of lines, it is now a concentration of risk. A future modularisation could be valuable, but it should be a deliberately staged refactor with regression coverage — **not** an opportunistic rewrite while adding a feature.

## 11. External front-end dependencies

Leaflet and imagery/font resources are third-party hosted. There is no known current issue, but outage/deprecation risk exists outside CornwallTap’s own code.

---

# 23. Roadmap and parked ideas

These are ordered by current value/risk rather than novelty.

## A. Automated build-version guard — do next

**RECOMMENDATION / agreed priority.**

Create a tiny validation script that compares:

- `clientBuildVersion` in `js/game.js`;
- `game.js?v=` in `index.html`;
- `build` in `functions/api/version.js`.

It must fail loudly on mismatch.

Then decide the safest place to enforce it automatically (GitHub Action and/or Cloudflare build step) after inspecting current deployment settings.

## B. Replace stale Daily checker

Build a current checker that treats `functions/api/daily.js` as authoritative and verifies every scheduled day against the current location master/rules.

It should verify:

- five IDs exist;
- correct round bands;
- no excluded Daily IDs;
- no duplicate ID in a Daily;
- 15 km separation;
- protected repeat windows by global location ID;
- schedule continuity;
- horizon warning.

## C. Version-control D1 schema/migrations

Capture current table/index definitions and backfill requirements so a fresh environment can be recreated reliably.

## D. Improve post-deploy health verification

A safe lightweight post-deploy process could verify:

- `/api/version` expected build;
- `/api/daily` returns today’s five;
- page asset cache-buster matches;
- optionally confirm fresh Daily analytics after deployment.

Avoid a health checker that itself generates fake production player events.

## E. Attributable friend challenge/referral links

This is likely the most interesting growth feature after reliability work.

Current share rate is strong, but there is no attribution from a share click to a recipient visit/play. A challenge/referral URL could answer:

- how many shared links are opened;
- how many recipients start Daily;
- how many complete;
- which share surfaces work best;
- whether friend challenges increase return rate.

Design carefully so the link does not reveal Daily answers or permit a second scored attempt.

## F. Let Daily percentile bed in

Do not immediately stack more result-screen mechanics. Observe engagement, feedback, D1 cost and whether percentile increases sharing/return behaviour.

## G. Themed/heritage rounds — parked idea

Previously discussed as a possible future mode/feature. This should not disturb the normal Daily schedule unless deliberately designed as a separate event/mode.

## H. “Stats vs all players” expansion — partially started by percentile

Could later expand beyond a single percentile, but avoid data-heavy global stats until cost/usefulness are understood.

## I. Growth beyond Facebook/press

The press spike proved external acquisition works. Future work should focus on repeatable acquisition rather than relying on one-off press coverage.

---

# 24. DO NOT BREAK — protected rules and lessons learned

This is the section a fresh chat should re-read immediately before touching production.

## Daily availability

- **Never let the three build identifiers differ.**
- **Never deploy Daily changes without a fresh/private production smoke test.**
- **Never assume Practice working means Daily is working.** The 25 Sep incident proved they can diverge.

## Daily fairness

- Same five places for everyone on the same Europe/London date.
- One scored attempt per day.
- Saved attempt resumes; reload must not grant a restart.
- Saved result reopens locally.
- Production gets Daily IDs from `/api/daily`.

## Daily schedule

- Never change today’s Daily once live.
- Never regenerate historical/frozen Dailies from current difficulty data.
- Never change a location ID.
- Preserve repeat history by ID if difficulty changes.
- Current bands are fixed unless a deliberate product decision changes them.
- Maintain ≥15 km separation.
- R1–R3: 19-day recent-ID protection.
- R4–R5: 16-day recent-ID protection.
- Current Daily-excluded IDs: 45, 46, 47.
- Do not trust the stale `tools/check_daily.js` until updated.

## Player state

- Do not wipe/rename localStorage keys casually.
- Do not make saved completed results depend on a network request.
- Preserve attempt `sessionId`, original `startedAt`, and challenge date on resume.
- If changing storage format, plan a backward-compatible migration.

## Analytics

- Do not add raw all-history scans casually; D1 reads have already required optimization.
- Preserve mode distinction.
- Avoid duplicate event writes.
- Remember dashboard completion = Round 5, while percentile score pool = `game_completed`.
- Remember browser player IDs are not real-person accounts.

## Location data

- Edit CSV source, regenerate JS.
- Do not manually patch `locations.js` and forget the master.
- Keep IDs stable.
- Scoring profile/tolerance and difficulty are separate concepts.

## Deployment discipline

- Latest `main` first.
- Small branch.
- Small diff.
- Local test.
- Preview.
- Real phone.
- Version guard.
- Merge.
- Production smoke test.
- Serious regression: rollback first, then fix on a branch.

## Product discipline

Current data says the basic Daily works. Do not solve imaginary engagement problems by complicating it. The stronger opportunity is protecting reliability and turning current sharing into measurable acquisition.

---

# 25. Current release snapshot

## Current build token

`20260925-daily-percentile2`

## Current latest main commit

`0b171d93a45a80aca0cdb1a0430e8faa9e612420`

Commit message: `fix`

Changed only `js/game.js` client build token to repair the 25 Sep mismatch.

## Current important script cache tokens

```text
css/style.css?v=4.8-miles1
js/locations.js?v=20260905-recalibration1
js/game.js?v=20260925-daily-percentile2
```

## Current public links in `index.html`

- Facebook: `https://www.facebook.com/profile.php?id=61593232588774`
- Contact: `hello@cornwalltap.co.uk`

---

# 26. Key commit reference

These SHAs are useful anchors when investigating regressions or understanding why code exists.

| Commit | Date | Purpose |
|---|---|---|
| `81c9d47049` | 5 Aug | v1.0 Gold50 |
| `91c641ecfc` | 5 Aug | Daily stats/streaks |
| `3efae9dbd0` | 7 Aug | launch on cornwalltap.co.uk |
| `4a2f64443f` | 10 Aug | analytics endpoint |
| `a8c3d4e7bb` | 10 Aug | client gameplay analytics |
| `58232f4cdc` | 10 Aug | anonymous player IDs |
| `680a3ef06f` | 13 Aug | Daily selection/versioning fix |
| `5f5da7fe1c` | 25 Aug | R4/R5 repeat-protection fix |
| `67494c95dd` | 25 Aug | end-game review/map summary |
| `1d301d1ce4` | 25 Aug | retention analytics |
| `5a926b73fb` | 28 Aug | Daily restart loophole/attempt resume |
| `c6858b088f` | 1 Sep | 200 locations + selector v5 |
| `c816781196` | 1 Sep | Daily score history / Stats v2 |
| `b5e843c238` | 2 Sep | server-authoritative Daily |
| `ceaf4c9078` | 2 Sep | analytics optimization/caching |
| `f4b468ad83` | 2 Sep | `daily_players` optimization |
| `2e8e723fbd` | 3 Sep | difficulty recalibration + authoritative schedule |
| `725f15bb76` | 3 Sep | Devon Easter egg |
| `81da2b6ffd` | 5 Sep | recalibration/schedule update |
| `79a65217db` | 21 Sep | session safety/challenge date |
| `ebd9493d12` | 24 Sep | Daily percentile |
| `f716d2b0f3` | 25 Sep | percentile on saved results |
| `5bc7165607` | 25 Sep | server/cache build bump — introduced mismatch |
| `0b171d93a4` | 25 Sep | fix client build mismatch |

---

# 27. Analytics snapshot — 25–28 September 2026

For future comparison, these are the exact supplied figures.

## Friday 25 Sep — outage affected

- Unique Daily players: 458
- Daily starts: 458
- Completed all 5: 433
- Completion: 94.5%
- Average score: 281.9/500
- Median time: 2m10s
- Share rate: 20.6%
- New: 73
- Returning: 385
- Returning share: 84.1%
- Day-1 retention: 44.3% — 278 of 628 previous-day players
- 2+ completions: 984
- 3+: 625
- 5+: 303
- 7+: 140
- Shares: 89
- Practice: 120 players / 569 starts / 504 completions

Do not use this as a normal clean Friday benchmark because Daily was unavailable for up to ~3h23m.

## Saturday 26 Sep

- Daily: 428
- Completed: 409
- Completion: 95.6%
- Average score: 330.3
- Median: 1m59s
- Share rate: 24.2%
- New: 79
- Returning: 349
- Returning share: 81.5%
- D1: 52.2% — 239 of 458
- 2+/3+/5+/7+: 1023 / 662 / 344 / 194
- Shares: 99
- Practice: 72 / 281 / 257

## Sunday 27 Sep

- Daily: 460
- Completed: 437
- Completion: 95.0%
- Average score: 329.1
- Median: 1m54s
- Share rate: 24.7%
- New: 89
- Returning: 371
- Returning share: 80.7%
- D1: 58.9% — 252 of 428
- 2+/3+/5+/7+: 1056 / 702 / 385 / 230
- Shares: 108
- Practice: 80 / 409 / 361

## Monday 28 Sep

- Daily: 462
- Completed: 437
- Completion: 94.6%
- Average score: 332/500
- Median: 1m46s
- Share rate: 23.1%
- New: 76
- Returning: 386
- Returning share: 83.5%
- D1: 57.2% — 263 of 460
- 2+/3+/5+/7+: 1093 / 738 / 421 / 266
- Shares: 101
- Practice: 61 / 499 / 445

---

# 28. Things that are NOT fully captured and must be verified when needed

A new chat should not invent these details.

## Cloudflare account/project configuration

Not stored in current repo:

- exact Pages project name;
- build command/output configuration;
- production/preview environment-variable settings;
- D1 database name/id;
- whether Cloudflare Access protects `/admin`;
- retention/backups beyond what D1/Cloudflare currently provide.

Use the Cloudflare dashboard/current settings if a task depends on them.

## D1 DDL/indexes

The code reveals required columns but not the complete schema. Before schema/index work, inspect live D1 with commands such as `.schema` / table/index metadata and preserve a snapshot.

## Exact press publication/source

The analytics effect is known; this dossier does not assert the publication outlet/title because that detail was not independently captured from the repo.

## Current traffic after 28 Sep

This dossier stops at the last fully supplied completed day (28 Sep). Future chats should use current analytics rather than extrapolate.

---

# 29. Recommended immediate maintenance sequence

This is the safest order from the current state.

### 1. Automated three-way build-version validator

Do this before another substantive release.

### 2. Update the regression checklist

Explicitly state all three build values, not only `clientBuildVersion` + `/api/version`.

### 3. Replace/update `tools/check_daily.js`

Make it validate the actual authoritative schedule and current v6c constraints.

### 4. Clean up location source naming

One canonical CSV path/name, reflected in builder instructions and generated header.

### 5. Capture D1 schema/indexes as code/documentation

Reduce environment-recreation risk.

### 6. Only then return to growth features

Most promising next product project: attributable share/challenge links.

---

# 30. Suggested first message for a future CornwallTap chat

Paste/upload this dossier, then use something like:

> This is the current CornwallTap master handover dossier. Read it before suggesting any change. Treat the latest GitHub `main` as the code truth and this dossier as product/operational context. We work cautiously: branch from latest main, make the smallest possible change, test locally and on Cloudflare Preview/phone, then merge. Never alter the Daily schedule/history, location IDs, saved Daily state or build/version guard casually. Before any `game.js` deployment, verify the three-way build value in `game.js`, `index.html` and `/api/version`. Also note that `tools/check_daily.js` is stale as of this dossier and must not be trusted until updated. First tell me what you believe the current state and safety constraints are before we edit anything.

That prompt should force a fresh chat to establish the correct operating context before touching production.

---

# 31. Final handover summary

CornwallTap has moved from a small personal web game to a live Daily product with a meaningful recurring audience. Its strongest assets are currently simplicity, a shared five-location Daily, strong completion, strong next-day retention and unusually high share intent. The post-press data suggests the new audience has not simply vanished: by 28 September the game was still around 462 Daily players, with 386 returning players and 57.2% Day-1 retention.

The core challenge is therefore no longer “does anyone want to play?” It is **how to protect a growing habit and turn existing sharing into repeatable acquisition without destabilising the game**.

The codebase is still intentionally simple — plain HTML/CSS/JS with Cloudflare Functions and D1 — but the operational complexity has increased. The 25 September outage showed that a one-line omitted build constant can take Daily offline for hours even while Practice appears healthy. That incident must change how releases are handled: automated version validation, careful Preview/mobile checks, immediate production smoke testing, and fast rollback are now part of the product, not optional engineering polish.

If a future developer or ChatGPT remembers only one thing from this dossier, it should be this:

> **Protect the Daily, protect saved player state, preserve the authoritative schedule/history, and make changes small enough that you can prove exactly what changed.**

