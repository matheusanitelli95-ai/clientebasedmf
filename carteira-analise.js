/* ═══════════════════════════════════════════════════════════
   ANÁLISE DE CARTEIRA — Dashboard completo com dados Mais Retorno
   Usa categoria/tipo/moeda do cadastro do cliente (Firestore)
   Evolução vs CDI, Composição, Drawdown, Quilt View, Stress Test,
   Monte Carlo, Heatmap, Dispersão, Metas de Alocação
   ═══════════════════════════════════════════════════════════ */

// ─── CORES POR TIPO (subcategoria do Firestore) ─────────
var CORES_TIPO = {
  'Ação':       'var(--neg)',
  'FII':        '#a855f7',
  'ETF':        '#3b82f6',
  'ETF de RF':  '#60a5fa',
  'BDR':        '#e67e22',
  'Cripto':     'var(--caution)',
  'Internacional':'#10b981',
  'CDB':        '#6b7280',
  'LCI':        '#8b5cf6',
  'LCA':        '#7c3aed',
  'Tesouro Direto':'#14b8a6',
  'Debênture':  '#f472b6',
  'CRI':        '#c084fc',
  'CRA':        '#a78bfa',
  'Previdência':'#fb923c',
  'Fundo DI':   '#94a3b8',
  'Fundo':      'var(--pos)',
  'Outro':      '#64748b'
};
var CORES_CATEGORIA = {
  'Renda Fixa':     '#3b82f6',
  'Renda Variável': 'var(--neg)'
};

var CRISES_HISTORICAS = [
  { nome:'COVID-19', inicio:'2020-02-21', fim:'2020-03-23', desc:'Fev-Mar/2020' },
  { nome:'Joesley Day', inicio:'2017-05-17', fim:'2017-05-19', desc:'Mai/2017' },
  { nome:'Greve Caminhoneiros', inicio:'2018-05-21', fim:'2018-06-04', desc:'Mai-Jun/2018' },
  { nome:'Eleições 2018', inicio:'2018-08-01', fim:'2018-10-31', desc:'Ago-Out/2018' },
  { nome:'Crise 2015', inicio:'2015-07-01', fim:'2015-12-31', desc:'Jul-Dez/2015' },
  { nome:'Taper Tantrum', inicio:'2013-05-01', fim:'2013-09-30', desc:'Mai-Set/2013' }
];

// ─── CLASSIFICAÇÃO: usar dados do Firestore ──────────────
function classificarAtivoFirestore(ativo){
  // Retorna { categoria, tipo, moeda, label }
  var cat = ativo.categoria || '';
  var tipo = ativo.tipo || '';
  var moeda = ativo.moeda || 'BRL';
  // Se não tem categoria, tentar inferir pelo nome
  if(!cat && tipo) cat = (tipo === 'CDB' || tipo === 'LCI' || tipo === 'LCA' || tipo === 'Tesouro Direto' || tipo === 'Debênture' || tipo === 'CRI' || tipo === 'CRA' || tipo === 'ETF de RF' || tipo === 'Fundo DI') ? 'Renda Fixa' : 'Renda Variável';
  if(!cat) cat = 'Outros';
  if(!tipo) tipo = 'Outro';
  return { categoria: cat, tipo: tipo, moeda: moeda, label: tipo };
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

// Google Finance stats (Yahoo Chart API) — para tickers internacionais
function gfFetchStats(ticker, gfinanceId){
  var sym = gfinanceId || ticker;
  var url = '/api/gfinance?action=stats&symbol=' + encodeURIComponent(sym) + '&years=10';
  return fetch(url).then(function(r){ return r.json(); });
}

// Detectar se ticker é internacional (sem dados no Mais Retorno)
function _isInternationalTicker(ticker, ativo){
  if(!ticker) return false;
  // Se tem gfinanceId com exchange não-BVSP
  if(ativo && ativo.gfinanceId){
    var gf = ativo.gfinanceId;
    if(gf.indexOf('-USD') >= 0 || gf.indexOf('-BRL') >= 0) return true; // Crypto
    if(gf.indexOf(':BVSP') >= 0 || gf.indexOf(':BVMF') >= 0) return false; // Brasileiro
    if(gf.indexOf(':NYSE') >= 0 || gf.indexOf(':NASDAQ') >= 0 || gf.indexOf(':NYSEARCA') >= 0) return true;
    if(gf.indexOf(':') >= 0) return true; // Qualquer exchange que não é BVSP
  }
  // Moeda USD/EUR
  if(ativo && (ativo.moeda === 'USD' || ativo.moeda === 'EUR')) return true;
  // Tipo internacional
  if(ativo && (ativo.tipo||'').toLowerCase() === 'internacional') return true;
  // Tickers sem número (VOO, QQQ, SPY, TFLO, SGOV, BTC)
  if(/^[A-Z]{2,5}$/.test(ticker) && !/\d/.test(ticker)) return true;
  return false;
}

// ─── ESTADO ──────────────────────────────────────────────
var _analiseAberta = false;
var _analiseData = null;
var _metasAlocacao = {};
var _analiseJanela = 10; // anos de janela padrão

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

  try { _metasAlocacao = JSON.parse(localStorage.getItem('dmf_metas_'+clienteId)) || {}; } catch(e){ _metasAlocacao = {}; }
  try { _analiseJanela = parseInt(localStorage.getItem('dmf_janela_'+clienteId)) || 10; } catch(e){ _analiseJanela = 10; }

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
  container.innerHTML = '<div style="text-align:center;padding:60px 20px"><div class="mc-skel" style="display:inline-block;width:200px;height:24px;background:var(--border);border-radius:8px;animation:mcPulse 1.2s ease-in-out infinite"></div><p style="color:var(--text3);margin-top:12px;font-size:13px">Carregando análise completa da carteira...</p></div>';

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
  var ativoMap = {}; // ticker → ativo data (para detectar internacional)
  ativos.forEach(function(a){
    var t = (a.nome||'').trim().toUpperCase();
    if(t && tickers.indexOf(t) < 0){
      tickers.push(t);
      ativoMap[t] = a;
    }
  });

  // Separar tickers BR e internacionais
  var brTickers = [];
  var intlTickers = [];
  tickers.forEach(function(t){
    if(_isInternationalTicker(t, ativoMap[t])){
      intlTickers.push(t);
    } else {
      brTickers.push(t);
    }
  });

  // CDI e IBOV sempre via MR
  var allBR = brTickers.concat(['CDI','IBOV']);

  // Fase 1: Buscar stats BR via Mais Retorno
  var brPromises = allBR.map(function(t){
    return mrFetchStats(t, true).then(function(data){
      // Verificar se MR retornou dados válidos (tem years com dados)
      var hasData = data && data.years && Object.keys(data.years).length > 0;
      return { ticker: t, data: hasData ? data : null };
    }).catch(function(){ return { ticker: t, data: null }; });
  });

  // Fase 2: Buscar stats internacionais via Google Finance (Yahoo Chart)
  var intlPromises = intlTickers.map(function(t){
    var gfId = ativoMap[t] && ativoMap[t].gfinanceId ? ativoMap[t].gfinanceId : t;
    return gfFetchStats(t, gfId).then(function(data){
      var hasData = data && data.years && Object.keys(data.years).length > 0;
      return { ticker: t, data: hasData ? data : null };
    }).catch(function(){ return { ticker: t, data: null }; });
  });

  Promise.all(brPromises.concat(intlPromises)).then(function(results){
    var statsMap = {};
    results.forEach(function(r){
      if(r.data) statsMap[r.ticker] = r.data;
    });

    // Para tickers BR que MR não retornou, tentar GFinance como fallback
    var brMissing = brTickers.filter(function(t){ return !statsMap[t]; });
    if(brMissing.length > 0){
      var fallbackPromises = brMissing.map(function(t){
        var gfId = ativoMap[t] && ativoMap[t].gfinanceId ? ativoMap[t].gfinanceId : t + ':BVMF';
        return gfFetchStats(t, gfId).then(function(data){
          var hasData = data && data.years && Object.keys(data.years).length > 0;
          if(hasData) statsMap[t] = data;
        }).catch(function(){});
      });
      Promise.all(fallbackPromises).then(function(){
        _buildAndRenderAnalise(ativos, statsMap, tickers, container);
      });
    } else {
      _buildAndRenderAnalise(ativos, statsMap, tickers, container);
    }
  });
}

