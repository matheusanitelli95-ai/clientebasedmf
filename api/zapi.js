export default async function handler(req, res) {
  const INSTANCE = process.env.ZAPI_INSTANCE;
  const TOKEN = process.env.ZAPI_TOKEN;

  if (!INSTANCE || !TOKEN) {
    return res.status(500).json({ error: 'Credenciais Z-API não configuradas no servidor' });
  }

  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app') ? req.headers.origin : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Path do endpoint Z-API (ex: send-text, groups, status)
  const action = req.query.action || '';
  if (!action) {
    return res.status(400).json({ error: 'Parâmetro "action" obrigatório' });
  }

  // Whitelist de ações permitidas
  var allowed = ['send-text', 'groups', 'status'];
  if (allowed.indexOf(action) < 0) {
    return res.status(403).json({ error: 'Ação não permitida' });
  }

  var zapiUrl = 'https://api.z-api.io/instances/' + INSTANCE + '/token/' + TOKEN + '/' + action;

  try {
    var options = { method: req.method, headers: { 'Content-Type': 'application/json', 'Client-Token': TOKEN } };
    if (req.method === 'POST' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    var response = await fetch(zapiUrl, options);
    var body = await response.text();
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao conectar Z-API' });
  }
}
