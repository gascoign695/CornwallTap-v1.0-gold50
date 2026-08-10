export async function onRequestPost(context) {
    try {
        const payload = await context.request.json();

        const {
            event_type,
    game_mode = null,
    challenge_date = null,
    session_id = null,
    player_id = null,
    device_type = null,
            final_score = null,
            duration_seconds = null,
            round_number = null,
            location_name = null,
            location_category = null,
            round_score = null,
            distance_km = null
        } = payload;

        if (!event_type) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: "event_type is required"
                }),
                {
                    status: 400,
                    headers: {
                        "content-type": "application/json"
                    }
                }
            );
        }

        await context.env.DB
            .prepare(`
                INSERT INTO game_events (
                    event_type,
                    game_mode,
                    challenge_date,
                    session_id,
                    player_id,
                    device_type,
                    final_score,
                    duration_seconds,
                    round_number,
                    location_name,
                    location_category,
                    round_score,
                    distance_km
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                event_type,
                game_mode,
                challenge_date,
                session_id,
                player_id,
                device_type,
                final_score,
                duration_seconds,
                round_number,
                location_name,
                location_category,
                round_score,
                distance_km
            )
            .run();

        return new Response(
            JSON.stringify({
                ok: true
            }),
            {
                status: 200,
                headers: {
                    "content-type": "application/json"
                }
            }
        );
    } catch (error) {
        console.error("Analytics event failed:", error);

        return new Response(
            JSON.stringify({
                ok: false,
                error: "analytics write failed"
            }),
            {
                status: 500,
                headers: {
                    "content-type": "application/json"
                }
            }
        );
    }
}