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

    // Save to KV as backup
    await context.env.WAITLIST.put(email, JSON.stringify({
      email,
      signedUpAt: new Date().toISOString(),
    }));

    // Send welcome email to subscriber
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${context.env.MAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Vexera Labs <hello@vexeralabs.com>",
        to: email,
        subject: "You're on the waitlist",
        html: "<p>Thanks for joining the Vexera Labs waitlist.</p><p>We'll reach out when it's time to wake up.</p><p>— Vexera Labs</p>",
      }),
    });

    // Notify you about the new signup
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${context.env.MAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Vexera Labs <hello@vexeralabs.com>",
        to: "hello@vexeralabs.com",
        subject: "New waitlist signup",
        html: `<p>New signup: <strong>${email}</strong></p><p>${new Date().toISOString()}</p>`,
      }),
    });

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
