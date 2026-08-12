// components/products-hero.js

export function initProductsHero() {
  const heading = document.querySelector('[data-project-hero="heading"]');
  const line = document.querySelector('[data-project-hero="line"]');
  const text = document.querySelector('[data-project-hero="text"]');
  const image = document.querySelector('[data-project-hero="image"]');

  if (!heading && !line && !text && !image) return;

  const tl = gsap.timeline({ delay: 0.2 });

  // 1. Initialzustände setzen (unsichtbar machen)
  if (line) gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });
  if (text) gsap.set(text, { y: '2em', opacity: 0 });
  if (image) gsap.set(image, { clipPath: 'inset(0% 0% 100% 0%)' });

  // 2. Animation nacheinander abspielen
  if (line) {
    tl.to(line, { scaleX: 1, duration: 1.0, ease: 'power3.inOut' }, 0);
  }

  if (heading) {
    const splitHeading = new SplitText(heading, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
    });
    gsap.set(splitHeading.lines, { yPercent: 110 });
    tl.to(splitHeading.lines, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.4);
  }

  if (text) {
    tl.to(text, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.8);
  }

  if (image) {
    tl.to(image, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' }, 1.2);
  }
}
