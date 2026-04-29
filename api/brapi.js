export default async function handler(req, res) {
  const tickers = req.query.tickers || '';

  // Adicionar .SA para tickers brasileiros que não têm sufixo
  const symbols = tickers.split(',').map(function(t) {
    t = t.trim();
    if (!t) return '';
    // Se já tem sufixo (ex: =SA, .SA), manter
    if (t.indexOf('.') > 0 || t.indexOf('=') > 0) return t;
    // Adicionar .SA para tickers brasileiros
    return t + '.SA';
  }).filter(Boolean).join(',');

  const yahooUrl = 'https://query2.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(symbols);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    // Normalizar resposta para formato simples
    var results = [];
    if (data && data.quoteResponse && data.quoteResponse.result) {
      results = data.quoteResponse.result.map(function(r) {
        // Remover .SA do symbol para bater com o ticker original
        var sym = (r.symbol || '').replace('.SA', '');
        return {
          symbol: sym,
          shortName: r.shortName || r.longName || '',
          regularMarketPrice: r.regularMarketPrice,
          regularMarketChangePercent: r.regularMarketChangePercent,
          regularMarketDayHigh: r.regularMarketDayHigh,
          regularMarketDayLow: r.regularMarketDayLow,
          regularMarketOpen: r.regularMarketOpen,
          regularMarketPreviousClose: r.regularMarketPreviousClose,
          regularMarketTime: r.regularMarketTime ? r.regularMarketTime * 1000 : null,
          regularMarketVolume: r.regularMarketVolume,
          fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: r.fiftyTwoWeekLow,
          logourl: null
        };
      });
    }
    return res.status(200).json({ results: results });
  } catch (error) {
    return res.status(500).json({ error: error.message, results: [] });
  }
}
