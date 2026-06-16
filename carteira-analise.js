/* ═══════════════════════════════════════════════════════════
   ANÁLISE DE CARTEIRA — Dashboard completo com dados Mais Retorno
   Composição, Evolução vs CDI, Drawdown, Quilt View, Stress Test,
   Monte Carlo, Heatmap Mensal, Dispersão, Metas de Alocação
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
  // ETFs conhecidos (incluindo RF)
  var etfs = ['BOVA11','IVVB11','SMAL11','HASH11','XFIX11','BOVV11','DIVO11','FIND11','MATB11','PIBB11','BRAX11','ECOO11','GOLD11','IMAB11','IRFM11','FIXA11','SPXI11','NASD11','TECK11','WRLD11','ACWI11','LFTB11','B5P211','NTNS11','LFTS11','KDIF11','BOVX11','SMAC11','HTEK11'];
  if(etfs.indexOf(t) >= 0) return 'ETFs';
  // FIIs: terminam em 11, 12, 13 e são B3 (não ETF)
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
var _metasAlocacao = {}; // Persistido em localStorage

function abrirAnaliseCarteira(){
  if(_analiseAberta){
    fecharAnaliseCarteira();
    return;
  }
  var clienteId = currentClienteVinculado;
  if(!clienteId){
    alert('Nenhum cliente vinculado');
    return;
  }

  // Carregar metas salvas
  try { _metasAlocacao = JSON.parse(localStorage.getItem('dmf_metas_'+clienteId)) || {}; } catch(e){ _metasAlocacao = {}; }

  _analiseAberta = true;
  var container = document.getElementById('analise-carteira-container');
  if(!container){
    container = document.createElement('div');
    container.id = 'analise-carteira-container';
    var ativosList = document.getElementById('mc-ativos-list');
    if(ativosList && ativosList.parentNode){
      ativosList.parentNode.parentNode.insertBefore(container, ativosList.parentNode.nextSibling);
    } else {
      var pc = document.querySelector('#view-minha-carteira .page-content');
      if(pc) pc.appendChild(container);
    }
  }
  container.innerHTML = '<div style="text-align:center;padding:60px 20px"><div class="mc-skel" style="display:inline-block;width:200px;height:24px;background:var(--border);border-radius:8px;animation:mcPulse 1.2s ease-in-out infinite"></div><p style="color:var(--text3);margin-top:12px;font-size:13px">Carregando análise completa da carteira...</p><p style="color:var(--text3);font-size:11px;margin-top:4px">Dados reais via API Mais Retorno</p></div>';

  db.collection('clientes').doc(clienteId).collection('ativos').get().then(function(snap){
    var ativos = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    if(!ativos.length){
      container.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p style="color:var(--text3)">Nenhum ativo cadastrado para análise</p></div>';
      return;
    }
    carregarDadosAnalise(ativos, container);
  });

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

  var allTickers = tickers.concat(['CDI']);
  var statsPromises = allTickers.map(function(t){
    return mrFetchStats(t, true).then(function(data){
      return { ticker: t, data: data };
    }).catch(function(){ return { ticker: t, data: null }; });
  });

  Promise.all(statsPromises).then(function(results){
    var statsMap = {};
    results.forEach(function(r){ if(r.data) statsMap[r.ticker] = r.data; });

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

  // Evolução vs CDI (NOVO)
  html += renderEvolucaoChart(data);

  // Grid: Composição + Meta Alocação (NOVO)
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
  html += renderComposicaoCard(data);
  html += renderMetaAlocacaoCard(data);
  html += '</div>';

  // Grid: Drawdown + Dispersão (NOVO)
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
  html += renderDrawdownCard(data);
  html += renderDispersaoCard(data);
  html += '</div>';

  // Quilt View
  html += renderQuiltView(data);

  // Grid: Stress Test
  html += renderStressTest(data);

  // Monte Carlo (NOVO)
  html += renderMonteCarloCard(data);

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
  var totalInvestido = 0;
  var retornoAcum = 0;

  data.ativos.forEach(function(a){
    totalInvestido += a.investido;
    if(a.stats && a.stats.stats){
      var tf = a.stats.stats.timeframe || {};
      var yr = tf.last_12_months || tf.ytd || {};
      retornoAcum += (yr.profitability || 0) * (a.investido || 1);
    }
  });
  if(totalInvestido > 0) retornoAcum = retornoAcum / totalInvestido;

  var cdi12m = 0;
  if(data.cdi && data.cdi.stats && data.cdi.stats.timeframe && data.cdi.stats.timeframe.last_12_months){
    cdi12m = data.cdi.stats.timeframe.last_12_months.profitability || 0;
  }

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

// ─── EVOLUÇÃO VS CDI (NOVO) ─────────────────────────────
function renderEvolucaoChart(data){
  // Reconstruir série mensal acumulada da carteira vs CDI
  var todosAnos = {};
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.years) Object.keys(a.stats.years).forEach(function(y){ todosAnos[y]=true; });
  });
  if(data.cdi && data.cdi.years) Object.keys(data.cdi.years).forEach(function(y){ todosAnos[y]=true; });

  var anos = Object.keys(todosAnos).sort();
  // Últimos 5 anos
  var anoMin = parseInt(anos[anos.length-1] || 2026) - 4;
  anos = anos.filter(function(y){ return parseInt(y) >= anoMin; });

  if(!anos.length) return '';

  var totalInvestido = 0;
  data.ativos.forEach(function(a){ totalInvestido += a.investido; });

  // Construir séries: [{label, valor}]
  var serieCarteira = [];
  var serieCDI = [];
  var acumCart = 100, acumCDI = 100;

  anos.forEach(function(y){
    for(var m = 1; m <= 12; m++){
      // Retorno ponderado da carteira no mês
      var retCart = 0;
      data.ativos.forEach(function(a){
        if(a.stats && a.stats.years && a.stats.years[y] && a.stats.years[y][m] !== undefined){
          var peso = totalInvestido > 0 ? a.investido / totalInvestido : 1/data.ativos.length;
          retCart += a.stats.years[y][m] * peso;
        }
      });
      acumCart *= (1 + retCart/100);
      serieCarteira.push({ label: m+'/'+y.slice(2), valor: acumCart });

      // CDI
      var retCDI = 0;
      if(data.cdi && data.cdi.years && data.cdi.years[y] && data.cdi.years[y][m] !== undefined){
        retCDI = data.cdi.years[y][m];
      }
      acumCDI *= (1 + retCDI/100);
      serieCDI.push({ label: m+'/'+y.slice(2), valor: acumCDI });
    }
  });

  // Remover meses futuros (valor não muda)
  var now = new Date();
  var mesAtual = now.getMonth()+1, anoAtual = now.getFullYear();
  serieCarteira = serieCarteira.filter(function(p,i){
    var parts = p.label.split('/');
    var mm = parseInt(parts[0]), yy = 2000 + parseInt(parts[1]);
    return yy < anoAtual || (yy === anoAtual && mm <= mesAtual);
  });
  serieCDI = serieCDI.slice(0, serieCarteira.length);

  if(serieCarteira.length < 2) return '';

  // SVG Chart
  var W = 900, H = 250, padL = 50, padR = 20, padT = 20, padB = 30;
  var chartW = W - padL - padR, chartH = H - padT - padB;

  var allVals = serieCarteira.map(function(p){return p.valor;}).concat(serieCDI.map(function(p){return p.valor;}));
  var minV = Math.min.apply(null, allVals) * 0.95;
  var maxV = Math.max.apply(null, allVals) * 1.05;
  if(maxV === minV) maxV = minV + 10;

  function toX(i){ return padL + (i / (serieCarteira.length-1)) * chartW; }
  function toY(v){ return padT + chartH - ((v - minV)/(maxV - minV)) * chartH; }

  var pathCart = 'M';
  serieCarteira.forEach(function(p,i){ pathCart += (i?'L':'') + toX(i).toFixed(1)+','+toY(p.valor).toFixed(1); });
  var pathCDI = 'M';
  serieCDI.forEach(function(p,i){ pathCDI += (i?'L':'') + toX(i).toFixed(1)+','+toY(p.valor).toFixed(1); });

  // Área preenchida carteira
  var areaCart = pathCart + ' L'+toX(serieCarteira.length-1).toFixed(1)+','+(padT+chartH)+' L'+padL+','+(padT+chartH)+' Z';

  var svg = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  // Grid lines
  for(var g = 0; g <= 4; g++){
    var gv = minV + (maxV-minV)*(g/4);
    var gy = toY(gv);
    svg += '<line x1="'+padL+'" y1="'+gy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+gy.toFixed(1)+'" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>';
    svg += '<text x="'+(padL-6)+'" y="'+(gy+3).toFixed(1)+'" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="end" font-family="DM Mono,monospace">'+gv.toFixed(0)+'</text>';
  }
  // X labels (a cada 6 meses)
  serieCarteira.forEach(function(p,i){
    if(i % 6 === 0 || i === serieCarteira.length-1){
      svg += '<text x="'+toX(i).toFixed(1)+'" y="'+(H-5)+'" fill="rgba(255,255,255,0.3)" font-size="8" text-anchor="middle" font-family="DM Mono,monospace">'+p.label+'</text>';
    }
  });
  // Area fill
  svg += '<path d="'+areaCart+'" fill="rgba(255,140,0,0.08)"/>';
  // Lines
  svg += '<path d="'+pathCDI+'" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>';
  svg += '<path d="'+pathCart+'" fill="none" stroke="#ff8c00" stroke-width="2"/>';
  // End dots
  var lastCart = serieCarteira[serieCarteira.length-1];
  var lastCDI = serieCDI[serieCDI.length-1];
  svg += '<circle cx="'+toX(serieCarteira.length-1).toFixed(1)+'" cy="'+toY(lastCart.valor).toFixed(1)+'" r="4" fill="#ff8c00"/>';
  svg += '<circle cx="'+toX(serieCDI.length-1).toFixed(1)+'" cy="'+toY(lastCDI.valor).toFixed(1)+'" r="3" fill="#6b7280"/>';
  // Labels finais
  svg += '<text x="'+(W-padR)+'" y="'+(toY(lastCart.valor)-8).toFixed(1)+'" fill="#ff8c00" font-size="10" text-anchor="end" font-weight="700" font-family="DM Mono,monospace">'+(lastCart.valor>=100?'+':'')+(lastCart.valor-100).toFixed(1)+'%</text>';
  svg += '<text x="'+(W-padR)+'" y="'+(toY(lastCDI.valor)-8).toFixed(1)+'" fill="#6b7280" font-size="10" text-anchor="end" font-weight="600" font-family="DM Mono,monospace">CDI '+(lastCDI.valor>=100?'+':'')+(lastCDI.valor-100).toFixed(1)+'%</text>';
  svg += '</svg>';

  var h = '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Evolução da Carteira</span>';
  h += '<span style="background:rgba(255,140,0,0.15);color:var(--blue);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">vs CDI</span></div>';
  h += '<div style="font-size:11px;color:var(--text3);margin-bottom:12px">Base 100 · Últimos '+anos.length+' anos · <span style="color:#ff8c00">━</span> Carteira <span style="color:#6b7280">┅</span> CDI</div>';
  h += svg;
  h += '</div>';
  return h;
}

// ─── COMPOSIÇÃO DA CARTEIRA (DONUT) ─────────────────────
function renderComposicaoCard(data){
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
    if(pct <= 0) return;
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

  // Legenda (ocultar classes com 0%)
  var leg = '';
  sorted.forEach(function(cls){
    var pct = total > 0 ? (classes[cls]/total*100) : 0;
    if(pct < 0.1) return;
    var cor = CORES_CLASSE[cls] || '#64748b';
    leg += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    leg += '<div style="width:10px;height:10px;border-radius:50%;background:'+cor+';flex-shrink:0"></div>';
    leg += '<span style="font-size:12px;color:var(--text2);flex:1">'+cls+'</span>';
    leg += '<span style="font-size:12px;font-weight:600;color:var(--text);font-family:DM Mono,monospace">'+pct.toFixed(1)+'%</span>';
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

// ─── META DE ALOCAÇÃO (NOVO) ─────────────────────────────
function renderMetaAlocacaoCard(data){
  var classes = {};
  var total = 0;
  data.ativos.forEach(function(a){
    if(!classes[a.classe]) classes[a.classe] = 0;
    classes[a.classe] += a.investido;
    total += a.investido;
  });
  var sorted = Object.keys(classes).sort(function(a,b){ return classes[b]-classes[a]; });

  var rows = '';
  sorted.forEach(function(cls){
    var pctAtual = total > 0 ? (classes[cls]/total*100) : 0;
    if(pctAtual < 0.1) return;
    var meta = _metasAlocacao[cls] || 0;
    var diff = pctAtual - meta;
    var diffCor = meta === 0 ? 'var(--text3)' : (Math.abs(diff) <= 3 ? '#00c853' : (diff > 0 ? '#f59e0b' : '#ff1744'));
    var diffStr = meta === 0 ? '—' : (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    var cor = CORES_CLASSE[cls] || '#64748b';

    rows += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
    rows += '<div style="width:10px;height:10px;border-radius:50%;background:'+cor+';flex-shrink:0"></div>';
    rows += '<span style="font-size:11px;color:var(--text2);width:70px;flex-shrink:0">'+cls+'</span>';

    // Barra comparativa
    rows += '<div style="flex:1;position:relative;height:18px;background:var(--border);border-radius:3px;overflow:hidden">';
    rows += '<div style="width:'+Math.min(pctAtual,100)+'%;height:100%;background:'+cor+'44;border-radius:3px"></div>';
    if(meta > 0){
      rows += '<div style="position:absolute;left:'+Math.min(meta,100)+'%;top:0;height:100%;width:2px;background:'+cor+';opacity:0.8"></div>';
    }
    rows += '</div>';

    rows += '<span style="font-size:10px;color:var(--text);width:38px;text-align:right;font-family:DM Mono,monospace">'+pctAtual.toFixed(0)+'%</span>';
    rows += '<span style="font-size:10px;color:var(--text3);width:4px;text-align:center">/</span>';
    rows += '<input type="number" min="0" max="100" step="5" value="'+meta+'" data-classe="'+cls+'" onchange="atualizarMetaAlocacao(this)" style="width:38px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:10px;text-align:center;padding:2px;font-family:DM Mono,monospace">';
    rows += '<span style="font-size:10px;color:'+diffCor+';width:42px;text-align:right;font-family:DM Mono,monospace">'+diffStr+'</span>';
    rows += '</div>';
  });

  return '<div class="card" style="padding:20px;border:1px solid var(--border)">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Meta de Alocação</span><span style="background:rgba(59,130,246,0.15);color:#3b82f6;font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">METAS</span></div>'
    +'<div style="font-size:11px;color:var(--text3);margin-bottom:14px">Atual vs meta · Defina a % ideal por classe</div>'
    +rows
    +'<div style="font-size:9px;color:var(--text3);margin-top:8px">Barra = atual · Linha = meta · Edite os campos para definir metas</div>'
    +'</div>';
}

function atualizarMetaAlocacao(input){
  var cls = input.getAttribute('data-classe');
  var val = parseFloat(input.value) || 0;
  _metasAlocacao[cls] = val;
  var clienteId = currentClienteVinculado;
  if(clienteId){
    try { localStorage.setItem('dmf_metas_'+clienteId, JSON.stringify(_metasAlocacao)); } catch(e){}
  }
  // Re-render o card inteiro
  if(_analiseData){
    var container = document.getElementById('analise-carteira-container');
    if(container) renderAnaliseCompleta(container, _analiseData);
  }
}

// ─── DRAWDOWN CARD ───────────────────────────────────────
function renderDrawdownCard(data){
  var rows = '';
  var atOrdered = data.ativos.filter(function(a){ return a.stats && a.stats.stats; })
    .sort(function(a,b){ return (a.stats.stats.worst_monthly_return||0) - (b.stats.stats.worst_monthly_return||0); });

  atOrdered.slice(0,8).forEach(function(a){
    var wm = a.stats.stats.worst_monthly_return || 0;
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

// ─── DISPERSÃO MENSAL (NOVO) ─────────────────────────────
function renderDispersaoCard(data){
  // Coletar todos os retornos mensais ponderados da carteira
  var retornos = [];
  var totalInvestido = 0;
  data.ativos.forEach(function(a){ totalInvestido += a.investido; });

  var todosAnos = {};
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.years) Object.keys(a.stats.years).forEach(function(y){ todosAnos[y]=true; });
  });
  var anos = Object.keys(todosAnos).sort();

  anos.forEach(function(y){
    for(var m = 1; m <= 12; m++){
      var ret = 0;
      var temDado = false;
      data.ativos.forEach(function(a){
        if(a.stats && a.stats.years && a.stats.years[y] && a.stats.years[y][m] !== undefined){
          var peso = totalInvestido > 0 ? a.investido / totalInvestido : 1/data.ativos.length;
          ret += a.stats.years[y][m] * peso;
          temDado = true;
        }
      });
      if(temDado) retornos.push(ret);
    }
  });

  if(retornos.length < 6) return '<div class="card" style="padding:20px;border:1px solid var(--border)"><p style="color:var(--text3);font-size:12px">Dados insuficientes para dispersão</p></div>';

  // Criar histograma com buckets de 2%
  var bucketSize = 2;
  var minR = Math.floor(Math.min.apply(null,retornos)/bucketSize)*bucketSize;
  var maxR = Math.ceil(Math.max.apply(null,retornos)/bucketSize)*bucketSize;
  var buckets = {};
  for(var b = minR; b <= maxR; b += bucketSize) buckets[b] = 0;
  retornos.forEach(function(r){
    var bk = Math.floor(r/bucketSize)*bucketSize;
    if(buckets[bk] !== undefined) buckets[bk]++;
    else buckets[bk] = 1;
  });

  var keys = Object.keys(buckets).map(Number).sort(function(a,b){return a-b;});
  var maxCount = Math.max.apply(null, keys.map(function(k){return buckets[k];}));

  // Média e mediana
  var soma = retornos.reduce(function(s,v){return s+v;},0);
  var media = soma / retornos.length;
  var sorted = retornos.slice().sort(function(a,b){return a-b;});
  var mediana = sorted[Math.floor(sorted.length/2)];
  var positivos = retornos.filter(function(r){return r>0;}).length;
  var pctPos = (positivos/retornos.length*100).toFixed(0);

  // SVG Histogram
  var W = 400, H = 160, padL = 5, padR = 5, padT = 10, padB = 25;
  var chartW = W - padL - padR, chartH = H - padT - padB;
  var barW = Math.max(chartW / keys.length - 2, 4);

  var svg = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  keys.forEach(function(k, i){
    var x = padL + (i / keys.length) * chartW + 1;
    var barH = maxCount > 0 ? (buckets[k]/maxCount) * chartH : 0;
    var y = padT + chartH - barH;
    var cor = k >= 0 ? '#00c85366' : '#ff174466';
    var stroke = k >= 0 ? '#00c853' : '#ff1744';
    svg += '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+barH.toFixed(1)+'" fill="'+cor+'" stroke="'+stroke+'" stroke-width="0.5" rx="1"/>';
    // Label embaixo (a cada 2 buckets)
    if(i % 2 === 0){
      svg += '<text x="'+(x+barW/2).toFixed(1)+'" y="'+(H-5)+'" fill="rgba(255,255,255,0.3)" font-size="8" text-anchor="middle" font-family="DM Mono,monospace">'+k+'%</text>';
    }
  });
  // Linha da média
  var mediaX = padL + ((media - minR)/(maxR - minR)) * chartW;
  svg += '<line x1="'+mediaX.toFixed(1)+'" y1="'+padT+'" x2="'+mediaX.toFixed(1)+'" y2="'+(padT+chartH)+'" stroke="#ff8c00" stroke-width="1.5" stroke-dasharray="3,2"/>';
  svg += '</svg>';

  var h = '<div class="card" style="padding:20px;border:1px solid var(--border)">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Dispersão Mensal</span><span style="background:rgba(255,140,0,0.15);color:var(--blue);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">HISTOGRAMA</span></div>';
  h += '<div style="font-size:11px;color:var(--text3);margin-bottom:12px">Distribuição dos retornos mensais · <span style="color:#ff8c00">┃</span> média</div>';
  h += svg;
  h += '<div style="display:flex;gap:16px;margin-top:10px;font-size:10px;font-family:DM Mono,monospace">';
  h += '<span style="color:var(--text3)">Média: <span style="color:var(--text)">'+(media>=0?'+':'')+media.toFixed(2)+'%</span></span>';
  h += '<span style="color:var(--text3)">Mediana: <span style="color:var(--text)">'+(mediana>=0?'+':'')+mediana.toFixed(2)+'%</span></span>';
  h += '<span style="color:var(--text3)">Meses +: <span style="color:#00c853">'+pctPos+'%</span></span>';
  h += '<span style="color:var(--text3)">Total: <span style="color:var(--text)">'+retornos.length+' meses</span></span>';
  h += '</div></div>';
  return h;
}

// ─── MONTE CARLO (NOVO) ─────────────────────────────────
function renderMonteCarloCard(data){
  // Coletar retornos mensais ponderados
  var retornos = [];
  var totalInvestido = 0;
  data.ativos.forEach(function(a){ totalInvestido += a.investido; });

  var todosAnos = {};
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.years) Object.keys(a.stats.years).forEach(function(y){ todosAnos[y]=true; });
  });
  Object.keys(todosAnos).sort().forEach(function(y){
    for(var m = 1; m <= 12; m++){
      var ret = 0; var temDado = false;
      data.ativos.forEach(function(a){
        if(a.stats && a.stats.years && a.stats.years[y] && a.stats.years[y][m] !== undefined){
          var peso = totalInvestido > 0 ? a.investido / totalInvestido : 1/data.ativos.length;
          ret += a.stats.years[y][m] * peso;
          temDado = true;
        }
      });
      if(temDado) retornos.push(ret/100);
    }
  });

  if(retornos.length < 12) return '';

  // Simulação: 500 caminhos, 24 meses
  var nSim = 500, nMeses = 24;
  var patrimonioAtual = totalInvestido;
  var caminhos = [];

  for(var s = 0; s < nSim; s++){
    var path = [patrimonioAtual];
    var val = patrimonioAtual;
    for(var m = 0; m < nMeses; m++){
      var rIdx = Math.floor(Math.random() * retornos.length);
      val *= (1 + retornos[rIdx]);
      path.push(val);
    }
    caminhos.push(path);
  }

  // Calcular percentis por mês
  var p10 = [], p25 = [], p50 = [], p75 = [], p90 = [];
  for(var m = 0; m <= nMeses; m++){
    var vals = caminhos.map(function(c){ return c[m]; }).sort(function(a,b){return a-b;});
    p10.push(vals[Math.floor(nSim*0.10)]);
    p25.push(vals[Math.floor(nSim*0.25)]);
    p50.push(vals[Math.floor(nSim*0.50)]);
    p75.push(vals[Math.floor(nSim*0.75)]);
    p90.push(vals[Math.floor(nSim*0.90)]);
  }

  // SVG Fan chart
  var W = 900, H = 220, padL = 70, padR = 20, padT = 15, padB = 30;
  var chartW = W - padL - padR, chartH = H - padT - padB;
  var minV = p10[nMeses] * 0.95;
  var maxV = p90[nMeses] * 1.05;

  function toX(i){ return padL + (i/nMeses)*chartW; }
  function toY(v){ return padT + chartH - ((v-minV)/(maxV-minV))*chartH; }

  // Construir paths de área
  function areaPath(upper, lower){
    var d = 'M';
    for(var i = 0; i <= nMeses; i++) d += (i?'L':'') + toX(i).toFixed(1)+','+toY(upper[i]).toFixed(1);
    for(var i = nMeses; i >= 0; i--) d += 'L' + toX(i).toFixed(1)+','+toY(lower[i]).toFixed(1);
    return d + 'Z';
  }
  function linePath(arr){
    var d = 'M';
    for(var i = 0; i <= nMeses; i++) d += (i?'L':'') + toX(i).toFixed(1)+','+toY(arr[i]).toFixed(1);
    return d;
  }

  var svg = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  // Grid
  for(var g = 0; g <= 4; g++){
    var gv = minV + (maxV-minV)*(g/4);
    var gy = toY(gv);
    svg += '<line x1="'+padL+'" y1="'+gy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+gy.toFixed(1)+'" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>';
    svg += '<text x="'+(padL-6)+'" y="'+(gy+3).toFixed(1)+'" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="end" font-family="DM Mono,monospace">R$'+(gv/1000).toFixed(0)+'k</text>';
  }
  // X labels
  for(var i = 0; i <= nMeses; i += 6){
    svg += '<text x="'+toX(i).toFixed(1)+'" y="'+(H-5)+'" fill="rgba(255,255,255,0.3)" font-size="8" text-anchor="middle" font-family="DM Mono,monospace">'+i+'m</text>';
  }
  // Áreas
  svg += '<path d="'+areaPath(p90,p10)+'" fill="rgba(255,140,0,0.06)"/>';
  svg += '<path d="'+areaPath(p75,p25)+'" fill="rgba(255,140,0,0.12)"/>';
  // Mediana
  svg += '<path d="'+linePath(p50)+'" fill="none" stroke="#ff8c00" stroke-width="2"/>';
  // Linha base
  svg += '<line x1="'+padL+'" y1="'+toY(patrimonioAtual).toFixed(1)+'" x2="'+(W-padR)+'" y2="'+toY(patrimonioAtual).toFixed(1)+'" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4,3"/>';
  svg += '</svg>';

  var retMed = ((p50[nMeses]/patrimonioAtual - 1)*100).toFixed(1);
  var retOtm = ((p90[nMeses]/patrimonioAtual - 1)*100).toFixed(1);
  var retPes = ((p10[nMeses]/patrimonioAtual - 1)*100).toFixed(1);

  var h = '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Monte Carlo — Projeção 24 Meses</span><span style="background:rgba(168,85,247,0.15);color:#a855f7;font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">SIMULAÇÃO</span></div>';
  h += '<div style="font-size:11px;color:var(--text3);margin-bottom:12px">'+nSim+' simulações · Faixas: P10-P90 (clara) e P25-P75 (escura) · <span style="color:#ff8c00">━</span> Mediana</div>';
  h += svg;
  h += '<div style="display:flex;gap:20px;margin-top:10px;font-size:10px;font-family:DM Mono,monospace">';
  h += '<span style="color:var(--text3)">Pessimista (P10): <span style="color:#ff1744">'+retPes+'%</span></span>';
  h += '<span style="color:var(--text3)">Mediana (P50): <span style="color:#ff8c00">+'+retMed+'%</span></span>';
  h += '<span style="color:var(--text3)">Otimista (P90): <span style="color:#00c853">+'+retOtm+'%</span></span>';
  h += '</div></div>';
  return h;
}

// ─── QUILT VIEW (RETORNOS ANUAIS POR CLASSE) ─────────────
function renderQuiltView(data){
  var todosAnos = {};
  var ativoComYears = [];
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.years){
      ativoComYears.push(a);
      Object.keys(a.stats.years).forEach(function(y){ todosAnos[y] = true; });
    }
  });
  if(data.cdi && data.cdi.years){
    Object.keys(data.cdi.years).forEach(function(y){ todosAnos[y] = true; });
  }

  var anos = Object.keys(todosAnos).sort();
  if(anos.length > 10) anos = anos.slice(anos.length - 10);

  if(!anos.length || !ativoComYears.length){
    return '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)"><p style="color:var(--text3);font-size:13px">Dados insuficientes para Quilt View</p></div>';
  }

  var h = '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border);overflow-x:auto">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Retornos Anuais por Ativo</span><span style="background:rgba(255,140,0,0.15);color:var(--blue);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">QUILT VIEW</span></div>';
  h += '<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Cada célula = retorno anual. Verde = positivo, Vermelho = negativo.</div>';

  h += '<table style="width:100%;border-collapse:collapse;font-size:11px;font-family:DM Mono,monospace">';
  h += '<thead><tr><th style="text-align:left;padding:6px 8px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border)">Ativo</th>';
  anos.forEach(function(y){
    h += '<th style="text-align:center;padding:6px 6px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border)">'+y+'</th>';
  });
  h += '</tr></thead><tbody>';

  if(data.cdi && data.cdi.years){
    h += quiltRow('CDI', data.cdi.years, anos, '#6b7280');
  }

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
  var todosAnos = {};
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.years) Object.keys(a.stats.years).forEach(function(y){ todosAnos[y] = true; });
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
