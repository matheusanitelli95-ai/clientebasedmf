// ═══════════════════════════════════════════════════════════
// WEALTH PLANNING — DMF Gestão Patrimonial
// Módulo aditivo, modular e retrocompatível
// ═══════════════════════════════════════════════════════════

// ── Constantes ───────────────────────────────────────────
var WP_FASES_ICONS = {
  fundacao: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="stroke:var(--neg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M5 20V10l7-6 7 6v10"/><path d="M9 20v-6h6v6"/></svg>',
  acumulacao: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="stroke:var(--pos)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  distribuicao: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  sucessao: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="stroke:var(--ok)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};
var WP_FASES = [
  { id: 'fundacao', label: 'Fundação', icon: WP_FASES_ICONS.fundacao, desc: 'Organização financeira, fluxo de caixa, reserva e proteções' },
  { id: 'acumulacao', label: 'Acumulação', icon: WP_FASES_ICONS.acumulacao, desc: 'Construção patrimonial e acompanhamento de objetivos' },
  { id: 'distribuicao', label: 'Distribuição', icon: WP_FASES_ICONS.distribuicao, desc: 'Planejamento de renda, aposentadoria e retiradas' },
  { id: 'sucessao', label: 'Sucessão', icon: WP_FASES_ICONS.sucessao, desc: 'Transferência de patrimônio e responsabilidades' }
];

// ── Verificação de acesso ao Wealth Planning ─────────────
function clienteTemConsultoria(clienteDoc) {
  if (!clienteDoc) return false;
  // Novo sistema de checkboxes
  if (typeof clienteDoc.isConsultoria !== 'undefined') {
    return !!clienteDoc.isConsultoria;
  }
  // Fallback para campo 'servico' antigo
  return (clienteDoc.servico || '').indexOf('Consultoria') >= 0;
}

// ── Encadeamento do showView ─────────────────────────────
var _origShowViewWP = showView;
showView = function(v, btn) {
  // Build the view BEFORE calling original showView so it can activate it
  if (v === 'wealth-planning' && !document.getElementById('view-wealth-planning')) {
    buildWealthPlanningView();
  }
  _origShowViewWP(v, btn);
  if (v === 'wealth-planning') loadWealthPlanning();
};

// ── Adicionar WP ao PERFIL_MENUS ─────────────────────────
if (typeof PERFIL_MENUS !== 'undefined') {
  if (PERFIL_MENUS.adm && PERFIL_MENUS.adm.indexOf('wealth-planning') < 0) {
    PERFIL_MENUS.adm.push('wealth-planning');
  }
  if (PERFIL_MENUS.gestor && PERFIL_MENUS.gestor.indexOf('wealth-planning') < 0) {
    PERFIL_MENUS.gestor.push('wealth-planning');
  }
  if (PERFIL_MENUS.cliente && PERFIL_MENUS.cliente.indexOf('wealth-planning') < 0) {
    PERFIL_MENUS.cliente.push('wealth-planning');
  }
}

