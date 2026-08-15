// components/projects-cursor.js

export function initProjectsCursor() {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 992px)', () => {
    const cursor = document.querySelector('.project-cursor');
    if (!cursor) return;

    // Fix für ScrollSmoother
    document.body.appendChild(cursor);

    const cursorTitle = cursor.querySelector('.cursor-title');
    const cursorCategory = cursor.querySelector('.cursor-category');
    const textTargets = [cursorTitle, cursorCategory].filter(Boolean);

    // xPercent/yPercent auf -50: dadurch liegt die exakte Mitte des
    // Rechtecks immer auf der Mauskoordinate (zentrierter Cursor).
    gsap.set(cursor, {
      autoAlpha: 0,
      scale: 0.5,
      xPercent: -50,
      yPercent: -50,
    });

    // Performantes Maus-Tracking
    const xMove = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power3.out' });
    const yMove = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power3.out' });

    let lastX = 0;
    let lastY = 0;
    let activeCard = null;
    let isCursorVisible = false;

    window.addEventListener('mousemove', (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      xMove(e.clientX);
      yMove(e.clientY);
    });

    function showCursor() {
      isCursorVisible = true;
      gsap.to(cursor, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.5)',
      });
    }

    function hideCursor() {
      if (!isCursorVisible) return;
      isCursorVisible = false;
      gsap.to(cursor, {
        autoAlpha: 0,
        scale: 0.5,
        duration: 0.3,
        ease: 'power2.in',
      });
    }

    function setCursorText(card) {
      const title = card.querySelector('.projekte_title');
      const category = card.querySelector('.projekte_tag');
      if (cursorTitle && title) cursorTitle.textContent = title.textContent;
      if (cursorCategory && category) cursorCategory.textContent = category.textContent;
    }

    let hideTimeout = null;

    function activateCard(card) {
      if (card === activeCard) return;
      if (hideTimeout) {
        // Verhindert genau das gemeldete Problem: wechselt man von einer
        // Karte zur direkten Nachbarkarte, würde deactivateCard() sonst
        // schon isCursorVisible=false gesetzt haben, bevor diese Funktion
        // hier läuft - der Crossfade unten würde dann fälschlich den
        // "erstes Erscheinen"-Pfad nehmen (harter Text-Sprung statt
        // Crossfade). Durch den Abbruch bleibt isCursorVisible weiterhin
        // true, der Crossfade greift also korrekt.
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      const wasVisible = isCursorVisible;
      activeCard = card;

      if (wasVisible && textTargets.length) {
        // Cursor ist schon sichtbar, nur die Karte wechselt (Maus direkt
        // auf Nachbarkarte, oder Scroll-Korrektur) - Text kurz aus-/
        // einblenden statt hart umzuspringen. Reiner Opacity-Fade, keine
        // Bewegung. Der Cursor-Pill selbst bleibt stabil, kein erneuter
        // Pop nötig.
        gsap.to(textTargets, {
          autoAlpha: 0,
          duration: 0.12,
          ease: 'power2.in',
          onComplete: () => {
            setCursorText(card);
            gsap.to(textTargets, { autoAlpha: 1, duration: 0.18, ease: 'power2.out' });
          },
        });
      } else {
        // Erstes Erscheinen: Text sofort setzen, der Pop des Cursors selbst
        // liefert hier schon genug visuelles Feedback.
        setCursorText(card);
        showCursor();
      }
    }

    function deactivateCard() {
      if (activeCard === null) return; // schon deaktiviert, nichts zu tun
      activeCard = null;
      // Vorherigen Timer IMMER canceln, bevor ein neuer geplant wird - sonst
      // bleiben bei mehrfachen kurz aufeinanderfolgenden Aufrufen (z.B. durch
      // die Scroll-Korrektur-Schleife) alte Timer im Hintergrund "hängen"
      // und feuern hideCursor() irgendwann unerwartet, obwohl man
      // zwischenzeitlich längst wieder auf einer Karte war (führte zum
      // gemeldeten "Pill schrumpft manchmal grundlos"-Bug).
      if (hideTimeout) clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        hideCursor();
        hideTimeout = null;
      }, 80);
    }

    // Normale Hover-Logik bei echter Mausbewegung - unverändert, bleibt die
    // präziseste/günstigste Variante, wenn sich die Maus tatsächlich bewegt.
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.projekte_item-wrapper');
      if (card) activateCard(card);
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.projekte_item-wrapper');
      if (card && !card.contains(e.relatedTarget)) deactivateCard();
    });

    // Korrektur fürs Scrollen. ScrollSmoother bewegt die Seite per
    // CSS-Transform unter der (unbewegten) Maus hinweg - dabei feuert der
    // Browser weder mouseout noch mouseover, weil sich der Zeiger selbst
    // nicht bewegt. Während des Scrollens wird deshalb per rAF laufend per
    // elementFromPoint geprüft, was TATSÄCHLICH unter der zuletzt bekannten
    // Mausposition liegt - reagiert wird nur, wenn sich das wirklich
    // ändert (Karte verlassen, oder eine andere Karte rutscht unter den
    // Zeiger - dann greift derselbe Text-Crossfade wie oben).
    function checkCardUnderPointer() {
      const el = document.elementFromPoint(lastX, lastY);
      const card = el ? el.closest('.projekte_item-wrapper') : null;

      if (card) {
        activateCard(card);
      } else if (activeCard) {
        deactivateCard();
      }
    }

    let scrollRAF = null;
    function scrollTick() {
      checkCardUnderPointer();
      scrollRAF = requestAnimationFrame(scrollTick);
    }

    ScrollTrigger.addEventListener('scrollStart', () => {
      if (scrollRAF) return; // läuft schon
      scrollTick();
    });

    ScrollTrigger.addEventListener('scrollEnd', () => {
      if (scrollRAF) {
        cancelAnimationFrame(scrollRAF);
        scrollRAF = null;
      }
      checkCardUnderPointer(); // letzter Check nach Scroll-Ende
    });

    return () => {
      if (scrollRAF) cancelAnimationFrame(scrollRAF);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  });
}
