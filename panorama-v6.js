/* ══════════════════════════════════════════════════════════════
   PANORAMA v6 — Relatório Editorial  ·  Estilo Construtor de Capital
   Substitui renderPanorama() + buildPMImageHTML() + capturarImagemPM()
   Adapta automaticamente: Pré-Mercado / Mercado Aberto / Pós-Mercado
   ══════════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ─── 1. CSS INJECTION ─── */
var style = document.createElement('style');
style.textContent = [
  '@import url("https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap");',

  ':root {',
  '  --cc-bg: #0A0E17;',
  '  --cc-card: #111827;',
  '  --cc-card2: #1A2332;',
  '  --cc-border: #1E293B;',
  '  --cc-gold: #D4A017;',
  '  --cc-gold-dim: #B8860B;',
  '  --cc-green: #10B981;',
  '  --cc-red: #EF4444;',
  '  --cc-yellow: #F59E0B;',
  '  --cc-blue: #3B82F6;',
  '  --cc-white: #F1F5F9;',
  '  --cc-text: #94A3B8;',
  '  --cc-text2: #64748B;',
  '  --cc-text3: #475569;',
  '  --cc-font: "Barlow", sans-serif;',
  '  --cc-mono: "JetBrains Mono", monospace;',
  '  --cc-cond: "Barlow Condensed", sans-serif;',
  '}',

  /* Container principal */
  '.cc-report { font-family: var(--cc-font); color: var(--cc-white); line-height: 1.5; }',

  /* Header do relatório */
  '.cc-header { padding: 28px 32px 22px; background: linear-gradient(135deg, #111827 0%, #0A0E17 100%); border-bottom: 3px solid var(--cc-gold); position: relative; }',
  '.cc-header::after { content: ""; position: absolute; bottom: -3px; left: 0; width: 120px; height: 3px; background: var(--cc-gold); filter: brightness(1.4); }',
  '.cc-brand { font-family: var(--cc-cond); font-size: 11px; letter-spacing: 4px; color: var(--cc-gold); font-weight: 700; text-transform: uppercase; }',
  '.cc-title { font-family: var(--cc-font); font-size: 26px; font-weight: 900; color: #fff; letter-spacing: -0.5px; margin-top: 4px; }',
  '.cc-title-accent { color: var(--cc-gold); }',
  '.cc-date { font-size: 12px; color: var(--cc-text2); margin-top: 2px; }',
  '.cc-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; font-family: var(--cc-cond); font-size: 12px; font-weight: 700; letter-spacing: 1.5px; margin-top: 12px; }',

  /* Seções */
  '.cc-section { padding: 16px 28px; }',
  '.cc-section-title { font-family: var(--cc-cond); font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--cc-gold); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }',
  '.cc-section-title::before { content: ""; display: inline-block; width: 3px; height: 16px; background: var(--cc-gold); border-radius: 2px; }',
  '.cc-divider { height: 1px; background: linear-gradient(90deg, var(--cc-gold) 0%, transparent 60%); margin: 0; opacity: 0.3; }',

  /* Grid de indicadores principais */
  '.cc-indicators { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }',
  '.cc-ind-card { flex: 1; min-width: 110px; background: var(--cc-card); border: 1px solid var(--cc-border); border-radius: 10px; padding: 12px 10px; text-align: center; position: relative; overflow: hidden; }',
  '.cc-ind-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; }',
  '.cc-ind-card.up::before { background: var(--cc-green); }',
  '.cc-ind-card.down::before { background: var(--cc-red); }',
  '.cc-ind-card.flat::before { background: var(--cc-yellow); }',
  '.cc-ind-label { font-family: var(--cc-cond); font-size: 10px; color: var(--cc-text2); text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap; }',
  '.cc-ind-price { font-family: var(--cc-mono); font-size: 16px; font-weight: 700; color: #fff; margin: 4px 0 2px; }',
  '.cc-ind-var { font-family: var(--cc-mono); font-size: 11px; font-weight: 700; }',

  /* Signal badges */
  '.cc-signal { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-family: var(--cc-cond); font-size: 10px; font-weight: 700; letter-spacing: 1px; }',
  '.cc-signal.alta { background: rgba(16,185,129,0.15); color: var(--cc-green); border: 1px solid rgba(16,185,129,0.3); }',
  '.cc-signal.baixa { background: rgba(239,68,68,0.15); color: var(--cc-red); border: 1px solid rgba(239,68,68,0.3); }',
  '.cc-signal.neutro { background: rgba(245,158,11,0.15); color: var(--cc-yellow); border: 1px solid rgba(245,158,11,0.3); }',

  /* Tabelas */
  '.cc-table { width: 100%; border-collapse: collapse; font-size: 12px; background: var(--cc-card); border: 1px solid var(--cc-border); border-radius: 10px; overflow: hidden; margin-bottom: 12px; }',
  '.cc-table th { padding: 8px 12px; text-align: left; font-family: var(--cc-cond); font-size: 10px; font-weight: 600; color: var(--cc-text3); text-transform: uppercase; letter-spacing: 0.8px; background: var(--cc-card2); border-bottom: 1px solid var(--cc-border); }',
  '.cc-table th:not(:first-child) { text-align: right; }',
  '.cc-table td { padding: 7px 12px; border-bottom: 1px solid var(--cc-border); color: var(--cc-white); }',
  '.cc-table td:not(:first-child) { text-align: right; font-family: var(--cc-mono); font-size: 12px; }',
  '.cc-table tr:last-child td { border-bottom: none; }',
  '.cc-table td.nome { font-weight: 500; white-space: nowrap; }',
  '.cc-table td.price { font-weight: 600; color: #fff; }',
  '.cc-table td.var-up { color: var(--cc-green); font-weight: 700; }',
  '.cc-table td.var-down { color: var(--cc-red); font-weight: 700; }',
  '.cc-table td.var-flat { color: var(--cc-yellow); font-weight: 600; }',

  /* Blocos de análise */
  '.cc-analysis { background: var(--cc-card); border: 1px solid var(--cc-border); border-radius: 10px; padding: 16px 18px; margin-bottom: 12px; }',
  '.cc-analysis-title { font-family: var(--cc-cond); font-size: 12px; font-weight: 700; color: var(--cc-gold); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }',
  '.cc-analysis p { font-size: 13px; color: var(--cc-text); line-height: 1.7; margin: 0 0 8px; }',
  '.cc-analysis p:last-child { margin-bottom: 0; }',
  '.cc-bullet { color: var(--cc-gold); margin-right: 6px; }',

  /* Conclusão */
  '.cc-conclusion { background: linear-gradient(135deg, #111827, #0F172A); border: 1px solid var(--cc-gold-dim); border-radius: 12px; padding: 20px 22px; margin-bottom: 12px; }',
  '.cc-conclusion-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }',
  '.cc-factor-list { list-style: none; padding: 0; margin: 0; }',
  '.cc-factor-list li { font-size: 12px; color: var(--cc-text); padding: 4px 0; display: flex; align-items: flex-start; gap: 6px; }',
  '.cc-factor-list li::before { content: ""; flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; }',
  '.cc-factor-list.positive li::before { background: var(--cc-green); }',
  '.cc-factor-list.negative li::before { background: var(--cc-red); }',
  '.cc-verdict { text-align: center; padding: 12px 16px; background: var(--cc-card2); border: 1px solid var(--cc-gold-dim); border-radius: 10px; margin-top: 14px; }',
  '.cc-verdict-label { font-family: var(--cc-cond); font-size: 11px; color: var(--cc-text2); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }',
  '.cc-verdict-text { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }',

  /* Footer */
  '.cc-footer { padding: 16px 28px 24px; text-align: center; }',
  '.cc-footer-line { height: 1px; background: linear-gradient(90deg, transparent, var(--cc-gold), transparent); margin-bottom: 14px; opacity: 0.5; }',
  '.cc-footer-brand { font-family: var(--cc-cond); font-size: 10px; color: var(--cc-text3); letter-spacing: 2px; }',
  '.cc-footer-time { font-size: 9px; color: var(--cc-text3); margin-top: 4px; }',

  /* Dois colunas lado a lado */
  '.cc-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }',
  '.cc-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }',

  /* Calendário econômico */
  '.cc-cal-grid { display: grid; gap: 6px; margin-bottom: 8px; }',
  '.cc-cal-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--cc-card); border: 1px solid var(--cc-border); border-radius: 8px; transition: border-color 0.2s; }',
  '.cc-cal-item:hover { border-color: var(--cc-gold-dim); }',
  '.cc-cal-date { min-width: 48px; text-align: center; }',
  '.cc-cal-day { font-family: var(--cc-mono); font-size: 18px; font-weight: 800; color: #fff; line-height: 1; }',
  '.cc-cal-month { font-size: 9px; color: var(--cc-text2); text-transform: uppercase; letter-spacing: 1px; }',
  '.cc-cal-info { flex: 1; }',
  '.cc-cal-title { font-size: 13px; font-weight: 600; color: var(--cc-white); }',
  '.cc-cal-meta { font-size: 10px; color: var(--cc-text2); margin-top: 2px; }',
  '.cc-cal-impact { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; }',
  '.cc-cal-impact.alto { background: rgba(239,68,68,0.15); color: var(--cc-red); border: 1px solid rgba(239,68,68,0.25); }',
  '.cc-cal-impact.medio { background: rgba(245,158,11,0.15); color: var(--cc-yellow); border: 1px solid rgba(245,158,11,0.25); }',
  '.cc-cal-impact.baixo { background: rgba(59,130,246,0.15); color: var(--cc-blue); border: 1px solid rgba(59,130,246,0.25); }',

  /* Notícias */
  '.cc-news-list { display: grid; gap: 6px; }',
  '.cc-news-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--cc-card); border: 1px solid var(--cc-border); border-radius: 8px; transition: border-color 0.2s; }',
  '.cc-news-item:hover { border-color: var(--cc-gold-dim); }',
  '.cc-news-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cc-gold); margin-top: 6px; flex-shrink: 0; }',
  '.cc-news-title { font-size: 13px; color: var(--cc-white); font-weight: 500; line-height: 1.4; }',
  '.cc-news-source { font-size: 10px; color: var(--cc-text2); margin-top: 3px; }',
  '.cc-news-time { font-size: 10px; color: var(--cc-text3); }',

  /* Imagem hidden para captura */
  '#cc-image-canvas { position: absolute; left: -9999px; top: 0; width: 780px; font-family: "Barlow", "Helvetica Neue", Arial, sans-serif; background: #0A0E17; }'

].join('\n');
document.head.appendChild(style);


