/* ══════════════════════════════════════════════════════════════
   CONSULTORIAS — Controle Mensal de Consultorias por Cliente
   Arquivo externo · carregado via <script src="consultorias.js">
   Acesso: ADM + Gestor
   ══════════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ─── CSS ─── */
var style = document.createElement('style');
style.textContent = [
  '.cons-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:14px; }',
  '.cons-card { background:var(--card); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:border-color .2s; }',
  '.cons-card:hover { border-color:var(--blue); }',
  '.cons-card-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border); }',
  '.cons-card-nome { font-size:14px; font-weight:600; color:var(--white); }',
  '.cons-card-body { display:flex; gap:0; }',
  '.cons-mes { flex:1; padding:14px 12px; text-align:center; position:relative; }',
  '.cons-mes + .cons-mes { border-left:1px solid var(--border); }',
  '.cons-mes-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text3); margin-bottom:10px; }',
  '.cons-badge { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:default; white-space:nowrap; }',
  '.cons-badge-done { background:rgba(16,185,129,.12); color:#10B981; }',
  '.cons-badge-scheduled { background:rgba(59,130,246,.12); color:#3B82F6; }',
  '.cons-badge-none { background:rgba(239,68,68,.08); color:#EF4444; cursor:pointer; transition:background .2s; }',
  '.cons-badge-none:hover { background:rgba(239,68,68,.18); }',
  '.cons-badge-date { display:block; font-size:10px; color:var(--text3); margin-top:4px; }',

  /* Filtros */
  '.cons-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }',
  '.cons-filter-btn { padding:7px 18px; border-radius:20px; font-size:12px; font-weight:600; border:1px solid var(--border); background:transparent; color:var(--text); cursor:pointer; transition:all .2s; }',
  '.cons-filter-btn:hover { border-color:var(--blue); color:var(--blue); }',
  '.cons-filter-btn.active { background:var(--blue); border-color:var(--blue); color:#fff; }',

  /* Busca */
  '.cons-search { padding:9px 14px 9px 36px; border-radius:10px; border:1px solid var(--border); background:var(--card); color:var(--white); font-size:13px; width:260px; outline:none; transition:border-color .2s; }',
  '.cons-search:focus { border-color:var(--blue); }',
  '.cons-search-wrap { position:relative; display:inline-flex; align-items:center; }',
  '.cons-search-icon { position:absolute; left:11px; color:var(--text3); pointer-events:none; }',

  /* Stats */
  '.cons-stats { display:flex; gap:14px; margin-bottom:18px; flex-wrap:wrap; }',
  '.cons-stat { padding:12px 20px; border-radius:10px; background:var(--card); border:1px solid var(--border); min-width:130px; }',
  '.cons-stat-num { font-size:22px; font-weight:800; font-family:DM Mono,monospace; }',
  '.cons-stat-label { font-size:11px; color:var(--text3); margin-top:2px; }',

  /* Modal simples de agendar */
  '.cons-modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.6); z-index:9999; display:flex; align-items:center; justify-content:center; }',
  '.cons-modal { background:var(--bg); border:1px solid var(--border); border-radius:16px; padding:28px; width:380px; max-width:95%; }',
  '.cons-modal h3 { font-size:16px; font-weight:700; color:var(--white); margin:0 0 16px; }',
  '.cons-modal label { font-size:12px; color:var(--text); display:block; margin-bottom:4px; }',
  '.cons-modal input, .cons-modal select { width:100%; padding:9px 12px; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--white); font-size:13px; margin-bottom:12px; outline:none; box-sizing:border-box; }',
  '.cons-modal input:focus, .cons-modal select:focus { border-color:var(--blue); }',
  '.cons-modal-btns { display:flex; gap:10px; justify-content:flex-end; margin-top:8px; }',
  '.cons-modal-btns button { padding:9px 22px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; }',
  '.cons-modal-cancel { background:var(--card); color:var(--text); }',
  '.cons-modal-save { background:var(--blue); color:#fff; }'
].join('\n');
document.head.appendChild(style);


