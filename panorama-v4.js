/**
 * Panorama do Mercado v4 — Trading Desk Professional
 * Estilo inspirado em relatórios GS/JPM/Construtor de Capital
 *
 * Para usar: adicionar <script src="panorama-v4.js"></script> no final do index.html
 * Este script sobrescreve renderPanorama() e injeta CSS profissional.
 */

(function() {
  'use strict';

  /* ══════════════════════════════════════════════
     CSS — Scoped em #view-panorama
     ══════════════════════════════════════════════ */
  const css = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

#view-panorama {
  --pbg:#060A0F;--ps1:#0C1219;--ps2:#111820;
  --pb1:#1E2D3E;--pb2:#263545;--pb3:#2E4055;
  --pgold:#C8952A;--pgold2:#E8B84B;
  --pteal:#1AA89A;--pteal2:#22D4C3;
  --pblue:#2E7FD9;--pblue2:#5BA3F5;
  --pgrn:#18A85C;--pgrn2:#26D47A;
  --pred:#C43030;--pred2:#F05050;
  --ptw:#D5E8F5;--pg1:#8DAFC8;--pg2:#4A6A85;--pg3:#2A4055;
  --pmono:'JetBrains Mono',monospace;
  --psans:'Space Grotesk',sans-serif;
}

/* ── Background & scanlines ── */
#view-panorama #panorama-body {
  background:var(--pbg);
  position:relative;
  min-height:200px;
}
#view-panorama #panorama-body::before {
  content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px);
}

/* ── Container ── */
#view-panorama .p4-wrap {
  position:relative;z-index:1;padding:20px 16px 40px;
}

/* ── TICKER BAR ── */
#view-panorama .p4-ticker {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(96px,1fr));
  gap:1px;background:var(--pb1);
  border:1px solid var(--pb2);border-radius:7px;
  overflow:hidden;margin-bottom:24px;
  animation:p4fu .5s ease both;
}
#view-panorama .p4-tk {
  background:var(--ps2);padding:10px 6px;text-align:center;
  transition:background .15s;
}
#view-panorama .p4-tk:hover { background:var(--ps1); }
#view-panorama .p4-tk-l {
  font-family:var(--pmono);font-size:9px;color:var(--pg2);
  letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px;
}
#view-panorama .p4-tk-v {
  font-family:var(--pmono);font-size:12.5px;font-weight:500;color:var(--ptw);
}
#view-panorama .p4-tk-c {
  font-family:var(--pmono);font-size:10px;margin-top:2px;font-weight:500;
}

/* ── HERO IBOV ── */
#view-panorama .p4-hero {
  background:linear-gradient(135deg,rgba(26,168,154,.12),rgba(46,127,217,.06));
  border:1px solid rgba(26,168,154,.45);border-left:4px solid var(--pteal);
  border-radius:8px;padding:18px 20px;margin-bottom:20px;
  animation:p4fu .45s .08s ease both;position:relative;overflow:hidden;
}
#view-panorama .p4-hero::before {
  content:'';position:absolute;top:0;right:0;width:180px;height:180px;
  background:radial-gradient(circle,rgba(34,212,195,.08) 0%,transparent 70%);pointer-events:none;
}
#view-panorama .p4-hero-tag {
  font-family:var(--pmono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--pteal2);margin-bottom:12px;display:flex;align-items:center;gap:8px;
}
#view-panorama .p4-hero-tag::before {
  content:'';width:6px;height:6px;border-radius:50%;background:var(--pteal2);
  animation:p4pulse 1.5s infinite;
}
#view-panorama .p4-hero-grid {
  display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;
  position:relative;z-index:1;
}
#view-panorama .p4-hero-stat {
  background:rgba(12,18,25,.5);border:1px solid var(--pb1);border-radius:6px;padding:10px 12px;
}
#view-panorama .p4-hero-lbl {
  font-family:var(--pmono);font-size:9px;color:var(--pg2);
  text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;
}
#view-panorama .p4-hero-val {
  font-family:var(--pmono);font-size:18px;font-weight:700;color:var(--pteal2);
}
#view-panorama .p4-hero-chg {
  font-family:var(--pmono);font-size:11px;margin-top:3px;
}

/* ── GRID ── */
#view-panorama .p4-grid {
  display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
  gap:14px;animation:p4fu .5s .15s ease both;
}

