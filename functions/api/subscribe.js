export async function onRequestPost(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const { email } = await context.request.json();

        if (!email || !email.includes("@")) {
            return new Response(JSON.stringify({ error: "Invalid email" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const resendHeaders = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${context.env.MAIL_API_KEY}`,
        };

        // 1. Save to KV as backup
        await context.env.WAITLIST.put(email, JSON.stringify({
            email,
            signedUpAt: new Date().toISOString(),
        }));

        // 2. Fetch welcome email template
        const templateRes = await fetch(new URL("/email/welcome-email.html", context.request.url));
        const welcomeHtml = await templateRes.text();

        // 3. Add contact to Resend audience
        await fetch("https://api.resend.com/audiences/bea1b7cd-b69b-490d-97b7-d85bc7419697/contacts", {
            method: "POST",
            headers: resendHeaders,
            body: JSON.stringify({
                email,
                unsubscribed: false,
            }),
        });

        // 4. Send welcome email
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: resendHeaders,
            body: JSON.stringify({
                from: "Vexera Labs <hello@vexeralabs.com>",
                to: email,
                subject: "You're in.",
                html: welcomeHtml,
            }),
        });

        // 5. Notify you about the new signup
        // await fetch("https://api.resend.com/emails", {
        //     method: "POST",
        //     headers: resendHeaders,
        //     body: JSON.stringify({
        //         from: "Vexera Labs <hello@vexeralabs.com>",
        //         to: "hello@vexeralabs.com",
        //         subject: `New waitlist signup: ${email}`,
        //         html: `<p>New signup: <strong>${email}</strong></p><p>${new Date().toISOString()}</p>`,
        //     }),
        // });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Something went wrong" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}