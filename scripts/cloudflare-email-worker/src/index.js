/**
 * Cloudflare Email Worker: Receives inbound emails at donations@grandcitizens.org
 * and forwards the content to the Supabase Edge Function for processing.
 *
 * The Edge Function's regex parser finds the Soneri Bank pattern anywhere in the
 * raw email text, so no email parsing library is needed.
 *
 * Environment variables (set in wrangler.toml or Cloudflare Dashboard):
 *   EDGE_FUNCTION_URL - The Supabase Edge Function URL
 *
 * Secrets (set via `wrangler secret put` or Cloudflare Dashboard):
 *   WEBHOOK_API_KEY - API key for the Edge Function
 */

export default {
  async email(message, env, ctx) {
    try {
      // Read the full raw email — the Edge Function regex will find the
      // "PKR ... received from ..." pattern within it
      const rawEmail = await new Response(message.raw).text();

      const response = await fetch(env.EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.WEBHOOK_API_KEY,
        },
        body: JSON.stringify({
          email_body: rawEmail,
          email_subject: message.headers.get("subject") || "",
        }),
      });

      const result = await response.json();
      console.log(
        `Processed email from ${message.from}: ${JSON.stringify(result)}`
      );
    } catch (err) {
      // Log but don't throw — throwing would bounce the email back to sender
      console.error("Error processing email:", err);
    }
  },
};
