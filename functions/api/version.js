export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20260903-difficulty-v6c"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
