export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20261106-news-cap1"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
