/* 빠른 정답(A4) 쪽 나누기 — 교재의 [빠른 정답] 창에서 쓰는 글 */
(async function () {
 var st = document.querySelector('.stage'), src = document.getElementById('src');
 try { await document.fonts.ready; } catch (e) { }
 try { renderMathInElement(src, { delimiters: [{ left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (e) { }
 try { await Promise.all(['KaTeX_Main', 'KaTeX_Math', 'KaTeX_Size1'].map(function (f) { return document.fonts.load('12px ' + f); })); await document.fonts.load('italic 12px KaTeX_Math'); await document.fonts.ready; } catch (e) { }
 await new Promise(function (r) { setTimeout(r, 300); });
 var blocks = [].slice.call(src.children), pages = [], body = null;
 function np() {
  var pg = document.createElement('div'); pg.className = 'pg';
  pg.innerHTML = '<div class="hd"><b>MATHY YURI</b><span>공통수학2 함수 · 빠른 정답 (교사용)</span></div><div class="bd"></div><div class="ft"><span class="pn"></span></div>';
  st.appendChild(pg); pages.push(pg); body = pg.querySelector('.bd');
 }
 np();
 blocks.forEach(function (b) {
  body.appendChild(b);
  if (body.scrollHeight > body.clientHeight + 1 && body.children.length > 1) { body.removeChild(b); np(); body.appendChild(b); }
 });
 pages.forEach(function (p, i) { p.querySelector('.pn').textContent = (i + 1) + ' / ' + pages.length; });
 document.getElementById('info').textContent = '총 ' + pages.length + '쪽 (A4)';
 function scale() { var w = Math.min(window.innerWidth - 16, 794); document.documentElement.style.setProperty('--s', Math.min(1, w / 794).toFixed(4)); }
 scale(); window.addEventListener('resize', scale);
 window.__done = true;
})();
