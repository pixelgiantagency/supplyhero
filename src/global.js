let smoother;

export function initGsapCore() {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  smoother = ScrollSmoother.create({
    wrapper: '.page-wrapper',
    content: '.main-wrapper',
    smooth: 0.8,
    effects: true,
    smoothTouch: false,
  });
}

export function initFooterParallax() {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 992px)', () => {
    document.querySelectorAll('[data-footer-parallax]').forEach((el) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'clamp(top bottom)',
          end: 'clamp(top top)',
          scrub: true,
        },
      });

      const inner = el.querySelector('[data-footer-parallax-inner]');
      const dark = el.querySelector('[data-footer-parallax-dark]');

      if (inner) tl.from(inner, { yPercent: -120, ease: 'linear' });
      if (dark) tl.from(dark, { opacity: 0.5, ease: 'linear' }, '<');
    });

    return () => {};
  });
}

const splitConfig = {
  lines: { duration: 1.1, stagger: 0.11 },
  words: { duration: 0.6, stagger: 0.06 },
  chars: { duration: 0.4, stagger: 0.01 },
};

export function initMaskTextScrollReveal() {
  document
    .querySelectorAll('[data-split="heading"]:not([data-hero="heading"]):not([data-hero="text"])')
    .forEach((heading) => {
      const type = heading.dataset.splitReveal || 'lines';
      const typesToSplit =
        type === 'lines'
          ? ['lines']
          : type === 'words'
            ? ['lines', 'words']
            : ['lines', 'words', 'chars'];

      SplitText.create(heading, {
        type: typesToSplit.join(', '),
        mask: 'lines',
        autoSplit: true,
        linesClass: 'line',
        wordsClass: 'word',
        charsClass: 'letter',
        onSplit: function (instance) {
          const targets = instance[type];
          const config = splitConfig[type];
          const playOnLoad = heading.hasAttribute('data-split-load');

          const animProps = {
            yPercent: 110,
            duration: config.duration,
            stagger: config.stagger,
            ease: 'expo.out',
            delay: playOnLoad ? 0.2 : 0,
          };

          if (!playOnLoad) {
            animProps.scrollTrigger = {
              trigger: heading,
              start: 'clamp(top 80%)',
              once: true,
            };
          }
          return gsap.from(targets, animProps);
        },
      });
    });
}

export function initImageReveals() {
  const wrappers = document.querySelectorAll('[data-gsap="reveal-wrapper"]');
  if (wrappers.length === 0) return;

  wrappers.forEach((wrapper) => {
    const items = wrapper.querySelectorAll('[data-gsap="reveal"]');
    gsap.set(items, { clipPath: 'inset(0% 0% 100% 0%)' });

    gsap.to(items, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.2,
      ease: 'power4.inOut',
      stagger: 0.15,
      scrollTrigger: { trigger: wrapper, start: 'top 80%', once: true },
    });
  });
}

export function initContentRevealScroll() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-reveal-group]').forEach((groupEl) => {
    const groupStaggerSec = (parseFloat(groupEl.getAttribute('data-stagger')) || 100) / 1000;
    const groupDistance = groupEl.getAttribute('data-distance') || '2em';
    const triggerStart = groupEl.getAttribute('data-start') || 'top 85%';
    const animDuration = 0.8;
    const animEase = 'power4.inOut';

    if (prefersReduced) {
      gsap.set(groupEl, { clearProps: 'all', y: 0, autoAlpha: 1 });
      return;
    }

    const directChildren = Array.from(groupEl.children).filter((el) => el.nodeType === 1);
    if (!directChildren.length) {
      gsap.set(groupEl, { y: groupDistance, autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: groupEl,
        start: triggerStart,
        once: true,
        onEnter: () =>
          gsap.to(groupEl, {
            y: 0,
            autoAlpha: 1,
            duration: animDuration,
            ease: animEase,
            onComplete: () => gsap.set(groupEl, { clearProps: 'all' }),
          }),
      });
      return;
    }

    const slots = [];
    directChildren.forEach((child) => {
      if (child.getAttribute('data-ignore') === 'true') return;
      slots.push({ type: 'item', el: child });
    });

    slots.forEach((slot) => {
      gsap.set(slot.el, { y: groupDistance, autoAlpha: 0 });
    });

    ScrollTrigger.create({
      trigger: groupEl,
      start: triggerStart,
      once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        slots.forEach((slot, slotIndex) => {
          const slotTime = slotIndex * groupStaggerSec;
          tl.to(
            slot.el,
            {
              y: 0,
              autoAlpha: 1,
              duration: animDuration,
              ease: animEase,
              onComplete: () => gsap.set(slot.el, { clearProps: 'all' }),
            },
            slotTime
          );
        });
      },
    });
  });
}

