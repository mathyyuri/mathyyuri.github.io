/* 여백없는 PDF — 쪽마다 화면 그대로 그림으로 찍어서 한 장씩 붙이는 방식(html2canvas + jsPDF).
   브라우저 인쇄와 달리 HTML에서 보던 모양 그대로 나온다. 쪽 지정(예: 1-4, 7) 가능. */
(function () {
  var W = window.PDF_W || 257, H = window.PDF_H || 364;   // 용지(mm): 기본 B4, 성적표는 A4(210x297)
  function pagesList() { return [].slice.call(document.querySelectorAll('.stage .pg')); }
  function parse(t, n) {
    var c = String(t).split('~').join('-').split(' ').join(''); if (!c) return null;
    var seen = {}, out = [], ps = c.split(',');
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i]; if (!p) continue;
      var ab = p.split('-'), a, b;
      if (ab.length === 1) { a = b = parseInt(ab[0], 10); } else if (ab.length === 2) { a = parseInt(ab[0], 10); b = parseInt(ab[1], 10); } else return null;
      if (isNaN(a) || isNaN(b)) return null; if (a > b) { var x = a; a = b; b = x; }
      if (a < 1 || b > n) return null;
      for (var k = a; k <= b; k++) { if (!seen[k]) { seen[k] = 1; out.push(k); } }
    }
    out.sort(function (x, y) { return x - y; }); return out.length ? out : null;
  }
  function selection() {
    var n = pagesList().length, v = (document.getElementById('rng') || { value: '' }).value.trim();
    if (!v) { var all = []; for (var i = 1; i <= n; i++) all.push(i); return all; }
    var s = parse(v, n); if (!s) { alert('쪽 지정이 올바르지 않아요. 예: 1-4, 7  (표지가 1쪽, 총 ' + n + '쪽)'); return null; }
    return s;
  }
  async function capture(pg) {
    var host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-12000px;top:0;width:' + W + 'mm;height:' + H + 'mm;overflow:hidden';
    var clone = pg.cloneNode(true); clone.classList.add('cap'); clone.style.position = 'relative';
    host.appendChild(clone); document.body.appendChild(host);
    try {
      await new Promise(function (r) { setTimeout(r, 120); });
      var rc = host.getBoundingClientRect();
      return await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, width: Math.round(rc.width), height: Math.round(rc.height), logging: false });
    } finally { host.remove(); }
  }
  async function run(btn, kind) {
    var PW = window.PDF_PW || W, PH = window.PDF_PH || H;   // PDF 용지(레이아웃 크기와 다를 때: 그림을 용지에 맞춰 늘림)
    var nums = selection(); if (!nums) return;
    var orig = btn.textContent; btn.disabled = true;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      var pdf = null, J = window.jspdf && window.jspdf.jsPDF;
      if (kind === 'pdf' && !J) throw new Error('PDF 도구를 불러오지 못했어요(인터넷 연결 확인)');
      if (!window.html2canvas) throw new Error('캡처 도구를 불러오지 못했어요(인터넷 연결 확인)');
      for (var i = 0; i < nums.length; i++) {
        btn.textContent = '찍는 중... (' + (i + 1) + '/' + nums.length + ')';
        var c = await capture(pagesList()[nums[i] - 1]);
        if (kind === 'pdf') {
          if (!pdf) pdf = new J({ orientation: PW > PH ? 'landscape' : 'portrait', unit: 'mm', format: [PW, PH] }); else pdf.addPage([PW, PH], PW > PH ? 'landscape' : 'portrait');
          pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, PW, PH, undefined, 'FAST');
        } else {
          var a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = (window.PDFBASE || 'mo10') + '_' + nums[i] + '쪽.png';
          document.body.appendChild(a); a.click(); a.remove(); await new Promise(function (r) { setTimeout(r, 250); });
        }
      }
      if (kind === 'pdf') pdf.save((window.PDFBASE || 'mo10') + '.pdf');
    } catch (e) { alert('저장 실패: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = orig; }
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t && t.id === 'pdfBtn') run(t, 'pdf');
    else if (t && t.id === 'pngBtn') run(t, 'png');
  });
})();
