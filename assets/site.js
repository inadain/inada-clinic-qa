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

    var careEntry = document.querySelector('.care-entry');
    var wasEmpty = !document.body.hasAttribute('data-searching');

    if (!terms.length) {
      cards.forEach(function (c) { c.style.display = ''; });
      sections.forEach(function (s) { s.style.display = ''; });
      if (nav) nav.style.display = '';
      if (careEntry) careEntry.style.display = '';
      if (noResult) noResult.style.display = 'none';
      if (status) status.textContent = '';
      document.body.removeAttribute('data-searching');
      return;
    }
    // 症状を探している人には介護の案内は不要なので、検索中は隠す
    if (careEntry) careEntry.style.display = 'none';
    document.body.setAttribute('data-searching', '1');

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

    // 検索を始めた最初の1回だけ、結果の先頭が画面外なら送る
    if (wasEmpty && hit) {
      var first = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].style.display !== 'none') { first = sections[i]; break; }
      }
      if (first) {
        var top = first.getBoundingClientRect().top;
        if (top > window.innerHeight * 0.55) {
          window.scrollTo({ top: window.scrollY + top - 90, behavior: 'smooth' });
        }
      }
    }
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

  // 404ページなど、他ページから ?q= で渡された語で検索する
  try {
    var qp = new URLSearchParams(location.search).get('q');
    if (qp) { box.value = qp; run(); }
  } catch (e) {}

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
      document.body.removeAttribute('data-searching');   // 送りの判定をやり直す
      run();
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

  function update() {
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
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();


/* カテゴリページ先頭の写真スライダー */
(function () {
  var root = document.querySelector('[data-slider]');
  if (!root) return;
  var track = root.querySelector('.slider__track');
  var slides = root.querySelectorAll('.slider__slide');
  var dots = root.querySelectorAll('.slider__dots button');
  var prev = root.querySelector('.slider__nav--prev');
  var next = root.querySelector('.slider__nav--next');
  if (!track || slides.length < 2) return;

  var idx = 0;
  function paint() {
    for (var i = 0; i < dots.length; i++) {
      dots[i].setAttribute('aria-current', i === idx ? 'true' : 'false');
    }
  }
  function go(i) {
    idx = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[idx].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
    paint();
  }
  if (prev) prev.addEventListener('click', function () { go(idx - 1); stop(); });
  if (next) next.addEventListener('click', function () { go(idx + 1); stop(); });
  for (var i = 0; i < dots.length; i++) {
    (function (n) { dots[n].addEventListener('click', function () { go(n); stop(); }); })(i);
  }
  track.addEventListener('scroll', function () {
    var w = slides[0].getBoundingClientRect().width || 1;
    var n = Math.round(track.scrollLeft / w);
    if (n !== idx && n >= 0 && n < slides.length) { idx = n; paint(); }
  }, { passive: true });

  var timer = null;
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    timer = setInterval(function () { go(idx + 1); }, 6000);
    root.addEventListener('mouseenter', stop);
    root.addEventListener('focusin', stop);
  }
  paint();
})();


/* ---------------------------------------------------------------
   本日の診療状況
   診療時間  月〜土 7:00〜12:00 ／ 月〜金 14:30〜18:30 ／ 土 14:30〜17:30
   休診     日曜・祝日・お盆(8/14〜15)・年末年始(12/29〜1/3)
   祝日は内閣府「国民の祝日について」のCSV（2026〜2027年）による
   --------------------------------------------------------------- */
