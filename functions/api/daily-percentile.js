export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);

        const date =
            url.searchParams.get("date");

        const scoreParam =
    url.searchParams.get("score");

const score =
    Number(scoreParam);

if (
    !date ||
    scoreParam === null ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 500
) {
            return Response.json(
                {
                    ok: false,
                    error: "date and score are required"
                },
                {
                    status: 400,
                    headers: {
                        "cache-control": "no-store"
                    }
                }
            );
        }

        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        COUNT(*) AS completion_count,
                        SUM(
                            CASE
                                WHEN final_score < ? THEN 1
                                ELSE 0
                            END
                        ) AS lower_count,
                        SUM(
                            CASE
                                WHEN final_score = ? THEN 1
                                ELSE 0
                            END
                        ) AS equal_count
                    FROM game_events
                    WHERE event_type = 'game_completed'
                      AND game_mode = 'daily'
                      AND challenge_date = ?
                      AND final_score IS NOT NULL
                `)
                .bind(
                    score,
                    score,
                    date
                )
                .first();

        const completionCount =
            Number(result?.completion_count || 0);

        const lowerCount =
            Number(result?.lower_count || 0);

        const equalCount =
            Number(result?.equal_count || 0);

        const minimumSample = 20;

        if (
            completionCount < minimumSample
        ) {
            return Response.json(
                {
                    ok: true,
                    ready: false,
                    completion_count:
                        completionCount,
                    minimum_sample:
                        minimumSample
                },
                {
                    headers: {
                        "cache-control": "no-store"
                    }
                }
            );
        }

        const percentile =
            Math.round(
                100 *
                (
                    lowerCount +
                    (equalCount * 0.5)
                ) /
                completionCount
            );

        return Response.json(
            {
                ok: true,
                ready: true,
                completion_count:
                    completionCount,
                percentile
            },
            {
                headers: {
                    "cache-control": "no-store"
                }
            }
        );
    } catch (error) {
        console.error(
            "Daily percentile failed:",
            error
        );

        return Response.json(
            {
                ok: false,
                error:
                    "daily percentile failed"
            },
            {
                status: 500,
                headers: {
                    "cache-control": "no-store"
                }
            }
        );
    }
}