(function(){
  // 1. Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preconnect';
  fontLink.href = 'https://fonts.googleapis.com';
  document.head.appendChild(fontLink);

  const fontLink2 = document.createElement('link');
  fontLink2.rel = 'preconnect';
  fontLink2.href = 'https://fonts.gstatic.com';
  fontLink2.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink2);

  const googleFonts = document.createElement('link');
  googleFonts.rel = 'stylesheet';
  googleFonts.href = 'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap';
  document.head.appendChild(googleFonts);

  // 2. Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --bg: #0D1117;
      --bg2: #161B22;
      --bg3: #1C2128;
      --amber: #EFA500;
      --text: #E6EDF3;
      --text-dim: #8B949E;
      --green: #3FB950;
      --red: #F85149;
      --border: #30363D;
    }

    #panorama-container {
      background: var(--bg);
      color: var(--text);
      font-family: 'Barlow', sans-serif;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    #panorama-container * {
      box-sizing: border-box;
    }

    .pnm-ticker-bar {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      margin-bottom: 20px;
      background: var(--bg2);
      padding: 12px;
      border-bottom: 2px solid var(--amber);
      border-radius: 4px;
    }

    .pnm-ticker-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .pnm-ticker-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--text-dim);
      margin-bottom: 4px;
      font-weight: 500;
    }

    .pnm-ticker-price {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }

    .pnm-ticker-var {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
    }

    .pnm-ticker-var.pos {
      color: var(--green);
    }

    .pnm-ticker-var.neg {
      color: var(--red);
    }

    .pnm-news-bar {
      background: var(--amber);
      color: #000;
      padding: 8px 12px;
      margin-bottom: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      overflow: hidden;
      border-radius: 4px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .pnm-section-header {
      background: var(--bg2);
      border-bottom: 2px solid var(--amber);
      padding: 6px 8px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--amber);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 20px;
      margin-bottom: 12px;
      border-radius: 4px;
    }

    .pnm-section-header::before {
      content: "█  ";
      margin-right: 4px;
    }

    .pnm-hero-box {
      background: var(--bg2);
      border-left: 3px solid var(--amber);
      padding: 16px;
      margin-bottom: 20px;
      border-radius: 4px;
    }

    .pnm-hero-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--amber);
      margin-bottom: 8px;
    }

    .pnm-hero-price {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }

    .pnm-hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 12px;
      font-size: 12px;
    }

    .pnm-stat-item {
      display: flex;
      flex-direction: column;
      background: var(--bg3);
      padding: 8px;
      border-radius: 3px;
    }

    .pnm-stat-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 10px;
      color: var(--text-dim);
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .pnm-stat-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text);
      font-weight: 600;
    }

    .pnm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin-bottom: 20px;
    }

    .pnm-table thead td {
      color: var(--amber);
      background: var(--bg3);
      padding: 10px 8px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 12px;
      font-weight: 700;
      text-align: left;
      border-bottom: 2px solid var(--amber);
    }

    .pnm-table tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--border);
    }

    .pnm-table tbody tr:nth-child(odd) {
      background: var(--bg);
    }

    .pnm-table tbody tr:nth-child(even) {
      background: var(--bg2);
    }

    .pnm-table tbody tr:hover {
      background: #1f2937;
    }

    .pnm-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 2px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 11px;
      font-weight: 700;
    }

    .pnm-badge-positive {
      background: var(--green);
      color: #000;
    }

    .pnm-badge-negative {
      background: var(--red);
      color: #fff;
    }

    .pnm-badge-neutral {
      background: #3D4451;
      color: #fff;
    }

    .pnm-context-box {
      background: var(--bg2);
      padding: 12px 14px;
      font-size: 13px;
      border-left: 3px solid var(--amber);
      text-align: justify;
      margin-top: 20px;
      border-radius: 4px;
      line-height: 1.6;
    }

    .pnm-flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg2);
      padding: 12px;
      border-bottom: 2px solid var(--amber);
      border-radius: 4px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 12px;
    }

    .pnm-factor-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 12px;
    }

    .pnm-factor-cell {
      padding: 12px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }

    .pnm-factor-positive {
      background: #0D1F14;
      color: var(--green);
    }

    .pnm-factor-negative {
      background: #1F0D0D;
      color: var(--red);
    }
  `;
  document.head.appendChild(style);

  // 3. Helper functions
  function getTickerData(symbol) {
    return window.__panoramaData && window.__panoramaData[symbol] ? window.__panoramaData[symbol] : null;
  }

  function formatPrice(value) {
    if (typeof value !== 'number') return '—';
    return typeof fmtPanoramaNum === 'function' ? fmtPanoramaNum(value) : value.toFixed(2);
  }

  function formatVariation(value) {
    if (typeof value !== 'number') return '0%';
    return (value > 0 ? '+' : '') + value.toFixed(2) + '%';
  }

  function createBadge(variation) {
    const className = variation > 0 ? 'pnm-badge-positive' : variation < 0 ? 'pnm-badge-negative' : 'pnm-badge-neutral';
    return `<span class="pnm-badge ${className}">${formatVariation(variation)}</span>`;
  }

  // 4. Override renderPanorama
  window.renderPanorama = function(allData) {
    window.__panoramaData = allData;
    const body = document.getElementById('panorama-body');
    if (!body) return;
    // Create or reuse the styled container inside panorama-body
    let container = document.getElementById('panorama-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'panorama-container';
      body.innerHTML = '';
      body.appendChild(container);
    }

    let html = '';

    // Ticker Bar
    const tickers = ['IBOV', 'USDBRL', 'PETR4', 'VALE3', 'WEGE3', 'BBAS3'];
    html += '<div class="pnm-ticker-bar">';
    tickers.forEach(symbol => {
      const data = getTickerData(symbol);
      if (data) {
        const varClass = data.variacao > 0 ? 'pos' : 'neg';
        html += `
          <div class="pnm-ticker-cell">
            <div class="pnm-ticker-label">${data.symbol}</div>
            <div class="pnm-ticker-price">${formatPrice(data.preco)}</div>
            <div class="pnm-ticker-var ${varClass}">${formatVariation(data.variacao)}</div>
          </div>
        `;
      }
    });
    html += '</div>';

    // News Bar
    const ibov = getTickerData('IBOV');
    const usdbrl = getTickerData('USDBRL');
    const petr = getTickerData('PETR4');
    const vale = getTickerData('VALE3');
    let newsText = 'MERCADO: ';
    if (ibov) newsText += `IBOV ${formatPrice(ibov.preco)} ${formatVariation(ibov.variacao)} | `;
    if (usdbrl) newsText += `USD/BRL ${formatPrice(usdbrl.preco)} ${formatVariation(usdbrl.variacao)} | `;
    if (petr) newsText += `PETR4 ${formatPrice(petr.preco)} | `;
    if (vale) newsText += `VALE3 ${formatPrice(vale.preco)} `;
    html += `<div class="pnm-news-bar">${newsText}</div>`;

    // Hero Section - IBOVESPA
    if (ibov) {
      html += `
        <div class="pnm-hero-box">
          <div class="pnm-hero-title">IBOVESPA</div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="pnm-hero-price">${formatPrice(ibov.preco)}</div>
            <div>${createBadge(ibov.variacao)}</div>
          </div>
          <div class="pnm-hero-stats">
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Abertura</div>
              <div class="pnm-stat-value">${formatPrice(ibov.abertura)}</div>
            </div>
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Máxima</div>
              <div class="pnm-stat-value">${formatPrice(ibov.maxDia)}</div>
            </div>
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Mínima</div>
              <div class="pnm-stat-value">${formatPrice(ibov.minDia)}</div>
            </div>
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Volume</div>
              <div class="pnm-stat-value">${formatPrice(ibov.volume)}</div>
            </div>
          </div>
        </div>
      `;
    }

    // FUTUROS & COMMODITIES
    html += '<div class="pnm-section-header">Futuros & Commodities</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['PETR4', 'VALE3', 'BBDC4', 'ITUB4', 'BBAS3'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // SETORIAIS B3
    html += '<div class="pnm-section-header">Setoriais B3</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['WEGE3', 'RENT3', 'MGLU3', 'ABEV3', 'SUZB3'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // MOEDAS
    html += '<div class="pnm-section-header">Moedas</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['USDBRL', 'EURBRL'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // ÍNDICES GLOBAIS
    html += '<div class="pnm-section-header">Índices Globais</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    const globalTickers = Object.keys(allData).filter(k =>
      ['SP500', 'DOWI', 'IXIC', 'VIX', 'FTSE', 'DAX', 'NIKKEI'].includes(k)
    );
    if (globalTickers.length > 0) {
      globalTickers.forEach(sym => {
        const d = getTickerData(sym);
        if (d) {
          html += `<tr>
            <td><strong>${d.symbol}</strong></td>
            <td>${d.nome}</td>
            <td>${formatPrice(d.preco)}</td>
            <td>${createBadge(d.variacao)}</td>
            <td>${formatPrice(d.abertura)}</td>
            <td>${formatPrice(d.maxDia)}</td>
            <td>${formatPrice(d.minDia)}</td>
            <td>${formatPrice(d.volume)}</td>
          </tr>`;
        }
      });
    } else {
      html += '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-dim);">Sem dados disponíveis</td></tr>';
    }
    html += '</tbody></table>';

    // CRIPTO
    html += '<div class="pnm-section-header">Criptomoedas</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['BTC', 'ETH'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // Conclusion Box
    html += `
      <div class="pnm-flex-between">
        <span>Resumo do Mercado</span>
        <span class="pnm-badge pnm-badge-neutral">Live</span>
      </div>
      <div class="pnm-context-box">
        Acompanhe em tempo real os principais índices, commodities e ativos do mercado financeiro brasileiro e global.
        Os dados apresentados são atualizados continuamente para fornecer uma visão abrangente da dinâmica de mercado.
        Utilize essas informações para tomar decisões informadas sobre seus investimentos.
      </div>
    `;

    container.innerHTML = html;
  };
})();
(function(){
  // 1. Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preconnect';
  fontLink.href = 'https://fonts.googleapis.com';
  document.head.appendChild(fontLink);

  const fontLink2 = document.createElement('link');
  fontLink2.rel = 'preconnect';
  fontLink2.href = 'https://fonts.gstatic.com';
  fontLink2.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink2);

  const googleFonts = document.createElement('link');
  googleFonts.rel = 'stylesheet';
  googleFonts.href = 'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap';
  document.head.appendChild(googleFonts);

  // 2. Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --bg: #0D1117;
      --bg2: #161B22;
      --bg3: #1C2128;
      --amber: #EFA500;
      --text: #E6EDF3;
      --text-dim: #8B949E;
      --green: #3FB950;
      --red: #F85149;
      --border: #30363D;
    }

    #panorama-container {
      background: var(--bg);
      color: var(--text);
      font-family: 'Barlow', sans-serif;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    #panorama-container * {
      box-sizing: border-box;
    }

    .pnm-ticker-bar {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      margin-bottom: 20px;
      background: var(--bg2);
      padding: 12px;
      border-bottom: 2px solid var(--amber);
      border-radius: 4px;
    }

    .pnm-ticker-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .pnm-ticker-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--text-dim);
      margin-bottom: 4px;
      font-weight: 500;
    }

    .pnm-ticker-price {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }

    .pnm-ticker-var {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
    }

    .pnm-ticker-var.pos {
      color: var(--green);
    }

    .pnm-ticker-var.neg {
      color: var(--red);
    }

    .pnm-news-bar {
      background: var(--amber);
      color: #000;
      padding: 8px 12px;
      margin-bottom: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      overflow: hidden;
      border-radius: 4px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .pnm-section-header {
      background: var(--bg2);
      border-bottom: 2px solid var(--amber);
      padding: 6px 8px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--amber);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 20px;
      margin-bottom: 12px;
      border-radius: 4px;
    }

    .pnm-section-header::before {
      content: "█  ";
      margin-right: 4px;
    }

    .pnm-hero-box {
      background: var(--bg2);
      border-left: 3px solid var(--amber);
      padding: 16px;
      margin-bottom: 20px;
      border-radius: 4px;
    }

    .pnm-hero-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--amber);
      margin-bottom: 8px;
    }

    .pnm-hero-price {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }

    .pnm-hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 12px;
      font-size: 12px;
    }

    .pnm-stat-item {
      display: flex;
      flex-direction: column;
      background: var(--bg3);
      padding: 8px;
      border-radius: 3px;
    }

    .pnm-stat-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 10px;
      color: var(--text-dim);
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .pnm-stat-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text);
      font-weight: 600;
    }

    .pnm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin-bottom: 20px;
    }

    .pnm-table thead td {
      color: var(--amber);
      background: var(--bg3);
      padding: 10px 8px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 12px;
      font-weight: 700;
      text-align: left;
      border-bottom: 2px solid var(--amber);
    }

    .pnm-table tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--border);
    }

    .pnm-table tbody tr:nth-child(odd) {
      background: var(--bg);
    }

    .pnm-table tbody tr:nth-child(even) {
      background: var(--bg2);
    }

    .pnm-table tbody tr:hover {
      background: #1f2937;
    }

    .pnm-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 2px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 11px;
      font-weight: 700;
    }

    .pnm-badge-positive {
      background: var(--green);
      color: #000;
    }

    .pnm-badge-negative {
      background: var(--red);
      color: #fff;
    }

    .pnm-badge-neutral {
      background: #3D4451;
      color: #fff;
    }

    .pnm-context-box {
      background: var(--bg2);
      padding: 12px 14px;
      font-size: 13px;
      border-left: 3px solid var(--amber);
      text-align: justify;
      margin-top: 20px;
      border-radius: 4px;
      line-height: 1.6;
    }

    .pnm-flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg2);
      padding: 12px;
      border-bottom: 2px solid var(--amber);
      border-radius: 4px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 12px;
    }

    .pnm-factor-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 12px;
    }

    .pnm-factor-cell {
      padding: 12px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }

    .pnm-factor-positive {
      background: #0D1F14;
      color: var(--green);
    }

    .pnm-factor-negative {
      background: #1F0D0D;
      color: var(--red);
    }
  `;
  document.head.appendChild(style);

  // 3. Helper functions
  function getTickerData(symbol) {
    return window.__panoramaData && window.__panoramaData[symbol] ? window.__panoramaData[symbol] : null;
  }

  function formatPrice(value) {
    if (typeof value !== 'number') return '—';
    return typeof fmtPanoramaNum === 'function' ? fmtPanoramaNum(value) : value.toFixed(2);
  }

  function formatVariation(value) {
    if (typeof value !== 'number') return '0%';
    return (value > 0 ? '+' : '') + value.toFixed(2) + '%';
  }

  function createBadge(variation) {
    const className = variation > 0 ? 'pnm-badge-positive' : variation < 0 ? 'pnm-badge-negative' : 'pnm-badge-neutral';
    return `<span class="pnm-badge ${className}">${formatVariation(variation)}</span>`;
  }

  // 4. Override renderPanorama
  window.renderPanorama = function(allData) {
    window.__panoramaData = allData;
    const container = document.getElementById('panorama-container');
    if (!container) return;

    let html = '';

    // Ticker Bar
    const tickers = ['IBOV', 'USDBRL', 'PETR4', 'VALE3', 'WEGE3', 'BBAS3'];
    html += '<div class="pnm-ticker-bar">';
    tickers.forEach(symbol => {
      const data = getTickerData(symbol);
      if (data) {
        const varClass = data.variacao > 0 ? 'pos' : 'neg';
        html += `
          <div class="pnm-ticker-cell">
            <div class="pnm-ticker-label">${data.symbol}</div>
            <div class="pnm-ticker-price">${formatPrice(data.preco)}</div>
            <div class="pnm-ticker-var ${varClass}">${formatVariation(data.variacao)}</div>
          </div>
        `;
      }
    });
    html += '</div>';

    // News Bar
    const ibov = getTickerData('IBOV');
    const usdbrl = getTickerData('USDBRL');
    const petr = getTickerData('PETR4');
    const vale = getTickerData('VALE3');
    let newsText = 'MERCADO: ';
    if (ibov) newsText += `IBOV ${formatPrice(ibov.preco)} ${formatVariation(ibov.variacao)} | `;
    if (usdbrl) newsText += `USD/BRL ${formatPrice(usdbrl.preco)} ${formatVariation(usdbrl.variacao)} | `;
    if (petr) newsText += `PETR4 ${formatPrice(petr.preco)} | `;
    if (vale) newsText += `VALE3 ${formatPrice(vale.preco)} `;
    html += `<div class="pnm-news-bar">${newsText}</div>`;

    // Hero Section - IBOVESPA
    if (ibov) {
      html += `
        <div class="pnm-hero-box">
          <div class="pnm-hero-title">IBOVESPA</div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="pnm-hero-price">${formatPrice(ibov.preco)}</div>
            <div>${createBadge(ibov.variacao)}</div>
          </div>
          <div class="pnm-hero-stats">
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Abertura</div>
              <div class="pnm-stat-value">${formatPrice(ibov.abertura)}</div>
            </div>
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Máxima</div>
              <div class="pnm-stat-value">${formatPrice(ibov.maxDia)}</div>
            </div>
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Mínima</div>
              <div class="pnm-stat-value">${formatPrice(ibov.minDia)}</div>
            </div>
            <div class="pnm-stat-item">
              <div class="pnm-stat-label">Volume</div>
              <div class="pnm-stat-value">${formatPrice(ibov.volume)}</div>
            </div>
          </div>
        </div>
      `;
    }

    // FUTUROS & COMMODITIES
    html += '<div class="pnm-section-header">Futuros & Commodities</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['PETR4', 'VALE3', 'BBDC4', 'ITUB4', 'BBAS3'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // SETORIAIS B3
    html += '<div class="pnm-section-header">Setoriais B3</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['WEGE3', 'RENT3', 'MGLU3', 'ABEV3', 'SUZB3'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // MOEDAS
    html += '<div class="pnm-section-header">Moedas</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['USDBRL', 'EURBRL'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // ÍNDICES GLOBAIS
    html += '<div class="pnm-section-header">Índices Globais</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    const globalTickers = Object.keys(allData).filter(k =>
      ['SP500', 'DOWI', 'IXIC', 'VIX', 'FTSE', 'DAX', 'NIKKEI'].includes(k)
    );
    if (globalTickers.length > 0) {
      globalTickers.forEach(sym => {
        const d = getTickerData(sym);
        if (d) {
          html += `<tr>
            <td><strong>${d.symbol}</strong></td>
            <td>${d.nome}</td>
            <td>${formatPrice(d.preco)}</td>
            <td>${createBadge(d.variacao)}</td>
            <td>${formatPrice(d.abertura)}</td>
            <td>${formatPrice(d.maxDia)}</td>
            <td>${formatPrice(d.minDia)}</td>
            <td>${formatPrice(d.volume)}</td>
          </tr>`;
        }
      });
    } else {
      html += '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-dim);">Sem dados disponíveis</td></tr>';
    }
    html += '</tbody></table>';

    // CRIPTO
    html += '<div class="pnm-section-header">Criptomoedas</div>';
    html += '<table class="pnm-table"><thead><tr>';
    html += '<td>Ticker</td><td>Nome</td><td>Preço</td><td>Var%</td><td>Abertura</td><td>Máx</td><td>Mín</td><td>Volume</td>';
    html += '</tr></thead><tbody>';
    ['BTC', 'ETH'].forEach(sym => {
      const d = getTickerData(sym);
      if (d) {
        html += `<tr>
          <td><strong>${d.symbol}</strong></td>
          <td>${d.nome}</td>
          <td>${formatPrice(d.preco)}</td>
          <td>${createBadge(d.variacao)}</td>
          <td>${formatPrice(d.abertura)}</td>
          <td>${formatPrice(d.maxDia)}</td>
          <td>${formatPrice(d.minDia)}</td>
          <td>${formatPrice(d.volume)}</td>
        </tr>`;
      }
    });
    html += '</tbody></table>';

    // Conclusion Box
    html += `
      <div class="pnm-flex-between">
        <span>Resumo do Mercado</span>
        <span class="pnm-badge pnm-badge-neutral">Live</span>
      </div>
      <div class="pnm-context-box">
        Acompanhe em tempo real os principais índices, commodities e ativos do mercado financeiro brasileiro e global.
        Os dados apresentados são atualizados continuamente para fornecer uma visão abrangente da dinâmica de mercado.
        Utilize essas informações para tomar decisões informadas sobre seus investimentos.
      </div>
    `;

    container.innerHTML = html;
  };
})();
