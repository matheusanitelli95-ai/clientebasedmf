// Proxy Vercel para API Mais Retorno
// Usa API Key (X-API-Key header)

export default async function handler(req, res) {
  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app')
    ? req.headers.origin
    : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

  const API_KEY = process.env.MR_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'MR_API_KEY não configurada no servidor', results: [] });
  }

  // Suportar múltiplas ações:
  // ?action=quotes&tickers=PETR4,VALE3,BOVA11,BTC
  // ?action=search&query=petrobras
  // ?action=stats&identifier=petr4:b3
  // ?action=debug&tickers=PETR4  (mostra resposta raw da API)
  const action = req.query.action || 'quotes';

  try {
    const baseUrl = 'https://data.maisretorno.com/mr-data/v4/api';
    const headers = { 'X-API-Key': API_KEY };

    if (action === 'search') {
      const query = req.query.query || '';
      const resp = await fetch(baseUrl + '/search/' + encodeURIComponent(query) + '?has_quotes=true', { headers });
      const text = await resp.text();
      try {
        return res.status(200).json(JSON.parse(text));
      } catch (e) {
        return res.status(200).json({ error: 'Invalid JSON from search', raw: text.slice(0, 500), results: [] });
      }
    }

    if (action === 'stats') {
      const identifier = req.query.identifier || '';
      // Não encodar o identifier — a API MR espera colon literal no path
      const resp = await fetch(baseUrl + '/stats/' + identifier, { headers });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // action === 'debug' — retorna resposta raw da API para diagnóstico
    if (action === 'debug') {
      const ticker = (req.query.tickers || 'PETR4').split(',')[0].trim();
      const identifier = toIdentifierFn(ticker);
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      // Testar com e sem encodeURIComponent
      const urlEncoded = baseUrl + '/quotes/' + encodeURIComponent(identifier) + '?start_date=' + startDate + '&end_date=' + endDate;
      const urlRaw = baseUrl + '/quotes/' + identifier + '?start_date=' + startDate + '&end_date=' + endDate;

      const [respEnc, respRaw] = await Promise.all([
        fetch(urlEncoded, { headers }).then(async r => ({ status: r.status, ok: r.ok, body: await r.text() })).catch(e => ({ error: e.message })),
        fetch(urlRaw, { headers }).then(async r => ({ status: r.status, ok: r.ok, body: await r.text() })).catch(e => ({ error: e.message }))
      ]);

      return res.status(200).json({
        ticker: ticker,
        identifier: identifier,
        startDate: startDate,
        endDate: endDate,
        encoded: { url: urlEncoded, ...respEnc },
        raw: { url: urlRaw, ...respRaw },
        apiKeyPresent: !!API_KEY,
        apiKeyPrefix: API_KEY ? API_KEY.slice(0, 8) + '...' : null
      });
    }

    // action === 'quotes' (default)
    const tickers = (req.query.tickers || '').split(',').map(t => t.trim()).filter(Boolean);
    if (!tickers.length) return res.status(200).json({ results: [] });

    // Buscar cotações — últimos 7 dias para garantir pelo menos 2 pregões
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const promises = tickers.map(async function(ticker) {
      const identifier = toIdentifierFn(ticker);
      try {
        // NÃO usar encodeURIComponent — a API MR espera colon literal
        const url = baseUrl + '/quotes/' + identifier
          + '?start_date=' + startDate + '&end_date=' + endDate;
        const resp = await fetch(url, { headers });

        if (!resp.ok) {
          console.error('[MR] Fetch failed for', identifier, '- status:', resp.status);
          return null;
        }

        const text = await resp.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('[MR] Invalid JSON for', identifier, ':', text.slice(0, 200));
          return null;
        }

        const quotes = data.quotes || [];
        if (!quotes.length) {
          console.log('[MR] No quotes for', identifier, '- response keys:', Object.keys(data).join(','));
          return null;
        }

        const last = quotes[quotes.length - 1];
        const prev = quotes.length > 1 ? quotes[quotes.length - 2] : null;
        const price = last.c;
        const prevClose = prev ? prev.c : null;
        const changePercent = prevClose && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;
        const changeAbs = prevClose ? (price - prevClose) : 0;

        return {
          symbol: ticker.toUpperCase().replace('.SA', ''),
          shortName: data.nicename || data.shortname || ticker.toUpperCase(),
          regularMarketPrice: price,
          regularMarketChangePercent: changePercent,
          regularMarketChange: changeAbs,
          regularMarketPreviousClose: prevClose,
          regularMarketDayHigh: null,
          regularMarketDayLow: null,
          regularMarketOpen: null,
          regularMarketTime: last.d,
          regularMarketVolume: null,
          fiftyTwoWeekHigh: null,
          fiftyTwoWeekLow: null,
          logourl: null,
          _source: 'maisretorno',
          _identifier: identifier
        };
      } catch (e) {
        console.error('[MR] Exception for', identifier, ':', e.message);
        return null;
      }
    });

    const all = await Promise.all(promises);
    const results = all.filter(Boolean);
    return res.status(200).json({ results: results, _debug: { totalTickers: tickers.length, returned: results.length, startDate: startDate, endDate: endDate } });

  } catch (error) {
    return res.status(500).json({ error: error.message, results: [] });
  }
}

// Mapear tickers para identificadores Mais Retorno
const INDEX_MAP = {
  '^BVSP': 'ibov:idx',
  'IBOV': 'ibov:idx',
  'IBOVESPA': 'ibov:idx',
  'CDI': 'cdi:idx',
  'USDBRL=X': 'dolar:idx',
  'USDBRL': 'dolar:idx',
  'DOLAR': 'dolar:idx',
  'SP500': 'sp500:idx',
  'IFIX': 'ifix:idx',
  'IPCA': 'ipca:idx',
  'SELIC': 'selic:idx',
  'IDIV': 'idiv:idx',
  'SMLL': 'smll:idx',
  'IGPM': 'igpm:idx'
};

const CRYPTO_TICKERS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'DOGE', 'XRP', 'BNB', 'WBTC'];

function toIdentifierFn(ticker) {
  const upper = ticker.toUpperCase().replace('.SA', '');
  if (INDEX_MAP[upper]) return INDEX_MAP[upper];
  if (CRYPTO_TICKERS.indexOf(upper) >= 0) return upper.toLowerCase() + ':cc';
  return upper.toLowerCase() + ':b3';
}
