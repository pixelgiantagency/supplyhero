// main.js

import {
  initGsapCore,
  revealAfterSetup,
  initFooterParallax,
  initMaskTextScrollReveal,
  initImageReveals,
  initContentRevealScroll,
  initHeroSequence,
  initSubpageHero,
  initLineAnimations,
  initTwostepScalingNavigation,
  initScrollRefreshFixes,
} from './global.js';

import { initImageSequenceScroll } from './components/image-sequence';
import { initStepReveal } from './components/step-reveal';
import { initMarkenversprechen } from './components/markenversprechen';
import { initAnspruch } from './components/anspruch';
import { initProjectSlider } from './components/project-slider';
import { initDraggableMarquee } from './components/draggable-marquee';
import { initVideoBackground } from './components/video-background';
import { initProjectsCursor } from './components/projects-cursor';
import { initProduktGrid } from './components/product-grid';
import { initLogoMarquees } from './components/logo-marquee';
import { initProductMarquee } from './components/product-marquee';
import { initProjectNav } from './components/project-nav';

function init() {
  initGsapCore();

  initVideoBackground();
  initFooterParallax();
  initMaskTextScrollReveal();
  initImageReveals();
  initImageSequenceScroll();
  initContentRevealScroll();
  initHeroSequence();
  initSubpageHero();
  initLogoMarquees();
  initProjectsCursor();
  initProduktGrid();
  initLineAnimations();
  initTwostepScalingNavigation();
  initStepReveal();
  initMarkenversprechen();
  initAnspruch();
  initProjectSlider();
  initProjectNav();
  initProductMarquee();
  initDraggableMarquee();
  initScrollRefreshFixes();

  revealAfterSetup();
}

// Robust gegen spät ladende/async eingefügte Scripts: Falls DOMContentLoaded
// schon gefeuert hat, BEVOR dieses Script überhaupt läuft (z.B. weil das
// dynamische <script>-Tag durch Browser-Sicherheitschecks verzögert wurde),
// sofort ausführen statt auf ein Event zu warten, das nie mehr kommt.
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
