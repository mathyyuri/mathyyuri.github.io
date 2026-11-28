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
  function isM(c) { c = String(c || ''); return c === 'MATHY CLASS' || c.indexOf('MATHY CLASS · ') === 0; }
  function clsTxt(c) { return isM(c) ? 'MATHY CLASS' : c; }
  function collapse(a) { var out = [], mc = false; (a || []).forEach(function (c) { if (isM(c)) mc = true; else out.push(c); }); if (mc) out.push('MATHY CLASS'); return out; }
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
  function an(n) { n = String(n == null ? '' : n); return /(원장|상담실장|부원장|조교)$/.test(n) ? n + '님' : n; }     // 직함으로 끝나는 이름에는 '님'을 붙여 보여요 (예: 김지은 부원장 → 김지은 부원장님)
  function nl(t) { return esc(t).replace(/\n/g, '<br>'); }
  function tel(p) { return String(p || '').replace(/[^0-9+]/g, ''); }
  function stars(n) { return '<span style="color:#d49a1a;letter-spacing:1px">' + '★'.repeat(n) + '</span><span style="color:#d8d2c6;letter-spacing:1px">' + '★'.repeat(5 - n) + '</span>'; }
  function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }

  /* ── 불러오기 ── */
  async function loadList() {
    if (Q.loading) return; Q.loading = true; var tok = TOKEN;
    var j = await sapi('search', { q: Q.q, cls: S.mc ? 'MATHY CLASS' : Q.cls });
    Q.loading = false; if (tok !== TOKEN) return;
    Q.tok = tok; Q.listAt = Date.now();
    if (!j || !j.ok) { Q.err = (j && j.error) || '불러오지 못했어요'; Q.list = null; } else { Q.err = null; Q.list = (j.list || []).filter(function (x) { return !!S.mc === isM(x.cls); }); Q.classes = S.mc ? [] : collapse(j.classes).filter(function (c) { return c !== 'MATHY CLASS'; }); }
    if (S.tab === 'sinfo' && !Q.sid) { var el = document.getElementById('smlist'); if (el) el.innerHTML = listHtml(); else render(); }
  }
  async function loadFeed() {
    var tok = TOKEN, j = await sapi('feed'); if (tok !== TOKEN) return;
    Q.feed = j && j.ok ? { follows: (j.follows || []).filter(function (x) { return !!S.mc === isM(x.cls); }), recent: (j.recent || []).filter(function (x) { return !!S.mc === isM(x.cls); }) } : { follows: [], recent: [] };
    if (S.tab === 'sinfo' && !Q.sid) { var el = document.getElementById('smfeed'); if (el) el.innerHTML = feedHtml(); }
  }
  async function loadCard(keep) {
    if (Q.cardBusy || !Q.sid) return; Q.cardBusy = true; var tok = TOKEN, sid = Q.sid;
    var j = await sapi('card', { sid: sid }); Q.cardBusy = false; if (tok !== TOKEN || Q.sid !== sid) return;
    if (!j || !j.ok) { Q.err = (j && j.error) || '불러오지 못했어요'; Q.card = null; } else { Q.err = null; Q.card = j; }
    if (S.tab === 'sinfo' || String(S.tab).indexOf('mc:') === 0) render(keep ? undefined : 0);
  }
  window.sinfoAfter = function () {
    if (S.tab !== 'sinfo' || !kind()) return;
    if (Q.mcv !== !!S.mc) { Q.mcv = !!S.mc; Q.list = null; Q.feed = null; Q.sid = null; Q.card = null; Q.cls = ''; Q.q = ''; }
    if (Q.tok !== TOKEN && !Q.loading) { Q.list = null; Q.feed = null; Q.card = null; Q.sid = null; Q.q = ''; Q.cls = ''; loadList(); loadFeed(); return; }
    if (Q.sid) { if (!Q.card && !Q.cardBusy) loadCard(); return; }
    if (!Q.list && !Q.loading) loadList();
    else if (Date.now() - Q.listAt > 60000 && !Q.loading) { loadList(); loadFeed(); }
    if (!Q.feed) loadFeed();
  };

  function dueChip(due) {
    if (!due) return '';
    var n = Math.round((new Date(due + 'T00:00') - new Date(today() + 'T00:00')) / 86400000), dl = esc(dstr(due));
    var st = n < 0 ? 'background:#c2503f;color:#fff' : n === 0 ? 'background:#e8a63a;color:#fff' : n <= 3 ? 'background:#fbf3dc;color:#a8760f' : 'background:#eee;color:#777';
    return '<span class="smb" style="' + st + '">' + (n < 0 ? '기한 ' + (-n) + '일 지남 · ' + dl : n === 0 ? '오늘까지' : 'D-' + n + ' · ' + dl) + '</span>';
  }

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
      return '<button class="smrow" type="button" data-sm="open" data-v="' + esc(s.id) + '"><span class="nm">' + esc(s.name) + '</span><span class="muted mt">' + esc(clsTxt(s.cls)) + (s.school ? ' · ' + esc(s.school) : '') + ' · ☎' + esc(s.p4 || '') + '</span><span class="r">' + b + '</span></button>';
    }).join('');
  }
  function feedHtml() {
    var F = Q.feed; if (!F) return '';
    var h = '';
    if (F.follows && F.follows.length) {
      h += '<div class="card"><h3 style="margin:0 0 6px">해야 할 후속 조치 <span class="badge">' + F.follows.length + '건</span></h3>' + F.follows.map(function (f) {
        return '<div class="smk"><div class="d">' + esc(dstr(f.date)) + '</div><div class="t"><a href="#" data-sm="open" data-v="' + esc(f.sid) + '" style="color:inherit;font-weight:700">' + esc(f.name) + '</a> <span class="muted sm">' + esc(f.cls) + ' · ' + esc(an(f.author)) + '</span><div>' + esc(f.follow) + ' ' + dueChip(f.due) + '</div></div><button class="btn sec sm3" data-sm="follow" data-v="' + f.id + '" type="button">완료</button></div>';
      }).join('') + '</div>';
    }
    if (F.recent && F.recent.length) {
      h += '<div class="card"><h3 style="margin:0 0 6px">운영진 최근 기록 <span class="muted sm">(공유)</span></h3>' + F.recent.slice(0, 20).map(function (n) {
        var kd = n.kind === 'consult' ? '상담' : n.kind === 'eval' ? '조교평가' : '특이사항', sc = n.scores ? ' ' + EV.filter(function (e) { return n.scores[e[0]]; }).map(function (e) { return e[1] + n.scores[e[0]]; }).join(' ') : '';
        return '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t"><a href="#" data-sm="open" data-v="' + esc(n.sid) + '" style="color:inherit;font-weight:700">' + esc(n.name) + '</a> <span class="smb" style="background:var(--soft);color:var(--acc)">' + kd + '</span> <span class="muted sm">' + esc(an(n.author)) + '</span><div class="sm">' + esc(n.body || '') + esc(sc) + '</div></div></div>';
      }).join('') + '</div>';
    }
    return h;
  }
  function vList() {
    var chips = S.mc ? '' : '<div class="chips"><button class="chip ' + (!Q.cls ? 'on' : '') + '" data-sm="cls" data-v="" type="button">전체</button>' + (Q.classes || []).map(function (c) { return '<button class="chip ' + (Q.cls === c ? 'on' : '') + '" data-sm="cls" data-v="' + esc(c) + '" type="button">' + esc(c) + '</button>'; }).join('') + '</div>';
    return (isAdm() && !S.mc ? '<div class="card" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>상담실장</b> <span class="muted sm">담당 학생만 보는 별도 화면 · 등록과 담당 배정은 여기서</span></div><button class="btn sec sm3" data-sm="csopen" type="button">상담실장 관리 · 담당 배정</button></div>' : '') +
      '<div class="card"><div class="fld" style="margin:0 0 8px"><input type="text" id="smq" value="' + esc(Q.q) + '" placeholder="이름 · 학교 · 학부모 전화 뒤 4자리" autocomplete="off" data-si="smq" style="font-size:16px"></div>' +
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
  function vCard(d, embed) {
    var st = d.stu, notes = d.notes || [], sp = notes.filter(function (n) { return n.kind === 'special'; }), co = notes.filter(function (n) { return n.kind === 'consult'; }), ev = notes.filter(function (n) { return n.kind === 'eval'; });
    var pins = sp.filter(function (n) { return n.pinned; }), h = '';
    if (!embed) h += '<button class="btn gh sm3" data-sm="back" type="button">← 목록으로</button>';
    h += '<div class="card" style="margin-top:10px"><div class="smhd"><h2>' + esc(st.name) + '</h2><span class="badge">' + esc(clsTxt(st.cls)) + '</span><span class="muted">' + esc(st.school || '') + '</span>' + (st.active ? '' : '<span class="smb" style="background:#eee;color:#777">퇴원/비활성</span>') + '</div>';
    if (st.phone) h += '<div class="smbtn"><a class="btn rose" href="tel:' + esc(tel(st.phone)) + '" style="text-decoration:none">📞 학부모 ' + esc(st.phone) + '</a><button class="btn gh" data-sm="copy" data-v="' + esc(st.phone) + '" type="button">번호 복사</button></div>';
    else h += '<div class="muted sm" style="margin-top:6px">등록된 학부모 전화번호가 없어요</div>';
    h += '<div class="smbtn"><button class="btn" data-sm="new" data-v="consult" type="button">+ 상담 기록</button><button class="btn sec" data-sm="new" data-v="special" type="button">+ 특이사항</button><button class="btn sec" data-sm="new" data-v="eval" type="button">+ 조교평가</button></div></div>';
    if (pins.length) h += '<div class="smwarn"><b>⚠ 특이사항</b>' + pins.map(function (n) { return '<div style="margin-top:4px">' + nl(n.body) + '</div>'; }).join('') + '</div>';
    /* 상담내역 */
    h += '<div class="card"><h3 style="margin:0 0 6px">상담내역 <span class="badge">' + co.length + '건</span></h3>';
    if (!co.length) h += '<div class="empty" style="padding:14px">아직 상담 기록이 없어요</div>';
    co.forEach(function (n) {
      h += '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t"><span class="smb" style="background:var(--soft);color:var(--acc)">' + esc(VIA[n.via] || '') + ' · ' + esc(WHO[n.who] || '') + '</span> <span class="muted sm">' + esc(an(n.author)) + (n.edited ? ' · 수정됨' : '') + '</span><div style="margin-top:3px">' + nl(n.body) + '</div>' +
        (n.follow ? '<div style="margin-top:6px"><label style="cursor:pointer"><input type="checkbox" data-sm="fchk" data-v="' + n.id + '"' + (n.done ? ' checked' : '') + ' style="accent-color:var(--acc);width:18px;height:18px;vertical-align:-3px"> <b style="' + (n.done ? 'text-decoration:line-through;color:var(--mut)' : 'color:#b57c12') + '">후속: ' + esc(n.follow) + '</b></label> ' + (n.done ? '' : dueChip(n.fdue)) + '</div>' : '') + noteBtns(n, d) + '</div></div>';
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
      h += '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t">' + evLine(n.scores) + ' <span class="muted sm">' + esc(an(n.author)) + (n.edited ? ' · 수정됨' : '') + '</span>' + (n.body ? '<div style="margin-top:3px">' + nl(n.body) + '</div>' : '') + noteBtns(n, d) + '</div></div>';
    });
    h += '</div>';
    /* 특이사항 */
    h += '<div class="card"><h3 style="margin:0 0 6px">특이사항 <span class="badge">' + sp.length + '건</span></h3>';
    if (!sp.length) h += '<div class="empty" style="padding:14px">아직 특이사항이 없어요</div>';
    sp.forEach(function (n) {
      h += '<div class="smk"><div class="d">' + esc(dstr(n.date)) + '</div><div class="t">' + (n.pinned ? '<span class="smb" style="background:#fdecea;color:#a8453a">중요</span> ' : '') + '<span class="muted sm">' + esc(an(n.author)) + (n.edited ? ' · 수정됨' : '') + '</span><div style="margin-top:3px">' + nl(n.body) + '</div>' + noteBtns(n, d) + '</div></div>';
    });
    h += '</div>';
    /* 성적 상세·상담 도우미 (scoredetail.js) */
    try { var hw0 = d.hw || { total: 0, done: 0 }, at0 = d.att || {}; if (window.sdHtml) h += window.sdHtml(d, { name: st.name, hwPct: hw0.total ? Math.round(hw0.done / hw0.total * 100) : null, late: at0.late || 0, absent: at0.absent || 0, save: function (b) { return sapi('sd_save', { sid: st.id, body: b }); }, clear: function () { return sapi('sd_clear', { sid: st.id }); } }); } catch (e) { }
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
    if (d.views && d.views.length) h += '<div class="shwarn" style="font-size:12.5px;color:var(--mut)">최근 열람: ' + d.views.map(function (v) { return esc(an(v.staff)) + ' ' + esc(String(v.at).slice(5).replace('T', ' ')); }).join(' · ') + '</div>';
    return h;
  }

  window.sinfoEnsure = function (sid) {
    if (!kind()) return;
    if (Q.tok !== TOKEN) { Q.tok = TOKEN; Q.card = null; Q.sid = null; }
    if (Q.sid !== sid) { Q.sid = sid; Q.card = null; Q.err = null; }
    if (!Q.card && !Q.cardBusy) loadCard();
  };
  window.sinfoEmbed = function (sid) {
    if (!kind()) return '';
    if (Q.sid !== sid) return '<div class="card"><div class="empty">불러오는 중…</div></div>';
    if (Q.err && !Q.card) return '<div class="note">' + esc(Q.err) + '</div>';
    if (!Q.card) return '<div class="card"><div class="empty">학생 정보를 불러오는 중…</div></div>';
    return vCard(Q.card, true);
  };
  window.vSinfo = function () {
    if (!kind()) return '<div class="card"><div class="empty">이 화면은 분당미래탐구 운영진만 쓸 수 있어요.</div></div>';
    if (Q.csv && isAdm()) return vCs();
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
        '<label class="l">후속 조치 (할 일이 있으면, 끝나면 체크해요)</label><input type="text" id="smf_follow" maxlength="200" value="' + esc(n.follow || '') + '" placeholder="예: 시험 범위표 문자로 보내기">' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px"><span class="muted sm">기한</span><input type="date" id="smf_fdue" style="width:auto" value="' + esc(n.fdue || '') + '">' + [['내일', 1], ['3일 뒤', 3], ['1주 뒤', 7]].map(function (x) { return '<button type="button" class="btn gh sm3" data-sm="smdq" data-v="' + x[1] + '">' + x[0] + '</button>'; }).join('') + '<button type="button" class="btn gh sm3" data-sm="smdq" data-v="x">기한 없음</button></div>';
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
    if (k === 'consult') { args.via = v('smf_via'); args.who = v('smf_who'); args.follow = v('smf_follow'); args.follow_due = v('smf_fdue'); }
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
    if (a === 'smdq') { var di = document.getElementById('smf_fdue'); if (di) { if (v === 'x') di.value = ''; else { var d0 = new Date(); d0.setDate(d0.getDate() + (+v)); di.value = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2) + '-' + ('0' + d0.getDate()).slice(-2); } } return; }
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
  window.sinfoReset = function () { Q.csld = null; Q.csp = null; Q.tok = null; Q.list = null; Q.feed = null; Q.card = null; Q.sid = null; Q.q = ''; Q.cls = ''; Q.csv = false; Q.csd = null; Q.csl = null; };

  /* ══════════ 원장 전용: 상담실장 등록 · 전용 링크 · 담당 학생 배정 · 로그인 기록 (서버: 65_상담실장_담당학생_서버.sql, 문 ac_counsel) ══════════
     상담실장은 별도 화면(counsel.html, 전용 링크로 바로 로그인)으로 들어와 '내 담당 학생'만 봐요. 여기서는 사람을 등록하고 담당·링크·로그인 기록을 관리해요. */
  function isAdm() { try { var u = me(); return !!u && u.role === 'admin' && kind(); } catch (e) { return false; } }
  var CSURL = API_URL.replace('ac_api', 'ac_counsel'), CS_PAGE = 'https://mathyyuri.com/counsel.html';
  async function capi(a, args) {
    var r;
    try { r = await fetch(CSURL, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: API_KEY, Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify({ p_action: a, p_token: TOKEN, p_args: args || {} }) }); }
    catch (e) { return { ok: false, error: '인터넷 연결을 확인해 주세요' }; }
    if (!r.ok) return { ok: false, error: r.status === 404 ? '상담실장 서버가 아직 준비되지 않았어요 (65_상담실장_담당학생_서버.sql 실행 필요)' : '서버에 연결하지 못했어요 (' + r.status + ')' };
    try { return await r.json(); } catch (e) { return { ok: false, error: '서버 응답을 읽지 못했어요' }; }
  }
  async function csLoad() {
    var j = await capi('adm_list'); if (!isAdm()) return;
    if (!j || !j.ok) { Q.cse = (j && j.error) || '불러오지 못했어요'; Q.csd = null; } else { Q.cse = null; Q.csd = j; }
    var l = await capi('adm_logins', { n: 60 }); if (!isAdm()) return;
    Q.csl = l && l.ok ? l : null;
    var lj = await capi('adm_ld_pending'); if (!isAdm()) return;
    Q.csld = lj && lj.ok ? lj : null;
    var pj = await capi('adm_plan'); if (!isAdm()) return;
    Q.csp = pj && pj.ok ? pj : null;
    if (Q.csv && S.tab === 'sinfo') render();
  }
  function csLink(c) { return CS_PAGE + '?k=' + c.key; }
  function csDev(ua) {
    ua = String(ua || ''); var os = /iPhone|iPad/.test(ua) ? '아이폰' : /Android/.test(ua) ? '안드로이드' : /Windows/.test(ua) ? '윈도우 PC' : /Mac OS/.test(ua) ? '맥' : ua ? '기타' : '?';
    var br = /KAKAOTALK/i.test(ua) ? ' · 카카오톡' : /SamsungBrowser/.test(ua) ? ' · 삼성인터넷' : /Edg\//.test(ua) ? ' · 엣지' : /CriOS|Chrome/.test(ua) ? ' · 크롬' : /Safari/.test(ua) ? ' · 사파리' : '';
    return os + br;
  }
  function csStatus(c) {
    if (!c.active) return '<span class="smb" style="background:#eee;color:#777">사용 중지</span>';
    return '<span class="smb" style="background:#e3f1ea;color:#2f7a67">사용 중</span> <span class="muted sm">' + (c.last_login ? '마지막 로그인 ' + esc(String(c.last_login).slice(5).replace('T', ' ')) : '아직 로그인한 적 없어요') + '</span>';
  }
  function csLogHtml() {
    var L = Q.csl; if (!L) return '';
    var h = '<div class="card"><h3 style="margin:0 0 4px">로그인 기록 <span class="muted sm">(최근 ' + (L.logs || []).length + '건 · 원장만 볼 수 있어요)</span></h3>' +
      (L.fail24 > 0 ? '<div class="smwarn" style="padding:8px 12px;margin:6px 0"><b>최근 24시간 로그인 실패 ' + L.fail24 + '건</b> — 모르는 시도가 있으면 해당 상담실장의 [전용 링크 새로 만들기]를 눌러 주세요.</div>' : '');
    if (!(L.logs || []).length) return h + '<div class="empty" style="padding:14px">아직 로그인 기록이 없어요</div></div>';
    h += '<table class="smtbl">' + L.logs.map(function (x) {
      return '<tr><td class="muted" style="white-space:nowrap;width:92px">' + esc(String(x.at).slice(5).replace('T', ' ')) + '</td><td><b>' + esc(x.name) + '</b> <span class="muted sm">' + (x.how === 'link' ? '전용 링크' : '이름+번호') + '</span><div class="muted sm">' + esc(csDev(x.ua)) + (x.ip ? ' · ' + esc(x.ip) : '') + '</div></td>' +
        '<td style="text-align:right;white-space:nowrap;font-weight:700;color:' + (x.ok ? '#2f7a67' : '#a8453a') + '">' + (x.ok ? '성공' : '실패') + '</td></tr>';
    }).join('') + '</table></div>';
    return h;
  }
  function vCs() {
    var d = Q.csd, h = '<button class="btn gh sm3" data-sm="csback" type="button">← 학생정보로</button>';
    h += '<div class="card" style="margin-top:10px"><h3 style="margin:0 0 6px">상담실장 관리</h3>' +
      '<div class="sm" style="line-height:1.7">상담실장마다 <b>전용 링크</b>가 하나씩 있어요. 그 링크를 폰에서 한 번 열면 <b>바로 로그인</b>되고, 그 폰에서는 계속 로그인된 상태예요. 링크를 잃어버렸을 땐 <b>이름 + 전화번호 뒤 4자리</b>로도 들어와요. <b>담당으로 정해 준 학생만</b> 보여요(서버가 막아요). 부원장·데스크처럼 전체가 필요한 사람은 <b>전체 학생 보기</b>를 켜면 돼요. 화면은 왼쪽 학생 명단(가나다) → 학생을 누르면 오른쪽에 그 학생의 수업 현황·상담 내용이 보이는 한 가지뿐이에요.</div>' +
      '<div class="smbtn"><button class="btn" data-sm="csadd" type="button">+ 등록 (원장·상담실장·부원장·조교)</button></div></div>';
    if (Q.cse) return h + '<div class="note">' + esc(Q.cse) + '</div>';
    if (!d) return h + '<div class="card"><div class="empty">불러오는 중…</div></div>';
    if (!d.counselors.length) return h + '<div class="card"><div class="empty">아직 등록한 상담실장이 없어요</div></div>';
    d.counselors.forEach(function (c) {
      h += '<div class="card"><div class="smhd"><h2 style="font-size:21px">' + esc(c.name) + ' ' + esc(c.title || '상담실장') + '님</h2><span class="muted sm">☎ 뒤 ' + esc(c.p4) + '</span><span class="badge">' + (c.all ? '전체 학생 보기' : '담당 ' + c.n + '명') + '</span></div><div style="margin:6px 0">' + csStatus(c) + '</div>' +
        '<div class="smbtn">' + (c.active ? '<button class="btn rose" data-sm="cscopy" data-v="' + esc(csLink(c)) + '" type="button">전용 링크 복사</button>' + (c.all ? '' : '<button class="btn" data-sm="csassign" data-v="' + esc(c.id) + '" type="button">담당 학생 배정</button>') : '') +
        '<button class="btn gh sm3" data-sm="csedit" data-v="' + esc(c.id) + '" type="button">이름·번호 고치기</button>' +
        '<button class="btn gh sm3" data-sm="csreset" data-v="' + esc(c.id) + '" type="button">전용 링크 새로 만들기</button>' +
        '<button class="btn gh sm3" data-sm="csactive" data-v="' + esc(c.id) + '" data-on="' + (c.active ? '0' : '1') + '" type="button">' + (c.active ? '사용 중지' : '다시 사용') + '</button>' +
        '<button class="btn dng sm3" data-sm="csdel" data-v="' + esc(c.id) + '" type="button">삭제</button></div></div>';
    });
    return h + csLeadCard() + csPlanCard() + csLogHtml() + '<div class="shwarn" style="font-size:12.5px;color:var(--mut)">전용 링크는 그 사람만 알아야 해요(카톡 나와의 채팅·개인 메시지로만 보내 주세요). 폰을 잃어버렸거나 링크가 퍼졌다면 [전용 링크 새로 만들기]를 누르세요. 옛 링크와 로그인된 기기가 모두 풀려요. 상담실장이 쓴 상담·특이사항은 이 학생정보 화면에도 같은 기록으로 보이고, 쓴 사람 이름 옆에 직함(원장·상담실장·부원장·조교)이 붙어요.</div>';
  }
  function csLeadCard() {
    var L = Q.csld; if (!L) return '';
    var h = '<div class="card"><h3 style="margin:0 0 4px">문의·관심 학생 → 수강생 등록 <span class="badge">' + (L.pending || []).length + '명 대기</span></h3><div class="muted sm" style="margin-bottom:6px">상담 화면에서 상태를 <b>"등록"</b>으로 바꾼 문의 학생이 여기에 떠요. [수강생으로 등록]을 누르면 수강생 명단에 이름·학교·전화가 그대로 들어가고, 문의 때 쓴 상담 기록도 학생 카드로 따라가요. (문의 학생 전체 ' + L.total + '명)</div>';
    if (!(L.pending || []).length) return h + '<div class="empty" style="padding:10px">등록 대기 중인 문의 학생이 없어요</div></div>';
    (L.pending || []).forEach(function (x) {
      h += '<div class="smk"><div class="t"><b>' + esc(x.name) + '</b> <span class="muted sm">' + esc([x.grade, x.school].filter(Boolean).join(' · ')) + (x.interest ? ' · 관심 ' + esc(x.interest) : '') + '</span><div class="muted sm">☎ ' + (x.phone ? esc(x.phone) : '<b style="color:#a8453a">전화번호 없음 (상담 화면에서 넣어 주세요)</b>') + ' · 등록 ' + esc(an(x.by)) + ' · 상담 기록 ' + x.notes + '건</div></div>' +
        '<button class="btn sm3" data-sm="csldreg" data-v="' + esc(x.id) + '" type="button">수강생으로 등록</button><button class="btn dng sm3" data-sm="csldx" data-v="' + esc(x.id) + '" type="button">삭제</button></div>';
    });
    return h + '</div>';
  }
  function csPlanCard() {
    var P = Q.csp; if (!P) return '';
    var h = '<div class="card"><h3 style="margin:0 0 4px">수업 진행표 <span class="muted sm">(상담 화면 메인에 회차 목차로 보여요)</span></h3><div class="muted sm" style="margin-bottom:6px">날짜가 지난 회차는 색이 켜지고, 아직 안 한 회차는 어둡게 보여요(날짜 기준 자동).</div>';
    (P.classes || []).forEach(function (c) {
      h += '<div class="smk"><div class="t"><b>' + esc(c.cls) + '</b> <span class="muted sm">' + c.rows.length + '회차 · ' + esc(String(c.rows[0].day).slice(5)) + ' ~ ' + esc(String(c.rows[c.rows.length - 1].day).slice(5)) + '</span></div><button class="btn sec sm3" data-sm="cspedit" data-v="' + esc(c.cls) + '" type="button">고치기</button></div>';
    });
    if (!(P.classes || []).length) h += '<div class="empty" style="padding:10px">아직 진행표가 없어요</div>';
    return h + '<div class="smbtn"><button class="btn gh sm3" data-sm="cspnew" type="button">+ 다른 반 진행표 만들기</button></div></div>';
  }
  function cspRow(r) {
    r = r || {};
    return '<div class="cspr" style="border:1px solid var(--line);border-radius:14px;padding:8px 10px;margin-top:8px;background:#fff"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
      '<input type="number" min="1" max="60" data-f="no" value="' + esc(r.no || '') + '" placeholder="회" style="width:64px;border:1px solid var(--line);border-radius:10px;padding:7px"><span class="muted sm">회</span>' +
      '<input type="date" data-f="day" value="' + esc(String(r.day || '').slice(0, 10)) + '" style="border:1px solid var(--line);border-radius:10px;padding:7px">' +
      '<input type="text" data-f="qtr" maxlength="60" value="' + esc(r.qtr || '') + '" placeholder="분기 (예: 1분기 · 공수1 중간)" style="flex:1;min-width:150px;border:1px solid var(--line);border-radius:10px;padding:7px">' +
      '<button class="btn dng sm3" data-sm="cspdel" type="button">삭제</button></div>' +
      '<input type="text" data-f="title" maxlength="80" value="' + esc(r.title || '') + '" placeholder="제목 (예: 태원고 · 한솔고)" style="width:100%;margin-top:6px;border:1px solid var(--line);border-radius:10px;padding:7px">' +
      '<input type="text" data-f="detail" maxlength="300" value="' + esc(r.detail || '') + '" placeholder="내용 (예: 모의 1회 태원고 2026 중간 …)" style="width:100%;margin-top:6px;border:1px solid var(--line);border-radius:10px;padding:7px">' +
      '<input type="text" data-f="hw" maxlength="200" value="' + esc(r.hw || '') + '" placeholder="숙제 (예: 과제 1·2회)" style="width:100%;margin-top:6px;border:1px solid var(--line);border-radius:10px;padding:7px"></div>';
  }
  function cspHtml(cls, rows) {
    return '<h3>' + (cls ? esc(cls) + ' 수업 진행표' : '새 반 진행표') + '</h3>' + (cls ? '' : '<label class="l" style="display:block;font-size:13px;font-weight:600;color:var(--mut);margin:10px 0 5px">반 이름 (학생 반 이름과 똑같이)</label><input type="text" id="csp_cls" maxlength="40" placeholder="예: 공수내모" style="width:100%;border:1px solid var(--line);border-radius:14px;padding:10px 12px;font-size:16px">') +
      '<div class="muted sm" style="margin:6px 0 0">날짜가 지난 회차는 색이 켜지고 아직 안 한 회차는 어둡게 보여요. 회차를 모두 지우고 저장하면 이 반의 진행표가 없어져요.</div>' +
      '<div id="csp_rows" style="max-height:56vh;overflow:auto">' + (rows || []).map(cspRow).join('') + '</div>' +
      '<div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn sec" data-sm="cspadd" type="button">+ 회차 추가</button><button class="btn" data-sm="cspsave" data-cls="' + esc(cls || '') + '" type="button">저장</button><button class="btn gh" onclick="closeModal()" type="button">닫기</button></div>';
  }
  function csForm(c) {
    return '<h3>' + (c ? '이름·직함·번호 고치기' : '원장·상담실장·부원장·조교 등록') + '</h3><div class="smf"><label class="l">이름 (직함은 빼고 · 로그인할 때 쓰는 이름이에요 · 중복 불가)</label><input type="text" id="csf_name" maxlength="20" value="' + esc(c ? c.name : '') + '" placeholder="예: 김지은">' +
      '<label class="l">직함 (화면에는 "이름 직함님"으로 보여요)</label><select id="csf_title">' + ['원장', '상담실장', '부원장', '조교'].map(function (t) { return '<option value="' + t + '"' + ((c ? c.title : '상담실장') === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
      '<label class="l">전화번호 (전체나 뒤 4자리)</label><input type="text" id="csf_phone" maxlength="20" inputmode="numeric" value="' + esc(c ? c.p4 : '') + '" placeholder="예: 010-1234-5678">' +
      '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:14px;cursor:pointer"><input type="checkbox" id="csf_all"' + (c && c.all ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--acc);margin-top:2px"> <span><b>전체 학생 보기</b> <span class="muted sm">(부원장·데스크처럼 모든 학생이 필요한 사람은 켜 주세요. 끄면 담당으로 배정한 학생만 보여요)</span></span></label>' +
      (c ? '' : '<div class="muted sm" style="margin-top:8px">등록하면 그 사람만의 전용 링크가 만들어져요. [전용 링크 복사]로 복사해서 개인 메시지로 보내 주세요.</div>') +
      '</div><div class="row" style="gap:8px;margin-top:16px"><button class="btn" data-sm="cssave" data-id="' + (c ? esc(c.id) : '') + '" type="button">' + (c ? '저장' : '등록') + '</button><button class="btn gh" onclick="closeModal()" type="button">닫기</button></div>';
  }
  function csAssignHtml(c) {
    var st = Q.csd.students, cls = {}, names = {}; Q.csd.counselors.forEach(function (x) { names[x.id] = x.name; });
    st.forEach(function (s) { (cls[s.cls] = cls[s.cls] || []).push(s); });
    var h = '<h3>' + esc(c.name) + ' · 담당 학생 배정</h3><div class="muted sm" style="margin:4px 0 8px">체크한 학생만 이 상담실장에게 보여요. 한 학생을 여러 명이 맡아도 돼요.</div>' +
      '<input type="text" id="csa_q" placeholder="이름 · 학교로 찾기" autocomplete="off" data-cs="q" style="width:100%;border:1px solid var(--line);border-radius:14px;padding:10px 12px;font-size:16px;margin-bottom:6px">' +
      '<div class="muted sm" id="csa_n" style="margin-bottom:4px"></div><div style="max-height:52vh;overflow:auto">';
    Object.keys(cls).sort().forEach(function (k) {
      h += '<div data-csg="' + esc(k) + '"><div style="display:flex;align-items:center;gap:8px;margin:10px 0 2px"><b>' + esc(clsTxt(k)) + '</b><button class="btn gh sm3" data-sm="csall" data-v="' + esc(k) + '" type="button">반 전체 선택/해제</button></div>' +
        cls[k].map(function (s) {
          var others = (s.cs || []).filter(function (id) { return id !== c.id; }).map(function (id) { return names[id]; }).filter(Boolean);
          return '<label class="csr" data-csn="' + esc((s.name + ' ' + (s.school || '')).toLowerCase()) + '" style="display:flex;gap:10px;align-items:center;padding:7px 4px;border-top:1px solid var(--line);cursor:pointer"><input type="checkbox" data-csk="' + esc(s.id) + '" data-csc="' + esc(k) + '"' + ((s.cs || []).indexOf(c.id) >= 0 ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--acc);flex:none"><span style="font-weight:700">' + esc(s.name) + '</span><span class="muted sm">' + esc(s.school || '') + '</span>' + (others.length ? '<span class="muted sm" style="margin-left:auto">이미 ' + esc(others.join('·')) + '</span>' : '') + '</label>';
        }).join('') + '</div>';
    });
    return h + '</div><div class="row" style="gap:8px;margin-top:14px"><button class="btn" data-sm="csasave" data-v="' + esc(c.id) + '" type="button">저장</button><button class="btn gh" onclick="closeModal()" type="button">닫기</button></div>';
  }
  function csCount() { var n = document.querySelectorAll('[data-csk]:checked').length, e = document.getElementById('csa_n'); if (e) e.textContent = '선택 ' + n + '명'; }
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || !t.dataset || t.dataset.cs !== 'q') return;
    var v = t.value.trim().toLowerCase();
    document.querySelectorAll('.csr').forEach(function (r) { r.style.display = !v || r.dataset.csn.indexOf(v) >= 0 ? 'flex' : 'none'; });
  });
  document.addEventListener('change', function (e) { if (e.target && e.target.dataset && e.target.dataset.csk !== undefined) csCount(); });
  document.addEventListener('click', async function (e) {
    var t = e.target.closest && e.target.closest('[data-sm]'); if (!t || !t.dataset.sm || t.dataset.sm.indexOf('cs') !== 0 || !isAdm()) return;
    var a = t.dataset.sm, v = t.dataset.v, j, c = Q.csd && Q.csd.counselors.filter(function (x) { return x.id === v; })[0];
    if (a === 'csldreg') {
      var lp = ((Q.csld && Q.csld.pending) || []).filter(function (x) { return x.id === v; })[0]; if (!lp) return;
      var cl = (typeof AC !== 'undefined' && AC.bd && AC.bd.classes ? AC.bd.classes : ['공수내모']).filter(function (c) { return String(c).indexOf('MATHY CLASS') !== 0; });
      openModal('<h3>' + esc(lp.name) + ' · 수강생으로 등록</h3><div class="muted sm" style="margin:4px 0 8px">' + esc(lp.school || '') + ' · ☎ ' + esc(lp.phone || '') + '<br>로그인 번호는 학부모 전화 뒤 4자리예요(이름 + 뒤 4자리).</div><div class="smf"><label class="l">반</label><select id="csld_cls">' + cl.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div>' +
        '<div class="row" style="gap:8px;margin-top:16px"><button class="btn" data-sm="csldgo" data-v="' + esc(lp.id) + '" type="button">등록</button><button class="btn gh" onclick="closeModal()" type="button">닫기</button></div>'); return;
    }
    if (a === 'csldgo') {
      t.disabled = true; j = await capi('adm_ld_convert', { id: v, cls: (document.getElementById('csld_cls') || {}).value }); t.disabled = false;
      if (!j || !j.ok) { toast((j && j.error) || '등록하지 못했어요'); return; }
      closeModal(); toast('수강생으로 등록했어요 (상담 기록 ' + j.notes + '건 이어졌어요)'); Q.list = null; Q.listAt = 0; csLoad(); return;
    }
    if (a === 'csldx') {
      if (!confirm('이 문의 학생을 지울까요? (상담 기록도 함께 지워져요)')) return;
      j = await capi('adm_ld_del', { id: v }); if (!j || !j.ok) { toast((j && j.error) || '지우지 못했어요'); return; } toast('지웠어요'); csLoad(); return;
    }
    if (a === 'cspedit') { var pc = ((Q.csp && Q.csp.classes) || []).filter(function (x) { return x.cls === v; })[0]; if (pc) openModal(cspHtml(pc.cls, pc.rows)); return; }
    if (a === 'cspnew') { openModal(cspHtml('', [{ no: 1 }])); return; }
    if (a === 'cspadd') {
      var wrap = document.getElementById('csp_rows'), last = wrap.querySelectorAll('.cspr'), lr = last.length ? last[last.length - 1] : null, nn = 1, nd = '';
      if (lr) { nn = (+lr.querySelector('[data-f=no]').value || last.length) + 1; var ld = lr.querySelector('[data-f=day]').value; if (ld) { var dd = new Date(ld + 'T00:00'); dd.setDate(dd.getDate() + 7); nd = dd.getFullYear() + '-' + ('0' + (dd.getMonth() + 1)).slice(-2) + '-' + ('0' + dd.getDate()).slice(-2); } var lq = lr.querySelector('[data-f=qtr]').value; }
      wrap.insertAdjacentHTML('beforeend', cspRow({ no: nn, day: nd, qtr: lq || '' })); wrap.scrollTop = wrap.scrollHeight; return;
    }
    if (a === 'cspdel') { var rw = t.closest('.cspr'); if (rw) rw.remove(); return; }
    if (a === 'cspsave') {
      var cls = t.dataset.cls || ((document.getElementById('csp_cls') || {}).value || '').trim(), rows = [];
      document.querySelectorAll('#csp_rows .cspr').forEach(function (r) { var g = function (f) { return r.querySelector('[data-f=' + f + ']').value; }; rows.push({ no: +g('no'), day: g('day'), qtr: g('qtr'), title: g('title'), detail: g('detail'), hw: g('hw') }); });
      if (!cls) { toast('반 이름을 입력해 주세요'); return; }
      for (var i = 0; i < rows.length; i++) { if (!rows[i].no || !rows[i].day) { toast((i + 1) + '번째 줄의 회차와 날짜를 채워 주세요'); return; } }
      rows.sort(function (x, y) { return x.no - y.no; });
      t.disabled = true; j = await capi('adm_plan_save', { cls: cls, rows: rows }); t.disabled = false;
      if (!j || !j.ok) { toast((j && j.error) || '저장하지 못했어요'); return; }
      closeModal(); toast(rows.length ? cls + ' 진행표 ' + j.n + '회차를 저장했어요' : cls + ' 진행표를 지웠어요'); csLoad(); return;
    }
    if (a === 'csopen') { Q.csv = true; Q.csd = null; Q.cse = null; render(0); csLoad(); return; }
    if (a === 'csback') { Q.csv = false; render(0); return; }
    if (a === 'cscopy') { try { await navigator.clipboard.writeText(v); toast('전용 링크를 복사했어요. 개인 메시지로 보내 주세요'); } catch (er) { toast('복사하지 못했어요. 브라우저 권한을 확인해 주세요'); } return; }
    if (a === 'csadd') { openModal(csForm(null)); return; }
    if (a === 'csedit' && c) { openModal(csForm(c)); return; }
    if (a === 'cssave') {
      var args = { name: (document.getElementById('csf_name') || {}).value, phone: (document.getElementById('csf_phone') || {}).value, all: !!(document.getElementById('csf_all') || {}).checked, title: (document.getElementById('csf_title') || {}).value }; if (t.dataset.id) args.id = t.dataset.id;
      t.disabled = true; j = await capi('adm_save', args); t.disabled = false;
      if (!j || !j.ok) { toast((j && j.error) || '저장하지 못했어요'); return; }
      closeModal(); toast(t.dataset.id ? '저장했어요' : '등록했어요. [전용 링크 복사]로 링크를 보내 주세요'); csLoad(); return;
    }
    if (a === 'csreset' && c) {
      if (!confirm(c.name + ' ' + (c.title || '상담실장') + '님의 전용 링크를 새로 만들까요?\n옛 링크는 못 쓰게 되고, 로그인된 기기가 모두 풀려요. 새 링크를 다시 보내 주셔야 해요.')) return;
      j = await capi('adm_reset', { id: v }); if (!j || !j.ok) { toast((j && j.error) || '새로 만들지 못했어요'); return; }
      try { navigator.clipboard.writeText(CS_PAGE + '?k=' + j.key); toast('새 링크를 만들어 복사했어요'); } catch (er) { toast('새 링크를 만들었어요. [전용 링크 복사]를 눌러 주세요'); } csLoad(); return;
    }
    if (a === 'csactive' && c) {
      var on = t.dataset.on === '1';
      if (!on && !confirm(c.name + ' 님을 사용 중지할까요? 바로 로그아웃되고 들어올 수 없어요. (담당 배정은 그대로 남아요)')) return;
      j = await capi('adm_active', { id: v, active: on }); if (!j || !j.ok) { toast((j && j.error) || '바꾸지 못했어요'); return; } toast(on ? '다시 사용해요' : '사용 중지했어요'); csLoad(); return;
    }
    if (a === 'csdel' && c) {
      if (!confirm(c.name + ' 님을 삭제할까요?\n담당 배정이 모두 사라지고 되돌릴 수 없어요. (이미 쓴 상담 기록은 남아요)')) return;
      j = await capi('adm_del', { id: v }); if (!j || !j.ok) { toast((j && j.error) || '삭제하지 못했어요'); return; } toast('삭제했어요'); csLoad(); return;
    }
    if (a === 'csassign' && c) { openModal(csAssignHtml(c)); csCount(); return; }
    if (a === 'csall') {
      var bx = Array.prototype.filter.call(document.querySelectorAll('[data-csk]'), function (b) { return b.dataset.csc === v && b.closest('.csr').style.display !== 'none'; }), allOn = bx.every(function (b) { return b.checked; });
      bx.forEach(function (b) { b.checked = !allOn; }); csCount(); return;
    }
    if (a === 'csasave') {
      var sids = Array.prototype.map.call(document.querySelectorAll('[data-csk]:checked'), function (b) { return b.dataset.csk; });
      t.disabled = true; j = await capi('adm_assign', { id: v, sids: sids }); t.disabled = false;
      if (!j || !j.ok) { toast((j && j.error) || '저장하지 못했어요'); return; }
      closeModal(); toast('담당 학생 ' + j.n + '명을 저장했어요'); csLoad(); return;
    }
  });
})();
