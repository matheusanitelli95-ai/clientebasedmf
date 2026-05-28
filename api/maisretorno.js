// Proxy Vercel para API Mais Retorno
// Usa API Key (X-API-Key header)

export default async function handler(req, res) {
  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app')
    ? req.headers.origin
    : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');

  const API_KEY = process.env.MR_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'MR_API_KEY não configurada no servidor', results: [] });
  }

  // Suportar múltiplas ações:
  // ?action=quotes&tickers=PETR4,VALE3,BOVA11,BTC
  // ?action=search&query=petrobras
  // ?action=stats&identifier=petr4:b3
  const action = req.query.action || 'quotes';

  try {
    const baseUrl = 'https://data.maisretorno.com/mr-data/v4/api';
    const headers = { 'X-API-Key': API_KEY };

    if (action === 'search') {
      const query = req.query.query || '';
      const resp = await fetch(baseUrl + '/search/' + encodeURIComponent(query) + '?has_quotes=true', { headers });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    if (action === 'stats') {
      const identifier = req.query.identifier || '';
      const resp = await fetch(baseUrl + '/stats/' + encodeURIComponent(identifier), { headers });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // action === 'quotes' (default)
    const tickers = (req.query.tickers || '').split(',').map(t => t.trim()).filter(Boolean);
    if (!tickers.length) return res.status(200).json({ results: [] });

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

    function toIdentifier(ticker) {
      const upper = ticker.toUpperCase().replace('.SA', '');
      if (INDEX_MAP[upper]) return INDEX_MAP[upper];
      if (CRYPTO_TICKERS.indexOf(upper) >= 0) return upper.toLowerCase() + ':cc';
      return upper.toLowerCase() + ':b3';
    }

    // Buscar cotações — últimos 5 dias para garantir pelo menos 2 pregões
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    const startDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const promises = tickers.map(async function(ticker) {
      const identifier = toIdentifier(ticker);
      try {
        const url = baseUrl + '/quotes/' + encodeURIComponent(identifier)
          + '?start_date=' + startDate + '&end_date=' + endDate;
        const resp = await fetch(url, { headers });
        if (!resp.ok) return null;
        const data = await resp.json();
        const quotes = data.quotes || [];
        if (!quotes.length) return null;

        const last = quotes[quotes.length - 1];
        const prev = quotes.length > 1 ? quotes[quotes.length - 2] : null;
        const price = last.c;
        const prevClose = prev ? prev.c : null;
        const changePercent = prevClose && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;
        const changeAbs = prevClose ? (price - prevClose) : 0;

        return {
          symbol: ticker.toUpperCase().replace('.SA', ''),
          shortName: data.nicename || data.shortname || '',
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
        return null;
      }
    });

    const all = await Promise.all(promises);
    const results = all.filter(Boolean);
    return res.status(200).json({ results: results });

  } catch (error) {
    return res.status(500).json({ error: error.message, results: [] });
  }
}
