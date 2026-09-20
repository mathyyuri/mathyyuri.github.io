/* wrongnote-variant.js — 일일일모 오답노트(dailyquizwrongnote.html)에서 카드별로 "AI 변형 문제"를 만들어 교체한다.
 * 학생들이 정답 번호·값을 외워 버려서 오답노트가 의미를 잃는 문제를 막기 위한 기능:
 *   카드마다 [변형 만들기] → AI가 변형(기본 1단계: 숫자·계수만 바꾸고 정답이 달라지게) → 두 AI(Sonnet·Gemini)가 검증
 *   → 원장님이 확인하고 [이 변형으로 교체] → 지문/그림/선지/정답/풀이가 변형 문제로 바뀐다(인쇄도 변형 기준).
 * 교체 내용은 이 브라우저에 저장돼서 새로고침해도 유지된다. 만들기 로직은 mathvariant.html 과 같은 백엔드(action=mathvariant)를 쓴다.
 * 필요(페이지 전역): GAS_URL, myKey, escapeHtml, renderMath, choicesHtml
 */
(function () {
  const LEVELS = { 1: ['숫자·계수만 바꾸기', '풀이 방법은 그대로, 숫자와 계수만 바꿔요.'], 2: ['표현 바꿔쓰기', '숫자 + 문장·조건의 표현/순서를 바꿔요. 풀이 방법은 같아요.'], 3: ['조건 추가·변경', '같은 개념에서 조건을 바꾸거나 하나 더해 풀이 흐름이 조금 달라져요.'] };
  const CIR = ['①', '②', '③', '④', '⑤'];
  const STORE = 'dqwn_variants_v1';
  const FORMAT_RULE = '각 변형 문제를 아래 태그 형식으로만 출력하세요(다른 글은 쓰지 마세요). 객관식이 아니면 <choices> 줄을, 그림이 필요 없으면 <figure> 줄을 생략합니다.\n' +
    '<variant>\n<problem>문제 본문</problem>\n<figure><svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">…필요할 때만…</svg></figure>\n<choices><c>①에 들어갈 내용</c><c>②</c><c>③</c><c>④</c><c>⑤</c></choices>\n<answer>정답 (객관식이면 번호와 값)</answer>\n<solution>간단한 풀이(검산 포함)</solution>\n<changes>원문에서 무엇을 어떻게 바꿨는지 한 줄</changes>\n</variant>';

  /* ---- 통신 (mathvariant.html 과 동일) ---- */
  let cfg = { url: () => GAS_URL, key: () => myKey };   // studentnote.html 은 setup({url, key})로 바꿔 쓴다
  let jc = 0;
  function jsonp(params, timeout) {
    return new Promise((resolve, reject) => {
      const cb = 'wv_cb_' + (jc++) + '_' + Date.now(), s = document.createElement('script');
      const t = setTimeout(() => { clean(); reject(new Error('요청 시간 초과')); }, timeout || 30000);
      function clean() { clearTimeout(t); delete window[cb]; s.remove(); }
      window[cb] = d => { clean(); d && d.ok ? resolve(d) : reject(new Error((d && d.error) || '서버 오류')); };
      s.src = cfg.url() + '?' + new URLSearchParams({ ...params, callback: cb }).toString();
      s.onerror = () => { clean(); reject(new Error('스크립트 로드 실패')); };
      document.body.appendChild(s);
    });
  }
  async function askAI(msgs, opts) {
    opts = opts || {};
    const jobId = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    fetch(cfg.url(), { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'mathvariant', key: cfg.key(), jobId, messages: msgs, mode: opts.mode || 'gen', model: opts.model || '', images: opts.images || [] }) }).catch(() => {});
    const start = Date.now();
    await new Promise(r => setTimeout(r, 4000));
    while (Date.now() - start < 170000) {
      try { const r = await jsonp({ action: 'mathvariantresult', key: cfg.key(), jobId }); if (!r.pending) return r; }
      catch (e) { if (!/시간 초과|로드 실패/.test(e.message)) throw e; }
      await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('AI 응답이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.');
  }

  /* ---- 파싱/비교 ---- */
  const tag = (s, name) => { const m = s.match(new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>')); return m ? m[1].trim() : ''; };
  function sanitizeSvg(svg) {
    const m = String(svg || '').match(/<svg[\s\S]*<\/svg>/i); if (!m) return '';
    return m[0].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '').replace(/(href|xlink:href)\s*=\s*("|')\s*(javascript:|https?:)[^"']*\2/gi, '');
  }
  function parseVariant(text) {
    const m = text.match(/<variant>([\s\S]*?)<\/variant>/); if (!m) return null; const b = m[1];
    return { problem: tag(b, 'problem'), figure: sanitizeSvg(tag(b, 'figure')), choices: [...tag(b, 'choices').matchAll(/<c>([\s\S]*?)<\/c>/g)].map(x => x[1].trim()), answer: tag(b, 'answer'), solution: tag(b, 'solution'), changes: tag(b, 'changes') };
  }
  function normAns(s) {
    return String(s || '').replace(/[①-⑤]/g, '').replace(/\\\(|\\\)|\$/g, '')
      .replace(/√\s*(\d+(?:\.\d+)?|[a-zA-Z])/g, '\\sqrt{$1}').replace(/\\sqrt\s*(\d+|[a-zA-Z])/g, '\\sqrt{$1}')
      .replace(/\\left|\\right|\\displaystyle|\\,|\\;|\\!|\\ /g, '').replace(/\\[dt]frac/g, '\\frac')
      .replace(/\^\s*(\d|[a-zA-Z])/g, '^{$1}').replace(/_\s*(\d|[a-zA-Z])/g, '_{$1}')
      .replace(/\\cdot|\\times|×|·|\*/g, '').replace(/[−–]/g, '-').replace(/정답|답|최솟값|최댓값|값은|이다|입니다|번|[\s.]/g, '');
  }
  function sameAnswer(declared, got) {
    const cd = (declared.match(/[①-⑤]/) || [])[0], cg = (got.match(/[①-⑤]/) || [])[0];
    if (cd && cg) return cd === cg;
    const nd = (declared.match(/^\s*([1-5])\s*번?\s*$/) || [])[1], ng = (got.match(/^\s*([1-5])\s*번?\s*$/) || [])[1];
    if ((cd || nd) && (cg || ng)) return String(cd ? CIR.indexOf(cd) + 1 : nd) === String(cg ? CIR.indexOf(cg) + 1 : ng);
    const x = normAns(declared), y = normAns(got);
    return x === y || (x.length > 1 && y.includes(x)) || (y.length > 1 && x.includes(y));
  }

  /* ---- 원본 문제 HTML → AI에게 줄 글 (수식은 $...$) ---- */
  function htmlToText(html) {
    const d = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html').body.firstChild;
    const imgs = [];
    d.querySelectorAll('.eq').forEach(e => e.replaceWith('$' + e.textContent.replace(/^\s*\\\(|\\\)\s*$/g, '').trim() + '$'));
    d.querySelectorAll('img').forEach(im => { if (/^data:image\//.test(im.getAttribute('src') || '')) imgs.push(im.getAttribute('src')); im.replaceWith('[그림]'); });
    d.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
    d.querySelectorAll('p,div,tr').forEach(p => p.append('\n'));
    return { text: d.textContent.replace(/[ \t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(), imgs };
  }
  function toPng(uri) {
    return new Promise(res => {
      const im = new Image();
      im.onload = () => { const k = Math.min(1, 1100 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/png')); };
      im.onerror = () => res(null); im.src = uri;
    });
  }

  /* ---- 화면용 변환: $..$ → \(..\) ---- */
  const mathHtml = t => escapeHtml(t).replace(/\$\$([^$]+)\$\$|\$([^$]+)\$/g, (m, a, b) => '\\(' + (a || b) + '\\)').replace(/\n/g, '<br>');
  function answerText(v) {
    const a = v.answer.trim(), only = a.match(/^([①-⑤])\s*(?:번)?$/) || a.match(/^([1-5])\s*번?$/);
    if (only) { const i = /[①-⑤]/.test(only[1]) ? CIR.indexOf(only[1]) : Number(only[1]) - 1; const c = v.choices[i]; return c ? c.replace(/^[①-⑤]\s*/, '') : a; }
    return a.replace(/^[①-⑤]\s*/, '');
  }

  /* ---- 저장 ---- */
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; } };
  const save = o => { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) {} };
  const skey = (name, key) => name + '|' + key;

  /* ---- 카드에 변형 적용/되돌리기 ---- */
  function applyVariant(card, v) {
    const stem = card.querySelector('.stem'), wrap = card.querySelector('.choiceWrap'), sol = card.querySelector('.solBox'), yt = card.querySelector('.ytFacade,.ytIframe');
    if (!card.__orig) card.__orig = { stem: stem.innerHTML, wrap: wrap ? wrap.innerHTML : null, sol: sol.innerHTML, yt: yt ? yt.style.display : null };
    stem.innerHTML = mathHtml(v.problem) + (v.figure ? `<div style="text-align:center;margin:10px 0">${v.figure}</div>` : '');
    if (wrap && v.choices.length) wrap.innerHTML = choicesHtml(v.choices.map((c, i) => /^[①-⑤]/.test(c) ? c : CIR[i] + ' ' + c).map(mathHtml));
    sol.innerHTML = `<div class="ans">정답: ${mathHtml(answerText(v))}</div><div class="expl"><b>풀이</b><br>${mathHtml(v.solution || '')}</div>`;
    if (yt) yt.style.display = 'none';
    card.classList.add('isVariant'); renderMath(card);
  }
  function revertVariant(card) {
    const o = card.__orig; if (!o) return;
    card.querySelector('.stem').innerHTML = o.stem; const wrap = card.querySelector('.choiceWrap'); if (wrap && o.wrap != null) wrap.innerHTML = o.wrap;
    card.querySelector('.solBox').innerHTML = o.sol; const yt = card.querySelector('.ytFacade,.ytIframe'); if (yt) yt.style.display = o.yt || '';
    card.classList.remove('isVariant'); card.__orig = null; renderMath(card);
  }

  /* ---- 검증 (mathvariant.html 과 같은 방식) ---- */
  async function verify(v, model) {
    const body = '[문제]\n' + v.problem + (v.figure ? '\n\n[그림(SVG 코드)]\n' + v.figure : '') + (v.choices.length ? '\n\n[보기]\n' + v.choices.map((c, i) => /^[①-⑤]/.test(c) ? c : CIR[i] + ' ' + c).join('\n') : '\n\n(주관식)');
    try {
      const res = await askAI([{ role: 'user', content: body }], { mode: 'verify', model });
      const verdict = tag(res.text, 'verdict').toUpperCase(), ans = tag(res.text, 'answer'), issue = tag(res.text, 'issue');
      const same = sameAnswer(v.answer, ans), vok = verdict.includes('OK');
      return { ok: vok && same, same, ans, issue: /^없음/.test(issue) ? '' : issue };
    } catch (e) { return { err: e.message }; }
  }
  const NAMES = { 'claude-sonnet-5': 'Sonnet', gemini: 'Gemini' };
  const badge = (m, r) => r.err ? `<span class="vb bad" title="${escapeHtml(r.err)}">${NAMES[m]} 검증 실패</span>` : r.ok ? `<span class="vb good">${NAMES[m]} ✅ 일치</span>` : `<span class="vb bad" title="${escapeHtml(r.issue || '')}">${NAMES[m]} ⚠️ ${r.same ? '문제 결함 지적' : '정답 불일치 (AI 답 ' + escapeHtml(r.ans) + ')'}</span>`;

  /* ---- UI ---- */
  function slotHtml() {
    return `<span class="varCtl"><select class="varLvl"><option value="1">1단계 · 숫자만 바꾸기</option><option value="2">2단계 · 표현 바꾸기</option><option value="3">3단계 · 조건 바꾸기</option></select> ` +
      `<button type="button" class="varGen">🔄 변형 문제 만들기</button></span> <span class="varMsg"></span><div class="varPrev"></div>`;
  }
  // 원본 문제(it: {stemHtml, choices, answer}) → 변형 1개 + 두 AI 검증. onStatus(글)로 진행 상황을 알려준다.
  async function makeVariant(it, lv, onStatus) {
    const t0 = Date.now(), tick = setInterval(() => onStatus('⏳ AI가 변형 문제를 만드는 중… ' + Math.round((Date.now() - t0) / 1000) + '초'), 1000);
    try {
      const stem = htmlToText(it.stemHtml);
      const choices = (it.choices || []).map(c => htmlToText(c)); const choiceImgs = choices.reduce((a, c) => a.concat(c.imgs), []);
      const imgs = []; for (const u of stem.imgs.concat(choiceImgs).slice(0, 3)) { const p = await toPng(u); if (p) imgs.push(p); }
      const orig = stem.text + (choices.length ? '\n\n[보기]\n' + choices.map(c => c.text).join('\n') : '') + (it.answer ? '\n\n[원문 정답] ' + it.answer + '번' : '');
      const first = '[원본 문제]\n' + orig + '\n\n[요청]\n- 변형 단계: ' + lv + '단계 (' + LEVELS[lv][0] + ': ' + LEVELS[lv][1] + ')\n- 만들 문제 수: 1개\n- 형식: 원문과 같은 형식\n- 난이도: 원문과 비슷한 난이도\n- 그림: 그림이 꼭 필요한 문제에만 SVG 그림 포함\n' +
        '- 추가 요구: 학생들이 원문의 정답(번호와 값)을 외우고 있으니, 변형 문제의 정답 값이 원문과 달라지게 하고 객관식이면 정답 번호도 원문과 다른 번호가 되게 선지를 배치하세요.\n\n' + FORMAT_RULE;
      const res = await askAI([{ role: 'user', content: first }], { images: imgs });
      const v = parseVariant(res.text);
      if (!v || !v.problem) throw new Error('AI 답변을 문제로 읽지 못했어요. 다시 시도해 주세요.');
      clearInterval(tick); onStatus('검증 중… (Sonnet + Gemini)');
      const ms = ['claude-sonnet-5', 'gemini'];
      const rs = await Promise.all(ms.map(m => verify(v, m)));
      return { v, ms, rs, allGood: rs.every(r => r.ok), anyErr: rs.some(r => r.err) };
    } finally { clearInterval(tick); }
  }
  // 문제(지문·그림·보기)는 그대로 두고 정답·풀이만 원장님 지적을 반영해 다시 푼다 → 두 AI로 다시 검증
  async function reviseVariant(v, instruction, model) {
    const body = '[문제]\n' + v.problem + (v.figure ? '\n\n[그림(SVG 코드)]\n' + v.figure : '') +
      (v.choices.length ? '\n\n[보기]\n' + v.choices.map((c, i) => /^[①-⑤]/.test(c) ? c : CIR[i] + ' ' + c).join('\n') : '\n\n(주관식)') +
      '\n\n[현재 정답]\n' + v.answer + '\n\n[현재 풀이]\n' + v.solution + '\n\n[원장님 지적]\n' + (instruction || '정답과 풀이가 맞는지 처음부터 다시 풀어서 확인하고 틀렸으면 고쳐 주세요.');
    const res = await askAI([{ role: 'user', content: body }], { mode: 'solve', model: model || 'claude-sonnet-5' });
    const answer = tag(res.text, 'answer'), solution = tag(res.text, 'solution');
    if (!answer) throw new Error('AI 답변을 읽지 못했어요. 다시 시도해 주세요.');
    return { ...v, answer, solution: solution || v.solution };
  }
  // 미리보기(prev)의 "다시 풀기" 버튼을 연결한다. redraw()는 호출한 쪽이 미리보기를 다시 그리는 함수.
  function bindRevise(prev, r, redraw) {
    const btn = prev.querySelector('.varRevBtn'); if (!btn) return;
    btn.onclick = async () => {
      const msg = prev.querySelector('.revMsg'), inp = prev.querySelector('.revIn'), model = prev.querySelector('.revModel').value;
      btn.disabled = true; msg.className = 'varMsg revMsg';
      const t0 = Date.now(), tick = setInterval(() => { msg.textContent = '⏳ 다시 푸는 중… ' + Math.round((Date.now() - t0) / 1000) + '초'; }, 1000);
      try {
        const nv = await reviseVariant(r.v, inp.value.trim(), model);
        clearInterval(tick); msg.textContent = '검증 중… (Sonnet + Gemini)';
        r.v = nv; r.rs = await Promise.all(r.ms.map(m => verify(nv, m)));
        r.allGood = r.rs.every(x => x.ok); r.anyErr = r.rs.some(x => x.err); r.reverified = true;
        redraw();
      } catch (e) { clearInterval(tick); msg.textContent = '⚠️ ' + e.message; msg.className = 'varMsg revMsg err'; btn.disabled = false; }
    };
  }
  // 미리보기의 "직접 고치기" 적용 + "검증하기" 버튼 연결. 직접 고친 내용은 그대로 r.v 에 반영(검증은 원하면 따로).
  function bindEdit(prev, r, redraw) {
    const ap = prev.querySelector('.varEditApply');
    if (ap) ap.onclick = () => {
      const g = sel => prev.querySelector(sel);
      const nv = { ...r.v, problem: g('.edProblem').value.trim(), answer: g('.edAnswer').value.trim(), solution: g('.edSolution').value.trim() };
      if (r.v.choices.length) nv.choices = [...prev.querySelectorAll('.edChoice')].map(i => i.value.trim());
      if (!nv.problem) { g('.edMsg').textContent = '문제가 비어 있어요.'; g('.edMsg').className = 'varMsg edMsg err'; return; }
      r.v = nv; r.edited = true; r.reverified = false; redraw();
    };
    const rv = prev.querySelector('.varReVerify');
    if (rv) rv.onclick = async () => {
      rv.disabled = true; rv.textContent = '검증 중…';
      r.rs = await Promise.all(r.ms.map(m => verify(r.v, m)));
      r.allGood = r.rs.every(x => x.ok); r.anyErr = r.rs.some(x => x.err); r.reverified = true; redraw();
    };
  }
  function previewHtml(lv, r) {
    const v = r.v;
    return `<div class="varBox"><div class="varHead">변형 ${lv}단계 결과 ${r.edited && !r.reverified ? '<b class="bad">✏️ 직접 수정함 — 검증은 하지 않았어요</b> <button type="button" class="varReVerify">검증하기</button>' : r.allGood ? '<b class="good">✅ 검증 통과</b>' : r.anyErr ? '<b class="bad">⚠️ 검증 일부 실패(AI 연결 문제) — 직접 확인하세요</b>' : '<b class="bad">⚠️ 검증에서 걸림 — 꼭 직접 확인하세요</b>'} ${r.edited && !r.reverified ? '' : r.rs.map((x, i) => badge(r.ms[i], x)).join(' ')}</div>` +
      `<div class="varBody">${mathHtml(v.problem)}${v.figure ? `<div style="text-align:center;margin:8px 0">${v.figure}</div>` : ''}` +
      (v.choices.length ? `<div class="varCh">${v.choices.map((c, i) => mathHtml(/^[①-⑤]/.test(c) ? c : CIR[i] + ' ' + c)).join('&nbsp;&nbsp;&nbsp;')}</div>` : '') +
      `<div class="varAns"><b>정답</b> ${mathHtml(v.answer)}</div><details><summary>풀이·바꾼 점</summary>${mathHtml(v.solution)}<div class="varChg">바꾼 점: ${escapeHtml(v.changes)}</div></details></div>` +
      `<details class="varEdit"><summary>✏️ 문제·선지·정답·풀이 직접 고치기</summary><div class="varEditBody">` +
      `<label>문제 <span class="hint">(수식은 $...$)</span></label><textarea class="edProblem" rows="4">${escapeHtml(v.problem)}</textarea>` +
      (v.choices.length ? `<label>선지</label>${v.choices.map((c, i) => `<div class="edCh"><span>${CIR[i] || i + 1}</span><input type="text" class="edChoice" value="${escapeHtml(String(c).replace(/^[①-⑤]\s*/, ''))}"></div>`).join('')}` : '') +
      `<label>정답</label><input type="text" class="edAnswer" value="${escapeHtml(v.answer)}">` +
      `<label>풀이</label><textarea class="edSolution" rows="5">${escapeHtml(v.solution)}</textarea>` +
      `<div><button type="button" class="varEditApply">수정 적용</button> <span class="varMsg edMsg"></span></div></div></details>` +
      `<div class="varRev"><div class="varRevT">✏️ 문제는 그대로 두고 정답·풀이만 고치기</div><input type="text" class="revIn" placeholder="예: 정답이 ④예요 / 접선의 방정식을 다시 구해 보세요 / 계산이 틀렸어요"> <select class="revModel"><option value="claude-sonnet-5">Sonnet(빠름)</option><option value="claude-opus-5">Opus(더 정확, 느림)</option></select> <button type="button" class="varRevBtn">다시 풀기</button><span class="varMsg revMsg"></span></div>` +
      `<div class="varAct"><button type="button" class="varUse">✅ 이 변형으로 교체</button> <button type="button" class="varAgain">다시 만들기</button></div></div>`;
  }
  async function generate(card, slot, it) {
    const msg = slot.querySelector('.varMsg'), prev = slot.querySelector('.varPrev'), btn = slot.querySelector('.varGen');
    const lv = Number(slot.querySelector('.varLvl').value);
    btn.disabled = true; prev.innerHTML = ''; msg.className = 'varMsg';
    try {
      const r = await makeVariant(it, lv, t => { msg.textContent = t; });
      msg.textContent = '';
      const show = () => {
        prev.innerHTML = previewHtml(lv, r); renderMath(prev);
        prev.querySelector('.varUse').onclick = () => {
          const o = load(); o[skey(window.__wnName, card.dataset.key)] = r.v; save(o);
          applyVariant(card, r.v); prev.innerHTML = ''; showApplied(card, slot);
        };
        prev.querySelector('.varAgain').onclick = () => generate(card, slot, it);
        bindRevise(prev, r, show); bindEdit(prev, r, show);
      };
      show();
    } catch (e) { msg.textContent = '⚠️ ' + e.message; msg.className = 'varMsg err'; }
    btn.disabled = false;
  }
  function showApplied(card, slot) {
    const msg = slot.querySelector('.varMsg'); msg.className = 'varMsg';
    msg.innerHTML = `<b>🔄 변형 문제로 교체됨</b> <button type="button" class="varRevert">원본으로 되돌리기</button>`;
    msg.querySelector('.varRevert').onclick = () => { const o = load(); delete o[skey(window.__wnName, card.dataset.key)]; save(o); revertVariant(card); msg.textContent = ''; };
  }

  window.WrongnoteVariant = { htmlToText, parseVariant, sameAnswer, setup: c => { cfg = c; }, makeVariant, previewHtml, reviseVariant, bindRevise, bindEdit, mathHtml, answerText, CIR };
  window.initVariantUI = function (root, name, items) {
    window.__wnName = name; const saved = load();
    root.querySelectorAll('.qCard[data-key]').forEach(card => {
      const it = items[card.dataset.key]; if (!it) return;
      const slot = card.querySelector('.varSlot'); if (!slot) return;
      slot.innerHTML = slotHtml();
      slot.querySelector('.varGen').onclick = () => generate(card, slot, it);
      const v = saved[skey(name, card.dataset.key)];
      if (v) { applyVariant(card, v); showApplied(card, slot); }
    });
  };
})();
