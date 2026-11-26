/* MATHY CLASS 화면 — index.html 이 불러 쓰는 부속 파일
   · 개별 수업이라 소식·미션·누적성적·수업 탭 없이, 수강생 이름이 곧 탭이에요 (원장 화면).
     수강생 탭 하나 = 그 학생 전용 한 장: [강의·결제] [정보·상담] (필요한 탭은 앞으로 그때그때 더해요)
   · 수강생 본인 화면에는 '강의신청'(+메시지) 탭만 있어요.
   · 강의·결제 부분은 shop.js(mcLecEmbed), 정보·상담 부분은 sinfo.js(sinfoEmbed)가 그려요.
   index.html 의 전역(S, U, me, isStaff, curAc, inMc, isMc, stuListAll, esc, render, vMcBox, tabsNow)을 가져다 써요. */
(function () {
  var PERSON = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.6-3.6 3.3-5.5 7-5.5s6.4 1.9 7 5.5"/></svg>';
  var PLUS = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
  var sub = 'lec';

  function staffMc() { try { var u = me(); return !!u && u.role === 'admin' && !!S.mc && curAc() === 'bd'; } catch (e) { return false; } }
  function studentMc() { try { var u = me(); return !!u && !isStaff(u) && inMc(); } catch (e) { return false; } }

  window.mcTabs = function (list) {
    if (staffMc()) {
      var keep = list.filter(function (t) { return ['shop', 'msg', 'admin'].indexOf(t[0]) >= 0; });
      var ss = stuListAll('bd').filter(function (s) { return isMc(s.cls); }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ko'); });
      var tabs = ss.map(function (s) { return ['mc:' + s.id, PERSON, s.name]; });
      tabs.push(['mcnew', PLUS, '수강생 +']);
      return tabs.concat(keep);
    }
    if (studentMc()) return list.filter(function (t) { return ['shop', 'msg'].indexOf(t[0]) >= 0; });
    return list;
  };
  window.mcGuard = function () {
    try { if (!inMc()) return; var t = tabsNow(); if (t.length && !t.some(function (x) { return x[0] === S.tab; })) S.tab = t[0][0]; } catch (e) {}
  };
  window.mcBody = function (tab) {
    tab = String(tab || '');
    if (!staffMc()) return null;
    if (tab === 'mcnew') return function () { return '<div class="note">수강생을 등록하면 왼쪽에 그 학생의 이름 탭이 생겨요.</div>' + vMcBox(); };
    if (tab.indexOf('mc:') === 0) return function () { return vStu(tab.slice(3)); };
    return null;
  };

  function vStu(sid) {
    var s = U[sid];
    if (!s || !isMc(s.cls)) return '<div class="card"><div class="empty">수강생을 찾을 수 없어요. 왼쪽에서 다시 골라 주세요.</div></div>';
    var chips = [['lec', '강의 · 결제'], ['card', '정보 · 상담']];
    var h = (sub === 'lec' ? '<div class="card" style="padding:12px 18px"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span class="muted">' + esc(s.school || '학교 미입력') + '</span>' +
      (s.phone ? '<a class="btn rose sm3" href="tel:' + esc(String(s.phone).replace(/[^0-9+]/g, '')) + '" style="text-decoration:none;margin-left:auto">📞 학부모 ' + esc(s.phone) + '</a>' : '') + '</div></div>' : '') +
      '<div class="chips">' + chips.map(function (c) { return '<button class="chip ' + (sub === c[0] ? 'on' : '') + '" data-mc="sub" data-v="' + c[0] + '" type="button">' + c[1] + '</button>'; }).join('') + '</div>';
    if (sub === 'card') return h + (typeof sinfoEmbed === 'function' ? sinfoEmbed(sid) : '');
    return h + (typeof mcLecEmbed === 'function' ? mcLecEmbed(sid) : '');
  }

  /* 화면을 그린 뒤: 그 수강생의 강의·정보를 서버에서 가져와요 */
  window.mcAfter = function () {
    var tab = String(S.tab || ''); if (tab.indexOf('mc:') !== 0 || !staffMc()) return;
    var sid = tab.slice(3);
    if (sub === 'card') { if (typeof sinfoEnsure === 'function') sinfoEnsure(sid); }
    else if (typeof shopEnsureLec === 'function') shopEnsureLec();
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-mc]'); if (!t) return;
    if (t.dataset.mc === 'sub') { sub = t.dataset.v; render(); }
  });

  var css = document.createElement('style');
  css.textContent = '.bnav.scr{display:flex;overflow-x:auto;scrollbar-width:none}.bnav.scr::-webkit-scrollbar{display:none}.bnav.scr button{flex:0 0 76px}';
  document.head.appendChild(css);
})();
