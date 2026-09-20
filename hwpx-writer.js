/* hwpx-writer.js — 변형 문제를 "빈 문서" hwpx 한 파일로 만들어 준다.
 *  - 수식($...$, \(...\))은 한글 수식 개체로 바꿔 넣는다 (hwpeq-lib.js 의 latexToHwpEq)
 *  - SVG 그림은 PNG 로 바꿔 그림 개체로 넣는다
 *  - 문제 뒤에 페이지를 나눠 "정답 및 풀이"를 붙인다
 *  필요: JSZip, hwpeq-lib.js, (수식 크기 측정용) KaTeX
 *  사용: const blob = await buildProblemsHwpx([{problem, figure, choices, answer, solution}, ...])
 */
(function () {
  const NS = 'xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"';
  const PARA = 25, PARA_CENTER = 47, CHAR = 48, CHAR_BOLD = 33;   // 템플릿(header.xml)에 있는 글자/문단 모양 번호
  const TEMPLATE_B64 = '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';
  const CIR = ['①', '②', '③', '④', '⑤'];
  const X = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---- 본문을 글/수식 조각으로 쪼개기 ---- */
  function splitMath(s) {
    const out = []; const re = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ t: s.slice(last, m.index) });
      out.push({ eq: (m[1] || m[2] || m[3] || m[4]).trim() });
      last = re.lastIndex;
    }
    if (last < s.length) out.push({ t: s.slice(last) });
    return out;
  }

  /* ---- 수식 크기 측정 (KaTeX 로 그려서 잰다. 10pt 기준 1em = 1000) ---- */
  let mBox = null;
  function measure(latex, script) {
    try {
      if (!window.katex) throw 0;
      if (!mBox) { mBox = document.createElement('div'); mBox.style.cssText = 'position:absolute;left:-9999px;top:0;font-size:100px;white-space:nowrap;line-height:1'; document.body.appendChild(mBox); }
      mBox.innerHTML = katex.renderToString(latex, { throwOnError: false, output: 'html' });
      const k = mBox.querySelector('.katex-html'), r = k.getBoundingClientRect();
      const st = mBox.querySelector('.strut'); let base = 86;
      if (st) { const h = parseFloat(st.style.height), v = parseFloat(st.style.verticalAlign) || 0; if (h > 0) base = Math.round(100 * (h + v) / h); }
      let h = Math.round(r.height * 10);
      if (st && parseFloat(st.style.height) > 0) h = Math.round(parseFloat(st.style.height) * 1000);
      h = Math.max(700, h);
      return { w: Math.max(250, Math.round(r.width * 10)), h, base: Math.min(95, Math.max(50, base)) };
    } catch (e) { return { w: Math.max(300, script.length * 480), h: 1000, base: 86 }; }
  }

  /* ---- SVG → PNG ---- */
  function svgToPng(svg) {
    return new Promise(res => {
      try {
        if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        const vb = (svg.match(/viewBox="([\d.\s-]+)"/) || [])[1];
        let w = 320, h = 240;
        if (vb) { const a = vb.trim().split(/\s+/).map(Number); if (a[2] > 0 && a[3] > 0) { w = a[2]; h = a[3]; } }
        const k = 900 / Math.max(w, h), cw = Math.round(w * k), ch = Math.round(h * k);
        if (!/\swidth=/.test(svg.match(/<svg[^>]*>/)[0])) svg = svg.replace('<svg', '<svg width="' + cw + '" height="' + ch + '"');
        const im = new Image();
        im.onload = () => {
          const c = document.createElement('canvas'); c.width = cw; c.height = ch;
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); g.drawImage(im, 0, 0, cw, ch);
          c.toBlob(b => b ? b.arrayBuffer().then(buf => res({ buf, w, h })) : res(null), 'image/png');
        };
        im.onerror = () => res(null);
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      } catch (e) { res(null); }
    });
  }

  async function buildProblemsHwpx(problems, opts) {
    opts = opts || {};
    const warnings = [];
    let eqId = 1000000001, zOrder = 1, picId = 2000000001;
    const images = []; // {name, buf}

    function equation(latex) {
      const conv = window.latexToHwpEq(latex);
      (conv.warnings || []).forEach(w => warnings.push(w));
      const script = conv.script; if (!script) return '';
      const m = measure(latex, script);
      return '<hp:equation id="' + (eqId++) + '" zOrder="' + (zOrder++) + '" numberingType="EQUATION" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" version="Equation Version 60" baseLine="' + m.base + '" textColor="#000000" baseUnit="1000" lineMode="CHAR" font="HYhwpEQ">' +
        '<hp:sz width="' + m.w + '" widthRelTo="ABSOLUTE" height="' + m.h + '" heightRelTo="ABSOLUTE" protect="0"/>' +
        '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>' +
        '<hp:outMargin left="56" right="56" top="0" bottom="0"/><hp:script>' + X(script) + '</hp:script></hp:equation>';
    }
    // 한 줄(문단)의 내용: 글 + 수식
    function inline(s, charId) {
      let runs = '';
      for (const seg of splitMath(String(s))) {
        if (seg.eq != null) runs += equation(seg.eq);
        else if (seg.t) runs += '<hp:t>' + X(seg.t) + '</hp:t>';
      }
      return '<hp:run charPrIDRef="' + (charId || CHAR) + '">' + runs + '</hp:run>';
    }
    const para = (inner, o) => { o = o || {}; return '<hp:p id="2147483648" paraPrIDRef="' + (o.pr || PARA) + '" styleIDRef="0" pageBreak="' + (o.pageBreak ? 1 : 0) + '" columnBreak="0" merged="0">' + inner + '</hp:p>'; };
    const blank = () => para('<hp:run charPrIDRef="' + CHAR + '"/>');
    // 여러 줄 글 → 문단들. 첫 줄 앞에 머리말(번호 등)을 붙일 수 있다
    function lines(text, head) {
      const ls = String(text || '').split(/\n/).map(x => x.replace(/\s+$/, ''));
      while (ls.length && !ls[ls.length - 1]) ls.pop();
      if (!ls.length) ls.push('');
      return ls.map((l, i) => para(inline((i === 0 && head ? head : '') + l))).join('');
    }
    function textLen(s) { return String(s).replace(/\$|\\\(|\\\)/g, '').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}^_]/g, '').length; }
    function choiceRows(choices) {
      const cs = choices.map((c, i) => (/^[①-⑤]/.test(c) ? c : CIR[i] + ' ' + c));
      const mx = Math.max.apply(null, cs.map(textLen));
      const per = mx <= 9 ? 5 : mx <= 22 ? 2 : 1;
      let out = '';
      for (let i = 0; i < cs.length; i += per) out += para(inline(cs.slice(i, i + per).join('      ')));
      return out;
    }
    // 그림 PNG(data URI)를 그대로 쓰는 경우(원본 그림 + 지운 영역) 크기를 재서 같은 형식으로 돌려준다
    function pngFromDataUri(uri) {
      return new Promise(res => {
        const im = new Image();
        im.onload = async () => { try { res({ buf: await (await fetch(uri)).arrayBuffer(), w: im.naturalWidth, h: im.naturalHeight }); } catch (e) { res(null); } };
        im.onerror = () => res(null); im.src = uri;
      });
    }
    async function figureParas(svg, pngUri) {
      if (!svg && !pngUri) return '';
      const png = pngUri ? await pngFromDataUri(pngUri) : await svgToPng(svg); if (!png) { warnings.push('그림 하나를 변환하지 못해 빠졌어요'); return ''; }
      const n = images.length + 1, name = 'image' + n + '.png'; images.push({ name, buf: png.buf, id: 'image' + n });
      let w = 18000, h = Math.round(w * png.h / png.w); if (h > 17000) { h = 17000; w = Math.round(h * png.w / png.h); }
      const pic = '<hp:pic id="' + (picId++) + '" zOrder="' + (zOrder++) + '" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="' + (picId++) + '" reverse="0">' +
        '<hp:offset x="0" y="0"/><hp:orgSz width="' + w + '" height="' + h + '"/><hp:curSz width="' + w + '" height="' + h + '"/><hp:flip horizontal="0" vertical="0"/>' +
        '<hp:rotationInfo angle="0" centerX="' + Math.round(w / 2) + '" centerY="' + Math.round(h / 2) + '" rotateimage="1"/>' +
        '<hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo>' +
        '<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="' + w + '" y="0"/><hc:pt2 x="' + w + '" y="' + h + '"/><hc:pt3 x="0" y="' + h + '"/></hp:imgRect>' +
        '<hp:imgClip left="0" right="' + w + '" top="0" bottom="' + h + '"/><hp:inMargin left="0" right="0" top="0" bottom="0"/>' +
        '<hc:img binaryItemIDRef="image' + n + '" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects/>' +
        '<hp:sz width="' + w + '" widthRelTo="ABSOLUTE" height="' + h + '" heightRelTo="ABSOLUTE" protect="0"/>' +
        '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>' +
        '<hp:outMargin left="0" right="0" top="0" bottom="0"/></hp:pic>';
      return para('<hp:run charPrIDRef="' + CHAR + '">' + pic + '<hp:t/></hp:run>', { pr: PARA_CENTER });
    }

    /* ---- 본문 조립 ---- */
    let body = '';
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      body += lines(p.problem, (i + 1) + '.  ');
      body += await figureParas(p.figure, p.figurePng);
      if (p.choices && p.choices.length) body += choiceRows(p.choices);
      body += blank() + blank();
    }
    if (opts.withAnswers !== false) {
      body += para(inline('정답 및 풀이', CHAR_BOLD), { pageBreak: true });
      body += blank();
      for (let i = 0; i < problems.length; i++) {
        const p = problems[i];
        body += para(inline((i + 1) + '.  정답  ' + (p.answer || '')));
        if (p.solution) body += lines(p.solution, '풀이  ');
        body += blank();
      }
    }
    // 첫 문단에 쪽 설정(A4 세로, 1단)을 붙인다
    const secPr = '<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="6000" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0"><hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/><hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/><hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/><hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/>' +
      '<hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_RIGHT"><hp:margin header="2835" footer="2835" gutter="0" left="5669" right="5669" top="5669" bottom="5102"/></hp:pagePr>' +
      '<hp:footNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="EACH_COLUMN" beneathText="0"/></hp:footNotePr>' +
      '<hp:endNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="END_OF_DOCUMENT" beneathText="0"/></hp:endNotePr>' +
      '<hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
      '<hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
      '<hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill></hp:secPr>' +
      '<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl>';
    const first = para('<hp:run charPrIDRef="' + CHAR + '">' + secPr + '</hp:run>');
    const section = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hs:sec ' + NS + '>' + first + body + '</hs:sec>';

    /* ---- 묶기 ---- */
    const zip = await JSZip.loadAsync(TEMPLATE_B64, { base64: true });   // 빈 문서 틀(내장 — 파일을 따로 불러오지 않는다)
    zip.file('mimetype', 'application/hwp+zip', { compression: 'STORE', createFolders: false });
    zip.file('Contents/section0.xml', section, { createFolders: false });
    const items = images.map(im => '<opf:item id="' + im.id + '" href="BinData/' + im.name + '" media-type="image/png" isEmbeded="1"/>').join('');
    images.forEach(im => zip.file('BinData/' + im.name, im.buf, { createFolders: false }));
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const hpf = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><opf:package ' + NS + ' version="" unique-identifier="" id=""><opf:metadata><opf:title>' + X(opts.title || '변형 문제') + '</opf:title><opf:language>ko</opf:language><opf:meta name="creator" content="text">MATHY YURI</opf:meta><opf:meta name="CreatedDate" content="text">' + now + '</opf:meta><opf:meta name="ModifiedDate" content="text">' + now + '</opf:meta></opf:metadata>' +
      '<opf:manifest><opf:item id="header" href="Contents/header.xml" media-type="application/xml"/>' + items + '<opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/><opf:item id="settings" href="settings.xml" media-type="application/xml"/></opf:manifest>' +
      '<opf:spine><opf:itemref idref="header" linear="yes"/><opf:itemref idref="section0" linear="yes"/></opf:spine></opf:package>';
    zip.file('Contents/content.hpf', hpf, { createFolders: false });
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/hwp+zip', compression: 'DEFLATE' });
    return { blob, warnings: Array.from(new Set(warnings)) };
  }
  window.buildProblemsHwpx = buildProblemsHwpx;
})();
