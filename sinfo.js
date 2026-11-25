/* 학생 정보 (분당미래탐구 운영진 전용) — index.html 이 불러 쓰는 부속 파일 (서버: 63_학생관리_서버.sql, 문 이름 ac_sinfo)
   · 운영진(원장·조교) 로그인에만 '학생정보' 탭이 보여요. 학생·학부모 화면에는 나오지 않고, 서버도 운영진 로그인이 아니면 아무것도 주지 않아요.
   · 학생 찾기(이름·학교·학부모 전화 뒤 4자리) → 학생 카드: 특이사항(중요는 맨 위) · 상담내역(후속 조치 체크) · 조교평가(항목별 별점) · 성적 · 과제 · 출석 · 전화 걸기
   · 카드를 열면 '누가 언제 열었는지'가 서버에 기록돼요(원장만 볼 수 있어요). 화면의 모든 글은 esc() 로 걸러요.
   index.html 의 전역(S, me, curAc, esc, toast, render, openModal, closeModal, TOKEN, API_URL, API_KEY, forceLogout)을 가져다 써요. */
(function () {
  var URL_ = API_URL.replace('ac_api', 'ac_sinfo');
  var Q = { tok: null, q: '', cls: '', list: null, classes: [], listAt: 0, loading: false, feed: null, sid: null, card: null, cardBusy: false, err: null, form: null };
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var VIA = { phone: '전화', visit: '방문', msg: '문자·카톡', etc: '기타' }, WHO = { parent: '학부모', student: '학생', both: '학부모+학생' };
  var EV = [['tae', '태도'], ['hw', '숙제'], ['und', '이해도'], ['att', '출결']];
  var ATT = { present: '출석', late: '지각', early: '조퇴', absent: '결석' };

  function kind() {
    try { var u = me(); if (!u) return false; if (u.role === 'admin') return curAc() === 'bd'; return u.role === 'ta' && u.ac === 'bd'; } catch (e) { return false; }
  }
  var ICON = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.6-3.6 3.3-5.5 7-5.5s6.4 1.9 7 5.5"/></svg>';
  window.sinfoTab = function (list) {
    if (!kind()) return list;
    var out = list.slice(), ids = out.map(function (t) { return t[0]; }), i = ids.indexOf('exam'); if (i < 0) i = ids.indexOf('att');
    out.splice(i < 0 ? out.length : i + 1, 0, ['sinfo', ICON, '학생정보']);
    return out;
  };

  async function sapi(a, args) {
    var r;
    try { r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: API_KEY, Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify({ p_action: a, p_token: TOKEN, p_args: args || {} }) }); }
    catch (e) { return { ok: false, error: '인터넷 연결을 확인해 주세요' }; }
    if (!r.ok) return { ok: false, error: r.status === 404 ? '학생 정보 서버가 아직 준비되지 않았어요 (63_학생관리_서버.sql 실행 필요)' : '서버에 연결하지 못했어요 (' + r.status + ')' };
    var j; try { j = await r.json(); } catch (e) { return { ok: false, error: '서버 응답을 읽지 못했어요' }; }
    if (j && j.ok === false && j.error && j.error.indexOf('다시 로그인') >= 0 && !(typeof VIEW !== 'undefined' && VIEW)) { try { forceLogout(); } catch (e) {} }
    return j;
  }

  /* ── 작은 도구 ── */
  function dstr(ds) { if (!ds) return ''; var d = new Date(String(ds).slice(0, 10) + 'T00:00'); return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')'; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function nl(t) { return esc(t).replace(/\n/g, '<br>'); }
  function tel(p) { return String(p || '').replace(/[^0-9+]/g, ''); }
  function stars(n) { return '<span style="color:#d49a1a;letter-spacing:1px">' + '★'.repeat(n) + '</span><span style="color:#d8d2c6;letter-spacing:1px">' + '★'.repeat(5 - n) + '</span>'; }
  function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }

  /* ── 불러오기 ── */
  async function loadList() {
    if (Q.loading) return; Q.loading = true; var tok = TOKEN;
    var j = await sapi('search', { q: Q.q, cls: Q.cls });
    Q.loading = false; if (tok !== TOKEN) return;
    Q.tok = tok; Q.listAt = Date.now();
    if (!j || !j.ok) { Q.err = (j && j.error) || '불러오지 못했어요'; Q.list = null; } else { Q.err = null; Q.list = j.list; Q.classes = j.classes || []; }
    if (S.tab === 'sinfo' && !Q.sid) { var el = document.getElementById('smlist'); if (el) el.innerHTML = listHtml(); else render(); }
  }
  async function loadFeed() {
    var tok = TOKEN, j = await sapi('feed'); if (tok !== TOKEN) return;
    Q.feed = j && j.ok ? j : { follows: [], recent: [] };
    if (S.tab === 'sinfo' && !Q.sid) { var el = document.getElementById('smfeed'); if (el) el.innerHTML = feedHtml(); }
  }
  async function loadCard(keep) {
    if (Q.cardBusy || !Q.sid) return; Q.cardBusy = true; var tok = TOKEN, sid = Q.sid;
    var j = await sapi('card', { sid: sid }); Q.cardBusy = false; if (tok !== TOKEN || Q.sid !== sid) return;
    if (!j || !j.ok) { Q.err = (j && j.error) || '불러오지 못했어요'; Q.card = null; } else { Q.err = null; Q.card = j; }
    if (S.tab === 'sinfo') render(keep ? undefined : 0);
  }
  window.sinfoAfter = function () {
    if (S.tab !== 'sinfo' || !kind()) return;
    if (Q.tok !== TOKEN && !Q.loading) { Q.list = null; Q.feed = null; Q.card = null; Q.sid = null; Q.q = ''; Q.cls = ''; loadList(); loadFeed(); return; }
    if (Q.sid) { if (!Q.card && !Q.cardBusy) loadCard(); return; }
    if (!Q.list && !Q.loading) loadList();
    else if (Date.now() - Q.listAt > 60000 && !Q.loading) { loadList(); loadFeed(); }
    if (!Q.feed) loadFeed();
  };

  /* ── CSS ── */
  var css = document.createElement('style');
  css.textContent =
    '.smrow{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;background:none;padding:11px 4px;border-top:1px solid var(--line);cursor:pointer}.smrow:first-child{border-top:0}.smrow:hover{background:var(--soft)}' +
    '.smrow .nm{font-weight:700;font-size:16px;white-space:nowrap;flex:none}.smrow .mt{flex:1;min-width:0;font-size:13px}.smrow .r{margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}' +
    '.smb{display:inline-block;border-radius:12px;padding:1px 9px;font-size:12px;font-weight:700;white-space:nowrap}' +
    '.smk{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line)}.smk:first-of-type{border-top:0}.smk .d{flex:none;width:58px;font-size:12.5px;color:var(--mut);line-height:1.5}.smk .t{flex:1;min-width:0}' +
    '.smk .a{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}.smwarn{background:#fdecea;border:1.5px solid #e7b5ad;border-radius:18px;padding:12px 16px;margin-bottom:12px}.smwarn b{color:#a8453a}' +
    '.smhd{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.smhd h2{margin:0;font-size:26px;font-family:var(--serif)}' +
    '.smbtn{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px}.smbar{height:8px;background:var(--bg2);border-radius:6px;overflow:hidden}.smbar i{display:block;height:100%;background:var(--acc)}' +
    '.smev{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0 10px}.smev>div{background:var(--soft);border-radius:14px;padding:8px 6px;text-align:center}.smev b{display:block;font-size:19px}.smev span{font-size:12px;color:var(--mut)}' +
    '.smst{display:flex;gap:6px;flex-wrap:wrap}.smst label{cursor:pointer}.smst input{position:absolute;opacity:0;pointer-events:none}.smst span{display:inline-block;min-width:38px;text-align:center;border:1.5px solid var(--line);border-radius:12px;padding:6px 8px;font-weight:700;background:#fff}.smst input:checked+span{background:var(--acc);border-color:var(--acc);color:#fff}' +
    '.smf label.l{display:block;font-size:13px;font-weight:600;color:var(--mut);margin:12px 0 5px}.smf input[type=text],.smf input[type=date],.smf select,.smf textarea{width:100%;border:1px solid var(--line);border-radius:14px;padding:10px 12px;background:#fff}.smf textarea{min-height:110px;resize:vertical}' +
    '.smtbl{width:100%;border-collapse:collapse;font-size:13.5px}.smtbl td{padding:5px 4px;border-top:1px solid var(--line)}.smtbl tr:first-child td{border-top:0}';
  document.head.appendChild(css);

  /* ── 목록 화면 ── */
  function listHtml() {
    if (Q.err) return '<div class="note">' + esc(Q.err) + '</div>';
    if (!Q.list) return '<div class="empty">불러오는 중…</div>';
    if (!Q.list.length) return '<div class="empty">찾는 학생이 없어요</div>';
    return Q.list.map(function (s) {
      var b = '';
      if (s.pin > 0) b += '<span class="smb" style="background:#fdecea;color:#a8453a">⚠ 특이 ' + s.pin + '</span>';
      if (s.follow > 0) b += '<span class="smb" style="background:#fbf3dc;color:#b57c12">후속 ' + s.follow + '</span>';
      if (s.last) b += '<span class="muted sm">' + esc(dstr(s.last)) + '</span>';
      return '<button class="smrow" type="button" data-sm="open" data-v="' + esc(s.id) + '"><span class="nm">' + esc(s.name) + '</span><span class="muted mt">' + esc(s.cls) + (s.school ? ' · ' + esc(s.school) : '') + ' · ☎' + esc(s.p4 || '') + '</span><span class="r">' + b + '</span></button>';
    }).join('');
  }
  function feedHtml() {
    var F = Q.feed; if (!F) return '';
    var h = '';
    if (F.follows && F.follows.length) {
      h += '<div class="card"><h3 style="margin:0 0 6px">해야 할 후속 조치 <span class="badge">' + F.follows.length + '건</span></h3>' + F.follows.map(function (f) {
        return '<div class="smk"><div class="d">' + esc(dstr(f.date)) + '</div><div class="t"><a href="#" data-sm="open" data-v="' + esc(f.sid) + '" style="color:inherit;font-weight:700">' + esc(f.name) + '</a> <span class="muted sm">' + esc(f.cls) + ' · ' + esc(f.author) + '</span><div>' + esc(f.follow) + '</div></div><button class="btn sec sm3" data-sm="follow" data-v="' + f.id + '" type="button">완료</button></div>';
      }).join('') + '</div>';
    }
    if (F.recent && F.recent.length) {
      h += '<div class="card"><h3 style="margin:0 0 6px">운영진 최근 기록 <span class="muted sm">(공유)</span></h3>' + F.recent.slice(0, 20).map(function (n) {
        var kd = n.kind === 'consult' ? '상담' : n.kind === 'eval' ? '조교평가' : '특이사항', sc = n.scores ? ' ' + EV.filter(function (e) { return n.scores[e[0]]; }).map(function (e) { return e[1] + n.scores[e[0]]; }).join(' ') : '';
        return '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t"><a href="#" data-sm="open" data-v="' + esc(n.sid) + '" style="color:inherit;font-weight:700">' + esc(n.name) + '</a> <span class="smb" style="background:var(--soft);color:var(--acc)">' + kd + '</span> <span class="muted sm">' + esc(n.author) + '</span><div class="sm">' + esc(n.body || '') + esc(sc) + '</div></div></div>';
      }).join('') + '</div>';
    }
    return h;
  }
  function vList() {
    var chips = '<div class="chips"><button class="chip ' + (!Q.cls ? 'on' : '') + '" data-sm="cls" data-v="" type="button">전체</button>' + (Q.classes || []).map(function (c) { return '<button class="chip ' + (Q.cls === c ? 'on' : '') + '" data-sm="cls" data-v="' + esc(c) + '" type="button">' + esc(c) + '</button>'; }).join('') + '</div>';
    return '<div class="card"><div class="fld" style="margin:0 0 8px"><input type="text" id="smq" value="' + esc(Q.q) + '" placeholder="이름 · 학교 · 학부모 전화 뒤 4자리" autocomplete="off" data-si="smq" style="font-size:16px"></div>' +
      '<div class="muted sm" style="margin-bottom:6px">전화가 왔을 땐 번호 뒤 4자리를 입력하면 바로 찾아요.</div>' + chips + '<div id="smlist">' + listHtml() + '</div></div>' +
      '<div id="smfeed">' + feedHtml() + '</div>' +
      '<div class="shwarn" style="font-size:12.5px;color:var(--mut)">이 화면의 기록은 운영진만 볼 수 있어요. 학생·학부모에게는 보이지 않고, 카드를 열면 열람 기록이 남아요.</div>';
  }

  /* ── 학생 카드 ── */
  function noteBtns(n, d) {
    var can = n.mine || d.admin; if (!can) return '';
    return '<div class="a"><button class="btn gh sm3" data-sm="edit" data-v="' + n.id + '" type="button">고치기</button><button class="btn dng sm3" data-sm="del" data-v="' + n.id + '" type="button">지우기</button></div>';
  }
  function evLine(sc) { return EV.filter(function (e) { return sc && sc[e[0]]; }).map(function (e) { return '<span style="white-space:nowrap">' + e[1] + ' ' + stars(sc[e[0]]) + '</span>'; }).join(' &nbsp; '); }
  function vCard(d) {
    var st = d.stu, notes = d.notes || [], sp = notes.filter(function (n) { return n.kind === 'special'; }), co = notes.filter(function (n) { return n.kind === 'consult'; }), ev = notes.filter(function (n) { return n.kind === 'eval'; });
    var pins = sp.filter(function (n) { return n.pinned; }), h = '';
    h += '<button class="btn gh sm3" data-sm="back" type="button">← 목록으로</button>';
    h += '<div class="card" style="margin-top:10px"><div class="smhd"><h2>' + esc(st.name) + '</h2><span class="badge">' + esc(st.cls) + '</span><span class="muted">' + esc(st.school || '') + '</span>' + (st.active ? '' : '<span class="smb" style="background:#eee;color:#777">퇴원/비활성</span>') + '</div>';
    if (st.phone) h += '<div class="smbtn"><a class="btn rose" href="tel:' + esc(tel(st.phone)) + '" style="text-decoration:none">📞 학부모 ' + esc(st.phone) + '</a><button class="btn gh" data-sm="copy" data-v="' + esc(st.phone) + '" type="button">번호 복사</button></div>';
    else h += '<div class="muted sm" style="margin-top:6px">등록된 학부모 전화번호가 없어요</div>';
    h += '<div class="smbtn"><button class="btn" data-sm="new" data-v="consult" type="button">+ 상담 기록</button><button class="btn sec" data-sm="new" data-v="special" type="button">+ 특이사항</button><button class="btn sec" data-sm="new" data-v="eval" type="button">+ 조교평가</button></div></div>';
    if (pins.length) h += '<div class="smwarn"><b>⚠ 특이사항</b>' + pins.map(function (n) { return '<div style="margin-top:4px">' + nl(n.body) + '</div>'; }).join('') + '</div>';
    /* 상담내역 */
    h += '<div class="card"><h3 style="margin:0 0 6px">상담내역 <span class="badge">' + co.length + '건</span></h3>';
    if (!co.length) h += '<div class="empty" style="padding:14px">아직 상담 기록이 없어요</div>';
    co.forEach(function (n) {
      h += '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t"><span class="smb" style="background:var(--soft);color:var(--acc)">' + esc(VIA[n.via] || '') + ' · ' + esc(WHO[n.who] || '') + '</span> <span class="muted sm">' + esc(n.author) + (n.edited ? ' · 수정됨' : '') + '</span><div style="margin-top:3px">' + nl(n.body) + '</div>' +
        (n.follow ? '<div style="margin-top:6px"><label style="cursor:pointer"><input type="checkbox" data-sm="fchk" data-v="' + n.id + '"' + (n.done ? ' checked' : '') + ' style="accent-color:var(--acc);width:18px;height:18px;vertical-align:-3px"> <b style="' + (n.done ? 'text-decoration:line-through;color:var(--mut)' : 'color:#b57c12') + '">후속: ' + esc(n.follow) + '</b></label></div>' : '') + noteBtns(n, d) + '</div></div>';
    });
    h += '</div>';
    /* 조교평가 */
    var five = ev.slice(0, 5);
    h += '<div class="card"><h3 style="margin:0 0 6px">조교평가 <span class="badge">' + ev.length + '건</span></h3>';
    if (five.length) {
      h += '<div class="muted sm">최근 ' + five.length + '회 평균</div><div class="smev">' + EV.map(function (e) { var a = avg(five.filter(function (n) { return n.scores && n.scores[e[0]]; }).map(function (n) { return n.scores[e[0]]; })); return '<div><b>' + (a == null ? '-' : a.toFixed(1)) + '</b><span>' + e[1] + '</span></div>'; }).join('') + '</div>';
    }
    if (!ev.length) h += '<div class="empty" style="padding:14px">아직 평가가 없어요</div>';
    ev.forEach(function (n) {
      h += '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t">' + evLine(n.scores) + ' <span class="muted sm">' + esc(n.author) + (n.edited ? ' · 수정됨' : '') + '</span>' + (n.body ? '<div style="margin-top:3px">' + nl(n.body) + '</div>' : '') + noteBtns(n, d) + '</div></div>';
    });
    h += '</div>';
    /* 특이사항 */
    h += '<div class="card"><h3 style="margin:0 0 6px">특이사항 <span class="badge">' + sp.length + '건</span></h3>';
    if (!sp.length) h += '<div class="empty" style="padding:14px">아직 특이사항이 없어요</div>';
    sp.forEach(function (n) {
      h += '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t">' + (n.pinned ? '<span class="smb" style="background:#fdecea;color:#a8453a">중요</span> ' : '') + '<span class="muted sm">' + esc(n.author) + (n.edited ? ' · 수정됨' : '') + '</span><div style="margin-top:3px">' + nl(n.body) + '</div>' + noteBtns(n, d) + '</div></div>';
    });
    h += '</div>';
    /* 성적 */
    var sc = d.scores || [], a5 = avg(sc.slice(0, 5).map(function (x) { return x.score; }));
    h += '<div class="card"><h3 style="margin:0 0 6px">최근 성적' + (a5 != null ? ' <span class="badge">최근 ' + Math.min(5, sc.length) + '회 평균 ' + a5.toFixed(1) + '</span>' : '') + '</h3>';
    if (!sc.length) h += '<div class="empty" style="padding:14px">입력된 성적이 없어요</div>';
    else h += '<table class="smtbl">' + sc.map(function (x) { return '<tr><td class="muted" style="width:60px">' + esc(dstr(x.date)) + '</td><td>' + esc(x.name) + (x.cat ? ' <span class="muted sm">' + esc(x.cat) + '</span>' : '') + '</td><td style="text-align:right;font-weight:700">' + esc(String(Math.round(x.score * 10) / 10)) + '점</td></tr>'; }).join('') + '</table>';
    h += '</div>';
    /* 과제 */
    var hw = d.hw || { total: 0, done: 0, recent: [] }, pct = hw.total ? Math.round(hw.done / hw.total * 100) : 0;
    h += '<div class="card"><h3 style="margin:0 0 6px">과제 <span class="muted sm">(최근 2달)</span></h3>';
    if (!hw.recent.length) h += '<div class="empty" style="padding:14px">해당 기간에 과제가 없어요</div>';
    else {
      h += '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><b>완료 ' + hw.done + ' / ' + hw.total + '</b><span class="muted">' + pct + '%</span></div><div class="smbar"><i style="width:' + pct + '%"></i></div><table class="smtbl" style="margin-top:8px">' +
        hw.recent.map(function (x) { return '<tr><td class="muted" style="width:60px">' + esc(dstr(x.due)) + '</td><td>' + esc(x.title) + '</td><td style="text-align:right;font-weight:700;color:' + (x.done ? '#2f7a67' : '#b57c12') + '">' + (x.done ? '완료' : (x.due >= today() ? '진행' : '미완료')) + '</td></tr>'; }).join('') + '</table>';
    }
    h += '</div>';
    /* 출석 */
    var at = d.att || {};
    h += '<div class="card"><h3 style="margin:0 0 6px">출석 <span class="muted sm">(최근 2달)</span></h3><div class="smev">' + ['present', 'late', 'early', 'absent'].map(function (k) { return '<div><b>' + (at[k] || 0) + '</b><span>' + ATT[k] + '</span></div>'; }).join('') + '</div>';
    if (at.recent && at.recent.length) h += '<table class="smtbl">' + at.recent.map(function (x) { return '<tr><td class="muted" style="width:60px">' + esc(dstr(x.day)) + '</td><td><b>' + esc(ATT[x.status] || x.status) + '</b>' + (x.reason ? ' <span class="muted">· ' + esc(x.reason) + '</span>' : '') + '</td></tr>'; }).join('') + '</table>';
    h += '</div>';
    if (d.views && d.views.length) h += '<div class="shwarn" style="font-size:12.5px;color:var(--mut)">최근 열람: ' + d.views.map(function (v) { return esc(v.staff) + ' ' + esc(String(v.at).slice(5).replace('T', ' ')); }).join(' · ') + '</div>';
    return h;
  }

  window.vSinfo = function () {
    if (!kind()) return '<div class="card"><div class="empty">이 화면은 분당미래탐구 운영진만 쓸 수 있어요.</div></div>';
    if (Q.tok !== TOKEN && !Q.sid && !Q.list) return '<div class="card"><div class="empty">불러오는 중…</div></div>';
    if (Q.sid) {
      if (Q.err && !Q.card) return '<button class="btn gh sm3" data-sm="back" type="button">← 목록으로</button><div class="note" style="margin-top:10px">' + esc(Q.err) + '</div>';
      if (!Q.card) return '<div class="card"><div class="empty">학생 카드를 불러오는 중…</div></div>';
      return vCard(Q.card);
    }
    return vList();
  };

  /* ── 기록 쓰기 창 ── */
  function formHtml(k, n) {
    n = n || {};
    var tit = { consult: '상담 기록', special: '특이사항', eval: '조교평가' }[k] + (n.id ? ' 고치기' : ' 추가'), h = '<h3>' + esc(tit) + '</h3><div class="smf">';
    if (k !== 'special') h += '<label class="l">날짜</label><input type="date" id="smf_date" value="' + esc(String(n.date || today()).slice(0, 10)) + '">';
    if (k === 'consult') {
      h += '<label class="l">방법</label><select id="smf_via">' + Object.keys(VIA).map(function (x) { return '<option value="' + x + '"' + ((n.via || 'phone') === x ? ' selected' : '') + '>' + VIA[x] + '</option>'; }).join('') + '</select>' +
        '<label class="l">대상</label><select id="smf_who">' + Object.keys(WHO).map(function (x) { return '<option value="' + x + '"' + ((n.who || 'parent') === x ? ' selected' : '') + '>' + WHO[x] + '</option>'; }).join('') + '</select>' +
        '<label class="l">상담 내용</label><textarea id="smf_body" maxlength="2000" placeholder="무슨 얘기를 했는지, 부모님 요청·걱정거리 등">' + esc(n.body || '') + '</textarea>' +
        '<label class="l">후속 조치 (할 일이 있으면, 끝나면 체크해요)</label><input type="text" id="smf_follow" maxlength="200" value="' + esc(n.follow || '') + '" placeholder="예: 시험 범위표 문자로 보내기">';
    } else if (k === 'special') {
      h += '<label class="l">내용</label><textarea id="smf_body" maxlength="1000" placeholder="알레르기, 성향, 주의할 점, 약속한 것 등">' + esc(n.body || '') + '</textarea>' +
        '<label style="display:flex;gap:8px;align-items:center;margin-top:12px;cursor:pointer"><input type="checkbox" id="smf_pin"' + (n.pinned ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--acc)"> <b>중요 — 카드 맨 위에 빨간 상자로 고정</b></label>';
    } else {
      h += '<div class="muted sm" style="margin-top:8px">점수를 매길 항목만 골라 주세요 (5점이 가장 좋아요)</div>' + EV.map(function (e) {
        var cur = n.scores && n.scores[e[0]] ? n.scores[e[0]] : 0;
        return '<label class="l">' + e[1] + '</label><div class="smst"><label><input type="radio" name="smf_' + e[0] + '" value="0"' + (!cur ? ' checked' : '') + '><span>없음</span></label>' + [1, 2, 3, 4, 5].map(function (v) { return '<label><input type="radio" name="smf_' + e[0] + '" value="' + v + '"' + (cur === v ? ' checked' : '') + '><span>' + v + '</span></label>'; }).join('') + '</div>';
      }).join('') + '<label class="l">한 줄 메모</label><input type="text" id="smf_body" maxlength="300" value="' + esc(n.body || '') + '" placeholder="예: 숙제 꼼꼼히 해 옴">';
    }
    return h + '</div><div class="row" style="gap:8px;margin-top:16px"><button class="btn" data-sm="save" data-k="' + k + '" data-id="' + (n.id || '') + '" type="button">저장</button><button class="btn gh" onclick="closeModal()" type="button">닫기</button></div>';
  }
  async function save(k, id) {
    var v = function (i) { var e = document.getElementById(i); return e ? e.value : ''; }, args = { sid: Q.sid, kind: k, body: v('smf_body'), date: v('smf_date') };
    if (k === 'consult') { args.via = v('smf_via'); args.who = v('smf_who'); args.follow = v('smf_follow'); }
    if (k === 'special') args.pinned = !!(document.getElementById('smf_pin') || {}).checked;
    if (k === 'eval') { args.scores = {}; EV.forEach(function (e) { var r = document.querySelector('input[name="smf_' + e[0] + '"]:checked'); if (r && +r.value > 0) args.scores[e[0]] = +r.value; }); }
    if (id) args.id = id;
    var btn = document.querySelector('[data-sm="save"]'); if (btn) btn.disabled = true;
    var j = await sapi(id ? 'edit' : 'add', args);
    if (btn) btn.disabled = false;
    if (!j || !j.ok) { toast((j && j.error) || '저장하지 못했어요'); return; }
    closeModal(); toast('저장했어요'); Q.card = null; await loadCard(true);
  }

  /* ── 동작 ── */
  var timer = null;
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || !t.dataset || t.dataset.si !== 'smq' || !kind()) return;
    Q.q = t.value; clearTimeout(timer); timer = setTimeout(loadList, 250);
  });
  document.addEventListener('click', async function (e) {
    var t = e.target.closest && e.target.closest('[data-sm]'); if (!t || !kind()) return;
    var a = t.dataset.sm, v = t.dataset.v, j;
    if (a === 'fchk') return;                                           // 체크박스는 change 에서
    if (t.tagName === 'A' && a !== 'open') return;
    if (a === 'open') { e.preventDefault(); Q.sid = v; Q.card = null; Q.err = null; S.tab = 'sinfo'; render(0); return; }
    if (a === 'back') { Q.sid = null; Q.card = null; Q.err = null; Q.feed = null; Q.listAt = 0; render(0); return; }
    if (a === 'cls') { Q.cls = v; Q.listAt = 0; loadList(); document.querySelectorAll('[data-sm="cls"]').forEach(function (b) { b.classList.toggle('on', (b.dataset.v || '') === v); }); return; }
    if (a === 'copy') { try { navigator.clipboard.writeText(v); toast('복사했어요'); } catch (er) { toast('길게 눌러 직접 복사해 주세요'); } return; }
    if (a === 'follow') { j = await sapi('follow', { id: v, done: true }); if (!j || !j.ok) { toast((j && j.error) || '체크하지 못했어요'); return; } toast('완료했어요'); loadFeed(); loadList(); return; }
    if (a === 'new') { openModal(formHtml(v)); return; }
    if (a === 'edit') { var n = ((Q.card && Q.card.notes) || []).filter(function (x) { return String(x.id) === String(v); })[0]; if (n) openModal(formHtml(n.kind, n)); return; }
    if (a === 'del') { if (!confirm('이 기록을 지울까요? (되돌릴 수 없어요)')) return; j = await sapi('del', { id: v }); if (!j || !j.ok) { toast((j && j.error) || '지우지 못했어요'); return; } toast('지웠어요'); Q.card = null; loadCard(true); return; }
    if (a === 'save') { save(t.dataset.k, t.dataset.id); return; }
  });
  document.addEventListener('change', async function (e) {
    var t = e.target; if (!t || !t.dataset || t.dataset.sm !== 'fchk' || !kind()) return;
    var j = await sapi('follow', { id: t.dataset.v, done: !!t.checked });
    if (!j || !j.ok) { toast((j && j.error) || '체크하지 못했어요'); t.checked = !t.checked; return; }
    Q.card = null; loadCard(true);
  });
  window.sinfoName = function (id, name) { return kind() ? '<a href="#" data-sm="open" data-v="' + esc(id) + '" style="color:inherit;text-decoration:underline dotted;font-weight:700" title="학생 정보 열기">' + esc(name) + '</a>' : '<b>' + esc(name) + '</b>'; };   // 다른 화면의 학생 이름을 누를 수 있게
  window.sinfoOpen = function (sid) { if (!kind()) return; Q.sid = sid; Q.card = null; Q.err = null; S.tab = 'sinfo'; render(0); };   // 다른 화면에서 학생 이름을 눌렀을 때 쓰는 문
  window.sinfoReset = function () { Q.tok = null; Q.list = null; Q.feed = null; Q.card = null; Q.sid = null; Q.q = ''; Q.cls = ''; };
})();
