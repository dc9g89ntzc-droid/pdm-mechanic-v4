// Proxies quote image uploads to Fivemanage. This exists only because the
// Fivemanage API key is a real secret (unlike the Supabase anon key, it
// isn't protected by RLS) -- it must never ship in client-side JS, so the
// browser sends the rendered quote image here, and this function is the
// only thing that ever sees FIVEMANAGE_API_KEY (set in Netlify's
// dashboard: Site settings -> Environment variables).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.FIVEMANAGE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'FIVEMANAGE_API_KEY is not configured' }) };
  }

  try {
    const { imageBase64, filename } = JSON.parse(event.body);
    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'imageBase64 is required' }) };
    }

    const base64Data = imageBase64.split(',').pop();
    const buffer = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'image/png' }), filename || 'quote.png');

    const res = await fetch('https://api.fivemanage.com/api/v3/file', {
      method: 'POST',
      headers: { Authorization: apiKey },
      body: formData
    });
    const json = await res.json();

    if (!res.ok || json.status !== 'ok') {
      return { statusCode: 502, body: JSON.stringify({ error: 'Fivemanage upload failed', detail: json }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url: json.data.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
