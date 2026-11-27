/* 교재 구매 — index.html 이 불러 쓰는 부속 파일 (서버: 61_교재구매_서버.sql, 문 이름 ac_shop)
   · 공수내모 반 학생·학부모: 왼쪽 '교재 구매' 탭 → 주차 고르기 → 주문 → 계좌이체 안내 → (원장이 입금 확인하면) 결제 완료
   · 원장(분당미래탐구 화면): 같은 탭이 '교재 주문' — 주문 확인·입금 확인, 학생×주차 구매 현황, 설정(가격·계좌), 교재 사진
   · 보안: 입금 계좌·가격·주문은 모두 서버에서 로그인 뒤에 받아 와요. 이 파일(공개 저장소)에는 계좌·열쇠가 없어요.
     화면에 찍는 글자는 전부 esc() 로 걸러요. 금액은 화면이 아니라 서버가 계산해요.
   · 카드결제 자리: 결제 방법 칸에 '카드 결제(준비 중)'이 있고, 서버에는 method·pay_ref·ac.shop_pay_confirm 이 준비돼 있어요.
   index.html 의 전역(S, me, stuOf, curAc, esc, toast, render, openModal, TOKEN, API_URL, API_KEY, forceLogout)을 가져다 써요. */
(function () {
  var SHOP_URL = API_URL.replace('ac_api', 'ac_shop');
  var P = { tok: null, d: null, at: 0, loading: false, err: null, sel: {}, dep: '', busy: false, flash: null, pic: {}, picBusy: false,
            sub: 'orders', area: 'book', open: {}, list: null, listAt: 0, listLoading: false, flt: 'pending', base: null, baseBusy: false, upWeek: '' };
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var ST = { pending: ['입금 대기', '#b57c12', '#fbf3dc'], paid: ['결제 완료', '#2f7a67', '#e3f1ea'], cancelled: ['취소', '#7a7a7a', '#eee'], refunded: ['환불', '#a8453a', '#fbe8e4'] };
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  function onShop() { return S.tab === 'shop' || String(S.tab).indexOf('mc:') === 0; }
  function kind() {
    try {
      var u = me(); if (!u) return null;
      if (u.role === 'admin') return curAc() === 'bd' ? 'adm' : null;
      if (u.role === 'ta') return null;
      var st = stuOf(u); if (!st || st.ac !== 'bd') return null;
      return st.cls === '공수내모' ? 'stu' : (st.cls === 'MATHY CLASS' || String(st.cls).indexOf('MATHY CLASS · ') === 0) ? 'mc' : null;
    } catch (e) { return null; }
  }
  var ICON = '<svg viewBox="0 0 24 24"><path d="M3 4h2.2l2.1 10.2a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.8L19.5 8H6.2M9.5 19.5h.01M16.5 19.5h.01"/></svg>';
  window.shopTab = function (list) {
    var k = kind(); if (!k) return list; P.area = (k === 'adm' && S.mc) ? 'lec' : 'book';
    var out = list.slice(), i = out.map(function (t) { return t[0]; }).indexOf('exam');
    out.splice(i < 0 ? out.length : i + 1, 0, ['shop', ICON, k === 'adm' ? (S.mc ? '강의 주문' : '교재 주문') : k === 'mc' ? '강의신청' : '교재구매']);
    return out;
  };
  window.shopTitle = function () { var k = kind(); return k === 'adm' ? (S.mc ? '강의 주문' : '교재 주문') : k === 'mc' ? '강의 신청' : '교재 구매'; };

  /* ── 서버 부르기 ── */
  async function sapi(a, args) {
    var r;
    try { r = await fetch(SHOP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: API_KEY, Authorization: 'Bearer ' + API_KEY }, body: JSON.stringify({ p_action: a, p_token: TOKEN, p_args: args || {} }) }); }
    catch (e) { return { ok: false, error: '인터넷 연결을 확인해 주세요' }; }
    if (!r.ok) return { ok: false, error: r.status === 404 ? '교재 구매 서버가 아직 준비되지 않았어요 (61_교재구매_서버.sql 실행 필요)' : '서버에 연결하지 못했어요 (' + r.status + ')' };
    var j; try { j = await r.json(); } catch (e) { return { ok: false, error: '서버 응답을 읽지 못했어요' }; }
    if (j && j.ok === false && j.error && j.error.indexOf('다시 로그인') >= 0 && !(typeof VIEW !== 'undefined' && VIEW)) { try { forceLogout(); } catch (e) {} }
    return j;
  }

  /* ── 작은 도구 ── */
  function won(n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; }
  function dstr(ds) { if (!ds) return ''; var d = new Date(ds + 'T00:00'); return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')'; }
  function weeksTxt(ws) {
    ws = (ws || []).slice().sort(function (a, b) { return a - b; }); var out = [], i = 0;
    while (i < ws.length) { var j = i; while (j + 1 < ws.length && ws[j + 1] === ws[j] + 1) j++; out.push(j > i ? ws[i] + '~' + ws[j] : String(ws[i])); i = j + 1; }
    return out.join(', ') + '주차';
  }
  function badge(st) { var s = ST[st] || [st, '#555', '#eee']; return '<span class="shb" style="color:' + s[1] + ';background:' + s[2] + '">' + esc(s[0]) + '</span>'; }
  function nl(t) { return esc(t).replace(/\n/g, '<br>'); }
  function copy(txt) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function () { toast('복사했어요'); }, function () { toast('길게 눌러 직접 복사해 주세요'); }); return; } } catch (e) {}
    var t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); toast('복사했어요'); } catch (e) { toast('길게 눌러 직접 복사해 주세요'); } document.body.removeChild(t);
  }

  /* ── 불러오기 ── */
  async function load(quiet) {
    if (P.loading) return; P.loading = true; var tok = TOKEN;
    var j = await sapi(kind() === 'mc' ? 'lec_info' : 'info');
    P.loading = false; if (tok !== TOKEN) return;
    P.tok = tok; P.at = Date.now();
    if (!j || !j.ok) { P.err = (j && j.error) || '불러오지 못했어요'; P.d = null; }
    else {
      P.err = null; P.d = j;
      var keep = {}; (j.weeks || []).forEach(function (w) { if (P.sel[w.week] && w.active && w.st === 'none') keep[w.week] = 1; }); (j.items || []).forEach(function (i) { if (P.sel[i.id] && i.st === 'none') keep[i.id] = 1; }); P.sel = keep;
      if (!P.dep && j.me) P.dep = j.me.name || '';
    }
    if (onShop()) render();
  }
  async function loadList() {
    if (P.listLoading) return; P.listLoading = true;
    var j = await sapi('list'); P.listLoading = false;
    P.list = j && j.ok ? j : { err: (j && j.error) || '불러오지 못했어요' }; P.listAt = Date.now();
    if (onShop()) render();
  }
  async function loadPics() {
    if (P.picBusy || !P.d || !P.d.photos) return; P.picBusy = true;
    for (var i = 0; i < P.d.photos.length; i++) {
      var id = P.d.photos[i].id; if (P.pic[id]) continue;
      var j = await sapi('photo', { id: id });
      if (j && j.ok) { P.pic[id] = j.src; paintPics(); } else { P.pic[id] = BLANK; }
    }
    P.picBusy = false;
  }
  /* 기본 교재 사진(해설집 표지·시험지·과제)은 사이트의 books 폴더에 자동으로 만들어져요 — books/books.json 에 회차별 목록이 있어요 */
  async function loadBase() {
    if (P.base || P.baseBusy) return; P.baseBusy = true;
    try { var r = await fetch('books/books.json?v=' + Date.now()); P.base = r.ok ? await r.json() : {}; } catch (e) { P.base = {}; }
    P.baseBusy = false; if (onShop()) render(0);
  }
  function pcard(src, cap, v, id, k) {
    return '<div class="shi' + (k ? ' k-' + esc(k) : '') + '"><img ' + (id ? 'data-sp="' + esc(id) + '" ' : '') + 'data-sa="zoom" data-v="' + esc(v) + '" src="' + esc(src) + '" alt="' + esc(cap) + '">' + (cap ? '<div class="shc">' + esc(cap) + '</div>' : '') + '</div>';
  }
  function bookPics(w) {
    var base = (P.base && P.base[String(w)]) || [], ex = ((P.d && P.d.photos) || []).filter(function (f) { return f.week === w; });
    if (!base.length && !ex.length) return '';
    var h = '<div class="shbk">';
    if (base.length) h += '<div class="shbl">기본 교재</div><div class="shp">' + base.map(function (b) { return pcard(b.f, b.c, b.f, null, b.k); }).join('') + '</div>';
    if (ex.length) h += '<div class="shbl">추가 교재</div><div class="shp">' + ex.map(function (f) { return pcard(P.pic[f.id] || BLANK, f.caption, f.id, f.id); }).join('') + '</div>';
    return h + '</div>';
  }
  function curWeek(d) {
    var t = new Date(), ts = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2), c = null;
    (d.weeks || []).forEach(function (w) { if (c === null && String(w.ds) >= ts) c = w.week; });
    return c === null && d.weeks && d.weeks.length ? d.weeks[d.weeks.length - 1].week : c;
  }
  function paintPics() { document.querySelectorAll('img[data-sp]').forEach(function (im) { var s = P.pic[im.getAttribute('data-sp')]; if (s && im.getAttribute('src') !== s) im.setAttribute('src', s); }); }
  window.shopAfter = function () {
    if (S.tab !== 'shop' || !kind()) return;
    if (P.tok !== TOKEN && !P.loading) { P.d = null; P.list = null; LA.list = null; P.pic = {}; P.sel = {}; P.flash = null; P.dep = ''; load(); return; }
    if (!P.loading && Date.now() - P.at > 30000) load(true);
    if (kind() === 'adm' && P.d && P.area === 'lec' && !LA.loading && (!LA.list || Date.now() - LA.at > 30000)) loadLec();
    else if (kind() === 'adm' && P.d && P.area !== 'lec' && P.sub !== 'set' && P.sub !== 'photo' && !P.listLoading && (!P.list || Date.now() - P.listAt > 30000)) loadList();
    loadBase(); paintPics(); loadPics();
  };

  /* ── CSS ── */
  var css = document.createElement('style');
  css.textContent =
    '.shb{display:inline-block;border-radius:12px;padding:1px 10px;font-size:12px;font-weight:700;vertical-align:1px;white-space:nowrap}' +
    '.shp{display:flex;gap:10px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:thin}.shp .shi{flex:none;width:168px}.shp img{width:168px;height:224px;object-fit:cover;border-radius:14px;border:1px solid var(--line);background:var(--bg2);cursor:zoom-in;display:block}.shp .shc{font-size:12px;text-align:center;color:var(--mut);margin-top:4px}' +
    '.shmo{border:1px solid var(--line);border-radius:18px;margin-top:10px;overflow:hidden;background:var(--card)}.shmh{display:flex;gap:12px;align-items:center;padding:12px 14px;background:var(--soft)}.shmh input{width:24px;height:24px;flex:none;accent-color:var(--acc)}.shmh .t{flex:1;min-width:0;cursor:pointer}.shmh .am{text-align:right;cursor:pointer;white-space:nowrap}.shmh .am b{font-size:17px}.shmo .shw{padding-left:14px;padding-right:14px}' +
    '.shw{display:flex;align-items:flex-start;gap:12px;padding:12px 4px;border-top:1px solid var(--line);cursor:pointer}.shw:first-of-type{border-top:0}.shw.off{opacity:.55;cursor:default}' +
    '.shw input{width:22px;height:22px;margin-top:2px;flex:none;accent-color:var(--acc)}.shw .t{flex:1;min-width:0}.shw .t b{font-size:15px}.shw .it{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}.shw .it span{font-size:12px;background:var(--soft);color:var(--acc);border-radius:10px;padding:1px 9px}' +
    '.shbar{position:sticky;bottom:78px;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:12px 16px;box-shadow:var(--sh);margin-top:12px}.shbar b{font-size:18px}' +
    '@media(min-width:900px){.shbar{bottom:16px}}' +
    '.shpay{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0 4px}.shpay label{flex:1;min-width:150px;border:1.5px solid var(--line);border-radius:16px;padding:10px 14px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px}.shpay label.on{border-color:var(--acc);background:var(--soft)}.shpay label.dis{opacity:.5;cursor:not-allowed}.shpay input{accent-color:var(--acc)}' +
    '.shacct{background:var(--soft);border:1.5px solid var(--acc);border-radius:20px;padding:16px 18px;margin-bottom:16px}.shacct .big{font-family:var(--font);font-variant-numeric:tabular-nums;font-size:22px;font-weight:800;letter-spacing:.5px;word-break:break-all}.shacct .row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:6px 0;border-top:1px dashed #c9b79c}.shacct .row:first-of-type{border-top:0}.shacct .row span:first-child{color:var(--mut);font-size:13px;flex:none}' +
    '.shord{padding:12px 0;border-top:1px solid var(--line)}.shord:first-of-type{border-top:0}.shord .h{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}.shord .a{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}' +
    '.shmx{overflow-x:auto;border:1px solid var(--line);border-radius:14px}.shmx table{border-collapse:collapse;font-size:13px;min-width:100%}.shmx th,.shmx td{padding:6px 7px;text-align:center;border-bottom:1px solid var(--line);white-space:nowrap}.shmx th{background:var(--soft);position:sticky;top:0}.shmx td:first-child,.shmx th:first-child{text-align:left;position:sticky;left:0;background:var(--card);font-weight:700}.shmx th:first-child{background:var(--soft)}.shmx tfoot td{font-weight:700;background:var(--soft2)}' +
    '.shp .shi.k-exam img{border:3px solid #16325c}.shp .shi.k-orig img{border:3px solid #1f5a3d}.shp .shi.k-hw img{border:3px solid #8c2f4a}.shp .shi.k-exam .shc{color:#16325c;font-weight:700}.shp .shi.k-orig .shc{color:#1f5a3d;font-weight:700}.shp .shi.k-hw .shc{color:#8c2f4a;font-weight:700}.shbk{margin:4px 0 2px}.shbl{font-size:12.5px;font-weight:700;color:var(--acc);margin:8px 0 0}.shsel{width:100%;border:1px solid var(--line);border-radius:12px;padding:9px 10px;background:#fff;font:inherit}.shp .shi img[data-v^="books/"]{height:224px}' +
    '.shpa{display:flex;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}.shpa img{width:56px;height:74px;object-fit:cover;border-radius:8px;border:1px solid var(--line);background:var(--bg2)}.shpa .t{flex:1;min-width:0}' +
    '.shin{width:100%;border:1px solid var(--line);border-radius:14px;padding:9px 12px;background:#fff;min-width:0}' +
    '.shwarn{font-size:12.5px;color:var(--mut);line-height:1.55;margin-top:8px}';
  document.head.appendChild(css);

  /* ── 화면: 학생·학부모 ── */
  function acctCard(f, title) {
    var b = f.bank || {};
    return '<div class="shacct"><b style="font-size:15px">' + esc(title) + '</b><div class="muted sm" style="margin:2px 0 8px">주문번호 ' + esc(f.no) + ' · 입금하신 뒤 원장님이 확인하면 \'결제 완료\'로 바뀌어요</div>' +
      '<div class="row"><span>은행</span><b>' + esc(b.bank || '-') + '</b></div>' +
      '<div class="row"><span>계좌번호</span><span class="big">' + esc(b.acct || '-') + '</span><button class="btn sec sm3" data-sa="copy" data-v="' + esc(b.acct || '') + '" type="button">복사</button></div>' +
      '<div class="row"><span>예금주</span><b>' + esc(b.holder || '-') + '</b></div>' +
      '<div class="row"><span>입금할 금액</span><span class="big">' + esc(won(f.amount)) + '</span><button class="btn sec sm3" data-sa="copy" data-v="' + esc(String(f.amount)) + '" type="button">복사</button></div>' +
      '<div class="row"><span>입금자명</span><b>' + esc(f.depositor) + '</b></div>' +
      '<div class="row"><span>주문 내용</span><b>' + esc(f.items ? f.items.join(', ') : weeksTxt(f.weeks)) + '</b></div>' +
      '<div class="shwarn">· 금액을 <b>정확히</b>, 위에 적힌 <b>입금자명</b>으로 보내 주세요.<br>· 계좌가 바뀌었다는 문자·카톡을 받으면 이 화면에서 다시 확인하거나 선생님께 먼저 물어보세요.<br>· 이 화면을 닫아도 \'내 주문 내역\'에서 다시 볼 수 있어요.</div>' +
      '<div style="margin-top:10px"><button class="btn gh sm3" data-sa="flashx" type="button">닫기</button></div></div>';
  }
  function vStu(d) {
    var h = '';
    if (P.flash) h += acctCard(P.flash, P.flash.fresh ? '주문이 접수됐어요 — 아래 계좌로 입금해 주세요' : '입금 안내');
    var n = Object.keys(P.sel).length, total = n * d.price;
    /* 안내 */
    h += '<div class="card"><h3 style="margin:0 0 4px">공수내모 교재 <span class="badge">주당 ' + esc(won(d.price)) + '</span></h3>' +
      '<div class="muted sm">주마다 수업일에 받는 교재예요. 필요한 주차만 골라서 살 수 있어요.</div>' +
      '<ul style="margin:10px 0 0;padding-left:20px;line-height:1.8"><li><b>1주차</b> — 해설집 2권 · 시험지 2개(동형모의고사 2회) · 과제 시험지 2개 · 원본 시험지 2개(학교 시험 그대로) · 첫날 추가문제</li><li><b>2주차부터</b> — 해설집 2권 · 시험지 2개(동형모의고사 2회) · <b>개별 MEN BOOK</b>(내 오답노트)가 함께 들어가요</li></ul>';
    var gp = (d.photos || []).filter(function (f) { return f.week == null; });
    if (gp.length) h += '<div class="shp" style="margin-top:12px">' + gp.map(function (f) { return pcard(P.pic[f.id] || BLANK, f.caption, f.id, f.id); }).join('') + '</div>';
    var cw = curWeek(d), cb = cw ? bookPics(cw) : '';
    if (cb) h += '<div style="margin-top:12px"><b>' + cw + '회차 교재</b> <span class="muted sm">(가까운 수업 · 아래 \'교재비 고르기\'에서 회차별로 모두 볼 수 있어요)</span>' + cb + '</div>';
    if (d.note) h += '<div class="shwarn">' + nl(d.note) + '</div>';
    h += '</div>';
    if (!d.open) h += '<div class="note">지금은 주문을 받지 않아요. 선생님께 문의해 주세요.</div>';
    else if (!d.bank_ready) h += '<div class="note">입금 계좌를 준비 중이에요. 준비되면 이 화면에서 주문할 수 있어요.</div>';
    /* 월별 교재비 (달 이름을 누르면 목차·주별 금액이 펼쳐져요 · 달 체크 = 그 달의 살 수 있는 주차 전부) */
    var months = [], mmap = {};
    d.weeks.forEach(function (w) { var k = String(w.ds).slice(0, 7); if (!mmap[k]) { mmap[k] = { k: k, ws: [] }; months.push(mmap[k]); } mmap[k].ws.push(w); });
    h += '<div class="card"><h3 style="margin:0 0 4px">1. 교재비 고르기 <span class="muted sm">(월별 · 주당 ' + esc(won(d.price)) + ')</span></h3><div class="muted sm" style="margin-bottom:8px">달을 체크하면 그달 교재를 한꺼번에 사요. <b>달 이름을 누르면</b> 교재 목차와 주별 금액이 펼쳐지고, 원하는 주차만 따로 고를 수도 있어요. 이미 주문했거나 산 주차는 제외돼요.</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:2px"><button class="btn sec sm3" data-sa="all" type="button">살 수 있는 달 모두 선택</button><button class="btn gh sm3" data-sa="none" type="button">선택 해제</button></div>';
    months.forEach(function (m) {
      var can = m.ws.filter(function (w) { return w.active && w.st === 'none' && d.open; }), nsel = can.filter(function (w) { return P.sel[w.week]; }).length,
          paid = m.ws.filter(function (w) { return w.st === 'paid'; }).length, pend = m.ws.filter(function (w) { return w.st === 'pending'; }).length,
          open = !!P.open[m.k], lbl = parseInt(m.k.slice(5), 10) + '월 교재비';
      var stb = paid === m.ws.length ? badge('paid') : pend === m.ws.length ? badge('pending') : (paid || pend) ? '<span class="shb" style="color:#2f7a67;background:#e3f1ea">' + (paid ? '일부 결제' : '일부 대기') + '</span>' : '';
      h += '<div class="shmo"><div class="shmh"><input type="checkbox" data-sa="mpick" data-v="' + esc(m.k) + '"' + (can.length && nsel === can.length ? ' checked' : '') + (can.length ? '' : ' disabled') + ' title="이 달 전체 선택">' +
        '<div class="t" data-sa="mopen" data-v="' + esc(m.k) + '"><b style="font-size:16px">' + esc(lbl) + '</b> ' + stb + '<div class="muted sm">' + m.ws.length + '주 수업 · ' + esc(dstr(m.ws[0].ds)) + (m.ws.length > 1 ? ' ~ ' + esc(dstr(m.ws[m.ws.length - 1].ds)) : '') + (nsel && nsel < can.length ? ' · ' + nsel + '주 선택' : '') + '</div></div>' +
        '<div class="am" data-sa="mopen" data-v="' + esc(m.k) + '"><b>' + esc(won(m.ws.length * d.price)) + '</b><div class="muted sm">' + (open ? '접기 ▲' : '목차 보기 ▼') + '</div></div></div>';
      if (open) m.ws.forEach(function (w) {
        var c1 = w.active && w.st === 'none' && d.open, on = !!P.sel[w.week];
        h += '<label class="shw' + (c1 ? '' : ' off') + '"><input type="checkbox" data-sa="pick" data-v="' + w.week + '"' + (on ? ' checked' : '') + (c1 ? '' : ' disabled') + '>' +
          '<div class="t"><b>' + esc(w.title) + '</b> <span class="muted sm">' + esc(dstr(w.ds)) + ' 수업</span> ' + (w.st === 'paid' ? badge('paid') : w.st === 'pending' ? badge('pending') : '') + (w.active ? '' : ' <span class="shb" style="color:#777;background:#eee">판매 안 함</span>') +
          '<div class="it">' + (w.items || []).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div></div><div style="font-weight:700;white-space:nowrap">' + esc(won(d.price)) + '</div></label>';
        var bp = bookPics(w.week); if (bp) h += '<div style="padding:0 14px 12px">' + bp + '</div>';
      });
      h += '</div>';
    });
    h += '</div>';
    /* 결제 */
    h += '<div class="card"><h3 style="margin:0 0 4px">2. 결제 방법</h3>' +
      '<div class="shpay"><label class="on"><input type="radio" name="shm" checked> 계좌이체</label><label class="dis" title="준비 중이에요"><input type="radio" name="shm" disabled> 카드 결제 <span class="badge">준비 중</span></label></div>' +
      '<div class="fld" style="margin:12px 0 0"><label>입금자명 (입금할 때 찍히는 이름)</label><input type="text" id="shdep" maxlength="20" value="' + esc(P.dep) + '" placeholder="예: 홍길동" autocomplete="off" data-si="dep"></div>' +
      '<div class="muted sm">부모님 이름으로 입금하신다면 그 이름을 적어 주세요. 이름이 맞아야 확인이 빨라요.</div></div>';
    h += '<div class="shbar"><div><span class="muted sm">선택 ' + n + '주</span><br><b>' + esc(won(total)) + '</b></div><button class="btn rose" data-sa="order" type="button"' + (n && d.open && d.bank_ready && !P.busy ? '' : ' disabled') + '>' + (P.busy ? '주문 중…' : '주문하고 입금 안내 받기') + '</button></div>';
    /* 내 주문 */
    h += '<div class="card" style="margin-top:16px"><h3 style="margin:0 0 6px">내 주문 내역 <button class="btn gh sm3" data-sa="reload" type="button" style="float:right">새로고침</button></h3>';
    if (!d.orders.length) h += '<div class="empty">아직 주문이 없어요</div>';
    d.orders.forEach(function (o) {
      h += '<div class="shord"><div class="h"><div><b>' + esc(weeksTxt(o.weeks)) + '</b> · ' + esc(won(o.amount)) + '</div>' + badge(o.status) + '</div>' +
        '<div class="muted sm">' + esc(o.no) + ' · ' + esc(String(o.at || '').replace('T', ' ')) + ' · 입금자명 ' + esc(o.depositor) + (o.paid_at ? ' · 확인 ' + esc(String(o.paid_at).replace('T', ' ')) : '') + '</div>';
      if (o.status === 'pending') h += '<div class="a"><button class="btn sec sm3" data-sa="acct" data-v="' + esc(o.id) + '" type="button">입금 안내 보기</button><button class="btn dng sm3" data-sa="cancel" data-v="' + esc(o.id) + '" type="button">주문 취소</button></div>';
      h += '</div>';
    });
    h += '<div class="shwarn">이미 입금하셨는데 \'입금 대기\'가 오래 가면 선생님께 말씀해 주세요. 입금 전에만 직접 취소할 수 있어요.</div></div>';
    return h;
  }

  /* ── 화면: 원장 ── */
  function vAdmBook(d) {
    var pend = P.list && P.list.orders ? P.list.orders.filter(function (o) { return o.status === 'pending'; }).length : 0;
    var chips = [['orders', '주문 확인' + (pend ? ' (' + pend + ')' : '')], ['board', '구매 현황'], ['set', '설정'], ['photo', '교재 사진']];
    var h = '<div class="chips">' + chips.map(function (c) { return '<button class="chip ' + (P.sub === c[0] ? 'on' : '') + '" data-sa="sub" data-v="' + c[0] + '" type="button">' + esc(c[1]) + '</button>'; }).join('') + '</div>';
    if (!d.bank_ready) h += '<div class="note"><b>입금 계좌가 아직 비어 있어요.</b> [설정]에서 은행·계좌번호·예금주를 넣어야 학생들이 주문할 수 있어요.</div>';
    if (P.sub === 'set') return h + admSet(d);
    if (P.sub === 'photo') return h + admPhoto(d);
    if (!P.list) return h + '<div class="card"><div class="empty">불러오는 중…</div></div>';
    if (P.list.err) return h + '<div class="note">' + esc(P.list.err) + '</div>';
    return h + (P.sub === 'board' ? admBoard(d) : admOrders());
  }
  function admOrders() {
    var os = P.list.orders, flt = P.flt, f = [['pending', '입금 대기'], ['paid', '결제 완료'], ['x', '취소·환불'], ['all', '전체']];
    var show = os.filter(function (o) { return flt === 'all' || (flt === 'x' ? (o.status === 'cancelled' || o.status === 'refunded') : o.status === flt); });
    var h = '<div class="card"><div class="chips" style="padding-bottom:6px">' + f.map(function (c) { return '<button class="chip ' + (flt === c[0] ? 'on' : '') + '" data-sa="flt" data-v="' + c[0] + '" type="button">' + c[1] + ' ' + os.filter(function (o) { return c[0] === 'all' || (c[0] === 'x' ? (o.status === 'cancelled' || o.status === 'refunded') : o.status === c[0]); }).length + '</button>'; }).join('') +
      '<button class="btn gh sm3" data-sa="reload" type="button" style="margin-left:auto;flex:none">새로고침</button></div>';
    if (!show.length) h += '<div class="empty">해당하는 주문이 없어요</div>';
    show.forEach(function (o) { h += lecOrderRow(o); });
    return h + '<div class="shwarn">\'입금 확인\'은 은행 앱에서 입금을 직접 확인한 뒤에만 눌러 주세요. 학생이 스스로 결제 완료로 바꿀 수는 없어요. \'환불 처리\'는 기록만 바꾸고 실제 환불은 은행에서 직접 하세요.</div></div>';
  }
  function admBoard(d) {
    var b = P.list.board || [], ws = d.weeks;
    var h = '<div class="card"><h3 style="margin:0 0 6px">학생 × 주차 구매 현황 <span class="muted sm">(공수내모 반 ' + b.length + '명)</span></h3><div class="muted sm" style="margin-bottom:8px">● 결제 완료 · ○ 입금 대기 · 빈칸 = 주문 없음. 맨 아래 줄이 주차별 인쇄 수량(결제 완료 기준)이에요.</div><div class="shmx"><table><thead><tr><th>이름</th>' +
      ws.map(function (w) { return '<th>' + w.week + '</th>'; }).join('') + '<th>합계</th></tr></thead><tbody>';
    b.forEach(function (s) {
      var tot = (s.paid || []).length;
      h += '<tr><td>' + esc(s.name) + '</td>' + ws.map(function (w) { return '<td>' + ((s.paid || []).indexOf(w.week) >= 0 ? '<b style="color:#2f7a67">●</b>' : (s.pend || []).indexOf(w.week) >= 0 ? '<span style="color:#b57c12">○</span>' : '') + '</td>'; }).join('') + '<td>' + (tot ? '<b>' + tot + '</b>' : '') + '</td></tr>';
    });
    var tp = 0, tq = 0;
    h += '</tbody><tfoot><tr><td>결제 완료</td>' + ws.map(function (w) { var n = b.filter(function (s) { return (s.paid || []).indexOf(w.week) >= 0; }).length; tp += n; return '<td>' + (n || '') + '</td>'; }).join('') + '<td>' + tp + '</td></tr>' +
      '<tr><td>입금 대기</td>' + ws.map(function (w) { var n = b.filter(function (s) { return (s.pend || []).indexOf(w.week) >= 0; }).length; tq += n; return '<td>' + (n || '') + '</td>'; }).join('') + '<td>' + tq + '</td></tr></tfoot></table></div>' +
      '<div class="muted sm" style="margin-top:8px">결제 완료 합계 ' + tp + '주분 · ' + esc(won(tp * d.price)) + ' (현재 가격 기준)</div></div>';
    return h;
  }
  function admSet(d) {
    var c = d.cfg || {};
    return '<div class="card"><h3 style="margin:0 0 4px">설정</h3><div class="muted sm" style="margin-bottom:12px">여기 적은 계좌는 공수내모 반 학생·학부모에게만 보여요. 사이트 코드에는 저장되지 않고 서버에만 있어요.</div>' +
      '<div class="fld"><label>주당 가격 (원)</label><input type="text" inputmode="numeric" id="shs_price" value="' + esc(String(c.price || d.price)) + '"></div>' +
      '<div class="muted sm" style="margin:-6px 0 12px">가격을 바꿔도 이미 접수된 주문은 그때 가격 그대로예요.</div>' +
      '<div class="fld"><label>은행</label><input type="text" id="shs_bank" maxlength="20" value="' + esc(c.bank || '') + '" placeholder="예: 국민은행"></div>' +
      '<div class="fld"><label>계좌번호 (숫자와 - 만)</label><input type="text" id="shs_acct" maxlength="31" value="' + esc(c.acct || '') + '" placeholder="예: 123456-01-123456" inputmode="numeric"></div>' +
      '<div class="fld"><label>예금주</label><input type="text" id="shs_holder" maxlength="20" value="' + esc(c.holder || '') + '"></div>' +
      '<div class="fld"><label>학생에게 보여 줄 안내문 (500자까지)</label><textarea id="shs_note" maxlength="500" style="min-height:90px">' + esc(c.note || '') + '</textarea></div>' +
      '<div class="fld"><label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="shs_open"' + (d.open ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--acc)"> 주문 받기 (끄면 학생이 주문할 수 없어요)</label></div>' +
      '<div class="fld"><label style="display:flex;gap:8px;align-items:center;opacity:.55"><input type="checkbox" disabled style="width:20px;height:20px"> 카드 결제 <span class="badge">준비 중</span></label><div class="muted sm">결제사(카드)를 연결한 뒤에 켤 수 있어요. 서버에는 결제 확인 자리가 이미 만들어져 있어요.</div></div>' +
      '<button class="btn" data-sa="save" type="button"' + (P.busy ? ' disabled' : '') + '>저장</button></div>';
  }
  function admPhoto(d) {
    var ws = d.weeks || [];
    var wopts = '<option value="">공통 (모든 회차에 보여요)</option>' + ws.map(function (w) { return '<option value="' + w.week + '"' + (String(P.upWeek) === String(w.week) ? ' selected' : '') + '>' + w.week + '회차 · ' + esc(dstr(w.ds)) + '</option>'; }).join('');
    var h = '<div class="card"><h3 style="margin:0 0 4px">교재 사진 <span class="muted sm">(' + (d.photos || []).length + '/60장)</span></h3><div class="muted sm" style="margin-bottom:10px">회차마다 <b>기본 교재</b>(해설집 표지 2 · 시험지 2 · 과제 2)는 <b>자동으로</b> 들어가요. 여기에는 그 회차에 <b>추가로 나눠 주는 교재</b>(예: 개념집, 킬러40제)를 올려요. 올린 사진은 공수내모 학생·학부모의 \'교재 구매\' 화면에서 그 회차 칸에 보여요. 사진은 자동으로 작게 줄여서 올려요. 세로 사진이 보기 좋아요.<br><b>사진을 복사(Ctrl+V)해서 이 화면에 그대로 붙여넣거나, 파일을 끌어다 놓아도 올라가요.</b></div>' +
      '<div class="fld"><label>어느 회차 교재인가요?</label><select id="shp_week" class="shsel" data-si="upweek">' + wopts + '</select></div>' +
      '<div class="fld"><label>사진 이름 (비우면 파일 이름이 들어가요 · 여러 장을 한꺼번에 고를 수 있어요)</label><input type="text" id="shp_cap" maxlength="30"></div>' +
      '<input type="file" id="shp_file" accept="image/jpeg,image/png,image/webp" data-si="photo" multiple style="display:none"><button class="btn" data-sa="pickfile" type="button"' + (P.busy ? ' disabled' : '') + '>' + (P.busy ? '올리는 중…' : '사진 고르기 (여러 장 가능)') + '</button></div>';
    var bk = P.base || {}, bks = Object.keys(bk).sort(function (x, y) { return x - y; });
    if (bks.length) h += '<div class="card"><h3 style="margin:0 0 4px">기본 교재 (자동)</h3><div class="muted sm" style="margin-bottom:6px">교재를 만들 때 함께 만들어지는 사진이에요. 시험지는 문제를 흐리게 처리했어요.</div>' +
      bks.map(function (k) { return '<div class="shbl">' + k + '회차</div><div class="shp">' + bk[k].map(function (b) { return pcard(b.f, b.c, b.f, null, b.k); }).join('') + '</div>'; }).join('') + '</div>';
    var ph = (d.photos || []);
    h += '<div class="card"><h3 style="margin:0 0 4px">올려 둔 추가 교재 사진</h3>' + (ph.length ? '' : '<div class="muted sm">아직 없어요</div>');
    ph.forEach(function (f) {
      var o = '<option value="">공통</option>' + ws.map(function (w) { return '<option value="' + w.week + '"' + (f.week === w.week ? ' selected' : '') + '>' + w.week + '회차</option>'; }).join('');
      h += '<div class="shpa"><img data-sp="' + esc(f.id) + '" src="' + (P.pic[f.id] || BLANK) + '" alt=""><div class="t"><b>' + esc(f.caption || '(이름 없음)') + '</b><div style="margin-top:4px"><select class="shsel" data-sa="pweek" data-v="' + esc(f.id) + '" style="width:auto;padding:5px 8px">' + o + '</select></div></div><button class="btn gh sm3" data-sa="pcap" data-v="' + esc(f.id) + '" type="button">이름</button><button class="btn dng sm3" data-sa="pdel" data-v="' + esc(f.id) + '" type="button">지우기</button></div>';
    });
    return h + '</div>';
  }

  /* ════════ MATHY CLASS 강의 신청 (서버: 62_MATHYCLASS_강의신청_서버.sql) ════════
     · MATHY CLASS 반 학생·학부모: 자기 강의 목록에서 회차를 골라 신청 → 계좌이체 → 원장이 입금 확인 → 영상은 원장이 따로 보냄
     · 원장: 학생별로 강의 목록(이름·회수·회당 가격, 기본 125,000원)을 넣고, 입금 확인·'영상 보냄' 체크 */
  var LA = { list: null, at: 0, loading: false, sub: 'students', open: {}, flt: 'pending' };
  var SENT = ['영상 전달 완료', '#2f5fa0', '#e6eefb'], WAIT = ['영상 준비 중', '#7a6a2a', '#f6f0d8'];
  function sentBadge(sent) { var s = sent ? SENT : WAIT; return '<span class="shb" style="color:' + s[1] + ';background:' + s[2] + '">' + s[0] + '</span>'; }
  function lab(i) { return i.title + ' ' + i.no + '회'; }
  function groups(items) { var m = {}, out = []; (items || []).forEach(function (i) { if (!m[i.title]) { m[i.title] = { t: i.title, it: [] }; out.push(m[i.title]); } m[i.title].it.push(i); }); return out; }
  function canBuy(i, d) { return i.st === 'none' && d.open; }

  async function loadLec() {
    if (LA.loading) return; LA.loading = true; var tok = TOKEN;
    var j = await sapi('lec_list'); LA.loading = false; if (tok !== TOKEN) return;
    LA.list = j && j.ok ? j : { err: (j && j.error) || '불러오지 못했어요' }; LA.at = Date.now();
    if (onShop()) render();
  }

  /* ── 학생·학부모 화면 ── */
  function payCard() {
    return '<div class="card"><h3 style="margin:0 0 4px">2. 결제 방법</h3>' +
      '<div class="shpay"><label class="on"><input type="radio" name="shm" checked> 계좌이체</label><label class="dis" title="준비 중이에요"><input type="radio" name="shm" disabled> 카드 결제 <span class="badge">준비 중</span></label></div>' +
      '<div class="fld" style="margin:12px 0 0"><label>입금자명 (입금할 때 찍히는 이름)</label><input type="text" id="shdep" maxlength="20" value="' + esc(P.dep) + '" placeholder="예: 홍길동" autocomplete="off" data-si="dep"></div>' +
      '<div class="muted sm">부모님 이름으로 입금하신다면 그 이름을 적어 주세요. 이름이 맞아야 확인이 빨라요.</div></div>';
  }
  function vMc(d) {
    var h = '', items = d.items || [], n = 0, total = 0;
    if (P.flash) h += acctCard(P.flash, P.flash.fresh ? '신청이 접수됐어요 — 아래 계좌로 입금해 주세요' : '입금 안내');
    items.forEach(function (i) { if (P.sel[i.id] && canBuy(i, d)) { n++; total += i.price; } });
    h += '<div class="card"><h3 style="margin:0 0 4px">MATHY CLASS 강의 신청</h3><div class="muted sm">회차별로 신청해요. 입금을 확인하면 <b>영상은 선생님이 따로 보내 드려요.</b></div>' +
      (d.note ? '<div class="shwarn">' + nl(d.note) + '</div>' : '') + '</div>';
    if (!d.open) h += '<div class="note">지금은 신청을 받지 않아요. 선생님께 문의해 주세요.</div>';
    else if (!d.bank_ready) h += '<div class="note">입금 계좌를 준비 중이에요. 준비되면 이 화면에서 신청할 수 있어요.</div>';
    if (!items.length) h += '<div class="card"><div class="empty">아직 정해진 강의가 없어요.<br>선생님께 문의해 주세요.</div></div>';
    else {
      h += '<div class="card"><h3 style="margin:0 0 4px">1. 회차 고르기</h3><div class="muted sm" style="margin-bottom:8px">신청할 회차에 체크해 주세요. 이미 신청했거나 결제한 회차는 체크할 수 없어요.</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:2px"><button class="btn sec sm3" data-sa="all" type="button">신청할 수 있는 회차 모두 선택</button><button class="btn gh sm3" data-sa="none" type="button">선택 해제</button></div>';
      groups(items).forEach(function (g) {
        var can = g.it.filter(function (i) { return canBuy(i, d); }), ns = can.filter(function (i) { return P.sel[i.id]; }).length;
        h += '<div class="shmo"><div class="shmh"><input type="checkbox" data-sa="lgrp" data-v="' + esc(g.t) + '"' + (can.length && ns === can.length ? ' checked' : '') + (can.length ? '' : ' disabled') + ' title="이 강의 전체 선택">' +
          '<div class="t" style="cursor:default"><b style="font-size:16px">' + esc(g.t) + '</b><div class="muted sm">' + g.it.length + '회 · 회당 ' + esc(won(g.it[0].price)) + (g.it.some(function (i) { return i.price !== g.it[0].price; }) ? ' 외' : '') + '</div></div></div>';
        g.it.forEach(function (i) {
          var c1 = canBuy(i, d);
          h += '<label class="shw' + (c1 ? '' : ' off') + '"><input type="checkbox" data-sa="lpick" data-v="' + esc(i.id) + '"' + (P.sel[i.id] ? ' checked' : '') + (c1 ? '' : ' disabled') + '>' +
            '<div class="t"><b>' + esc(i.no + '회') + '</b> ' + (i.st === 'paid' ? badge('paid') + ' ' + sentBadge(i.sent) : i.st === 'pending' ? badge('pending') : '') + '</div><div style="font-weight:700;white-space:nowrap">' + esc(won(i.price)) + '</div></label>';
        });
        h += '</div>';
      });
      h += '</div>' + payCard() +
        '<div class="shbar"><div><span class="muted sm">선택 ' + n + '회</span><br><b>' + esc(won(total)) + '</b></div><button class="btn rose" data-sa="order" type="button"' + (n && d.open && d.bank_ready && !P.busy ? '' : ' disabled') + '>' + (P.busy ? '신청 중…' : '신청하고 입금 안내 받기') + '</button></div>';
    }
    h += '<div class="card" style="margin-top:16px"><h3 style="margin:0 0 6px">내 신청 내역 <button class="btn gh sm3" data-sa="reload" type="button" style="float:right">새로고침</button></h3>';
    if (!(d.orders || []).length) h += '<div class="empty">아직 신청한 내역이 없어요</div>';
    (d.orders || []).forEach(function (o) {
      h += '<div class="shord"><div class="h"><div><b>' + esc((o.items || []).join(', ')) + '</b> · ' + esc(won(o.amount)) + '</div>' + badge(o.status) + '</div>' +
        '<div class="muted sm">' + esc(o.no) + ' · ' + esc(String(o.at || '').replace('T', ' ')) + ' · 입금자명 ' + esc(o.depositor) + (o.paid_at ? ' · 확인 ' + esc(String(o.paid_at).replace('T', ' ')) : '') + '</div>';
      if (o.status === 'pending') h += '<div class="a"><button class="btn sec sm3" data-sa="acct" data-v="' + esc(o.id) + '" type="button">입금 안내 보기</button><button class="btn dng sm3" data-sa="cancel" data-v="' + esc(o.id) + '" type="button">신청 취소</button></div>';
      h += '</div>';
    });
    return h + '<div class="shwarn">입금 확인 뒤 영상은 선생님이 따로 보내 드려요. 입금 전에만 직접 취소할 수 있고, 이미 입금하셨다면 선생님께 말씀해 주세요.</div></div>';
  }
  async function doLecOrder() {
    var d = P.d, ids = Object.keys(P.sel).filter(function (id) { return (d.items || []).some(function (i) { return i.id === id && canBuy(i, d); }); });
    var dep = (document.getElementById('shdep') || {}).value || P.dep; P.dep = dep;
    if (!ids.length) { toast('회차를 골라 주세요'); return; }
    if (!dep || dep.trim().length < 2) { toast('입금자명을 적어 주세요'); return; }
    var sel = (d.items || []).filter(function (i) { return ids.indexOf(i.id) >= 0; }), tot = sel.reduce(function (s, i) { return s + i.price; }, 0);
    if (!confirm(sel.map(lab).join('\n') + '\n\n합계 ' + won(tot) + '\n입금자명: ' + dep.trim() + '\n\n이대로 신청할까요?')) return;
    P.busy = true; render();
    var j = await sapi('lec_order', { ids: ids, depositor: dep.trim(), method: 'bank' });
    P.busy = false;
    if (!j || !j.ok) { toast((j && j.error) || '신청하지 못했어요'); await load(true); return; }
    P.flash = { no: j.no, amount: j.amount, items: j.items, depositor: j.depositor, bank: j.bank, fresh: true }; P.sel = {};
    await load(true); window.scrollTo(0, 0);
  }

  /* ── 원장 화면 ── */
  function areaChips() {
    return '';
    return '<div class="chips"><button class="chip ' + (P.area !== 'lec' ? 'on' : '') + '" data-sa="area" data-v="book" type="button">📘 교재 (공수내모)</button><button class="chip ' + (P.area === 'lec' ? 'on' : '') + '" data-sa="area" data-v="lec" type="button">🎓 MATHY CLASS 강의</button></div>';
  }
  function vLecAdm(d) {
    var L = LA.list, pend = L && L.orders ? L.orders.filter(function (o) { return o.status === 'pending'; }).length : 0;
    var chips = [['students', '학생별 강의'], ['orders', '주문 확인' + (pend ? ' (' + pend + ')' : '')], ['set', '설정']];
    var h = '<div class="chips">' + chips.map(function (c) { return '<button class="chip ' + (LA.sub === c[0] ? 'on' : '') + '" data-sa="lsub" data-v="' + c[0] + '" type="button">' + esc(c[1]) + '</button>'; }).join('') + '</div>';
    if (!d.bank_ready) h += '<div class="note"><b>입금 계좌가 아직 비어 있어요.</b> 분당미래탐구 화면의 [교재 주문 → 설정]에서 은행·계좌번호·예금주를 넣으면 강의 신청에도 같은 계좌가 쓰여요.</div>';
    if (!L) return h + '<div class="card"><div class="empty">불러오는 중…</div></div>';
    if (L.err) return h + '<div class="note">' + esc(L.err) + '</div>';
    return h + (LA.sub === 'orders' ? lecOrders(L) : LA.sub === 'set' ? lecSet(L) : lecStudents(L));
  }
  function lecBody(s, L) {
    var h = '';
        groups(s.items).forEach(function (g) {
          h += '<div style="padding:8px 14px 2px"><b>' + esc(g.t) + '</b></div>';
          g.it.forEach(function (i) {
            h += '<div class="shpa" style="padding:6px 14px"><div class="t">' + esc(i.no + '회') + ' · <a href="#" data-sa="lprice" data-v="' + esc(i.id) + '" data-p="' + i.price + '" style="color:inherit;text-decoration:underline dotted">' + esc(won(i.price)) + '</a> ' +
              (i.st === 'none' ? '' : badge(i.st)) + '</div>' +
              (i.st === 'paid' ? '<label style="cursor:pointer;white-space:nowrap"><input type="checkbox" data-sa="lsent1" data-v="' + esc(i.id) + '"' + (i.sent ? ' checked' : '') + ' style="accent-color:var(--acc);width:18px;height:18px;vertical-align:-3px"> 영상 보냄</label>' : '') +
              (i.st === 'none' ? '<button class="btn dng sm3" data-sa="ldel" data-v="' + esc(i.id) + '" type="button">지우기</button>' : '') + '</div>';
          });
        });
        h += '<div style="padding:12px 14px 14px;border-top:1px dashed var(--line);margin-top:6px"><b class="sm">강의 추가</b><div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-top:6px">' +
          '<input type="text" id="lat_' + esc(s.sid) + '" maxlength="40" placeholder="강의 이름 (예: 공통수학1 다항식)" class="shin"><input type="text" inputmode="numeric" id="lac_' + esc(s.sid) + '" placeholder="몇 회 (예: 8)" class="shin"></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-top:8px"><input type="text" inputmode="numeric" id="las_' + esc(s.sid) + '" placeholder="첫 회차 (기본 1)" class="shin"><input type="text" inputmode="numeric" id="lap_' + esc(s.sid) + '" placeholder="회당 가격 (기본 ' + esc(String(L.cfg.price)) + ')" class="shin"><button class="btn sm3" data-sa="ladd" data-v="' + esc(s.sid) + '" type="button">추가</button></div></div>';
    return h;
  }
  function lecStudents(L) {
    var h = '', send = [];
    (L.students || []).forEach(function (s) { var x = s.items.filter(function (i) { return i.st === 'paid' && !i.sent; }); if (x.length) send.push({ s: s, x: x }); });
    h += '<div class="card"><h3 style="margin:0 0 6px">영상 보낼 것 <span class="badge">' + send.reduce(function (n, z) { return n + z.x.length; }, 0) + '건</span></h3>';
    if (!send.length) h += '<div class="empty" style="padding:12px">결제 완료됐는데 아직 안 보낸 영상이 없어요</div>';
    send.forEach(function (z) {
      h += '<div class="shord"><div class="h"><b>' + esc(z.s.name) + '</b><button class="btn sm3" data-sa="lsentall" data-v="' + esc(z.x.map(function (i) { return i.id; }).join(',')) + '" type="button">모두 보냈어요</button></div><div class="muted sm">' + z.x.map(function (i) { return esc(lab(i)); }).join(' · ') + '</div></div>';
    });
    h += '</div>';
    if (!(L.students || []).length) return h + '<div class="note">MATHY CLASS 반에 학생이 없어요. 관리 화면에서 <b>MATHY CLASS</b> 반을 만들고 학생을 등록하면 여기에 나타나요.</div>';
    (L.students || []).forEach(function (s) {
      var np = s.items.filter(function (i) { return i.st === 'pending'; }).length, ng = s.items.filter(function (i) { return i.st === 'paid'; }).length, open = !!LA.open[s.sid];
      h += '<div class="shmo"><div class="shmh" data-sa="lopen" data-v="' + esc(s.sid) + '" style="cursor:pointer"><div class="t"><b style="font-size:16px">' + esc(s.name) + '</b> <span class="muted sm">' + esc(s.school || '') + '</span>' +
        '<div class="muted sm">강의 ' + s.items.length + '회 · 결제 완료 ' + ng + (np ? ' · 입금 대기 ' + np : '') + '</div></div><div class="am"><span class="muted sm">' + (open ? '접기 ▲' : '관리 ▼') + '</span></div></div>';
      if (open) h += lecBody(s, L);
      h += '</div>';
    });
    return h + '<div class="shwarn">회당 가격 숫자를 누르면 고칠 수 있어요(아직 신청 안 된 회차만). 결제 완료된 회차를 영상 보낸 뒤 체크해 두면 \'보낼 것\' 목록에서 빠져요.</div>';
  }
  function lecOrderRow(o) {
    var h = '';
      h += '<div class="shord"><div class="h"><div><b>' + esc(o.name) + '</b> <span class="muted sm">' + esc(o.school || '') + (o.by === 'parent' ? ' · 학부모 주문' : '') + '</span></div>' + badge(o.status) + '</div>' +
        '<div style="margin-top:2px"><b>' + esc(weeksTxt(o.weeks)) + '</b> · <b>' + esc(won(o.amount)) + '</b> · 입금자명 <b style="background:#fff3b0;padding:0 5px;border-radius:6px">' + esc(o.depositor) + '</b></div>' +
        '<div class="muted sm">' + esc(o.no) + ' · 주문 ' + esc(String(o.at || '').replace('T', ' ')) + (o.paid_at ? ' · 확인 ' + esc(String(o.paid_at).replace('T', ' ')) : '') + '</div>';
      var a = '';
      if (o.status === 'pending') a = '<button class="btn sm3" data-sa="st" data-v="' + esc(o.id) + '" data-to="paid" type="button">입금 확인</button><button class="btn dng sm3" data-sa="st" data-v="' + esc(o.id) + '" data-to="cancelled" type="button">취소</button>';
      else if (o.status === 'paid') a = '<button class="btn gh sm3" data-sa="st" data-v="' + esc(o.id) + '" data-to="refunded" type="button">환불 처리</button><button class="btn gh sm3" data-sa="st" data-v="' + esc(o.id) + '" data-to="pending" type="button">입금 대기로 되돌리기</button>';
      else if (o.status === 'cancelled') a = '<button class="btn gh sm3" data-sa="st" data-v="' + esc(o.id) + '" data-to="pending" type="button">되살리기</button>';
      if (a) h += '<div class="a">' + a + '</div>';
      if (o.hist && o.hist.length > 1) h += '<div class="muted sm" style="margin-top:6px">' + o.hist.map(function (x) { return esc(String(x.at || '').slice(5).replace('T', ' ')) + ' ' + esc(x.by) + ' → ' + esc((ST[x.to] || [x.to])[0]) + (x.memo ? ' (' + esc(x.memo) + ')' : ''); }).join(' · ') + '</div>';
      h += '</div>';
    return h;
  }
  function lecOrders(L) {
    var os = L.orders, flt = LA.flt, f = [['pending', '입금 대기'], ['paid', '결제 완료'], ['x', '취소·환불'], ['all', '전체']];
    var m = function (o, k) { return k === 'all' || (k === 'x' ? (o.status === 'cancelled' || o.status === 'refunded') : o.status === k); };
    var h = '<div class="card"><div class="chips" style="padding-bottom:6px">' + f.map(function (c) { return '<button class="chip ' + (flt === c[0] ? 'on' : '') + '" data-sa="lflt" data-v="' + c[0] + '" type="button">' + c[1] + ' ' + os.filter(function (o) { return m(o, c[0]); }).length + '</button>'; }).join('') +
      '<button class="btn gh sm3" data-sa="reload" type="button" style="margin-left:auto;flex:none">새로고침</button></div>';
    var show = os.filter(function (o) { return m(o, flt); });
    if (!show.length) h += '<div class="empty">해당하는 주문이 없어요</div>';
    show.forEach(function (o) {
      h += '<div class="shord"><div class="h"><div><b>' + esc(o.name) + '</b> <span class="muted sm">' + esc(o.school || '') + (o.by === 'parent' ? ' · 학부모 신청' : '') + '</span></div>' + badge(o.status) + '</div>' +
        '<div style="margin-top:2px"><b>' + esc((o.items || []).join(', ')) + '</b></div><div><b>' + esc(won(o.amount)) + '</b> · 입금자명 <b style="background:#fff3b0;padding:0 5px;border-radius:6px">' + esc(o.depositor) + '</b></div>' +
        '<div class="muted sm">' + esc(o.no) + ' · 신청 ' + esc(String(o.at || '').replace('T', ' ')) + (o.paid_at ? ' · 확인 ' + esc(String(o.paid_at).replace('T', ' ')) : '') + '</div>';
      var a = '', id = esc(o.id);
      if (o.status === 'pending') a = '<button class="btn sm3" data-sa="lst" data-v="' + id + '" data-to="paid" type="button">입금 확인</button><button class="btn dng sm3" data-sa="lst" data-v="' + id + '" data-to="cancelled" type="button">취소</button>';
      else if (o.status === 'paid') a = '<button class="btn gh sm3" data-sa="lst" data-v="' + id + '" data-to="refunded" type="button">환불 처리</button><button class="btn gh sm3" data-sa="lst" data-v="' + id + '" data-to="pending" type="button">입금 대기로 되돌리기</button>';
      else if (o.status === 'cancelled') a = '<button class="btn gh sm3" data-sa="lst" data-v="' + id + '" data-to="pending" type="button">되살리기</button>';
      if (a) h += '<div class="a">' + a + '</div>';
      if (o.hist && o.hist.length > 1) h += '<div class="muted sm" style="margin-top:6px">' + o.hist.map(function (x) { return esc(String(x.at || '').slice(5).replace('T', ' ')) + ' ' + esc(x.by) + ' → ' + esc((ST[x.to] || [x.to])[0]) + (x.memo ? ' (' + esc(x.memo) + ')' : ''); }).join(' · ') + '</div>';
      h += '</div>';
    });
    return h + '<div class="shwarn">\'입금 확인\'은 은행 앱에서 입금을 직접 확인한 뒤에만 눌러 주세요. \'환불 처리\'는 기록만 바꾸고(회차가 다시 신청 가능해지고 \'영상 보냄\'은 초기화돼요) 실제 환불은 은행에서 하세요.</div></div>';
  }
  function lecSet(L) {
    var c = L.cfg || {};
    return '<div class="card"><h3 style="margin:0 0 4px">MATHY CLASS 설정</h3><div class="muted sm" style="margin-bottom:12px">입금 계좌는 교재 구매와 같은 계좌를 써요(분당미래탐구 화면의 [교재 주문 → 설정]에서 바꿔요).</div>' +
      '<div class="fld"><label>회당 기본 가격 (원) — 앞으로 추가하는 강의의 기본값</label><input type="text" inputmode="numeric" id="lcs_price" value="' + esc(String(c.price || 125000)) + '"></div>' +
      '<div class="fld"><label>학생에게 보여 줄 안내문 (환불 기준 등, 500자까지)</label><textarea id="lcs_note" maxlength="500" style="min-height:110px">' + esc(c.note || '') + '</textarea></div>' +
      '<div class="fld"><label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="lcs_open"' + (c.open === false ? '' : ' checked') + ' style="width:20px;height:20px;accent-color:var(--acc)"> 신청 받기 (끄면 학생이 신청할 수 없어요)</label></div>' +
      '<button class="btn" data-sa="lsave" type="button">저장</button></div>';
  }
  window.shopEnsureLec = function () {
    if (!kind()) return;
    if (P.tok !== TOKEN && !P.loading) { P.d = null; LA.list = null; P.pic = {}; P.sel = {}; P.flash = null; P.dep = ''; load(); return; }
    if (!P.d && !P.loading) load();
    if (!LA.list && !LA.loading) loadLec(); else if (LA.list && Date.now() - LA.at > 30000 && !LA.loading) loadLec();
  };
  window.mcLecEmbed = function (sid) {
    if (kind() !== 'adm') return '';
    var L = LA.list; if (!L) return '<div class="card"><div class="empty">불러오는 중…</div></div>'; if (L.err) return '<div class="note">' + esc(L.err) + '</div>';
    var s = (L.students || []).filter(function (x) { return x.sid === sid; })[0]; if (!s) return '<div class="note">이 수강생의 강의 목록을 찾지 못했어요. 새로고침해 주세요.</div>';
    var h = '', d = P.d || {}, send = s.items.filter(function (i) { return i.st === 'paid' && !i.sent; });
    if (d.bank_ready === false) h += '<div class="note"><b>입금 계좌가 아직 비어 있어요.</b> 분당미래탐구 화면의 [교재 주문 → 설정]에서 은행·계좌번호·예금주를 넣어야 수강생이 신청할 수 있어요.</div>';
    if (send.length) h += '<div class="card"><h3 style="margin:0 0 6px">영상 보낼 것 <span class="badge">' + send.length + '건</span></h3><div class="muted sm">' + send.map(function (i) { return esc(lab(i)); }).join(' · ') + '</div><div style="margin-top:8px"><button class="btn sm3" data-sa="lsentall" data-v="' + esc(send.map(function (i) { return i.id; }).join(',')) + '" type="button">모두 보냈어요</button></div></div>';
    h += '<div class="shmo" style="background:var(--card)"><div class="shmh"><div class="t" style="cursor:default"><b style="font-size:16px">강의 목록</b><div class="muted sm">강의 ' + s.items.length + '회 · 결제 완료 ' + s.items.filter(function (i) { return i.st === 'paid'; }).length + '</div></div></div>' +
      (s.items.length ? '' : '<div class="empty" style="padding:16px">아직 강의가 없어요. 아래에서 추가해 주세요.</div>') + lecBody(s, L) + '</div>';
    var os = (L.orders || []).filter(function (o) { return o.sid === s.sid; });
    h += '<div class="card" style="margin-top:12px"><h3 style="margin:0 0 6px">신청 · 입금 내역</h3>' + (os.length ? os.map(lecOrderRow).join('') : '<div class="empty" style="padding:14px">아직 신청이 없어요</div>') + '</div>';
    return h + '<div class="shwarn">회당 가격 숫자를 누르면 고칠 수 있어요(아직 신청 안 된 회차만). \'입금 확인\'은 은행 앱에서 입금을 직접 확인한 뒤에만 눌러 주세요.</div>';
  };
  async function lecAfter(msg) { if (msg) toast(msg); await loadLec(); load(true); }

  /* 클릭: 이 함수가 처리했으면 true */
  async function lecClick(a, v, t) {
    var k = kind(), j;
    if (a === 'area') { P.area = v; render(0); return true; }
    if (a === 'lsub') { LA.sub = v; render(0); return true; }
    if (a === 'lflt') { LA.flt = v; render(); return true; }
    if (a === 'lopen') { LA.open[v] = !LA.open[v]; render(); return true; }
    if (a === 'lpick' || a === 'lgrp') return true;                         // 체크박스는 change 에서
    if (a === 'reload' && k === 'adm' && P.area === 'lec') { LA.at = 0; await load(); loadLec(); return true; }
    if (k === 'mc') {
      if (a === 'all') { P.sel = {}; ((P.d && P.d.items) || []).forEach(function (i) { if (canBuy(i, P.d)) P.sel[i.id] = 1; }); render(); return true; }
      if (a === 'none') { P.sel = {}; render(); return true; }
      if (a === 'order') { doLecOrder(); return true; }
      if (a === 'reload') { await load(); return true; }
      if (a === 'acct') { var o = (P.d.orders || []).filter(function (x) { return x.id === v; })[0]; if (o) { P.flash = { no: o.no, amount: o.amount, items: o.items, depositor: o.depositor, bank: P.d.bank }; render(0); } return true; }
      if (a === 'cancel') {
        if (!confirm('이 신청을 취소할까요?\n(이미 입금하셨다면 취소하지 말고 선생님께 말씀해 주세요)')) return true;
        j = await sapi('lec_cancel', { id: v }); if (!j || !j.ok) { toast((j && j.error) || '취소하지 못했어요'); return true; }
        toast('취소했어요'); P.flash = null; load(true); return true;
      }
      return false;
    }
    if (k !== 'adm') return false;
    if (a === 'lst') {
      var od = ((LA.list && LA.list.orders) || []).filter(function (x) { return x.id === v; })[0]; if (!od) return true; var to = t.dataset.to;
      var msg = { paid: od.name + ' · ' + (od.items || []).join(', ') + ' · ' + won(od.amount) + '\n입금자명 ' + od.depositor + '\n\n은행에서 이 입금을 확인했나요? (결제 완료로 바꿔요)', cancelled: '이 주문을 취소할까요?', refunded: '환불 처리로 표시할까요?\n(실제 환불은 은행에서 따로 하셔야 해요)', pending: '입금 대기로 되돌릴까요?' }[to];
      if (!confirm(msg)) return true;
      j = await sapi('lec_status', { id: v, to: to }); if (!j || !j.ok) { toast((j && j.error) || '바꾸지 못했어요'); return true; }
      lecAfter('바꿨어요'); return true;
    }
    if (a === 'lsentall') { j = await sapi('lec_sent', { ids: String(v).split(','), on: true }); if (!j || !j.ok) { toast((j && j.error) || '체크하지 못했어요'); return true; } lecAfter('체크했어요'); return true; }
    if (a === 'lprice') { if (t.tagName === 'A') { /* 링크 기본 동작 막기는 상위에서 */ } var np = prompt('회당 가격 (원)', t.dataset.p); if (np == null) return true; j = await sapi('lec_price', { id: v, price: parseInt(String(np).replace(/[^0-9]/g, ''), 10) || 0 }); if (!j || !j.ok) { toast((j && j.error) || '바꾸지 못했어요'); return true; } lecAfter('바꿨어요'); return true; }
    if (a === 'ldel') { if (!confirm('이 회차를 목록에서 지울까요?')) return true; j = await sapi('lec_del', { id: v }); if (!j || !j.ok) { toast((j && j.error) || '지우지 못했어요'); return true; } lecAfter('지웠어요'); return true; }
    if (a === 'ladd') {
      var g = function (p) { var e = document.getElementById(p + v); return e ? e.value.trim() : ''; }, num = function (x) { return parseInt(String(x).replace(/[^0-9]/g, ''), 10); };
      var args = { sid: v, title: g('lat_'), count: num(g('lac_')) || 0 }; if (g('las_')) args.start = num(g('las_')); if (g('lap_')) args.price = num(g('lap_'));
      if (!args.title) { toast('강의 이름을 적어 주세요'); return true; } if (!args.count) { toast('몇 회인지 적어 주세요'); return true; }
      j = await sapi('lec_add', args); if (!j || !j.ok) { toast((j && j.error) || '추가하지 못했어요'); return true; }
      lecAfter(j.added ? j.added + '회를 추가했어요' : '이미 있는 회차예요'); return true;
    }
    if (a === 'lsave') {
      var pr = parseInt(String((document.getElementById('lcs_price') || {}).value || '').replace(/[^0-9]/g, ''), 10);
      if (!pr) { toast('회당 가격을 적어 주세요'); return true; }
      j = await sapi('lec_set', { price: pr, note: (document.getElementById('lcs_note') || {}).value || '', open: !!(document.getElementById('lcs_open') || {}).checked });
      if (!j || !j.ok) { toast((j && j.error) || '저장하지 못했어요'); return true; }
      lecAfter('저장했어요'); return true;
    }
    return false;
  }
  /* 체크박스 바뀜 */
  async function lecChange(t) {
    var a = t.dataset.sa, k = kind();
    if (a === 'lpick' && k === 'mc') { if (t.checked) P.sel[t.dataset.v] = 1; else delete P.sel[t.dataset.v]; render(); return true; }
    if (a === 'lgrp' && k === 'mc') { var ti = t.dataset.v; ((P.d && P.d.items) || []).forEach(function (i) { if (i.title === ti && canBuy(i, P.d)) { if (t.checked) P.sel[i.id] = 1; else delete P.sel[i.id]; } }); render(); return true; }
    if (a === 'lsent1' && k === 'adm') {
      var j = await sapi('lec_sent', { ids: [t.dataset.v], on: !!t.checked }); if (!j || !j.ok) { toast((j && j.error) || '체크하지 못했어요'); t.checked = !t.checked; return true; }
      lecAfter(); return true;
    }
    return false;
  }

  function vAdm(d) { P.area = S.mc ? 'lec' : 'book'; return (S.mc ? vLecAdm(d) : vAdmBook(d)); }

  window.vShop = function () {
    var k = kind();
    if (!k) return '<div class="card"><div class="empty">이 화면은 분당미래탐구 공수내모·MATHY CLASS 반에서 쓰는 화면이에요.</div></div>';
    if (P.tok !== TOKEN || (!P.d && !P.err)) return '<div class="card"><div class="empty">불러오는 중…</div></div>';
    if (P.err) return '<div class="note">' + esc(P.err) + '</div><button class="btn gh" data-sa="reload" type="button">다시 불러오기</button>';
    var d = P.d; if (!d || !d.access) return '<div class="card"><div class="empty">이 반 학생·학부모만 볼 수 있어요.</div></div>';
    return k === 'adm' ? vAdm(d) : k === 'mc' ? vMc(d) : vStu(d);
  };

  /* ── 동작 ── */
  async function doOrder() {
    var d = P.d, ws = Object.keys(P.sel).map(Number).sort(function (a, b) { return a - b; });
    var dep = (document.getElementById('shdep') || {}).value || P.dep; P.dep = dep;
    if (!ws.length) { toast('주차를 골라 주세요'); return; }
    if (!dep || dep.trim().length < 2) { toast('입금자명을 적어 주세요'); return; }
    if (!confirm(weeksTxt(ws) + ' · ' + won(ws.length * d.price) + '\n입금자명: ' + dep.trim() + '\n\n이대로 주문할까요?')) return;
    P.busy = true; render();
    var j = await sapi('order', { weeks: ws, depositor: dep.trim(), method: 'bank' });
    P.busy = false;
    if (!j || !j.ok) { toast((j && j.error) || '주문하지 못했어요'); render(); return; }
    P.flash = { no: j.no, amount: j.amount, weeks: j.weeks, depositor: j.depositor, bank: j.bank, fresh: true }; P.sel = {};
    await load(true); window.scrollTo(0, 0);
  }
  async function doStatus(id, to) {
    var o = (P.list.orders || []).filter(function (x) { return x.id === id; })[0]; if (!o) return;
    var msg = { paid: o.name + ' · ' + weeksTxt(o.weeks) + ' · ' + won(o.amount) + '\n입금자명 ' + o.depositor + '\n\n은행에서 이 입금을 확인했나요? (결제 완료로 바꿔요)', cancelled: '이 주문을 취소할까요?', refunded: '환불 처리로 표시할까요?\n(실제 환불은 은행에서 따로 하셔야 해요)', pending: '입금 대기로 되돌릴까요?' }[to];
    if (!confirm(msg)) return;
    var j = await sapi('status', { id: id, to: to });
    if (!j || !j.ok) { toast((j && j.error) || '바꾸지 못했어요'); return; }
    toast('바꿨어요'); await loadList(); load(true);
  }
  async function doSave() {
    var v = function (i) { var e = document.getElementById(i); return e ? e.value : ''; };
    var price = parseInt(String(v('shs_price')).replace(/[^0-9]/g, ''), 10);
    if (!price) { toast('주당 가격을 적어 주세요'); return; }
    var args = { price: price, bank: v('shs_bank'), acct: v('shs_acct'), holder: v('shs_holder'), note: v('shs_note'), open: !!(document.getElementById('shs_open') || {}).checked };   // 화면을 다시 그리기 전에 먼저 읽어 둬요
    var btn = document.querySelector('[data-sa="save"]'); if (btn) btn.disabled = true;          // 칸에 적은 글이 지워지지 않게 화면은 그대로 두고 버튼만 잠가요
    var j = await sapi('set', args);
    if (btn) btn.disabled = false;
    if (!j || !j.ok) { toast((j && j.error) || '저장하지 못했어요'); return; }
    toast('저장했어요'); await load(true);
  }
  function resize(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = rej;
      fr.onload = function () {
        var im = new Image(); im.onerror = rej;
        im.onload = function () {
          var q = 0.82, mx = 1100, out = '';
          for (var t = 0; t < 4; t++) {
            var k = Math.min(1, mx / Math.max(im.width, im.height)), w = Math.round(im.width * k), h = Math.round(im.height * k);
            var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
            out = c.toDataURL('image/jpeg', q); if (out.length < 1300000) break; q -= 0.12; mx -= 200;
          }
          res(out);
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  async function doPhoto(files) {
    files = [].slice.call(files || []); if (!files.length) return;
    var bad = files.filter(function (f) { return !/^image\/(jpeg|png|webp)$/.test(f.type); });
    if (bad.length) { toast('jpg·png·webp 사진만 올릴 수 있어요'); return; }
    var capEl = document.getElementById('shp_cap'), cap0 = (capEl || {}).value || '', wk = P.upWeek ? Number(P.upWeek) : null;
    P.busy = true; render(); var okn = 0, err = '';
    for (var i = 0; i < files.length; i++) {
      var file = files[i], fn0 = String(file.name || ''), pasted = !fn0 || /^image(\s*\(\d+\))?\.(png|jpe?g|webp)$/i.test(fn0), cap = (cap0 && (files.length === 1 || pasted)) ? cap0 : (pasted ? '교재 사진' : fn0.replace(/\.[^.]+$/, '').slice(0, 30));
      var src = ''; try { src = await resize(file); } catch (e) { err = '사진을 읽지 못했어요'; break; }
      var args = { src: src, caption: cap }; if (wk) args.week = wk;
      var j = await sapi('photo_add', args);
      if (!j || !j.ok) { err = (j && j.error) || '올리지 못했어요'; if (/photo_add|알 수 없는|server|서버/.test(err) && !okn) err += ' (78_교재사진_회차별_서버.sql 실행이 필요할 수 있어요)'; break; }
      okn++;
    }
    P.busy = false; if (err) toast((okn ? okn + '장 올렸고, ' : '') + err); else toast(okn + '장 올렸어요'); await load(true);
  }

  document.addEventListener('click', async function (e) {
    var t = e.target.closest && e.target.closest('[data-sa]'); if (!t || !kind()) return;
    var a = t.dataset.sa, v = t.dataset.v;
    if (a === 'lprice' || a === 'ldel') e.preventDefault();
    if (await lecClick(a, v, t)) return;
    if (a === 'pick' || a === 'mpick') return;                                        // 체크박스는 change 에서
    if (a === 'copy') { copy(v); return; }
    if (a === 'mopen') { P.open[v] = !P.open[v]; render(); return; }
    if (a === 'flashx') { P.flash = null; render(0); return; }
    if (a === 'all') { P.sel = {}; (P.d.weeks || []).forEach(function (w) { if (w.active && w.st === 'none' && P.d.open) P.sel[w.week] = 1; }); render(); return; }
    if (a === 'none') { P.sel = {}; render(); return; }
    if (a === 'order') { doOrder(); return; }
    if (a === 'reload') { P.pic = {}; P.listAt = 0; await load(); if (kind() === 'adm') loadList(); return; }
    if (a === 'acct') { var o = (P.d.orders || []).filter(function (x) { return x.id === v; })[0]; if (o) { P.flash = { no: o.no, amount: o.amount, weeks: o.weeks, depositor: o.depositor, bank: P.d.bank }; render(0); } return; }
    if (a === 'cancel') {
      if (!confirm('이 주문을 취소할까요?\n(이미 입금하셨다면 취소하지 말고 선생님께 말씀해 주세요)')) return;
      var j = await sapi('cancel', { id: v }); if (!j || !j.ok) { toast((j && j.error) || '취소하지 못했어요'); return; }
      toast('취소했어요'); if (P.flash) P.flash = null; load(true); return;
    }
    if (a === 'zoom') { var s = P.pic[v] || (/^books\//.test(v) ? v : ''); if (s && s !== BLANK) { openModal('<div style="text-align:center"><img src="' + esc(s) + '" alt="" style="max-width:100%;max-height:78vh;border-radius:12px"></div><div style="text-align:center;margin-top:10px"><button class="btn gh" onclick="closeModal()" type="button">닫기</button></div>'); } return; }
    if (a === 'sub') { P.sub = v; render(0); return; }
    if (a === 'flt') { P.flt = v; render(); return; }
    if (a === 'st') { doStatus(v, t.dataset.to); return; }
    if (a === 'save') { doSave(); return; }
    if (a === 'pickfile') { var f = document.getElementById('shp_file'); if (f) f.click(); return; }
    if (a === 'pdel') { if (!confirm('이 사진을 지울까요?')) return; var j2 = await sapi('photo_del', { id: v }); if (!j2 || !j2.ok) { toast((j2 && j2.error) || '지우지 못했어요'); return; } toast('지웠어요'); load(true); return; }
    if (a === 'pcap') { var cur = ((P.d.photos || []).filter(function (x) { return x.id === v; })[0] || {}).caption || ''; var nc = prompt('사진 이름 (30자까지)', cur); if (nc == null) return; var j3 = await sapi('photo_cap', { id: v, caption: nc }); if (!j3 || !j3.ok) { toast((j3 && j3.error) || '바꾸지 못했어요'); return; } load(true); return; }
  });
  document.addEventListener('change', async function (e) {
    var t = e.target; if (!t || !t.dataset || !kind()) return;
    if (await lecChange(t)) return;
    if (t.dataset.sa === 'mpick') { var mk = t.dataset.v; (P.d.weeks || []).forEach(function (w) { if (String(w.ds).slice(0, 7) === mk && w.active && w.st === 'none' && P.d.open) { if (t.checked) P.sel[w.week] = 1; else delete P.sel[w.week]; } }); render(); return; }
    if (t.dataset.sa === 'pick') { var w = t.dataset.v; if (t.checked) P.sel[w] = 1; else delete P.sel[w]; render(); return; }
    if (t.dataset.si === 'upweek') { P.upWeek = t.value; return; }
    if (t.dataset.sa === 'pweek') { var jw = await sapi('photo_week', { id: t.dataset.v, week: t.value }); if (!jw || !jw.ok) { toast((jw && jw.error) || '바꾸지 못했어요'); } else toast('회차를 바꿨어요'); load(true); return; }
    if (t.dataset.si === 'photo') { var fl = t.files ? [].slice.call(t.files) : []; t.value = ''; doPhoto(fl); }
  });
  document.addEventListener('input', function (e) { var t = e.target; if (t && t.dataset && t.dataset.si === 'dep') P.dep = t.value; });
  /* 교재 사진 탭: Ctrl+V 붙여넣기 · 끌어다 놓기로도 올리기 (회차는 위에서 고른 값이 적용돼요) */
  var IMG_RE = /^image\/(jpeg|png|webp)$/;
  function photoTabOn() { try { return S.tab === 'shop' && kind() === 'adm' && P.area !== 'lec' && P.sub === 'photo' && !P.busy; } catch (e) { return false; } }
  function imgFiles(dt) {
    var out = []; if (!dt) return out;
    [].slice.call(dt.files || []).forEach(function (f) { if (IMG_RE.test(f.type)) out.push(f); });
    if (!out.length) [].slice.call(dt.items || []).forEach(function (it) { if (it.kind === 'file' && IMG_RE.test(it.type)) { var f = it.getAsFile(); if (f) out.push(f); } });
    return out;
  }
  document.addEventListener('paste', function (e) {
    if (!photoTabOn()) return; var fl = imgFiles(e.clipboardData); if (!fl.length) return;
    e.preventDefault(); toast(fl.length + '장 붙여넣었어요 — 올리는 중…'); doPhoto(fl);
  });
  document.addEventListener('dragover', function (e) { if (photoTabOn() && e.dataTransfer && [].slice.call(e.dataTransfer.types || []).indexOf('Files') >= 0) e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    if (!photoTabOn()) return; var fl = imgFiles(e.dataTransfer); if (!fl.length) return;
    e.preventDefault(); toast(fl.length + '장 올리는 중…'); doPhoto(fl);
  });
  window.shopReset = function () { LA.list = null; P.open = {}; P.tok = null; P.d = null; P.list = null; P.pic = {}; P.sel = {}; P.flash = null; P.dep = ''; };
})();