(function () {
  'use strict';
  var HOL = ["2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20", "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23", "2026-10-12", "2026-11-03", "2026-11-23", "2027-01-01", "2027-01-11", "2027-02-11", "2027-02-23", "2027-03-21", "2027-03-22", "2027-04-29", "2027-05-03", "2027-05-04", "2027-05-05", "2027-07-19", "2027-08-11", "2027-09-20", "2027-09-23", "2027-10-11", "2027-11-03", "2027-11-23"];
  window.INADA_HOLIDAYS = HOL;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(m) { return Math.floor(m / 60) + ':' + pad(m % 60); }

  function status(now) {
    var iso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var mo = now.getMonth() + 1, da = now.getDate(), w = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();

    if (w === 0) return { open: false, why: '日曜のため本日は休診です' };
    if (HOL.indexOf(iso) !== -1) return { open: false, why: '祝日のため本日は休診です' };
    if (mo === 8 && (da === 14 || da === 15)) return { open: false, why: 'お盆のため本日は休診です' };
    if ((mo === 12 && da >= 29) || (mo === 1 && da <= 3)) return { open: false, why: '年末年始のため本日は休診です' };

    var AM_S = 7 * 60, AM_E = 12 * 60, PM_S = 14 * 60 + 30;
    var PM_E = (w === 6) ? 17 * 60 + 30 : 18 * 60 + 30;

    if (mins < AM_S) return { open: false, why: '本日は ' + hm(AM_S) + ' から受付します' };
    if (mins < AM_E) return { open: true, why: '午前の診療中です（' + hm(AM_E) + ' まで）' };
    if (mins < PM_S) return { open: false, why: '昼休みです。午後は ' + hm(PM_S) + ' から' };
    if (mins < PM_E) return { open: true, why: '午後の診療中です（' + hm(PM_E) + ' まで）' };
    return { open: false, why: '本日の受付は終了しました' };
  }

  function mount() {
    var hosts = document.querySelectorAll('[data-today]');
    if (!hosts.length) return;
    var st = status(new Date());
    Array.prototype.forEach.call(hosts, function (host) {
      host.className = 'today ' + (st.open ? 'today--open' : 'today--closed');
      var html =
        '<span class="today__dot" aria-hidden="true"></span>' +
        '<span class="today__label">' + (st.open ? '診療中' : '時間外') + '</span>' +
        '<span class="today__why">' + st.why + '</span>';
      // 時間外に読んでいる方には、判断に迷ったときの相談先も出す
      if (!st.open) {
        html += '<span class="today__urgent">急いで判断したいときは ' +
          '<a href="tel:0862227119">♯7119 岡山県救急安心センター</a>（24時間）';
        if (host.hasAttribute('data-child')) {
          html += '／お子さまは <a href="tel:0868010018">♯8000</a>（平日19時〜翌朝8時ほか）';
        }
        html += '</span>';
      }
      host.innerHTML = html;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }
  setInterval(mount, 60000);
})();


/* ---------------------------------------------------------------
   文字サイズの切り替え（小・中・大）。選択は次回以降も保持する
   --------------------------------------------------------------- */
(function () {
  'use strict';
  var KEY = 'inada-font-size';
  var root = document.documentElement;

  function apply(v) {
    if (v === 'm') { root.removeAttribute('data-fs'); }
    else { root.setAttribute('data-fs', v); }
    var box = document.querySelector('.fontsize');
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-fs') === v ? 'true' : 'false');
    });
  }

  var saved = 'm';
  try { saved = localStorage.getItem(KEY) || 'm'; } catch (e) {}

  function mount() {
    var box = document.querySelector('.fontsize');
    if (box) {
      Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-fs');
          try { localStorage.setItem(KEY, v); } catch (e) {}
          apply(v);
        });
      });
    }
    apply(saved);
  }

  // ちらつきを防ぐため、保存値は先に当てておく
  if (saved !== 'm') { root.setAttribute('data-fs', saved); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }
})();

/* ---------------------------------------------------------------
   診療カレンダー（月表示）
   休診：日曜・祝日・お盆(8/14-15)・年末年始(12/29-1/3)・臨時休診
   土曜は午後が17:30まで
   臨時休診は assets/schedule.js に書く
   --------------------------------------------------------------- */