// ── Adicionar item na sidebar do admin/gestor ────────────
(function addWPSidebar() {
  // Esperar DOM ready
  function inject() {
    var nav = document.querySelector('.sidebar-nav');
    if (!nav) return setTimeout(inject, 500);

    // Verificar se já existe
    if (document.getElementById('nav-wp')) return;

    // Encontrar a seção "CRM" ou "Ferramentas" para inserir antes
    var sections = nav.querySelectorAll('.nav-section');
    var ferramentasSection = null;
    sections.forEach(function(s) {
      if (s.textContent.trim() === 'Ferramentas') ferramentasSection = s;
    });

    // Criar seção Wealth Planning
    var wpSection = document.createElement('div');
    wpSection.className = 'nav-section';
    wpSection.textContent = 'Wealth Planning';

    var wpBtn = document.createElement('button');
    wpBtn.className = 'nav-item';
    wpBtn.id = 'nav-wp';
    wpBtn.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></span><span>Planejamento</span>';
    wpBtn.onclick = function() { showView('wealth-planning', wpBtn); };

    if (ferramentasSection) {
      nav.insertBefore(wpSection, ferramentasSection);
      nav.insertBefore(wpBtn, ferramentasSection);
    } else {
      nav.appendChild(wpSection);
      nav.appendChild(wpBtn);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

// ── Adicionar WP ao portal do cliente ────────────────────
var _origBuildPortalWP = typeof loadClienteData === 'function' ? loadClienteData : null;

// Hook no portal do cliente para adicionar botão WP
(function addWPClienteNav() {
  function inject() {
    var clienteNav = document.getElementById('cliente-nav');
    if (!clienteNav || document.getElementById('cnav-wp')) return;

    // Criar botão
    var CLI_ICONS_WP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';

    var sections = clienteNav.querySelectorAll('.nav-section');
    var ferramentasSection = null;
    sections.forEach(function(s) {
      if (s.textContent.trim() === 'Ferramentas') ferramentasSection = s;
    });

    var wpSection = document.createElement('div');
    wpSection.className = 'nav-section';
    wpSection.textContent = 'Planejamento';

    var wpBtn = document.createElement('button');
    wpBtn.className = 'nav-item';
    wpBtn.id = 'cnav-wp';
    wpBtn.innerHTML = '<span class="icon">' + CLI_ICONS_WP + '</span><span>Wealth Planning</span>';
    wpBtn.onclick = function() {
      if (typeof showClienteView === 'function') {
        showClienteView('wealth-planning', wpBtn);
      }
    };

    if (ferramentasSection) {
      clienteNav.insertBefore(wpSection, ferramentasSection);
      clienteNav.insertBefore(wpBtn, ferramentasSection);
    } else {
      clienteNav.appendChild(wpSection);
      clienteNav.appendChild(wpBtn);
    }
  }

  // Observar quando o portal do cliente é construído
  var _origShowClienteViewWP = typeof showClienteView === 'function' ? showClienteView : null;
  if (_origShowClienteViewWP) {
    showClienteView = function(viewId, btn) {
      // Build the view BEFORE calling original so it can activate it
      if (viewId === 'wealth-planning' && !document.getElementById('view-wealth-planning')) {
        loadWealthPlanningCliente();
      }
      _origShowClienteViewWP(viewId, btn);
      if (viewId === 'wealth-planning') loadWealthPlanningCliente();
    };
  }

  // Tentar injetar periodicamente até o portal existir
  var wpNavInterval = setInterval(function() {
    if (document.getElementById('cliente-nav')) {
      inject();
      clearInterval(wpNavInterval);
    }
  }, 1000);
  // Limpar após 30s se nunca encontrar
  setTimeout(function() { clearInterval(wpNavInterval); }, 30000);
})();

// ── Estado do WP admin ───────────────────────────────────
var wpSelectedClienteId = null;

// ── Build da view Wealth Planning (admin/gestor) ─────────
function buildWealthPlanningView() {
  if (document.getElementById('view-wealth-planning')) return;
  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  var div = document.createElement('div');
  div.className = 'view';
  div.id = 'view-wealth-planning';
  div.innerHTML = '<div class="page-header">'
    + '<div><div class="page-title">Wealth Planning</div>'
    + '<div class="page-sub">Planejamento financeiro completo</div></div>'
    + '</div>'
    + '<div class="page-content">'
    // Barra de seleção de cliente
    + '<div class="card" style="margin-bottom:16px;padding:14px 16px">'
    + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<label style="font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap">Cliente:</label>'
    + '<div style="flex:1;min-width:200px;position:relative">'
    + '<input class="form-input" id="wp-search-cliente" placeholder="Buscar cliente por nome..." oninput="wpFilterClientes()" onfocus="wpFilterClientes()" autocomplete="off" style="width:100%">'
    + '<div id="wp-search-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);max-height:240px;overflow-y:auto;z-index:50;margin-top:4px"></div>'
    + '</div>'
    + '<div id="wp-selected-badge" style="display:none;font-size:13px;color:var(--white);background:var(--border);padding:4px 12px;border-radius:20px;display:none;align-items:center;gap:8px"></div>'
    + '</div></div>'
    // Conteúdo do WP (dashboard do cliente selecionado)
    + '<div id="wp-content">'
    + '<div class="empty" style="padding:60px;text-align:center">'
    + '<div style="margin-bottom:16px;opacity:.6"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>'
    + '<div class="empty-title" style="font-size:16px;margin-bottom:8px">Selecione um cliente acima</div>'
    + '<div style="font-size:13px;color:var(--text3);max-width:400px;margin:0 auto;line-height:1.6">Busque e selecione um cliente para visualizar e gerenciar o Wealth Planning como se fosse o portal do cliente.</div>'
    + '</div></div></div>';
  mainContent.appendChild(div);

  // Fechar dropdown ao clicar fora
  document.addEventListener('click', function(e) {
    var results = document.getElementById('wp-search-results');
    var input = document.getElementById('wp-search-cliente');
    if (results && input && !input.contains(e.target) && !results.contains(e.target)) {
      results.style.display = 'none';
    }
  });
}

// ── Cache de clientes para o WP (carregado do Firestore) ─
var wpClientesCache = [];
var wpClientesCacheLoaded = false;

function wpLoadClientesCache(callback) {
  if (wpClientesCacheLoaded && wpClientesCache.length > 0) {
    if (callback) callback();
    return;
  }
  db.collection('clientes').orderBy('nome').get().then(function(snap) {
    wpClientesCache = [];
    snap.forEach(function(doc) {
      wpClientesCache.push(Object.assign({ id: doc.id }, doc.data()));
    });
    wpClientesCacheLoaded = true;
    if (callback) callback();
  });
}

// ── Filtrar clientes no seletor do WP ────────────────────
function wpFilterClientes() {
  var input = document.getElementById('wp-search-cliente');
  var resultsDiv = document.getElementById('wp-search-results');
  if (!input || !resultsDiv) return;

  // Carregar cache do Firestore se ainda não tiver
  if (!wpClientesCacheLoaded) {
    resultsDiv.innerHTML = '<div style="padding:12px 16px;font-size:12px;color:var(--text3)">Carregando clientes...</div>';
    resultsDiv.style.display = 'block';
    wpLoadClientesCache(function() { wpFilterClientes(); });
    return;
  }

  var query = (input.value || '').toLowerCase().trim();

  // Filtrar apenas clientes com consultoria ticada
  var filtered = wpClientesCache.filter(function(c) {
    if (!clienteTemConsultoria(c)) return false;
    if (!query) return true;
    return (c.nome || '').toLowerCase().indexOf(query) >= 0
      || (c.cpf || '').replace(/\D/g,'').indexOf(query.replace(/\D/g,'')) >= 0;
  }).slice(0, 20);

  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div style="padding:12px 16px;font-size:12px;color:var(--text3)">' + (query ? 'Nenhum cliente com consultoria encontrado' : 'Nenhum cliente com consultoria ativa') + '</div>';
    resultsDiv.style.display = 'block';
    return;
  }

  var html = '';
  filtered.forEach(function(c) {
    html += '<div onclick="wpSelectCliente(\'' + c.id + '\')" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background=\'var(--border)\'" onmouseout="this.style.background=\'transparent\'">'
      + '<div style="font-size:13px;color:var(--white)">' + (c.nome || 'Sem nome') + '</div>'
      + '<span style="font-size:9px;background:var(--pos);color:#000;padding:1px 6px;border-radius:10px;font-weight:600">Consultoria</span>'
      + '</div>';
  });
  resultsDiv.innerHTML = html;
  resultsDiv.style.display = 'block';
}

// ── Selecionar um cliente no WP admin ────────────────────
function wpSelectCliente(clienteId) {
  wpSelectedClienteId = clienteId;
  var resultsDiv = document.getElementById('wp-search-results');
  var input = document.getElementById('wp-search-cliente');
  var badge = document.getElementById('wp-selected-badge');
  if (resultsDiv) resultsDiv.style.display = 'none';

  // Buscar dados do cliente
  db.collection('clientes').doc(clienteId).get().then(function(doc) {
    if (!doc.exists) return;
    var c = Object.assign({ id: doc.id }, doc.data());

    // Atualizar input e badge
    if (input) {
      input.value = '';
      input.placeholder = c.nome || 'Cliente selecionado';
    }
    if (badge) {
      var temWP = clienteTemConsultoria(c);
      var statusColor = temWP ? 'var(--pos)' : 'var(--neg)';
      var statusText = temWP ? 'Consultoria ativa' : 'Sem consultoria';
      badge.style.display = 'flex';
      badge.innerHTML = '<span style="font-weight:600">' + (c.nome || '') + '</span>'
        + '<span style="font-size:10px;color:' + statusColor + '">' + statusText + '</span>'
        + '<span onclick="wpClearCliente()" style="cursor:pointer;opacity:.5;font-size:16px" title="Limpar seleção">&times;</span>';
    }

    // Renderizar o dashboard WP desse cliente
    var wpContent = document.getElementById('wp-content');
    if (!wpContent) return;

    if (!clienteTemConsultoria(c)) {
      // Mostrar bloqueio mas com nota para admin
      wpContent.innerHTML = wpBloqueioHTML()
        + '<div style="text-align:center;padding:0 20px 40px">'
        + '<div style="font-size:12px;color:var(--text3);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;display:inline-block;max-width:420px">'
        + '<strong style="color:var(--neg)">Visão admin:</strong> Este cliente não tem Consultoria ativa. '
        + 'Ele veria esta tela de bloqueio ao acessar o Wealth Planning. '
        + 'Para liberar o acesso, ative o checkbox "Consultoria" no cadastro do cliente.'
        + '</div></div>';
    } else {
      // Renderizar exatamente o que o cliente veria
      wpContent.innerHTML = '<div style="margin-bottom:12px;padding:8px 14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11px;color:var(--text3);display:flex;align-items:center;gap:8px">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="stroke:var(--pos)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
        + '<span>Você está visualizando o Wealth Planning como o cliente <strong style="color:var(--white)">' + (c.nome || '') + '</strong> veria.</span>'
        + '</div>'
        + wpClienteDashboardHTML(Object.assign({id: wpSelectedClienteId}, c), true);
    }
  });
}

// ── Limpar seleção de cliente ────────────────────────────
function wpClearCliente() {
  wpSelectedClienteId = null;
  var input = document.getElementById('wp-search-cliente');
  var badge = document.getElementById('wp-selected-badge');
  var wpContent = document.getElementById('wp-content');
  if (input) { input.value = ''; input.placeholder = 'Buscar cliente por nome...'; }
  if (badge) badge.style.display = 'none';
  if (wpContent) {
    wpContent.innerHTML = '<div class="empty" style="padding:60px;text-align:center">'
      + '<div style="margin-bottom:16px;opacity:.6"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>'
      + '<div class="empty-title" style="font-size:16px;margin-bottom:8px">Selecione um cliente acima</div>'
      + '<div style="font-size:13px;color:var(--text3);max-width:400px;margin:0 auto;line-height:1.6">Busque e selecione um cliente para visualizar e gerenciar o Wealth Planning como se fosse o portal do cliente.</div>'
      + '</div>';
  }
}

// ── Load Wealth Planning (admin/gestor) ──────────────────
function loadWealthPlanning() {
  if (!document.getElementById('view-wealth-planning')) {
    buildWealthPlanningView();
  }
  // Se já tinha um cliente selecionado, recarregar
  if (wpSelectedClienteId) {
    wpSelectCliente(wpSelectedClienteId);
  }
}

// ── Load Wealth Planning (portal do cliente) ─────────────
function loadWealthPlanningCliente() {
  if (!document.getElementById('view-wealth-planning')) {
    var mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    var div = document.createElement('div');
    div.className = 'view';
    div.id = 'view-wealth-planning';
    mainContent.appendChild(div);
  }

  var view = document.getElementById('view-wealth-planning');
  if (!view) return;

  // Verificar se o cliente tem consultoria
  if (typeof currentClienteVinculado === 'undefined' || !currentClienteVinculado) {
    view.innerHTML = wpBloqueioHTML();
    return;
  }

  // Buscar dados do cliente para verificar acesso
  db.collection('clientes').doc(currentClienteVinculado).get().then(function(doc) {
    if (!doc.exists) {
      view.innerHTML = wpBloqueioHTML();
      return;
    }
    var clienteData = doc.data();
    if (!clienteTemConsultoria(clienteData)) {
      view.innerHTML = wpBloqueioHTML();
      return;
    }

    // Cliente tem consultoria — renderizar dashboard do WP
    clienteData.id = currentClienteVinculado;
    view.innerHTML = wpClienteDashboardHTML(clienteData, false);
  }).catch(function() {
    view.innerHTML = wpBloqueioHTML();
  });
}

// ── HTML de bloqueio (cliente sem consultoria) ────────────
function wpBloqueioHTML() {
  return '<div class="page-header">'
    + '<div><div class="page-title">Wealth Planning</div>'
    + '<div class="page-sub">Planejamento financeiro completo</div></div>'
    + '</div>'
    + '<div class="page-content">'
    + '<div style="text-align:center;padding:80px 20px">'
    + '<div style="width:80px;height:80px;border-radius:20px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;margin:0 auto 24px">'
    + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="stroke:var(--neg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
    + '</div>'
    + '<div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:var(--white);margin-bottom:8px">Acesso exclusivo para clientes de Consultoria</div>'
    + '<div style="font-size:13px;color:var(--text3);max-width:420px;margin:0 auto;line-height:1.6">O Wealth Planning é um serviço exclusivo para clientes com contrato de consultoria ativa na DMF Gestão Patrimonial. Entre em contato com seu consultor para saber mais.</div>'
    + '</div></div>';
}

// ── Formato moeda ────────────────────────────────────────
function wpFmtMoeda(v) {
  if (!v && v !== 0) return 'R$ 0';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── WP Tab system ────────────────────────────────────────
var wpActiveTab = 'resumo';
function wpShowTab(tab, clienteId, isAdmin) {
  wpActiveTab = tab;
  document.querySelectorAll('.wp-tab-btn').forEach(function(b) {
    b.classList.remove('active');
    b.style.color = 'var(--text3)';
    b.style.fontWeight = '400';
    b.style.borderBottom = '2px solid transparent';
  });
  var btn = document.querySelector('.wp-tab-btn[data-tab="' + tab + '"]');
  if (btn) {
    btn.classList.add('active');
    btn.style.color = 'var(--blue)';
    btn.style.fontWeight = '600';
    btn.style.borderBottom = '2px solid var(--blue)';
  }
  var container = document.getElementById('wp-modules-content');
  if (!container) return;
  if (tab === 'resumo') wpRenderResumo(container, clienteId, isAdmin);
  if (tab === 'objetivos') wpRenderObjetivos(container, clienteId, isAdmin);
  if (tab === 'seguros') wpRenderSeguros(container, clienteId, isAdmin);
  if (tab === 'familia') wpRenderFamilia(container, clienteId, isAdmin);
}

// ── HTML do dashboard WP (admin e cliente) ───────────────
function wpClienteDashboardHTML(clienteData, isAdmin) {
  var fase = clienteData.faseWP || 'fundacao';
  var faseInfo = WP_FASES.find(function(f) { return f.id === fase; }) || WP_FASES[0];
  var cid = clienteData.id || '';

  return '<div class="page-header">'
    + '<div><div class="page-title">Wealth Planning</div>'
    + '<div class="page-sub">Planejamento financeiro personalizado</div></div>'
    + '</div>'
    + '<div class="page-content">'
    // Fase atual
    + '<div class="card" style="margin-bottom:16px">'
    + '<div style="display:flex;align-items:center;gap:16px">'
    + '<div style="width:48px;height:48px;border-radius:12px;background:var(--border);display:flex;align-items:center;justify-content:center">' + faseInfo.icon + '</div>'
    + '<div style="flex:1">'
    + '<div style="font-size:13px;color:var(--text3);font-weight:400;margin-bottom:2px">Fase atual da jornada</div>'
    + '<div style="font-family:Inter,sans-serif;font-size:16px;font-weight:700;color:var(--white)">' + faseInfo.label + '</div>'
    + '<div style="font-size:12px;color:var(--text2);margin-top:2px">' + faseInfo.desc + '</div>'
    + '</div></div>'
    + '<div style="display:flex;gap:4px;margin-top:16px">'
    + WP_FASES.map(function(f) {
        var isActive = f.id === fase;
        return '<div style="flex:1;height:4px;border-radius:2px;background:' + (isActive ? 'var(--blue)' : 'var(--border)') + '"></div>';
      }).join('')
    + '</div></div>'
    // Resumo financeiro do cadastro
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">'
    + wpKpiCard('Renda mensal', wpFmtMoeda(clienteData.rendaMensal), 'var(--pos)')
    + wpKpiCard('Patrimônio', wpFmtMoeda(clienteData.patrimonioDeclarado || clienteData.patrimonio), 'var(--blue)')
    + wpKpiCard('Dívidas', wpFmtMoeda(clienteData.dividas), 'var(--neg)')
    + wpKpiCard('Dependentes', (clienteData.dependentes || 0) + ' pessoa' + ((clienteData.dependentes || 0) !== 1 ? 's' : ''), 'var(--ok)')
    + '</div>'
    // Tab bar
    + '<div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0">'
    + wpTabBtn('resumo', 'Resumo', true)
    + wpTabBtn('objetivos', 'Objetivos', false)
    + wpTabBtn('seguros', 'Seguros', false)
    + wpTabBtn('familia', 'Grupo Familiar', false)
    + '</div>'
    + '<div id="wp-modules-content"></div>'
    + '</div>'
    + '<script>'
    + 'wpIsAdminView=' + (isAdmin ? 'true' : 'false') + ';'
    + 'setTimeout(function(){wpShowTab("resumo","' + cid + '",' + (isAdmin ? 'true' : 'false') + ')},100);'
    + '</script>';
}

function wpKpiCard(label, value, color) {
  return '<div class="card" style="padding:16px">'
    + '<div style="font-size:13px;color:var(--text3);font-weight:400;margin-bottom:6px">' + label + '</div>'
    + '<div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:' + color + '">' + value + '</div>'
    + '</div>';
}

function wpTabBtn(tab, label, active) {
  return '<button class="wp-tab-btn' + (active ? ' active' : '') + '" data-tab="' + tab + '" '
    + 'onclick="wpShowTab(\'' + tab + '\',wpGetCurrentClienteId(),wpIsAdminView)" '
    + 'style="padding:10px 18px;border:none;background:none;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;font-weight:' + (active ? '600' : '400') + ';'
    + 'color:' + (active ? 'var(--blue)' : 'var(--text3)') + ';border-bottom:2px solid ' + (active ? 'var(--blue)' : 'transparent') + ';transition:all .15s"'
    + ' onmouseover="this.style.color=\'var(--blue)\'" onmouseout="if(!this.classList.contains(\'active\'))this.style.color=\'var(--text3)\'"'
    + '>' + label + '</button>';
}

var wpIsAdminView = false;

function wpGetCurrentClienteId() {
  // Admin mode: return selected client
  if (typeof wpSelectedClienteId !== 'undefined' && wpSelectedClienteId) return wpSelectedClienteId;
  // Client mode: return currentClienteVinculado
  if (typeof currentClienteVinculado !== 'undefined' && currentClienteVinculado) return currentClienteVinculado;
  return '';
}

// ═══════════════════════════════════════════════════════════
// WP MODULE: RESUMO
// ═══════════════════════════════════════════════════════════
function wpRenderResumo(container, clienteId, isAdmin) {
  if (!clienteId) { container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">Selecione um cliente</div>'; return; }
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Carregando...</div>';
  var html = '';
  // Load all subcollections in parallel
  var pending = 3;
  var objetivos = [], seguros = [], familia = [];
  function checkDone() {
    pending--;
    if (pending > 0) return;
    // Build summary
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">';
    // Objetivos summary
    html += '<div class="card" style="padding:20px;cursor:pointer" onclick="wpShowTab(\'objetivos\',\'' + clienteId + '\',' + isAdmin + ')">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="stroke:var(--pos)" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
      + '<span style="font-size:14px;font-weight:600;color:var(--white)">Objetivos</span></div>'
      + '<div style="font-family:Inter,sans-serif;font-size:24px;font-weight:700;color:var(--white)">' + objetivos.length + '</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:4px">' + (objetivos.length === 0 ? 'Nenhum cadastrado' : objetivos.length + ' objetivo' + (objetivos.length > 1 ? 's' : '') + ' definido' + (objetivos.length > 1 ? 's' : '')) + '</div>'
      + '</div>';
    // Seguros summary
    var totalPremio = seguros.reduce(function(s, x) { return s + (x.premioMensal || 0); }, 0);
    html += '<div class="card" style="padding:20px;cursor:pointer" onclick="wpShowTab(\'seguros\',\'' + clienteId + '\',' + isAdmin + ')">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
      + '<span style="font-size:14px;font-weight:600;color:var(--white)">Seguros</span></div>'
      + '<div style="font-family:Inter,sans-serif;font-size:24px;font-weight:700;color:var(--white)">' + seguros.length + '</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:4px">' + (seguros.length === 0 ? 'Nenhuma apólice' : wpFmtMoeda(totalPremio) + '/mês em prêmios') + '</div>'
      + '</div>';
    // Família summary
    html += '<div class="card" style="padding:20px;cursor:pointer" onclick="wpShowTab(\'familia\',\'' + clienteId + '\',' + isAdmin + ')">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="stroke:var(--ok)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
      + '<span style="font-size:14px;font-weight:600;color:var(--white)">Grupo Familiar</span></div>'
      + '<div style="font-family:Inter,sans-serif;font-size:24px;font-weight:700;color:var(--white)">' + familia.length + '</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:4px">' + (familia.length === 0 ? 'Nenhum membro' : familia.length + ' membro' + (familia.length > 1 ? 's' : '')) + '</div>'
      + '</div>';
    html += '</div>';
    container.innerHTML = html;
  }
  db.collection('clientes').doc(clienteId).collection('wp_objetivos').orderBy('criadoEm','desc').get().then(function(snap) {
    snap.forEach(function(d) { objetivos.push(Object.assign({ id: d.id }, d.data())); });
    checkDone();
  }).catch(function() { checkDone(); });
  db.collection('clientes').doc(clienteId).collection('wp_seguros').orderBy('criadoEm','desc').get().then(function(snap) {
    snap.forEach(function(d) { seguros.push(Object.assign({ id: d.id }, d.data())); });
    checkDone();
  }).catch(function() { checkDone(); });
  db.collection('clientes').doc(clienteId).collection('wp_familia').orderBy('criadoEm','desc').get().then(function(snap) {
    snap.forEach(function(d) { familia.push(Object.assign({ id: d.id }, d.data())); });
    checkDone();
  }).catch(function() { checkDone(); });
}

// ═══════════════════════════════════════════════════════════
// WP MODULE: OBJETIVOS
// ═══════════════════════════════════════════════════════════
var WP_OBJ_TIPOS = ['Aposentadoria','Casa própria','Educação dos filhos','Viagem','Reserva de emergência','Carro','Independência financeira','Outro'];
var WP_OBJ_PRIORIDADES = ['Alta','Média','Baixa'];

function wpRenderObjetivos(container, clienteId, isAdmin) {
  if (!clienteId) { container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">Selecione um cliente</div>'; return; }
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Carregando objetivos...</div>';
  db.collection('clientes').doc(clienteId).collection('wp_objetivos').orderBy('criadoEm','desc').get().then(function(snap) {
    var items = [];
    snap.forEach(function(d) { items.push(Object.assign({ id: d.id }, d.data())); });
    var html = '';
    if (isAdmin) {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
        + '<div style="font-size:15px;font-weight:700;color:var(--white)">Objetivos Financeiros</div>'
        + '<button class="btn-primary" onclick="wpAddObjetivo(\'' + clienteId + '\')" style="padding:6px 14px;font-size:12px">+ Novo objetivo</button>'
        + '</div>';
    }
    if (items.length === 0) {
      html += '<div class="card" style="padding:40px;text-align:center">'
        + '<div style="color:var(--text3);font-size:13px">' + (isAdmin ? 'Nenhum objetivo cadastrado. Clique em "+ Novo objetivo" para adicionar.' : 'Nenhum objetivo definido ainda. Seu consultor vai cadastrar seus objetivos aqui.') + '</div></div>';
    } else {
      items.forEach(function(obj) {
        var prCor = obj.prioridade === 'Alta' ? 'var(--neg)' : (obj.prioridade === 'Média' ? 'var(--caution)' : 'var(--ok)');
        html += '<div class="card" style="padding:16px;margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start">'
          + '<div style="flex:1">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
          + '<span style="font-size:14px;font-weight:600;color:var(--white)">' + (obj.nome || obj.tipo || 'Objetivo') + '</span>'
          + '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:color-mix(in srgb,' + prCor + ' 15%,transparent);color:' + prCor + ';font-weight:600">' + (obj.prioridade || 'Média') + '</span>'
          + '</div>'
          + '<div style="display:flex;gap:20px;flex-wrap:wrap">'
          + '<div><span style="font-size:11px;color:var(--text3)">Valor alvo</span><div style="font-size:14px;font-weight:600;color:var(--pos)">' + wpFmtMoeda(obj.valorAlvo) + '</div></div>'
          + '<div><span style="font-size:11px;color:var(--text3)">Prazo</span><div style="font-size:14px;font-weight:600;color:var(--white)">' + (obj.prazo || 'Não definido') + '</div></div>'
          + (obj.descricao ? '<div style="flex-basis:100%;font-size:12px;color:var(--text2);margin-top:4px">' + obj.descricao + '</div>' : '')
          + '</div></div>';
        if (isAdmin) {
          html += '<button onclick="wpDeleteObjetivo(\'' + clienteId + '\',\'' + obj.id + '\')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;opacity:.5;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.5" title="Remover">x</button>';
        }
        html += '</div></div>';
      });
    }
    container.innerHTML = html;
  });
}

function wpAddObjetivo(clienteId) {
  var html = '<div class="card" style="padding:20px">'
    + '<div style="font-size:14px;font-weight:600;color:var(--white);margin-bottom:14px">Novo Objetivo</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + '<div class="form-group"><label>Tipo</label><select class="form-input" id="wp-obj-tipo">' + WP_OBJ_TIPOS.map(function(t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>'
    + '<div class="form-group"><label>Nome personalizado</label><input class="form-input" id="wp-obj-nome" placeholder="Ex: Apartamento na praia"></div>'
    + '<div class="form-group"><label>Valor alvo (R$)</label><input class="form-input" id="wp-obj-valor" type="number" placeholder="0" step="1000"></div>'
    + '<div class="form-group"><label>Prazo</label><input class="form-input" id="wp-obj-prazo" placeholder="Ex: 2030, 5 anos, etc"></div>'
    + '<div class="form-group"><label>Prioridade</label><select class="form-input" id="wp-obj-prio">' + WP_OBJ_PRIORIDADES.map(function(p) { return '<option>' + p + '</option>'; }).join('') + '</select></div>'
    + '<div class="form-group form-full"><label>Descrição (opcional)</label><input class="form-input" id="wp-obj-desc" placeholder="Detalhes adicionais..."></div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end">'
    + '<button class="btn-secondary" onclick="wpShowTab(\'objetivos\',\'' + clienteId + '\',true)">Cancelar</button>'
    + '<button class="btn-primary" onclick="wpSaveObjetivo(\'' + clienteId + '\')">Salvar</button>'
    + '</div></div>';
  var container = document.getElementById('wp-modules-content');
  if (container) container.innerHTML = html;
}

function wpSaveObjetivo(clienteId) {
  var tipo = document.getElementById('wp-obj-tipo').value;
  var nome = document.getElementById('wp-obj-nome').value.trim() || tipo;
  var data = {
    tipo: tipo,
    nome: nome,
    valorAlvo: Number(document.getElementById('wp-obj-valor').value) || 0,
    prazo: document.getElementById('wp-obj-prazo').value.trim(),
    prioridade: document.getElementById('wp-obj-prio').value,
    descricao: document.getElementById('wp-obj-desc').value.trim(),
    criadoEm: new Date().toISOString()
  };
  db.collection('clientes').doc(clienteId).collection('wp_objetivos').add(data).then(function() {
    wpAuditLog(clienteId, 'create', 'wp_objetivos', '', 'nome', '', nome);
    wpShowTab('objetivos', clienteId, true);
  });
}

function wpDeleteObjetivo(clienteId, docId) {
  if (!confirm('Remover este objetivo?')) return;
  db.collection('clientes').doc(clienteId).collection('wp_objetivos').doc(docId).delete().then(function() {
    wpAuditLog(clienteId, 'delete', 'wp_objetivos', docId, '', '', '');
    wpShowTab('objetivos', clienteId, true);
  });
}

// ═══════════════════════════════════════════════════════════
// WP MODULE: SEGUROS
// ═══════════════════════════════════════════════════════════
var WP_SEGURO_TIPOS = ['Vida','Saúde','Patrimonial','Auto','Responsabilidade Civil','Previdência Privada','Outro'];

function wpRenderSeguros(container, clienteId, isAdmin) {
  if (!clienteId) { container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">Selecione um cliente</div>'; return; }
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Carregando seguros...</div>';
  db.collection('clientes').doc(clienteId).collection('wp_seguros').orderBy('criadoEm','desc').get().then(function(snap) {
    var items = [];
    snap.forEach(function(d) { items.push(Object.assign({ id: d.id }, d.data())); });
    var html = '';
    if (isAdmin) {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
        + '<div style="font-size:15px;font-weight:700;color:var(--white)">Seguros e Proteções</div>'
        + '<button class="btn-primary" onclick="wpAddSeguro(\'' + clienteId + '\')" style="padding:6px 14px;font-size:12px">+ Nova apólice</button>'
        + '</div>';
    }
    if (items.length === 0) {
      html += '<div class="card" style="padding:40px;text-align:center">'
        + '<div style="color:var(--text3);font-size:13px">' + (isAdmin ? 'Nenhum seguro cadastrado.' : 'Nenhum seguro registrado ainda.') + '</div></div>';
    } else {
      var totalPremio = 0;
      items.forEach(function(seg) {
        totalPremio += seg.premioMensal || 0;
        html += '<div class="card" style="padding:16px;margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start">'
          + '<div style="flex:1">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
          + '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:color-mix(in srgb,#a78bfa 15%,transparent);color:#a78bfa;font-weight:600">' + (seg.tipo || 'Seguro') + '</span>'
          + '<span style="font-size:14px;font-weight:600;color:var(--white)">' + (seg.seguradora || '') + '</span>'
          + '</div>'
          + '<div style="display:flex;gap:20px;flex-wrap:wrap">'
          + '<div><span style="font-size:11px;color:var(--text3)">Cobertura</span><div style="font-size:14px;font-weight:600;color:var(--pos)">' + wpFmtMoeda(seg.cobertura) + '</div></div>'
          + '<div><span style="font-size:11px;color:var(--text3)">Prêmio mensal</span><div style="font-size:14px;font-weight:600;color:var(--neg)">' + wpFmtMoeda(seg.premioMensal) + '</div></div>'
          + '<div><span style="font-size:11px;color:var(--text3)">Vencimento</span><div style="font-size:14px;font-weight:600;color:var(--white)">' + (seg.vencimento || 'N/A') + '</div></div>'
          + (seg.observacoes ? '<div style="flex-basis:100%;font-size:12px;color:var(--text2);margin-top:4px">' + seg.observacoes + '</div>' : '')
          + '</div></div>';
        if (isAdmin) {
          html += '<button onclick="wpDeleteSeguro(\'' + clienteId + '\',\'' + seg.id + '\')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;opacity:.5;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.5" title="Remover">x</button>';
        }
        html += '</div></div>';
      });
      html += '<div class="card" style="padding:14px;background:color-mix(in srgb,#a78bfa 5%,transparent);border-color:color-mix(in srgb,#a78bfa 20%,transparent)">'
        + '<div style="display:flex;justify-content:space-between;align-items:center">'
        + '<span style="font-size:13px;font-weight:600;color:#a78bfa">Total em prêmios mensais</span>'
        + '<span style="font-family:Inter,sans-serif;font-size:16px;font-weight:700;color:#a78bfa">' + wpFmtMoeda(totalPremio) + '/mês</span>'
        + '</div></div>';
    }
    container.innerHTML = html;
  });
}

function wpAddSeguro(clienteId) {
  var html = '<div class="card" style="padding:20px">'
    + '<div style="font-size:14px;font-weight:600;color:var(--white);margin-bottom:14px">Nova Apólice de Seguro</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + '<div class="form-group"><label>Tipo</label><select class="form-input" id="wp-seg-tipo">' + WP_SEGURO_TIPOS.map(function(t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>'
    + '<div class="form-group"><label>Seguradora</label><input class="form-input" id="wp-seg-seguradora" placeholder="Ex: Porto Seguro, SulAmérica..."></div>'
    + '<div class="form-group"><label>Cobertura (R$)</label><input class="form-input" id="wp-seg-cobertura" type="number" placeholder="0" step="1000"></div>'
    + '<div class="form-group"><label>Prêmio mensal (R$)</label><input class="form-input" id="wp-seg-premio" type="number" placeholder="0" step="10"></div>'
    + '<div class="form-group"><label>Vencimento</label><input class="form-input" id="wp-seg-venc" placeholder="MM/AAAA ou vigência"></div>'
    + '<div class="form-group"><label>Número da apólice</label><input class="form-input" id="wp-seg-apolice" placeholder="Opcional"></div>'
    + '<div class="form-group form-full"><label>Observações</label><input class="form-input" id="wp-seg-obs" placeholder="Detalhes adicionais..."></div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end">'
    + '<button class="btn-secondary" onclick="wpShowTab(\'seguros\',\'' + clienteId + '\',true)">Cancelar</button>'
    + '<button class="btn-primary" onclick="wpSaveSeguro(\'' + clienteId + '\')">Salvar</button>'
    + '</div></div>';
  var container = document.getElementById('wp-modules-content');
  if (container) container.innerHTML = html;
}

function wpSaveSeguro(clienteId) {
  var data = {
    tipo: document.getElementById('wp-seg-tipo').value,
    seguradora: document.getElementById('wp-seg-seguradora').value.trim(),
    cobertura: Number(document.getElementById('wp-seg-cobertura').value) || 0,
    premioMensal: Number(document.getElementById('wp-seg-premio').value) || 0,
    vencimento: document.getElementById('wp-seg-venc').value.trim(),
    numeroApolice: document.getElementById('wp-seg-apolice').value.trim(),
    observacoes: document.getElementById('wp-seg-obs').value.trim(),
    criadoEm: new Date().toISOString()
  };
  db.collection('clientes').doc(clienteId).collection('wp_seguros').add(data).then(function() {
    wpAuditLog(clienteId, 'create', 'wp_seguros', '', 'tipo', '', data.tipo);
    wpShowTab('seguros', clienteId, true);
  });
}

function wpDeleteSeguro(clienteId, docId) {
  if (!confirm('Remover esta apólice?')) return;
  db.collection('clientes').doc(clienteId).collection('wp_seguros').doc(docId).delete().then(function() {
    wpAuditLog(clienteId, 'delete', 'wp_seguros', docId, '', '', '');
    wpShowTab('seguros', clienteId, true);
  });
}

// ═══════════════════════════════════════════════════════════
// WP MODULE: GRUPO FAMILIAR
// ═══════════════════════════════════════════════════════════
var WP_RELACOES = ['Cônjuge','Filho(a)','Pai','Mãe','Irmão(ã)','Avô(ó)','Neto(a)','Outro'];

function wpRenderFamilia(container, clienteId, isAdmin) {
  if (!clienteId) { container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">Selecione um cliente</div>'; return; }
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Carregando grupo familiar...</div>';
  db.collection('clientes').doc(clienteId).collection('wp_familia').orderBy('criadoEm','desc').get().then(function(snap) {
    var items = [];
    snap.forEach(function(d) { items.push(Object.assign({ id: d.id }, d.data())); });
    var html = '';
    if (isAdmin) {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
        + '<div style="font-size:15px;font-weight:700;color:var(--white)">Grupo Familiar</div>'
        + '<button class="btn-primary" onclick="wpAddFamiliar(\'' + clienteId + '\')" style="padding:6px 14px;font-size:12px">+ Novo membro</button>'
        + '</div>';
    }
    if (items.length === 0) {
      html += '<div class="card" style="padding:40px;text-align:center">'
        + '<div style="color:var(--text3);font-size:13px">' + (isAdmin ? 'Nenhum membro familiar cadastrado.' : 'Nenhum membro familiar registrado ainda.') + '</div></div>';
    } else {
      items.forEach(function(m) {
        var idade = m.dataNasc ? calcIdade(m.dataNasc) : (m.idade || '');
        html += '<div class="card" style="padding:16px;margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between;align-items:center">'
          + '<div style="display:flex;align-items:center;gap:14px">'
          + '<div style="width:40px;height:40px;border-radius:10px;background:color-mix(in srgb,var(--ok) 10%,transparent);display:flex;align-items:center;justify-content:center">'
          + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="stroke:var(--ok)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>'
          + '<div>'
          + '<div style="font-size:14px;font-weight:600;color:var(--white)">' + (m.nome || 'Sem nome') + '</div>'
          + '<div style="font-size:12px;color:var(--text3)">' + (m.relacao || '') + (idade ? ' · ' + idade + ' anos' : '') + '</div>'
          + (m.observacoes ? '<div style="font-size:11px;color:var(--text2);margin-top:2px">' + m.observacoes + '</div>' : '')
          + '</div></div>';
        if (isAdmin) {
          html += '<button onclick="wpDeleteFamiliar(\'' + clienteId + '\',\'' + m.id + '\')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;opacity:.5;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.5" title="Remover">x</button>';
        }
        html += '</div></div>';
      });
    }
    container.innerHTML = html;
  });
}

function calcIdade(dataNasc) {
  if (!dataNasc) return '';
  var parts = dataNasc.split('/');
  var d;
  if (parts.length === 3) {
    d = new Date(parts[2], parts[1] - 1, parts[0]);
  } else {
    d = new Date(dataNasc);
  }
  if (isNaN(d.getTime())) return '';
  var hoje = new Date();
  var age = hoje.getFullYear() - d.getFullYear();
  var m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) age--;
  return age;
}

function wpAddFamiliar(clienteId) {
  var html = '<div class="card" style="padding:20px">'
    + '<div style="font-size:14px;font-weight:600;color:var(--white);margin-bottom:14px">Novo Membro Familiar</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + '<div class="form-group"><label>Nome</label><input class="form-input" id="wp-fam-nome" placeholder="Nome completo"></div>'
    + '<div class="form-group"><label>Relação</label><select class="form-input" id="wp-fam-relacao">' + WP_RELACOES.map(function(r) { return '<option>' + r + '</option>'; }).join('') + '</select></div>'
    + '<div class="form-group"><label>Data de Nascimento</label><input class="form-input" id="wp-fam-nasc" placeholder="DD/MM/AAAA" maxlength="10"></div>'
    + '<div class="form-group"><label>CPF</label><input class="form-input" id="wp-fam-cpf" placeholder="Opcional"></div>'
    + '<div class="form-group form-full"><label>Observações</label><input class="form-input" id="wp-fam-obs" placeholder="Detalhes relevantes..."></div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end">'
    + '<button class="btn-secondary" onclick="wpShowTab(\'familia\',\'' + clienteId + '\',true)">Cancelar</button>'
    + '<button class="btn-primary" onclick="wpSaveFamiliar(\'' + clienteId + '\')">Salvar</button>'
    + '</div></div>';
  var container = document.getElementById('wp-modules-content');
  if (container) container.innerHTML = html;
}

function wpSaveFamiliar(clienteId) {
  var nome = document.getElementById('wp-fam-nome').value.trim();
  if (!nome) { alert('Nome é obrigatório'); return; }
  var data = {
    nome: nome,
    relacao: document.getElementById('wp-fam-relacao').value,
    dataNasc: document.getElementById('wp-fam-nasc').value.trim(),
    cpf: document.getElementById('wp-fam-cpf').value.trim(),
    observacoes: document.getElementById('wp-fam-obs').value.trim(),
    criadoEm: new Date().toISOString()
  };
  db.collection('clientes').doc(clienteId).collection('wp_familia').add(data).then(function() {
    wpAuditLog(clienteId, 'create', 'wp_familia', '', 'nome', '', nome);
    wpShowTab('familia', clienteId, true);
  });
}

function wpDeleteFamiliar(clienteId, docId) {
  if (!confirm('Remover este membro familiar?')) return;
  db.collection('clientes').doc(clienteId).collection('wp_familia').doc(docId).delete().then(function() {
    wpAuditLog(clienteId, 'delete', 'wp_familia', docId, '', '', '');
    wpShowTab('familia', clienteId, true);
  });
}

// ── Audit Trail helper ───────────────────────────────────
function wpAuditLog(clienteId, action, collection, docId, field, oldValue, newValue) {
  if (!clienteId || !db) return;
  var user = typeof currentUser !== 'undefined' ? currentUser : null;
  db.collection('clientes').doc(clienteId).collection('audit_log').add({
    userId: user ? user.uid : '',
    userEmail: user ? user.email : '',
    action: action,
    collection: collection,
    docId: docId || '',
    field: field || '',
    oldValue: oldValue !== undefined ? String(oldValue) : '',
    newValue: newValue !== undefined ? String(newValue) : '',
    timestamp: new Date().toISOString()
  }).catch(function(err) {
    console.warn('Audit log error:', err.message);
  });
}

// ═══════════════════════════════════════════════════════════
// ORÇAMENTO DOMÉSTICO — Fluxo de Caixa Pessoal
// ═══════════════════════════════════════════════════════════

// ── Categorias padrão ────────────────────────────────────
var ORC_CATEGORIAS_PADRAO = [
  { id: 'salario', nome: 'Salário', tipo: 'receita', cor: 'var(--pos)' },
  { id: 'rendimentos', nome: 'Rendimentos', tipo: 'receita', cor: 'var(--ok)' },
  { id: 'outros-rec', nome: 'Outras Receitas', tipo: 'receita', cor: '#a78bfa' },
  { id: 'moradia', nome: 'Moradia', tipo: 'despesa', cor: 'var(--neg)' },
  { id: 'alimentacao', nome: 'Alimentação', tipo: 'despesa', cor: '#f87171' },
  { id: 'transporte', nome: 'Transporte', tipo: 'despesa', cor: '#64748b' },
  { id: 'saude', nome: 'Saúde', tipo: 'despesa', cor: 'var(--pos)' },
  { id: 'educacao', nome: 'Educação', tipo: 'despesa', cor: '#a78bfa' },
  { id: 'lazer', nome: 'Lazer', tipo: 'despesa', cor: 'var(--ok)' },
  { id: 'vestuario', nome: 'Vestuário', tipo: 'despesa', cor: 'var(--neg)' },
  { id: 'seguros-prev', nome: 'Seguros/Previdência', tipo: 'despesa', cor: '#64748b' },
  { id: 'servicos', nome: 'Serviços/Assinaturas', tipo: 'despesa', cor: '#a855f7' },
  { id: 'impostos', nome: 'Impostos/Taxas', tipo: 'despesa', cor: '#f87171' },
  { id: 'outros-desp', nome: 'Outras Despesas', tipo: 'despesa', cor: '#64748b' }
];

var ORC_MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── Estado do Orçamento ──────────────────────────────────
var orcClienteId = null;
var orcMesAtual = null; // 'YYYY-MM'
var orcLancamentos = [];
var orcRecorrencias = [];
var orcCategorias = [];
var orcVisao = 'mensal'; // 'mensal' ou 'anual'

// ── Encadeamento do showView para Orçamento ──────────────
var _origShowViewOrc = showView;
showView = function(v, btn) {
  // Build the view BEFORE calling original so it can activate it
  if (v === 'wp-orcamento' && !document.getElementById('view-wp-orcamento')) {
    buildOrcamentoView();
  }
  _origShowViewOrc(v, btn);
  if (v === 'wp-orcamento') loadOrcamento();
};

// ── Adicionar ao PERFIL_MENUS ────────────────────────────
if (typeof PERFIL_MENUS !== 'undefined') {
  if (PERFIL_MENUS.adm && PERFIL_MENUS.adm.indexOf('wp-orcamento') < 0) {
    PERFIL_MENUS.adm.push('wp-orcamento');
  }
  if (PERFIL_MENUS.gestor && PERFIL_MENUS.gestor.indexOf('wp-orcamento') < 0) {
    PERFIL_MENUS.gestor.push('wp-orcamento');
  }
  if (PERFIL_MENUS.cliente && PERFIL_MENUS.cliente.indexOf('wp-orcamento') < 0) {
    PERFIL_MENUS.cliente.push('wp-orcamento');
  }
}

// ── Adicionar botão Orçamento no sidebar (abaixo de Planejamento) ──
(function addOrcSidebar() {
  function inject() {
    var nav = document.querySelector('.sidebar-nav');
    if (!nav || document.getElementById('nav-orc')) return;
    var wpBtn = document.getElementById('nav-wp');
    if (!wpBtn) return setTimeout(inject, 1000);

    var orcBtn = document.createElement('button');
    orcBtn.className = 'nav-item';
    orcBtn.id = 'nav-orc';
    orcBtn.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span><span>Orçamento</span>';
    orcBtn.onclick = function() { showView('wp-orcamento', orcBtn); };

    // Inserir logo após o botão de Planejamento
    if (wpBtn.nextSibling) {
      nav.insertBefore(orcBtn, wpBtn.nextSibling);
    } else {
      nav.appendChild(orcBtn);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    setTimeout(inject, 600);
  }
})();

// ── Adicionar Orçamento ao portal do cliente ─────────────
(function addOrcClienteNav() {
  var _origShowClienteViewOrc = typeof showClienteView === 'function' ? showClienteView : null;
  if (_origShowClienteViewOrc) {
    showClienteView = function(viewId, btn) {
      // Build the view BEFORE calling original so it can activate it
      if (viewId === 'wp-orcamento' && !document.getElementById('view-wp-orcamento')) {
        loadOrcamentoCliente();
      }
      _origShowClienteViewOrc(viewId, btn);
      if (viewId === 'wp-orcamento') loadOrcamentoCliente();
    };
  }
  function inject() {
    var clienteNav = document.getElementById('cliente-nav');
    if (!clienteNav || document.getElementById('cnav-orc')) return;
    var wpBtn = document.getElementById('cnav-wp');
    if (!wpBtn) return;

    var orcBtn = document.createElement('button');
    orcBtn.className = 'nav-item';
    orcBtn.id = 'cnav-orc';
    orcBtn.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span><span>Orçamento</span>';
    orcBtn.onclick = function() {
      if (typeof showClienteView === 'function') showClienteView('wp-orcamento', orcBtn);
    };
    if (wpBtn.nextSibling) {
      clienteNav.insertBefore(orcBtn, wpBtn.nextSibling);
    } else {
      clienteNav.appendChild(orcBtn);
    }
  }
  var orcNavInterval = setInterval(function() {
    if (document.getElementById('cnav-wp')) { inject(); clearInterval(orcNavInterval); }
  }, 1000);
  setTimeout(function() { clearInterval(orcNavInterval); }, 30000);
})();

// ── Helper: mês atual no formato YYYY-MM ─────────────────
function orcMesStr(date) {
  var d = date || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function orcMesLabel(mesStr) {
  var parts = mesStr.split('-');
  return ORC_MESES[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
}

function orcMesAnterior(mesStr) {
  var parts = mesStr.split('-');
  var m = parseInt(parts[1], 10) - 1;
  var y = parseInt(parts[0], 10);
  if (m < 1) { m = 12; y--; }
  return y + '-' + String(m).padStart(2, '0');
}

function orcMesSeguinte(mesStr) {
  var parts = mesStr.split('-');
  var m = parseInt(parts[1], 10) + 1;
  var y = parseInt(parts[0], 10);
  if (m > 12) { m = 1; y++; }
  return y + '-' + String(m).padStart(2, '0');
}

// ── Gerar ID simples ─────────────────────────────────────
function orcGerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ── Build view Orçamento (admin/gestor) ──────────────────
function buildOrcamentoView() {
  if (document.getElementById('view-wp-orcamento')) return;
  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  var div = document.createElement('div');
  div.className = 'view';
  div.id = 'view-wp-orcamento';
  div.innerHTML = '<div class="page-header">'
    + '<div><div class="page-title">Orçamento Doméstico</div>'
    + '<div class="page-sub">Fluxo de caixa pessoal — receitas, despesas e planejamento</div></div>'
    + '</div>'
    + '<div class="page-content">'
    // Seletor de cliente (igual ao WP)
    + '<div class="card" style="margin-bottom:16px;padding:14px 16px">'
    + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<label style="font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap">Cliente:</label>'
    + '<div style="flex:1;min-width:200px;position:relative">'
    + '<input class="form-input" id="orc-search-cliente" placeholder="Buscar cliente por nome..." oninput="orcFilterClientes()" onfocus="orcFilterClientes()" autocomplete="off" style="width:100%">'
    + '<div id="orc-search-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);max-height:240px;overflow-y:auto;z-index:50;margin-top:4px"></div>'
    + '</div>'
    + '<div id="orc-selected-badge" style="display:none;font-size:13px;color:var(--white);background:var(--border);padding:4px 12px;border-radius:20px;align-items:center;gap:8px"></div>'
    + '</div></div>'
    + '<div id="orc-content">'
    + '<div class="empty" style="padding:60px;text-align:center">'
    + '<div style="margin-bottom:16px;opacity:.6"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>'
    + '<div class="empty-title" style="font-size:16px;margin-bottom:8px">Selecione um cliente acima</div>'
    + '<div style="font-size:13px;color:var(--text3);max-width:400px;margin:0 auto;line-height:1.6">Busque e selecione um cliente para gerenciar o orçamento doméstico.</div>'
    + '</div></div></div>';
  mainContent.appendChild(div);

  document.addEventListener('click', function(e) {
    var results = document.getElementById('orc-search-results');
    var input = document.getElementById('orc-search-cliente');
    if (results && input && !input.contains(e.target) && !results.contains(e.target)) {
      results.style.display = 'none';
    }
  });
}

// ── Filtrar clientes para Orçamento ──────────────────────
function orcFilterClientes() {
  var input = document.getElementById('orc-search-cliente');
  var resultsDiv = document.getElementById('orc-search-results');
  if (!input || !resultsDiv) return;

  var query = (input.value || '').toLowerCase().trim();
  var list = typeof clientes !== 'undefined' ? clientes : [];

  var filtered = list.filter(function(c) {
    if (!query) return true;
    return (c.nome || '').toLowerCase().indexOf(query) >= 0;
  }).slice(0, 15);

  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div style="padding:12px 16px;font-size:12px;color:var(--text3)">Nenhum cliente encontrado</div>';
    resultsDiv.style.display = 'block';
    return;
  }

  var html = '';
  filtered.forEach(function(c) {
    var temWP = clienteTemConsultoria(c);
    var badge = temWP
      ? '<span style="font-size:9px;background:var(--pos);color:#000;padding:1px 6px;border-radius:10px;font-weight:600">Consultoria</span>'
      : '';
    html += '<div onclick="orcSelectCliente(\'' + c.id + '\')" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background=\'var(--border)\'" onmouseout="this.style.background=\'transparent\'">'
      + '<div style="font-size:13px;color:var(--white)">' + (c.nome || 'Sem nome') + '</div>'
      + badge + '</div>';
  });
  resultsDiv.innerHTML = html;
  resultsDiv.style.display = 'block';
}

// ── Selecionar cliente no Orçamento ──────────────────────
function orcSelectCliente(clienteId) {
  orcClienteId = clienteId;
  orcMesAtual = orcMesStr();
  var resultsDiv = document.getElementById('orc-search-results');
  var input = document.getElementById('orc-search-cliente');
  var badge = document.getElementById('orc-selected-badge');
  if (resultsDiv) resultsDiv.style.display = 'none';

  db.collection('clientes').doc(clienteId).get().then(function(doc) {
    if (!doc.exists) return;
    var c = doc.data();
    if (input) { input.value = ''; input.placeholder = c.nome || 'Cliente selecionado'; }
    if (badge) {
      badge.style.display = 'flex';
      badge.innerHTML = '<span style="font-weight:600">' + (c.nome || '') + '</span>'
        + '<span onclick="orcClearCliente()" style="cursor:pointer;opacity:.5;font-size:16px" title="Limpar">&times;</span>';
    }

    // Carregar config + lancamentos do mês
    orcLoadConfig(clienteId, function() {
      orcLoadMes(clienteId, orcMesAtual);
    });
  });
}

function orcClearCliente() {
  orcClienteId = null;
  orcLancamentos = [];
  orcRecorrencias = [];
  var input = document.getElementById('orc-search-cliente');
  var badge = document.getElementById('orc-selected-badge');
  var content = document.getElementById('orc-content');
  if (input) { input.value = ''; input.placeholder = 'Buscar cliente por nome...'; }
  if (badge) badge.style.display = 'none';
  if (content) {
    content.innerHTML = '<div class="empty" style="padding:60px;text-align:center">'
      + '<div style="margin-bottom:16px;opacity:.6"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>'
      + '<div class="empty-title" style="font-size:16px;margin-bottom:8px">Selecione um cliente acima</div>'
      + '<div style="font-size:13px;color:var(--text3);max-width:400px;margin:0 auto;line-height:1.6">Busque e selecione um cliente para gerenciar o orçamento doméstico.</div>'
      + '</div>';
  }
}

// ── Carregar config do orçamento ─────────────────────────
function orcLoadConfig(clienteId, cb) {
  db.collection('clientes').doc(clienteId).collection('orcamento_config').doc('config').get().then(function(doc) {
    if (doc.exists) {
      var data = doc.data();
      orcCategorias = data.categorias || ORC_CATEGORIAS_PADRAO.slice();
      orcRecorrencias = data.recorrencias || [];
    } else {
      orcCategorias = ORC_CATEGORIAS_PADRAO.slice();
      orcRecorrencias = [];
      // Salvar config padrão
      db.collection('clientes').doc(clienteId).collection('orcamento_config').doc('config').set({
        categorias: orcCategorias,
        recorrencias: []
      });
    }
    if (cb) cb();
  }).catch(function() {
    orcCategorias = ORC_CATEGORIAS_PADRAO.slice();
    orcRecorrencias = [];
    if (cb) cb();
  });
}

// ── Carregar lançamentos do mês ──────────────────────────
function orcLoadMes(clienteId, mesStr) {
  orcMesAtual = mesStr;
  db.collection('clientes').doc(clienteId).collection('orcamento').doc(mesStr).get().then(function(doc) {
    if (doc.exists) {
      orcLancamentos = doc.data().lancamentos || [];
    } else {
      orcLancamentos = [];
      // Se tem recorrências, auto-preencher
      if (orcRecorrencias.length > 0) {
        orcRecorrencias.forEach(function(r) {
          orcLancamentos.push({
            id: orcGerarId(),
            descricao: r.descricao,
            valor: r.valor,
            categoria: r.categoria,
            tipo: r.tipo,
            banco: r.banco || '',
            cartao: r.cartao || '',
            parcelado: false,
            parcela: null,
            totalParcelas: null,
            data: mesStr + '-01',
            recorrente: true
          });
        });
      }
    }
    orcRenderDashboard();
  }).catch(function() {
    orcLancamentos = [];
    orcRenderDashboard();
  });
}

// ── Salvar lançamentos do mês ────────────────────────────
function orcSalvarMes() {
  if (!orcClienteId || !orcMesAtual) return;
  var totalRec = 0, totalDesp = 0;
  orcLancamentos.forEach(function(l) {
    if (l.tipo === 'receita') totalRec += l.valor;
    else totalDesp += l.valor;
  });
  db.collection('clientes').doc(orcClienteId).collection('orcamento').doc(orcMesAtual).set({
    lancamentos: orcLancamentos,
    totalReceitas: totalRec,
    totalDespesas: totalDesp,
    saldo: totalRec - totalDesp,
    updatedAt: new Date().toISOString()
  }).then(function() {
    wpAuditLog(orcClienteId, 'update', 'orcamento', orcMesAtual, 'lancamentos', '', orcLancamentos.length + ' itens');
  });
}

// ── Salvar config (categorias + recorrências) ────────────
function orcSalvarConfig() {
  if (!orcClienteId) return;
  db.collection('clientes').doc(orcClienteId).collection('orcamento_config').doc('config').set({
    categorias: orcCategorias,
    recorrencias: orcRecorrencias,
    updatedAt: new Date().toISOString()
  });
}

// ── Formatação de moeda ──────────────────────────────────
function orcFmt(v) {
  return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Render dashboard do Orçamento ────────────────────────
function orcRenderDashboard() {
  var content = document.getElementById('orc-content');
  if (!content) return;

  var totalRec = 0, totalDesp = 0;
  orcLancamentos.forEach(function(l) {
    if (l.tipo === 'receita') totalRec += l.valor;
    else totalDesp += l.valor;
  });
  var saldo = totalRec - totalDesp;
  var saldoColor = saldo >= 0 ? 'var(--pos)' : 'var(--neg)';

  // Totais por categoria (despesas)
  var catTotals = {};
  orcLancamentos.forEach(function(l) {
    if (l.tipo !== 'despesa') return;
    if (!catTotals[l.categoria]) catTotals[l.categoria] = 0;
    catTotals[l.categoria] += l.valor;
  });

  var html = '';

  // Navegação de mês + toggle mensal/anual
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<button class="btn-ghost" onclick="orcNavMes(-1)" style="padding:4px 8px" title="Mês anterior"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
    + '<span style="font-family:Inter,sans-serif;font-size:15px;font-weight:700;color:var(--white);min-width:120px;text-align:center">' + orcMesLabel(orcMesAtual) + '</span>'
    + '<button class="btn-ghost" onclick="orcNavMes(1)" style="padding:4px 8px" title="Próximo mês"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>'
    + '</div>'
    + '<div style="display:flex;gap:4px">'
    + '<button class="' + (orcVisao === 'mensal' ? 'btn-primary' : 'btn-ghost') + '" onclick="orcSetVisao(\'mensal\')" style="padding:4px 12px;font-size:11px">Mensal</button>'
    + '<button class="' + (orcVisao === 'anual' ? 'btn-primary' : 'btn-ghost') + '" onclick="orcSetVisao(\'anual\')" style="padding:4px 12px;font-size:11px">Anual</button>'
    + '</div></div>';

  if (orcVisao === 'anual') {
    orcRenderAnual(content);
    return;
  }

  // KPIs
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">'
    + '<div class="card" style="padding:16px"><div style="font-size:10px;color:var(--text3);text-transform:none;letter-spacing:-.01em;font-weight:600;margin-bottom:4px">Receitas</div><div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:var(--pos)">' + orcFmt(totalRec) + '</div></div>'
    + '<div class="card" style="padding:16px"><div style="font-size:10px;color:var(--text3);text-transform:none;letter-spacing:-.01em;font-weight:600;margin-bottom:4px">Despesas</div><div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:var(--neg)">' + orcFmt(totalDesp) + '</div></div>'
    + '<div class="card" style="padding:16px"><div style="font-size:10px;color:var(--text3);text-transform:none;letter-spacing:-.01em;font-weight:600;margin-bottom:4px">Saldo</div><div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:' + saldoColor + '">' + orcFmt(saldo) + '</div></div>'
    + '</div>';

  // Gráfico donut + legenda por categoria
  if (totalDesp > 0) {
    var catKeys = Object.keys(catTotals).sort(function(a, b) { return catTotals[b] - catTotals[a]; });
    // SVG donut chart
    var donutR = 60, donutStroke = 20, donutCirc = 2 * Math.PI * donutR;
    var donutOffset = 0;
    var donutPaths = '';
    catKeys.forEach(function(catId) {
      var cat = orcCategorias.find(function(c) { return c.id === catId; }) || { cor: '#64748b', nome: catId };
      var pct = catTotals[catId] / totalDesp;
      var dashLen = pct * donutCirc;
      var dashGap = donutCirc - dashLen;
      donutPaths += '<circle cx="80" cy="80" r="' + donutR + '" fill="none" stroke="' + cat.cor + '" stroke-width="' + donutStroke + '" stroke-dasharray="' + dashLen.toFixed(2) + ' ' + dashGap.toFixed(2) + '" stroke-dashoffset="-' + donutOffset.toFixed(2) + '" style="transition:stroke-dasharray .4s"/>';
      donutOffset += dashLen;
    });

    html += '<div class="card" style="padding:20px;margin-bottom:16px">'
      + '<div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:14px">Composição das Despesas</div>'
      + '<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">'
      // Donut SVG
      + '<div style="flex-shrink:0;position:relative;width:160px;height:160px">'
      + '<svg viewBox="0 0 160 160" style="transform:rotate(-90deg);width:160px;height:160px">'
      + donutPaths
      + '</svg>'
      + '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">'
      + '<div style="font-family:Inter,sans-serif;font-size:14px;font-weight:700;color:var(--white)">' + orcFmt(totalDesp) + '</div>'
      + '<div style="font-size:9px;color:var(--text3)">Total Despesas</div>'
      + '</div></div>'
      // Legenda
      + '<div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px">';
    catKeys.forEach(function(catId) {
      var cat = orcCategorias.find(function(c) { return c.id === catId; }) || { cor: '#64748b', nome: catId };
      var pct = (catTotals[catId] / totalDesp * 100);
      html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'
        + '<div style="display:flex;align-items:center;gap:6px">'
        + '<span style="width:10px;height:10px;border-radius:3px;background:' + cat.cor + ';flex-shrink:0"></span>'
        + '<span style="font-size:11px;color:var(--text2)">' + cat.nome + '</span></div>'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span style="font-family:Inter,sans-serif;font-size:11px;color:var(--white)">' + orcFmt(catTotals[catId]) + '</span>'
        + '<span style="font-size:10px;color:var(--text3);min-width:32px;text-align:right">' + pct.toFixed(0) + '%</span>'
        + '</div></div>';
    });
    html += '</div></div></div>';
  }

  // Gráfico donut receitas (se houver mais de 1 categoria)
  var recTotals = {};
  orcLancamentos.forEach(function(l) {
    if (l.tipo !== 'receita') return;
    if (!recTotals[l.categoria]) recTotals[l.categoria] = 0;
    recTotals[l.categoria] += l.valor;
  });
  var recKeys = Object.keys(recTotals);
  if (totalRec > 0 && recKeys.length > 1) {
    recKeys.sort(function(a, b) { return recTotals[b] - recTotals[a]; });
    var donutR2 = 60, donutStroke2 = 20, donutCirc2 = 2 * Math.PI * donutR2;
    var donutOffset2 = 0;
    var donutPaths2 = '';
    recKeys.forEach(function(catId) {
      var cat = orcCategorias.find(function(c) { return c.id === catId; }) || { cor: 'var(--pos)', nome: catId };
      var pct = recTotals[catId] / totalRec;
      var dashLen = pct * donutCirc2;
      var dashGap = donutCirc2 - dashLen;
      donutPaths2 += '<circle cx="80" cy="80" r="' + donutR2 + '" fill="none" stroke="' + cat.cor + '" stroke-width="' + donutStroke2 + '" stroke-dasharray="' + dashLen.toFixed(2) + ' ' + dashGap.toFixed(2) + '" stroke-dashoffset="-' + donutOffset2.toFixed(2) + '"/>';
      donutOffset2 += dashLen;
    });
    html += '<div class="card" style="padding:20px;margin-bottom:16px">'
      + '<div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:14px">Composição das Receitas</div>'
      + '<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">'
      + '<div style="flex-shrink:0;position:relative;width:160px;height:160px">'
      + '<svg viewBox="0 0 160 160" style="transform:rotate(-90deg);width:160px;height:160px">' + donutPaths2 + '</svg>'
      + '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">'
      + '<div style="font-family:Inter,sans-serif;font-size:14px;font-weight:700;color:var(--white)">' + orcFmt(totalRec) + '</div>'
      + '<div style="font-size:9px;color:var(--text3)">Total Receitas</div>'
      + '</div></div>'
      + '<div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px">';
    recKeys.forEach(function(catId) {
      var cat = orcCategorias.find(function(c) { return c.id === catId; }) || { cor: 'var(--pos)', nome: catId };
      var pct = (recTotals[catId] / totalRec * 100);
      html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'
        + '<div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:' + cat.cor + ';flex-shrink:0"></span>'
        + '<span style="font-size:11px;color:var(--text2)">' + cat.nome + '</span></div>'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span style="font-family:Inter,sans-serif;font-size:11px;color:var(--white)">' + orcFmt(recTotals[catId]) + '</span>'
        + '<span style="font-size:10px;color:var(--text3);min-width:32px;text-align:right">' + pct.toFixed(0) + '%</span>'
        + '</div></div>';
    });
    html += '</div></div></div>';
  }

  // Botão adicionar lançamento
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    + '<div style="font-size:13px;font-weight:600;color:var(--white)">Lançamentos</div>'
    + '<div style="display:flex;gap:8px">'
    + '<button class="btn-ghost" onclick="orcAbrirRecorrencias()" style="font-size:11px;padding:4px 10px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Recorrências</button>'
    + '<button class="btn-primary" onclick="orcAbrirModal(null)" style="font-size:11px;padding:4px 12px">+ Lançamento</button>'
    + '</div></div>';

  // Tabela de lançamentos
  if (orcLancamentos.length === 0) {
    html += '<div class="card" style="padding:40px;text-align:center"><div style="font-size:13px;color:var(--text3)">Nenhum lançamento neste mês. Clique em "+ Lançamento" para começar.</div></div>';
  } else {
    // Separar receitas e despesas
    var receitas = orcLancamentos.filter(function(l) { return l.tipo === 'receita'; });
    var despesas = orcLancamentos.filter(function(l) { return l.tipo === 'despesa'; });

    if (receitas.length > 0) {
      html += '<div style="font-size:11px;color:var(--pos);font-weight:600;margin-bottom:6px;text-transform:none;letter-spacing:-.01em;font-weight:600">Receitas</div>';
      html += orcTabelaLancamentos(receitas);
    }
    if (despesas.length > 0) {
      html += '<div style="font-size:11px;color:var(--neg);font-weight:600;margin:12px 0 6px;text-transform:none;letter-spacing:-.01em;font-weight:600">Despesas</div>';
      html += orcTabelaLancamentos(despesas);
    }
  }

  content.innerHTML = html;
}

// ── Tabela de lançamentos ────────────────────────────────
function orcTabelaLancamentos(items) {
  var isReceita = items.length > 0 && items[0].tipo === 'receita';
  var colBancoLabel = isReceita ? 'Banco/Origem' : 'Banco/Cartão';
  var thStyle = 'padding:10px 14px;font-size:10px;color:var(--text3);text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.05em';

  var html = '<div class="card" style="padding:0;overflow:hidden;margin-bottom:8px"><table style="width:100%;border-collapse:collapse">'
    + '<thead><tr style="border-bottom:1px solid var(--border)">'
    + '<th style="' + thStyle + '">Data</th>'
    + '<th style="' + thStyle + '">Descrição</th>'
    + '<th style="' + thStyle + '">Categoria</th>'
    + '<th style="' + thStyle + '">' + colBancoLabel + '</th>'
    + '<th style="' + thStyle + ';text-align:right">Valor</th>'
    + '<th style="padding:10px 14px;width:60px"></th>'
    + '</tr></thead><tbody>';

  items.forEach(function(l) {
    var cat = orcCategorias.find(function(c) { return c.id === l.categoria; }) || { nome: l.categoria, cor: '#64748b' };
    var dataFmt = l.data ? l.data.split('-')[2] + '/' + l.data.split('-')[1] : '--';
    var parcInfo = l.parcelado ? ' <span style="font-size:9px;color:var(--text3)">(' + l.parcela + '/' + l.totalParcelas + ')</span>' : '';
    var recIcon = l.recorrente ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2" style="vertical-align:-1px;margin-left:4px"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/></svg>' : '';
    // Receita: só banco/origem; Despesa: banco + cartão
    var bancoCol = l.tipo === 'receita' ? (l.banco || '—') : (l.cartao ? l.cartao + (l.banco ? ' (' + l.banco + ')' : '') : (l.banco || '—'));

    html += '<tr style="border-bottom:1px solid var(--border)">'
      + '<td style="padding:8px 14px;font-size:12px;color:var(--text2)">' + dataFmt + '</td>'
      + '<td style="padding:8px 14px;font-size:12px;color:var(--white)">' + (l.descricao || '') + parcInfo + recIcon + '</td>'
      + '<td style="padding:8px 14px"><span style="font-size:10px;background:' + cat.cor + '22;color:' + cat.cor + ';padding:2px 8px;border-radius:10px">' + cat.nome + '</span></td>'
      + '<td style="padding:8px 14px;font-size:12px;color:var(--text2)">' + bancoCol + '</td>'
      + '<td style="padding:8px 14px;font-family:Inter,sans-serif;font-size:12px;color:var(--white);text-align:right">' + orcFmt(l.valor) + '</td>'
      + '<td style="padding:8px 14px;text-align:right">'
      + '<button onclick="orcAbrirModal(\'' + l.id + '\')" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--text3)" title="Editar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>'
      + '<button onclick="orcRemover(\'' + l.id + '\')" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--text3);margin-left:4px" title="Excluir"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
      + '</td></tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

// ── Navegação de mês ─────────────────────────────────────
function orcNavMes(dir) {
  if (!orcClienteId) return;
  orcMesAtual = dir < 0 ? orcMesAnterior(orcMesAtual) : orcMesSeguinte(orcMesAtual);
  orcLoadMes(orcClienteId, orcMesAtual);
}

function orcSetVisao(v) {
  orcVisao = v;
  if (v === 'anual') {
    var content = document.getElementById('orc-content');
    if (content) orcRenderAnual(content);
  } else {
    orcRenderDashboard();
  }
}

// ── Visão Anual ──────────────────────────────────────────
function orcRenderAnual(content) {
  var ano = orcMesAtual.split('-')[0];
  content.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<button class="btn-ghost" onclick="orcNavAno(-1)" style="padding:4px 8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
    + '<span style="font-family:Inter,sans-serif;font-size:15px;font-weight:700;color:var(--white);min-width:60px;text-align:center">' + ano + '</span>'
    + '<button class="btn-ghost" onclick="orcNavAno(1)" style="padding:4px 8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>'
    + '</div>'
    + '<div style="display:flex;gap:4px">'
    + '<button class="btn-ghost" onclick="orcSetVisao(\'mensal\')" style="padding:4px 12px;font-size:11px">Mensal</button>'
    + '<button class="btn-primary" onclick="orcSetVisao(\'anual\')" style="padding:4px 12px;font-size:11px">Anual</button>'
    + '</div></div>'
    + '<div class="card" style="padding:0;overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:800px">'
    + '<thead><tr style="border-bottom:1px solid var(--border)">'
    + '<th style="padding:10px 12px;font-size:10px;color:var(--text3);text-align:left;font-weight:600;text-transform:uppercase;position:sticky;left:0;background:var(--card)">Mês</th>'
    + '<th style="padding:10px 12px;font-size:10px;color:var(--pos);text-align:right;font-weight:600;text-transform:uppercase">Receitas</th>'
    + '<th style="padding:10px 12px;font-size:10px;color:var(--neg);text-align:right;font-weight:600;text-transform:uppercase">Despesas</th>'
    + '<th style="padding:10px 12px;font-size:10px;color:var(--text3);text-align:right;font-weight:600;text-transform:uppercase">Saldo</th>'
    + '</tr></thead><tbody id="orc-anual-body">'
    + '<tr><td colspan="4" style="padding:20px;text-align:center;font-size:12px;color:var(--text3)">Carregando...</td></tr>'
    + '</tbody></table></div>';

  // Carregar todos os 12 meses
  var promises = [];
  for (var m = 1; m <= 12; m++) {
    var mesKey = ano + '-' + String(m).padStart(2, '0');
    promises.push(
      db.collection('clientes').doc(orcClienteId).collection('orcamento').doc(mesKey).get()
    );
  }
  Promise.all(promises).then(function(docs) {
    var tbody = document.getElementById('orc-anual-body');
    if (!tbody) return;
    var html = '';
    var totRec = 0, totDesp = 0;
    docs.forEach(function(doc, idx) {
      var mesKey = ano + '-' + String(idx + 1).padStart(2, '0');
      var rec = 0, desp = 0;
      if (doc.exists) {
        rec = doc.data().totalReceitas || 0;
        desp = doc.data().totalDespesas || 0;
      }
      totRec += rec;
      totDesp += desp;
      var saldo = rec - desp;
      var saldoC = saldo >= 0 ? 'var(--pos)' : 'var(--neg)';
      var isCurrentMonth = mesKey === orcMesStr();
      var rowBg = isCurrentMonth ? 'var(--border)' : 'transparent';
      html += '<tr style="border-bottom:1px solid var(--border);background:' + rowBg + ';cursor:pointer" onclick="orcMesAtual=\'' + mesKey + '\';orcSetVisao(\'mensal\');orcLoadMes(orcClienteId,\'' + mesKey + '\')">'
        + '<td style="padding:8px 12px;font-size:12px;color:var(--white);font-weight:' + (isCurrentMonth ? '700' : '400') + ';position:sticky;left:0;background:' + (isCurrentMonth ? 'var(--border)' : 'var(--card)') + '">' + ORC_MESES[idx] + '</td>'
        + '<td style="padding:8px 12px;font-family:Inter,sans-serif;font-size:12px;color:var(--pos);text-align:right">' + (rec ? orcFmt(rec) : '—') + '</td>'
        + '<td style="padding:8px 12px;font-family:Inter,sans-serif;font-size:12px;color:var(--neg);text-align:right">' + (desp ? orcFmt(desp) : '—') + '</td>'
        + '<td style="padding:8px 12px;font-family:Inter,sans-serif;font-size:12px;color:' + saldoC + ';text-align:right;font-weight:600">' + (rec || desp ? orcFmt(saldo) : '—') + '</td>'
        + '</tr>';
    });
    // Linha total
    var totSaldo = totRec - totDesp;
    html += '<tr style="background:var(--border)">'
      + '<td style="padding:10px 12px;font-size:12px;color:var(--white);font-weight:700;position:sticky;left:0;background:var(--border)">TOTAL</td>'
      + '<td style="padding:10px 12px;font-family:Inter,sans-serif;font-size:13px;color:var(--pos);text-align:right;font-weight:700">' + orcFmt(totRec) + '</td>'
      + '<td style="padding:10px 12px;font-family:Inter,sans-serif;font-size:13px;color:var(--neg);text-align:right;font-weight:700">' + orcFmt(totDesp) + '</td>'
      + '<td style="padding:10px 12px;font-family:Inter,sans-serif;font-size:13px;color:' + (totSaldo >= 0 ? 'var(--pos)' : 'var(--neg)') + ';text-align:right;font-weight:700">' + orcFmt(totSaldo) + '</td>'
      + '</tr>';
    tbody.innerHTML = html;
  });
}

function orcNavAno(dir) {
  var parts = orcMesAtual.split('-');
  var y = parseInt(parts[0], 10) + dir;
  orcMesAtual = y + '-' + parts[1];
  var content = document.getElementById('orc-content');
  if (content) orcRenderAnual(content);
}

// ── Modal de lançamento ──────────────────────────────────
function orcAbrirModal(lancId) {
  var existing = lancId ? orcLancamentos.find(function(l) { return l.id === lancId; }) : null;

  var catOptionsRec = orcCategorias.filter(function(c) { return c.tipo === 'receita'; }).map(function(c) {
    return '<option value="' + c.id + '"' + (existing && existing.categoria === c.id ? ' selected' : '') + '>' + c.nome + '</option>';
  }).join('');
  var catOptionsDesp = orcCategorias.filter(function(c) { return c.tipo === 'despesa'; }).map(function(c) {
    return '<option value="' + c.id + '"' + (existing && existing.categoria === c.id ? ' selected' : '') + '>' + c.nome + '</option>';
  }).join('');

  var tipoVal = existing ? existing.tipo : 'despesa';

  var overlay = document.createElement('div');
  overlay.id = 'orc-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:24px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<div style="font-family:Inter,sans-serif;font-size:16px;font-weight:700;color:var(--white)">' + (existing ? 'Editar Lançamento' : 'Novo Lançamento') + '</div>'
    + '<button onclick="document.getElementById(\'orc-modal-overlay\').remove()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px">&times;</button>'
    + '</div>'
    // Tipo
    + '<div class="form-group" style="margin-bottom:12px"><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Tipo</label>'
    + '<div style="display:flex;gap:8px">'
    + '<button type="button" id="orc-tipo-rec" onclick="orcToggleTipo(\'receita\')" class="' + (tipoVal === 'receita' ? 'btn-primary' : 'btn-ghost') + '" style="flex:1;font-size:12px;padding:6px">Receita</button>'
    + '<button type="button" id="orc-tipo-desp" onclick="orcToggleTipo(\'despesa\')" class="' + (tipoVal === 'despesa' ? 'btn-primary' : 'btn-ghost') + '" style="flex:1;font-size:12px;padding:6px">Despesa</button>'
    + '</div><input type="hidden" id="orc-tipo" value="' + tipoVal + '"></div>'
    // Descrição
    + '<div class="form-group" style="margin-bottom:12px"><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Descrição</label>'
    + '<input class="form-input" id="orc-descricao" value="' + (existing ? existing.descricao : '') + '" placeholder="Ex: Supermercado, Aluguel, Salário..." style="width:100%"></div>'
    // Valor + Data
    + '<div style="display:flex;gap:12px;margin-bottom:12px">'
    + '<div class="form-group" style="flex:1"><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Valor (R$)</label>'
    + '<input class="form-input" id="orc-valor" type="number" step="0.01" value="' + (existing ? existing.valor : '') + '" placeholder="0,00" style="width:100%"></div>'
    + '<div class="form-group" style="flex:1"><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Data</label>'
    + '<input class="form-input" id="orc-data" type="date" value="' + (existing ? existing.data : orcMesAtual + '-' + String(new Date().getDate()).padStart(2, '0')) + '" style="width:100%"></div>'
    + '</div>'
    // Categoria
    + '<div class="form-group" style="margin-bottom:12px"><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Categoria</label>'
    + '<select class="form-input" id="orc-categoria" style="width:100%">'
    + '<optgroup label="Receitas" id="orc-cat-rec">' + catOptionsRec + '</optgroup>'
    + '<optgroup label="Despesas" id="orc-cat-desp">' + catOptionsDesp + '</optgroup>'
    + '</select></div>'
    // Banco / Origem (sempre visível)
    + '<div id="orc-banco-wrap" style="display:flex;gap:12px;margin-bottom:12px">'
    + '<div class="form-group" style="flex:1"><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px" id="orc-banco-label">' + (tipoVal === 'receita' ? 'Banco / Origem' : 'Banco') + '</label>'
    + '<input class="form-input" id="orc-banco" value="' + (existing ? (existing.banco || '') : '') + '" placeholder="' + (tipoVal === 'receita' ? 'Ex: Empresa, Investimentos...' : 'Ex: Nubank, Itaú...') + '" style="width:100%"></div>'
    // Cartão (só despesa)
    + '<div class="form-group" id="orc-cartao-wrap" style="flex:1;display:' + (tipoVal === 'receita' ? 'none' : 'block') + '"><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Cartão</label>'
    + '<input class="form-input" id="orc-cartao" value="' + (existing ? (existing.cartao || '') : '') + '" placeholder="Ex: Nubank Visa..." style="width:100%"></div>'
    + '</div>'
    // Parcelado (só despesa)
    + '<div id="orc-parcelado-wrap" style="display:' + (tipoVal === 'receita' ? 'none' : 'flex') + ';gap:12px;align-items:end;margin-bottom:16px">'
    + '<label style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:6px"><input type="checkbox" id="orc-parcelado" ' + (existing && existing.parcelado ? 'checked' : '') + ' onchange="document.getElementById(\'orc-parcelas-wrap\').style.display=this.checked?\'flex\':\'none\'"> Parcelado</label>'
    + '<div id="orc-parcelas-wrap" style="display:' + (existing && existing.parcelado ? 'flex' : 'none') + ';gap:8px;align-items:center">'
    + '<input class="form-input" id="orc-parcela" type="number" min="1" value="' + (existing && existing.parcela ? existing.parcela : '1') + '" style="width:50px;text-align:center" placeholder="1">'
    + '<span style="font-size:11px;color:var(--text3)">de</span>'
    + '<input class="form-input" id="orc-total-parcelas" type="number" min="1" value="' + (existing && existing.totalParcelas ? existing.totalParcelas : '12') + '" style="width:50px;text-align:center" placeholder="12">'
    + '</div></div>'
    // Botão salvar
    + '<div style="display:flex;gap:8px;justify-content:flex-end">'
    + '<button class="btn-ghost" onclick="document.getElementById(\'orc-modal-overlay\').remove()">Cancelar</button>'
    + '<button class="btn-primary" onclick="orcSalvarLancamento(\'' + (lancId || '') + '\')">' + (existing ? 'Salvar' : 'Adicionar') + '</button>'
    + '</div></div>';

  document.body.appendChild(overlay);
}

function orcToggleTipo(tipo) {
  document.getElementById('orc-tipo').value = tipo;
  var btnRec = document.getElementById('orc-tipo-rec');
  var btnDesp = document.getElementById('orc-tipo-desp');
  var cartaoWrap = document.getElementById('orc-cartao-wrap');
  var parceladoWrap = document.getElementById('orc-parcelado-wrap');
  var bancoLabel = document.getElementById('orc-banco-label');
  var bancoInput = document.getElementById('orc-banco');
  if (tipo === 'receita') {
    btnRec.className = 'btn-primary';
    btnDesp.className = 'btn-ghost';
    if (cartaoWrap) cartaoWrap.style.display = 'none';
    if (parceladoWrap) parceladoWrap.style.display = 'none';
    if (bancoLabel) bancoLabel.textContent = 'Banco / Origem';
    if (bancoInput) bancoInput.placeholder = 'Ex: Empresa, Investimentos...';
  } else {
    btnRec.className = 'btn-ghost';
    btnDesp.className = 'btn-primary';
    if (cartaoWrap) cartaoWrap.style.display = 'block';
    if (parceladoWrap) parceladoWrap.style.display = 'flex';
    if (bancoLabel) bancoLabel.textContent = 'Banco';
    if (bancoInput) bancoInput.placeholder = 'Ex: Nubank, Itaú...';
  }
  // Atualizar select de categorias — mostrar só categorias do tipo selecionado
  var catRec = document.getElementById('orc-cat-rec');
  var catDesp = document.getElementById('orc-cat-desp');
  if (catRec) catRec.style.display = tipo === 'receita' ? '' : 'none';
  if (catDesp) catDesp.style.display = tipo === 'despesa' ? '' : 'none';
  // Selecionar primeira opção do tipo ativo
  var sel = document.getElementById('orc-categoria');
  if (sel) {
    var opts = sel.querySelectorAll('optgroup[style*="display"] option, optgroup:not([style]) option');
    var visGroup = tipo === 'receita' ? catRec : catDesp;
    if (visGroup && visGroup.querySelector('option')) sel.value = visGroup.querySelector('option').value;
  }
}

// ── Salvar lançamento ────────────────────────────────────
function orcSalvarLancamento(lancId) {
  var tipo = document.getElementById('orc-tipo').value;
  var descricao = document.getElementById('orc-descricao').value.trim();
  var valor = parseFloat(document.getElementById('orc-valor').value) || 0;
  var data = document.getElementById('orc-data').value;
  var categoria = document.getElementById('orc-categoria').value;
  var banco = document.getElementById('orc-banco').value.trim();
  var cartao = document.getElementById('orc-cartao').value.trim();
  var parcelado = document.getElementById('orc-parcelado').checked;
  var parcela = parcelado ? parseInt(document.getElementById('orc-parcela').value) || 1 : null;
  var totalParcelas = parcelado ? parseInt(document.getElementById('orc-total-parcelas').value) || 1 : null;

  if (!descricao || !valor) {
    alert('Preencha descrição e valor.');
    return;
  }

  var lanc = {
    id: lancId || orcGerarId(),
    descricao: descricao,
    valor: valor,
    categoria: categoria,
    tipo: tipo,
    banco: banco,
    cartao: tipo === 'receita' ? '' : cartao,
    parcelado: tipo === 'receita' ? false : parcelado,
    parcela: tipo === 'receita' ? null : parcela,
    totalParcelas: tipo === 'receita' ? null : totalParcelas,
    data: data,
    recorrente: false
  };

  if (lancId) {
    // Editar existente
    var idx = orcLancamentos.findIndex(function(l) { return l.id === lancId; });
    if (idx >= 0) orcLancamentos[idx] = lanc;
  } else {
    orcLancamentos.push(lanc);
  }

  orcSalvarMes();
  orcRenderDashboard();
  var overlay = document.getElementById('orc-modal-overlay');
  if (overlay) overlay.remove();
}

// ── Remover lançamento ───────────────────────────────────
function orcRemover(lancId) {
  orcLancamentos = orcLancamentos.filter(function(l) { return l.id !== lancId; });
  orcSalvarMes();
  orcRenderDashboard();
}

// ── Modal de Recorrências ────────────────────────────────
function orcAbrirRecorrencias() {
  var overlay = document.createElement('div');
  overlay.id = 'orc-rec-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  var catOptions = orcCategorias.map(function(c) {
    return '<option value="' + c.id + '">' + c.nome + ' (' + (c.tipo === 'receita' ? 'Receita' : 'Despesa') + ')</option>';
  }).join('');

  var listHtml = '';
  if (orcRecorrencias.length === 0) {
    listHtml = '<div style="padding:20px;text-align:center;font-size:12px;color:var(--text3)">Nenhuma recorrência cadastrada.</div>';
  } else {
    orcRecorrencias.forEach(function(r, i) {
      var cat = orcCategorias.find(function(c) { return c.id === r.categoria; }) || { nome: r.categoria, cor: '#64748b' };
      listHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">'
        + '<div><div style="font-size:12px;color:var(--white)">' + r.descricao + '</div>'
        + '<div style="font-size:10px;color:var(--text3)">' + cat.nome + ' · ' + (r.banco || r.cartao || '—') + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span style="font-family:Inter,sans-serif;font-size:12px;color:' + (r.tipo === 'receita' ? 'var(--pos)' : 'var(--neg)') + '">' + orcFmt(r.valor) + '</span>'
        + '<button onclick="orcRemoverRecorrencia(' + i + ')" style="background:none;border:none;cursor:pointer;color:var(--text3)" title="Remover"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
        + '</div></div>';
    });
  }

  overlay.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;padding:24px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
    + '<div style="font-family:Inter,sans-serif;font-size:16px;font-weight:700;color:var(--white)">Recorrências</div>'
    + '<button onclick="document.getElementById(\'orc-rec-overlay\').remove()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px">&times;</button>'
    + '</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-bottom:16px">Lançamentos que se repetem todo mês (salário, aluguel, assinaturas). São preenchidos automaticamente ao abrir um novo mês.</div>'
    // Lista existente
    + '<div style="margin-bottom:16px">' + listHtml + '</div>'
    // Formulário para adicionar
    + '<div style="border-top:1px solid var(--border);padding-top:16px">'
    + '<div style="font-size:12px;font-weight:600;color:var(--white);margin-bottom:10px">Adicionar Recorrência</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:8px">'
    + '<input class="form-input" id="orc-rec-desc" placeholder="Descrição" style="flex:2">'
    + '<input class="form-input" id="orc-rec-valor" type="number" step="0.01" placeholder="Valor" style="flex:1">'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:8px">'
    + '<select class="form-input" id="orc-rec-cat" style="flex:1">' + catOptions + '</select>'
    + '<input class="form-input" id="orc-rec-banco" placeholder="Banco/Cartão" style="flex:1">'
    + '</div>'
    + '<button class="btn-primary" onclick="orcAdicionarRecorrencia()" style="width:100%;font-size:12px">Adicionar</button>'
    + '</div></div>';

  document.body.appendChild(overlay);
}

function orcAdicionarRecorrencia() {
  var desc = document.getElementById('orc-rec-desc').value.trim();
  var valor = parseFloat(document.getElementById('orc-rec-valor').value) || 0;
  var catId = document.getElementById('orc-rec-cat').value;
  var banco = document.getElementById('orc-rec-banco').value.trim();

  if (!desc || !valor) { alert('Preencha descrição e valor.'); return; }

  var cat = orcCategorias.find(function(c) { return c.id === catId; });
  orcRecorrencias.push({
    descricao: desc,
    valor: valor,
    categoria: catId,
    tipo: cat ? cat.tipo : 'despesa',
    banco: banco
  });
  orcSalvarConfig();

  // Fechar e reabrir para atualizar lista
  var overlay = document.getElementById('orc-rec-overlay');
  if (overlay) overlay.remove();
  orcAbrirRecorrencias();
}

function orcRemoverRecorrencia(idx) {
  orcRecorrencias.splice(idx, 1);
  orcSalvarConfig();
  var overlay = document.getElementById('orc-rec-overlay');
  if (overlay) overlay.remove();
  orcAbrirRecorrencias();
}

// ── Load Orçamento (admin/gestor) ────────────────────────
function loadOrcamento() {
  if (!document.getElementById('view-wp-orcamento')) {
    buildOrcamentoView();
  }
  if (orcClienteId) {
    orcLoadMes(orcClienteId, orcMesAtual);
  }
}

// ── Load Orçamento (portal do cliente) ───────────────────
function loadOrcamentoCliente() {
  orcVisao = 'mensal';
  if (!document.getElementById('view-wp-orcamento')) {
    var mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    var div = document.createElement('div');
    div.className = 'view';
    div.id = 'view-wp-orcamento';
    mainContent.appendChild(div);
  }

  var view = document.getElementById('view-wp-orcamento');
  if (!view) return;

  if (typeof currentClienteVinculado === 'undefined' || !currentClienteVinculado) {
    view.innerHTML = wpBloqueioHTML();
    return;
  }

  // Verificar consultoria
  db.collection('clientes').doc(currentClienteVinculado).get().then(function(doc) {
    if (!doc.exists || !clienteTemConsultoria(doc.data())) {
      view.innerHTML = wpBloqueioHTML();
      return;
    }

    // Montar interface do orçamento para o cliente
    orcClienteId = currentClienteVinculado;
    orcMesAtual = orcMesStr();

    view.innerHTML = '<div class="page-header">'
      + '<div><div class="page-title">Orçamento Doméstico</div>'
      + '<div class="page-sub">Controle suas receitas e despesas</div></div>'
      + '</div>'
      + '<div class="page-content"><div id="orc-content"></div></div>';

    orcLoadConfig(currentClienteVinculado, function() {
      orcLoadMes(currentClienteVinculado, orcMesAtual);
    });
  });
}
