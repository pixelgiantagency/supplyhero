// components/brand-promise.js

export function initMarkenversprechen() {
  // GSAP MatchMedia für Breakpoint-spezifische Animationen
  const mm = gsap.matchMedia();

  // --------------------------------------------------------
  // 1. DESKTOP (Ab 992px) - 4 Spalten, dynamischer & schneller
  // --------------------------------------------------------
  mm.add("(min-width: 992px)", () => {
    const promiseWrapper = document.querySelector('[data-promise="wrapper"]');
    const promiseSteps = document.querySelectorAll('[data-promise="step"]');
    if (!promiseWrapper || promiseSteps.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: promiseWrapper,
        start: "top 75%",
        once: true
      }
    });

    promiseSteps.forEach((step, index) => {
      const lines = step.querySelectorAll('[data-promise="line"]');
      const number = step.querySelector('[data-promise="number"]');
      const text = step.querySelector('[data-promise="text"]');
      const image = step.querySelector('[data-promise="image"]');

      if (lines.length) gsap.set(lines, { scaleY: 0, transformOrigin: "top center" });
      if (number) gsap.set(number, { y: "1.5em", opacity: 0 });
      if (text) gsap.set(text, { y: "1.5em", opacity: 0 });
      if (image) gsap.set(image, { clipPath: "inset(0% 0% 100% 0%)" });

      // Kürzerer Stagger: Nur 0.15s Verzögerung pro Spalte statt 0.2s
      const stepStartTime = index * 0.15;

      // Die komprimierte, überlappende Timeline für Desktop
      if (lines.length) tl.to(lines, { scaleY: 1, duration: 0.8, ease: "power3.inOut" }, stepStartTime);
      if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, stepStartTime + 0.1);
      if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, stepStartTime + 0.2);

      // Bild startet schon bei 0.3s (während die Linie noch wächst)
      if (image) tl.to(image, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power3.inOut" }, stepStartTime + 0.3);
    });
  });

  // --------------------------------------------------------
  // 2. TABLET (768px - 991px) - 2 Spalten, 2er Stagger
  // --------------------------------------------------------
  mm.add("(min-width: 768px) and (max-width: 991px)", () => {
    const promiseSteps = document.querySelectorAll('[data-promise="step"]');

    promiseSteps.forEach((step, index) => {
      const lines = step.querySelectorAll('[data-promise="line"]');
      const number = step.querySelector('[data-promise="number"]');
      const text = step.querySelector('[data-promise="text"]');
      const image = step.querySelector('[data-promise="image"]');

      if (lines.length) gsap.set(lines, { scaleY: 0, transformOrigin: "top center" });
      if (number) gsap.set(number, { y: "1.5em", opacity: 0 });
      if (text) gsap.set(text, { y: "1.5em", opacity: 0 });
      if (image) gsap.set(image, { clipPath: "inset(0% 0% 100% 0%)" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: step,
          start: "top 80%",
          once: true
        }
      });

      const stepStartTime = (index % 2) * 0.2;

      if (lines.length) tl.to(lines, { scaleY: 1, duration: 1.0, ease: "power3.inOut" }, stepStartTime);
      if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, stepStartTime + 0.2);
      if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, stepStartTime + 0.4);
      if (image) tl.to(image, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut" }, stepStartTime + 0.6);
    });
  });

  // --------------------------------------------------------
  // 3. MOBILE (Bis 767px) - 1 Spalte, dynamischer & schneller
  // --------------------------------------------------------
  mm.add("(max-width: 767px)", () => {
    const promiseSteps = document.querySelectorAll('[data-promise="step"]');

    promiseSteps.forEach((step) => {
      const lines = step.querySelectorAll('[data-promise="line"]');
      const number = step.querySelector('[data-promise="number"]');
      const text = step.querySelector('[data-promise="text"]');
      const image = step.querySelector('[data-promise="image"]');

      if (lines.length) gsap.set(lines, { scaleY: 0, transformOrigin: "top center" });
      if (number) gsap.set(number, { y: "1.5em", opacity: 0 });
      if (text) gsap.set(text, { y: "1.5em", opacity: 0 });
      if (image) gsap.set(image, { clipPath: "inset(0% 0% 100% 0%)" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: step,
          start: "top 80%",
          once: true
        }
      });

      // Die komprimierte, überlappende Timeline für Mobile
      if (lines.length) tl.to(lines, { scaleY: 1, duration: 0.7, ease: "power3.inOut" }, 0);
      if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.1);
      if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.2);

      // Bild startet schon bei 0.4s (während die Linie noch wächst) und ist schneller fertig
      if (image) tl.to(image, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut" }, 0.4);
    });
  });
}