export function initHeroSequence() {
  const navbar = document.querySelector('[data-gsap="navbar"]');
  const heading = document.querySelector('[data-hero="heading"]');
  const text = document.querySelector('[data-hero="text"]');
  const button = document.querySelector('[data-hero="button"]');

  const tl = gsap.timeline({ delay: 0.1 });

  if (navbar) {
    tl.from(navbar, { yPercent: -150, opacity: 0, duration: 1.2, ease: 'expo.out' });
  }

  if (heading) {
    const splitHero = new SplitText(heading, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.set(splitHero.lines, { yPercent: 110 });
    tl.to(
      splitHero.lines,
      { yPercent: 0, duration: 1.1, stagger: 0.11, ease: 'expo.out' },
      '-=0.6'
    );
  }

  if (text) {
    tl.from(text, { y: '2em', opacity: 0, duration: 0.8, ease: 'power4.out' }, '-=0.6');
  }

  if (button) {
    tl.from(button, { y: '2em', opacity: 0, duration: 0.8, ease: 'power4.out' }, '-=0.6');
  }
}

export function initLineAnimations() {
  const lines = document.querySelectorAll('[data-gsap="line"]');
  if (lines.length === 0) return;

  lines.forEach((line) => {
    gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });

    gsap.to(line, {
      scaleX: 1,
      duration: 1.0,
      ease: 'power3.inOut',
      scrollTrigger: {
        trigger: line,
        start: 'top 85%',
        once: true,
      },
    });
  });
}

export function initTwostepScalingNavigation() {
  const navElement = document.querySelector('[data-twostep-nav]');
  const navStatusEl = document.querySelector('[data-nav-status]');

  if (!navElement || !navStatusEl) return;

  const setNavStatus = (status) => {
    navStatusEl.setAttribute('data-nav-status', status);
  };

  const isActive = () => navStatusEl.getAttribute('data-nav-status') === 'active';

  const openNav = () => {
    setNavStatus('active');
    if (window.innerWidth <= 991) {
      document.body.style.overflow = 'hidden';
      if (typeof smoother !== 'undefined') {
        smoother.paused(true);
      }
    }
  };

  const closeNav = () => {
    setNavStatus('not-active');
    document.body.style.overflow = '';
    if (typeof smoother !== 'undefined') {
      smoother.paused(false);
    }
  };

  const toggleNav = () => (isActive() ? closeNav() : openNav());

  document.querySelectorAll('[data-nav-toggle="toggle"]').forEach((btn) => {
    btn.addEventListener('click', toggleNav);
  });

  document.querySelectorAll('[data-nav-toggle="close"]').forEach((btn) => {
    btn.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isActive()) closeNav();
  });
}

export function initScrollRefreshFixes() {
  window.addEventListener('load', () => {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }

  document.querySelectorAll('.faq2_question').forEach((question) => {
    question.addEventListener('click', () => {
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 450);
    });
  });

  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    'list',
    () => {
      ScrollTrigger.refresh();
    },
  ]);
}
