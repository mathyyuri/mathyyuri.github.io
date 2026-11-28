/* 학생 카드 '성적 상세 · 상담 도우미' — 상담실장 화면(counsel.html)과 운영진 학생정보(sinfo.js)가 같이 써요.
   · 재료: 서버 87번이 학생 카드에 덧붙여 주는 d.xs (최근 시험 8개: 내 점수·○✕·반 평균·문항 단원·같은 시험 다른 학생들의 ○✕ 줄)
   · 하는 일: ① 시험별 반 평균 비교 ② 단원별 정답률(내 vs 반) ③ 자동 분석 글 ④ 학부모 상담 멘트(고쳐서 복사)
   · 분석·멘트는 계산 규칙으로 만든 글이에요(성적표의 'AI 이해도 분석'과 같은 방식). 상담 전에 한 번 훑어보고 쓰세요.
   · 쓰는 법: window.sdHtml(d, {name, hwPct, late, absent})  → HTML 문자열(재료가 없으면 ''). 복사 버튼은 이 파일이 스스로 처리해요. */
(function () {
  var CSS = '.sd-wrap h3{margin:0 0 4px}.sd-sub{font-size:12.5px;color:var(--mut,#7b7468);margin:0 0 8px}' +
    '.sd-h{font-size:13.5px;font-weight:800;margin:16px 0 6px;color:var(--ink,#262a24)}' +
    '.sd-t{width:100%;border-collapse:collapse;font-size:13.5px}.sd-t th{font-size:12px;color:var(--mut,#7b7468);font-weight:600;text-align:right;padding:4px 6px;border-bottom:1.5px solid var(--line,#e4dcc6)}.sd-t th:first-child{text-align:left}' +
    '.sd-t td{padding:7px 6px;border-bottom:1px solid var(--line,#e4dcc6);text-align:right;vertical-align:middle}.sd-t td:first-child{text-align:left}' +
    '.sd-up{color:#2f7a67;font-weight:800}.sd-dn{color:var(--bad,#b3402f);font-weight:800}.sd-z{color:var(--mut,#7b7468);font-weight:700}' +
    '.sd-bar{display:inline-block;width:70px;height:7px;border-radius:4px;background:#ece6d6;vertical-align:middle;overflow:hidden;position:relative}.sd-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px}' +
    '.sd-me i{background:var(--acc,#2f6b57)}.sd-cl i{background:#b9ad8c}.sd-bars{display:flex;flex-direction:column;gap:3px;align-items:flex-end}' +
    '.sd-un{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#e4dcc6)}.sd-un .n{flex:1;min-width:0}.sd-un .n b{font-size:14px}.sd-un .n small{display:block;color:var(--mut,#7b7468);font-size:12px;margin-top:2px;line-height:1.5}' +
    '.sd-tag{display:inline-block;font-size:11.5px;font-weight:800;border-radius:999px;padding:1px 8px;margin-left:6px}.sd-tag.w{background:#fdecea;color:var(--bad,#b3402f)}.sd-tag.s{background:#e3f1ea;color:#2f7a67}' +
    '.sd-box{background:var(--soft,#e6efe9);border-radius:14px;padding:10px 14px;font-size:14px;line-height:1.75}.sd-box p{margin:0 0 6px}.sd-box p:last-child{margin:0}' +
    '.sd-ta{width:100%;box-sizing:border-box;border:1.5px solid var(--line,#e4dcc6);border-radius:12px;padding:10px 12px;font:inherit;font-size:14px;line-height:1.75;background:#fffdf6;color:inherit;resize:vertical;min-height:170px}' +
    '.sd-bt{border:0;background:var(--acc,#2f6b57);color:#fff;border-radius:999px;padding:7px 16px;font-weight:700;font-size:13.5px;cursor:pointer;margin-top:6px}' +
    '.sd-head{font-size:16px;line-height:1.6;margin:2px 0 8px}.sd-head b{font-size:17px}.sd-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 4px}.sd-chip{border-radius:999px;padding:5px 12px;font-size:13.5px;font-weight:800}.sd-chip small{font-weight:600;opacity:.85}.sd-chip.w{background:#fdecea;color:var(--bad,#b3402f)}.sd-chip.s{background:#e3f1ea;color:#2f7a67}' +
    '.sd-last{background:#f6f1e3;border-radius:12px;padding:9px 12px;margin:6px 0 0;font-size:13.5px;line-height:1.6}.sd-lt{color:var(--mut,#6b655a)}.sd-chip.n{background:#ece6d6;color:#4a4536}.sd-pin{margin-top:6px;font-size:13px;color:var(--bad,#b3402f);font-weight:700}' +
    '.sd-st{font-size:12.5px;margin:0 0 4px}.sd-saved{color:#2f7a67;font-weight:800}.sd-bt:disabled{opacity:.5}.sd-sv{background:#2f7a67}' +
    '.sd-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.sd-more{border:1.5px solid var(--line,#e4dcc6);background:#fff;color:var(--ink,#262a24);border-radius:999px;padding:6px 16px;font-weight:700;font-size:13.5px;cursor:pointer;margin-top:6px}.sd-short{min-height:0}' +
    '.sd-q{margin:6px 0 0;padding-left:18px;font-size:13.5px;line-height:1.75}.sd-note{font-size:12px;color:var(--mut,#7b7468);margin-top:8px}';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function r1(v) { return Math.round(v * 10) / 10; }
  function cv(ch) { return ch === 'O' ? 1 : ch === 'T' ? .5 : ch === 'X' ? 0 : null; }
  function dstr(s) { var m = String(s || '').match(/(\d+)-(\d+)-(\d+)/); return m ? (+m[2]) + '/' + (+m[3]) : ''; }
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
  function sgn(v, u) { if (v == null) return '-'; var z = Math.abs(v) < .05; return '<span class="' + (z ? 'sd-z' : v > 0 ? 'sd-up' : 'sd-dn') + '">' + (z ? '±0' : (v > 0 ? '▲ +' : '▼ ') + r1(v)) + (u || '') + '</span>'; }

  /* ── 재료 → 계산 ── */
  function compute(xs) {
    var ex = (xs || []).filter(function (e) { return e && e.score != null; }), units = {}, order = [], careless = [], exRows = [], cs = [];
    ex.forEach(function (e) {
      var items = e.items || [], ox = String(e.ox || ''), peers = e.peers || [];
      exRows.push({ name: e.name, full: e.full, date: e.date, score: +e.score, avg: e.avg == null ? null : +e.avg, n: e.n, rank: e.rank, diff: e.avg == null ? null : r1(+e.score - +e.avg), cat: e.cat });
      if (e.avg != null && e.n >= 2) cs.push(+e.avg);
      items.forEach(function (it, i) {
        var mv = cv(ox.charAt(i)), g = 0, t = 0; peers.forEach(function (p) { var v = cv(String(p).charAt(i)); if (v != null) { g += v; t++; } });
        var cr = t >= 2 ? g / t : null, pts = +it.pts || 0, u = it.unit || '';
        if (mv === 0 && cr != null && cr >= .7) careless.push({ ex: e.name, no: it.no || (i + 1) });
        if (!u) return;
        if (!units[u]) { units[u] = { u: u, t: 0, g: 0, ct: 0, cg: 0, lost: 0, bad: [] }; order.push(u); }
        var o = units[u];
        if (mv != null) { o.t++; o.g += mv; if (mv < 1) { o.lost += pts * (1 - mv); o.bad.push({ ex: e.name, no: it.no || (i + 1), sub: it.sub || '' }); } }
        if (t) { o.ct += t; o.cg += g; }
      });
    });
    var ul = order.map(function (u) { var o = units[u]; o.me = o.t ? Math.round(o.g / o.t * 100) : null; o.cl = o.ct ? Math.round(o.cg / o.ct * 100) : null; o.gap = (o.me != null && o.cl != null) ? o.me - o.cl : null; return o; }).filter(function (o) { return o.me != null; });
    var weak = ul.filter(function (o) { return o.bad.length && ((o.gap != null && o.gap <= -10) || o.me < 60); }).sort(function (a, b) { return (a.gap == null ? 0 : a.gap) - (b.gap == null ? 0 : b.gap) || b.lost - a.lost; });
    var strong = ul.filter(function (o) { return o.t >= 2 && o.me >= 85 && (o.gap == null || o.gap >= 0); });
    return { ex: exRows, units: ul.sort(function (a, b) { return (a.gap == null ? 0 : a.gap) - (b.gap == null ? 0 : b.gap); }), weak: weak, strong: strong, careless: careless, cavg: mean(cs), mavg: mean(exRows.map(function (e) { return e.score; })) };
  }

  /* ── 자동 분석 글 / 학부모 멘트 ── */
  function nm(x) { return '「' + x.u + '」'; }
  function lostAt(o) { var by = {}; o.bad.forEach(function (b) { (by[b.ex] = by[b.ex] || []).push(b.no); }); return Object.keys(by).slice(0, 2).map(function (k) { return k + ' ' + by[k].join('·') + '번'; }).join(', '); }
  function analysis(c, ctx) {
    var L = [], e0 = c.ex[0], k = c.ex.length, diffAll = (c.mavg != null && c.cavg != null) ? r1(c.mavg - c.cavg) : null;
    L.push('최근 ' + k + '회 시험 평균은 ' + r1(c.mavg) + '점' + (c.cavg != null ? '이고, 같은 시험을 본 반 평균(' + r1(c.cavg) + '점)보다 ' + (Math.abs(diffAll) < .05 ? '비슷해요.' : diffAll > 0 ? diffAll + '점 높아요.' : Math.abs(diffAll) + '점 낮아요.') : '예요.'));
    if (k >= 2 && e0.diff != null && c.ex[1].diff != null) { var dd = r1(e0.diff - c.ex[1].diff); L.push('반 평균과의 차이는 직전 시험(' + (c.ex[1].diff >= 0 ? '+' : '') + c.ex[1].diff + '점)에서 이번(' + (e0.diff >= 0 ? '+' : '') + e0.diff + '점)으로 ' + (Math.abs(dd) < .5 ? '큰 변화가 없어요.' : dd > 0 ? '좋아졌어요.' : '벌어졌어요.')); }
    if (c.strong.length) L.push('잘하는 단원: ' + c.strong.slice(0, 4).map(function (o) { return nm(o) + '(' + o.me + '%)'; }).join(' · ') + ' — 반 평균 이상으로 안정적이에요.');
    if (c.weak.length) L.push('보완이 필요한 단원: ' + c.weak.slice(0, 4).map(function (o) { return nm(o) + '(내 ' + o.me + '%' + (o.cl != null ? ' · 반 ' + o.cl + '%' : '') + ')'; }).join(' · ') + '.' + (c.weak[0].bad.length ? ' 가장 아쉬운 ' + nm(c.weak[0]) + ' 단원은 ' + lostAt(c.weak[0]) + '에서 놓쳤어요.' : ''));
    else if (c.units.length) L.push('반 평균보다 크게 낮은 단원은 없어요.');
    if (c.careless.length) L.push('반 친구 대부분이 맞힌 문항을 ' + c.careless.length + '개 놓쳤어요(' + c.careless.slice(0, 4).map(function (q) { return q.ex + ' ' + q.no + '번'; }).join(', ') + '). 개념보다 조건 읽기·계산 실수일 가능성이 있어요.');
    if (ctx && ctx.hwPct != null) L.push('최근 2달 과제 완료율 ' + ctx.hwPct + '%' + (ctx.absent ? ' · 결석 ' + ctx.absent + '회' : '') + (ctx.late ? ' · 지각 ' + ctx.late + '회' : '') + '.');
    return L;
  }
  function script(c, ctx) {
    var name = (ctx && ctx.name) || '학생', P = [], e0 = c.ex[0], diffAll = (c.mavg != null && c.cavg != null) ? r1(c.mavg - c.cavg) : null;
    var H = ctx && ctx.H, ho = histOpen(H, name); P.push(ho || ('학부모님, ' + name + ' 학생의 최근 성적을 말씀드리겠습니다.'));
    P.push('최근 ' + c.ex.length + '회 시험 평균은 ' + r1(c.mavg) + '점입니다.' + (c.cavg != null ? ' 같은 시험을 본 반 평균 ' + r1(c.cavg) + '점과 비교하면 ' + (Math.abs(diffAll) < .05 ? '비슷한 수준입니다.' : diffAll > 0 ? diffAll + '점 높습니다.' : Math.abs(diffAll) + '점 낮습니다.') : '') + ' 가장 최근인 ‘' + e0.name + '’ 시험은 ' + e0.score + '점이었습니다.' + (c.ex.length >= 2 ? ' (시험마다 난이도가 달라, 점수 자체보다 반 평균과의 차이를 함께 보고 있습니다.)' : ''));
    if (c.strong.length) P.push('잘하고 있는 부분은 ' + c.strong.slice(0, 3).map(function (o) { return nm(o); }).join('·') + ' 단원입니다. 반 평균 이상으로 안정적입니다.');
    if (c.weak.length) {
      var w = c.weak[0];
      P.push('다만 ' + c.weak.slice(0, 3).map(function (o) { return nm(o); }).join('·') + ' 단원이 상대적으로 약합니다. 특히 ' + nm(w) + ' 단원은 정답률이 ' + w.me + '%' + (w.cl != null ? '로 반 평균(' + w.cl + '%)보다 낮습니다' : '입니다') + '. 이 부분을 우선 보완하겠습니다. 수업에서 틀린 문제를 다시 풀어 보고, 오답노트로 같은 유형을 한 번 더 잡아 가겠습니다.');
    } else if (c.units.length) P.push('반 평균보다 눈에 띄게 낮은 단원은 지금은 없습니다. 지금 흐름대로 개념을 문제에 적용하는 연습을 이어 가겠습니다.');
    if (c.careless.length >= 2) P.push('아는 문제를 실수로 놓친 경우도 있어서, 문제의 조건을 먼저 표시하고 계산 후 검산하는 습관도 같이 잡겠습니다.');
    if (ctx && ctx.hwPct != null) {
      if (ctx.hwPct >= 90) P.push('과제는 최근 2달 동안 ' + ctx.hwPct + '% 해 와서 성실하게 하고 있습니다.');
      else if (ctx.hwPct < 70) P.push('최근 2달 과제 완료율이 ' + ctx.hwPct + '%여서, 집에서 과제를 마무리하는 습관을 함께 잡아 주시면 성적이 더 빨리 오를 것 같습니다.');
    }
    histCare(H, c).forEach(function (t) { P.push(t); });
    if (H && H.follows.length) P.push('지난번 안내 예정이던 ' + H.follows.map(function (f) { return '‘' + f + '’'; }).join(', ') + ' 건도 함께 말씀드리겠습니다.');
    P.push('집에서 ' + name + ' 학생이 수학 공부하면서 힘들어하는 점이나 느끼시는 점이 있으실까요?');
    return P.join('\n\n');
  }

  /* ── 지난 상담 기록 읽기: 키워드로 학부모가 신경 쓰던 것을 찾아 멘트에 녹여요(말을 이해하는 AI 는 아니라서 틀릴 수 있어요) ── */
  var VIA = { phone: '전화', visit: '방문', msg: '문자·카톡', etc: '기타' }, WHO = { parent: '학부모', student: '학생', both: '학부모+학생' };
  var THEMES = [
    { id: 'mind', re: /멘탈|자신감|위축|불안|스트레스|예민|흔들|주눅|눈치/, label: '멘탈·자신감', said: '학생의 멘탈·자신감' },
    { id: 'habit', re: /의지|꾸준|습관|게으|산만|집중|요령|끈기|부족한 것/, label: '공부 습관', said: '공부 습관과 의지' },
    { id: 'goal', re: /과고|영재|특목|자사|의대|서울대|명문|목표|입시|1등급|내신/, label: '목표', said: '목표' },
    { id: 'worry', re: /실망|걱정|놀라|속상|낮은|부족/, label: '성적 걱정', said: '현재 성적에 대한 걱정' },
    { id: 'base', re: /구멍|기초|개념|선행|진도|탄탄/, label: '기초·진도', said: '기초와 진도' }];
  function history(notes) {
    var cs = (notes || []).filter(function (n) { return n.kind === 'consult'; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || (b.id || 0) - (a.id || 0); });
    var sp = (notes || []).filter(function (n) { return n.kind === 'special'; }), txt = cs.concat(sp).map(function (n) { return n.body || ''; }).join('\n');
    var th = THEMES.filter(function (t) { return t.re.test(txt); }).slice(0, 3), gm = txt.match(/과고|영재고|영재|특목고|특목|자사고|의대|서울대/);
    var last = cs[0] || null, body = last ? String(last.body || '').replace(/\s+/g, ' ').trim() : '';
    return { n: cs.length, last: last, lastTxt: body.length > 70 ? body.slice(0, 70) + '…' : body, themes: th, goal: gm ? gm[0] : '', follows: cs.filter(function (n) { return n.follow && !n.done; }).map(function (n) { return n.follow; }).slice(0, 2),
      pins: sp.filter(function (n) { return n.pinned; }).map(function (n) { return String(n.body || '').replace(/\s+/g, ' ').slice(0, 40); }).slice(0, 2) };
  }
  function ld(x) { var m = String(x || '').match(/(\d+)-(\d+)-(\d+)/); return m ? (+m[2]) + '/' + (+m[3]) : ''; }
  function histOpen(H, name) {   // 첫머리: 지난 상담 이야기를 이어서
    if (!H || !H.last) return '';
    var said = H.themes.slice(0, 2).map(function (t) { return t.id === 'goal' && H.goal ? '‘' + H.goal + '’ 목표' : t.label; });
    return '지난 ' + ld(H.last.date) + ' 상담 때 ' + (said.length ? '말씀하신 ' + said.join('·') + ' 부분을 기억하고 있습니다.' : '말씀 나눈 내용을 기억하고 있습니다.');
  }
  function histCare(H, c) {   // 상담 이력에서 읽은 걱정에 맞춘 보살핌 문장
    if (!H || !H.themes.length) return [];
    var out = [], good = c && c.strong.length ? c.strong[0].u : '';
    H.themes.forEach(function (t) {
      if (t.id === 'mind') out.push('점수가 낮게 나온 부분이 있어도 ' + (good ? '「' + good + '」처럼 ' : '') + '잘한 부분을 먼저 짚어 주며 자신감을 지켜 가겠습니다.');
      else if (t.id === 'habit') out.push('공부 습관은 수업 중 과제 확인과 오답노트로 꾸준히 잡아 가겠습니다.');
      else if (t.id === 'goal') out.push((H.goal ? '말씀하신 ‘' + H.goal + '’ 목표를 기준으로 ' : '목표에 맞춰 ') + '단원별 우선순위를 잡아서 준비시키겠습니다.');
      else if (t.id === 'base') out.push('기초 개념의 빈 곳을 먼저 메우는 데 시간을 쓰겠습니다.');
    });
    return out.slice(0, 2);
  }
  function shortScript(c, ctx) {
    var name = (ctx && ctx.name) || '학생', dg = (c.mavg != null && c.cavg != null) ? r1(c.mavg - c.cavg) : null, P = [];
    var H = ctx && ctx.H, ho = histOpen(H, name); if (ho) P.push(ho);
    P.push((ho ? '' : '학부모님, ') + name + ' 학생은 최근 ' + c.ex.length + '회 시험 평균 ' + r1(c.mavg) + '점입니다.' + (c.cavg != null ? ' 같은 시험을 본 반 평균(' + r1(c.cavg) + '점)보다 ' + (Math.abs(dg) < .05 ? '비슷한 수준입니다.' : Math.abs(dg) + '점 ' + (dg > 0 ? '높습니다.' : '낮습니다.')) : ''));
    if (c.weak.length) P.push(c.weak.slice(0, 2).map(function (o) { return nm(o); }).join('·') + ' 단원이 상대적으로 약해서 이 부분을 먼저 보완하겠습니다.');
    else if (c.strong.length) P.push(c.strong.slice(0, 2).map(function (o) { return nm(o); }).join('·') + ' 단원은 안정적입니다. 지금 흐름을 이어 가겠습니다.');
    var care = histCare(H, c).slice(0, 1);
    if (care.length) P.push(care[0]);
    else if (ctx && ctx.hwPct != null && ctx.hwPct < 70) P.push('최근 과제 완료율이 ' + ctx.hwPct + '%라서 집에서 과제 마무리를 함께 챙겨 주시면 좋겠습니다.');
    if (H && H.follows.length) P.push('지난번 안내 예정이던 ‘' + H.follows[0] + '’ 건도 함께 말씀드리겠습니다.');
    P.push(H && H.last ? '지난 상담 이후 집에서 달라진 점이나 걱정되시는 점이 있으실까요?' : '집에서 수학 공부하며 힘들어하는 점이 있으실까요?');
    return P.join(' ');
  }
  function stText(sv) { return sv ? '<span class="sd-saved">✔ 저장된 문구</span> ' + esc((sv.by || '') + (sv.at ? ' · ' + ld(sv.at) : '')) + ' <span style="color:var(--mut,#7b7468)">— 성적이 바뀌어도 이 문장은 그대로예요</span>' : '<span style="color:var(--mut,#7b7468)">자동으로 만든 문구예요 (저장 전)</span>'; }
  /* ── 화면 ── */
  var OPEN = false;
  var seq = 0;
  window.sdHtml = function (d, ctx) {
    var xs = d && d.xs; if (!xs || !xs.length) return '';
    var c = compute(xs); if (!c.ex.length) return '';
    var id = 'sd' + (++seq);
    if (!document.getElementById('sd-css')) { var st = document.createElement('style'); st.id = 'sd-css'; st.textContent = CSS; document.head.appendChild(st); }
    ctx = ctx || {}; ctx.H = history(d.notes);
    var H = ctx.H, dg = (c.mavg != null && c.cavg != null) ? r1(c.mavg - c.cavg) : null, nmx = (ctx && ctx.name) || '학생';
    var h = '<div class="card sd-wrap"><h3>성적 · 상담 핵심</h3>';
    h += '<div class="sd-head">최근 ' + c.ex.length + '회 평균 <b>' + r1(c.mavg) + '점</b>' + (c.cavg != null ? ' · 반 평균(' + r1(c.cavg) + '점)보다 <b class="' + (Math.abs(dg) < .05 ? 'sd-z' : dg > 0 ? 'sd-up' : 'sd-dn') + '">' + (Math.abs(dg) < .05 ? '비슷해요' : Math.abs(dg) + '점 ' + (dg > 0 ? '높아요' : '낮아요')) + '</b>' : '') + '</div>';
    var chips = c.weak.slice(0, 3).map(function (o, i) { return '<span class="sd-chip w">' + (i === 0 ? '보완 1순위 ' : '보완 ') + esc(o.u) + ' <small>내 ' + o.me + '%' + (o.cl != null ? ' · 반 ' + o.cl + '%' : '') + '</small></span>'; }).concat(c.strong.slice(0, 2).map(function (o) { return '<span class="sd-chip s">강점 ' + esc(o.u) + ' <small>' + o.me + '%</small></span>'; }));
    if (ctx && ctx.hwPct != null && ctx.hwPct < 70) chips.push('<span class="sd-chip w">과제 완료 ' + ctx.hwPct + '% <small>낮음</small></span>');
    if (!c.weak.length && c.units.length) chips.unshift('<span class="sd-chip s">반보다 크게 낮은 단원 없음</span>');
    if (chips.length) h += '<div class="sd-chips">' + chips.join('') + '</div>';
    if (H.last || H.pins.length) {
      h += '<div class="sd-last">' + (H.last ? '<div><b>지난 상담</b> ' + esc(ld(H.last.date)) + ' ' + esc((VIA[H.last.via] || '') + (H.last.who ? '·' + (WHO[H.last.who] || '') : '')) + ' <span class="sd-lt">“' + esc(H.lastTxt) + '”</span></div>' : '') +
        ((H.themes.length || H.follows.length) ? '<div class="sd-chips" style="margin-top:6px">' + H.themes.map(function (t) { return '<span class="sd-chip n">' + esc(t.label) + (t.id === 'goal' && H.goal ? ' ' + esc(H.goal) : '') + '</span>'; }).join('') + H.follows.map(function (f) { return '<span class="sd-chip w">후속 미완료 <small>' + esc(f) + '</small></span>'; }).join('') + '</div>' : '') +
        (H.pins.length ? '<div class="sd-pin">⚠ 특이사항: ' + H.pins.map(esc).join(' · ') + '</div>' : '') + '</div>';
    }
    var auto = shortScript(c, ctx), sv = d.sdm && d.sdm.body ? d.sdm : null, cid = ++seq && 'sd' + seq, canSave = !!(ctx && ctx.save);
    (window.__sdReg = window.__sdReg || {})[cid] = { d: d, ctx: ctx, auto: auto };
    h += '<div class="sd-h">상담 한마디 <span style="font-weight:600;color:var(--mut,#7b7468);font-size:12px">(고쳐서 [저장]하면 모든 상담실장님 화면에 이 문장이 보여요)</span></div>' +
      '<div class="sd-st" id="' + cid + 't">' + stText(sv) + '</div>' +
      '<textarea class="sd-ta sd-short" id="' + cid + 's" data-id="' + cid + '" rows="7" spellcheck="false">' + esc(sv ? sv.body : auto) + '</textarea>' +
      '<div class="sd-row"><button class="sd-bt" type="button" data-sd="copy" data-for="' + cid + 's">한마디 복사</button>' +
      (canSave ? '<button class="sd-bt sd-sv" type="button" data-sd="save" data-id="' + cid + '">저장</button><button class="sd-more" type="button" data-sd="reset" data-id="' + cid + '" style="' + (sv ? '' : 'display:none') + '">자동 문구로 되돌리기</button>' : '') +
      '<button class="sd-more" type="button" data-sd="more">' + (OPEN ? '자세히 닫기 ▴' : '자세히 보기 ▾') + '</button></div>';
    h += '<div class="sd-detail" style="display:' + (OPEN ? 'block' : 'none') + '"><div class="sd-sub" style="margin-top:12px">최근 시험 ' + c.ex.length + '회 · 같은 시험을 본 반 학생들과 비교한 자세한 자동 분석이에요.</div>';
    /* 1. 시험별 */
    h += '<div class="sd-h" style="margin-top:6px">① 시험별 점수와 반 평균</div><table class="sd-t"><tr><th>시험</th><th>내 점수</th><th>반 평균</th><th>차이</th><th>등수</th></tr>' + c.ex.map(function (e) {
      return '<tr><td><span class="muted" style="color:var(--mut,#7b7468);font-size:12px">' + esc(dstr(e.date)) + '</span> ' + esc(e.name) + '</td><td><b>' + r1(e.score) + '</b></td><td>' + (e.avg == null ? '-' : e.avg) + '</td><td>' + sgn(e.diff, '점') + '</td><td style="color:var(--mut,#7b7468)">' + (e.n >= 2 ? e.rank + '/' + e.n + '명' : '비교 인원 적음') + '</td></tr>';
    }).join('') + '</table>';
    /* 2. 단원별 */
    if (c.units.length) {
      h += '<div class="sd-h">② 단원별 정답률 <span style="font-weight:600;color:var(--mut,#7b7468);font-size:12px">(막대 위 = 내 정답률, 아래 = 반 평균 · 낮은 단원부터)</span></div>' + c.units.map(function (o) {
        var tag = c.weak.indexOf(o) >= 0 ? '<span class="sd-tag w">보완</span>' : c.strong.indexOf(o) >= 0 ? '<span class="sd-tag s">강점</span>' : '';
        return '<div class="sd-un"><div class="n"><b>' + esc(o.u) + '</b>' + tag + (o.bad.length ? '<small>틀린 곳: ' + o.bad.slice(0, 5).map(function (b) { return esc(b.ex + ' ' + b.no + '번' + (b.sub ? '(' + b.sub + ')' : '')); }).join(', ') + (o.bad.length > 5 ? ' 외 ' + (o.bad.length - 5) + '문항' : '') + '</small>' : '<small>틀린 문항 없음</small>') + '</div>' +
          '<div class="sd-bars"><span><b style="font-size:13px">' + o.me + '%</b> <span class="sd-bar sd-me"><i style="width:' + o.me + '%"></i></span></span><span><span style="font-size:12px;color:var(--mut,#7b7468)">' + (o.cl == null ? '-' : o.cl + '%') + '</span> <span class="sd-bar sd-cl"><i style="width:' + (o.cl || 0) + '%"></i></span></span></div><div style="min-width:54px;text-align:right">' + sgn(o.gap, '%p') + '</div></div>';
      }).join('');
    } else h += '<div class="sd-note">이 시험들에는 문항별 단원 정보가 없어 단원 분석은 못 했어요.</div>';
    /* 3. 자동 분석 */
    h += '<div class="sd-h">③ 자동 분석</div><div class="sd-box">' + analysis(c, ctx).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>';
    /* 4. 상담 멘트 */
    h += '<div class="sd-h">④ 학부모 상담 멘트 전체 <span style="font-weight:600;color:var(--mut,#7b7468);font-size:12px">(고쳐서 쓰세요)</span></div><textarea class="sd-ta" id="' + id + '" rows="17" spellcheck="false">' + esc(script(c, ctx)) + '</textarea><div><button class="sd-bt" type="button" data-sd="copy" data-for="' + id + '">전체 멘트 복사</button></div>';
    h += '<div class="sd-h">상담 중 이렇게 물어보세요</div><ul class="sd-q"><li>시험 볼 때 시간이 모자랐는지, 아는 문제를 실수로 놓쳤는지 ' + esc((ctx && ctx.name) || '학생') + ' 학생이 뭐라고 하나요?</li><li>틀린 문제를 집에서 다시 풀어 보는 습관이 있나요?</li>' + (c.weak.length ? '<li>' + esc(c.weak[0].u) + ' 단원은 학생이 어려워한다고 느끼시나요?</li>' : '') + '</ul>';
    h += '<div class="sd-note">수치는 입력된 시험 결과로 자동 계산했어요. 반 인원이 적으면(지금은 소수) 평균이 크게 흔들릴 수 있어요.</div></div></div>';
    return h;
  };
  document.addEventListener('input', function (ev) { var t = ev.target; if (t && t.classList && t.classList.contains('sd-short')) { var st = document.getElementById(t.getAttribute('data-id') + 't'); if (st) st.innerHTML = '<span style="color:var(--bad,#b3402f);font-weight:700">고치는 중 — [저장]을 눌러야 다른 분들께 보여요</span>'; } });
  function sdAct(b, kind) {
    var id = b.getAttribute('data-id'), reg = (window.__sdReg || {})[id], ta = document.getElementById(id + 's'), st = document.getElementById(id + 't'); if (!reg || !ta) return;
    if (kind === 'reset' && !window.confirm('저장한 문장을 지우고 자동 문구로 되돌릴까요?')) return;
    b.disabled = true; st.textContent = '저장 중…';
    var pr = kind === 'save' ? reg.ctx.save(ta.value) : reg.ctx.clear();
    Promise.resolve(pr).then(function (j) {
      b.disabled = false;
      if (j && j.ok) { reg.d.sdm = j.sdm || null; if (kind === 'reset') ta.value = reg.auto; st.innerHTML = stText(reg.d.sdm); var rb = b.parentNode.querySelector('[data-sd="reset"]'); if (rb) rb.style.display = reg.d.sdm ? '' : 'none'; }
      else st.innerHTML = '<span style="color:var(--bad,#b3402f);font-weight:700">' + esc((j && (j.error || j.msg)) || '저장하지 못했어요') + '</span>';
    }, function () { b.disabled = false; st.innerHTML = '<span style="color:var(--bad,#b3402f);font-weight:700">저장하지 못했어요 (인터넷 확인)</span>'; });
  }
  document.addEventListener('click', function (ev) {
    var sb = ev.target && ev.target.closest && ev.target.closest('[data-sd="save"],[data-sd="reset"]'); if (sb) { sdAct(sb, sb.getAttribute('data-sd')); return; }
    var m = ev.target && ev.target.closest && ev.target.closest('[data-sd="more"]');
    if (m) { var w = m.closest('.sd-wrap'), dt = w && w.querySelector('.sd-detail'); if (dt) { OPEN = dt.style.display === 'none'; dt.style.display = OPEN ? 'block' : 'none'; m.textContent = OPEN ? '자세히 닫기 ▴' : '자세히 보기 ▾'; } return; }
    var b = ev.target && ev.target.closest && ev.target.closest('[data-sd="copy"]'); if (!b) return;
    var ta = document.getElementById(b.getAttribute('data-for')); if (!ta) return;
    var done = function () { var o = b.textContent; b.textContent = '복사됐어요 ✓'; setTimeout(function () { b.textContent = o; }, 1500); };
    try { navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); document.execCommand('copy'); done(); }); } catch (e) { ta.select(); try { document.execCommand('copy'); done(); } catch (e2) { } }
  });
  window.sdCompute = compute; window.sdScript = script;
})();
