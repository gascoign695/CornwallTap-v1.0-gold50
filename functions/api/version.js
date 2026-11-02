export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20261102-news1"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
