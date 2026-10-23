export async function onRequestGet() {
    return Response.json(
        {
            ok: true,
            build: "20261023-confirm-guess1"
        },
        {
            headers: {
                "cache-control": "no-store"
            }
        }
    );
}
