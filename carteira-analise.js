/* ═══════════════════════════════════════════════════════════
   ANÁLISE DE CARTEIRA — Dashboard completo com dados Mais Retorno
   Composição, Evolução, Drawdown, Quilt View, Stress Test,
   Monte Carlo, Heatmap Mensal, Metas de Alocação
   ═══════════════════════════════════════════════════════════ */

// ─── CONSTANTES ──────────────────────────────────────────
var CORES_CLASSE = {
  'Ações BR':   '#ff8c00',
  'FIIs':       '#a855f7',
  'ETFs':       '#3b82f6',
  'BDRs':       '#ef4444',
  'Renda Fixa': '#6b7280',
  'Cripto':     '#f59e0b',
  'Internacional': '#10b981',
  'Outros':     '#64748b'
};

var CRISES_HISTORICAS = [
  { nome:'COVID-19', inicio:'2020-02-21', fim:'2020-03-23', desc:'Fev-Mar/2020' },
  { nome:'Joesley Day', inicio:'2017-05-17', fim:'2017-05-19', desc:'Mai/2017' },
  { nome:'Greve Caminhoneiros', inicio:'2018-05-21', fim:'2018-06-04', desc:'Mai-Jun/2018' },
  { nome:'Eleições 2018', inicio:'2018-08-01', fim:'2018-10-31', desc:'Ago-Out/2018' },
  { nome:'Crise 2015', inicio:'2015-07-01', fim:'2015-12-31', desc:'Jul-Dez/2015' },
  { nome:'Taper Tantrum', inicio:'2013-05-01', fim:'2013-09-30', desc:'Mai-Set/2013' }
];

// ─── CLASSIFICAÇÃO DE ATIVOS ─────────────────────────────
function classificarAtivo(ticker){
  if(!ticker) return 'Outros';
  var t = ticker.toUpperCase().trim();
  // FIIs: terminam em 11, 12, 13 e são B3 (não ETF)
  var etfs = ['BOVA11','IVVB11','SMAL11','HASH11','XFIX11','BOVV11','DIVO11','FIND11','MATB11','PIBB11','BRAX11','ECOO11','GOLD11','IMAB11','IRFM11','FIXA11','SPXI11','NASD11','TECK11','WRLD11','ACWI11'];
  if(etfs.indexOf(t) >= 0) return 'ETFs';
  if(/^[A-Z]{4}(11|12|13)$/.test(t)) return 'FIIs';
  // BDRs: terminam em 34, 35, 39
  if(/^[A-Z]{4,5}(34|35|39)$/.test(t)) return 'BDRs';
  // Ações BR: 4 letras + 1 ou 2 dígitos (3,4,5,6)
  if(/^[A-Z]{4}\d{1,2}$/.test(t) && !(/11|12|13|34|35|39$/.test(t))) return 'Ações BR';
  // Cripto
  var cryptos = ['BTC','ETH','SOL','ADA','DOT','AVAX','MATIC','LINK','UNI','DOGE','XRP','BNB'];
  if(cryptos.indexOf(t) >= 0) return 'Cripto';
  return 'Outros';
}

function toMRIdentifier(ticker){
  var t = ticker.toUpperCase().trim();
  var indexMap = {'CDI':'cdi:idx','IBOV':'ibov:idx','IFIX':'ifix:idx','IPCA':'ipca:idx','SELIC':'selic:idx'};
  if(indexMap[t]) return indexMap[t];
  var cryptos = ['BTC','ETH','SOL','ADA','DOT','AVAX','MATIC','LINK','UNI','DOGE','XRP','BNB','WBTC'];
  if(cryptos.indexOf(t) >= 0) return t.toLowerCase() + ':cc';
  return t.toLowerCase() + ':b3';
}

// ─── FETCH HELPERS ───────────────────────────────────────
function mrFetchStats(ticker, details){
  var id = toMRIdentifier(ticker);
  var url = '/api/maisretorno?action=stats&identifier=' + encodeURIComponent(id);
  if(details) url += '&details=true';
  return fetch(url).then(function(r){ return r.json(); });
}

function mrFetchHistory(ticker, startDate, endDate){
  var url = '/api/maisretorno?action=history&ticker=' + encodeURIComponent(ticker);
  if(startDate) url += '&start_date=' + startDate;
  if(endDate) url += '&end_date=' + endDate;
  return fetch(url).then(function(r){ return r.json(); });
}