/* ─── 2. HELPERS ─── */

function detectPeriodo() {
  var h = new Date().getHours();
  if (h < 10) return { nome: 'PRE-MERCADO', emoji: '☀️', desc: 'Antes da abertura' };
  if (h < 17) return { nome: 'MERCADO ABERTO', emoji: '📈', desc: 'Sessão em andamento' };
  return { nome: 'PÓS-MERCADO', emoji: '🌙', desc: 'Após o fechamento' };
}

function fmtNum(v, dec) {
  if (v == null || isNaN(v)) return '—';
  dec = dec != null ? dec : 2;
  var abs = Math.abs(v);
  if (abs >= 1000) return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return v.toFixed(dec).replace('.', ',');
}

function fmtPct(v) {
  if (v == null || isNaN(v)) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%';
}

function varClass(v) {
  if (v == null) return 'flat';
  if (v > 0.05) return 'up';
  if (v < -0.05) return 'down';
  return 'flat';
}

function signalBadge(v, invertido) {
  var vc = invertido ? -v : v;
  if (vc > 0.3) return '<span class="cc-signal alta">▲ ALTA</span>';
  if (vc < -0.3) return '<span class="cc-signal baixa">▼ BAIXA</span>';
  return '<span class="cc-signal neutro">◆ NEUTRO</span>';
}

function varColor(v) {
  if (v == null) return 'var(--cc-yellow)';
  if (v > 0.05) return 'var(--cc-green)';
  if (v < -0.05) return 'var(--cc-red)';
  return 'var(--cc-yellow)';
}

function varColorHex(v) {
  if (v == null) return '#F59E0B';
  if (v > 0.05) return '#10B981';
  if (v < -0.05) return '#EF4444';
  return '#F59E0B';
}

function decFor(sym) {
  if (!sym) return 2;
  if (sym.indexOf('USD') >= 0 && sym.indexOf('=X') >= 0) return 4;
  if (sym === 'DX-Y.NYB') return 3;
  if (sym.indexOf('BTC') >= 0 || sym.indexOf('ETH') >= 0) return 0;
  return 2;
}

function buildTable(items, allData, opts) {
  opts = opts || {};
  var showVol = opts.volume;
  var showOpen = opts.abertura;
  var invertidos = opts.invertidos || [];

  var h = '<table class="cc-table"><thead><tr>';
  h += '<th>Ativo</th><th>Preço</th><th>Var%</th>';
  if (showOpen) h += '<th>Abertura</th>';
  if (showVol) h += '<th>Volume</th>';
  h += '<th>Sinal</th></tr></thead><tbody>';

  items.forEach(function(sym) {
    var d = allData[sym];
    if (!d) return;
    var v = d.variacao || 0;
    var vc = varClass(v);
    var dec = decFor(sym);
    var inv = invertidos.indexOf(sym) >= 0;

    h += '<tr>';
    h += '<td class="nome">' + d.nome + '</td>';
    h += '<td class="price">' + fmtNum(d.preco, dec) + '</td>';
    h += '<td class="var-' + vc + '">' + fmtPct(v) + '</td>';
    if (showOpen) h += '<td style="color:var(--cc-text)">' + fmtNum(d.abertura, dec) + '</td>';
    if (showVol) {
      var vol = d.volume;
      var volStr = '—';
      if (vol != null) {
        if (vol >= 1e9) volStr = (vol / 1e9).toFixed(1).replace('.', ',') + 'B';
        else if (vol >= 1e6) volStr = (vol / 1e6).toFixed(1).replace('.', ',') + 'M';
        else if (vol >= 1e3) volStr = (vol / 1e3).toFixed(0) + 'K';
        else volStr = vol.toString();
      }
      h += '<td style="color:var(--cc-text)">' + volStr + '</td>';
    }
    h += '<td>' + signalBadge(v, inv) + '</td>';
    h += '</tr>';
  });

  h += '</tbody></table>';
  return h;
}


/* ─── 2b. CALENDÁRIO ECONÔMICO ─── */

