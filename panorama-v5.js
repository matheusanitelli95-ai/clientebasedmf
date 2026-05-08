(function(){
  // 1. Inject Google Fonts
  var fl = document.createElement('link');
  fl.rel = 'preconnect'; fl.href = 'https://fonts.googleapis.com';
  document.head.appendChild(fl);
  var fl2 = document.createElement('link');
  fl2.rel = 'preconnect'; fl2.href = 'https://fonts.gstatic.com'; fl2.crossOrigin = 'anonymous';
  document.head.appendChild(fl2);
  var gf = document.createElement('link');
  gf.rel = 'stylesheet';
  gf.href = 'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
  document.head.appendChild(gf);

  // 2. Inject CSS â faithful replica of Construtor de Capital style
  var css = document.createElement('style');
  css.textContent = `
    :root {
      --bg:#0D1117; --bg2:#161B22; --bg3:#1C2128;
      --amber:#EFA500; --text:#E6EDF3; --text-dim:#8B949E;
      --green:#3FB950; --red:#F85149; --border:#30363D;
    }
    #panorama-container {
      background: var(--bg); color: var(--text);
      font-family: 'Barlow', sans-serif; font-size: 14px;
      line-height: 1.55; padding: 0;
    }
    #panorama-container * { box-sizing: border-box; margin: 0; padding: 0; }

    /* Ticker Bar */
    .pnm-ticker-bar {
      display: grid; grid-template-columns: repeat(6,1fr);
      background: var(--bg2); border-bottom: 2px solid var(--amber);
    }
    .pnm-tc {
      padding: 10px 8px; text-align: center;
      border-right: 1px solid var(--border);
    }
    .pnm-tc:last-child { border-right: none; }
    .pnm-tl {
      font-size: 10px; color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace; margin-bottom: 3px;
    }
    .pnm-tp {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 22px; font-weight: 700; color: #fff; line-height: 1;
    }
    .pnm-tv {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; font-weight: 600; margin-top: 3px;
    }

    /* News Bar */
    .pnm-news-bar {
      background: var(--amber); color: var(--bg);
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px; font-weight: 700;
      padding: 5px 10px; margin-bottom: 14px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Section Header */
    .pnm-sh {
      background: var(--bg2); border-bottom: 2px solid var(--amber);
      padding: 6px 8px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px; font-weight: 700; color: var(--amber);
      letter-spacing: 0.8px; text-transform: uppercase;
    }
    .pnm-sh::before { content: "â  "; }

    /* Section wrapper */
    .pnm-sec { margin-bottom: 16px; }

    /* Tables */
    .pnm-tbl {
      width: 100%; border-collapse: collapse; font-size: 12.5px;
    }
    .pnm-tbl thead td {
      background: var(--bg3); color: var(--amber);
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 12px; font-weight: 700;
      padding: 5px 7px; border-bottom: 1px solid var(--amber);
      text-align: center;
    }
    .pnm-tbl thead td:first-child { text-align: left; }
    .pnm-tbl thead td:nth-child(2) { text-align: left; }
    .pnm-tbl tbody tr:nth-child(odd) td { background: var(--bg); }
    .pnm-tbl tbody tr:nth-child(even) td { background: var(--bg2); }
    .pnm-tbl tbody tr td {
      padding: 5px 7px; border-bottom: 1px solid var(--border);
      vertical-align: middle; text-align: center; line-height: 1.4;
    }
    .pnm-tbl tbody tr td:first-child { text-align: left; }
    .pnm-tbl tbody tr td:nth-child(2) { text-align: left; }
    .pnm-tbl tbody tr:hover td { background: #1f2937; }

    /* Utility */
    .pnm-mono { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; }
    .pnm-gr { color: var(--green); font-weight: 600; }
    .pnm-rd { color: var(--red); font-weight: 600; }
    .pnm-ag { color: var(--amber); }
    .pnm-wh { color: #fff; font-weight: 600; }
    .pnm-dm { color: var(--text-dim); }
    .pnm-bl {
      font-weight: 700; font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px;
    }
    .pnm-badge {
      display: inline-block; padding: 2px 7px; border-radius: 2px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 11px; font-weight: 700; white-space: nowrap;
    }
    .pnm-bp { background: var(--green); color: #000; }
    .pnm-bn { background: var(--red); color: #fff; }
    .pnm-bnt { background: #3D4451; color: #fff; }

    /* Context box */
    .pnm-ctx {
      background: var(--bg2); padding: 12px 14px;
      font-size: 13px; line-height: 1.65; text-align: justify;
      border-left: 3px solid var(--amber);
    }

    /* Footer */
    .pnm-footer {
      border-top: 1px solid var(--border);
      padding: 8px 0; display: flex; justify-content: space-between;
      font-size: 11px; color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace; margin-top: 14px;
    }
  `;
  document.head.appendChild(css);

  // 3. Helpers
  function fmt(v) {
    if (typeof v !== 'number' || isNaN(v)) return 'â';
    return typeof fmtPanoramaNum === 'function' ? fmtPanoramaNum(v) : v.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function fmtVar(v) {
    if (typeof v !== 'number' || isNaN(v)) return 'â';
    return (v > 0 ? '+' : '') + v.toFixed(2) + '%';
  }
  function varCls(v) {
    if (typeof v !== 'number') return 'pnm-dm';
    return v > 0 ? 'pnm-gr' : v < 0 ? 'pnm-rd' : 'pnm-dm';
  }
  function badge(v) {
    if (typeof v !== 'number') return '<span class="pnm-badge pnm-bnt">â</span>';
    var c = v > 0 ? 'pnm-bp' : v < 0 ? 'pnm-bn' : 'pnm-bnt';
    return '<span class="pnm-badge ' + c + '">' + fmtVar(v) + '</span>';
  }

  // Ticker categorization
  var CAT = {
    'INDICES_BR': {
      label: 'ÃNDICES BRASIL',
      tickers: ['IBOV','IFIX','SMLL','IDIV','IBXX']
    },
    'ACOES_BR': {
      label: 'AÃÃES B3 â DESTAQUES',
      tickers: ['PETR4','VALE3','ITUB4','BBDC4','BBAS3','WEGE3','RENT3','ABEV3','MGLU3','SUZB3','B3SA3','ELET3','ELET6','JBSS3','HAPV3','RDOR3','PRIO3','CSAN3','GGBR4','CSNA3','EMBR3','LREN3','VIVT3','TOTS3','RADL3','RAIL3']
    },
    'MOEDAS': {
      label: 'MOEDAS & CÃMBIO',
      tickers: ['USDBRL','EURBRL','GBPBRL','EURUSD','GBPUSD','USDJPY','DXY']
    },
    'COMMODITIES': {
      label: 'COMMODITIES',
      tickers: ['PETR','BRENT','WTI','CL','GC','SI','OURO','GOLD','PRATA','SILVER','SOJA','MILHO','CAFE','IRON','HG','NG']
    },
    'INDICES_GLOBAL': {
      label: 'ÃNDICES GLOBAIS',
      tickers: ['SP500','SPX','DOWI','DJI','IXIC','NDX','COMP','VIX','FTSE','DAX','CAC','NIKKEI','N225','HSI','SSEC','STOXX','STOXX50','KOSPI','ASX','RUSSELL','RTY','NQ','ES','YM']
    },
    'JUROS': {
      label: 'JUROS & RENDA FIXA',
      tickers: ['DI1F','DI1N','DI1J','SELIC','US10Y','US2Y','US30Y','LFTB11','IMAB11','IRFM11','B5P211']
    },
    'CRIPTO': {
      label: 'CRIPTOMOEDAS',
      tickers: ['BTC','ETH','SOL','BNB','ADA','XRP','DOGE','DOT','AVAX','MATIC','LINK']
    }
  };

  function categorize(allData) {
    var result = {};
    var used = {};
    // First pass: match known tickers to categories
    var catOrder = ['INDICES_BR','ACOES_BR','COMMODITIES','MOEDAS','INDICES_GLOBAL','JUROS','CRIPTO'];
    catOrder.forEach(function(catKey) {
      var cat = CAT[catKey];
      var items = [];
      cat.tickers.forEach(function(tk) {
        if (allData[tk]) {
          items.push(allData[tk]);
          used[tk] = true;
        }
      });
      if (items.length > 0) {
        result[catKey] = { label: cat.label, items: items };
      }
    });
    // Second pass: any remaining tickers go to "OUTROS"
    var outros = [];
    Object.keys(allData).forEach(function(tk) {
      if (!used[tk]) {
        outros.push(allData[tk]);
      }
    });
    if (outros.length > 0) {
      result['OUTROS'] = { label: 'OUTROS ATIVOS', items: outros };
    }
    return result;
  }

  // Pick top tickers for the ticker bar
  function pickTopTickers(allData) {
    var priority = ['IBOV','USDBRL','PETR4','VALE3','SP500','BTC','DXY','VIX','WEGE3','BBAS3','ITUB4','BBDC4'];
    var picked = [];
    for (var i = 0; i < priority.length && picked.length < 6; i++) {
      if (allData[priority[i]]) picked.push(allData[priority[i]]);
    }
    // If less than 6, fill with whatever is available
    if (picked.length < 6) {
      var pickedSyms = {};
      picked.forEach(function(d){ pickedSyms[d.symbol] = true; });
      Object.keys(allData).forEach(function(tk) {
        if (picked.length < 6 && !pickedSyms[tk]) {
          picked.push(allData[tk]);
          pickedSyms[tk] = true;
        }
      });
    }
    return picked;
  }

  // Build table HTML
  function buildTable(items) {
    var h = '<table class="pnm-tbl"><thead><tr>';
    h += '<td style="width:65px">TICKER</td>';
    h += '<td>NOME</td>';
    h += '<td style="width:85px">PREÃO</td>';
    h += '<td style="width:70px">VAR %</td>';
    h += '<td style="width:85px">ABERTURA</td>';
    h += '<td style="width:75px">MÃX</td>';
    h += '<td style="width:75px">MÃN</td>';
    h += '<td style="width:90px">VOLUME</td>';
    h += '</tr></thead><tbody>';
    items.forEach(function(d) {
      var vc = varCls(d.variacao);
      h += '<tr>';
      h += '<td class="pnm-ag pnm-bl">' + d.symbol + '</td>';
      h += '<td>' + (d.nome || d.symbol) + '</td>';
      h += '<td class="pnm-mono pnm-wh">' + fmt(d.preco) + '</td>';
      h += '<td class="pnm-mono ' + vc + '" style="font-weight:700">' + fmtVar(d.variacao) + '</td>';
      h += '<td class="pnm-mono">' + fmt(d.abertura) + '</td>';
      h += '<td class="pnm-mono">' + fmt(d.maxDia) + '</td>';
      h += '<td class="pnm-mono">' + fmt(d.minDia) + '</td>';
      h += '<td class="pnm-mono">' + fmt(d.volume) + '</td>';
      h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  // 4. Override renderPanorama
  window.renderPanorama = function(allData) {
    window.__panoramaData = allData;
    var body = document.getElementById('panorama-body');
    if (!body) return;
    var container = document.getElementById('panorama-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'panorama-container';
      body.innerHTML = '';
      body.appendChild(container);
    }

    var html = '';

    // === TICKER BAR ===
    var topTickers = pickTopTickers(allData);
    html += '<div class="pnm-ticker-bar">';
    topTickers.forEach(function(d) {
      var vc = varCls(d.variacao);
      html += '<div class="pnm-tc">';
      html += '<div class="pnm-tl">' + d.symbol + '</div>';
      html += '<div class="pnm-tp">' + fmt(d.preco) + '</div>';
      html += '<div class="pnm-tv ' + vc + '">' + fmtVar(d.variacao) + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // === NEWS BAR ===
    var newsItems = [];
    Object.keys(allData).forEach(function(tk) {
      var d = allData[tk];
      if (d && typeof d.preco === 'number') {
        newsItems.push(d.symbol + ' ' + fmt(d.preco) + ' ' + fmtVar(d.variacao));
      }
    });
    html += '<div class="pnm-news-bar">';
    html += '<strong>PANORAMA DO MERCADO</strong> Â· ' + newsItems.slice(0, 12).join(' Â· ');
    html += '</div>';

    // === CATEGORIZED SECTIONS ===
    var cats = categorize(allData);
    var catOrder = ['INDICES_BR','ACOES_BR','COMMODITIES','MOEDAS','INDICES_GLOBAL','JUROS','CRIPTO','OUTROS'];
    catOrder.forEach(function(catKey) {
      if (!cats[catKey]) return;
      var cat = cats[catKey];
      html += '<div class="pnm-sec">';
      html += '<div class="pnm-sh">' + cat.label + '</div>';
      html += buildTable(cat.items);
      html += '</div>';
    });

    // === FOOTER ===
    var now = new Date();
    var timeStr = now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    var dateStr = now.toLocaleDateString('pt-BR');
    html += '<div class="pnm-footer">';
    html += '<span>DMF Â· Panorama do Mercado</span>';
    html += '<span>' + dateStr + ' Â· ' + timeStr + '</span>';
    html += '</div>';

    container.innerHTML = html;
  };
})();
