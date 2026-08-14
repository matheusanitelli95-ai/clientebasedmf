// ═══════════════════════════════════════════════════════════════
// Google Finance Integration — Search, Quote, Stats
// Search: Yahoo Finance (cobertura universal: crypto, ETFs, ações)
// Quote: Google Finance scraping (preço em tempo real)
// Stats: Yahoo Chart API (retornos mensais para análise de carteira)
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app')
    ? req.headers.origin : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const action = req.query.action || 'search';

  try {
    if (action === 'search') return await handleSearch(req, res);
    if (action === 'quote')  return await handleQuote(req, res);
    if (action === 'stats')  return await handleStats(req, res);
    return res.status(200).json({ error: 'Unknown action: ' + action });
  } catch (error) {
    console.error('[GFinance] Fatal:', error.message);
    return res.status(500).json({ error: error.message, results: [] });
  }
}

// ═══════════════════════════════════════════════════════════════
// SEARCH — Yahoo Finance search (universal: crypto, ETF, stocks)
// ═══════════════════════════════════════════════════════════════
async function handleSearch(req, res) {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 1) return res.status(200).json({ results: [] });

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  try {
    // Yahoo Finance v1 search
    const url = 'https://query1.finance.yahoo.com/v1/finance/search?q='
      + encodeURIComponent(q) + '&quotesCount=10&newsCount=0&enableFuzzyQuery=true&region=BR&lang=pt-BR';

    const resp = await fetch(url, { headers: UA_HEADERS });

    if (!resp.ok) {
      console.log('[GF-Search] Yahoo v1 HTTP', resp.status, '- trying autoc');
      return await handleSearchFallback(q, res);
    }

    const data = await resp.json();
    const quotes = (data.quotes || []).filter(function(q) { return q.isYahooFinance !== false; });

    const results = quotes.map(function(q) {
      return {
        symbol: cleanSymbol(q.symbol),
        yahooSymbol: q.symbol || '',
        name: q.shortname || q.longname || q.symbol || '',
        exchange: q.exchDisp || q.exchange || '',
        type: q.typeDisp || q.quoteType || '',
        gfinanceId: buildGFinanceId(q.symbol, q.exchange, q.exchDisp, q.quoteType)
      };
    });

    return res.status(200).json({ results: results });
  } catch (e) {
    console.log('[GF-Search] Error:', e.message);
    return await handleSearchFallback(q, res);
  }
}

