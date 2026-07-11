
export function initAnspruch() {

  // ========================================================
  // Sektion: Unser Anspruch (Kreise & Mobile Slider)
  // ========================================================

  const circleWrapper = document.querySelector('[data-circle="wrapper"]');
  const circleItems = document.querySelectorAll('[data-circle="item"]');
  const dots = document.querySelectorAll('.anspruch_dot');

  if (!circleWrapper || circleItems.length === 0) return;

  const mm = gsap.matchMedia();

  // --------------------------------------------------------
  // 1. DESKTOP & TABLET (Alle auf einmal mit Stagger)
  // --------------------------------------------------------
  mm.add("(min-width: 768px)", () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: circleWrapper,
        start: "top 75%",
        once: true
      }
    });

    circleItems.forEach((item, index) => {
      const line = item.querySelector('[data-circle="line"]');
      const textTop = item.querySelector('[data-circle="text-top"]');
      const textBottom = item.querySelector('[data-circle="text-bottom"]');

      if (textTop) gsap.set(textTop, { y: "1.5em", opacity: 0 });
      if (textBottom) gsap.set(textBottom, { y: "1.5em", opacity: 0 });
      if (line) gsap.set(line, { strokeDasharray: 308, strokeDashoffset: 308 });

      const itemStartTime = index * 0.3;

      if (line) tl.to(line, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, itemStartTime);
      if (textTop) tl.to(textTop, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, itemStartTime + 0.6);
      if (textBottom) tl.to(textBottom, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, itemStartTime + 0.8);
    });
  });

  // --------------------------------------------------------
  // 2. MOBILE (Swipe Slider mit Observer & Play-on-View)
  // --------------------------------------------------------
  mm.add("(max-width: 767px)", () => {

    // A) Für jeden Kreis eine EIGENE, pausierte Animation vorbereiten
    circleItems.forEach((item) => {
      const line = item.querySelector('[data-circle="line"]');
      const textTop = item.querySelector('[data-circle="text-top"]');
      const textBottom = item.querySelector('[data-circle="text-bottom"]');

      // Startzustände setzen (unsichtbar)
      if (textTop) gsap.set(textTop, { y: "1.5em", opacity: 0 });
      if (textBottom) gsap.set(textBottom, { y: "1.5em", opacity: 0 });
      if (line) gsap.set(line, { strokeDasharray: 308, strokeDashoffset: 308 });

      // Timeline erstellen, aber auf PAUSE setzen!
      const tl = gsap.timeline({ paused: true });

      if (line) tl.to(line, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0);
      if (textTop) tl.to(textTop, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.4);
      if (textBottom) tl.to(textBottom, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.6);

      // Die fertige Animation direkt am HTML-Element abspeichern
      item.animTl = tl;
    });

    // B) Observer für Dots UND Starten der Animation
    if (dots.length > 0) {
      dots[0].classList.add('is-active');

      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.6 // Feuert, wenn ein Kreis zu 60% sichtbar ist
      };

      const dotObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const activeIndex = Array.from(circleItems).indexOf(entry.target);

            // 1. Dots aktualisieren
            dots.forEach(dot => dot.classList.remove('is-active'));
            if (dots[activeIndex]) dots[activeIndex].classList.add('is-active');

            // 2. MAGIE: Drücke bei diesem speziellen Kreis auf "Play"!
            if (entry.target.animTl) {
              entry.target.animTl.play();
            }
          }
        });
      }, observerOptions);

      circleItems.forEach(item => dotObserver.observe(item));
    }
  });

}