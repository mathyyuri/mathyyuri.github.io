// Auto-extracted from studentnote.html — shared HWPX parsing/rendering
// core used by both studentnote.html (오답노트 생성) and problembank.html
// (업로드 사전검증). Keep in sync by re-running
// scratchpad/extract_lib.js after any change to the corresponding
// function in studentnote.html — do not let the two drift.

function findTopLevelBlocks(xml, tagName) {
  const blocks = [];
  let depth = 0, start = -1;
  const tokenRe = new RegExp(`<${tagName}\\b[^>]*?/>|<${tagName}\\b[^>]*?>|</${tagName}>`, 'g');
  let m;
  const closeTag = `</${tagName}>`;
  while ((m = tokenRe.exec(xml)) !== null) {
    const tok = m[0];
    if (tok.endsWith('/>')) continue;
    if (tok === closeTag) {
      if (depth > 0) {
        depth--;
        if (depth === 0) blocks.push({ start, end: m.index + tok.length, text: xml.slice(start, m.index + tok.length) });
      }
    } else {
      if (depth === 0) start = m.index;
      depth++;
    }
  }
  return blocks;
}

function stripTags(s) { return s.replace(/<[^>]+>/g, ''); }

// The endnote's own auto-numbering marker (its "1)" reference label) is a
// <hp:ctrl><hp:autoNum .../></hp:ctrl> tied to that ORIGINAL location —
// copying it onto the quick-answer page (which already has its own "N번"
// label) would duplicate/misplace that marker, so strip just that ctrl and
// keep everything else (the actual answer text/equation) intact.
function stripAutoNumCtrls(runXml) {
  const ctrls = findTopLevelBlocks(runXml, 'hp:ctrl');
  let out = runXml;
  for (const c of ctrls) {
    if (c.text.includes('<hp:autoNum')) out = out.replace(c.text, '');
  }
  return out;
}

// A run's own <hp:ctrl> can wrap an entire <hp:endNote> (or footnote/header/
// footer) subtree, which itself contains ordinary <hp:t>/<hp:equation> —
// e.g. the endnote's "[정답] ② ... [풀이] ..." answer text. Since
// extractOrderedChildren just scans the WHOLE run string for those tags
// regardless of nesting depth, an unstripped ctrl leaks the endnote's
// answer/explanation text into the visible question body, ahead of the
// question's own real text. Ctrl-wrapped content is never part of a
// question's visible body, so it's dropped wholesale before extraction
// (the endnote's own content is separately pulled via
// extractQuickAnswerXml/extractEndnoteFullBodyXml for the answer/
// explanation sections).
function stripCtrlBlocks(runXml) {
  const ctrls = findTopLevelBlocks(runXml, 'hp:ctrl');
  let out = runXml;
  for (const c of ctrls) out = out.replace(c.text, '');
  return out;
}

// "그냥 복붙" — copy the endnote's own first NON-BLANK line (a paragraph
// inside its <hp:subList>) verbatim, AS REAL CONTENT — including any
// <hp:equation> objects, not just their stripped text, so a rendered
// fraction/coordinate pair shows as an actual equation instead of raw
// script syntax. Returns the paragraph's inner <hp:run> XML (unwrapped —
// caller embeds it directly into its own paragraph).
function extractQuickAnswerXml(blockXml) {
  // NOT indexOf('<hp:endNote') — that also matches the unrelated
  // document-wide <hp:endNotePr> (endnote FORMATTING definition, appears
  // once per document) whenever it precedes the real instance in this
  // block. Only broke question 1 (the only block starting from the very
  // top of the section, where that boilerplate lives).
  const enMatch = blockXml.match(/<hp:endNote\s+number=/);
  if (!enMatch) return '';
  const subListIdx = blockXml.indexOf('<hp:subList', enMatch.index);
  if (subListIdx === -1) return '';
  const closeRe = /<hp:subList\b[^>]*?\/>|<hp:subList\b[^>]*?>|<\/hp:subList>/g;
  closeRe.lastIndex = subListIdx;
  let depth = 0, m, subListEnd = -1;
  while ((m = closeRe.exec(blockXml)) !== null) {
    const tok = m[0];
    if (tok.endsWith('/>')) continue;
    if (tok === '</hp:subList>') { depth--; if (depth === 0) { subListEnd = m.index + tok.length; break; } }
    else depth++;
  }
  if (subListEnd === -1) return '';
  const subListXml = blockXml.slice(subListIdx, subListEnd);
  const paras = findTopLevelBlocks(subListXml, 'hp:p');
  for (const p of paras) {
    // "수식입니다." is just an equation's generic alt-text label ("this is
    // an equation"), not part of the actual content — pure noise here for
    // deciding whether this paragraph counts as blank.
    const stripped = stripTags(p.text).replace(/수식입니다\./g, '').replace(/\s+/g, ' ').trim();
    if (!stripped) continue;
    const runs = findTopLevelBlocks(p.text, 'hp:run');
    return runs.map(r => stripAutoNumCtrls(r.text)).join('');
  }
  return '';
}

// Like extractQuickAnswerXml, but returns the endnote's ENTIRE subList
// content (every paragraph, not just the first non-blank one) — used for
// the HTML export's 해설(explanation) section, since HTML has no
// equivalent to HWP's own "auto-collect every endnote at the document
// end" feature; that page is built explicitly from this instead.
function extractEndnoteFullBodyXml(blockXml) {
  const enMatch = blockXml.match(/<hp:endNote\s+number=/);
  if (!enMatch) return '';
  const subListIdx = blockXml.indexOf('<hp:subList', enMatch.index);
  if (subListIdx === -1) return '';
  const closeRe = /<hp:subList\b[^>]*?\/>|<hp:subList\b[^>]*?>|<\/hp:subList>/g;
  closeRe.lastIndex = subListIdx;
  let depth = 0, m, subListEnd = -1;
  while ((m = closeRe.exec(blockXml)) !== null) {
    const tok = m[0];
    if (tok.endsWith('/>')) continue;
    if (tok === '</hp:subList>') { depth--; if (depth === 0) { subListEnd = m.index + tok.length; break; } }
    else depth++;
  }
  if (subListEnd === -1) return '';
  const subListXml = blockXml.slice(subListIdx, subListEnd);
  const paras = findTopLevelBlocks(subListXml, 'hp:p');
  return paras.map(p => stripAutoNumCtrls(p.text)).join('');
}

