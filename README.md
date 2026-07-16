# Supplyhero – Webflow Custom Code

Custom GSAP-Animationen und Interaktionen für die Supplyhero-Webflow-Seite. Der Code wird lokal in VSCode entwickelt, über GitHub versioniert und per [jsDelivr](https://www.jsdelivr.com/) direkt aus dem Repository in Webflow eingebunden.

- **Repo:** https://github.com/pixelgiantagency/supplyhero
- **Staging:** https://supplyherostaging.webflow.io

---

## Kurzüberblick: Wie der Code auf die Seite kommt

Ein Snippet im Webflow **Head-Code** (Project Settings → Custom Code) entscheidet automatisch, welche Version von `bundle.js` geladen wird:

| Modus | Bedingung | Quelle |
|---|---|---|
| **Lokal** | `?dev=true` in der URL (bzw. gesetzte `devMode`-Flag in `localStorage`) | `http://localhost:3000/bundle.js` (lokaler esbuild-Server) |
| **Staging** | `hostname` enthält `webflow.io`, kein Dev-Modus aktiv | `https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@main/dist/bundle.js` |
| **Prod** | alles andere (echte Live-Domain) | `https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@<VERSION>/dist/bundle.js` (fester Git-Tag) |

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
  body:not(.js-ready) [data-hero="heading"],
  body:not(.js-ready) [data-hero="text"],
  body:not(.js-ready) [data-hero="button"],
  body:not(.js-ready) [data-gsap="navbar"],
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

**⚠️ Kritisch: Niemals `!important` in der CSS-Regel oben verwenden.** GSAP setzt seine Animationswerte als Inline-Styles ohne `!important` – ein `!important` in der externen Regel würde dann *immer* gewinnen und die eigentliche Animation unsichtbar "einfrieren", selbst nachdem `js-ready` gesetzt wurde. Ohne `!important` gilt normale CSS-Priorität: Inline-Styles (von GSAP gesetzt) schlagen automatisch die externe Klassen-Regel, sobald GSAP anfängt zu animieren – kein Konflikt.

---

## Bekannte Stolpersteine

**jsDelivr Purge-Throttling.** Der Purge-Endpoint (`purge.jsdelivr.net`) lässt sich für denselben Pfad nur begrenzt oft hintereinander aufrufen – ruft man ihn zu häufig auf, wird der Request stillschweigend **throttled** (nicht ausgeführt), obwohl die Antwort wie ein Erfolg aussieht. Immer den JSON-Response prüfen:
```json
{ "paths": { "/gh/.../bundle.js": { "throttled": true, "throttlingReset": 959 } } }
```
`throttled: true` = Purge wurde ignoriert, `throttlingReset` = Sekunden bis zum nächsten möglichen Versuch. Falls throttled: einfach warten (Countdown) oder gar nichts tun – jsDelivrs eigener Cache läuft nach spätestens 12 Stunden (`s-maxage=43200`) ohnehin von selbst ab, auch ganz ohne Purge.

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
