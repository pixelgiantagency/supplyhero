// components/project-slider.js

export function initProjectSlider() {
  gsap.registerPlugin(Observer, CustomEase);
  CustomEase.create("slideshow-wipe", "0.6, 0.08, 0.02, 0.99");

  function initSlideShow(el) {
    const ui = {
      el,
      slides: Array.from(el.querySelectorAll('[data-slideshow="slide"]')),
      inner: Array.from(el.querySelectorAll('[data-slideshow="parallax"]')),
      thumbs: Array.from(el.querySelectorAll('[data-slideshow="thumb"]')), // Stört nicht, wenn leer!
      progressBar: el.querySelector('[data-slideshow="progress"]'),
      headings: Array.from(el.querySelectorAll('[data-slideshow="heading"]')),
      // NEU: Selektoren für den Zähler
      currentNum: el.querySelector('[data-slideshow="current"]'),
      totalNum: el.querySelector('[data-slideshow="total"]')
    };

    // Text aufsplitten
    const splitHeadings = ui.headings.map(h => new SplitText(h, { type: 'lines', mask: 'lines', linesClass: 'line' }));

    // Erstmal ALLE Texte tief ansetzen und unsichtbar machen
    splitHeadings.forEach((split) => {
      gsap.set(split.lines, { yPercent: 110, opacity: 0 });
    });

    // Den ersten Text sofort animieren (Load-Effekt)
    if (splitHeadings[0]) {
      gsap.to(splitHeadings[0].lines, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: 'expo.out',
        delay: 0.3
      });
    }

    let current = 0;
    const length = ui.slides.length;
    let animating = false;
    let observer;

    const animationDuration = 0.9;
    const autoplayDuration = 5; // Nach 5 Sekunden wird geslidet
    let autoplayTimer;

    // Initialisierung: IDs vergeben & Start-Klassen setzen
    ui.slides.forEach((slide, index) => slide.setAttribute('data-index', index));
    if (ui.slides[current]) ui.slides[current].classList.add('is--current');

    // Thumbnails nur anfassen, wenn sie auch existieren
    if (ui.thumbs.length > 0) {
      ui.thumbs.forEach((thumb, index) => thumb.setAttribute('data-index', index));
      if (ui.thumbs[current]) ui.thumbs[current].classList.add('is--current');
    }

    // NEU: Initialisierung des Zählers
    if (ui.totalNum) ui.totalNum.textContent = length;
    if (ui.currentNum) ui.currentNum.textContent = current + 1;

    function startAutoplay() {
      if (autoplayTimer) autoplayTimer.kill();

      if (ui.progressBar) {
        // Progress Bar von 0 auf 100% skalieren
        gsap.set(ui.progressBar, { scaleX: 0, transformOrigin: "left center" });
        autoplayTimer = gsap.to(ui.progressBar, {
          scaleX: 1,
          duration: autoplayDuration,
          ease: "none",
          onComplete: () => navigate(1)
        });
      } else {
        // Unsichtbarer Timer, falls keine Progress Bar existiert
        autoplayTimer = gsap.delayedCall(autoplayDuration, () => navigate(1));
      }
    }

    function navigate(direction, targetIndex = null) {
      if (animating) return;
      animating = true;
      if (observer) observer.disable();

      if (autoplayTimer) autoplayTimer.kill();
      if (ui.progressBar) gsap.set(ui.progressBar, { scaleX: 0 });

      const previous = current;
      current = targetIndex !== null && targetIndex !== undefined
        ? targetIndex : direction === 1
          ? (current < length - 1 ? current + 1 : 0)
          : (current > 0 ? current - 1 : length - 1);

      // NEU: Aktuelle Slide-Nummer sofort beim Klick/Slide aktualisieren
      if (ui.currentNum) ui.currentNum.textContent = current + 1;

      const currentSlide = ui.slides[previous];
      const currentInner = ui.inner[previous];
      const upcomingSlide = ui.slides[current];
      const upcomingInner = ui.inner[current];

      const outgoingLines = splitHeadings[previous] ? splitHeadings[previous].lines : [];
      const incomingLines = splitHeadings[current] ? splitHeadings[current].lines : [];

      const tl = gsap.timeline({
        onStart: function () {
          if (upcomingSlide) upcomingSlide.classList.add('is--current');
          // Thumbnails nur aktualisieren, wenn vorhanden
          if (ui.thumbs.length > 0) {
            if (ui.thumbs[previous]) ui.thumbs[previous].classList.remove('is--current');
            if (ui.thumbs[current]) ui.thumbs[current].classList.add('is--current');
          }
        },
        onComplete: function () {
          if (currentSlide) currentSlide.classList.remove('is--current');
          animating = false;
          if (observer) observer.enable();
          startAutoplay();
        }
      });

      // Alter Text verschwindet
      tl.to(outgoingLines, {
        yPercent: -110, opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.in'
      }, 0)

        // Slide Transition
        .to(currentSlide, { xPercent: -direction * 100, duration: animationDuration, ease: 'slideshow-wipe' }, 0.2)
        .to(currentInner, { xPercent: direction * 50, duration: animationDuration, ease: 'slideshow-wipe' }, 0.2)
        .fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0, duration: animationDuration, ease: 'slideshow-wipe' }, 0.2)
        .fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0, duration: animationDuration, ease: 'slideshow-wipe' }, 0.2)

        // Neuer Text taucht auf
        .fromTo(incomingLines,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'expo.out' },
          "-=0.4"
        );
    }

    function onClick(event) {
      const targetIndex = parseInt(event.currentTarget.getAttribute('data-index'), 10);
      if (targetIndex === current || animating) return;
      navigate(targetIndex > current ? 1 : -1, targetIndex);
    }

    // Clickevents nur an Thumbs binden, wenn sie da sind
    if (ui.thumbs.length > 0) {
      ui.thumbs.forEach(thumb => thumb.addEventListener('click', onClick));
    }

    observer = Observer.create({
      target: el,
      type: 'wheel,touch,pointer',
      onLeft: () => { if (!animating) navigate(1); },
      onRight: () => { if (!animating) navigate(-1); },
      onWheel: (event) => {
        if (animating) return;
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          if (event.deltaX > 50) navigate(1);
          else if (event.deltaX < -50) navigate(-1);
        }
      },
      wheelSpeed: -1,
      tolerance: 10
    });

    startAutoplay();
  }

  const wrappers = document.querySelectorAll('[data-slideshow="wrap"]');
  wrappers.forEach(wrap => initSlideShow(wrap));
}