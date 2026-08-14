// components/product-marquee.js
//
// Ersetzt die bisherige "Highlighted = true"-Filterung des Home-Marquees
// durch eine echte Zufallsauswahl (20 Produkte) aus dem kompletten Produkte-
// Pool, neu gemischt bei jedem Seitenaufruf. Gleiches Grundprinzip wie
// produkte-grid.js (Duplicate Lists als Datenquelle, data-src-Embed gegen
// eifriges Laden), aber deutlich einfacher: kein Filter, kein Bin-Packing,
// läuft nur einmal pro Seitenaufruf.
//
// Voraussetzung in Webflow:
//   .draggable-marquee__list   1x sichtbar (Skip 0, behält
//                               data-draggable-marquee-list), + 5x als
//                               Duplikate (Skip 100/200/300/400/500),
//                               dauerhaft auf Display:None, OHNE das
//                               data-draggable-marquee-list-Attribut
//   .draggable-marquee__item   .js-produkte-datasrc[data-src] = Bild-URL,
//                               natives Bild (.draggable-marquee__item-img)
//                               entbunden - exakt wie bei produkte-grid.js
//
// WICHTIG: Muss in main.js VOR initDraggableMarquee() aufgerufen werden.
// draggable-marquee.js misst Breite/wartet auf Bilder basierend auf dem,
// was zum Zeitpunkt seines Aufrufs in .draggable-marquee__list steht - läuft
// dieses Script später, rechnet draggable-marquee.js mit falschen Maßen.

export function initProductMarquee() {
  var TARGET_COUNT = 20;
  var WRAPPER_SELECTOR = '[data-draggable-marquee-init]';
  var LIST_SELECTOR = '[data-draggable-marquee-list]';
  var ITEM_SELECTOR = '.draggable-marquee__item';
  var IMG_SELECTOR = '.draggable-marquee__item-img';
  var DATASRC_SELECTOR = '.js-produkte-datasrc';

  var wrapper = document.querySelector(WRAPPER_SELECTOR);
  if (!wrapper) return; // kein Marquee auf dieser Seite -> nichts zu tun

  // Bewusst über das Attribut gesucht, nicht über die Klasse: Nach dem
  // Duplizieren tragen alle 6 .draggable-marquee__collection-Kopien dieselbe
  // Klasse, aber nur das Original darf noch data-draggable-marquee-list
  // haben (bei den 5 Duplikaten manuell entfernt). So finden dieses Script
  // und draggable-marquee.js garantiert dieselbe Liste.
  var targetList = wrapper.querySelector(LIST_SELECTOR);
  if (!targetList) return;

  // Pool aus ALLEN 6 Listen einsammeln - die sichtbare Ziel-Liste zählt mit,
  // die ist ja selbst ganz normal Skip=0 als Datenquelle. Wichtig: Referenzen
  // werden VOR jedem Leeren/Verschieben eingesammelt, bleiben aber auch nach
  // targetList.innerHTML = '' unten gueltig (innerHTML loescht nur aus dem
  // DOM-Baum, die JS-Objektreferenzen selbst bleiben nutzbar).
  var pool = Array.prototype.map.call(document.querySelectorAll(ITEM_SELECTOR), function (el) {
    var dataSrcEl = el.querySelector(DATASRC_SELECTOR);
    return {
      el: el,
      imageUrl: dataSrcEl ? (dataSrcEl.getAttribute('data-src') || '').trim() : '',
    };
  });

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

  var winners = shuffle(pool).slice(0, Math.min(TARGET_COUNT, pool.length));

  // Ziel-Liste leeren (verwirft, was dort nativ stand - egal, der Pool oben
  // hat davon unabhängig schon alles eingesammelt) und die Gewinner reinschieben.
  targetList.innerHTML = '';
  winners.forEach(function (item) {
    targetList.appendChild(item.el);
    if (item.imageUrl) {
      var img = item.el.querySelector(IMG_SELECTOR);
      if (img) img.src = item.imageUrl; // Bild wird erst hier tatsächlich angefragt
    }
  });

  console.log('[Produkte-Marquee] Gewählt:', winners.length, '/ Pool gesamt:', pool.length);
}
