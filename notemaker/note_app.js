/* 개인별 오답노트 — 편집 가능한 노트 (교재 엔진 복사본, notemaker.html 이 자료를 넣어 줌)
   · 자료(문제 풀·이론·처음 배치)는 HTML 안의 JSON, 고친 내용(S)은 이 컴퓨터(localStorage) + 파일 + 서버에 저장
   · 문제 상자(.pb)는 한 번 만들어 EL 에 보관하고, 쪽 나누기(layout)는 상자를 새 쪽으로 옮기기만 한다 */
(async function () {
 'use strict';
 var BS = String.fromCharCode(92);
 function $(i) { return document.getElementById(i); }
 function qa(root, sel) { return [].slice.call(root.querySelectorAll(sel)); }
 function rm(n) { if (n && n.parentNode) n.parentNode.removeChild(n); }
 function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
 function J(id) { return JSON.parse($(id).textContent); }
 var POOL = J('pool'), FIGS = J('figs'), TH = J('theory'), INIT = J('init'), TYPES = J('types');
 var BY = {}, THBY = {};
 POOL.forEach(function (p) { BY[p.u] = p; });
 TH.forEach(function (b) { THBY[b.id] = b; });
 var KEY = window.NOTE_KEY || 'note_v1', st = document.querySelector('.stage'), CIRC = '①②③④⑤';
 var PN = { 1: '함수', 2: '합성함수', 3: '역함수' };
 var EL = {}, TEL = {}, EDIT = true, pages = [], cur = null, busy = false;

 /* ───────── 상태 ───────── */
 function fresh() { return { v: 1, tb: INIT.tb.slice(), mk: JSON.parse(JSON.stringify(INIT.mk)), ed: {}, th: {}, thDel: [], custom: {}, seq: 1, gseq: 200 }; }
 function loadLocal() { try { var t = localStorage.getItem(KEY); if (t) { var o = JSON.parse(t); if (o && o.v === 1) return o; } } catch (e) { } return null; }
 var S = loadLocal() || fresh();
 function item(u) { return BY[u] || S.custom[u]; }
 var saveT = null;
 function stat(m) { var e = $('stat'); if (e) e.textContent = m; }
 function save() {
  clearTimeout(saveT);
  saveT = setTimeout(function () {
   harvest();
   try { localStorage.setItem(KEY, JSON.stringify(S)); stat('이 컴퓨터에 자동 저장됨 · ' + new Date().toLocaleTimeString('ko-KR')); }
   catch (e) { stat('저장 공간이 부족해요 — [파일로 내려받기]를 해 주세요'); }
  }, 600);
 }

 /* ───────── 되돌리기 · 다시하기 (바꾸기 직전 상태를 통째로 기억) ───────── */
 var undoS = [], redoS = [], lastTypeSnap = 0;
 function btns() { var u = $('bUndo'), r = $('bRedo'); if (u) u.disabled = !undoS.length; if (r) r.disabled = !redoS.length; }
 function snap() { harvest(); undoS.push(JSON.stringify(S)); if (undoS.length > 60) undoS.shift(); redoS = []; btns(); }
 function restore(json) {
  var old = S; S = JSON.parse(json);
  Object.keys(EL).forEach(function (u) { if (JSON.stringify(old.ed[u]) !== JSON.stringify(S.ed[u])) delete EL[u]; });
  Object.keys(TEL).forEach(function (id) { if (old.th[id] !== S.th[id]) delete TEL[id]; });
  save(); return layout();
 }
 function undo() { if (!undoS.length || busy) return; harvest(); redoS.push(JSON.stringify(S)); restore(undoS.pop()); btns(); stat('되돌렸어요'); }
 function redo() { if (!redoS.length || busy) return; harvest(); undoS.push(JSON.stringify(S)); restore(redoS.pop()); btns(); stat('다시 적용했어요'); }

 /* ───────── 글·수식·그림 다듬기 ───────── */
 function plen(s) { s = String(s).replace(/<[^>]+>/g, ''); s = s.replace(/\\[a-zA-Z]+/g, 'x'); return s.replace(/[{}\\()\s]/g, '').length; }
 function emp(td) { return td.textContent.replace(/\s/g, '') === '' && !td.querySelector('img,table,.katex,.eq'); }
 function fixTables(root) {
  qa(root, 'table.hwpTbl').reverse().forEach(function (t) {
   if (!t.isConnected && !root.contains(t)) return;
   var rows = [].slice.call(t.rows), nested = !!t.querySelector('table');
   var syn = !nested && rows.length === 3 && rows[0].cells.length >= 4 && rows.every(function (r) { return r.cells.length === rows[0].cells.length; }) && emp(rows[1].cells[0]) && emp(rows[2].cells[0]);
   if (syn) { t.classList.add('syn'); return; }
   var tds = qa(t, 'td').filter(function (td) { return td.closest('table') === t; });
   var ne = tds.filter(function (td) { return !emp(td); });
   if (!ne.length && !nested) { rm(t); return; }
   if (!nested && ne.length > 2 && !t.querySelector('.hwpBogi')) { t.classList.add('grid'); return; }
   var box = document.createElement('div'); box.className = 'cbox';
   ne.forEach(function (td) { var d = document.createElement('div'); d.className = 'cc'; if (/^<\s*보기\s*>$/.test(td.textContent.trim())) d.className += ' tt'; d.innerHTML = td.innerHTML; box.appendChild(d); });
   t.parentNode.replaceChild(box, t);
  });
 }
 var RX_ALL = new RegExp(BS + BS + '\\((.*?)' + BS + BS + '\\)', 'gs');
 function texify(root) {
  qa(root, 'span.eq').forEach(function (s) {
   if (s.dataset.tex == null) { s.dataset.tex = s.textContent.replace(/^\s*\\\(/, '').replace(/\\\)\s*$/, ''); s.textContent = ''; }
  });
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
  while ((n = w.nextNode())) { if (n.nodeValue.indexOf(BS + '(') >= 0 && !(n.parentNode.closest && n.parentNode.closest('.eq'))) list.push(n); }
  list.forEach(function (n) {
   var f = document.createDocumentFragment(), t = n.nodeValue, last = 0, m;
   RX_ALL.lastIndex = 0;
   while ((m = RX_ALL.exec(t))) {
    if (m.index > last) f.appendChild(document.createTextNode(t.slice(last, m.index)));
    var s = document.createElement('span'); s.className = 'eq'; s.dataset.tex = m[1]; f.appendChild(s); last = m.index + m[0].length;
   }
   if (last < t.length) f.appendChild(document.createTextNode(t.slice(last)));
   n.parentNode.replaceChild(f, n);
  });
 }
 function renderEq(s) {
  s.textContent = '';
  try { katex.render(s.dataset.tex || '', s, { throwOnError: false }); } catch (e) { s.textContent = s.dataset.tex; }
  s.setAttribute('contenteditable', 'false');
  if (!s.dataset.tex) { s.textContent = '[수식]'; }
 }
 function figLayout(root) {
  qa(root, 'img.fig').forEach(function (im) {
   im.classList.remove('wide');
   var p = im.parentNode;
   if (p === root) { var np = document.createElement('p'); np.className = 'figp'; root.insertBefore(np, im); np.appendChild(im); return; }
   if (p.tagName === 'P' && p.textContent.replace(/\s/g, '') === '' && !p.querySelector('.eq')) p.classList.add('figp');
  });
  qa(root, 'p.figp').forEach(function (p) {
   var pv = p.previousElementSibling;
   if (pv && pv.classList && pv.classList.contains('figp')) { while (p.firstChild) pv.appendChild(p.firstChild); rm(p); }
  });
 }
 function prepare(root) {
  fixTables(root); texify(root);
  qa(root, 'img[data-fig]').forEach(function (im) { var s = FIGS[im.getAttribute('data-fig')]; if (s) im.src = s; im.draggable = false; });
  figLayout(root);
  qa(root, 'span.eq').forEach(renderEq);
 }
 function ser(node) {
  var c = node.cloneNode(true);
  qa(c, '.ui').forEach(rm);
  qa(c, 'span.eq').forEach(function (s) { var t = s.dataset.tex || ''; s.removeAttribute('data-tex'); s.removeAttribute('contenteditable'); s.textContent = BS + '(' + t + BS + ')'; });
  qa(c, 'img[data-fig]').forEach(function (i) { i.removeAttribute('src'); i.removeAttribute('draggable'); i.classList.remove('sel'); });
  qa(c, '[contenteditable]').forEach(function (x) { x.removeAttribute('contenteditable'); });
  return c.innerHTML;
 }
 function wrapFix(root) {
  qa(root || document, '.katex-html').forEach(function (k) {
   var host = k.closest('.ch .cv,.q,.tb2,.eq1,.es'); k.classList.remove('wrapok');
   if (host && k.scrollWidth > host.clientWidth + 1) k.classList.add('wrapok');
  });
 }

 /* ───────── 상자 만들기 ───────── */
 var TOOLS_P = '<span class="ui tools"><button data-a="up" title="앞으로">↑</button><button data-a="dn" title="뒤로">↓</button><button data-a="add" title="이 문제 뒤에 문제 추가">추가</button><button data-a="rst" title="고친 내용을 원래대로">원래대로</button><button data-a="del" class="red" title="이 문제를 교재에서 빼기">빼기</button></span>';
 var TOOLS_T = '<span class="ui tools"><button data-a="tdel" class="red" title="이 덩어리를 교재에서 빼기">빼기</button></span>';
 function mkProblem(uid) {
  var p = item(uid), e = S.ed[uid] || {}, t = p.k === 't';
  var el = document.createElement('div'); el.className = 'pb ' + (t ? 'tb' : 'mk'); el.dataset.uid = uid;
  var chs = (e.ch && e.ch.length) ? e.ch : (p.ch || []);
  var h = '<div class="ph2"><i class="no"></i><span class="srcl ed"></span></div><div class="q ed"></div>';
  if (chs.length) {
   var L = 0; chs.forEach(function (c) { L = Math.max(L, plen(c)); });
   var cols = L <= 7 ? 5 : L <= 14 ? 3 : L <= 30 ? 2 : 1;
   h += '<div class="ch c' + cols + '">' + chs.map(function (c, i) { return '<span><b>' + CIRC[i] + '</b><span class="cv ed"></span></span>'; }).join('') + '</div>';
  } else if (!t) h += '<div class="ans">답 <u></u></div>';
  h += '<div class="sol"><span>풀이</span><div class="ui rz" title="끌어서 풀이 칸 크기 조절 · 두 번 누르면 자동 크기"></div></div>' + TOOLS_P;
  el.innerHTML = h;
  var q = el.querySelector('.q'); q.innerHTML = e.stem != null ? e.stem : p.st; prepare(q);
  qa(el, '.ch .cv').forEach(function (cv, i) { cv.innerHTML = chs[i]; prepare(cv); });
  el.querySelector('.srcl').textContent = e.src != null ? e.src : p.src;
  return el;
 }
 function mkTheory(b) {
  var el;
  if (b.kind === 'pg') { el = document.createElement('div'); el.className = b.cls; el.innerHTML = S.th[b.id] != null ? S.th[b.id] : b.html; }
  else { el = document.createElement('div'); el.className = 'blk tblk ' + b.kind; el.innerHTML = (S.th[b.id] != null ? S.th[b.id] : b.html) + (b.kind === 'card' || b.kind === 'ex' ? TOOLS_T : ''); }
  el.dataset.id = b.id; prepare(el);
  return el;
 }
 function needAll() {
  S.tb.forEach(function (u) { if (item(u) && !EL[u]) EL[u] = mkProblem(u); });
  S.mk.forEach(function (g) { g.uids.forEach(function (u) { if (item(u) && !EL[u]) EL[u] = mkProblem(u); }); });
  TH.forEach(function (b) { if (!TEL[b.id]) TEL[b.id] = mkTheory(b); });
 }
 function harvest() {
  Object.keys(EL).forEach(function (u) {
   var el = EL[u]; if (!el._d) return;
   var o = { stem: ser(el.querySelector('.q')), src: el.querySelector('.srcl').textContent.trim() };
   var cv = qa(el, '.ch .cv'); if (cv.length) o.ch = cv.map(ser);
   if (S.ed[u] && S.ed[u].sh) o.sh = S.ed[u].sh;
   S.ed[u] = o; el._d = 0;
  });
  Object.keys(TEL).forEach(function (id) { var el = TEL[id]; if (!el._d) return; S.th[id] = ser(el); el._d = 0; });
 }

 /* ───────── 쪽 나누기 ───────── */
 function over(c) { return c.scrollHeight > c.clientHeight + 1; }
 function pageShell(sec, ncol, kind) {
  var pg = document.createElement('div'); pg.className = 'pg ' + (ncol === 1 ? 'one' : '') + ' ' + kind + 'p';
  var cs = ''; for (var i = 0; i < ncol; i++) cs += '<div class="col"></div>';
  pg.innerHTML = '<div class="pgh"><b>MATHY YURI</b><span>' + esc(sec) + '</span></div><div class="cols">' + cs + '</div><div class="pgf"><em>Wrong-answer note</em><span class="pn"></span><em>' + esc(window.NOTE_NAME || '') + '</em></div>';
  return pg;
 }
 function section(sec, ncol, kind, per) { closeSection(); cur = { sec: sec, ncol: ncol, kind: kind, per: per || 0, pg: null, ci: 0, cnt: 0 }; }
 function newPg() { cur.pg = pageShell(cur.sec, cur.ncol, cur.kind); cur.ci = 0; cur.cnt = 0; st.appendChild(cur.pg); pages.push(cur.pg); }
 function col() { return cur.pg.querySelectorAll('.col')[cur.ci]; }
 function memoFill(c) {
  if (!c || c.querySelector('.memo')) return; var last = c.lastElementChild; var top = last ? last.offsetTop + last.offsetHeight : 0;
  var free = c.clientHeight - top - 36;
  if (free >= 120) { var m = document.createElement('div'); m.className = 'memo fixed'; m.style.height = free + 'px'; m.innerHTML = '<span>MEMO</span>'; c.appendChild(m); }
 }
 function fillCol(c) {
  var pbs = qa(c, '.pb').filter(function (p) { return !p.querySelector('.sol').dataset.fixed; }); if (!pbs.length) return;
  var last = c.lastElementChild, free = c.clientHeight - (last.offsetTop + last.offsetHeight) - 14;
  if (free <= 6) return;
  var add = free / pbs.length, cap = 900;
  pbs.forEach(function (p) { var s = p.querySelector('.sol'); s.style.height = Math.min(s.offsetHeight + add, cap) + 'px'; });
 }
 function endCol() { if (!cur || !cur.pg) return; var c = col(); if (cur.kind === 'one') memoFill(c); else fillCol(c); }
 function nextCol() { endCol(); cur.ci++; cur.cnt = 0; if (cur.ci >= cur.ncol) newPg(); }
 function put(el, np) {
  if (!cur.pg) newPg();
  if (np && cur.per && cur.cnt >= cur.per) nextCol();
  var c = col(); c.appendChild(el); wrapFix(el);
  if (over(c) && c.children.length > 1) { c.removeChild(el); nextCol(); col().appendChild(el); }
  cur.cnt += np;
 }
 function breakCol() { if (cur.pg && cur.cnt > 0) nextCol(); }
 function closeSection() {
  if (!cur || !cur.pg) { cur = null; return; }
  endCol();
  if (cur.ncol === 2 && cur.ci === 0) { var c2 = cur.pg.querySelectorAll('.col')[1]; if (c2 && !c2.children.length) { var m = document.createElement('div'); m.className = 'memo fixed'; m.style.height = (c2.clientHeight - 4) + 'px'; m.innerHTML = '<span>MEMO</span>'; c2.appendChild(m); } }
  cur = null;
 }
 function baseSol(el) {
  var s = el.querySelector('.sol'); if (!s) return; var sh = (S.ed[el.dataset.uid] || {}).sh;
  if (sh) { s.style.height = sh + 'px'; s.dataset.fixed = '1'; } else { s.style.height = (el.classList.contains('tb') ? 22 : 18) + 'mm'; delete s.dataset.fixed; }
 }
 function resetPb(el) { baseSol(el); }
 function blk(html) { var d = document.createElement('div'); d.className = 'blk'; d.innerHTML = html; return d; }

 async function decodeAll() {
  var all = [];
  Object.keys(EL).forEach(function (u) { qa(EL[u], 'img').forEach(function (i) { all.push(i); }); });
  Object.keys(TEL).forEach(function (u) { qa(TEL[u], 'img').forEach(function (i) { all.push(i); }); });
  await Promise.all(all.map(function (i) { return i.decode ? i.decode().catch(function () { }) : Promise.resolve(); }));
 }

 async function layout() {
  if (busy) return; busy = true;
  try {
   harvest(); deselect();
   needAll(); await decodeAll();
   var sy = window.scrollY;
   document.documentElement.style.setProperty('--s', '1');
   st.innerHTML = ''; pages = []; cur = null;
   var nT = S.tb.filter(item).length, nM = 0;
   S.mk.forEach(function (g) { nM += g.uids.filter(item).length; });
   qa(document, '.n-tb').forEach(function (e) { e.textContent = nT; }); qa(document, '.n-mk').forEach(function (e) { e.textContent = nM; });
   function fullPg(id) { var e = TEL[id]; if (!e) return; st.appendChild(e); pages.push(e); }
   ['cover'].concat(TH.filter(function (b) { return /^sum[0-9]*$/.test(b.id); }).map(function (b) { return b.id; }), ['stat']).forEach(fullPg);
   [1, 2, 3].forEach(function (pn) {
    fullPg('gj-p' + pn);
    var bl = TH.filter(function (b) { return b.part === pn && S.thDel.indexOf(b.id) < 0; });
    section('이론 · PART 0' + pn + ' · ' + PN[pn], 1, 'one');
    bl.filter(function (b) { return b.kind === 'head' || b.kind === 'card'; }).forEach(function (b) { put(TEL[b.id], 0); });
    closeSection();
    section('예제 · PART 0' + pn + ' · ' + PN[pn], 1, 'one');
    bl.filter(function (b) { return b.kind === 'exhd' || b.kind === 'ex'; }).forEach(function (b) { put(TEL[b.id], 0); });
    closeSection();
   });
   if (S.tb.filter(item).length) { fullPg('gj-tb'); section('교과서편', 2, 'tb', 2); put(TEL['tb-intro'], 0); }
   S.tb.forEach(function (u, i) { if (!item(u)) return; var el = EL[u]; el.querySelector('.no').textContent = i + 1; resetPb(el); put(el, 1); });
   closeSection();
   fullPg('gj-mk');
   section('오답', 2, 'mk', 1);
   if (TEL['mk-intro']) put(TEL['mk-intro'], 0);
   var j = 0, lastSub = null, subs = [], subCnt = {};
   S.mk.forEach(function (g) { subCnt[g.sub] = (subCnt[g.sub] || 0) + g.uids.filter(item).length; });
   S.mk.forEach(function (g, gi) {
    var us = g.uids.filter(item); if (!us.length) return;
    if (cur.cnt > 0 && g.sub !== lastSub) breakCol();
    var w = document.createElement('div'); w.className = 'blk';
    if (g.sub !== lastSub) {
     if (subs.indexOf(g.sub) < 0) subs.push(g.sub);
     w.innerHTML += '<div class="subhd"><span>' + 'ABCDEF'[subs.indexOf(g.sub)] + '</span><b>' + esc(g.sub) + '</b><em>' + subCnt[g.sub] + '문항</em></div>'; lastSub = g.sub;
    }
    var gh = document.createElement('div'); gh.className = 'gh'; gh.dataset.gid = g.id;
    gh.innerHTML = '<i>' + ('0' + (gi + 1)).slice(-2) + '</i><b class="ed gt"></b><em>' + us.length + '문항</em><span class="ui tools"><button data-a="gup">↑</button><button data-a="gdn">↓</button><button data-a="gadd">문제 추가</button><button data-a="gdel" class="red">유형 지우기</button></span>';
    gh.querySelector('.gt').textContent = g.title; w.appendChild(gh);
    us.forEach(function (u, k) {
     var el = EL[u]; j++; el.querySelector('.no').textContent = j; resetPb(el);
     if (k === 0) { w.appendChild(el); put(w, 1); } else put(el, 1);
    });
   });
   closeSection();
   while ((pages.length + 1) % 4 !== 0) {
    var m = document.createElement('div'); m.className = 'pg mempg';
    m.innerHTML = '<div class="pgh"><b>MATHY YURI</b><span>MEMO</span></div><div class="cols" style="grid-template-columns:1fr"><div class="col" style="gap:0"></div></div><div class="pgf"><em>Wrong-answer note</em><span class="pn"></span><em>' + esc(window.NOTE_NAME || '') + '</em></div>';
    var c = m.querySelector('.col'); for (var k = 0; k < 24; k++) { var d = document.createElement('div'); d.className = 'ml'; c.appendChild(d); }
    pages.push(m); st.appendChild(m);
   }
   fullPg('back');
   if (window.NOTE_QA) {                                   /* 빠른 정답 (이 학생 노트에 들어간 문제만) */
    section('빠른 정답 · ' + (window.NOTE_NAME || '') + ' ' + (window.NOTE_ROUND || '') + '회차 오답노트', 1, 'sol', 0);
    var qn = 0;
    var ansHtml = function (a) {                           /* 정답 칸: 서버 정답이 수식 조각(<span class="eq">)이면 그대로, 아니면 글자로 */
     a = String(a);
     if (/<span class="eq">/.test(a)) a = a.replace(/<(?!\/?span\b)[^>]*>/g, ''); else if (/\\\(/.test(a)) a = '<span class="eq">' + esc(a) + '</span>'; else a = esc(a);
     return a.replace(/\\?bold\s*(?:\{([^{}]*)\})?/g, function (m, b) { return b == null ? ' ' : b; });
    };
    S.mk.forEach(function (g) {
     var us = g.uids.filter(item); if (!us.length) return;
     var q = document.createElement('div'); q.className = 'blk qablk';
     var h = '<div class="qa-gt"><b>' + esc(g.title) + '</b><em>' + us.length + '문항</em></div><div class="qa-grid">', rows = '';
     us.forEach(function (u) {
      qn++; var p = item(u), c = chsOf(u), has = p.an != null && String(p.an).replace(/\s/g, '') !== '';
      if (has) {
       var a = (c.length && /^[1-5]$/.test(String(p.an))) ? CIRC[+p.an - 1] : p.an;
       var ah = ansHtml(a);
       h += '<div class="qa-cell"><i>' + qn + '</i><b' + (ah.replace(/<[^>]+>/g, '').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}\\()\s]/g, '').length > 5 ? ' class="sm"' : '') + '>' + ah + '</b></div>';
      } else {                                           /* 교과서 문제처럼 정답이 풀이 안에 있는 것: 풀이의 첫 줄만 */
       var m = String(p.so || '').match(/<p[^>]*>[\s\S]*?<\/p>/), t = (m ? m[0] : String(p.so || '')).replace(/<img[^>]*>/g, ' '), pl = t.replace(/<[^>]+>/g, '').replace(/\\[a-zA-Z]+/g, 'x').replace(/\s+/g, '');
       if (!pl) t = '<span class="see">상세 해설 참고</span>'; else if (pl.length > 90) t = '<span class="see">상세 해설 참고</span>';
       rows += '<div class="qa-row"><i>' + qn + '</i><span class="qs">' + esc(srcOf(u).replace(/^.*? — /, '').replace(/\s*\(\d+번 틀림[^)]*\)\s*$/, '')) + '</span><span class="qv ss tb2">' + t + '</span></div>';
      }
     });
     q.innerHTML = h + '</div>' + (rows ? '<div class="qa-rows">' + rows + '</div>' : ''); prepare(q); put(q, 0);
    });
    closeSection();
   }
   if (window.NOTE_SOL) {                                  /* 상세 해설 */
    section('상세 해설 · ' + (window.NOTE_NAME || '') + ' ' + (window.NOTE_ROUND || '') + '회차 오답노트', 2, 'sol', 0);
    var jj = 0;
    S.mk.forEach(function (g) {
     g.uids.filter(item).forEach(function (u) {
      var p = item(u); jj++;
      var cc = chsOf(u), hasAn = p.an != null && String(p.an).replace(/\s/g, '') !== '', an = (cc.length && /^[1-5]$/.test(String(p.an))) ? CIRC[+p.an - 1] : (p.an || '');
      var b = document.createElement('div'); b.className = 'blk solblk';
      b.innerHTML = '<div class="sh2"><i>' + jj + '</i><span>' + esc(srcOf(u)) + '</span></div>' + (hasAn ? '<div class="sa">정답 <b class="sansv"></b></div>' : '') + '<div class="ss tb2">' + (p.so || '<p class="sm">해설이 없어요</p>') + '</div>';
      if (hasAn) b.querySelector('.sansv').textContent = String(an);
      prepare(b); put(b, 0);
     });
    });
    closeSection();
   }
   pages.forEach(function (p) { qa(p, '.col').forEach(function (c) { var g = 0; while (over(c) && g++ < 60) { var ss = qa(c, '.sol').filter(function (s) { return s.offsetHeight > 60 && !s.dataset.fixed; }); if (!ss.length) break; ss.forEach(function (s) { s.style.height = (s.offsetHeight - 4) + 'px'; }); } }); });
   pages.forEach(function (p, i) { var n = p.querySelector('.pn'); if (n) n.textContent = (i + 1) + ' / ' + pages.length; });
   $('info').textContent = '총 ' + pages.length + '쪽 (A4) · 오답 ' + (nM + nT) + '문항';
   setEditable(EDIT); scale(); window.scrollTo(0, sy);
  } finally { busy = false; }
 }
 function scale() { var w = Math.min(window.innerWidth - 16, 794); document.documentElement.style.setProperty('--s', Math.min(1, w / 794)); }
 window.addEventListener('resize', scale);
 var relayT = null;
 function relayLater() { clearTimeout(relayT); relayT = setTimeout(function () { layout(); }, 350); }
 function overflowAny() { return pages.some(function (p) { return qa(p, '.col').some(over); }); }

 function setEditable(on) {
  EDIT = on; document.body.classList.toggle('view', !on);
  $('bEdit').textContent = on ? '고치기 켬' : '고치기 끔'; $('bEdit').classList.toggle('on', on);
  qa(st, '.ed').forEach(function (e) { e.setAttribute('contenteditable', on ? 'true' : 'false'); });
  qa(st, '.es>.lb,.exm .et,.gh .gt i').forEach(function (e) { e.setAttribute('contenteditable', 'false'); });
  qa(st, '.eq').forEach(function (e) { e.setAttribute('contenteditable', 'false'); });
 }

 /* ───────── 구조 바꾸기 (빼기·추가·옮기기) ───────── */
 function findPlace(uid) {
  var i = S.tb.indexOf(uid); if (i >= 0) return { t: 'tb', i: i };
  for (var g = 0; g < S.mk.length; g++) { var k = S.mk[g].uids.indexOf(uid); if (k >= 0) return { t: 'mk', g: g, i: k }; }
  return null;
 }
 function movePb(uid, dir) {
  var pl = findPlace(uid); if (!pl) return;
  if (pl.t === 'tb') { var j = pl.i + dir; if (j < 0 || j >= S.tb.length) return; var x = S.tb[pl.i]; S.tb[pl.i] = S.tb[j]; S.tb[j] = x; return; }
  var g = S.mk[pl.g], j2 = pl.i + dir;
  if (j2 >= 0 && j2 < g.uids.length) { var y = g.uids[pl.i]; g.uids[pl.i] = g.uids[j2]; g.uids[j2] = y; return; }
  var ng = pl.g + dir; while (ng >= 0 && ng < S.mk.length && false) ng += dir;
  if (ng < 0 || ng >= S.mk.length) return;
  g.uids.splice(pl.i, 1);
  if (dir < 0) S.mk[ng].uids.push(uid); else S.mk[ng].uids.unshift(uid);
 }
 function removePb(uid) {
  var pl = findPlace(uid); if (!pl) return;
  if (pl.t === 'tb') S.tb.splice(pl.i, 1); else S.mk[pl.g].uids.splice(pl.i, 1);
 }
 function insertPb(uid, target, afterUid) {
  if (target === 'tb') {
   var i = afterUid ? S.tb.indexOf(afterUid) : -1; if (i >= 0) S.tb.splice(i + 1, 0, uid); else S.tb.push(uid);
  } else {
   var g = S.mk.filter(function (x) { return x.id === target; })[0]; if (!g) return;
   var k = afterUid ? g.uids.indexOf(afterUid) : -1; if (k >= 0) g.uids.splice(k + 1, 0, uid); else g.uids.push(uid);
  }
 }
 function usedSet() { var o = {}; S.tb.forEach(function (u) { o[u] = 1; }); S.mk.forEach(function (g) { g.uids.forEach(function (u) { o[u] = 1; }); }); return o; }

 /* ───────── 그림 편집 ───────── */
 var selImg = null, dragSt = null;
 function sc() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1; }
 function selectImg(im) {
  if (selImg && selImg !== im) selImg.classList.remove('sel');
  selImg = im; im.classList.add('sel'); placeImgTools();
 }
 function deselect() { if (selImg) selImg.classList.remove('sel'); selImg = null; $('it').hidden = true; $('ih').hidden = true; }
 function placeImgTools() {
  if (!selImg || !selImg.isConnected) { deselect(); return; }
  var r = selImg.getBoundingClientRect(), it = $('it'), ih = $('ih');
  it.hidden = false; ih.hidden = false;
  var q = selImg.closest('.q'); var qw = q ? q.getBoundingClientRect().width : 1;
  $('itPct').textContent = Math.round(r.width / qw * 100) + '%';
  var top = r.top - it.offsetHeight - 8; if (top < 56) top = Math.min(window.innerHeight - it.offsetHeight - 8, r.bottom + 8);
  it.style.top = top + 'px'; it.style.left = Math.max(6, Math.min(window.innerWidth - it.offsetWidth - 6, r.left + r.width / 2 - it.offsetWidth / 2)) + 'px';
  ih.style.left = (r.right - 7) + 'px'; ih.style.top = (r.bottom - 7) + 'px';
 }
 function markDirty(el) { var h = el.closest('.pb,.tblk,.pg.full'); if (h) { h._d = 1; save(); } }
 function setPct(im, pct) {
  pct = Math.max(8, Math.min(100, pct)); im.style.width = pct.toFixed(1) + '%'; im.style.maxWidth = 'none'; im.style.maxHeight = 'none'; im.style.height = 'auto';
 }
 function curPct(im) { var q = im.closest('.q'); return im.getBoundingClientRect().width / q.getBoundingClientRect().width * 100; }
 function setOff(im, dx, dy) { im.dataset.dx = Math.round(dx); im.dataset.dy = Math.round(dy); im.style.transform = (dx || dy) ? 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px)' : ''; }
 function imgAction(a) {
  var im = selImg; if (!im) return; snap();
  var dx = +im.dataset.dx || 0, dy = +im.dataset.dy || 0, p = im.parentNode;
  if (a === 'sm') setPct(im, curPct(im) * 0.9);
  else if (a === 'lg') setPct(im, curPct(im) * 1.1);
  else if (a === 'l') setOff(im, dx - 6, dy); else if (a === 'r') setOff(im, dx + 6, dy);
  else if (a === 'u') setOff(im, dx, dy - 6); else if (a === 'd') setOff(im, dx, dy + 6);
  else if (a === 'ctr') { setOff(im, 0, 0); if (p && p.classList.contains('figp')) p.style.textAlign = ''; }
  else if (a === 'al' && p) p.style.textAlign = 'left'; else if (a === 'ar' && p) p.style.textAlign = 'right';
  else if (a === 'del') { var pp = im.parentNode; var host = im; markDirty(im); deselect(); rm(im); if (pp && pp.classList.contains('figp') && !pp.querySelector('img') && !pp.textContent.trim()) rm(pp); relayLater(); return; }
  markDirty(im); placeImgTools();
 }
 $('it').addEventListener('mousedown', function (e) { e.preventDefault(); });
 $('it').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) imgAction(b.dataset.i); });
 st.addEventListener('pointerdown', function (e) {
  var im = e.target.closest && e.target.closest('img.fig');
  if (!im || !EDIT || !im.closest('.q')) return;
  e.preventDefault(); snap(); selectImg(im);
  dragSt = { x: e.clientX, y: e.clientY, dx: +im.dataset.dx || 0, dy: +im.dataset.dy || 0, im: im, mode: 'move' };
  im.setPointerCapture && im.setPointerCapture(e.pointerId);
 });
 $('ih').addEventListener('pointerdown', function (e) {
  if (!selImg) return; e.preventDefault(); snap();
  var q = selImg.closest('.q');
  dragSt = { x: e.clientX, w: selImg.getBoundingClientRect().width, qw: q.getBoundingClientRect().width, im: selImg, mode: 'size' };
  $('ih').setPointerCapture(e.pointerId);
 });
 window.addEventListener('pointermove', function (e) {
  if (rzSt) { var hh = Math.max(30, Math.min(1200, rzSt.h + (e.clientY - rzSt.y) / sc())); rzSt.sol.style.height = hh + 'px'; rzSt.sol.dataset.fixed = '1'; rzSt.now = hh; return; }
  if (!dragSt) return; var im = dragSt.im;
  if (dragSt.mode === 'move') setOff(im, dragSt.dx + (e.clientX - dragSt.x) / sc(), dragSt.dy + (e.clientY - dragSt.y) / sc());
  else setPct(im, (dragSt.w + (e.clientX - dragSt.x)) / dragSt.qw * 100);
  placeImgTools();
 });
 window.addEventListener('pointerup', function () {
  if (rzSt) { var u = rzSt.pb.dataset.uid; S.ed[u] = S.ed[u] || {}; S.ed[u].sh = Math.round(rzSt.now); rzSt.rz.classList.remove('on'); rzSt = null; save(); relayLater(); return; }
  if (dragSt) { markDirty(dragSt.im); dragSt = null; } });
 document.addEventListener('pointerdown', function (e) {
  if (!selImg) return;
  if (e.target.closest('#it,#ih') || (e.target.closest && e.target.closest('img.fig') === selImg)) return;
  deselect();
 }, true);
 window.addEventListener('scroll', function () { if (selImg) placeImgTools(); }, true);

 /* ───────── 수식 편집 ───────── */
 var feEq = null, feNew = false, lastRange = null;
 var SYM = [['분수', BS + 'dfrac{}{}'], ['제곱', '^{2}'], ['위첨자', '^{}'], ['아래첨자', '_{}'], ['루트', BS + 'sqrt{}'], ['합성 ∘', BS + 'circ '], ['역함수 ⁻¹', '^{-1}'], ['≤', BS + 'leq '], ['≥', BS + 'geq '], ['≠', BS + 'neq '], ['×', BS + 'times '], ['±', BS + 'pm '], ['→', BS + 'rightarrow '], ['∈', BS + 'in '], ['∪', BS + 'cup '], ['∩', BS + 'cap '], ['⊂', BS + 'subset '], ['{ }', BS + '{ ' + BS + '}'], ['절댓값', BS + 'left| ' + BS + 'right|'], ['괄호', BS + 'left( ' + BS + 'right)'], ['경우 나눔', BS + 'begin{cases} & (x<0) ' + BS + BS + ' & (x' + BS + 'geq 0) ' + BS + 'end{cases}'], ['세로선', BS + 'mid ']];
 $('feSym').innerHTML = SYM.map(function (s, i) { return '<button data-s="' + i + '">' + esc(s[0]) + '</button>'; }).join('');
 function fePrev() { var p = $('fePrev'); p.textContent = ''; try { katex.render($('feTex').value || BS + 'ldots', p, { throwOnError: false }); } catch (e) { p.textContent = $('feTex').value; } }
 function openFormula(eq, isNew) {
  feEq = eq; feNew = !!isNew; $('feTex').value = eq.dataset.tex || ''; $('fe').hidden = false; fePrev(); setTimeout(function () { $('feTex').focus(); }, 30);
 }
 function closeFormula() { $('fe').hidden = true; if (feNew && feEq && !feEq.dataset.tex) rm(feEq); feEq = null; feNew = false; }
 $('feTex').addEventListener('input', fePrev);
 $('feTex').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('feOk').click(); } });
 $('feSym').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return; var s = SYM[+b.dataset.s][1], t = $('feTex'), a = t.selectionStart, z = t.selectionEnd;
  t.value = t.value.slice(0, a) + s + t.value.slice(z); var k = s.indexOf('{}'); var pos = k >= 0 ? a + k + 1 : a + s.length; t.focus(); t.setSelectionRange(pos, pos); fePrev();
 });
 $('feOk').addEventListener('click', function () {
  if (!feEq) return; snap(); var v = $('feTex').value.trim();
  if (!v) { if (feNew) rm(feEq); else rm(feEq); } else { feEq.dataset.tex = v; renderEq(feEq); wrapFix(feEq.closest('.pb,.tblk') || document); }
  var host = feEq; $('fe').hidden = true; feNew = false; markDirty(host); feEq = null; if (overflowAny()) relayLater();
 });
 $('feDel').addEventListener('click', function () { if (!feEq) return; snap(); var h = feEq; rm(feEq); markDirty(h); feEq = null; feNew = false; $('fe').hidden = true; });
 st.addEventListener('dblclick', function (e) { var q = e.target.closest && e.target.closest('.eq'); if (q && EDIT && !q.closest('.cap')) { e.preventDefault(); openFormula(q, false); } });
 document.addEventListener('selectionchange', function () {
  var s = window.getSelection(); if (!s.rangeCount) return; var r = s.getRangeAt(0), n = r.startContainer; var el = n.nodeType === 1 ? n : n.parentNode;
  if (el && el.closest && el.closest('.ed') && el.closest('.stage')) lastRange = r.cloneRange();
 });
 $('bFormula').addEventListener('mousedown', function (e) { e.preventDefault(); });
 $('bFormula').addEventListener('click', function () {
  if (!lastRange || !EDIT) { stat('먼저 글 안에서 수식을 넣을 자리를 한 번 클릭해 주세요'); return; }
  var s = document.createElement('span'); s.className = 'eq'; s.dataset.tex = ''; s.setAttribute('contenteditable', 'false');
  lastRange.collapse(false); lastRange.insertNode(s); openFormula(s, true);
 });
 document.addEventListener('paste', function (e) {
  var t = e.target; if (!t.closest || !t.closest('.ed')) return; e.preventDefault();
  var tx = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, tx);
 });

 /* ───────── 문제 추가 창 ───────── */
 var pkTarget = 'tb', pkAfter = null, pkShown = 0, pkRows = [];
 function stemPlain(h) { return String(h || '').replace(/<img[^>]*>/g, ' ').replace(/<table[\s\S]*?<\/table>/g, ' '); }
 function pkTargets() {
  var o = '<option value="tb">교과서편 (맨 끝)</option>';
  S.mk.forEach(function (g) { o += '<option value="' + g.id + '">기출 · ' + esc(g.sub) + ' · ' + esc(g.title) + '</option>'; });
  $('pkTo').innerHTML = o; $('pkTo').value = pkTarget;
  var tv = pkTarget === 'tb'; var subs = tv ? ['교과서'] : ['오답'];
  $('pkSub').innerHTML = '<option value="">전체</option>' + subs.map(function (s) { return '<option>' + s + '</option>'; }).join('');
  $('pkPt').parentNode.style.display = tv ? 'none' : '';
 }
 function pkFilter() {
  var tv = pkTarget === 'tb', q = $('pkQ').value.trim().toLowerCase(), sb = $('pkSub').value, pt = $('pkPt').value, used = usedSet();
  var list = POOL.concat(Object.keys(S.custom).map(function (k) { return S.custom[k]; })).filter(function (p) {
   if (used[p.u]) return false; if ((p.k === 't') !== tv) return false;
   if (sb && p.sub !== sb) return false; if (pt && String(p.pt) !== pt) return false;
   if (q) { var hay = (p.src + ' ' + p.ty + ' ' + p.sub + ' ' + p.u + ' ' + stemPlain(p.st).replace(/<[^>]+>/g, ' ')).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
   return true;
  });
  pkRows = list; pkShown = 0; $('pkList').innerHTML = ''; pkMore();
  $('pkInfo').textContent = '아직 교재에 없는 문제 ' + list.length + '개' + (list.length ? '' : ' — 조건을 바꿔 보세요');
 }
 function pkMore() {
  var box = $('pkList'), end = Math.min(pkRows.length, pkShown + 30);
  var old = box.querySelector('.more'); if (old) rm(old);
  for (var i = pkShown; i < end; i++) {
   var p = pkRows[i], r = document.createElement('div'); r.className = 'pkit';
   r.innerHTML = '<div class="m"><b>' + esc(p.u[0] === 'C' ? '직접 입력' : p.src) + '</b><br>' + (p.k === 'm' ? esc(p.sub + (p.ty ? ' · ' + p.ty : '') + ' · ' + (p.pt || '?') + '점') : esc(p.sub)) + '</div><div class="t"></div><button data-u="' + p.u + '">추가</button>';
   var t = r.querySelector('.t'); t.innerHTML = stemPlain(p.st); texify(t); qa(t, 'span.eq').forEach(renderEq); box.appendChild(r);
  }
  pkShown = end;
  if (end < pkRows.length) { var b = document.createElement('button'); b.className = 'g more'; b.textContent = '더 보기 (' + (pkRows.length - end) + '개 남음)'; b.onclick = pkMore; box.appendChild(b); }
 }
 function openPicker(target, after) { pkTarget = target || 'tb'; pkAfter = after || null; pkTargets(); $('pkQ').value = ''; $('pk').hidden = false; pkFilter(); }
 function closePicker() { $('pk').hidden = true; layout(); save(); }
 $('pkTo').addEventListener('change', function () { pkTarget = $('pkTo').value === 'tb' ? 'tb' : $('pkTo').value; pkAfter = null; var v = pkTarget; pkTargets(); $('pkTo').value = v; pkFilter(); });
 ['pkQ'].forEach(function (i) { $(i).addEventListener('input', pkFilter); }); ['pkSub', 'pkPt'].forEach(function (i) { $(i).addEventListener('change', pkFilter); });
 $('pkList').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-u]'); if (!b) return; snap();
  insertPb(b.dataset.u, pkTarget, pkAfter); pkAfter = b.dataset.u; rm(b.closest('.pkit')); save();
  $('pkInfo').textContent = '추가했어요 (' + b.dataset.u + '). 닫으면 쪽이 다시 나뉩니다.';
 });
 $('pkNew').addEventListener('click', function () {
  snap(); var u = 'C' + (S.seq++), tv = pkTarget === 'tb';
  S.custom[u] = { u: u, k: tv ? 't' : 'm', n: 0, src: '직접 입력', sub: tv ? '직접 입력' : (S.mk.filter(function (g) { return g.id === pkTarget; })[0] || {}).sub || '', ty: '', pt: 0, st: '<p>여기에 문제를 입력하세요. 수식은 위쪽 [수식 넣기]로 넣어요.</p>', ch: [], an: '', so: '', h: '' };
  insertPb(u, pkTarget, pkAfter); pkAfter = u; save(); $('pk').hidden = true; layout();
 });

 /* ───────── 클릭 처리 ───────── */
 st.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.tools button'); if (!b) return;
  var a = b.dataset.a, pb = b.closest('.pb'), gh = b.closest('.gh'), tb = b.closest('.tblk');
  if (pb) {
   var u = pb.dataset.uid;
   if (a === 'up') { snap(); movePb(u, -1); } else if (a === 'dn') { snap(); movePb(u, 1); }
   else if (a === 'del') { snap(); removePb(u); }
   else if (a === 'rst') { if (!confirm('이 문제에서 고친 글·수식·그림을 모두 원래대로 되돌릴까요?')) return; snap(); delete S.ed[u]; delete EL[u]; }
   else if (a === 'add') { var pl = findPlace(u); openPicker(pl && pl.t === 'mk' ? S.mk[pl.g].id : 'tb', u); return; }
   save(); layout();
  } else if (gh) {
   var gi = -1; S.mk.forEach(function (g, i) { if (g.id === gh.dataset.gid) gi = i; }); if (gi < 0) return;
   if (a !== 'gadd') snap();
   if (a === 'gup' && gi > 0) { var t = S.mk[gi]; S.mk[gi] = S.mk[gi - 1]; S.mk[gi - 1] = t; }
   else if (a === 'gdn' && gi < S.mk.length - 1) { var t2 = S.mk[gi]; S.mk[gi] = S.mk[gi + 1]; S.mk[gi + 1] = t2; }
   else if (a === 'gadd') { openPicker(S.mk[gi].id, null); return; }
   else if (a === 'gdel') { if (!confirm('이 유형 제목을 지울까요? (안의 문제 ' + S.mk[gi].uids.length + '개는 교재에서 빠지고, [기출 문제 추가]에서 다시 넣을 수 있어요)')) return; S.mk.splice(gi, 1); }
   save(); layout();
  } else if (tb && a === 'tdel') {
   var id = tb.dataset.id; if (!confirm('이 덩어리를 교재에서 뺄까요?')) return; snap(); if (S.thDel.indexOf(id) < 0) S.thDel.push(id); save(); layout();
  }
 });
 st.addEventListener('beforeinput', function () { if (Date.now() - lastTypeSnap > 2500) { snap(); lastTypeSnap = Date.now(); } });
 var rzSt = null;
 st.addEventListener('pointerdown', function (e) {
  var rz = e.target.closest && e.target.closest('.rz'); if (!rz) return;
  e.preventDefault(); snap();
  var sol = rz.closest('.sol'); rzSt = { y: e.clientY, h: sol.offsetHeight, sol: sol, pb: rz.closest('.pb'), rz: rz, now: sol.offsetHeight };
  rz.classList.add('on'); if (rz.setPointerCapture) rz.setPointerCapture(e.pointerId);
 });
 st.addEventListener('dblclick', function (e) {
  var rz = e.target.closest && e.target.closest('.rz'); if (!rz) return;
  var u = rz.closest('.pb').dataset.uid; if (S.ed[u]) delete S.ed[u].sh; save(); layout();
 });
 $('bUndo').onclick = undo; $('bRedo').onclick = redo;
 document.addEventListener('keydown', function (e) {
  if (!(e.ctrlKey || e.metaKey) || (e.target.closest && e.target.closest('.ed,input,textarea,select'))) return;
  var k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
 });
 st.addEventListener('input', function (e) {
  var gt = e.target.closest && e.target.closest('.gt');
  if (gt) { var gid = gt.closest('.gh').dataset.gid; S.mk.forEach(function (g) { if (g.id === gid) g.title = gt.textContent.trim(); }); save(); return; }
  markDirty(e.target.nodeType === 1 ? e.target : e.target.parentNode);
 });
 st.addEventListener('focusout', function () { setTimeout(function () { if (overflowAny() && !document.activeElement.closest('.ed')) relayLater(); }, 200); });

 /* ───────── 위쪽 도구 ───────── */
 $('bEdit').onclick = function () { setEditable(!EDIT); deselect(); };
 $('bAddTb').onclick = function () { openPicker('tb'); };
 $('bAddMk').onclick = function () { openPicker(S.mk.length ? S.mk[0].id : 'tb'); };
 $('bAddGrp').onclick = function () {
  var t = prompt('새 유형 제목을 적어 주세요 (예: 그래프로 푸는 문제)'); if (!t) return;
  var s = prompt('어느 단원에 넣을까요? (함수 / 합성함수 / 역함수)', '함수'); if (!s) return; if (!PN[1] || ['함수', '합성함수', '역함수'].indexOf(s.trim()) < 0) { alert('함수, 합성함수, 역함수 중에서 적어 주세요'); return; }
  s = s.trim(); snap(); var at = -1; S.mk.forEach(function (g, i) { if (g.sub === s) at = i; });
  S.mk.splice(at + 1, 0, { id: 'g' + (S.gseq++), sub: s, title: t.trim(), uids: [] });
  save(); openPicker(S.mk[at + 1].id);
 };
 $('bRelay').onclick = function () { layout(); };
 $('bReset').onclick = function () {
  if (!confirm('고친 내용과 문제 구성을 모두 처음 상태로 되돌릴까요?\n(되돌리기 전에 [파일로 내려받기]를 해 두면 안전해요)')) return;
  snap(); try { localStorage.removeItem(KEY); } catch (e) { }
  S = fresh(); EL = {}; TEL = {}; layout(); stat('처음 상태로 되돌렸어요');
 };
 function download(name, text) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
 $('bExport').onclick = function () { harvest(); download('오늘의진도_교재_수정본_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(S)); };
 $('bImport').onclick = function () { $('fImport').click(); };
 $('fImport').onchange = function () {
  var f = this.files[0]; if (!f) return; var r = new FileReader();
  r.onload = function () { try { var o = JSON.parse(r.result); if (!o || o.v !== 1 || !o.tb) throw 0; snap(); S = o; EL = {}; TEL = {}; save(); layout(); stat('파일에서 불러왔어요'); } catch (e) { alert('이 교재 파일이 아니에요'); } };
  r.readAsText(f); this.value = '';
 };
 document.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('[data-close]'); if (!c) return; var id = c.dataset.close; if (id === 'pk') closePicker(); else if (id === 'fe') closeFormula(); else $(id).hidden = true; });

 /* ───────── 정답표 ───────── */
 $('bAns').onclick = function () {
  harvest();
  var tbr = '', mkr = '', n = 0;
  function figs(h) { return String(h || '').replace(/<img[^>]*data-fig="([^"]+)"[^>]*>/g, function (m, f) { return '<img class="fig" src="' + (FIGS[f] || '') + '">'; }); }
  S.tb.forEach(function (u, i) { var p = item(u); if (!p) return; tbr += '<tr><td class="n">교' + (i + 1) + '</td><td class="s">' + esc(p.src) + '</td><td class="a">' + (figs(p.so) || '<span style="color:#aaa">풀이 없음</span>') + '</td></tr>'; });
  S.mk.forEach(function (g) {
   var us = g.uids.filter(item); if (!us.length) return; mkr += '<tr><td colspan="3" class="gt">' + esc(g.sub) + ' · ' + esc(g.title) + '</td></tr>';
   us.forEach(function (u) { var p = item(u); n++; var a = p.ch && p.ch.length && /^[1-5]$/.test(p.an) ? CIRC[+p.an - 1] : esc(p.an); mkr += '<tr><td class="n">' + n + '</td><td class="s">' + esc(p.src) + '</td><td class="a big">' + (a || '-') + '</td></tr>'; });
  });
  var h = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>정답표</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"><script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><' + '/script><script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><' + '/script><style>body{font:14px "Noto Sans KR","Malgun Gothic",sans-serif;margin:24px;color:#2a2118;background:#fffdf8}h1{font-family:"Gowun Batang",serif}table{border-collapse:collapse;width:100%;margin-bottom:26px}td,th{border:1px solid #e0d6bf;padding:6px 10px;vertical-align:top}th{background:#f4ecdb;text-align:left}.n{width:60px;font-weight:700}.s{width:260px;color:#7d7364;font-size:12px}.big{font-size:20px;font-weight:900;color:#9c5530}.a .fig{max-width:240px}.a p{margin:2px 0}.gt{background:#f7f1e3;font-weight:700;color:#9c5530}</style></head><body><h1>공통수학2 · 함수 — 정답표 (교사용, 지금 교재 기준)</h1><h2>교과서편</h2><table><tr><th>번호</th><th>출처</th><th>정답 · 풀이</th></tr>' + tbr + '</table><h2>모의기출편</h2><table><tr><th>번호</th><th>출처</th><th>정답</th></tr>' + mkr + '</table><script>renderMathInElement(document.body,{delimiters:[{left:"' + BS + BS + '(",right:"' + BS + BS + ')",display:false}],throwOnError:false})<' + '/script></body></html>';
  var w = window.open(URL.createObjectURL(new Blob([h], { type: 'text/html;charset=utf-8' })), '_blank'); if (!w) alert('팝업이 막혔어요. 주소창 옆에서 팝업을 허용해 주세요.');
 };

 /* ───────── 강의 PPT : 지금 교재 상태(빼고·더하고·고친 것) 그대로 ───────── */
 function emb(h) { return String(h || '').replace(/<img([^>]*?)data-fig="([^"]+)"([^>]*)>/g, function (m, a, f, b) { return '<img' + a + 'src="' + (FIGS[f] || '') + '"' + b + '>'; }); }
 function stemOf(u) { var e = S.ed[u] || {}, p = item(u); return e.stem != null ? e.stem : p.st; }
 function chsOf(u) { var e = S.ed[u] || {}, p = item(u); return (e.ch && e.ch.length) ? e.ch : (p.ch || []); }
 function srcOf(u) { var e = S.ed[u] || {}, p = item(u); return e.src != null ? e.src : p.src; }
 function chHtml(c) {
  if (!c.length) return ''; var L = 0; c.forEach(function (x) { L = Math.max(L, plen(x)); });
  var n = L <= 7 ? 5 : L <= 14 ? 3 : L <= 30 ? 2 : 1;
  return '<div class="ch c' + n + '">' + c.map(function (x, i) { return '<span><b>' + CIRC[i] + '</b>' + x + '</span>'; }).join('') + '</div>';
 }
 function thNode(id) { var d = document.createElement('div'); d.innerHTML = S.th[id] != null ? S.th[id] : THBY[id].html; return d; }
 function thHtmlOf(id, sel, dropLb) { var e = thNode(id).querySelector(sel); if (!e) return ''; if (dropLb) qa(e, '.lb').forEach(rm); return e.innerHTML; }
 function thTextOf(id, sel) { var e = thNode(id).querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
 function slideBody() {
  harvest();
  var sl = [], nT = S.tb.filter(item).length, nM = 0;
  S.mk.forEach(function (g) { nM += g.uids.filter(item).length; });
  function add(kind, sec, inner) { sl.push('<div class="pg sl ' + kind + '" data-sec="' + esc(sec) + '"><div class="sh"><b>MATHY YURI</b><span>' + esc(sec) + '</span></div>' + inner + '<div class="sf"><em>Functions · 함수 · 합성함수 · 역함수</em><span class="sn"></span></div></div>'); }
  var d = new Date(), ds = d.getFullYear() + '. ' + ('0' + (d.getMonth() + 1)).slice(-2) + '. ' + ('0' + d.getDate()).slice(-2);
  sl.push('<div class="pg sl cover"><div class="cvf"></div><div class="cv-top">MATHY YURI<i></i>공통수학 2</div><div class="cv-en">FUNCTIONS</div><div class="cv-ko">함수</div><div class="cv-sub">함수 &nbsp;·&nbsp; 합성함수 &nbsp;·&nbsp; 역함수</div><div class="cv-rule"></div><div class="cv-date">LECTURE NOTE &nbsp;·&nbsp; ' + ds + '</div></div>');
  add('road', '오늘의 흐름', '<div class="body"><h1>오늘의 흐름</h1><div class="flow"><div><i>01</i><b>이론</b><p>함수 · 합성함수 · 역함수<br>핵심 개념과 예제</p></div><div><i>02</i><b>교과서편</b><p>교과서 「함수」 단원<br>' + nT + '문항 · 출처 표시</p></div><div><i>03</i><b>모의기출편</b><p>교육청·평가원 3점 기출<br>' + nM + '문항 · 단원 · 유형별</p></div></div><p class="tip">발표 화면에서 <b>Space · →</b> = 정답·풀이 보기 → 다음 슬라이드 &nbsp;|&nbsp; <b>←</b> 이전 &nbsp;|&nbsp; <b>A</b> 정답 켜고 끄기 &nbsp;|&nbsp; <b>Esc</b> 닫기</p></div>');
  [1, 2, 3].forEach(function (pn) {
   var ids = TH.filter(function (b) { return b.part === pn && S.thDel.indexOf(b.id) < 0; });
   var hd = ids.filter(function (b) { return b.kind === 'head'; })[0], sec = 'PART 0' + pn + ' · ' + PN[pn];
   if (hd) { var en = thTextOf(hd.id, '.en').split('·'); add('part', sec, '<div class="body"><div class="pn">' + (en[0] || '').trim() + '</div><div class="en">' + esc((en[1] || '').trim()) + '</div><div class="ko">' + esc(thTextOf(hd.id, 'b')) + '</div><p>' + esc(thTextOf(hd.id, 'p')) + '</p></div>'); }
   var ci = 0, ei = 0;
   ids.forEach(function (b) {
    if (b.kind === 'card') { ci++; add('card', sec, '<div class="body"><div class="ct"><i>' + ci + '</i><h2>' + esc(thTextOf(b.id, '.th>b')) + '</h2></div><div class="cb tb2">' + thHtmlOf(b.id, '.tb2') + '</div></div>'); }
    else if (b.kind === 'ex') { ei++; add('ex', sec, '<div class="body split"><div class="pl"><div class="et">예제 ' + ei + '</div><div class="eq1">' + thHtmlOf(b.id, '.eq1') + '</div></div><div class="pr ans"><div class="ah">풀이</div><div class="as">' + thHtmlOf(b.id, '.es', true).replace(/&nbsp;·&nbsp;/g, '<br>') + '</div></div></div>'); }
   });
  });
  add('part', '교과서편', '<div class="body"><div class="pn">PART 04</div><div class="en">TEXTBOOK</div><div class="ko">교과서편</div><p>교과서 「함수」 단원의 문제 ' + nT + '문항. 문제마다 교과서의 소단원·활동 이름을 달았습니다.</p></div>');
  var no = 0;
  S.tb.forEach(function (u) {
   var p = item(u); if (!p) return; no++;
   add('prob', '교과서편 · ' + (p.sub || ''), '<div class="body split"><div class="pl"><div class="ph"><i class="no">' + no + '</i><span class="src">' + esc(srcOf(u)) + '</span></div><div class="q">' + emb(stemOf(u)) + '</div></div><div class="pr ans"><div class="ah">정답 · 풀이</div><div class="as">' + (emb(p.so) || '<p>풀이 참고</p>') + '</div></div></div>');
  });
  add('part', '모의기출편 · 3점', '<div class="body"><div class="pn">PART 05</div><div class="en">PAST EXAMS</div><div class="ko">모의기출편</div><p>교육청·평가원 기출 ' + nM + '문항을 단원 · 유형별로 모았습니다.</p></div>');
  var j = 0, lastSub = null, subs = [], subCnt = {};
  S.mk.forEach(function (g) { subCnt[g.sub] = (subCnt[g.sub] || 0) + g.uids.filter(item).length; });
  S.mk.forEach(function (g, gi) {
   var us = g.uids.filter(item); if (!us.length) return;
   if (g.sub !== lastSub) { if (subs.indexOf(g.sub) < 0) subs.push(g.sub); add('part sub', '모의기출편 · ' + g.sub, '<div class="body"><div class="pn">' + 'ABCDEF'[subs.indexOf(g.sub)] + '</div><div class="ko">' + esc(g.sub) + '</div><p>' + subCnt[g.sub] + '문항</p></div>'); lastSub = g.sub; }
   var sec = '모의기출편 · ' + g.sub + ' · ' + g.title;
   add('part sub typ', sec, '<div class="body"><div class="pn">TYPE ' + ('0' + (gi + 1)).slice(-2) + '</div><div class="ko">' + esc(g.title) + '</div><p>' + us.length + '문항</p></div>');
   us.forEach(function (u) {
    var p = item(u); j++; var c = chsOf(u);
    var ans = (c.length && /^[1-5]$/.test(p.an)) ? CIRC[+p.an - 1] : esc(p.an || '-');
    var exp = emb(p.so), longExp = exp.replace(/<[^>]+>/g, '').length > 1500, next = '';
    if (longExp) { next = exp; exp = '<p>해설이 길어 다음 슬라이드에 이어서 보여줍니다.</p>'; }
    add('prob', sec, '<div class="body split"><div class="pl"><div class="ph"><i class="no">' + j + '</i><span class="src">' + esc(srcOf(u)) + '</span></div><div class="q">' + emb(stemOf(u)) + '</div>' + chHtml(c) + '</div><div class="pr ans"><div class="ah">정답 · 해설</div><div class="ac">정답 &nbsp;<b>' + ans + '</b></div><div class="as">' + exp + '</div></div></div>');
    if (next) add('solslide', sec, '<div class="body"><div class="ct"><i>' + j + '</i><h2>해설</h2><span class="src" style="margin-left:14px">' + esc(srcOf(u)) + '</span></div><div class="cb">' + next + '</div></div>');
   });
  });
  add('road', '마무리', '<div class="body end"><div class="pn">TODAY</div><h1>오늘의 정리</h1><p>이론 3파트 · 교과서 ' + nT + '문항 · 기출 ' + nM + '문항<br>틀린 문제는 오답 체크표에 적고, 다음 수업 전에 다시 풀어 오세요.</p></div>');
  return sl.join('');
 }
 function slideDoc() {
  var T = function (id) { return JSON.parse($(id).textContent); }, SC = '<' + '/script>';
  var bar = '<div class="bar"><b>오답노트 · 강의 노트 (16:9)</b><span id="info"></span><button id="prBtn">▶ 발표 화면</button><button id="ansBtn" class="g">정답·풀이 보이기</button><input id="rng" type="text" placeholder="쪽 지정(비우면 전체) 예: 1-10"><button id="pdfBtn">PDF 저장 (PPT 비율)</button><button id="pngBtn" class="g">쪽별 이미지(PNG)</button><span class="hint">교재의 현재 구성이 그대로 반영된 강의 노트예요.</span></div>';
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오답노트 · 강의 노트 (PPT)</title>'
   + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Gowun+Batang:wght@400;700&family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&display=swap">'
   + '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js">' + SC + '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js">' + SC
   + '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js">' + SC + '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">' + SC + '<style>' + T('slidecss') + '</style></head><body>' + bar
   + '<div class="stage"><div class="loading">슬라이드를 만드는 중이에요… 잠시만 기다려 주세요 (처음 한 번, 30초~1분)</div></div><div id="src">' + slideBody() + '</div><div id="pres"><div class="box" id="presBox"></div><div class="hint2">Space · → = 정답 보기 / 다음 · ← 이전 · A = 정답 켜고 끄기 · Esc = 닫기</div></div>'
   + '<script>window.PDF_W=338.67;window.PDF_H=190.5;window.PDFBASE="오답노트_강의노트";' + SC + '<script>' + T('pdfjs') + SC + '<script>' + T('slidejs') + SC + '</body></html>';
 }
 /* ───────── 빠른 정답 (A4, PDF 저장 가능) ───────── */
 function quickDoc() {
  harvest();
  var SC = '<' + '/script>', blocks = '', nT = 0, nM = 0;
  S.mk.forEach(function (g) { nM += g.uids.filter(item).length; }); nT = S.tb.filter(item).length;
  var j = 0, lastSub = null, first = true;
  S.mk.forEach(function (g) {
   var us = g.uids.filter(item); if (!us.length) return;
   var h = '<div class="blk">';
   if (g.sub !== lastSub) { h += '<div class="sbar"><b>' + (first ? '오답 · ' : '') + esc(g.sub) + '</b></div>'; lastSub = g.sub; first = false; }
   h += '<div class="gt"><b>' + esc(g.title) + '</b><em>' + us.length + '문항</em></div><div class="grid">';
   us.forEach(function (u) {
    var p = item(u); j++; var c = chsOf(u), a = (c.length && /^[1-5]$/.test(p.an)) ? CIRC[+p.an - 1] : esc(p.an || '-');
    h += '<div class="cell"><i>' + j + '</i><b' + (String(p.an || '').length > 4 && !(c.length && /^[1-5]$/.test(p.an)) ? ' class="sm"' : '') + '>' + a + '</b></div>';
   });
   blocks += h + '</div></div>';
  });
  var rows = S.tb.filter(item).map(function (u, i) {
   var p = item(u), raw = String(p.so || ''), m = raw.match(/<p[^>]*>[\s\S]*?<\/p>/), so = (m ? m[0] : raw).replace(/<img[^>]*>/g, ' '), plain = so.replace(/<[^>]+>/g, '').trim();
   if (!plain) so = '<span class="see">정답표 참고</span>'; else if (plain.replace(/\\[a-zA-Z]+/g, '').length > 110) so = '<span class="see">풀이는 정답표 참고</span>';
   return '<div class="tr"><span class="n">교' + (i + 1) + '</span><span class="s">' + esc(srcOf(u).replace(/^교과서 · /, '')) + '</span><span class="a">' + so + '</span></div>';
  });
  for (var k = 0; k < rows.length; k += 12) blocks += '<div class="blk">' + (k === 0 ? '<div class="sbar"><b>교과서편 · ' + nT + '문항</b></div>' : '') + '<div class="tl">' + rows.slice(k, k + 12).join('') + '</div></div>';
  var css = 'html,body{margin:0;background:#d9d2c3;font-family:"Noto Sans KR","Malgun Gothic",sans-serif;color:#2a2118}.bar{position:sticky;top:0;z-index:30;background:#2a2118;color:#f3ead7;padding:8px 14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px}.bar b{font-family:"Gowun Batang",serif}.bar button,.bar input{border:0;border-radius:18px;padding:6px 14px;font-size:13px;font-weight:700;font-family:inherit}.bar button{background:#c9a55d;color:#2a2118;cursor:pointer}.bar button.g{background:#5b4d3b;color:#f3ead7}.bar input{font-weight:400;width:210px}.bar .hint{color:#cdbf9f;font-size:12px}'
   + '.stage{display:flex;flex-direction:column;align-items:center;gap:14px;padding:14px 0 40px}.stage .pg{zoom:var(--s,1)}.pg{width:210mm;height:297mm;background:#fffdf8;padding:12mm 13mm 9mm;box-shadow:0 8px 28px rgba(60,40,10,.28);position:relative;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box}.cap{box-shadow:none!important;zoom:1!important}#src{position:absolute;left:-30000px;top:0;width:184mm;visibility:hidden}'
   + '.hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.3mm solid #a8853f;padding-bottom:1.6mm;margin-bottom:4mm}.hd b{font-family:"Playfair Display",serif;font-style:italic;font-weight:500;font-size:10pt;color:#a8853f;letter-spacing:.08em}.hd span{font-family:"Gowun Batang",serif;font-size:9pt;color:#7d7364}.bd{flex:1;min-height:0;overflow:hidden}.ft{text-align:center;font-size:8pt;color:#9c5530;border-top:.2mm solid #e4d9c2;padding-top:1.6mm;margin-top:2mm}'
   + '.blk{margin-bottom:2.6mm}.bd .blk:last-child{margin-bottom:0}.sbar{background:#2a2118;color:#f3ead7;padding:1.6mm 3mm;border-radius:1mm;margin-bottom:2.4mm}.sbar b{font-family:"Gowun Batang",serif;font-size:11pt}.gt{display:flex;align-items:baseline;gap:3mm;border-bottom:.2mm solid #e4d9c2;padding-bottom:.6mm;margin-bottom:1.2mm}.gt b{font-family:"Gowun Batang",serif;font-size:10pt;color:#9c5530}.gt em{margin-left:auto;font-style:normal;font-size:7.6pt;color:#7d7364}'
   + '.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:1mm}.cell{border:.25mm solid #e0d6bf;border-radius:1mm;padding:.5mm .6mm .7mm;text-align:center;line-height:1.2;background:#fff}.cell i{display:block;font-style:normal;font-size:6pt;color:#9a8f7c}.cell b{font-size:10pt;color:#9c5530;font-weight:700}.cell b.sm{font-size:7.4pt}.tl{columns:2;column-gap:7mm}'
   + '.tr{display:flex;gap:2mm;align-items:baseline;border-bottom:.2mm solid #eee3cc;padding:.9mm 0;font-size:8.6pt;line-height:1.45;break-inside:avoid}.tr .n{flex:none;width:8mm;font-weight:700;color:#9c5530}.tr .s{flex:none;width:23mm;font-size:6.2pt;color:#9a8f7c;line-height:1.25}.tr .a{flex:1;min-width:0}.tr .a p{margin:0}.tr .see{color:#aaa;font-size:7.6pt}';
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오답노트 · 빠른 정답 (A4)</title>'
   + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&family=Playfair+Display:ital,wght@0,500;1,500&display=swap">'
   + '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js">' + SC + '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js">' + SC
   + '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js">' + SC + '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">' + SC + '<style>' + css + '</style></head><body>'
   + '<div class="bar"><b>오답노트 · 빠른 정답 (A4)</b><span id="info"></span><input id="rng" type="text" placeholder="쪽 지정(비우면 전체) 예: 1-2"><button id="pdfBtn">PDF 저장 (A4)</button><button id="pngBtn" class="g">쪽별 이미지(PNG)</button><span class="hint">교사용 · 지금 교재의 문제 구성 그대로예요</span></div>'
   + '<div class="stage"></div><div id="src">' + blocks + '</div>'
   + '<script>window.PDF_W=210;window.PDF_H=297;window.PDFBASE="오답노트_빠른정답";' + SC + '<script>' + JSON.parse($('pdfjs').textContent) + SC + '<script>' + JSON.parse($('quickjs').textContent) + SC + '</body></html>';
 }
 $('bQuick').onclick = function () {
  var w = window.open(URL.createObjectURL(new Blob([quickDoc()], { type: 'text/html;charset=utf-8' })), '_blank');
  if (!w) alert('팝업이 막혔어요. 주소창 옆에서 팝업을 허용해 주세요.');
 };
 window.__quickDoc = quickDoc;

 $('bPpt').onclick = function () {
  var h = slideDoc(), w = window.open(URL.createObjectURL(new Blob([h], { type: 'text/html;charset=utf-8' })), '_blank');
  if (!w) alert('팝업이 막혔어요. 주소창 옆에서 팝업을 허용해 주세요.'); else stat('강의 PPT를 새 창으로 열었어요 (처음 열 때 30초~1분 걸려요)');
 };
 $('bPptSave').onclick = function () {
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([slideDoc()], { type: 'text/html;charset=utf-8' })); a.download = '오답노트_강의노트_PPT_' + new Date().toISOString().slice(0, 10) + '.html';
  document.body.appendChild(a); a.click(); a.remove(); stat('강의 PPT 파일을 내려받았어요');
 };

 /* ───────── 서버 ───────── */
 var SB = 'https://eqllmvfbcdtzercliicy.supabase.co/rest/v1/rpc/', SK = 'sb_publishable_OcoOR7ERpt8BFBLuQ2CoWw_lELDDCEV', tok = null, BOOKKEY = 'func_today_v1';
 try { tok = sessionStorage.getItem('book_tok'); } catch (e) { }
 function svlog(m) { $('svLog').textContent += m + '\n'; }
 async function rpc(fn, args) {
  var r; try { r = await fetch((window.BOOK_SB || SB) + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SK, Authorization: 'Bearer ' + SK }, body: JSON.stringify(args) }); } catch (e) { return { ok: false, error: '인터넷 연결을 확인해 주세요' }; }
  if (!r.ok) { var tx = ''; try { tx = await r.text(); } catch (e) { } return { ok: false, error: '서버 오류 ' + r.status + (r.status === 404 ? ' — 3_교재_서버저장.sql 을 아직 실행하지 않았어요' : ''), raw: tx.slice(0, 200) }; }
  try { return await r.json(); } catch (e) { return { ok: false, error: '서버 응답을 읽지 못했어요' }; }
 }
 function bookApi(action, args) { return rpc('ac_book', { p_action: action, p_token: tok, p_args: args || {} }); }
 function svState() { $('svSt').textContent = tok ? '연결됨' : '연결 안 됨'; }
 $('bSave').onclick = function () { $('sv').hidden = false; svState(); $('svLog').textContent = ''; };
 $('svLogin').onclick = async function () {
  var pw = $('svPw').value; if (!pw) { svlog('비밀번호를 입력해 주세요'); return; }
  var j = await rpc('ac_api', { p_action: 'login', p_token: null, p_args: { academy: 'ds', role: 'admin', password: pw } });
  $('svPw').value = '';
  if (j && j.ok) { tok = j.token; try { sessionStorage.setItem('book_tok', tok); } catch (e) { } svlog('연결됐어요'); } else svlog((j && j.error) || '연결하지 못했어요');
  svState();
 };
 function editedItems() {
  var out = [];
  Object.keys(S.ed).forEach(function (u) { var p = BY[u]; var e = S.ed[u]; if (!p || !p.h || e.stem == null) return; out.push({ h: p.h, stem: e.stem, ch: e.ch || null, k: p.k }); });
  return out;
 }
 $('svSave').onclick = async function () {
  if (!tok) { svlog('먼저 비밀번호로 [연결]을 눌러 주세요'); return; }
  harvest(); svlog('교재 배치 저장 중…');
  var j = await bookApi('book_save', { key: BOOKKEY, data: S });
  if (!j.ok) { svlog('저장 실패: ' + (j.error || '')); if (j.error && j.error.indexOf('다시 로그인') >= 0) { tok = null; svState(); } return; }
  svlog('교재 배치를 저장했어요 (' + (j.at || '') + ')');
  if ($('svProb').checked) {
   var items = editedItems(); if (!items.length) { svlog('고친 문제가 없어서 문제 원본은 그대로예요'); return; }
   var j2 = await bookApi('problem_update', { items: items });
   svlog(j2.ok ? ('고친 문제 ' + j2.updated + '개를 서버 원본에 반영했어요' + (j2.missing ? ' (서버에 없는 문제 ' + j2.missing + '개는 건너뜀 — db 폴더 SQL 실행 필요)' : '')) : ('문제 반영 실패: ' + (j2.error || '')));
  }
 };
 async function pushMission(kind) {
  if (!tok) { svlog('먼저 비밀번호로 [연결]을 눌러 주세요'); return; }
  harvest(); var items = [], noH = 0, name, short;
  if (kind === 'tb') {
   S.tb.filter(item).forEach(function (u) { var p = item(u); if (!p.h) noH++; items.push({ unit: p.sub || '교과서', sub: '함수', typ: '', src: srcOf(u), h: p.h || '', pts: 1 }); });
   name = '교과서 미션 : 함수'; short = '교과서';
  } else {
   S.mk.forEach(function (g) { g.uids.filter(item).forEach(function (u) { var p = item(u); if (!p.h) noH++; items.push({ unit: g.title, sub: g.sub, typ: g.title, src: srcOf(u), h: p.h || '', pts: p.pt || 3 }); }); });
   name = '모의 기출 : 함수 3점'; short = '기출';
  }
  if (!items.length) { svlog('올릴 문제가 없어요'); return; }
  var nm = prompt('미션 이름을 확인해 주세요 (' + items.length + '문항)', name); if (!nm) return;
  var ac = prompt('어느 학원 학생들이 볼까요?  ds = 대치에스플러스 / bd = 분당미래탐구', 'ds'); if (!ac) return; ac = ac.trim().toLowerCase();
  if (ac !== 'ds' && ac !== 'bd') { svlog('ds 또는 bd 로 적어 주세요'); return; }
  var args = { ac: ac, name: nm.trim(), short: short, date: new Date().toISOString().slice(0, 10), items: items };
  S.mid = S.mid || {}; if (S.mid[kind]) { if (!confirm('이미 올린 미션이 있어요. 이 미션을 지금 문제 구성으로 갱신할까요?\n(이미 채점했다면 문제 번호 순서가 바뀌면 정오표가 어긋나요)')) return; args.id = S.mid[kind]; }
  svlog('미션 올리는 중…');
  var j = await rpc('ac_mission', { p_action: 'create', p_token: tok, p_args: args });
  if (!j || !j.ok) { svlog('실패: ' + ((j && j.error) || '') + (j && j.error && j.error.indexOf('서버 오류') === 0 ? '\n(4_교과서미션_서버.sql 을 실행했는지 확인해 주세요)' : '')); return; }
  S.mid[kind] = j.id; save();
  svlog('"' + nm + '" 미션을 올렸어요 (' + items.length + '문항).' + (noH ? '\n※ 서버 문제 DB에 없는 문제 ' + noH + '개는 정오표만 되고 문제 내용은 안 보여요(직접 입력한 문제 등).' : '') + '\n이제 교과서미션.html 에서 ○✕를 입력하세요.');
 }
 $('msTb').onclick = function () { pushMission('tb'); };
 $('msMk').onclick = function () { pushMission('mk'); };
 $('svLoad').onclick = async function () {
  if (!tok) { svlog('먼저 비밀번호로 [연결]을 눌러 주세요'); return; }
  svlog('불러오는 중…'); var j = await bookApi('book_load', { key: BOOKKEY });
  if (!j.ok) { svlog('불러오기 실패: ' + (j.error || '')); return; }
  if (!j.data) { svlog('서버에 저장된 교재가 아직 없어요'); return; }
  if (!confirm('서버에 저장된 교재(' + (j.at || '') + ')로 바꿀까요? 지금 화면의 고침은 사라져요.')) return;
  snap(); S = j.data; EL = {}; TEL = {};
  var hs = {}; Object.keys(BY).forEach(function (u) { if (BY[u].h) hs[BY[u].h] = u; });
  var j2 = await bookApi('problems_get', { hashes: Object.keys(hs) });
  if (j2.ok && j2.items) {
   var n = 0; j2.items.forEach(function (it) { var u = hs[it.h]; if (!u || S.ed[u]) return; S.ed[u] = { stem: it.stem, src: BY[u].src }; if (it.ch) S.ed[u].ch = it.ch; n++; });
   if (n) svlog('서버에서 고쳐 둔 문제 ' + n + '개도 가져왔어요');
  }
  save(); await layout(); svlog('완료');
 };

 /* ───────── 시작 ───────── */
 document.execCommand('defaultParagraphSeparator', false, 'p');
 try { await document.fonts.ready; await Promise.all(['KaTeX_Main', 'KaTeX_Math', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_AMS'].map(function (f) { return document.fonts.load('16px ' + f); })); await document.fonts.load('italic 16px KaTeX_Math'); await document.fonts.load('italic 16px KaTeX_Main'); await document.fonts.ready; } catch (e) { }
 await new Promise(function (r) { setTimeout(r, 250); });
 await layout();
 await new Promise(function (r) { setTimeout(r, 400); });
 await layout();
 window.__done = true; window.__S = function () { return S; }; window.__layout = layout; window.__slideBody = slideBody; window.__slideDoc = slideDoc;
})();