/* ── SECTION CARD ── */
#view-panorama .p4-sec {
  background:var(--ps1);border:1px solid var(--pb1);border-radius:7px;
  overflow:hidden;transition:border-color .2s,transform .15s;
}
#view-panorama .p4-sec:hover {
  border-color:var(--pb2);transform:translateY(-1px);
}
#view-panorama .p4-sec-h {
  display:flex;align-items:center;gap:8px;
  padding:12px 14px 10px;border-bottom:1px solid var(--pb1);position:relative;
}
#view-panorama .p4-sec-h::after {
  content:'';position:absolute;bottom:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--pblue),var(--pteal),transparent);
}
#view-panorama .p4-sec-icon { font-size:15px;flex-shrink:0; }
#view-panorama .p4-sec-title {
  font-family:var(--pmono);font-size:10px;font-weight:600;
  text-transform:uppercase;letter-spacing:.1em;color:var(--pblue2);
}
#view-panorama .p4-sec-body { padding:6px 8px; }

/* ── DATA ROWS ── */
#view-panorama .p4-row {
  display:grid;grid-template-columns:1fr 100px 78px;
  gap:6px;align-items:center;padding:7px 8px;margin:1px 0;
  border-radius:4px;border-left:2px solid transparent;transition:all .15s;
}
#view-panorama .p4-row:nth-child(even) { background:rgba(13,18,25,.4); }
#view-panorama .p4-row:hover {
  background:rgba(46,127,217,.08);border-left-color:var(--pblue);
}
#view-panorama .p4-nm {
  font-size:12px;color:var(--ptw);font-weight:500;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
#view-panorama .p4-pr {
  font-family:var(--pmono);font-size:12px;font-weight:600;
  color:var(--ptw);text-align:right;white-space:nowrap;
}
#view-panorama .p4-ch {
  font-family:var(--pmono);font-size:10.5px;font-weight:600;
  text-align:right;white-space:nowrap;
}
#view-panorama .p4-up { color:var(--pgrn2); }
#view-panorama .p4-dw { color:var(--pred2); }
#view-panorama .p4-fl { color:var(--pg1); }

/* ── FOOTER ── */
#view-panorama .p4-foot {
  margin-top:20px;padding-top:12px;border-top:1px solid var(--pb1);
  font-family:var(--pmono);font-size:9px;color:var(--pg3);
  text-align:center;letter-spacing:.05em;
}

/* ── ANIMATIONS ── */
@keyframes p4fu { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes p4pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }

