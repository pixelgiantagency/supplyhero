// components/produkte-grid.js
//
// Ersetzt den Finsweet-Teil von products-gallery.js auf der Produkte-Seite.
// Datenquelle sind 6 duplizierte Collection Lists (.produkte_collection,
// Skip 0/100/200/300/400/500), die den vollen Produkte-Pool (aktuell ~234,
// Puffer bis 600) beim Seitenaufruf statisch ins DOM rendern - kein Finsweet,
// keine AJAX-Nachladerei nötig.
//
// Load-More-Modell: Pro aktivem Filter (inkl. "Alle") wird der komplette
// gefilterte Pool EINMAL gemischt und diese Reihenfolge gemerkt. Der erste
// Aufruf zeigt INITIAL_COUNT, jeder Load-More-Klick deckt die nächsten
// LOAD_MORE_COUNT davon auf - garantiert keine Wiederholung innerhalb einer
// Filter-Sitzung. Filter-Wechsel oder Seiten-Reload = komplett neue
// Zufalls-Reihenfolge, wieder bei vorne beginnend.

export function initProduktGrid() {
  // Getrennte Konstanten, damit sich "erster Batch" und "pro Load-More-Klick"
  // unabhängig voneinander anpassen lassen, auch wenn beide aktuell gleich sind.
  var INITIAL_COUNT = 24;
  var LOAD_MORE_COUNT = 24;

  var HIGHLIGHT_CLASS = 'is-highlighted';
  var ACTIVE_CLASS = 'is-active';
  var REVEAL_CLASS = 'hg-positioned'; // wiederverwendet: gleiche Klasse/CSS wie im bestehenden Reveal-Muster
  var MIN_ITEMS_FOR_HIGHLIGHT = 8;
  var MAX_ATTEMPTS_PER_TRY = 25;
  // Ziel-Anteil an 2x2-Kacheln, bezogen auf einen vollen 48er-Batch (4/48 auf
  // Desktop, 2/48 im 3-Spalten-Tablet-Layout). Wird pro Chunk mit dessen
  // tatsächlicher Größe multipliziert - bei 24er-Chunks landet man z.B. auf
  // Desktop automatisch bei ~2 Highlights pro Nachladen statt 4, exakt
  // proportional. 1 und 2 Spalten bleiben komplett ohne Highlights - bei
  // 2 Spalten würde eine 2x2-Kachel schon die volle Breite einnehmen.
  var HIGHLIGHT_RATIO_BY_COLUMNS = { 1: 0, 2: 0, 3: 2 / 48, 4: 4 / 48 };
  var TARGET_GRID_ID = 'produkte-grid-target';
  var SOURCE_WRAPPER_SELECTOR = '.produkte_collection';
  var ITEM_SELECTOR = '.produkte_item';
  var DATASRC_SELECTOR = '.js-produkte-datasrc';
  var IMG_SELECTOR = '.produkte_img';
  var FILTER_INPUT_SELECTOR = 'input[name="projekte-filter"]';
  var FILTER_LABEL_SELECTOR = '.projekte_filter-label';
  var LOAD_MORE_SELECTOR = '[data-produkte-load-more]';
  var ALL_LABEL = 'alle';

  var grid = document.querySelector(SOURCE_WRAPPER_SELECTOR);
  if (!grid) return; // keine Produkte-Sektion auf dieser Seite -> nichts zu tun

  // ---------------------------------------------------------------------
  // Bin-Packing/Highlight-Logik - im Kern aus products-gallery.js, jetzt
  // wieder mit existingGrid-Parameter genutzt (fürs inkrementelle Anhängen
  // neuer Chunks auf ein bereits bestehendes Layout), genau wie im Original
  // gedacht.
  // ---------------------------------------------------------------------
  function getColumnCount() {
    var w = window.innerWidth;
    if (w <= 479) return 1;
    if (w <= 767) return 2;
    if (w <= 991) return 3;
    return 4;
  }
  function ensureRow(g, r, columns) {
    while (g.length <= r) g.push(new Array(columns).fill(false));
  }
  function canPlace(g, r, c, w, h, columns) {
    if (c + w > columns) return false;
    for (var rr = r; rr < r + h; rr++) {
      ensureRow(g, rr, columns);
      for (var cc = c; cc < c + w; cc++) if (g[rr][cc]) return false;
    }
    return true;
  }
  function place(g, r, c, w, h, columns) {
    for (var rr = r; rr < r + h; rr++) for (var cc = c; cc < c + w; cc++) g[rr][cc] = true;
  }
  function findSpot(g, w, h, columns) {
    var r = 0;
    while (true) {
      for (var c = 0; c <= columns - w; c++)
        if (canPlace(g, r, c, w, h, columns)) return { r: r, c: c };
      r++;
    }
  }
  function simulateAppend(existingGrid, count, columns, bigIndicesSet) {
    var g = existingGrid.map(function (row) {
      return row.slice();
    });
    var positions = [];
    for (var i = 0; i < count; i++) {
      var isBig = bigIndicesSet.has(i);
      var w = isBig ? 2 : 1,
        h = isBig ? 2 : 1;
      var spot = findSpot(g, w, h, columns);
      place(g, spot.r, spot.c, w, h, columns);
      positions.push({ index: i, row: spot.r, col: spot.c, w: w, h: h, isBig: isBig });
    }
    return { positions: positions, totalRows: g.length, grid: g };
  }
  function isValid(sim) {
    var lastRowIndex = sim.totalRows - 1;
    var lastRow = sim.grid[lastRowIndex];
    var lastRowFull = lastRow.every(Boolean);
    var bigTouchesLastRow = sim.positions.some(function (p) {
      return p.isBig && p.row + p.h - 1 === lastRowIndex;
    });
    if (bigTouchesLastRow && !lastRowFull) return false;
    return true;
  }
  function pickRandomIndices(count, howMany) {
    var indices = new Set();
    var guard = 0;
    while (indices.size < howMany && guard < 200) {
      indices.add(Math.floor(Math.random() * count));
      guard++;
    }
    return indices;
  }
  function computeBestAppend(existingGrid, newCount, columns) {
    var ratio = HIGHLIGHT_RATIO_BY_COLUMNS[columns] || 0;
    var maxHighlights = Math.round(ratio * newCount);
    if (columns < 2 || maxHighlights === 0 || newCount < MIN_ITEMS_FOR_HIGHLIGHT) {
      return simulateAppend(existingGrid, newCount, columns, new Set());
    }
    for (var numHighlights = maxHighlights; numHighlights >= 0; numHighlights--) {
      if (numHighlights === 0) return simulateAppend(existingGrid, newCount, columns, new Set());
      for (var attempt = 0; attempt < MAX_ATTEMPTS_PER_TRY; attempt++) {
        var candidates = pickRandomIndices(newCount, numHighlights);
        var sim = simulateAppend(existingGrid, newCount, columns, candidates);
        if (isValid(sim)) return sim;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Datenquelle, Ziel-Grid, Filter - unverändert ggü. der No-Load-More-
  // Version.
  // ---------------------------------------------------------------------

  function normalize(str) {
    return (str || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  var sourceWrappers = document.querySelectorAll(SOURCE_WRAPPER_SELECTOR);
  sourceWrappers.forEach(function (el) {
    el.style.display = 'none';
  });

  function ensureTargetGrid() {
    var el = document.getElementById(TARGET_GRID_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = TARGET_GRID_ID;
      var lastWrapper = sourceWrappers[sourceWrappers.length - 1];
      lastWrapper.parentNode.insertBefore(el, lastWrapper.nextSibling);
    }
    el.style.display = 'grid';
    el.style.gridAutoColumns = '1fr';
    el.style.columnGap = '1rem';
    el.style.rowGap = '1rem';
    el.style.gridTemplateColumns = 'repeat(' + getColumnCount() + ', 1fr)';
    return el;
  }
  var targetGrid = ensureTargetGrid();
  var loadMoreBtn = document.querySelector(LOAD_MORE_SELECTOR);

  var pool = Array.prototype.map.call(document.querySelectorAll(ITEM_SELECTOR), function (el) {
    var dataSrcEl = el.querySelector(DATASRC_SELECTOR);
    return {
      el: el,
      homeList: el.parentNode,
      category: (el.getAttribute('data-category') || '').trim(),
      imageUrl: dataSrcEl ? (dataSrcEl.getAttribute('data-src') || '').trim() : '',
      imageLoaded: false,
    };
  });

  var filterInputs = Array.prototype.map.call(
    document.querySelectorAll(FILTER_INPUT_SELECTOR),
    function (input) {
      var wrapper = input.closest('.projekte_filter-button') || input.parentElement;
      var labelEl = wrapper ? wrapper.querySelector(FILTER_LABEL_SELECTOR) : null;
      var labelText = labelEl ? labelEl.textContent.trim() : '';
      return { input: input, wrapper: wrapper, label: labelText };
    }
  );

  function getActiveFilterLabel() {
    var checked = document.querySelector(FILTER_INPUT_SELECTOR + ':checked');
    if (!checked) return null;
    var match = filterInputs.filter(function (f) {
      return f.input === checked;
    })[0];
    return match ? match.label : null;
  }

  (function ensureDefaultFilterChecked() {
    var anyChecked = filterInputs.some(function (f) {
      return f.input.checked;
    });
    if (anyChecked || !filterInputs.length) return;
    var allEntry =
      filterInputs.filter(function (f) {
        return normalize(f.label) === ALL_LABEL;
      })[0] || filterInputs[0];
    allEntry.input.checked = true;
  })();

  function updateActiveFilterButton() {
    filterInputs.forEach(function (f) {
      if (f.wrapper) f.wrapper.classList.toggle(ACTIVE_CLASS, f.input.checked);
    });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function revealImage(item) {
    if (item.imageLoaded || !item.imageUrl) return;
    var img = item.el.querySelector(IMG_SELECTOR);
    if (img) img.src = item.imageUrl; // genau hier passiert der Netzwerk-Request - nie vorher
    item.imageLoaded = true;
  }

  function scheduleScrollTriggerRefresh() {
    // Grid-Höhe ändert sich mit jedem Chunk - ScrollTrigger/ScrollSmoother
    // müssen das neu vermessen, sonst laufen Reveal-Sections weiter unten
    // und der Footer-Parallax gegen veraltete Positionen (früher übernahm
    // Finsweets eigener 'list'-Hook das automatisch, siehe global.js).
    if (typeof ScrollTrigger === 'undefined') return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ScrollTrigger.refresh();
      });
    });
  }

  // ---------------------------------------------------------------------
  // Load-More-Zustand pro Filter-Sitzung.
  // ---------------------------------------------------------------------
  var session = {
    orderedPool: [],
    revealedCount: 0,
    gridState: [],
    isAll: true,
    activeLabel: null,
  };

  function returnAllVisibleItemsHome() {
    Array.prototype.slice.call(targetGrid.children).forEach(function (card) {
      var item = pool.filter(function (p) {
        return p.el === card;
      })[0];
      if (item && item.homeList) item.homeList.appendChild(card);
    });
  }

  function updateLoadMoreVisibility() {
    if (!loadMoreBtn) return;
    var hasMore = session.revealedCount < session.orderedPool.length;
    loadMoreBtn.style.display = hasMore ? '' : 'none';
  }

  function revealNextChunk(count) {
    var remaining = session.orderedPool.length - session.revealedCount;
    var n = Math.min(count, remaining);
    if (n <= 0) {
      updateLoadMoreVisibility();
      return;
    }

    var chunk = session.orderedPool.slice(session.revealedCount, session.revealedCount + n);
    session.revealedCount += n;

    // Echtes appendChild: Karten wandern aus bis zu 6 verschiedenen
    // Quell-Listen physisch in EIN Ziel-Grid, keine Lücken.
    chunk.forEach(function (item) {
      targetGrid.appendChild(item.el);
    });

    var columns = getColumnCount();
    targetGrid.style.gridTemplateColumns = 'repeat(' + columns + ', 1fr)';
    var sim = computeBestAppend(session.gridState, chunk.length, columns);
    sim.positions.forEach(function (pos) {
      var el = chunk[pos.index].el;
      el.classList.toggle(HIGHLIGHT_CLASS, pos.isBig);
      el.style.gridColumn = pos.col + 1 + ' / span ' + pos.w;
      el.style.gridRow = pos.row + 1 + ' / span ' + pos.h;
    });
    session.gridState = sim.grid; // Belegung merken, damit der nächste Chunk nahtlos weitermacht

    chunk.forEach(function (item, i) {
      revealImage(item);
      item.el.classList.remove(REVEAL_CLASS);
      item.el.style.transitionDelay = Math.min(i * 0.03, 0.3).toFixed(2) + 's';
      requestAnimationFrame(function () {
        item.el.classList.add(REVEAL_CLASS);
      });
    });

    scheduleScrollTriggerRefresh();
    updateLoadMoreVisibility();

    console.log(
      '[Produkte-Grid] Filter:',
      session.isAll ? 'Alle' : session.activeLabel,
      '| Gezeigt:',
      session.revealedCount,
      '/',
      session.orderedPool.length
    );
  }

  function startSession(activeLabel) {
    updateActiveFilterButton();
    returnAllVisibleItemsHome();

    var isAll = !activeLabel || normalize(activeLabel) === ALL_LABEL;
    var filtered = isAll
      ? pool
      : pool.filter(function (p) {
          return normalize(p.category) === normalize(activeLabel);
        });

    session.orderedPool = shuffle(filtered);
    session.revealedCount = 0;
    session.gridState = [];
    session.isAll = isAll;
    session.activeLabel = activeLabel;

    revealNextChunk(INITIAL_COUNT);
  }

  // Bei Resize wird der GESAMTE bisher sichtbare Bestand (nicht nur der
  // letzte Chunk) mit frischer Belegung neu angeordnet, weil sich bei
  // Spaltenzahl-Wechsel die komplette Geometrie ändert - Highlights werden
  // dabei bewusst neu gewürfelt statt beibehalten (identisches Verhalten
  // zum ursprünglichen products-gallery.js bei Breakpoint-Wechsel).
  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var visibleItems = Array.prototype.map
            .call(targetGrid.children, function (card) {
              return pool.filter(function (p) {
                return p.el === card;
              })[0];
            })
            .filter(Boolean);
          if (!visibleItems.length) return;

          var columns = getColumnCount();
          targetGrid.style.gridTemplateColumns = 'repeat(' + columns + ', 1fr)';
          var sim = computeBestAppend([], visibleItems.length, columns);
          sim.positions.forEach(function (pos) {
            var el = visibleItems[pos.index].el;
            el.classList.toggle(HIGHLIGHT_CLASS, pos.isBig);
            el.style.gridColumn = pos.col + 1 + ' / span ' + pos.w;
            el.style.gridRow = pos.row + 1 + ' / span ' + pos.h;
          });
          session.gridState = sim.grid; // synchron halten, damit der nächste Load-More-Klick sauber anschließt

          scheduleScrollTriggerRefresh();
        });
      });
    }, 400);
  }

  filterInputs.forEach(function (f) {
    f.input.addEventListener('change', function () {
      startSession(getActiveFilterLabel());
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function (e) {
      e.preventDefault(); // Link-Element, kein echtes Navigationsziel
      revealNextChunk(LOAD_MORE_COUNT);
    });
  }

  window.addEventListener('resize', onResize);

  startSession(getActiveFilterLabel());
}
