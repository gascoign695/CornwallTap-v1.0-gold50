export async function onRequestGet(context) {
    try {
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Europe/London",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        const url = new URL(context.request.url);
        const requestedDate = url.searchParams.get("date");
        const validRequestedDate =
            /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || "")
                ? requestedDate
                : today;
        const reportDate =
            validRequestedDate <= today
                ? validRequestedDate
                : today;

        /*
        A Daily is considered completed when the player records Round 5.
        This measures completion of all five guesses rather than whether
        they also click through to the final summary screen.
        */
        const summary = await context.env.DB.prepare(`
            SELECT
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' AND game_mode = 'daily' THEN player_id END) AS unique_players,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' AND game_mode = 'daily' THEN session_id END) AS games_started,
                COUNT(DISTINCT CASE WHEN event_type = 'round_completed' AND game_mode = 'daily' AND round_number = 5 THEN player_id END) AS games_completed,
                ROUND(
                    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'round_completed' AND game_mode = 'daily' AND round_number = 5 THEN player_id END)
                    / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'game_started' AND game_mode = 'daily' THEN player_id END), 0),
                    1
                ) AS completion_rate,
                ROUND(
                    AVG(
                        CASE
                            WHEN event_type = 'game_completed'
                            AND game_mode = 'daily'
                            THEN final_score
                        END
                    ),
                    1
                ) AS average_daily_score,
                COUNT(DISTINCT CASE WHEN event_type = 'share_clicked' AND game_mode = 'daily' THEN player_id END) AS shares,
                ROUND(
                    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'share_clicked' AND game_mode = 'daily' THEN player_id END)
                    / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'round_completed' AND game_mode = 'daily' AND round_number = 5 THEN player_id END), 0),
                    1
                ) AS share_rate
            FROM game_events
            WHERE challenge_date = ?
              AND player_id IS NOT NULL
        `).bind(reportDate).first();

        /*
        Median keeps the raw duration data intact but prevents very long
        abandoned/open-tab sessions from dominating the headline metric.
        */
        const medianDuration = await context.env.DB.prepare(`
            WITH durations AS (
                SELECT duration_seconds
                FROM game_events
                WHERE event_type = 'game_completed'
                  AND game_mode = 'daily'
                  AND challenge_date = ?
                  AND player_id IS NOT NULL
                  AND duration_seconds IS NOT NULL
                ORDER BY duration_seconds
            ),
            counted AS (
                SELECT COUNT(*) AS n
                FROM durations
            )
            SELECT ROUND(AVG(duration_seconds), 0) AS median_duration_seconds
            FROM (
                SELECT duration_seconds
                FROM durations
                LIMIT 2 - (SELECT n FROM counted) % 2
                OFFSET (SELECT (n - 1) / 2 FROM counted)
            )
        `).bind(reportDate).first();

        summary.median_duration_seconds =
            medianDuration?.median_duration_seconds ?? null;

        // Keep the old field temporarily for dashboard/API compatibility.
        summary.average_duration_seconds =
            summary.median_duration_seconds;

        const activity = await context.env.DB.prepare(`
            WITH daily_starts AS (
                SELECT player_id, MIN(challenge_date) AS first_daily_date
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND player_id IS NOT NULL
                GROUP BY player_id
            ),
            recent_players AS (
                SELECT DISTINCT challenge_date, player_id
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND challenge_date >= date(?, '-6 days')
                  AND challenge_date <= ?
                  AND player_id IS NOT NULL
            )
            SELECT
                r.challenge_date AS date,
                COUNT(*) AS unique_players,
                SUM(CASE WHEN d.first_daily_date = r.challenge_date THEN 1 ELSE 0 END) AS new_players,
                SUM(CASE WHEN d.first_daily_date < r.challenge_date THEN 1 ELSE 0 END) AS returning_players
            FROM recent_players r
            JOIN daily_starts d ON d.player_id = r.player_id
            GROUP BY r.challenge_date
            ORDER BY r.challenge_date
        `).bind(reportDate, reportDate).all();

        const modes = await context.env.DB.prepare(`
            SELECT
                game_mode,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' THEN session_id END) AS games_started,
                COUNT(DISTINCT CASE WHEN event_type = 'round_completed' AND round_number = 5 THEN session_id END) AS games_completed,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' THEN player_id END) AS unique_players
            FROM game_events
            WHERE challenge_date = ?
              AND player_id IS NOT NULL
            GROUP BY game_mode
            ORDER BY game_mode
        `).bind(reportDate).all();

        const retentionToday = await context.env.DB.prepare(`
            WITH daily_starts AS (
                SELECT
                    player_id,
                    MIN(challenge_date) AS first_daily_date
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND player_id IS NOT NULL
                GROUP BY player_id
            ),
            today_players AS (
                SELECT DISTINCT player_id
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND challenge_date = ?
                  AND player_id IS NOT NULL
            )
            SELECT
                COUNT(*) AS unique_players,
                SUM(CASE WHEN d.first_daily_date = ? THEN 1 ELSE 0 END) AS new_players,
                SUM(CASE WHEN d.first_daily_date < ? THEN 1 ELSE 0 END) AS returning_players
            FROM today_players t
            JOIN daily_starts d ON d.player_id = t.player_id
        `).bind(reportDate, reportDate, reportDate).first();

        /*
        Day-1 retention for the selected report date means:
        of the unique Daily players who started yesterday, how many
        started a Daily again on the selected date?
        */
        const dayOneRetention = await context.env.DB.prepare(`
            WITH previous_day_players AS (
                SELECT DISTINCT player_id
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND challenge_date = date(?, '-1 day')
                  AND player_id IS NOT NULL
            ),
            report_day_players AS (
                SELECT DISTINCT player_id
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND challenge_date = ?
                  AND player_id IS NOT NULL
            )
            SELECT
                COUNT(*) AS cohort_players,
                SUM(CASE WHEN r.player_id IS NOT NULL THEN 1 ELSE 0 END) AS returned_next_day,
                ROUND(
                    100.0 * SUM(CASE WHEN r.player_id IS NOT NULL THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(*), 0),
                    1
                ) AS day_1_retention
            FROM previous_day_players p
            LEFT JOIN report_day_players r
              ON r.player_id = p.player_id
        `).bind(reportDate, reportDate).first();

        const retentionMilestones = await context.env.DB.prepare(`
            WITH player_daily_completions AS (
                SELECT
                    player_id,
                    COUNT(DISTINCT challenge_date) AS completed_days
                FROM game_events
                WHERE event_type = 'round_completed'
                  AND round_number = 5
                  AND game_mode = 'daily'
                  AND player_id IS NOT NULL
                  AND challenge_date <= ?
                GROUP BY player_id
            )
            SELECT
                SUM(CASE WHEN completed_days >= 2 THEN 1 ELSE 0 END) AS players_2_plus,
                SUM(CASE WHEN completed_days >= 3 THEN 1 ELSE 0 END) AS players_3_plus,
                SUM(CASE WHEN completed_days >= 5 THEN 1 ELSE 0 END) AS players_5_plus,
                SUM(CASE WHEN completed_days >= 7 THEN 1 ELSE 0 END) AS players_7_plus
            FROM player_daily_completions
        `).bind(reportDate).first();

        const retentionActivity = await context.env.DB.prepare(`
            WITH daily_starts AS (
                SELECT
                    player_id,
                    MIN(challenge_date) AS first_daily_date
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND player_id IS NOT NULL
                GROUP BY player_id
            ),
            recent_players AS (
                SELECT DISTINCT
                    challenge_date,
                    player_id
                FROM game_events
                WHERE event_type = 'game_started'
                  AND game_mode = 'daily'
                  AND challenge_date >= date(?, '-6 days')
                  AND challenge_date <= ?
                  AND player_id IS NOT NULL
            )
            SELECT
                r.challenge_date AS date,
                COUNT(*) AS unique_players,
                SUM(CASE WHEN d.first_daily_date = r.challenge_date THEN 1 ELSE 0 END) AS new_players,
                SUM(CASE WHEN d.first_daily_date < r.challenge_date THEN 1 ELSE 0 END) AS returning_players
            FROM recent_players r
            JOIN daily_starts d ON d.player_id = r.player_id
            GROUP BY r.challenge_date
            ORDER BY r.challenge_date
        `).bind(reportDate, reportDate).all();

        const locations = await context.env.DB.prepare(`
            SELECT
                location_name,
                location_category,
                COUNT(*) AS times_played,
                ROUND(AVG(round_score), 1) AS average_score,
                ROUND(AVG(distance_km), 2) AS average_distance_km
            FROM game_events
            WHERE event_type = 'round_completed'
              AND player_id IS NOT NULL
              AND location_name IS NOT NULL
            GROUP BY location_name, location_category
            ORDER BY average_score ASC, times_played DESC
        `).all();

        return Response.json({
            ok: true,
            date: reportDate,
            summary,
            activity: activity.results || [],
            modes: modes.results || [],
            retention: {
                today: retentionToday || {},
                day1: dayOneRetention || {},
                milestones: retentionMilestones || {},
                activity: retentionActivity.results || []
            },
            locations: locations.results || []
        });

    } catch (error) {
        console.error(
            "Analytics dashboard failed:",
            error
        );

        return Response.json(
            {
                ok: false,
                error: "analytics dashboard failed"
            },
            {
                status: 500
            }
        );
    }
}