// ─── PONTO DE ENTRADA ────────────────────────────────────
var _analiseAberta = false;
var _analiseData = null;

function abrirAnaliseCarteira(){
  if(_analiseAberta){
    fecharAnaliseCarteira();
    return;
  }
  // Pegar ativos do cliente atual
  var clienteId = currentClienteVinculado;
  if(!clienteId){
    alert('Nenhum cliente vinculado');
    return;
  }

  _analiseAberta = true;
  var container = document.getElementById('analise-carteira-container');
  if(!container){
    container = document.createElement('div');
    container.id = 'analise-carteira-container';
    // Inserir após os KPIs da carteira
    var ativosList = document.getElementById('mc-ativos-list');
    if(ativosList && ativosList.parentNode){
      ativosList.parentNode.parentNode.insertBefore(container, ativosList.parentNode.nextSibling);
    } else {
      var pc = document.querySelector('#view-minha-carteira .page-content');
      if(pc) pc.appendChild(container);
    }
  }
  container.innerHTML = '<div style="text-align:center;padding:60px 20px"><div class="mc-skel" style="display:inline-block;width:200px;height:24px;background:var(--border);border-radius:8px;animation:mcPulse 1.2s ease-in-out infinite"></div><p style="color:var(--text3);margin-top:12px;font-size:13px">Carregando análise completa da carteira...</p><p style="color:var(--text3);font-size:11px;margin-top:4px">Dados reais via API Mais Retorno</p></div>';

  // Buscar ativos do Firestore
  db.collection('clientes').doc(clienteId).collection('ativos').get().then(function(snap){
    var ativos = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    if(!ativos.length){
      container.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p style="color:var(--text3)">Nenhum ativo cadastrado para análise</p></div>';
      return;
    }
    carregarDadosAnalise(ativos, container);
  });

  // Atualizar botão
  var btn = document.getElementById('btn-analise-carteira');
  if(btn){ btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Fechar Análise'; }
}

function fecharAnaliseCarteira(){
  _analiseAberta = false;
  var container = document.getElementById('analise-carteira-container');
  if(container) container.innerHTML = '';
  var btn = document.getElementById('btn-analise-carteira');
  if(btn){ btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Analisar Carteira'; }
}

// ─── CARREGAR DADOS ──────────────────────────────────────
function carregarDadosAnalise(ativos, container){
  var tickers = [];
  ativos.forEach(function(a){
    var t = (a.nome||'').trim().toUpperCase();
    if(t && tickers.indexOf(t) < 0) tickers.push(t);
  });

  // Fetch stats com detalhes para cada ativo + CDI
  var allTickers = tickers.concat(['CDI']);
  var statsPromises = allTickers.map(function(t){
    return mrFetchStats(t, true).then(function(data){
      return { ticker: t, data: data };
    }).catch(function(){ return { ticker: t, data: null }; });
  });

  Promise.all(statsPromises).then(function(results){
    var statsMap = {};
    results.forEach(function(r){ if(r.data) statsMap[r.ticker] = r.data; });

    // Classificar e agrupar ativos
    var ativosComDados = ativos.map(function(a){
      var t = (a.nome||'').trim().toUpperCase();
      return {
        ticker: t,
        classe: classificarAtivo(t),
        quantidade: a.quantidade || 0,
        precoMedio: a.precoMedio || 0,
        investido: (a.quantidade||0) * (a.precoMedio||0),
        stats: statsMap[t] || null
      };
    });

    _analiseData = {
      ativos: ativosComDados,
      statsMap: statsMap,
      cdi: statsMap['CDI'] || null,
      tickers: tickers
    };

    renderAnaliseCompleta(container, _analiseData);
  });
}

// ─── RENDER COMPLETO ─────────────────────────────────────
function renderAnaliseCompleta(container, data){
  var html = '<div style="margin-top:16px">';

  // Header
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  html += '<div><div style="font-size:18px;font-weight:700;color:var(--text)">Análise da Carteira</div>';
  html += '<div style="font-size:12px;color:var(--text3);margin-top:2px">Dados reais via API Mais Retorno · Atualizado diariamente</div></div>';
  html += '<span style="background:#00c85322;color:#00c853;font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:.05em">DADOS REAIS API MR</span>';
  html += '</div>';

  // KPIs
  html += renderAnaliseKPIs(data);

  // Grid: Composição + Drawdown
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
  html += renderComposicaoCard(data);
  html += renderDrawdownCard(data);
  html += '</div>';

  // Quilt View
  html += renderQuiltView(data);

  // Grid: Stress Test
  html += renderStressTest(data);

  // Heatmap Mensal
  html += renderHeatmapMensal(data);

  // Disclaimer
  html += '<div style="font-size:10px;color:var(--text3);padding:16px;text-align:center;border-top:1px solid var(--border);margin-top:8px">';
  html += 'Análise informativa com dados históricos reais da API Mais Retorno. Rentabilidade passada não garante resultado futuro. Não constitui recomendação de investimento.';
  html += '</div>';

  html += '</div>';
  container.innerHTML = html;
}

// ─── KPIs ────────────────────────────────────────────────
function renderAnaliseKPIs(data){
  // Calcular métricas agregadas
  var totalInvestido = 0;
  var retornoAcum = 0;
  var melhorSharpe = null;
  var totalAtivos = data.ativos.length;

  data.ativos.forEach(function(a){
    totalInvestido += a.investido;
    if(a.stats && a.stats.stats){
      var tf = a.stats.stats.timeframe || {};
      var yr = tf.last_12_months || tf.ytd || {};
      retornoAcum += (yr.profitability || 0) * (a.investido || 1);
    }
  });
  if(totalInvestido > 0) retornoAcum = retornoAcum / totalInvestido;

  // CDI 12M
  var cdi12m = 0;
  if(data.cdi && data.cdi.stats && data.cdi.stats.timeframe && data.cdi.stats.timeframe.last_12_months){
    cdi12m = data.cdi.stats.timeframe.last_12_months.profitability || 0;
  }

  // Sharpe médio ponderado
  var sharpeSum = 0, sharpeW = 0;
  var volSum = 0, volW = 0;
  var worstDD = 0;
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.stats && a.stats.stats.timeframe){
      var tf12 = a.stats.stats.timeframe.last_12_months || {};
      if(tf12.sharpe_ratio && a.investido){
        sharpeSum += tf12.sharpe_ratio * a.investido;
        sharpeW += a.investido;
      }
      if(tf12.volatility && a.investido){
        volSum += tf12.volatility * a.investido;
        volW += a.investido;
      }
    }
    if(a.stats && a.stats.stats && a.stats.stats.worst_monthly_return){
      if(a.stats.stats.worst_monthly_return < worstDD) worstDD = a.stats.stats.worst_monthly_return;
    }
  });
  var avgSharpe = sharpeW > 0 ? sharpeSum / sharpeW : 0;
  var avgVol = volW > 0 ? volSum / volW : 0;
  var retRisco = avgVol > 0 ? Math.abs(retornoAcum / avgVol) : 0;

  var retCor = retornoAcum >= 0 ? '#00c853' : '#ff1744';
  var ddCor = '#ff1744';
  var sharpeCor = avgSharpe >= 0.5 ? '#00c853' : (avgSharpe >= 0 ? '#f59e0b' : '#ff1744');

  var h = '<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">';
  h += kpiCard('Retorno 12M', (retornoAcum>=0?'+':'') + retornoAcum.toFixed(1) + '%', 'vs CDI ' + cdi12m.toFixed(1) + '%', retCor);
  h += kpiCard('Pior Mês', worstDD.toFixed(1) + '%', 'drawdown máximo mensal', ddCor);
  h += kpiCard('Sharpe Médio', avgSharpe.toFixed(2), 'ponderado por peso', sharpeCor);
  h += kpiCard('Retorno/Risco', retRisco.toFixed(2) + 'x', 'retorno ÷ volatilidade', '#3b82f6');
  h += '</div>';
  return h;
}

