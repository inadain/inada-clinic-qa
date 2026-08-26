/* いなだ医院 健康相談室 — 記事検索 */
(function () {
  'use strict';

  var box = document.getElementById('q');
  if (!box) return;

  var status = document.getElementById('search-status');
  var nav = document.querySelector('.category-nav');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.faq-card'));
  var noResult = document.getElementById('no-result');

  // 検索用テキストを事前に用意（カード本文＋セクション見出し＋別名キーワード）
  cards.forEach(function (c) {
    var sec = c.closest('section');
    var label = sec ? (sec.querySelector('.section-label') || {}).textContent || '' : '';
    var alias = c.getAttribute('data-alias') || '';
    c._t = (c.textContent + ' ' + label + ' ' + alias)
      .replace(/\s+/g, ' ')
      .toLowerCase();
  });

  function normalize(s) {
    // 全角英数→半角、カタカナはそのまま、小文字化
    return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    }).toLowerCase().trim();
  }

  function run() {
    var q = normalize(box.value);
    var terms = q.split(/[\s　]+/).filter(Boolean);

    if (!terms.length) {
      cards.forEach(function (c) { c.style.display = ''; });
      sections.forEach(function (s) { s.style.display = ''; });
      if (nav) nav.style.display = '';
      if (noResult) noResult.style.display = 'none';
      if (status) status.textContent = '';
      return;
    }

    var hit = 0;
    cards.forEach(function (c) {
      var ok = terms.every(function (t) { return c._t.indexOf(t) !== -1; });
      c.style.display = ok ? '' : 'none';
      if (ok) hit++;
    });

    // 該当カードが1件もないセクションは隠す
    sections.forEach(function (s) {
      var any = Array.prototype.some.call(
        s.querySelectorAll('.faq-card'),
        function (c) { return c.style.display !== 'none'; }
      );
      s.style.display = any ? '' : 'none';
    });

    if (nav) nav.style.display = 'none';
    if (noResult) noResult.style.display = hit ? 'none' : '';
    if (status) {
      status.innerHTML = hit
        ? '「' + escapeHtml(box.value.trim()) + '」の検索結果：<strong>' + hit + '件</strong>'
        : '';
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  var timer;
  box.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  });

  // Enter でのフォーム送信を抑止
  box.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); run(); }
  });

  // よく使うキーワードのタグから検索
  document.querySelectorAll('[data-q]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      box.value = el.getAttribute('data-q');
      run();
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();

/* ---------------------------------------------------------------
   表示モードの切り替え（スマホ ⇄ PC版レイアウト）
   選択は localStorage に保存し、次回以降も維持する
   --------------------------------------------------------------- */
(function () {
  'use strict';

  var KEY = 'inada-view-mode';
  var vp = document.querySelector('meta[name="viewport"]');
  if (!vp) return;

  var MOBILE_VP = 'width=device-width, initial-scale=1.0';
  var DESKTOP_VP = 'width=1024';

  function apply(mode) {
    if (mode === 'desktop') {
      document.documentElement.classList.add('force-desktop');
      vp.setAttribute('content', DESKTOP_VP);
    } else {
      document.documentElement.classList.remove('force-desktop');
      vp.setAttribute('content', MOBILE_VP);
    }
    var btn = document.getElementById('view-toggle-btn');
    if (btn) {
      btn.textContent = (mode === 'desktop') ? '📱 スマホ版で表示する' : '🖥 PC版で表示する';
      btn.setAttribute('aria-label', btn.textContent);
    }
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* プライベートモード等 */ }
  if (saved === 'desktop') apply('desktop');

  function mount() {
    if (document.querySelector('.view-toggle')) return;
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    var wrap = document.createElement('div');
    wrap.className = 'view-toggle';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'view-toggle-btn';
    btn.textContent = (saved === 'desktop') ? '📱 スマホ版で表示する' : '🖥 PC版で表示する';
    btn.addEventListener('click', function () {
      var next = document.documentElement.classList.contains('force-desktop') ? 'mobile' : 'desktop';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* 保存できなくても動作は継続 */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    wrap.appendChild(btn);
    footer.parentNode.insertBefore(wrap, footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* ---------------------------------------------------------------
   目次：スマホでは折りたたんで表示する
   --------------------------------------------------------------- */
(function () {
  'use strict';
  var toc = document.querySelector('nav.toc');
  if (!toc) return;
  if (!window.matchMedia || !window.matchMedia('(max-width: 700px)').matches) return;

  var title = toc.querySelector('.toc__title');
  var list = toc.querySelector('ol');
  if (!title || !list) return;

  var d = document.createElement('details');
  d.className = 'toc';
  var sm = document.createElement('summary');
  sm.textContent = title.textContent;
  d.appendChild(sm);
  d.appendChild(list);
  toc.parentNode.replaceChild(d, toc);
})();


/* 目次：いま読んでいる見出しを示す（サイドバー表示のときだけ効く） */
(function () {
  var toc = document.querySelector('article.qa > .toc');
  if (!toc) return;
  var links = {}, order = [];
  Array.prototype.forEach.call(toc.querySelectorAll('a[href^="#"]'), function (a) {
    var id = a.getAttribute('href').slice(1);
    links[id] = a; order.push(id);
  });
  var heads = order
    .map(function (id) { return document.getElementById(id); })
    .filter(function (h) { return h && h.tagName === 'H2'; });
  if (!heads.length) return;

  var ticking = false;
  function update() {
    ticking = false;
    var line = 120;            // 画面上部から少し下を「読んでいる位置」とみなす
    var cur = heads[0].id;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top <= line) cur = heads[i].id;
    }
    for (var k in links) {
      if (Object.prototype.hasOwnProperty.call(links, k)) {
        links[k].classList.toggle('is-current', k === cur);
      }
    }
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    (window.requestAnimationFrame || setTimeout)(update, 16);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
