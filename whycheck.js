/* 오답 원인 5단계 체크 — tbmission.html 이 불러 쓰는 부속 파일 (서버: 43_오답원인체크_서버.sql, 문 이름 ac_why)
   ① 조건 읽기 ② 개념 부족 ③ 계산 실수 ④ 시간 부족 ⑤ 못 풀었음(하위: u 해설 보면 이해 / n 해설 봐도 모름)
   · 정오표 입력 화면: 틀린(✕) 문항마다 원인을 고르고 [저장]할 때 정오표와 함께 저장 (안 고른 ✕ 는 빨갛게 경고)
   · 내 성적/학생별 성적 화면: 학생·학부모·선생님이 바로 고르면 바로 저장
   · 오답 원인 분석 화면: 기간·반·학생별 5칸 분포, 유형(읽기형·개념형·연산형·실전형), 처방
   tbmission.html 의 전역(S, esc, call, guard, isStaff, render, openMission, badge, cn, pct)을 가져다 써요. */
(function () {
  /* tbmission.html 안의 도구들을 건네받는 곳 (tbmission 은 자기 안에 갇혀 있어서 직접 못 봐요) */
  var S, esc, call, guard, isStaff, render, openMission, badge, cn, ms, gRows;
  window.whyInit = function (c) { S = c.S; esc = c.esc; call = c.call; guard = c.guard; isStaff = c.isStaff; render = c.render; openMission = c.openMission; badge = c.badge; cn = c.cn; ms = c.ms; gRows = c.gRows; };
  var CIRC = '①②③④⑤';
  var W5 = [
    { n: 1, nm: '조건 읽기', st: '읽기', df: '문제의 조건이나 마지막 질문을 놓쳤다', ty: '읽기형', col: '#3f6fb5',
      look: '(가)(나) 조건, "서로 다른 두 실근", "x는 정수", 등호 포함 여부, 마지막 질문("최댓값"인지 "최댓값을 갖게 하는 x"인지) 같은 숨은 조건을 놓쳐요.',
      easy: '문제를 끝까지 읽지 못하고 조건이나 마지막 질문을 놓치는 경우가 많아요.',
      rx: ['조건마다 번호를 붙이고, 풀이에 쓴 조건에는 체크해요.', '답을 쓰기 전에 마지막 질문을 한 번 더 읽어요.'] },
    { n: 2, nm: '개념 부족', st: '연결', df: '어떤 개념을 꺼내 써야 할지 몰랐다', ty: '개념형', col: '#b76e79',
      look: '개념은 설명할 수 있는데 문제에서 꺼내 쓰지 못해요. (예: "중근을 갖는다" → 판별식 = 0)',
      easy: '개념은 아는데, 문제에서 어떤 개념을 꺼내야 하는지 연결이 안 되는 경우가 많아요.',
      rx: ['정의만 쓰지 말고 "이런 표현이 나오면 → 이 개념" 연결 목록을 만들어요.'] },
    { n: 3, nm: '계산 실수', st: '실행', df: '식은 맞게 세웠는데 계산에서 틀렸다', ty: '연산형', col: '#c9a55d',
      look: '식이 길어서 계산 하나가 뒤를 무너뜨려요. 서술형은 연쇄 감점이 돼요.',
      easy: '풀이 방향은 맞는데 계산에서 자꾸 틀려요. 서술형에서는 한 번의 실수가 연달아 감점돼요.',
      rx: ['연산 문제를 시간을 재면서 반복해요.', '줄을 맞춰서 써요.', '나온 답을 원래 식에 넣어 검산해요.'] },
    { n: 4, nm: '시간 부족', st: '실전', df: '풀 수 있었는데 시간이 모자랐다', ty: '실전형', col: '#3f9a86',
      look: '집에서는 풀리는데 시험장에서 못 푸는 경우예요. 문항 수에 비해 시간이 빡빡한 학교에서 특히 그래요.',
      easy: '집에서는 풀리는데 시험 시간 안에는 다 못 푸는 경우가 많아요.',
      rx: ['실제 시험 형식으로 시간을 재고 풀어요.', '3분 넘게 막히면 표시하고 넘어가요.'] },
    { n: 5, nm: '못 풀었음', st: '전체', df: '어디서부터 시작할지 몰랐다', ty: '', col: '#8b93a5',
      look: '어디서부터 시작해야 할지 몰랐어요. 해설을 봤을 때 이해되는지가 중요해요.',
      easy: '어디서부터 시작할지 몰랐던 문제가 많아요.',
      rx: [] }
  ];
  var SUB = { u: '해설 보면 이해돼요', n: '해설 봐도 모르겠어요' };
  var SUBRX = { u: '해설을 보면 이해되는 건 경험 부족이에요 → 같은 유형을 3문제 더 풀어 봐요.',
                n: '해설을 봐도 모르겠다면 앞 단원 개념에 구멍이 있을 수 있어요 → 꼭 선생님께 질문해요.' };

  function esc2(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $q(s) { return document.querySelector(s); }
  function deep(o) { return JSON.parse(JSON.stringify(o || {})); }
  function staff() { return typeof isStaff === 'function' && isStaff(); }
  function ymd0(d) { var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }

  /* ───── 스타일 (한 번만) ───── */
  var st = document.createElement('style'); st.id = 'whycss';
  st.textContent =
    '.wy{display:inline-flex;flex-wrap:wrap;gap:4px;align-items:center;vertical-align:middle;padding:2px 4px;border-radius:8px}' +
    '.wy.need{background:#fdecef;box-shadow:0 0 0 1.5px #d9667a inset}' +
    '.wc{border:1px solid #c9ceda;background:#fff;color:#2b3550;border-radius:14px;padding:3px 9px;font-size:12.5px;cursor:pointer;font-family:inherit;white-space:nowrap}' +
    '.wc:hover{border-color:var(--wc,#3f6fb5)}.wc.on{background:var(--wc,#3f6fb5);border-color:var(--wc,#3f6fb5);color:#fff;font-weight:700}' +
    '.wsub{display:inline-flex;gap:4px;margin-left:4px;padding-left:6px;border-left:2px solid #c9ceda}' +
    '.ws{border:1px dashed #8b93a5;background:#fff;color:#444;border-radius:12px;padding:2px 8px;font-size:11.5px;cursor:pointer;font-family:inherit}.ws.on{background:#8b93a5;color:#fff;border-style:solid}' +
    '.wrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #eef0f5}.wrow .no{font-weight:700;min-width:46px;color:var(--rose,#b76e79)}.wrow .un{font-size:12px;color:#7a8093;min-width:70px}' +
    '.wwarn{background:#fdecef;color:#a8434f;border:1px solid #f0b9c2;border-radius:10px;padding:8px 12px;font-size:13px;margin:8px 0}' +
    '.wok{background:#eaf6ee;color:#2d6a43;border:1px solid #b7dcc4;border-radius:10px;padding:8px 12px;font-size:13px;margin:8px 0}' +
    '.wb{display:flex;height:16px;border-radius:8px;overflow:hidden;background:#eef0f5;min-width:120px}.wb i{display:block;height:100%}' +
    '.wleg{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#444;margin:6px 0}.wleg span{display:inline-flex;align-items:center;gap:4px}.wleg u{display:inline-block;width:10px;height:10px;border-radius:3px;text-decoration:none}' +
    '.wbig{display:grid;grid-template-columns:auto 1fr auto;gap:6px 10px;align-items:center;margin:8px 0}.wbig .bw{height:20px;background:#eef0f5;border-radius:10px;overflow:hidden}.wbig .bw i{display:block;height:100%}' +
    '.wtype{display:inline-block;background:#17284d;color:#f3ead7;border-radius:14px;padding:3px 12px;font-weight:700;font-size:14px;margin-right:6px}' +
    '.wrx{background:#fffaf0;border:1px solid #ecdcb4;border-radius:10px;padding:10px 14px;margin:8px 0;font-size:13.5px;line-height:1.7}.wrx ul{margin:4px 0 0 18px;padding:0}' +
    '.wtb{width:100%;border-collapse:collapse;font-size:13px}.wtb th{background:#f1f3f8;padding:6px;font-weight:600}.wtb td{padding:6px;border-bottom:1px solid #eef0f5;text-align:center}.wtb td.l{text-align:left}.wtb tr.wr{cursor:pointer}.wtb tr.wr:hover td{background:#f7f9fe}' +
    '@media(max-width:560px){.wc{padding:3px 7px;font-size:12px}}';
  document.head.appendChild(st);

  /* ───── 서버 ───── */
  function wcall(a, args) {
    return call('ac_why', { p_action: a, p_token: S.tok, p_args: args || {} }).then(function (j) {
      guard(j);
      if (j && j.ok === false && /서버 오류 404/.test(j.error || '')) j.error = '서버에 43_오답원인체크_서버.sql 을 먼저 실행해 주세요';
      return j;
    });
  }

  /* ───── 한 미션의 원인 기록 (S.W: 학생번호 → {문항번호: {c, sub}}) ───── */
  function ensure() {
    if (!S.ex) return;
    if (S.Wex === S.ex.id) return;
    var id = S.ex.id; S.Wex = id; S.W = {}; S.W0 = {}; S.Wmsg = '';
    wcall('get', { exam_id: id }).then(function (j) {
      if (S.Wex !== id) return;
      if (j && j.ok) {
        (j.list || []).forEach(function (x) { (S.W[x.sid] = S.W[x.sid] || {})[x.no] = { c: x.c, sub: x.sub || null }; });
        S.W0 = deep(S.W); S.Wmsg = 'ok';
      } else { S.Wmsg = (j && j.error) || '원인 기록을 불러오지 못했어요'; }
      if (S.ex && S.ex.id === id) { if (S.view === 'input') paint(); else if (S.view === 'my') my(); }
    });
  }
  function cur(sid, no) { return (S.W && S.W[sid] && S.W[sid][no]) || null; }

  function chips(sid, no, mode, req) {
    var c = cur(sid, no);
    var h = '<span class="wy' + (req && !c ? ' need' : '') + '" data-wm="' + mode + '" data-k="' + esc2(sid) + '" data-no="' + no + '">';
    W5.forEach(function (w) {
      h += '<button type="button" class="wc' + (c && c.c === w.n ? ' on' : '') + '" data-w="c" data-c="' + w.n + '" title="' + esc2(w.df) + '" style="--wc:' + w.col + '">' + CIRC.charAt(w.n - 1) + ' ' + w.nm + '</button>';
    });
    if (c && c.c === 5) {
      h += '<span class="wsub">';
      ['u', 'n'].forEach(function (k) { h += '<button type="button" class="ws' + (c.sub === k ? ' on' : '') + '" data-w="s" data-s="' + k + '">' + SUB[k] + '</button>'; });
      h += '</span>';
    }
    return h + '</span>';
  }
  function legend() {
    return '<details style="margin:6px 0"><summary style="cursor:pointer;font-size:13px;color:#555">5칸이 무슨 뜻이에요?</summary><div style="font-size:12.5px;line-height:1.8;padding:6px 4px">' +
      W5.map(function (w) { return '<div><b style="color:' + w.col + '">' + CIRC.charAt(w.n - 1) + ' ' + w.nm + '</b> <span style="color:#888">(' + w.st + ')</span> — ' + esc2(w.df) + (w.n === 5 ? ' · 고르면 <b>해설 보면 이해돼요 / 해설 봐도 모르겠어요</b>도 골라요' : '') + '</div>'; }).join('') + '</div></details>';
  }

  /* ───── 정오표 입력 화면: 틀린 문항 원인 상자 ───── */
  function wrongList(k) { var a = []; (S.G[k] || []).forEach(function (c, i) { if (c === 'X' || c === 'T') a.push({ no: i + 1, c: c }); }); return a; }
  function missing(k) { var n = 0; wrongList(k).forEach(function (x) { if (x.c === 'X' && !cur(k, x.no)) n++; }); return n; }
  function missingAll() {
    if (!S.G) return 0; var n = 0; Object.keys(S.G).forEach(function (k) { n += missing(k); }); return n;
  }
  function boxHtml() {
    if (!S.G) return '';
    var rs = (typeof gRows === 'function' ? gRows() : []);
    if (S.gmode === 'one' && S.gwho) rs = rs.filter(function (r) { return r.k === S.gwho; });
    var h = '', tot = 0;
    rs.forEach(function (r) {
      var L = wrongList(r.k); if (!L.length) return;
      var m = missing(r.k); tot += m;
      h += '<div style="margin:10px 0"><div class="row" style="gap:8px"><b>' + esc(r.name) + '</b>' + badge(r.cls) + (m ? '<span class="tag hard">원인 미체크 ' + m + '개</span>' : '<span class="tag" style="background:#eaf6ee;color:#2d6a43">모두 체크 ✓</span>') + '</div>' +
        L.map(function (x) {
          var it = (S.ex.items || [])[x.no - 1] || {};
          return '<div class="wrow"><span class="no">' + x.no + '번 ' + (x.c === 'T' ? '<small style="color:#b7791f">△</small>' : '<small style="color:#b76e79">✕</small>') + '</span><span class="un">' + esc(it.unit || '') + '</span>' + chips(r.k, x.no, 'in', x.c === 'X') + '</div>';
        }).join('') + '</div>';
    });
    var head = '<div class="muted sm" style="margin-bottom:6px"><b>틀린(✕) 문제마다 왜 틀렸는지 1개를 꼭 골라 주세요.</b> 고른 뒤 위쪽 <b>저장</b>을 누르면 정오표와 함께 저장돼요. (△ 는 선택)</div>';
    if (S.Wmsg && S.Wmsg !== 'ok' && S.Wmsg !== '') head += '<div class="wwarn">' + esc(S.Wmsg) + '</div>';
    if (!h) return head + '<div class="empty">틀린(✕) 문제가 있는 학생이 없어요.</div>';
    return head + (tot ? '<div class="wwarn">⚠ 원인을 아직 안 고른 ✕ 가 <b>' + tot + '개</b> 있어요. (저장은 되지만 분석에는 빠져요)</div>' : '<div class="wok">✓ 모든 ✕ 의 원인이 체크됐어요.</div>') + legend() + h;
  }
  /* tbmission vInput 이 부르는 곳 */
  window.whyInputCard = function () {
    ensure();
    return '<div class="card" id="whycard"><h3 style="margin-top:0">틀린 문제 원인 체크 <span class="tag hard">필수</span></h3><div id="whybox">' + boxHtml() + '</div></div>';
  };
  function paint() { var b = $q('#whybox'); if (b) b.innerHTML = boxHtml(); }
  window.whyPaint = paint;
  window.whyMissingAll = missingAll;

  /* 저장: 정오표 저장 뒤에 부르면 돼요. 바뀐 학생만 보내요. */
  function pending() {
    var out = {};
    if (!S.G) return out;
    Object.keys(S.G).forEach(function (sid) {
      var c = S.W[sid] || {}, o = S.W0[sid] || {}, rows = [], seen = {};
      Object.keys(c).concat(Object.keys(o)).forEach(function (no) {
        if (seen[no]) return; seen[no] = 1;
        var ch = (S.G[sid] || [])[no - 1], v = c[no], ov = o[no];
        if (v) {
          if (ch !== 'X' && ch !== 'T') return;
          if (!ov || ov.c !== v.c || (ov.sub || null) !== (v.sub || null)) rows.push({ no: +no, c: v.c, sub: v.sub || '' });
        } else if (ov) rows.push({ no: +no, c: 0 });
      });
      if (rows.length) out[sid] = rows;
    });
    return out;
  }
  window.whyDirtyN = function () { return Object.keys(pending()).length; };
  window.whySaveAll = function () {
    var P = pending(), ids = Object.keys(P), saved = 0, err = '';
    return ids.reduce(function (pr, sid) {
      return pr.then(function () {
        return wcall('save', { exam_id: S.ex.id, sid: sid, rows: P[sid] }).then(function (j) {
          if (j && j.ok) { saved += j.saved || 0; S.W0[sid] = deep(S.W[sid]); if (!S.W0[sid]) S.W0[sid] = {}; }
          else if (!err) err = (j && j.error) || '원인을 저장하지 못했어요';
        });
      });
    }, Promise.resolve()).then(function () { return { saved: saved, err: err, n: ids.length }; });
  };

  /* ───── 내 성적 / 학생별 성적 화면: 고르면 바로 저장 ───── */
  function myInner(r) {
    var rows = [], miss = 0;
    String(r.ox || '').split('').forEach(function (c, i) { if (c === 'X' || c === 'T') rows.push({ no: i + 1, c: c }); });
    rows.forEach(function (x) { if (x.c === 'X' && !cur(r.k, x.no)) miss++; });
    var h = '<h3 style="margin-top:0">틀린 문제, 왜 틀렸나요? <span class="tag hard">꼭 체크</span></h3>';
    if (!rows.length) return h + '<div class="empty">틀린 문제가 없어요 🎉</div>';
    h += '<div class="muted sm" style="margin-bottom:6px">틀린 문제마다 이유를 <b>하나</b> 골라 주세요. 고르면 바로 저장돼요. 이 기록이 쌓여서 <b>나의 오답 스타일</b>이 나와요.</div>';
    if (S.Wmsg && S.Wmsg !== 'ok' && S.Wmsg !== '') h += '<div class="wwarn">' + esc2(S.Wmsg) + '</div>';
    else if (S.Wmsg === 'ok') h += miss ? '<div class="wwarn">⚠ 아직 안 고른 문제가 <b>' + miss + '개</b> 있어요.</div>' : '<div class="wok">✓ 모두 체크했어요!</div>';
    h += legend();
    rows.forEach(function (x) {
      var it = (S.ex.items || [])[x.no - 1] || {};
      h += '<div class="wrow"><span class="no">' + x.no + '번 ' + (x.c === 'T' ? '<small style="color:#b7791f">△</small>' : '') + '</span><span class="un">' + esc2(it.unit || '') + '</span>' + chips(r.k, x.no, 'my', x.c === 'X') + '</div>';
    });
    return h;
  }
  window.whyMyCard = function (r) {
    if (!r || !r.ox) return '';
    ensure(); S.Wmy = r;
    return '<div class="card" id="whymy">' + myInner(r) + '</div>';
  };
  function my() { var b = $q('#whymy'); if (b && S.Wmy) b.innerHTML = myInner(S.Wmy); }

  /* 인쇄용(MEN BOOK 종이) — 문제마다 원인 칸 */
  window.whyPrintRow = function () {
    return '<div class="why5" style="margin-top:2.4mm;border:.25mm solid #d6c9a8;border-radius:1.2mm;padding:1.6mm 2.4mm;font-size:8.6pt;line-height:1.7;background:#fffefb"><b>틀린 이유 (1개)</b> ' +
      W5.map(function (w) { return '<span style="margin-left:2.2mm;white-space:nowrap">□ ' + CIRC.charAt(w.n - 1) + ' ' + w.nm + '</span>'; }).join('') +
      '<span style="margin-left:2.2mm;color:#7d7364;white-space:nowrap">(⑤ 는 □ 해설 보면 이해 □ 해설 봐도 모름)</span></div>';
  };

  /* ───── 칩 누르기 ───── */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-w]'); if (!b) return;
    var w = b.getAttribute('data-w');
    if (w === 'c' || w === 's') {
      var box = b.closest('.wy'); if (!box) return;
      var sid = box.getAttribute('data-k'), no = +box.getAttribute('data-no'), mode = box.getAttribute('data-wm');
      S.W = S.W || {}; var m = (S.W[sid] = S.W[sid] || {}), c = m[no];
      if (w === 'c') { var n = +b.getAttribute('data-c'); if (c && c.c === n) delete m[no]; else m[no] = { c: n, sub: null }; }
      else if (c) { var s2 = b.getAttribute('data-s'); c.sub = (c.sub === s2 ? null : s2); }
      if (mode === 'in') { paint(); return; }
      var cc = m[no], rows = [cc ? { no: no, c: cc.c, sub: cc.sub || '' } : { no: no, c: 0 }], args = { exam_id: S.ex.id, rows: rows };
      if (staff()) args.sid = sid;
      my();
      wcall('save', args).then(function (j) {
        if (j && j.ok) { if (cc) (S.W0[sid] = S.W0[sid] || {})[no] = deep(cc); else if (S.W0[sid]) delete S.W0[sid][no]; }
        else { alert((j && j.error) || '저장하지 못했어요'); }
      });
      return;
    }
    if (w === 'open') { S.wv = true; S.wf = S.wf || { r: '30', cls: '', sid: '' }; fetchStats(); return; }
    if (w === 'back') { S.wv = false; S.ex = null; render(); window.scrollTo(0, 0); return; }
    if (w === 'rng') { S.wf.r = b.getAttribute('data-v'); fetchStats(); return; }
    if (w === 'cls') { S.wf.cls = b.getAttribute('data-v'); S.wf.sid = ''; fetchStats(); return; }
    if (w === 'sid') { S.wf.sid = b.getAttribute('data-v'); fetchStats(); return; }
    if (w === 'item') { ev.preventDefault(); openMission(b.getAttribute('data-id'), 'my', staff() ? S.wf.sid : undefined); return; }
  });
  document.addEventListener('change', function (ev) {
    var s = ev.target; if (s && s.id === 'whysel') { S.wf.sid = s.value; fetchStats(); }
  });

  /* ───── 분석 화면 ───── */
  function range() {
    var r = (S.wf && S.wf.r) || '30', t = new Date(), f = '';
    if (r !== 'all') { var d = new Date(t.getTime() - (+r) * 86400000); f = ymd0(d); }
    return { from: f, to: '' };
  }
  function fetchStats() {
    S.wd = null; S.wst = 'load'; render();
    var rg = range(), args = { from: rg.from, to: rg.to };
    if (staff()) { if (S.wf.cls) args.cls = S.wf.cls; if (S.wf.sid) args.sid = S.wf.sid; }
    var tick = S.wtick = (S.wtick || 0) + 1;
    var p = [wcall('stats', args)];
    if (staff() && !S.studs) p.push(ms('students').then(function (j) { S.studs = j && j.ok ? j.students : []; }));
    Promise.all(p).then(function (res) {
      if (tick !== S.wtick) return;
      var j = res[0]; S.wd = j && j.ok ? j : null; S.wst = j && j.ok ? 'ok' : ((j && j.error) || '불러오지 못했어요');
      render();
    });
  }
  function sum5(arr) { var s = 0; arr.forEach(function (v) { s += v; }); return s; }
  function stack(c) {
    var t = sum5(c); if (!t) return '<div class="wb"></div>';
    return '<div class="wb">' + c.map(function (v, i) { return v ? '<i style="width:' + (v * 100 / t) + '%;background:' + W5[i].col + '" title="' + W5[i].nm + ' ' + v + '개"></i>' : ''; }).join('') + '</div>';
  }
  function legend5() { return '<div class="wleg">' + W5.map(function (w) { return '<span><u style="background:' + w.col + '"></u>' + CIRC.charAt(w.n - 1) + ' ' + w.nm + '</span>'; }).join('') + '</div>'; }
  function judge(c, u, n) {
    var t = sum5(c); if (t < 3) return null;
    var mx = Math.max.apply(null, c), tops = []; c.forEach(function (v, i) { if (v === mx) tops.push(i); });
    var names = tops.map(function (i) { return i === 4 ? (u >= n ? '경험 쌓기형' : '기초 점검형') : W5[i].ty; });
    if (tops.length >= 3) return { tops: tops, names: ['골고루형'] };
    return { tops: tops, names: names };
  }
  function typeHtml(c, u, n, who) {
    var j = judge(c, u, n);
    if (!j) return '<div class="muted sm">원인이 3개 이상 쌓이면 ' + (who === 'me' ? '나의 ' : '') + '유형이 나와요. (지금 ' + sum5(c) + '개)</div>';
    var t = sum5(c), h = '<div style="margin:8px 0">' + j.names.map(function (x) { return '<span class="wtype">' + x + '</span>'; }).join('') + '<span class="muted sm">가장 많이 체크된 칸 기준 (체크 ' + t + '개)</span></div>';
    var shown = j.tops.length >= 3 ? [] : j.tops;
    shown.forEach(function (i) {
      var w = W5[i];
      if (i === 4) {
        h += '<div class="wrx"><b>⑤ 못 풀었음이 많아요</b> — ' + esc2(w.easy) + '<ul>' +
          '<li>' + SUBRX.u + (u ? ' (<b>' + u + '개</b>)' : '') + '</li><li>' + SUBRX.n + (n ? ' (<b>' + n + '개</b>)' : '') + '</li>' +
          (u + n < c[4] ? '<li class="muted">아직 세부(해설 보면 이해 / 봐도 모름)를 안 고른 것이 ' + (c[4] - u - n) + '개 있어요.</li>' : '') + '</ul></div>';
      } else {
        h += '<div class="wrx"><b>' + CIRC.charAt(i) + ' ' + w.nm + ' (' + w.ty + ')</b> — ' + esc2(who === 'me' ? w.easy : w.look) + '<div style="margin-top:4px"><b>이렇게 해 보세요</b></div><ul>' + w.rx.map(function (x) { return '<li>' + esc2(x) + '</li>'; }).join('') + '</ul></div>';
      }
    });
    if (j.tops.length >= 3) h += '<div class="muted sm">한 칸에 몰리지 않고 골고루 퍼져 있어요. 아래 막대에서 가장 긴 칸부터 챙겨 보세요.</div>';
    return h;
  }
  function big5(c) {
    var t = sum5(c) || 1, h = '<div class="wbig">';
    W5.forEach(function (w, i) {
      h += '<div style="font-size:13px"><b style="color:' + w.col + '">' + CIRC.charAt(i) + ' ' + w.nm + '</b></div><div class="bw"><i style="width:' + (c[i] * 100 / t) + '%;background:' + w.col + '"></i></div><div style="font-size:13px"><b>' + c[i] + '개</b> <span class="muted sm">' + Math.round(c[i] * 100 / t) + '%</span></div>';
    });
    return h + '</div>';
  }
  function itemsHtml(items, sid) {
    if (!items || !items.length) return '<div class="muted sm">이 기간에 틀린 문제가 없어요.</div>';
    return '<table class="wtb"><tr><th>날짜</th><th>미션</th><th>번호</th><th>단원</th><th>이유</th></tr>' + items.map(function (x) {
      var w = x.c ? W5[x.c - 1] : null;
      return '<tr><td>' + esc2(String(x.d).slice(5).replace('-', '/')) + '</td><td class="l"><a href="#" data-w="item" data-id="' + esc2(x.eid) + '" style="color:var(--navy,#17284d)">' + esc2(x.name) + '</a></td><td><b>' + x.no + '</b>' + (x.ch === 'T' ? ' <small style="color:#b7791f">△</small>' : '') + '</td><td class="l sm">' + esc2(x.unit || '') + '</td><td>' +
        (w ? '<span style="color:' + w.col + ';font-weight:700">' + CIRC.charAt(x.c - 1) + ' ' + w.nm + '</span>' + (x.c === 5 && x.sub ? ' <small class="muted">(' + SUB[x.sub] + ')</small>' : '') : (x.ch === 'X' ? '<span class="tag hard">미체크</span>' : '<span class="muted">-</span>')) + '</td></tr>';
    }).join('') + '</table>' + (items.length >= 80 ? '<div class="muted sm" style="margin-top:4px">최근 80개까지만 보여요.</div>' : '');
  }
  window.whyView = function () {
    var f = S.wf || (S.wf = { r: '30', cls: '', sid: '' }), D = S.wd, sf = staff();
    var h = '<div class="row" style="margin-bottom:10px"><button class="btn sec sm3" data-w="back">← 미션 목록</button><b style="font-family:var(--fk);font-size:18px">' + (sf ? '오답 원인 분석' : '나의 오답 스타일') + '</b></div>';
    h += '<div class="card"><div class="row"><div class="seg">' + [['14', '최근 2주'], ['30', '최근 30일'], ['90', '최근 3개월'], ['all', '전체']].map(function (x) { return '<button class="' + (f.r === x[0] ? 'on' : '') + '" data-w="rng" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (sf) {
      var cl = {}; (S.studs || []).forEach(function (s) { cl[s.cls] = 1; });
      h += '<div class="seg"><button class="' + (!f.cls ? 'on' : '') + '" data-w="cls" data-v="">전체 반</button>' + Object.keys(cl).sort().map(function (k) { return '<button class="' + (f.cls === k ? 'on' : '') + '" data-w="cls" data-v="' + esc2(k) + '">' + esc2(cn(k)) + '</button>'; }).join('') + '</div>';
      var list = (S.studs || []).filter(function (s) { return !f.cls || s.cls === f.cls; }).sort(function (a, b) { return (a.cls + a.name).localeCompare(b.cls + b.name); });
      h += '<select id="whysel" class="oxin" style="max-width:240px"><option value="">반 전체 보기</option>' + list.map(function (s) { return '<option value="' + s.id + '"' + (f.sid === s.id ? ' selected' : '') + '>' + esc2(cn(s.cls)) + ' · ' + esc2(s.name) + '</option>'; }).join('') + '</select>';
    }
    h += '</div></div>';
    if (S.wst === 'load') return h + '<div class="card"><div class="empty">불러오는 중…</div></div>';
    if (!D) return h + '<div class="card"><div class="wwarn">' + esc2(S.wst || '불러오지 못했어요') + '</div></div>';
    var L = D.students || [];
    if (!L.length && !f.sid) return h + '<div class="card"><div class="empty">이 기간에 틀린 문제 기록이 없어요.</div></div>';
    /* 학생 한 명 (선생님이 고른 경우 · 학생/학부모 본인) */
    if (!sf || f.sid) {
      var s = L[0] || { c: [0, 0, 0, 0, 0], u: 0, n: 0, x: 0, t: 0, miss: 0, name: '', cls: '' };
      h += '<div class="card"><h3 style="margin-top:0">' + (sf ? esc2(s.name || '') + ' ' + badge(s.cls) : '나의 오답 원인') + ' <span class="muted sm" style="font-weight:400">틀린 문제 ✕ ' + s.x + '개' + (s.t ? ' · △ ' + s.t + '개' : '') + '</span></h3>' +
        typeHtml(s.c, s.u, s.n, sf ? 'staff' : 'me') + (s.miss ? '<div class="wwarn">⚠ 원인을 아직 안 고른 ✕ 가 <b>' + s.miss + '개</b> 있어요. 아래 목록에서 미션을 눌러 체크해 주세요.</div>' : '') +
        '<h3>5칸 분포</h3>' + big5(s.c);
      if (!sf && D.cls_avg && D.cls_avg.students > 1) {
        var ca = D.cls_avg.c, ct2 = sum5(ca), mt = sum5(s.c);
        h += '<div class="muted sm" style="margin-top:6px">우리 반 평균과 비교 (체크 비율)</div>' + W5.map(function (w, i) { return '<div class="sm">' + CIRC.charAt(i) + ' ' + w.nm + ' — 나 <b>' + (mt ? Math.round(s.c[i] * 100 / mt) : 0) + '%</b> · 우리 반 <b>' + (ct2 ? Math.round(ca[i] * 100 / ct2) : 0) + '%</b></div>'; }).join('');
      }
      h += '</div><div class="card"><h3 style="margin-top:0">최근 틀린 문제와 이유</h3>' + itemsHtml(D.items, f.sid) + '</div>';
      return h;
    }
    /* 반 전체 (선생님) */
    var tot = [0, 0, 0, 0, 0], u = 0, n = 0, miss = 0, xs = 0;
    L.forEach(function (s) { s.c.forEach(function (v, i) { tot[i] += v; }); u += s.u; n += s.n; miss += s.miss; xs += s.x; });
    h += '<div class="card"><h3 style="margin-top:0">' + (f.cls ? esc2(cn(f.cls)) + '반' : '전체') + ' 5칸 분포 <span class="muted sm" style="font-weight:400">학생 ' + L.length + '명 · 틀린 ✕ ' + xs + '개 · 체크 ' + sum5(tot) + '개</span></h3>' + big5(tot) +
      (miss ? '<div class="wwarn">⚠ 원인 미체크 ✕ 가 <b>' + miss + '개</b> 있어요.</div>' : '') + typeHtml(tot, u, n, 'staff') + '</div>';
    h += '<div class="card"><h3 style="margin-top:0">학생별 (눌러서 자세히)</h3>' + legend5() + '<div style="overflow-x:auto"><table class="wtb"><tr><th>반</th><th>이름</th><th>✕</th><th>미체크</th><th style="min-width:140px">5칸</th><th>유형</th></tr>' +
      L.map(function (s) {
        var j = judge(s.c, s.u, s.n);
        return '<tr class="wr" data-w="sid" data-v="' + s.sid + '"><td>' + badge(s.cls) + '</td><td class="l"><b>' + esc2(s.name) + '</b></td><td>' + s.x + '</td><td>' + (s.miss ? '<span class="tag hard">' + s.miss + '</span>' : '<span class="muted">0</span>') + '</td><td>' + stack(s.c) + '</td><td>' + (j ? j.names.join(' · ') : '<span class="muted sm">기록 적음</span>') + '</td></tr>';
      }).join('') + '</table></div></div>';
    return h;
  };
})();