function gerarCalendarioEconomico() {
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  var limite = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
  var eventos = [];

  // COPOM 2026 — datas de decisão (2o dia da reunião)
  var copom2026 = [
    [2026,1,5],[2026,2,19],[2026,4,7],[2026,5,18],[2026,7,6],[2026,8,17],[2026,10,5],[2026,11,10]
  ];
  copom2026.forEach(function(d) {
    var dt = new Date(d[0], d[1], d[2]);
    if (dt >= hoje && dt <= limite) {
      eventos.push({ data: dt, titulo: 'Decisão COPOM (Selic)', pais: '🇧🇷', impacto: 'alto', categoria: 'Política Monetária' });
    }
  });

  // FOMC 2026 — datas de decisão
  var fomc2026 = [
    [2026,0,28],[2026,2,18],[2026,4,6],[2026,5,17],[2026,6,29],[2026,8,16],[2026,10,4],[2026,11,16]
  ];
  fomc2026.forEach(function(d) {
    var dt = new Date(d[0], d[1], d[2]);
    if (dt >= hoje && dt <= limite) {
      eventos.push({ data: dt, titulo: 'Decisão Fed (Juros EUA)', pais: '🇺🇸', impacto: 'alto', categoria: 'Política Monetária' });
    }
  });

  // IPCA — aprox. dia 10-12 de cada mês
  for (var mi = 0; mi < 2; mi++) {
    var mRef = hoje.getMonth() + mi;
    var yRef = hoje.getFullYear();
    if (mRef > 11) { mRef -= 12; yRef++; }
    var ipca = new Date(yRef, mRef, 10);
    if (ipca >= hoje && ipca <= limite) {
      eventos.push({ data: ipca, titulo: 'IPCA (Inflação mensal)', pais: '🇧🇷', impacto: 'alto', categoria: 'Indicador' });
    }
  }

  // US Payroll — 1a sexta de cada mês
  for (var mi2 = 0; mi2 < 2; mi2++) {
    var mRef2 = hoje.getMonth() + mi2;
    var yRef2 = hoje.getFullYear();
    if (mRef2 > 11) { mRef2 -= 12; yRef2++; }
    var first = new Date(yRef2, mRef2, 1);
    var dow = first.getDay();
    var fri = new Date(yRef2, mRef2, 1 + ((5 - dow + 7) % 7));
    if (fri >= hoje && fri <= limite) {
      eventos.push({ data: fri, titulo: 'Payroll / Non-Farm', pais: '🇺🇸', impacto: 'alto', categoria: 'Emprego' });
    }
  }

  // US CPI — aprox. dia 12 de cada mês
  for (var mi3 = 0; mi3 < 2; mi3++) {
    var mRef3 = hoje.getMonth() + mi3;
    var yRef3 = hoje.getFullYear();
    if (mRef3 > 11) { mRef3 -= 12; yRef3++; }
    var cpi = new Date(yRef3, mRef3, 12);
    if (cpi >= hoje && cpi <= limite) {
      eventos.push({ data: cpi, titulo: 'CPI (Inflação EUA)', pais: '🇺🇸', impacto: 'alto', categoria: 'Indicador' });
    }
  }

  // IGP-M — aprox. dia 28-30 de cada mês
  for (var mi4 = 0; mi4 < 2; mi4++) {
    var mRef4 = hoje.getMonth() + mi4;
    var yRef4 = hoje.getFullYear();
    if (mRef4 > 11) { mRef4 -= 12; yRef4++; }
    var igpm = new Date(yRef4, mRef4, 28);
    if (igpm >= hoje && igpm <= limite) {
      eventos.push({ data: igpm, titulo: 'IGP-M (Inflação)', pais: '🇧🇷', impacto: 'medio', categoria: 'Indicador' });
    }
  }

  // CAGED — emprego formal, aprox. dia 28
  for (var mi5 = 0; mi5 < 2; mi5++) {
    var mRef5 = hoje.getMonth() + mi5;
    var yRef5 = hoje.getFullYear();
    if (mRef5 > 11) { mRef5 -= 12; yRef5++; }
    var caged = new Date(yRef5, mRef5, 27);
    if (caged >= hoje && caged <= limite) {
      eventos.push({ data: caged, titulo: 'CAGED (Emprego formal)', pais: '🇧🇷', impacto: 'medio', categoria: 'Emprego' });
    }
  }

  eventos.sort(function(a, b) { return a.data - b.data; });
  return eventos.slice(0, 8);
}

function renderCalendario(eventos) {
  var meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  var dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var h = '<div class="cc-cal-grid">';
  eventos.forEach(function(ev) {
    var diffDias = Math.round((ev.data - hoje) / (24*60*60*1000));
    var quando = '';
    if (diffDias === 0) quando = 'HOJE';
    else if (diffDias === 1) quando = 'AMANHÃ';
    else quando = dias[ev.data.getDay()] + ', ' + diffDias + ' dias';

    h += '<div class="cc-cal-item">';
    h += '<div class="cc-cal-date">';
    h += '<div class="cc-cal-day">' + ev.data.getDate() + '</div>';
    h += '<div class="cc-cal-month">' + meses[ev.data.getMonth()] + '</div>';
    h += '</div>';
    h += '<div class="cc-cal-info">';
    h += '<div class="cc-cal-title">' + ev.pais + ' ' + ev.titulo + '</div>';
    h += '<div class="cc-cal-meta">';
    h += '<span class="cc-cal-impact ' + ev.impacto + '">' + ev.impacto.toUpperCase() + '</span>';
    h += ' &nbsp; <span style="color:var(--cc-text3);font-size:10px">' + quando + '</span>';
    h += '</div></div></div>';
  });
  h += '</div>';
  return h;
}

function renderNoticias(noticias) {
  var h = '<div class="cc-news-list">';
  noticias.forEach(function(n) {
    var tempoStr = '';
    if (n.pubDate) {
      var pub = new Date(n.pubDate);
      var agora = new Date();
      var diffMin = Math.round((agora - pub) / 60000);
      if (diffMin < 60) tempoStr = diffMin + ' min atrás';
      else if (diffMin < 1440) tempoStr = Math.round(diffMin / 60) + 'h atrás';
      else tempoStr = Math.round(diffMin / 1440) + 'd atrás';
    }
    h += '<div class="cc-news-item">';
    h += '<div class="cc-news-dot"></div>';
    h += '<div style="flex:1">';
    h += '<div class="cc-news-title">' + (n.title || '') + '</div>';
    h += '<div style="display:flex;gap:10px;align-items:center;margin-top:3px">';
    if (n.source) h += '<span class="cc-news-source">' + n.source + '</span>';
    if (tempoStr) h += '<span class="cc-news-time">' + tempoStr + '</span>';
    h += '</div></div></div>';
  });
  h += '</div>';
  return h;
}


/* ─── 3. ANÁLISE INTELIGENTE ─── */

