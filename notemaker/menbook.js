/* MEN BOOK 표지 · 뒤표지 (studentnote.html 의 디자인을 그대로 옮김) — 반별 색, 왼쪽 띠 위쪽의 세로 이름, 뒤표지 그림을 반 색으로 다시 칠하기
   사용: MB.themeFor(academy, cls) → MB.css(theme) · MB.coverHtml(info) · await MB.backHtml(theme) */
(function () {
 'use strict';
 // 반(기수+반 이름)별 색 — S · S+ · 3기는 원래 값 그대로, A · A+ 는 새로 정했어요 (없는 반은 S 색)
 var CLASS_THEMES = {
  'S': { cream: '#FBF3E7', cream2: '#F4ECDD', navy: '#0F325D', teal: '#5FB5A3', tealDeep: '#3E8F79', orange: '#E6977D', citebar: '#CFE3E0' },
  'S+': { cream: '#FBF3E7', cream2: '#F5E8DC', navy: '#5C1F3D', teal: '#C9A15A', tealDeep: '#A67F3D', orange: '#B23A3A', citebar: '#F0DEC4' },
  'A+': { cream: '#F7F4E8', cream2: '#EFEBD9', navy: '#1F4D3A', teal: '#8DB36B', tealDeep: '#5E8A3F', orange: '#D9A441', citebar: '#DCE7CF' },
  'A': { cream: '#F8F1EA', cream2: '#F1E6DB', navy: '#5A3A24', teal: '#C98F5A', tealDeep: '#A06A38', orange: '#C9633F', citebar: '#EBD9C6' }
 };
 var REF = CLASS_THEMES['S'];            // 뒤표지 원본 그림이 만들어진 기준 색(S반)
 function key(cls) { return String(cls || '').replace(/\s+/g, '').replace(/반$/, ''); }
 function themeFor(ac, cls) { return CLASS_THEMES[key(cls)] || CLASS_THEMES['S']; }

 var MB_STEP_ICONS = {
  analyze: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="15.2" y1="15.2" x2="21" y2="21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  understand: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3l2.5 2.5L17 3l2 2-2.5 2.5L19 10l-2 2-2.5-2.5L12 12l-2.5-2.5L7 12l-2-2 2.5-2.5L5 5l2-2 2.5 2.5L12 3z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  correct: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="4" width="14" height="17" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="1.4"/></svg>',
  grow: '<svg viewBox="0 0 24 24" width="20" height="20"><polyline points="4,18 10,11 14,15 21,6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15,6 21,6 21,12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
 var COVER_CSS = `/* ---- 표지 ---- */
.coverSide{position:absolute;left:0;top:0;bottom:0;width:16mm;background:var(--mb-navy);display:flex;flex-direction:column;align-items:center;padding:14mm 0}
.coverSideText{writing-mode:vertical-rl;text-orientation:upright;letter-spacing:.2em;font-family:var(--kserif);font-weight:700;font-size:14px;color:#fff}
.coverSideDiv{width:6mm;height:1px;background:var(--mb-teal);margin:6mm 0}
.coverSideRound{font-family:var(--kserif);font-weight:900;font-size:16px;color:#fff}
.coverBadge{position:absolute;top:20mm;right:16mm;width:24mm;height:24mm;border:1.4px solid var(--mb-teal);border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--kserif);font-weight:800;font-size:11px;color:var(--mb-teal);line-height:1.3}
.coverMain{position:absolute;left:16mm;right:16mm;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
/* "9월부터 중간고사 대비 시즌" 표시 — 원장님 요청으로 표지에 추가. 다른
   페이지들의 eyebrow 라벨(작게, 자간 넓게, 포인트색)과 같은 결. */
.coverEyebrow{font-size:11px;letter-spacing:.32em;font-weight:700;color:var(--mb-teal-deep);margin-bottom:6mm}
.coverWordmark{font-family:var(--kserif);font-weight:900;font-size:78px;line-height:1.05;letter-spacing:.02em}
.coverSub{font-family:var(--kserif);font-weight:700;font-size:15px;color:var(--mb-navy);margin-top:6mm}
.coverTagline{font-size:13px;color:rgba(26,26,26,.6);margin-top:4mm;font-style:italic}
.coverSteps{display:flex;align-items:center;gap:4mm;margin-top:16mm}
.cStep{display:flex;flex-direction:column;align-items:center;gap:2mm}
.cStepIcon{width:11mm;height:11mm;border-radius:50%;background:var(--mb-teal-deep);color:#fff;display:flex;align-items:center;justify-content:center}
.cStepLabel{font-size:9px;font-weight:700;letter-spacing:.06em;color:var(--mb-navy)}
.cStepLabel small{display:block;font-size:8px;font-weight:500;color:rgba(26,26,26,.55)}
.cArrow{color:var(--mb-teal);font-size:16px;font-weight:700}
.coverSign{position:absolute;right:0;bottom:16mm;text-align:right}
.signScript{display:block;font-family:'Noto Serif KR',serif;font-style:italic;font-size:18px;color:var(--mb-navy)}
.coverSign small{font-size:9px;letter-spacing:.1em;color:rgba(26,26,26,.55)}
.coverBar{position:absolute;left:0;right:0;bottom:0;height:5mm;background:linear-gradient(90deg,var(--mb-teal),var(--mb-navy))}

`;
 function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
 function css(t) {
  return ':root{--mb-cream:' + t.cream + ';--mb-cream2:' + t.cream2 + ';--mb-navy:' + t.navy + ';--mb-teal:' + t.teal + ';--mb-teal-deep:' + t.tealDeep + ';--mb-orange:' + t.orange + ';--mb-citebar:' + t.citebar + ';--mb-ink:#1A1A1A;--mb-line:#E3D9C8;--kserif:"Noto Serif KR",serif;--sans:"Noto Sans KR",sans-serif}'
   + '.men{color:var(--mb-teal);font-weight:900}.book{color:var(--mb-navy);font-weight:900}'
   + '.pg.mbcover{padding:0!important;background:var(--mb-cream2)!important}.pg.mbback{padding:0!important;background:var(--mb-cream)!important}'
   + '.mbBackcoverImg{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}'
   + COVER_CSS;
 }
 // info: { side: '대치수학2기 S반 이름', round: '01', eyebrow, sub }
 function coverHtml(info) {
  return '<div class="coverSide"><div class="coverSideText ed">' + esc(info.side) + '</div><div class="coverSideDiv"></div><div class="coverSideRound ed">' + esc(info.round) + '</div></div>'
   + '<div class="coverBadge">MEN<br>BOOK</div>'
   + '<div class="coverMain"><div class="coverEyebrow ed">' + esc(info.eyebrow) + '</div>'
   + '<div class="coverWordmark"><span class="men">MEN</span><br><span class="book">BOOK</span></div>'
   + '<div class="coverSub ed">' + esc(info.sub || '— Math Error Notebook —') + '</div>'
   + '<div class="coverTagline">&ldquo;Mistakes Become Mastery.&rdquo;</div>'
   + '<div class="coverSteps">'
   + '<div class="cStep"><div class="cStepIcon">' + MB_STEP_ICONS.analyze + '</div><div class="cStepLabel">ANALYZE<small>분석</small></div></div><div class="cArrow">›</div>'
   + '<div class="cStep"><div class="cStepIcon">' + MB_STEP_ICONS.understand + '</div><div class="cStepLabel">UNDERSTAND<small>이해</small></div></div><div class="cArrow">›</div>'
   + '<div class="cStep"><div class="cStepIcon">' + MB_STEP_ICONS.correct + '</div><div class="cStepLabel">CORRECT<small>교정</small></div></div><div class="cArrow">›</div>'
   + '<div class="cStep"><div class="cStepIcon">' + MB_STEP_ICONS.grow + '</div><div class="cStepLabel">GROW<small>성장</small></div></div></div>'
   + '<div class="coverSign"><span class="signScript">Mathy Yuri</span><small>MATHY YURI</small></div></div><div class="coverBar"></div>';
 }
 function hex(h) { var m = h.replace('#', '').match(/.{2}/g).map(function (x) { return parseInt(x, 16); }); return { r: m[0], g: m[1], b: m[2] }; }
 // 뒤표지 그림의 크림색 배경을 반 색으로 맞바꿔서 새로 그린다 (픽셀마다 목표색/기준색 비율을 곱함)
 function tintBack(t, url) {
  return new Promise(function (resolve) {
   var ref = hex(REF.cream), tg = hex(t.cream), ratio = { r: tg.r / ref.r, g: tg.g / ref.g, b: tg.b / ref.b };
   var img = new Image();
   img.onload = function () {
    var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0);
    var f = x.getImageData(0, 0, c.width, c.height), d = f.data;
    for (var i = 0; i < d.length; i += 4) { d[i] = Math.min(255, d[i] * ratio.r); d[i + 1] = Math.min(255, d[i + 1] * ratio.g); d[i + 2] = Math.min(255, d[i + 2] * ratio.b); }
    x.putImageData(f, 0, 0); resolve(c.toDataURL('image/jpeg', 0.92));
   };
   img.onerror = function () { resolve(url); };
   img.src = url;
  });
 }
 async function backHtml(t, url) { var src = await tintBack(t, url || 'notemaker/menbook_back.jpg'); return '<img class="mbBackcoverImg" src="' + src + '" alt="MEN BOOK">'; }
 window.MB = { themes: CLASS_THEMES, themeFor: themeFor, css: css, coverHtml: coverHtml, backHtml: backHtml };
})();
