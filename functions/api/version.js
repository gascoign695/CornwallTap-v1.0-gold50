export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20260925-daily-percentile2"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
