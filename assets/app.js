(function () {
  "use strict";
  var D = window.RTR, M = D.module, cache = window.RTR_T = window.RTR_T || {};
  var app = document.getElementById("app"), sb = document.getElementById("sidebar"), bd = document.getElementById("backdrop");
  var TABS = [["about", "Reja", "list"], ["lecture", "Ma’ruza", "book"], ["methods", "Metodlar", "people"], ["media", "Video", "play"],
              ["didactic", "Rasmlar", "image"], ["slides", "Slaydlar", "slides"], ["control", "Test", "check"], ["glossary", "Lug‘at", "abc"]];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function ic(n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* xotira yopiq bo‘lsa ham ishlaydi */ } }
  function getJ(k, d) { try { return JSON.parse(get(k)) || d; } catch (e) { return d; } }
  function base(s) { return "mavzular/" + s + "/"; }
  function topicIx(s) { for (var i = 0; i < D.topics.length; i++) if (D.topics[i].slug === s) return i; return -1; }
  function topic(s) { var i = topicIx(s); return i < 0 ? null : D.topics[i]; }

  // ---------- matn o‘lchami va rejim
  var SIZES = [100, 115, 130], fsIx = Math.max(0, SIZES.indexOf(parseInt(get("rtr-fs2"), 10)));
  function applyFs() { document.documentElement.style.setProperty("--fs", (17 * SIZES[fsIx] / 100) + "px"); put("rtr-fs2", SIZES[fsIx]); }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t); put("rtr-theme", t);
    $("themeUse").setAttribute("href", t === "dark" ? "#i-sun" : "#i-moon");
    $("themeBtn").setAttribute("aria-label", t === "dark" ? "Yorug‘ rejim" : "Tungi rejim");
  }
  applyFs();
  applyTheme(get("rtr-theme") || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("fontBtn").onclick = function () { fsIx = (fsIx + 1) % SIZES.length; applyFs(); };
  $("themeBtn").onclick = function () { applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"); };

  // ---------- menyu va orqaga tugmasi
  var overlay = null, pendingHash = null;
  function pushOv(name) { overlay = name; try { history.pushState({ ov: name }, ""); } catch (e) { /* file:// cheklovi */ } }
  function popOv() { try { history.back(); } catch (e) { closeOv(); } }
  function closeOv() {
    if (overlay === "drawer") {
      sb.classList.remove("open"); bd.hidden = true; document.body.classList.remove("noscroll");
      $("menuBtn").setAttribute("aria-expanded", "false"); $("menuBtn").focus({ preventScroll: true });
    } else if (overlay === "lb") {
      $("lightbox").hidden = true; document.body.classList.remove("noscroll"); $("lbImg").removeAttribute("src");
    }
    overlay = null;
  }
  function openDrawer() {
    sb.classList.add("open"); bd.hidden = false; document.body.classList.add("noscroll");
    $("menuBtn").setAttribute("aria-expanded", "true"); pushOv("drawer");
    var a = sb.querySelector("a.active") || sb.querySelector("a"); if (a) { a.focus({ preventScroll: true }); a.scrollIntoView({ block: "center" }); }
  }
  $("menuBtn").onclick = function () { if (overlay === "drawer") popOv(); else openDrawer(); };
  bd.onclick = popOv;
  window.addEventListener("popstate", function () {
    if (overlay) closeOv();
    if (pendingHash) { var h = pendingHash; pendingHash = null; location.hash = h; }
  });
  sb.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a || overlay !== "drawer") return;
    e.preventDefault(); pendingHash = a.getAttribute("href"); popOv();
  });
  var tx0 = null;
  sb.addEventListener("touchstart", function (e) { tx0 = e.touches[0].clientX; }, { passive: true });
  sb.addEventListener("touchend", function (e) { if (tx0 !== null && e.changedTouches[0].clientX - tx0 < -70 && overlay === "drawer") popOv(); tx0 = null; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay) popOv(); });

  // ---------- rasmni kattalashtirish
  function zoom(src, cap) { $("lbImg").src = src; $("lbImg").alt = cap || ""; $("lbCap").textContent = cap || ""; $("lightbox").hidden = false; document.body.classList.add("noscroll"); pushOv("lb"); $("lbClose").focus(); }
  $("lbClose").onclick = popOv;
  $("lightbox").onclick = function (e) { if (e.target.id !== "lbImg") popOv(); };
  app.addEventListener("click", function (e) {
    var im = e.target.closest("img[data-zoom]");
    if (im) zoom(im.getAttribute("src"), im.getAttribute("alt"));
  });

  // ---------- sahifa boshiga va o‘qish chizig‘i
  var toTop = $("toTop"), bar = $("readBar");
  toTop.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight, y = window.pageYOffset;
    toTop.hidden = y < 500;
    bar.style.width = max > 200 ? Math.min(100, y / max * 100) + "%" : "0";
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- yon menyu
  function cur(c) { return c ? ' class="active" aria-current="page"' : ""; }
  function renderNav(slug, r) {
    var h = '<a href="#home"' + cur(r === "home") + ">" + ic("home") + '<span class="tt">Bosh sahifa</span></a><div class="nav-group">Mavzular</div>';
    D.topics.forEach(function (t, i) {
      h += '<a href="#t/' + t.slug + '/about"' + cur(t.slug === slug) + ' title="' + esc(t.title) + '"><span class="num">' + (i + 1) + '</span><span class="tt">' + esc(t.short) + "</span></a>";
    });
    h += '<div class="nav-group">Qo‘shimcha</div><a href="#glossary"' + cur(r === "glossary") + ">" + ic("abc") + '<span class="tt">Lug‘at</span></a><a href="#literature"' + cur(r === "literature") + ">" + ic("shelf") + '<span class="tt">Adabiyotlar</span></a><a href="#author"' + cur(r === "author") + ">" + ic("user") + '<span class="tt">Muallif haqida</span></a>';
    sb.innerHTML = h;
  }

  // ---------- umumiy bo‘laklar
  function foot() { return '<div class="foot">' + esc(M.author) + " • " + esc(M.org) + "</div>"; }
  function head(s, T, tab) {
    return '<div class="crumb">' + (topicIx(s) + 1) + "-mavzu • " + esc(T.type) + " • " + T.hours + ' soat</div><h1' + (tab === "about" ? "" : ' class="clamp"') + ' title="' + esc(T.title) + '">' + esc(T.title) + '</h1><div class="tabs-wrap"><div class="tabs" id="tabs">' +
      TABS.map(function (t) { return '<a href="#t/' + s + "/" + t[0] + '"' + (t[0] === tab ? ' class="active" aria-current="page"' : "") + ">" + ic(t[2]) + t[1] + "</a>"; }).join("") + "</div></div>";
  }
  function pager(s, tab) {
    var i = TABS.map(function (t) { return t[0]; }).indexOf(tab), ix = topicIx(s), a = "", b = "";
    if (i > 0) a = '<a class="btn ghost" href="#t/' + s + "/" + TABS[i - 1][0] + '">' + ic("left") + TABS[i - 1][1] + "</a>";
    else if (ix > 0) a = '<a class="btn ghost" href="#t/' + D.topics[ix - 1].slug + '/about">' + ic("left") + "Oldingi mavzu</a>";
    if (i < TABS.length - 1) b = '<a class="btn" href="#t/' + s + "/" + TABS[i + 1][0] + '">' + TABS[i + 1][1] + ic("right") + "</a>";
    else if (ix < D.topics.length - 1) b = '<a class="btn" href="#t/' + D.topics[ix + 1].slug + '/about">Keyingi mavzu' + ic("right") + "</a>";
    return '<div class="pager">' + (a || "<span></span>") + b + "</div>" + foot();
  }
  function dl(s, file) {
    var p = base(s) + "hujjatlar/" + file;
    return '<div class="dl-row"><span>Yuklab olish:</span><a href="' + p + '.docx" download>' + ic("file") + 'Word</a><a href="' + p + '.pdf" target="_blank" rel="noopener">' + ic("file") + "PDF</a></div>";
  }
  function glList(list, q) {
    q = q.toLowerCase(); var last = "", h = "";
    list.forEach(function (g) {
      if (q && (g.t + " " + g.l + " " + g.d).toLowerCase().indexOf(q) < 0) return;
      var m = /^(O‘|G‘|Sh|Ch)/.exec(g.t), L = m ? m[1] : g.t.charAt(0);
      if (L !== last && !q) { h += '<div class="letter">' + esc(L) + "</div>"; last = L; }
      h += '<div class="gl-item"><b>' + esc(g.t) + "</b><br>" + esc(g.d) + "</div>";
    });
    return h || "<p>Hech narsa topilmadi.</p>";
  }
  function glBlock(list) {
    setTimeout(function () { var q = $("glq"); if (q) q.oninput = function () { $("gll").innerHTML = glList(list, q.value); }; }, 0);
    return '<input class="search" id="glq" type="search" autocomplete="off" aria-label="So‘z qidirish" placeholder="So‘z qidirish"><div id="gll">' + glList(list, "") + "</div>";
  }
  function topicRows() {
    var best = getJ("rtr-best", {});
    return D.topics.map(function (t, i) {
      var b = best[t.slug];
      return '<a class="trow" href="#t/' + t.slug + '/about"><span class="num">' + (i + 1) + '</span><span class="tbody"><span class="ttitle">' + esc(t.short) + '</span><span class="tmeta">' + esc(t.type) + " • " + t.hours + " soat" + (b != null ? ' • <span class="ok-txt">Test: ' + b + "%</span>" : "") + "</span></span>" + ic("right") + "</a>";
    }).join("");
  }

  // ---------- umumiy sahifalar
  var P = {};
  P.home = function () {
    var last = get("rtr-last"), lt = last && topic(last.split("/")[0]);
    var h = '<div class="hero"><div class="hero-txt"><h1>' + esc(M.title) + "</h1><p>Ko‘z kasalliklarida bemorni parvarish qilishni o‘rganish uchun raqamli darslik</p>" +
      '<div class="btns">' + (lt ? '<a class="btn light" href="#t/' + last + '">Davom ettirish' + ic("right") + "</a>" : '<a class="btn light" href="#t/' + D.topics[0].slug + '/about">Boshlash' + ic("right") + "</a>") + "</div></div>" +
      '<img src="' + esc(D.hero) + '" alt="Ko‘z tuzilishi"></div>';
    h += '<div class="how"><div>' + ic("list") + "<b>Mavzuni tanlang</b></div><div>" + ic("play") + "<b>O‘qing va ko‘ring</b></div><div>" + ic("check") + "<b>Testni yeching</b></div></div>";
    return h + '<h2 id="topics">Mavzular</h2>' + topicRows() + foot();
  };
  P.topics = P.home;
  P.glossary = function () { return "<h1>Lug‘at</h1><div class=\"card\">" + glBlock(D.glossary) + "</div>" + foot(); };
  P.literature = function () { return '<h1>Adabiyotlar</h1><div class="card"><ol>' + D.literature.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ol></div>" + foot(); };
  P.author = function () {
    return '<h1>Muallif haqida</h1><div class="card"><div class="kv"><div>Muallif</div><div><b>' + esc(M.author) + "</b>, " + esc(M.author_role) + "</div><div>Ta’lim muassasasi</div><div>" + esc(M.org) +
      "</div><div>Hudud</div><div>" + esc(M.region) + "</div><div>Modul</div><div>" + esc(M.title) + "</div><div>Mutaxassislik</div><div>" + esc(M.spec_code) + " – " + esc(M.spec_name) + "</div><div>Kvalifikatsiya</div><div>" + esc(M.qualification) +
      "</div><div>Soat</div><div>" + M.hours.jami + " soat: nazariy " + M.hours.nazariy + ", amaliy " + M.hours.amaliy + ", mustaqil ta’lim " + M.hours.mustaqil + "</div></div></div>" + foot();
  };

  // ---------- mavzu sahifalari
  var V = {};
  V.about = function (s, T) {
    var h = '<div class="card"><h2>Bu darsda nimani o‘rganasiz</h2><ul class="ticks">' + T.outcomes.map(function (o) { return "<li>" + ic("check") + "<span>" + esc(o) + "</span></li>"; }).join("") + "</ul></div>";
    h += '<div class="card"><h2>Reja</h2><ol>' + T.plan.map(function (p, i) { return '<li><a href="#t/' + s + '/lecture" data-sec="lec-' + (i + 1) + '">' + esc(p) + "</a></li>"; }).join("") + "</ol></div>";
    h += "<details><summary>O‘qituvchi uchun: dars tuzilishi</summary><p>" + esc(T.goal) + '</p><div class="tbl"><table><thead><tr><th>Bosqich</th><th>Vaqt</th><th>Usul</th></tr></thead><tbody>' +
      T.structure.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>"; }).join("") + "</tbody></table></div><p><b>Tayanch so‘zlar:</b> " + T.keywords.map(esc).join(", ") + "</p></details>";
    return h;
  };
  V.lecture = function (s, T) {
    var h = dl(s, "01_Maruza_matni");
    h += '<details class="toc"><summary>Mundarija</summary>' + T.lecture_toc.map(function (t, i) { return '<a href="#t/' + s + '/lecture" data-sec="lec-' + (i + 1) + '">' + esc(t) + "</a>"; }).join("") + "</details>";
    return h + '<div class="card lecture">' + T.lecture + "<h2>Adabiyotlar</h2><ol>" + T.literature.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ol></div>";
  };
  V.methods = function (s, T) {
    var h = "<p>Darsda ishlatiladigan usullar. Birini bosing, u ochiladi.</p>";
    T.methods.forEach(function (m, i) {
      h += "<details" + (i ? "" : " open") + "><summary>" + esc(m.name) + '</summary><p class="crumb">' + esc(m.stage) + "</p><p>" + esc(m.goal) + "</p><p><b>Qanday o‘tkaziladi</b></p><ol>" +
        m.steps.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol><p><b>Shu mavzuda</b></p><ul>" + m.task.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></details>";
    });
    return h + dl(s, "02_Oqitish_metodlari");
  };
  V.media = function (s, T) {
    var h = '<div class="card"><h2>' + ic("play") + "Video dars</h2>" + '<video controls playsinline preload="none" poster="' + base(s) + 'slaydlar/slayd_01.jpg" src="' + base(s) + 'media/video.mp4"></video></div>';
    h += '<div class="card"><h2>' + ic("audio") + 'Tinglash</h2><audio controls preload="none" src="' + base(s) + 'media/audio.mp3"></audio></div>';
    (T.interactive || []).forEach(function (k) { if (W[k]) h += W[k].html(s, T); });
    if (T.algorithms && T.algorithms.length) {
      h += '<div class="card"><h2>' + ic("steps") + 'Muolajani qadamma-qadam o‘rganing</h2><div class="chip-row" id="algTabs">' +
        T.algorithms.map(function (a, i) { return '<button class="chip' + (i ? "" : " on") + '" data-i="' + i + '">' + esc(a.title) + "</button>"; }).join("") + '</div><div class="stepper" id="stepper"></div></div>';
    }
    return h;
  };
  V.didactic = function (s, T) {
    var h = '<p>Rasmni bosing, u kattalashadi.</p><div class="gallery">';
    T.gallery.forEach(function (g) {
      var p = base(s) + "didaktik/" + g.f;
      h += '<figure><img src="' + p + '" alt="' + esc(g.t) + '" loading="lazy" data-zoom><figcaption><b>' + esc(g.t) + '</b><a class="dl" href="' + p + '" download aria-label="Yuklab olish: ' + esc(g.t) + '">' + ic("down") + "</a></figcaption></figure>";
    });
    h += "</div>";
    (T.handouts || []).forEach(function (t) {
      h += '<div class="card"><h2>' + esc(t.title.replace(/^Tarqatma material:\s*/, "")) + '</h2><div class="tbl"><table><thead><tr>' + t.rows[0].map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        t.rows.slice(1).map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></div>";
    });
    return h;
  };
  var slideIx = {};
  function sp(s, i) { return base(s) + "slaydlar/slayd_" + (i < 9 ? "0" : "") + (i + 1) + ".jpg"; }
  V.slides = function (s, T) {
    var h = '<div class="slideview" id="sv"><img id="slideImg" alt="Slayd" data-zoom></div><div class="slidebar"><button class="btn ghost" id="sPrev" aria-label="Oldingi slayd">' + ic("left") + '</button><b id="sNum" aria-live="polite"></b><button class="btn" id="sNext" aria-label="Keyingi slayd">' + ic("right") + "</button></div>";
    h += '<details><summary>Izoh</summary><p id="sNote"></p></details>';
    var p = base(s) + "hujjatlar/06_Taqdimot";
    return h + '<div class="dl-row"><span>Yuklab olish:</span><a href="' + p + '.pptx" download>' + ic("slides") + 'PowerPoint</a><a href="' + p + '.pdf" target="_blank" rel="noopener">' + ic("file") + "PDF</a></div>";
  };
  V.glossary = function (s, T) { return '<div class="card">' + glBlock(T.glossary) + "</div>"; };

  function shuffle(a, seed) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; var j = Math.floor(seed / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var tstate = {};
  function ts(s) { return tstate[s] || (tstate[s] = { seed: (Date.now() % 90000) + 7, ans: {}, done: false, part: "test" }); }
  V.control = function (s, T) {
    var S = ts(s), part = S.part;
    function sw(k, n) { return '<button data-part="' + k + '"' + (part === k ? ' class="on"' : "") + ">" + n + "</button>"; }
    var h = '<div class="switch" id="ctlSw">' + sw("test", "Test") + sw("review", "Savollar") + sw("tasks", "Masalalar") + sw("match", "Juftlash") + "</div>";
    h += '<section data-p="test"' + (part === "test" ? "" : " hidden") + '><form id="testForm" novalidate>';
    shuffle(T.tests.map(function (_, i) { return i; }), S.seed).forEach(function (qi, n) {
      var q = T.tests[qi];
      h += '<fieldset class="q" data-q="' + qi + '" data-a="' + q.a + '"><div class="qt">' + (n + 1) + ". " + esc(q.q) + "</div>" +
        shuffle([0, 1, 2, 3], S.seed + qi * 7).map(function (oi) { return '<label><input type="radio" name="q' + qi + '" value="' + oi + '"' + (S.ans[qi] === oi ? " checked" : "") + "><span>" + esc(q.o[oi]) + "</span></label>"; }).join("") + "</fieldset>";
    });
    h += '<div id="testRes" aria-live="polite"></div><div class="testbar"><div class="cnt"><span id="tCnt"></span><div class="meter"><i id="tMeter" style="width:0"></i></div></div><button type="submit" class="btn" id="tSubmit">Tekshirish</button><button type="button" class="btn ghost" id="tReset" hidden>Qayta yechish</button></div></form></section>';
    h += '<section data-p="review"' + (part === "review" ? "" : " hidden") + '><div class="card"><ol>' + T.review.map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + "</ol></div></section>";
    h += '<section data-p="tasks"' + (part === "tasks" ? "" : " hidden") + ">";
    T.tasks.forEach(function (t) {
      h += '<div class="card"><h3>' + esc(t.title.replace(/^\d+-topshiriq\.\s*/, "")) + "</h3><p>" + esc(t.text) + "</p>" + (t.img ? '<figure class="fig"><img src="' + base(s) + "didaktik/" + t.img + '" alt="' + esc(t.title) + '" loading="lazy" data-zoom></figure>' : "") +
        "<details><summary>Javobni ko‘rish</summary><p>" + esc(t.check) + "</p>" + (t.answers ? "<ol>" + t.answers.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ol>" : "") + "</details></div>";
    });
    h += '</section><section data-p="match"' + (part === "match" ? "" : " hidden") + '><p>Har bir so‘zga mos izohni tanlang.</p><div class="card"><div class="match" id="match">';
    var defs = shuffle(T.matching.map(function (m) { return m[1]; }), 77);
    T.matching.forEach(function (m, i) {
      h += '<b id="ml' + i + '">' + esc(m[0]) + '</b><select aria-labelledby="ml' + i + '" data-ok="' + esc(m[1]) + '"><option value="">Tanlang</option>' + defs.map(function (d) { return "<option>" + esc(d) + "</option>"; }).join("") + "</select>";
    });
    h += '</div><div class="btns"><button class="btn" id="matchCheck">Tekshirish</button></div><div id="matchRes" aria-live="polite"></div></div></section>';
    return h + dl(s, "03_Nazorat_materiallari");
  };
  function bindControl(s, T) {
    var f = $("testForm"); if (!f) return;
    var S = ts(s), total = T.tests.length;
    $("ctlSw").onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      S.part = b.getAttribute("data-part");
      each(this.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); });
      each(app.querySelectorAll("section[data-p]"), function (x) { x.hidden = x.getAttribute("data-p") !== S.part; });
    };
    function count() { var n = Object.keys(S.ans).length; $("tCnt").textContent = n + " / " + total + " javob"; $("tMeter").style.width = (n / total * 100) + "%"; }
    count();
    f.addEventListener("change", function (e) {
      if (e.target.type !== "radio") return;
      S.ans[+e.target.name.slice(1)] = +e.target.value; e.target.closest(".q").classList.remove("miss"); count();
    });
    function grade() {
      var ok = 0;
      each(f.querySelectorAll(".q"), function (q) {
        var a = q.getAttribute("data-a"), ch = q.querySelector("input:checked");
        each(q.querySelectorAll("label"), function (l) {
          var inp = l.querySelector("input"); inp.disabled = true;
          if (inp.value === a) l.classList.add("right"); else if (inp.checked) l.classList.add("wrong");
        });
        if (ch && ch.value === a) ok++;
      });
      var p = Math.round(ok / total * 100), g = p >= 86 ? "A’lo" : p >= 71 ? "Yaxshi" : p >= 55 ? "Qoniqarli" : "Yana o‘qib chiqing";
      $("testRes").innerHTML = '<div class="result">' + ok + " / " + total + " to‘g‘ri (" + p + "%). " + g + "</div>";
      $("tSubmit").hidden = true; $("tReset").hidden = false;
      var best = getJ("rtr-best", {}); best[s] = Math.max(p, best[s] || 0); put("rtr-best", JSON.stringify(best));
    }
    f.onsubmit = function (e) {
      e.preventDefault();
      var miss = null;
      each(f.querySelectorAll(".q"), function (q) { if (!miss && !q.querySelector("input:checked")) miss = q; });
      if (miss && !S.force) {
        each(f.querySelectorAll(".q"), function (q) { q.classList.toggle("miss", !q.querySelector("input:checked")); });
        $("testRes").innerHTML = '<div class="warn">' + (total - Object.keys(S.ans).length) + " ta savol qoldi. Ularni belgilang yoki yana “Tekshirish”ni bosing.</div>";
        S.force = true; miss.scrollIntoView({ behavior: "smooth", block: "center" }); return;
      }
      S.done = true; S.force = false; grade();
      $("testRes").scrollIntoView({ behavior: "smooth", block: "center" });
    };
    $("tReset").onclick = function () { tstate[s] = null; ts(s); render(); };
    if (S.done) grade();
    $("matchCheck").onclick = function () {
      var ok = 0, sel = document.querySelectorAll("#match select");
      each(sel, function (x) { var g = x.value === x.getAttribute("data-ok"); x.className = x.value ? (g ? "ok" : "no") : "no"; if (g) ok++; });
      $("matchRes").innerHTML = '<div class="result">' + ok + " / " + sel.length + " to‘g‘ri</div>";
    };
  }
  var keySlide = null;
  function bindSlides(s, T) {
    var im = $("slideImg"); if (!im) return;
    var n = T.slides.length, sv = $("sv");
    function show(i) {
      i = Math.max(0, Math.min(n - 1, i)); slideIx[s] = i;
      im.src = sp(s, i); im.alt = (i + 1) + "-slayd: " + T.slides[i].title;
      $("sNum").textContent = (i + 1) + " / " + n; $("sNote").textContent = T.slides[i].note;
      $("sPrev").disabled = i === 0; $("sNext").disabled = i === n - 1;
    }
    $("sPrev").onclick = function () { show((slideIx[s] || 0) - 1); };
    $("sNext").onclick = function () { show((slideIx[s] || 0) + 1); };
    var x0 = null, y0 = null, swiped = false;
    sv.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; swiped = false; }, { passive: true });
    sv.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; show((slideIx[s] || 0) + (dx < 0 ? 1 : -1)); }
    });
    sv.addEventListener("click", function (e) { if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; } }, true);
    keySlide = function (d) { show((slideIx[s] || 0) + d); };
    show(slideIx[s] || 0);
  }
  document.addEventListener("keydown", function (e) {
    if (!keySlide || !$("slideImg") || overlay || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") keySlide(1); if (e.key === "ArrowLeft") keySlide(-1);
  });
  function bindAlg(T) {
    var box = $("stepper"); if (!box) return;
    var ai = 0, si = 0;
    function draw() {
      var a = T.algorithms[ai], n = a.steps.length;
      box.innerHTML = '<div class="sbar"><i style="width:' + ((si + 1) / n * 100) + '%"></i></div><div class="crumb">' + (si + 1) + "-qadam, jami " + n + '</div><div class="stext" aria-live="polite">' + esc(a.steps[si]) + '</div><div class="row"><button class="btn ghost" id="stP"' + (si ? "" : " disabled") + ">" + ic("left") + 'Orqaga</button><button class="btn" id="stN">' + (si < n - 1 ? "Keyingi" + ic("right") : "Boshidan") + "</button></div>";
      $("stP").onclick = function () { si--; draw(); };
      $("stN").onclick = function () { si = si < n - 1 ? si + 1 : 0; draw(); };
    }
    $("algTabs").onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      ai = +b.getAttribute("data-i"); si = 0;
      each(this.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); }); draw();
    };
    draw();
  }

  // ---------- interaktiv mashqlar
  var SCENE = '<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="640" height="190" fill="#bfe3f7"/><circle cx="540" cy="58" r="30" fill="#ffd54f"/><rect y="190" width="640" height="110" fill="#8bc34a"/><path d="M270 300 L310 190 L340 190 L420 300 Z" fill="#90a4ae"/><rect x="60" y="90" width="130" height="100" fill="#ef9a9a"/><path d="M50 92 L125 40 L200 92 Z" fill="#c62828"/><rect x="105" y="130" width="40" height="60" fill="#6d4c41"/><rect x="440" y="110" width="120" height="80" fill="#fff59d"/><path d="M430 112 L500 66 L570 112 Z" fill="#6a1b9a"/><circle cx="240" cy="170" r="26" fill="#2e7d32"/><rect x="235" y="175" width="10" height="26" fill="#5d4037"/><rect x="330" y="96" width="74" height="40" rx="5" fill="#1565c0"/><text x="367" y="123" font-size="24" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="700">KO‘Z</text></svg>';
  var W = {};
  W.ray = { html: function () {
    return '<div class="card"><h2>' + ic("eye") + 'Ko‘z qanday ko‘radi</h2><div class="anim-wrap"><svg viewBox="0 0 960 340" id="raySvg" xmlns="http://www.w3.org/2000/svg" font-family="Calibri,Arial"><line x1="80" y1="260" x2="80" y2="100" stroke="#1f618d" stroke-width="8"/><path d="M64 104 L80 76 L96 104 z" fill="#e67e22"/><text x="80" y="290" text-anchor="middle" font-size="18">Narsa</text><circle cx="610" cy="175" r="148" fill="#eaf6ff" stroke="#9aa5b1" stroke-width="10"/><path d="M480 100 A120 120 0 0 0 480 250" fill="none" stroke="#5dade2" stroke-width="7"/><ellipse cx="520" cy="175" rx="20" ry="55" fill="#fff3c4" stroke="#c9a227" stroke-width="3"/><path d="M745 95 A150 150 0 0 1 745 255" fill="none" stroke="#e67e22" stroke-width="7"/><g fill="none" stroke="#f39c12" stroke-width="3"><path class="ray" d="M80 95 L466 130 L520 140 L755 250"/><path class="ray" d="M80 95 L470 175 L520 180 L755 250"/><path class="ray" d="M80 255 L466 220 L520 210 L755 100"/><path class="ray" d="M80 255 L470 175 L520 170 L755 100"/></g><g class="img" opacity="0"><line x1="752" y1="105" x2="752" y2="235" stroke="#1f618d" stroke-width="6"/><path d="M744 240 L752 256 L760 240 z" fill="#1f618d"/></g><text x="440" y="300" font-size="16" text-anchor="middle">shox parda</text><text x="540" y="100" font-size="16">gavhar</text><text x="955" y="40" font-size="16" text-anchor="end">to‘r parda</text></svg></div><div class="btns"><button class="btn ghost" id="rayPlay">' + ic("play") + 'Qayta ko‘rish</button></div></div>';
  }, bind: function () {
    function play() {
      var svg = $("raySvg"); if (!svg) return;
      var img = svg.querySelector(".img"); img.setAttribute("opacity", "0");
      each(svg.querySelectorAll(".ray"), function (r, i) {
        var L = r.getTotalLength(); r.style.transition = "none"; r.style.strokeDasharray = L; r.style.strokeDashoffset = L; r.getBoundingClientRect();
        r.style.transition = "stroke-dashoffset 2s ease " + (i * .3) + "s"; r.style.strokeDashoffset = 0;
      });
      setTimeout(function () { img.setAttribute("opacity", "1"); }, 3000);
    }
    $("rayPlay").onclick = play; setTimeout(play, 300);
  } };
  W.pupil = { html: function () {
    var lines = ""; for (var i = 0; i < 24; i++) { var a = i * Math.PI / 12; lines += '<line x1="' + (300 + 40 * Math.cos(a)) + '" y1="' + (130 + 40 * Math.sin(a)) + '" x2="' + (300 + 85 * Math.cos(a)) + '" y2="' + (130 + 85 * Math.sin(a)) + '"/>'; }
    return '<div class="card"><h2>' + ic("eye") + 'Qorachiq yorug‘likka javobi</h2><p>Tugmachani suring.</p><div class="anim-wrap"><svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg"><rect id="pbg" width="600" height="260" fill="#888"/><path d="M60 130 Q300 -10 540 130 Q300 270 60 130 z" fill="#fff" stroke="#555" stroke-width="3"/><circle cx="300" cy="130" r="88" fill="#3d7ea6" stroke="#1f4e6b" stroke-width="4"/><g stroke="#2e6a8e" stroke-width="2" opacity=".6">' + lines + '</g><circle id="pupil" cx="300" cy="130" r="30" fill="#0b0b0b"/><circle cx="318" cy="112" r="8" fill="#fff" opacity=".85"/></svg></div><div class="range">' + ic("moon") + '<input type="range" id="lux" min="0" max="100" value="50" aria-label="Yoritilganlik">' + ic("sun") + '</div><p><b id="pupilTxt"></b></p></div>';
  }, bind: function () {
    var lux = $("lux"), f = function () {
      var v = +lux.value, mm = (8 - v * .06).toFixed(1).replace(".", ",");
      $("pupil").setAttribute("r", 52 - v * .42); var g = Math.round(40 + v * 2.1); $("pbg").setAttribute("fill", "rgb(" + g + "," + g + "," + Math.round(g * .95) + ")");
      $("pupilTxt").textContent = "Qorachiq: " + mm + " mm" + (v > 70 ? " (torayadi)" : v < 30 ? " (kengayadi)" : "");
    }; lux.oninput = f; f();
  } };
  W.blind = { html: function () {
    return '<div class="card"><h2>' + ic("eye") + '“Ko‘r dog‘”ni toping</h2><ol><li>Chap ko‘zni kaft bilan yoping.</li><li>O‘ng ko‘z bilan <b>+</b> belgisiga qarang.</li><li>Ekranga sekin yaqinlashing: qizil doira yo‘qolib qoladi.</li></ol><div class="blind"><span>+</span><span class="dot"></span></div></div>';
  }, bind: function () {} };
  W.refraction = { html: function () {
    return '<div class="card"><h2>' + ic("eye") + 'Yaqindan va uzoqdan ko‘rish</h2><div class="chip-row" id="refTabs"><button class="chip on" data-k="e">Sog‘lom ko‘z</button><button class="chip" data-k="m">Miopiya</button><button class="chip" data-k="h">Gipermetropiya</button></div><div class="anim-wrap"><svg viewBox="0 0 640 260" id="refSvg" xmlns="http://www.w3.org/2000/svg" font-family="Calibri,Arial"></svg></div><label class="check"><input type="checkbox" id="refLens"> Ko‘zoynak taqish</label><p id="refTxt"></p></div>';
  }, bind: function () {
    var k = "e", lens = $("refLens"), info = {
      e: ["Nurlar to‘r pardaga tushadi: ko‘z aniq ko‘radi."],
      m: ["Nurlar to‘r pardadan oldin yig‘iladi: uzoqni xira ko‘radi. Botiq (–) linza kerak."],
      h: ["Nurlar to‘r pardadan keyin yig‘iladi: yaqinni xira ko‘radi. Qavariq (+) linza kerak."] };
    function draw() {
      var ey = 130, r = k === "m" ? 112 : k === "h" ? 92 : 100, ex = 300, ret = ex + r, cor = ex - 100, fx = k === "e" || lens.checked ? ret : k === "m" ? ret - 46 : ret + 46, s = "";
      s += '<ellipse cx="' + (ex + (r - 100) / 2) + '" cy="' + ey + '" rx="' + (r + (100 - r) / 2) + '" ry="96" fill="#eaf6ff" stroke="#9aa5b1" stroke-width="7"/>';
      s += '<ellipse cx="' + (cor + 34) + '" cy="' + ey + '" rx="11" ry="36" fill="#fff3c4" stroke="#c9a227" stroke-width="2"/>';
      s += '<path d="M' + (ret - 8) + " 62 Q" + (ret + 8) + " 130 " + (ret - 8) + ' 198" fill="none" stroke="#e67e22" stroke-width="6"/>';
      var showLens = lens.checked && k !== "e";
      if (showLens) s += k === "m" ? '<path d="M112 60 Q128 130 112 200 L136 200 Q120 130 136 60 Z" fill="#aed6f1" stroke="#1f618d" stroke-width="2"/>' : '<path d="M124 60 Q100 130 124 200 Q148 130 124 60 Z" fill="#aed6f1" stroke="#1f618d" stroke-width="2"/>';
      [-46, -24, 24, 46].forEach(function (d) {
        var y0 = ey + d, lx = cor + 34, spread = showLens ? (k === "m" ? 1.18 : .84) : 1, yl = ey + d * spread;
        var endx = Math.min(fx, ret + 62), t = (endx - lx) / (fx - lx), ye = yl + (ey - yl) * t;
        s += '<path d="M30 ' + y0 + " L124 " + y0 + " L" + lx + " " + yl + " L" + endx + " " + ye + '" fill="none" stroke="#f39c12" stroke-width="2.5"/>';
        if (fx < ret) { var ye2 = ey + (ey - yl) * ((ret - fx) / (fx - lx)); s += '<path d="M' + fx + " " + ey + " L" + ret + " " + ye2 + '" fill="none" stroke="#f39c12" stroke-width="2.5" stroke-dasharray="5 4"/>'; }
      });
      s += '<circle cx="' + fx + '" cy="' + ey + '" r="6" fill="#c0392b"/>';
      $("refSvg").innerHTML = s;
      $("refTxt").textContent = lens.checked && k !== "e" ? "Ko‘zoynak bilan nurlar to‘r pardaga tushdi: ko‘z aniq ko‘radi." : info[k][0];
      lens.disabled = k === "e";
    }
    $("refTabs").onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return; k = b.getAttribute("data-k"); if (k === "e") lens.checked = false;
      each(this.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); }); draw();
    };
    lens.onchange = draw; draw();
  } };
  W.snellen = { html: function () {
    return '<div class="card"><h2>' + ic("calc") + 'Ko‘rish o‘tkirligini hisoblash</h2><p>Bemor jadvalning birinchi qatorini necha metrdan o‘qidi?</p><div class="range"><input class="num-in" id="snD" type="number" inputmode="decimal" min="0.1" max="50" step="0.1" value="2" aria-label="Masofa, metr"><span>metr</span></div><p class="note" id="snR"></p></div>';
  }, bind: function () {
    var i = $("snD"), f = function () {
      var d = parseFloat(String(i.value).replace(",", "."));
      $("snR").textContent = d > 0 ? "Ko‘rish o‘tkirligi: " + d + " / 50 = " + (Math.round(d / 50 * 1000) / 1000).toString().replace(".", ",") : "Masofani kiriting.";
    }; i.oninput = f; f();
  } };
  W.cataract = { html: function () {
    return '<div class="card"><h2>' + ic("eye") + 'Katarakta bilan qanday ko‘rinadi</h2><div class="chip-row" id="catTabs"><button class="chip on" data-i="0">Sog‘lom</button><button class="chip" data-i="1">Boshlanishi</button><button class="chip" data-i="2">O‘rta</button><button class="chip" data-i="3">Og‘ir</button></div><div class="sim-scene" id="catScene">' + SCENE + '<div class="sim-veil" id="catVeil"></div></div><p id="catTxt"></p></div>';
  }, bind: function () {
    var st = [["none", "transparent", "Gavhar tiniq: hammasi aniq ko‘rinadi."], ["blur(1.5px) sepia(.25)", "rgba(255,255,255,.12)", "Ko‘rish ozgina xiralashadi."],
      ["blur(6px) sepia(.55)", "rgba(245,240,225,.45)", "Ko‘rish keskin pasayadi, ranglar xiralashadi."], ["blur(20px) sepia(.7)", "rgba(240,238,230,.9)", "Faqat yorug‘lik seziladi. Operatsiya kerak."]];
    function set(i) { $("catScene").querySelector("svg").style.filter = st[i][0]; $("catVeil").style.background = st[i][1]; $("catTxt").textContent = st[i][2]; }
    $("catTabs").onclick = function (e) { var b = e.target.closest("button"); if (!b) return; set(+b.getAttribute("data-i")); each(this.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); }); };
    set(0);
  } };
  W.field = { html: function () {
    return '<div class="card"><h2>' + ic("eye") + 'Glaukomada ko‘rish qanday torayadi</h2><p>Tugmachani suring.</p><div class="sim-scene">' + SCENE + '<div class="sim-veil" id="fldVeil"></div></div><div class="range"><input type="range" id="fld" min="0" max="100" value="0" aria-label="Kasallik bosqichi"></div><p id="fldTxt"></p></div>';
  }, bind: function () {
    var r = $("fld"), f = function () {
      var v = +r.value, sz = 100 - v * .82;
      $("fldVeil").style.background = v ? "radial-gradient(circle at 50% 50%, transparent " + (sz * .55) + "%, #0a0a0a " + sz + "%)" : "transparent";
      $("fldTxt").textContent = v < 25 ? "Boshida odam deyarli sezmaydi." : v < 60 ? "Ko‘rish chetlardan torayadi." : v < 90 ? "Xuddi naychadan qaragandek." : "Ko‘rish yo‘qolishiga yaqin. U qaytmaydi.";
    }; r.oninput = f; f();
  } };

  // ---------- yo‘naltirish
  function loadTopic(s, cb) {
    if (cache[s]) return cb(cache[s]);
    var el = document.createElement("script"); el.src = "assets/topics/" + s + ".js?v=" + D.ver;
    el.onload = function () { cb(cache[s] || null); }; el.onerror = function () { cb(null); };
    document.head.appendChild(el);
  }
  var lastRoute = "", pendSec = null;
  $("skip").onclick = function (e) { e.preventDefault(); app.focus(); };
  function render() {
    keySlide = null;
    var r = (location.hash || "#home").slice(1), m = /^t\/([a-z]\d)\/([a-z]+)$/.exec(r);
    if (m && topic(m[1])) {
      var s = m[1], tab = TABS.some(function (x) { return x[0] === m[2]; }) ? m[2] : "about";
      renderNav(s, r);
      app.innerHTML = cache[s] ? "" : '<div class="loading">Yuklanmoqda…</div>';
      loadTopic(s, function (T) {
        if (((location.hash || "").slice(1)) !== r) return;
        if (!T) { app.innerHTML = '<div class="warn">Mavzuni ochib bo‘lmadi. Sahifani yangilang.</div>'; return; }
        app.innerHTML = head(s, T, tab) + V[tab](s, T) + pager(s, tab);
        put("rtr-last", s + "/" + tab);
        var at = app.querySelector("#tabs a.active"), tw = $("tabs");
        if (at && tw) tw.scrollLeft = at.offsetLeft - tw.offsetLeft - (tw.clientWidth - at.offsetWidth) / 2;
        bindSlides(s, T); bindControl(s, T); bindAlg(T);
        if (tab === "media") (T.interactive || []).forEach(function (k) { if (W[k]) W[k].bind(); });
        finish(r);
      });
      return;
    }
    if (!P[r]) r = "home";
    renderNav(null, r); app.innerHTML = P[r](); finish(r);
  }
  function finish(r) {
    if (pendSec) { var el = $(pendSec); pendSec = null; if (el) { el.scrollIntoView(); onScroll(); return; } }
    if (r !== lastRoute) { window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
    lastRoute = r; onScroll();
  }
  app.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-sec]"); if (!a) return;
    var id = a.getAttribute("data-sec");
    if (location.hash === a.getAttribute("href")) { e.preventDefault(); var el = $(id); if (el) el.scrollIntoView({ behavior: "smooth" }); }
    else pendSec = id;
  });
  window.addEventListener("hashchange", render);
  render();
})();
