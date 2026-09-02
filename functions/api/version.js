export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20260902-miles1"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
