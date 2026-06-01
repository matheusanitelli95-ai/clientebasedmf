// Proxy Yahoo Finance — v8 chart API
// Busca cotações de índices, futuros, ETFs, moedas e cripto
// NÃO adiciona .SA a ETFs internacionais (EWZ, SPY, QQQ etc.)

export default async function handler(req, res) {
  const tickers = req.query.tickers || '';

  // Lógica inteligente de sufixo .SA:
  // - Tickers com ^, =, -, . → manter como estão (índices, futuros, moedas, cripto, ETFs globais já com sufixo)
  // - Tickers que parecem brasileiros (4 letras + 1-2 números, ex: PETR4) → adicionar .SA
  // - Tickers curtos de 2-4 letras sem números (EWZ, SPY, QQQ, GLD) → manter como estão (ETFs US)
  const tickerList = tickers.split(',').map(function(t) {
    t = t.trim();
    if (!t) return '';
    // Já tem sufixo ou caractere especial → manter
    if (t.indexOf('=') > 0 || t.indexOf('^') >= 0 || t.indexOf('-') > 0) return t;
    // Já tem ponto (ex: FTSEMIB.MI, 000001.SS) → manter
    if (t.indexOf('.') > 0) return t;
    // Padrão brasileiro: 4+ letras seguidas de 1-2 dígitos (PETR4, VALE3, BBDC4, WEGE3, BOVA11)
    if (/^[A-Za-z]{4,6}\d{1,2}$/.test(t)) return t + '.SA';
    // Todo o resto (EWZ, SPY, QQQ, IWM, GLD, TLT) → manter sem .SA
    return t;
  }).filter(Boolean);

  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app') ? req.headers.origin : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=180');

  if (!tickerList.length && req.query.action !== 'debug') return res.status(200).json({ results: [] });

  // Debug mode — mostra resposta raw do Yahoo
  if (req.query.action === 'debug') {
    const sym = tickerList[0] || 'EWZ';
    const debugResults = {};

    // Test v8 chart (primary)
    try {
      const v8url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=2d';
      const v8resp = await fetch(v8url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      debugResults.v8 = { url: v8url, status: v8resp.status, ok: v8resp.ok, body: (await v8resp.text()).slice(0, 500) };
    } catch(e) { debugResults.v8 = { error: e.message }; }

    // Test v8 via query1
    try {
      const q1url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=2d';
      const q1resp = await fetch(q1url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      debugResults.query1_v8 = { url: q1url, status: q1resp.status, ok: q1resp.ok, body: (await q1resp.text()).slice(0, 500) };
    } catch(e) { debugResults.query1_v8 = { error: e.message }; }

    return res.status(200).json({ ticker: sym, tickerListSample: tickerList.slice(0, 5), debug: debugResults });
  }

  try {
    // Buscar cada ticker via v8 chart — sequencial para evitar rate limit
    const results = [];
    for (let i = 0; i < tickerList.length; i++) {
      const sym = tickerList[i];
      if (i > 0) await sleep(100);
      const item = await fetchV8Chart(sym);
      if (item) results.push(item);
    }

    return res.status(200).json({ results, _source: 'v8', _total: tickerList.length });

  } catch (error) {
    console.error('[brapi] Top-level error:', error.message);
    return res.status(200).json({ error: error.message, results: [] });
  }
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function fetchV8Chart(sym) {
  try {
    // Tentar query2 primeiro, fallback para query1
    let data = await tryChart('query2', sym);
    if (!data) data = await tryChart('query1', sym);
    if (!data) return null;

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
  } catch(e) {
    console.error('[brapi] Error fetching', sym, ':', e.message);
    return null;
  }
}

async function tryChart(host, sym) {
  try {
    const url = 'https://' + host + '.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=2d&includePrePost=false';
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.chart || !data.chart.result || !data.chart.result[0]) return null;
    return data;
  } catch(e) {
    return null;
  }
}