(function () {
  'use strict';
  var host = document.querySelector('[data-calendar]');
  if (!host) return;

  var W = ['日', '月', '火', '水', '木', '金', '土'];
  var cur = new Date();
  cur = new Date(cur.getFullYear(), cur.getMonth(), 1);

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  function cfg() { return window.INADA_SCHEDULE || { closedExtra: [], noteByDate: {} }; }

  function closedReason(y, m, d, w) {
    var k = iso(y, m, d);
    if ((cfg().closedExtra || []).indexOf(k) !== -1) return '臨時休診';
    if (w === 0) return '日曜';
    if ((window.INADA_HOLIDAYS || []).indexOf(k) !== -1) return '祝日';
    if (m === 8 && (d === 14 || d === 15)) return 'お盆';
    if ((m === 12 && d >= 29) || (m === 1 && d <= 3)) return '年末年始';
    return null;
  }

  function render() {
    var y = cur.getFullYear(), m = cur.getMonth() + 1;
    var first = new Date(y, m - 1, 1).getDay();
    var last = new Date(y, m, 0).getDate();
    var now = new Date();
    var todayKey = iso(now.getFullYear(), now.getMonth() + 1, now.getDate());

    var h = '<div class="cal__bar">' +
      '<button type="button" class="cal__nav" data-go="-1" aria-label="前の月">‹</button>' +
      '<span class="cal__title">' + y + '年 ' + m + '月</span>' +
      '<button type="button" class="cal__nav" data-go="1" aria-label="次の月">›</button>' +
      '</div><table class="cal"><thead><tr>';
    for (var i = 0; i < 7; i++) {
      h += '<th class="cal__w' + i + '">' + W[i] + '</th>';
    }
    h += '</tr></thead><tbody><tr>';

    for (var b = 0; b < first; b++) h += '<td class="cal__pad"></td>';
    for (var d = 1; d <= last; d++) {
      var w = new Date(y, m - 1, d).getDay();
      if (w === 0 && d !== 1) h += '</tr><tr>';
      var k = iso(y, m, d);
      var why = closedReason(y, m, d, w);
      var note = (cfg().noteByDate || {})[k];
      var cls = 'cal__d cal__w' + w + (why ? ' is-closed' : '') + (k === todayKey ? ' is-today' : '');
      h += '<td class="' + cls + '"><span class="cal__n">' + d + '</span>' +
        (why ? '<span class="cal__mark">休</span>'
             : '<span class="cal__mark cal__mark--open">' + (w === 6 ? '▲' : '●') + '</span>') +
        (note ? '<span class="cal__note">' + note + '</span>' : '') +
        '</td>';
    }
    var tail = (first + last) % 7;
    if (tail) for (var e = tail; e < 7; e++) h += '<td class="cal__pad"></td>';
    h += '</tr></tbody></table>' +
      '<p class="cal__legend">' +
      '<span><b class="cal__mark--open">●</b> 午前 7:00〜12:00／午後 14:30〜18:30</span>' +
      '<span><b class="cal__mark--open">▲</b> 土曜は午後 14:30〜17:30</span>' +
      '<span><b class="cal__mark">休</b> 休診（日曜・祝日・お盆・年末年始）</span>' +
      '</p>';
    host.innerHTML = h;

    Array.prototype.forEach.call(host.querySelectorAll('[data-go]'), function (b) {
      b.addEventListener('click', function () {
        cur = new Date(cur.getFullYear(), cur.getMonth() + Number(b.getAttribute('data-go')), 1);
        render();
      });
    });
  }
  render();
})();

/* ---------------------------------------------------------------
   一覧の表示切り替え（カード／一覧）。選択は次回以降も保持する
   --------------------------------------------------------------- */
(function () {
  'use strict';
  var KEY = 'inada-list-view';
  var root = document.documentElement;

  function apply(v) {
    if (v === 'card') { root.removeAttribute('data-view'); }
    else { root.setAttribute('data-view', 'list'); }
    var box = document.querySelector('.viewsw');
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-view') === v ? 'true' : 'false');
    });
  }

  var saved = 'list';
  try { saved = localStorage.getItem(KEY) || 'list'; } catch (e) {}
  if (saved === 'list') { root.setAttribute('data-view', 'list'); }

  function mount() {
    var box = document.querySelector('.viewsw');
    if (box) {
      Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-view');
          try { localStorage.setItem(KEY, v); } catch (e) {}
          apply(v);
        });
      });
    }
    apply(saved);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }
})();
