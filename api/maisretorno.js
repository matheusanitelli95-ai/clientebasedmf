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

    // ─── SEARCH ───────────────────────────────────────────
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

    // ─── STATS (com suporte a details e datas) ────────────
    if (action === 'stats') {
      const identifier = req.query.identifier || '';
      const params = [];
      if (req.query.details === 'true') params.push('details=true');
      if (req.query.start_date) params.push('start_date=' + req.query.start_date);
      if (req.query.end_date) params.push('end_date=' + req.query.end_date);
      const qs = params.length ? '?' + params.join('&') : '';
      const resp = await fetch(baseUrl + '/stats/' + identifier + qs, { headers });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // ─── DRAWDOWN ─────────────────────────────────────────
    if (action === 'drawdown') {
      const identifier = req.query.identifier || '';
      const params = [];
      if (req.query.start_date) params.push('start_date=' + req.query.start_date);
      if (req.query.end_date) params.push('end_date=' + req.query.end_date);
      const qs = params.length ? '?' + params.join('&') : '';
      const resp = await fetch(baseUrl + '/drawdown/' + identifier + qs, { headers });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // ─── HISTORY (quotes com datas customizadas, 1 ticker) ─
    if (action === 'history') {
      const ticker = (req.query.ticker || '').trim();
      if (!ticker) return res.status(200).json({ quotes: [] });
      const identifier = toIdentifierFn(ticker);
      const params = [];
      if (req.query.start_date) params.push('start_date=' + req.query.start_date);
      if (req.query.end_date) params.push('end_date=' + req.query.end_date);
      const qs = params.length ? '?' + params.join('&') : '';
      const resp = await fetch(baseUrl + '/quotes/' + identifier + qs, { headers });
      if (!resp.ok) return res.status(200).json({ quotes: [], error: 'HTTP ' + resp.status });
      const data = await resp.json();
      data._ticker = ticker.toUpperCase();
      data._identifier = identifier;
      return res.status(200).json(data);
    }

    // ─── DEBUG ─────────────────────────────────────────────
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

    // ─── QUOTES (cotações recentes, múltiplos tickers) ────
    const tickers = (req.query.tickers || '').split(',').map(t => t.trim()).filter(Boolean);
    if (!tickers.length) return res.status(200).json({ results: [] });

    // Usar datas customizadas se fornecidas, senão últimos 7 dias
    const today = new Date();
    const endDate = req.query.end_date || today.toISOString().slice(0, 10);
    const startDate = req.query.start_date || new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Separar tickers nacionais (B3) de internacionais (USD)
    const intlFlag = req.query.intl || ''; // tickers internacionais passados explicitamente
    const intlTickers = intlFlag ? intlFlag.split(',').map(t => t.trim().toUpperCase()).filter(Boolean) : [];
    const brTickers = tickers.filter(t => intlTickers.indexOf(t.toUpperCase()) < 0);

    // Requisições SEQUENCIAIS com delay para evitar rate limit 429
    const results = [];
    for (let i = 0; i < brTickers.length; i++) {
      const ticker = brTickers[i];
      const identifier = toIdentifierFn(ticker);

      // Delay entre requisições (150ms) — exceto a primeira
      if (i > 0) await sleep(150);

      try {
        const url = baseUrl + '/quotes/' + identifier + '?start_date=' + startDate + '&end_date=' + endDate;
        const resp = await fetch(url, { headers });

        if (resp.status === 429) {
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

    // ─── ETFs/ações internacionais via Yahoo Finance ───────
    if (intlTickers.length) {
      try {
        const yahooSymbols = intlTickers.join(',');
        const yahooUrl = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(yahooSymbols) + '&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketTime';
        const yResp = await fetch(yahooUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (yResp.ok) {
          const yData = await yResp.json();
          const yQuotes = (yData.quoteResponse && yData.quoteResponse.result) || [];
          yQuotes.forEach(q => {
            results.push({
              symbol: q.symbol,
              shortName: q.shortName || q.symbol,
              regularMarketPrice: q.regularMarketPrice || 0,
              regularMarketChangePercent: q.regularMarketChangePercent || 0,
              regularMarketChange: q.regularMarketChange || 0,
              regularMarketPreviousClose: q.regularMarketPreviousClose || 0,
              regularMarketDayHigh: q.regularMarketDayHigh || null,
              regularMarketDayLow: q.regularMarketDayLow || null,
              regularMarketOpen: q.regularMarketOpen || null,
              regularMarketTime: q.regularMarketTime ? new Date(q.regularMarketTime * 1000).toISOString() : null,
              regularMarketVolume: q.regularMarketVolume || null,
              fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
              fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
              logourl: null,
              currency: q.currency || 'USD',
              _source: 'yahoo'
            });
          });
        } else {
          console.error('[Yahoo] HTTP', yResp.status, 'for', yahooSymbols);
        }
      } catch(e) {
        console.error('[Yahoo] Exception:', e.message);
      }
    }

    return res.status(200).json({
      results,
      _debug: { totalTickers: tickers.length, brTickers: brTickers.length, intlTickers: intlTickers.length, returned: results.length, startDate, endDate }
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
  // ETFs brasileiros populares
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
