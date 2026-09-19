/* LaTeX → 한글(HWP) 수식 편집기 스크립트 변환기.
 * hwpx-lib.js의 convertHwpEquationToLatex(한글→LaTeX)의 반대 방향이다. 키워드 표기(LEQ, RARROW,
 * PLUSMINUS, DEG, over, sqrt, root … of 등)는 실제 교재 hwpx 수식 수만 개에서 쓰이는 형태에 맞췄다.
 * latexToHwpEq(latex) → { script, warnings } */
(function (root) {
  const GREEK_L = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
  const GREEK_ALIAS = { varepsilon: 'epsilon', vartheta: 'theta', varphi: 'phi', varrho: 'rho', varsigma: 'sigma' };
  const GREEK_U = ['Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega'];
  const SIMPLE = {
    le: 'LEQ', leq: 'LEQ', leqslant: 'LEQ', ge: 'GEQ', geq: 'GEQ', geqslant: 'GEQ', ne: 'NEQ', neq: 'NEQ',
    approx: 'APPROX', equiv: 'EQUIV', sim: 'SIM', times: 'TIMES', cdot: 'CDOT', div: 'DIV', pm: 'PLUSMINUS', mp: 'MP',
    infty: 'INF', cdots: 'CDOTS', ldots: 'LDOTS', dots: 'LDOTS', vdots: 'VDOTS', ddots: 'DDOTS',
    to: 'RARROW', rightarrow: 'RARROW', longrightarrow: 'RARROW', leftarrow: 'LARROW', leftrightarrow: 'LRARROW',
    Rightarrow: 'RRARROW', Leftarrow: 'LLARROW', Leftrightarrow: 'LRRARROW', implies: 'RRARROW', iff: 'LRRARROW',
    subset: 'SUBSET', supset: 'SUPSET', subseteq: 'SUBSETEQ', supseteq: 'SUPSETEQ', in: 'IN', notin: 'NOTIN', ni: 'OWNS',
    cup: 'CUP', cap: 'CAP', emptyset: 'EMPTYSET', varnothing: 'EMPTYSET', therefore: 'THEREFORE', because: 'BECAUSE',
    perp: 'BOT', parallel: 'PARALLEL', angle: 'ANGLE', triangle: 'TRIANGLE', square: 'SQUARE', prime: "'",
    propto: 'PROPTO', nabla: 'NABLA', partial: 'PARTIAL', forall: 'FORALL', exists: 'EXISTS', neg: 'NOT', land: 'AND', lor: 'OR',
    degree: 'DEG', ell: 'l', hbar: 'hbar', aleph: 'ALEPH',
  };
  const FUNCS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'exp', 'lim', 'max', 'min', 'det', 'gcd', 'sup', 'inf', 'lg'];
  const BIGOPS = { sum: 'sum', prod: 'prod', int: 'int', oint: 'oint', iint: 'dint', iiint: 'tint', bigcup: 'bigcup', bigcap: 'bigcap' };
  const ACCENT = { vec: 'vec', overrightarrow: 'vec', hat: 'hat', widehat: 'hat', tilde: 'tilde', widetilde: 'tilde', dot: 'dot', ddot: 'ddot', bar: 'bar', overline: 'bar', underline: 'under', overleftarrow: 'vec' };

  function tokenize(src) {
    const t = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '\\') {
        const m = /^\\([A-Za-z]+)\*?/.exec(src.slice(i));
        if (m) { t.push({ k: 'cmd', v: m[1] }); i += m[0].length; }
        else { t.push({ k: 'cmd', v: src[i + 1] || '' }); i += 2; }
        continue;
      }
      if ('{}^_&'.includes(c)) { t.push({ k: c, v: c }); i++; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || '') && t.length && t[t.length - 1].k === 'num')) {
        let j = i; while (j < src.length && /[0-9.]/.test(src[j]) && !(src[j] === '.' && !/[0-9]/.test(src[j + 1] || ''))) j++;
        t.push({ k: 'num', v: src.slice(i, j) }); i = j; continue;
      }
      if (/[A-Za-z]/.test(c)) { t.push({ k: 'let', v: c }); i++; continue; }
      t.push({ k: 'ch', v: c }); i++;
    }
    return t;
  }

  function convert(latex) {
    const toks = tokenize(String(latex || '')); let p = 0; const warnings = [];
    const peek = () => toks[p]; const next = () => toks[p++];
    // 출력 조각들을 이을 때, 글자/숫자가 맞닿아 새 키워드가 만들어지지 않도록 공백을 넣는다.
    function join(parts) {
      let out = '';
      for (let s of parts) {
        if (!s) continue;
        // 앞에 뭔가 있는 분수는 { } 로 감싸 앞 항이 분자로 딸려 들어가지 않게 한다
        if (out && /^\{.*\} over \{.*\}$/.test(s)) s = '{' + s + '}';
        if (out && /[A-Za-z0-9]$/.test(out) && /^[A-Za-z0-9]/.test(s) && !(/[0-9]$/.test(out) && /^[0-9]/.test(s))) out += ' ';
        else if (out && /[A-Za-z]$/.test(out) && /^\\/.test(s)) out += ' ';
        out += s;
      }
      return out;
    }
    function parseGroupBody() { // '{' 소비 후 '}' 까지
      const parts = [];
      while (p < toks.length && peek().k !== '}') parts.push(parseItem(true));
      if (peek() && peek().k === '}') next();
      return join(parts);
    }
    function argument() { // 다음 인자 하나(중괄호 그룹 또는 원자 하나)
      const t = peek(); if (!t) return '';
      if (t.k === '{') { next(); return parseGroupBody(); }
      return atom();
    }
    function rawText() { // 공백을 보존해야 해서 원문 재구성이 필요 — 공백은 토큰화에서 사라졌으므로 낱말 사이는 한 칸으로 복원
      const t = peek(); if (!t || t.k !== '{') return '';
      const start = p; next(); let depth = 1; const words = [];
      while (p < toks.length) {
        const x = next();
        if (x.k === '{') { depth++; continue; }
        if (x.k === '}') { if (--depth === 0) break; continue; }
        words.push(x);
      }
      // 연속한 let/num/ch를 이어 붙이되, 한글 낱말은 그대로
      return words.map(w => w.k === 'cmd' ? (w.v === ',' || w.v === ';' || w.v === ' ' || w.v === 'quad' ? ' ' : '') : w.v).join('');
    }
    function delim(t) {
      if (!t) return '';
      if (t.k === 'ch') return t.v;
      if (t.k === 'cmd') { if (t.v === '{' || t.v === 'lbrace') return '{'; if (t.v === '}' || t.v === 'rbrace') return '}'; if (t.v === '|' || t.v === 'vert' || t.v === 'mid') return '|'; if (t.v === 'langle') return '<'; if (t.v === 'rangle') return '>'; if (t.v === 'lceil') return 'lceil'; if (t.v === 'rceil') return 'rceil'; if (t.v === 'lfloor') return 'lfloor'; if (t.v === 'rfloor') return 'rfloor'; return ''; }
      if (t.k === '{') return '{'; if (t.k === '}') return '}';
      return t.v || '';
    }
    function env(name) {
      // \begin{name} ... \end{name} : 행은 \\ , 열은 &
      const rows = [[]]; let cell = [];
      const flushCell = () => { rows[rows.length - 1].push(join(cell)); cell = []; };
      while (p < toks.length) {
        const t = peek();
        if (t.k === 'cmd' && t.v === 'end') { next(); if (peek() && peek().k === '{') { next(); while (p < toks.length && peek().k !== '}') next(); next(); } break; }
        if (t.k === 'cmd' && t.v === '\\') { next(); flushCell(); rows.push([]); continue; }
        if (t.k === '&') { next(); flushCell(); continue; }
        cell.push(parseItem(true));
      }
      flushCell();
      const body = rows.filter(r => r.some(c => c)).map(r => r.join(' & ')).join(' # ');
      if (name === 'cases') return 'cases{' + body + '}';
      if (/^(aligned|align|split|gathered|eqnarray)$/.test(name)) return 'eqalign{' + body.replace(/ & /g, ' ') + '}';
      if (name === 'pmatrix') return 'pmatrix{' + body + '}';
      if (name === 'bmatrix') return 'LEFT [ matrix{' + body + '} RIGHT ]';
      if (name === 'vmatrix') return 'LEFT | matrix{' + body + '} RIGHT |';
      if (name === 'matrix' || name === 'array' || name === 'smallmatrix') return 'matrix{' + body + '}';
      warnings.push('지원하지 않는 환경: ' + name); return body;
    }
    function command(name) {
      if (name in SIMPLE) return SIMPLE[name];
      if (GREEK_L.includes(name)) return name;
      if (name in GREEK_ALIAS) return GREEK_ALIAS[name];
      if (GREEK_U.includes(name)) return name.toUpperCase();
      if (name in BIGOPS) return BIGOPS[name];
      if (FUNCS.includes(name)) return name;
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') { const a = argument(), b = argument(); return '{' + a + '} over {' + b + '}'; }
      if (name === 'binom' || name === 'dbinom') { const a = argument(), b = argument(); return 'LEFT ( {' + a + '} atop {' + b + '} RIGHT )'; }
      if (name === 'sqrt') {
        if (peek() && peek().k === 'ch' && peek().v === '[') { next(); const parts = []; while (p < toks.length && !(peek().k === 'ch' && peek().v === ']')) parts.push(parseItem(true)); next(); const n = join(parts); return 'root {' + n + '} of {' + argument() + '}'; }
        return 'sqrt {' + argument() + '}';
      }
      if (name in ACCENT) return ACCENT[name] + ' {' + argument() + '}';
      if (name === 'text' || name === 'mathrm' || name === 'textrm' || name === 'operatorname' || name === 'mbox' || name === 'textbf' || name === 'mathbf' || name === 'mathbb') {
        const s = rawText().trim(); return s ? '"' + s.replace(/"/g, '') + '"' : '';
      }
      if (name === 'left') { const d = delim(next()); return 'LEFT ' + (d === '{' ? '{' : d === '' ? '.' : d) + ' '; }
      if (name === 'right') { const d = delim(next()); return ' RIGHT ' + (d === '}' ? '}' : d === '' ? '.' : d); }
      if (name === 'bigl' || name === 'Bigl' || name === 'biggl' || name === 'Biggl') { const d = delim(next()); return d === '{' ? '"{"' : d; }
      if (name === 'bigr' || name === 'Bigr' || name === 'biggr' || name === 'Biggr') { const d = delim(next()); return d === '}' ? '"}"' : d; }
      if (name === '{' || name === 'lbrace') return '"{"';
      if (name === '}' || name === 'rbrace') return '"}"';
      if (name === '|' || name === 'vert' || name === 'mid' || name === 'Vert') return '|';
      if (name === '%') return '%'; if (name === '_') return '_'; if (name === '&') return '"&"'; if (name === '#') return '"#"'; if (name === '$') return '$';
      if (name === ',') return '`'; if (name === ';' || name === ' ' || name === ':') return '~'; if (name === 'quad') return '~~'; if (name === 'qquad') return '~~~~'; if (name === '!') return '';
      if (name === 'circ') return 'CIRC';
      if (name === 'begin') { let nm = ''; if (peek() && peek().k === '{') { next(); while (p < toks.length && peek().k !== '}') nm += next().v; next(); } if (nm === 'array' && peek() && peek().k === '{') { next(); while (p < toks.length && peek().k !== '}') next(); next(); } return env(nm); }
      if (name === 'displaystyle' || name === 'textstyle' || name === 'scriptstyle' || name === 'limits' || name === 'nolimits' || name === 'big' || name === 'Big' || name === 'bigg' || name === 'Bigg') return '';
      if (name === 'not') return '!=';
      if (name === 'boxed' || name === 'fbox') return 'BOX{' + argument() + '}';
      if (name === 'phantom' || name === 'hphantom') { argument(); return '~~'; }
      if (name === 'bot') return 'BOT';
      if (name === 'lt') return '<'; if (name === 'gt') return '>';
      if (name === 'langle') return '<'; if (name === 'rangle') return '>';
      warnings.push('변환하지 못한 명령: \\' + name);
      return '"\\' + name + '"';
    }
    function atom() {
      const t = next(); if (!t) return '';
      switch (t.k) {
        case 'let': return t.v;
        case 'num': return t.v;
        case '{': return '{' + parseGroupBody() + '}';
        case 'cmd': return command(t.v);
        case 'ch': return t.v === "'" ? "'" : t.v;
        default: return '';
      }
    }
    function scriptArg() { const t = peek(); if (t && t.k === '{') { next(); return '{' + parseGroupBody() + '}'; } if (t && t.k === 'cmd' && t.v === 'circ') { next(); return '{CIRC}'; } return '{' + atom() + '}'; }
    function parseItem() {
      let base, grouped = false;
      if (peek() && peek().k === '{') { next(); base = parseGroupBody(); grouped = true; } else base = atom();
      // 첨자: 밑이 없는 경우("^2" 처럼 맨 앞에 옴)엔 빈 그룹을 밑으로 둔다
      let subs = '', sups = '';
      while (peek() && (peek().k === '^' || peek().k === '_')) {
        const k = next().k; const a = scriptArg();
        if (k === '^') sups += (sups ? '' : '') + a; else subs += a;
      }
      // 중괄호 그룹은 첨자가 붙을 때만 괄호를 유지한다(그냥 묶음이면 안의 내용만 — 실제 교재도 그렇게 쓴다).
      if (grouped && (subs || sups)) base = '{' + base + '}'; else if (grouped && !base) base = '{}';
      if (!subs && !sups) return base;
      const big = /^(sum|prod|int|oint|dint|tint|lim|bigcup|bigcap|max|min|sup|inf)$/.test(base);
      if (/^(\^|_)/.test(base)) base = '{}' + base;
      let out = base;
      if (subs) out += (big ? ' _' : '_') + subs;
      if (sups) out += (big ? ' ^' : '^') + sups;
      return out;
    }
    const parts = [];
    while (p < toks.length) {
      const t = peek();
      if (t.k === '}') { next(); continue; }
      if (t.k === '&') { next(); parts.push('&'); continue; }
      parts.push(parseItem());
    }
    // 각도 기호: "^{CIRC}" 대신 실제 교재에서 쓰는 "DEG"로 정리한다(90^{\circ} → 90 DEG)
    let script = join(parts).replace(/\^\{CIRC\}/g, ' DEG');
    script = script.replace(/\s+/g, ' ').replace(/\s*(\^|_)\s*\{/g, '$1{').trim();
    return { script, warnings };
  }
  root.latexToHwpEq = convert;
})(typeof window !== 'undefined' ? window : globalThis);
