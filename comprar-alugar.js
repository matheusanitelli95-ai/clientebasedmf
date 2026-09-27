// ═══════════════════════════════════════════════════════════
// COMPRAR OU ALUGAR — DMF Simulador Imobiliário
// Módulo aditivo para integração no dashboard DMF
// ═══════════════════════════════════════════════════════════

/* ── PERFIL_MENUS — todos os perfis ──────────────────────── */
if (typeof PERFIL_MENUS !== 'undefined') {
  ['adm','gestor','cliente'].forEach(function(p) {
    if (PERFIL_MENUS[p] && PERFIL_MENUS[p].indexOf('comprar-alugar') < 0) {
      PERFIL_MENUS[p].push('comprar-alugar');
    }
  });
}

/* ── Hook showView (admin/gestor) ────────────────────────── */
var _origShowViewCA = showView;
showView = function(v, btn) {
  if (v === 'comprar-alugar' && !document.getElementById('view-comprar-alugar')) {
    _buildComprarAlugarView();
  }
  _origShowViewCA(v, btn);
  if (v === 'comprar-alugar') setTimeout(_caInit, 80);
};

/* ── Hook showClienteView ────────────────────────────────── */
var _origShowClienteViewCA = typeof showClienteView === 'function' ? showClienteView : null;
if (_origShowClienteViewCA) {
  showClienteView = function(viewId, btn) {
    if (viewId === 'comprar-alugar' && !document.getElementById('view-comprar-alugar')) {
      _buildComprarAlugarView();
    }
    _origShowClienteViewCA(viewId, btn);
    if (viewId === 'comprar-alugar') setTimeout(_caInit, 80);
  };
}

