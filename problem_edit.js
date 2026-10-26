/* MATHY 문제 수정 도구 (어디서든 붙여 쓰는 공용 모듈)
   · 글 직접 고치기 · 수식(더블클릭 → LaTeX 창) · 수식 넣기 · 그림(눌러서 크기·위치·정렬·지우기, 끌어서 이동·크기) · 객관식 보기 지우기
   · 정보 수정(종류·정답·분류·해설) · 고친 문제를 서버 문제 DB에 등록 (원장 비밀번호, 22_문제수정_서버.sql 필요)
   사용:  ProblemEdit.attach(root, { block:'.q', stem:'.qb', ch:'.ch', cv:'.cv', figs:{이름:dataURL}, onChange:fn, extraTools:[{label,title,fn(block)}] })
          블록(.q)에는 data-h(문제 해시)가 있어야 서버에 등록할 수 있어요. 글 영역(.qb)과 보기(.cv)는 자동으로 고칠 수 있게 돼요.
   수식은 서버와 같은 모양(<span class="eq">\(…\)</span>)으로 읽고 써요. katex 가 미리 불러와져 있어야 해요. */
(function () {
 'use strict';
 if (window.ProblemEdit) return;
 var BS = String.fromCharCode(92);
 var PE = window.ProblemEdit = { on: true, figs: {}, roots: [], opts: {}, scale: function () { return 1; } };
 function $(s, r) { return (r || document).querySelector(s); }
 function qa(r, s) { return [].slice.call(r.querySelectorAll(s)); }
 function rm(n) { if (n && n.parentNode) n.parentNode.removeChild(n); }
 function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
 var CIRC = '①②③④⑤';

 /* ───────── 서버 ───────── */
 var SB = 'https://eqllmvfbcdtzercliicy.supabase.co/rest/v1/rpc/', SK = 'sb_publishable_OcoOR7ERpt8BFBLuQ2CoWw_lELDDCEV';
 try { var q0 = new URLSearchParams(location.search).get('sb'); if (q0 && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(q0)) SB = q0; } catch (e) { }   // 시험용(내 컴퓨터) 서버만 허용
 var tok = null; try { tok = sessionStorage.getItem('pe_tok'); } catch (e) { }
 async function rpc(fn, args) {
  var r; try { r = await fetch((window.BOOK_SB || SB) + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SK, Authorization: 'Bearer ' + SK }, body: JSON.stringify(args) }); } catch (e) { return { ok: false, error: '인터넷 연결을 확인해 주세요' }; }
  if (!r.ok) return { ok: false, error: '서버 오류 ' + r.status + (r.status === 404 ? ' — 22_문제수정_서버.sql 을 아직 실행하지 않았어요' : '') };
  try { return await r.json(); } catch (e) { return { ok: false, error: '서버 응답을 읽지 못했어요' }; }
 }
 PE.rpc = rpc;
 function needLogin(j) { return j && !j.ok && /로그인/.test(j.error || ''); }
 async function ensureLogin(force) {
  if (tok && !force) return tok;
  return new Promise(function (res) {
   var m = dlg('<div class="pe-h"><b>원장 비밀번호로 연결</b><button class="pe-x2" data-c="1">닫기</button></div><p class="pe-p">고친 문제를 서버의 문제 DB에 등록하려면 원장 비밀번호가 필요해요.</p><div class="pe-row"><label>비밀번호 <input type="password" id="peLpw" autocomplete="off"></label><button id="peLok" class="pe-b">연결</button><span id="peLer" class="pe-err"></span></div>');
   var done = false; function fin(v) { if (done) return; done = true; closeDlg(m); res(v); }
   m.addEventListener('click', function (e) { if (e.target.dataset.c) fin(null); });
   $('#peLpw', m).focus();
   async function go() {
    var pw = $('#peLpw', m).value; if (!pw) return; $('#peLok', m).disabled = true;
    var j = await rpc('ac_api', { p_action: 'login', p_token: null, p_args: { academy: 'ds', role: 'admin', password: pw } });
    $('#peLok', m).disabled = false;
    if (j && j.ok) { tok = j.token; try { sessionStorage.setItem('pe_tok', tok); } catch (e) { } fin(tok); } else $('#peLer', m).textContent = (j && j.error) || '연결하지 못했어요';
   }
   $('#peLok', m).onclick = go; $('#peLpw', m).onkeydown = function (e) { if (e.key === 'Enter') go(); };
  });
 }
 async function call(action, args) {
  var t = await ensureLogin(false); if (!t) return { ok: false, error: '연결을 취소했어요' };
  var j = await rpc('ac_problem', { p_action: action, p_token: tok, p_args: args });
  if (needLogin(j)) { tok = null; try { sessionStorage.removeItem('pe_tok'); } catch (e) { } t = await ensureLogin(true); if (!t) return { ok: false, error: '연결을 취소했어요' }; j = await rpc('ac_problem', { p_action: action, p_token: tok, p_args: args }); }
  return j;
 }
 PE.call = call;

 /* ───────── 스타일 ───────── */
 var CSS = '.pe-edit .pe-ed{outline:1px dashed #6a8fd8;outline-offset:2px;cursor:text}.pe-edit .pe-ed:focus{outline:2px solid #3a6fe0;background:rgba(58,111,224,.05)}'
  + '.pe-edit .eq{cursor:pointer}.pe-edit .eq:hover{outline:1px solid #e6a23c;background:#fff6e0}'
  + '.pe-pb{position:relative}.pe-tools{position:absolute;right:0;top:-3px;display:none;gap:3px;flex-wrap:wrap;justify-content:flex-end;max-width:92%;z-index:30;font:11px "Malgun Gothic","Noto Sans KR",sans-serif}'
  + '.pe-edit .pe-pb:hover>.pe-tools,.pe-edit .pe-pb:focus-within>.pe-tools,.pe-edit .pe-pb.pe-open>.pe-tools{display:flex}'
  + '.pe-tools button{border:0;border-radius:5px;padding:3px 7px;background:#2f4a7a;color:#fff;cursor:pointer;font:inherit;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.25)}.pe-tools button.g{background:#7a8499}.pe-tools button.r{background:#b3341f}.pe-tools button.d{background:#2d6a3e}'
  + '.pe-pb.pe-dirty>.pe-flag{display:block}.pe-flag{display:none;position:absolute;left:-4px;top:0;width:5px;bottom:0;background:#e6a23c;border-radius:3px}'
  + '.pe-view .pe-tools,.pe-view .pe-flag,.pe-view .pe-cx,.cap .pe-tools,.cap .pe-flag,.cap .pe-cx{display:none!important}'
  + '.cap .pe-ed{outline:none!important;background:none!important}.cap .eq{outline:none!important;background:none!important}.cap img.fig.pe-sel{outline:none!important}'
  + '.pe-cx{display:none;position:absolute;right:-2px;top:-8px;border:0;border-radius:50%;width:16px;height:16px;line-height:14px;padding:0;background:#b3341f;color:#fff;font-size:11px;cursor:pointer;z-index:31}'
  + '.pe-edit .ch>span{position:relative}.pe-edit .ch>span:hover>.pe-cx{display:block}'
  + 'img.fig.pe-sel{outline:2px solid #3a6fe0;outline-offset:1px}'
  + '.pe-it{position:fixed;z-index:9500;background:#1f3258;color:#fff;border-radius:8px;padding:4px 6px;display:flex;gap:3px;align-items:center;font:12px "Malgun Gothic",sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.35)}.pe-it button{border:0;border-radius:5px;padding:3px 7px;background:#c9a15a;color:#1b2a4a;font-weight:700;cursor:pointer}.pe-it button.red{background:#b3341f;color:#fff}.pe-it span{min-width:36px;text-align:center}'
  + '.pe-ih{position:fixed;z-index:9501;width:14px;height:14px;border-radius:3px;background:#3a6fe0;border:2px solid #fff;cursor:nwse-resize}'
  + '.pe-mdl{position:fixed;inset:0;background:rgba(20,15,10,.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:10px}'
  + '.pe-box{background:#fffdf8;border-radius:12px;max-width:900px;width:100%;max-height:94vh;overflow:auto;padding:14px 18px;font:14px/1.5 "Noto Sans KR","Malgun Gothic",sans-serif;color:#2a2118;box-shadow:0 10px 40px rgba(0,0,0,.4)}'
  + '.pe-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.pe-h b{font-size:16px}.pe-x2{border:0;background:#efe5cf;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700}'
  + '.pe-p{margin:4px 0 8px;color:#7d7364;font-size:13px}.pe-row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:6px 0}.pe-row label{display:flex;gap:6px;align-items:center}'
  + '.pe-box input[type=text],.pe-box input[type=password],.pe-box select,.pe-box textarea{font:inherit;padding:6px 8px;border:1px solid #d7c9a8;border-radius:7px;background:#fff}.pe-box textarea{width:100%}'
  + '.pe-b{border:0;border-radius:8px;padding:7px 14px;background:#9c5530;color:#fff;font-weight:700;cursor:pointer}.pe-b.g{background:#efe5cf;color:#2a2118}.pe-b:disabled{opacity:.45;cursor:default}.pe-err{color:#b3341f;font-weight:700}.pe-ok{color:#2d6a3e;font-weight:700}'
  + '.pe-sym{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.pe-sym button{border:1px solid #d7c9a8;background:#fff;border-radius:6px;padding:3px 8px;cursor:pointer}'
  + '.pe-prev{min-height:44px;padding:8px;border:1px dashed #d7c9a8;border-radius:8px;margin:6px 0;text-align:center;font-size:18px}'
  + '.pe-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 12px}.pe-grid label{display:flex;flex-direction:column;gap:2px;font-size:12.5px;color:#7d7364}.pe-grid input,.pe-grid select{color:#2a2118}'
  + '.pe-exp{min-height:60px;border:1px solid #d7c9a8;border-radius:8px;padding:8px;background:#fff;line-height:1.7}.pe-exp .eq{cursor:pointer}.pe-src{font-size:12.5px;color:#7d7364;max-height:84px;overflow:auto;border:1px solid #eee3cc;border-radius:8px;padding:6px 8px;background:#fbf6ea}'
  + '.pe-bar{position:fixed;left:12px;bottom:12px;z-index:9000;display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#1f3258;color:#fff;border-radius:10px;padding:7px 10px;font:12.5px "Malgun Gothic",sans-serif;box-shadow:0 3px 14px rgba(0,0,0,.4);max-width:96vw}'
  + '.pe-bar button{border:0;border-radius:6px;padding:5px 10px;background:#c9a15a;color:#1b2a4a;font-weight:700;cursor:pointer}.pe-bar button.g{background:#7a8499;color:#fff}.pe-bar button:disabled{opacity:.45;cursor:default}.cap .pe-bar{display:none}'
  + '.pe-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);background:#2a2118;color:#fff;border-radius:8px;padding:8px 14px;z-index:10001;font:13px "Malgun Gothic",sans-serif;max-width:90vw}';
 var sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
 function toast(m, ms) { var t = document.createElement('div'); t.className = 'pe-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { rm(t); }, ms || 3200); }
 PE.toast = toast;
 function dlg(html, wide) {
  var m = document.createElement('div'); m.className = 'pe-mdl'; m.innerHTML = '<div class="pe-box"' + (wide ? ' style="max-width:' + wide + '"' : '') + '>' + html + '</div>'; document.body.appendChild(m); return m;
 }
 function closeDlg(m) { rm(m); }

 /* ───────── 글 · 수식 · 그림 다듬기 (서버 문제 글과 같은 모양으로 읽고 씀) ───────── */
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
  if (!s.dataset.tex) s.textContent = '[수식]';
 }
 function prepare(root) {
  texify(root);
  qa(root, 'img[data-fig]').forEach(function (im) { var u = PE.figs[im.getAttribute('data-fig')]; if (u && !im.getAttribute('src')) im.src = u; im.draggable = false; });
  qa(root, 'span.eq').forEach(renderEq);
 }
 function ser(node) {
  var c = node.cloneNode(true);
  qa(c, '.pe-tools,.pe-cx,.pe-flag').forEach(rm);
  qa(c, 'span.eq').forEach(function (s) { var t = s.dataset.tex || ''; s.removeAttribute('data-tex'); s.removeAttribute('contenteditable'); s.textContent = BS + '(' + t + BS + ')'; });
  qa(c, 'img[data-fig]').forEach(function (i) { i.removeAttribute('src'); i.removeAttribute('draggable'); i.classList.remove('pe-sel'); });
  qa(c, '[contenteditable]').forEach(function (x) { x.removeAttribute('contenteditable'); });
  return c.innerHTML;
 }
 PE.prepare = prepare; PE.ser = ser;

 /* ───────── 블록(문제 한 개) 도우미 ───────── */
 function optsOf(el) { var r = el.closest('[data-pe-root]'); return r ? r._peo : null; }
 function blockOf(el) { var o = optsOf(el); return o && el.closest ? el.closest(o.block) : null; }
 function stemEl(b) { var o = optsOf(b); return o.stem ? b.querySelector(o.stem) : b; }
 function chItems(b) { var o = optsOf(b); return o.ch ? qa(b, o.ch + ' ' + o.cv) : []; }
 function collect(b) {
  var o = optsOf(b), cv = chItems(b);
  return { h: b.dataset.h || '', stem: ser(stemEl(b)), ch: cv.length ? cv.map(ser) : [] };
 }
 PE.collect = collect;
 function markDirty(b) {
  if (!b) return; b.dataset.peDirty = '1'; b.classList.add('pe-dirty');
  var o = optsOf(b); if (o && o.onChange) o.onChange(b); updBar();
 }
 PE.dirty = function () { var out = []; PE.roots.forEach(function (r) { qa(r, '[data-pe-dirty="1"]').forEach(function (b) { out.push(b); }); }); return out; };

 /* ───────── 되돌리기 · 다시하기 (블록 한 개의 글·보기를 통째로 기억) ───────── */
 var undoS = [], redoS = [], lastType = 0;
 function snapOf(b) { var o = optsOf(b); return { b: b, stem: ser(stemEl(b)), ch: chItems(b).map(ser), chHtml: o.ch && b.querySelector(o.ch) ? b.querySelector(o.ch).outerHTML : '' }; }
 function snap(b) { if (!b) return; undoS.push(snapOf(b)); if (undoS.length > 80) undoS.shift(); redoS = []; updBar(); }
 PE.snap = snap;
 function restoreSnap(s) {
  var b = s.b, o = optsOf(b), se = stemEl(b); se.innerHTML = s.stem; prepare(se);
  if (o.ch) {
   var cur = b.querySelector(o.ch);
   if (s.chHtml && !cur) { /* 지웠던 보기 상자를 되살리려면 원래 위치 정보가 필요해요 — 가장 앞쪽 글 뒤에 붙임 */ var d = document.createElement('div'); d.innerHTML = s.chHtml; cur = d.firstChild; se.parentNode.insertBefore(cur, se.nextSibling); }
   if (cur) { if (!s.chHtml) rm(cur); else { var d2 = document.createElement('div'); d2.innerHTML = s.chHtml; var nw = d2.firstChild; cur.parentNode.replaceChild(nw, cur); cur = nw; qa(cur, o.cv).forEach(function (x, i) { x.innerHTML = s.ch[i] != null ? s.ch[i] : x.innerHTML; prepare(x); }); } }
  }
  qa(b, '.pe-ed').forEach(function (x) { x.setAttribute('contenteditable', PE.on ? 'true' : 'false'); }); wireChoices(b); markDirty(b); if (o.onRelayout) o.onRelayout();
 }
 PE.undo = function () { if (!undoS.length) return; var s = undoS.pop(); redoS.push(snapOf(s.b)); restoreSnap(s); updBar(); toast('되돌렸어요'); };
 PE.redo = function () { if (!redoS.length) return; var s = redoS.pop(); undoS.push(snapOf(s.b)); restoreSnap(s); updBar(); toast('다시 적용했어요'); };

 /* ───────── 수식 고치기 창 ───────── */
 var feEq = null, feNew = false, feBlock = null, lastRange = null, feM = null;
 var SYM = [['분수', BS + 'dfrac{}{}'], ['제곱', '^{2}'], ['위첨자', '^{}'], ['아래첨자', '_{}'], ['루트', BS + 'sqrt{}'], ['합성 ∘', BS + 'circ '], ['역함수 ⁻¹', '^{-1}'], ['≤', BS + 'leq '], ['≥', BS + 'geq '], ['≠', BS + 'neq '], ['×', BS + 'times '], ['±', BS + 'pm '], ['→', BS + 'rightarrow '], ['∈', BS + 'in '], ['∪', BS + 'cup '], ['∩', BS + 'cap '], ['⊂', BS + 'subset '], ['{ }', BS + '{ ' + BS + '}'], ['절댓값', BS + 'left| ' + BS + 'right|'], ['괄호', BS + 'left( ' + BS + 'right)'], ['경우 나눔', BS + 'begin{cases} & (x<0) ' + BS + BS + ' & (x' + BS + 'geq 0) ' + BS + 'end{cases}'], ['세로선', BS + 'mid ']];
 function fePrev() { var p = $('.pe-prev', feM); p.textContent = ''; try { katex.render($('textarea', feM).value || BS + 'ldots', p, { throwOnError: false }); } catch (e) { p.textContent = $('textarea', feM).value; } }
 function openFormula(eq, isNew) {
  if (feM) closeFormula();
  feEq = eq; feNew = !!isNew; feBlock = blockOf(eq);
  feM = dlg('<div class="pe-h"><b>수식 고치기</b><button class="pe-x2" data-c="1">닫기</button></div><div class="pe-sym">' + SYM.map(function (s, i) { return '<button data-s="' + i + '">' + esc(s[0]) + '</button>'; }).join('') + '</div><textarea rows="3" spellcheck="false"></textarea><div class="pe-prev"></div><div class="pe-row"><button class="pe-b" data-ok="1">적용</button><button class="pe-b g" data-del="1">수식 지우기</button><span class="pe-p">Ctrl+Enter = 적용 · LaTeX 문법 (예: ' + BS + 'dfrac{1}{2}, x^{2}, f^{-1})</span></div>', '640px');
  var ta = $('textarea', feM); ta.value = eq.dataset.tex || ''; fePrev(); setTimeout(function () { ta.focus(); }, 30);
  ta.addEventListener('input', fePrev);
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); applyFormula(); } });
  feM.addEventListener('click', function (e) {
   var t = e.target; if (t.dataset.c) closeFormula();
   else if (t.dataset.ok) applyFormula();
   else if (t.dataset.del) { if (feBlock) snap(feBlock); var b = feBlock; rm(feEq); feNew = false; closeFormula(true); markDirty(b); relay(b); }
   else if (t.dataset.s != null) { var s = SYM[+t.dataset.s][1], a = ta.selectionStart, z = ta.selectionEnd; ta.value = ta.value.slice(0, a) + s + ta.value.slice(z); var k = s.indexOf('{}'); var pos = k >= 0 ? a + k + 1 : a + s.length; ta.focus(); ta.setSelectionRange(pos, pos); fePrev(); }
  });
 }
 function closeFormula(keep) { if (!feM) return; if (!keep && feNew && feEq && !feEq.dataset.tex) rm(feEq); rm(feM); feM = null; feEq = null; feNew = false; }
 function applyFormula() {
  if (!feEq) return; var v = $('textarea', feM).value.trim(), b = feBlock;
  if (b) snap(b);
  if (!v) rm(feEq); else { feEq.dataset.tex = v; renderEq(feEq); }
  feNew = false; closeFormula(true); markDirty(b); relay(b);
 }
 function relay(b) { var o = b && optsOf(b); if (o && o.onRelayout) o.onRelayout(); }
 PE.insertFormula = function () {
  if (!PE.on) { toast('먼저 [고치기]를 켜 주세요'); return; }
  if (!lastRange) { toast('먼저 글 안에서 수식을 넣을 자리를 한 번 클릭해 주세요'); return; }
  var anc = lastRange.startContainer; anc = anc.nodeType === 1 ? anc : anc.parentNode; var b = blockOf(anc);
  if (b) snap(b);
  var s = document.createElement('span'); s.className = 'eq'; s.dataset.tex = ''; s.setAttribute('contenteditable', 'false');
  lastRange.collapse(false); lastRange.insertNode(s); openFormula(s, true);
 };
 document.addEventListener('selectionchange', function () {
  var sel = window.getSelection(); if (!sel.rangeCount) return; var r = sel.getRangeAt(0), n = r.startContainer, el = n.nodeType === 1 ? n : n.parentNode;
  if (el && el.closest && el.closest('.pe-ed') && el.closest('[data-pe-root]')) lastRange = r.cloneRange();
 });
 document.addEventListener('dblclick', function (e) {
  var q = e.target.closest && e.target.closest('.eq'); if (!q || !PE.on) return;
  if (q.closest('[data-pe-root]') || q.closest('.pe-exp')) { e.preventDefault(); openFormula(q, false); }
 });
 document.addEventListener('paste', function (e) {
  var t = e.target; if (!t.closest || !t.closest('.pe-ed,.pe-exp')) return; e.preventDefault();
  var tx = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, tx);
 });
 document.addEventListener('beforeinput', function (e) {
  var t = e.target; if (!t.closest) return; var b = t.closest('.pe-ed') && blockOf(t);
  if (b && Date.now() - lastType > 2500) { snap(b); lastType = Date.now(); }
 });
 document.addEventListener('input', function (e) {
  var t = e.target.nodeType === 1 ? e.target : e.target.parentNode; if (!t || !t.closest) return;
  var b = t.closest('.pe-ed') && blockOf(t); if (b) markDirty(b);
 });
 document.addEventListener('keydown', function (e) {
  if (!(e.ctrlKey || e.metaKey) || (e.target.closest && e.target.closest('.pe-ed,input,textarea,select,.pe-exp'))) return;
  if (!PE.roots.length) return;
  var k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); PE.undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); PE.redo(); }
 });

 /* ───────── 그림: 눌러서 고르기 → 크기·위치·정렬·지우기, 끌어서 이동, 모서리로 크기 ───────── */
 var selImg = null, dragSt = null, itBox = null, ihBox = null;
 function ensureIt() {
  if (itBox) return;
  itBox = document.createElement('div'); itBox.className = 'pe-it'; itBox.hidden = true;
  itBox.innerHTML = '<button data-i="sm">작게</button><button data-i="lg">크게</button><span class="pct"></span><button data-i="l">←</button><button data-i="r">→</button><button data-i="u">↑</button><button data-i="d">↓</button><button data-i="ctr">가운데</button><button data-i="al">왼쪽</button><button data-i="ar">오른쪽</button><button data-i="del" class="red">그림 지우기</button>';
  ihBox = document.createElement('div'); ihBox.className = 'pe-ih'; ihBox.hidden = true; ihBox.title = '끌어서 크기 바꾸기';
  document.body.appendChild(itBox); document.body.appendChild(ihBox);
  itBox.addEventListener('mousedown', function (e) { e.preventDefault(); });
  itBox.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) imgAction(b.dataset.i); });
  ihBox.addEventListener('pointerdown', function (e) {
   if (!selImg) return; e.preventDefault(); var b = blockOf(selImg); snap(b);
   var q = stemEl(b);
   dragSt = { x: e.clientX, w: selImg.getBoundingClientRect().width, qw: q.getBoundingClientRect().width, im: selImg, mode: 'size', b: b };
   ihBox.setPointerCapture(e.pointerId);
  });
 }
 function sc() { return PE.scale() || 1; }
 function selectImg(im) { ensureIt(); if (selImg && selImg !== im) selImg.classList.remove('pe-sel'); selImg = im; im.classList.add('pe-sel'); placeIt(); }
 function deselect() { if (selImg) selImg.classList.remove('pe-sel'); selImg = null; if (itBox) { itBox.hidden = true; ihBox.hidden = true; } }
 function placeIt() {
  if (!selImg || !selImg.isConnected) { deselect(); return; }
  var r = selImg.getBoundingClientRect(); itBox.hidden = false; ihBox.hidden = false;
  var b = blockOf(selImg), q = b ? stemEl(b) : null, qw = q ? q.getBoundingClientRect().width : 1;
  $('.pct', itBox).textContent = Math.round(r.width / qw * 100) + '%';
  var top = r.top - itBox.offsetHeight - 8; if (top < 4) top = Math.min(window.innerHeight - itBox.offsetHeight - 8, r.bottom + 8);
  itBox.style.top = top + 'px'; itBox.style.left = Math.max(6, Math.min(window.innerWidth - itBox.offsetWidth - 6, r.left + r.width / 2 - itBox.offsetWidth / 2)) + 'px';
  ihBox.style.left = (r.right - 7) + 'px'; ihBox.style.top = (r.bottom - 7) + 'px';
 }
 function setPct(im, pct) { pct = Math.max(8, Math.min(100, pct)); im.style.width = pct.toFixed(1) + '%'; im.style.maxWidth = 'none'; im.style.maxHeight = 'none'; im.style.height = 'auto'; }
 function curPct(im) { var b = blockOf(im), q = stemEl(b); return im.getBoundingClientRect().width / q.getBoundingClientRect().width * 100; }
 function setOff(im, dx, dy) { im.dataset.dx = Math.round(dx); im.dataset.dy = Math.round(dy); im.style.transform = (dx || dy) ? 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px)' : ''; }
 function imgAction(a) {
  var im = selImg; if (!im) return; var b = blockOf(im); snap(b);
  var dx = +im.dataset.dx || 0, dy = +im.dataset.dy || 0, p = im.parentNode;
  if (a === 'sm') setPct(im, curPct(im) * 0.9); else if (a === 'lg') setPct(im, curPct(im) * 1.1);
  else if (a === 'l') setOff(im, dx - 6, dy); else if (a === 'r') setOff(im, dx + 6, dy); else if (a === 'u') setOff(im, dx, dy - 6); else if (a === 'd') setOff(im, dx, dy + 6);
  else if (a === 'ctr') { setOff(im, 0, 0); if (p) p.style.textAlign = 'center'; } else if (a === 'al' && p) p.style.textAlign = 'left'; else if (a === 'ar' && p) p.style.textAlign = 'right';
  else if (a === 'del') { var pp = im.parentNode; deselect(); rm(im); if (pp && pp.tagName === 'P' && !pp.querySelector('img') && !pp.textContent.trim()) rm(pp); markDirty(b); relay(b); return; }
  markDirty(b); placeIt(); relay(b);
 }
 document.addEventListener('pointerdown', function (e) {
  var im = e.target.closest && e.target.closest('img.fig');
  if (im && PE.on && im.closest('[data-pe-root]') && blockOf(im) && im.closest('.pe-ed')) {
   e.preventDefault(); var b = blockOf(im); snap(b); selectImg(im);
   dragSt = { x: e.clientX, y: e.clientY, dx: +im.dataset.dx || 0, dy: +im.dataset.dy || 0, im: im, mode: 'move', b: b };
   return;
  }
  if (selImg && !(e.target.closest && e.target.closest('.pe-it,.pe-ih'))) deselect();
 }, true);
 window.addEventListener('pointermove', function (e) {
  if (!dragSt) return; var im = dragSt.im;
  if (dragSt.mode === 'move') setOff(im, dragSt.dx + (e.clientX - dragSt.x) / sc(), dragSt.dy + (e.clientY - dragSt.y) / sc());
  else setPct(im, (dragSt.w + (e.clientX - dragSt.x)) / dragSt.qw * 100);
  placeIt();
 });
 window.addEventListener('pointerup', function () { if (dragSt) { markDirty(dragSt.b); var b = dragSt.b; dragSt = null; relay(b); } });
 window.addEventListener('scroll', function () { if (selImg) placeIt(); }, true);

 /* ───────── 객관식 보기 지우기 ───────── */
 function renumber(b) {
  var o = optsOf(b); if (!o.ch) return;
  qa(b, o.ch + ' > span').forEach(function (sp, i) { var m = sp.querySelector('b'); if (m) m.textContent = CIRC[i] || ''; });
 }
 function wireChoices(b) {
  var o = optsOf(b); if (!o.ch) return;
  qa(b, o.ch + ' > span').forEach(function (sp) {
   if (sp.querySelector('.pe-cx')) return;
   var x = document.createElement('button'); x.type = 'button'; x.className = 'pe-cx'; x.title = '이 보기 지우기'; x.textContent = '×'; x.contentEditable = 'false'; sp.appendChild(x);
  });
 }
 document.addEventListener('click', function (e) {
  var x = e.target.closest && e.target.closest('.pe-cx'); if (!x) return;
  var b = blockOf(x), o = optsOf(b); snap(b);
  var sp = x.parentNode, wrap = sp.parentNode; rm(sp); renumber(b);
  if (!wrap.querySelector(':scope > span')) rm(wrap);
  markDirty(b); relay(b);
 });

 /* ───────── 정보 수정 창 (종류 · 정답 · 분류 · 해설) + DB 등록 ───────── */
 var LEVELS = ['', '하', '중하', '중', '중상', '상', '킬러'], FORMS = ['', '일반', '조건형', '보기형', '그림'];
 function opts(list, cur) { return list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === (cur || '') ? ' selected' : '') + '>' + esc(v || '(비움)') + '</option>'; }).join(''); }
 /* 정보 수정 창: getCurrent() = {stem, ch}(현재 화면의 글 · 보기, 없으면 글은 건드리지 않음) */
 PE.openMeta = async function (h, getCurrent, onSaved, title) {
  if (!h) { toast('서버 문제 DB와 연결되지 않은 문제라 등록할 수 없어요 (직접 입력한 문제 등)'); return; }
  toast('서버에서 정보를 불러오는 중…', 1500);
  var j = await call('get', { hashes: [h] });
  if (!j || !j.ok) { toast((j && j.error) || '정보를 불러오지 못했어요', 5000); return; }
  var it = (j.items || [])[0];
  if (!it) { toast('서버 문제 DB에 없는 문제예요. 먼저 problemimport.html 로 문제를 올려 주세요', 5000); return; }
  var tg = it.tags || {}, cur = getCurrent ? getCurrent() : null;
  var srcs = (it.src || []).map(function (s) { return esc((s.kind || '') + ' · ' + (s.title || '') + ' · ' + (s.number || '') + '번' + (s.points != null ? ' · ' + s.points + '점' : '') + (s.note ? ' · ' + s.note : '')); }).join('<br>') || '출처 기록 없음';
  var chg = cur && ((cur.stem || '') !== (it.stem || '') || JSON.stringify(cur.ch || []) !== JSON.stringify(it.ch || []));
  var m = dlg('<div class="pe-h"><b>정보 수정 · DB 등록' + (title ? ' — ' + esc(title) : '') + '</b><button class="pe-x2" data-c="1">닫기</button></div>'
   + '<div class="pe-src"><b>출처</b><br>' + srcs + (it.edited_at ? '<br><span class="pe-ok">서버에서 이미 고친 적 있어요 (' + esc(it.edited_at) + ')</span>' : '') + '</div>'
   + '<div class="pe-grid" style="margin-top:8px">'
   + '<label>종류<select id="peKind">' + [['mc', '객관식'], ['short', '단답형'], ['essay', '서술형']].map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === it.kind ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select></label>'
   + '<label>정답<input type="text" id="peAns" value="' + esc(it.answer || '') + '"></label>'
   + '<label>정답 메모 (서술형 채점 기준 등)<input type="text" id="peAnsN" value="' + esc(it.answer_note || '') + '"></label>'
   + '<label>과목<input type="text" id="peCourse" value="' + esc(tg.course || '') + '" list="peDlCourse"></label><label>단원<input type="text" id="peUnit" value="' + esc(tg.unit || '') + '"></label><label>소단원<input type="text" id="peSub" value="' + esc(tg.subunit || '') + '"></label>'
   + '<label>유형 이름<input type="text" id="peSkill" value="' + esc(tg.skill || '') + '"></label><label>난이도<select id="peLevel">' + opts(LEVELS, tg.level) + '</select></label><label>형태<select id="peForm">' + opts(FORMS, tg.form) + '</select></label>'
   + '<label>메모<input type="text" id="peNote" value="' + esc(tg.note || '') + '"></label><label style="flex-direction:row;align-items:center;gap:6px;margin-top:16px"><input type="checkbox" id="peEss"' + (tg.essential ? ' checked' : '') + '> 필수유형</label>'
   + '<label style="flex-direction:row;align-items:center;gap:6px;margin-top:16px"><input type="checkbox" id="peStemOn"' + (chg ? ' checked' : '') + (cur ? '' : ' disabled') + '> 화면에서 고친 문제 글·그림·보기도 함께 등록' + (chg ? ' (고친 곳 있음)' : '') + '</label></div>'
   + '<datalist id="peDlCourse"><option value="공통수학1"><option value="공통수학2"></datalist>'
   + '<div style="margin-top:8px"><b style="font-size:13px">해설</b> <span class="pe-p">(글은 바로 고치고, 수식은 더블클릭하면 LaTeX 창이 열려요)</span><div class="pe-exp" id="peExp" contenteditable="true"></div></div>'
   + '<div class="pe-row"><button class="pe-b" id="peSave">서버 문제 DB에 등록</button><button class="pe-b g" data-c="1">닫기</button><span id="peMsg" class="pe-p"></span></div>', '860px');
  var ex = $('#peExp', m); ex.innerHTML = it.exp || '<p></p>'; prepare(ex); var expTouched = false;
  ex.addEventListener('input', function () { expTouched = true; });
  m.addEventListener('click', function (e) { if (e.target.dataset && e.target.dataset.c) { if (feM) return; closeDlg(m); } });
  $('#peSave', m).onclick = async function () {
   var btn = this; btn.disabled = true; $('#peMsg', m).textContent = '등록하는 중…';
   var item = { h: h, kind: $('#peKind', m).value, answer: $('#peAns', m).value.trim(), answer_note: $('#peAnsN', m).value.trim(),
    tags: { course: $('#peCourse', m).value.trim(), unit: $('#peUnit', m).value.trim(), subunit: $('#peSub', m).value.trim(), skill: $('#peSkill', m).value.trim(), level: $('#peLevel', m).value, form: $('#peForm', m).value, essential: $('#peEss', m).checked, note: $('#peNote', m).value.trim() } };
   if (cur && $('#peStemOn', m).checked) { item.stem = cur.stem; item.ch = cur.ch; }
   if (expTouched) item.exp = ser(ex);
   var r = await call('save', { items: [item] });
   btn.disabled = false;
   if (r && r.ok && r.updated) { $('#peMsg', m).innerHTML = '<span class="pe-ok">등록했어요 ✔ (처음 글은 서버에 남겨 뒀어요)</span>'; if (onSaved) onSaved(item); }
   else $('#peMsg', m).innerHTML = '<span class="pe-err">' + esc((r && r.error) || (r && r.missing ? '서버 문제 DB에 없는 문제예요' : '등록하지 못했어요')) + '</span>';
  };
 };
 /* 고친 문제 글만 한꺼번에 등록 */
 PE.saveBlocks = async function (blocks) {
  var items = blocks.filter(function (b) { return b.dataset.h; }).map(function (b) { var c = collect(b); return { h: c.h, stem: c.stem, ch: c.ch }; });
  if (!items.length) { toast('서버 문제 DB와 연결된 고친 문제가 없어요'); return null; }
  var j = await call('save', { items: items });
  if (j && j.ok) {
   blocks.forEach(function (b) { b.classList.remove('pe-dirty'); b.dataset.peDirty = '0'; var o = optsOf(b); if (o && o.onChange) o.onChange(b, true); }); updBar();
   toast('서버 문제 DB에 ' + j.updated + '개 등록했어요' + (j.missing ? ' (서버에 없는 문제 ' + j.missing + '개는 건너뜀)' : ''), 4500);
  } else toast((j && j.error) || '등록하지 못했어요', 5000);
  return j;
 };

 /* ───────── 붙이기 ───────── */
 var bar = null;
 function updBar() {
  if (!bar) return; var n = PE.dirty().length;
  $('.pe-n', bar).textContent = n ? '고친 문제 ' + n + '개' : '고친 곳 없음';
  $('.pe-reg', bar).disabled = !n; $('.pe-un', bar).disabled = !undoS.length; $('.pe-re', bar).disabled = !redoS.length;
 }
 function makeBar() {
  bar = document.createElement('div'); bar.className = 'pe-bar';
  bar.innerHTML = '<b>문제 고치기</b><button class="pe-tg">켬</button><button class="g pe-fm" title="글 안에서 커서를 둔 곳에 수식을 넣어요">수식 넣기</button><button class="g pe-un" title="Ctrl+Z">되돌리기</button><button class="g pe-re" title="Ctrl+Y">다시하기</button><span class="pe-n"></span><button class="pe-reg" title="고친 문제를 서버의 문제 DB에 등록해요 (원장 비밀번호)">고친 문제 DB 등록</button>';
  document.body.appendChild(bar);
  bar.addEventListener('mousedown', function (e) { if (e.target.closest('.pe-fm')) e.preventDefault(); });
  bar.addEventListener('click', function (e) {
   var t = e.target.closest('button'); if (!t) return;
   if (t.classList.contains('pe-tg')) PE.setEdit(!PE.on);
   else if (t.classList.contains('pe-fm')) PE.insertFormula();
   else if (t.classList.contains('pe-un')) PE.undo(); else if (t.classList.contains('pe-re')) PE.redo();
   else if (t.classList.contains('pe-reg')) { var ds = PE.dirty(); if (ds.length && confirm('고친 문제 ' + ds.length + '개를 서버의 문제 DB에 등록할까요?\n(서버의 원본 글은 따로 남겨 두고, 이 수정본으로 바뀝니다)')) PE.saveBlocks(ds); }
  });
  updBar();
 }
 PE.setEdit = function (on) {
  PE.on = on; PE.roots.forEach(function (r) {
   r.classList.toggle('pe-edit', on); r.classList.toggle('pe-view', !on);
   qa(r, '.pe-ed').forEach(function (e) { e.setAttribute('contenteditable', on ? 'true' : 'false'); });
   qa(r, '.eq').forEach(function (e) { e.setAttribute('contenteditable', 'false'); });
  });
  if (bar) $('.pe-tg', bar).textContent = on ? '켬' : '끔';
  if (!on) deselect();
 };
 PE.setupBlock = function (b) {
  var o = optsOf(b); if (!o) return;
  b.classList.add('pe-pb');
  var se = stemEl(b); se.classList.add('pe-ed'); prepare(se);
  qa(b, o.ch ? o.ch + ' ' + o.cv : '.__none').forEach(function (cv) { cv.classList.add('pe-ed'); prepare(cv); });
  wireChoices(b);
  if (!b.querySelector(':scope > .pe-tools')) {
   var tl = document.createElement('div'); tl.className = 'pe-tools'; tl.setAttribute('contenteditable', 'false');
   var h = '<button data-pe="meta" title="종류·정답·단원·난이도·해설 고치기, 서버 문제 DB에 등록">정보·DB</button>';
   if (o.ch && b.querySelector(o.ch)) h += '<button class="g" data-pe="nochoice" title="보기를 모두 지워 단답형으로">객관식 지우기</button>';
   h += '<button class="g" data-pe="reset" title="고친 글·수식·그림을 처음 상태로">원래대로</button>';
   (o.extraTools || []).forEach(function (t, i) { h += '<button class="' + (t.cls || 'g') + '" data-pe-x="' + i + '" title="' + esc(t.title || '') + '">' + esc(t.label) + '</button>'; });
   tl.innerHTML = h; b.appendChild(tl);
   var fl = document.createElement('i'); fl.className = 'pe-flag'; fl.setAttribute('contenteditable', 'false'); b.appendChild(fl);
  }
  b._peOrig = collect(b);
 };
 document.addEventListener('click', function (e) {
  var bt = e.target.closest && e.target.closest('.pe-tools button'); if (!bt) return;
  var b = blockOf(bt); if (!b) return; var o = optsOf(b);
  if (bt.dataset.peX != null) { o.extraTools[+bt.dataset.peX].fn(b, bt); return; }
  var a = bt.dataset.pe;
  if (a === 'meta') PE.openMeta(b.dataset.h, function () { var c = collect(b); return { stem: c.stem, ch: c.ch }; }, function () { b.classList.remove('pe-dirty'); b.dataset.peDirty = '0'; if (o.onChange) o.onChange(b, true); updBar(); }, o.titleOf ? o.titleOf(b) : '');
  else if (a === 'nochoice') { snap(b); var w = b.querySelector(o.ch); rm(w); markDirty(b); relay(b); toast('보기를 지웠어요. 정보·DB 에서 종류를 단답형으로 바꿔 등록하세요'); }
  else if (a === 'reset') {
   if (!confirm('이 문제에서 고친 글·수식·그림을 처음 상태로 되돌릴까요?')) return;
   snap(b); var og = b._peOrig; if (!og) return; var se = stemEl(b); se.innerHTML = og.stem; prepare(se);
   if (o.ch && og.ch.length && !b.querySelector(o.ch)) toast('지운 보기는 [되돌리기]로 살려 주세요');
   qa(b, o.ch ? o.ch + ' ' + o.cv : '.__none').forEach(function (cv, i) { if (og.ch[i] != null) { cv.innerHTML = og.ch[i]; prepare(cv); } });
   b.classList.remove('pe-dirty'); b.dataset.peDirty = '0'; if (o.onChange) o.onChange(b, true); updBar(); relay(b);
  }
 });
 PE.attach = function (root, o) {
  o = o || {}; o.block = o.block || '.q'; o.stem = o.stem === undefined ? '.qb' : o.stem; o.ch = o.ch === undefined ? '.ch' : o.ch; o.cv = o.cv || '.cv';
  if (o.figs) Object.keys(o.figs).forEach(function (k) { PE.figs[k] = o.figs[k]; });
  if (o.scale) PE.scale = o.scale;
  root.setAttribute('data-pe-root', '1'); root._peo = o; if (PE.roots.indexOf(root) < 0) PE.roots.push(root);
  qa(root, o.block).forEach(PE.setupBlock);
  if (o.bar !== false && !bar) makeBar();
  PE.setEdit(true); updBar();
 };
 PE.refresh = updBar;
 PE.ownDialog = dlg; PE.closeDialog = closeDlg;
})();
