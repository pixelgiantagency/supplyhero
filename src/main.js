// main.js

import {
  initGsapCore,
  initFooterParallax,
  initMaskTextScrollReveal,
  initImageReveals,
  initContentRevealScroll,
  initHeroSequence,
  initLineAnimations,
  initTwostepScalingNavigation,
  initScrollRefreshFixes,
} from './global.js';

import { initImageSequenceScroll } from './components/image-sequence';
import { initProcessSequence } from './components/process-sequence';
import { initCategoryHover } from './components/category-hover';
import { initMarkenversprechen } from './components/markenversprechen';
import { initAnspruch } from './components/anspruch';
import { initProjectSlider } from './components/project-slider';

function init() {
  initGsapCore();

  initFooterParallax();
  initMaskTextScrollReveal();
  initImageReveals();
  initImageSequenceScroll();
  initContentRevealScroll();
  initHeroSequence();
  initLineAnimations();
  initTwostepScalingNavigation();
  initProcessSequence();
  initCategoryHover();
  initMarkenversprechen();
  initAnspruch();
  initProjectSlider();
  initScrollRefreshFixes();
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
