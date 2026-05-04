export default async function handler(req, res) {
  const TOKEN = process.env.FINNHUB_TOKEN;

  if (!TOKEN) {
    return res.status(500).json({ error: 'Token Finnhub não configurado no servidor' });
  }

  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app') ? req.headers.origin : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  var from = req.query.from || '';
  var to = req.query.to || '';

  if (!from || !to) {
    return res.status(400).json({ error: 'Parâmetros "from" e "to" obrigatórios (YYYY-MM-DD)' });
  }

  var url = 'https://finnhub.io/api/v1/calendar/economic?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to) + '&token=' + TOKEN;

  try {
    var response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    var body = await response.text();
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao conectar Finnhub: ' + error.message });
  }
}
