const CURRENT_BUILD = "20260902-authoritative2";

export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: CURRENT_BUILD
        },
        {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        }
    );
}
