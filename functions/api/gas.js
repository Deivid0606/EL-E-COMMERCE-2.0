export async function onRequest(context) {
  const { request, env } = context;

  // Basic CORS for dev/tools (browser same-origin won't need it, but it doesn't hurt)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const GAS_WEBAPP_URL = env.GAS_WEBAPP_URL;
  if (!GAS_WEBAPP_URL) {
    return new Response(JSON.stringify({ ok: false, error: "Missing GAS_WEBAPP_URL env var" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  // Inject secret server-side (keeps it out of the browser)
  const secret = env.DCANP_SECRET || "";
  const payload = { ...body };
  if (secret) payload.secret = secret;

  // Forward to Apps Script Web App (/exec)
  let upstreamResp;
  try {
    upstreamResp = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Upstream fetch failed", detail: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
    });
  }

  const text = await upstreamResp.text();

  // Try to keep JSON content-type even if GAS mislabels
  return new Response(text, {
    status: upstreamResp.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
