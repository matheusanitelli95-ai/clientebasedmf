export default async function handler(req, res) {
  const tickers = req.query.tickers || '';

  // Adicionar .SA apenas para tickers brasileiros simples (sem ^, =, -, .)
  const tickerList = tickers.split(',').map(function(t) {
    t = t.trim();
    if (!t) return '';
    // Manter como está se já tem sufixo ou é índice/futuro/cripto/moeda
    if (t.indexOf('.') > 0 || t.indexOf('=') > 0 || t.indexOf('^') >= 0 || t.indexOf('-') > 0) return t;
    // Adicionar .SA para tickers brasileiros
    return t + '.SA';
  }).filter(Boolean);

  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app') ? req.headers.origin : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');

  try {
    // Buscar cada ticker via Yahoo Finance v8 chart (não precisa de auth)
    const promises = tickerList.map(async function(sym) {
      try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=1d&includePrePost=false';
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        const data = await resp.json();
        if (!data.chart || !data.chart.result || !data.chart.result[0]) return null;
        const meta = data.chart.result[0].meta;
        const indicators = data.chart.result[0].indicators;
        const timestamps = data.chart.result[0].timestamp || [];
        const quotes = indicators && indicators.quote && indicators.quote[0] ? indicators.quote[0] : {};

        // Pegar high/low do dia dos arrays de dados
        const highs = (quotes.high || []).filter(v => v != null);
        const lows = (quotes.low || []).filter(v => v != null);
        const dayHigh = highs.length ? Math.max(...highs) : meta.regularMarketDayHigh || null;
        const dayLow = lows.length ? Math.min(...lows) : meta.regularMarketDayLow || null;

        // Remover apenas o sufixo .SA (tickers brasileiros), manter outros (.MI, .SS, etc.)
        const rawSym = meta.symbol || sym;
        const cleanSym = rawSym.endsWith('.SA') ? rawSym.slice(0, -3) : rawSym;

        // Calcular variação % — tentar múltiplas fontes
        var prevClose = meta.previousClose || meta.chartPreviousClose || null;
        var curPrice = meta.regularMarketPrice;
        var changePercent = 0;
        if(prevClose && curPrice && prevClose !== 0){
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
