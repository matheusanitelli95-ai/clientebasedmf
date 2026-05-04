export default async function handler(req, res) {
  const p = req.query.p || '';
  const { p: _, ...otherParams } = req.query;
  const qs = new URLSearchParams(otherParams).toString();

  const TOKEN = 'H018X6kXAGmy//aUJ0QYGNVlqQ5atBGNQ3zIMJYegT/pERLLkIAX8N2XjAy4X5yr--YycfjDvfOf0sFoJLAKUO5A==--YzhiZjc0NWNkNjAwMTFkZWFiZGFmMDVjMWVhYjI4YmM=';
  const headers = { 'Access-Token': TOKEN };

  const oplabUrl = 'https://api.oplab.com.br/v3/' + p + (qs ? '?' + qs : '');

  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app') ? req.headers.origin : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');

  try {
    const response = await fetch(oplabUrl, { headers });
    const body = await response.text();
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao buscar dados' });
  }
}
