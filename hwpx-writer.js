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
    async function figureParas(svg) {
      if (!svg) return '';
      const png = await svgToPng(svg); if (!png) { warnings.push('그림 하나를 변환하지 못해 빠졌어요'); return ''; }
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
      body += await figureParas(p.figure);
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
    const tpl = await fetch('hwpx-blank-template.hwpx?v=' + Date.now(), { cache: 'no-store' });
    if (!tpl.ok) throw new Error('hwpx 빈 문서 틀을 불러오지 못했어요 (hwpx-blank-template.hwpx)');
    const zip = await JSZip.loadAsync(await tpl.arrayBuffer());
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
