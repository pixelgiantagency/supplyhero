# Supplyhero – Webflow Custom Code

Custom GSAP-Animationen und Interaktionen für die Supplyhero-Webflow-Seite. Der Code wird lokal in VSCode entwickelt, über GitHub versioniert und per [jsDelivr](https://www.jsdelivr.com/) direkt aus dem Repository in Webflow eingebunden.

- **Repo:** https://github.com/pixelgiantagency/supplyhero
- **Staging:** https://supplyherostaging.webflow.io

---

## Kurzüberblick: Wie der Code auf die Seite kommt

Ein Snippet im Webflow **Head-Code** (Project Settings → Custom Code) entscheidet automatisch, welche Version von `bundle.js` geladen wird:

| Modus       | Bedingung                                                               | Quelle                                                                                              |
| ----------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Lokal**   | `?dev=true` in der URL (bzw. gesetzte `devMode`-Flag in `localStorage`) | `http://localhost:3000/bundle.js` (lokaler esbuild-Server)                                          |
| **Staging** | `hostname` enthält `webflow.io`, kein Dev-Modus aktiv                   | `https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@main/dist/bundle.js`                       |
| **Prod**    | alles andere (echte Live-Domain)                                        | `https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@<VERSION>/dist/bundle.js` (fester Git-Tag) |

**Wichtig:** `devMode` wird in `localStorage` gespeichert – **pro Browser getrennt**. Testest du in mehreren Browsern, musst du in jedem einzeln `?dev=true` bzw. `?dev=false` setzen. Vergisst du das, versucht der Browser weiterhin `localhost:3000` zu laden, obwohl der lokale Server längst aus ist → `ERR_CONNECTION_REFUSED`. Einfach `?dev=false` einmal aufrufen, um zurückzusetzen.

**Empfehlung: Lokalen Dev-Loop (`?dev=true`) nur in Chrome nutzen.** Brave blockiert das automatische Nachladen von `localhost` in eine öffentliche HTTPS-Seite ("Local Network Access") beim Seitenaufruf zuverlässig, auch nach manueller Freigabe – betrifft nur den lokalen Modus, Staging/Prod funktionieren in Brave einwandfrei, da dort kein `localhost` im Spiel ist.

---

## Projektstruktur

```
src/
  main.js                  → Einstiegspunkt, importiert & ruft alle init-Funktionen auf
  global.js                → Site-weite Funktionen (Nav, Reveal-Groups, Hero-Sequenz, GSAP-Setup, FOUC-Reveal, Refresh-Fixes...)
  components/               → Seitenspezifische Funktionen (nur dort geladen, wo die Elemente existieren)
    image-sequence.js
    category-hover.js
    step-reveal.js           → Gestaffelte Reveal-Animation (Linie/Nummer/Label/Text/Bild), genutzt auf "Unser Prozess" UND "Das Team"
    markenversprechen.js
    anspruch.js (+ .css)
    project-slider.js
    draggable-marquee.js
    product-grid.js           → Produkte-Seite: zufälliger Batch, Kategorie-Filter, Highlight-Layout (siehe eigener Abschnitt unten)
    product-marquee.js        → Home-Marquee: zufällige Produktauswahl aus dem vollen Pool (siehe eigener Abschnitt unten)
dist/
  bundle.js                 → Automatisch generiert, NICHT manuell bearbeiten (siehe unten)
.github/workflows/build.yml → GitHub Action: baut & pusht dist/bundle.js automatisch
eslint.config.mjs           → Linting-Regeln
.prettierrc                 → Formatierungs-Regeln
```

**Warum `dist/bundle.js` trotzdem im Repo liegt (Ausnahme von der üblichen Regel):** jsDelivr liest bei `gh/`-URLs die Rohdatei direkt aus dem Repo – es gibt keinen Server, der zur Laufzeit baut. `dist/` muss also zwingend eingecheckt sein, wird aber **nicht manuell** gepflegt, sondern von der GitHub Action bei jedem Push automatisch neu erzeugt.

---

## Lokale Entwicklung einrichten

### Voraussetzungen

- VSCode mit Extensions: **ESLint** (Microsoft), **Prettier - Code formatter**
- Node.js + npm

### Setup

```powershell
npm install
```

Kein Zertifikat, keine HTTPS-Konfiguration nötig – der lokale Dev-Server läuft über reines HTTP. Grund: `localhost`/`127.0.0.1` gelten browserseitig als sichere Ursprünge, auch wenn sie von einer HTTPS-Seite aus geladen werden.

### Entwickeln

```powershell
npm run dev
```

Startet einen lokalen Server unter `http://localhost:3000`, der bei jeder Anfrage automatisch neu baut. Läuft im Terminal weiter, einfach offen lassen.

**Ablauf:** Code ändern → `Strg+S` → im Browser-Tab mit der Staging-Seite manuell **F5** drücken (kein automatisches Reload, da die Webflow-Seite den Code nur per Script-Tag nachlädt, nicht selbst vom lokalen Server ausgeliefert wird).

Auf `https://supplyherostaging.webflow.io/[seite]?dev=true` testen (in **Chrome**, siehe Hinweis oben) – Konsole sollte `🟡 Lade lokalen Code` zeigen.

---

## FOUC-Schutz (Flash of Unstyled/Unanimated Content)

Ohne Schutz sind Hero-Elemente kurz normal sichtbar, bevor GSAP sie versteckt und dann einanimiert – sichtbar als kurzer "Blitzer" beim Laden. Lösung, verteilt über zwei Stellen:

**1. CSS im Webflow Head-Code** (nicht im Repo, direkt in Project Settings → Custom Code):

```html
<style>
  body:not(.js-ready) [data-hero='heading'],
  body:not(.js-ready) [data-hero='text'],
  body:not(.js-ready) [data-hero='button'],
  body:not(.js-ready) [data-gsap='navbar'],
  body:not(.js-ready) [data-split-load] {
    opacity: 0;
  }
</style>
<script>
  // Fallback: falls bundle.js aus irgendeinem Grund nicht lädt, nach 3s trotzdem freigeben
  setTimeout(function () {
    document.body.classList.add('js-ready');
  }, 3000);
</script>
```

**2. `global.js`:** `revealAfterSetup()` setzt `js-ready` auf `<body>`, wird in `main.js` als **letzter** Aufruf in `init()` ausgeführt (nachdem alle anderen init-Funktionen inkl. `initHeroSequence()` ihre GSAP-Startzustände gesetzt haben).

**⚠️ Kritisch: Niemals `!important` in der CSS-Regel oben verwenden.** GSAP setzt seine Animationswerte als Inline-Styles ohne `!important` – ein `!important` in der externen Regel würde dann _immer_ gewinnen und die eigentliche Animation unsichtbar "einfrieren", selbst nachdem `js-ready` gesetzt wurde. Ohne `!important` gilt normale CSS-Priorität: Inline-Styles (von GSAP gesetzt) schlagen automatisch die externe Klassen-Regel, sobald GSAP anfängt zu animieren – kein Konflikt.

---

## Produkte-Grid & Home-Marquee

Beide ersetzen ein früher Finsweet-basiertes System durch eigene Logik, weil sich "randomisierter Batch + Kategorie-Filter + kein Load More" (Produkte-Seite) bzw. "randomisierte Auswahl aus dem vollen Pool statt nur der manuell markierten 'Highlighted'-Produkte" (Home-Marquee) mit Finsweet nicht zuverlässig umsetzen ließ.

**Relevante Dateien:** `components/product-grid.js`, `components/product-marquee.js`

### Architektur-Prinzip (beide Systeme)

- **6 duplizierte Collection Lists** pro Komponente (Skip 0/100/200/300/400/500) als reine, unsichtbare Datenquelle – kein Finsweet, keine Ajax-Nachladerei. Deckt bis zu 600 Items ab; wächst der Katalog darüber hinaus, muss eine 7. Liste (Skip 600) manuell ergänzt werden.
- **Lazy-Loading der Bilder:** Das native Bild-Element ist absichtlich _entbunden_ (kein CMS-Feld direkt dran). Stattdessen liegt die Bild-URL als reiner Text in einem Code-Embed pro Karte:
  ```html
  <div class="js-produkte-datasrc" data-src="" style="display:none"></div>
  ```
  `data-src` wird per **"Add Field"** im Embed-Code-Editor ans CMS-Bildfeld gebunden. Grund für den Umweg: Bildfelder lassen sich in Webflow **nicht** über die normale Custom-Attribute-Bindung an ein CMS-Feld hängen (dort stehen nur Text-/Options-/Datumsfelder zur Auswahl) – der Code-Embed ist der einzige Weg, eine Bild-URL als reinen Text verfügbar zu machen, ohne dass der Browser sie sofort eifrig lädt. Das jeweilige Script setzt `img.src` erst, wenn eine Karte tatsächlich in den sichtbaren Batch gewählt wird.
- **Produkte-Grid** zusätzlich: `data-category`-Custom-Attribut auf jeder Karte (`produkte_item`), ans CMS-Feld "Category" gebunden. Eigener, leerer Ziel-Grid-Container ganz ohne CMS-Bindung, in den der jeweilige 48er-Batch per `appendChild` verschoben wird.
- **Home-Marquee** zusätzlich: kein Filter, keine Kategorie nötig. Der sichtbare Ziel-Container (`data-draggable-marquee-collection`/`-list`) ist ebenfalls ein eigenes, leeres Konstrukt ohne CMS-Bindung – alle 6 Duplicate Lists sind rein Datenquelle, keine davon ist gleichzeitig das sichtbare Ziel (siehe Stolperstein unten, warum das wichtig ist).

### Kategorien ändern (Runbook)

Will der Kunde die Produkte-Kategorien später ändern, ist am **Script selbst nichts** anzupassen – Kategorienamen sind nirgends hartcodiert, alles wird zur Laufzeit aus dem DOM gelesen.

1. Mapping-Regel vom Kunden holen (alte → neue Kategorie)
2. Neue Optionen im CMS-Feld "Category" anlegen (alte an dieser Stelle noch **nicht** löschen)
3. Betroffene Produkte umtaggen (bei klarer Mapping-Regel per CMS-API in einem Rutsch möglich statt einzeln von Hand)
4. Alte, jetzt leere Optionen löschen
5. Filter-Buttons in Webflow anpassen (hinzufügen/entfernen/umbenennen) – **Label-Text muss exakt (zeichengenau) mit dem CMS-Options-Namen übereinstimmen**, am besten kopieren statt neu tippen (siehe Stolperstein unten). Die `id`-Attribute der Radio-Buttons sind für die Funktion irrelevant.
6. Site publizieren, danach jeden Filter einmal durchklicken – Konsole loggt bei jedem Klick `[Produkte-Grid] Filter: ... | Batch: ... | Pool gesamt: ...`, sollte überall plausible Zahlen statt einer 0 zeigen.

### Bekannte Stolpersteine

**Unsichtbare Zeichen in manuell umbenannten Filter-Labels.** Ein per Hand in Webflow umbenanntes Label enthielt ein geschütztes Leerzeichen (`\u00A0`) statt eines normalen – dadurch lieferte der Filter trotz optisch identischem Text 0 Treffer, obwohl CMS-Daten und Label auf den ersten Blick übereinstimmten. Beide Scripts normalisieren Text-Vergleiche deshalb über eine gemeinsame `normalize()`-Funktion (Whitespace vereinheitlichen, trim, lowercase). Trotzdem: Label-Text nach jeder manuellen Änderung lieber kopieren statt neu abtippen.

**`ScrollTrigger.refresh()` nach Layout-Änderungen nicht vergessen.** Ändert das Produkte-Grid seine Höhe (Filter-Wechsel, Resize), müssen ScrollTrigger/ScrollSmoother das neu vermessen – sonst laufen Reveal-Sections und der Footer-Parallax weiter unten auf der Seite ins Leere. Früher übernahm das Finsweets eigener `fsAttributes`-Hook (siehe `global.js`, ganz unten) automatisch bei jeder Filter-Änderung; da `product-grid.js` Finsweet nicht mehr nutzt, ruft es `ScrollTrigger.refresh()` jetzt selbst in `applyLayout()` auf. Baut man künftig ein weiteres System, das die Seitenhöhe dynamisch ändert, diesen Fix nicht vergessen.

**`product-marquee.js` muss vor `initDraggableMarquee()` laufen.** `draggable-marquee.js` misst Breite und wartet auf geladene Bilder basierend auf dem, was zum Zeitpunkt seines Aufrufs bereits in der Ziel-Liste steht. Reihenfolge in `main.js` ist deshalb bewusst `initProductMarquee()` **vor** `initDraggableMarquee()`.

**Custom Attributes werden beim Duplizieren von Collection Lists automatisch mitkopiert.** Betrifft besonders Attribute, an denen sich andere Scripts orientieren (z. B. `data-draggable-marquee-collection`/`-list`) – nach dem Duplizieren tragen alle Kopien dasselbe Attribut, `querySelector()` greift dann unvorhersehbar irgendeine davon statt garantiert der richtigen. Deshalb bei reinen Datenquell-Duplikaten solche Such-Attribute manuell entfernen – oder, sauberer, von vornherein einen separaten, leeren Zielcontainer ganz ohne CMS-Bindung bauen (so wie hier umgesetzt).

**Skip-Werte der Duplicate Lists lassen sich nicht per Webflow-API auslesen**, nur manuell im Designer prüfbar (Collection-List-Einstellungen → Skip). Bei Debugging-Sessions im Hinterkopf behalten, falls ein Batch verdächtig wenige oder immer dieselben Items zeigt.

---

## Bekannte Stolpersteine

**jsDelivr Purge-Throttling.** Der Purge-Endpoint (`purge.jsdelivr.net`) lässt sich für denselben Pfad nur begrenzt oft hintereinander aufrufen – ruft man ihn zu häufig auf, wird der Request stillschweigend **throttled** (nicht ausgeführt), obwohl die Antwort wie ein Erfolg aussieht. Immer den JSON-Response prüfen:

```json
{ "paths": { "/gh/.../bundle.js": { "throttled": true, "throttlingReset": 959 } } }
```

`throttled: true` = Purge wurde ignoriert, `throttlingReset` = Sekunden bis zum nächsten möglichen Versuch. Falls throttled: einfach warten (Countdown) oder gar nichts tun – jsDelivrs eigener Cache läuft nach spätestens 12 Stunden (`s-maxage=43200`) ohnehin von selbst ab, auch ganz ohne Purge.

**`@main`-Branch-Referenzen: Origin-Cache kann einen Purge überleben.** Anders als bei Tags (siehe Produktions-Workflow oben) hängt hinter `@main` bei jsDelivr intern noch eine zweite, vom Purge-Endpoint _nicht_ erfasste Cache-Ebene – ein von jsDelivr selbst bestätigtes Verhalten bei Branch-Referenzen ([GitHub Issue #18376](https://github.com/jsdelivr/jsdelivr/issues/18376)). Ein erfolgreicher Purge (`throttled: false`) garantiert also **nicht**, dass `@main` sofort den neuesten Commit ausliefert – das kann noch einige Minuten dauern, ohne feste Obergrenze von jsDelivr.

Schneller Diagnose-Check, **bevor** man nach einem Deploy im Code nach einem Fehler sucht: dieselbe Datei einmal über `@main`, einmal über die exakte Commit-SHA abrufen und vergleichen:

```
https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@main/dist/bundle.js
https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@<commit-sha>/dist/bundle.js
```

Zeigt die SHA-Version den erwarteten Stand, `@main` aber nicht → reines jsDelivr-Cache-Thema, kein Code-Bug (Zeit sparen, nicht im Code suchen). Sofort-Workaround, falls es eilig ist: den Webflow-Script-Tag kurzzeitig auf die exakte SHA pinnen, bis `@main` nachgezogen hat – danach zurück auf `@main` stellen.

---

## Code-Qualität

```powershell
npm run lint      # ESLint prüfen
npm run lint -- --fix   # Auto-fixbare Probleme beheben
npm run format     # Prettier formatieren
```

VSCode ist auf "Format on Save" (Prettier) eingestellt.

---

## Deployment-Workflow

### Staging (automatisch bei jedem Push)

1. Änderungen in `src/` committen & pushen (GitHub Desktop oder `git push`)
2. GitHub Action läuft automatisch: `npm install` → `lint` → `build` → committet `dist/bundle.js` zurück → purged jsDelivr-Cache für `@main`
3. Fortschritt: Tab **"Actions"** im Repo
4. Nach grünem Haken (~10–30s): `supplyherostaging.webflow.io` testen (ohne `?dev=true`)

Falls trotzdem noch alter Stand angezeigt wird, manuell purgen (Response-JSON auf `throttled` prüfen, siehe oben):

```
https://purge.jsdelivr.net/gh/pixelgiantagency/supplyhero@main/dist/bundle.js
```

### Produktion (manuell, bewusster Schritt)

Erst wenn ein Stand wirklich für echte Besucher bereit ist:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Danach in Webflow den Head-Code (`PROD_SCRIPT`) auf die neue Versionsnummer anpassen und **published** (nicht vergessen!). Getaggte Versionen werden von jsDelivr dauerhaft gecacht – kein Purge nötig, aber auch kein versehentliches Live-Gehen ungetesteter Änderungen möglich.

**Rollback:** Bei Problemen einfach `PROD_SCRIPT` auf die vorherige Versionsnummer zurücksetzen und republishen.