function _buildAndRenderAnalise(ativos, statsMap, tickers, container){
  var ativosComDados = ativos.map(function(a){
    var t = (a.nome||'').trim().toUpperCase();
    var classif = classificarAtivoFirestore(a);
    return {
      ticker: t,
      categoria: classif.categoria,
      tipo: classif.tipo,
      moeda: classif.moeda,
      label: classif.label,
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
    ibov: statsMap['IBOV'] || null,
    tickers: tickers
  };

  renderAnaliseCompleta(container, _analiseData);
}

// ─── RENDER COMPLETO ─────────────────────────────────────
function renderAnaliseCompleta(container, data){
  var html = '<div style="margin-top:16px">';

  // Header + seletor de janela
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  html += '<div><div style="font-size:18px;font-weight:700;color:var(--text)">Análise da Carteira</div>';
  html += '<div style="font-size:12px;color:var(--text3);margin-top:2px">Dados reais via API Mais Retorno · Categorias do cadastro</div></div>';
  html += '<div style="display:flex;gap:8px;align-items:center">';
  html += '<span style="font-size:10px;color:var(--text3)">Janela:</span>';
  [3,5,10,20].forEach(function(n){
    var sel = n === _analiseJanela;
    html += '<button onclick="setAnaliseJanela('+n+')" style="padding:3px 10px;font-size:10px;border-radius:12px;border:1px solid '+(sel?'var(--blue)':'var(--border)')+';background:'+(sel?'rgba(255,140,0,0.15)':'transparent')+';color:'+(sel?'var(--blue)':'var(--text3)')+';cursor:pointer;font-weight:'+(sel?'700':'400')+'">'+n+'A</button>';
  });
  html += '<span style="background:color-mix(in srgb,var(--pos) 13%,transparent);color:var(--pos);font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:.05em;margin-left:8px">API MR</span>';
  html += '</div></div>';

  html += renderAnaliseKPIs(data);
  html += renderEvolucaoChart(data);

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
  html += renderComposicaoCard(data);
  html += renderMetaAlocacaoCard(data);
  html += '</div>';

  html += renderIndicadoresRisco(data);

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
  html += renderDrawdownCard(data);
  html += renderDispersaoCard(data);
  html += '</div>';

  html += renderCorrelacaoMatrix(data);
  html += renderFronteiraEficiente(data);
  html += renderRollingWindows(data);
  html += renderQuiltView(data);
  html += renderStressTest(data);
  html += renderMonteCarloCard(data);
  html += renderHeatmapMensal(data);

  html += '<div style="font-size:10px;color:var(--text3);padding:16px;text-align:center;border-top:1px solid var(--border);margin-top:8px">';
  html += 'Análise informativa com dados históricos reais da API Mais Retorno. Rentabilidade passada não garante resultado futuro.';
  html += '</div></div>';

  container.innerHTML = html;
}

function setAnaliseJanela(n){
  _analiseJanela = n;
  var clienteId = currentClienteVinculado;
  if(clienteId) try { localStorage.setItem('dmf_janela_'+clienteId, n); } catch(e){}
  if(_analiseData){
    var container = document.getElementById('analise-carteira-container');
    if(container) renderAnaliseCompleta(container, _analiseData);
  }
}

// ─── HELPER: filtrar anos pela janela ────────────────────
function filtrarAnosPorJanela(anos){
  var anoAtual = new Date().getFullYear();
  var anoMin = anoAtual - _analiseJanela + 1;
  return anos.filter(function(y){ return parseInt(y) >= anoMin; });
}

// ─── KPIs ────────────────────────────────────────────────
function renderAnaliseKPIs(data){
  var totalInvestido = 0, retornoAcum = 0;
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
  if(data.cdi && data.cdi.stats && data.cdi.stats.timeframe && data.cdi.stats.timeframe.last_12_months)
    cdi12m = data.cdi.stats.timeframe.last_12_months.profitability || 0;

  var sharpeSum=0,sharpeW=0,volSum=0,volW=0,worstDD=0;
  data.ativos.forEach(function(a){
    if(a.stats && a.stats.stats && a.stats.stats.timeframe){
      var tf12 = a.stats.stats.timeframe.last_12_months || {};
      if(tf12.sharpe_ratio && a.investido){ sharpeSum += tf12.sharpe_ratio*a.investido; sharpeW += a.investido; }
      if(tf12.volatility && a.investido){ volSum += tf12.volatility*a.investido; volW += a.investido; }
    }
    if(a.stats && a.stats.stats && a.stats.stats.worst_monthly_return)
      if(a.stats.stats.worst_monthly_return < worstDD) worstDD = a.stats.stats.worst_monthly_return;
  });
  var avgSharpe = sharpeW>0 ? sharpeSum/sharpeW : 0;
  var avgVol = volW>0 ? volSum/volW : 0;
  var retRisco = avgVol>0 ? Math.abs(retornoAcum/avgVol) : 0;

  var pctCDI = cdi12m > 0 ? ((retornoAcum / cdi12m) * 100).toFixed(0) : '—';

  var h = '<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:8px">';
  h += kpiCard('Retorno 12M',(retornoAcum>=0?'+':'')+retornoAcum.toFixed(2)+'%','vs CDI '+cdi12m.toFixed(2)+'%',retornoAcum>=0?'var(--pos)':'var(--neg)');
  h += kpiCard('Volatilidade',avgVol.toFixed(2)+'% a.a.','risco anualizado ponderado',avgVol<=15?'var(--pos)':(avgVol<=25?'var(--caution)':'var(--neg)'));
  h += kpiCard('% do CDI',pctCDI+'%','retorno 12M ÷ CDI 12M',parseFloat(pctCDI)>=100?'var(--pos)':'var(--neg)');
  h += '</div>';
  h += '<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">';
  h += kpiCard('Sharpe',avgSharpe.toFixed(2),'ponderado por peso',avgSharpe>=0.5?'var(--pos)':(avgSharpe>=0?'var(--caution)':'var(--neg)'));
  h += kpiCard('Pior Mês',worstDD.toFixed(1)+'%','drawdown máximo mensal','var(--neg)');
  h += kpiCard('Retorno/Risco',retRisco.toFixed(2)+'x','retorno ÷ volatilidade','#3b82f6');
  h += '</div>';
  return h;
}
function kpiCard(l,v,s,c){
  return '<div class="card" style="padding:16px;border:1px solid var(--border)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px;font-weight:600">'+l+'</div><div style="font-size:22px;font-weight:700;color:'+c+';font-family:Inter,sans-serif">'+v+'</div><div style="font-size:11px;color:var(--text3);margin-top:4px">'+s+'</div></div>';
}

// ─── EVOLUÇÃO VS CDI ─────────────────────────────────────
function renderEvolucaoChart(data){
  var todosAnos = {};
  data.ativos.forEach(function(a){ if(a.stats&&a.stats.years) Object.keys(a.stats.years).forEach(function(y){todosAnos[y]=true;}); });
  if(data.cdi&&data.cdi.years) Object.keys(data.cdi.years).forEach(function(y){todosAnos[y]=true;});
  if(data.ibov&&data.ibov.years) Object.keys(data.ibov.years).forEach(function(y){todosAnos[y]=true;});
  var anos = filtrarAnosPorJanela(Object.keys(todosAnos).sort());
  if(!anos.length) return '';

  var totalInvestido = 0;
  data.ativos.forEach(function(a){ totalInvestido += a.investido; });

  var serieCart=[], serieCDI=[], serieIBOV=[];
  var acC=100, acD=100, acI=100;
  var now=new Date(), mesAt=now.getMonth()+1, anoAt=now.getFullYear();
  var hasIbov = !!(data.ibov && data.ibov.years);

  anos.forEach(function(y){
    for(var m=1;m<=12;m++){
      var yi=parseInt(y);
      if(yi>anoAt||(yi===anoAt&&m>mesAt)) continue;
      var rC=0;
      data.ativos.forEach(function(a){
        if(a.stats&&a.stats.years&&a.stats.years[y]&&a.stats.years[y][m]!==undefined){
          var peso=totalInvestido>0?a.investido/totalInvestido:1/data.ativos.length;
          rC+=a.stats.years[y][m]*peso;
        }
      });
      acC*=(1+rC/100);
      serieCart.push({label:m+'/'+String(y).slice(2),valor:acC});
      var rD=0;
      if(data.cdi&&data.cdi.years&&data.cdi.years[y]&&data.cdi.years[y][m]!==undefined) rD=data.cdi.years[y][m];
      acD*=(1+rD/100);
      serieCDI.push({label:m+'/'+String(y).slice(2),valor:acD});
      var rI=0;
      if(hasIbov&&data.ibov.years[y]&&data.ibov.years[y][m]!==undefined) rI=data.ibov.years[y][m];
      acI*=(1+rI/100);
      serieIBOV.push({label:m+'/'+String(y).slice(2),valor:acI});
    }
  });
  if(serieCart.length<2) return '';

  var W=900,H=250,pL=50,pR=20,pT=20,pB=30;
  var cW=W-pL-pR, cH=H-pT-pB;
  var all=serieCart.map(function(p){return p.valor;}).concat(serieCDI.map(function(p){return p.valor;})).concat(serieIBOV.map(function(p){return p.valor;}));
  var mn=Math.min.apply(null,all)*0.95, mx=Math.max.apply(null,all)*1.05;
  if(mx===mn)mx=mn+10;
  function tX(i){return pL+(i/(serieCart.length-1))*cW;}
  function tY(v){return pT+cH-((v-mn)/(mx-mn))*cH;}

  var pC='M',pD='M',pI='M';
  serieCart.forEach(function(p,i){pC+=(i?'L':'')+tX(i).toFixed(1)+','+tY(p.valor).toFixed(1);});
  serieCDI.forEach(function(p,i){pD+=(i?'L':'')+tX(i).toFixed(1)+','+tY(p.valor).toFixed(1);});
  serieIBOV.forEach(function(p,i){pI+=(i?'L':'')+tX(i).toFixed(1)+','+tY(p.valor).toFixed(1);});
  var area=pC+' L'+tX(serieCart.length-1).toFixed(1)+','+(pT+cH)+' L'+pL+','+(pT+cH)+' Z';

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  for(var g=0;g<=4;g++){var gv=mn+(mx-mn)*(g/4),gy=tY(gv);svg+='<line x1="'+pL+'" y1="'+gy.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+gy.toFixed(1)+'" stroke="rgba(255,255,255,0.06)"/>';svg+='<text x="'+(pL-6)+'" y="'+(gy+3).toFixed(1)+'" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="end" font-family="Inter,sans-serif">'+gv.toFixed(0)+'</text>';}
  serieCart.forEach(function(p,i){if(i%(Math.max(1,Math.floor(serieCart.length/12)))===0||i===serieCart.length-1)svg+='<text x="'+tX(i).toFixed(1)+'" y="'+(H-5)+'" fill="rgba(255,255,255,0.3)" font-size="8" text-anchor="middle" font-family="Inter,sans-serif">'+p.label+'</text>';});
  svg+='<path d="'+area+'" fill="rgba(255,140,0,0.08)"/>';
  if(hasIbov) svg+='<path d="'+pI+'" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.6"/>';
  svg+='<path d="'+pD+'" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>';
  svg+='<path d="'+pC+'" fill="none" style="stroke:var(--neg)" stroke-width="2"/>';
  var lC=serieCart[serieCart.length-1],lD=serieCDI[serieCDI.length-1];
  svg+='<circle cx="'+tX(serieCart.length-1).toFixed(1)+'" cy="'+tY(lC.valor).toFixed(1)+'" r="4" style="fill:var(--neg)"/>';
  svg+='<circle cx="'+tX(serieCDI.length-1).toFixed(1)+'" cy="'+tY(lD.valor).toFixed(1)+'" r="3" fill="#6b7280"/>';
  if(hasIbov){var lI=serieIBOV[serieIBOV.length-1];svg+='<circle cx="'+tX(serieIBOV.length-1).toFixed(1)+'" cy="'+tY(lI.valor).toFixed(1)+'" r="3" fill="#a855f7"/>';svg+='<text x="'+(W-pR)+'" y="'+(tY(lI.valor)+14).toFixed(1)+'" fill="#a855f7" font-size="10" text-anchor="end" font-weight="600" font-family="Inter,sans-serif">IBOV '+(lI.valor>=100?'+':'')+(lI.valor-100).toFixed(1)+'%</text>';}
  svg+='<text x="'+(W-pR)+'" y="'+(tY(lC.valor)-8).toFixed(1)+'" style="fill:var(--neg)" font-size="10" text-anchor="end" font-weight="700" font-family="Inter,sans-serif">'+(lC.valor>=100?'+':'')+(lC.valor-100).toFixed(1)+'%</text>';
  svg+='<text x="'+(W-pR)+'" y="'+(tY(lD.valor)-8).toFixed(1)+'" fill="#6b7280" font-size="10" text-anchor="end" font-weight="600" font-family="Inter,sans-serif">CDI '+(lD.valor>=100?'+':'')+(lD.valor-100).toFixed(1)+'%</text>';
  // ── hover circles (hidden, shown via JS) ──
  svg+='<circle id="__evo_dotC" cx="0" cy="0" r="5" style="fill:var(--neg)" opacity="0"/>';
  svg+='<circle id="__evo_dotD" cx="0" cy="0" r="4" fill="#6b7280" opacity="0"/>';
  svg+='<line id="__evo_vline" x1="0" y1="'+pT+'" x2="0" y2="'+(pT+cH)+'" stroke="rgba(255,255,255,0.15)" stroke-width="1" opacity="0"/>';

  // ── invisible hover rects for each data point ──
  var stepW=serieCart.length>1?cW/(serieCart.length-1):cW;
  serieCart.forEach(function(p,i){
    var cx=tX(i), x0=i===0?pL:(cx-stepW/2), x1=i===serieCart.length-1?(W-pR):(cx+stepW/2);
    svg+='<rect x="'+x0.toFixed(1)+'" y="'+pT+'" width="'+(x1-x0).toFixed(1)+'" height="'+cH+'" fill="transparent" data-idx="'+i+'" class="__evo_hover"/>';
  });

  svg+='</svg>';

  // Serialize data for JS tooltip
  var jData=[];
  serieCart.forEach(function(p,i){
    jData.push({l:p.label,c:p.valor,d:serieCDI[i].valor,ib:serieIBOV[i].valor,cx:tX(i),cyC:tY(p.valor),cyD:tY(serieCDI[i].valor),cyI:tY(serieIBOV[i].valor)});
  });

  var chartId='__evoChart_'+(Math.random()*1e9|0);

  return '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border);position:relative"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Rentabilidade Acumulada</span><span style="background:color-mix(in srgb,var(--neg) 15%,transparent);color:var(--blue);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">vs CDI'+(hasIbov?' + IBOV':'')+'</span></div><div style="font-size:11px;color:var(--text3);margin-bottom:12px">Base 100 · Últimos '+_analiseJanela+' anos · <span style="color:var(--neg)">━</span> Carteira <span style="color:#6b7280">┅</span> CDI'+(hasIbov?' <span style="color:#a855f7">┅</span> IBOV':'')+'</div><div id="'+chartId+'" style="position:relative">'+svg+'<div id="'+chartId+'_tip" style="display:none;position:absolute;pointer-events:none;background:rgba(10,10,10,0.95);border:1px solid var(--neg);border-radius:8px;padding:10px 14px;font-size:11px;font-family:Inter,sans-serif;z-index:50;min-width:180px;box-shadow:0 4px 20px rgba(0,0,0,0.5)"></div></div></div>'
  +'<script>(function(){var d='+JSON.stringify(jData)+';var wrap=document.getElementById("'+chartId+'");if(!wrap)return;var svg=wrap.querySelector("svg");var tip=document.getElementById("'+chartId+'_tip");var dotC=svg.getElementById("__evo_dotC");var dotD=svg.getElementById("__evo_dotD");var vline=svg.getElementById("__evo_vline");var rects=svg.querySelectorAll(".__evo_hover");rects.forEach(function(r){r.addEventListener("mouseenter",function(){var i=+this.getAttribute("data-idx");var p=d[i];dotC.setAttribute("cx",p.cx.toFixed(1));dotC.setAttribute("cy",p.cyC.toFixed(1));dotC.setAttribute("opacity","1");dotD.setAttribute("cx",p.cx.toFixed(1));dotD.setAttribute("cy",p.cyD.toFixed(1));dotD.setAttribute("opacity","1");vline.setAttribute("x1",p.cx.toFixed(1));vline.setAttribute("x2",p.cx.toFixed(1));vline.setAttribute("opacity","1");var rc=(p.c-100),rd=(p.d-100),diff=rc-rd;var rib=(p.ib-100),diffIb=rc-rib;tip.innerHTML="<div style=\\"color:var(--text3);margin-bottom:6px;font-weight:600\\">"+p.l+"</div>"+"<div style=\\"display:flex;justify-content:space-between;gap:16px;margin-bottom:3px\\"><span style=\\"color:var(--text3)\\">Carteira</span><span style=\\"color:var(--neg);font-weight:700\\">"+(rc>=0?"+":"")+rc.toFixed(2)+"%</span></div>"+"<div style=\\"display:flex;justify-content:space-between;gap:16px;margin-bottom:3px\\"><span style=\\"color:var(--text3)\\">CDI</span><span style=\\"color:#6b7280;font-weight:700\\">"+(rd>=0?"+":"")+rd.toFixed(2)+"%</span></div>"+"<div style=\\"display:flex;justify-content:space-between;gap:16px;margin-bottom:6px\\"><span style=\\"color:var(--text3)\\">IBOV</span><span style=\\"color:#a855f7;font-weight:700\\">"+(rib>=0?"+":"")+rib.toFixed(2)+"%</span></div>"+"<div style=\\"border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;display:flex;justify-content:space-between;margin-bottom:3px\\"><span style=\\"color:var(--text3)\\">vs CDI</span><span style=\\"color:"+(diff>=0?"var(--pos)":"var(--neg)")+";font-weight:700\\">"+(diff>=0?"+":"")+diff.toFixed(2)+"%</span></div>"+"<div style=\\"display:flex;justify-content:space-between\\"><span style=\\"color:var(--text3)\\">vs IBOV</span><span style=\\"color:"+(diffIb>=0?"var(--pos)":"var(--neg)")+";font-weight:700\\">"+(diffIb>=0?"+":"")+diffIb.toFixed(2)+"%</span></div>";tip.style.display="block";var svgRect=svg.getBoundingClientRect();var wrapRect=wrap.getBoundingClientRect();var xPx=(p.cx/'+W+')*svgRect.width;var tipW=tip.offsetWidth;var left=xPx-tipW/2;if(left<0)left=4;if(left+tipW>wrapRect.width)left=wrapRect.width-tipW-4;tip.style.left=left+"px";tip.style.top="4px";});r.addEventListener("mouseleave",function(){dotC.setAttribute("opacity","0");dotD.setAttribute("opacity","0");vline.setAttribute("opacity","0");tip.style.display="none";});});})()</script>';
}

// ─── COMPOSIÇÃO (POR TIPO DO CADASTRO) ───────────────────
function renderComposicaoCard(data){
  var porTipo={}, porCat={}, total=0;
  data.ativos.forEach(function(a){
    var t=a.tipo||'Outro';
    var c=a.categoria||'Outros';
    porTipo[t]=(porTipo[t]||0)+a.investido;
    porCat[c]=(porCat[c]||0)+a.investido;
    total+=a.investido;
  });

  var sorted=Object.keys(porTipo).sort(function(a,b){return porTipo[b]-porTipo[a];});

  var svg='<svg viewBox="0 0 200 200" style="width:140px;height:140px">';
  var cx=100,cy=100,r=75,r2=55,sa=-90;
  sorted.forEach(function(t){
    var pct=total>0?porTipo[t]/total:0;
    if(pct<=0)return;
    var ang=pct*360,ea=sa+ang,la=ang>180?1:0;
    var s1=Math.PI*sa/180,s2=Math.PI*ea/180;
    var cor=CORES_TIPO[t]||'#64748b';
    svg+='<path d="M'+(cx+r*Math.cos(s1))+','+(cy+r*Math.sin(s1))+' A'+r+','+r+' 0 '+la+',1 '+(cx+r*Math.cos(s2))+','+(cy+r*Math.sin(s2))+' L'+(cx+r2*Math.cos(s2))+','+(cy+r2*Math.sin(s2))+' A'+r2+','+r2+' 0 '+la+',0 '+(cx+r2*Math.cos(s1))+','+(cy+r2*Math.sin(s1))+' Z" fill="'+cor+'" opacity="0.85"/>';
    sa=ea;
  });
  svg+='</svg>';

  var leg='';
  sorted.forEach(function(t){
    var pct=total>0?(porTipo[t]/total*100):0;
    if(pct<0.1)return;
    var cor=CORES_TIPO[t]||'#64748b';
    leg+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:10px;height:10px;border-radius:50%;background:'+cor+';flex-shrink:0"></div><span style="font-size:11px;color:var(--text2);flex:1">'+t+'</span><span style="font-size:11px;font-weight:600;color:var(--text);font-family:Inter,sans-serif">'+pct.toFixed(1)+'%</span></div>';
  });

  // Resumo por categoria
  var catSum='';
  Object.keys(porCat).sort().forEach(function(c){
    var pct=total>0?(porCat[c]/total*100):0;
    var cor=CORES_CATEGORIA[c]||'#64748b';
    catSum+='<span style="font-size:10px;color:'+cor+';margin-right:12px">● '+c+': '+pct.toFixed(0)+'%</span>';
  });

  return '<div class="card" style="padding:20px;border:1px solid var(--border)"><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Composição da Carteira</div><div style="font-size:11px;color:var(--text3);margin-bottom:12px">Por subcategoria do cadastro</div><div style="display:flex;align-items:center;gap:24px"><div>'+svg+'</div><div style="flex:1">'+leg+'</div></div><div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">'+catSum+'</div></div>';
}

// ─── META DE ALOCAÇÃO (POR TIPO) ─────────────────────────
function renderMetaAlocacaoCard(data){
  var porTipo={},total=0;
  data.ativos.forEach(function(a){
    var t=a.tipo||'Outro';
    porTipo[t]=(porTipo[t]||0)+a.investido;
    total+=a.investido;
  });
  var sorted=Object.keys(porTipo).sort(function(a,b){return porTipo[b]-porTipo[a];});

  var rows='';
  sorted.forEach(function(t){
    var pctAt=total>0?(porTipo[t]/total*100):0;
    if(pctAt<0.1)return;
    var meta=_metasAlocacao[t]||0;
    var diff=pctAt-meta;
    var dCor=meta===0?'var(--text3)':(Math.abs(diff)<=3?'var(--pos)':(diff>0?'var(--caution)':'var(--neg)'));
    var dStr=meta===0?'—':(diff>=0?'+':'')+diff.toFixed(1)+'%';
    var cor=CORES_TIPO[t]||'#64748b';
    rows+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    rows+='<div style="width:10px;height:10px;border-radius:50%;background:'+cor+';flex-shrink:0"></div>';
    rows+='<span style="font-size:10px;color:var(--text2);width:70px;flex-shrink:0">'+t+'</span>';
    rows+='<div style="flex:1;position:relative;height:16px;background:var(--border);border-radius:3px;overflow:hidden">';
    rows+='<div style="width:'+Math.min(pctAt,100)+'%;height:100%;background:'+cor+'44;border-radius:3px"></div>';
    if(meta>0) rows+='<div style="position:absolute;left:'+Math.min(meta,100)+'%;top:0;height:100%;width:2px;background:'+cor+';opacity:0.8"></div>';
    rows+='</div>';
    rows+='<span style="font-size:10px;color:var(--text);width:36px;text-align:right;font-family:Inter,sans-serif">'+pctAt.toFixed(0)+'%</span>';
    rows+='<span style="color:var(--text3);font-size:9px">/</span>';
    rows+='<input type="number" min="0" max="100" step="5" value="'+meta+'" data-tipo="'+t+'" onchange="atualizarMetaAlocacao(this)" style="width:36px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:10px;text-align:center;padding:2px;font-family:Inter,sans-serif">';
    rows+='<span style="font-size:10px;color:'+dCor+';width:40px;text-align:right;font-family:Inter,sans-serif">'+dStr+'</span>';
    rows+='</div>';
  });

  return '<div class="card" style="padding:20px;border:1px solid var(--border)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Meta de Alocação</span><span style="background:rgba(59,130,246,0.15);color:#3b82f6;font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">METAS</span></div><div style="font-size:11px;color:var(--text3);margin-bottom:12px">Atual vs meta por subcategoria</div>'+rows+'<div style="font-size:9px;color:var(--text3);margin-top:6px">Barra = atual · Linha = meta · Edite os campos para definir metas</div></div>';
}

function atualizarMetaAlocacao(input){
  var tipo=input.getAttribute('data-tipo');
  _metasAlocacao[tipo]=parseFloat(input.value)||0;
  var clienteId=currentClienteVinculado;
  if(clienteId) try{localStorage.setItem('dmf_metas_'+clienteId,JSON.stringify(_metasAlocacao));}catch(e){}
  if(_analiseData){
    var c=document.getElementById('analise-carteira-container');
    if(c) renderAnaliseCompleta(c,_analiseData);
  }
}

// ─── DRAWDOWN ────────────────────────────────────────────
function renderDrawdownCard(data){
  var rows='';
  var ord=data.ativos.filter(function(a){return a.stats&&a.stats.stats;})
    .sort(function(a,b){return(a.stats.stats.worst_monthly_return||0)-(b.stats.stats.worst_monthly_return||0);});
  ord.slice(0,8).forEach(function(a){
    var wm=a.stats.stats.worst_monthly_return||0;
    var barW=Math.min(Math.abs(wm),60);
    var cor=CORES_TIPO[a.tipo]||'var(--neg)';
    rows+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    rows+='<span style="font-size:11px;color:var(--text2);width:65px;flex-shrink:0;font-family:Inter,sans-serif">'+a.ticker+'</span>';
    rows+='<span style="font-size:9px;color:var(--text3);width:50px;flex-shrink:0">'+a.tipo+'</span>';
    rows+='<div style="flex:1;height:14px;background:var(--border);border-radius:3px;overflow:hidden"><div style="width:'+barW+'%;height:100%;background:color-mix(in srgb,var(--neg) 40%,transparent);border-radius:3px"></div></div>';
    rows+='<span style="font-size:11px;color:var(--neg);font-family:Inter,sans-serif;width:50px;text-align:right">'+wm.toFixed(1)+'%</span>';
    rows+='</div>';
  });
  return '<div class="card" style="padding:20px;border:1px solid var(--border)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Drawdown por Ativo</span><span style="background:color-mix(in srgb,var(--neg) 13%,transparent);color:var(--neg);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">RISCO</span></div><div style="font-size:11px;color:var(--text3);margin-bottom:16px">Pior mês histórico de cada ativo</div>'+rows+'</div>';
}

// ─── DISPERSÃO MENSAL ────────────────────────────────────
function renderDispersaoCard(data){
  var retornos=coletarRetornosMensais(data);
  if(retornos.length<6) return '<div class="card" style="padding:20px;border:1px solid var(--border)"><p style="color:var(--text3);font-size:12px">Dados insuficientes para dispersão</p></div>';

  // Bucket adaptativo: 1% para spreads menores, 2% para maiores
  var range=Math.max.apply(null,retornos)-Math.min.apply(null,retornos);
  var bSz=range>30?3:(range>15?2:1);
  var minR=Math.floor(Math.min.apply(null,retornos)/bSz)*bSz;
  var maxR=Math.ceil(Math.max.apply(null,retornos)/bSz)*bSz;
  var bk={};
  for(var b=minR;b<=maxR;b+=bSz) bk[b]=0;
  retornos.forEach(function(r){ var k=Math.floor(r/bSz)*bSz; bk[k]=(bk[k]||0)+1; });

  var keys=Object.keys(bk).map(Number).sort(function(a,b){return a-b;});
  var maxC=Math.max.apply(null,keys.map(function(k){return bk[k];}));
  var soma=retornos.reduce(function(s,v){return s+v;},0);
  var media=soma/retornos.length;
  var sorted=retornos.slice().sort(function(a,b){return a-b;});
  var mediana=sorted[Math.floor(sorted.length/2)];
  var pos=retornos.filter(function(r){return r>0;}).length;
  var pctPos=(pos/retornos.length*100).toFixed(0);

  var W=400,H=160,pL=5,pR=5,pT=10,pB=25;
  var cW=W-pL-pR,cH=H-pT-pB;
  var barW=Math.max(cW/keys.length-2,6);

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  keys.forEach(function(k,i){
    var x=pL+(i/keys.length)*cW+1;
    var bH=maxC>0?(bk[k]/maxC)*cH:0;
    var y=pT+cH-bH;
    var cor=k>=0?'color-mix(in srgb,var(--pos) 40%,transparent)':'color-mix(in srgb,var(--neg) 40%,transparent)';
    var st=k>=0?'var(--pos)':'var(--neg)';
    svg+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+bH.toFixed(1)+'" fill="'+cor+'" stroke="'+st+'" stroke-width="0.5" rx="2"/>';
    if(i%Math.max(1,Math.floor(keys.length/8))===0) svg+='<text x="'+(x+barW/2).toFixed(1)+'" y="'+(H-5)+'" fill="rgba(255,255,255,0.3)" font-size="8" text-anchor="middle" font-family="Inter,sans-serif">'+k+'%</text>';
  });
  var mX=pL+((media-minR)/(maxR-minR))*cW;
  svg+='<line x1="'+mX.toFixed(1)+'" y1="'+pT+'" x2="'+mX.toFixed(1)+'" y2="'+(pT+cH)+'" style="stroke:var(--neg)" stroke-width="1.5" stroke-dasharray="3,2"/>';
  svg+='</svg>';

  return '<div class="card" style="padding:20px;border:1px solid var(--border)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Dispersão Mensal</span><span style="background:color-mix(in srgb,var(--neg) 15%,transparent);color:var(--blue);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">HISTOGRAMA</span></div><div style="font-size:11px;color:var(--text3);margin-bottom:12px">Distribuição dos retornos mensais · <span style="color:var(--neg)">┃</span> média</div>'+svg+'<div style="display:flex;gap:16px;margin-top:10px;font-size:10px;font-family:Inter,sans-serif"><span style="color:var(--text3)">Média: <span style="color:var(--text)">'+(media>=0?'+':'')+media.toFixed(2)+'%</span></span><span style="color:var(--text3)">Mediana: <span style="color:var(--text)">'+(mediana>=0?'+':'')+mediana.toFixed(2)+'%</span></span><span style="color:var(--text3)">Meses +: <span style="color:var(--pos)">'+pctPos+'%</span></span><span style="color:var(--text3)">Total: <span style="color:var(--text)">'+retornos.length+'</span></span></div></div>';
}

// ─── HELPER: coletar retornos mensais ponderados ─────────
function coletarRetornosMensais(data){
  var retornos=[];
  var totalInvestido=0;
  data.ativos.forEach(function(a){totalInvestido+=a.investido;});
  var todosAnos={};
  data.ativos.forEach(function(a){if(a.stats&&a.stats.years)Object.keys(a.stats.years).forEach(function(y){todosAnos[y]=true;});});
  var anos=filtrarAnosPorJanela(Object.keys(todosAnos).sort());
  var now=new Date(),mesAt=now.getMonth()+1,anoAt=now.getFullYear();
  anos.forEach(function(y){
    for(var m=1;m<=12;m++){
      var yi=parseInt(y); if(yi>anoAt||(yi===anoAt&&m>mesAt)) continue;
      var ret=0,tem=false;
      data.ativos.forEach(function(a){
        if(a.stats&&a.stats.years&&a.stats.years[y]&&a.stats.years[y][m]!==undefined){
          var peso=totalInvestido>0?a.investido/totalInvestido:1/data.ativos.length;
          ret+=a.stats.years[y][m]*peso; tem=true;
        }
      });
      if(tem) retornos.push(ret);
    }
  });
  return retornos;
}

// ─── MONTE CARLO ─────────────────────────────────────────
function renderMonteCarloCard(data){
  var retornos=coletarRetornosMensais(data).map(function(r){return r/100;});
  if(retornos.length<12) return '';

  var nSim=500,nM=24;
  var pat=0; data.ativos.forEach(function(a){pat+=a.investido;});
  var caminhos=[];
  for(var s=0;s<nSim;s++){
    var p=[pat],v=pat;
    for(var m=0;m<nM;m++){v*=(1+retornos[Math.floor(Math.random()*retornos.length)]);p.push(v);}
    caminhos.push(p);
  }
  var p10=[],p25=[],p50=[],p75=[],p90=[];
  for(var m=0;m<=nM;m++){
    var vs=caminhos.map(function(c){return c[m];}).sort(function(a,b){return a-b;});
    p10.push(vs[Math.floor(nSim*0.10)]);p25.push(vs[Math.floor(nSim*0.25)]);p50.push(vs[Math.floor(nSim*0.50)]);p75.push(vs[Math.floor(nSim*0.75)]);p90.push(vs[Math.floor(nSim*0.90)]);
  }

  var W=900,H=220,pL=70,pR=20,pT=15,pB=30;
  var cW=W-pL-pR,cH=H-pT-pB;
  var mn=p10[nM]*0.95,mx=p90[nM]*1.05;
  function tX(i){return pL+(i/nM)*cW;}
  function tY(v){return pT+cH-((v-mn)/(mx-mn))*cH;}

  function aP(u,l){var d='M';for(var i=0;i<=nM;i++)d+=(i?'L':'')+tX(i).toFixed(1)+','+tY(u[i]).toFixed(1);for(var i=nM;i>=0;i--)d+='L'+tX(i).toFixed(1)+','+tY(l[i]).toFixed(1);return d+'Z';}
  function lP(a){var d='M';for(var i=0;i<=nM;i++)d+=(i?'L':'')+tX(i).toFixed(1)+','+tY(a[i]).toFixed(1);return d;}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  for(var g=0;g<=4;g++){var gv=mn+(mx-mn)*(g/4),gy=tY(gv);svg+='<line x1="'+pL+'" y1="'+gy.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+gy.toFixed(1)+'" stroke="rgba(255,255,255,0.05)"/>';svg+='<text x="'+(pL-6)+'" y="'+(gy+3).toFixed(1)+'" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="end" font-family="Inter,sans-serif">R$'+(gv/1000).toFixed(0)+'k</text>';}
  for(var i=0;i<=nM;i+=6)svg+='<text x="'+tX(i).toFixed(1)+'" y="'+(H-5)+'" fill="rgba(255,255,255,0.3)" font-size="8" text-anchor="middle" font-family="Inter,sans-serif">'+i+'m</text>';
  svg+='<path d="'+aP(p90,p10)+'" fill="rgba(255,140,0,0.06)"/>';
  svg+='<path d="'+aP(p75,p25)+'" fill="rgba(255,140,0,0.12)"/>';
  svg+='<path d="'+lP(p50)+'" fill="none" style="stroke:var(--neg)" stroke-width="2"/>';
  svg+='<line x1="'+pL+'" y1="'+tY(pat).toFixed(1)+'" x2="'+(W-pR)+'" y2="'+tY(pat).toFixed(1)+'" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4,3"/>';
  svg+='</svg>';

  var rM=((p50[nM]/pat-1)*100).toFixed(1),rO=((p90[nM]/pat-1)*100).toFixed(1),rP=((p10[nM]/pat-1)*100).toFixed(1);

  return '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Monte Carlo — Projeção 24 Meses</span><span style="background:rgba(168,85,247,0.15);color:#a855f7;font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">SIMULAÇÃO</span></div><div style="font-size:11px;color:var(--text3);margin-bottom:12px">'+nSim+' simulações · Faixas P10-P90 e P25-P75 · <span style="color:var(--neg)">━</span> Mediana</div>'+svg+'<div style="display:flex;gap:20px;margin-top:10px;font-size:10px;font-family:Inter,sans-serif"><span style="color:var(--text3)">Pessimista (P10): <span style="color:var(--neg)">'+rP+'%</span></span><span style="color:var(--text3)">Mediana (P50): <span style="color:var(--neg)">+'+rM+'%</span></span><span style="color:var(--text3)">Otimista (P90): <span style="color:var(--pos)">+'+rO+'%</span></span></div></div>';
}

// ─── QUILT VIEW ──────────────────────────────────────────
function renderQuiltView(data){
  var todosAnos={},comYears=[];
  data.ativos.forEach(function(a){if(a.stats&&a.stats.years){comYears.push(a);Object.keys(a.stats.years).forEach(function(y){todosAnos[y]=true;});}});
  if(data.cdi&&data.cdi.years) Object.keys(data.cdi.years).forEach(function(y){todosAnos[y]=true;});
  var anos=filtrarAnosPorJanela(Object.keys(todosAnos).sort());
  if(!anos.length||!comYears.length) return '';

  var h='<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border);overflow-x:auto"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Retornos Anuais por Ativo</span><span style="background:color-mix(in srgb,var(--neg) 15%,transparent);color:var(--blue);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">QUILT VIEW</span></div><div style="font-size:11px;color:var(--text3);margin-bottom:16px">Retorno anual · Azul = positivo, Laranja = negativo</div>';
  h+='<table style="width:100%;border-collapse:collapse;font-size:11px;font-family:Inter,sans-serif"><thead><tr><th style="text-align:left;padding:6px 8px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border)">Ativo</th>';
  anos.forEach(function(y){h+='<th style="text-align:center;padding:6px 4px;color:var(--text3);font-weight:600;border-bottom:1px solid var(--border)">'+y+'</th>';});
  h+='</tr></thead><tbody>';
  if(data.cdi&&data.cdi.years) h+=quiltRow('CDI',data.cdi.years,anos,'#6b7280');
  comYears.forEach(function(a){ h+=quiltRow(a.ticker,a.stats.years,anos,CORES_TIPO[a.tipo]||'#64748b'); });
  h+='</tbody></table></div>';
  return h;
}
function quiltRow(l,yrs,anos,cor){
  var h='<tr><td style="padding:6px 8px;font-weight:600;color:'+cor+';white-space:nowrap;border-bottom:1px solid var(--border)">'+l+'</td>';
  anos.forEach(function(y){
    var yd=yrs[y],ret=yd?(yd.year!==undefined?yd.year:null):null;
    if(ret===null) h+='<td style="padding:4px 3px;text-align:center;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">—</span></td>';
    else{
      var bg,fg;
      if(ret>=20){bg='color-mix(in srgb,var(--pos) 27%,transparent)';fg='var(--pos)';}else if(ret>=5){bg='color-mix(in srgb,var(--pos) 13%,transparent)';fg='var(--pos)';}else if(ret>=0){bg='color-mix(in srgb,var(--pos) 7%,transparent)';fg='var(--pos)';}else if(ret>=-10){bg='color-mix(in srgb,var(--neg) 7%,transparent)';fg='var(--neg)';}else{bg='color-mix(in srgb,var(--neg) 20%,transparent)';fg='var(--neg)';}
      h+='<td style="padding:4px 3px;text-align:center;border-bottom:1px solid var(--border)"><span style="display:inline-block;padding:3px 6px;border-radius:4px;background:'+bg+';color:'+fg+';font-size:10px;min-width:44px">'+(ret>=0?'+':'')+ret.toFixed(0)+'%</span></td>';
    }
  });
  return h+'</tr>';
}

// ─── STRESS TEST ─────────────────────────────────────────
function renderStressTest(data){
  var h='<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Stress Test — Crises</div><div style="font-size:11px;color:var(--text3);margin-bottom:12px">Retorno da carteira nos principais eventos</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
  CRISES_HISTORICAS.forEach(function(cr){
    var rT=0,pT=0,cdiR=0;
    data.ativos.forEach(function(a){if(a.stats&&a.stats.years){var r=calcRetPeriodo(a.stats.years,cr.inicio,cr.fim);if(r!==null){rT+=r*(a.investido||1);pT+=(a.investido||1);}}});
    if(data.cdi&&data.cdi.years) cdiR=calcRetPeriodo(data.cdi.years,cr.inicio,cr.fim);
    var rC=pT>0?rT/pT:null;
    var rStr=rC!==null?(rC>=0?'+':'')+rC.toFixed(2)+'%':'N/A';
    var rCor=rC!==null?(rC>=0?'var(--pos)':'var(--neg)'):'var(--text3)';
    var cStr=cdiR!==null?'vs CDI '+(cdiR>=0?'+':'')+cdiR.toFixed(2)+'%':'';
    h+='<div class="card" style="padding:14px;border:1px solid var(--border)"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text)">'+cr.nome+'</div><div style="font-size:10px;color:var(--text3);margin-bottom:8px">'+cr.desc+'</div><div style="font-size:18px;font-weight:700;color:'+rCor+';font-family:Inter,sans-serif">'+rStr+'</div>'+(cStr?'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+cStr+'</div>':'')+'</div>';
  });
  return h+'</div></div>';
}
function calcRetPeriodo(yrs,ini,fim){
  var ai=parseInt(ini.split('-')[0]),mi=parseInt(ini.split('-')[1]),af=parseInt(fim.split('-')[0]),mf=parseInt(fim.split('-')[1]);
  var ret=1,found=false;
  for(var y=ai;y<=af;y++){if(!yrs[y])continue;var ms=(y===ai)?mi:1,me=(y===af)?mf:12;for(var m=ms;m<=me;m++){var mr=yrs[y][m];if(mr!==undefined&&mr!==null){ret*=(1+mr/100);found=true;}}}
  return found?(ret-1)*100:null;
}

// ─── HEATMAP MENSAL ──────────────────────────────────────
function renderHeatmapMensal(data){
  var todosAnos={};
  data.ativos.forEach(function(a){if(a.stats&&a.stats.years)Object.keys(a.stats.years).forEach(function(y){todosAnos[y]=true;});});
  var anos=filtrarAnosPorJanela(Object.keys(todosAnos).sort());
  if(!anos.length) return '';

  var totalI=0; data.ativos.forEach(function(a){totalI+=a.investido;});
  var ms=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  var h='<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border);overflow-x:auto"><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Retorno Mensal da Carteira</div><div style="font-size:11px;color:var(--text3);margin-bottom:16px">Heatmap · Azul = positivo, Laranja = negativo</div>';
  h+='<table style="width:100%;border-collapse:collapse;font-size:10px;font-family:Inter,sans-serif"><thead><tr><th style="padding:4px 6px;text-align:left;color:var(--text3)"></th>';
  ms.forEach(function(m){h+='<th style="padding:4px 4px;text-align:center;color:var(--text3);font-weight:500">'+m+'</th>';});
  h+='</tr></thead><tbody>';

  anos.forEach(function(y){
    h+='<tr><td style="padding:4px 6px;font-weight:600;color:var(--text2)">'+y+'</td>';
    for(var m=1;m<=12;m++){
      var rP=0;
      data.ativos.forEach(function(a){if(a.stats&&a.stats.years&&a.stats.years[y]&&a.stats.years[y][m]!==undefined){var p=totalI>0?a.investido/totalI:1/data.ativos.length;rP+=a.stats.years[y][m]*p;}});
      var bg,fg;
      if(rP>3){bg='color-mix(in srgb,var(--pos) 27%,transparent)';fg='var(--pos)';}else if(rP>0){bg='color-mix(in srgb,var(--pos) 9%,transparent)';fg='var(--pos)';}else if(rP>-3){bg='color-mix(in srgb,var(--neg) 9%,transparent)';fg='var(--neg)';}else{bg='color-mix(in srgb,var(--neg) 27%,transparent)';fg='var(--neg)';}
      var val=rP!==0?rP.toFixed(1):'—';
      h+='<td style="padding:3px 2px;text-align:center"><span style="display:inline-block;padding:3px 4px;border-radius:3px;background:'+bg+';color:'+fg+';min-width:36px;font-size:9px">'+val+'</span></td>';
    }
    h+='</tr>';
  });
  return h+'</tbody></table></div>';
}

// ─── INDICADORES DE RISCO ───────────────────────────────
function renderIndicadoresRisco(data){
  var totalI=0;
  data.ativos.forEach(function(a){totalI+=a.investido;});
  if(totalI<=0) return '';

  // Coletar métricas ponderadas
  var volW=0,volS=0,sharpeW=0,sharpeS=0;
  var betaW=0,betaS=0,alphaW=0,alphaS=0;
  var maxDD=0, bestMonth=0;
  var retornos=coletarRetornosMensais(data);

  data.ativos.forEach(function(a){
    if(!a.stats||!a.stats.stats||!a.stats.stats.timeframe) return;
    var tf=a.stats.stats.timeframe;
    var t12=tf.last_12_months||{};
    var w=a.investido/totalI;
    if(t12.volatility){volS+=t12.volatility*w;volW+=w;}
    if(t12.sharpe_ratio){sharpeS+=t12.sharpe_ratio*w;sharpeW+=w;}
    if(t12.beta!==undefined){betaS+=t12.beta*w;betaW+=w;}
    if(t12.alpha!==undefined){alphaS+=t12.alpha*w;alphaW+=w;}
    if(a.stats.stats.worst_monthly_return&&a.stats.stats.worst_monthly_return<maxDD) maxDD=a.stats.stats.worst_monthly_return;
    if(a.stats.stats.best_monthly_return&&a.stats.stats.best_monthly_return>bestMonth) bestMonth=a.stats.stats.best_monthly_return;
  });

  var avgVol=volW>0?volS/volW:0;
  var avgSharpe=sharpeW>0?sharpeS/sharpeW:0;
  var avgBeta=betaW>0?betaS/betaW:0;
  var avgAlpha=alphaW>0?alphaS/alphaW:0;

  // VaR paramétrico 95% (mensal)
  var media=0,variancia=0;
  if(retornos.length>2){
    media=retornos.reduce(function(s,v){return s+v;},0)/retornos.length;
    variancia=retornos.reduce(function(s,v){return s+Math.pow(v-media,2);},0)/(retornos.length-1);
    var dp=Math.sqrt(variancia);
    var var95=media-1.645*dp; // percentil 5%
  } else { var var95=0; }

  // Sortino (downside deviation)
  var downDev=0,downN=0;
  retornos.forEach(function(r){if(r<0){downDev+=r*r;downN++;}});
  downDev=downN>0?Math.sqrt(downDev/downN):0;
  var sortino=downDev>0?media/downDev:0;

  // Meses positivos
  var pos=retornos.filter(function(r){return r>0;}).length;
  var pctPos=retornos.length>0?(pos/retornos.length*100):0;

  function riskItem(label,value,sub,color){
    return '<div style="padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:6px;font-weight:600">'+label+'</div><div style="font-size:20px;font-weight:700;color:'+color+';font-family:Inter,sans-serif">'+value+'</div><div style="font-size:10px;color:var(--text3);margin-top:3px">'+sub+'</div></div>';
  }

  var h='<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Indicadores de Risco</span><span style="background:color-mix(in srgb,var(--neg) 15%,transparent);color:var(--neg);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">RISCO</span></div>';
  h+='<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Métricas ponderadas por peso na carteira</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">';
  h+=riskItem('Volatilidade',avgVol.toFixed(2)+'%','anualizada ponderada',avgVol<=15?'var(--pos)':(avgVol<=25?'var(--caution)':'var(--neg)'));
  h+=riskItem('Sharpe',avgSharpe.toFixed(2),'retorno ajustado ao risco',avgSharpe>=0.5?'var(--pos)':(avgSharpe>=0?'var(--caution)':'var(--neg)'));
  h+=riskItem('Sortino',sortino.toFixed(2),'penaliza só perdas',sortino>=0.5?'var(--pos)':(sortino>=0?'var(--caution)':'var(--neg)'));
  h+=riskItem('VaR 95%',var95.toFixed(2)+'%','perda máx mensal 95%','var(--neg)');
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
  h+=riskItem('Beta',(betaW>0?avgBeta.toFixed(2):'N/A'),'sensibilidade ao mercado',avgBeta<=1?'var(--pos)':'var(--neg)');
  h+=riskItem('Pior Mês',maxDD.toFixed(1)+'%','drawdown máximo','var(--neg)');
  h+=riskItem('Melhor Mês','+'+(bestMonth>0?bestMonth.toFixed(1):'0')+'%','melhor retorno mensal','var(--pos)');
  h+=riskItem('Meses +',pctPos.toFixed(0)+'%',pos+' de '+retornos.length+' meses',pctPos>=50?'var(--pos)':'var(--neg)');
  h+='</div></div>';
  return h;
}

// ─── MATRIZ DE CORRELAÇÃO ───────────────────────────────
function renderCorrelacaoMatrix(data){
  // Coletar retornos mensais por ativo
  var ativosComDados=data.ativos.filter(function(a){return a.stats&&a.stats.years&&Object.keys(a.stats.years).length>0;});
  if(ativosComDados.length<2) return '';

  var todosAnos={};
  ativosComDados.forEach(function(a){Object.keys(a.stats.years).forEach(function(y){todosAnos[y]=true;});});
  var anos=filtrarAnosPorJanela(Object.keys(todosAnos).sort());
  var now=new Date(),mesAt=now.getMonth()+1,anoAt=now.getFullYear();

  // Construir séries mensais por ativo
  var series={};
  var labels=[];
  ativosComDados.forEach(function(a){
    var key=a.ticker;
    if(labels.indexOf(key)>=0) return;
    labels.push(key);
    series[key]=[];
  });

  // Gerar chaves de meses comuns
  var meses=[];
  anos.forEach(function(y){for(var m=1;m<=12;m++){var yi=parseInt(y);if(yi>anoAt||(yi===anoAt&&m>mesAt))continue;meses.push(y+'_'+m);}});

  meses.forEach(function(mk){
    var parts=mk.split('_'),y=parts[0],m=parseInt(parts[1]);
    labels.forEach(function(t){
      var a=ativosComDados.find(function(x){return x.ticker===t;});
      var val=null;
      if(a&&a.stats.years&&a.stats.years[y]&&a.stats.years[y][m]!==undefined) val=a.stats.years[y][m];
      series[t].push(val);
    });
  });

  // Calcular correlação entre pares
  function corr(a,b){
    var pairs=[];
    for(var i=0;i<a.length;i++){if(a[i]!==null&&b[i]!==null)pairs.push([a[i],b[i]]);}
    if(pairs.length<6) return null;
    var n=pairs.length;
    var sa=0,sb=0,sa2=0,sb2=0,sab=0;
    pairs.forEach(function(p){sa+=p[0];sb+=p[1];sa2+=p[0]*p[0];sb2+=p[1]*p[1];sab+=p[0]*p[1];});
    var num=n*sab-sa*sb;
    var den=Math.sqrt((n*sa2-sa*sa)*(n*sb2-sb*sb));
    return den>0?num/den:0;
  }

  // Limitar a top 10 ativos por investido
  var topLabels=labels.slice().sort(function(a,b){
    var aI=ativosComDados.find(function(x){return x.ticker===a;});
    var bI=ativosComDados.find(function(x){return x.ticker===b;});
    return (bI?bI.investido:0)-(aI?aI.investido:0);
  }).slice(0,10);

  var h='<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border);overflow-x:auto">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Matriz de Correlação</span><span style="background:rgba(168,85,247,0.15);color:#a855f7;font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">CORRELAÇÃO</span></div>';
  h+='<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Correlação entre retornos mensais · Janela '+_analiseJanela+' anos</div>';
  h+='<table style="border-collapse:collapse;font-size:10px;font-family:Inter,sans-serif"><thead><tr><th style="padding:4px 6px"></th>';
  topLabels.forEach(function(t){h+='<th style="padding:4px 6px;text-align:center;color:var(--text3);font-weight:600;max-width:50px;overflow:hidden;text-overflow:ellipsis">'+t+'</th>';});
  h+='</tr></thead><tbody>';

  topLabels.forEach(function(t1,i){
    h+='<tr><td style="padding:4px 8px;font-weight:600;color:var(--text2);white-space:nowrap">'+t1+'</td>';
    topLabels.forEach(function(t2,j){
      if(i===j){
        h+='<td style="padding:3px;text-align:center"><span style="display:inline-block;padding:3px 6px;border-radius:4px;background:color-mix(in srgb,var(--pos) 13%,transparent);color:var(--pos);min-width:40px">1.00</span></td>';
      } else {
        var c=corr(series[t1]||[],series[t2]||[]);
        if(c===null){
          h+='<td style="padding:3px;text-align:center"><span style="color:var(--text3)">—</span></td>';
        } else {
          var bg,fg;
          if(c>=0.7){bg='color-mix(in srgb,var(--neg) 20%,transparent)';fg='var(--neg)';}
          else if(c>=0.3){bg='color-mix(in srgb,var(--caution) 13%,transparent)';fg='var(--caution)';}
          else if(c>=-0.3){bg='rgba(255,255,255,0.05)';fg='var(--text2)';}
          else{bg='color-mix(in srgb,var(--pos) 13%,transparent)';fg='var(--pos)';}
          h+='<td style="padding:3px;text-align:center"><span style="display:inline-block;padding:3px 6px;border-radius:4px;background:'+bg+';color:'+fg+';min-width:40px">'+(c>=0?'+':'')+c.toFixed(2)+'</span></td>';
        }
      }
    });
    h+='</tr>';
  });
  h+='</tbody></table>';
  h+='<div style="font-size:9px;color:var(--text3);margin-top:8px">Alta correlação (>0.7) em laranja · Baixa/negativa em azul · Diversificação ideal: correlações baixas</div>';
  h+='</div>';
  return h;
}

// ─── FRONTEIRA EFICIENTE ────────────────────────────────
function renderFronteiraEficiente(data){
  var pts=[];
  data.ativos.forEach(function(a){
    if(!a.stats||!a.stats.stats||!a.stats.stats.timeframe) return;
    var tf=a.stats.stats.timeframe;
    var t12=tf.last_12_months||tf.ytd||{};
    var vol=t12.volatility;
    var ret=t12.profitability;
    if(vol===undefined||ret===undefined) return;
    pts.push({ticker:a.ticker,tipo:a.tipo,vol:vol,ret:ret*100,investido:a.investido});
  });
  if(pts.length<2) return '';

  var W=600,H=350,pL=55,pR=30,pT=25,pB=40;
  var cW=W-pL-pR,cH=H-pT-pB;
  var minV=Math.min.apply(null,pts.map(function(p){return p.vol;}))*0.8;
  var maxV=Math.max.apply(null,pts.map(function(p){return p.vol;}))*1.2;
  var minR=Math.min.apply(null,pts.map(function(p){return p.ret;}))-2;
  var maxR=Math.max.apply(null,pts.map(function(p){return p.ret;}))+2;
  if(maxV<=minV)maxV=minV+10;
  if(maxR<=minR)maxR=minR+10;

  function tX(v){return pL+((v-minV)/(maxV-minV))*cW;}
  function tY(r){return pT+cH-((r-minR)/(maxR-minR))*cH;}

  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  // Grid
  for(var g=0;g<=4;g++){
    var gv=minR+(maxR-minR)*(g/4),gy=tY(gv);
    svg+='<line x1="'+pL+'" y1="'+gy.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+gy.toFixed(1)+'" stroke="rgba(255,255,255,0.06)"/>';
    svg+='<text x="'+(pL-6)+'" y="'+(gy+3).toFixed(1)+'" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="end" font-family="Inter,sans-serif">'+gv.toFixed(0)+'%</text>';
  }
  for(var g=0;g<=4;g++){
    var gx=minV+(maxV-minV)*(g/4),gpx=tX(gx);
    svg+='<line x1="'+gpx.toFixed(1)+'" y1="'+pT+'" x2="'+gpx.toFixed(1)+'" y2="'+(pT+cH)+'" stroke="rgba(255,255,255,0.06)"/>';
    svg+='<text x="'+gpx.toFixed(1)+'" y="'+(H-8)+'" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="middle" font-family="Inter,sans-serif">'+gx.toFixed(0)+'%</text>';
  }
  // Axis labels
  svg+='<text x="'+(pL+cW/2)+'" y="'+(H-2)+'" fill="rgba(255,255,255,0.4)" font-size="10" text-anchor="middle" font-family="Inter,sans-serif">Volatilidade (risco)</text>';
  svg+='<text x="12" y="'+(pT+cH/2)+'" fill="rgba(255,255,255,0.4)" font-size="10" text-anchor="middle" font-family="Inter,sans-serif" transform="rotate(-90 12 '+(pT+cH/2)+')">Retorno 12M</text>';

  // Efficient frontier approximation (sort by vol, keep only improving return)
  var sorted=pts.slice().sort(function(a,b){return a.vol-b.vol;});
  var frontier=[];
  var bestRet=-Infinity;
  sorted.forEach(function(p){if(p.ret>=bestRet){frontier.push(p);bestRet=p.ret;}});
  if(frontier.length>=2){
    var fPath='M';
    frontier.forEach(function(p,i){fPath+=(i?'L':'')+tX(p.vol).toFixed(1)+','+tY(p.ret).toFixed(1);});
    svg+='<path d="'+fPath+'" fill="none" style="stroke:var(--neg)" stroke-width="2" stroke-dasharray="6,3" opacity="0.6"/>';
  }

  // Points
  pts.forEach(function(p){
    var cor=CORES_TIPO[p.tipo]||'#64748b';
    var sz=Math.max(5,Math.min(12,Math.sqrt(p.investido/100)));
    svg+='<circle cx="'+tX(p.vol).toFixed(1)+'" cy="'+tY(p.ret).toFixed(1)+'" r="'+sz.toFixed(1)+'" fill="'+cor+'" opacity="0.8" stroke="'+cor+'" stroke-width="1"/>';
    svg+='<text x="'+(tX(p.vol)+sz+3).toFixed(1)+'" y="'+(tY(p.ret)+3).toFixed(1)+'" fill="rgba(255,255,255,0.5)" font-size="8" font-family="Inter,sans-serif">'+p.ticker+'</text>';
  });

  svg+='</svg>';

  return '<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Fronteira Eficiente</span><span style="background:rgba(59,130,246,0.15);color:#3b82f6;font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">RISCO-RETORNO</span></div><div style="font-size:11px;color:var(--text3);margin-bottom:12px">Relação risco × retorno por ativo · <span style="color:var(--neg)">┅</span> fronteira eficiente · Tamanho = peso</div>'+svg+'</div>';
}

// ─── JANELAS MÓVEIS (ROLLING WINDOWS) ───────────────────
function renderRollingWindows(data){
  var retornos=coletarRetornosMensais(data);
  if(retornos.length<13) return '';

  // CDI mensal
  var cdiRetornos=[];
  var todosAnos={};
  data.ativos.forEach(function(a){if(a.stats&&a.stats.years)Object.keys(a.stats.years).forEach(function(y){todosAnos[y]=true;});});
  var anos=filtrarAnosPorJanela(Object.keys(todosAnos).sort());
  var now=new Date(),mesAt=now.getMonth()+1,anoAt=now.getFullYear();
  anos.forEach(function(y){
    for(var m=1;m<=12;m++){
      var yi=parseInt(y);if(yi>anoAt||(yi===anoAt&&m>mesAt))continue;
      var rD=0;
      if(data.cdi&&data.cdi.years&&data.cdi.years[y]&&data.cdi.years[y][m]!==undefined) rD=data.cdi.years[y][m];
      cdiRetornos.push(rD);
    }
  });

  var janelas=[{n:12,label:'12M'},{n:24,label:'24M'},{n:36,label:'36M'}];

  var h='<div class="card" style="padding:20px;margin-bottom:16px;border:1px solid var(--border)">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:13px;font-weight:700;color:var(--text)">Janelas Móveis — Taxa de Sucesso</span><span style="background:color-mix(in srgb,var(--pos) 15%,transparent);color:var(--pos);font-size:9px;font-weight:600;padding:2px 8px;border-radius:10px">ROLLING</span></div>';
  h+='<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Retornos acumulados em janelas de 12, 24 e 36 meses</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">';

  janelas.forEach(function(j){
    if(retornos.length<j.n) return;
    var wins=[],winsVsCDI=0,positivos=0,totalJ=0;
    var maxRol=-Infinity,minRol=Infinity;
    for(var i=0;i<=retornos.length-j.n;i++){
      var acum=1,acumCDI=1;
      for(var k=i;k<i+j.n;k++){
        acum*=(1+retornos[k]/100);
        if(k<cdiRetornos.length) acumCDI*=(1+cdiRetornos[k]/100);
      }
      var retJ=(acum-1)*100;
      var retCDI=(acumCDI-1)*100;
      wins.push(retJ);
      if(retJ>0) positivos++;
      if(retJ>retCDI) winsVsCDI++;
      if(retJ>maxRol)maxRol=retJ;
      if(retJ<minRol)minRol=retJ;
      totalJ++;
    }
    var mediaJ=wins.reduce(function(s,v){return s+v;},0)/wins.length;
    var txPos=totalJ>0?(positivos/totalJ*100):0;
    var txCDI=totalJ>0?(winsVsCDI/totalJ*100):0;

    // Mini bar chart
    var W=200,H=60,bars='';
    var step=Math.max(1,Math.floor(wins.length/40));
    var sampled=[];
    for(var i=0;i<wins.length;i+=step)sampled.push(wins[i]);
    var barW=Math.max(2,W/sampled.length-1);
    var absMax=Math.max(Math.abs(maxRol),Math.abs(minRol),1);
    var zero=H/2;
    sampled.forEach(function(v,i){
      var bH=Math.abs(v)/absMax*(H/2-2);
      var y=v>=0?zero-bH:zero;
      var cor=v>=0?'color-mix(in srgb,var(--pos) 40%,transparent)':'color-mix(in srgb,var(--neg) 40%,transparent)';
      bars+='<rect x="'+(i*(barW+1)).toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+Math.max(1,bH).toFixed(1)+'" fill="'+cor+'" rx="1"/>';
    });
    var miniSvg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:60px"><line x1="0" y1="'+zero+'" x2="'+W+'" y2="'+zero+'" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>'+bars+'</svg>';

    h+='<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Janela '+j.label+'</div>';
    h+=miniSvg;
    h+='<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;font-family:Inter,sans-serif">';
    h+='<div><span style="color:var(--text3)">Média</span><div style="color:var(--text);font-weight:600">'+(mediaJ>=0?'+':'')+mediaJ.toFixed(1)+'%</div></div>';
    h+='<div><span style="color:var(--text3)">Tx Positiva</span><div style="color:'+(txPos>=70?'var(--pos)':'var(--neg)')+';font-weight:600">'+txPos.toFixed(0)+'%</div></div>';
    h+='<div><span style="color:var(--text3)">Tx vs CDI</span><div style="color:'+(txCDI>=50?'var(--pos)':'var(--neg)')+';font-weight:600">'+txCDI.toFixed(0)+'%</div></div>';
    h+='<div><span style="color:var(--text3)">Pior/Melhor</span><div style="color:var(--text);font-weight:600">'+minRol.toFixed(0)+'% / +'+maxRol.toFixed(0)+'%</div></div>';
    h+='</div></div>';
  });

  h+='</div></div>';
  return h;
}