// ---------- HWP 콘텐츠 → HTML 변환 (오답노트 HTML 내보내기용) ----------
// HWP 수식 편집기 스크립트는 troff/eqn 계열 문법을 쓴다 — LEFT(/RIGHT),
// over(분수), sqrt/bar/hat/vec(단항 함수, 다음 원자에 적용), rm/it(글꼴
// 모드 전환, 렌더링에는 큰 영향 없어 생략), 그리스 문자·부등호 등은
// 영문 키워드. 실제 파일 1500개 수식 스크립트로 검증한 변환기.
function findAtomBefore(str, pos) {
  let i = pos;
  while (i > 0 && /\s/.test(str[i - 1])) i--;
  const end = i;
  if (i > 0 && str[i - 1] === '}') {
    let depth = 1, j = i - 2;
    while (j >= 0 && depth > 0) {
      if (str[j] === '}') depth++;
      else if (str[j] === '{') depth--;
      j--;
    }
    i = j + 1;
    // A trailing {...} is often just a sub/superscript group tacked onto
    // a preceding identifier ("y_{1}"), OR the argument of an already-
    // converted \command{...} ("\boxed{(나)}") — absorb the identifier/
    // _/^ chars (and a leading backslash, for the command case) directly
    // before it too, so the WHOLE thing becomes the operand instead of
    // just the bare "{1}"/"{(나)}".
    while (i > 0 && /[A-Za-z0-9_^]/.test(str[i - 1])) i--;
    if (i > 0 && str[i - 1] === '\\') i--;
    return [i, str.slice(i, end)];
  }
  if (i > 0 && str[i - 1] === ')') {
    let depth = 1, j = i - 2;
    while (j >= 0 && depth > 0) {
      if (str[j] === ')') depth++;
      else if (str[j] === '(') depth--;
      j--;
    }
    return [j + 1, str.slice(j + 1, end)];
  }
  let j = i;
  while (j > 0 && !/\s/.test(str[j - 1]) && !'{}()'.includes(str[j - 1])) j--;
  return [j, str.slice(j, end)];
}

// Consumes one atom starting at str[i] (no leading whitespace) — a {...}
// group, a (...) group, or an already-converted \command optionally
// followed directly by one or more {...} argument groups — and returns
// the position right after it.
function consumeAtomForward(str, i) {
  if (str[i] === '\\') {
    let j = i + 1;
    while (j < str.length && /[A-Za-z]/.test(str[j])) j++;
    while (str[j] === '{') j = consumeAtomForward(str, j);
    return j;
  }
  if (str[i] === '{' || str[i] === '(') {
    const open = str[i], close = open === '{' ? '}' : ')';
    let depth = 1, j = i + 1;
    while (j < str.length && depth > 0) {
      if (str[j] === open) depth++;
      else if (str[j] === close) depth--;
      j++;
    }
    return j;
  }
  return i + 1;
}

function findAtomAfter(str, pos) {
  let i = pos;
  while (i < str.length && /\s/.test(str[i])) i++;
  // {...}/(...) groups and \command{...} are each a single atom on their
  // own (confirmed bug otherwise: a bare-run scan doesn't stop at "(" or
  // ")", so "box(나)cdoty_" got swept up as box's WHOLE argument instead
  // of just "(나)").
  if (str[i] === '{' || str[i] === '(' || str[i] === '\\') {
    const end = consumeAtomForward(str, i);
    return [end, str.slice(i, end)];
  }
  // Bare run (no enclosing group) — e.g. the "2+\boxed{(나)}" in
  // "over 2+box (나)" once box has already become \boxed{(나)}. Runs
  // until whitespace or a bare brace/paren, but a \command encountered
  // MID-RUN is consumed as one step (command name + its own {...} args)
  // rather than stopping at its opening "{", so the run keeps going
  // past it instead of leaving the command's argument stranded outside.
  let j = i;
  while (j < str.length && !/\s/.test(str[j]) && str[j] !== '{' && str[j] !== '}' && str[j] !== '(' && str[j] !== ')') {
    j = str[j] === '\\' ? consumeAtomForward(str, j) : j + 1;
  }
  return [j, str.slice(i, j)];
}

function stripOuterBraces(s) {
  s = s.trim();
  if (s.startsWith('{') && s.endsWith('}')) return s.slice(1, -1);
  return s;
}

// "A over B" -> "\dfrac{A}{B}" — operand boundaries are brace-group-aware
// (so nested fractions inside a numerator/denominator resolve correctly)
// via findAtomBefore/After, not naive whitespace splitting. \dfrac (not
// \frac) specifically — inline math defaults to "textstyle", which KaTeX
// (matching real LaTeX) shrinks \frac's numerator/denominator down a
// size; \dfrac forces the same full-size rendering a displayed equation
// would get, while leaving exponents/subscripts (a separate, always-small
// "script style") untouched.
function resolveOverFractions(script) {
  let s = script;
  let guard = 0;
  while (guard++ < 300) {
    const m = s.match(/(?<![A-Za-z])over(?![A-Za-z])/);
    if (!m) break;
    const idx = m.index;
    const [leftStart] = findAtomBefore(s, idx);
    const leftRaw = s.slice(leftStart, idx);
    const afterOver = idx + 4;
    const [rightEnd, rightRaw] = findAtomAfter(s, afterOver);
    const left = stripOuterBraces(leftRaw);
    const right = stripOuterBraces(rightRaw);
    s = s.slice(0, leftStart) + `{\\dfrac{${left}}{${right}}}` + s.slice(rightEnd);
  }
  return s;
}

