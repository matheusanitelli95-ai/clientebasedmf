import admin from 'firebase-admin';

// Inicializar Firebase Admin (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    })
  });
}
var db = admin.firestore();

// Tickers do Pré-Mercado
var PM_TICKERS = {
  futuros: [
    {sym:'ES=F',nome:'S&P 500 Fut'},{sym:'NQ=F',nome:'Nasdaq Fut'},
    {sym:'YM=F',nome:'Dow Jones Fut'},{sym:'RTY=F',nome:'Russell 2000'},
    {sym:'^VIX',nome:'VIX'}
  ],
  brasil: [{sym:'^BVSP',nome:'Ibovespa'},{sym:'USDBRL=X',nome:'Dólar/Real'}],
  cambio: [{sym:'DX-Y.NYB',nome:'DXY'},{sym:'EURUSD=X',nome:'EUR/USD'},{sym:'GBPUSD=X',nome:'GBP/USD'}],
  commodities: [{sym:'CL=F',nome:'Petróleo WTI'},{sym:'BZ=F',nome:'Petróleo Brent'},{sym:'GC=F',nome:'Ouro'},{sym:'SI=F',nome:'Prata'},{sym:'NG=F',nome:'Gás Natural'}]
};

function fmtNum(val, dec) {
  if (val == null) return '—';
  return val.toLocaleString('pt-BR', {minimumFractionDigits: dec || 2, maximumFractionDigits: dec || 2});
}

async function fetchTicker(sym) {
  try {
    var safeSym = sym;
    if (sym.indexOf('.') < 0 && sym.indexOf('=') < 0 && sym.indexOf('^') < 0 && sym.indexOf('-') < 0) {
      safeSym = sym + '.SA';
    }
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(safeSym) + '?interval=1d&range=1d&includePrePost=false';
    var resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
    var data = await resp.json();
    if (!data.chart || !data.chart.result || !data.chart.result[0]) return null;
    var meta = data.chart.result[0].meta;
    var prevClose = meta.previousClose || meta.chartPreviousClose || null;
    var curPrice = meta.regularMarketPrice;
    var changePercent = 0;
    if (prevClose && curPrice && prevClose !== 0) {
      changePercent = ((curPrice - prevClose) / prevClose * 100);
    }
    return { price: curPrice, changePercent: changePercent, change: prevClose ? (curPrice - prevClose) : 0 };
  } catch (e) { return null; }
}

function gerarTextoAnalise(dados) {
  var hoje = new Date().toLocaleDateString('pt-BR', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var lines = [];
  lines.push('PRÉ-MERCADO DMF — ' + hoje.toUpperCase());
  lines.push('');

  // Futuros
  lines.push('FUTUROS EUA');
  (dados.futuros || []).forEach(function(d) {
    var seta = d.var_pct >= 0 ? '▲' : '▼';
    lines.push(seta + ' ' + d.nome + ': ' + fmtNum(d.preco) + ' (' + (d.var_pct >= 0 ? '+' : '') + fmtNum(d.var_pct) + '%)');
  });
  lines.push('');

  // Brasil
  lines.push('BRASIL');
  (dados.brasil || []).forEach(function(d) {
    var dec = d.sym === 'USDBRL=X' ? 4 : 2;
    var seta = d.var_pct >= 0 ? '▲' : '▼';
    lines.push(seta + ' ' + d.nome + ': ' + fmtNum(d.preco, dec) + ' (' + (d.var_pct >= 0 ? '+' : '') + fmtNum(d.var_pct) + '%)');
  });
  lines.push('');

  // Câmbio
  lines.push('CÂMBIO');
  (dados.cambio || []).forEach(function(d) {
    var seta = d.var_pct >= 0 ? '▲' : '▼';
    lines.push(seta + ' ' + d.nome + ': ' + fmtNum(d.preco, 4) + ' (' + (d.var_pct >= 0 ? '+' : '') + fmtNum(d.var_pct) + '%)');
  });
  lines.push('');

  // Commodities
  lines.push('COMMODITIES');
  (dados.commodities || []).forEach(function(d) {
    var seta = d.var_pct >= 0 ? '▲' : '▼';
    lines.push(seta + ' ' + d.nome + ': ' + fmtNum(d.preco) + ' (' + (d.var_pct >= 0 ? '+' : '') + fmtNum(d.var_pct) + '%)');
  });
  lines.push('');

  // Sentimento
  var spFut = dados.futuros.find(function(f) { return f.sym === 'ES=F'; });
  var vix = dados.futuros.find(function(f) { return f.sym === '^VIX'; });
  var dolar = dados.brasil.find(function(f) { return f.sym === 'USDBRL=X'; });
  var sentimento = 'NEUTRO';
  var positivos = 0, negativos = 0;
  if (spFut && spFut.var_pct > 0.2) positivos++; else if (spFut && spFut.var_pct < -0.2) negativos++;
  if (vix && vix.preco < 20) positivos++; else if (vix && vix.preco > 25) negativos++;
  if (dolar && dolar.var_pct < -0.3) positivos++; else if (dolar && dolar.var_pct > 0.3) negativos++;
  if (positivos > negativos) sentimento = 'POSITIVO';
  else if (negativos > positivos) sentimento = 'NEGATIVO';
  lines.push('SENTIMENTO DO DIA: ' + sentimento);

  return lines.join('\n');
}

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default async function handler(req, res) {
  // Verificar segredo do cron (Vercel envia CRON_SECRET automaticamente)
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // Buscar todos os tickers
    var dados = {};
    var cats = Object.keys(PM_TICKERS);
    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i];
      var items = [];
      for (var j = 0; j < PM_TICKERS[cat].length; j++) {
        var t = PM_TICKERS[cat][j];
        var result = await fetchTicker(t.sym);
        items.push({
          sym: t.sym,
          nome: t.nome,
          preco: result ? result.price : null,
          var_pct: result ? result.changePercent : 0,
          var_abs: result ? result.change : 0
        });
      }
      dados[cat] = items;
    }

    // Gerar texto
    var texto = gerarTextoAnalise(dados);

    // Salvar como comunicado no Firestore
    await db.collection('comunicados').add({
      titulo: 'Pré-Mercado — ' + new Date().toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}),
      conteudo: texto,
      tipo: 'pre-mercado',
      data: todayStr(),
      visivel: 'todos',
      destaque: 'normal',
      criadoEm: new Date().toISOString(),
      criadoPor: 'cron-automatico'
    });

    return res.status(200).json({ ok: true, message: 'Pré-Mercado gerado e salvo nos comunicados' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
