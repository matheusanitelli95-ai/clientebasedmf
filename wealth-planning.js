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

    // Botão Meus Clientes
    var wpBtnMC = document.createElement('button');
    wpBtnMC.className = 'nav-item';
    wpBtnMC.id = 'nav-wp-mc';
    wpBtnMC.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span>Meus Clientes</span>';
    wpBtnMC.onclick = function() { wpCurrentTopTab='meus-clientes'; showView('wealth-planning', wpBtnMC); };

    // Botão Planejamento
    var wpBtn = document.createElement('button');
    wpBtn.className = 'nav-item';
    wpBtn.id = 'nav-wp';
    wpBtn.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></span><span>Planejamento</span>';
    wpBtn.onclick = function() { wpCurrentTopTab='planejamento'; showView('wealth-planning', wpBtn); };

    if (ferramentasSection) {
      nav.insertBefore(wpSection, ferramentasSection);
      nav.insertBefore(wpBtnMC, ferramentasSection);
      nav.insertBefore(wpBtn, ferramentasSection);
    } else {
      nav.appendChild(wpSection);
      nav.appendChild(wpBtnMC);
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
    // ── Top-level tabs: Meus Clientes vs Planejamento Individual ──
    + '<div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--border)">'
    + '<button class="wp-top-tab active" data-toptab="meus-clientes" onclick="wpSwitchTopTab(\'meus-clientes\')" style="padding:12px 24px;border:none;background:none;cursor:pointer;font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:var(--blue);border-bottom:2px solid var(--blue);margin-bottom:-2px;transition:all .15s">'
    + '<span style="display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Meus Clientes</span></button>'
    + '<button class="wp-top-tab" data-toptab="planejamento" onclick="wpSwitchTopTab(\'planejamento\')" style="padding:12px 24px;border:none;background:none;cursor:pointer;font-family:Inter,sans-serif;font-size:14px;font-weight:400;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s">'
    + '<span style="display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Planejamento Individual</span></button>'
    + '</div>'
    // ── Panel: Meus Clientes ──
    + '<div id="wp-panel-meus-clientes">'
    + '<div style="text-align:center;padding:40px;color:var(--text3)">Carregando dados dos clientes...</div>'
    + '</div>'
    // ── Panel: Planejamento Individual (current behavior) ──
    + '<div id="wp-panel-planejamento" style="display:none">'
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
    + '</div></div>'
    + '</div>' // end wp-panel-planejamento
    + '</div>'; // end page-content
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
var wpClientesCacheReady = false;

// Carrega todos os clientes do Firestore para o cache.
// Chamado automaticamente quando o WP abre (loadWealthPlanning).
function wpLoadClientesCache() {
  if (wpClientesCacheReady) return; // já carregado
  db.collection('clientes').orderBy('nome').get().then(function(snap) {
    wpClientesCache = [];
    snap.forEach(function(d) {
      wpClientesCache.push(Object.assign({ id: d.id }, d.data()));
    });
    wpClientesCacheReady = true;
    // Se o usuário já clicou no campo, renderizar agora
    var input = document.getElementById('wp-search-cliente');
    var resultsDiv = document.getElementById('wp-search-results');
    if (input && resultsDiv && resultsDiv.style.display === 'block') {
      wpRenderFilteredResults(input.value, resultsDiv);
    }
  });
}

// Filtra clientes — 100% síncrono (cache já carregado).
function wpFilterClientes() {
  var input = document.getElementById('wp-search-cliente');
  var resultsDiv = document.getElementById('wp-search-results');
  if (!input || !resultsDiv) return;

  if (!wpClientesCacheReady) {
    resultsDiv.innerHTML = '<div style="padding:12px 16px;font-size:12px;color:var(--text3)">Carregando clientes...</div>';
    resultsDiv.style.display = 'block';
    return;
  }

  wpRenderFilteredResults(input.value, resultsDiv);
}

function wpRenderFilteredResults(rawQuery, resultsDiv) {
  var query = (rawQuery || '').toLowerCase().trim();

  var filtered = wpClientesCache.filter(function(c) {
    if (!clienteTemConsultoria(c)) return false;
    if (!query) return true;
    var nome = (c.nome || '').toLowerCase();
    var cpf = (c.cpf || '').replace(/\D/g,'');
    var q = query.replace(/\D/g,'');
    // Match each word of the query independently (allows partial/out-of-order matching)
    var words = query.split(/\s+/).filter(function(w){ return w.length > 0; });
    var match = words.every(function(w){ return nome.indexOf(w) >= 0; });
    return match || (q.length >= 3 && cpf.indexOf(q) >= 0);
  }).slice(0, 50);

  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div style="padding:12px 16px;font-size:12px;color:var(--text3)">' + (query ? 'Nenhum cliente encontrado para "' + query + '"' : 'Nenhum cliente com consultoria ativa') + '</div>';
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
      // Setar flag admin ANTES de inserir HTML (script tags em innerHTML não executam)
      wpIsAdminView = true;
      wpContent.innerHTML = '<div style="margin-bottom:12px;padding:8px 14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11px;color:var(--text3);display:flex;align-items:center;gap:8px">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="stroke:var(--pos)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
        + '<span>Você está visualizando o Wealth Planning como o cliente <strong style="color:var(--white)">' + (c.nome || '') + '</strong> veria.</span>'
        + '</div>'
        + wpClienteDashboardHTML(Object.assign({id: wpSelectedClienteId}, c), true);
      // Disparar tab inicial diretamente (setTimeout em script tag não executa via innerHTML)
      setTimeout(function() { wpShowTab('resumo', wpSelectedClienteId, true); }, 100);
      wpFetchRendaOrcamento(wpSelectedClienteId);
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

// ── Top-level tab switch (Meus Clientes vs Planejamento) ──
var wpCurrentTopTab = 'meus-clientes';
function wpSwitchTopTab(tab) {
  wpCurrentTopTab = tab;
  document.querySelectorAll('.wp-top-tab').forEach(function(b) {
    var isActive = b.getAttribute('data-toptab') === tab;
    b.style.fontWeight = isActive ? '600' : '400';
    b.style.color = isActive ? 'var(--blue)' : 'var(--text3)';
    b.style.borderBottom = isActive ? '2px solid var(--blue)' : '2px solid transparent';
    if (isActive) b.classList.add('active'); else b.classList.remove('active');
  });
  var panelMC = document.getElementById('wp-panel-meus-clientes');
  var panelPlan = document.getElementById('wp-panel-planejamento');
  if (panelMC) panelMC.style.display = tab === 'meus-clientes' ? '' : 'none';
  if (panelPlan) panelPlan.style.display = tab === 'planejamento' ? '' : 'none';
  if (tab === 'meus-clientes') wpRenderMeusClientes();
}

// ── Load Wealth Planning (admin/gestor) ──────────────────
function loadWealthPlanning() {
  if (!document.getElementById('view-wealth-planning')) {
    buildWealthPlanningView();
  }
  // Pré-carregar cache de clientes assim que o WP abre
  wpLoadClientesCache();
  // Sincronizar a aba ativa
  wpSwitchTopTab(wpCurrentTopTab);
  // Se já tinha um cliente selecionado no planejamento, recarregar
  if (wpSelectedClienteId && wpCurrentTopTab === 'planejamento') {
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
    wpIsAdminView = false;
    view.innerHTML = wpClienteDashboardHTML(clienteData, false);
    setTimeout(function() { wpShowTab('resumo', currentClienteVinculado, false); }, 100);
    wpFetchRendaOrcamento(currentClienteVinculado);
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
  if (tab === 'bens') wpRenderBens(container, clienteId, isAdmin);
  if (tab === 'previdencia') wpRenderPrevidencia(container, clienteId, isAdmin);
  if (tab === 'diagnostico' && isAdmin) wpRenderDiagnostico(container, clienteId);
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
    + wpKpiCard('Renda mensal', wpFmtMoeda(clienteData.rendaMensal), 'var(--pos)', 'wp-kpi-renda')
    + wpKpiCard('Patrimônio', wpFmtMoeda(clienteData.patrimonioDeclarado || clienteData.patrimonio), 'var(--blue)')
    + wpKpiCard('Dívidas', wpFmtMoeda(clienteData.dividas), 'var(--neg)')
    + wpKpiCard('Dependentes', (clienteData.dependentes || 0) + ' pessoa' + ((clienteData.dependentes || 0) !== 1 ? 's' : ''), 'var(--ok)')
    + '</div>'
    // Layer: MAPEAMENTO
    + '<div style="margin-bottom:6px">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
    + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="stroke:var(--blue)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    + '<span style="font-size:13px;font-weight:600;color:var(--blue);letter-spacing:.3px">MAPEAMENTO</span>'
    + '<span style="font-size:11px;color:var(--text3);margin-left:4px">Coleta de dados</span></div>'
    + '<div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0">'
    + wpTabBtn('resumo', 'Resumo', true)
    + wpTabBtn('objetivos', 'Objetivos', false)
    + wpTabBtn('seguros', 'Seguros', false)
    + wpTabBtn('bens', 'Bens e Patrimônio', false)
    + wpTabBtn('previdencia', 'Previdência', false)
    + wpTabBtn('familia', 'Grupo Familiar', false)
    + (isAdmin ? wpTabBtn('diagnostico', 'Diagnóstico', false) : '')
    + '</div></div>'
    + '<div id="wp-modules-content"></div>'
    // Layer: PLANEJAMENTO (placeholder)
    + '<div style="margin-top:24px">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
    + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="stroke:var(--pos)" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
    + '<span style="font-size:13px;font-weight:600;color:var(--pos);letter-spacing:.3px">PLANEJAMENTO</span>'
    + '<span style="font-size:11px;color:var(--text3);margin-left:4px">Diagnóstico e projeções</span></div>'
    + '<div class="card" style="padding:24px;text-align:center;opacity:.6">'
    + '<div style="font-size:13px;color:var(--text3)">Simulações, projeções patrimoniais e diagnóstico de gaps serão adicionados aqui.</div>'
    + '</div></div>'
    // Layer: ACOMPANHAMENTO (placeholder)
    + '<div style="margin-top:24px">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
    + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="stroke:#a78bfa" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    + '<span style="font-size:13px;font-weight:600;color:#a78bfa;letter-spacing:.3px">ACOMPANHAMENTO</span>'
    + '<span style="font-size:11px;color:var(--text3);margin-left:4px">Monitoramento contínuo</span></div>'
    + '<div class="card" style="padding:24px;text-align:center;opacity:.6">'
    + '<div style="font-size:13px;color:var(--text3)">Alertas, revisões periódicas e indicadores de acompanhamento serão adicionados aqui.</div>'
    + '</div></div>'
    + '</div>'
    + '<script>'
    + 'wpIsAdminView=' + (isAdmin ? 'true' : 'false') + ';'
    + 'setTimeout(function(){wpShowTab("resumo","' + cid + '",' + (isAdmin ? 'true' : 'false') + ')},100);'
    + '</script>';
}

function wpKpiCard(label, value, color, id) {
  return '<div class="card" style="padding:16px">'
    + '<div style="font-size:13px;color:var(--text3);font-weight:400;margin-bottom:6px">' + label + '</div>'
    + '<div' + (id ? ' id="' + id + '"' : '') + ' style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:' + color + '">' + value + '</div>'
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

// ── Puxar renda mensal do Orçamento para o KPI do WP ────
function wpFetchRendaOrcamento(clienteId) {
  if (!clienteId || typeof db === 'undefined') return;
  var now = new Date();
  var mesKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  db.collection('clientes').doc(clienteId).collection('orcamento').doc(mesKey).get().then(function(snap) {
    if (!snap.exists) return;
    var data = snap.data();
    var receitas = data.receitas || [];
    var totalReceitas = receitas.reduce(function(s, r) { return s + (Number(r.valor) || 0); }, 0);
    if (totalReceitas > 0) {
      var el = document.getElementById('wp-kpi-renda');
      if (el) {
        el.textContent = wpFmtMoeda(totalReceitas);
        el.title = 'Valor puxado do Orçamento (' + mesKey + ')';
      }
    }
  }).catch(function() {});
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
// WP MODULE: COMPLETUDE DO MAPEAMENTO
// ═══════════════════════════════════════════════════════════
function wpCalcularCompletude(clienteData, objetivos, seguros, familia) {
  var checks = [];
  // Dados pessoais (30 pts)
  checks.push({ area: 'Dados pessoais', item: 'Renda mensal', ok: !!(clienteData.rendaMensal && clienteData.rendaMensal > 0), pts: 5 });
  checks.push({ area: 'Dados pessoais', item: 'Patrimônio declarado', ok: !!(clienteData.patrimonioDeclarado || clienteData.patrimonio), pts: 5 });
  checks.push({ area: 'Dados pessoais', item: 'Profissão', ok: !!(clienteData.profissao && clienteData.profissao.trim()), pts: 4 });
  checks.push({ area: 'Dados pessoais', item: 'Estado civil', ok: !!(clienteData.estadoCivil && clienteData.estadoCivil.trim()), pts: 4 });
  checks.push({ area: 'Dados pessoais', item: 'Regime de bens', ok: !!(clienteData.regimeBens && clienteData.regimeBens.trim()), pts: 3 });
  checks.push({ area: 'Dados pessoais', item: 'Objetivo financeiro', ok: !!(clienteData.objetivo && clienteData.objetivo.trim()), pts: 4 });
  checks.push({ area: 'Dados pessoais', item: 'Perfil de risco', ok: !!(clienteData.perfil && clienteData.perfil.trim()), pts: 3 });
  checks.push({ area: 'Dados pessoais', item: 'Dependentes informados', ok: (clienteData.dependentes !== undefined && clienteData.dependentes !== null && clienteData.dependentes !== ''), pts: 2 });
  // Objetivos (25 pts)
  checks.push({ area: 'Objetivos', item: 'Ao menos 1 objetivo', ok: objetivos.length >= 1, pts: 10 });
  checks.push({ area: 'Objetivos', item: '3 ou mais objetivos', ok: objetivos.length >= 3, pts: 8 });
  checks.push({ area: 'Objetivos', item: 'Objetivos com prazo definido', ok: objetivos.some(function(o) { return o.prazo && o.prazo.trim(); }), pts: 7 });
  // Seguros (25 pts)
  checks.push({ area: 'Seguros', item: 'Ao menos 1 apólice', ok: seguros.length >= 1, pts: 10 });
  checks.push({ area: 'Seguros', item: 'Seguro de vida cadastrado', ok: seguros.some(function(s) { return s.tipo === 'Vida'; }), pts: 8 });
  checks.push({ area: 'Seguros', item: 'Beneficiários definidos', ok: seguros.some(function(s) { return s.beneficiarios && s.beneficiarios.trim(); }), pts: 7 });
  // Grupo familiar (20 pts)
  checks.push({ area: 'Família', item: 'Ao menos 1 membro', ok: familia.length >= 1, pts: 10 });
  checks.push({ area: 'Família', item: 'Dados financeiros do familiar', ok: familia.some(function(f) { return f.rendaIndividual > 0 || f.patrimonioIndividual > 0; }), pts: 10 });

  var totalPts = 0, earnedPts = 0;
  checks.forEach(function(c) { totalPts += c.pts; if (c.ok) earnedPts += c.pts; });
  var pct = totalPts > 0 ? Math.round((earnedPts / totalPts) * 100) : 0;
  return { pct: pct, checks: checks, earned: earnedPts, total: totalPts };
}

function wpRenderCompletude(completude) {
  var pct = completude.pct;
  var cor = pct >= 80 ? 'var(--pos)' : (pct >= 50 ? 'var(--blue)' : 'var(--caution,#d4a017)');
  var html = '<div class="card" style="padding:20px;margin-bottom:16px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    + '<div style="display:flex;align-items:center;gap:10px">'
    + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="stroke:' + cor + '" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    + '<span style="font-size:14px;font-weight:600;color:var(--white)">Completude do Mapeamento</span></div>'
    + '<span style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:' + cor + '">' + pct + '%</span>'
    + '</div>'
    + '<div style="height:8px;border-radius:4px;background:var(--border);overflow:hidden;margin-bottom:14px">'
    + '<div style="height:100%;width:' + pct + '%;border-radius:4px;background:' + cor + ';transition:width .5s"></div></div>';
  // Grouped checklist
  var areas = {};
  completude.checks.forEach(function(c) {
    if (!areas[c.area]) areas[c.area] = [];
    areas[c.area].push(c);
  });
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">';
  Object.keys(areas).forEach(function(area) {
    var items = areas[area];
    var areaOk = items.filter(function(i) { return i.ok; }).length;
    html += '<div style="padding:10px;border-radius:8px;background:var(--card2)">'
      + '<div style="font-size:12px;font-weight:600;color:var(--white);margin-bottom:6px">' + area + ' <span style="font-weight:400;color:var(--text3)">(' + areaOk + '/' + items.length + ')</span></div>';
    items.forEach(function(c) {
      html += '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:' + (c.ok ? 'var(--pos)' : 'var(--text3)') + ';margin-bottom:3px">'
        + (c.ok ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="stroke:var(--pos)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
                : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="stroke:var(--text3)" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>')
        + c.item + '</div>';
    });
    html += '</div>';
  });
  html += '</div></div>';
  return html;
}

// ═══════════════════════════════════════════════════════════
// WP MODULE: RESUMO
// ═══════════════════════════════════════════════════════════
function wpRenderResumo(container, clienteId, isAdmin) {
  if (!clienteId) { container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">Selecione um cliente</div>'; return; }
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Carregando...</div>';
  var html = '';
  // Load all subcollections + client doc in parallel
  var pending = 4;
  var objetivos = [], seguros = [], familia = [], clienteDoc = {};
  function checkDone() {
    pending--;
    if (pending > 0) return;
    // Completude score
    var completude = wpCalcularCompletude(clienteDoc, objetivos, seguros, familia);
    html += wpRenderCompletude(completude);
    // Save score on client doc (non-blocking)
    if (clienteId && db) {
      db.collection('clientes').doc(clienteId).update({ wpCompletude: completude.pct }).catch(function() {});
    }
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
  db.collection('clientes').doc(clienteId).get().then(function(doc) {
    if (doc.exists) clienteDoc = doc.data();
    checkDone();
  }).catch(function() { checkDone(); });
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
var WP_OBJ_CATEGORIAS = ['Aposentadoria','Educação','Patrimônio','Proteção','Lifestyle','Outro'];

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
          + (obj.categoria ? '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:color-mix(in srgb,var(--blue) 15%,transparent);color:var(--blue);font-weight:600">' + obj.categoria + '</span>' : '')
          + '<div style="display:flex;gap:20px;flex-wrap:wrap">'
          + '<div><span style="font-size:11px;color:var(--text3)">Valor alvo</span><div style="font-size:14px;font-weight:600;color:var(--pos)">' + wpFmtMoeda(obj.valorAlvo) + '</div></div>'
          + '<div><span style="font-size:11px;color:var(--text3)">Prazo</span><div style="font-size:14px;font-weight:600;color:var(--white)">' + (obj.prazo || 'Não definido') + '</div></div>'
          + '</div>'
          + (function() { var p = obj.progressoAtual || 0; return '<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:11px;color:var(--text3)">Progresso</span><span style="font-size:11px;font-weight:600;color:var(--white)">' + p + '%</span></div><div style="height:6px;border-radius:3px;background:var(--border);overflow:hidden"><div style="height:100%;width:' + Math.min(p, 100) + '%;border-radius:3px;background:' + (p >= 100 ? 'var(--pos)' : 'var(--blue)') + ';transition:width .3s"></div></div></div>'; })()
          + (obj.marcos ? '<div style="font-size:11px;color:var(--text2);margin-top:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="stroke:var(--text3);vertical-align:middle;margin-right:4px" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' + obj.marcos + '</div>' : '')
          + (obj.descricao ? '<div style="font-size:12px;color:var(--text2);margin-top:4px">' + obj.descricao + '</div>' : '')
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
    + '<div class="form-group"><label>Categoria</label><select class="form-input" id="wp-obj-cat">' + WP_OBJ_CATEGORIAS.map(function(c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>'
    + '<div class="form-group"><label>Progresso atual (%)</label><input class="form-input" id="wp-obj-progresso" type="number" min="0" max="100" placeholder="0" step="1"></div>'
    + '<div class="form-group form-full"><label>Marcos intermediários</label><input class="form-input" id="wp-obj-marcos" placeholder="Ex: 25% em 2025, 50% em 2027..."></div>'
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
    categoria: document.getElementById('wp-obj-cat').value,
    progressoAtual: Number(document.getElementById('wp-obj-progresso').value) || 0,
    marcos: document.getElementById('wp-obj-marcos').value.trim(),
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
var WP_SEGURO_PERIODICIDADE = ['Mensal','Trimestral','Semestral','Anual'];

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
          + (seg.coberturaIdeal ? '<div><span style="font-size:11px;color:var(--text3)">Cobertura ideal</span><div style="font-size:14px;font-weight:600;color:' + (seg.cobertura >= seg.coberturaIdeal ? 'var(--pos)' : 'var(--caution,#d4a017)') + '">' + wpFmtMoeda(seg.coberturaIdeal) + '</div></div>' : '')
          + '<div><span style="font-size:11px;color:var(--text3)">Prêmio mensal</span><div style="font-size:14px;font-weight:600;color:var(--neg)">' + wpFmtMoeda(seg.premioMensal) + '</div></div>'
          + '<div><span style="font-size:11px;color:var(--text3)">Vencimento</span><div style="font-size:14px;font-weight:600;color:var(--white)">' + (seg.vencimento || 'N/A') + '</div></div>'
          + (seg.beneficiarios ? '<div style="flex-basis:100%;font-size:12px;color:var(--text2);margin-top:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="stroke:var(--text3);vertical-align:middle;margin-right:4px" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Beneficiários: ' + seg.beneficiarios + '</div>' : '')
          + (seg.periodicidadeRevisao || seg.proximaRevisao ? '<div style="flex-basis:100%;font-size:11px;color:var(--text2);margin-top:4px">' + (seg.periodicidadeRevisao ? 'Revisão: ' + seg.periodicidadeRevisao : '') + (seg.proximaRevisao ? ' · Próxima: ' + seg.proximaRevisao : '') + '</div>' : '')
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
    + '<div class="form-group"><label>Cobertura ideal (R$)</label><input class="form-input" id="wp-seg-cobideal" type="number" placeholder="0" step="1000"></div>'
    + '<div class="form-group"><label>Beneficiários</label><input class="form-input" id="wp-seg-benef" placeholder="Ex: Cônjuge 50%, Filhos 50%"></div>'
    + '<div class="form-group"><label>Periodicidade de revisão</label><select class="form-input" id="wp-seg-periodo">' + WP_SEGURO_PERIODICIDADE.map(function(p) { return '<option>' + p + '</option>'; }).join('') + '</select></div>'
    + '<div class="form-group"><label>Próxima revisão</label><input class="form-input" id="wp-seg-proxrev" placeholder="DD/MM/AAAA" maxlength="10"></div>'
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
    coberturaIdeal: Number(document.getElementById('wp-seg-cobideal').value) || 0,
    beneficiarios: document.getElementById('wp-seg-benef').value.trim(),
    periodicidadeRevisao: document.getElementById('wp-seg-periodo').value,
    proximaRevisao: document.getElementById('wp-seg-proxrev').value.trim(),
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
          + '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:600;color:var(--white)">' + (m.nome || 'Sem nome') + '</span>'
          + (m.dependenteIR ? '<span style="font-size:9px;padding:2px 6px;border-radius:8px;background:color-mix(in srgb,var(--blue) 15%,transparent);color:var(--blue);font-weight:600">IR</span>' : '') + '</div>'
          + '<div style="font-size:12px;color:var(--text3)">' + (m.relacao || '') + (idade ? ' · ' + idade + ' anos' : '') + '</div>'
          + ((m.rendaIndividual || m.patrimonioIndividual) ? '<div style="display:flex;gap:14px;margin-top:4px"><span style="font-size:11px;color:var(--text2)">' + (m.rendaIndividual ? 'Renda: ' + wpFmtMoeda(m.rendaIndividual) : '') + '</span>' + (m.patrimonioIndividual ? '<span style="font-size:11px;color:var(--text2)">Patrimônio: ' + wpFmtMoeda(m.patrimonioIndividual) + '</span>' : '') + '</div>' : '')
          + (m.observacoesJuridicas ? '<div style="font-size:11px;color:var(--caution,#d4a017);margin-top:2px">' + m.observacoesJuridicas + '</div>' : '')
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
    + '<div class="form-group"><label>Renda Individual (R$)</label><input class="form-input" id="wp-fam-renda" type="number" placeholder="0" step="100"></div>'
    + '<div class="form-group"><label>Patrimônio Individual (R$)</label><input class="form-input" id="wp-fam-patrimonio" type="number" placeholder="0" step="1000"></div>'
    + '<div class="form-group" style="display:flex;align-items:center;gap:8px;padding-top:22px"><input type="checkbox" id="wp-fam-depir" style="width:16px;height:16px;accent-color:var(--blue)"><label for="wp-fam-depir" style="margin:0;cursor:pointer">Dependente no IR</label></div>'
    + '<div class="form-group"><label>Observações jurídicas</label><input class="form-input" id="wp-fam-obsjur" placeholder="Testamento, inventário, procuração..."></div>'
    + '<div class="form-group form-full"><label>Observações gerais</label><input class="form-input" id="wp-fam-obs" placeholder="Detalhes relevantes..."></div>'
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
    rendaIndividual: Number(document.getElementById('wp-fam-renda').value) || 0,
    patrimonioIndividual: Number(document.getElementById('wp-fam-patrimonio').value) || 0,
    dependenteIR: document.getElementById('wp-fam-depir').checked,
    observacoesJuridicas: document.getElementById('wp-fam-obsjur').value.trim(),
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
// DIAGNÓSTICO — Roteiro de Reunião Digital
// ═══════════════════════════════════════════════════════════

// -- Helpers de campo --
function wpDiagFld(key, label, type, val, opts) {
  var v = (val !== undefined && val !== null) ? String(val) : '';
  var ph = (opts && opts.placeholder) || '';
  var s = 'width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;';
  var wrap = '<div style="margin-bottom:10px;">'
    + (label ? '<label style="font-size:12px;color:var(--text2);display:block;margin-bottom:3px;">' + label + '</label>' : '');
  if (type === 'textarea') {
    return wrap + '<textarea data-diag="' + key + '" rows="' + ((opts && opts.rows) || 3) + '" placeholder="' + ph + '" style="' + s + 'resize:vertical;">' + v + '</textarea></div>';
  }
  if (type === 'select') {
    var sh = '<select data-diag="' + key + '" style="' + s + '"><option value="">Selecionar...</option>';
    ((opts && opts.options) || []).forEach(function(o) { sh += '<option value="' + o + '"' + (v === o ? ' selected' : '') + '>' + o + '</option>'; });
    return wrap + sh + '</select></div>';
  }
  var it = type === 'currency' ? 'number' : (type || 'text');
  var extra = type === 'currency' ? ' step="0.01" placeholder="R$ 0"' : '';
  return wrap + '<input data-diag="' + key + '" type="' + it + '"' + extra + ' value="' + v.replace(/"/g, '&quot;') + '"' + (ph && !extra ? ' placeholder="' + ph + '"' : '') + ' style="' + s + '"/></div>';
}

function wpDiagChks(prefix, items, data) {
  var d = data || {};
  var h = '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:10px;">';
  items.forEach(function(it) {
    var k = prefix + '_' + it.k;
    h += '<label style="display:flex;align-items:center;gap:5px;font-size:13px;color:var(--text);cursor:pointer;">'
      + '<input type="checkbox" data-diag-check="' + k + '"' + (d[k] ? ' checked' : '') + ' style="accent-color:var(--blue);"/> ' + it.l + '</label>';
  });
  return h + '</div>';
}

function wpDiagRadios(key, items, val) {
  var h = '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:10px;">';
  items.forEach(function(it) {
    h += '<label style="display:flex;align-items:center;gap:5px;font-size:13px;color:var(--text);cursor:pointer;">'
      + '<input type="radio" name="diag_' + key + '" data-diag-radio="' + key + '" value="' + it.v + '"' + (val === it.v ? ' checked' : '') + ' style="accent-color:var(--blue);"/> ' + it.l + '</label>';
  });
  return h + '</div>';
}

function wpDiagQ(text) {
  return '<p style="font-size:13px;font-weight:600;color:var(--blue);margin:12px 0 6px;">' + text + '</p>';
}

function wpDiagSub(text) {
  return '<div style="font-size:12px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 6px;padding-bottom:4px;border-bottom:1px solid var(--border);">' + text + '</div>';
}

function wpDiagG2() { return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'; }

// -- Section 1: Contexto e Família --
function wpDiagBuildS1(d) {
  var h = '';
  h += wpDiagChks('s1', [
    {k:'conjuge',l:'Cônjuge/companheiro'}, {k:'filhos',l:'Filhos'}, {k:'dependentes',l:'Dependentes'},
    {k:'paisDep',l:'Pais dependentes'}, {k:'profissao',l:'Profissão'}, {k:'empresa',l:'Empresa/sociedade'},
    {k:'regimeBens',l:'Regime de bens'}, {k:'mudanca',l:'Mudança recente/prevista'}
  ], d);
  h += wpDiagQ('Quem faz parte da estrutura financeira da família hoje?');
  h += wpDiagFld('s1_estrutura', '', 'textarea', d.s1_estrutura, {rows:3, placeholder:'Descreva a composição familiar e financeira...'});
  h += wpDiagQ('O que mudou recentemente na sua vida ou deve mudar nos próximos anos?');
  h += wpDiagFld('s1_mudancas', '', 'textarea', d.s1_mudancas, {rows:3, placeholder:'Mudanças recentes ou previstas...'});
  h += wpDiagFld('s1_notas', 'Anotações do consultor', 'textarea', d.s1_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 2: Objetivos --
function wpDiagBuildS2(d) {
  var h = '';
  h += wpDiagQ('O que você quer que seu dinheiro permita fazer?');
  h += wpDiagFld('s2_oQueQuer', '', 'textarea', d.s2_oQueQuer, {rows:3, placeholder:'Sonhos, metas, desejos...'});
  h += wpDiagSub('Objetivos Mapeados');
  var ts = 'padding:6px 8px;text-align:left;border:1px solid var(--border);';
  h += '<div style="overflow-x:auto;margin-bottom:10px;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
  h += '<tr style="background:var(--card2);"><th style="' + ts + '">Objetivo</th><th style="' + ts + 'width:90px;">Quando?</th><th style="' + ts + 'width:110px;">Valor de hoje</th><th style="' + ts + 'width:90px;">Prioridade</th><th style="' + ts + 'width:60px;">Flex?</th></tr>';
  var cs = 'width:100%;border:none;background:transparent;color:var(--text);font-size:13px;padding:4px;';
  for (var i = 0; i < 3; i++) {
    var p = 's2_obj' + i;
    h += '<tr>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><input data-diag="' + p + '_nome" value="' + (d[p+'_nome']||'').replace(/"/g,'&quot;') + '" style="' + cs + '"/></td>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><input data-diag="' + p + '_quando" value="' + (d[p+'_quando']||'') + '" style="' + cs + '" placeholder="Ex: 2030"/></td>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><input data-diag="' + p + '_valor" type="number" value="' + (d[p+'_valor']||'') + '" style="' + cs + '" placeholder="R$"/></td>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><select data-diag="' + p + '_pri" style="' + cs + '">'
      + '<option value="">-</option><option value="Alta"' + (d[p+'_pri']==='Alta'?' selected':'') + '>Alta</option>'
      + '<option value="Media"' + (d[p+'_pri']==='Media'?' selected':'') + '>Média</option>'
      + '<option value="Baixa"' + (d[p+'_pri']==='Baixa'?' selected':'') + '>Baixa</option></select></td>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><select data-diag="' + p + '_flex" style="' + cs + '">'
      + '<option value="">-</option><option value="S"' + (d[p+'_flex']==='S'?' selected':'') + '>S</option>'
      + '<option value="N"' + (d[p+'_flex']==='N'?' selected':'') + '>N</option></select></td>';
    h += '</tr>';
  }
  h += '</table></div>';
  h += wpDiagQ('Se não der para fazer tudo simultaneamente, o que vem primeiro?');
  h += wpDiagFld('s2_prioridade', '', 'textarea', d.s2_prioridade, {rows:2});
  h += wpDiagQ('Daqui a 10-15 anos, o que precisaria ter acontecido para você dizer: "deu certo"?');
  h += wpDiagFld('s2_visao', '', 'textarea', d.s2_visao, {rows:2});
  h += wpDiagFld('s2_notas', 'Anotações do consultor', 'textarea', d.s2_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 3: Renda e Fluxo Financeiro --
function wpDiagBuildS3(d) {
  var h = '';
  h += wpDiagG2();
  h += wpDiagFld('s3_rendaLiquida', 'Renda líquida familiar', 'currency', d.s3_rendaLiquida);
  h += wpDiagFld('s3_custoVida', 'Custo de vida total', 'currency', d.s3_custoVida);
  h += '</div>' + wpDiagG2();
  h += wpDiagFld('s3_despEssenciais', 'Despesas essenciais', 'currency', d.s3_despEssenciais);
  h += wpDiagFld('s3_aporteEfetivo', 'Aporte efetivo', 'currency', d.s3_aporteEfetivo);
  h += '</div>' + wpDiagG2();
  h += wpDiagFld('s3_superavitTeorico', 'Superávit teórico', 'currency', d.s3_superavitTeorico);
  h += wpDiagFld('s3_superavitReal', 'Superávit real', 'currency', d.s3_superavitReal);
  h += '</div>';
  h += wpDiagSub('Fontes de receita');
  h += wpDiagChks('s3', [
    {k:'salario',l:'Salário'}, {k:'proLabore',l:'Pró-labore'}, {k:'lucros',l:'Lucros'},
    {k:'bonus',l:'Bônus'}, {k:'alugueis',l:'Aluguéis'}, {k:'outrasReceitas',l:'Outras receitas'},
    {k:'rendaVariavel',l:'Renda variável'}, {k:'despExtraord',l:'Despesas extraordinárias'},
    {k:'financiamentos',l:'Financiamentos/dívidas'}
  ], d);
  h += wpDiagQ('Pela conta deveria sobrar aproximadamente R$___. Isso realmente sobra e é investido?');
  h += wpDiagG2();
  h += wpDiagFld('s3_deveriaSobrar', 'Deveria sobrar (R$)', 'currency', d.s3_deveriaSobrar);
  h += '<div style="padding-top:20px;">' + wpDiagRadios('s3_realmenteSobra', [
    {v:'sim',l:'Sim'}, {v:'parcialmente',l:'Parcialmente'}, {v:'nao',l:'Não'}
  ], d.s3_realmenteSobra) + '</div>';
  h += '</div>';
  h += wpDiagFld('s3_notas', 'Anotações do consultor', 'textarea', d.s3_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 4: Reserva e Liquidez --
function wpDiagBuildS4(d) {
  var h = '';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
  h += wpDiagFld('s4_reservaAtual', 'Reserva atual (R$)', 'currency', d.s4_reservaAtual);
  h += wpDiagFld('s4_custoEssencial', 'Custo essencial (R$)', 'currency', d.s4_custoEssencial);
  h += wpDiagFld('s4_coberturaMeses', 'Cobertura (meses)', 'number', d.s4_coberturaMeses);
  h += '</div>';
  h += wpDiagSub('Meta de reserva');
  h += wpDiagChks('s4', [
    {k:'meta3m',l:'3 meses'}, {k:'meta6m',l:'6 meses'}, {k:'meta9m',l:'9 meses'},
    {k:'meta12m',l:'12 meses'}, {k:'metaPersonalizada',l:'Personalizada'}
  ], d);
  h += wpDiagQ('Se amanhã sua renda parasse completamente, por quanto tempo conseguiria manter a família sem vender patrimônio de longo prazo?');
  h += wpDiagFld('s4_rendaParasse', '', 'textarea', d.s4_rendaParasse, {rows:2});
  h += wpDiagSub('Avaliação');
  h += wpDiagRadios('s4_avaliacao', [
    {v:'adequada',l:'Adequada'}, {v:'analisar',l:'Analisar'}, {v:'insuficiente',l:'Possível insuficiência'}
  ], d.s4_avaliacao);
  h += wpDiagFld('s4_notas', 'Anotações do consultor', 'textarea', d.s4_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 5: Patrimônio e Passivos --
function wpDiagBuildS5(d) {
  var h = '';
  h += wpDiagG2();
  h += wpDiagFld('s5_investimentos', 'Investimentos (R$)', 'currency', d.s5_investimentos);
  h += wpDiagFld('s5_imoveis', 'Imóveis (R$)', 'currency', d.s5_imoveis);
  h += '</div>' + wpDiagG2();
  h += wpDiagFld('s5_empresas', 'Empresas (R$)', 'currency', d.s5_empresas);
  h += wpDiagFld('s5_previdencia', 'Previdência (R$)', 'currency', d.s5_previdencia);
  h += '</div>' + wpDiagG2();
  h += wpDiagFld('s5_veiculos', 'Veículos/outros (R$)', 'currency', d.s5_veiculos);
  h += wpDiagFld('s5_dividas', 'Dívidas (R$)', 'currency', d.s5_dividas);
  h += '</div>' + wpDiagG2();
  h += wpDiagFld('s5_ativosTotais', 'Ativos totais (R$)', 'currency', d.s5_ativosTotais);
  h += wpDiagFld('s5_patrimonioLiquido', 'Patrimônio líquido (R$)', 'currency', d.s5_patrimonioLiquido);
  h += '</div>';
  h += wpDiagSub('Alertas patrimoniais');
  h += wpDiagChks('s5', [
    {k:'concentracao',l:'Concentração patrimonial'}, {k:'baixaLiquidez',l:'Baixa liquidez'},
    {k:'exposicaoEmpresarial',l:'Exposição empresarial'}, {k:'passivoRelevante',l:'Passivo relevante'},
    {k:'aprofundar',l:'Aprofundar'}
  ], d);
  h += wpDiagFld('s5_notas', 'Anotações do consultor', 'textarea', d.s5_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 6: Investimentos --
function wpDiagBuildS6(d) {
  var h = '';
  h += wpDiagChks('s6', [
    {k:'carteiraDMF',l:'Carteira DMF'}, {k:'outrasInst',l:'Outras instituições'},
    {k:'exterior',l:'Exterior'}, {k:'previdencia',l:'Previdência'}, {k:'outros',l:'Outros'}
  ], d);
  h += wpDiagFld('s6_patrimonioInvestivel', 'Patrimônio investível aproximado (R$)', 'currency', d.s6_patrimonioInvestivel);
  h += wpDiagQ('Alguma parte desse patrimônio já tem destino definido?');
  h += wpDiagFld('s6_destinoPatrimonio', '', 'textarea', d.s6_destinoPatrimonio, {rows:2});
  h += wpDiagChks('s6d', [
    {k:'reserva',l:'Reserva'}, {k:'imovel',l:'Imóvel'}, {k:'aposentadoria',l:'Aposentadoria'},
    {k:'educacao',l:'Educação'}, {k:'empresa',l:'Empresa'}, {k:'outro',l:'Outro'}
  ], d);
  h += wpDiagQ('Existe algum ativo que você não pretende vender independentemente da análise?');
  h += wpDiagFld('s6_ativoNaoVende', '', 'textarea', d.s6_ativoNaoVende, {rows:2});
  h += wpDiagSub('Perfil do investidor');
  h += wpDiagChks('s6p', [
    {k:'perfilRisco',l:'Perfil de risco levantado'}, {k:'experiencia',l:'Experiência'},
    {k:'liquidez',l:'Liquidez'}, {k:'restricoes',l:'Restrições/preferências'}
  ], d);
  h += wpDiagFld('s6_notas', 'Anotações do consultor', 'textarea', d.s6_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 7: Proteção e Gestão de Riscos --
function wpDiagBuildS7(d) {
  var h = '';
  h += wpDiagChks('s7', [
    {k:'seguroVida',l:'Seguro de vida'}, {k:'invalidez',l:'Invalidez/incapacidade'},
    {k:'saude',l:'Saúde'}, {k:'patrimonial',l:'Patrimonial'},
    {k:'empresarial',l:'Empresarial'}, {k:'previdencia',l:'Previdência'}
  ], d);
  h += wpDiagQ('Se você ficasse impossibilitado de trabalhar por dois anos, o que aconteceria financeiramente?');
  h += wpDiagFld('s7_impossibilitado', '', 'textarea', d.s7_impossibilitado, {rows:3});
  h += wpDiagQ('Se você falecesse hoje, sua família teria liquidez suficiente para reorganizar a vida financeira?');
  h += wpDiagFld('s7_falecimento', '', 'textarea', d.s7_falecimento, {rows:3});
  h += wpDiagFld('s7_gaps', 'Possíveis gaps para análise', 'textarea', d.s7_gaps, {rows:2});
  h += wpDiagFld('s7_notas', 'Anotações do consultor', 'textarea', d.s7_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 8: Independência Financeira / Aposentadoria --
function wpDiagBuildS8(d) {
  var h = '';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
  h += wpDiagFld('s8_idadeAtual', 'Idade atual', 'number', d.s8_idadeAtual);
  h += wpDiagFld('s8_idadeDesejada', 'Idade desejada (aposentadoria)', 'number', d.s8_idadeDesejada);
  h += wpDiagFld('s8_rendaDesejada', 'Renda desejada (R$/mês)', 'currency', d.s8_rendaDesejada);
  h += '</div>';
  h += wpDiagSub('Padrão de vida');
  h += wpDiagRadios('s8_padrao', [
    {v:'manter',l:'Manter padrão'}, {v:'reduzir',l:'Reduzir padrão'}, {v:'aumentar',l:'Aumentar padrão'}
  ], d.s8_padrao);
  h += wpDiagQ('Quando chegar nessa fase, você quer preservar o patrimônio, continuar aumentando-o ou aceita consumir parte dele?');
  h += wpDiagChks('s8', [
    {k:'preservarCompra',l:'Preservar poder de compra'}, {k:'crescimentoReal',l:'Crescimento real'},
    {k:'desacumulacao',l:'Desacumulação planejada'}, {k:'aindaNaoSabe',l:'Ainda não sabe'}
  ], d);
  h += wpDiagSub('Fontes de renda futuras');
  h += wpDiagChks('s8f', [
    {k:'inss',l:'INSS'}, {k:'previdencia',l:'Previdência'}, {k:'alugueis',l:'Aluguéis'},
    {k:'empresa',l:'Empresa'}, {k:'outrasRendas',l:'Outras rendas futuras'}
  ], d);
  h += wpDiagFld('s8_notas', 'Anotações do consultor', 'textarea', d.s8_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 9: Tributário --
function wpDiagBuildS9(d) {
  var h = '';
  h += wpDiagSub('Tipos de renda / tributação');
  h += wpDiagChks('s9', [
    {k:'irpf',l:'IRPF'}, {k:'assalariado',l:'Assalariado'}, {k:'socioEmpresario',l:'Sócio/empresário'},
    {k:'proLabore',l:'Pró-labore'}, {k:'distLucros',l:'Distribuição de lucros'},
    {k:'imoveisAlugueis',l:'Imóveis/aluguéis'}, {k:'exterior',l:'Exterior'},
    {k:'ganhoCapital',l:'Ganho de capital'}, {k:'previdencia',l:'Previdência'},
    {k:'herancaDoacao',l:'Herança/doação'}
  ], d);
  h += wpDiagQ('Existe alguma preocupação tributária ou estrutura já montada por contador/advogado?');
  h += wpDiagFld('s9_preocupacao', '', 'textarea', d.s9_preocupacao, {rows:2});
  h += wpDiagG2();
  h += wpDiagFld('s9_contador', 'Contador', 'text', d.s9_contador);
  h += '<div style="padding-top:20px;">' + wpDiagChks('s9', [{k:'analiseEspecializada',l:'Necessidade de análise especializada'}], d) + '</div>';
  h += '</div>';
  h += wpDiagFld('s9_notas', 'Anotações do consultor', 'textarea', d.s9_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 10: Sucessão e Legado --
function wpDiagBuildS10(d) {
  var h = '';
  h += wpDiagQ('A intenção é aproveitar praticamente tudo em vida ou existe patrimônio que fazem questão de deixar?');
  h += wpDiagRadios('s10_intencao', [
    {v:'consumir',l:'Consumir em vida'}, {v:'legado',l:'Legado'}, {v:'naoDefinido',l:'Ainda não definido'}
  ], d.s10_intencao);
  h += wpDiagSub('Instrumentos existentes');
  h += wpDiagChks('s10', [
    {k:'testamento',l:'Testamento'}, {k:'holding',l:'Holding'}, {k:'previdencia',l:'Previdência'},
    {k:'seguro',l:'Seguro'}, {k:'doacoes',l:'Doações'}, {k:'acordoSocietario',l:'Acordo societário'},
    {k:'nenhuma',l:'Nenhuma'}
  ], d);
  h += wpDiagQ('Se algo acontecesse hoje, você sabe como o patrimônio seria transferido e se a família teria liquidez?');
  h += wpDiagFld('s10_algoAcontecesse', '', 'textarea', d.s10_algoAcontecesse, {rows:2});
  h += wpDiagRadios('s10_familiaLiquidez', [
    {v:'sim',l:'Sim'}, {v:'parcialmente',l:'Parcialmente'}, {v:'nao',l:'Não'}
  ], d.s10_familiaLiquidez);
  h += wpDiagSub('Ações sugeridas');
  h += wpDiagChks('s10a', [
    {k:'revisarBeneficiarios',l:'Revisar beneficiários'}, {k:'analiseSucessoria',l:'Análise sucessória'},
    {k:'advogado',l:'Advogado'}, {k:'contador',l:'Contador'}
  ], d);
  h += wpDiagFld('s10_notas', 'Anotações do consultor', 'textarea', d.s10_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 11: Comportamento Financeiro --
function wpDiagBuildS11(d) {
  var h = '';
  h += wpDiagQ('Qual é sua maior preocupação financeira hoje?');
  h += wpDiagFld('s11_maiorPreocupacao', '', 'textarea', d.s11_maiorPreocupacao, {rows:3});
  h += wpDiagQ('Qual foi sua melhor e sua pior experiência com dinheiro ou investimentos?');
  h += wpDiagFld('s11_melhorPior', '', 'textarea', d.s11_melhorPior, {rows:3});
  h += wpDiagQ('Quando seus investimentos caem bastante, qual costuma ser sua reação?');
  h += wpDiagFld('s11_reacaoQueda', '', 'textarea', d.s11_reacaoQueda, {rows:2});
  h += wpDiagRadios('s11_perfil', [
    {v:'forteAversao',l:'Forte aversão a perda'}, {v:'volatilidade',l:'Volatilidade incomoda'},
    {v:'altaPrev',l:'Alta previsibilidade'}, {v:'impulsivas',l:'Decisões impulsivas'}
  ], d.s11_perfil);
  h += wpDiagSub('Conhecimento financeiro');
  h += wpDiagRadios('s11_conhecimento', [
    {v:'baixo',l:'Baixo'}, {v:'medio',l:'Médio'}, {v:'alto',l:'Alto'}
  ], d.s11_conhecimento);
  h += wpDiagFld('s11_notas', 'Anotações do consultor', 'textarea', d.s11_notas, {rows:2, placeholder:'FATO / DIAGNÓSTICO / AÇÃO'});
  return h;
}

// -- Section 12: Check Final da Reunião --
function wpDiagBuildS12(d) {
  var h = '';
  h += wpDiagSub('Temas abordados na reunião');
  h += wpDiagChks('s12t', [
    {k:'familia',l:'Família'}, {k:'objetivos',l:'Objetivos'}, {k:'fluxo',l:'Fluxo'},
    {k:'reserva',l:'Reserva'}, {k:'patrimonio',l:'Patrimônio'}, {k:'investimentos',l:'Investimentos'},
    {k:'protecao',l:'Proteção'}, {k:'aposentadoria',l:'Aposentadoria'},
    {k:'tributario',l:'Tributário'}, {k:'sucessao',l:'Sucessão'}, {k:'comportamento',l:'Comportamento'}
  ], d);
  h += wpDiagSub('Pendências documentais / informações');
  h += wpDiagChks('s12d', [
    {k:'irpf',l:'IRPF'}, {k:'extratos',l:'Extratos/posições'}, {k:'previdencia',l:'Previdência'},
    {k:'apolices',l:'Apólices'}, {k:'financiamentos',l:'Financiamentos'},
    {k:'docsSocietarios',l:'Docs societários'}, {k:'docsSucessorios',l:'Docs sucessórios'},
    {k:'outros',l:'Outros'}
  ], d);
  h += wpDiagFld('s12_pendenciasOutras', 'Outras pendências', 'textarea', d.s12_pendenciasOutras, {rows:2});
  h += wpDiagSub('Principais pontos para análise');
  for (var i = 1; i <= 4; i++) {
    h += wpDiagFld('s12_ponto' + i, i + '.', 'text', d['s12_ponto' + i], {placeholder:'Ponto para análise...'});
  }
  h += wpDiagSub('Próximas ações');
  var ts = 'padding:6px 8px;text-align:left;border:1px solid var(--border);';
  var cs = 'width:100%;border:none;background:transparent;color:var(--text);font-size:13px;padding:4px;';
  h += '<div style="overflow-x:auto;margin-bottom:10px;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
  h += '<tr style="background:var(--card2);"><th style="' + ts + '">Ação</th><th style="' + ts + 'width:130px;">Responsável</th><th style="' + ts + 'width:110px;">Prazo</th><th style="' + ts + 'width:100px;">Status</th></tr>';
  for (var j = 0; j < 4; j++) {
    var p = 's12_acao' + j;
    h += '<tr>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><input data-diag="' + p + '_desc" value="' + (d[p+'_desc']||'').replace(/"/g,'&quot;') + '" style="' + cs + '" placeholder="Descrição da ação..."/></td>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><input data-diag="' + p + '_resp" value="' + (d[p+'_resp']||'').replace(/"/g,'&quot;') + '" style="' + cs + '"/></td>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><input data-diag="' + p + '_prazo" type="date" value="' + (d[p+'_prazo']||'') + '" style="' + cs + '"/></td>';
    h += '<td style="border:1px solid var(--border);padding:4px;"><select data-diag="' + p + '_status" style="' + cs + '">'
      + '<option value="Pendente"' + (d[p+'_status']!=='Concluido'?' selected':'') + '>Pendente</option>'
      + '<option value="Concluido"' + (d[p+'_status']==='Concluido'?' selected':'') + '>Concluído</option></select></td>';
    h += '</tr>';
  }
  h += '</table></div>';
  h += wpDiagFld('s12_notas', 'Anotações finais', 'textarea', d.s12_notas, {rows:2, placeholder:'Observações gerais...'});
  return h;
}

// -- Toggle accordion --
function wpDiagToggle(sid) {
  var body = document.getElementById('wpDiagBody_' + sid);
  var arrow = document.getElementById('wpDiagArrow_' + sid);
  if (!body) return;
  if (body.style.display === 'none') {
    body.style.display = 'block';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    body.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(-90deg)';
  }
}

// -- Main render --
function wpRenderDiagnostico(container, clienteId) {
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">Carregando diagnóstico...</div>';
  db.collection('clientes').doc(clienteId).collection('wp_diagnostico').doc('atual').get()
    .then(function(snap) {
      var d = snap.exists ? snap.data() : {};
      var h = '';

      // Header
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">';
      h += '<div><div style="font-size:16px;font-weight:700;color:var(--text);">Roteiro de Reunião — Diagnóstico</div>'
        + '<div style="font-size:12px;color:var(--text2);">Material de apoio para reunião com cliente</div></div>';
      h += '<div style="display:flex;gap:8px;align-items:center;">';
      h += '<select data-diag="etapa" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);font-size:12px;">'
        + '<option value="inicial"' + (d.etapa !== 'revisao' ? ' selected' : '') + '>Inicial</option>'
        + '<option value="revisao"' + (d.etapa === 'revisao' ? ' selected' : '') + '>Revisão</option></select>';
      h += '<input data-diag="dataReuniao" type="date" value="' + (d.dataReuniao || '') + '" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);font-size:12px;"/>';
      h += '<button onclick="wpSaveDiagnostico(\'' + clienteId + '\')" style="padding:6px 16px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
        + 'Salvar</button>';
      h += '</div></div>';

      // Sections
      var sections = [
        {id:'s1', t:'1. Contexto e Família', c: wpDiagBuildS1(d)},
        {id:'s2', t:'2. Objetivos', c: wpDiagBuildS2(d)},
        {id:'s3', t:'3. Renda e Fluxo Financeiro', c: wpDiagBuildS3(d)},
        {id:'s4', t:'4. Reserva e Liquidez', c: wpDiagBuildS4(d)},
        {id:'s5', t:'5. Patrimônio e Passivos', c: wpDiagBuildS5(d)},
        {id:'s6', t:'6. Investimentos', c: wpDiagBuildS6(d)},
        {id:'s7', t:'7. Proteção e Gestão de Riscos', c: wpDiagBuildS7(d)},
        {id:'s8', t:'8. Independência Financeira / Aposentadoria', c: wpDiagBuildS8(d)},
        {id:'s9', t:'9. Tributário', c: wpDiagBuildS9(d)},
        {id:'s10', t:'10. Sucessão e Legado', c: wpDiagBuildS10(d)},
        {id:'s11', t:'11. Comportamento Financeiro', c: wpDiagBuildS11(d)},
        {id:'s12', t:'12. Check Final da Reunião', c: wpDiagBuildS12(d)}
      ];

      sections.forEach(function(s) {
        h += '<div style="margin-bottom:8px;border:1px solid var(--border);border-radius:10px;overflow:hidden;">';
        h += '<div onclick="wpDiagToggle(\'' + s.id + '\')" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--blue);color:#fff;cursor:pointer;font-size:14px;font-weight:600;user-select:none;">';
        h += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" id="wpDiagArrow_' + s.id + '" style="transition:transform 0.2s;transform:rotate(-90deg);flex-shrink:0;"><path d="M6 9l6 6 6-6"/></svg>';
        h += s.t + '</div>';
        h += '<div id="wpDiagBody_' + s.id + '" style="display:none;padding:14px;">' + s.c + '</div>';
        h += '</div>';
      });

      // Bottom save
      h += '<div style="text-align:center;margin-top:16px;">';
      h += '<button onclick="wpSaveDiagnostico(\'' + clienteId + '\')" style="padding:10px 32px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
        + 'Salvar Diagnóstico</button>';
      h += '</div>';

      // Legend
      h += '<div style="margin-top:16px;padding:12px;background:var(--card2);border-radius:8px;display:flex;gap:20px;flex-wrap:wrap;">';
      h += '<div style="font-size:11px;color:var(--text2);"><strong style="color:var(--blue);">FATO</strong> — Informação observada</div>';
      h += '<div style="font-size:11px;color:var(--text2);"><strong style="color:#16a34a;">DIAGNÓSTICO</strong> — Conclusão técnica</div>';
      h += '<div style="font-size:11px;color:var(--text2);"><strong style="color:#d4a017;">AÇÃO</strong> — Próximo passo</div>';
      h += '</div>';

      container.innerHTML = h;
    })
    .catch(function(err) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">Erro ao carregar diagnóstico: ' + err.message + '</div>';
    });
}

// -- Save diagnostico --
function wpSaveDiagnostico(clienteId) {
  var data = {};
  // Collect text/number/date/select inputs
  document.querySelectorAll('[data-diag]').forEach(function(el) {
    var key = el.getAttribute('data-diag');
    var val = el.value;
    if (el.type === 'number' && val) val = parseFloat(val);
    data[key] = val || '';
  });
  // Collect checkboxes
  document.querySelectorAll('[data-diag-check]').forEach(function(el) {
    data[el.getAttribute('data-diag-check')] = el.checked;
  });
  // Collect radio buttons (only checked ones)
  document.querySelectorAll('[data-diag-radio]:checked').forEach(function(el) {
    data[el.getAttribute('data-diag-radio')] = el.value;
  });
  // Metadata
  var user = typeof currentUser !== 'undefined' ? currentUser : null;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = user ? user.email : '';

  var btn = event && event.target ? event.target : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  db.collection('clientes').doc(clienteId).collection('wp_diagnostico').doc('atual').set(data, {merge: true})
    .then(function() {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M20 6L9 17l-5-5"/></svg>Salvo!'; }
      setTimeout(function() {
        if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Salvar';
      }, 2000);
      wpAuditLog(clienteId, 'update', 'wp_diagnostico', 'atual', '', '', JSON.stringify({keys: Object.keys(data).length}));
    })
    .catch(function(err) {
      alert('Erro ao salvar: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
    });
}

// ═══════════════════════════════════════════════════════════
// ORÇAMENTO DOMÉSTICO — Fluxo de Caixa Pessoal
// ═══════════════════════════════════════════════════════════

// ── Categorias padrão ────────────────────────────────────
var ORC_CATEGORIAS_PADRAO = [
  { id: 'salario', nome: 'Salário', tipo: 'receita', cor: '#22c55e' },
  { id: 'rendimentos', nome: 'Rendimentos', tipo: 'receita', cor: '#0ea5e9' },
  { id: 'prolabore', nome: 'Pró-labore', tipo: 'receita', cor: '#16a34a' },
  { id: 'alugueis', nome: 'Aluguéis', tipo: 'receita', cor: '#2563eb' },
  { id: 'dividendos', nome: 'Dividendos', tipo: 'receita', cor: '#059669' },
  { id: 'freelance', nome: 'Freelance / Extras', tipo: 'receita', cor: '#7c3aed' },
  { id: 'outros-rec', nome: 'Outras Receitas', tipo: 'receita', cor: '#a78bfa' },
  { id: 'moradia', nome: 'Moradia', tipo: 'despesa', cor: '#1a3a5c' },
  { id: 'alimentacao', nome: 'Alimentação', tipo: 'despesa', cor: '#b45309' },
  { id: 'transporte', nome: 'Transporte', tipo: 'despesa', cor: '#64748b' },
  { id: 'saude', nome: 'Saúde', tipo: 'despesa', cor: '#0ea5e9' },
  { id: 'educacao', nome: 'Educação', tipo: 'despesa', cor: '#a78bfa' },
  { id: 'lazer', nome: 'Lazer', tipo: 'despesa', cor: '#14b8a6' },
  { id: 'vestuario', nome: 'Vestuário', tipo: 'despesa', cor: '#d4a017' },
  { id: 'seguros-prev', nome: 'Seguros/Previdência', tipo: 'despesa', cor: '#64748b' },
  { id: 'servicos', nome: 'Serviços/Assinaturas', tipo: 'despesa', cor: '#a855f7' },
  { id: 'impostos', nome: 'Impostos/Taxas', tipo: 'despesa', cor: '#92400e' },
  { id: 'cartao-credito', nome: 'Cartão de Crédito', tipo: 'despesa', cor: '#b45309' },
  { id: 'emprestimos', nome: 'Empréstimos / Dívidas', tipo: 'despesa', cor: '#92400e' },
  { id: 'pets', nome: 'Pets', tipo: 'despesa', cor: '#f59e0b' },
  { id: 'presentes', nome: 'Presentes / Doações', tipo: 'despesa', cor: '#ec4899' },
  { id: 'viagens', nome: 'Viagens', tipo: 'despesa', cor: '#06b6d4' },
  { id: 'investimentos', nome: 'Investimentos / Aportes', tipo: 'despesa', cor: '#1a3a5c' },
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
    var nome = (c.nome || '').toLowerCase();
    var cpf = (c.cpf || '').replace(/\D/g,'');
    var q = query.replace(/\D/g,'');
    var words = query.split(/\s+/).filter(function(w){ return w.length > 0; });
    var match = words.every(function(w){ return nome.indexOf(w) >= 0; });
    return match || (q.length >= 3 && cpf.indexOf(q) >= 0);
  }).slice(0, 50);

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

// ── Helper: resolve category color (strip var() for SVG) ─
function orcResolveColor(cor) {
  if (!cor) return '#64748b';
  if (cor.indexOf('var(') < 0) return cor;
  var tmp = document.createElement('div');
  tmp.style.color = cor;
  document.body.appendChild(tmp);
  var resolved = getComputedStyle(tmp).color;
  document.body.removeChild(tmp);
  // Convert rgb(r,g,b) to hex
  var m = resolved.match(/(\d+)/g);
  if (m && m.length >= 3) return '#' + ((1 << 24) + (parseInt(m[0]) << 16) + (parseInt(m[1]) << 8) + parseInt(m[2])).toString(16).slice(1);
  return cor;
}

// ── Theme-aware colors for orçamento ─────────────────────
function orcThemeColors() {
  var light = document.body.classList.contains('light-mode');
  return {
    light: light,
    green: light ? '#16a34a' : '#22c55e',
    navy: light ? '#1a3a5c' : '#4a90c2',
    neg: light ? '#92400e' : '#b45309',
    text1: light ? '#1e293b' : '#e2e8f0',
    text2: light ? '#475569' : '#94a3b8',
    text3: light ? '#94a3b8' : '#64748b',
    cardBdr: light ? 'border:1px solid #e2e8f0;' : '',
    inputBg: light ? '#f8fafc' : 'var(--card2)',
    inputBdr: light ? '#e2e8f0' : 'var(--border)',
    rowHover: light ? '#f1f5f9' : 'var(--border)',
    totalRowBg: light ? '#f0fdf4' : 'rgba(34,197,94,.08)',
    totalRowBgNavy: light ? '#eff6ff' : 'rgba(74,144,194,.08)'
  };
}

// ── Render dashboard do Orçamento ────────────────────────
function orcRenderDashboard() {
  var content = document.getElementById('orc-content');
  if (!content) return;

  var tc = orcThemeColors();
  var totalRec = 0, totalDesp = 0;
  orcLancamentos.forEach(function(l) {
    if (l.tipo === 'receita') totalRec += l.valor;
    else totalDesp += l.valor;
  });
  var saldo = totalRec - totalDesp;
  var taxaPoup = totalRec > 0 ? ((saldo / totalRec) * 100) : 0;

  var html = '';

  // ── Navegação de mês + toggle + recorrências ──────────
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<button class="btn-ghost" onclick="orcNavMes(-1)" style="padding:4px 8px" title="Mês anterior"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
    + '<span style="font-family:Inter,sans-serif;font-size:15px;font-weight:700;color:'+tc.text1+';min-width:120px;text-align:center">' + orcMesLabel(orcMesAtual) + '</span>'
    + '<button class="btn-ghost" onclick="orcNavMes(1)" style="padding:4px 8px" title="Próximo mês"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>'
    + '</div>'
    + '<div style="display:flex;gap:4px;align-items:center">'
    + '<button class="btn-ghost" onclick="orcAbrirRecorrencias()" style="font-size:11px;padding:4px 10px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Recorrências</button>'
    + '<span style="width:1px;height:16px;background:var(--border);margin:0 4px"></span>'
    + '<button class="' + (orcVisao === 'mensal' ? 'btn-primary' : 'btn-ghost') + '" onclick="orcSetVisao(\'mensal\')" style="padding:4px 12px;font-size:11px">Mensal</button>'
    + '<button class="' + (orcVisao === 'anual' ? 'btn-primary' : 'btn-ghost') + '" onclick="orcSetVisao(\'anual\')" style="padding:4px 12px;font-size:11px">Anual</button>'
    + '</div></div>';

  if (orcVisao === 'anual') {
    orcRenderAnual(content);
    return;
  }

  // ── 4 KPI Cards ───────────────────────────────────────
  var saldoColor = saldo >= 0 ? tc.green : tc.neg;
  var taxaColor = taxaPoup >= 0 ? tc.green : tc.neg;
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">';
  // Receita Total
  html += '<div class="card" style="padding:14px;'+tc.cardBdr+'">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+tc.green+'" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
    + '<span style="font-size:10px;color:'+tc.text3+';font-weight:600">Receita Total</span></div>'
    + '<div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:'+tc.green+'">' + orcFmt(totalRec) + '</div></div>';
  // Despesa Total
  html += '<div class="card" style="padding:14px;'+tc.cardBdr+'">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+tc.navy+'" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>'
    + '<span style="font-size:10px;color:'+tc.text3+';font-weight:600">Despesa Total</span></div>'
    + '<div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:'+tc.navy+'">' + orcFmt(totalDesp) + '</div></div>';
  // Saldo Livre
  html += '<div class="card" style="padding:14px;'+tc.cardBdr+'">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+saldoColor+'" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
    + '<span style="font-size:10px;color:'+tc.text3+';font-weight:600">Saldo Livre</span></div>'
    + '<div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:'+saldoColor+'">' + orcFmt(saldo) + '</div></div>';
  // Taxa de Poupança
  html += '<div class="card" style="padding:14px;'+tc.cardBdr+'">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+taxaColor+'" stroke-width="2"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-0.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2"/><path d="M2 9.1C2.3 6.5 5 4.5 8 4.5c1.7 0 3.2.5 4.3 1.5"/></svg>'
    + '<span style="font-size:10px;color:'+tc.text3+';font-weight:600">Taxa de Poupança</span></div>'
    + '<div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:'+taxaColor+'">' + (taxaPoup >= 0 ? '' : '') + taxaPoup.toFixed(1) + '%</div></div>';
  html += '</div>';

  // ── Spreadsheet Tables: Receitas (left) + Despesas (right) ──
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';

  // RECEITAS TABLE
  html += orcBuildSpreadsheet('receita', tc);
  // DESPESAS TABLE
  html += orcBuildSpreadsheet('despesa', tc);

  html += '</div>';

  // ── Charts Row: Donut + Bar ────────────────────────────
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';

  // Donut Chart - Despesas por Categoria
  html += orcBuildDonut(tc);

  // Bar Chart placeholder (filled async)
  html += '<div class="card" style="padding:20px;'+tc.cardBdr+'">'
    + '<div style="font-size:12px;font-weight:600;color:'+tc.text1+';margin-bottom:14px">Receita vs Despesa — Últimos 6 meses</div>'
    + '<div id="orc-bar-chart" style="height:200px;display:flex;align-items:center;justify-content:center"><span style="font-size:11px;color:'+tc.text3+'">Carregando...</span></div>'
    + '</div>';

  html += '</div>';

  // ── Resumo Consolidado ─────────────────────────────────
  html += orcBuildResumo(tc);

  content.innerHTML = html;

  // Load bar chart async
  orcLoadBarChart(tc);
}

// ── Build Spreadsheet Table ──────────────────────────────
function orcBuildSpreadsheet(tipo, tc) {
  var isRec = tipo === 'receita';
  var items = orcLancamentos.filter(function(l) { return l.tipo === tipo; });
  var cats = orcCategorias.filter(function(c) { return c.tipo === tipo; });
  var accentColor = isRec ? tc.green : tc.navy;
  var totalRowBg = isRec ? tc.totalRowBg : tc.totalRowBgNavy;
  var total = 0;
  items.forEach(function(l) { total += l.valor; });

  var thS = 'padding:6px 8px;font-size:9px;color:'+tc.text3+';text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap';

  var html = '<div class="card" style="padding:0;overflow:hidden;'+tc.cardBdr+'">';
  // Header
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border)">'
    + '<div style="font-size:12px;font-weight:700;color:'+accentColor+'">' + (isRec ? 'Receitas' : 'Despesas') + '</div>'
    + '</div>';
  // Table
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:400px">'
    + '<thead><tr style="border-bottom:1px solid var(--border);background:'+(tc.light?'#f8fafc':'var(--card2)')+'">'
    + '<th style="'+thS+'">Categoria</th>'
    + '<th style="'+thS+'">Descrição</th>'
    + '<th style="'+thS+'">Banco/Cartão</th>'
    + '<th style="'+thS+';text-align:right">Valor R$</th>'
    + '<th style="'+thS+';text-align:center;width:50px">Rec.</th>';
  if (!isRec) {
    html += '<th style="'+thS+';text-align:center;width:40px">Fixo</th>';
    html += '<th style="'+thS+';text-align:center;width:40px">Pago</th>';
  }
  html += '<th style="'+thS+';width:80px">Data</th>';
  html += '<th style="width:28px"></th></tr></thead><tbody>';

  // Rows
  items.forEach(function(l, idx) {
    var catOpts = '';
    cats.forEach(function(c) {
      catOpts += '<option value="'+c.id+'"'+(l.categoria===c.id?' selected':'')+'>'+c.nome+'</option>';
    });
    html += '<tr style="border-bottom:1px solid var(--border)" data-lancid="'+l.id+'">'
      // Categoria dropdown
      + '<td style="padding:4px 6px"><select onchange="orcInlineEdit(\''+l.id+'\',\'categoria\',this.value)" style="font-size:11px;padding:3px 4px;border:1px solid '+tc.inputBdr+';border-radius:4px;background:'+tc.inputBg+';color:'+tc.text1+';width:100%;cursor:pointer;outline:none">'
      + catOpts + '</select></td>'
      // Descrição
      + '<td style="padding:4px 6px"><input value="'+((l.descricao||'').replace(/"/g,'&quot;'))+'" onchange="orcInlineEdit(\''+l.id+'\',\'descricao\',this.value)" style="font-size:11px;padding:3px 6px;border:1px solid '+tc.inputBdr+';border-radius:4px;background:'+tc.inputBg+';color:'+tc.text1+';width:100%;outline:none" placeholder="Descrição..."></td>'
      // Banco/Cartão
      + '<td style="padding:4px 6px"><input value="'+((l.banco||'').replace(/"/g,'&quot;'))+'" onchange="orcInlineEdit(\''+l.id+'\',\'banco\',this.value)" style="font-size:11px;padding:3px 6px;border:1px solid '+tc.inputBdr+';border-radius:4px;background:'+tc.inputBg+';color:'+tc.text1+';width:90px;outline:none" placeholder="Banco..."></td>'
      // Valor
      + '<td style="padding:4px 6px"><input type="number" step="0.01" value="'+(l.valor||'')+'" onchange="orcInlineEdit(\''+l.id+'\',\'valor\',this.value)" style="font-size:11px;padding:3px 6px;border:1px solid '+tc.inputBdr+';border-radius:4px;background:'+tc.inputBg+';color:'+tc.text1+';width:90px;text-align:right;outline:none;font-family:Inter,sans-serif" placeholder="0,00"></td>'
      // Recorrente checkbox (for all types now)
      + '<td style="text-align:center;padding:4px"><input type="checkbox" '+(l.recorrente?'checked':'')+' onchange="orcInlineEdit(\''+l.id+'\',\'recorrente\',this.checked)" style="accent-color:'+tc.green+';cursor:pointer"></td>';
    if (!isRec) {
      html += '<td style="text-align:center;padding:4px"><input type="checkbox" '+(l.fixo?'checked':'')+' onchange="orcInlineEdit(\''+l.id+'\',\'fixo\',this.checked)" style="accent-color:'+tc.navy+';cursor:pointer"></td>';
      html += '<td style="text-align:center;padding:4px"><input type="checkbox" '+(l.pago?'checked':'')+' onchange="orcInlineEdit(\''+l.id+'\',\'pago\',this.checked)" style="accent-color:'+tc.green+';cursor:pointer"></td>';
    }
    // Data
    html += '<td style="padding:4px 6px"><input type="date" value="'+(l.data||'')+'" onchange="orcInlineEdit(\''+l.id+'\',\'data\',this.value)" style="font-size:10px;padding:2px 4px;border:1px solid '+tc.inputBdr+';border-radius:4px;background:'+tc.inputBg+';color:'+tc.text1+';outline:none;width:80px"></td>';
    // Delete button
    html += '<td style="padding:4px 6px;text-align:center"><button onclick="orcRemover(\''+l.id+'\')" style="background:none;border:none;cursor:pointer;color:'+tc.text3+';padding:2px" title="Excluir"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  // Total row
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:'+totalRowBg+';border-top:2px solid '+accentColor+'">'
    + '<span style="font-size:11px;font-weight:700;color:'+accentColor+'">TOTAL</span>'
    + '<span style="font-family:Inter,sans-serif;font-size:14px;font-weight:700;color:'+accentColor+'">'+orcFmt(total)+'</span></div>';
  // Add row button
  html += '<div style="padding:8px 14px;border-top:1px solid var(--border)">'
    + '<button onclick="orcAddInline(\''+tipo+'\')" style="background:none;border:1px dashed var(--border);border-radius:4px;padding:6px 12px;font-size:11px;color:'+tc.text3+';cursor:pointer;width:100%;transition:border-color .15s,color .15s" onmouseover="this.style.borderColor=\''+accentColor+'\';this.style.color=\''+accentColor+'\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\''+tc.text3+'\'">'
    + '+ Adicionar linha</button></div>';
  html += '</div>';
  return html;
}

// ── Inline edit handler ──────────────────────────────────
function orcInlineEdit(lancId, field, value) {
  var lanc = orcLancamentos.find(function(l) { return l.id === lancId; });
  if (!lanc) return;
  if (field === 'valor') {
    lanc.valor = parseFloat(value) || 0;
  } else if (field === 'recorrente' || field === 'fixo' || field === 'pago') {
    lanc[field] = !!value;
  } else {
    lanc[field] = value;
  }
  orcSalvarMes();
  // Debounced KPI update — avoids losing input focus on every keystroke
  clearTimeout(window._orcKpiTimer);
  window._orcKpiTimer = setTimeout(function() { orcUpdateKPIsOnly(); }, 600);
}

// ── Update KPIs + totals without re-rendering tables ─────
function orcUpdateKPIsOnly() {
  var tc = orcThemeColors();
  var totalRec = 0, totalDesp = 0;
  orcLancamentos.forEach(function(l) {
    if (l.tipo === 'receita') totalRec += l.valor;
    else totalDesp += l.valor;
  });
  // Update total rows in spreadsheet tables
  var cards = document.querySelectorAll('#orc-content .card');
  // Full re-render only for KPIs, donut, bar chart, resumo is expensive
  // So we just do a lightweight re-render after a short delay
  orcRenderDashboard();
}

// ── Add inline row ───────────────────────────────────────
function orcAddInline(tipo) {
  var cats = orcCategorias.filter(function(c) { return c.tipo === tipo; });
  var defaultCat = cats.length > 0 ? cats[0].id : '';
  orcLancamentos.push({
    id: orcGerarId(),
    descricao: '',
    valor: 0,
    categoria: defaultCat,
    tipo: tipo,
    banco: '',
    cartao: '',
    parcelado: false,
    parcela: null,
    totalParcelas: null,
    data: orcMesAtual + '-' + String(new Date().getDate()).padStart(2, '0'),
    recorrente: false,
    fixo: false,
    pago: false
  });
  orcSalvarMes();
  orcRenderDashboard();
}

// ── Build Donut Chart ────────────────────────────────────
function orcBuildDonut(tc) {
  var catTotals = {};
  var totalDesp = 0;
  orcLancamentos.forEach(function(l) {
    if (l.tipo !== 'despesa') return;
    if (!catTotals[l.categoria]) catTotals[l.categoria] = 0;
    catTotals[l.categoria] += l.valor;
    totalDesp += l.valor;
  });

  var html = '<div class="card" style="padding:20px;'+tc.cardBdr+'">'
    + '<div style="font-size:12px;font-weight:600;color:'+tc.text1+';margin-bottom:14px">Despesas por Categoria</div>';

  if (totalDesp <= 0) {
    html += '<div style="height:200px;display:flex;align-items:center;justify-content:center;font-size:11px;color:'+tc.text3+'">Sem despesas neste mês</div></div>';
    return html;
  }

  var catKeys = Object.keys(catTotals).sort(function(a, b) { return catTotals[b] - catTotals[a]; });
  var donutR = 55, donutStroke = 18, donutCirc = 2 * Math.PI * donutR;
  var donutOffset = 0;
  var donutPaths = '';
  catKeys.forEach(function(catId) {
    var cat = orcCategorias.find(function(c) { return c.id === catId; }) || { cor: '#64748b', nome: catId };
    var resolvedCor = orcResolveColor(cat.cor);
    var pct = catTotals[catId] / totalDesp;
    var dashLen = pct * donutCirc;
    var dashGap = donutCirc - dashLen;
    donutPaths += '<circle cx="70" cy="70" r="'+donutR+'" fill="none" stroke="'+resolvedCor+'" stroke-width="'+donutStroke+'" stroke-dasharray="'+dashLen.toFixed(2)+' '+dashGap.toFixed(2)+'" stroke-dashoffset="-'+donutOffset.toFixed(2)+'" style="transition:stroke-dasharray .4s"/>';
    donutOffset += dashLen;
  });

  html += '<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">'
    + '<div style="flex-shrink:0;position:relative;width:140px;height:140px">'
    + '<svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:140px;height:140px">' + donutPaths + '</svg>'
    + '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">'
    + '<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:700;color:'+tc.text1+'">' + orcFmt(totalDesp) + '</div>'
    + '<div style="font-size:8px;color:'+tc.text3+'">Total</div>'
    + '</div></div>'
    + '<div style="flex:1;min-width:140px;display:flex;flex-direction:column;gap:5px">';
  catKeys.forEach(function(catId) {
    var cat = orcCategorias.find(function(c) { return c.id === catId; }) || { cor: '#64748b', nome: catId };
    var resolvedCor = orcResolveColor(cat.cor);
    var pct = (catTotals[catId] / totalDesp * 100);
    html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px">'
      + '<div style="display:flex;align-items:center;gap:5px">'
      + '<span style="width:8px;height:8px;border-radius:2px;background:'+resolvedCor+';flex-shrink:0"></span>'
      + '<span style="font-size:10px;color:'+tc.text2+'">'+cat.nome+'</span></div>'
      + '<span style="font-size:9px;color:'+tc.text3+'">'+pct.toFixed(0)+'%</span>'
      + '</div>';
  });
  html += '</div></div></div>';
  return html;
}

// ── Load Bar Chart (async — fetches last 6 months) ───────
function orcLoadBarChart(tc) {
  var container = document.getElementById('orc-bar-chart');
  if (!container || !orcClienteId) return;

  // Build 6-month range ending at current month
  var months = [];
  var m = orcMesAtual;
  for (var i = 0; i < 6; i++) {
    months.unshift(m);
    m = orcMesAnterior(m);
  }

  var promises = months.map(function(mesKey) {
    return db.collection('clientes').doc(orcClienteId).collection('orcamento').doc(mesKey).get();
  });

  Promise.all(promises).then(function(docs) {
    var data = [];
    docs.forEach(function(doc, idx) {
      var rec = 0, desp = 0;
      if (doc.exists) {
        rec = doc.data().totalReceitas || 0;
        desp = doc.data().totalDespesas || 0;
      }
      data.push({ mes: months[idx], rec: rec, desp: desp, saldo: rec - desp });
    });

    var maxVal = 1;
    data.forEach(function(d) { maxVal = Math.max(maxVal, d.rec, d.desp); });

    var W = 380, H = 180, padL = 10, padR = 10, padT = 10, padB = 30;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;
    var barGroupW = chartW / 6;
    var barW = barGroupW * 0.3;

    var svg = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
    // Grid lines
    for (var g = 0; g <= 4; g++) {
      var gy = padT + (chartH / 4) * g;
      svg += '<line x1="'+padL+'" y1="'+gy+'" x2="'+(W-padR)+'" y2="'+gy+'" stroke="'+(tc.light?'#e2e8f0':'#334155')+'" stroke-width="0.5"/>';
    }
    // Bars + saldo points
    var saldoPoints = [];
    data.forEach(function(d, i) {
      var cx = padL + barGroupW * i + barGroupW / 2;
      var recH = (d.rec / maxVal) * chartH;
      var despH = (d.desp / maxVal) * chartH;
      // Receita bar (left)
      svg += '<rect x="'+(cx - barW - 1)+'" y="'+(padT + chartH - recH)+'" width="'+barW+'" height="'+recH+'" rx="2" fill="'+tc.green+'" opacity="0.85"/>';
      // Despesa bar (right)
      svg += '<rect x="'+(cx + 1)+'" y="'+(padT + chartH - despH)+'" width="'+barW+'" height="'+despH+'" rx="2" fill="'+tc.navy+'" opacity="0.85"/>';
      // Month label
      var parts = d.mes.split('-');
      var label = ORC_MESES[parseInt(parts[1],10)-1];
      svg += '<text x="'+cx+'" y="'+(H - 6)+'" text-anchor="middle" style="font-size:9px;fill:'+tc.text3+';font-family:Inter,sans-serif">'+label+'</text>';
      // Saldo line point
      var sY = d.saldo >= 0 ? padT + chartH - (d.saldo / maxVal) * chartH : padT + chartH + (Math.abs(d.saldo) / maxVal) * chartH;
      sY = Math.max(padT, Math.min(padT + chartH, sY));
      saldoPoints.push(cx + ',' + sY);
    });
    // Saldo line
    if (saldoPoints.length > 1) {
      svg += '<polyline points="'+saldoPoints.join(' ')+'" fill="none" stroke="'+(tc.light?'#d4a017':'#fbbf24')+'" stroke-width="1.5" stroke-dasharray="4 2"/>';
      saldoPoints.forEach(function(pt) {
        svg += '<circle cx="'+pt.split(',')[0]+'" cy="'+pt.split(',')[1]+'" r="3" fill="'+(tc.light?'#d4a017':'#fbbf24')+'"/>';
      });
    }
    svg += '</svg>';

    // Legend
    svg += '<div style="display:flex;gap:16px;justify-content:center;margin-top:8px">'
      + '<div style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:'+tc.green+'"></span><span style="font-size:9px;color:'+tc.text3+'">Receita</span></div>'
      + '<div style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:'+tc.navy+'"></span><span style="font-size:9px;color:'+tc.text3+'">Despesa</span></div>'
      + '<div style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:2px;background:'+(tc.light?'#d4a017':'#fbbf24')+';border-radius:1px"></span><span style="font-size:9px;color:'+tc.text3+'">Saldo</span></div>'
      + '</div>';

    container.innerHTML = svg;
  }).catch(function() {
    container.innerHTML = '<span style="font-size:11px;color:'+tc.text3+'">Erro ao carregar dados</span>';
  });
}

// ── Build Resumo Consolidado ─────────────────────────────
function orcBuildResumo(tc) {
  // Build per-category summary: budget (recorrencias) vs actual (lancamentos)
  var catSummary = {};
  // From recorrências as "orçado" (budget)
  orcRecorrencias.forEach(function(r) {
    if (!catSummary[r.categoria]) catSummary[r.categoria] = { orcado: 0, realizado: 0, tipo: r.tipo };
    catSummary[r.categoria].orcado += r.valor;
    catSummary[r.categoria].tipo = r.tipo;
  });
  // From lancamentos as "realizado" (actual)
  orcLancamentos.forEach(function(l) {
    if (!catSummary[l.categoria]) catSummary[l.categoria] = { orcado: 0, realizado: 0, tipo: l.tipo };
    catSummary[l.categoria].realizado += l.valor;
    catSummary[l.categoria].tipo = l.tipo;
  });

  var catIds = Object.keys(catSummary).sort(function(a, b) {
    var sa = catSummary[a], sb = catSummary[b];
    if (sa.tipo !== sb.tipo) return sa.tipo === 'receita' ? -1 : 1;
    return sb.realizado - sa.realizado;
  });

  var thS = 'padding:8px 10px;font-size:9px;color:'+tc.text3+';text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.04em';

  var html = '<div class="card" style="padding:0;overflow:hidden;'+tc.cardBdr+'">'
    + '<div style="padding:14px 14px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">'
    + '<div style="font-size:12px;font-weight:700;color:'+tc.text1+'">Resumo Consolidado</div>'
    + '<div style="font-size:9px;color:'+tc.text3+'">Orçado baseado nas recorrências</div>'
    + '</div>'
    + '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
    + '<thead><tr style="border-bottom:1px solid var(--border);background:'+(tc.light?'#f8fafc':'var(--card2)')+'">'
    + '<th style="'+thS+'">Categoria</th>'
    + '<th style="'+thS+';text-align:right">Orçado</th>'
    + '<th style="'+thS+';text-align:right">Realizado</th>'
    + '<th style="'+thS+';text-align:right">Diferença</th>'
    + '<th style="'+thS+';text-align:right;width:50px">%</th>'
    + '<th style="'+thS+';width:100px">Progresso</th>'
    + '<th style="'+thS+';text-align:center;width:60px">Status</th>'
    + '</tr></thead><tbody>';

  if (catIds.length === 0) {
    html += '<tr><td colspan="7" style="padding:20px;text-align:center;font-size:11px;color:'+tc.text3+'">Cadastre recorrências para ver o resumo consolidado</td></tr>';
  } else {
    catIds.forEach(function(catId) {
      var s = catSummary[catId];
      var cat = orcCategorias.find(function(c) { return c.id === catId; }) || { nome: catId, cor: '#64748b' };
      var resolvedCor = orcResolveColor(cat.cor);
      var diff = s.realizado - s.orcado;
      var pct = s.orcado > 0 ? (s.realizado / s.orcado * 100) : (s.realizado > 0 ? 100 : 0);
      var barPct = Math.min(pct, 100);

      // Status logic: for despesas, over-budget is bad; for receitas, over is good
      var status, statusColor, statusBg;
      if (s.tipo === 'despesa') {
        if (pct <= 80) { status = 'OK'; statusColor = tc.green; statusBg = tc.green + '18'; }
        else if (pct <= 100) { status = 'Alerta'; statusColor = '#d4a017'; statusBg = '#d4a01718'; }
        else { status = 'Acima'; statusColor = tc.neg; statusBg = tc.neg + '18'; }
      } else {
        if (pct >= 100) { status = 'OK'; statusColor = tc.green; statusBg = tc.green + '18'; }
        else if (pct >= 80) { status = 'Alerta'; statusColor = '#d4a017'; statusBg = '#d4a01718'; }
        else { status = 'Baixo'; statusColor = tc.neg; statusBg = tc.neg + '18'; }
      }

      var diffColor = s.tipo === 'despesa' ? (diff <= 0 ? tc.green : tc.neg) : (diff >= 0 ? tc.green : tc.neg);
      var barColor = s.tipo === 'despesa' ? (pct > 100 ? tc.neg : tc.navy) : tc.green;

      html += '<tr style="border-bottom:1px solid var(--border)">'
        + '<td style="padding:8px 10px"><div style="display:flex;align-items:center;gap:6px">'
        + '<span style="width:8px;height:8px;border-radius:2px;background:'+resolvedCor+';flex-shrink:0"></span>'
        + '<span style="font-size:11px;color:'+tc.text1+'">'+cat.nome+'</span>'
        + '<span style="font-size:8px;color:'+tc.text3+'">'+(s.tipo==='receita'?'R':'D')+'</span>'
        + '</div></td>'
        + '<td style="padding:8px 10px;font-family:Inter,sans-serif;font-size:11px;color:'+tc.text2+';text-align:right">'+(s.orcado>0?orcFmt(s.orcado):'—')+'</td>'
        + '<td style="padding:8px 10px;font-family:Inter,sans-serif;font-size:11px;color:'+tc.text1+';text-align:right;font-weight:600">'+orcFmt(s.realizado)+'</td>'
        + '<td style="padding:8px 10px;font-family:Inter,sans-serif;font-size:11px;color:'+diffColor+';text-align:right">'+(diff>=0?'+':'')+orcFmt(diff)+'</td>'
        + '<td style="padding:8px 10px;font-family:Inter,sans-serif;font-size:10px;color:'+tc.text2+';text-align:right">'+pct.toFixed(0)+'%</td>'
        + '<td style="padding:8px 10px"><div style="width:100%;height:6px;background:'+(tc.light?'#e2e8f0':'#334155')+';border-radius:3px;overflow:hidden"><div style="width:'+barPct+'%;height:100%;background:'+barColor+';border-radius:3px;transition:width .3s"></div></div></td>'
        + '<td style="padding:8px 10px;text-align:center"><span style="font-size:9px;font-weight:600;color:'+statusColor+';background:'+statusBg+';padding:2px 8px;border-radius:10px">'+status+'</span></td>'
        + '</tr>';
    });
  }

  html += '</tbody></table></div></div>';
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

  // Orçamento disponível para TODOS os clientes (sem check de consultoria)
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
}

// ═══════════════════════════════════════════════════════════
// WP MODULE: BENS E PATRIMÔNIO
// ═══════════════════════════════════════════════════════════
var WP_BENS_TIPOS = [
  { id: 'imovel_casa', label: 'Casa', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { id: 'imovel_apto', label: 'Apartamento', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="12" y1="6" x2="12" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>' },
  { id: 'terreno', label: 'Terreno', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 4-4 5 5"/></svg>' },
  { id: 'veiculo', label: 'Veículo', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0"/></svg>' },
  { id: 'outro', label: 'Outro', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>' }
];

function wpRenderBens(container, clienteId, isAdmin) {
  if (!clienteId) { container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">Selecione um cliente</div>'; return; }
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Carregando bens...</div>';
  db.collection('clientes').doc(clienteId).collection('wp_bens').orderBy('criadoEm','desc').get().then(function(snap) {
    var bens = [];
    snap.forEach(function(d) { var b = d.data(); b.id = d.id; bens.push(b); });
    var totalValor = bens.reduce(function(s, b) { return s + (Number(b.valorEstimado) || 0); }, 0);
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
      + '<div><div style="font-size:15px;font-weight:600;color:var(--white)">Bens e Patrimônio</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + bens.length + ' ben' + (bens.length !== 1 ? 's' : '') + ' cadastrado' + (bens.length !== 1 ? 's' : '') + ' | Total: ' + wpFmtMoeda(totalValor) + '</div></div>'
      + '<button class="btn-primary" onclick="wpModalBem(\'' + clienteId + '\')" style="padding:8px 16px;font-size:12px">+ Adicionar Bem</button>'
      + '</div>';
    if (bens.length === 0) {
      html += '<div class="card" style="padding:40px;text-align:center"><div style="color:var(--text3);font-size:13px">Nenhum bem cadastrado. Adicione terrenos, imóveis, veículos e outros bens da família.</div></div>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">';
      bens.forEach(function(b) {
        var tipoInfo = WP_BENS_TIPOS.find(function(t) { return t.id === b.tipo; }) || WP_BENS_TIPOS[4];
        html += '<div class="card" style="padding:18px">'
          + '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px">'
          + '<div style="display:flex;align-items:center;gap:10px">'
          + '<div style="width:36px;height:36px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;color:var(--blue)">' + tipoInfo.icon + '</div>'
          + '<div><div style="font-size:14px;font-weight:600;color:var(--white)">' + (b.descricao || 'Sem descrição') + '</div>'
          + '<div style="font-size:11px;color:var(--text3)">' + tipoInfo.label + (b.localizacao ? ' | ' + b.localizacao : '') + '</div></div></div>'
          + '<div style="display:flex;gap:4px">'
          + '<button onclick="wpModalBem(\'' + clienteId + '\',\'' + b.id + '\')" style="background:none;border:none;cursor:pointer;color:var(--text3);padding:4px" title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>'
          + '<button onclick="wpDeleteBem(\'' + clienteId + '\',\'' + b.id + '\')" style="background:none;border:none;cursor:pointer;color:var(--text3);padding:4px" title="Excluir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
          + '</div></div>'
          + '<div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:var(--pos);margin-bottom:8px">' + wpFmtMoeda(b.valorEstimado) + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        if (b.area) html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--text2)">' + b.area + ' m²</span>';
        if (b.anoAquisicao) html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--text2)">Adquirido em ' + b.anoAquisicao + '</span>';
        if (b.financiado) html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:color-mix(in srgb,var(--neg) 15%,transparent);color:var(--neg)">Financiado</span>';
        if (b.alugado) html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:color-mix(in srgb,var(--pos) 15%,transparent);color:var(--pos)">Alugado</span>';
        html += '</div>';
        if (b.observacoes) html += '<div style="font-size:12px;color:var(--text3);margin-top:8px;line-height:1.4">' + b.observacoes + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    container.innerHTML = html;
  }).catch(function(e) {
    container.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--neg)">Erro ao carregar bens: ' + e.message + '</div>';
  });
}

function wpModalBem(clienteId, bemId) {
  var isEdit = !!bemId;
  var modal = document.createElement('div');
  modal.id = 'wp-modal-bem';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55)';
  modal.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);width:520px;max-height:85vh;overflow-y:auto;padding:24px;position:relative">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<div style="font-size:16px;font-weight:600;color:var(--white)">' + (isEdit ? 'Editar Bem' : 'Adicionar Bem') + '</div>'
    + '<button onclick="document.getElementById(\'wp-modal-bem\').remove()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:20px">&times;</button></div>'
    + '<div class="form-grid" style="gap:12px">'
    + '<div class="form-group"><label>Tipo de bem *</label><select class="form-input" id="wp-bem-tipo"><option value="">Selecione...</option>'
    + WP_BENS_TIPOS.map(function(t) { return '<option value="' + t.id + '">' + t.label + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="form-group"><label>Descrição *</label><input class="form-input" id="wp-bem-desc" placeholder="Ex: Casa de praia, Terreno em Alphaville..."></div>'
    + '<div class="form-group"><label>Valor estimado (R$) *</label><input class="form-input" id="wp-bem-valor" type="number" step="1000" placeholder="0"></div>'
    + '<div class="form-group"><label>Localização</label><input class="form-input" id="wp-bem-local" placeholder="Cidade, bairro..."></div>'
    + '<div class="form-group"><label>Área (m²)</label><input class="form-input" id="wp-bem-area" placeholder="0"></div>'
    + '<div class="form-group"><label>Ano de aquisição</label><input class="form-input" id="wp-bem-ano" type="number" placeholder="2020"></div>'
    + '<div class="form-group"><label>Valor de aquisição (R$)</label><input class="form-input" id="wp-bem-valoraq" type="number" step="1000" placeholder="0"></div>'
    + '<div class="form-group"><label>Registro / matrícula</label><input class="form-input" id="wp-bem-registro" placeholder="Número de matrícula"></div>'
    + '<div class="form-group form-full" style="display:flex;gap:16px;align-items:center">'
    + '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:var(--text)"><input type="checkbox" id="wp-bem-financiado"> Financiado</label>'
    + '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:var(--text)"><input type="checkbox" id="wp-bem-alugado"> Alugado / Gera renda</label>'
    + '</div>'
    + '<div class="form-group form-full"><label>Saldo devedor (R$)</label><input class="form-input" id="wp-bem-saldo" type="number" step="1000" placeholder="0"></div>'
    + '<div class="form-group form-full"><label>Renda mensal (R$)</label><input class="form-input" id="wp-bem-renda" type="number" step="100" placeholder="0"></div>'
    + '<div class="form-group form-full"><label>Observações</label><textarea class="form-input" id="wp-bem-obs" rows="2" placeholder="Informações adicionais..."></textarea></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">'
    + '<button class="btn-secondary" onclick="document.getElementById(\'wp-modal-bem\').remove()">Cancelar</button>'
    + '<button class="btn-primary" id="wp-bem-save" onclick="wpSalvarBem(\'' + clienteId + '\',\'' + (bemId || '') + '\')">Salvar</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });

  if (isEdit) {
    db.collection('clientes').doc(clienteId).collection('wp_bens').doc(bemId).get().then(function(snap) {
      if (!snap.exists) return;
      var b = snap.data();
      document.getElementById('wp-bem-tipo').value = b.tipo || '';
      document.getElementById('wp-bem-desc').value = b.descricao || '';
      document.getElementById('wp-bem-valor').value = b.valorEstimado || '';
      document.getElementById('wp-bem-local').value = b.localizacao || '';
      document.getElementById('wp-bem-area').value = b.area || '';
      document.getElementById('wp-bem-ano').value = b.anoAquisicao || '';
      document.getElementById('wp-bem-valoraq').value = b.valorAquisicao || '';
      document.getElementById('wp-bem-registro').value = b.registro || '';
      document.getElementById('wp-bem-financiado').checked = !!b.financiado;
      document.getElementById('wp-bem-alugado').checked = !!b.alugado;
      document.getElementById('wp-bem-saldo').value = b.saldoDevedor || '';
      document.getElementById('wp-bem-renda').value = b.rendaMensal || '';
      document.getElementById('wp-bem-obs').value = b.observacoes || '';
    });
  }
}

function wpSalvarBem(clienteId, bemId) {
  var tipo = document.getElementById('wp-bem-tipo').value;
  var desc = document.getElementById('wp-bem-desc').value.trim();
  var valor = Number(document.getElementById('wp-bem-valor').value) || 0;
  if (!tipo || !desc || valor <= 0) { alert('Preencha tipo, descrição e valor estimado.'); return; }

  var data = {
    tipo: tipo,
    descricao: desc,
    valorEstimado: valor,
    localizacao: document.getElementById('wp-bem-local').value.trim(),
    area: document.getElementById('wp-bem-area').value.trim(),
    anoAquisicao: document.getElementById('wp-bem-ano').value.trim(),
    valorAquisicao: Number(document.getElementById('wp-bem-valoraq').value) || 0,
    registro: document.getElementById('wp-bem-registro').value.trim(),
    financiado: document.getElementById('wp-bem-financiado').checked,
    alugado: document.getElementById('wp-bem-alugado').checked,
    saldoDevedor: Number(document.getElementById('wp-bem-saldo').value) || 0,
    rendaMensal: Number(document.getElementById('wp-bem-renda').value) || 0,
    observacoes: document.getElementById('wp-bem-obs').value.trim(),
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!bemId) data.criadoEm = firebase.firestore.FieldValue.serverTimestamp();

  var ref = db.collection('clientes').doc(clienteId).collection('wp_bens');
  var promise = bemId ? ref.doc(bemId).update(data) : ref.add(data);
  promise.then(function() {
    document.getElementById('wp-modal-bem').remove();
    wpAuditLog(clienteId, bemId ? 'bem_editado' : 'bem_criado', { tipo: tipo, descricao: desc });
    var container = document.getElementById('wp-modules-content');
    if (container) wpRenderBens(container, clienteId, wpIsAdminView);
  }).catch(function(e) { alert('Erro ao salvar: ' + e.message); });
}

function wpDeleteBem(clienteId, bemId) {
  if (!confirm('Excluir este bem?')) return;
  db.collection('clientes').doc(clienteId).collection('wp_bens').doc(bemId).delete().then(function() {
    wpAuditLog(clienteId, 'bem_excluido', { id: bemId });
    var container = document.getElementById('wp-modules-content');
    if (container) wpRenderBens(container, clienteId, wpIsAdminView);
  }).catch(function(e) { alert('Erro: ' + e.message); });
}

// ═══════════════════════════════════════════════════════════
// WP MODULE: PREVIDÊNCIA
// ═══════════════════════════════════════════════════════════
var WP_PREV_TIPOS = ['PGBL', 'VGBL', 'Previdência Empresarial', 'Fundo de Pensão', 'Outro'];

function wpRenderPrevidencia(container, clienteId, isAdmin) {
  if (!clienteId) { container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">Selecione um cliente</div>'; return; }
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Carregando previdências...</div>';
  db.collection('clientes').doc(clienteId).collection('wp_previdencia').orderBy('criadoEm','desc').get().then(function(snap) {
    var prevs = [];
    snap.forEach(function(d) { var p = d.data(); p.id = d.id; prevs.push(p); });
    var totalSaldo = prevs.reduce(function(s, p) { return s + (Number(p.saldoAtual) || 0); }, 0);
    var totalContrib = prevs.reduce(function(s, p) { return s + (Number(p.contribuicaoMensal) || 0); }, 0);
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
      + '<div><div style="font-size:15px;font-weight:600;color:var(--white)">Previdência Privada</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + prevs.length + ' plano' + (prevs.length !== 1 ? 's' : '') + ' | Saldo: ' + wpFmtMoeda(totalSaldo) + ' | Contrib: ' + wpFmtMoeda(totalContrib) + '/mês</div></div>'
      + '<button class="btn-primary" onclick="wpModalPrevidencia(\'' + clienteId + '\')" style="padding:8px 16px;font-size:12px">+ Adicionar Plano</button>'
      + '</div>';
    if (prevs.length === 0) {
      html += '<div class="card" style="padding:40px;text-align:center"><div style="color:var(--text3);font-size:13px">Nenhum plano de previdência cadastrado.</div></div>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px">';
      prevs.forEach(function(p) {
        html += '<div class="card" style="padding:18px">'
          + '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px">'
          + '<div>'
          + '<div style="font-size:14px;font-weight:600;color:var(--white)">' + (p.nome || 'Sem nome') + '</div>'
          + '<div style="font-size:11px;color:var(--text3)">' + (p.tipo || '') + (p.seguradora ? ' | ' + p.seguradora : '') + '</div>'
          + '</div>'
          + '<div style="display:flex;gap:4px">'
          + '<button onclick="wpModalPrevidencia(\'' + clienteId + '\',\'' + p.id + '\')" style="background:none;border:none;cursor:pointer;color:var(--text3);padding:4px" title="Editar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>'
          + '<button onclick="wpDeletePrevidencia(\'' + clienteId + '\',\'' + p.id + '\')" style="background:none;border:none;cursor:pointer;color:var(--text3);padding:4px" title="Excluir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
          + '</div></div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">'
          + '<div><div style="font-size:11px;color:var(--text3)">Saldo atual</div><div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:var(--pos)">' + wpFmtMoeda(p.saldoAtual) + '</div></div>'
          + '<div><div style="font-size:11px;color:var(--text3)">Contrib. mensal</div><div style="font-family:Inter,sans-serif;font-size:18px;font-weight:700;color:var(--blue)">' + wpFmtMoeda(p.contribuicaoMensal) + '</div></div>'
          + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        if (p.tributacao) html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--text2)">Tabela ' + p.tributacao + '</span>';
        if (p.beneficiarios) html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--text2)">Benef: ' + p.beneficiarios + '</span>';
        if (p.dataVencimento) html += '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--text2)">Venc: ' + p.dataVencimento + '</span>';
        html += '</div>';
        if (p.observacoes) html += '<div style="font-size:12px;color:var(--text3);margin-top:8px;line-height:1.4">' + p.observacoes + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    container.innerHTML = html;
  }).catch(function(e) {
    container.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--neg)">Erro ao carregar previdências: ' + e.message + '</div>';
  });
}

function wpModalPrevidencia(clienteId, prevId) {
  var isEdit = !!prevId;
  var modal = document.createElement('div');
  modal.id = 'wp-modal-prev';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55)';
  modal.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);width:520px;max-height:85vh;overflow-y:auto;padding:24px;position:relative">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<div style="font-size:16px;font-weight:600;color:var(--white)">' + (isEdit ? 'Editar Plano' : 'Adicionar Plano de Previdência') + '</div>'
    + '<button onclick="document.getElementById(\'wp-modal-prev\').remove()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:20px">&times;</button></div>'
    + '<div class="form-grid" style="gap:12px">'
    + '<div class="form-group"><label>Tipo *</label><select class="form-input" id="wp-prev-tipo"><option value="">Selecione...</option>'
    + WP_PREV_TIPOS.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="form-group"><label>Nome do plano *</label><input class="form-input" id="wp-prev-nome" placeholder="Ex: VGBL Bradesco Premium"></div>'
    + '<div class="form-group"><label>Seguradora / Instituição</label><input class="form-input" id="wp-prev-seg" placeholder="Ex: Brasilprev, Icatu..."></div>'
    + '<div class="form-group"><label>CNPJ do fundo</label><input class="form-input" id="wp-prev-cnpj" placeholder="00.000.000/0000-00"></div>'
    + '<div class="form-group"><label>Saldo atual (R$) *</label><input class="form-input" id="wp-prev-saldo" type="number" step="100" placeholder="0"></div>'
    + '<div class="form-group"><label>Contribuição mensal (R$)</label><input class="form-input" id="wp-prev-contrib" type="number" step="100" placeholder="0"></div>'
    + '<div class="form-group"><label>Tributação</label><select class="form-input" id="wp-prev-trib"><option value="">Selecione...</option><option>Progressiva</option><option>Regressiva</option></select></div>'
    + '<div class="form-group"><label>Data de vencimento</label><input class="form-input" id="wp-prev-venc" type="text" placeholder="MM/AAAA"></div>'
    + '<div class="form-group"><label>Taxa de administração (%)</label><input class="form-input" id="wp-prev-taxa" type="number" step="0.01" placeholder="0.00"></div>'
    + '<div class="form-group"><label>Taxa de carregamento (%)</label><input class="form-input" id="wp-prev-carreg" type="number" step="0.01" placeholder="0.00"></div>'
    + '<div class="form-group form-full"><label>Beneficiários</label><input class="form-input" id="wp-prev-benef" placeholder="Nomes dos beneficiários e percentuais"></div>'
    + '<div class="form-group form-full"><label>Observações</label><textarea class="form-input" id="wp-prev-obs" rows="2" placeholder="Informações adicionais..."></textarea></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">'
    + '<button class="btn-secondary" onclick="document.getElementById(\'wp-modal-prev\').remove()">Cancelar</button>'
    + '<button class="btn-primary" onclick="wpSalvarPrevidencia(\'' + clienteId + '\',\'' + (prevId || '') + '\')">Salvar</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });

  if (isEdit) {
    db.collection('clientes').doc(clienteId).collection('wp_previdencia').doc(prevId).get().then(function(snap) {
      if (!snap.exists) return;
      var p = snap.data();
      document.getElementById('wp-prev-tipo').value = p.tipo || '';
      document.getElementById('wp-prev-nome').value = p.nome || '';
      document.getElementById('wp-prev-seg').value = p.seguradora || '';
      document.getElementById('wp-prev-cnpj').value = p.cnpj || '';
      document.getElementById('wp-prev-saldo').value = p.saldoAtual || '';
      document.getElementById('wp-prev-contrib').value = p.contribuicaoMensal || '';
      document.getElementById('wp-prev-trib').value = p.tributacao || '';
      document.getElementById('wp-prev-venc').value = p.dataVencimento || '';
      document.getElementById('wp-prev-taxa').value = p.taxaAdmin || '';
      document.getElementById('wp-prev-carreg').value = p.taxaCarregamento || '';
      document.getElementById('wp-prev-benef').value = p.beneficiarios || '';
      document.getElementById('wp-prev-obs').value = p.observacoes || '';
    });
  }
}

function wpSalvarPrevidencia(clienteId, prevId) {
  var tipo = document.getElementById('wp-prev-tipo').value;
  var nome = document.getElementById('wp-prev-nome').value.trim();
  var saldo = Number(document.getElementById('wp-prev-saldo').value) || 0;
  if (!tipo || !nome) { alert('Preencha tipo e nome do plano.'); return; }

  var data = {
    tipo: tipo,
    nome: nome,
    seguradora: document.getElementById('wp-prev-seg').value.trim(),
    cnpj: document.getElementById('wp-prev-cnpj').value.trim(),
    saldoAtual: saldo,
    contribuicaoMensal: Number(document.getElementById('wp-prev-contrib').value) || 0,
    tributacao: document.getElementById('wp-prev-trib').value,
    dataVencimento: document.getElementById('wp-prev-venc').value.trim(),
    taxaAdmin: Number(document.getElementById('wp-prev-taxa').value) || 0,
    taxaCarregamento: Number(document.getElementById('wp-prev-carreg').value) || 0,
    beneficiarios: document.getElementById('wp-prev-benef').value.trim(),
    observacoes: document.getElementById('wp-prev-obs').value.trim(),
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!prevId) data.criadoEm = firebase.firestore.FieldValue.serverTimestamp();

  var ref = db.collection('clientes').doc(clienteId).collection('wp_previdencia');
  var promise = prevId ? ref.doc(prevId).update(data) : ref.add(data);
  promise.then(function() {
    document.getElementById('wp-modal-prev').remove();
    wpAuditLog(clienteId, prevId ? 'previdencia_editada' : 'previdencia_criada', { tipo: tipo, nome: nome });
    var container = document.getElementById('wp-modules-content');
    if (container) wpRenderPrevidencia(container, clienteId, wpIsAdminView);
  }).catch(function(e) { alert('Erro ao salvar: ' + e.message); });
}

function wpDeletePrevidencia(clienteId, prevId) {
  if (!confirm('Excluir este plano de previdência?')) return;
  db.collection('clientes').doc(clienteId).collection('wp_previdencia').doc(prevId).delete().then(function() {
    wpAuditLog(clienteId, 'previdencia_excluida', { id: prevId });
    var container = document.getElementById('wp-modules-content');
    if (container) wpRenderPrevidencia(container, clienteId, wpIsAdminView);
  }).catch(function(e) { alert('Erro: ' + e.message); });
}

// ═══════════════════════════════════════════════════════════
// MEUS CLIENTES — Dashboard consolidado para consultores
// Visível apenas para adm/gestor
// ═══════════════════════════════════════════════════════════

var wpMCFilterConsultor = '';
var wpMCClientesData = []; // enriched client data with ativos status

function wpRenderMeusClientes() {
  var panel = document.getElementById('wp-panel-meus-clientes');
  if (!panel) return;

  // Only for adm/gestor
  if (typeof currentPerfil !== 'undefined' && currentPerfil === 'cliente') {
    panel.innerHTML = '';
    return;
  }

  if (!wpClientesCacheReady) {
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">Carregando dados dos clientes...</div>';
    setTimeout(wpRenderMeusClientes, 500);
    return;
  }

  // Filter only consultoria clients
  var consultoriaClientes = wpClientesCache.filter(function(c) {
    return clienteTemConsultoria(c);
  });

  // Extract unique consultores
  var consultores = [];
  var consultorMap = {};
  consultoriaClientes.forEach(function(c) {
    var cons = c.responsavelConsultoria || 'Não atribuído';
    if (!consultorMap[cons]) {
      consultorMap[cons] = { nome: cons, clientes: 0, patrimonio: 0 };
      consultores.push(consultorMap[cons]);
    }
    consultorMap[cons].clientes++;
    consultorMap[cons].patrimonio += (c.patrimonio || 0);
  });

  // Apply filter
  var filtered = consultoriaClientes;
  if (wpMCFilterConsultor) {
    filtered = consultoriaClientes.filter(function(c) {
      return (c.responsavelConsultoria || 'Não atribuído') === wpMCFilterConsultor;
    });
  }

  // Calculate KPIs
  var totalPatrimonio = 0;
  var totalClientes = filtered.length;
  var bancoMap = {};
  var semContato30d = 0;

  filtered.forEach(function(c) {
    totalPatrimonio += (c.patrimonio || 0);
    var banco = c.banco || 'Não informado';
    if (!bancoMap[banco]) bancoMap[banco] = { clientes: 0, patrimonio: 0 };
    bancoMap[banco].clientes++;
    bancoMap[banco].patrimonio += (c.patrimonio || 0);
    // Check ultimo contato > 30 dias
    if (wpDaysSince(c.ultimoContato) > 30) semContato30d++;
  });

  var aumMedio = totalClientes > 0 ? totalPatrimonio / totalClientes : 0;

  // Build HTML
  var html = '';

  // ── Filter bar ──
  html += '<div class="card" style="margin-bottom:16px;padding:12px 16px">'
    + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<label style="font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap">Consultor:</label>'
    + '<select id="wp-mc-filter-cons" onchange="wpMCFilterConsultor=this.value;wpRenderMeusClientes()" class="form-input" style="max-width:240px">'
    + '<option value="">Todos os consultores</option>';
  consultores.forEach(function(cons) {
    html += '<option value="' + cons.nome + '"' + (wpMCFilterConsultor === cons.nome ? ' selected' : '') + '>' + cons.nome + ' (' + cons.clientes + ' clientes)</option>';
  });
  html += '</select>'
    + '<div style="margin-left:auto;font-size:12px;color:var(--text3)">' + totalClientes + ' clientes de consultoria</div>'
    + '</div></div>';

  // ── KPI cards ──
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">'
    + wpMCKpiCard('Patrimônio Total (AUM)', wpFmtMoeda(totalPatrimonio), 'var(--blue)', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>')
    + wpMCKpiCard('Clientes Ativos', totalClientes + '', 'var(--pos)', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>')
    + wpMCKpiCard('AUM Médio / Cliente', wpFmtMoeda(aumMedio), '#a78bfa', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>')
    + wpMCKpiCard('Sem Contato +30d', semContato30d + '', semContato30d > 0 ? 'var(--neg)' : 'var(--pos)', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>')
    + '</div>';

  // ── Consultores breakdown (only when showing all) ──
  if (!wpMCFilterConsultor && consultores.length > 1) {
    html += '<div style="display:grid;grid-template-columns:repeat(' + Math.min(consultores.length, 3) + ',1fr);gap:14px;margin-bottom:16px">';
    consultores.forEach(function(cons) {
      var initial = (cons.nome || '?').charAt(0).toUpperCase();
      html += '<div class="card" style="padding:16px;cursor:pointer;transition:all .15s" onclick="wpMCFilterConsultor=\'' + cons.nome.replace(/'/g, "\\'") + '\';wpRenderMeusClientes()" onmouseover="this.style.borderColor=\'var(--blue)\'" onmouseout="this.style.borderColor=\'var(--border)\'">'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">'
        + '<div style="width:40px;height:40px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px">' + initial + '</div>'
        + '<div><div style="font-size:14px;font-weight:600;color:var(--white)">' + cons.nome + '</div>'
        + '<div style="font-size:12px;color:var(--text3)">' + cons.clientes + ' clientes</div></div></div>'
        + '<div style="font-size:11px;color:var(--text3);margin-bottom:4px">Patrimônio sob gestão</div>'
        + '<div style="font-size:18px;font-weight:700;color:var(--blue)">' + wpFmtMoeda(cons.patrimonio) + '</div>'
        + '</div>';
    });
    html += '</div>';
  }

  // ── Corretoras breakdown ──
  var bancos = Object.keys(bancoMap).sort(function(a, b) { return bancoMap[b].patrimonio - bancoMap[a].patrimonio; });
  if (bancos.length > 0) {
    html += '<div class="card" style="margin-bottom:16px;padding:16px">'
      + '<div style="font-size:13px;font-weight:600;color:var(--white);margin-bottom:12px">Distribuição por Corretora / Banco</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">';
    bancos.forEach(function(banco) {
      var b = bancoMap[banco];
      var pct = totalPatrimonio > 0 ? Math.round(b.patrimonio / totalPatrimonio * 100) : 0;
      html += '<div style="background:var(--border);border-radius:var(--radius-sm);padding:12px">'
        + '<div style="font-size:12px;font-weight:600;color:var(--white);margin-bottom:4px">' + banco + '</div>'
        + '<div style="font-size:11px;color:var(--text3)">' + b.clientes + ' clientes · ' + pct + '%</div>'
        + '<div style="font-size:15px;font-weight:700;color:var(--blue);margin-top:4px">' + wpFmtMoeda(b.patrimonio) + '</div>'
        + '<div style="height:4px;background:var(--card);border-radius:2px;margin-top:6px"><div style="height:4px;background:var(--blue);border-radius:2px;width:' + pct + '%"></div></div>'
        + '</div>';
    });
    html += '</div></div>';
  }

  // ── Clients table ──
  html += '<div class="card" style="padding:0;overflow:hidden">'
    + '<div style="padding:16px 16px 12px;display:flex;align-items:center;justify-content:space-between">'
    + '<div style="font-size:13px;font-weight:600;color:var(--white)">Lista de Clientes</div>'
    + '<div style="display:flex;gap:8px;align-items:center">'
    + '<input class="form-input" id="wp-mc-search" placeholder="Buscar cliente..." oninput="wpMCFilterTable()" style="max-width:200px;font-size:12px;padding:6px 10px">'
    + '</div></div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
    + '<thead><tr style="background:var(--border)">'
    + '<th style="padding:10px 14px;text-align:left;font-weight:600;color:var(--text2);white-space:nowrap">Cliente</th>'
    + '<th style="padding:10px 14px;text-align:left;font-weight:600;color:var(--text2);white-space:nowrap">Consultor</th>'
    + '<th style="padding:10px 14px;text-align:right;font-weight:600;color:var(--text2);white-space:nowrap">Patrimônio</th>'
    + '<th style="padding:10px 14px;text-align:center;font-weight:600;color:var(--text2);white-space:nowrap">Carteira</th>'
    + '<th style="padding:10px 14px;text-align:center;font-weight:600;color:var(--text2);white-space:nowrap">Último Contato</th>'
    + '<th style="padding:10px 14px;text-align:center;font-weight:600;color:var(--text2);white-space:nowrap">Ações</th>'
    + '</tr></thead>'
    + '<tbody id="wp-mc-tbody">';

  // Sort by patrimonio desc
  filtered.sort(function(a, b) { return (b.patrimonio || 0) - (a.patrimonio || 0); });

  filtered.forEach(function(c) {
    var dias = wpDaysSince(c.ultimoContato);
    var contatoColor = dias > 60 ? 'var(--neg)' : (dias > 30 ? '#d4a017' : 'var(--pos)');
    var contatoText = c.ultimoContato ? wpFormatDateBR(c.ultimoContato) : 'Nunca';
    var diasText = c.ultimoContato ? ' (' + dias + 'd)' : '';
    var initial = (c.nome || '?').charAt(0).toUpperCase();
    var consultor = c.responsavelConsultoria || 'Não atribuído';

    html += '<tr class="wp-mc-row" data-nome="' + (c.nome || '').toLowerCase() + '" style="border-bottom:1px solid var(--border);transition:background .1s" onmouseover="this.style.background=\'var(--border)\'" onmouseout="this.style.background=\'transparent\'">'
      + '<td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:10px">'
      + '<div style="width:32px;height:32px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;flex-shrink:0">' + initial + '</div>'
      + '<div><div style="font-weight:600;color:var(--white);white-space:nowrap">' + (c.nome || 'Sem nome') + '</div>'
      + '<div style="font-size:11px;color:var(--text3)">' + (c.email || '') + '</div></div></div></td>'
      + '<td style="padding:10px 14px;color:var(--text2)">' + consultor + '</td>'
      + '<td style="padding:10px 14px;text-align:right;font-weight:600;color:var(--white);font-variant-numeric:tabular-nums">' + wpFmtMoeda(c.patrimonio || 0) + '</td>'
      + '<td style="padding:10px 14px;text-align:center">'
      + ((c.patrimonio || 0) > 0
        ? '<span style="font-size:10px;background:var(--pos);color:#000;padding:2px 8px;border-radius:10px;font-weight:600">Preenchida</span>'
        : '<span style="font-size:10px;background:var(--neg);color:#fff;padding:2px 8px;border-radius:10px;font-weight:600">Pendente</span>')
      + '</td>'
      + '<td style="padding:10px 14px;text-align:center;white-space:nowrap">'
      + '<span style="color:' + contatoColor + ';font-weight:500">' + contatoText + '</span>'
      + '<span style="font-size:10px;color:var(--text3)">' + diasText + '</span></td>'
      + '<td style="padding:10px 14px;text-align:center;white-space:nowrap">'
      + '<button onclick="wpMCOpenContato(\'' + c.id + '\',\'' + (c.nome || '').replace(/'/g, "\\'") + '\')" style="border:none;background:var(--blue);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;margin-right:4px" title="Registrar contato">Contato</button>'
      + '<button onclick="wpMCViewHistorico(\'' + c.id + '\',\'' + (c.nome || '').replace(/'/g, "\\'") + '\')" style="border:none;background:var(--border);color:var(--white);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:500" title="Ver histórico">Histórico</button>'
      + '</td></tr>';
  });

  html += '</tbody></table></div></div>';

  panel.innerHTML = html;

  // Async: check which clients have ativos filled
  wpMCCheckAtivos(filtered);
}

function wpMCKpiCard(label, value, color, icon) {
  return '<div class="card" style="padding:16px">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
    + '<div style="color:' + color + ';opacity:.7">' + icon + '</div>'
    + '<div style="font-size:12px;color:var(--text3);font-weight:400">' + label + '</div></div>'
    + '<div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:' + color + '">' + value + '</div>'
    + '</div>';
}

function wpDaysSince(dateStr) {
  if (!dateStr) return 999;
  var parts = dateStr.split('-');
  if (parts.length !== 3) return 999;
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

function wpFormatDateBR(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function wpMCFilterTable() {
  var q = (document.getElementById('wp-mc-search') || {}).value || '';
  q = q.toLowerCase().trim();
  var rows = document.querySelectorAll('.wp-mc-row');
  rows.forEach(function(row) {
    var nome = row.getAttribute('data-nome') || '';
    row.style.display = (!q || nome.indexOf(q) >= 0) ? '' : 'none';
  });
}

// Async check which clients have ativos (to show accurate "Carteira" status)
function wpMCCheckAtivos(clientes) {
  if (!clientes || !clientes.length) return;
  clientes.forEach(function(c) {
    db.collection('clientes').doc(c.id).collection('ativos').limit(1).get().then(function(snap) {
      // Already has patrimonio > 0 from sync — only update if ativos exist but patrimonio is 0
      if (snap.size > 0 && (c.patrimonio || 0) === 0) {
        // Client has ativos but patrimonio wasn't synced — mark as filled
        var rows = document.querySelectorAll('.wp-mc-row');
        rows.forEach(function(row) {
          if (row.getAttribute('data-nome') === (c.nome || '').toLowerCase()) {
            var badge = row.querySelectorAll('td')[3];
            if (badge) badge.innerHTML = '<span style="font-size:10px;background:var(--pos);color:#000;padding:2px 8px;border-radius:10px;font-weight:600">Preenchida</span>';
          }
        });
      }
    }).catch(function() {});
  });
}

// ── Registrar Contato (modal) ────────────────────────────
function wpMCOpenContato(clienteId, clienteNome) {
  // Remove existing modal if any
  var old = document.getElementById('wp-mc-modal-contato');
  if (old) old.remove();

  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  var modal = document.createElement('div');
  modal.id = 'wp-mc-modal-contato';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:24px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<div style="font-family:Inter,sans-serif;font-size:16px;font-weight:700;color:var(--white)">Registrar Contato</div>'
    + '<button onclick="document.getElementById(\'wp-mc-modal-contato\').remove()" style="border:none;background:none;color:var(--text3);font-size:22px;cursor:pointer;padding:0 4px">&times;</button></div>'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:16px">Cliente: <strong style="color:var(--white)">' + clienteNome + '</strong></div>'
    + '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px">Data do Contato</label>'
    + '<input class="form-input" type="date" id="wp-mc-ct-data" value="' + todayStr + '" style="width:100%"></div>'
    + '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px">Tipo</label>'
    + '<select class="form-input" id="wp-mc-ct-tipo" style="width:100%">'
    + '<option value="Reunião">Reunião</option><option value="Ligação">Ligação</option>'
    + '<option value="WhatsApp">WhatsApp</option><option value="Email">Email</option>'
    + '<option value="Presencial">Presencial</option></select></div>'
    + '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px">Resumo da conversa</label>'
    + '<textarea class="form-input" id="wp-mc-ct-texto" rows="4" placeholder="O que foi discutido neste contato..." style="width:100%;resize:vertical"></textarea></div>'
    + '<div style="margin-bottom:16px"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px">Próximo contato (opcional)</label>'
    + '<input class="form-input" type="date" id="wp-mc-ct-proximo" style="width:100%"></div>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end">'
    + '<button onclick="document.getElementById(\'wp-mc-modal-contato\').remove()" style="border:1px solid var(--border);background:var(--card);color:var(--text2);padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px">Cancelar</button>'
    + '<button onclick="wpMCSaveContato(\'' + clienteId + '\')" style="border:none;background:var(--blue);color:#fff;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Salvar</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
}

function wpMCSaveContato(clienteId) {
  var texto = (document.getElementById('wp-mc-ct-texto') || {}).value || '';
  texto = texto.trim();
  if (!texto) { alert('Informe o resumo do contato.'); return; }

  var dataContato = (document.getElementById('wp-mc-ct-data') || {}).value || '';
  var tipo = (document.getElementById('wp-mc-ct-tipo') || {}).value || 'Reunião';
  var proximo = (document.getElementById('wp-mc-ct-proximo') || {}).value || '';

  // Get current user name for author
  var autor = '';
  if (typeof currentUserData !== 'undefined' && currentUserData) {
    autor = currentUserData.nome || currentUserData.email || '';
  }

  var data = {
    data: dataContato,
    tipo: tipo,
    texto: texto,
    proximoContato: proximo,
    autor: autor,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Save to contatos subcollection
  db.collection('clientes').doc(clienteId).collection('contatos').add(data).then(function() {
    // Update ultimoContato on client doc
    var upd = { ultimoContato: dataContato };
    if (proximo) upd.proximoContato = proximo;
    db.collection('clientes').doc(clienteId).update(upd);

    // Update local cache
    var cached = wpClientesCache.find(function(c) { return c.id === clienteId; });
    if (cached) {
      cached.ultimoContato = dataContato;
      if (proximo) cached.proximoContato = proximo;
    }

    // Close modal and refresh
    var modal = document.getElementById('wp-mc-modal-contato');
    if (modal) modal.remove();
    wpRenderMeusClientes();
  }).catch(function(e) { alert('Erro ao salvar contato: ' + e.message); });
}

// ── Ver Histórico de Contatos ────────────────────────────
function wpMCViewHistorico(clienteId, clienteNome) {
  var old = document.getElementById('wp-mc-modal-hist');
  if (old) old.remove();

  var modal = document.createElement('div');
  modal.id = 'wp-mc-modal-hist';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);width:100%;max-width:600px;max-height:85vh;overflow-y:auto;padding:24px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<div style="font-family:Inter,sans-serif;font-size:16px;font-weight:700;color:var(--white)">Histórico de Contatos</div>'
    + '<button onclick="document.getElementById(\'wp-mc-modal-hist\').remove()" style="border:none;background:none;color:var(--text3);font-size:22px;cursor:pointer;padding:0 4px">&times;</button></div>'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:16px">Cliente: <strong style="color:var(--white)">' + clienteNome + '</strong></div>'
    + '<div id="wp-mc-hist-list" style="color:var(--text3);font-size:13px">Carregando...</div>'
    + '<div style="margin-top:16px;text-align:right">'
    + '<button onclick="document.getElementById(\'wp-mc-modal-hist\').remove();wpMCOpenContato(\'' + clienteId + '\',\'' + clienteNome.replace(/'/g, "\\'") + '\')" style="border:none;background:var(--blue);color:#fff;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ Novo Contato</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

  // Load contacts
  db.collection('clientes').doc(clienteId).collection('contatos').orderBy('data', 'desc').limit(30).get().then(function(snap) {
    var list = document.getElementById('wp-mc-hist-list');
    if (!list) return;
    if (snap.empty) {
      list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3)">Nenhum contato registrado para este cliente.</div>';
      return;
    }
    var html = '';
    snap.forEach(function(d) {
      var ct = d.data();
      var dataFmt = wpFormatDateBR(ct.data);
      var tipoIcon = ct.tipo === 'Reunião' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>'
        : ct.tipo === 'Ligação' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';

      html += '<div style="border-left:3px solid var(--blue);padding:12px 16px;margin-bottom:10px;background:var(--border);border-radius:0 var(--radius-sm) var(--radius-sm) 0">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
        + '<span style="color:var(--blue)">' + tipoIcon + '</span>'
        + '<span style="font-weight:600;color:var(--white);font-size:12px">' + (ct.tipo || 'Contato') + '</span>'
        + '<span style="font-size:11px;color:var(--text3)">' + dataFmt + '</span>'
        + (ct.autor ? '<span style="font-size:10px;color:var(--text3);margin-left:auto">por ' + ct.autor + '</span>' : '')
        + '</div>'
        + '<div style="font-size:13px;color:var(--text2);line-height:1.5;white-space:pre-wrap">' + (ct.texto || '').replace(/</g, '&lt;') + '</div>'
        + (ct.proximoContato ? '<div style="font-size:11px;color:var(--text3);margin-top:6px">Próximo contato: ' + wpFormatDateBR(ct.proximoContato) + '</div>' : '')
        + '</div>';
    });
    list.innerHTML = html;
  }).catch(function(e) {
    var list = document.getElementById('wp-mc-hist-list');
    if (list) list.innerHTML = '<div style="color:var(--neg)">Erro ao carregar: ' + e.message + '</div>';
  });
}
