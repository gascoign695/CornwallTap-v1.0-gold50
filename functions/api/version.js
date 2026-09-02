export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20260902-endgame1-1"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