function kpiCard(label, valor, sub, cor){
  return '<div class="card" style="padding:16px;border:1px solid var(--border)">'
    +'<div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px;font-weight:600">'+label+'</div>'
    +'<div style="font-size:22px;font-weight:700;color:'+cor+';font-family:DM Mono,monospace">'+valor+'</div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:4px">'+sub+'</div>'
    +'</div>';
}

// ─── COMPOSIÇÃO DA CARTEIRA (DONUT) ─────────────────────
function renderComposicaoCard(data){
  // Agrupar por classe
  var classes = {};
  var total = 0;
  data.ativos.forEach(function(a){
    if(!classes[a.classe]) classes[a.classe] = 0;
    classes[a.classe] += a.investido;
    total += a.investido;
  });

  var sorted = Object.keys(classes).sort(function(a,b){ return classes[b]-classes[a]; });

  // SVG Donut
  var svg = '<svg viewBox="0 0 200 200" style="width:140px;height:140px">';
  var cx=100, cy=100, r=75, r2=55;
  var startAngle = -90;
  sorted.forEach(function(cls){
    var pct = total > 0 ? classes[cls]/total : 0;
    var angle = pct * 360;
    var endAngle = startAngle + angle;
    var largeArc = angle > 180 ? 1 : 0;
    var s1 = Math.PI*(startAngle)/180, s2 = Math.PI*(endAngle)/180;
    var x1o = cx+r*Math.cos(s1), y1o = cy+r*Math.sin(s1);
    var x2o = cx+r*Math.cos(s2), y2o = cy+r*Math.sin(s2);
    var x1i = cx+r2*Math.cos(s2), y1i = cy+r2*Math.sin(s2);
    var x2i = cx+r2*Math.cos(s1), y2i = cy+r2*Math.sin(s1);
    var cor = CORES_CLASSE[cls] || '#64748b';
    svg += '<path d="M'+x1o+','+y1o+' A'+r+','+r+' 0 '+largeArc+',1 '+x2o+','+y2o+' L'+x1i+','+y1i+' A'+r2+','+r2+' 0 '+largeArc+',0 '+x2i+','+y2i+' Z" fill="'+cor+'" opacity="0.85"/>';
    startAngle = endAngle;
  });
  svg += '</svg>';

  // Legenda
  var leg = '';
  sorted.forEach(function(cls){
    var pct = total > 0 ? (classes[cls]/total*100) : 0;
    var cor = CORES_CLASSE[cls] || '#64748b';
    leg += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    leg += '<div style="width:10px;height:10px;border-radius:50%;background:'+cor+';flex-shrink:0"></div>';
    leg += '<span style="font-size:12px;color:var(--text2);flex:1">'+cls+'</span>';
    leg += '<span style="font-size:12px;font-weight:600;color:var(--text);font-family:DM Mono,monospace">'+pct.toFixed(0)+'%</span>';
    leg += '</div>';
  });

  return '<div class="card" style="padding:20px;border:1px solid var(--border)">'
    +'<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Composição da Carteira</div>'
    +'<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Pesos atuais por classe de ativo</div>'
    +'<div style="display:flex;align-items:center;gap:24px">'
    +'<div>'+svg+'</div>'
    +'<div style="flex:1">'+leg+'</div>'
    +'</div></div>';
}

