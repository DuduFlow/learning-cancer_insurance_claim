/* ==========================================================
   癌症，其實比你想的更近 — 課程筆記 / 互動
   ========================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
  const esc = s => String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 進度條 ---------- */
  const bar = $('#bar');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 進場顯示 ---------- */
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('.mk').forEach(m => m.classList.add('lit'));
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  const watch = root => (root || document).querySelectorAll('.rv:not(.in)').forEach(n => io.observe(n));
  const mark = (nodes, step) => nodes.forEach((n, i) => {
    n.classList.add('rv');
    n.style.transitionDelay = Math.min(i * (step || 55), 420) + 'ms';
  });

  /* ---------- HERO 數字 ---------- */
  const hs = $('#heroStats');
  HERO_STATS.forEach(s => {
    hs.appendChild(el('div', 'hstat',
      `<p class="hstat-n"><span data-count="${s.num}">0</span><em>${esc(s.suffix)}</em></p>
       <p class="hstat-l">${esc(s.label)}</p>
       <p class="hstat-s">${esc(s.note)}</p>`));
  });

  const countUp = node => {
    const target = +node.dataset.count;
    if (reduced) { node.textContent = target; return; }
    const dur = 1100, t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / dur, 1);
      node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const ioN = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { countUp(e.target); ioN.unobserve(e.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(n => ioN.observe(n));

  /* ---------- 罹癌人數計時 ---------- */
  const INTERVAL = 228000; // 3 分 48 秒
  const t0 = Date.now();
  const tick = $('#tickCount');
  const runTick = () => { tick.textContent = Math.floor((Date.now() - t0) / INTERVAL); };
  runTick();
  setInterval(runTick, 1000);

  /* ---------- 01 數據 ---------- */
  const fg = $('#facts-grid');
  FACTS.forEach(f => fg.appendChild(el('div', 'fact',
    `<p class="fact-k">${esc(f.k)}</p><p class="fact-v">${esc(f.v)}</p><p class="fact-s">${esc(f.s)}</p>`)));

  const tb = $('#treatbar');
  TREAT_COUNT.forEach(t => tb.appendChild(el('div', 'tchip', `<b>${esc(t.n)}</b><span>${esc(t.t)}</span>`)));

  /* ---------- 02 費用清冊 ---------- */
  const ORDER = ['癌症新藥', '核醫治療', '放射治療', '新式注射', '手術'];
  const led = $('#ledger');
  ORDER.forEach(cat => {
    const rows = COSTS.filter(c => c.cat === cat);
    if (!rows.length) return;
    led.appendChild(el('div', 'ledger-cat', esc(cat)));
    rows.forEach(c => led.appendChild(el('div', 'lrow',
      `<div><p class="lrow-n">${esc(c.name)}</p><p class="lrow-note">${esc(c.note)}</p></div>
       <p class="lrow-u">${esc(c.unit)}</p>
       <p class="lrow-t">${c.total}<i>萬</i></p>`)));
  });

  /* ---------- 子彈試算 ---------- */
  const range = $('#range'), amtEl = $('#amt'), verdict = $('#verdict'), grid = $('#calcGrid');
  const ITEMS = COSTS.slice().sort((a, b) => a.total - b.total);

  ITEMS.forEach(c => {
    grid.appendChild(el('div', 'citem',
      `<p class="citem-t">${esc(c.name)}</p>
       <p class="citem-c">${c.total} 萬</p>
       <span class="citem-s"></span>`));
  });
  const cells = Array.from(grid.children);

  const say = (v, n) => {
    if (v < 60) return '連一個療程都撐不完。課堂上那位 55 歲、兩個小孩的爸爸，就是在這個數字前面選擇了回家。';
    if (v < 150) return '撐得過一次療程，撐不過第二次。泰格莎一針 17 萬，你只能打 ' + Math.floor(v / 17) + ' 針。';
    if (v < 300) return '標靶打得起，免疫治療還在門外。乳癌一整年的標靶療程是 126 萬。';
    if (v < 500) return '大部分治療你都有選擇權了。醫生問你「要不要打」，你可以說要。';
    if (v < 850) return '你可以問醫生「有沒有更好的」，而不是「有沒有比較便宜的」。';
    return '這是講師自己的額度。他說：我要把二期、三期花光，人生才能圓滿。';
  };

  const update = () => {
    const v = +range.value;
    amtEl.textContent = v;
    range.style.setProperty('--pct', ((v - range.min) / (range.max - range.min) * 100) + '%');
    let n = 0;
    ITEMS.forEach((c, i) => {
      const ok = v >= c.total;
      if (ok) n++;
      cells[i].className = 'citem ' + (ok ? 'ok' : 'no');
      $('.citem-s', cells[i]).textContent = ok ? '打得起' : '額度不足';
    });
    verdict.textContent = `${ITEMS.length} 種治療裡買得起 ${n} 種。` + say(v, n);
  };
  range.addEventListener('input', update);
  document.querySelectorAll('.ticks button').forEach(b =>
    b.addEventListener('click', () => { range.value = b.dataset.v; update(); }));
  update();

  /* ---------- 03 案例 ---------- */
  const cg = $('#caseGrid');
  CASES.forEach(c => {
    const card = el('article', 'case',
      `<span class="stamp">CASE ${String(c.id).padStart(2, '0')}</span>
       <p class="case-who">${esc(c.who)}</p>
       <p class="case-dx">${esc(c.dx)}</p>
       <h3 class="case-t">${esc(c.title)}</h3>
       <p class="case-story">${esc(c.story)}</p>
       <dl class="case-money">
         <div><dt>關鍵事實</dt><dd>${esc(c.cost)}</dd></div>
         <div><dt>金額</dt><dd>${esc(c.money)}</dd></div>
       </dl>
       <button class="case-more" type="button" aria-expanded="false">記住這一句</button>
       <div class="case-lesson"><div><p>${esc(c.lesson)}</p></div></div>`);
    card.dataset.tag = c.tag;
    const btn = $('.case-more', card);
    btn.addEventListener('click', () => {
      const open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      btn.firstChild.nodeValue = open ? '收合' : '記住這一句';
    });
    cg.appendChild(card);
  });

  document.querySelectorAll('#filters .chip').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#filters .chip').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      const f = b.dataset.f;
      Array.from(cg.children).forEach(card =>
        card.classList.toggle('hide', f !== 'all' && card.dataset.tag !== f));
    });
  });

  /* ---------- 04 爭議 ---------- */
  const dg = $('#disputes-grid');
  DISPUTES.forEach((d, i) => dg.appendChild(el('div', 'disp',
    `<div>
       <p class="disp-co">${esc(ANONYMIZE_COMPANIES ? d.alias : d.company)}</p>
       <span class="disp-tag">爭議類型 ${String(i + 1).padStart(2, '0')}</span>
     </div>
     <div>
       <p class="disp-issue">${esc(d.issue)}</p>
       <p class="disp-detail">${esc(d.detail)}</p>
       <p class="disp-price">${esc(d.price)}</p>
       <p class="disp-take">${esc(d.take)}</p>
     </div>`)));

  /* ---------- 05 自檢 ---------- */
  const ck = $('#checks');
  CHECKS.forEach(c => ck.appendChild(el('div', 'chk',
    `<p class="chk-p">${esc(c.part)}</p>
     <p class="chk-w">${esc(c.who)}</p>
     <p class="chk-h">${esc(c.how)}</p>
     <p class="chk-y">${esc(c.why)}</p>`)));

  const wg = $('#warns');
  WARNINGS.forEach(w => wg.appendChild(el('div', 'warn',
    `<p class="warn-s">${esc(w.sign)}</p>
     <p class="warn-m">${esc(w.mean)}</p>
     <p class="warn-n">${esc(w.note)}</p>`)));

  /* ---------- 06 金句 ---------- */
  const qg = $('#quotes-grid');
  QUOTES.forEach(q => qg.appendChild(el('blockquote', 'quote',
    `<p>${esc(q.q)}</p><span>${esc(q.c)}</span>`)));

  /* ---------- 07 行動 ---------- */
  const ag = $('#actions-list');
  ACTIONS.forEach(a => ag.appendChild(el('li', '',
    `<div><p class="act-t">${esc(a.t)}</p><p class="act-d">${esc(a.d)}</p></div>`)));

  /* ---------- 綁定進場 ---------- */
  mark(document.querySelectorAll('.sect-head'), 0);
  mark(Array.from(fg.children));
  mark(Array.from(tb.children), 40);
  mark(Array.from(led.children), 22);
  mark([$('.calc')], 0);
  mark(Array.from(cg.children));
  mark(Array.from(dg.children), 70);
  mark(Array.from(ck.children));
  mark(Array.from(wg.children), 40);
  mark(Array.from(qg.children), 45);
  mark(Array.from(ag.children), 45);
  mark([$('.closing'), $('.hero-stats'), $('.treatbar .mini-h'), $('.mini-h.spaced')], 0);
  document.querySelectorAll('.hero .mk').forEach(m => setTimeout(() => m.classList.add('lit'), 350));
  watch();
})();
