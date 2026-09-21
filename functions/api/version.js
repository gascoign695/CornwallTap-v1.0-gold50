export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20260921-session-safety"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
