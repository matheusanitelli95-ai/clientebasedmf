export default async function handler(req, res) {
  const p = req.query.p || '';
  const { p: _, ...otherParams } = req.query;
  const qs = new URLSearchParams(otherParams).toString();

  const TOKEN = 'H018X6kXAGmy//aUJ0QYGNVlqQ5atBGNQ3zIMJYegT/pERLLkIAX8N2XjAy4X5yr--YycfjDvfOf0sFoJLAKUO5A==--YzhiZjc0NWNkNjAwMTFkZWFiZGFmMDVjMWVhYjI4YmM=';
  const headers = { 'Access-Token': TOKEN };

  const oplabUrl = 'https://api.oplab.com.br/v3/' + p + (qs ? '?' + qs : '');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const response = await fetch(oplabUrl, { headers });
    const body = await response.text();
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(500).json({ error: error.message, url: oplabUrl });
  }
}
