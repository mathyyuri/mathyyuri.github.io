/* mathfix.js — 수식이 줄 중간(+, = 뒤)에서 끊겨 읽기 어려운 문제를 막는다.
 * 1) CSS: 수식(.katex)은 한 덩어리로만 줄을 바꾼다(수식 전체가 다음 줄로 내려감).
 * 2) 수식 하나가 한 줄 폭보다 길면 그 수식만 예전처럼 줄바꿈을 허용(.mwrap) — 쪽 밖으로 잘려 나가는 것을 막는 안전장치.
 * 이 파일 내용은 독립 실행 HTML(시험지·해설집)에도 그대로 인라인으로 들어간다(<!--MATHFIX-START-->…<!--MATHFIX-END-->). */
(function () {
  if (window.__mathfix) return; window.__mathfix = true;
  var st = document.createElement('style'); st.id = 'mathfixCss';
  st.textContent = '.katex,.katex .katex-html{white-space:nowrap}.katex.mwrap,.katex.mwrap .katex-html{white-space:normal}';
  (document.head || document.documentElement).appendChild(st);
  var timer = 0;
  function blockOf(el) {
    var c = el.parentElement;
    while (c && c !== document.body) { var d = getComputedStyle(c).display; if (d !== 'inline' && d !== 'contents') break; c = c.parentElement; }
    return c;
  }
  function fix() {
    try {
      var ks = document.querySelectorAll('.katex'), i, k, info = [];
      for (i = 0; i < ks.length; i++) ks[i].classList.remove('mwrap');
      for (i = 0; i < ks.length; i++) {          // 읽기만 모아서 한 번에(레이아웃 재계산 최소화)
        k = ks[i]; var c = blockOf(k); if (!c) continue;
        var cs = getComputedStyle(c), avail = c.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
        if (avail > 20 && k.getBoundingClientRect().width > avail + 1) info.push(k);
      }
      for (i = 0; i < info.length; i++) info[i].classList.add('mwrap');
    } catch (e) { /* 보조 기능이라 실패해도 조용히 */ }
  }
  function later() { clearTimeout(timer); timer = setTimeout(fix, 60); }
  try { new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes.length) { later(); return; } }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  window.addEventListener('resize', later);
  window.addEventListener('load', later);
  window.mathfix = fix;
  later();
})();
