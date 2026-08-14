// components/produkte-grid.js
//
// Ersetzt den Finsweet-Teil von products-gallery.js auf der Produkte-Seite.
// Datenquelle sind 6 duplizierte Collection Lists (.produkte_collection,
// Skip 0/100/200/300/400/500), die den vollen Produkte-Pool (aktuell ~234,
// Puffer bis 600) beim Seitenaufruf statisch ins DOM rendern - kein Finsweet,
// keine AJAX-Nachladerei nötig.
//
// Pro Aufruf (Seitenladen, Filter-Wechsel) wird EIN einziger Batch von 48
// zufälligen Produkten gezogen und in ein gemeinsames Grid verschoben - kein
// Load More, keine "schon gezeigt"-Zustandsverwaltung.

export function initProduktGrid() {
  var BATCH_SIZE = 48;
  var HIGHLIGHT_CLASS = 'is-highlighted';
  var ACTIVE_CLASS = 'is-active';
  var REVEAL_CLASS = 'hg-positioned'; // wiederverwendet: gleiche Klasse/CSS wie im bestehenden Reveal-Muster
  var MIN_ITEMS_FOR_HIGHLIGHT = 8;
  var MAX_ATTEMPTS_PER_TRY = 25;
  // Ziel-Anteil an 2x2-Kacheln pro Spaltenzahl/Breakpoint, bezogen auf einen
  // vollen 48er-Batch (4/48 auf Desktop, 2/48 im 3-Spalten-Tablet-Layout).
  // Wird pro Render mit der tatsächlichen Batch-Größe multipliziert, damit
  // ein gefilterter Batch mit z.B. nur 28 Produkten nicht überproportional
  // viele große Kacheln bekommt. 1 und 2 Spalten bleiben komplett ohne
  // Highlights - bei 2 Spalten würde eine 2x2-Kachel schon die volle Breite
  // einnehmen und das schmale Layout dominieren.
  var HIGHLIGHT_RATIO_BY_COLUMNS = { 1: 0, 2: 0, 3: 2 / 48, 4: 4 / 48 };
  var TARGET_GRID_ID = 'produkte-grid-target';
  var SOURCE_WRAPPER_SELECTOR = '.produkte_collection';
  var ITEM_SELECTOR = '.produkte_item';
  var DATASRC_SELECTOR = '.js-produkte-datasrc';
  var IMG_SELECTOR = '.produkte_img';
  var FILTER_INPUT_SELECTOR = 'input[name="projekte-filter"]';
  var FILTER_LABEL_SELECTOR = '.projekte_filter-label';
  var ALL_LABEL = 'alle';

  var grid = document.querySelector(SOURCE_WRAPPER_SELECTOR);
  if (!grid) return; // keine Produkte-Sektion auf dieser Seite -> nichts zu tun

  // ---------------------------------------------------------------------
  // 1:1 AUS products-gallery.js ÜBERNOMMEN - unverändert in der Kernlogik,
  // bis auf computeBestAppend (siehe Kommentar dort).
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
  // Änderung ggü. dem Original: die Obergrenze fuer numHighlights ist nicht
  // mehr fest, sondern wird aus dem Verhältnis (HIGHLIGHT_RATIO_BY_COLUMNS)
  // und der tatsächlichen Batch-Größe (newCount) berechnet - degradiert von
  // dort aus weiterhin schrittweise runter, falls die Geometrie's nicht hergibt.
  function computeBestAppend(newCount, columns) {
    var ratio = HIGHLIGHT_RATIO_BY_COLUMNS[columns] || 0;
    var maxHighlights = Math.round(ratio * newCount);
    if (columns < 2 || maxHighlights === 0 || newCount < MIN_ITEMS_FOR_HIGHLIGHT) {
      return simulateAppend([], newCount, columns, new Set());
    }
    for (var numHighlights = maxHighlights; numHighlights >= 0; numHighlights--) {
      if (numHighlights === 0) return simulateAppend([], newCount, columns, new Set());
      for (var attempt = 0; attempt < MAX_ATTEMPTS_PER_TRY; attempt++) {
        var candidates = pickRandomIndices(newCount, numHighlights);
        var sim = simulateAppend([], newCount, columns, candidates);
        if (isValid(sim)) return sim;
      }
    }
  }

  // ---------------------------------------------------------------------
  // NEU - ersetzt die Finsweet-Hülle (window.FinsweetAttributes.push,
  // afterRender-Hook, fs-list-Attribute).
  // ---------------------------------------------------------------------

  // Vereinheitlicht Whitespace (inkl. geschützter Leerzeichen \u00A0) und
  // Groß-/Kleinschreibung vor jedem Text-Vergleich. Grund: ein per Hand
  // umbenanntes Filter-Label enthielt ein unsichtbares \u00A0 statt eines
  // normalen Leerzeichens, was reine .toLowerCase()-Vergleiche stumm hat
  // scheitern lassen (Kategorie "Lifestyle & Sport" zeigte 0 Treffer).
  function normalize(str) {
    return (str || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // Alle 6 Quell-Listen sofort verstecken. Verhindert, dass beim Laden kurz
  // alle ~234+ Karten aufblitzen, bevor der erste Batch berechnet ist.
  var sourceWrappers = document.querySelectorAll(SOURCE_WRAPPER_SELECTOR);
  sourceWrappers.forEach(function (el) {
    el.style.display = 'none';
  });

  // Gemeinsamen Ziel-Grid-Container einmalig anlegen, falls noch nicht vorhanden.
  function ensureTargetGrid() {
    var existing = document.getElementById(TARGET_GRID_ID);
    if (existing) return existing;
    var el = document.createElement('div');
    el.id = TARGET_GRID_ID;
    el.style.display = 'grid';
    el.style.gridAutoColumns = '1fr';
    el.style.columnGap = '1rem';
    el.style.rowGap = '1rem';
    el.style.gridTemplateColumns = 'repeat(' + getColumnCount() + ', 1fr)';
    var lastWrapper = sourceWrappers[sourceWrappers.length - 1];
    lastWrapper.parentNode.insertBefore(el, lastWrapper.nextSibling);
    return el;
  }
  var targetGrid = ensureTargetGrid();

  // Master-Pool EINMALIG aus allen 6 Listen einsammeln. Bleibt die stabile
  // Referenz fuer die gesamte Sitzung - wir fragen den DOM nie wieder per
  // querySelectorAll neu ab, weil appendChild die Karten ja aus ihrer
  // urspruenglichen Liste heraus verschiebt.
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

  // Filter-Radios einlesen: Label-Text statt id verwenden, weil die id-
  // Attribute der Radios noch die alten Kategorienamen tragen (Food-
  // Beverages, Clothing, Headwear, Accessories), die Labels aber schon
  // die neuen (Food & Beverage, Artists & Events, ...). Label ist die
  // verlaessliche Quelle, id wird bewusst ignoriert.
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

  // Falls beim Laden keiner der Radios "checked" ist (z.B. weil "Alle" in
  // Webflow nicht explizit als Standardauswahl gesetzt wurde), "Alle" hier
  // selbst als Startzustand markieren. Sonst bekommt beim ersten Render kein
  // Button die is-active-Klasse, obwohl inhaltlich ohnehin "Alle" gezeigt wird.
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

  // Setzt/entfernt die in Webflow bereits vorhandene "is-active"-Klasse auf
  // dem Button-Wrapper, je nachdem welches Radio gerade ausgewählt ist.
  // Die native :checked-Auswahl des Radios selbst toggelt ja keine Klasse,
  // deshalb übernimmt das JS das hier explizit bei jedem Render.
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

  function returnCurrentBatchHome() {
    Array.prototype.slice.call(targetGrid.children).forEach(function (card) {
      var item = pool.filter(function (p) {
        return p.el === card;
      })[0];
      if (item && item.homeList) item.homeList.appendChild(card);
    });
  }

  function revealImage(item) {
    if (item.imageLoaded || !item.imageUrl) return;
    var img = item.el.querySelector(IMG_SELECTOR);
    if (img) img.src = item.imageUrl; // genau hier passiert der Netzwerk-Request - nie vorher
    item.imageLoaded = true;
  }

  function applyLayout(batchItems) {
    var columns = getColumnCount();
    targetGrid.style.gridTemplateColumns = 'repeat(' + columns + ', 1fr)';
    var sim = computeBestAppend(batchItems.length, columns);
    sim.positions.forEach(function (pos) {
      var el = batchItems[pos.index].el;
      el.classList.toggle(HIGHLIGHT_CLASS, pos.isBig);
      el.style.gridColumn = pos.col + 1 + ' / span ' + pos.w;
      el.style.gridRow = pos.row + 1 + ' / span ' + pos.h;
    });

    // Grid-Höhe ändert sich je nach Filter/Spaltenzahl - ScrollTrigger und
    // ScrollSmoother müssen das neu vermessen, sonst laufen Reveal-Sections
    // weiter unten und der Footer-Parallax gegen veraltete Positionen.
    // Früher hat Finsweets eigener 'list'-Hook (siehe global.js) das bei
    // jeder Filter-Änderung automatisch ausgelöst - übernehmen wir jetzt hier.
    // Doppeltes rAF, damit der Browser das neue Grid sicher fertig
    // layoutet hat, bevor gemessen wird.
    if (typeof ScrollTrigger !== 'undefined') {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          ScrollTrigger.refresh();
        });
      });
    }
  }

  function render() {
    updateActiveFilterButton();
    returnCurrentBatchHome();

    var activeLabel = getActiveFilterLabel();
    var isAll = !activeLabel || normalize(activeLabel) === ALL_LABEL;
    var filtered = isAll
      ? pool
      : pool.filter(function (p) {
          return normalize(p.category) === normalize(activeLabel);
        });

    var batch = shuffle(filtered).slice(0, Math.min(BATCH_SIZE, filtered.length));

    // Echtes appendChild: Karten wandern aus bis zu 6 verschiedenen
    // Quell-Listen physisch in EIN Ziel-Grid, keine Lücken.
    batch.forEach(function (item) {
      targetGrid.appendChild(item.el);
    });

    applyLayout(batch);

    batch.forEach(function (item, i) {
      revealImage(item);
      item.el.classList.remove(REVEAL_CLASS);
      // gleiches Stagger-Muster wie im bestehenden Reveal (max 0.3s)
      item.el.style.transitionDelay = Math.min(i * 0.03, 0.3).toFixed(2) + 's';
      requestAnimationFrame(function () {
        item.el.classList.add(REVEAL_CLASS);
      });
    });

    console.log(
      '[Produkte-Grid] Filter:',
      isAll ? 'Alle' : activeLabel,
      '| Batch:',
      batch.length,
      '| Pool gesamt:',
      pool.length
    );
  }

  // Nur Neuanordnen bei Resize, NICHT neu mischen - Verhalten bewusst
  // identisch zum bestehenden Masonry-Script.
  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var current = Array.prototype.map
            .call(targetGrid.children, function (card) {
              return pool.filter(function (p) {
                return p.el === card;
              })[0];
            })
            .filter(Boolean);
          if (current.length) applyLayout(current);
        });
      });
    }, 400);
  }

  filterInputs.forEach(function (f) {
    f.input.addEventListener('change', render);
  });
  window.addEventListener('resize', onResize);

  render();
}
