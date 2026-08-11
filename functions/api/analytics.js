export async function onRequestGet(context) {
    try {
        const today =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone: "Europe/London",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }
            ).format(new Date());

        const summary =
            await context.env.DB
                .prepare(`
                    SELECT
                        COUNT(DISTINCT CASE
                            WHEN event_type = 'game_started'
                            THEN player_id
                        END) AS unique_players,

                        COUNT(DISTINCT CASE
                            WHEN event_type = 'game_started'
                            THEN session_id
                        END) AS games_started,

                        COUNT(DISTINCT CASE
                            WHEN event_type = 'game_completed'
                            THEN session_id
                        END) AS games_completed,

                        ROUND(
                            100.0 *
                            COUNT(DISTINCT CASE
                                WHEN event_type = 'game_completed'
                                THEN session_id
                            END)
                            /
                            NULLIF(
                                COUNT(DISTINCT CASE
                                    WHEN event_type = 'game_started'
                                    THEN session_id
                                END),
                                0
                            ),
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
                                    THEN duration_seconds
                                END
                            ),
                            0
                        ) AS average_duration_seconds,

                        COUNT(DISTINCT CASE
                            WHEN event_type = 'share_clicked'
                            THEN session_id
                        END) AS shares

                    FROM game_events

                    WHERE challenge_date = ?
                    AND player_id IS NOT NULL
                `)
                .bind(today)
                .first();

        return Response.json({
            ok: true,
            date: today,
            summary
        });

    } catch (error) {
        console.error(
            "Analytics summary failed:",
            error
        );

        return Response.json(
            {
                ok: false,
                error: "analytics summary failed"
            },
            {
                status: 500
            }
        );
    }
}