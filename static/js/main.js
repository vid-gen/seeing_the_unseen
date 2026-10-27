/* Seeing the Unseen — project page behaviour. Vanilla JS, no build step. */
(function () {
  'use strict';

  var CONFIG = window.SITE_CONFIG || {};
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
   * DATA — every value is copied verbatim from the paper (decimals preserved).
   * null = unsupported case ("–" in the paper).
   * ======================================================================== */
  var SCENARIOS = [
    { id: 'domino',             name: 'Domino',                short: 'Domino',      aliases: ['domino'] },
    { id: 'collision',          name: 'Collision',             short: 'Collision',   aliases: ['collision', 'collide'] },
    { id: 'free_fall',          name: 'Free Fall',             short: 'Free Fall',   aliases: ['free_fall', 'freefall', 'free fall', 'ff'] },
    { id: 'collision_domino',   name: 'Collision + Domino',    short: 'Coll.+Dom.',  aliases: ['collision_domino', 'coll.+dom.', 'collision+domino', 'collision + domino'] },
    { id: 'freefall_domino',    name: 'Free Fall + Domino',    short: 'F.F.+Dom.',   aliases: ['freefall_domino', 'free_fall_domino', 'f.f.+dom.', 'free fall+domino', 'free fall + domino'] },
    { id: 'freefall_collision', name: 'Free Fall + Collision', short: 'F.F.+Coll.',  aliases: ['freefall_collision', 'free_fall_collision', 'f.f.+coll.', 'free fall+collision', 'free fall + collision'] },
    { id: 'translation',        name: 'Translation',           short: 'Translation', aliases: ['translation'] }
  ];

  /* Main results: SA, PC per scenario in SCENARIOS order (14 values per row). */
  var MAIN_TABLE = [
    { group: 'Open-source video generation models', rows: [
      { method: 'Wan2.2-I2V-14B',   v: ['2.483', '3.017', '2.750', '3.083', '2.317', '3.033', '2.217', '3.050', '2.533', '2.950', '2.517', '3.000', '3.000', '4.000'] },
      { method: 'Wan2.2-TI2V-5B',   v: ['2.650', '3.033', '2.917', '3.067', '2.183', '3.083', '2.200', '3.033', '2.467', '3.033', '2.183', '3.083', '3.000', '4.100'], backbone: true },
      { method: 'HunyuanVideo-1.5', v: ['2.550', '3.017', '2.867', '3.067', '2.317', '3.017', '2.233', '3.000', '2.617', '2.950', '2.467', '3.000', '3.050', '3.933'] },
      { method: 'CogVideoX1.5-5B',  v: ['2.450', '3.200', '2.833', '3.017', '2.333', '3.000', '2.300', '2.983', '2.650', '3.000', '2.333', '3.000', '3.050', '3.933'] }
    ] },
    { group: 'Physics-aware models', rows: [
      { method: 'PhysT2V',   v: ['2.267', '3.867', '2.533', '3.400', '2.050', '4.283', '2.283', '3.267', '2.383', '3.333', '2.117', '3.933', '3.033', '4.400'] },
      { method: 'NewtonGen', v: [null, null, null, null, null, null, null, null, null, null, null, null, '3.033', '3.983'] },
      { method: 'PhysCtrl',  v: [null, null, null, null, null, null, null, null, null, null, null, null, '2.867', '4.567'] }
    ] },
    { group: 'Closed-source video generation models', rows: [
      { method: 'Wan-2.7', v: ['2.200', '2.800', '2.800', '3.000', '2.400', '3.000', '2.200', '3.000', '2.400', '2.800', '2.200', '3.000', '3.000', '4.600'] },
      { method: 'Veo 3.1', v: ['2.800', '3.000', '2.800', '3.000', '2.400', '3.000', '2.400', '3.000', '2.800', '3.000', '2.200', '3.000', '3.200', '4.000'] }
    ] },
    { group: null, rows: [
      { method: 'Ours', v: ['3.976', '4.013', '4.160', '4.394', '4.347', '4.328', '3.854', '4.016', '3.985', '4.017', '4.327', '4.589', '4.013', '4.578'], ours: true }
    ] }
  ];

  /* Injection strategies & visible-only ablation (Domino, Collision, Free Fall, Translation; SA, PC). */
  var ABLATION = {
    scenarios: ['Domino', 'Collision', 'Free Fall', 'Translation'],
    groups: [
      { rows: [
        { method: 'Go with Flow',        v: ['2.583', '3.389', '3.275', '3.691', '3.670', '3.928', '3.568', '4.419'] },
        { method: 'Wan-Move',            v: ['2.672', '3.351', '3.594', '3.771', '3.892', '4.017', '4.167', '4.602'] },
        { method: 'Diffusion as Shader', v: ['2.640', '3.295', '3.697', '3.829', '3.764', '3.923', '3.821', '4.493'] }
      ] },
      { rows: [
        { method: 'Ours (visible-only)', v: ['2.693', '3.348', '3.693', '3.717', '3.972', '4.004', '3.837', '4.521'], tag: 'vis' },
        { method: 'Ours (full)',         v: ['3.976', '4.013', '4.160', '4.394', '4.347', '4.328', '4.013', '4.578'], ours: true }
      ] }
    ]
  };

  /* PGDS motion prediction on Physion++. Energy bias uses ASCII '-' here and is rendered as a minus sign. */
  var PGDS = {
    head: ['Scenario', 'Vel. RMSE (m/s) ↓', 'Acc-V strict (%) ↑', 'Acc-V relaxed (%) ↑', 'Energy bias (%)'],
    rows: [
      ['Dominoes', '0.0077', '99.20', '99.65', '-4.7'],
      ['Collide',  '0.0359', '95.04', '98.79', '-5.5'],
      ['Support',  '0.0209', '96.16', '98.36', '-6.5'],
      ['Link',     '0.0284', '94.51', '98.14', '+2.6'],
      ['Contain',  '0.0171', '96.59', '98.94', '-3.8'],
      ['Roll',     '0.0384', '95.48', '98.27', '-5.5'],
      ['Drop',     '0.0264', '94.48', '96.47', '-1.2']
    ],
    average: ['Average', '0.0250', '95.92', '98.37', '-3.5']
  };

  /* Configuration efficiency of trajectory generation methods. */
  var EFFICIENCY = {
    head: ['Method', 'Type', 'Manual phys. params ↓', 'Precise 3D mesh', 'Total runtime (incl. manual tuning) ↓', 'Unseen shapes'],
    groups: [
      [
        ['PhysGen',    'Simulator', '~6–10', 'Required', '~10 min', 'Limited'],
        ['PhysMotion', 'Simulator', '~6–8',  'Required', '~10 min', 'Limited'],
        ['PhysGen3D',  'Simulator', '~5–7',  'Required', '~10 min', 'Limited']
      ],
      [
        ['PhysCtrl',  'Data-driven', '~3–5', 'Partial',      '~8 min', 'Moderate'],
        ['NewtonGen', 'Data-driven', '~2–3', 'Not required', '~6 min', 'Limited']
      ],
      [
        ['PhysT2V', 'LVLM-based', '–', 'Not required', '~2 min', 'Moderate']
      ],
      [
        ['PGDS (Ours)', 'Learned Sim.', '0', 'Required', '~5 min', 'Strong']
      ]
    ]
  };

  /* VideoPhy2 compatible subset. */
  var VIDEOPHY2 = [
    { method: 'CogVideoX-5B',        v: ['3.21', '3.65'] },
    { method: 'Wan2.2-5B',           v: ['3.14', '3.46'] },
    { method: 'Ours (visible-only)', v: ['3.47', '3.78'], tag: 'vis' },
    { method: 'Ours',                v: ['4.01', '4.13'], ours: true }
  ];

  /* ==========================================================================
   * Helpers
   * ======================================================================== */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var val = attrs[k];
        if (val === null || val === undefined || val === false) return;
        if (k === 'class') node.className = val;
        else if (k === 'text') node.textContent = val;
        else node.setAttribute(k, val === true ? '' : val);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }
  function fmtSigned(s) { return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function isHttpUrl(s) { return typeof s === 'string' && /^https?:\/\/\S+$/i.test(s.trim()); }
  /* Index of the max numeric value per column (ties all win). */
  function bestPerColumn(rows, ncol) {
    var best = [];
    for (var c = 0; c < ncol; c++) {
      var max = -Infinity;
      rows.forEach(function (r) { if (r.v[c] !== null && parseFloat(r.v[c]) > max) max = parseFloat(r.v[c]); });
      best.push(max);
    }
    return best;
  }

  /* ==========================================================================
   * Links (config.links) — empty → "Coming soon", disabled, no href
   * ======================================================================== */
  function initLinks() {
    var links = CONFIG.links || {};
    $$('[data-link]').forEach(function (a) {
      var key = a.getAttribute('data-link');
      var url = links[key];
      var labelHost = $('.button-label', a) || a;
      var base = a.getAttribute('data-label') || labelHost.textContent;
      if (isHttpUrl(url)) {
        a.setAttribute('href', url.trim());
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        a.classList.remove('is-soon');
        a.removeAttribute('aria-disabled');
        labelHost.textContent = base;
      } else {
        a.removeAttribute('href');
        a.classList.add('is-soon');
        a.setAttribute('aria-disabled', 'true');
        a.setAttribute('title', base + ' — coming soon');
        labelHost.textContent = '';
        labelHost.appendChild(document.createTextNode(base));
        labelHost.appendChild(el('small', { class: 'soon-tag', text: 'Coming soon' }));
      }
    });
  }

  /* ==========================================================================
   * Navigation: theme over dark sections, active section, mobile menu
   * ======================================================================== */
  function initNav() {
    var nav = $('#site-nav');
    if (!nav) return;
    var darkSections = $$('.is-dark').filter(function (s) { return s !== nav; });
    var ticking = false;
    function update() {
      ticking = false;
      var probe = nav.getBoundingClientRect();
      var y = probe.top + probe.height / 2;
      var onDark = darkSections.some(function (s) {
        var r = s.getBoundingClientRect();
        return r.top <= y && r.bottom >= y;
      });
      nav.setAttribute('data-theme', onDark ? 'dark' : 'light');
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    /* active section */
    var links = $$('[data-nav]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('data-nav')] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
          var a = map[e.target.id];
          if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
      var hero = document.getElementById('top');
      var premise = document.getElementById('premise');
      var clearIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      if (hero) clearIo.observe(hero);
      if (premise) clearIo.observe(premise);
    }

    /* mobile menu */
    var toggle = $('#nav-toggle');
    var menu = $('#nav-links');
    function close() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open section menu');
    }
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close section menu' : 'Open section menu');
      });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
  }

  /* ==========================================================================
   * Scroll reveal
   * ======================================================================== */
  function initReveal() {
    var items = $$('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ==========================================================================
   * Generic tablist (roving tabindex + arrow keys)
   * ======================================================================== */
  function bindTablist(list, onSelect) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      function panelOf(t) { var id = t.getAttribute('aria-controls'); return id && document.getElementById(id); }
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = panelOf(t);
        if (panel) panel.hidden = true;
      });
      /* show the selected panel last, so tabs that share one panel (the chart) keep it visible */
      var shown = panelOf(tab);
      if (shown) shown.hidden = false;
      if (focus) tab.focus();
      if (tab.scrollIntoView && list.scrollWidth > list.clientWidth) {
        var lr = list.getBoundingClientRect(), tr = tab.getBoundingClientRect();
        if (tr.left < lr.left || tr.right > lr.right) list.scrollLeft += tr.left - lr.left - 16;
      }
      if (onSelect) onSelect(tab);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        else if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (k === 'Home') n = tabs[0];
        else if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    return { select: select, tabs: tabs };
  }

  /* ==========================================================================
   * Comparison scenario tabs
   * ======================================================================== */
  function initFigureTabs() {
    $$('[data-tabs="figures"]').forEach(function (list) {
      bindTablist(list, function () {
        $$('.tab-panel[hidden] video').forEach(function (video) { video.pause(); });
      });
    });
  }

  function initVideoComparison(panelId, prefix) {
    var panel = $(panelId);
    if (!panel) return;
    var videos = $$('video', panel);
    var status = $('#' + prefix + '-status');
    function pauseAll() { videos.forEach(function (video) { video.pause(); }); }
    function playAll(restart) {
      status.textContent = '';
      videos.forEach(function (video) {
        if (restart) video.currentTime = 0;
        video.muted = true;
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function (error) {
          if (error.name !== 'AbortError') status.textContent = 'A video could not start. Try its individual play control.';
        });
      });
    }
    $('#' + prefix + '-play').addEventListener('click', function () { playAll(false); });
    $('#' + prefix + '-pause').addEventListener('click', pauseAll);
    $('#' + prefix + '-restart').addEventListener('click', function () { playAll(true); });
    videos.forEach(function (video) {
      $('source', video).addEventListener('error', function () {
        status.textContent = 'A video could not load. Please check the video files and reload.';
      });
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pauseAll(); });
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) pauseAll();
      });
      observer.observe(panel);
    }
  }

  /* ==========================================================================
   * Benchmark: chart + tables
   * ======================================================================== */
  var chartApi = null;
  var allMainRows = [];
  MAIN_TABLE.forEach(function (g) { g.rows.forEach(function (r) { allMainRows.push(r); }); });
  var MAIN_BEST = bestPerColumn(allMainRows, 14);

  function initChart() {
    var tabsHost = $('#chart-tabs');
    var chart = $('#bar-chart');
    var tip = $('#chart-tooltip');
    var caption = $('#chart-caption');
    var card = $('#score-chart');
    if (!tabsHost || !chart) return;
    var MIN = 1, MAX = 5; /* the 1–5 rating scale */
    var current = 0;

    SCENARIOS.forEach(function (sc, i) {
      tabsHost.appendChild(el('button', {
        type: 'button', role: 'tab', id: 'ctab-' + sc.id, 'aria-controls': 'bar-chart',
        'aria-selected': i === 0 ? 'true' : 'false', tabindex: i === 0 ? '0' : '-1', 'data-index': String(i)
      }, [sc.short]));
    });

    /* position on the 1–5 scale; the rightmost --vpad of each track is reserved for value labels */
    function pos(v) { return 'calc((100% - var(--vpad)) * ' + ((parseFloat(v) - MIN) / (MAX - MIN)).toFixed(4) + ')'; }

    function rankOf(col, value) {
      var vals = allMainRows.map(function (r) { return r.v[col]; }).filter(function (x) { return x !== null; })
        .map(parseFloat).sort(function (a, b) { return b - a; });
      return { rank: vals.indexOf(parseFloat(value)) + 1, of: vals.length };
    }

    function render(idx) {
      current = idx;
      var sc = SCENARIOS[idx];
      var cSA = idx * 2, cPC = idx * 2 + 1;
      chart.innerHTML = '';
      caption.textContent = sc.name + ' · SA and PC for every method (1–5 scale)';
      chart.setAttribute('aria-label', 'Bar chart of SA and PC scores for ' + sc.name + '. The same values are listed in the results table below.');

      var axisInner = el('div', { class: 'bar-axis-inner' });
      var gridInner = el('div', { class: 'bar-grid', 'aria-hidden': 'true' });
      for (var t = MIN; t <= MAX; t++) {
        axisInner.appendChild(el('span', { class: 'tick', style: 'left:' + pos(t), text: String(t) }));
        gridInner.appendChild(el('span', { class: 'gridline', style: 'left:' + pos(t) }));
      }
      var axis = el('div', { class: 'bar-axis', 'aria-hidden': 'true' }, [el('span', { class: 'bar-axis-label', text: 'score' }), axisInner]);
      var body = el('div', { class: 'bar-body' }, [gridInner]);

      MAIN_TABLE.forEach(function (g) {
        if (g.group) body.appendChild(el('div', { class: 'bar-group', text: g.group }));
        g.rows.forEach(function (r) {
          var sa = r.v[cSA], pc = r.v[cPC];
          var row = el('div', { class: 'bar-row' + (r.ours ? ' bar-row--ours' : '') + (sa === null ? ' bar-row--na' : '') });
          row.appendChild(el('span', { class: 'bar-label' }, [r.method, r.backbone ? el('small', { text: 'backbone' }) : null]));
          var track = el('div', { class: 'bar-track' });
          if (sa === null) {
            track.appendChild(el('span', { class: 'bar-na', text: 'not supported for this scenario' }));
          } else {
            [['SA', sa, cSA], ['PC', pc, cPC]].forEach(function (m) {
              var isBest = parseFloat(m[1]) === MAIN_BEST[m[2]];
              var bar = el('div', {
                class: 'bar bar--' + m[0].toLowerCase() + (isBest ? ' is-best' : ''),
                tabindex: '0',
                'data-method': r.method, 'data-metric': m[0], 'data-value': m[1], 'data-col': String(m[2])
              }, [
                el('span', { class: 'bar-fill', style: 'width:' + (REDUCED ? pos(m[1]) : '0px'), 'data-w': pos(m[1]) }),
                el('span', { class: 'bar-value' }, [m[1], isBest ? el('span', { class: 'best-pill', text: 'best' }) : null])
              ]);
              bar.setAttribute('aria-label', r.method + ', ' + m[0] + ' ' + m[1] + (isBest ? ', best in column' : ''));
              track.appendChild(bar);
            });
          }
          row.appendChild(track);
          body.appendChild(row);
        });
      });
      chart.appendChild(body);
      chart.appendChild(axis);
      if (!REDUCED) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            $$('.bar-fill', chart).forEach(function (f) { f.style.width = f.getAttribute('data-w'); });
          });
        });
      }
      highlightColumn(idx);
    }

    /* tooltip */
    function showTip(bar, x, y) {
      var col = parseInt(bar.getAttribute('data-col'), 10);
      var val = bar.getAttribute('data-value');
      var rk = rankOf(col, val);
      var backbone = allMainRows.filter(function (r) { return r.backbone; })[0];
      var bVal = backbone.v[col];
      tip.innerHTML = '';
      tip.appendChild(el('b', { text: bar.getAttribute('data-method') }));
      tip.appendChild(el('span', { text: SCENARIOS[current].name + ' · ' + bar.getAttribute('data-metric') + ' ' + val }));
      tip.appendChild(el('span', { class: 'tip-muted', text: 'Rank ' + rk.rank + ' of ' + rk.of + (bar.getAttribute('data-method') !== backbone.method ? ' · backbone ' + bVal : '') }));
      tip.hidden = false;
      var cr = card.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = Math.min(Math.max(x - cr.left + 14, 8), cr.width - tw - 8);
      var top = y - cr.top - th - 12;
      if (top < 8) top = y - cr.top + 18;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }
    chart.addEventListener('pointermove', function (e) {
      var bar = e.target.closest && e.target.closest('.bar');
      if (!bar) { tip.hidden = true; return; }
      showTip(bar, e.clientX, e.clientY);
    });
    chart.addEventListener('pointerleave', function () { tip.hidden = true; });
    chart.addEventListener('focusin', function (e) {
      var bar = e.target.closest && e.target.closest('.bar');
      if (!bar) return;
      var r = bar.getBoundingClientRect();
      showTip(bar, r.left + r.width * 0.6, r.top);
    });
    chart.addEventListener('focusout', function () { tip.hidden = true; });

    var api = bindTablist(tabsHost, function (tab) { render(parseInt(tab.getAttribute('data-index'), 10)); });
    chartApi = {
      select: function (i) { api.select(api.tabs[i], false); }
    };
    render(0);
  }

  function highlightColumn(idx) {
    var table = $('#main-table');
    if (!table) return;
    $$('[data-scn]', table).forEach(function (c) {
      c.classList.toggle('is-active-col', parseInt(c.getAttribute('data-scn'), 10) === idx);
    });
  }

  function numCell(value, isBest, scn) {
    var td = el('td', { class: 'num' + (isBest ? ' is-best' : ''), 'data-scn': scn === undefined ? null : String(scn) });
    if (value === null) { td.textContent = '–'; td.classList.add('na'); td.setAttribute('aria-label', 'unsupported'); return td; }
    if (isBest) { td.appendChild(el('strong', { class: 'best-pill best-pill--value', title: 'Best in column', text: value })); td.setAttribute('aria-label', value + ', best in column'); }
    else td.textContent = value;
    return td;
  }

  function initMainTable() {
    var table = $('#main-table');
    if (!table) return;
    var thead = el('thead');
    var h1 = el('tr', null, [el('th', { rowspan: '2', class: 'col-method', scope: 'col', text: 'Method' })]);
    var h2 = el('tr');
    SCENARIOS.forEach(function (sc, i) {
      var btn = el('button', { type: 'button', class: 'th-button', title: 'Show ' + sc.name + ' in the chart', text: sc.short });
      btn.addEventListener('click', function () {
        if (chartApi) chartApi.select(i);
        var card = $('#score-chart');
        if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      });
      h1.appendChild(el('th', { colspan: '2', scope: 'colgroup', class: 'scn-head', 'data-scn': String(i) }, [btn]));
      h2.appendChild(el('th', { scope: 'col', class: 'sub', 'data-scn': String(i), text: 'SA' }));
      h2.appendChild(el('th', { scope: 'col', class: 'sub', 'data-scn': String(i), text: 'PC' }));
    });
    thead.appendChild(h1); thead.appendChild(h2);
    table.appendChild(thead);
    var tbody = el('tbody');
    MAIN_TABLE.forEach(function (g) {
      if (g.group) tbody.appendChild(el('tr', { class: 'group-row' }, [el('th', { colspan: '15', scope: 'rowgroup', text: g.group })]));
      g.rows.forEach(function (r) {
        var tr = el('tr', { class: r.ours ? 'ours-row' : null }, [
          el('th', { scope: 'row', class: 'col-method' }, [r.method, r.backbone ? el('small', { class: 'row-note', text: 'backbone' }) : null])
        ]);
        r.v.forEach(function (val, c) { tr.appendChild(numCell(val, val !== null && parseFloat(val) === MAIN_BEST[c], Math.floor(c / 2))); });
        tbody.appendChild(tr);
      });
    });
    table.appendChild(tbody);
    highlightColumn(0);
  }

  function initAblationTable() {
    var table = $('#ablation-tbl');
    if (!table) return;
    var rows = [];
    ABLATION.groups.forEach(function (g) { g.rows.forEach(function (r) { rows.push(r); }); });
    var best = bestPerColumn(rows, 8);
    var h1 = el('tr', null, [el('th', { rowspan: '2', class: 'col-method', scope: 'col', text: 'Method' })]);
    var h2 = el('tr');
    ABLATION.scenarios.forEach(function (s) {
      h1.appendChild(el('th', { colspan: '2', scope: 'colgroup', class: 'scn-head', text: s }));
      h2.appendChild(el('th', { scope: 'col', class: 'sub', text: 'SA' }));
      h2.appendChild(el('th', { scope: 'col', class: 'sub', text: 'PC' }));
    });
    table.appendChild(el('thead', null, [h1, h2]));
    var tbody = el('tbody');
    ABLATION.groups.forEach(function (g, gi) {
      g.rows.forEach(function (r, ri) {
        var cls = [];
        if (r.ours) cls.push('ours-row');
        if (r.tag === 'vis') cls.push('vis-row');
        if (gi > 0 && ri === 0) cls.push('rule-top');
        var tr = el('tr', { class: cls.join(' ') || null }, [el('th', { scope: 'row', class: 'col-method', text: r.method })]);
        r.v.forEach(function (val, c) { tr.appendChild(numCell(val, parseFloat(val) === best[c])); });
        tbody.appendChild(tr);
      });
    });
    table.appendChild(tbody);
  }

  function initVideoPhy2Table() {
    var table = $('#videophy2-tbl');
    if (!table) return;
    var best = bestPerColumn(VIDEOPHY2, 2);
    table.appendChild(el('thead', null, [el('tr', null, [
      el('th', { scope: 'col', class: 'col-method', text: 'Model' }),
      el('th', { scope: 'col', text: 'SA ↑' }),
      el('th', { scope: 'col', text: 'PC ↑' })
    ])]));
    var tbody = el('tbody');
    VIDEOPHY2.forEach(function (r) {
      var cls = r.ours ? 'ours-row rule-top' : (r.tag === 'vis' ? 'vis-row' : null);
      var tr = el('tr', { class: cls }, [el('th', { scope: 'row', class: 'col-method', text: r.method })]);
      r.v.forEach(function (val, c) { tr.appendChild(numCell(val, parseFloat(val) === best[c])); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }

  function initPgdsTable() {
    var table = $('#pgds-tbl');
    if (!table) return;
    table.appendChild(el('thead', null, [el('tr', null, PGDS.head.map(function (h, i) {
      return el('th', { scope: 'col', class: i === 0 ? 'col-method' : null, text: h });
    }))]));
    var tbody = el('tbody');
    function row(cells, cls) {
      return el('tr', { class: cls || null }, cells.map(function (c, i) {
        if (i === 0) return el('th', { scope: 'row', class: 'col-method', text: c });
        return el('td', { class: 'num', text: i === 4 ? fmtSigned(c) : c });
      }));
    }
    PGDS.rows.forEach(function (r) { tbody.appendChild(row(r)); });
    tbody.appendChild(row(PGDS.average, 'avg-row rule-top'));
    table.appendChild(tbody);
  }

  function initEfficiencyTable() {
    var table = $('#efficiency-tbl');
    if (!table) return;
    table.appendChild(el('thead', null, [el('tr', null, EFFICIENCY.head.map(function (h, i) {
      return el('th', { scope: 'col', class: i === 0 ? 'col-method' : null, text: h });
    }))]));
    var tbody = el('tbody');
    EFFICIENCY.groups.forEach(function (g, gi) {
      g.forEach(function (r, ri) {
        var ours = r[0].indexOf('Ours') !== -1;
        var cls = [];
        if (ours) cls.push('ours-row');
        if (gi > 0 && ri === 0) cls.push('rule-top');
        tbody.appendChild(el('tr', { class: cls.join(' ') || null }, r.map(function (c, i) {
          if (i === 0) return el('th', { scope: 'row', class: 'col-method', text: c });
          var td = el('td', { 'data-kind': i === 1 ? 'type' : (i === 5 ? 'gen' : null) });
          if (i === 5) td.appendChild(el('span', { class: 'gen-tag gen-tag--' + c.toLowerCase(), text: c }));
          else if (ours && (i === 2 || i === 4)) td.appendChild(el('strong', { text: c }));
          else td.textContent = c;
          return td;
        })));
      });
    });
    table.appendChild(tbody);
  }

  /* ==========================================================================
   * Lightbox
   * ======================================================================== */
  function initLightbox() {
    var box = $('#lightbox');
    if (!box) return;
    var img = $('#lightbox-img');
    var cap = $('#lightbox-caption');
    var stage = $('#lightbox-stage');
    var closeBtn = $('#lightbox-close');
    var lastFocus = null;
    function open(src) {
      lastFocus = document.activeElement;
      img.src = src.currentSrc || src.src;
      img.alt = src.alt || '';
      var fig = src.closest('figure');
      var fc = fig && $('figcaption', fig);
      cap.textContent = fc ? fc.textContent.replace(/\s+/g, ' ').trim() : '';
      box.classList.remove('is-zoomed');
      box.hidden = false;
      document.documentElement.classList.add('no-scroll');
      window.requestAnimationFrame(function () { box.classList.add('is-open'); });
      closeBtn.focus();
    }
    function close() {
      box.classList.remove('is-open');
      box.hidden = true;
      document.documentElement.classList.remove('no-scroll');
      img.removeAttribute('src');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $$('img[data-zoom]').forEach(function (i) {
      i.setAttribute('tabindex', '0');
      i.setAttribute('role', 'button');
      i.setAttribute('aria-label', 'Enlarge figure: ' + (i.alt || ''));
      i.addEventListener('click', function () { open(i); });
      i.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    closeBtn.addEventListener('click', close);
    stage.addEventListener('click', function (e) {
      if (e.target === img) box.classList.toggle('is-zoomed');
      else close();
    });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
    });
  }

  /* ==========================================================================
   * BibTeX copy
   * ======================================================================== */
  function initCopy() {
    var btn = $('#copy-bib');
    var code = $('#bib-code');
    if (!btn || !code) return;
    var label = $('span', btn);
    function done(ok) {
      label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      btn.classList.toggle('is-done', ok);
      setTimeout(function () { label.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
    }
    function fallback(text) {
      var ta = el('textarea', { readonly: true, 'aria-hidden': 'true' });
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.top = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (!ok) { var r = document.createRange(); r.selectNodeContents(code); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
      done(ok);
    }
    btn.addEventListener('click', function () {
      var text = code.textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(text); });
      } else fallback(text);
    });
  }

  /* ==========================================================================
   * Boot
   * ======================================================================== */
  function boot() {
    initLinks();
    initNav();
    initFigureTabs();
    initVideoComparison('#motion-streams', 'streams');
    initVideoComparison('#motion-ablation', 'ablation');
    initVideoComparison('#figpanel-domino', 'domino');
    initVideoComparison('#figpanel-tr', 'translation');
    initVideoComparison('#figpanel-col', 'collision');
    initVideoComparison('#figpanel-ff', 'freefall');
    initVideoComparison('#figpanel-ffc', 'freefall-collision');
    initMainTable();
    initChart();
    initAblationTable();
    initVideoPhy2Table();
    initPgdsTable();
    initEfficiencyTable();
    initLightbox();
    initCopy();
    initReveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* exposed read-only for verification/debugging */
  window.SEEING_UNSEEN_DATA = { SCENARIOS: SCENARIOS, MAIN_TABLE: MAIN_TABLE, ABLATION: ABLATION, PGDS: PGDS, EFFICIENCY: EFFICIENCY, VIDEOPHY2: VIDEOPHY2 };
})();
