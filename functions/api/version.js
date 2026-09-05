export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20260905-difficulty-recalibration"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
