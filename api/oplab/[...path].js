export default async function handler(req, res) {
  const { path, ...queryParams } = req.query;
  const oplabPath = Array.isArray(path) ? path.join('/') : (path || '');

  // Reconstruir query string (sem o path do Vercel)
  const qs = new URLSearchParams(queryParams).toString();

  // Tentar com /v3 primeiro, sem /v3 como fallback
  const TOKEN = 'H018X6kXAGmy//aUJ0QYGNVlqQ5atBGNQ3zIMJYegT/pERLLkIAX8N2XjAy4X5yr~YycfjDvfOf0sFoJLAKUO5A==~YzhiZjc0NWNkNjAwMTFkZWFiZGFmMDVjMWVhYjI4YmM=';
  const headers = { 'Access-Token': TOKEN };

  // Tentar /v3 primeiro
  let oplabUrl = 'https://api.oplab.com.br/v3/' + oplabPath + (qs ? '?' + qs : '');

  try {
    let response = await fetch(oplabUrl, { headers });

    // Se 404 com /v3, tentar sem /v3
    if (response.status === 404) {
      oplabUrl = 'https://api.oplab.com.br/' + oplabPath + (qs ? '?' + qs : '');
      response = await fetch(oplabUrl, { headers });
    }

    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-OpLab-URL', oplabUrl); // Debug: mostra qual URL foi usada
    res.status(response.status).send(data);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.message, url: oplabUrl });
  }
}
