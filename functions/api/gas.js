// Cloudflare Pages Function: /api/gas
// Proxy server-side to Google Apps Script Web App to avoid browser CORS/preflight issues.
//
// REQUIRED env vars in Cloudflare Pages -> Settings -> Environment variables
// - GAS_WEBAPP_URL = "https://script.google.com/macros/s/XXXXX/exec"
// OPTIONAL:
// - DCANP_SECRET   = same value as Apps Script Script Property "DCANP_SECRET"
//
// Browser calls:
//   POST /api/gas  body: {"fn":"functionName","args":[...]}
//
// It forwards to GAS_WEBAPP_URL:
//   {"fn":"...","args":[...],"secret":"..."}

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const gasUrl = env.GAS_WEBAPP_URL;
  if (!gasUrl) {
    return new Response(JSON.stringify({ ok: false, error: "Missing GAS_WEBAPP_URL env var" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch (e) {}

  let body = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body sent to /api/gas" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const fn = String(body.fn || "").trim();
  const args = Array.isArray(body.args) ? body.args : [];

  if (!fn) {
    return new Response(JSON.stringify({ ok: false, error: "Missing fn" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const forwardPayload = {
    fn,
    args,
    ...(env.DCANP_SECRET ? { secret: String(env.DCANP_SECRET) } : {}),
  };

  let gasResp;
  try {
    gasResp = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardPayload),
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Proxy fetch to GAS failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const respText = await gasResp.text();

  let out;
  try {
    out = JSON.parse(respText);
  } catch (e) {
    out = { ok: false, error: "Non-JSON response from GAS", raw: respText.slice(0, 500) };
  }

  return new Response(JSON.stringify(out), {
    status: gasResp.ok ? 200 : (gasResp.status || 500),
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