async function handleSearchFallback(q, res) {
  try {
    const url = 'https://autoc.finance.yahoo.com/autoc?query='
      + encodeURIComponent(q) + '&region=BR&lang=pt';
    const resp = await fetch(url, { headers: UA_HEADERS });
    if (!resp.ok) throw new Error('Autoc HTTP ' + resp.status);

    const data = await resp.json();
    const items = (data.ResultSet && data.ResultSet.Result) || [];

    const results = items.slice(0, 10).map(function(i) {
      return {
        symbol: cleanSymbol(i.symbol),
        yahooSymbol: i.symbol || '',
        name: i.name || '',
        exchange: i.exchDisp || i.exch || '',
        type: i.typeDisp || i.type || '',
        gfinanceId: buildGFinanceIdFromAutoc(i)
      };
    });
    return res.status(200).json({ results: results });
  } catch (e2) {
    console.log('[GF-Search-Fallback] Error:', e2.message);
    return res.status(200).json({ results: [], error: e2.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// QUOTE — Google Finance scraping + Yahoo fallback
// ═══════════════════════════════════════════════════════════════
async function handleQuote(req, res) {
  const symbols = (req.query.symbols || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  if (!symbols.length) return res.status(200).json({ results: [] });

  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

  const results = [];
  for (var i = 0; i < symbols.length; i++) {
    var sym = symbols[i];
    try {
      var quote = await fetchGoogleQuote(sym);
      if (!quote) {
        // Fallback: Yahoo Chart API
        quote = await fetchYahooQuote(sym);
      }
      if (quote) results.push(quote);
      else console.log('[GF-Quote] No data for', sym);
    } catch (e) {
      console.log('[GF-Quote] Error for', sym, ':', e.message);
    }
    if (i < symbols.length - 1) await sleep(80);
  }

  return res.status(200).json({ results: results });
}

// ═══════════════════════════════════════════════════════════════
// STATS — Yahoo Chart monthly returns (for Analisar Carteira)
// Returns same format as Mais Retorno stats endpoint
// ═══════════════════════════════════════════════════════════════
async function handleStats(req, res) {
  const symbol = (req.query.symbol || '').trim();
  if (!symbol) return res.status(200).json({ error: 'No symbol', stats: null, years: {} });

  const yearsRange = parseInt(req.query.years) || 10;

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');

  var yahooSym = toYahooSymbol(symbol);
  console.log('[GF-Stats] Fetching', symbol, '→ Yahoo:', yahooSym, '| range:', yearsRange + 'y');

  try {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/'
      + encodeURIComponent(yahooSym) + '?interval=1mo&range=' + yearsRange + 'y';

    var resp = await fetch(url, { headers: UA_HEADERS });
    if (!resp.ok) throw new Error('Yahoo Chart HTTP ' + resp.status);

    var data = await resp.json();
    var result = data.chart && data.chart.result && data.chart.result[0];
    if (!result) return res.status(200).json({ error: 'No chart data', stats: null, years: {} });

    var timestamps = result.timestamp || [];
    var closes = null;
    // Prefer adjusted close
    if (result.indicators && result.indicators.adjclose && result.indicators.adjclose[0]) {
      closes = result.indicators.adjclose[0].adjclose;
    }
    if (!closes && result.indicators && result.indicators.quote && result.indicators.quote[0]) {
      closes = result.indicators.quote[0].close;
    }
    if (!closes || timestamps.length < 3) {
      return res.status(200).json({ error: 'Insufficient data', stats: null, years: {} });
    }

    // Build monthly returns by year
    var yearlyData = {};
    var monthlyReturns = [];

    for (var i = 1; i < timestamps.length; i++) {
      var prev = closes[i - 1];
      var curr = closes[i];
      if (!prev || !curr || prev === 0) continue;

      var d = new Date(timestamps[i] * 1000);
      var year = String(d.getFullYear());
      var month = d.getMonth() + 1;
      var ret = ((curr - prev) / prev) * 100;

      if (!yearlyData[year]) yearlyData[year] = {};
      yearlyData[year][month] = parseFloat(ret.toFixed(4));
      monthlyReturns.push(ret);
    }

    // Calculate annual returns
    Object.keys(yearlyData).forEach(function(y) {
      var annual = 1;
      for (var m = 1; m <= 12; m++) {
        if (yearlyData[y][m] !== undefined) {
          annual *= (1 + yearlyData[y][m] / 100);
        }
      }
      yearlyData[y].year = parseFloat(((annual - 1) * 100).toFixed(4));
    });

    // Stats calculations
    var last12 = monthlyReturns.slice(-12);
    var last12Prof = 1;
    last12.forEach(function(r) { last12Prof *= (1 + r / 100); });
    last12Prof = last12Prof - 1;

    var mean = monthlyReturns.reduce(function(a, b) { return a + b; }, 0) / monthlyReturns.length;
    var variance = monthlyReturns.reduce(function(a, r) { return a + Math.pow(r - mean, 2); }, 0) / monthlyReturns.length;
    var monthlyVol = Math.sqrt(variance);
    var annualVol = (monthlyVol * Math.sqrt(12)) / 100;
    var worstMonth = Math.min.apply(null, monthlyReturns);
    var sharpe = annualVol > 0 ? last12Prof / annualVol : 0;

    // YTD
    var now = new Date();
    var curYear = String(now.getFullYear());
    var ytdProf = 1;
    if (yearlyData[curYear]) {
      for (var m = 1; m <= now.getMonth() + 1; m++) {
        if (yearlyData[curYear][m] !== undefined) {
          ytdProf *= (1 + yearlyData[curYear][m] / 100);
        }
      }
    }
    ytdProf = ytdProf - 1;

    var statsObj = {
      stats: {
        timeframe: {
          last_12_months: {
            profitability: parseFloat(last12Prof.toFixed(6)),
            volatility: parseFloat(annualVol.toFixed(6)),
            sharpe_ratio: parseFloat(sharpe.toFixed(4))
          },
          ytd: {
            profitability: parseFloat(ytdProf.toFixed(6))
          }
        },
        worst_monthly_return: parseFloat(worstMonth.toFixed(4))
      },
      years: yearlyData,
      _source: 'yahoo-chart',
      _symbol: symbol,
      _yahooSymbol: yahooSym
    };

    console.log('[GF-Stats] OK:', symbol, '| months:', monthlyReturns.length, '| 12m:', (last12Prof * 100).toFixed(1) + '%');
    return res.status(200).json(statsObj);
  } catch (e) {
    console.log('[GF-Stats] Error for', symbol, ':', e.message);
    return res.status(200).json({ error: e.message, stats: null, years: {} });
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

var UA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8'
};

function cleanSymbol(sym) {
  return (sym || '').replace('.SA', '');
}

// Yahoo exchange codes → Google Finance exchange codes
var US_EXCHANGE_MAP = {
  'NYSEArca': 'NYSEARCA', 'PCX': 'NYSEARCA', 'NYSEARCA': 'NYSEARCA',
  'NMS': 'NASDAQ', 'NGM': 'NASDAQ', 'NCM': 'NASDAQ',
  'NasdaqGS': 'NASDAQ', 'NasdaqGM': 'NASDAQ', 'NasdaqCM': 'NASDAQ', 'NASDAQ': 'NASDAQ',
  'NYQ': 'NYSE', 'NYSE': 'NYSE',
  'BTS': 'NYSEARCA', 'BATS': 'NYSEARCA',
  'AMEX': 'NYSEAMERICAN', 'ASE': 'NYSEAMERICAN'
};

var INTL_EXCHANGE_MAP = {
  'LSE': 'LON', 'LON': 'LON',
  'FRA': 'FRA', 'GER': 'FRA',
  'TYO': 'TYO', 'JPX': 'TYO',
  'HKG': 'HKG', 'HKSE': 'HKG',
  'TOR': 'TSE', 'TSE': 'TSE', 'VAN': 'CVE',
  'ASX': 'ASX', 'SHH': 'SHA', 'SHZ': 'SHE',
  'MEX': 'BMV', 'MIL': 'BIT', 'EPA': 'EPA', 'PAR': 'EPA',
  'MAD': 'BME', 'AMS': 'AMS', 'STO': 'STO', 'HEL': 'HEL',
  'CPH': 'CPH', 'OSL': 'OSL', 'IST': 'IST'
};

function buildGFinanceId(symbol, exchange, exchDisp, quoteType) {
  var sym = cleanSymbol(symbol);
  var exch = (exchange || '').toUpperCase();
  var ed = (exchDisp || '');
  var type = (quoteType || '').toUpperCase();

  // Crypto: BTC-USD → keep as BTC-USD
  if (type === 'CRYPTOCURRENCY' || exch === 'CCC') {
    return sym;
  }
  // Brazilian: SAO → BVMF
  if (exch === 'SAO') return sym + ':BVMF';

  // US exchanges
  var gExch = US_EXCHANGE_MAP[ed] || US_EXCHANGE_MAP[exch];
  if (gExch) return sym + ':' + gExch;

  // International
  var gIntl = INTL_EXCHANGE_MAP[ed] || INTL_EXCHANGE_MAP[exch];
  if (gIntl) return sym + ':' + gIntl;

  return sym + (exch ? ':' + exch : '');
}

function buildGFinanceIdFromAutoc(item) {
  var sym = cleanSymbol(item.symbol);
  var exch = (item.exch || '').toUpperCase();
  var ed = (item.exchDisp || '');

  if (item.type === 'C' || exch === 'CCC') return sym;
  if (exch === 'SAO') return sym + ':BVSP';

  var gExch = US_EXCHANGE_MAP[ed] || US_EXCHANGE_MAP[exch];
  if (gExch) return sym + ':' + gExch;

  var gIntl = INTL_EXCHANGE_MAP[ed] || INTL_EXCHANGE_MAP[exch];
  if (gIntl) return sym + ':' + gIntl;

  return sym + (exch ? ':' + exch : '');
}

// Convert gfinanceId → Yahoo symbol
function toYahooSymbol(gfinanceId) {
  if (!gfinanceId) return gfinanceId;

  // Crypto: BTC-USD → BTC-USD (already Yahoo format)
  if (gfinanceId.indexOf('-USD') >= 0 || gfinanceId.indexOf('-BRL') >= 0) return gfinanceId;

  if (gfinanceId.indexOf(':') >= 0) {
    var parts = gfinanceId.split(':');
    var ticker = parts[0];
    var exch = parts[1];

    if (exch === 'BVSP' || exch === 'BVMF') return ticker + '.SA';
    // US exchanges: no suffix needed
    if (exch === 'NYSEARCA' || exch === 'NYSE' || exch === 'NASDAQ' || exch === 'NYSEAMERICAN') return ticker;
    // International → Yahoo suffix
    var Y_MAP = { 'LON': '.L', 'FRA': '.F', 'TYO': '.T', 'HKG': '.HK', 'TSE': '.TO',
      'ASX': '.AX', 'SHA': '.SS', 'SHE': '.SZ', 'BMV': '.MX', 'BIT': '.MI',
      'EPA': '.PA', 'BME': '.MC', 'AMS': '.AS', 'STO': '.ST', 'HEL': '.HE',
      'CPH': '.CO', 'OSL': '.OL', 'IST': '.IS' };
    if (Y_MAP[exch]) return ticker + Y_MAP[exch];
    return ticker;
  }

  return gfinanceId;
}

// Fetch quote from Google Finance page scraping
async function fetchGoogleQuote(symbol) {
  // symbol: "VOO:NYSEARCA", "PETR4:BVSP", "BTC-USD"
  var ticker, exchanges;

  // Crypto: BTC-USD
  if (symbol.indexOf('-') >= 0 && (symbol.indexOf('-USD') >= 0 || symbol.indexOf('-BRL') >= 0)) {
    var url = 'https://www.google.com/finance/quote/' + encodeURIComponent(symbol);
    var result = await scrapeGPage(url, symbol.split('-')[0]);
    if (result) { result._gfinanceId = symbol; return result; }
    return null;
  }

  if (symbol.indexOf(':') >= 0) {
    var parts = symbol.split(':');
    ticker = parts[0];
    exchanges = [parts[1]];
  } else {
    ticker = symbol;
    // Guess: if has digits → BR, else try US exchanges
    if (/\d/.test(ticker)) {
      exchanges = ['BVMF'];
    } else {
      exchanges = ['NYSEARCA', 'NYSE', 'NASDAQ', 'BATS'];
    }
  }

  for (var i = 0; i < exchanges.length; i++) {
    var url = 'https://www.google.com/finance/quote/' + encodeURIComponent(ticker) + ':' + exchanges[i];
    var result = await scrapeGPage(url, ticker);
    if (result) {
      result._gfinanceId = ticker + ':' + exchanges[i];
      return result;
    }
  }
  return null;
}

// Fallback: Yahoo Chart API for current quote
async function fetchYahooQuote(symbol) {
  var yahooSym = toYahooSymbol(symbol);
  try {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/'
      + encodeURIComponent(yahooSym) + '?interval=1d&range=2d';
    var resp = await fetch(url, { headers: UA_HEADERS });
    if (!resp.ok) return null;

    var data = await resp.json();
    var meta = data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta;
    if (!meta || !meta.regularMarketPrice) return null;

    var prev = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
    var price = meta.regularMarketPrice;

    return {
      symbol: cleanSymbol(symbol.split(':')[0]),
      shortName: meta.shortName || meta.symbol || cleanSymbol(symbol),
      regularMarketPrice: price,
      regularMarketChangePercent: prev ? ((price - prev) / prev) * 100 : 0,
      regularMarketChange: prev ? (price - prev) : 0,
      regularMarketPreviousClose: prev,
      currency: meta.currency || 'USD',
      regularMarketTime: new Date().toISOString(),
      _source: 'yahoo-chart',
      _gfinanceId: symbol
    };
  } catch (e) {
    return null;
  }
}

// Scrape Google Finance page for price data
async function scrapeGPage(url, ticker) {
  try {
    var resp = await fetch(url, { headers: UA_HEADERS });
    if (!resp.ok) return null;

    var html = await resp.text();
    var priceMatch = html.match(/data-last-price="([0-9.]+)"/);
    if (!priceMatch) return null;

    var prevMatch = html.match(/data-previous-close="([0-9.]+)"/);
    var currMatch = html.match(/data-currency-code="([A-Z]+)"/);

    // Extract name from title: "Vanguard S&P 500 ETF (VOO) Stock Price — Google Finance"
    var name = ticker;
    var titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      var t = titleMatch[1]
        .replace(/\s*[-–]?\s*Google Finan.*$/i, '')
        .replace(/\s*Stock Price.*$/i, '')
        .replace(/\s*Share Price.*$/i, '')
        .replace(/\s*Price.*$/i, '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim();
      if (t) name = t;
    }

    var price = parseFloat(priceMatch[1]);
    var prev = prevMatch ? parseFloat(prevMatch[1]) : price;
    var currency = currMatch ? currMatch[1] : 'USD';

    return {
      symbol: ticker,
      shortName: name,
      regularMarketPrice: price,
      regularMarketChangePercent: prev && prev !== 0 ? ((price - prev) / prev) * 100 : 0,
      regularMarketChange: prev ? (price - prev) : 0,
      regularMarketPreviousClose: prev,
      currency: currency,
      regularMarketTime: new Date().toISOString(),
      _source: 'google-finance'
    };
  } catch (e) {
    return null;
  }
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}
