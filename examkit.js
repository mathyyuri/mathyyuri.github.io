/* examkit.js — 시험 분석 결과로 "내 스타일 시험지 / 손필기 해설지 / hwpx(문제+미주)"를 만드는 공용 코드
 *  - examanalyzer.html : hwpx 읽기, 해설 생성 요청, 파일 만들기
 *  - examsheet.html / examsolution.html : 문제 본문 표시(renderStem 등)
 *  필요: (hwpx 읽기) JSZip, hwpx-lib.js  (hwpx 만들기) hwpx-writer.js, hwpeq-lib.js, KaTeX
 */
(function () {
  'use strict';
  const CIRC = ['①', '②', '③', '④', '⑤'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hasKo = s => /[가-힣ㄱ-ㅎ]/.test(s);
  // 선택지·정답 값: 수식이면 \( \)로 감싼다 (이미 감싸져 있거나 한글이 섞인 글이면 그대로)
  function wrapMath(s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return '';
    if (/\\\(|\\\[|\$/.test(s) || hasKo(s)) return s;
    return '\\(' + s + '\\)';
  }
  const plainLen = s => String(s).replace(/\\\(|\\\)|\$/g, '').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}^_]/g, '').length;

  /* ---------- AI가 그린 SVG 안전하게 ---------- */
  function sanitizeSvg(svg) {
    svg = String(svg || '').trim();
    if (!/^<svg[\s>]/i.test(svg)) return '';
    svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
      .replace(/<(iframe|object|embed|image)[\s\S]*?(<\/\1>|\/>)/gi, '')
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(href|xlink:href)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '');
    if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    return svg;
  }

  /* ---------- 문제 본문 → HTML (조건·보기는 상자로) ---------- */
  const isBoxLine = l => /^\s*(\([가-하]\)|[ㄱ-ㅎ]\.|<\s*보\s*기\s*>|\[\s*조건\s*\])/.test(l);
  function renderStem(stem) {
    const lines = String(stem || '').replace(/\r/g, '').split('\n');
    const out = []; let box = [], figNote = '';
    const flush = () => { if (box.length) { out.push('<div class="boxed">' + box.join('<br>') + '</div>'); box = []; } };
    lines.forEach(l => {
      const t = l.trim();
      if (!t) return;
      const fm = t.match(/^\[\s*그림\s*[:：]\s*([\s\S]*?)\]?$/);
      if (fm) { figNote = fm[1]; return; }
      if (isBoxLine(t)) box.push(esc(t));
      else { flush(); out.push('<p>' + esc(t) + '</p>'); }
    });
    flush();
    return { html: out.join(''), figNote };
  }
  function choiceMode(choices, perPage) {
    const mx = Math.max(0, ...choices.map(c => plainLen(c)));
    if (perPage === 4) return mx <= 8 ? 'c3' : 'c1';
    return mx <= 12 ? 'c5' : mx <= 26 ? 'c2' : 'c1';
  }
  function choicesHtml(choices, perPage) {
    if (!choices || !choices.length) return '';
    const mode = choiceMode(choices, perPage);
    return '<div class="choices ' + mode + '">' + choices.map((c, i) => '<span class="ch">' + CIRC[i] + ' ' + esc(wrapMath(c)) + '</span>').join('') + '</div>';
  }
  const figureHtml = p => p.figureImg ? '<img class="fig" src="' + esc(p.figureImg) + '" alt="">' : (p.figureSvg ? '<div class="fig">' + sanitizeSvg(p.figureSvg) + '</div>' : '');

  /* ---------- hwpx 시험지 읽기 ---------- */
  function extractChoiceSpans(html) {
    const openTag = '<span class="choiceItem">', out = []; let i = 0;
    while (true) {
      const start = html.indexOf(openTag, i); if (start === -1) break;
      let depth = 1, pos = start + openTag.length; const re = /<span\b[^>]*>|<\/span>/g; re.lastIndex = pos; let end = -1, m;
      while ((m = re.exec(html))) { if (m[0] === '</span>') { depth--; if (depth === 0) { end = m.index; break; } } else depth++; }
      if (end === -1) break; out.push(html.slice(pos, end)); i = end + 7;
    }
    return out;
  }
  function htmlToText(html) {
    const d = document.createElement('div');
    d.innerHTML = String(html).replace(/<img[^>]*>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr)>/gi, '\n');
    return (d.textContent || '').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  }
  async function shrinkImage(dataUri, maxW) {
    return new Promise(res => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, (maxW || 700) / im.naturalWidth), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.85));
      };
      im.onerror = () => res(null); im.src = dataUri;
    });
  }
  async function parseHwpxExam(file) {
    if (typeof parseHwpx !== 'function') throw new Error('hwpx-lib.js를 불러오지 못했어요 (사이트 폴더에서 열어야 합니다).');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = await parseHwpx(zip);
    const nums = [...entry.markers.keys()].map(Number).sort((a, b) => a - b);
    if (!nums.length) throw new Error('문제를 하나도 찾지 못했어요. 문제마다 미주로 정답/해설이 달린 hwpx인지 확인해 주세요.');
    const problems = [];
    for (const num of nums) {
      const marker = entry.markers.get(String(num)) || entry.markers.get(num);
      const html = await hwpBodyXmlToHtml(marker.blockXml, entry);
      const choices = extractChoiceSpans(html).map(c => htmlToText(c).replace(/^\s*[①-⑤]\s*/, ''));
      const imgs = [...html.matchAll(/<img[^>]*src="(data:[^"]+)"/g)].map(m => m[1]);
      const stemHtml = html.replace(/<div class="choiceRow"[^>]*>[\s\S]*?<\/div>/g, '');
      let quick = '', expl = '';
      try { const ax = extractQuickAnswerXml(marker.blockXml); if (ax) quick = htmlToText(await hwpFragmentRunsToHtml(ax, entry)); } catch (e) {}
      try { const ex = extractEndnoteFullBodyXml(marker.blockXml); if (ex) expl = htmlToText(await hwpBodyXmlToHtml(ex, entry)); } catch (e) {}
      let given = '';
      const am = (quick || expl).match(/\[\s*정답\s*\]\s*([^\n]+)/);   // "[정답] ④ \(10\)" 또는 서술형 "[정답]\n\(4\)"
      if (am) given = am[1].trim().slice(0, 80);
      else { const am2 = (quick || expl).match(/\[\s*정답\s*\]\s*\n\s*([^\n]+)/); if (am2) given = am2[1].trim().slice(0, 80); }
      const figImg = imgs.length ? (await shrinkImage(imgs[0], 900)) || '' : '';
      problems.push({ num, stemText: htmlToText(stemHtml), choices, imgs, figImg, givenAnswer: given, explanation: expl });
    }
    return problems;
  }

  /* ---------- 손필기 해설 생성 (Claude) ---------- */
  const SOL_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['problems'],
    properties: { problems: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['num', 'answerChoice', 'answerText', 'steps', 'keyPoints', 'rubric', 'figureSvg', 'check'],
      properties: {
        num: { type: 'integer' }, answerChoice: { type: 'integer' }, answerText: { type: 'string' },
        steps: { type: 'array', items: { type: 'string' } }, keyPoints: { type: 'array', items: { type: 'string' } },
        rubric: { type: 'array', items: { type: 'string' } }, figureSvg: { type: 'string' }, check: { type: 'string' },
      } } } },
  };
  const SOL_SYSTEM = `당신은 한국 고등학교 1학년 수학을 가르치는 20년 경력의 학원 원장입니다. 시험 문항의 정답을 구하고, 학생이 칠판 필기를 보듯 이해할 수 있는 "손필기 해설"을 만듭니다.

[정답 먼저]
- 해설을 쓰기 전에 문제를 처음부터 독립적으로 풀어 정답을 확정하고 검산하세요. 주어진 정답이 있어도 그대로 믿지 말고 직접 풀어 확인하세요. 서로 다르면 check에 "주어진 정답 ②와 계산 결과 ③이 다름: 이유" 식으로 적고, 계산 결과를 정답으로 쓰세요. 같으면 check는 빈 문자열.
- 객관식이면 answerChoice에 1~5, answerText에 그 선택지의 값(LaTeX)을 넣으세요. 서술형·단답형이면 answerChoice=0, answerText에 최종 답.
- 문제 조건이 불충분하거나 판독이 불확실해 풀 수 없으면 억지로 답하지 말고 check에 이유를 쓰고 answerText는 "확인 필요"로 하세요.

[고1 교육과정 수준 — 반드시 지킬 것]
- 풀이는 해당 시험 범위 단원과 그 선수 개념(중학 수학 포함)만 사용합니다. 공통수학1·2 수준: 다항식, 방정식과 부등식, 경우의 수, 도형의 방정식(좌표, 직선, 원, 도형의 이동), 집합과 명제, 함수.
- 쓰지 말 것: 벡터, 삼각함수(sin·cos·tan)와 코사인법칙·사인법칙, 신발끈(좌표 넓이) 공식·행렬식, 미분·적분, 매개변수 표현(cosθ,sinθ로 점 놓기), 극한, 로피탈, 라그랑주 승수법 등 고2 이상 개념. 넓이는 밑변×높이와 점과 직선 사이의 거리로, 각은 닮음·이등분선 정리·기울기로 처리하세요.
- 쓸 수 있는 도구 예: 기울기, 두 점 사이 거리, 점과 직선 사이의 거리, 내분점·외분점·무게중심, 피타고라스, 닮음, 각의 이등분선 정리, 중점·대칭이동 공식, 근과 계수의 관계, 판별식, 완전제곱식, 집합 연산·벤다이어그램·경우 나누기.
- 경우를 놓치기 쉬운 문제(내분/외분, ±, 사분면 조건)는 반드시 모든 경우를 확인하고 해설에 적으세요.

[손필기 해설 쓰는 법]
- steps: 3~9개. 한 개가 칠판에 쓰는 한 줄입니다. 짧은 한국어 + 수식(\\( ... \\))으로, 한 줄에 한 가지 생각만 쓰세요. 번호는 화면이 붙이니 쓰지 마세요. 마지막 step은 "따라서 ~ = (값)"으로 끝내세요.
- keyPoints: 0~3개. 이 문제의 핵심 아이디어나 "여기서 실수하기 쉬워요" 같은 빨간펜 메모. 각 40자 이내.
- rubric: 서술형·단답형일 때만 채점 요소(예: "접선의 방정식을 바르게 세움 (3점)")를 2~5개. 객관식은 빈 배열.
- figureSvg: 그림이 문제 풀이에 필요한데 본문(stem)에 그림이 없고 hasFigure가 true일 때만, 문제 조건에 맞는 좌표평면 그림을 SVG 문자열로 그리세요(viewBox="0 0 260 230", 선 stroke="#222", 글자 font-size="12", 배경 없음, 점 라벨 포함, 좌표를 정확히). 필요 없거나 확신이 없으면 빈 문자열. script·이미지·외부 참조 금지.
- 모든 수식은 \\( \\) 안에 LaTeX로. 한글을 \\( \\) 안에 넣지 마세요(\\text{} 가능).`;
  function solutionPrompt(list) {
    return '아래 문항의 정답과 손필기 해설을 만들어 주세요. 모든 문항을 번호순으로, 빠짐없이 출력하세요.\n\n' + list.map(p => {
      let s = '### ' + p.num + '번 (' + p.format + ', ' + p.points + '점' + (p.unit ? ', 단원: ' + p.unit : '') + ')\n' + p.stem;
      if (p.choices && p.choices.length) s += '\n선택지: ' + p.choices.map((c, i) => CIRC[i] + ' ' + c).join('   ');
      if (p.hasFigure) s += '\n(그림이 있는 문항: hasFigure=true' + (p.figNote ? ' — 그림 설명: ' + p.figNote : '') + ')';
      if (p.givenAnswer) s += '\n[주어진 정답: ' + p.givenAnswer + ']';
      return s;
    }).join('\n\n');
  }

  /* ---------- 시험지/해설지용 데이터(spec) 만들기 ---------- */
  function answerDisplay(p) {
    if (p.answerChoice > 0 && p.choices && p.choices[p.answerChoice - 1] != null) return CIRC[p.answerChoice - 1] + ' ' + wrapMath(p.choices[p.answerChoice - 1]);
    if (p.answerChoice > 0) return CIRC[p.answerChoice - 1] + (p.answerText ? ' ' + wrapMath(p.answerText) : '');
    return wrapMath(p.answerText || '');
  }
  function buildSpec(data, solutions, hwpxSrc, opts) {
    opts = opts || {};
    const problems = data.problems.map(p => {
      const src = hwpxSrc && hwpxSrc[p.num], sol = solutions && solutions[p.num] || {};
      const st = renderStem(src ? src.stemText : p.stem);
      const q = {
        num: p.num, points: p.points, format: p.format, unit: p.unit,
        stem: src ? src.stemText : p.stem,
        choices: (src ? src.choices : p.choices) || [],
        figureImg: src && src.figImg || '', figureSvg: sanitizeSvg(sol.figureSvg), figNote: st.figNote, hasFigure: p.hasFigure || !!(src && src.imgs && src.imgs.length),
        answerChoice: sol.answerChoice || 0, answerText: sol.answerText || '', steps: sol.steps || [], keyPoints: sol.keyPoints || [], rubric: sol.rubric || [], check: sol.check || '',
        hasSolution: !!(sol.steps && sol.steps.length),
      };
      q.answer = q.hasSolution ? answerDisplay(q) : '';
      return q;
    });
    return { exam: data.exam, problems, opts: { perPage: opts.perPage === 4 ? 4 : 2 } };
  }

  /* ---------- hwpx (문제 + 미주) ---------- */
  async function hwpxBlob(spec) {
    if (typeof buildProblemsHwpx !== 'function') throw new Error('hwpx 만드는 코드(hwpx-writer.js)를 불러오지 못했어요.');
    const list = spec.problems.map(p => {
      let stem = p.stem.split('\n').filter(l => !/^\s*\[\s*그림\s*[:：]/.test(l)).join('\n');
      if (!p.figureImg && !p.figureSvg && p.figNote) stem += '\n[그림: ' + p.figNote + ']';
      return {
        num: p.num, problem: stem, figure: p.figureSvg || '', figurePng: p.figureImg || '',
        choices: (p.choices || []).map(wrapMath), answer: p.answer || '', solution: (p.steps || []).join('\n'),
      };
    });
    const e = spec.exam || {};
    return await buildProblemsHwpx(list, { endnotes: true, title: [e.school, e.year && e.year + '학년도', e.term, e.subject].filter(Boolean).join(' ') });
  }

  /* ---------- 새 창 열기 (데이터는 postMessage로 넘긴다) ---------- */
  function openSheet(page, spec) {
    const w = window.open(page, '_blank');
    if (!w) { alert('팝업이 막혀 있어요. 주소창 오른쪽의 팝업 허용을 눌러 주세요.'); return; }
    const onMsg = e => {
      if (e.source !== w || !e.data || e.data.type !== 'ready') return;
      w.postMessage({ type: 'data', spec }, location.origin);
      window.removeEventListener('message', onMsg);
    };
    window.addEventListener('message', onMsg);
  }

  window.ExamKit = { CIRC, esc, wrapMath, plainLen, sanitizeSvg, renderStem, choicesHtml, figureHtml, choiceMode, parseHwpxExam, shrinkImage,
    SOL_SCHEMA, SOL_SYSTEM, solutionPrompt, buildSpec, answerDisplay, hwpxBlob, openSheet };
})();