// ─── DRAWDOWN CARD ───────────────────────────────────────
function renderDrawdownCard(data){
  // Usar worst_monthly_return de cada ativo
  var rows = '';
  var atOrdered = data.ativos.filter(function(a){ return a.stats && a.stats.stats; })
    .sort(function(a,b){ return (a.stats.stats.worst_monthly_return||0) - (b.stats.stats.worst_monthly_return||0); });

  atOrdered.slice(0,8).forEach(function(a){
    var wm = a.stats.stats.worst_monthly_return || 0;
    var bm = a.stats.stats.best_monthly_return || 0;
    var neg = a.stats.stats.negative_months || 0;
    var pos = a.stats.stats.positive_months || 0;
    var total = neg + pos;
    var pctNeg = total > 0 ? (neg/total*100).toFixed(0) : 0;
    var barW = Math.min(Math.abs(wm), 60);
    rows += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    rows += '<span style="font-size:11px;color:var(--text2);width:60px;flex-shrink:0;font-family:DM Mono,monospace">'+a.ticker+'</span>';
    rows += '<div style="flex:1;height:14px;background:var(--border);border-radius:3px;overflow:hidden;position:relative">';
    rows += '<div style="width:'+barW+'%;height:100%;background:#ff174466;border-radius:3px"></div>';
    rows += '</div>';
    rows += '<span style="font-size:11px;color:#ff1744;font-family:DM Mono,monospace;width:50px;text-align:right">'+wm.toFixed(1)+'%</span>';
    rows += '</div>';
  });

  return '<div class="card" style="padding:20px;border:1px solid var(--border)">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Drawdown por Ativo</span><span style="background:#ff174422;color:#ff1744;font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">RISCO</span></div>'
    +'<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Pior mês histórico de cada ativo</div>'
    +rows
    +'</div>';
}