// Unary keyword (sqrt/bar/hat/...) applies to the NEXT atom only. The
// "(?<!\\)" guard is essential — without it, the regex would keep
// re-matching the "sqrt"/"bar" substring inside the \sqrt{...}/\bar{...}
// text this function just inserted, growing backslashes forever.
function applyUnary(s, keyword, latexCmd, caseInsensitive, loose) {
  // Both \b's matter for MOST of these — "dot" without the leading one
  // would also match inside "cdot" (HWP's \cdot keyword), corrupting it
  // into "c" + a dot-accent. sqrt/bar/root are safe to drop BOTH for (no
  // other keyword contains them as a substring) and confirmed NEED to —
  // HWP glues a coefficient directly onto them on one side ("3barBC",
  // "7root3") AND glues the following argument directly onto them with
  // no space on the other ("barBC" itself has no boundary between "bar"
  // and "BC" either, both being letters) — \b can't fire between two
  // \w characters (digit-letter OR letter-letter) on either side, so
  // \bbar\b / \broot\b never matched glued cases like this at all.
  const lead = loose ? '' : '\\b';
  const trail = loose ? '' : '\\b';
  const re = new RegExp('(?<!\\\\)' + lead + keyword + trail, caseInsensitive ? 'i' : '');
  let guard = 0;
  while (guard++ < 300) {
    const m = s.match(re);
    if (!m) break;
    const idx = m.index;
    const after = idx + keyword.length;
    const [end, argRaw] = findAtomAfter(s, after);
    const arg = stripOuterBraces(argRaw);
    s = s.slice(0, idx) + `${latexCmd}{${arg}}` + s.slice(end);
  }
  return s;
}

// Brace-depth-aware split on a top-level separator char (ignores the char
// when it's inside a nested {...} group — e.g. an eqalign block's own '#').
function splitTopLevel(s, sepChar) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === sepChar && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts;
}

