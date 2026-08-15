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
    let beforeWidth = 0; // total width (incl. gaps) of the groups cloned BEFORE the original
    let period = 0; // true repeat distance: group width + the gap between groups

    function clearClones() {
      clones.forEach((c) => c.remove());
      clones.length = 0;
      beforeWidth = 0;
      period = 0;
    }

    // Clones are added on BOTH sides of the original group. That way the
    // marquee works correctly whichever direction it scrolls, without
    // needing separate logic per direction.
    //
    // The repeat distance ("period") is measured from actual clone
    // positions rather than just the group's own width, because any gap
    // the track applies between groups (so seams don't look glued
    // together) is NOT part of the group's own box width.
    function buildClones() {
      clearClones();
      const instanceWidth = instance.getBoundingClientRect().width;
      const initialWidth = group.getBoundingClientRect().width;
      if (!initialWidth || !instanceWidth) return;

      const firstClone = group.cloneNode(true);
      firstClone.setAttribute('data-marquee-clone', '');
      firstClone.setAttribute('aria-hidden', 'true');
      track.appendChild(firstClone);
      clones.push(firstClone);

      period = firstClone.getBoundingClientRect().left - group.getBoundingClientRect().left;
      if (!period) period = initialWidth;

      const needed = instanceWidth + period;

      let widthAfter = period; // firstClone already accounted for
      while (widthAfter < needed) {
        const clone = group.cloneNode(true);
        clone.setAttribute('data-marquee-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
        clones.push(clone);
        widthAfter += period;
      }

      let widthBefore = 0;
      while (widthBefore < needed) {
        const clone = group.cloneNode(true);
        clone.setAttribute('data-marquee-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        track.insertBefore(clone, track.firstChild);
        clones.push(clone);
        widthBefore += period;
      }
      beforeWidth = widthBefore; // always an exact multiple of period
    }

    function startTween() {
      if (!period) return;

      if (tween) tween.kill();

      // "right" needs to start shifted left by exactly the width of the
      // groups cloned in front of the original one, so that as the track
      // moves right, that pre-cloned content has somewhere to come from.
      // Without this, the track has nothing at negative local coordinates
      // and the content just runs out to the right with nothing following.
      const startX = direction === 'right' ? -beforeWidth : 0;
      const endX = direction === 'right' ? startX + period : -period;

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