/* ── RESPONSIVE ── */
@media(max-width:768px){
  #view-panorama .p4-grid{grid-template-columns:1fr;}
  #view-panorama .p4-ticker{grid-template-columns:repeat(auto-fit,minmax(80px,1fr));}
  #view-panorama .p4-hero-grid{grid-template-columns:repeat(2,1fr);}
  #view-panorama .p4-row{grid-template-columns:1fr 90px 70px;}
}
`;

  /* ══════════════════════════════════════════════
     Inject CSS
     ══════════════════════════════════════════════ */
  const styleEl = document.createElement('style');
  styleEl.id = 'panorama-v4-css';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ══════════════════════════════════════════════
     Config — instrumentos e seções
     ══════════════════════════════════════════════ */
  const TICKER_BAR = [
    ['^GSPC','S&P 500'],['^NDX','NASDAQ'],['^DJI','DOW JONES'],['^VIX','VIX'],
    ['CL=F','WTI'],['GC=F','OURO'],['BTC-USD','BITCOIN'],
    ['IBOV','IBOVESPA'],['USDBRL=X','USD/BRL'],['EURUSD=X','EUR/USD']
  ];

  const SECTIONS = [
    ['&#128202;','Futuros EUA & Commodities',['ES=F','YM=F','NQ=F','CL=F','BZ=F','GC=F','SI=F','HG=F']],
    ['&#127970;','Setoriais B3',['ICON','IFIX','IFNC','IMAT','IMOB','INDX','UTIL']],
    ['&#127758;','Índices Globais',['^GDAXI','^FCHI','^FTSE','FTSEMIB.MI','^STOXX50E','^AXJO','^N225','^HSI','^KS11','000001.SS']],
    ['&#128177;','Moedas',['USDBRL=X','EURUSD=X','USDJPY=X','GBPUSD=X','USDCAD=X','USDCHF=X','USDARS=X','AUDUSD=X','USDCNY=X','USDMXN=X','DX-Y.NYB']],
    ['&#128200;','Treasuries',['^IRX','^FVX','^TNX','^TYX']],
    ['&#8383;','Cripto',['BTC-USD','ETH-USD','DOGE-USD','SOL-USD']]
  ];

  /* ══════════════════════════════════════════════
     Helpers
     ══════════════════════════════════════════════ */
  function fmtChg(v) {
    var n = parseFloat(v);
    if (isNaN(n)) return {t:'—', c:'p4-fl'};
    var s = n >= 0 ? '+' : '';
    return {
      t: s + n.toFixed(2) + '%',
      c: n > 0 ? 'p4-up' : n < 0 ? 'p4-dw' : 'p4-fl',
      arrow: n > 0 ? '&#9650; ' : n < 0 ? '&#9660; ' : ''
    };
  }

  function fmt(val) {
    if (typeof fmtPanoramaNum === 'function') return fmtPanoramaNum(val);
    if (typeof val !== 'number' || isNaN(val)) return '—';
    return val.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  /* ══════════════════════════════════════════════
     renderPanorama — função principal
     ══════════════════════════════════════════════ */
  window.renderPanorama = function(allData) {
    var body = document.getElementById('panorama-body');
    if (!body) return;

    var h = '<div class="p4-wrap">';

    // ── Ticker bar ──
    h += '<div class="p4-ticker">';
    TICKER_BAR.forEach(function(cfg) {
      var d = allData[cfg[0]];
      if (!d) return;
      var ch = fmtChg(d.variacao);
      h += '<div class="p4-tk">' +
        '<div class="p4-tk-l">' + cfg[1] + '</div>' +
        '<div class="p4-tk-v">' + fmt(d.preco) + '</div>' +
        '<div class="p4-tk-c ' + ch.c + '">' + ch.arrow + ch.t + '</div>' +
        '</div>';
    });
    h += '</div>';

    // ── Hero IBOV ──
    var ib = allData['IBOV'];
    if (ib) {
      var ibch = fmtChg(ib.variacao);
      h += '<div class="p4-hero">' +
        '<div class="p4-hero-tag">&#127463;&#127479; Ibovespa — B3</div>' +
        '<div class="p4-hero-grid">' +
          '<div class="p4-hero-stat"><div class="p4-hero-lbl">Preço</div>' +
            '<div class="p4-hero-val">' + fmt(ib.preco) + '</div>' +
            '<div class="p4-hero-chg ' + ibch.c + '">' + ibch.arrow + ibch.t + '</div></div>' +
          '<div class="p4-hero-stat"><div class="p4-hero-lbl">Abertura</div>' +
            '<div class="p4-hero-val">' + fmt(ib.abertura) + '</div></div>' +
          '<div class="p4-hero-stat"><div class="p4-hero-lbl">Máxima</div>' +
            '<div class="p4-hero-val">' + fmt(ib.maxDia) + '</div></div>' +
          '<div class="p4-hero-stat"><div class="p4-hero-lbl">Mínima</div>' +
            '<div class="p4-hero-val">' + fmt(ib.minDia) + '</div></div>' +
          '<div class="p4-hero-stat"><div class="p4-hero-lbl">Volume</div>' +
            '<div class="p4-hero-val">' + fmt(ib.volume) + '</div></div>' +
        '</div></div>';
    }

    // ── Section grid ──
    h += '<div class="p4-grid">';
    SECTIONS.forEach(function(sec) {
      h += '<div class="p4-sec"><div class="p4-sec-h">' +
        '<span class="p4-sec-icon">' + sec[0] + '</span>' +
        '<span class="p4-sec-title">' + sec[1] + '</span></div>' +
        '<div class="p4-sec-body">';

      sec[2].forEach(function(ticker) {
        var d = allData[ticker];
        if (!d) return;
        var ch = fmtChg(d.variacao);
        h += '<div class="p4-row">' +
          '<div class="p4-nm">' + (d.nome || ticker) + '</div>' +
          '<div class="p4-pr">' + fmt(d.preco) + '</div>' +
          '<div class="p4-ch ' + ch.c + '">' + ch.arrow + ch.t + '</div>' +
          '</div>';
      });

      h += '</div></div>';
    });
    h += '</div>';

    // ── Footer ──
    var now = new Date();
    var ts = now.toLocaleTimeString('pt-BR');
    h += '<div class="p4-foot">Dados via BRAPI · Atualizado às ' + ts + '</div>';

    h += '</div>';
    body.innerHTML = h;

    // Atualiza clock no header (se existir)
    var clockEl = document.getElementById('panorama-clock');
    if (clockEl) clockEl.textContent = ts;

    var tsEl = document.querySelector('#view-panorama .page-header .subtitle, #view-panorama [id*="timestamp"]');
    if (tsEl) tsEl.textContent = 'Última atualização: ' + ts;
  };

  // ── Trigger re-render ──
  if (typeof refreshPanorama === 'function') {
    refreshPanorama();
  }

  console.log('[Panorama v4] Trading desk design loaded.');
})();
