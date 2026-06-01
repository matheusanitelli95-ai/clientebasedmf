// Proxy Yahoo Finance — v8 chart com fallback v6 quote
// Busca cotações em tempo real de índices, futuros, ETFs, moedas e cripto

export default async function handler(req, res) {
  const tickers = req.query.tickers || '';

  // Adicionar .SA apenas para tickers brasileiros simples (sem ^, =, -, .)
  const tickerList = tickers.split(',').map(function(t) {
    t = t.trim();
    if (!t) return '';
    if (t.indexOf('.') > 0 || t.indexOf('=') > 0 || t.indexOf('^') >= 0 || t.indexOf('-') > 0) return t;
    return t + '.SA';
  }).filter(Boolean);

  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app') ? req.headers.origin : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (!tickerList.length && req.query.action !== 'debug') return res.status(200).json({ results: [] });

  // Debug mode — mostra resposta raw de cada endpoint Yahoo
  if (req.query.action === 'debug') {
    const sym = tickerList[0] || 'EWZ';
    const debugResults = {};

    // Test v7
    try {
      const v7url = 'https://query2.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(sym);
      const v7resp = await fetch(v7url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      debugResults.v7 = { status: v7resp.status, ok: v7resp.ok, body: (await v7resp.text()).slice(0, 1000) };
    } catch(e) { debugResults.v7 = { error: e.message }; }

    // Test v8
    try {
      const v8url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=2d';
      const v8resp = await fetch(v8url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      debugResults.v8 = { status: v8resp.status, ok: v8resp.ok, body: (await v8resp.text()).slice(0, 1000) };
    } catch(e) { debugResults.v8 = { error: e.message }; }

    // Test query1 v8
    try {
      const q1url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=2d';
      const q1resp = await fetch(q1url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      debugResults.query1_v8 = { status: q1resp.status, ok: q1resp.ok, body: (await q1resp.text()).slice(0, 1000) };
    } catch(e) { debugResults.query1_v8 = { error: e.message }; }

    return res.status(200).json({ ticker: sym, debug: debugResults });
  }

  try {
    // Tentar buscar todos via v7 quote batch primeiro (mais confiável em serverless)
    const v7Result = await tryV7Quote(tickerList);
    if (v7Result && v7Result.length > 0) {
      return res.status(200).json({ results: v7Result, _source: 'v7' });
    }

    // Fallback: buscar cada ticker via v8 chart individualmente
    const v8Result = await tryV8Chart(tickerList);
    if (v8Result && v8Result.length > 0) {
      return res.status(200).json({ results: v8Result, _source: 'v8' });
    }

    // Último fallback: v6 quote
    const v6Result = await tryV6Quote(tickerList);
    return res.status(200).json({ results: v6Result || [], _source: 'v6' });

  } catch (error) {
    console.error('[brapi] Top-level error:', error.message);
    return res.status(200).json({ error: error.message, results: [] });
  }
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ── v7 finance/quote (batch) ──
async function tryV7Quote(tickerList) {
  try {
    const url = 'https://query2.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(tickerList.join(','));
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' }
    });
    if (!resp.ok) {
      console.log('[brapi] v7 HTTP', resp.status);
      return null;
    }
    const data = await resp.json();
    const quotes = data.quoteResponse && data.quoteResponse.result ? data.quoteResponse.result : [];
    if (!quotes.length) return null;

    return quotes.map(function(q) {
      const rawSym = q.symbol || '';
      const cleanSym = rawSym.endsWith('.SA') ? rawSym.slice(0, -3) : rawSym;
      return {
        symbol: cleanSym,
        shortName: q.shortName || q.longName || '',
        regularMarketPrice: q.regularMarketPrice,
        regularMarketChangePercent: q.regularMarketChangePercent || 0,
        regularMarketChange: q.regularMarketChange || 0,
        regularMarketDayHigh: q.regularMarketDayHigh || null,
        regularMarketDayLow: q.regularMarketDayLow || null,
        regularMarketOpen: q.regularMarketOpen || null,
        regularMarketPreviousClose: q.regularMarketPreviousClose || null,
        regularMarketTime: q.regularMarketTime ? q.regularMarketTime * 1000 : null,
        regularMarketVolume: q.regularMarketVolume || null,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
        logourl: null
      };
    }).filter(function(r) { return r.regularMarketPrice != null; });
  } catch(e) {
    console.error('[brapi] v7 error:', e.message);
    return null;
  }
}

// ── v8 finance/chart (individual) ──
async function tryV8Chart(tickerList) {
  try {
    const promises = tickerList.map(async function(sym) {
      try {
        const url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=2d&includePrePost=false';
        const resp = await fetch(url, {
          headers: { 'User-Agent': UA, 'Accept': 'application/json' }
        });
        if (!resp.ok) return null;
        const text = await resp.text();
        let data;
        try { data = JSON.parse(text); } catch(e) { return null; }
        if (!data.chart || !data.chart.result || !data.chart.result[0]) return null;
        const meta = data.chart.result[0].meta;
        const indicators = data.chart.result[0].indicators;
        const quotes = indicators && indicators.quote && indicators.quote[0] ? indicators.quote[0] : {};

        const highs = (quotes.high || []).filter(v => v != null);
        const lows = (quotes.low || []).filter(v => v != null);
        const dayHigh = highs.length ? Math.max(...highs) : meta.regularMarketDayHigh || null;
        const dayLow = lows.length ? Math.min(...lows) : meta.regularMarketDayLow || null;

        const rawSym = meta.symbol || sym;
        const cleanSym = rawSym.endsWith('.SA') ? rawSym.slice(0, -3) : rawSym;

        var prevClose = meta.previousClose || meta.chartPreviousClose || null;
        var curPrice = meta.regularMarketPrice;
        var changePercent = 0;
        if (prevClose && curPrice && prevClose !== 0) {
          changePercent = ((curPrice - prevClose) / prevClose * 100);
        }

        return {
          symbol: cleanSym,
          shortName: meta.shortName || meta.longName || '',
          regularMarketPrice: curPrice,
          regularMarketChangePercent: changePercent,
          regularMarketChange: prevClose ? (curPrice - prevClose) : 0,
          regularMarketDayHigh: dayHigh,
          regularMarketDayLow: dayLow,
          regularMarketOpen: meta.regularMarketOpen || (quotes.open && quotes.open[0]) || null,
          regularMarketPreviousClose: prevClose,
          regularMarketTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : null,
          regularMarketVolume: meta.regularMarketVolume || null,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
          logourl: null
        };
      } catch(e) { return null; }
    });
    const all = await Promise.all(promises);
    return all.filter(Boolean);
  } catch(e) {
    console.error('[brapi] v8 error:', e.message);
    return null;
  }
}

// ── v6 finance/quote (individual) ──
async function tryV6Quote(tickerList) {
  try {
    const promises = tickerList.map(async function(sym) {
      try {
        const url = 'https://query2.finance.yahoo.com/v6/finance/quote?symbols=' + encodeURIComponent(sym);
        const resp = await fetch(url, {
          headers: { 'User-Agent': UA, 'Accept': 'application/json' }
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const quotes = data.quoteResponse && data.quoteResponse.result ? data.quoteResponse.result : [];
        if (!quotes.length) return null;
        const q = quotes[0];
        const rawSym = q.symbol || '';
        const cleanSym = rawSym.endsWith('.SA') ? rawSym.slice(0, -3) : rawSym;

        return {
          symbol: cleanSym,
          shortName: q.shortName || q.longName || '',
          regularMarketPrice: q.regularMarketPrice,
          regularMarketChangePercent: q.regularMarketChangePercent || 0,
          regularMarketChange: q.regularMarketChange || 0,
          regularMarketDayHigh: q.regularMarketDayHigh || null,
          regularMarketDayLow: q.regularMarketDayLow || null,
          regularMarketOpen: q.regularMarketOpen || null,
          regularMarketPreviousClose: q.regularMarketPreviousClose || null,
          regularMarketTime: q.regularMarketTime ? q.regularMarketTime * 1000 : null,
          regularMarketVolume: q.regularMarketVolume || null,
          fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
          logourl: null
        };
      } catch(e) { return null; }
    });
    const all = await Promise.all(promises);
    return all.filter(Boolean);
  } catch(e) {
    console.error('[brapi] v6 error:', e.message);
    return null;
  }
}
