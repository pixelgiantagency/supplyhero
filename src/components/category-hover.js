// components/category-hover.js

export function initCategoryHover() {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {

    const wrap = document.querySelector('[data-follower-wrap]');
    if (!wrap) return () => { };

    const collection = wrap.querySelector('[data-follower-collection]');
    const items = wrap.querySelectorAll('[data-follower-item]');

    const follower = document.querySelector('[data-follower-cursor]');
    const followerInner = document.querySelector('[data-follower-cursor-inner]');

    if (!collection || !follower || !followerInner || items.length === 0) return () => { };

    let prevIndex = null;
    let firstEntry = true;
    const offset = 100;
    const duration = 0.5;
    const ease = 'power2.inOut';

    gsap.set(follower, { xPercent: -50, yPercent: -50 });

    const xTo = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    // NEU: Pop-In beim Betreten der gesamten Collection
    collection.addEventListener('mouseenter', () => {
      followerInner.classList.add('is-active');
    });

    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        const forward = prevIndex === null || index > prevIndex;
        prevIndex = index;

        followerInner.querySelectorAll('[data-follower-visual]').forEach(el => {
          gsap.killTweensOf(el);
          gsap.to(el, {
            yPercent: forward ? -offset : offset,
            duration,
            ease,
            overwrite: 'auto',
            onComplete: () => el.remove()
          });
        });

        const visual = item.querySelector('[data-follower-visual]');
        if (visual) {
          const clone = visual.cloneNode(true);
          clone.classList.remove('hover-img');

          clone.style.display = 'block';
          clone.style.position = 'absolute';
          clone.style.inset = '0';
          clone.style.width = '100%';
          clone.style.height = '100%';
          clone.style.objectFit = 'cover';

          followerInner.appendChild(clone);

          if (!firstEntry) {
            gsap.fromTo(clone,
              { yPercent: forward ? offset : -offset },
              { yPercent: 0, duration, ease, overwrite: 'auto' }
            );
          } else {
            firstEntry = false;
          }
        }
      });
    });

    // NEU: Pop-Out beim Verlassen der gesamten Collection
    collection.addEventListener('mouseleave', () => {
      followerInner.classList.remove('is-active');

      // Erst nach Abschluss der CSS-Transition (0.4s) aufräumen
      gsap.delayedCall(0.4, () => {
        followerInner.querySelectorAll('[data-follower-visual]').forEach(el => el.remove());
      });

      firstEntry = true;
      prevIndex = null;
    });

    return () => { };
  });
}