// eqalign{...} groups a run of '#'-separated sub-rows for vertical
// alignment; nested inside a cases row it just marks "these lines belong
// together", so it's flattened into however many rows its own '#'-split
// produces rather than kept as its own LaTeX construct — any text before/
// after the eqalign{} within the same row is spliced onto the first/last
// sub-row respectively.
function flattenEqalignRows(rowStr) {
  const m = rowStr.match(/\beqalign\s*\{/);
  if (!m) return [rowStr];
  const braceStart = rowStr.indexOf('{', m.index);
  const [end, inner] = findAtomAfter(rowStr, braceStart);
  const innerContent = stripOuterBraces(inner);
  const subRows = splitTopLevel(innerContent, '#').map(s => s.trim()).filter(Boolean);
  const before = rowStr.slice(0, m.index);
  const after = rowStr.slice(end);
  if (subRows.length === 0) return [(before + after).trim()].filter(Boolean);
  return subRows.map((r, i) => {
    let piece = r;
    if (i === 0) piece = before + piece;
    if (i === subRows.length - 1) piece = piece + after;
    return piece.trim();
  });
}

// HWP's "cases{ row1 # row2 # ... }" (연립방정식/구간별 정의 등) — '#'
// separates rows, '&' separates columns within a row (both already match
// LaTeX's own cases/array row & column separators once rows are joined
// with '\\', so no further translation of '&' itself is needed).
function resolveCases(script) {
  let s = script;
  let guard = 0;
  while (guard++ < 50) {
    const m = s.match(/\bcases\s*\{/);
    if (!m) break;
    const braceStart = s.indexOf('{', m.index);
    const [end, inner] = findAtomAfter(s, braceStart);
    const innerContent = stripOuterBraces(inner);
    let rows = splitTopLevel(innerContent, '#').map(r => r.trim()).filter(Boolean);
    rows = rows.flatMap(flattenEqalignRows).map(r => r.trim()).filter(Boolean);
    const rowsLatex = rows.map(r => splitTopLevel(r, '&').map(c => c.trim()).join(' & '));
    const replacement = `\\begin{cases}${rowsLatex.join(' \\\\ ')}\\end{cases}`;
    s = s.slice(0, m.index) + replacement + s.slice(end);
  }
  return s;
}

const HWP_EQ_SYMBOLS = {
  LEQ: '\\leq', GEQ: '\\geq', NEQ: '\\neq', THEREFORE: '\\therefore',
  ANGLE: '\\angle', CDOTS: '\\cdots', TRIANGLE: '\\triangle',
  PLUSMINUS: '\\pm', TIMES: '\\times', DIV: '\\div', DEG: '^\\circ',
  cdot: '\\cdot', INFTY: '\\infty', infty: '\\infty',
  alpha: '\\alpha', beta: '\\beta', gamma: '\\gamma', delta: '\\delta',
  epsilon: '\\epsilon', zeta: '\\zeta', eta: '\\eta', theta: '\\theta',
  iota: '\\iota', kappa: '\\kappa', lambda: '\\lambda', mu: '\\mu', nu: '\\nu',
  xi: '\\xi', pi: '\\pi', rho: '\\rho', sigma: '\\sigma', tau: '\\tau',
  upsilon: '\\upsilon', phi: '\\phi', chi: '\\chi', psi: '\\psi', omega: '\\omega',
  SUM: '\\sum', sum: '\\sum', PROD: '\\prod', prod: '\\prod', INT: '\\int', int: '\\int',
  LIM: '\\lim', lim: '\\lim', LDOTS: '\\ldots', ldots: '\\ldots',
  amp: '&', QED: '\\blacksquare',
  // short-form inequality keywords ("-3lele1/2" = -3 \leq l \leq 1/2, i.e.
  // "le"/"ge" used in place of LEQ/GEQ) — confirmed from real broken output.
  le: '\\leq', ge: '\\geq',
};

// Case-insensitive, longest-match-first keyword table — HWP's equation
// editor is inconsistent about keyword casing (LEFT vs left, rm vs RM),
// and a keyword can sit glued directly against ANOTHER keyword with zero
// separating whitespace (e.g. "2cdotbox(가)" = "2" + cdot + box, no
// spaces at all) — plain \bWORD\b matching misses both, since \b can't
// fire between two letters and doesn't know about casing. Scanning each
// letter-run character by character for the longest known keyword
// starting at that position (case-folded) catches both.
const HWP_EQ_KEYWORDS_CI = (() => {
  const map = {};
  for (const k of Object.keys(HWP_EQ_SYMBOLS)) {
    const lk = k.toLowerCase();
    if (!(lk in map)) map[lk] = HWP_EQ_SYMBOLS[k];
  }
  return { map, keys: Object.keys(map).sort((a, b) => b.length - a.length) };
})();

function substituteSymbolsInRun(run) {
  const lower = run.toLowerCase();
  let out = '', i = 0;
  while (i < run.length) {
    let hit = null;
    for (const kw of HWP_EQ_KEYWORDS_CI.keys) {
      if (lower.startsWith(kw, i)) { hit = kw; break; }
    }
    if (hit) {
      let repl = HWP_EQ_KEYWORDS_CI.map[hit];
      i += hit.length;
      // A LaTeX control WORD (\leq, \cdot, ...) consumes every letter
      // right after it as part of the command name — "\leq" immediately
      // followed by "m" with no separator parses as the single (bogus)
      // command "\leqm", not "\leq" then "m". A space breaks that only
      // when the next source character is itself a letter.
      if (/^\\[A-Za-z]+$/.test(repl) && /[A-Za-z]/.test(run[i] || '')) repl += ' ';
      out += repl;
    } else { out += run[i]; i++; }
  }
  return out;
}

function convertHwpEquationToLatex(script) {
  if (!script) return '';
  let s = script;
  s = s.replace(/`/g, ' ');
  // Quoted labels ("⑦", "또는", ...) are literal text, not math — \text{}
  // keeps them upright instead of math-italicizing each character.
  s = s.replace(/"([^"]*)"/g, '\\text{$1}');
  s = resolveCases(s);
  // No leading \b and case-insensitive — LEFT/RIGHT show up as "left"
  // lowercase in some files, and can sit glued directly against the
  // preceding variable ("Aleft(x1,y1right)") with no boundary for \b to
  // catch; the following bracket char is specific enough on its own.
  s = s.replace(/LEFT\s*\(/gi, '\\left(');
  s = s.replace(/RIGHT\s*\)/gi, '\\right)');
  s = s.replace(/LEFT\s*\[/gi, '\\left[');
  s = s.replace(/RIGHT\s*\]/gi, '\\right]');
  s = s.replace(/LEFT\s*\{/gi, '\\left\\{');
  s = s.replace(/RIGHT\s*\}/gi, '\\right\\}');
  s = s.replace(/LEFT\s*\|/gi, '\\left|');
  s = s.replace(/RIGHT\s*\|/gi, '\\right|');
  s = applyUnary(s, 'sqrt', '\\sqrt', false, true);
  // "root" is an alternate keyword HWP uses for square roots too (e.g.
  // "7root3" = 7√3), separate from "sqrt" — both need to be recognized.
  s = applyUnary(s, 'root', '\\sqrt', false, true);
  // \overline (not \bar) — \bar only draws a short accent over a single
  // character; segment notation like AB needs a full-width bar over the
  // whole label, which is what \overline does.
  s = applyUnary(s, 'bar', '\\overline', false, true);
  s = applyUnary(s, 'hat', '\\hat');
  s = applyUnary(s, 'vec', '\\vec');
  s = applyUnary(s, 'tilde', '\\tilde');
  s = applyUnary(s, 'ddot', '\\ddot');
  s = applyUnary(s, 'dot', '\\dot');
  // Fill-in-the-blank placeholder (서술형 빈칸), e.g. "box (가)" — \boxed
  // draws a bordered box AROUND its argument, so the label ends up
  // written inside the box rather than as plain text floating next to
  // an empty square. Case-insensitive: both "box" and "BOX" show up.
  s = applyUnary(s, 'box', '\\boxed', true);
  // "over" (fractions) runs AFTER the unary conversions above, not
  // before — a numerator/denominator like "box (나)" needs "box" already
  // turned into the clean, self-contained "\boxed{(나)}" token BEFORE the
  // over-scanner looks for atom boundaries; scanning the raw, still-space-
  // separated "box (나)" as a fraction operand stops at the first space
  // and only grabs "box", leaving "(나)" stranded outside the fraction.
  s = resolveOverFractions(s);
  // rm/it (font-mode toggles) are usually glued directly to the single
  // letter they style with no space (e.g. "rmA", generated by HWP's
  // equation editor for an upright point label) rather than "rm A" — \b
  // on BOTH sides would miss that, since there's no boundary between "m"
  // and "A". Strip the glued form first, then any remaining spaced form.
  s = s.replace(/\brm(?=[A-Za-z])/g, '').replace(/\brm\b/g, '');
  s = s.replace(/\bit(?=[A-Za-z])/g, '').replace(/\bit\b/g, '');
  // No \b here either — digits are \w characters too, so "3lemle1" has no
  // word boundary between "3" and "l" for \b to find, same root cause as
  // the LEFT/RIGHT and applyUnary fixes above. [A-Za-z]+ already delimits
  // on its own (digits/symbols simply aren't in the class), so dropping
  // \b only lets through matches it was wrongly blocking, not new ones.
  s = s.replace(/(?<!\\)([A-Za-z]+)/g, (m, w) => substituteSymbolsInRun(w));
  // Safety net: a coordinate/pair like "A(1,5), B(3,a)" can be split by HWP
  // across separate <hp:equation> objects (e.g. the trailing "a" written as
  // its own equation for italic styling), so a single equation's script can
  // legitimately open a \left( with the matching \right) living in a
  // DIFFERENT equation object entirely. Rather than crash KaTeX on the
  // resulting lone \left/\right, fall back to plain (unsized) brackets —
  // always valid on their own, and the adjacent \(...\) spans still read
  // correctly once placed next to each other in the page.
  const leftCount = (s.match(/\\left/g) || []).length;
  const rightCount = (s.match(/\\right/g) || []).length;
  if (leftCount !== rightCount) {
    s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  }
  return s.trim();
}

function decodeXmlEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// A run's children (text/equation/picture/table) are siblings, not nested
// in each other — collect each recognized tag type separately then merge
// back into document order by start offset, rather than assume any single
// regex can walk mixed sibling tags correctly.
function extractOrderedChildren(xml, tagNames) {
  const all = [];
  for (const tag of tagNames) {
    for (const b of findTopLevelBlocks(xml, tag)) all.push({ tag, ...b });
  }
  // A container tag (hp:rect can hold its own <hp:t>/<hp:equation>/<hp:pic>
  // deep inside its own subList) gets its inner content matched a SECOND
  // time by that inner tag's own independent scan above — findTopLevelBlocks
  // only tracks nesting relative to its OWN tag name, so it has no idea
  // those matches sit inside a rect. Without this filter they'd render
  // twice: once via the rect's own recursive rendering, once again here as
  // if they were direct run-level siblings.
  const containers = all.filter(b => b.tag === 'hp:rect');
  const filtered = all.filter(b => b.tag === 'hp:rect' || !containers.some(c => b.start > c.start && b.start < c.end));
  filtered.sort((a, b) => a.start - b.start);
  return filtered;
}

async function hwpPicToHtml(picXml, entry) {
  const refM = picXml.match(/binaryItemIDRef="([^"]+)"/);
  if (!refM || !entry) return '';
  const href = entry.manifestItems[refM[1]];
  if (!href) return '';
  const file = entry.zipData.file(href);
  if (!file) return '';
  try {
    const base64 = await file.async('base64');
    const ext = href.split('.').pop().toLowerCase();
    const mime = mediaTypeForExt(ext);
    // data-bin-id ties the rendered <img> back to its manifest entry
    // (binaryItemIDRef) and zip path — needed by problembank.html's
    // pre-upload image editor to know which BinData/ file to overwrite
    // when the user recolors an image's background.
    return `<img class="hwpImg" src="data:${mime};base64,${base64}" alt="" data-bin-id="${escapeHtml(refM[1])}" data-bin-href="${escapeHtml(href)}">`;
  } catch (e) { return ''; }
}

async function hwpTblToHtml(tblXml, entry) {
  const trs = findTopLevelBlocks(tblXml, 'hp:tr');
  let rowsHtml = '';
  for (const tr of trs) {
    const tcs = findTopLevelBlocks(tr.text, 'hp:tc');
    let rowHtml = '';
    for (const tc of tcs) {
      const spanM = tc.text.match(/<hp:cellSpan\s+colSpan="(\d+)"\s+rowSpan="(\d+)"/);
      const colSpan = spanM ? spanM[1] : '1';
      const rowSpan = spanM ? spanM[2] : '1';
      const subList = findTopLevelBlocks(tc.text, 'hp:subList')[0];
      const cellInner = subList ? await hwpBodyXmlToHtml(subList.text, entry) : '';
      rowHtml += `<td colspan="${colSpan}" rowspan="${rowSpan}">${cellInner}</td>`;
    }
    rowsHtml += `<tr>${rowHtml}</tr>`;
  }
  return `<table class="hwpTbl">${rowsHtml}</table>`;
}

// A "다음은 ~ 과정이다. (가), (나)에 알맞은 것은?"-style proof-completion
// question draws its blank(s) as an <hp:rect> SHAPE, not text — confirmed
// against a real file: a small rect (curSz ~11mm×5mm) with an EMPTY draw
// run is the literal empty box the student would fill in. HWP shape sizes
// here use HWPUNIT (1/7200 inch, confirmed by cross-checking this file's
// own <hp:pagePr> width/height against its real A4-ish page size), NOT the
// 1/100mm convention used elsewhere in this codebase for paragraph/table
// coordinates — the two must not be confused.
function hwpUnitToMm(u) { return u / 7200 * 25.4; }

function rectSizeMm(rectXml) {
  const m = rectXml.match(/<hp:curSz width="(\d+)" height="(\d+)"/);
  return m ? { w: hwpUnitToMm(Number(m[1])), h: hwpUnitToMm(Number(m[2])) } : null;
}

async function hwpRectToHtml(rectXml, entry) {
  const sub = findTopLevelBlocks(rectXml, 'hp:subList')[0];
  const inner = sub ? await hwpBodyXmlToHtml(sub.text, entry) : '';
  const hasContent = stripTags(inner).trim() !== '' || /<img/.test(inner);
  const sz = rectSizeMm(rectXml);
  if (!hasContent) {
    // A large EMPTY rect (real file: ~83mm×37mm, carrying nothing but a
    // stray colPr layout-switch control) is a structural/anchor artifact,
    // not a visible blank box — only small empty rects are genuine
    // fill-in-the-blank boxes.
    if (!sz || sz.w > 40 || sz.h > 20) return '';
    return `<span class="hwpBlankBox" style="width:${sz.w.toFixed(1)}mm;height:${sz.h.toFixed(1)}mm"></span>`;
  }
  const style = sz ? `min-width:${sz.w.toFixed(1)}mm;min-height:${sz.h.toFixed(1)}mm;` : '';
  return `<span class="hwpRectBox" style="${style}">${inner}</span>`;
}

// hp:tab/hp:lineBreak/hp:fwSpace are inline formatting controls that can
// sit NESTED INSIDE <hp:t>...</hp:t> itself (verified against real files —
// not just as sibling elements), so they have to be swapped for their
// HTML equivalent BEFORE the surrounding text gets escaped, or they leak
// through as literal "&lt;hp:tab .../&gt;" text.
function hwpInlineControlsToHtml(raw) {
  return raw
    .replace(/<hp:lineBreak\b[^>]*\/>/g, '\n')
    .replace(/<hp:tab\b[^>]*\/>/g, '    ')
    .replace(/<hp:fwSpace\b[^>]*\/>/g, ' ')
    .replace(/<hp:[a-zA-Z]+\b[^>]*\/>/g, '')
    .replace(/<hp:[a-zA-Z]+\b[^>]*>[\s\S]*?<\/hp:[a-zA-Z]+>/g, '');
}

async function hwpRunInnerToHtml(runXml, entry) {
  runXml = stripCtrlBlocks(runXml);
  const children = extractOrderedChildren(runXml, ['hp:t', 'hp:equation', 'hp:pic', 'hp:tbl', 'hp:rect']);
  let out = '';
  for (const c of children) {
    if (c.tag === 'hp:t') {
      const textM = c.text.match(/<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/);
      const raw = textM ? textM[1] : '';
      const cleaned = hwpInlineControlsToHtml(raw);
      out += escapeHtml(decodeXmlEntities(cleaned)).replace(/\n/g, '<br>');
    } else if (c.tag === 'hp:equation') {
      const sm = c.text.match(/<hp:script>([\s\S]*?)<\/hp:script>/);
      const rawScript = sm ? decodeXmlEntities(sm[1]) : '';
      let latex = '';
      try { latex = rawScript ? convertHwpEquationToLatex(rawScript) : ''; } catch (e) { latex = ''; }
      if (latex) {
        out += ` <span class="eq">\\(${latex}\\)</span> `;
      } else if (rawScript) {
        // Conversion failed outright — show the script text instead of
        // silently dropping the equation (a visible, ugly fallback beats a
        // missing chunk of the question a student can't even tell is gone).
        out += ` <span class="eqFallback">${escapeHtml(rawScript)}</span> `;
      }
    } else if (c.tag === 'hp:pic') {
      out += await hwpPicToHtml(c.text, entry);
    } else if (c.tag === 'hp:tbl') {
      out += await hwpTblToHtml(c.text, entry);
    } else if (c.tag === 'hp:rect') {
      out += await hwpRectToHtml(c.text, entry);
    }
  }
  return out;
}

// Converts a fragment containing one or more sibling <hp:run> elements
// (not necessarily wrapped in a <hp:p>) — used for the quick-answer runs
// extractQuickAnswerXml already hands back.
async function hwpFragmentRunsToHtml(xml, entry) {
  const runs = findTopLevelBlocks(xml, 'hp:run');
  let out = '';
  for (const r of runs) out += await hwpRunInnerToHtml(r.text, entry);
  return out;
}

// A "①...⑤" choice list is normally one paragraph with tab characters
// between choices — converted to a handful of literal spaces, those read
// as cramped/lopsided rather than evenly laid out. When 2+ circled-number
// markers show up in the same paragraph, split on them and lay the
// choices out as a wrapping flex row instead. The question STEM is
// routinely glued into the SAME paragraph right before the first marker
// ("...범위는?①-3≤m≤...") — confirmed against a real file — so anything
// before that first marker has to be split off as its own line, or it
// silently becomes a fake "choice item" with no marker of its own.
function formatChoiceRow(inner) {
  const markerIdx = inner.search(/[①②③④⑤]/);
  if (markerIdx === -1) return null;
  const prefix = inner.slice(0, markerIdx).trim();
  const parts = inner.slice(markerIdx).split(/(?=[①②③④⑤])/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const row = `<div class="choiceRow">${parts.map(p => `<span class="choiceItem">${p}</span>`).join('')}</div>`;
  return prefix ? `<p>${prefix}</p>${row}` : row;
}

// Multi-part "다음 조건을 만족시킬 때..." problems label each condition
// (가)/(나)/(다)... — normally boxed off in the source, same idea as a
// <보기> list but for whole condition clauses instead of ㄱ/ㄴ/ㄷ items.
// These markers usually sit mid-paragraph with no line break between them
// ("...16이다.(나) 0≤x≤8에서...") rather than each getting its own
// paragraph, so — unlike the ㄱ/ㄴ/ㄷ/ㄹ case — this has to split within
// a single paragraph's own HTML rather than group separate paragraphs.
const CONDITION_MARKERS = ['(가)', '(나)', '(다)', '(라)', '(마)'];

function formatConditionBox(inner, rawText) {
  const foundCount = CONDITION_MARKERS.filter(mk => rawText.includes(mk)).length;
  if (foundCount < 2) return null;
  const parts = inner.split(/(?=\([가나다라마]\))/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return `<div class="hwpCondBox">${parts.map(p => `<p>${p}</p>`).join('')}</div>`;
}

// Converts a body of one or more <hp:p> paragraphs (a question's
// blockXml, an endnote's full subList, or a table cell's subList) to HTML.
async function hwpBodyXmlToHtml(xml, entry) {
  const paras = findTopLevelBlocks(xml, 'hp:p');
  const items = [];
  for (const p of paras) {
    const inner = await hwpFragmentRunsToHtml(p.text, entry);
    if (!inner.trim()) continue;
    items.push({ raw: decodeXmlEntities(stripTags(p.text)).trim(), inner });
  }

  // A "①...⑤" choice list is normally one paragraph with tab characters
  // between choices, but a real file showed it can also be split across
  // SEPARATE paragraphs (line-wrap in the source document — e.g. "①②" in
  // one paragraph, "③④" in the next, and a lone "⑤" in a third). Treating
  // each paragraph in isolation left that lone "⑤" outside the choice box
  // entirely, since a single marker never meets the "2+ per paragraph"
  // threshold. Merge a RUN of consecutive marker-bearing paragraphs first
  // and count markers across the whole run, before resolving anything else.
  //
  // A <보기> ㄱ/ㄴ/ㄷ/ㄹ list has the OPPOSITE problem in a different real
  // file: all 4 items sat glued into ONE single paragraph ("ㄱ. ...ㄴ.
  // ...ㄷ. ...ㄹ. ...") instead of one-per-paragraph, so the cross-paragraph
  // grouping below (which counts consecutive ㄱ-prefixed PARAGRAPHS) never
  // fires — it only ever sees that one paragraph, never reaching its "2+"
  // threshold. formatBogiBox handles that single-paragraph case directly,
  // the same way formatConditionBox already does for (가)(나)(다).
  function formatBogiBox(inner, rawText) {
    const count = (rawText.match(/[ㄱ-ㅎ]\s*[.)]/g) || []).length;
    if (count < 2) return null;
    const markerIdx = inner.search(/[ㄱ-ㅎ]\s*[.)]/);
    if (markerIdx === -1) return null;
    const prefix = inner.slice(0, markerIdx).trim();
    const parts = inner.slice(markerIdx).split(/(?=[ㄱ-ㅎ]\s*[.)])/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    const box = `<div class="hwpBogi">${parts.map(p => `<p>${p}</p>`).join('')}</div>`;
    return prefix ? `<p>${prefix}</p>${box}` : box;
  }
  function resolveSingle(it) {
    const condBox = formatConditionBox(it.inner, it.raw);
    return condBox || `<p>${it.inner}</p>`;
  }
  const resolved = [];
  let i = 0;
  while (i < items.length) {
    if (/[①②③④⑤]/.test(items[i].raw)) {
      const start = i;
      while (i < items.length && /[①②③④⑤]/.test(items[i].raw)) i++;
      const run = items.slice(start, i);
      const combinedRaw = run.map(it => it.raw).join('');
      const markerCount = (combinedRaw.match(/[①②③④⑤]/g) || []).length;
      const row = markerCount >= 2 ? formatChoiceRow(run.map(it => it.inner).join('')) : null;
      if (row) { resolved.push({ raw: '', html: row }); continue; }
      for (const it of run) resolved.push({ raw: it.raw, html: resolveSingle(it) });
      continue;
    }
    const bogiBox = formatBogiBox(items[i].inner, items[i].raw);
    if (bogiBox) { resolved.push({ raw: '', html: bogiBox }); i++; continue; }
    resolved.push({ raw: items[i].raw, html: resolveSingle(items[i]) });
    i++;
  }

  // "<보기>" reference-statement lists (ㄱ./ㄴ./ㄷ./ㄹ...) are normally
  // shown inside a bordered box in the source — group them into one boxed
  // div, since we don't otherwise carry over the original paragraph
  // border. The "<보기>" label itself isn't reliably its own paragraph —
  // it's often embedded mid-sentence in the question text right before
  // the list ("...다음 <보기>에서 고른 것은?") — so detection can't
  // require a standalone marker paragraph; it just looks for a run of
  // 2+ consecutive ㄱ/ㄴ/ㄷ/ㄹ-prefixed lines, optionally preceded by one.
  const htmlParas = [];
  let j = 0;
  while (j < resolved.length) {
    const isMarker = /^<\s*보\s*기\s*>/.test(resolved[j].raw);
    const isBogiLine = /^[ㄱ-ㅎ]\s*[.)]/.test(resolved[j].raw);
    if (isMarker || isBogiLine) {
      const start = j;
      let k = isMarker ? j + 1 : j;
      let count = 0;
      while (k < resolved.length && /^[ㄱ-ㅎ]\s*[.)]/.test(resolved[k].raw)) { k++; count++; }
      if (count >= 2) {
        htmlParas.push(`<div class="hwpBogi">${resolved.slice(start, k).map(it => it.html).join('')}</div>`);
        j = k;
        continue;
      }
    }
    htmlParas.push(resolved[j].html);
    j++;
  }
  return htmlParas.join('\n');
}

function mediaTypeForExt(ext) {
  const e = ext.toLowerCase();
  if (e === 'jpg') return 'image/jpg';
  if (e === 'jpeg') return 'image/jpeg';
  if (e === 'bmp') return 'image/bmp';
  return 'image/png';
}

function detectExplicitMarkers(xml) {
  const paras = findTopLevelBlocks(xml, 'hp:p');
  const markerIdx = [];
  for (let i = 0; i < paras.length; i++) {
    const t = stripTags(paras[i].text).trim();
    const m = t.match(/^\[\[(\d+|END)\]\]$/);
    if (m) markerIdx.push({ i, key: m[1] });
  }
  const result = new Map();
  for (let k = 0; k < markerIdx.length - 1; k++) {
    const { i: startI, key } = markerIdx[k];
    if (key === 'END') continue;
    const endI = markerIdx[k + 1].i;
    const blockXml = paras.slice(startI + 1, endI).map(p => p.text).join('');
    if (blockXml.trim()) result.set(key, blockXml);
  }
  return result;
}

// A question's endnote paragraph contains BOTH its solution text and,
// concatenated in the very same run right after, the visible stem of that
// SAME question — followed a paragraph or two later by that question's
// own answer choices. (Verified against a real exam file: e.g. endnote 1's
// paragraph is literally "[정답] ⑤ ...개수는 5" immediately followed by
// "두 점 A(2,a), B(a,6) 사이의 거리가 4 이하가 되도록 하는 정수 a의
// 개수는?" — solution then stem, same problem, same paragraph.) Extend
// forward from each endnote through an optional blank gap, then through
// the following non-blank "choices" run — capped at the next endnote's
// own paragraph so a question with no gap before it never gets swallowed.
// Everything between one question's own end and the next endnote (an
// optional topic-label line, plus the next question's diagram image)
// belongs to the NEXT question, not this one.
function isBlankPara(p) {
  return stripTags(p.text).trim() === '';
}

// A blank paragraph with no picture in it is pure page-layout filler
// (these documents commonly reserve a run of empty paragraphs before a
// question so the next one starts at a nice position on the page) — safe
// to drop. A blank paragraph that DOES contain a picture is a real
// diagram belonging to the question and must be kept.
function isEmptySpacerPara(p) {
  return isBlankPara(p) && !p.text.includes('<hp:pic');
}

// A short-answer ("구하시오") question has no choices at all, so the
// paragraph right after its stem can be the NEXT question's own topic
// label or bracketed source citation with no blank line in between.
// Without this guard, "consume the next non-blank run as choices" would
// swallow that label — and everything up to the next blank — straight
// into the wrong question.
function looksLikeNextQuestionMarker(p) {
  const t = stripTags(p.text).trim();
  return /^유형\s*\d+\s*[:：]/.test(t) || /^\[[^\]]*\]$/.test(t);
}

// Orphaned-content absorption (below) must only grab things we can
// positively identify as belonging to SOME question — a picture, or a
// choice list starting with ①/㉠/ㄱ — never "any non-blank paragraph".
// Some documents carry a repeating watermark/copyright notice
// ("이 자료를 무단으로 복제...") in the gap between questions; treating
// that as orphaned content silently corrupted unrelated questions with
// the watermark text instead of their real answer.
function looksLikeOrphanedFragment(p) {
  if (p.text.includes('<hp:pic')) return true;
  const t = stripTags(p.text).trim();
  return /^[①②③④⑤㉠㉡㉢㉣]/.test(t);
}

function detectEndnoteMarkers(xml) {
  const paras = findTopLevelBlocks(xml, 'hp:p');
  const boundaries = [];
  for (let i = 0; i < paras.length; i++) {
    const m = paras[i].text.match(/<hp:endNote\b[^>]*\bnumber="(\d+)"/);
    if (m) boundaries.push({ i, key: m[1] });
  }
  const choicesEnd = boundaries.map(({ i }, idx) => {
    const nextI = idx + 1 < boundaries.length ? boundaries[idx + 1].i : paras.length;
    let j = i + 1;
    while (j < nextI && isBlankPara(paras[j])) j++;
    while (j < nextI && !isBlankPara(paras[j]) && !looksLikeNextQuestionMarker(paras[j])) j++;

    // Orphaned content — a stray choice list (e.g. a "<보기>"-style
    // question whose "①ㄱ,ㄴ ②ㄱ,ㄷ..." line ended up separated from its
    // own stem/topic-label by a blank gap) or an illustrating diagram —
    // sometimes sits in the gap between this question's own end and the
    // next question's topic label, instead of directly following either
    // one with no gap at all. Whichever side it's structurally closer to
    // is almost always where it actually belongs, so measure both
    // distances and only absorb it into THIS block if it's closer here.
    let k = j, gap = 0;
    while (k < nextI && isBlankPara(paras[k]) && gap < 3) { k++; gap++; }
    if (k < nextI && looksLikeOrphanedFragment(paras[k])) {
      const distHere = gap;
      let m = k;
      while (m < nextI && !isBlankPara(paras[m]) && !looksLikeNextQuestionMarker(paras[m])) m++;
      const distNext = nextI - m;
      if (distHere <= distNext) j = m;
    }
    return j;
  });
  const result = new Map();
  for (let k = 0; k < boundaries.length; k++) {
    let start = k > 0 ? choicesEnd[k - 1] : 0;
    const end = choicesEnd[k];
    // Trim leading spacer-only blanks — this is what created the big gap
    // between the generated citation line and the actual problem text.
    while (start < end - 1 && isEmptySpacerPara(paras[start])) start++;
    // Anything still left before the endnote's OWN paragraph (e.g. a
    // leftover topic-label line like "[유형 5]" that stopped the PREVIOUS
    // question's consumption) duplicates our own generated citation box —
    // the block should start right at the endnote paragraph itself, not
    // the line before it.
    if (start < boundaries[k].i) start = boundaries[k].i;
    const blockXml = paras.slice(start, end).map(p => p.text).join('');
    if (blockXml.trim()) result.set(boundaries[k].key, blockXml);
  }
  return result;
}

function detectNumberedParagraphs(xml) {
  const paras = findTopLevelBlocks(xml, 'hp:p');
  const candidates = [];
  for (let i = 0; i < paras.length; i++) {
    const t = stripTags(paras[i].text).trim();
    const m = t.match(/^(\d+)\.\s/);
    if (m) candidates.push({ i, key: m[1], num: Number(m[1]) });
  }
  const kept = [];
  let last = -Infinity;
  for (const c of candidates) { if (c.num > last) { kept.push(c); last = c.num; } }
  const result = new Map();
  for (let k = 0; k < kept.length; k++) {
    const startI = kept[k].i;
    const endI = k + 1 < kept.length ? kept[k + 1].i : paras.length;
    const blockXml = paras.slice(startI, endI).map(p => p.text).join('');
    if (blockXml.trim()) result.set(kept[k].key, blockXml);
  }
  return result;
}

function detectMarkers(sectionsXml) {
  const result = new Map();
  for (const { name, xml } of sectionsXml) {
    const byMethod = [
      ['미주 번호', detectEndnoteMarkers(xml)],
      ['자동 번호 인식(N.)', detectNumberedParagraphs(xml)],
      ['수동 표시([[N]])', detectExplicitMarkers(xml)],
    ];
    for (const [method, found] of byMethod) {
      for (const [key, blockXml] of found) result.set(key, { sectionName: name, blockXml, method });
    }
  }
  return result;
}

async function parseHwpx(zipData) {
  const hpf = await zipData.file('Contents/content.hpf').async('string');
  const spineMatches = [...hpf.matchAll(/<opf:itemref idref="([^"]+)"/g)].map(m => m[1]);
  const manifestItems = {};
  for (const m of hpf.matchAll(/<opf:item id="([^"]+)" href="([^"]+)"/g)) manifestItems[m[1]] = m[2];
  const sectionOrder = spineMatches.filter(id => manifestItems[id] && manifestItems[id].includes('section')).map(id => manifestItems[id]);
  const sectionsXml = [];
  for (const path of sectionOrder) sectionsXml.push({ name: path, xml: await zipData.file(path).async('string') });
  const markers = detectMarkers(sectionsXml);
  return { zipData, sectionOrder, manifestItems, markers };
}
