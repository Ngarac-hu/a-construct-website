// A-Construct — Secure AI Function
// Runs on Netlify's servers. Your API key is never exposed to the browser.

const https = require("https");

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Block if no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  let prompt;
  try {
    ({ prompt } = JSON.parse(event.body));
    if (!prompt || typeof prompt !== "string" || prompt.length > 4000) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
    }
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Bad JSON" }) };
  }

  const body = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }]
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body)
      }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": process.env.URL || "*"
            },
            body: JSON.stringify({ reply: parsed.content[0].text })
          });
        } catch (e) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: "Parse error" }) });
        }
      });
    });
    req.on("error", () => resolve({ statusCode: 500, body: JSON.stringify({ error: "Request failed" }) }));
    req.write(body);
    req.end();
  });
};