/* ── Sidebar injection (admin/gestor) ────────────────────── */
(function addCASidebar() {
  function inject() {
    var nav = document.querySelector('.sidebar-nav');
    if (!nav || document.getElementById('nav-ca')) return;

    // Encontrar botão "Aposentadoria" para inserir logo após
    var apoBtn = null;
    nav.querySelectorAll('.nav-item').forEach(function(b) {
      if (b.textContent.trim() === 'Aposentadoria') apoBtn = b;
    });

    var caBtn = document.createElement('button');
    caBtn.className = 'nav-item';
    caBtn.id = 'nav-ca';
    caBtn.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span><span>Comprar ou Alugar</span>';
    caBtn.onclick = function() { showView('comprar-alugar', caBtn); };

    if (apoBtn && apoBtn.nextSibling) {
      nav.insertBefore(caBtn, apoBtn.nextSibling);
    } else {
      // Fallback: antes do Glossário
      var gloBtn = null;
      nav.querySelectorAll('.nav-item').forEach(function(b) {
        if (b.textContent.trim() === 'Glossário') gloBtn = b;
      });
      if (gloBtn) nav.insertBefore(caBtn, gloBtn);
      else nav.appendChild(caBtn);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();

/* ── Cliente sidebar injection ───────────────────────────── */
(function addCAClienteNav() {
  function inject() {
    var clienteNav = document.getElementById('cliente-nav');
    if (!clienteNav || document.getElementById('cnav-ca')) return;

    var caBtn = document.createElement('button');
    caBtn.className = 'nav-item';
    caBtn.id = 'cnav-ca';
    caBtn.innerHTML = '<span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span><span>Comprar ou Alugar</span>';
    caBtn.onclick = function() {
      if (typeof showClienteView === 'function') showClienteView('comprar-alugar', caBtn);
    };

    // Inserir depois do Simulador IF ou antes do Glossário
    var simBtn = document.getElementById('cnav-simulador');
    var gloBtn = document.getElementById('cnav-glossario');
    if (simBtn && simBtn.nextSibling) {
      clienteNav.insertBefore(caBtn, simBtn.nextSibling);
    } else if (gloBtn) {
      clienteNav.insertBefore(caBtn, gloBtn);
    } else {
      clienteNav.appendChild(caBtn);
    }
  }
  var _caNavInterval = setInterval(function() {
    if (document.getElementById('cliente-nav')) { inject(); clearInterval(_caNavInterval); }
  }, 1000);
  setTimeout(function() { clearInterval(_caNavInterval); }, 30000);
})();

/* ══════════════════════════════════════════════════════════════
   CSS — usa variáveis do tema da plataforma
   ══════════════════════════════════════════════════════════════ */
(function injectCAStyles() {
  var style = document.createElement('style');
  style.textContent = [
    '.ca-wrap{max-width:1100px;margin:0 auto;padding:0 0 60px}',
    '.ca-wrap h2{font-size:clamp(18px,2.5vw,24px);font-weight:700;letter-spacing:-.02em;margin-bottom:6px}',
    '.ca-wrap h3{font-size:14px;font-weight:600;margin-bottom:6px}',
    '.ca-wrap p{color:var(--text2,#8e8e96);font-size:13px}',
    '.ca-sec{margin-bottom:32px}',
    '.ca-sec-title{font-size:12px;font-weight:600;color:var(--text2,#8e8e96);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border,#e5e7eb)}',
    '.ca-grid{display:grid;gap:14px}',
    '.ca-grid-2{grid-template-columns:1fr 1fr}',
    '.ca-grid-3{grid-template-columns:1fr 1fr 1fr}',
    '.ca-card{background:var(--card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:var(--radius,12px);padding:16px;box-shadow:var(--shadow,0 1px 3px rgba(0,0,0,.4))}',
    /* ── Inputs ── */
    '.ca-field{margin-bottom:12px}',
    '.ca-field label{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--text2,#8e8e96);margin-bottom:4px}',
    '.ca-field .ca-tip{width:13px;height:13px;border-radius:50%;border:1px solid var(--border,#e5e7eb);display:inline-flex;align-items:center;justify-content:center;font-size:8px;color:var(--text2,#8e8e96);cursor:help;flex-shrink:0;position:relative}',
    '.ca-field .ca-tip:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 5px);left:50%;transform:translateX(-50%);background:var(--card,#151518);color:#fff;font-size:10px;font-weight:400;padding:7px 10px;border-radius:6px;white-space:normal;width:220px;z-index:100;line-height:1.4;box-shadow:0 4px 12px rgba(0,0,0,.25);pointer-events:none}',
    '.ca-input{width:100%;padding:7px 10px;font-size:13px;font-family:inherit;font-weight:500;border:1px solid var(--border,#e5e7eb);border-radius:6px;background:var(--card2,#f0f0f3);color:var(--text,#1c1c1e);outline:none;transition:border-color .15s}',
    '.ca-input:focus{border-color:var(--blue,#1a3a5c)}',
    '.ca-input-sm{font-size:12px;padding:5px 8px}',
    '.ca-slider{width:100%;-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;background:var(--border,#e5e7eb);outline:none;margin-top:5px;cursor:pointer}',
    '.ca-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--blue,#1a3a5c);cursor:pointer;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.2)}',
    '.ca-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--blue,#1a3a5c);cursor:pointer;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.2)}',
    '.ca-select{width:100%;padding:7px 10px;font-size:12px;font-family:inherit;border:1px solid var(--border,#e5e7eb);border-radius:6px;background:var(--card2,#f0f0f3);color:var(--text,#1c1c1e);cursor:pointer;outline:none}',
    '.ca-select:focus{border-color:var(--blue,#1a3a5c)}',
    /* ── Buttons ── */
    '.ca-btn{padding:6px 12px;font-size:11px;font-weight:600;font-family:inherit;border:none;border-radius:6px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px}',
    '.ca-btn-primary{background:var(--blue,#1a3a5c);color:#fff}',
    '.ca-btn-primary:hover{opacity:.9}',
    '.ca-btn-ghost{background:transparent;color:var(--text2,#8e8e96);border:1px solid var(--border,#e5e7eb)}',
    '.ca-btn-ghost:hover{background:var(--card2,#f0f0f3);color:var(--text,#1c1c1e)}',
    /* ── Toggle group ── */
    '.ca-toggle-group{display:flex;gap:0;border:1px solid var(--border,#e5e7eb);border-radius:6px;overflow:hidden}',
    '.ca-toggle-group .ca-toggle-btn{padding:5px 12px;font-size:10px;font-weight:600;font-family:inherit;border:none;background:transparent;color:var(--text2,#8e8e96);cursor:pointer;transition:all .15s;border-right:1px solid var(--border,#e5e7eb)}',
    '.ca-toggle-group .ca-toggle-btn:last-child{border-right:none}',
    '.ca-toggle-group .ca-toggle-btn.active{background:var(--blue,#1a3a5c);color:#fff}',
    /* ── Result cards ── */
    '.ca-result-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin:20px 0}',
    '.ca-result-card{background:var(--card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:var(--radius,12px);padding:16px;text-align:center;box-shadow:var(--shadow,0 1px 3px rgba(0,0,0,.4))}',
    '.ca-result-card .ca-rl{font-size:10px;font-weight:600;color:var(--text2,#8e8e96);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}',
    '.ca-result-card .ca-rv{font-size:clamp(18px,2.5vw,26px);font-weight:700;letter-spacing:-.02em}',
    '.ca-result-card .ca-rs{font-size:10px;color:var(--text2,#8e8e96);margin-top:3px}',
    '.ca-result-card.ca-diff{border:2px solid var(--blue,#1a3a5c)}',
    /* ── Narrative ── */
    '.ca-narrative{background:var(--card2,#f0f0f3);border:1px solid var(--border,#e5e7eb);border-radius:var(--radius,12px);padding:16px 20px;font-size:13px;color:var(--text2,#8e8e96);line-height:1.65;margin:16px 0}',
    /* ── Chart ── */
    '.ca-chart-wrap{position:relative;height:340px;margin:16px 0}',
    '.ca-chart-wrap canvas{width:100%!important;height:100%!important}',
    /* ── Matrix ── */
    '.ca-matrix{overflow-x:auto;margin:16px 0}',
    '.ca-matrix table{border-collapse:collapse;width:100%;min-width:560px;font-size:10px}',
    '.ca-matrix th,.ca-matrix td{padding:6px 5px;text-align:center;border:1px solid var(--border,#e5e7eb);font-family:inherit}',
    '.ca-matrix th{background:var(--card2,#f0f0f3);font-weight:600;color:var(--text2,#8e8e96);font-size:9px}',
    '.ca-matrix td{font-weight:600}',
    '.ca-matrix .ca-corner{background:var(--card,#fff);font-size:8px;color:var(--text2,#8e8e96)}',
    /* ── Breakeven ── */
    '.ca-be-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.ca-be-item{background:var(--card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:8px;padding:12px 14px}',
    '.ca-be-item .ca-be-q{font-size:11px;color:var(--text2,#8e8e96);margin-bottom:4px}',
    '.ca-be-item .ca-be-a{font-size:15px;font-weight:700;color:var(--blue,#1a3a5c)}',
    /* ── Tabs ── */
    '.ca-tabs{display:flex;gap:3px;flex-wrap:wrap}',
    '.ca-tab{padding:4px 10px;font-size:10px;font-weight:600;border-radius:5px;border:1px solid var(--border,#e5e7eb);background:transparent;color:var(--text2,#8e8e96);cursor:pointer;font-family:inherit;transition:all .15s}',
    '.ca-tab.active{background:var(--blue,#1a3a5c);color:#fff;border-color:var(--blue,#1a3a5c)}',
    /* ── Advanced toggle ── */
    '.ca-adv-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;font-weight:600;color:var(--blue,#1a3a5c);padding:6px 0;border:none;background:none;font-family:inherit}',
    '.ca-adv-toggle svg{transition:transform .2s}',
    '.ca-adv-toggle.open svg{transform:rotate(180deg)}',
    '.ca-adv-section{display:none}',
    '.ca-adv-section.show{display:block}',
    /* ── Toolbar ── */
    '.ca-toolbar{display:flex;gap:6px;justify-content:flex-end;margin-bottom:16px;flex-wrap:wrap}',
    /* ── Methodology ── */
    '.ca-method-list{counter-reset:ca-m;padding-left:0}',
    '.ca-method-list li{counter-increment:ca-m;padding:6px 0;font-size:12px;color:var(--text2,#8e8e96);border-bottom:1px solid var(--border,#e5e7eb);list-style:none}',
    '.ca-method-list li::before{content:counter(ca-m)".";font-weight:700;color:var(--blue,#1a3a5c);margin-right:6px}',
    '.ca-source-list{list-style:none;padding-left:0}',
    '.ca-source-list li{padding:4px 0;font-size:12px}',
    '.ca-source-list li a{color:var(--blue,#1a3a5c);text-decoration:none}',
    '.ca-source-list li a:hover{text-decoration:underline}',
    '.ca-disclaimer{font-size:10px;color:var(--text2,#8e8e96);line-height:1.5;padding:12px 16px;background:var(--card2,#f0f0f3);border-radius:var(--radius,12px);border:1px solid var(--border,#e5e7eb);margin-top:32px}',
    /* ── Responsive ── */
    '@media(max-width:768px){.ca-grid-2,.ca-grid-3,.ca-result-grid,.ca-be-grid{grid-template-columns:1fr}.ca-chart-wrap{height:260px}}',
  ].join('\n');
  document.head.appendChild(style);
})();

/* ══════════════════════════════════════════════════════════════
   BUILD VIEW
   ══════════════════════════════════════════════════════════════ */
function _buildComprarAlugarView() {
  if (document.getElementById('view-comprar-alugar')) return;
  var mainContent = document.getElementById('main-content');
  var div = document.createElement('div');
  div.className = 'view';
  div.id = 'view-comprar-alugar';
  div.innerHTML = [
    '<div class="page-header"><div><div class="page-title">Comprar ou Alugar?</div>',
    '<div class="page-sub" style="font-style:italic">Uma decisão imobiliária também é uma decisão de investimento.</div></div></div>',
    '<div class="ca-wrap">',

    /* ── Toolbar ── */
    '<div class="ca-toolbar">',
    '<button class="ca-btn ca-btn-ghost" onclick="CA.resetDefaults()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Restaurar padrão</button>',
    '<button class="ca-btn ca-btn-ghost" onclick="CA.saveLocal()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Salvar</button>',
    '<button class="ca-btn ca-btn-ghost" onclick="CA.share()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Compartilhar</button>',
    '</div>',

    /* ── Main Inputs ── */
    '<div class="ca-sec"><div class="ca-grid ca-grid-3">',
    /* Property Value */
    '<div class="ca-card"><div class="ca-field"><label>Valor do Imóvel <span class="ca-tip" data-tip="Valor de mercado do imóvel considerado para compra.">?</span></label>',
    '<input class="ca-input" id="ca-property" type="text" value="R$ 1.000.000">',
    '<input class="ca-slider" id="ca-sl-property" type="range" min="100000" max="5000000" step="10000" value="1000000"></div></div>',
    /* Monthly Rent */
    '<div class="ca-card"><div class="ca-field"><label>Aluguel Mensal <span class="ca-tip" data-tip="Aluguel mensal de um imóvel equivalente ao considerado para compra.">?</span></label>',
    '<input class="ca-input" id="ca-rent" type="text" value="R$ 3.500">',
    '<input class="ca-slider" id="ca-sl-rent" type="range" min="500" max="30000" step="100" value="3500">',
    '<div style="font-size:9px;color:var(--text2);margin-top:3px">Yield: <span id="ca-lbl-yield">0,35% a.m.</span></div></div></div>',
    /* Horizon */
    '<div class="ca-card"><div class="ca-field"><label>Tempo de Permanência <span class="ca-tip" data-tip="Horizonte de comparação em anos. Ao final, o imóvel é vendido e investimentos resgatados.">?</span></label>',
    '<input class="ca-input" id="ca-horizon" type="text" value="30 anos">',
    '<input class="ca-slider" id="ca-sl-horizon" type="range" min="1" max="40" step="1" value="30"></div></div>',
    '</div></div>',

    /* ── Parâmetros ── */
    '<div class="ca-sec"><div class="ca-sec-title">Parâmetros da Simulação</div><div class="ca-grid ca-grid-2">',
    /* Financing */
    '<div class="ca-card"><h3>Financiamento</h3>',
    '<div class="ca-field"><label>Sistema</label><select class="ca-select" id="ca-system"><option value="sac" selected>SAC</option><option value="price">Price</option><option value="cash">À Vista</option></select></div>',
    '<div id="ca-fin-fields">',
    '<div class="ca-field"><label>Entrada <span class="ca-tip" data-tip="Percentual do valor pago como entrada. O restante é financiado.">?</span></label>',
    '<div style="display:flex;gap:6px;align-items:center"><input class="ca-input ca-input-sm" id="ca-down-pct" type="text" value="20%" style="width:60px"><span style="font-size:11px;color:var(--text2)">=</span><input class="ca-input ca-input-sm" id="ca-down-val" type="text" value="R$ 200.000" style="flex:1"></div>',
    '<input class="ca-slider" id="ca-sl-down" type="range" min="0" max="100" step="1" value="20"></div>',
    '<div class="ca-field"><label>Taxa Efetiva Anual <span class="ca-tip" data-tip="Taxa efetiva anual do financiamento. Mensal: im = (1+ia)^(1/12)-1.">?</span></label>',
    '<input class="ca-input ca-input-sm" id="ca-rate" type="text" value="11,00% a.a.">',
    '<input class="ca-slider" id="ca-sl-rate" type="range" min="0" max="20" step="0.1" value="11">',
    '<div style="font-size:9px;color:var(--text2);margin-top:3px">Mensal: <span id="ca-lbl-rate-m">0,8735% a.m.</span></div></div>',
    '<div class="ca-field"><label>Prazo do Financiamento</label>',
    '<input class="ca-input ca-input-sm" id="ca-term" type="text" value="30 anos">',
    '<input class="ca-slider" id="ca-sl-term" type="range" min="1" max="35" step="1" value="30"></div>',
    '</div></div>',
    /* Economy */
    '<div class="ca-card"><h3>Premissas Econômicas</h3>',
    '<div class="ca-field"><label>Inflação Anual <span class="ca-tip" data-tip="Inflação esperada. Usada para converter valores nominais em reais.">?</span></label>',
    '<input class="ca-input ca-input-sm" id="ca-inflation" type="text" value="4,50% a.a.">',
    '<input class="ca-slider" id="ca-sl-inflation" type="range" min="0" max="15" step="0.1" value="4.5"></div>',
    '<div class="ca-field"><label>Retorno Real dos Investimentos <span class="ca-tip" data-tip="Retorno bruto acima da inflação. Se inflação=4,5% e real=5%, nominal=(1,045)(1,05)-1=9,73%.">?</span></label>',
    '<input class="ca-input ca-input-sm" id="ca-invest-real" type="text" value="5,00% a.a.">',
    '<input class="ca-slider" id="ca-sl-invest-real" type="range" min="-5" max="15" step="0.1" value="5">',
    '<div style="font-size:9px;color:var(--text2);margin-top:3px">Nominal: <span id="ca-lbl-invest-nom">9,73% a.a.</span></div></div>',
    '<div class="ca-field"><label>Valorização do Imóvel</label>',
    '<select class="ca-select" id="ca-apprec-mode"><option value="inflation">Base — igual à inflação</option><option value="conservative">Conservador — inflação - 1 p.p.</option><option value="optimistic">Otimista — inflação + 1 p.p.</option><option value="custom">Personalizado</option></select>',
    '<div id="ca-apprec-custom-wrap" style="display:none;margin-top:4px"><input class="ca-input ca-input-sm" id="ca-apprec-custom" type="text" value="4,50% a.a."></div>',
    '<div style="font-size:9px;color:var(--text2);margin-top:3px">Nominal: <span id="ca-lbl-apprec">4,50% a.a.</span></div></div>',
    '<div class="ca-field"><label>Tributação dos Investimentos <span class="ca-tip" data-tip="Renda fixa tributável: tabela regressiva (22,5% a 15%). Isento: LCI/LCA/etc.">?</span></label>',
    '<select class="ca-select" id="ca-invest-tax"><option value="regressiva" selected>Tabela Regressiva</option><option value="isento">Isento (LCI/LCA)</option><option value="custom">Alíquota Personalizada</option></select>',
    '<div id="ca-invest-tax-custom-wrap" style="display:none;margin-top:4px"><input class="ca-input ca-input-sm" id="ca-invest-tax-custom" type="text" value="15,00%"></div></div>',
    '</div></div></div>',

    /* ── Advanced Toggle ── */
    '<button class="ca-adv-toggle" id="ca-adv-toggle" onclick="CA.toggleAdvanced()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg> Modo Avançado — Custos, impostos e detalhes</button>',
    '<div class="ca-adv-section" id="ca-adv-section"><div class="ca-grid ca-grid-3" style="margin-top:12px">',
    /* Acquisition */
    '<div class="ca-card"><h3>Custos de Aquisição</h3>',
    '<div class="ca-field"><label>ITBI <span class="ca-tip" data-tip="Imposto de Transmissão. Varia por município. Hipótese: 3%.">?</span></label><input class="ca-input ca-input-sm" id="ca-itbi" type="text" value="3,00%"></div>',
    '<div class="ca-field"><label>Registro e Escritura</label><input class="ca-input ca-input-sm" id="ca-registro" type="text" value="R$ 5.000"></div>',
    '<div class="ca-field"><label>Avaliação Bancária</label><input class="ca-input ca-input-sm" id="ca-avaliacao" type="text" value="R$ 3.500"></div>',
    '<div class="ca-field"><label>Outros Custos</label><input class="ca-input ca-input-sm" id="ca-outros" type="text" value="R$ 0"></div>',
    '</div>',
    /* Ownership */
    '<div class="ca-card"><h3>Custos de Propriedade</h3>',
    '<div class="ca-field"><label>Manutenção (% a.a.) <span class="ca-tip" data-tip="Custo anual de manutenção como % do valor do imóvel.">?</span></label><input class="ca-input ca-input-sm" id="ca-manutencao" type="text" value="0,75%"></div>',
    '<div class="ca-field"><label>IPTU Anual</label><input class="ca-input ca-input-sm" id="ca-iptu" type="text" value="R$ 6.000"></div>',
    '<div class="ca-field"><label>IPTU pago por</label><select class="ca-select" id="ca-iptu-quem"><option value="ambos" selected>Ambos</option><option value="proprietario">Proprietário</option><option value="locatario">Locatário</option></select></div>',
    '<div class="ca-field"><label>Seguro Residencial Anual</label><input class="ca-input ca-input-sm" id="ca-seguro" type="text" value="R$ 1.200"></div>',
    '<div class="ca-field"><label>Condomínio Mensal</label><input class="ca-input ca-input-sm" id="ca-condominio" type="text" value="R$ 0"></div>',
    '<div class="ca-field"><label>Condomínio pago por</label><select class="ca-select" id="ca-condo-quem"><option value="ambos" selected>Ambos</option><option value="proprietario">Proprietário</option><option value="locatario">Locatário</option></select></div>',
    '</div>',
    /* Sale & Rent */
    '<div class="ca-card"><h3>Venda e Locação</h3>',
    '<div class="ca-field"><label>Corretagem na Venda <span class="ca-tip" data-tip="Percentual pago ao corretor na venda ao final do horizonte.">?</span></label><input class="ca-input ca-input-sm" id="ca-corretagem" type="text" value="5,00%"></div>',
    '<div class="ca-field"><label>Imposto Ganho Capital <span class="ca-tip" data-tip="Alíquota sobre ganho de capital na venda. Padrão: 15%.">?</span></label><input class="ca-input ca-input-sm" id="ca-gc-rate" type="text" value="15,00%"></div>',
    '<div class="ca-field"><label>Reajuste do Aluguel <span class="ca-tip" data-tip="Reajuste anual do aluguel. Geralmente atrelado ao IPCA/IGP-M.">?</span></label><input class="ca-input ca-input-sm" id="ca-rent-adj" type="text" value="4,50% a.a."></div>',
    '<div class="ca-field"><label>Custos Iniciais Locação <span class="ca-tip" data-tip="Seguro fiança, depósito, mudança, etc.">?</span></label><input class="ca-input ca-input-sm" id="ca-custos-loc" type="text" value="R$ 5.000"></div>',
    '<div class="ca-field"><label>TR / Indexador <span class="ca-tip" data-tip="Taxa Referencial. Corrige o saldo devedor mensalmente.">?</span></label><input class="ca-input ca-input-sm" id="ca-tr" type="text" value="0,00% a.a."></div>',
    '</div></div></div>',

    /* ── Results ── */
    '<div class="ca-sec" id="ca-results" style="margin-top:28px">',
    '<div class="ca-sec-title">Resultado da Simulação</div>',
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:6px">',
    '<div class="ca-toggle-group"><button class="ca-toggle-btn active" id="ca-btn-nom" onclick="CA.setValuation(\'nominal\')">Nominais</button><button class="ca-toggle-btn" id="ca-btn-real" onclick="CA.setValuation(\'real\')">Reais (dinheiro de hoje)</button></div>',
    '<div class="ca-tabs" id="ca-horizon-tabs"></div></div>',
    '<div class="ca-result-grid">',
    '<div class="ca-result-card"><div class="ca-rl">Comprar</div><div class="ca-rv" id="ca-res-buy" style="color:var(--blue,#1a3a5c)">—</div><div class="ca-rs" id="ca-res-buy-sub"></div></div>',
    '<div class="ca-result-card"><div class="ca-rl">Alugar + Investir</div><div class="ca-rv" id="ca-res-rent" style="color:var(--pos,#16a34a)">—</div><div class="ca-rs" id="ca-res-rent-sub"></div></div>',
    '<div class="ca-result-card ca-diff"><div class="ca-rl">Diferença</div><div class="ca-rv" id="ca-res-diff">—</div><div class="ca-rs" id="ca-res-diff-sub"></div></div>',
    '</div>',
    '<div class="ca-narrative" id="ca-narrative"></div>',
    '</div>',

    /* ── Charts ── */
    '<div class="ca-sec"><div class="ca-sec-title">Evolução do Patrimônio Líquido</div>',
    '<div class="ca-card"><div class="ca-chart-wrap"><canvas id="ca-chart-main"></canvas></div></div></div>',
    '<div class="ca-sec"><div class="ca-grid ca-grid-2">',
    '<div class="ca-card"><h3>Composição — Comprador</h3><p style="margin-bottom:6px">Imóvel, dívida e patrimônio financeiro</p><div class="ca-chart-wrap" style="height:280px"><canvas id="ca-chart-buyer"></canvas></div></div>',
    '<div class="ca-card"><h3>Para Onde Foi o Dinheiro?</h3><p style="margin-bottom:6px">Decomposição dos custos acumulados</p><div class="ca-chart-wrap" style="height:280px"><canvas id="ca-chart-costs"></canvas></div></div>',
    '</div></div>',
    '<div class="ca-sec" id="ca-debt-section"><div class="ca-card"><h3>Saldo Devedor do Financiamento</h3><div class="ca-chart-wrap" style="height:260px"><canvas id="ca-chart-debt"></canvas></div></div></div>',

    /* ── Sensitivity ── */
    '<div class="ca-sec"><div class="ca-sec-title">Análise de Sensibilidade</div>',
    '<p style="margin-bottom:12px">Diferença patrimonial para combinações de valorização e retorno. Positivo = alugar melhor, negativo = comprar melhor.</p>',
    '<div class="ca-matrix" id="ca-sensitivity"></div></div>',

    /* ── Breakeven ── */
    '<div class="ca-sec"><div class="ca-sec-title">O Que Precisaria Mudar?</div>',
    '<p style="margin-bottom:12px">Valores que tornariam as alternativas equivalentes.</p>',
    '<div class="ca-be-grid" id="ca-breakeven"></div></div>',

    /* ── Methodology ── */
    '<div class="ca-sec"><div class="ca-sec-title">Como Fazemos a Conta?</div><div class="ca-card">',
    '<ol class="ca-method-list">',
    '<li>Ambos os cenários partem do mesmo patrimônio inicial.</li>',
    '<li>Ambos possuem a mesma capacidade financeira mensal.</li>',
    '<li>O capital não utilizado na compra permanece investido no cenário de aluguel.</li>',
    '<li>Diferenças mensais de fluxo de caixa são investidas pelo cenário com custo menor.</li>',
    '<li>No financiamento, a amortização aumenta o patrimônio — apenas os juros são custo.</li>',
    '<li>O imóvel é valorizado conforme a premissa selecionada.</li>',
    '<li>O aluguel é reajustado anualmente conforme a premissa.</li>',
    '<li>Custos de aquisição, manutenção, impostos e transação são considerados.</li>',
    '<li>Ao final, o imóvel é vendido (com corretagem e impostos) para comparação homogênea.</li>',
    '<li>O resultado compara os patrimônios líquidos finais de cada alternativa.</li>',
    '</ol></div></div>',

    /* ── Sources ── */
    '<div class="ca-sec"><div class="ca-sec-title">Fontes e Referências</div><div class="ca-card"><ul class="ca-source-list">',
    '<li><a href="https://www.bcb.gov.br/" target="_blank" rel="noopener">Banco Central do Brasil</a> — taxas de juros, TR</li>',
    '<li><a href="https://www.ibge.gov.br/" target="_blank" rel="noopener">IBGE</a> — índices de preços</li>',
    '<li><a href="https://portalibre.fgv.br/" target="_blank" rel="noopener">FGV IBRE</a> — indicadores econômicos</li>',
    '<li><a href="https://www.fipe.org.br/" target="_blank" rel="noopener">Fipe / FipeZAP</a> — índices imobiliários</li>',
    '<li><a href="https://www.gov.br/receitafederal/" target="_blank" rel="noopener">Receita Federal</a> — legislação tributária</li>',
    '<li><a href="https://www.tesourodireto.com.br/" target="_blank" rel="noopener">Tesouro Direto</a> — referência de retornos</li>',
    '</ul></div></div>',

    /* Disclaimer */
    '<div class="ca-disclaimer">Esta ferramenta possui finalidade exclusivamente educacional. Os resultados são estimativas baseadas nas premissas informadas e não constituem recomendação individualizada de investimento, crédito, compra, venda ou locação de imóveis. Consulte um profissional qualificado para decisões específicas.</div>',

    '</div>'
  ].join('');
  mainContent.appendChild(div);
}

/* ══════════════════════════════════════════════════════════════
   FINANCIAL ENGINE (same as standalone)
   ══════════════════════════════════════════════════════════════ */
var _ca = {}; // internal state
_ca.P = {};
_ca.sim = null;
_ca.charts = {};
_ca.valuation = 'nominal';
_ca.selHorizon = null;

var CA_DEFAULTS = {
  propertyValue:1000000, monthlyRent:3500, downPct:20, system:'sac',
  rateAnnual:11, termYears:30, inflation:4.5, investRealReturn:5.0,
  apprecMode:'inflation', apprecCustom:4.5, rentAdjustment:4.5,
  horizonYears:30, maintenancePct:0.75, itbiPct:3.0, registro:5000,
  avaliacao:3500, outrosAquisicao:0, iptuAnnual:6000, iptuQuem:'ambos',
  seguroResid:1200, condominioMensal:0, condoQuem:'ambos',
  corretagemPct:5.0, gcRate:15.0, custosLocacao:5000, trAnnual:0,
  investTaxType:'regressiva', investTaxCustom:15.0
};

var CA_TAX_BRACKETS = [
  {maxDays:180, rate:0.225}, {maxDays:360, rate:0.20},
  {maxDays:720, rate:0.175}, {maxDays:Infinity, rate:0.15}
];

function _caFmtBRL(v) { return isFinite(v) ? 'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0}) : '—'; }
function _caFmtBRL2(v) { return isFinite(v) ? 'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—'; }
function _caFmtPct(v,d) { return isFinite(v) ? v.toFixed(d!=null?d:2).replace('.',',')+'%' : '—'; }
function _caParseBRL(s) { return parseFloat(String(s).replace(/[R$\s.]/g,'').replace(',','.'))||0; }
function _caParsePct(s) { return parseFloat(String(s).replace(/[%a.m.]/g,'').replace(',','.').trim())||0; }
function _caClamp(v,mn,mx) { return Math.max(mn,Math.min(mx,v)); }
function _caSafe(v) { return isFinite(v)&&!isNaN(v)?v:0; }
function _caA2M(a) { return Math.pow(1+a/100,1/12)-1; }
function _caNomFromReal(r,i) { return ((1+r/100)*(1+i/100)-1)*100; }
function _caEl(id) { return document.getElementById(id); }

function _caGetInvTaxRate(holdM, type, custom) {
  if (type==='isento') return 0;
  if (type==='custom') return (custom||15)/100;
  var d=holdM*30;
  for (var i=0;i<CA_TAX_BRACKETS.length;i++) { if(d<=CA_TAX_BRACKETS[i].maxDays) return CA_TAX_BRACKETS[i].rate; }
  return 0.15;
}

function _caCalcSAC(prin,mr,n,tr) {
  var a=prin/n,sch=[],b=prin;
  for(var m=1;m<=n;m++){if(tr>0)b*=(1+tr);var int=b*mr;sch.push({pay:a+int,int:int,amort:a,bal:Math.max(0,b-a)});b=Math.max(0,b-a);}
  return sch;
}
function _caCalcPrice(prin,mr,n,tr) {
  if(mr<=0){var p0=prin/n,s0=[],b0=prin;for(var m0=1;m0<=n;m0++){b0-=p0;s0.push({pay:p0,int:0,amort:p0,bal:Math.max(0,b0)});}return s0;}
  var pmt=prin*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1),sch=[],b=prin;
  for(var m=1;m<=n;m++){if(tr>0)b*=(1+tr);var int=b*mr,am=pmt-int;b-=am;sch.push({pay:pmt,int:int,amort:am,bal:Math.max(0,b)});}
  return sch;
}

function _caRunSim(params) {
  var p=params||_ca.P;
  var hm=p.horizonYears*12, mi=_caA2M(p.inflation), invNom=_caNomFromReal(p.investRealReturn,p.inflation), invM=_caA2M(invNom);
  var appA; if(p.apprecMode==='conservative')appA=p.inflation-1;else if(p.apprecMode==='optimistic')appA=p.inflation+1;else if(p.apprecMode==='custom')appA=p.apprecCustom;else appA=p.inflation;
  var appM=_caA2M(appA);
  var down=p.propertyValue*p.downPct/100, finAmt=p.system==='cash'?0:p.propertyValue-down, termM=p.system==='cash'?0:p.termYears*12;
  var finRM=p.system==='cash'?0:_caA2M(p.rateAnnual), trM=_caA2M(p.trAnnual);
  var finSch=[];
  if(p.system==='sac'&&finAmt>0) finSch=_caCalcSAC(finAmt,finRM,termM,trM);
  else if(p.system==='price'&&finAmt>0) finSch=_caCalcPrice(finAmt,finRM,termM,trM);

  var itbi=p.propertyValue*p.itbiPct/100, totalAcq=itbi+p.registro+p.avaliacao+p.outrosAquisicao;
  var buyerInit=down+totalAcq, renterInit=Math.max(0,buyerInit-p.custosLocacao);
  var iptuM=p.iptuAnnual/12, segM=p.seguroResid/12;
  var bLots=[],rLots=[];
  var bFin=0,rFin=renterInit;
  if(rFin>0) rLots.push({p:rFin,m:0,v:rFin});
  var data=[],tInt=0,tAmort=0,tMaint=0,tIPTU=0,tSeg=0,tRent=0,curRent=p.monthlyRent;

  for(var m=1;m<=hm;m++){
    var def=Math.pow(1+mi,m), propV=p.propertyValue*Math.pow(1+appM,m), maintM=propV*p.maintenancePct/100/12;
    if(m>1&&(m-1)%12===0) curRent*=(1+p.rentAdjustment/100);
    var fPay=0,fInt=0,fAm=0,debt=0;
    if(m<=finSch.length){var fs=finSch[m-1];fPay=fs.pay;fInt=fs.int;fAm=fs.amort;debt=fs.bal;}
    var bIPTU=0,rIPTU=0;if(p.iptuQuem==='proprietario')bIPTU=iptuM;else if(p.iptuQuem==='locatario')rIPTU=iptuM;
    var bCondo=0,rCondo=0;if(p.condoQuem==='proprietario')bCondo=p.condominioMensal;else if(p.condoQuem==='locatario')rCondo=p.condominioMensal;
    var bCost=fPay+maintM+bIPTU+segM+bCondo; tInt+=fInt;tAmort+=fAm;tMaint+=maintM;tIPTU+=bIPTU;tSeg+=segM;
    var rCost=curRent+rIPTU+rCondo; tRent+=curRent;
    var budget=Math.max(bCost,rCost), bInv=budget-bCost, rInv=budget-rCost;
    // Grow buyer lots
    bLots.forEach(function(l){l.v*=(1+invM);});
    if(bInv>0)bLots.push({p:bInv,m:m,v:bInv});
    else if(bInv<0){var dr=-bInv;for(var li=bLots.length-1;li>=0&&dr>0;li--){if(bLots[li].v<=dr){dr-=bLots[li].v;bLots.splice(li,1);}else{var r=dr/bLots[li].v;bLots[li].p*=(1-r);bLots[li].v-=dr;dr=0;}}}
    // Grow renter lots
    rLots.forEach(function(l){l.v*=(1+invM);});
    if(rInv>0)rLots.push({p:rInv,m:m,v:rInv});
    else if(rInv<0){var dr2=-rInv;for(var ri=rLots.length-1;ri>=0&&dr2>0;ri--){if(rLots[ri].v<=dr2){dr2-=rLots[ri].v;rLots.splice(ri,1);}else{var r2=dr2/rLots[ri].v;rLots[ri].p*=(1-r2);rLots[ri].v-=dr2;dr2=0;}}}
    bFin=bLots.reduce(function(s,l){return s+l.v;},0);
    rFin=rLots.reduce(function(s,l){return s+l.v;},0);
    data.push({month:m,year:m/12,def:def,propV:propV,debt:debt,bEq:propV-debt,bFin:_caSafe(bFin),bNW:propV-debt+_caSafe(bFin),rent:curRent,rFin:_caSafe(rFin),rNW:_caSafe(rFin),bCost:bCost,rCost:rCost,budget:budget});
  }
  // Final liquidation
  var fd=data[hm-1]; if(!fd)return{data:data,s:{}};
  var brok=fd.propV*p.corretagemPct/100, saleNet=fd.propV-brok;
  var costBasis=p.propertyValue+totalAcq, cg=Math.max(0,saleNet-costBasis-fd.debt), gcTax=cg*p.gcRate/100;
  var bPropNet=saleNet-fd.debt-gcTax, bNW=bPropNet+fd.bFin;
  var bITax=_caCalcInvTax(bLots,hm,p.investTaxType,p.investTaxCustom); bNW-=bITax;
  var rITax=_caCalcInvTax(rLots,hm,p.investTaxType,p.investTaxCustom); var rNW=fd.rFin-rITax;
  return{data:data,s:{bNW:bNW,rNW:rNW,diff:rNW-bNW,def:fd.def,propF:fd.propV,debtF:fd.debt,brok:brok,gcTax:gcTax,cg:cg,bFin:fd.bFin,rFin:fd.rFin,bITax:bITax,rITax:rITax,tInt:tInt,tAmort:tAmort,tMaint:tMaint,tIPTU:tIPTU,tSeg:tSeg,tRent:tRent,tRCust:p.custosLocacao,tAcq:totalAcq,bPropNet:bPropNet}};
}
function _caCalcInvTax(lots,cm,type,custom){if(type==='isento')return 0;var t=0;lots.forEach(function(l){var g=l.v-l.p;if(g>0)t+=g*_caGetInvTaxRate(cm-l.m,type,custom);});return t;}

/* ── Read params from DOM ── */
function _caReadParams() {
  var P=_ca.P;
  P.propertyValue=_caClamp(_caParseBRL(_caEl('ca-property').value),10000,50000000);
  P.monthlyRent=_caClamp(_caParseBRL(_caEl('ca-rent').value),0,500000);
  P.horizonYears=_caClamp(parseInt(_caEl('ca-horizon').value)||parseInt(_caEl('ca-sl-horizon').value)||30,1,50);
  P.system=_caEl('ca-system').value;
  P.downPct=_caClamp(_caParsePct(_caEl('ca-down-pct').value),0,100);
  P.rateAnnual=_caClamp(_caParsePct(_caEl('ca-rate').value),0,30);
  P.termYears=_caClamp(parseInt(_caEl('ca-term').value)||parseInt(_caEl('ca-sl-term').value)||30,1,40);
  P.inflation=_caClamp(_caParsePct(_caEl('ca-inflation').value),0,30);
  P.investRealReturn=_caClamp(_caParsePct(_caEl('ca-invest-real').value),-10,30);
  P.apprecMode=_caEl('ca-apprec-mode').value;
  P.apprecCustom=_caParsePct(_caEl('ca-apprec-custom').value);
  P.investTaxType=_caEl('ca-invest-tax').value;
  P.investTaxCustom=_caParsePct(_caEl('ca-invest-tax-custom').value);
  P.maintenancePct=_caClamp(_caParsePct(_caEl('ca-manutencao').value),0,10);
  P.itbiPct=_caClamp(_caParsePct(_caEl('ca-itbi').value),0,10);
  P.registro=_caParseBRL(_caEl('ca-registro').value);
  P.avaliacao=_caParseBRL(_caEl('ca-avaliacao').value);
  P.outrosAquisicao=_caParseBRL(_caEl('ca-outros').value);
  P.iptuAnnual=_caParseBRL(_caEl('ca-iptu').value);
  P.iptuQuem=_caEl('ca-iptu-quem').value;
  P.seguroResid=_caParseBRL(_caEl('ca-seguro').value);
  P.condominioMensal=_caParseBRL(_caEl('ca-condominio').value);
  P.condoQuem=_caEl('ca-condo-quem').value;
  P.corretagemPct=_caClamp(_caParsePct(_caEl('ca-corretagem').value),0,20);
  P.gcRate=_caClamp(_caParsePct(_caEl('ca-gc-rate').value),0,30);
  P.rentAdjustment=_caClamp(_caParsePct(_caEl('ca-rent-adj').value),0,30);
  P.custosLocacao=_caParseBRL(_caEl('ca-custos-loc').value);
  P.trAnnual=_caClamp(_caParsePct(_caEl('ca-tr').value),0,10);
}

/* ── Write params to DOM ── */
function _caWriteParams() {
  var P=_ca.P;
  _caEl('ca-property').value=_caFmtBRL(P.propertyValue); _caEl('ca-sl-property').value=P.propertyValue;
  _caEl('ca-rent').value=_caFmtBRL(P.monthlyRent); _caEl('ca-sl-rent').value=P.monthlyRent;
  _caEl('ca-horizon').value=P.horizonYears+' anos'; _caEl('ca-sl-horizon').value=P.horizonYears;
  _caEl('ca-system').value=P.system;
  _caEl('ca-down-pct').value=_caFmtPct(P.downPct,0); _caEl('ca-sl-down').value=P.downPct;
  _caEl('ca-rate').value=_caFmtPct(P.rateAnnual)+' a.a.'; _caEl('ca-sl-rate').value=P.rateAnnual;
  _caEl('ca-term').value=P.termYears+' anos'; _caEl('ca-sl-term').value=P.termYears;
  _caEl('ca-inflation').value=_caFmtPct(P.inflation)+' a.a.'; _caEl('ca-sl-inflation').value=P.inflation;
  _caEl('ca-invest-real').value=_caFmtPct(P.investRealReturn)+' a.a.'; _caEl('ca-sl-invest-real').value=P.investRealReturn;
  _caEl('ca-apprec-mode').value=P.apprecMode;
  _caEl('ca-apprec-custom').value=_caFmtPct(P.apprecCustom)+' a.a.';
  _caEl('ca-invest-tax').value=P.investTaxType;
  _caEl('ca-invest-tax-custom').value=_caFmtPct(P.investTaxCustom);
  _caEl('ca-manutencao').value=_caFmtPct(P.maintenancePct);
  _caEl('ca-itbi').value=_caFmtPct(P.itbiPct);
  _caEl('ca-registro').value=_caFmtBRL(P.registro);
  _caEl('ca-avaliacao').value=_caFmtBRL(P.avaliacao);
  _caEl('ca-outros').value=_caFmtBRL(P.outrosAquisicao);
  _caEl('ca-iptu').value=_caFmtBRL(P.iptuAnnual);
  _caEl('ca-iptu-quem').value=P.iptuQuem;
  _caEl('ca-seguro').value=_caFmtBRL(P.seguroResid);
  _caEl('ca-condominio').value=_caFmtBRL(P.condominioMensal);
  _caEl('ca-condo-quem').value=P.condoQuem;
  _caEl('ca-corretagem').value=_caFmtPct(P.corretagemPct);
  _caEl('ca-gc-rate').value=_caFmtPct(P.gcRate);
  _caEl('ca-rent-adj').value=_caFmtPct(P.rentAdjustment)+' a.a.';
  _caEl('ca-custos-loc').value=_caFmtBRL(P.custosLocacao);
  _caEl('ca-tr').value=_caFmtPct(P.trAnnual)+' a.a.';
}

/* ── Update derived labels ── */
function _caUpdateLabels() {
  var P=_ca.P;
  var ym=P.propertyValue>0?(P.monthlyRent/P.propertyValue*100):0;
  _caEl('ca-lbl-yield').textContent=_caFmtPct(ym)+' a.m. ('+_caFmtPct(ym*12)+' a.a.)';
  _caEl('ca-lbl-rate-m').textContent=_caFmtPct(_caA2M(P.rateAnnual)*100,4)+' a.m.';
  _caEl('ca-lbl-invest-nom').textContent=_caFmtPct(_caNomFromReal(P.investRealReturn,P.inflation))+' a.a.';
  var ap;if(P.apprecMode==='conservative')ap=P.inflation-1;else if(P.apprecMode==='optimistic')ap=P.inflation+1;else if(P.apprecMode==='custom')ap=P.apprecCustom;else ap=P.inflation;
  _caEl('ca-lbl-apprec').textContent=_caFmtPct(ap)+' a.a.';
  _caEl('ca-down-val').value=_caFmtBRL(P.propertyValue*P.downPct/100);
  _caEl('ca-fin-fields').style.display=P.system==='cash'?'none':'block';
  _caEl('ca-apprec-custom-wrap').style.display=P.apprecMode==='custom'?'block':'none';
  _caEl('ca-invest-tax-custom-wrap').style.display=P.investTaxType==='custom'?'block':'none';
  _caEl('ca-debt-section').style.display=P.system==='cash'?'none':'block';
}

/* ── Update all ── */
function _caUpdateAll() {
  _caReadParams(); _caUpdateLabels();
  _ca.sim=_caRunSim(); _ca.selHorizon=_ca.P.horizonYears;
  _caUpdateResults(); _caUpdateCharts(); _caUpdateSensitivity(); _caUpdateBreakeven(); _caUpdateHorizonTabs();
}

function _caUpdateResults() {
  if(!_ca.sim)return; var s=_ca.sim.s, isR=_ca.valuation==='real', d=isR?s.def:1;
  var bNW=s.bNW/d, rNW=s.rNW/d, diff=s.diff/d;
  _caEl('ca-res-buy').textContent=_caFmtBRL(bNW);
  _caEl('ca-res-rent').textContent=_caFmtBRL(rNW);
  var de=_caEl('ca-res-diff');
  de.textContent=(diff>=0?'+':'')+_caFmtBRL(Math.abs(diff));
  de.style.color=Math.abs(diff)<1000?'var(--text2)':diff>0?'var(--pos,#16a34a)':'var(--blue,#1a3a5c)';
  _caEl('ca-res-buy-sub').textContent='Patrimônio após '+_ca.P.horizonYears+' anos';
  _caEl('ca-res-rent-sub').textContent='Patrimônio após '+_ca.P.horizonYears+' anos';
  _caEl('ca-res-diff-sub').textContent=diff>=0?'Vantagem para alugar + investir':'Vantagem para comprar';
  // Narrative
  var n='Imóvel de '+_caFmtBRL(_ca.P.propertyValue)+', aluguel '+_caFmtBRL2(_ca.P.monthlyRent);
  if(_ca.P.system!=='cash')n+=', '+_ca.P.system.toUpperCase()+' '+_ca.P.termYears+'a a '+_caFmtPct(_ca.P.rateAnnual)+' a.a.';else n+=', à vista';
  n+=', inflação '+_caFmtPct(_ca.P.inflation)+', retorno real '+_caFmtPct(_ca.P.investRealReturn)+' a.a., '+_ca.P.horizonYears+' anos';
  if(isR)n+=' (valores reais)';
  n+=': ';
  if(Math.abs(diff)<1000)n+='alternativas praticamente equivalentes.';
  else if(diff>0)n+='alugar + investir resulta em patrimônio '+_caFmtBRL(Math.abs(diff))+' superior.';
  else n+='comprar resulta em patrimônio '+_caFmtBRL(Math.abs(diff))+' superior.';
  _caEl('ca-narrative').innerHTML=n+'<br><span style="font-size:11px;color:var(--text2,#8e8e96)">Resultado depende das premissas. Alterações podem modificar significativamente o resultado.</span>';
}

/* ── Charts ── */
function _caChartColors() {
  var isLight=typeof _isLightMode==='function'?_isLightMode():document.body.classList.contains('light-mode');
  return{blue:isLight?'#1a3a5c':'#4a90c2',green:isLight?'#16a34a':'#22c55e',amber:'#D97706',navy:isLight?'#1a3a5c':'#60A5FA',gray:'#94A3B8',grid:isLight?'rgba(148,163,184,.12)':'rgba(148,163,184,.08)',text:isLight?'#64748B':'#94A3B8'};
}
function _caChartDefs() {
  var c=_caChartColors();
  return{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{family:'Inter',size:10},color:c.text,usePointStyle:true,pointStyle:'circle',padding:14}},tooltip:{backgroundColor:'rgba(15,23,42,.9)',titleFont:{family:'Inter',size:11},bodyFont:{family:'Inter',size:10},padding:10,cornerRadius:6,callbacks:{label:function(ctx){return ctx.dataset.label+': '+_caFmtBRL(ctx.parsed.y);}}}},scales:{x:{grid:{display:false},ticks:{font:{family:'Inter',size:9},color:c.text}},y:{grid:{color:c.grid},ticks:{font:{family:'Inter',size:9},color:c.text,callback:function(v){return _caFmtBRL(v);}}}}};
}
function _caYearlyData() {
  var pts=[],isR=_ca.valuation==='real';
  for(var i=0;i<_ca.sim.data.length;i++){if((i+1)%12===0){var d=_ca.sim.data[i],df=isR?d.def:1;pts.push({y:(i+1)/12,bNW:d.bNW/df,rNW:d.rNW/df,propV:d.propV/df,debt:d.debt/df,bFin:d.bFin/df,rFin:d.rFin/df,bEq:d.bEq/df});}}
  return pts;
}
function _caUpdateCharts() {
  if(!_ca.sim)return;
  var yd=_caYearlyData(),labels=yd.map(function(d){return d.y;}),c=_caChartColors(),df=_caChartDefs();
  // Main
  if(_ca.charts.main)_ca.charts.main.destroy();
  _ca.charts.main=new Chart(_caEl('ca-chart-main'),{type:'line',data:{labels:labels,datasets:[
    {label:'Comprar',data:yd.map(function(d){return d.bNW;}),borderColor:c.blue,backgroundColor:c.blue+'15',fill:true,borderWidth:2,pointRadius:0,tension:.3},
    {label:'Alugar + Investir',data:yd.map(function(d){return d.rNW;}),borderColor:c.green,backgroundColor:c.green+'15',fill:true,borderWidth:2,pointRadius:0,tension:.3}
  ]},options:Object.assign({},df,{scales:Object.assign({},df.scales,{x:Object.assign({},df.scales.x,{title:{display:true,text:'Anos',font:{family:'Inter',size:10},color:c.text}})})})});
  // Buyer
  if(_ca.charts.buyer)_ca.charts.buyer.destroy();
  _ca.charts.buyer=new Chart(_caEl('ca-chart-buyer'),{type:'line',data:{labels:labels,datasets:[
    {label:'Imóvel',data:yd.map(function(d){return d.propV;}),borderColor:c.blue,borderWidth:2,pointRadius:0,tension:.3},
    {label:'Dívida',data:yd.map(function(d){return d.debt;}),borderColor:c.amber,borderWidth:2,pointRadius:0,borderDash:[5,3],tension:.3},
    {label:'Equity',data:yd.map(function(d){return d.bEq;}),borderColor:c.navy,borderWidth:2,pointRadius:0,tension:.3},
    {label:'Financeiro',data:yd.map(function(d){return d.bFin;}),borderColor:c.green,borderWidth:1.5,pointRadius:0,borderDash:[3,3],tension:.3}
  ]},options:df});
  // Costs
  if(_ca.charts.costs)_ca.charts.costs.destroy();
  var s=_ca.sim.s,isR=_ca.valuation==='real',defV=isR?s.def:1;
  _ca.charts.costs=new Chart(_caEl('ca-chart-costs'),{type:'bar',data:{labels:['Comprador','Locatário'],datasets:[
    {label:'Juros',data:[s.tInt/defV,0],backgroundColor:c.amber+'CC'},
    {label:'Aquisição',data:[s.tAcq/defV,0],backgroundColor:c.navy+'AA'},
    {label:'Manutenção',data:[s.tMaint/defV,0],backgroundColor:c.gray+'AA'},
    {label:'Corretagem',data:[s.brok/defV,0],backgroundColor:'#475569AA'},
    {label:'Ganho Capital',data:[s.gcTax/defV,0],backgroundColor:'#92400EAA'},
    {label:'Aluguel',data:[0,s.tRent/defV],backgroundColor:c.green+'CC'},
    {label:'IR Invest.',data:[s.bITax/defV,s.rITax/defV],backgroundColor:'#D97706AA'}
  ]},options:Object.assign({},df,{indexAxis:'y',plugins:Object.assign({},df.plugins,{legend:Object.assign({},df.plugins.legend,{position:'bottom',labels:Object.assign({},df.plugins.legend.labels,{font:{family:'Inter',size:8}})})}),scales:{x:{stacked:true,grid:{color:c.grid},ticks:{font:{family:'Inter',size:9},color:c.text,callback:function(v){return _caFmtBRL(v);}}},y:{stacked:true,grid:{display:false},ticks:{font:{family:'Inter',size:10,weight:'600'},color:c.text}}}})});
  // Debt
  if(_ca.P.system!=='cash'){
    if(_ca.charts.debt)_ca.charts.debt.destroy();
    _ca.charts.debt=new Chart(_caEl('ca-chart-debt'),{type:'line',data:{labels:labels,datasets:[{label:'Saldo Devedor',data:yd.map(function(d){return d.debt;}),borderColor:c.amber,backgroundColor:c.amber+'15',fill:true,borderWidth:2,pointRadius:0,tension:.3}]},options:df});
  }
}

/* ── Sensitivity ── */
function _caUpdateSensitivity() {
  var appVals=[-2,-1,0,1,2,3],retVals=[2,3,4,5,6,7,8],results=[];
  for(var ri=0;ri<retVals.length;ri++){var row=[];for(var ai=0;ai<appVals.length;ai++){var tp=Object.assign({},_ca.P);tp.apprecMode='custom';tp.apprecCustom=_ca.P.inflation+appVals[ai];tp.investRealReturn=retVals[ri];var sim=_caRunSim(tp);row.push(sim.s.diff);}results.push(row);}
  var h='<table><thead><tr><th class="ca-corner">Ret. Real \\ Valoriz. Real</th>';
  appVals.forEach(function(a){h+='<th>'+(a>=0?'+':'')+a+' p.p.</th>';});
  h+='</tr></thead><tbody>';
  results.forEach(function(row,ri){
    h+='<tr><th>'+_caFmtPct(retVals[ri],0)+' a.a.</th>';
    row.forEach(function(diff){var isR=_ca.valuation==='real';if(isR&&_ca.sim)diff=diff/_ca.sim.s.def;var ad=Math.abs(diff),lbl=ad<1000?'~0':(diff>0?'+':'-')+_caFmtBRL(ad);var intensity=Math.min(1,ad/1000000);var bg;if(ad<5000)bg='transparent';else if(diff>0)bg='rgba(22,163,74,'+(intensity*.35)+')';else bg='rgba(26,58,92,'+(intensity*.35)+')';h+='<td style="background:'+bg+'">'+lbl+'</td>';});
    h+='</tr>';
  });
  h+='</tbody></table>';
  _caEl('ca-sensitivity').innerHTML=h;
}

/* ── Breakeven (bisection) ── */
function _caFindBE(param,min,max){
  for(var i=0;i<50;i++){var mid=(min+max)/2;var tp=Object.assign({},_ca.P);
    if(param==='rent')tp.monthlyRent=mid;
    else if(param==='return')tp.investRealReturn=mid;
    else if(param==='apprec'){tp.apprecMode='custom';tp.apprecCustom=tp.inflation+mid;}
    else if(param==='rate')tp.rateAnnual=mid;
    var sim=_caRunSim(tp),d=sim.s.diff;
    if(Math.abs(d)<100)return mid;
    if(param==='rent'){if(d>0)min=mid;else max=mid;}
    else if(param==='return'){if(d>0)max=mid;else min=mid;}
    else if(param==='apprec'){if(d>0)min=mid;else max=mid;}
    else if(param==='rate'){if(d>0)min=mid;else max=mid;}
  }return null;
}
function _caUpdateBreakeven() {
  var items=[];
  var beR=_caFindBE('rent',500,_ca.P.propertyValue*.02);items.push({q:'Aluguel que torna equivalente?',a:beR!=null?_caFmtBRL2(beR)+'/mês':'Não encontrado'});
  var beRet=_caFindBE('return',-5,20);items.push({q:'Retorno real que torna equivalente?',a:beRet!=null?_caFmtPct(beRet)+' a.a. (real)':'Não encontrado'});
  var beAp=_caFindBE('apprec',-5,15);items.push({q:'Valorização real que torna equivalente?',a:beAp!=null?_caFmtPct(beAp)+' a.a. acima da inflação':'Não encontrado'});
  if(_ca.P.system!=='cash'){var beRa=_caFindBE('rate',0,25);items.push({q:'Taxa de financiamento equivalente?',a:beRa!=null?_caFmtPct(beRa)+' a.a.':'Não encontrado'});}
  var h='';items.forEach(function(it){h+='<div class="ca-be-item"><div class="ca-be-q">'+it.q+'</div><div class="ca-be-a">'+it.a+'</div></div>';});
  _caEl('ca-breakeven').innerHTML=h;
}

/* ── Horizon tabs ── */
function _caUpdateHorizonTabs() {
  var hs=[5,10,15,20,25,30,35,40].filter(function(h){return h<=_ca.P.horizonYears;});
  if(hs.indexOf(_ca.P.horizonYears)<0)hs.push(_ca.P.horizonYears);
  hs.sort(function(a,b){return a-b;});
  var h='';hs.forEach(function(yr){h+='<button class="ca-tab'+(yr===_ca.selHorizon?' active':'')+'" onclick="CA.selectHorizon('+yr+')">'+yr+'a</button>';});
  _caEl('ca-horizon-tabs').innerHTML=h;
}

/* ── Wire sliders ── */
function _caWireSlider(sid,iid,fmt){
  var sl=_caEl(sid),inp=_caEl(iid);if(!sl||!inp)return;
  sl.addEventListener('input',function(){inp.value=fmt(parseFloat(sl.value));_caDebounce();});
  inp.addEventListener('change',function(){var v;if(fmt===_caFmtBRLIn)v=_caParseBRL(inp.value);else if(fmt===_caFmtPctIn)v=_caParsePct(inp.value);else v=parseInt(inp.value)||0;sl.value=v;_caDebounce();});
}
function _caFmtBRLIn(v){return _caFmtBRL(v);}
function _caFmtPctIn(v){return _caFmtPct(v)+' a.a.';}
function _caFmtYrsIn(v){return v+' anos';}

var _caTimer=null;
function _caDebounce(){clearTimeout(_caTimer);_caTimer=setTimeout(_caUpdateAll,150);}

function _caWireAll(){
  _caWireSlider('ca-sl-property','ca-property',_caFmtBRLIn);
  _caWireSlider('ca-sl-rent','ca-rent',_caFmtBRLIn);
  _caWireSlider('ca-sl-horizon','ca-horizon',_caFmtYrsIn);
  _caWireSlider('ca-sl-down','ca-down-pct',function(v){return _caFmtPct(v,0);});
  _caWireSlider('ca-sl-rate','ca-rate',function(v){return _caFmtPct(v)+' a.a.';});
  _caWireSlider('ca-sl-term','ca-term',_caFmtYrsIn);
  _caWireSlider('ca-sl-inflation','ca-inflation',function(v){return _caFmtPct(v)+' a.a.';});
  _caWireSlider('ca-sl-invest-real','ca-invest-real',function(v){return _caFmtPct(v)+' a.a.';});
  document.querySelectorAll('#view-comprar-alugar .ca-input, #view-comprar-alugar .ca-select').forEach(function(inp){
    if(!inp._caWired){inp.addEventListener('change',_caDebounce);inp._caWired=true;}
  });
}

/* ── Init ── */
var _caInited=false;
function _caInit(){
  if(!_caEl('ca-property'))return;
  if(!_caInited){
    Object.assign(_ca.P,CA_DEFAULTS);
    try{var saved=localStorage.getItem('dmf-ca-params');if(saved)Object.assign(_ca.P,JSON.parse(saved));}catch(e){}
    _caWriteParams();
    _caWireAll();
    _caInited=true;
  }
  _caUpdateAll();
}

/* ══════════════════════════════════════════════════════════════
   GLOBAL API
   ══════════════════════════════════════════════════════════════ */
window.CA = {
  toggleAdvanced: function(){
    var b=_caEl('ca-adv-toggle'),s=_caEl('ca-adv-section');
    b.classList.toggle('open');s.classList.toggle('show');
  },
  setValuation: function(v){
    _ca.valuation=v;
    _caEl('ca-btn-nom').classList.toggle('active',v==='nominal');
    _caEl('ca-btn-real').classList.toggle('active',v==='real');
    _caUpdateResults();_caUpdateCharts();_caUpdateSensitivity();
  },
  selectHorizon: function(yr){
    _ca.selHorizon=yr;
    // Approximate liquidation at this horizon
    if(_ca.sim&&yr<=_ca.P.horizonYears){
      var m=yr*12,d=_ca.sim.data[m-1];if(d){
        var isR=_ca.valuation==='real',df=isR?d.def:1;
        // Rough liquidation
        var brok=d.propV*_ca.P.corretagemPct/100,saleN=d.propV-brok;
        var cb=_ca.P.propertyValue+_ca.P.propertyValue*_ca.P.itbiPct/100+_ca.P.registro+_ca.P.avaliacao+_ca.P.outrosAquisicao;
        var cg=Math.max(0,saleN-cb-d.debt),gcT=cg*_ca.P.gcRate/100;
        var bNW=(saleN-d.debt-gcT+d.bFin)/df, rNW=d.rFin/df, diff=rNW-bNW;
        _caEl('ca-res-buy').textContent=_caFmtBRL(bNW);
        _caEl('ca-res-rent').textContent=_caFmtBRL(rNW);
        var de=_caEl('ca-res-diff');
        de.textContent=(diff>=0?'+':'')+_caFmtBRL(Math.abs(diff));
        de.style.color=Math.abs(diff)<1000?'var(--text2)':diff>0?'var(--pos,#16a34a)':'var(--blue,#1a3a5c)';
        _caEl('ca-res-buy-sub').textContent='Patrimônio após '+yr+' anos';
        _caEl('ca-res-rent-sub').textContent='Patrimônio após '+yr+' anos';
        _caEl('ca-res-diff-sub').textContent=diff>=0?'Vantagem para alugar + investir':'Vantagem para comprar';
      }
    }
    _caUpdateHorizonTabs();
  },
  resetDefaults: function(){Object.assign(_ca.P,CA_DEFAULTS);_caWriteParams();_caUpdateAll();},
  saveLocal: function(){try{localStorage.setItem('dmf-ca-params',JSON.stringify(_ca.P));_caShowToast('Simulação salva');}catch(e){_caShowToast('Erro ao salvar');}},
  share: function(){
    var keys=['propertyValue','monthlyRent','downPct','system','rateAnnual','termYears','inflation','investRealReturn','apprecMode','apprecCustom','horizonYears'];
    var params=[];keys.forEach(function(k){if(_ca.P[k]!==CA_DEFAULTS[k])params.push('ca_'+k+'='+encodeURIComponent(_ca.P[k]));});
    var url=window.location.origin+window.location.pathname+'?'+params.join('&');
    navigator.clipboard.writeText(url).then(function(){_caShowToast('Link copiado');}).catch(function(){prompt('Copie o link:',url);});
  }
};

function _caShowToast(msg){
  var t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card,#151518);color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;font-family:Inter,sans-serif;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
  t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove();},2500);
}
