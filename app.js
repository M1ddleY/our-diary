/* ============================================================
   咱俩的日记 · app.js
   —— 渲染时间线 + 写日记 + 搜索 + 日历 + 勾选导出/分享
   数据来源：data.js 中的 window.__DIARY__（Codex 维护，D 盘真实文件）
   手动写的内容存进 localStorage。
   ============================================================ */

(function () {
  "use strict";

  // —— 基础 ——
  var DATA_KEY = "riji_local_entries";
  var SANS = ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'].join(',');
  var SERIF = ['Fraunces', 'Georgia', 'Songti SC', 'SimSun', 'serif'].join(',');
  var MONO = ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'].join(',');

  var els = {
    timeline: document.getElementById("timeline"),
    countLede: document.getElementById("count-lede"),
    todayEyebrow: document.getElementById("today-eyebrow"),
    composer: document.getElementById("composer"),
    date: document.getElementById("entry-date"),
    title: document.getElementById("entry-title"),
    body: document.getElementById("entry-body"),
    footYear: document.getElementById("foot-year"),
    stage: document.getElementById("stage"),
    // 搜索
    searchInput: document.getElementById("search-input"),
    searchClear: document.getElementById("search-clear"),
    activeFilters: document.getElementById("active-filters"),
    // 日历
    calBtn: document.getElementById("cal-btn"),
    calWrap: document.getElementById("cal-wrap"),
    calTitle: document.getElementById("cal-title"),
    calGrid: document.getElementById("cal-grid"),
    calPrev: document.getElementById("cal-prev"),
    calNext: document.getElementById("cal-next"),
    calToday: document.getElementById("cal-today"),
    // 导出
    exportBtn: document.getElementById("export-btn"),
    exportCount: document.getElementById("export-count"),
    // 升级：语言、分页、进度条
    langbar: document.getElementById("langbar"),
    langOpts: document.getElementById("lang-opts"),
    pagination: document.getElementById("pagination"),
    progressFill: document.getElementById("progress-fill"),
    progressThumb: document.getElementById("progress-thumb"),
    progressTrack: document.getElementById("progress-track")
  };

  var navItems = document.querySelectorAll(".nav__item");

  // —— 状态 ——
  var state = {
    query: "",          // 搜索关键词 / 日期
    filterDate: null,   // 日历选中的日期 YYYY-MM-DD
    selected: new Set(),// 勾选导出的条目 id
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(), // 0-11
    calOpen: false,
    page: 1,            // 当前分页
    lang: localStorage.getItem("riji_lang") || "zh"
  };
  var PAGE_SIZE = 15;   // 每页日记数

  // —— 多语言字典：zh/en/de/it/fr/ja/ko ——
  var LANGS = ["zh", "en", "de", "it", "fr", "ja", "ko"];
  var LANG_NAMES = { zh: "中文", en: "English", de: "Deutsch", it: "Italiano", fr: "Français", ja: "日本語", ko: "한국어" };
  var I18N = {
    zh: { app_title:"咱俩的日记", app_sub:"你 & Codex · 每日一记", nav_timeline:"时间线", nav_compose:"写今天",
      timeline_title:"一路走来", calendar:"日历", gallery:"打开图库", export:"导出分享", language:"语言", cal_today:"回到今天",
      compose_title:"写今天", compose_lede:"记录这一刻属于咱俩的片刻", field_date:"日期", field_title:"标题",
      field_body:"正文", search_ph:"搜日期（如 2026-09-05）或关键词…", field_title_ph:"给今天起个名字",
      field_body_ph:"今天的我们，做了什么，说了什么……", composer_hint:"正文会由 Codex 同步进 data.js 文件，不会丢。", composer_submit:"记下一笔",
      count:"共 {n} 篇", latest:"最新 {d}", start:"起点", you:"你", author_codex:"Codex", author_you:"你",
      empty:"没有符合条件的日记。换个日期或关键词试试。", found:"找到 {shown} / {total} 篇 —— {label}", clear:"清除筛选 ✕",
      date_label:"日期「{d}」", contains:"含「{q}」", page_info:"第 {cur} 页 / 共 {total} 页", prev:"上一页", next:"下一页",
      check_title:"勾选导出", check_aria:"勾选导出这篇日记", calendar_title:"日历", export_aria:"导出分享",
      today:"今天", progress_label:"翻阅进度" },
    en: { app_title:"Our Diary", app_sub:"You & Codex · One entry a day", nav_timeline:"Timeline", nav_compose:"Write today",
      timeline_title:"The Journey", calendar:"Calendar", gallery:"Gallery", export:"Export / Share", language:"Language", cal_today:"Back to today",
      compose_title:"Write today", compose_lede:"Record a moment between us", field_date:"Date", field_title:"Title",
      field_body:"Body", search_ph:"Search date (e.g. 2026-09-05) or keyword…", field_title_ph:"Name today",
      field_body_ph:"What we did, what we said today…", composer_hint:"Body will be synced by Codex into data.js.", composer_submit:"Write it down",
      count:"{n} entries", latest:"Latest {d}", start:"Start", you:"You", author_codex:"Codex", author_you:"You",
      empty:"No matching entries. Try another date or keyword.", found:"Found {shown} / {total} — {label}", clear:"Clear filters ✕",
      date_label:'date "{d}"', contains:'contains "{q}"', page_info:"Page {cur} of {total}", prev:"Prev", next:"Next",
      check_title:"Select to export", check_aria:"Select this entry to export", calendar_title:"Calendar", export_aria:"Export / Share",
      today:"Today", progress_label:"Reading progress" },
    de: { app_title:"Unser Tagebuch", app_sub:"Du & Codex · Ein Eintrag pro Tag", nav_timeline:"Zeitleiste", nav_compose:"Heute schreiben",
      timeline_title:"Der Weg", calendar:"Kalender", gallery:"Galerie", export:"Export / Teilen", language:"Sprache", cal_today:"Zurück zu heute",
      compose_title:"Heute schreiben", compose_lede:"Halte einen Moment zwischen uns fest", field_date:"Datum", field_title:"Titel",
      field_body:"Text", search_ph:"Datum (z.B. 2026-09-05) oder Stichwort suchen…", field_title_ph:"Heute benennen",
      field_body_ph:"Was wir heute getan, gesagt haben…", composer_hint:"Text wird von Codex in data.js synchronisiert.", composer_submit:"Festhalten",
      count:"{n} Einträge", latest:"Neueste {d}", start:"Anfang", you:"Du", author_codex:"Codex", author_you:"Du",
      empty:"Keine passenden Einträge. Anderes Datum oder Stichwort versuchen.", found:"{shown} / {total} gefunden — {label}", clear:"Filter löschen ✕",
      date_label:'Datum "{d}"', contains:'enthält "{q}"', page_info:"Seite {cur} von {total}", prev:"Zurück", next:"Weiter",
      check_title:"Zum Export auswählen", check_aria:"Diesen Eintrag zum Export auswählen", calendar_title:"Kalender", export_aria:"Export / Teilen",
      today:"Heute", progress_label:"Lesefortschritt" },
    it: { app_title:"Il Nostro Diario", app_sub:"Tu & Codex · Un ricordo al giorno", nav_timeline:"Cronologia", nav_compose:"Scrivi oggi",
      timeline_title:"Il Cammino", calendar:"Calendario", gallery:"Galleria", export:"Esporta / Condividi", language:"Lingua", cal_today:"Torna a oggi",
      compose_title:"Scrivi oggi", compose_lede:"Registra un momento tra noi", field_date:"Data", field_title:"Titolo",
      field_body:"Testo", search_ph:"Cerca data (es. 2026-09-05) o parola…", field_title_ph:"Dai un nome a oggi",
      field_body_ph:"Cosa abbiamo fatto, detto oggi…", composer_hint:"Il testo sarà sincronizzato da Codex in data.js.", composer_submit:"Annota",
      count:"{n} voci", latest:"Ultima {d}", start:"Inizio", you:"Tu", author_codex:"Codex", author_you:"Tu",
      empty:"Nessuna voce corrispondente. Prova un'altra data o parola.", found:"Trovate {shown} / {total} — {label}", clear:"Rimuovi filtri ✕",
      date_label:'data "{d}"', contains:'contiene "{q}"', page_info:"Pagina {cur} di {total}", prev:"Prec", next:"Succ",
      check_title:"Seleziona per esportare", check_aria:"Seleziona questa voce da esportare", calendar_title:"Calendario", export_aria:"Esporta / Condividi",
      today:"Oggi", progress_label:"Avanzamento lettura" },
    fr: { app_title:"Notre Journal", app_sub:"Toi & Codex · Une entrée par jour", nav_timeline:"Chronologie", nav_compose:"Écrire aujourd'hui",
      timeline_title:"Le Chemin", calendar:"Calendrier", gallery:"Galerie", export:"Exporter / Partager", language:"Langue", cal_today:"Retour à aujourd'hui",
      compose_title:"Écrire aujourd'hui", compose_lede:"Consigner un moment entre nous", field_date:"Date", field_title:"Titre",
      field_body:"Texte", search_ph:"Chercher une date (ex. 2026-09-05) ou un mot…", field_title_ph:"Nommer aujourd'hui",
      field_body_ph:"Ce que nous avons fait, dit aujourd'hui…", composer_hint:"Le texte sera synchronisé par Codex dans data.js.", composer_submit:"Écrire",
      count:"{n} entrées", latest:"Dernière {d}", start:"Début", you:"Toi", author_codex:"Codex", author_you:"Toi",
      empty:"Aucune entrée correspondante. Essayez une autre date ou un mot.", found:"{shown} / {total} trouvées — {label}", clear:"Effacer les filtres ✕",
      date_label:'date « {d} »', contains:'contient « {q} »', page_info:"Page {cur} / {total}", prev:"Préc", next:"Suiv",
      check_title:"Sélectionner pour exporter", check_aria:"Sélectionner cette entrée à exporter", calendar_title:"Calendrier", export_aria:"Exporter / Partager",
      today:"Aujourd'hui", progress_label:"Progression de lecture" },
    ja: { app_title:"ふたりの日記", app_sub:"あなた & Codex · 一日一記", nav_timeline:"タイムライン", nav_compose:"今日を書く",
      timeline_title:"歩んできた道", calendar:"カレンダー", gallery:"ギャラリー", export:"書き出し / 共有", language:"言語", cal_today:"今日に戻る",
      compose_title:"今日を書く", compose_lede:"ふたりのひとときを記す", field_date:"日付", field_title:"タイトル",
      field_body:"本文", search_ph:"日付（例 2026-09-05）やキーワードを検索…", field_title_ph:"今日に名前を",
      field_body_ph:"今日、ふたりがしたこと、話したこと…", composer_hint:"本文は Codex が data.js に同期します。", composer_submit:"書き留める",
      count:"全 {n} 件", latest:"最新 {d}", start:"始まり", you:"あなた", author_codex:"Codex", author_you:"あなた",
      empty:"該当する日記がありません。日付かキーワードを変えてください。", found:"{shown} / {total} 件 — {label}", clear:"絞り込みを解除 ✕",
      date_label:"日付「{d}」", contains:"「{q}」を含む", page_info:"{cur} / 全 {total} ページ", prev:"前へ", next:"次へ",
      check_title:"書き出し用に選択", check_aria:"この日記を書き出し用に選択", calendar_title:"カレンダー", export_aria:"書き出し / 共有",
      today:"今日", progress_label:"閲覧の進み具合" },
    ko: { app_title:"우리들의 일기", app_sub:"당신 & Codex · 하루 한 편", nav_timeline:"타임라인", nav_compose:"오늘 쓰기",
      timeline_title:"걸어온 길", calendar:"달력", gallery:"갤러리", export:"내보내기 / 공유", language:"언어", cal_today:"오늘로",
      compose_title:"오늘 쓰기", compose_lede:"우리 사이의 한 순간을 기록", field_date:"날짜", field_title:"제목",
      field_body:"본문", search_ph:"날짜(예: 2026-09-05)나 키워드 검색…", field_title_ph:"오늘에 이름을",
      field_body_ph:"오늘 우리가 한 일, 한 말…", composer_hint:"본문은 Codex가 data.js에 동기화합니다.", composer_submit:"기록하기",
      count:"총 {n}편", latest:"최신 {d}", start:"시작", you:"당신", author_codex:"Codex", author_you:"당신",
      empty:"해당하는 일기가 없습니다. 날짜나 키워드를 바꿔보세요.", found:"{shown} / {total}편 — {label}", clear:"필터 지우기 ✕",
      date_label:"날짜「{d}」", contains:"「{q}」포함", page_info:"{cur} / 전체 {total} 페이지", prev:"이전", next:"다음",
      check_title:"내보내기 선택", check_aria:"이 일기를 내보내기로 선택", calendar_title:"달력", export_aria:"내보내기 / 공유",
      today:"오늘", progress_label:"읽기 진행도" }
  };

  function t(key) {
    var dict = I18N[state.lang] || I18N.zh;
    return dict[key] !== undefined ? dict[key] : (I18N.zh[key] !== undefined ? I18N.zh[key] : key);
  }
  function tpl(key, vars) {
    var s = t(key);
    for (var k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  }

  // 应用静态文案 + placeholder
  function applyLang() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (I18N[state.lang] && I18N[state.lang][k] !== undefined) el.textContent = I18N[state.lang][k];
      else if (I18N.zh[k]) el.textContent = I18N.zh[k];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph");
      if (I18N[state.lang] && I18N[state.lang][k] !== undefined) el.setAttribute("placeholder", I18N[state.lang][k]);
      else if (I18N.zh[k]) el.setAttribute("placeholder", I18N.zh[k]);
    });
    document.title = t("app_title");
    document.documentElement.lang = state.lang;
    // 语言按钮状态
    if (els.langOpts) {
      els.langOpts.querySelectorAll(".lang-opt").forEach(function (b) {
        b.classList.toggle("is-on", b.dataset.lang === state.lang);
      });
    }
  }

  // 构建语言切换按钮 + 绑定
  function initLangBar() {
    els.langOpts.innerHTML = "";
    LANGS.forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "lang-opt" + (code === state.lang ? " is-on" : "");
      b.dataset.lang = code;
      b.textContent = LANG_NAMES[code];
      b.title = LANG_NAMES[code];
      b.addEventListener("click", function () {
        state.lang = code;
        localStorage.setItem("riji_lang", code);
        applyLang();
        render();
        renderCal();
      });
      els.langOpts.appendChild(b);
    });
    applyLang();
  }

  // —— 数据读取 ——
  function readAll() {
    var server = (window.__DIARY__ || []).slice();
    var local = [];
    try { local = JSON.parse(localStorage.getItem(DATA_KEY) || "[]"); } catch (e) { local = []; }
    var merged = server.concat(local);
    merged.sort(function (a, b) { return b.date.localeCompare(a.date); });
    // 需要 id 供勾选
    merged.forEach(function (it, i) { if (!it.id) it.id = (it.local_id || "auto-" + i); });
    return merged;
  }

  // —— 过滤（搜索 + 日期）——
  function applyFilters(all) {
    var q = state.query.trim().toLowerCase();
    var date = state.filterDate;
    return all.filter(function (it) {
      if (date && it.date !== date) return false;
      if (!q) return true;
      var hay = (it.title + " " + it.body + " " + it.date).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  // —— 渲染时间线（分页）——
  function render() {
    var all = readAll();
    var filtered = applyFilters(all);
    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    var startIdx = (state.page - 1) * PAGE_SIZE;
    var pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

    els.timeline.innerHTML = "";
    renderResultNote(all.length, total);

    if (total === 0) {
      els.timeline.appendChild(findEmptyTemplate());
      els.countLede.textContent = tpl("count", { n: all.length });
      els.todayEyebrow.textContent = all.length ? tpl("latest", { d: all[0].date }) : t("start");
      renderPagination(1, 1, 0);
      updateProgress();
      return;
    }

    els.countLede.textContent = tpl("count", { n: all.length });
    var shown = state.filterDate ? tpl("date_label", { d: state.filterDate }) : "";
    els.todayEyebrow.textContent = state.filterDate ? shown : tpl("latest", { d: all[0].date });

    // 按时间正序标序号：filtered 是倒序（新在前），反转得到时间顺序，最早为第 1 篇
    var orderMap = {};
    filtered.slice().reverse().forEach(function (it, idx) { orderMap[it.id] = idx + 1; });

    pageItems.forEach(function (item, i) {
      var card = document.createElement("article");
      card.className = "entry is-selectable";
      if (state.selected.has(item.id)) card.classList.add("is-selected");
      card.style.animationDelay = (i * 0.03) + "s";
      var seqNum = orderMap[item.id] || (i + 1);

      var authorLabel = (item.author === "you") ? t("you") : "Codex";

      // 序号 + 日期（同一行，垂直居中）
      var meta = document.createElement("div");
      meta.className = "entry__meta";
      var metaLeft = document.createElement("div");
      metaLeft.className = "entry__meta-left";
      var seq = document.createElement("span");
      seq.className = "entry__seq";
      seq.textContent = seqNum;
      seq.setAttribute("aria-label", "第 " + seqNum + " 篇");
      var dateEl = document.createElement("span");
      dateEl.className = "entry__date";
      dateEl.textContent = item.date;
      metaLeft.appendChild(seq);
      metaLeft.appendChild(dateEl);
      var authorEl = document.createElement("span");
      authorEl.className = "entry__author";
      authorEl.textContent = "· " + authorLabel;
      meta.appendChild(metaLeft);
      meta.appendChild(authorEl);

      var h = document.createElement("h3");
      h.className = "entry__title";
      h.textContent = item.title;

      var pEl = document.createElement("p");
      pEl.className = "entry__body";
      pEl.innerHTML = bodyToHtml(item.body);

      card.appendChild(meta);
      card.appendChild(h);
      card.appendChild(pEl);

      // 勾选按钮
      var check = document.createElement("button");
      check.className = "entry__check";
      check.type = "button";
      check.title = t("check_title");
      check.setAttribute("aria-label", t("check_aria"));
      check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
      check.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleSelect(item.id, card);
      });
      card.appendChild(check);

      card.addEventListener("click", function () { openDetail(item); });
      els.timeline.appendChild(card);
    });

    renderPagination(state.page, totalPages, total);
    updateProgress();
  }

  // —— 分页渲染 ——
  function renderPagination(cur, totalPages, total) {
    els.pagination.innerHTML = "";
    // 上一页
    var prev = document.createElement("button");
    prev.type = "button"; prev.className = "page-btn page-btn--nav"; prev.textContent = "‹ " + t("prev");
    prev.disabled = cur <= 1;
    prev.addEventListener("click", function () { if (state.page > 1) { state.page--; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
    els.pagination.appendChild(prev);

    // 页码
    var win = 1;
    var lo = Math.max(1, cur - win), hi = Math.min(totalPages, cur + win);
    for (var i = lo; i <= hi; i++) {
      (function (pg) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "page-btn" + (pg === cur ? " is-on" : ""); b.textContent = pg;
        b.addEventListener("click", function () { state.page = pg; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
        els.pagination.appendChild(b);
      })(i);
    }

    // 下一页
    var next = document.createElement("button");
    next.type = "button"; next.className = "page-btn page-btn--nav"; next.textContent = t("next") + " ›";
    next.disabled = cur >= totalPages;
    next.addEventListener("click", function () { if (state.page < totalPages) { state.page++; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
    els.pagination.appendChild(next);

    // 信息
    var info = document.createElement("span");
    info.className = "page-info";
    info.textContent = tpl("page_info", { cur: cur, total: totalPages });
    els.pagination.appendChild(info);
  }

  // —— 竖向进度条 ——
  // 动态滚动进度：基于页面滚动位置实时更新
  function updateProgress() {
    if (!els.progressFill || !els.progressThumb) return;
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop || 0;
    var scrollHeight = doc.scrollHeight - window.innerHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) : 0;
    pct = Math.max(0, Math.min(1, pct));
    var fillHpx = (pct * (els.progressTrack.offsetHeight - 20));
    els.progressFill.style.height = fillHpx + "px";
    // thumb 精确位于填充线最前端（fill 顶端 + 填充高度）
    var topPx = 10 + fillHpx;
    els.progressThumb.style.top = topPx + "px";
  }

  // 绑定滚动监听（节流 + rAF 平滑）
  var progressRaf = null;
  function onScroll() {
    if (progressRaf) return;
    progressRaf = requestAnimationFrame(function () {
      progressRaf = null;
      updateProgress();
    });
  }

  function renderResultNote(total, shown) {
    var hasFilter = state.query.trim() || state.filterDate;
    var note = document.getElementById("result-note");
    if (!hasFilter) { if (note) note.remove(); return; }
    if (!note) {
      note = document.createElement("div");
      note.id = "result-note";
      note.className = "result-note";
      els.timeline.parentNode.insertBefore(note, els.timeline);
    }
    var label = "";
    if (state.filterDate) label += tpl("date_label", { d: state.filterDate });
    if (state.query.trim()) label += (label ? " · " : "") + tpl("contains", { q: state.query.trim() });
    note.innerHTML = "<span>" + tpl("found", { shown: shown, total: total, label: label }) + "</span>" +
      '<button class="clear-all" type="button">' + t("clear") + '</button>';
    note.querySelector(".clear-all").addEventListener("click", clearAllFilters);
  }

  function findEmptyTemplate() {
    var box = document.createElement("div");
    box.className = "empty";
    box.innerHTML = "<p>" + t("empty") + "</p>";
    return box;
  }

  // —— 勾选 ——
  function toggleSelect(id, card) {
    var all = readAll();
    if (state.selected.has(id)) {
      state.selected.delete(id);
      if (card) card.classList.remove("is-selected");
    } else {
      state.selected.add(id);
      if (card) card.classList.add("is-selected");
    }
    updateExportBadge();
  }
  function updateExportBadge() {
    var n = state.selected.size;
    if (n > 0) { els.exportCount.textContent = n; els.exportCount.hidden = false; }
    else { els.exportCount.hidden = true; }
    // 勾选了日记 -> 按钮纯绿；未勾选 -> 浅底绿框
    if (els.exportBtn) els.exportBtn.classList.toggle("is-active", n > 0);
  }

  // —— 详情弹层 ——
  function openDetail(item) {
    var overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:60;background:rgba(30,26,20,.42);display:flex;align-items:center;justify-content:center;padding:24px;";
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });

    var panel = document.createElement("div");
    panel.style.cssText = "background:var(--surface);max-width:620px;width:100%;border-radius:var(--r-lg);padding:32px 34px;box-shadow:0 40px 120px -30px rgba(30,26,20,.4);max-height:86vh;overflow:auto;";

    var authorLabel = (item.author === "you") ? "你" : "Codex";
    panel.innerHTML =
      '<div style="font-family:var(--font-mono);font-size:12px;color:var(--gold);letter-spacing:.06em;">' + item.date + ' </div>' +
      '<div style="font-family:var(--font-mono);font-size:11px;color:var(--dim);letter-spacing:.14em;text-transform:uppercase;margin-top:4px;">' + authorLabel + '</div>' +
      '<h2 style="font-family:var(--font-serif);font-size:30px;font-weight:540;letter-spacing:-.01em;margin:18px 0 14px;">' + item.title + '</h2>' +
      '<p style="font-family:' + SANS + ';color:var(--ink-soft);font-size:16px;line-height:1.85;white-space:pre-wrap;margin:0;">' + bodyToHtml(item.body) + '</p>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function bodyToHtml(s) {
    return escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  // —— 视图切换 ——
  function switchView(name) {
    navItems.forEach(function (b) { b.classList.toggle("is-active", b.dataset.view === name); });
    document.querySelectorAll(".view").forEach(function (v) { v.classList.toggle("is-active", v.id === "view-" + name); });
    if (name === "compose") {
      if (!els.date.value) {
        var t = new Date();
        els.date.value = t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
      }
      els.stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmtDate(d) {
    d = typeof d === "string" ? new Date(d + "T00:00:00") : d;
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  navItems.forEach(function (b) {
    b.addEventListener("click", function () { switchView(b.dataset.view); });
  });

  // —— 搜索 ——
  els.searchInput.addEventListener("input", function () {
    state.query = els.searchInput.value;
    els.searchInput.closest(".search").classList.toggle("has-value", !!state.query.trim());
    render();
  });
  els.searchClear.addEventListener("click", function () {
    els.searchInput.value = "";
    state.query = "";
    state.page = 1;
    els.searchInput.closest(".search").classList.remove("has-value");
    render();
    els.searchInput.focus();
  });

  function clearAllFilters() {
    state.query = "";
    state.filterDate = null;
    state.page = 1;
    state.selected.clear();
    els.searchInput.value = "";
    els.searchInput.closest(".search").classList.remove("has-value");
    updateExportBadge();
    render();
  }

  // —— 日历 ——
  function toggleCal(force) {
    // 移动端：开合右侧日历栏；桌面端常驻，此按钮隐藏
    state.calOpen = (typeof force === "boolean") ? force : !state.calOpen;
    var side = document.querySelector(".layout__side");
    if (side) side.classList.toggle("is-open", state.calOpen);
    els.calBtn.classList.toggle("is-open", state.calOpen);
    if (state.calOpen) renderCal();
  }

  function renderCal() {
    var y = state.calYear, m = state.calMonth;
    els.calTitle.textContent = y + " 年 " + (m + 1) + " 月";

    var DOW = ["日","一","二","三","四","五","六"];
    els.calGrid.innerHTML = "";
    DOW.forEach(function (d, i) {
      var el = document.createElement("span");
      el.className = "cal__dow" + (i === 0 ? " cal__dow--sun" : (i === 6 ? " cal__dow--sat" : ""));
      el.textContent = d;
      els.calGrid.appendChild(el);
    });

    var all = readAll();
    var dates = {};
    all.forEach(function (it) {
      if (it.date && it.date.slice(0,4) === String(y)) dates[it.date] = true;
    });

    var first = new Date(y, m, 1);
    var startDow = first.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = new Date();
    var todayStr = today.getFullYear() + "-" + pad(today.getMonth()+1) + "-" + pad(today.getDate());

    for (var i = 0; i < startDow; i++) {
      var empty = document.createElement("span");
      empty.className = "cal__day cal__day--empty";
      els.calGrid.appendChild(empty);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      let ds = y + "-" + pad(m + 1) + "-" + pad(day);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal__day";
      btn.textContent = day;
      if (dates[ds]) btn.classList.add("cal__day--has");
      if (ds === todayStr) btn.classList.add("cal__day--today");
      if (ds === state.filterDate) { btn.classList.add("cal__day--selected"); }
      btn.addEventListener("click", function () { pickDate(ds); });
      els.calGrid.appendChild(btn);
    }
  }

  function pickDate(ds) {
    state.page = 1;
    if (state.filterDate === ds) {
      state.filterDate = null;
    } else {
      state.filterDate = ds;
    }
    render();
    renderCal();
  }

  els.calBtn.addEventListener("click", function () { toggleCal(); });
  els.calPrev.addEventListener("click", function () {
    state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCal();
  });
  els.calNext.addEventListener("click", function () {
    state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCal();
  });
  els.calToday.addEventListener("click", function () {
    var t = new Date();
    state.calYear = t.getFullYear();
    state.calMonth = t.getMonth();
    pickDate(t.getFullYear() + "-" + pad(t.getMonth()+1) + "-" + pad(t.getDate()));
    renderCal();
  });

  // —— 导出 / 分享 ——
  els.exportBtn.addEventListener("click", function () { openExport(); });
  // 打开图库：直接打开导出目录
  var galleryBtn = document.getElementById("gallery-btn");
  if (galleryBtn) {
    galleryBtn.addEventListener("click", function () {
      fetch("/open-export").then(function (r) { return r.json(); }).then(function (res) {
        toast(res.ok ? ("已打开图库" + (res.dir ? "（" + res.dir + "）" : "")) : ("打开失败：" + res.error));
      });
    });
  }
  // 备份日记：交给本地服务写入备份目录
  var backupBtn = document.getElementById("backup-btn");
  if (backupBtn) {
    backupBtn.addEventListener("click", function () {
      var all = readAll();
      toast("正在备份 " + all.length + " 篇日记…");
      fetch("/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: all })
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.ok) {
          var backupDir = res.path ? res.path.substring(0, res.path.lastIndexOf("\\")) : "";
          toast("已备份 " + res.count + " 篇 → " + backupDir);
        } else {
          toast("备份失败：" + res.error);
        }
      }).catch(function () { toast("备份失败，请检查服务"); });
    });
  }

  function getExportItems() {
    var all = readAll();
    // 优先勾选，否则当前筛选结果
    if (state.selected.size > 0) {
      return all.filter(function (it) { return state.selected.has(it.id); });
    }
    return applyFilters(all);
  }

    function openExport() {
    var items = getExportItems();
    if (items.length === 0) { toast("没有可导出的日记"); return; }
    var multi = items.length > 1;

    var selDir = "horizontal";
    var selRatio = "4:3";
    var RATIOS = { horizontal: ["4:3", "16:9", "3:2"], vertical: ["3:4", "9:16", "2:3"], square: ["1:1"], auto: [] };
    var RATIO_LABEL = { "4:3": "4:3", "16:9": "16:9", "3:2": "3:2", "3:4": "3:4", "9:16": "9:16", "2:3": "2:3", "1:1": "1:1" };

    // 导出方式 + 分组状态
    var exportMode = "merge";       // merge | separate | custom
    var customGroups = [];          // [{ id, name, itemIds: [] }]
    var previewGroupIdx = 0;        // 当前预览第几个组（部分合并时）

    var overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:70;background:rgba(30,26,20,.5);display:flex;align-items:center;justify-content:center;padding:24px;";
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });

    var panel = document.createElement("div");
    panel.style.cssText = "background:var(--surface);max-width:900px;width:100%;border-radius:var(--r-lg);box-shadow:0 40px 120px -30px rgba(30,26,20,.4);max-height:92vh;overflow:auto;";
    panel.innerHTML =
      '<div style="display:grid;grid-template-columns:minmax(0,400px) 1fr;gap:26px;padding:28px 30px;">' +
        // 左：控件
        '<div>' +
          '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 8px;">分享 / 导出</p>' +
          '<h2 style="font-family:var(--font-serif);font-size:24px;font-weight:540;margin:0 0 6px;">做成精美笔记</h2>' +
          '<p style="font-family:' + SANS + ';color:var(--dim);font-size:13px;margin:0 0 14px;">已选 ' + items.length + ' 篇。</p>' +

          (multi ? (
          '<div style="margin-bottom:14px;">' +
            '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 10px;">0 · 导出方式</p>' +
            '<div class="seg" id="seg-mode" style="display:flex;gap:8px;flex-wrap:wrap;">' +
              '<button data-mode="merge" type="button" class="seg-btn is-on">合并导出</button>' +
              '<button data-mode="separate" type="button" class="seg-btn">分别导出</button>' +
              '<button data-mode="custom" type="button" class="seg-btn">部分合并</button>' +
            '</div>' +
          '</div>'
          ) : '') +

          // 自定义分组管理区
          (multi ? '<div id="group-block" style="display:none;margin-bottom:14px;">' +
            '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 8px;">分组（点组名预览该组 · 点日记切换归属）</p>' +
            '<div id="group-list" style="display:flex;flex-direction:column;gap:10px;"></div>' +
            '<button id="add-group" type="button" style="margin-top:8px;font-family:inherit;font-size:13px;color:var(--accent-deep);background:var(--bg);border:1px dashed var(--accent);border-radius:10px;padding:8px 12px;cursor:pointer;width:100%;">+ 新建分组</button>' +
          '</div>' : '') +

          '<div style="margin-bottom:16px;">' +
            '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 10px;">' + (multi ? '1 ·' : '1 ·') + ' 方向</p>' +
            '<div class="seg" id="seg-dir" style="display:flex;gap:8px;flex-wrap:wrap;">' +
              '<button data-dir="horizontal" type="button" class="seg-btn is-on">横版</button>' +
              '<button data-dir="vertical" type="button" class="seg-btn">竖版</button>' +
              '<button data-dir="square" type="button" class="seg-btn">方版</button>' +
              '<button data-dir="auto" type="button" class="seg-btn">自适应</button>' +
            '</div>' +
          '</div>' +

          (multi ? '' : '') +
          '<div style="margin-bottom:16px;" id="ratio-block">' +
            '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 10px;">' + (multi ? '2 ·' : '2 ·') + ' 比例</p>' +
            '<div class="seg" id="seg-ratio" style="display:flex;gap:8px;flex-wrap:wrap;"></div>' +
          '</div>' +

          '<div style="margin-bottom:18px;">' +
            '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 10px;">' + (multi ? '3 ·' : '3 ·') + ' 自定义比例（可留空）</p>' +
            '<input type="text" id="custom-ratio" placeholder="如 2.35:1 · 4:5 · 21:9" style="width:100%;font-family:inherit;font-size:14px;color:var(--ink);background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px 12px;" />' +
          '</div>' +

          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button data-a="png" type="button" style="flex:1;min-width:110px;background:var(--accent);color:var(--surface);border:none;border-radius:999px;padding:11px 12px;font-size:13px;font-weight:600;cursor:pointer;">导出 PNG</button>' +
            '<button data-a="md" type="button" style="flex:1;min-width:100px;background:var(--bg);color:var(--accent-deep);border:1px solid var(--border);border-radius:999px;padding:11px 12px;font-size:13px;font-weight:600;cursor:pointer;">Markdown</button>' +
            '<button data-a="download" type="button" style="flex:1;min-width:100px;background:var(--bg);color:var(--accent-deep);border:1px solid var(--border);border-radius:999px;padding:11px 12px;font-size:13px;font-weight:600;cursor:pointer;">HTML</button>' +
          '</div>' +
          '<a href="javascript:void(0)" id="open-export-dir" style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:var(--accent-deep);text-decoration:underline;cursor:pointer;">📂 打开导出位置</a>' +
        '</div>' +

        // 右：预览
        '<div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;">' +
          '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0;">实时预览（与导出一致）</p>' +
          '<div id="preview-nav" style="display:none;align-items:center;gap:6px;">' +
            '<button id="preview-prev" type="button" style="width:26px;height:26px;border:1px solid var(--border);border-radius:50%;background:var(--bg);color:var(--ink-soft);cursor:pointer;font-size:15px;line-height:1;">‹</button>' +
            '<span id="preview-count" style="font-family:var(--font-mono);font-size:11px;color:var(--dim);white-space:nowrap;">1/1</span>' +
            '<button id="preview-next" type="button" style="width:26px;height:26px;border:1px solid var(--border);border-radius:50%;background:var(--bg);color:var(--ink-soft);cursor:pointer;font-size:15px;line-height:1;">›</button>' +
          '</div>' +
        '</div>' +
          '<div id="preview-frame" style="width:100%;background:#efede6;border:1px solid var(--border);border-radius:16px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:320px;padding:12px;">' +
            '<img id="preview-img" alt="预览" style="max-width:100%;max-height:52vh;display:block;box-shadow:0 8px 32px -12px rgba(30,26,20,.28);" />' +
          '</div>' +
          '<p id="preview-meta" style="font-family:' + MONO + ';font-size:11px;color:var(--dim);margin:8px 0 0;letter-spacing:.04em;">正在渲染…</p>' +
        '</div>' +
      '</div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    if (!document.getElementById("seg-style")) {
      var ss = document.createElement("style");
      ss.id = "seg-style";
      ss.textContent = ".seg-btn{font-family:inherit;font-size:13px;font-weight:500;color:var(--ink-soft);background:var(--bg);border:1px solid var(--border);border-radius:999px;padding:8px 15px;cursor:pointer;transition:.18s ease}.seg-btn:hover{color:var(--accent-deep);border-color:var(--accent)}.seg-btn.is-on{background:var(--accent);color:var(--surface);border-color:var(--accent)}.grp-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--accent-deep);background:rgba(63,86,72,.10);border:1px solid rgba(63,86,72,.22);border-radius:999px;padding:5px 10px;cursor:pointer;transition:.15s ease}.grp-chip:hover{background:rgba(63,86,72,.18)}.grp-chip.is-on{background:var(--accent);color:var(--surface);border-color:var(--accent)}";
      document.head.appendChild(ss);
    }

    var modeBtns = panel.querySelectorAll("#seg-mode .seg-btn");
    var groupBlock = panel.querySelector("#group-block");
    var groupList = panel.querySelector("#group-list");
    var addGroupBtn = panel.querySelector("#add-group");
    var dirBtns = panel.querySelectorAll("#seg-dir .seg-btn");
    var ratioBox = panel.querySelector("#seg-ratio");
    var ratioBlock = panel.querySelector("#ratio-block");
    var previewImg = panel.querySelector("#preview-img");
    var previewMeta = panel.querySelector("#preview-meta");
    var customEl = panel.querySelector("#custom-ratio");

    // —— 分组初始化：默认一组（含全部）——
    function initGroups() {
      customGroups = [{ id: "g1", name: "第 1 组", itemIds: items.map(function(it){ return it.id; }) }];
      renderGroups();
    }
    function renderGroups() {
      if (!groupList) return;
      groupList.innerHTML = "";
      customGroups.forEach(function (g) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:8px 10px;cursor:pointer;transition:.18s ease;";
        row.title = "点击预览该组";
        // 预览中的组高亮
        if (customGroups.indexOf(g) === previewGroupIdx) row.style.borderColor = "var(--accent)";
        else row.style.opacity = "0.9";
        // 当前预览组索引对应关系：用分组在 customGroups 里的序号
        row.addEventListener("click", function () {
          previewGroupIdx = customGroups.indexOf(g);
          renderGroups();
          debouncedPreview();
        });
        // 组名
        var nameIn = document.createElement("input");
        nameIn.type = "text"; nameIn.value = g.name;
        nameIn.style.cssText = "font-family:inherit;font-size:13px;color:var(--ink);background:transparent;border:none;border-bottom:1px solid var(--border);outline:none;width:90px;";
        nameIn.addEventListener("input", function(){ g.name = nameIn.value || "组"; });
        row.appendChild(nameIn);
        var cnt = document.createElement("span");
        cnt.style.cssText = "font-family:var(--font-mono);font-size:11px;color:var(--dim);";
        cnt.textContent = g.itemIds.length + " 篇";
        row.appendChild(cnt);
        // 删除组
        if (customGroups.length > 1) {
          var del = document.createElement("button");
          del.type = "button"; del.textContent = "×";
          del.style.cssText = "margin-left:auto;width:24px;height:24px;border:none;background:transparent;color:var(--dim);cursor:pointer;font-size:16px;border-radius:50%;";
          del.addEventListener("click", function(){ customGroups = customGroups.filter(function(x){ return x.id !== g.id; }); renderGroups(); });
          row.appendChild(del);
        }
        groupList.appendChild(row);
      });
      // 日记项分配 chips
      customGroups.forEach(function (g) {
        var lbl = document.createElement("div");
        lbl.style.cssText = "font-family:var(--font-mono);font-size:11px;color:var(--dim);margin-top:2px;";
        lbl.textContent = "→ " + g.name + "：";
        // chips
        var chipWrap = document.createElement("div");
        chipWrap.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;";
        items.forEach(function (it) {
          var c = document.createElement("button");
          c.type = "button"; c.className = "grp-chip" + (g.itemIds.indexOf(it.id) !== -1 ? " is-on" : "");
          var d = (it.date || "").split("-"); // [yy,mm,dd]
          var shortDate = (d.length === 3) ? (d[1] + "-" + d[2]) : "";
          c.textContent = (shortDate ? shortDate + " · " : "") + it.title.slice(0, 10);
          c.title = (it.date || "") + " · " + it.title;
          c.addEventListener("click", function () {
            var idx = g.itemIds.indexOf(it.id);
            if (idx !== -1) g.itemIds.splice(idx, 1);
            else g.itemIds.push(it.id);
            renderGroups();
            debouncedPreview();
          });
          chipWrap.appendChild(c);
        });
        lbl.appendChild(chipWrap);
        groupList.appendChild(lbl);
      });
    }

    // —— 分组归集 ——
    function collectGroups() {
      if (exportMode === "separate") {
        return items.map(function (it) {
          var shortTitle = (it.title || "").replace(/\s+/g, "").slice(0, 12);
          return { items: [it], label: (it.date + "-" + shortTitle) };
        });
      }
      if (exportMode === "custom") {
        var out = [];
        customGroups.forEach(function (g, idx) {
          var gitems = items.filter(function (it) { return g.itemIds.indexOf(it.id) !== -1; });
          if (gitems.length) out.push({ items: gitems, label: (g.name || ("组" + (idx+1))) });
        });
        if (!out.length) { toast("请把日记分配到至少一个分组"); return []; }
        return out;
      }
      return [{ items: items, label: "" }]; // merge
    }

    if (addGroupBtn) {
      addGroupBtn.addEventListener("click", function () {
        customGroups.push({ id: "g" + Date.now(), name: "第 " + (customGroups.length + 1) + " 组", itemIds: [] });
        renderGroups();
      });
    }

    function currentRatio() {
      var cv = customEl.value.trim();
      if (cv) { return parseRatio(cv) ? cv : null; }
      return (selDir === "auto") ? "auto" : selRatio;
    }

    var previewNav = panel.querySelector("#preview-nav");
    var previewPrev = panel.querySelector("#preview-prev");
    var previewNext = panel.querySelector("#preview-next");
    var previewCount = panel.querySelector("#preview-count");

    var previewTimer = null;
    function refreshPreview() {
      var r = currentRatio();
      if (!r) { previewMeta.textContent = "比例格式无效"; return; }
      var groups = collectGroups();
      if (!groups.length) { return; }
      var previewItems;
      if (exportMode === "merge") previewItems = items;
      else {
        // separate / custom：都能切换预览各组/各篇
        if (previewGroupIdx >= groups.length) previewGroupIdx = 0;
        previewItems = groups[previewGroupIdx] ? groups[previewGroupIdx].items : groups[0].items;
      }
      previewMeta.textContent = "渲染中…";
      renderToCanvas(previewItems, r).then(function (canvas) {
        var w = canvas.width, h = canvas.height;
        var limitW = 460;
        var ratioK = Math.min(1, limitW / w);
        var tw = Math.round(w * ratioK), th = Math.round(h * ratioK);
        var tc = document.createElement("canvas"); tc.width = tw; tc.height = th;
        var ctx = tc.getContext("2d"); ctx.fillStyle = "#f6f4ef"; ctx.fillRect(0,0,tw,th); ctx.drawImage(canvas,0,0,tw,th);
        previewImg.src = tc.toDataURL("image/png");
        var rw = Math.round(w/2), rh = Math.round(h/2);
        var ratioLabel = (r === "auto") ? "自适应长图" : r;
        var groupInfo = "";
        if (exportMode === "separate") groupInfo = " · 第 " + (previewGroupIdx + 1) + "/" + groups.length + " 篇";
        else if (exportMode === "custom") groupInfo = " · 预览第 " + (previewGroupIdx + 1) + "/" + groups.length + " 组";
        // 翻页控件显示/计数
        if (previewNav) {
          var multiPreview = (exportMode !== "merge" && groups.length > 1);
          previewNav.style.display = multiPreview ? "flex" : "none";
          if (previewCount) previewCount.textContent = (previewGroupIdx + 1) + "/" + groups.length;
        }
        previewMeta.textContent = "比例 '" + ratioLabel + "'" + groupInfo + " · " + rw + "×" + rh + "px";
      }).catch(function (err) {
        previewMeta.textContent = "预览失败：" + err.message;
      });
    }
    function debouncedPreview() { clearTimeout(previewTimer); previewTimer = setTimeout(refreshPreview, 220); }

    function refreshRatio() {
      ratioBox.innerHTML = "";
      var list = RATIOS[selDir];
      if (selDir === "auto") { ratioBlock.style.display = "none"; }
      else {
        ratioBlock.style.display = "";
        if (list.indexOf(selRatio) === -1) selRatio = list[0];
        list.forEach(function (r) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "seg-btn" + (r === selRatio ? " is-on" : "");
          b.textContent = RATIO_LABEL[r]; b.dataset.ratio = r;
          b.addEventListener("click", function () {
            selRatio = r;
            ratioBox.querySelectorAll(".seg-btn").forEach(function (x) { x.classList.toggle("is-on", x.dataset.ratio === r); });
            debouncedPreview();
          });
          ratioBox.appendChild(b);
        });
      }
    }

    // 导出方式切换
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        exportMode = b.dataset.mode;
        modeBtns.forEach(function (x) { x.classList.toggle("is-on", x === b); });
        if (groupBlock) groupBlock.style.display = (exportMode === "custom") ? "" : "none";
        debouncedPreview();
      });
    });

    dirBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        selDir = b.dataset.dir;
        dirBtns.forEach(function (x) { x.classList.toggle("is-on", x === b); });
        refreshRatio();
        debouncedPreview();
      });
    });

    // 预览翻页（separate/custom 多组时切换）
    function curGroupsCount() {
      var g = collectGroups();
      return g.length;
    }
    if (previewPrev) previewPrev.addEventListener("click", function () {
      var n = collectGroups().length;
      if (n <= 1) return;
      previewGroupIdx = (previewGroupIdx - 1 + n) % n;
      refreshPreview();
    });
    if (previewNext) previewNext.addEventListener("click", function () {
      var n = collectGroups().length;
      if (n <= 1) return;
      previewGroupIdx = (previewGroupIdx + 1) % n;
      refreshPreview();
    });

    customEl.addEventListener("input", debouncedPreview);
    dirBtns.forEach(function (x) { x.classList.toggle("is-on", x.dataset.dir === selDir); });
    refreshRatio();
    if (multi) initGroups();
    refreshPreview();

    // 导出全部完成后关闭弹窗
    function closePanel() {
      if (overlay && overlay.parentNode) overlay.remove();
    }
    panel.querySelector('[data-a="png"]').addEventListener("click", function () {
      var ratio = currentRatio();
      if (!ratio) { toast("比例格式无效"); return; }
      var groups = collectGroups();
      if (!groups.length) return;
      runExport(groups, "png", ratio, closePanel);
    });
    panel.querySelector('[data-a="md"]').addEventListener("click", function () {
      var groups = collectGroups();
      if (!groups.length) return;
      runExport(groups, "md", null, closePanel);
    });
    panel.querySelector('[data-a="download"]').addEventListener("click", function () {
      var groups = collectGroups();
      if (!groups.length) return;
      runExport(groups, "html", null, closePanel);
    });
    var openDirEl = panel.querySelector("#open-export-dir");
    if (openDirEl) {
      openDirEl.addEventListener("click", function () {
        fetch("/open-export").then(function (r) { return r.json(); }).then(function (res) {
          toast(res.ok ? "已打开导出文件夹" : ("打开失败：" + res.error));
        });
      });
    }
  }

  // —— 批量导出：按分组逐份导出（group = [{items,label}]）——
  function runExport(groups, format, ratio, onDone) {
    if (!groups || groups.length === 0) { toast("没有可导出的分组"); if (onDone) onDone(); return; }
    toast("开始导出 " + groups.length + " 份…");
    var i = 0;
    function next() {
      if (i >= groups.length) {
        toast("全部导出完成");
        if (onDone) { setTimeout(onDone, 700); }
        return;
      }
      var g = groups[i]; i++;
      var label = g.label || "";
      if (format === "png") {
        exportPNG(g.items, ratio, label);
        setTimeout(next, 1000);
      } else if (format === "md") {
        downloadMD(g.items, label);
        setTimeout(next, 300);
      } else {
        buildHTML(g.items, false, label);
        setTimeout(next, 300);
      }
    }
    next();
  }

  function buildHTML(items, preview, groupLabel) {
    var html = buildNoteHTML(items, groupLabel);
    var suffix = groupLabel ? ("-" + groupLabel) : "";
    if (preview) {
      var w = window.open("", "_blank");
      w.document.open();
      w.document.write(html);
      w.document.close();
    } else {
      var blob = new Blob([html], { type: "text/html;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "咱俩的日记笔记" + (suffix || ("-" + (items[0].date || "share"))) + ".html";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);
    }
  }

    function buildNoteHTML(items, groupLabel) {
    var now = new Date();
    var groupNote = groupLabel ? (' · <span style="color:var(--accent)">' + escapeHtml(groupLabel) + '</span>') : "";
    var body = items.map(function (it) {
      var authorLabel = (it.author === "you") ? "你" : "Codex";
      return '<section class="nx-entry">' +
        '<div class="nx-meta"><span class="nx-date">' + it.date + '</span><span class="nx-author">' + authorLabel + '</span></div>' +
        '<h2 class="nx-title">' + escapeHtml(it.title) + '</h2>' +
        '<div class="nx-body">' + bodyToHtml(it.body).replace(/\n/g, "<br>") + '</div>' +
      '</section>';
    }).join("\n");

    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
      '<title>咱俩的日记 · 分享笔记</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">' +
      '<style>' +
        ':root{--bg:#f6f4ef;--surface:#fdfcf9;--ink:#201d18;--ink-soft:#57514a;--dim:#8d867c;--accent:#3f5648;--accent-deep:#2c3d33;--gold:#a98a52;--border:rgba(38,34,28,.10);}' +
        '*{box-sizing:border-box;}' +
        'body{margin:0;background:var(--bg);color:var(--ink);font-family:' + SANS + ';line-height:1.6;-webkit-font-smoothing:antialiased;}' +
        '.nx-page{max-width:720px;margin:0 auto;padding:56px 28px 80px;}' +
        '.nx-masthead{border-bottom:1px solid var(--border);padding-bottom:26px;margin-bottom:40px;}' +
        '.nx-eyebrow{font-family:' + MONO + ';font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0 0 10px;}' +
        '.nx-masthead h1{font-family:' + SERIF + ';font-size:42px;font-weight:520;letter-spacing:-.02em;margin:0;}' +
        '.nx-sub{margin:8px 0 0;color:var(--dim);font-size:14px;}' +
        '.nx-entry{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:30px 34px;margin:0 0 26px;box-shadow:0 1px 3px rgba(30,26,20,.04),0 12px 40px -18px rgba(30,26,20,.18);}' +
        '.nx-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}' +
        '.nx-date{font-family:' + MONO + ';font-size:12px;letter-spacing:.06em;color:var(--gold);}' +
        '.nx-author{font-family:' + MONO + ';font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);}' +
        '.nx-title{font-family:' + SERIF + ';font-size:24px;font-weight:540;letter-spacing:-.01em;margin:0 0 12px;}' +
        '.nx-body{color:var(--ink-soft);font-size:16px;white-space:normal;}' +
        '.nx-foot{margin-top:44px;text-align:center;color:var(--dim);font-size:13px;}' +
        '@media(max-width:560px){.nx-page{padding:32px 16px 48px;}.nx-masthead h1{font-size:30px;}.nx-entry{padding:22px 20px;}}' +
      '</style></head><body>' +
      '<div class="nx-page">' +
        '<div class="nx-masthead">' +
          '<p class="nx-eyebrow">你 &amp; Codex · 每日一记</p>' +
          '<h1>咱俩的日记</h1>' +
          '<p class="nx-sub">分享笔记 · ' + items.length + ' 篇' + groupNote + ' · 导出于 ' + fmtDate(now) + '</p>' +
        '</div>' +
        body +
        '<div class="nx-foot">你 &amp; Codex · 咱俩一起走过的一天</div>' +
      '</div></body></html>';
  }

function downloadMD(items, groupLabel) {
    var suffix = groupLabel ? ("-" + groupLabel) : "";
    var md = "# 咱俩的日记 · 分享笔记\n\n" + items.map(function (it) {
      var authorLabel = (it.author === "you") ? "你" : "Codex";
      return "## " + it.date + " · " + it.title + "（" + authorLabel + "）\n\n" + it.body;
    }).join("\n\n---\n\n") + "\n";
    var blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "咱俩的日记笔记" + (suffix || ("-" + (items[0].date || "share"))) + ".md";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }

  // —— toast ——
  var toastEl = null;
  function toast(msg) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.textContent = msg;
    document.body.appendChild(toastEl);
    requestAnimationFrame(function () { toastEl.classList.add("show"); });
    setTimeout(function () {
      toastEl.classList.remove("show");
      setTimeout(function () { if (toastEl) toastEl.remove(); }, 350);
    }, 2600);
  }

  // —— 提交写日记 ——
  els.composer.addEventListener("submit", function (e) {
    e.preventDefault();
    var entry = {
      local_id: "L" + Date.now(),
      date: els.date.value,
      title: els.title.value.trim(),
      body: els.body.value.trim(),
      author: "you"
    };
    if (!entry.date || !entry.title || !entry.body) return;
    var local = JSON.parse(localStorage.getItem(DATA_KEY) || "[]");
    local.unshift(entry);
    localStorage.setItem(DATA_KEY, JSON.stringify(local));
    els.title.value = "";
    els.body.value = "";
    toast("已记下 · 稍后 Codex 会同步进 data.js");
    render();
    if (state.filterDate && state.filterDate !== entry.date) state.filterDate = null;
    if (state.query) { }
    switchView("timeline");
  });

  // —— 初始化 ——
  els.footYear.textContent = new Date().getFullYear();
  initLangBar();
  render();
  renderCal();
  updateExportBadge();
  // 动态滚动进度条
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateProgress();

  // —— 导出为 PNG（用 html2canvas 渲染笔记为图片）——
    // —— 公共：按比例渲染笔记到 canvas ——
  function renderToCanvas(items, ratio) {
    return new Promise(function (resolve, reject) {
      if (typeof html2canvas === "undefined") { reject(new Error("图片库未加载")); return; }
      var full = buildNoteHTML(items);
      var styleMatch = full.match(/<style>([\s\S]*?)<\/style>/);
      var baseStyle = styleMatch ? styleMatch[1] : "";
      var bodyHtml = full.replace(/^[\s\S]*?<body>/, "").replace(/<\/body>[\s\S]*$/, "");
      // 覆写：更饱满排版
      var compact = "<style>.nx-page{max-width:720px;margin:0 auto;padding:28px 20px 36px}.nx-masthead{padding-bottom:18px;margin-bottom:24px}.nx-masthead h1{font-size:42px}.nx-entry{padding:28px 32px;margin-bottom:22px}.nx-title{font-size:23px}.nx-body{font-size:16px;line-height:1.75}.nx-foot{margin-top:28px}</style>";
      var st = document.getElementById("nx-style");
      if (!st) { st = document.createElement("style"); st.id = "nx-style"; document.head.appendChild(st); }
      st.textContent = baseStyle + compact;

      var BASE_W = 720;
      var dims = ratioToDims(ratio, BASE_W);
      var isFixed = (ratio !== "auto" && dims.ok);

      // 1) 先渲染「内容自适应」大图（高度自动，内容完整可靠）
      var canvasWrap = document.createElement("div");
      canvasWrap.style.cssText = "position:fixed;left:-10000px;top:0;width:" + BASE_W + "px;box-sizing:border-box;background:#f6f4ef;z-index:9999;";
      var content = document.createElement("div");
      content.style.cssText = "box-sizing:border-box;width:" + BASE_W + "px;";
      content.innerHTML = bodyHtml;
      canvasWrap.appendChild(content);
      document.body.appendChild(canvasWrap);

      var doShot = function () {
        var srcOpts = { scale: 2, backgroundColor: "#f6f4ef", useCORS: true, logging: false };
        srcOpts.width = BASE_W;
        html2canvas(canvasWrap, srcOpts).then(function (srcCanvas) {
          canvasWrap.remove();
          var SW = srcCanvas.width, SH = srcCanvas.height;

          if (!isFixed) {
            st.remove();
            resolve(srcCanvas);
            return;
          }

          // 2) 固定比例：目标画布，等比缩放源图居中（留白适配，不裁切）
          var targetW = Math.round(BASE_W * 2);
          var targetH = Math.round(dims.h * 2);
          var out = document.createElement("canvas");
          out.width = targetW; out.height = targetH;
          var ctx = out.getContext("2d");
          ctx.fillStyle = "#f6f4ef";
          ctx.fillRect(0, 0, targetW, targetH);
          // 等比缩放：内容完全放入目标画布
          var margin = 40;
          var availW = targetW - margin * 2;
          var availH = targetH - margin * 2;
          var sc = Math.min(availW / SW, availH / SH);
          var dw = SW * sc, dh = SH * sc;
          var dx = (targetW - dw) / 2, dy = (targetH - dh) / 2;
          ctx.drawImage(srcCanvas, dx, dy, dw, dh);
          st.remove();
          resolve(out);
        }).catch(function (err) {
          canvasWrap.remove(); st.remove();
          reject(err);
        });
      };
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(doShot); } else { doShot(); }
    });
  }

  // —— 导出 PNG（可带组名后缀，支持批量）——
  function exportPNG(items, ratio, groupLabel) {
    ratio = ratio || "auto";
    var suffix = groupLabel ? ("-" + groupLabel) : ("-" + (items[0].date || "share"));
    var fileName = "咱俩的日记笔记" + suffix + ".png";
    toast("正在生成图片…");
    renderToCanvas(items, ratio).then(function (canvas) {
      var dataUrl = canvas.toDataURL("image/png");
      fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName, dataUrl: dataUrl })
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.ok) { toast("已保存：" + res.path); }
        else { fallbackDownload(dataUrl, fileName); }
      }).catch(function () {
        fallbackDownload(dataUrl, fileName);
      });
    }).catch(function (err) {
      toast("生成图片失败：" + err.message);
    });
  }

  // 比例表：宽:高（预设 key）
  var RATIO_MAP = { "1:1": 1, "4:3": 0.75, "16:9": 0.5625, "3:2": 0.6667, "3:4": 1.3333, "9:16": 1.7778, "2:3": 1.5 };

  // 解析比例 -> 宽:高 比值（宽/高）。支持预设 key，也支持任意 "宽:高" 或 "宽:高" 小数。
  function parseRatio(ratio) {
    if (!ratio) return null;
    ratio = String(ratio).trim();
    if (RATIO_MAP[ratio]) return RATIO_MAP[ratio];
    // 支持 "2.35:1"、"4:5"、"16:9"、"2.35/1"、"2.35"（单值视为 宽:1）
    var s = ratio.replace(/×/g, ":").replace(/x/gi, ":").replace(/\//g, ":");
    var parts = s.split(":").filter(function (x) { return x.trim() !== ""; });
    var w, h;
    if (parts.length >= 2) { w = parseFloat(parts[0]); h = parseFloat(parts[1]); }
    else if (parts.length === 1) { w = parseFloat(parts[0]); h = 1; }
    else { return null; }
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0 || h === 0) return null;
    // 统一返回「高/宽」，与 RATIO_MAP（如 16:9 -> 9/16）保持一致
    return h / w;
  }

  function ratioToDims(ratio, baseW) {
    var k = parseRatio(ratio);
    if (!k) { return { w: baseW, h: 0, ok: false }; }
    return { w: baseW, h: Math.round(baseW * k), ok: true };
  }

  // 浏览器下载兜底（接口不可用时用）
  function fallbackDownload(dataUrl, fileName) {
    var a = document.createElement("a");
    a.download = fileName;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }

})();