function gerarAnalise(allData) {
  var insights = { positivos: [], negativos: [], neutros: [] };

  // Futuros EUA
  var es = allData['ES=F'], nq = allData['NQ=F'], vix = allData['^VIX'];
  if (es) {
    if (es.variacao > 0.3) insights.positivos.push('Futuros do S&P 500 em alta de ' + fmtPct(es.variacao) + ', sinalizando apetite por risco');
    else if (es.variacao < -0.3) insights.negativos.push('Futuros do S&P 500 em queda de ' + fmtPct(es.variacao) + ', pressão vendedora');
    else insights.neutros.push('Futuros americanos estáveis, mercado aguardando catalisadores');
  }
  if (vix) {
    if (vix.preco > 25) insights.negativos.push('VIX elevado em ' + fmtNum(vix.preco) + ' — volatilidade alta, cautela redobrada');
    else if (vix.preco > 20) insights.neutros.push('VIX moderado em ' + fmtNum(vix.preco) + ' — volatilidade acima da média');
    else if (vix.variacao < -3) insights.positivos.push('VIX em queda forte (' + fmtNum(vix.preco) + ') — compressão de volatilidade favorece alta');
  }

  // Brasil
  var ibov = allData['IBOV'] || allData['^BVSP'];
  var usdbrl = allData['USDBRL=X'];
  if (ibov && usdbrl) {
    if (ibov.variacao > 0 && usdbrl.variacao < 0) insights.positivos.push('Cenário positivo para Brasil: Ibovespa subindo com real se valorizando');
    else if (ibov.variacao < 0 && usdbrl.variacao > 0) insights.negativos.push('Pressão no Brasil: Ibovespa caindo com dólar em alta');
  }
  if (ibov) {
    if (ibov.variacao > 0.5) insights.positivos.push('Ibovespa com alta expressiva de ' + fmtPct(ibov.variacao));
    else if (ibov.variacao < -0.5) insights.negativos.push('Ibovespa recuando ' + fmtPct(ibov.variacao));
  }

  // Câmbio
  var dxy = allData['DX-Y.NYB'];
  if (dxy) {
    if (dxy.variacao < -0.2) insights.positivos.push('Dólar enfraquecendo globalmente (DXY ' + fmtPct(dxy.variacao) + ') — positivo para emergentes');
    else if (dxy.variacao > 0.2) insights.negativos.push('Dólar se fortalecendo (DXY ' + fmtPct(dxy.variacao) + ') — pressão em emergentes');
  }

  // Commodities
  var wti = allData['CL=F'], ouro = allData['GC=F'];
  if (wti) {
    if (wti.variacao > 1) insights.positivos.push('Petróleo WTI em alta forte (' + fmtPct(wti.variacao) + ') — atenção para Petrobras');
    else if (wti.variacao < -1) insights.negativos.push('Petróleo WTI em queda (' + fmtPct(wti.variacao) + ') — impacto em petroleiras');
  }
  if (ouro) {
    if (ouro.variacao > 0.5) insights.neutros.push('Ouro subindo (' + fmtPct(ouro.variacao) + ') — busca por proteção ativa');
    else if (ouro.variacao < -0.5) insights.positivos.push('Ouro em queda — apetite por risco reduz demanda por safe haven');
  }

  // Treasuries
  var tnx = allData['^TNX'];
  if (tnx) {
    if (tnx.variacao > 1) insights.negativos.push('Yield de 10 anos em alta — pressão nos ativos de risco');
    else if (tnx.variacao < -1) insights.positivos.push('Yield de 10 anos recuando — alívio para ações growth');
  }

  // Sentimento geral
  var sent = 'NEUTRO', sentCor = '#F59E0B';
  if (insights.positivos.length >= 3 && insights.negativos.length <= 1) { sent = 'POSITIVO'; sentCor = '#10B981'; }
  else if (insights.negativos.length >= 3 && insights.positivos.length <= 1) { sent = 'NEGATIVO'; sentCor = '#EF4444'; }
  else if (insights.positivos.length > insights.negativos.length) { sent = 'LEVEMENTE POSITIVO'; sentCor = '#10B981'; }
  else if (insights.negativos.length > insights.positivos.length) { sent = 'LEVEMENTE NEGATIVO'; sentCor = '#EF4444'; }

  return { positivos: insights.positivos, negativos: insights.negativos, neutros: insights.neutros, sentimento: sent, sentCor: sentCor };
}


/* ─── 4. RENDER PRINCIPAL ─── */

