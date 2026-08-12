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

    window.addEventListener('mousemove', (e) => {
      xMove(e.clientX);
      yMove(e.clientY);
    });

    // Hover-Logik
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.projekte_item-wrapper');

      if (card) {
        const title = card.querySelector('.projekte_title');
        const category = card.querySelector('.projekte_tag');

        if (cursorTitle && title) cursorTitle.textContent = title.textContent;
        if (cursorCategory && category) cursorCategory.textContent = category.textContent;

        gsap.to(cursor, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.5)',
        });
      }
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.projekte_item-wrapper');

      if (card && !card.contains(e.relatedTarget)) {
        gsap.to(cursor, {
          autoAlpha: 0,
          scale: 0.5,
          duration: 0.3,
          ease: 'power2.in',
        });
      }
    });

    return () => {};
  });
}