// ─── QUILT VIEW (RETORNOS ANUAIS POR CLASSE) ─────────────
function renderQuiltView(data){
  // Coletar anos disponíveis de todos os ativos
  var todosAnos = {};
  var ativoComYears = [];
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.years){
      ativoComYears.push(a);
      Object.keys(a.stats.years).forEach(function(y){ todosAnos[y] = true; });
    }
  });
  // CDI
  if(data.cdi && data.cdi.years){
    Object.keys(data.cdi.years).forEach(function(y){ todosAnos[y] = true; });
  }

  var anos = Object.keys(todosAnos).sort();
  // Últimos 10 anos
  if(anos.length > 10) anos = anos.slice(anos.length - 10);

  if(!anos.length || !ativoComYears.length){
    return '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)"><p style="color:var(--text3);font-size:13px">Dados insuficientes para Quilt View</p></div>';
  }

  var h = '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border);overflow-x:auto">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Retornos Anuais por Ativo</span><span style="background:var(--blue);background:rgba(255,140,0,0.15);color:var(--blue);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">QUILT VIEW</span></div>';
  h += '<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Cada célula = retorno anual. Verde = positivo, Vermelho = negativo.</div>';

  h += '<table style="width:100%;border-collapse:collapse;font-size:11px;font-family:DM Mono,monospace">';
  h += '<thead><tr><th style="text-align:left;padding:6px 8px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border)">Ativo</th>';
  anos.forEach(function(y){
    h += '<th style="text-align:center;padding:6px 6px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border)">'+y+'</th>';
  });
  h += '</tr></thead><tbody>';

  // CDI primeiro
  if(data.cdi && data.cdi.years){
    h += quiltRow('CDI', data.cdi.years, anos, '#6b7280');
  }

  // Ativos
  ativoComYears.forEach(function(a){
    var cor = CORES_CLASSE[a.classe] || '#64748b';
    h += quiltRow(a.ticker, a.stats.years, anos, cor);
  });

  h += '</tbody></table></div>';
  return h;
}

function quiltRow(label, years, anos, labelCor){
  var h = '<tr><td style="padding:6px 8px;font-weight:600;color:'+labelCor+';white-space:nowrap;border-bottom:1px solid var(--border)">'+label+'</td>';
  anos.forEach(function(y){
    var yearData = years[y];
    var ret = yearData ? (yearData.year !== undefined ? yearData.year : null) : null;
    if(ret === null || ret === undefined){
      h += '<td style="padding:4px 3px;text-align:center;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">—</span></td>';
    } else {
      var bg, fg;
      if(ret >= 20){ bg = '#00c85344'; fg = '#00c853'; }
      else if(ret >= 5){ bg = '#00c85322'; fg = '#00c853'; }
      else if(ret >= 0){ bg = '#00c85311'; fg = '#00c853'; }
      else if(ret >= -10){ bg = '#ff174411'; fg = '#ff1744'; }
      else { bg = '#ff174433'; fg = '#ff1744'; }
      var sinal = ret >= 0 ? '+' : '';
      h += '<td style="padding:4px 3px;text-align:center;border-bottom:1px solid var(--border)"><span style="display:inline-block;padding:3px 6px;border-radius:4px;background:'+bg+';color:'+fg+';font-size:10px;min-width:44px">'+sinal+ret.toFixed(0)+'%</span></td>';
    }
  });
  h += '</tr>';
  return h;
}

// ─── STRESS TEST ─────────────────────────────────────────
function renderStressTest(data){
  var h = '<div style="margin-bottom:16px">';
  h += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Stress Test — Crises</div>';
  h += '<div style="font-size:11px;color:var(--text3);margin-bottom:12px">Retorno dos ativos nos principais eventos (usa dados completos)</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';

  CRISES_HISTORICAS.forEach(function(crise){
    // Calcular retorno médio ponderado dos ativos nesse período
    var retTotal = 0, pesoTotal = 0;
    var cdiRet = 0;

    data.ativos.forEach(function(a){
      if(a.stats && a.stats.years){
        var ret = calcRetornoPeriodo(a.stats.years, crise.inicio, crise.fim);
        if(ret !== null){
          retTotal += ret * (a.investido || 1);
          pesoTotal += (a.investido || 1);
        }
      }
    });
    if(data.cdi && data.cdi.years){
      cdiRet = calcRetornoPeriodo(data.cdi.years, crise.inicio, crise.fim);
    }

    var retCarteira = pesoTotal > 0 ? retTotal / pesoTotal : null;
    var retStr = retCarteira !== null ? (retCarteira >= 0 ? '+' : '') + retCarteira.toFixed(2) + '%' : 'N/A';
    var retCor = retCarteira !== null ? (retCarteira >= 0 ? '#00c853' : '#ff1744') : 'var(--text3)';
    var cdiStr = cdiRet !== null ? 'vs CDI ' + (cdiRet >= 0 ? '+' : '') + cdiRet.toFixed(2) + '%' : '';

    h += '<div class="card" style="padding:14px;border:1px solid var(--border)">';
    h += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text)">'+crise.nome+'</div>';
    h += '<div style="font-size:10px;color:var(--text3);margin-bottom:8px">'+crise.desc+'</div>';
    h += '<div style="font-size:18px;font-weight:700;color:'+retCor+';font-family:DM Mono,monospace">'+retStr+'</div>';
    if(cdiStr) h += '<div style="font-size:10px;color:var(--text3);margin-top:2px">'+cdiStr+'</div>';
    h += '</div>';
  });

  h += '</div></div>';
  return h;
}

