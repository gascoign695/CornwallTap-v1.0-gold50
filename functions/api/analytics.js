export async function onRequestGet(context) {
    try {
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Europe/London",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        const summary = await context.env.DB.prepare(`
            SELECT
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' AND game_mode = 'daily' THEN player_id END) AS unique_players,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' AND game_mode = 'daily' THEN session_id END) AS games_started,
                COUNT(DISTINCT CASE WHEN event_type = 'game_completed' AND game_mode = 'daily' THEN session_id END) AS games_completed,
                ROUND(
                    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'game_completed' AND game_mode = 'daily' THEN session_id END)
                    / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'game_started' AND game_mode = 'daily' THEN session_id END), 0),
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
                ROUND(
                    AVG(
                        CASE
                            WHEN event_type = 'game_completed'
                            AND game_mode = 'daily'
                            THEN duration_seconds
                        END
                    ),
                    0
                ) AS average_duration_seconds,
                COUNT(DISTINCT CASE WHEN event_type = 'share_clicked' AND game_mode = 'daily' THEN session_id END) AS shares,
                ROUND(
                    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'share_clicked' AND game_mode = 'daily' THEN session_id END)
                    / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'game_completed' AND game_mode = 'daily' THEN session_id END), 0),
                    1
                ) AS share_rate
            FROM game_events
            WHERE challenge_date = ?
              AND player_id IS NOT NULL
        `).bind(today).first();

        const activity = await context.env.DB.prepare(`
            SELECT
                challenge_date AS date,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' THEN player_id END) AS unique_players,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' THEN session_id END) AS games_started,
                COUNT(DISTINCT CASE WHEN event_type = 'game_completed' THEN session_id END) AS games_completed
            FROM game_events
            WHERE challenge_date >= date(?, '-6 days')
              AND challenge_date <= ?
              AND player_id IS NOT NULL
              AND game_mode = 'daily'
            GROUP BY challenge_date
            ORDER BY challenge_date
        `).bind(today, today).all();

        const modes = await context.env.DB.prepare(`
            SELECT
                game_mode,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' THEN session_id END) AS games_started,
                COUNT(DISTINCT CASE WHEN event_type = 'game_completed' THEN session_id END) AS games_completed,
                COUNT(DISTINCT CASE WHEN event_type = 'game_started' THEN player_id END) AS unique_players
            FROM game_events
            WHERE challenge_date = ?
              AND player_id IS NOT NULL
            GROUP BY game_mode
            ORDER BY game_mode
        `).bind(today).all();

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
        `).bind(today, today, today).first();

        const retentionMilestones = await context.env.DB.prepare(`
            WITH player_daily_completions AS (
                SELECT
                    player_id,
                    COUNT(DISTINCT challenge_date) AS completed_days
                FROM game_events
                WHERE event_type = 'game_completed'
                  AND game_mode = 'daily'
                  AND player_id IS NOT NULL
                GROUP BY player_id
            )
            SELECT
                SUM(CASE WHEN completed_days >= 2 THEN 1 ELSE 0 END) AS players_2_plus,
                SUM(CASE WHEN completed_days >= 3 THEN 1 ELSE 0 END) AS players_3_plus,
                SUM(CASE WHEN completed_days >= 5 THEN 1 ELSE 0 END) AS players_5_plus,
                SUM(CASE WHEN completed_days >= 7 THEN 1 ELSE 0 END) AS players_7_plus
            FROM player_daily_completions
        `).first();

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
        `).bind(today, today).all();

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
            date: today,
            summary,
            activity: activity.results || [],
            modes: modes.results || [],
            retention: {
                today: retentionToday || {},
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