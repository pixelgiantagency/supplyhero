# Supplyhero – Webflow Custom Code

Custom GSAP-Animationen und Interaktionen für die Supplyhero-Webflow-Seite. Der Code wird lokal in VSCode entwickelt, über GitHub versioniert und per [jsDelivr](https://www.jsdelivr.com/) direkt aus dem Repository in Webflow eingebunden.

- **Repo:** https://github.com/pixelgiantagency/supplyhero
- **Staging:** https://supplyherostaging.webflow.io

---

## Kurzüberblick: Wie der Code auf die Seite kommt

Ein Snippet im Webflow **Head-Code** (Project Settings → Custom Code) entscheidet automatisch, welche Version von `bundle.js` geladen wird:

| Modus | Bedingung | Quelle |
|---|---|---|
| **Lokal** | `?dev=true` in der URL (bzw. gesetzte `devMode`-Flag in `localStorage`) | `https://127.0.0.1:5500/dist/bundle.js` (Live Server) |
| **Staging** | `hostname` enthält `webflow.io`, kein Dev-Modus aktiv | `https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@main/dist/bundle.js` |
| **Prod** | alles andere (echte Live-Domain) | `https://cdn.jsdelivr.net/gh/pixelgiantagency/supplyhero@<VERSION>/dist/bundle.js` (fester Git-Tag) |

**Wichtig:** `devMode` wird in `localStorage` gespeichert – **pro Browser getrennt**. Testest du in mehreren Browsern, musst du in jedem einzeln `?dev=true` bzw. `?dev=false` setzen. Vergisst du das, versucht z.B. Brave weiterhin `127.0.0.1:5500` zu laden, obwohl Live Server längst aus ist → `ERR_CONNECTION_REFUSED`. Einfach `?dev=false` einmal aufrufen, um zurückzusetzen.

---

## Projektstruktur

```
src/
  main.js                  → Einstiegspunkt, importiert & ruft alle init-Funktionen auf
  global.js                → Site-weite Funktionen (Nav, Reveal-Groups, Hero-Sequenz, GSAP-Setup, Refresh-Fixes...)
  components/               → Seitenspezifische Funktionen (nur dort geladen, wo die Elemente existieren)
    image-sequence.js
    category-hover.js
    process-sequence.js
    brand-promise.js
    anspruch.js (+ .css)
    project-slider.js
dist/
  bundle.js                 → Automatisch generiert, NICHT manuell bearbeiten (siehe unten)
.github/workflows/build.yml → GitHub Action: baut & pusht dist/bundle.js automatisch
eslint.config.mjs           → Linting-Regeln
.prettierrc                 → Formatierungs-Regeln
```

**Warum `dist/bundle.js` trotzdem im Repo liegt (Ausnahme von der üblichen Regel):** jsDelivr liest bei `gh/`-URLs die Rohdatei direkt aus dem Repo – es gibt keinen Server, der zur Laufzeit baut. `dist/` muss also zwingend eingecheckt sein, wird aber **nicht manuell** gepflegt, sondern von der GitHub Action bei jedem Push automatisch neu erzeugt.

---

## Lokale Entwicklung einrichten (einmalig pro Rechner)

### Voraussetzungen
- VSCode mit Extensions: **Live Server** (ritwickdey), **ESLint** (Microsoft), **Prettier - Code formatter**
- Node.js + npm
- [mkcert](https://github.com/FiloSottile/mkcert) (für lokales HTTPS-Zertifikat)

### Setup

```powershell
npm install
```

**HTTPS-Zertifikat erzeugen** (Live Server muss über HTTPS laufen, sonst blockiert der Browser das Nachladen auf der HTTPS-Staging-Domain als Mixed Content):

```powershell
mkcert -install          # einmalig pro Rechner
mkdir .vscode-certs
cd .vscode-certs
mkcert localhost 127.0.0.1
cd ..
```

**`.vscode/settings.json`** anlegen (liegt in `.gitignore`, da rechnerspezifischer Pfad):

```json
{
  "liveServer.settings.https": {
    "enable": true,
    "cert": "VOLLSTÄNDIGER_PFAD/.vscode-certs/localhost+1.pem",
    "key": "VOLLSTÄNDIGER_PFAD/.vscode-certs/localhost+1-key.pem",
    "passphrase": ""
  }
}
```

### Entwickeln

```powershell
npm run watch
```

Baut bei jeder Speicherung automatisch neu. Danach per Rechtsklick auf eine Datei im Explorer → **"Open with Live Server"**.

Auf `https://supplyherostaging.webflow.io/[seite]?dev=true` testen – Konsole sollte `🟡 Lade lokalen Code (127.0.0.1)` zeigen.

### Browser-Stolperstein: Local Network Access (Chrome/Brave)

Moderne Chromium-Browser blockieren standardmäßig, dass eine öffentliche HTTPS-Seite (`supplyherostaging.webflow.io`) eine lokale Adresse (`127.0.0.1`) anspricht. Falls `bundle.js` im Network-Tab dauerhaft auf "pending" hängt:

- Chrome: `chrome://settings/content/siteDetails?site=https://supplyherostaging.webflow.io` → "Local Network Access" → Zulassen
- Brave: analog über `brave://settings/...`, oder pauschal `brave://flags/#local-network-access-check` auf "Disabled" (empfohlen: nur in einem separaten Dev-Browserprofil, nicht global)

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

Falls trotzdem noch alter Stand angezeigt wird, manuell purgen:
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