function calcRetornoPeriodo(years, inicio, fim){
  // Estimativa baseada nos retornos mensais
  var anoInicio = parseInt(inicio.split('-')[0]);
  var mesInicio = parseInt(inicio.split('-')[1]);
  var anoFim = parseInt(fim.split('-')[0]);
  var mesFim = parseInt(fim.split('-')[1]);

  var ret = 1;
  var found = false;
  for(var y = anoInicio; y <= anoFim; y++){
    if(!years[y]) continue;
    var mStart = (y === anoInicio) ? mesInicio : 1;
    var mEnd = (y === anoFim) ? mesFim : 12;
    for(var m = mStart; m <= mEnd; m++){
      var mr = years[y][m];
      if(mr !== undefined && mr !== null){
        ret *= (1 + mr/100);
        found = true;
      }
    }
  }
  return found ? (ret - 1) * 100 : null;
}

// ─── HEATMAP MENSAL ──────────────────────────────────────
function renderHeatmapMensal(data){
  // Calcular retorno mensal ponderado da carteira
  var todosAnos = {};
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.years){
      Object.keys(a.stats.years).forEach(function(y){ todosAnos[y] = true; });
    }
  });
  var anos = Object.keys(todosAnos).sort();
  if(anos.length > 6) anos = anos.slice(anos.length - 6);

  if(!anos.length) return '';

  var totalInvestido = 0;
  data.ativos.forEach(function(a){ totalInvestido += a.investido; });

  var meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  var h = '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border);overflow-x:auto">';
  h += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Retorno Mensal da Carteira</div>';
  h += '<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Heatmap · Verde = positivo, Vermelho = negativo</div>';

  h += '<table style="width:100%;border-collapse:collapse;font-size:10px;font-family:DM Mono,monospace">';
  h += '<thead><tr><th style="padding:4px 6px;text-align:left;color:var(--text3)"></th>';
  meses.forEach(function(m){ h += '<th style="padding:4px 4px;text-align:center;color:var(--text3);font-weight:500">'+m+'</th>'; });
  h += '</tr></thead><tbody>';

  anos.forEach(function(y){
    h += '<tr><td style="padding:4px 6px;font-weight:600;color:var(--text2)">'+y+'</td>';
    for(var m = 1; m <= 12; m++){
      var retPond = 0;
      data.ativos.forEach(function(a){
        if(a.stats && a.stats.years && a.stats.years[y] && a.stats.years[y][m] !== undefined){
          var peso = totalInvestido > 0 ? a.investido / totalInvestido : 1/data.ativos.length;
          retPond += a.stats.years[y][m] * peso;
        }
      });

      var bg, fg;
      if(retPond > 3){ bg = '#00c85344'; fg = '#00c853'; }
      else if(retPond > 0){ bg = '#00c85318'; fg = '#00c853'; }
      else if(retPond > -3){ bg = '#ff174418'; fg = '#ff1744'; }
      else { bg = '#ff174444'; fg = '#ff1744'; }

      var val = retPond !== 0 ? retPond.toFixed(1) : '—';
      h += '<td style="padding:3px 2px;text-align:center"><span style="display:inline-block;padding:3px 4px;border-radius:3px;background:'+bg+';color:'+fg+';min-width:36px;font-size:9px">'+val+'</span></td>';
    }
    h += '</tr>';
  });

  h += '</tbody></table></div>';
  return h;
}

// Botão "Analisar Carteira" já é injetado inline no buildMinhaCarteiraView() do index.html
// Funciona para admin, gestor e cliente — todos usam currentClienteVinculado
