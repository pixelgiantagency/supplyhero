// components/logo-marquee.js

export function initLogoMarquees() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-marquee]').forEach((instance) => {
    if (instance.dataset.marqueeInit === 'true') return;

    const track = instance.querySelector('[data-marquee-track]');
    const group = instance.querySelector('[data-marquee-group]');
    if (!track || !group) return;

    const duration = parseFloat(instance.getAttribute('data-marquee-duration')) || 30;
    const direction =
      instance.getAttribute('data-marquee-direction') === 'right' ? 'right' : 'left';

    // IMPORTANT: all of this must be declared/defined before the image-loading
    // gate below, because setup() can run SYNCHRONOUSLY (if images are already
    // cached, img.complete is true immediately) — referencing `clones`/`tween`
    // before their `let`/`const` declarations execute throws a ReferenceError
    // ("Cannot access '...' before initialization") and silently aborts init.
    let tween;
    const clones = [];
    let beforeWidth = 0; // total width of the groups cloned BEFORE the original

    function groupWidth() {
      return group.getBoundingClientRect().width;
    }

    function clearClones() {
      clones.forEach((c) => c.remove());
      clones.length = 0;
      beforeWidth = 0;
    }

    // Clones are added on BOTH sides of the original group. That way the
    // marquee works correctly whichever direction it scrolls, without
    // needing separate logic per direction.
    function buildClones() {
      clearClones();
      const gw = groupWidth();
      const instanceWidth = instance.getBoundingClientRect().width;
      if (!gw || !instanceWidth) return;

      const needed = instanceWidth + gw;

      let widthAfter = 0;
      while (widthAfter < needed) {
        const clone = group.cloneNode(true);
        clone.setAttribute('data-marquee-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
        clones.push(clone);
        widthAfter += gw;
      }

      let widthBefore = 0;
      while (widthBefore < needed) {
        const clone = group.cloneNode(true);
        clone.setAttribute('data-marquee-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        track.insertBefore(clone, track.firstChild);
        clones.push(clone);
        widthBefore += gw;
      }
      beforeWidth = widthBefore; // always an exact multiple of gw
    }

    function startTween() {
      const gw = groupWidth();
      if (!gw) return;

      if (tween) tween.kill();

      // "right" needs to start shifted left by exactly the width of the
      // groups cloned in front of the original one, so that as the track
      // moves right, that pre-cloned content has somewhere to come from.
      // Without this, the track has nothing at negative local coordinates
      // and the content just runs out to the right with nothing following.
      const startX = direction === 'right' ? -beforeWidth : 0;
      const endX = direction === 'right' ? startX + gw : -gw;

      gsap.set(track, { x: startX });

      if (reduceMotion) return; // stays static, respects user preference

      tween = gsap.to(track, {
        x: endX,
        duration,
        ease: 'none',
        repeat: -1,
      });
    }

    // Rebuilds clones + restarts the loop with the current widths.
    // Called once on init and again (debounced) on every resize.
    function recompute() {
      buildClones();
      startTween();
    }

    function setup() {
      recompute();
      instance.dataset.marqueeInit = 'true';

      let resizeTimer;
      let lastWidth = instance.getBoundingClientRect().width;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const newWidth = instance.getBoundingClientRect().width;
          if (Math.abs(newWidth - lastWidth) > 1) {
            lastWidth = newWidth;
            recompute();
          }
        }, 200);
      });
    }

    // Wait for images before measuring widths — but everything setup() needs
    // is already declared above, so it's safe whether this resolves
    // synchronously (cached images) or asynchronously (fresh load).
    const images = Array.from(group.querySelectorAll('img'));
    if (images.length === 0) {
      setup();
    } else {
      let loaded = 0;
      const onLoad = () => {
        loaded += 1;
        if (loaded === images.length) setup();
      };
      images.forEach((img) => {
        if (img.complete) onLoad();
        else {
          img.addEventListener('load', onLoad, { once: true });
          img.addEventListener('error', onLoad, { once: true });
        }
      });
    }
  });
}
