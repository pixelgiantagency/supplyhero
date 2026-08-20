// ==========================================================================
// Fix für kaputte Zeilenumbrüche bei Headings mit Highlight-<span>s
// ==========================================================================
// Problem: SplitText berechnet Zeilenumbrüche über getBoundingClientRect()
// der Kindknoten. Enthält das Element bereits verschachtelte <span> (unsere
// Highlight-Wörter, z. B. class="text-style-highlight"), muss SplitText die
// intern über "deepSlice" zerlegen, um sie korrekt über Zeilengrenzen hinweg
// zu verteilen. Das ist – auch nach dem 3.13-Rewrite von SplitText – der
// bekannteste Stolperstein der Bibliothek und in der Praxis nicht 100%
// deterministisch (siehe GSAP-Forum, u. a.
// https://gsap.com/community/forums/topic/45016-unexpected-line-breaks-when-using-split-text/).
// Genau das erklärt "mal gut, mal nach Refresh kaputt, ohne dass sich die
// Fensterbreite geändert hat".
//
// Lösung: SplitText bekommt gar keine verschachtelten <span> mehr zu sehen.
// Wir nehmen die Highlight-Spans vor dem Split raus (reiner Text bleibt
// übrig, damit läuft SplitText über den zuverlässigen "flachen Text"-Pfad)
// und wenden die Hervorhebung danach gezielt wieder auf die passenden
// .word-Elemente an. Am Redaktions-Workflow in Webflow ändert sich nichts –
// die Spans dürfen weiterhin ganz normal im Designer gesetzt werden.
//
// Genutzt von: global.js (initMaskTextScrollReveal) und
// components/image-sequence.js (Sequence-Heading).

function extractAndStripHighlights(heading, highlightSelector) {
  const highlightEls = Array.from(heading.querySelectorAll(highlightSelector));
  const highlights = highlightEls.map((el) => ({
    text: (el.textContent || '').trim(),
    className: el.className,
  }));

  highlightEls.forEach((el) => el.replaceWith(document.createTextNode(el.textContent)));
  heading.normalize();

  return highlights;
}

// Vergleicht Wörter ohne führende/nachgestellte Satzzeichen, damit z. B.
// "zugeschnitten" (Ende des Highlight-Textes) auch dann matcht, wenn
// SplitText direkt danach folgende Satzzeichen (".") ohne Leerzeichen zum
// selben Wort-Token zusammengezogen hat ("zugeschnitten.").
const normalizeWord = (s) => (s || '').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

function reapplyHighlights(words, highlights) {
  if (!highlights.length || !words || !words.length) return;

  let searchStart = 0;
  highlights.forEach(({ text, className }) => {
    const targetWords = text.split(/\s+/).filter(Boolean);
    if (!targetWords.length) return;

    for (let i = searchStart; i <= words.length - targetWords.length; i++) {
      let isMatch = true;
      for (let j = 0; j < targetWords.length; j++) {
        if (normalizeWord(words[i + j].textContent) !== normalizeWord(targetWords[j])) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        for (let j = 0; j < targetWords.length; j++) {
          words[i + j].className = `${words[i + j].className} ${className}`.trim();
        }
        searchStart = i + targetWords.length;
        break;
      }
    }
  });
}

// Wrapper um SplitText.create: entfernt Highlight-Spans vor dem Split,
// erzwingt intern "words" (damit wir nach dem Split etwas zum Einfärben
// haben) und ruft reapplyHighlights() vor dem eigentlichen onSplit-Callback
// auf. Läuft bei jedem (Re-)Split erneut – auch wenn autoSplit wegen
// Font-Loading oder Resize automatisch neu splittet.
export function splitHeadingWithHighlights(
  heading,
  vars,
  highlightSelector = '.text-style-highlight'
) {
  const highlights = extractAndStripHighlights(heading, highlightSelector);

  const requestedTypes = new Set(
    (vars.type || 'lines')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  );
  requestedTypes.add('words');

  const userOnSplit = vars.onSplit;

  return SplitText.create(heading, {
    ...vars,
    type: [...requestedTypes].join(', '),
    onSplit(instance) {
      reapplyHighlights(instance.words, highlights);
      return userOnSplit ? userOnSplit(instance) : undefined;
    },
  });
}