/* ─── HELPERS ─── */
var mesesNome = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
var mesesAbr  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function mesAno(date){ return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0'); }

function parseMesAno(ma){
  var p = ma.split('-');
  return { ano: parseInt(p[0]), mes: parseInt(p[1]) - 1 };
}

function nomeMesAno(ma){
  var p = parseMesAno(ma);
  return mesesAbr[p.mes] + '/' + p.ano;
}

function nomeMesCompleto(ma){
  var p = parseMesAno(ma);
  return mesesNome[p.mes] + ' ' + p.ano;
}


/* ─── ESTADO ─── */
var consultoriasData = [];   // reuniões tipo Consultoria
var filtroAtivo = 'todos';   // todos | sem | agendada | realizada
var buscaTexto = '';
var currentMes1 = '';        // mês atual  (YYYY-MM)
var currentMes2 = '';        // próximo mês (YYYY-MM)


/* ─── CARREGAR DADOS ─── */
function loadConsultorias(){
  var agora = new Date();
  currentMes1 = mesAno(agora);
  var prox = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  currentMes2 = mesAno(prox);

  // Escutar reuniões tipo Consultoria
  if(window._consUnsubscribe) window._consUnsubscribe();
  window._consUnsubscribe = db.collection('reunioes')
    .where('tipo','==','Consultoria')
    .onSnapshot(function(snap){
      consultoriasData = [];
      snap.forEach(function(doc){
        var d = doc.data();
        d._id = doc.id;
        consultoriasData.push(d);
      });
      renderConsultorias();
    });
}

window.loadConsultorias = loadConsultorias;


/* ─── RENDERIZAR ─── */
function renderConsultorias(){
  var container = document.getElementById('consultorias-body');
  if(!container) return;

  // Filtrar clientes ativos
  var clientesAtivos = (window.clientes || []).filter(function(c){
    return c.status === 'Ativo';
  });

  // Ordenar alfabeticamente
  clientesAtivos.sort(function(a,b){
    return (a.nome||'').localeCompare(b.nome||'','pt-BR');
  });

  // Mapear consultorias por cliente e mês
  var mapCons = {};  // { clienteId: { 'YYYY-MM': { status, data, reuniaoId } } }

  consultoriasData.forEach(function(r){
    var cId = r.clienteId;
    if(!cId) return;
    if(!mapCons[cId]) mapCons[cId] = {};

    var dataReuniao = r.data; // YYYY-MM-DD
    if(!dataReuniao) return;
    var ma = dataReuniao.substring(0,7); // YYYY-MM

    if(ma !== currentMes1 && ma !== currentMes2) return;

    // Comparar datas como strings ISO (YYYY-MM-DD) — evita bugs de fuso horário
    var hojeStr = new Date().toISOString().split('T')[0];
    var status;
    if(r.registradaManualmente){
      status = 'realizada'; // Marcada manualmente = sempre realizada
    } else {
      status = dataReuniao <= hojeStr ? 'realizada' : 'agendada';
    }

    // Se já tem uma consultoria para esse mês, preferir a mais recente
    // Prioridade: realizada > agendada > sem
    var prioridade = { 'realizada': 2, 'agendada': 1, 'sem': 0 };
    if(!mapCons[cId][ma] || prioridade[status] > prioridade[mapCons[cId][ma].status] || (status === mapCons[cId][ma].status && dataReuniao > mapCons[cId][ma].data)){
      mapCons[cId][ma] = { status: status, data: dataReuniao, hora: r.hora || '', reuniaoId: r._id };
    }
  });

  // Calcular status de cada cliente para cada mês
  var listaClientes = clientesAtivos.map(function(c){
    var cId = c.id || c.nome;
    var mes1Info = mapCons[cId] && mapCons[cId][currentMes1] ? mapCons[cId][currentMes1] : { status: 'sem' };
    var mes2Info = mapCons[cId] && mapCons[cId][currentMes2] ? mapCons[cId][currentMes2] : { status: 'sem' };
    return {
      id: cId,
      nome: c.nome || '',
      assessor: c.assessor || '',
      mes1: mes1Info,
      mes2: mes2Info
    };
  });

  // Aplicar busca
  if(buscaTexto){
    var q = buscaTexto.toLowerCase();
    listaClientes = listaClientes.filter(function(c){
      return c.nome.toLowerCase().indexOf(q) >= 0 || (c.assessor && c.assessor.toLowerCase().indexOf(q) >= 0);
    });
  }

  // Aplicar filtro
  if(filtroAtivo !== 'todos'){
    listaClientes = listaClientes.filter(function(c){
      if(filtroAtivo === 'sem')       return c.mes1.status === 'sem' || c.mes2.status === 'sem';
      if(filtroAtivo === 'agendada')  return c.mes1.status === 'agendada' || c.mes2.status === 'agendada';
      if(filtroAtivo === 'realizada') return c.mes1.status === 'realizada' || c.mes2.status === 'realizada';
      return true;
    });
  }

  // Estatísticas
  var totalClientes = clientesAtivos.length;
  var semMes1 = 0, agendadaMes1 = 0, realizadaMes1 = 0;
  var semMes2 = 0, agendadaMes2 = 0, realizadaMes2 = 0;

  clientesAtivos.forEach(function(c){
    var cId = c.id || c.nome;
    var m1 = mapCons[cId] && mapCons[cId][currentMes1] ? mapCons[cId][currentMes1].status : 'sem';
    var m2 = mapCons[cId] && mapCons[cId][currentMes2] ? mapCons[cId][currentMes2].status : 'sem';
    if(m1 === 'sem') semMes1++; else if(m1 === 'agendada') agendadaMes1++; else realizadaMes1++;
    if(m2 === 'sem') semMes2++; else if(m2 === 'agendada') agendadaMes2++; else realizadaMes2++;
  });

  // Montar HTML
  var html = '';

  // Stats
  html += '<div class="cons-stats">';
  html += '<div class="cons-stat"><div class="cons-stat-num" style="color:var(--white)">'+totalClientes+'</div><div class="cons-stat-label">Clientes ativos</div></div>';
  html += '<div class="cons-stat"><div class="cons-stat-num" style="color:#10B981">'+realizadaMes1+'</div><div class="cons-stat-label">Realizadas · '+nomeMesAno(currentMes1)+'</div></div>';
  html += '<div class="cons-stat"><div class="cons-stat-num" style="color:#3B82F6">'+(agendadaMes1+agendadaMes2)+'</div><div class="cons-stat-label">Agendadas (total)</div></div>';
  html += '<div class="cons-stat"><div class="cons-stat-num" style="color:#EF4444">'+(semMes1+semMes2)+'</div><div class="cons-stat-label">Sem consultoria</div></div>';
  html += '</div>';

  // Filtros + Busca
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">';
  html += '<div class="cons-filters">';
  html += filterBtn('todos', 'Todos ('+listaClientes.length+')');
  html += filterBtn('sem', '❌ Sem consultoria');
  html += filterBtn('agendada', '📅 Agendadas');
  html += filterBtn('realizada', '✅ Realizadas');
  html += '</div>';
  html += '<div class="cons-search-wrap">';
  html += '<svg class="cons-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
  html += '<input type="text" class="cons-search" placeholder="Buscar cliente..." value="'+escapeHtml(buscaTexto)+'" oninput="window._consSearch(this.value)">';
  html += '</div>';
  html += '</div>';

  if(!listaClientes.length){
    html += '<div class="empty" style="padding:60px"><div class="empty-title">Nenhum cliente encontrado</div><p style="font-size:13px;color:var(--text3);margin-top:8px">Ajuste os filtros ou busca.</p></div>';
  } else {
    // Grid de cards
    html += '<div class="cons-grid">';
    listaClientes.forEach(function(c){
      html += buildClienteCard(c);
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

function filterBtn(val, label){
  var cls = filtroAtivo === val ? ' active' : '';
  return '<button class="cons-filter-btn'+cls+'" onclick="window._consFilter(\''+val+'\')">'+label+'</button>';
}

function buildClienteCard(c){
  var html = '<div class="cons-card">';
  html += '<div class="cons-card-head">';
  html += '<div class="cons-card-nome">'+escapeHtml(c.nome)+'</div>';
  if(c.assessor) html += '<span style="font-size:11px;color:var(--text3)">'+escapeHtml(c.assessor)+'</span>';
  html += '</div>';

  html += '<div class="cons-card-body">';
  html += buildMesCol(c, currentMes1, c.mes1);
  html += buildMesCol(c, currentMes2, c.mes2);
  html += '</div>';

  html += '</div>';
  return html;
}

function buildMesCol(c, ma, info){
  var html = '<div class="cons-mes">';
  html += '<div class="cons-mes-label">'+nomeMesAno(ma)+'</div>';

  var cid = escapeHtml(c.id);
  var cnome = escapeHtml(c.nome);

  if(info.status === 'realizada'){
    html += '<span class="cons-badge cons-badge-done">✅ Realizada</span>';
    if(info.data) html += '<span class="cons-badge-date">'+formatarDataBR(info.data)+(info.hora ? ' às '+info.hora : '')+'</span>';
  } else if(info.status === 'agendada'){
    html += '<span class="cons-badge cons-badge-scheduled" onclick="window._consMarcarRealizada(\''+cid+'\',\''+cnome+'\',\''+ma+'\')" title="Clique para marcar como realizada" style="cursor:pointer">📅 Agendada</span>';
    if(info.data) html += '<span class="cons-badge-date">'+formatarDataBR(info.data)+(info.hora ? ' às '+info.hora : '')+'</span>';
  } else {
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    html += '<span class="cons-badge cons-badge-none" onclick="window._consAgendar(\''+cid+'\',\''+cnome+'\',\''+ma+'\')" title="Agendar consultoria futura" style="cursor:pointer">📅 Agendar</span>';
    html += '<span class="cons-badge cons-badge-done" onclick="window._consMarcarRealizada(\''+cid+'\',\''+cnome+'\',\''+ma+'\')" title="Registrar consultoria já realizada" style="cursor:pointer;opacity:.7">✅ Já fiz</span>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function formatarDataBR(d){
  if(!d) return '';
  var p = d.split('-');
  return p[2]+'/'+p[1]+'/'+p[0];
}

function escapeHtml(s){
  if(!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* ─── FILTROS / BUSCA ─── */
window._consFilter = function(val){
  filtroAtivo = val;
  renderConsultorias();
};

window._consSearch = function(val){
  buscaTexto = val;
  renderConsultorias();
};


/* ─── MODAL AGENDAR ─── */
window._consAgendar = function(clienteId, clienteNome, mesAno){
  var p = parseMesAno(mesAno);
  // Pré-selecionar primeira semana do mês futuro ou dia atual se mês corrente
  var hoje = new Date();
  var defaultDate;
  if(p.ano === hoje.getFullYear() && p.mes === hoje.getMonth()){
    defaultDate = hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')+'-'+String(hoje.getDate()).padStart(2,'0');
  } else {
    defaultDate = p.ano+'-'+String(p.mes+1).padStart(2,'0')+'-15';
  }

  var overlay = document.createElement('div');
  overlay.className = 'cons-modal-overlay';
  overlay.onclick = function(e){ if(e.target===overlay) document.body.removeChild(overlay); };

  var modal = document.createElement('div');
  modal.className = 'cons-modal';
  modal.innerHTML = '<h3>Agendar Consultoria</h3>'
    +'<label>Cliente</label>'
    +'<input type="text" value="'+escapeHtml(clienteNome)+'" readonly style="opacity:.7">'
    +'<label>Data</label>'
    +'<input type="text" data-brdate="1" id="cons-modal-data" value="'+defaultDate+'" class="form-input" placeholder="DD/MM/AAAA" maxlength="10">'
    +'<label>Horário</label>'
    +'<input type="time" id="cons-modal-hora" value="10:00">'
    +'<label>Formato</label>'
    +'<select id="cons-modal-formato"><option value="Online">Online</option><option value="Presencial">Presencial</option><option value="Telefone">Telefone</option></select>'
    +'<label>Observações (opcional)</label>'
    +'<input type="text" id="cons-modal-obs" placeholder="Ex: revisar carteira">'
    +'<div class="cons-modal-btns">'
    +'<button class="cons-modal-cancel" onclick="this.closest(\'.cons-modal-overlay\').remove()">Cancelar</button>'
    +'<button class="cons-modal-save" id="cons-modal-salvar">Salvar</button>'
    +'</div>';

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('cons-modal-salvar').onclick = function(){
    var data = document.getElementById('cons-modal-data').value;
    var hora = document.getElementById('cons-modal-hora').value;
    var formato = document.getElementById('cons-modal-formato').value;
    var obs = document.getElementById('cons-modal-obs').value;

    if(!data){ alert('Selecione a data!'); return; }

    var reuniao = {
      clienteId: clienteId,
      clienteNome: clienteNome,
      data: data,
      hora: hora,
      tipo: 'Consultoria',
      formato: formato,
      obs: obs,
      criadoEm: new Date().toISOString()
    };

    this.textContent = 'Salvando...';
    this.disabled = true;

    db.collection('reunioes').add(reuniao).then(function(){
      overlay.remove();
      // Toast visual
      showToast('Consultoria agendada para '+clienteNome+' em '+formatarDataBR(data));
    }).catch(function(e){
      alert('Erro ao agendar: '+e.message);
      document.getElementById('cons-modal-salvar').textContent = 'Salvar';
      document.getElementById('cons-modal-salvar').disabled = false;
    });
  };
};

function diasNoMes(ano, mes){
  return new Date(ano, mes + 1, 0).getDate();
}

/* ─── MARCAR COMO REALIZADA ─── */
window._consMarcarRealizada = function(clienteId, clienteNome, mesAno){
  var p = parseMesAno(mesAno);
  var hoje = new Date();
  var defaultDate;
  if(p.ano === hoje.getFullYear() && p.mes === hoje.getMonth()){
    defaultDate = hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')+'-'+String(hoje.getDate()).padStart(2,'0');
  } else {
    // Último dia do mês passado ou dia 15
    defaultDate = p.ano+'-'+String(p.mes+1).padStart(2,'0')+'-15';
  }

  var overlay = document.createElement('div');
  overlay.className = 'cons-modal-overlay';
  overlay.onclick = function(e){ if(e.target===overlay) document.body.removeChild(overlay); };

  var modal = document.createElement('div');
  modal.className = 'cons-modal';
  modal.innerHTML = '<h3>Registrar Consultoria Realizada</h3>'
    +'<label>Cliente</label>'
    +'<input type="text" value="'+escapeHtml(clienteNome)+'" readonly style="opacity:.7">'
    +'<label>Data em que foi realizada</label>'
    +'<input type="text" data-brdate="1" id="cons-modal-data-real" value="'+defaultDate+'" class="form-input" placeholder="DD/MM/AAAA" maxlength="10">'
    +'<label>Formato</label>'
    +'<select id="cons-modal-formato-real"><option value="Online">Online</option><option value="Presencial">Presencial</option><option value="Telefone">Telefone</option></select>'
    +'<label>Observações (opcional)</label>'
    +'<input type="text" id="cons-modal-obs-real" placeholder="Ex: revisão de carteira concluída">'
    +'<div class="cons-modal-btns">'
    +'<button class="cons-modal-cancel" onclick="this.closest(\'.cons-modal-overlay\').remove()">Cancelar</button>'
    +'<button class="cons-modal-save" id="cons-modal-salvar-real" style="background:#10B981">Registrar</button>'
    +'</div>';

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('cons-modal-salvar-real').onclick = function(){
    var data = document.getElementById('cons-modal-data-real').value;
    var formato = document.getElementById('cons-modal-formato-real').value;
    var obs = document.getElementById('cons-modal-obs-real').value;

    if(!data){ alert('Selecione a data!'); return; }

    // Salvar com data no passado pra que o sistema reconheça como "realizada"
    var reuniao = {
      clienteId: clienteId,
      clienteNome: clienteNome,
      data: data,
      hora: '',
      tipo: 'Consultoria',
      formato: formato,
      obs: obs,
      registradaManualmente: true,
      criadoEm: new Date().toISOString()
    };

    this.textContent = 'Salvando...';
    this.disabled = true;

    db.collection('reunioes').add(reuniao).then(function(){
      overlay.remove();
      showToast('Consultoria registrada como realizada para '+clienteNome);
    }).catch(function(e){
      alert('Erro ao registrar: '+e.message);
      document.getElementById('cons-modal-salvar-real').textContent = 'Registrar';
      document.getElementById('cons-modal-salvar-real').disabled = false;
    });
  };
};

function showToast(msg){
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#10B981;color:#fff;padding:14px 24px;border-radius:10px;font-size:13px;font-weight:600;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,.3);animation:fadeInUp .3s ease';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(function(){ t.remove(); },300); },3000);
}


/* ─── INIT ─── */
// Injetar HTML da view se não existir
function injectConsultoriasView(){
  if(document.getElementById('view-consultorias')) return;

  var viewHTML = '<div class="view" id="view-consultorias">'
    +'<div class="page-header">'
    +'<div><div class="page-title">Consultorias</div><div class="page-sub" id="consultorias-sub">Controle mensal de consultorias por cliente</div></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="btn-secondary" onclick="loadConsultorias()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-3.36-7.01"/><path d="M21 3v6h-6"/></svg> Atualizar</button>'
    +'</div>'
    +'</div>'
    +'<div class="page-content"><div id="consultorias-body">'
    +'<div class="empty" style="padding:60px"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".3"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg></div>'
    +'<div class="empty-title">Controle de Consultorias</div>'
    +'<p style="font-size:13px;margin-top:8px;color:var(--text3)">Visualize o status de consultoria de cada cliente para o mês atual e o próximo.</p>'
    +'</div></div></div></div>';

  // Inserir antes do fechamento das views (após a última view existente)
  var allViews = document.querySelectorAll('.view');
  if(allViews.length > 0){
    var lastView = allViews[allViews.length - 1];
    lastView.insertAdjacentHTML('afterend', viewHTML);
  }
}

// Injetar botão no sidebar se necessário
function injectConsultoriasNav(){
  // Verificar se já existe
  if(document.querySelector('[onclick*="showView(\'consultorias\')"]')) return;

  // Encontrar botão de Agendamento no sidebar para inserir depois dele
  var navItems = document.querySelectorAll('.nav-item');
  var agendamentoBtn = null;
  for(var i=0; i<navItems.length; i++){
    var onclick = navItems[i].getAttribute('onclick') || '';
    if(onclick.indexOf("'agendamento'") >= 0 || onclick.indexOf('"agendamento"') >= 0){
      agendamentoBtn = navItems[i];
      break;
    }
  }

  var btnHTML = '<button class="nav-item" onclick="showView(\'consultorias\')">'
    +'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>'
    +'Consultorias</button>';

  if(agendamentoBtn){
    agendamentoBtn.insertAdjacentHTML('afterend', btnHTML);
  }
}

// Adicionar 'consultorias' ao PERFIL_MENUS se não estiver
function patchPerfilMenus(){
  if(!window.PERFIL_MENUS) return;
  if(window.PERFIL_MENUS.adm && window.PERFIL_MENUS.adm.indexOf('consultorias') < 0){
    window.PERFIL_MENUS.adm.push('consultorias');
  }
  if(window.PERFIL_MENUS.gestor && window.PERFIL_MENUS.gestor.indexOf('consultorias') < 0){
    window.PERFIL_MENUS.gestor.push('consultorias');
  }
}

// Hook no showView para carregar dados quando abrir
var _origShowView = window.showView;
window.showView = function(viewId){
  if(typeof _origShowView === 'function') _origShowView(viewId);
  if(viewId === 'consultorias') loadConsultorias();
};

// Inicialização quando o DOM estiver pronto
function initConsultorias(){
  injectConsultoriasView();
  injectConsultoriasNav();
  patchPerfilMenus();
}

// Aguardar DOM e dados carregarem
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(initConsultorias, 500); });
} else {
  setTimeout(initConsultorias, 500);
}

window.initConsultorias = initConsultorias;

})();
