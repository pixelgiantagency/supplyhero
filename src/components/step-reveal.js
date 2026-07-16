// components/process-sequence.js

export function initStepReveal() {
  const processSteps = document.querySelectorAll('[data-process="step"]');
  if (processSteps.length === 0) return;
  processSteps.forEach((step) => {
    const line = step.querySelector('[data-process="line"]');
    const number = step.querySelector('[data-process="number"]');
    const label = step.querySelector('[data-process="label"]');
    const text = step.querySelector('[data-process="text"]');
    const image = step.querySelector('[data-process="image"]');

    // NEU: Optionales Attribut, das die Reihenfolge von Bild/Text umkehrt.
    // Standard (Attribut fehlt) = wie bisher: Text zuerst, dann Bild.
    const imageFirst = step.hasAttribute('data-process-image-first');

    // 1. Initialzustände setzen (Bevor gescrollt wird)
    if (line) gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });
    if (number) gsap.set(number, { y: '1.5em', opacity: 0 });
    if (label) gsap.set(label, { y: '1.5em', opacity: 0 });
    if (text) gsap.set(text, { y: '1.5em', opacity: 0 });
    if (image) gsap.set(image, { clipPath: 'inset(0% 0% 100% 0%)' });

    // 2. Drehbuch (Timeline) erstellen
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: step,
        start: 'top 75%',
        once: true,
      },
    });

    // 3. Animationen mit ABSOLUTEN Zeiten auf dem Zeitstrahl aneinanderreihen!
    if (line) tl.to(line, { scaleX: 1, duration: 1.0, ease: 'power3.inOut' }, 0);
    if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.2);
    if (label) tl.to(label, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.4);

    // Bild und Text: Reihenfolge hängt vom optionalen Attribut ab,
    // duration/ease bleiben in beiden Fällen exakt identisch.
    if (imageFirst) {
      if (image)
        tl.to(image, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' }, 0.7);
      if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 1.5);
    } else {
      if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.7);
      if (image)
        tl.to(image, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' }, 0.9);
    }
  });
}