window.renderPanorama = function(allData) {
  var body = document.getElementById('panorama-body');
  if (!body) return;

  var btn = document.getElementById('panorama-refresh-btn');
  if (btn) { btn.textContent = 'Atualizar'; btn.disabled = false; }
  var imgBtn = document.getElementById('panorama-img-btn');
  if (imgBtn) imgBtn.style.display = '';

  var sub = document.getElementById('panorama-sub');
  if (sub) sub.textContent = 'Última atualização: ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Clock
  if (window._panoramaClockTimer) clearInterval(window._panoramaClockTimer);
  window._panoramaClockTimer = setInterval(function() {
    var el = document.getElementById('panorama-clock');
    if (el) el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);

  var periodo = detectPeriodo();
  var analise = gerarAnalise(allData);
  var hoje = new Date();
  var dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var dataStr = dias[hoje.getDay()] + ', ' + hoje.getDate() + ' de ' + meses[hoje.getMonth()] + ' de ' + hoje.getFullYear();
  var hora = hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  var html = '<div class="cc-report">';

  /* ── HEADER ── */
  html += '<div class="cc-header">';
  html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
  html += '<div>';
  html += '<div class="cc-brand">DMF INVESTIMENTOS</div>';
  html += '<div class="cc-title">' + periodo.emoji + ' <span class="cc-title-accent">' + periodo.nome + '</span></div>';
  html += '</div>';
  html += '<div style="text-align:right">';
  html += '<div class="cc-date">' + dataStr + '</div>';
  html += '<div class="cc-date">Atualizado às ' + hora + '</div>';
  html += '</div></div>';
  html += '<div class="cc-badge" style="background:' + analise.sentCor + '18;border:1px solid ' + analise.sentCor + '44;color:' + analise.sentCor + '">';
  html += '● SENTIMENTO: ' + analise.sentimento + '</div>';
  html += '</div>';

  /* ── INDICADORES PRINCIPAIS ── */
  html += '<div class="cc-section">';
  html += '<div class="cc-section-title">Indicadores Principais</div>';
  html += '<div class="cc-indicators">';
  var mainTickers = ['ES=F', 'NQ=F', '^VIX', 'IBOV', 'USDBRL=X', 'DX-Y.NYB', 'CL=F', 'GC=F'];
  // Fallback para ^BVSP se IBOV nao existir
  if (!allData['IBOV'] && allData['^BVSP']) { allData['IBOV'] = allData['^BVSP']; }
  mainTickers.forEach(function(sym) {
    var d = allData[sym];
    if (!d) return;
    var v = d.variacao || 0;
    var vc = varClass(v);
    var dec = decFor(sym);
    html += '<div class="cc-ind-card ' + vc + '">';
    html += '<div class="cc-ind-label">' + d.nome + '</div>';
    html += '<div class="cc-ind-price">' + fmtNum(d.preco, dec) + '</div>';
    html += '<div class="cc-ind-var" style="color:' + varColor(v) + '">' + fmtPct(v) + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  html += '<div class="cc-divider"></div>';

  /* ── FUTUROS EUA ── */
  var futTickers = ['ES=F', 'NQ=F', 'YM=F', 'CL=F', 'BZ=F', 'GC=F', 'SI=F', 'HG=F'].filter(function(s) { return !!allData[s]; });
  if (futTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Futuros</div>';
    html += buildTable(futTickers, allData, { abertura: true });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── ÍNDICES EUA ── */
  var usaTickers = ['^GSPC', '^DJI', '^NDX', '^RUT', '^VIX'].filter(function(s) { return !!allData[s]; });
  if (usaTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Índices EUA</div>';
    html += buildTable(usaTickers, allData, { invertidos: ['^VIX'] });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── BRASIL ── */
  var brTickers = ['IBOV'].filter(function(s) { return !!allData[s]; });
  if (brTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Brasil</div>';
    html += buildTable(brTickers, allData, { volume: true });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── MERCADOS GLOBAIS ── */
  var globalTickers = ['^GDAXI', '^FCHI', '^FTSE', 'FTSEMIB.MI', '^STOXX50E', '^AXJO', '^N225', '^HSI', '^KS11', '000001.SS'].filter(function(s) { return !!allData[s]; });
  if (globalTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Mercados Globais</div>';
    html += buildTable(globalTickers, allData, {});
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── CÂMBIO ── */
  var fxTickers = ['USDBRL=X', 'EURUSD=X', 'USDJPY=X', 'GBPUSD=X', 'DX-Y.NYB', 'USDCAD=X', 'USDCHF=X', 'AUDUSD=X'].filter(function(s) { return !!allData[s]; });
  if (fxTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Câmbio</div>';
    html += buildTable(fxTickers, allData, { invertidos: ['USDBRL=X', 'DX-Y.NYB'] });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── COMMODITIES ── */
  var cmdTickers = ['CL=F', 'GC=F', 'SI=F', 'HG=F'].filter(function(s) { return !!allData[s]; });
  if (cmdTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Commodities</div>';
    html += buildTable(cmdTickers, allData, { abertura: true });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── TÍTULOS EUA (TREASURIES) ── */
  var bondTickers = ['^IRX', '^FVX', '^TNX', '^TYX'].filter(function(s) { return !!allData[s]; });
  if (bondTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Treasuries EUA</div>';
    html += buildTable(bondTickers, allData, {});
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── SETORIAIS B3 ── */
  var setTickers = ['ICON', 'IEE', 'IMAT', 'INDX', 'IFNC', 'IFIX', 'IMOB', 'UTIL'].filter(function(s) { return !!allData[s]; });
  if (setTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Setoriais B3</div>';
    html += buildTable(setTickers, allData, { volume: true });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── CRIPTO ── */
  var cryptoTickers = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD'].filter(function(s) { return !!allData[s]; });
  if (cryptoTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Criptomoedas</div>';
    html += buildTable(cryptoTickers, allData, { volume: true });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── ETFs GLOBAIS ── */
  var etfTickers = ['EWZ', 'SPY', 'QQQ', 'IWM', 'GLD', 'TLT'].filter(function(s) { return !!allData[s]; });
  if (etfTickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">ETFs Globais</div>';
    html += buildTable(etfTickers, allData, { volume: true });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── AÇÕES DESTAQUE B3 ── */
  var b3Tickers = ['PETR4','VALE3','ITUB4','BBDC4','B3SA3','WEGE3','RENT3','ABEV3','BBAS3','SUZB3','JBSS3','ELET3','PRIO3','HAPV3','RDOR3'].filter(function(s) { return !!allData[s]; });
  if (b3Tickers.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Ações Destaque B3</div>';
    html += buildTable(b3Tickers, allData, { volume: true });
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── CALENDÁRIO ECONÔMICO ── */
  var calEvents = window._panoramaCalendario || gerarCalendarioEconomico();
  if (calEvents && calEvents.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Calendário Econômico</div>';
    html += renderCalendario(calEvents);
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── DESTAQUES DO MERCADO (NOTÍCIAS) ── */
  var noticias = window._panoramaNoticias || [];
  if (noticias.length) {
    html += '<div class="cc-section">';
    html += '<div class="cc-section-title">Destaques do Mercado</div>';
    html += renderNoticias(noticias);
    html += '</div>';
    html += '<div class="cc-divider"></div>';
  }

  /* ── CONCLUSÃO & VEREDICTO ── */
  html += '<div class="cc-section">';
  html += '<div class="cc-section-title">Conclusão & Estratégia</div>';
  html += '<div class="cc-conclusion">';

  html += '<div class="cc-conclusion-grid">';
  // Fatores positivos
  html += '<div>';
  html += '<div style="font-family:var(--cc-cond);font-size:11px;font-weight:700;color:var(--cc-green);letter-spacing:1px;margin-bottom:8px">✔ FATORES POSITIVOS</div>';
  html += '<ul class="cc-factor-list positive">';
  if (analise.positivos.length) {
    analise.positivos.forEach(function(p) { html += '<li>' + p + '</li>'; });
  } else {
    html += '<li style="color:var(--cc-text3)">Nenhum fator positivo relevante identificado</li>';
  }
  html += '</ul></div>';
  // Fatores de risco
  html += '<div>';
  html += '<div style="font-family:var(--cc-cond);font-size:11px;font-weight:700;color:var(--cc-red);letter-spacing:1px;margin-bottom:8px">⚠ FATORES DE RISCO</div>';
  html += '<ul class="cc-factor-list negative">';
  if (analise.negativos.length) {
    analise.negativos.forEach(function(n) { html += '<li>' + n + '</li>'; });
  } else {
    html += '<li style="color:var(--cc-text3)">Nenhum risco relevante identificado</li>';
  }
  html += '</ul></div>';
  html += '</div>';

  // Veredicto
  html += '<div class="cc-verdict">';
  html += '<div class="cc-verdict-label">VEREDICTO</div>';
  html += '<div class="cc-verdict-text" style="color:' + analise.sentCor + '">' + analise.sentimento + '</div>';
  html += '</div>';

  html += '</div></div>';

  /* ── FOOTER ── */
  html += '<div class="cc-footer">';
  html += '<div class="cc-footer-line"></div>';
  html += '<div class="cc-footer-brand">DMF INVESTIMENTOS — GESTÃO PATRIMONIAL</div>';
  html += '<div class="cc-footer-time">Relatório gerado automaticamente às ' + hora + '</div>';
  html += '</div>';

  html += '</div>'; // fecha cc-report

  /* ── HIDDEN IMAGE CANVAS ── */
  html += buildCCImageHTML(allData, periodo, analise, dataStr, hora);

  body.innerHTML = html;

  // Auto-refresh
  if (window.panoramaRefreshInterval) clearInterval(window.panoramaRefreshInterval);
  window.panoramaRefreshInterval = setInterval(function() {
    var view = document.getElementById('view-panorama');
    if (view && view.classList.contains('active')) refreshPanorama();
  }, 5 * 60 * 1000);
};


/* ─── 5. TEMPLATE DE IMAGEM PARA WHATSAPP ─── */

function buildCCImageHTML(allData, periodo, analise, dataStr, hora) {
  var s = '<div id="cc-image-canvas" style="position:absolute;left:-9999px;top:0;width:780px;padding:0;font-family:Barlow,Helvetica Neue,Arial,sans-serif;background:#0A0E17;color:#F1F5F9">';

  /* Header */
  s += '<div style="padding:28px 32px 20px;background:linear-gradient(135deg,#111827,#0A0E17);border-bottom:3px solid #D4A017">';
  s += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
  s += '<div><div style="font-size:11px;letter-spacing:4px;color:#D4A017;font-weight:700">DMF INVESTIMENTOS</div>';
  s += '<div style="font-size:26px;font-weight:900;color:#fff;margin-top:4px"><span style="color:#D4A017">' + periodo.nome + '</span></div></div>';
  s += '<div style="text-align:right"><div style="font-size:12px;color:#64748B">' + dataStr + '</div>';
  s += '<div style="font-size:12px;color:#64748B">Atualizado às ' + hora + '</div></div></div>';
  s += '<div style="margin-top:14px;display:inline-block;padding:5px 14px;border-radius:20px;background:' + analise.sentCor + '18;border:1px solid ' + analise.sentCor + '44">';
  s += '<span style="font-size:12px;font-weight:700;color:' + analise.sentCor + ';letter-spacing:1.5px">● SENTIMENTO: ' + analise.sentimento + '</span></div>';
  s += '</div>';

  /* Indicadores principais */
  s += '<div style="display:flex;flex-wrap:wrap;padding:16px 24px 8px;gap:8px">';
  var mainT = ['ES=F', 'NQ=F', '^VIX', 'IBOV', 'USDBRL=X', 'DX-Y.NYB', 'CL=F', 'GC=F'];
  mainT.forEach(function(sym) {
    var d = allData[sym];
    if (!d) return;
    var v = d.variacao || 0;
    var dec = decFor(sym);
    var topColor = varColorHex(v);
    s += '<div style="flex:1;min-width:80px;background:#111827;border:1px solid #1E293B;border-radius:10px;padding:12px 8px;text-align:center;border-top:2px solid ' + topColor + '">';
    s += '<div style="font-size:9px;color:#64748B;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap">' + d.nome + '</div>';
    s += '<div style="font-family:JetBrains Mono,monospace;font-size:15px;font-weight:700;color:#fff;margin:4px 0">' + fmtNum(d.preco, dec) + '</div>';
    s += '<div style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:' + topColor + '">' + fmtPct(v) + '</div>';
    s += '</div>';
  });
  s += '</div>';

  /* Tabelas por seção */
  var sections = [
    { title: 'FUTUROS', tickers: ['ES=F','NQ=F','YM=F','CL=F','BZ=F','GC=F','SI=F','HG=F'] },
    { title: 'ÍNDICES EUA', tickers: ['^GSPC','^DJI','^NDX','^RUT','^VIX'] },
    { title: 'MERCADOS GLOBAIS', tickers: ['^GDAXI','^FCHI','^FTSE','FTSEMIB.MI','^STOXX50E','^N225','^HSI'] },
    { title: 'CÂMBIO', tickers: ['USDBRL=X','EURUSD=X','GBPUSD=X','DX-Y.NYB'] },
    { title: 'COMMODITIES', tickers: ['CL=F','GC=F','SI=F','HG=F'] },
    { title: 'TREASURIES', tickers: ['^IRX','^FVX','^TNX','^TYX'] },
    { title: 'CRIPTO', tickers: ['BTC-USD','ETH-USD','SOL-USD'] },
    { title: 'ETFs', tickers: ['EWZ','SPY','QQQ','IWM','GLD','TLT'] }
  ];

  sections.forEach(function(sec) {
    var items = sec.tickers.filter(function(t) { return !!allData[t]; });
    if (!items.length) return;

    s += '<div style="padding:8px 24px">';
    s += '<div style="font-size:11px;font-weight:700;color:#D4A017;letter-spacing:2px;margin-bottom:8px;display:flex;align-items:center;gap:6px">';
    s += '<span style="display:inline-block;width:3px;height:12px;background:#D4A017;border-radius:2px"></span> ' + sec.title + '</div>';
    s += '<div style="background:#111827;border:1px solid #1E293B;border-radius:10px;overflow:hidden">';
    s += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
    s += '<tr style="border-bottom:1px solid #1E293B"><th style="padding:7px 12px;text-align:left;color:#475569;font-size:10px;font-weight:600;letter-spacing:0.5px;background:#1A2332">ATIVO</th>';
    s += '<th style="padding:7px 12px;text-align:right;color:#475569;font-size:10px;font-weight:600;background:#1A2332">PREÇO</th>';
    s += '<th style="padding:7px 12px;text-align:right;color:#475569;font-size:10px;font-weight:600;background:#1A2332">VAR%</th>';
    s += '<th style="padding:7px 12px;text-align:right;color:#475569;font-size:10px;font-weight:600;background:#1A2332">SINAL</th></tr>';

    items.forEach(function(t, i) {
      var d = allData[t];
      if (!d) return;
      var v = d.variacao || 0;
      var cor = varColorHex(v);
      var dec = decFor(t);
      var border = i < items.length - 1 ? 'border-bottom:1px solid #1E293B;' : '';
      var sig = v > 0.3 ? '▲ ALTA' : (v < -0.3 ? '▼ BAIXA' : '◆ NEUTRO');
      var sigBg = v > 0.3 ? 'rgba(16,185,129,0.15)' : (v < -0.3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)');
      var sigBorder = v > 0.3 ? 'rgba(16,185,129,0.3)' : (v < -0.3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)');

      s += '<tr style="' + border + '">';
      s += '<td style="padding:7px 12px;color:#F1F5F9;font-weight:500">' + d.nome + '</td>';
      s += '<td style="padding:7px 12px;text-align:right;font-family:JetBrains Mono,monospace;color:#fff;font-weight:600">' + fmtNum(d.preco, dec) + '</td>';
      s += '<td style="padding:7px 12px;text-align:right;font-family:JetBrains Mono,monospace;color:' + cor + ';font-weight:700">' + fmtPct(v) + '</td>';
      s += '<td style="padding:7px 12px;text-align:right"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.8px;background:' + sigBg + ';color:' + cor + ';border:1px solid ' + sigBorder + '">' + sig + '</span></td>';
      s += '</tr>';
    });

    s += '</table></div></div>';
  });

  /* Ações Destaque B3 (imagem) */
  var b3TickersImg = ['PETR4','VALE3','ITUB4','BBDC4','B3SA3','WEGE3','RENT3','ABEV3','BBAS3','SUZB3','JBSS3','ELET3','PRIO3','HAPV3','RDOR3'].filter(function(t) { return !!allData[t]; });
  if (b3TickersImg.length) {
    s += '<div style="padding:8px 24px">';
    s += '<div style="font-size:11px;font-weight:700;color:#D4A017;letter-spacing:2px;margin-bottom:8px;display:flex;align-items:center;gap:6px">';
    s += '<span style="display:inline-block;width:3px;height:12px;background:#D4A017;border-radius:2px"></span> AÇÕES DESTAQUE B3</div>';
    s += '<div style="background:#111827;border:1px solid #1E293B;border-radius:10px;overflow:hidden">';
    s += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
    s += '<tr style="border-bottom:1px solid #1E293B"><th style="padding:7px 12px;text-align:left;color:#475569;font-size:10px;font-weight:600;letter-spacing:0.5px;background:#1A2332">ATIVO</th>';
    s += '<th style="padding:7px 12px;text-align:right;color:#475569;font-size:10px;font-weight:600;background:#1A2332">PREÇO</th>';
    s += '<th style="padding:7px 12px;text-align:right;color:#475569;font-size:10px;font-weight:600;background:#1A2332">VAR%</th>';
    s += '<th style="padding:7px 12px;text-align:right;color:#475569;font-size:10px;font-weight:600;background:#1A2332">SINAL</th></tr>';
    b3TickersImg.forEach(function(t, i) {
      var d = allData[t]; if (!d) return;
      var v = d.variacao || 0;
      var cor = varColorHex(v);
      var border = i < b3TickersImg.length - 1 ? 'border-bottom:1px solid #1E293B;' : '';
      var sig = v > 0.3 ? '▲ ALTA' : (v < -0.3 ? '▼ BAIXA' : '◆ NEUTRO');
      var sigBg = v > 0.3 ? 'rgba(16,185,129,0.15)' : (v < -0.3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)');
      var sigBorder = v > 0.3 ? 'rgba(16,185,129,0.3)' : (v < -0.3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)');
      s += '<tr style="' + border + '">';
      s += '<td style="padding:7px 12px;color:#F1F5F9;font-weight:500">' + d.nome + '</td>';
      s += '<td style="padding:7px 12px;text-align:right;font-family:JetBrains Mono,monospace;color:#fff;font-weight:600">' + fmtNum(d.preco, 2) + '</td>';
      s += '<td style="padding:7px 12px;text-align:right;font-family:JetBrains Mono,monospace;color:' + cor + ';font-weight:700">' + fmtPct(v) + '</td>';
      s += '<td style="padding:7px 12px;text-align:right"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.8px;background:' + sigBg + ';color:' + cor + ';border:1px solid ' + sigBorder + '">' + sig + '</span></td>';
      s += '</tr>';
    });
    s += '</table></div></div>';
  }

  /* Calendário Econômico (imagem) */
  var calEventsImg = window._panoramaCalendario || gerarCalendarioEconomico();
  if (calEventsImg && calEventsImg.length) {
    var mesesImg = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    s += '<div style="padding:8px 24px">';
    s += '<div style="font-size:11px;font-weight:700;color:#D4A017;letter-spacing:2px;margin-bottom:8px;display:flex;align-items:center;gap:6px">';
    s += '<span style="display:inline-block;width:3px;height:12px;background:#D4A017;border-radius:2px"></span> CALENDÁRIO ECONÔMICO</div>';
    s += '<div style="display:grid;gap:6px">';
    calEventsImg.forEach(function(ev) {
      var impCor = ev.impacto === 'alto' ? '#EF4444' : (ev.impacto === 'medio' ? '#F59E0B' : '#3B82F6');
      var impBg = ev.impacto === 'alto' ? 'rgba(239,68,68,0.15)' : (ev.impacto === 'medio' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)');
      s += '<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:#111827;border:1px solid #1E293B;border-radius:8px">';
      s += '<div style="min-width:40px;text-align:center"><div style="font-family:JetBrains Mono,monospace;font-size:16px;font-weight:800;color:#fff;line-height:1">' + ev.data.getDate() + '</div>';
      s += '<div style="font-size:8px;color:#64748B;letter-spacing:1px">' + mesesImg[ev.data.getMonth()] + '</div></div>';
      s += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:#F1F5F9">' + ev.pais + ' ' + ev.titulo + '</div>';
      s += '<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:700;background:' + impBg + ';color:' + impCor + '">' + ev.impacto.toUpperCase() + '</span></div></div>';
    });
    s += '</div></div>';
  }

  /* Notícias (imagem) */
  var noticiasImg = window._panoramaNoticias || [];
  if (noticiasImg.length) {
    s += '<div style="padding:8px 24px">';
    s += '<div style="font-size:11px;font-weight:700;color:#D4A017;letter-spacing:2px;margin-bottom:8px;display:flex;align-items:center;gap:6px">';
    s += '<span style="display:inline-block;width:3px;height:12px;background:#D4A017;border-radius:2px"></span> DESTAQUES DO MERCADO</div>';
    s += '<div style="display:grid;gap:5px">';
    noticiasImg.slice(0, 6).forEach(function(n) {
      s += '<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 12px;background:#111827;border:1px solid #1E293B;border-radius:8px">';
      s += '<div style="width:5px;height:5px;border-radius:50%;background:#D4A017;margin-top:5px;flex-shrink:0"></div>';
      s += '<div style="font-size:11px;color:#F1F5F9;font-weight:500;line-height:1.4">' + (n.title || '') + '</div>';
      s += '</div>';
    });
    s += '</div></div>';
  }

  /* Conclusão */
  s += '<div style="padding:12px 24px">';
  s += '<div style="font-size:11px;font-weight:700;color:#D4A017;letter-spacing:2px;margin-bottom:10px;display:flex;align-items:center;gap:6px">';
  s += '<span style="display:inline-block;width:3px;height:12px;background:#D4A017;border-radius:2px"></span> CONCLUSÃO & ESTRATÉGIA</div>';
  s += '<div style="background:linear-gradient(135deg,#111827,#0F172A);border:1px solid #B8860B44;border-radius:12px;padding:18px 20px">';

  s += '<div style="display:flex;gap:16px">';
  // Positivos
  s += '<div style="flex:1"><div style="font-size:11px;font-weight:700;color:#10B981;letter-spacing:1px;margin-bottom:8px">✔ POSITIVOS</div>';
  if (analise.positivos.length) {
    analise.positivos.forEach(function(p) {
      s += '<div style="font-size:11px;color:#94A3B8;padding:3px 0;display:flex;gap:6px"><span style="color:#10B981;flex-shrink:0">•</span>' + p + '</div>';
    });
  } else {
    s += '<div style="font-size:11px;color:#475569">Nenhum</div>';
  }
  s += '</div>';
  // Negativos
  s += '<div style="flex:1"><div style="font-size:11px;font-weight:700;color:#EF4444;letter-spacing:1px;margin-bottom:8px">⚠ RISCOS</div>';
  if (analise.negativos.length) {
    analise.negativos.forEach(function(n) {
      s += '<div style="font-size:11px;color:#94A3B8;padding:3px 0;display:flex;gap:6px"><span style="color:#EF4444;flex-shrink:0">•</span>' + n + '</div>';
    });
  } else {
    s += '<div style="font-size:11px;color:#475569">Nenhum</div>';
  }
  s += '</div></div>';

  // Veredicto
  s += '<div style="text-align:center;padding:12px 16px;background:#1A2332;border:1px solid #B8860B44;border-radius:10px;margin-top:14px">';
  s += '<div style="font-size:10px;color:#64748B;letter-spacing:2px;margin-bottom:4px">VEREDICTO</div>';
  s += '<div style="font-size:16px;font-weight:900;color:' + analise.sentCor + ';letter-spacing:0.5px">' + analise.sentimento + '</div>';
  s += '</div>';

  s += '</div></div>';

  /* Footer */
  s += '<div style="padding:16px 24px 24px;text-align:center">';
  s += '<div style="height:1px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-bottom:14px;opacity:0.5"></div>';
  s += '<div style="font-size:10px;color:#475569;letter-spacing:2px">DMF INVESTIMENTOS — GESTÃO PATRIMONIAL</div>';
  s += '<div style="font-size:9px;color:#475569;margin-top:4px">Relatório gerado automaticamente às ' + hora + '</div>';
  s += '</div>';

  s += '</div>';
  return s;
}


/* ─── 6. CAPTURA DE IMAGEM (OVERRIDE) ─── */

window.capturarImagemPanorama = function() {
  return new Promise(function(resolve, reject) {
    var el = document.getElementById('cc-image-canvas');
    if (!el) { reject(new Error('Canvas não encontrado')); return; }
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.top = '0';
    el.style.zIndex = '9999';
    setTimeout(function() {
      html2canvas(el, { backgroundColor: '#0A0E17', scale: 2, useCORS: true, logging: false }).then(function(canvas) {
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        resolve(canvas.toDataURL('image/png'));
      }).catch(function(err) {
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        reject(err);
      });
    }, 300);
  });
};

/* Override da preview do panorama para usar o novo canvas */
window.previewImagemPanorama = function() {
  var el = document.getElementById('cc-image-canvas');
  if (!el || !el.innerHTML) { alert('Gere o relatório primeiro!'); return; }
  var btn = document.getElementById('panorama-img-btn');
  var btnOrig = btn ? btn.innerHTML : '';
  if (btn) { btn.textContent = 'Gerando imagem...'; btn.disabled = true; }

  window.capturarImagemPanorama().then(function(base64) {
    if (btn) { btn.innerHTML = btnOrig; btn.disabled = false; }
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:20px';
    overlay.onclick = function() { document.body.removeChild(overlay); };
    var img = document.createElement('img');
    img.src = base64;
    img.style.cssText = 'max-width:100%;max-height:100%;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5)';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
  }).catch(function(err) {
    if (btn) { btn.innerHTML = btnOrig; btn.disabled = false; }
    alert('Erro ao gerar imagem: ' + err.message);
  });
};

/* Override do capturarImagemPM para usar o canvas CC quando disponível */
var _origCapturarPM = window.capturarImagemPM;
window.capturarImagemPM = function() {
  var ccCanvas = document.getElementById('cc-image-canvas');
  if (ccCanvas && ccCanvas.innerHTML) {
    return window.capturarImagemPanorama();
  }
  // fallback para o original se o panorama não tiver sido carregado
  if (_origCapturarPM) return _origCapturarPM();
  return Promise.reject(new Error('Nenhum canvas disponível'));
};

/* ─── 7. UNIFICAÇÃO PRÉ-MERCADO + PANORAMA ─── */
/* Quando clica "Gerar Relatório" no Pré-Mercado, usa o mesmo motor do Panorama */

var _origGerarPM = window.gerarPreMercado;
window.gerarPreMercado = function() {
  var btn = document.getElementById('pm-gerar-btn');
  var body = document.getElementById('pm-body');
  if (btn) { btn.textContent = 'Gerando...'; btn.disabled = true; }
  if (body) body.innerHTML = '<div class="empty" style="padding:40px"><div class="empty-title">Buscando dados dos mercados...</div></div>';

  /* Coletar tickers de TODAS as fontes (PM + Panorama + MR) */
  var oplabTickers = [];
  var yahooTickers = [];
  var mrTickers = [];

  /* PM_TICKERS (yahoo) */
  if (window.PM_TICKERS) {
    Object.keys(PM_TICKERS).forEach(function(cat) {
      PM_TICKERS[cat].forEach(function(t) {
        if (t._yahoo && yahooTickers.indexOf(t.sym) < 0) yahooTickers.push(t.sym);
        else if (!t._yahoo && mrTickers.indexOf(t.sym) < 0) mrTickers.push(t.sym);
      });
    });
  }

  /* PANORAMA_CATEGORIAS (oplab + yahoo + mr) */
  if (window.PANORAMA_CATEGORIAS) {
    PANORAMA_CATEGORIAS.forEach(function(cat) {
      cat.tickers.forEach(function(t) { if (oplabTickers.indexOf(t) < 0) oplabTickers.push(t); });
      cat.yahooTickers.forEach(function(t) { if (yahooTickers.indexOf(t) < 0) yahooTickers.push(t); });
      if (cat.mrTickers) {
        cat.mrTickers.forEach(function(t) { if (mrTickers.indexOf(t) < 0) mrTickers.push(t); });
      }
    });
  }

  var oplabPromise = oplabTickers.length && window.oplabFetch ?
    oplabFetch('/market/quote?tickers=' + encodeURIComponent(oplabTickers.join(','))).catch(function() { return []; }) :
    Promise.resolve([]);

  var yahooPromise = yahooTickers.length ?
    fetch('/api/brapi?tickers=' + encodeURIComponent(yahooTickers.join(','))).then(function(r) { return r.json(); }).then(function(d) { return d.results || []; }).catch(function() { return []; }) :
    Promise.resolve([]);

  var mrPromise = mrTickers.length ?
    fetch('/api/maisretorno?action=quotes&tickers=' + encodeURIComponent(mrTickers.join(','))).then(function(r) { return r.json(); }).then(function(d) { return d.results || []; }).catch(function() { return []; }) :
    Promise.resolve([]);

  var newsPromise = fetch('/api/news').then(function(r) { return r.json(); }).then(function(d) { return d.items || []; }).catch(function() { return []; });

  Promise.all([oplabPromise, yahooPromise, mrPromise, newsPromise]).then(function(results) {
    var oplabData = Array.isArray(results[0]) ? results[0] : (results[0].data || results[0].results || []);
    var yahooData = results[1];
    var mrData = results[2];
    var newsData = results[3];

    /* Guardar notícias no global para o render */
    window._panoramaNoticias = newsData;

    var allData = {};
    oplabData.forEach(function(r) {
      allData[r.symbol] = {
        symbol: r.symbol,
        nome: (window.PANORAMA_NOMES && PANORAMA_NOMES[r.symbol]) || r.name || r.symbol,
        preco: r.close,
        variacao: r.variation || 0,
        abertura: r.open,
        maxDia: r.high,
        minDia: r.low,
        volume: r.volume
      };
    });
    yahooData.forEach(function(r) {
      var origSym = r.symbol;
      /* Recuperar symbol original */
      if (window.PANORAMA_CATEGORIAS) {
        PANORAMA_CATEGORIAS.forEach(function(cat) {
          cat.yahooTickers.forEach(function(yt) {
            var clean = yt.replace('.SA', '');
            if (clean === r.symbol || r.symbol === yt) origSym = yt;
          });
        });
      }
      yahooTickers.forEach(function(yt) {
        var clean = yt.replace('.SA', '');
        if (clean === r.symbol || r.symbol === yt) origSym = yt;
      });
      allData[origSym] = {
        symbol: origSym,
        nome: (window.PANORAMA_NOMES && PANORAMA_NOMES[origSym]) || r.shortName || origSym,
        preco: r.regularMarketPrice,
        variacao: r.regularMarketChangePercent || 0,
        varAbsoluta: r.regularMarketChange || 0,
        abertura: r.regularMarketOpen,
        fechAnterior: r.regularMarketPreviousClose,
        maxDia: r.regularMarketDayHigh,
        minDia: r.regularMarketDayLow,
        volume: r.regularMarketVolume
      };
    });
    /* Mais Retorno data */
    mrData.forEach(function(r) {
      allData[r.symbol] = {
        symbol: r.symbol,
        nome: (window.PANORAMA_NOMES && PANORAMA_NOMES[r.symbol]) || r.shortName || r.symbol,
        preco: r.regularMarketPrice,
        variacao: r.regularMarketChangePercent || 0,
        varAbsoluta: r.regularMarketChange || 0,
        abertura: r.regularMarketOpen,
        fechAnterior: r.regularMarketPreviousClose,
        maxDia: r.regularMarketDayHigh,
        minDia: r.regularMarketDayLow,
        volume: r.regularMarketVolume
      };
    });

    /* Renderizar no pm-body usando o mesmo motor editorial */
    var tempId = 'panorama-body';
    var pmBody = document.getElementById('pm-body');
    if (pmBody) {
      /* Temporariamente trocar o ID para que renderPanorama escreva no pm-body */
      pmBody.id = 'panorama-body';
      var realPanoBody = document.querySelector('#view-panorama #panorama-body');
      if (realPanoBody) realPanoBody.id = 'panorama-body-real';

      window.renderPanorama(allData);

      /* Restaurar IDs */
      pmBody.id = 'pm-body';
      if (realPanoBody) realPanoBody.id = 'panorama-body';
    }

    /* Também cachear dados para uso do WhatsApp */
    window.pmDadosCache = allData;
    window.pmTextoCache = 'Relatório gerado via Panorama v6';
    window.pmImageBase64 = null;

    if (btn) { btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Gerar Relatório'; btn.disabled = false; }
    var waBtn = document.getElementById('pm-wa-btn');
    if (waBtn) waBtn.style.display = '';
    var prevBtn = document.getElementById('pm-preview-btn');
    if (prevBtn) prevBtn.style.display = '';
    var sub = document.getElementById('pm-sub');
    if (sub) {
      var agora = new Date();
      sub.textContent = 'Gerado em ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' — ' + agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  }).catch(function(e) {
    if (body) body.innerHTML = '<div class="empty" style="padding:40px"><div class="empty-title" style="color:#ff1744">Erro ao buscar dados: ' + e.message + '</div></div>';
    if (btn) { btn.textContent = 'Gerar Relatório'; btn.disabled = false; }
  });
};

console.log('[Panorama v6] Relatório editorial CC carregado com sucesso');
})();
