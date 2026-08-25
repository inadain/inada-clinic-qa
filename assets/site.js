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
