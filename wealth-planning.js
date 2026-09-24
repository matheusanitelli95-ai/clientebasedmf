// ═══════════════════════════════════════════════════════════
// WEALTH PLANNING — DMF Gestão Patrimonial
// Módulo aditivo, modular e retrocompatível
// ═══════════════════════════════════════════════════════════

// ── Constantes ───────────────────────────────────────────
var WP_FASES = [
  { id: 'fundacao', label: 'Fundação', icon: '🏗️', desc: 'Organização financeira, fluxo de caixa, reserva e proteções' },
  { id: 'acumulacao', label: 'Acumulação', icon: '📈', desc: 'Construção patrimonial e acompanhamento de objetivos' },
  { id: 'distribuicao', label: 'Distribuição', icon: '💰', desc: 'Planejamento de renda, aposentadoria e retiradas' },
  { id: 'sucessao', label: 'Sucessão', icon: '🔄', desc: 'Transferência de patrimônio e responsabilidades' }
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

// ── Filtrar clientes no seletor do WP ────────────────────
function wpFilterClientes() {
  var input = document.getElementById('wp-search-cliente');
  var resultsDiv = document.getElementById('wp-search-results');
  if (!input || !resultsDiv) return;

  var query = (input.value || '').toLowerCase().trim();
  // Usar a variável global 'clientes' do sistema
  var list = typeof clientes !== 'undefined' ? clientes : [];

  // Filtrar só clientes com consultoria (mas mostrar todos com indicador)
  var filtered = list.filter(function(c) {
    if (!query) return true;
    return (c.nome || '').toLowerCase().indexOf(query) >= 0
      || (c.cpf || '').replace(/\D/g,'').indexOf(query.replace(/\D/g,'')) >= 0;
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
      ? '<span style="font-size:9px;background:#38bdf8;color:#000;padding:1px 6px;border-radius:10px;font-weight:600">Consultoria</span>'
      : '<span style="font-size:9px;background:var(--border);color:var(--text3);padding:1px 6px;border-radius:10px">Sem WP</span>';
    html += '<div onclick="wpSelectCliente(\'' + c.id + '\')" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background=\'var(--border)\'" onmouseout="this.style.background=\'transparent\'">'
      + '<div style="font-size:13px;color:var(--white)">' + (c.nome || 'Sem nome') + '</div>'
      + badge
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
      var statusColor = temWP ? '#38bdf8' : '#ff8c00';
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
        + '<strong style="color:#ff8c00">Visão admin:</strong> Este cliente não tem Consultoria ativa. '
        + 'Ele veria esta tela de bloqueio ao acessar o Wealth Planning. '
        + 'Para liberar o acesso, ative o checkbox "Consultoria" no cadastro do cliente.'
        + '</div></div>';
    } else {
      // Renderizar exatamente o que o cliente veria
      wpContent.innerHTML = '<div style="margin-bottom:12px;padding:8px 14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11px;color:var(--text3);display:flex;align-items:center;gap:8px">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
        + '<span>Você está visualizando o Wealth Planning como o cliente <strong style="color:var(--white)">' + (c.nome || '') + '</strong> veria.</span>'
        + '</div>'
        + wpClienteDashboardHTML(c);
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
    view.innerHTML = wpClienteDashboardHTML(clienteData);
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
    + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
    + '</div>'
    + '<div style="font-family:Syne,sans-serif;font-size:18px;font-weight:700;color:var(--white);margin-bottom:8px">Acesso exclusivo para clientes de Consultoria</div>'
    + '<div style="font-size:13px;color:var(--text3);max-width:420px;margin:0 auto;line-height:1.6">O Wealth Planning é um serviço exclusivo para clientes com contrato de consultoria ativa na DMF Gestão Patrimonial. Entre em contato com seu consultor para saber mais.</div>'
    + '</div></div>';
}

// ── HTML do dashboard WP para cliente ────────────────────
function wpClienteDashboardHTML(clienteData) {
  var fase = clienteData.faseWP || 'fundacao';
  var faseInfo = WP_FASES.find(function(f) { return f.id === fase; }) || WP_FASES[0];

  return '<div class="page-header">'
    + '<div><div class="page-title">Wealth Planning</div>'
    + '<div class="page-sub">Seu planejamento financeiro personalizado</div></div>'
    + '</div>'
    + '<div class="page-content">'
    // Fase atual
    + '<div class="card" style="margin-bottom:16px">'
    + '<div style="display:flex;align-items:center;gap:16px">'
    + '<div style="font-size:32px">' + faseInfo.icon + '</div>'
    + '<div style="flex:1">'
    + '<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px">Fase Atual da Jornada</div>'
    + '<div style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:var(--white)">' + faseInfo.label + '</div>'
    + '<div style="font-size:12px;color:var(--text2);margin-top:2px">' + faseInfo.desc + '</div>'
    + '</div></div>'
    // Barra de fases
    + '<div style="display:flex;gap:4px;margin-top:16px">'
    + WP_FASES.map(function(f) {
        var isActive = f.id === fase;
        return '<div style="flex:1;height:4px;border-radius:2px;background:' + (isActive ? 'var(--blue)' : 'var(--border)') + '"></div>';
      }).join('')
    + '</div></div>'
    // Placeholder para módulos futuros
    + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px">'
    + '<div class="card" style="padding:24px;text-align:center;opacity:.6"><div style="font-size:24px;margin-bottom:8px">📊</div><div style="font-size:13px;font-weight:600;color:var(--white)">Objetivos</div><div style="font-size:11px;color:var(--text3);margin-top:4px">Em breve</div></div>'
    + '<div class="card" style="padding:24px;text-align:center;opacity:.6"><div style="font-size:24px;margin-bottom:8px">💳</div><div style="font-size:13px;font-weight:600;color:var(--white)">Orçamento</div><div style="font-size:11px;color:var(--text3);margin-top:4px">Em breve</div></div>'
    + '<div class="card" style="padding:24px;text-align:center;opacity:.6"><div style="font-size:24px;margin-bottom:8px">🛡️</div><div style="font-size:13px;font-weight:600;color:var(--white)">Seguros</div><div style="font-size:11px;color:var(--text3);margin-top:4px">Em breve</div></div>'
    + '<div class="card" style="padding:24px;text-align:center;opacity:.6"><div style="font-size:24px;margin-bottom:8px">👨‍👩‍👧‍👦</div><div style="font-size:13px;font-weight:600;color:var(--white)">Grupo Familiar</div><div style="font-size:11px;color:var(--text3);margin-top:4px">Em breve</div></div>'
    + '</div></div>';
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
