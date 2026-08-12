// components/products-gallery.js

export function initProductsGallery() {
  var MIN_ITEMS_FOR_HIGHLIGHT = 8;
  var HIGHLIGHT_CLASS = 'is-highlighted';
  var MAX_ATTEMPTS_PER_TRY = 25;

  setTimeout(function () {
    document.querySelectorAll('.produkte_item:not(.hg-positioned)').forEach(function (el) {
      el.classList.add('hg-positioned');
    });
  }, 3000);

  function getColumnCount() {
    var w = window.innerWidth;
    if (w <= 479) return 1;
    if (w <= 767) return 2;
    if (w <= 991) return 3;
    return 4;
  }

  function ensureRow(grid, r, columns) {
    while (grid.length <= r) grid.push(new Array(columns).fill(false));
  }
  function canPlace(grid, r, c, w, h, columns) {
    if (c + w > columns) return false;
    for (var rr = r; rr < r + h; rr++) {
      ensureRow(grid, rr, columns);
      for (var cc = c; cc < c + w; cc++) {
        if (grid[rr][cc]) return false;
      }
    }
    return true;
  }
  function place(grid, r, c, w, h, columns) {
    for (var rr = r; rr < r + h; rr++) for (var cc = c; cc < c + w; cc++) grid[rr][cc] = true;
  }
  function findSpot(grid, w, h, columns) {
    var r = 0;
    while (true) {
      for (var c = 0; c <= columns - w; c++) {
        if (canPlace(grid, r, c, w, h, columns)) return { r: r, c: c };
      }
      r++;
    }
  }
  function simulateAppend(existingGrid, count, columns, bigIndicesSet) {
    var grid = existingGrid.map(function (row) {
      return row.slice();
    });
    var positions = [];
    for (var i = 0; i < count; i++) {
      var isBig = bigIndicesSet.has(i);
      var w = isBig ? 2 : 1;
      var h = isBig ? 2 : 1;
      var spot = findSpot(grid, w, h, columns);
      place(grid, spot.r, spot.c, w, h, columns);
      positions.push({ index: i, row: spot.r, col: spot.c, w: w, h: h, isBig: isBig });
    }
    return { positions: positions, totalRows: grid.length, grid: grid };
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
    if (columns < 2 || newCount < MIN_ITEMS_FOR_HIGHLIGHT) {
      return simulateAppend(existingGrid, newCount, columns, new Set());
    }
    for (var numHighlights = 2; numHighlights >= 0; numHighlights--) {
      if (numHighlights === 0) return simulateAppend(existingGrid, newCount, columns, new Set());
      for (var attempt = 0; attempt < MAX_ATTEMPTS_PER_TRY; attempt++) {
        var candidates = pickRandomIndices(newCount, numHighlights);
        var sim = simulateAppend(existingGrid, newCount, columns, candidates);
        if (isValid(sim)) return sim;
      }
    }
  }

  function getFilterKey() {
    var checked = document.querySelector('input[name="projekte-filter"]:checked');
    return checked ? checked.value : 'Alle';
  }

  var observer = null;
  function getObserver() {
    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          var visible = entries.filter(function (e) {
            return e.isIntersecting;
          });
          visible.forEach(function (entry, i) {
            var el = entry.target;
            el.style.transitionDelay = Math.min(i * 0.05, 0.3).toFixed(2) + 's';
            el.classList.add('hg-positioned');
            observer.unobserve(el);
          });
        },
        { rootMargin: '0px', threshold: 0.2 }
      );
    }
    return observer;
  }

  function revealViaObserver(elements) {
    elements.forEach(function (el) {
      el.classList.remove('hg-positioned');
      getObserver().observe(el);
    });
  }

  var stateByList = new WeakMap();

  function applyForList(listInstance) {
    var elements = listInstance.items.value
      .map(function (item) {
        return item.element;
      })
      .filter(function (el) {
        return el.offsetParent !== null;
      });

    var columns = getColumnCount();

    var state = stateByList.get(listInstance);
    if (!state) {
      state = { perFilter: {}, lastFilterKey: null, lastColumns: columns };
      stateByList.set(listInstance, state);
    }

    var columnsChanged = state.lastColumns !== columns;
    state.lastColumns = columns;

    var filterKey = getFilterKey();
    var filterChanged = state.lastFilterKey !== filterKey;
    state.lastFilterKey = filterKey;

    if (columnsChanged) {
      state.perFilter = {};
    }

    var sub = state.perFilter[filterKey];
    var isContinuation =
      sub &&
      sub.processed.length > 0 &&
      sub.processed.length <= elements.length &&
      sub.processed.every(function (el, i) {
        return elements[i] === el;
      });

    if (!sub) {
      sub = { grid: [], processed: [], positions: new Map() };
      state.perFilter[filterKey] = sub;
    } else if (!isContinuation) {
      sub.grid = [];
      sub.processed = [];
      sub.positions = new Map();
    }

    var newElements = elements.slice(sub.processed.length);
    if (newElements.length > 0) {
      var sim = computeBestAppend(sub.grid, newElements.length, columns);
      sim.positions.forEach(function (pos) {
        var el = newElements[pos.index];
        sub.positions.set(el, pos);
      });
      sub.grid = sim.grid;
      sub.processed = elements.slice();
    }

    elements.forEach(function (el) {
      var pos = sub.positions.get(el);
      if (pos) {
        el.classList.toggle(HIGHLIGHT_CLASS, pos.isBig);
        var col = pos.col + 1 + ' / span ' + pos.w;
        var row = pos.row + 1 + ' / span ' + pos.h;
        if (el.style.gridColumn !== col) el.style.gridColumn = col;
        if (el.style.gridRow !== row) el.style.gridRow = row;
      }
    });

    if (columnsChanged || filterChanged) {
      revealViaObserver(elements);
    } else if (newElements.length > 0) {
      revealViaObserver(newElements);
    }

    console.log(
      '[Highlight-Grid] Filter:',
      filterKey,
      '| Spalten:',
      columns,
      '| Gesamt:',
      elements.length,
      '| Neu:',
      newElements.length
    );
  }

  window.FinsweetAttributes = window.FinsweetAttributes || [];
  window.FinsweetAttributes.push([
    'list',
    function (listInstances) {
      // Gezielt die Produkte-Liste finden, statt blind listInstances[0] zu
      // nehmen - wichtig, weil dieses Skript sitewide läuft und es auf
      // anderen Seiten evtl. andere Finsweet-Listen gibt.
      var listInstance = listInstances.find(function (li) {
        var firstItem = li.items.value[0];
        return firstItem && firstItem.element.closest('.produkte_list');
      });
      if (!listInstance) return; // keine Produkte-Liste auf dieser Seite -> nichts zu tun

      if (listInstance.__highlightGridInitialized) return;
      listInstance.__highlightGridInitialized = true;

      applyForList(listInstance);
      listInstance.addHook('afterRender', function (renderedItems) {
        applyForList(listInstance);
        return renderedItems;
      });

      var resizeTimer = null;
      function scheduleResize(source) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          // Doppeltes requestAnimationFrame: garantiert, dass der Browser
          // mindestens einen vollständigen Layout/Paint-Zyklus abgeschlossen
          // hat, bevor wir die Spaltenzahl auslesen.
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              applyForList(listInstance);
            });
          });
        }, 400);
      }
      [991, 767, 479].forEach(function (bp) {
        var mq = window.matchMedia('(max-width: ' + bp + 'px)');
        var handler = function () {
          scheduleResize('matchMedia ' + bp + 'px');
        };
        if (mq.addEventListener) {
          mq.addEventListener('change', handler);
        } else {
          mq.addListener(handler);
        }
      });
      window.addEventListener('resize', function () {
        scheduleResize('window.resize');
      });
    },
  ]);
}
