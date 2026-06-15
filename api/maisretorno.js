// Proxy Vercel para API Mais Retorno
// Usa API Key (X-API-Key header)
// Requisições sequenciais com delay para evitar rate limit (429)

export default async function handler(req, res) {
  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app')
    ? req.headers.origin
    : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');
  // Cache 24h na CDN da Vercel — cotações atualizam 1x por dia
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');

  const API_KEY = process.env.MR_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'MR_API_KEY não configurada no servidor', results: [] });
  }

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
        return res.status(200).json({ error: 'Invalid JSON from search', results: [] });
      }
    }

    if (action === 'stats') {
      const identifier = req.query.identifier || '';
      const resp = await fetch(baseUrl + '/stats/' + identifier, { headers });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // Debug mode
    if (action === 'debug') {
      const ticker = (req.query.tickers || 'PETR4').split(',')[0].trim();
      const identifier = toIdentifierFn(ticker);
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const urlRaw = baseUrl + '/quotes/' + identifier + '?start_date=' + startDate + '&end_date=' + endDate;
      let result;
      try {
        const resp = await fetch(urlRaw, { headers });
        result = { status: resp.status, ok: resp.ok, body: (await resp.text()).slice(0, 500) };
      } catch(e) {
        result = { error: e.message };
      }

      return res.status(200).json({
        ticker, identifier, startDate, endDate,
        result,
        apiKeyPresent: !!API_KEY,
        apiKeyPrefix: API_KEY ? API_KEY.slice(0, 8) + '...' : null
      });
    }

    // action === 'quotes' (default)
    const tickers = (req.query.tickers || '').split(',').map(t => t.trim()).filter(Boolean);
    if (!tickers.length) return res.status(200).json({ results: [] });

    // Últimos 7 dias para garantir pelo menos 2 pregões
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Requisições SEQUENCIAIS com delay para evitar rate limit 429
    const results = [];
    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const identifier = toIdentifierFn(ticker);

      // Delay entre requisições (150ms) — exceto a primeira
      if (i > 0) await sleep(150);

      try {
        const url = baseUrl + '/quotes/' + identifier + '?start_date=' + startDate + '&end_date=' + endDate;
        const resp = await fetch(url, { headers });

        if (resp.status === 429) {
          // Rate limited — esperar mais e tentar de novo
          console.log('[MR] Rate limited on', identifier, '- waiting 500ms and retrying');
          await sleep(500);
          const retry = await fetch(url, { headers });
          if (!retry.ok) {
            console.error('[MR] Retry failed for', identifier, '- status:', retry.status);
            continue;
          }
          const retryData = await retry.json();
          const retryQuotes = retryData.quotes || [];
          if (retryQuotes.length) {
            results.push(buildResult(ticker, identifier, retryData, retryQuotes));
          }
          continue;
        }

        if (!resp.ok) {
          console.error('[MR] Fetch failed for', identifier, '- status:', resp.status);
          continue;
        }

        const text = await resp.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { continue; }

        const quotes = data.quotes || [];
        if (!quotes.length) continue;

        results.push(buildResult(ticker, identifier, data, quotes));
      } catch (e) {
        console.error('[MR] Exception for', identifier, ':', e.message);
      }
    }

    return res.status(200).json({
      results,
      _debug: { totalTickers: tickers.length, returned: results.length, startDate, endDate }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message, results: [] });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildResult(ticker, identifier, data, quotes) {
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
}

// Mapear tickers para identificadores Mais Retorno
const INDEX_MAP = {
  '^BVSP': 'ibov:idx', 'IBOV': 'ibov:idx', 'IBOVESPA': 'ibov:idx',
  'CDI': 'cdi:idx', 'USDBRL=X': 'dolar:idx', 'USDBRL': 'dolar:idx',
  'DOLAR': 'dolar:idx', 'SP500': 'sp500:idx', 'IFIX': 'ifix:idx',
  'IPCA': 'ipca:idx', 'SELIC': 'selic:idx', 'IDIV': 'idiv:idx',
  'SMLL': 'smll:idx', 'IGPM': 'igpm:idx',
  // Setoriais B3
  'ICON': 'icon:idx', 'IEE': 'iee:idx', 'IMAT': 'imat:idx',
  'INDX': 'indx:idx', 'IFNC': 'ifnc:idx', 'IMOB': 'imob:idx',
  'UTIL': 'util:idx',
  // ETFs brasileiros
  'BOVA11': 'bova11:b3', 'IVVB11': 'ivvb11:b3', 'SMAL11': 'smal11:b3',
  'HASH11': 'hash11:b3', 'XFIX11': 'xfix11:b3'
};

const CRYPTO_TICKERS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'DOGE', 'XRP', 'BNB', 'WBTC'];

function toIdentifierFn(ticker) {
  const upper = ticker.toUpperCase().replace('.SA', '');
  if (INDEX_MAP[upper]) return INDEX_MAP[upper];
  if (CRYPTO_TICKERS.indexOf(upper) >= 0) return upper.toLowerCase() + ':cc';
  return upper.toLowerCase() + ':b3';
}
