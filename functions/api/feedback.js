export async function onRequestPost(context) {
    try {
        const payload = await context.request.json();

        const feedbackType =
            typeof payload.feedback_type === "string"
                ? payload.feedback_type.trim()
                : "";

        const message =
            typeof payload.message === "string"
                ? payload.message.trim()
                : "";

        const email =
            typeof payload.email === "string"
                ? payload.email.trim()
                : "";

        const allowedTypes = [
            "location_issue",
            "bug",
            "suggestion",
            "other"
        ];

        if (!allowedTypes.includes(feedbackType)) {
            return jsonResponse(
                {
                    ok: false,
                    error: "Invalid feedback type"
                },
                400
            );
        }

        if (!message) {
            return jsonResponse(
                {
                    ok: false,
                    error: "Message is required"
                },
                400
            );
        }

        if (message.length > 2000) {
            return jsonResponse(
                {
                    ok: false,
                    error: "Message is too long"
                },
                400
            );
        }

        if (email.length > 254) {
            return jsonResponse(
                {
                    ok: false,
                    error: "Email is too long"
                },
                400
            );
        }

        await context.env.DB
            .prepare(`
                INSERT INTO feedback (
                    feedback_type,
                    message,
                    email
                )
                VALUES (?, ?, ?)
            `)
            .bind(
                feedbackType,
                message,
                email || null
            )
            .run();

        return jsonResponse({
            ok: true
        });

    } catch (error) {
        console.error("Feedback submission failed:", error);

        return jsonResponse(
            {
                ok: false,
                error: "Feedback submission failed"
            },
            500
        );
    }
}

function jsonResponse(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "content-type": "application/json"
            }
        }
    );
}