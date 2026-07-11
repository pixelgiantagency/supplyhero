(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/global.js
  function initGsapCore() {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });
    smoother = ScrollSmoother.create({
      wrapper: ".page-wrapper",
      content: ".main-wrapper",
      smooth: 0.8,
      effects: true,
      smoothTouch: false
    });
  }
  function initFooterParallax() {
    let mm = gsap.matchMedia();
    mm.add("(min-width: 992px)", () => {
      document.querySelectorAll("[data-footer-parallax]").forEach((el) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "clamp(top bottom)",
            end: "clamp(top top)",
            scrub: true
          }
        });
        const inner = el.querySelector("[data-footer-parallax-inner]");
        const dark = el.querySelector("[data-footer-parallax-dark]");
        if (inner) tl.from(inner, { yPercent: -120, ease: "linear" });
        if (dark) tl.from(dark, { opacity: 0.5, ease: "linear" }, "<");
      });
      return () => {
      };
    });
  }
  function initMaskTextScrollReveal() {
    document.querySelectorAll('[data-split="heading"]:not([data-hero="heading"]):not([data-hero="text"])').forEach((heading) => {
      const type = heading.dataset.splitReveal || "lines";
      const typesToSplit = type === "lines" ? ["lines"] : type === "words" ? ["lines", "words"] : ["lines", "words", "chars"];
      SplitText.create(heading, {
        type: typesToSplit.join(", "),
        mask: "lines",
        autoSplit: true,
        linesClass: "line",
        wordsClass: "word",
        charsClass: "letter",
        onSplit: function(instance) {
          const targets = instance[type];
          const config = splitConfig[type];
          const playOnLoad = heading.hasAttribute("data-split-load");
          const animProps = {
            yPercent: 110,
            duration: config.duration,
            stagger: config.stagger,
            ease: "expo.out",
            delay: playOnLoad ? 0.2 : 0
          };
          if (!playOnLoad) {
            animProps.scrollTrigger = {
              trigger: heading,
              start: "clamp(top 80%)",
              once: true
            };
          }
          return gsap.from(targets, animProps);
        }
      });
    });
  }
  function initImageReveals() {
    const wrappers = document.querySelectorAll('[data-gsap="reveal-wrapper"]');
    if (wrappers.length === 0) return;
    wrappers.forEach((wrapper) => {
      const items = wrapper.querySelectorAll('[data-gsap="reveal"]');
      gsap.set(items, { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.to(items, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.2,
        ease: "power4.inOut",
        stagger: 0.15,
        scrollTrigger: { trigger: wrapper, start: "top 80%", once: true }
      });
    });
  }
  function initContentRevealScroll() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-reveal-group]").forEach((groupEl) => {
      const groupStaggerSec = (parseFloat(groupEl.getAttribute("data-stagger")) || 100) / 1e3;
      const groupDistance = groupEl.getAttribute("data-distance") || "2em";
      const triggerStart = groupEl.getAttribute("data-start") || "top 85%";
      const animDuration = 0.8;
      const animEase = "power4.inOut";
      if (prefersReduced) {
        gsap.set(groupEl, { clearProps: "all", y: 0, autoAlpha: 1 });
        return;
      }
      const directChildren = Array.from(groupEl.children).filter((el) => el.nodeType === 1);
      if (!directChildren.length) {
        gsap.set(groupEl, { y: groupDistance, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: groupEl,
          start: triggerStart,
          once: true,
          onEnter: () => gsap.to(groupEl, { y: 0, autoAlpha: 1, duration: animDuration, ease: animEase, onComplete: () => gsap.set(groupEl, { clearProps: "all" }) })
        });
        return;
      }
      const slots = [];
      directChildren.forEach((child) => {
        if (child.getAttribute("data-ignore") === "true") return;
        slots.push({ type: "item", el: child });
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
            tl.to(slot.el, { y: 0, autoAlpha: 1, duration: animDuration, ease: animEase, onComplete: () => gsap.set(slot.el, { clearProps: "all" }) }, slotTime);
          });
        }
      });
    });
  }
  function initHeroSequence() {
    const navbar = document.querySelector('[data-gsap="navbar"]');
    const heading = document.querySelector('[data-hero="heading"]');
    const text = document.querySelector('[data-hero="text"]');
    const button = document.querySelector('[data-hero="button"]');
    const tl = gsap.timeline({ delay: 0.1 });
    if (navbar) {
      tl.from(navbar, { yPercent: -150, opacity: 0, duration: 1.2, ease: "expo.out" });
    }
    if (heading) {
      const splitHero = new SplitText(heading, { type: "lines", mask: "lines", linesClass: "line" });
      gsap.set(splitHero.lines, { yPercent: 110 });
      tl.to(splitHero.lines, { yPercent: 0, duration: 1.1, stagger: 0.11, ease: "expo.out" }, "-=0.6");
    }
    if (text) {
      tl.from(text, { y: "2em", opacity: 0, duration: 0.8, ease: "power4.out" }, "-=0.6");
    }
    if (button) {
      tl.from(button, { y: "2em", opacity: 0, duration: 0.8, ease: "power4.out" }, "-=0.6");
    }
  }
  function initLineAnimations() {
    const lines = document.querySelectorAll('[data-gsap="line"]');
    if (lines.length === 0) return;
    lines.forEach((line) => {
      gsap.set(line, { scaleX: 0, transformOrigin: "left center" });
      gsap.to(line, {
        scaleX: 1,
        duration: 1,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: line,
          start: "top 85%",
          once: true
        }
      });
    });
  }
  function initTwostepScalingNavigation() {
    const navElement = document.querySelector("[data-twostep-nav]");
    const navStatusEl = document.querySelector("[data-nav-status]");
    if (!navElement || !navStatusEl) return;
    const setNavStatus = (status) => {
      navStatusEl.setAttribute("data-nav-status", status);
    };
    const isActive = () => navStatusEl.getAttribute("data-nav-status") === "active";
    const openNav = () => {
      setNavStatus("active");
      if (window.innerWidth <= 991) {
        document.body.style.overflow = "hidden";
        if (typeof smoother !== "undefined") {
          smoother.paused(true);
        }
      }
    };
    const closeNav = () => {
      setNavStatus("not-active");
      document.body.style.overflow = "";
      if (typeof smoother !== "undefined") {
        smoother.paused(false);
      }
    };
    const toggleNav = () => isActive() ? closeNav() : openNav();
    document.querySelectorAll('[data-nav-toggle="toggle"]').forEach((btn) => {
      btn.addEventListener("click", toggleNav);
    });
    document.querySelectorAll('[data-nav-toggle="close"]').forEach((btn) => {
      btn.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isActive()) closeNav();
    });
  }
  function initScrollRefreshFixes() {
    window.addEventListener("load", () => {
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }
    document.querySelectorAll(".faq2_question").forEach((question) => {
      question.addEventListener("click", () => {
        setTimeout(() => {
          ScrollTrigger.refresh();
        }, 450);
      });
    });
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      "list",
      (listInstances) => {
        ScrollTrigger.refresh();
      }
    ]);
  }
  var smoother, splitConfig;
  var init_global = __esm({
    "src/global.js"() {
      splitConfig = {
        lines: { duration: 1.1, stagger: 0.11 },
        words: { duration: 0.6, stagger: 0.06 },
        chars: { duration: 0.4, stagger: 0.01 }
      };
    }
  });

  // src/components/image-sequence.js
  function initImageSequenceScroll() {
    const wraps = document.querySelectorAll("[data-sequence-wrap]");
    wraps.forEach((wrap) => {
      if (wrap.dataset.sequenceInit === "true") return;
      wrap.dataset.sequenceInit = "true";
      const element = wrap.querySelector("[data-sequence-element]");
      const canvas = element && element.querySelector("[data-sequence-canvas]");
      if (!element || !canvas) return;
      const stickyContainer = wrap.querySelector(".image-sequence__sticky");
      const frames = parseInt(canvas.dataset.frames, 10) || 1;
      const digits = parseInt(canvas.dataset.digits, 10) || 3;
      const indexStart = parseInt(canvas.dataset.indexStart, 10) || 0;
      const desktopSrc = canvas.dataset.desktopSrc || "";
      const mobileSrc = canvas.dataset.mobileSrc || desktopSrc;
      const staticSrc = canvas.dataset.staticSrc;
      const filetype = canvas.dataset.filetype || "webp";
      const startTrigger = wrap.dataset.scrollStart || "top top";
      const endTrigger = wrap.dataset.scrollEnd || "bottom bottom";
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const baseUrl = isMobile ? mobileSrc : desktopSrc;
      const lastIndex = indexStart + frames - 1;
      let lastProgress = 0;
      const ctx = canvas.getContext("2d");
      function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = element.clientWidth;
        const height = element.clientHeight;
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      }
      resizeCanvas();
      const loaded = /* @__PURE__ */ new Map();
      const queue = [];
      let processingQueue = false;
      function drawCover(img) {
        if (!img) return;
        resizeCanvas();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
        const x = (canvasWidth - img.width * scale) / 2;
        const y = (canvasHeight - img.height * scale) / 2;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
      ScrollTrigger.addEventListener("refresh", () => {
        resizeCanvas();
        if (loaded.size) render(lastProgress);
      });
      function pad(num) {
        return String(num).padStart(digits, "0");
      }
      function getUrl(i) {
        return `${baseUrl}${pad(i)}.${filetype}`;
      }
      function loadFrame(i, onDone) {
        if (loaded.has(i) || i < indexStart || i > lastIndex) return;
        const img = new Image();
        img.src = getUrl(i);
        img.onload = () => {
          loaded.set(i, img);
          if (typeof onDone === "function") onDone();
        };
      }
      function processQueue() {
        if (processingQueue) return;
        const next = queue.shift();
        if (!next) return;
        processingQueue = true;
        const [a, b] = next;
        if (b - a <= 1) {
          processingQueue = false;
          processQueue();
          return;
        }
        const m = Math.floor((a + b) / 2);
        loadFrame(m, () => {
          queue.push([a, m], [m, b]);
          processingQueue = false;
          setTimeout(processQueue, 0);
        });
      }
      function startLoading() {
        loadFrame(indexStart, () => {
          drawImageAt(indexStart);
          loadFrame(lastIndex);
          queue.push([indexStart, lastIndex]);
          processQueue();
          ScrollTrigger.refresh();
        });
      }
      function findNearestLoaded(i) {
        for (let r = 1; r <= 10; r++) {
          if (loaded.has(i - r)) return i - r;
          if (loaded.has(i + r)) return i + r;
        }
        const keys = Array.from(loaded.keys());
        if (keys.length === 0) return null;
        let nearest = keys[0];
        let minDiff = Math.abs(i - nearest);
        for (const k of keys) {
          const diff = Math.abs(i - k);
          if (diff < minDiff) {
            nearest = k;
            minDiff = diff;
          }
        }
        return nearest;
      }
      function drawImageAt(i) {
        const img = loaded.get(i);
        if (!img) return;
        drawCover(img);
      }
      function render(progress) {
        const relative = progress * (frames - 1);
        const index = indexStart + Math.round(relative);
        if (loaded.has(index)) {
          drawImageAt(index);
        } else {
          const nearest = findNearestLoaded(index);
          if (nearest !== null) drawImageAt(nearest);
        }
      }
      if (reduceMotion) {
        if (staticSrc) {
          const staticImage = new Image();
          staticImage.src = staticSrc;
          staticImage.onload = () => {
            drawCover(staticImage);
          };
          return;
        }
        loadFrame(indexStart, () => {
          drawImageAt(indexStart);
        });
        return;
      }
      startLoading();
      element.style.clipPath = "inset(0% var(--clip) 0% var(--clip) round var(--radius))";
      gsap.set(element, {
        "--clip": "5%",
        "--radius": "1.25rem"
        // Hier kannst du den Radius anpassen (z.B. "2rem" oder "40px")
      });
      gsap.to(element, {
        "--clip": "0%",
        "--radius": "0px",
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top 50%",
          end: "top top",
          scrub: true
        }
      });
      const masterTimeline = gsap.timeline();
      const seqText = wrap.querySelector("[data-sequence-text]");
      const seqButton = wrap.querySelector("[data-sequence-button]");
      if (seqText) {
        const splitSeqText = new SplitText(seqText, { type: "lines", mask: "lines", linesClass: "line" });
        const animTargets = [...splitSeqText.lines];
        if (seqButton) {
          animTargets.push(seqButton);
        }
        gsap.set(animTargets, { yPercent: 110, opacity: 0 });
        masterTimeline.fromTo(
          animTargets,
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            stagger: 0.08,
            ease: "power2.out",
            duration: 0.2
          },
          0.3
        );
      }
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      const st = ScrollTrigger.create({
        trigger: wrap,
        start: startTrigger,
        end: endTrigger,
        scrub: true,
        pin: isTouch ? false : stickyContainer,
        pinSpacing: false,
        invalidateOnRefresh: true,
        animation: masterTimeline,
        onUpdate: (self) => {
          lastProgress = self.progress;
          render(self.progress);
        }
      });
      lastProgress = st.progress || 0;
      render(lastProgress);
    });
  }
  var init_image_sequence = __esm({
    "src/components/image-sequence.js"() {
    }
  });

  // src/components/process-sequence.js
  function initProcessSequence() {
    const processSteps = document.querySelectorAll('[data-process="step"]');
    if (processSteps.length === 0) return;
    processSteps.forEach((step) => {
      const line = step.querySelector('[data-process="line"]');
      const number = step.querySelector('[data-process="number"]');
      const label = step.querySelector('[data-process="label"]');
      const text = step.querySelector('[data-process="text"]');
      const image = step.querySelector('[data-process="image"]');
      if (line) gsap.set(line, { scaleX: 0, transformOrigin: "left center" });
      if (number) gsap.set(number, { y: "1.5em", opacity: 0 });
      if (label) gsap.set(label, { y: "1.5em", opacity: 0 });
      if (text) gsap.set(text, { y: "1.5em", opacity: 0 });
      if (image) gsap.set(image, { clipPath: "inset(0% 0% 100% 0%)" });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: step,
          start: "top 75%",
          // Startet, wenn der Block zu 25% im Bild ist
          once: true
        }
      });
      if (line) tl.to(line, { scaleX: 1, duration: 1, ease: "power3.inOut" }, 0);
      if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0.2);
      if (label) tl.to(label, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0.4);
      if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0.7);
      if (image) tl.to(image, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut" }, 0.9);
    });
  }
  var init_process_sequence = __esm({
    "src/components/process-sequence.js"() {
    }
  });

  // src/components/category-hover.js
  function initCategoryHover() {
    let mm = gsap.matchMedia();
    mm.add("(min-width: 992px)", () => {
      const wrap = document.querySelector("[data-follower-wrap]");
      if (!wrap) return () => {
      };
      const collection = wrap.querySelector("[data-follower-collection]");
      const items = wrap.querySelectorAll("[data-follower-item]");
      const follower = document.querySelector("[data-follower-cursor]");
      const followerInner = document.querySelector("[data-follower-cursor-inner]");
      if (!collection || !follower || !followerInner || items.length === 0) return () => {
      };
      let prevIndex = null;
      let firstEntry = true;
      const offset = 100;
      const duration = 0.5;
      const ease = "power2.inOut";
      gsap.set(follower, { xPercent: -50, yPercent: -50 });
      const xTo = gsap.quickTo(follower, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(follower, "y", { duration: 0.6, ease: "power3" });
      window.addEventListener("mousemove", (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
      });
      collection.addEventListener("mouseenter", () => {
        followerInner.classList.add("is-active");
      });
      items.forEach((item, index) => {
        item.addEventListener("mouseenter", () => {
          const forward = prevIndex === null || index > prevIndex;
          prevIndex = index;
          followerInner.querySelectorAll("[data-follower-visual]").forEach((el) => {
            gsap.killTweensOf(el);
            gsap.to(el, {
              yPercent: forward ? -offset : offset,
              duration,
              ease,
              overwrite: "auto",
              onComplete: () => el.remove()
            });
          });
          const visual = item.querySelector("[data-follower-visual]");
          if (visual) {
            const clone = visual.cloneNode(true);
            clone.classList.remove("hover-img");
            clone.style.display = "block";
            clone.style.position = "absolute";
            clone.style.inset = "0";
            clone.style.width = "100%";
            clone.style.height = "100%";
            clone.style.objectFit = "cover";
            followerInner.appendChild(clone);
            if (!firstEntry) {
              gsap.fromTo(
                clone,
                { yPercent: forward ? offset : -offset },
                { yPercent: 0, duration, ease, overwrite: "auto" }
              );
            } else {
              firstEntry = false;
            }
          }
        });
      });
      collection.addEventListener("mouseleave", () => {
        followerInner.classList.remove("is-active");
        gsap.delayedCall(0.4, () => {
          followerInner.querySelectorAll("[data-follower-visual]").forEach((el) => el.remove());
        });
        firstEntry = true;
        prevIndex = null;
      });
      return () => {
      };
    });
  }
  var init_category_hover = __esm({
    "src/components/category-hover.js"() {
    }
  });

  // src/components/markenversprechen.js
  function initMarkenversprechen() {
    let mm = gsap.matchMedia();
    mm.add("(min-width: 992px)", () => {
      const promiseWrapper = document.querySelector('[data-promise="wrapper"]');
      const promiseSteps = document.querySelectorAll('[data-promise="step"]');
      if (!promiseWrapper || promiseSteps.length === 0) return;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: promiseWrapper,
          start: "top 75%",
          once: true
        }
      });
      promiseSteps.forEach((step, index) => {
        const lines = step.querySelectorAll('[data-promise="line"]');
        const number = step.querySelector('[data-promise="number"]');
        const text = step.querySelector('[data-promise="text"]');
        const image = step.querySelector('[data-promise="image"]');
        if (lines.length) gsap.set(lines, { scaleY: 0, transformOrigin: "top center" });
        if (number) gsap.set(number, { y: "1.5em", opacity: 0 });
        if (text) gsap.set(text, { y: "1.5em", opacity: 0 });
        if (image) gsap.set(image, { clipPath: "inset(0% 0% 100% 0%)" });
        let stepStartTime = index * 0.15;
        if (lines.length) tl.to(lines, { scaleY: 1, duration: 0.8, ease: "power3.inOut" }, stepStartTime);
        if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, stepStartTime + 0.1);
        if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, stepStartTime + 0.2);
        if (image) tl.to(image, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power3.inOut" }, stepStartTime + 0.3);
      });
    });
    mm.add("(min-width: 768px) and (max-width: 991px)", () => {
      const promiseSteps = document.querySelectorAll('[data-promise="step"]');
      promiseSteps.forEach((step, index) => {
        const lines = step.querySelectorAll('[data-promise="line"]');
        const number = step.querySelector('[data-promise="number"]');
        const text = step.querySelector('[data-promise="text"]');
        const image = step.querySelector('[data-promise="image"]');
        if (lines.length) gsap.set(lines, { scaleY: 0, transformOrigin: "top center" });
        if (number) gsap.set(number, { y: "1.5em", opacity: 0 });
        if (text) gsap.set(text, { y: "1.5em", opacity: 0 });
        if (image) gsap.set(image, { clipPath: "inset(0% 0% 100% 0%)" });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: step,
            start: "top 80%",
            once: true
          }
        });
        let stepStartTime = index % 2 * 0.2;
        if (lines.length) tl.to(lines, { scaleY: 1, duration: 1, ease: "power3.inOut" }, stepStartTime);
        if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, stepStartTime + 0.2);
        if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, stepStartTime + 0.4);
        if (image) tl.to(image, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut" }, stepStartTime + 0.6);
      });
    });
    mm.add("(max-width: 767px)", () => {
      const promiseSteps = document.querySelectorAll('[data-promise="step"]');
      promiseSteps.forEach((step) => {
        const lines = step.querySelectorAll('[data-promise="line"]');
        const number = step.querySelector('[data-promise="number"]');
        const text = step.querySelector('[data-promise="text"]');
        const image = step.querySelector('[data-promise="image"]');
        if (lines.length) gsap.set(lines, { scaleY: 0, transformOrigin: "top center" });
        if (number) gsap.set(number, { y: "1.5em", opacity: 0 });
        if (text) gsap.set(text, { y: "1.5em", opacity: 0 });
        if (image) gsap.set(image, { clipPath: "inset(0% 0% 100% 0%)" });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: step,
            start: "top 80%",
            once: true
          }
        });
        if (lines.length) tl.to(lines, { scaleY: 1, duration: 0.7, ease: "power3.inOut" }, 0);
        if (number) tl.to(number, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.1);
        if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.2);
        if (image) tl.to(image, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut" }, 0.4);
      });
    });
  }
  var init_markenversprechen = __esm({
    "src/components/markenversprechen.js"() {
    }
  });

  // src/components/anspruch.js
  function initAnspruch() {
    const circleWrapper = document.querySelector('[data-circle="wrapper"]');
    const circleItems = document.querySelectorAll('[data-circle="item"]');
    const dots = document.querySelectorAll(".anspruch_dot");
    if (!circleWrapper || circleItems.length === 0) return;
    let mm = gsap.matchMedia();
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
        let itemStartTime = index * 0.3;
        if (line) tl.to(line, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, itemStartTime);
        if (textTop) tl.to(textTop, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, itemStartTime + 0.6);
        if (textBottom) tl.to(textBottom, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, itemStartTime + 0.8);
      });
    });
    mm.add("(max-width: 767px)", () => {
      circleItems.forEach((item) => {
        const line = item.querySelector('[data-circle="line"]');
        const textTop = item.querySelector('[data-circle="text-top"]');
        const textBottom = item.querySelector('[data-circle="text-bottom"]');
        if (textTop) gsap.set(textTop, { y: "1.5em", opacity: 0 });
        if (textBottom) gsap.set(textBottom, { y: "1.5em", opacity: 0 });
        if (line) gsap.set(line, { strokeDasharray: 308, strokeDashoffset: 308 });
        const tl = gsap.timeline({ paused: true });
        if (line) tl.to(line, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0);
        if (textTop) tl.to(textTop, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.4);
        if (textBottom) tl.to(textBottom, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.6);
        item.animTl = tl;
      });
      if (dots.length > 0) {
        dots[0].classList.add("is-active");
        const observerOptions = {
          root: null,
          rootMargin: "0px",
          threshold: 0.6
          // Feuert, wenn ein Kreis zu 60% sichtbar ist
        };
        const dotObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const activeIndex = Array.from(circleItems).indexOf(entry.target);
              dots.forEach((dot) => dot.classList.remove("is-active"));
              if (dots[activeIndex]) dots[activeIndex].classList.add("is-active");
              if (entry.target.animTl) {
                entry.target.animTl.play();
              }
            }
          });
        }, observerOptions);
        circleItems.forEach((item) => dotObserver.observe(item));
      }
    });
  }
  var init_anspruch = __esm({
    "src/components/anspruch.js"() {
    }
  });

  // src/components/project-slider.js
  function initProjectSlider() {
    gsap.registerPlugin(Observer, CustomEase);
    CustomEase.create("slideshow-wipe", "0.6, 0.08, 0.02, 0.99");
    function initSlideShow(el) {
      const ui = {
        el,
        slides: Array.from(el.querySelectorAll('[data-slideshow="slide"]')),
        inner: Array.from(el.querySelectorAll('[data-slideshow="parallax"]')),
        thumbs: Array.from(el.querySelectorAll('[data-slideshow="thumb"]')),
        // Stört nicht, wenn leer!
        progressBar: el.querySelector('[data-slideshow="progress"]'),
        headings: Array.from(el.querySelectorAll('[data-slideshow="heading"]')),
        // NEU: Selektoren für den Zähler
        currentNum: el.querySelector('[data-slideshow="current"]'),
        totalNum: el.querySelector('[data-slideshow="total"]')
      };
      const splitHeadings = ui.headings.map((h) => new SplitText(h, { type: "lines", mask: "lines", linesClass: "line" }));
      splitHeadings.forEach((split) => {
        gsap.set(split.lines, { yPercent: 110, opacity: 0 });
      });
      if (splitHeadings[0]) {
        gsap.to(splitHeadings[0].lines, {
          yPercent: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "expo.out",
          delay: 0.3
        });
      }
      let current = 0;
      const length = ui.slides.length;
      let animating = false;
      let observer;
      const animationDuration = 0.9;
      const autoplayDuration = 5;
      let autoplayTimer;
      ui.slides.forEach((slide, index) => slide.setAttribute("data-index", index));
      if (ui.slides[current]) ui.slides[current].classList.add("is--current");
      if (ui.thumbs.length > 0) {
        ui.thumbs.forEach((thumb, index) => thumb.setAttribute("data-index", index));
        if (ui.thumbs[current]) ui.thumbs[current].classList.add("is--current");
      }
      if (ui.totalNum) ui.totalNum.textContent = length;
      if (ui.currentNum) ui.currentNum.textContent = current + 1;
      function startAutoplay() {
        if (autoplayTimer) autoplayTimer.kill();
        if (ui.progressBar) {
          gsap.set(ui.progressBar, { scaleX: 0, transformOrigin: "left center" });
          autoplayTimer = gsap.to(ui.progressBar, {
            scaleX: 1,
            duration: autoplayDuration,
            ease: "none",
            onComplete: () => navigate(1)
          });
        } else {
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
        current = targetIndex !== null && targetIndex !== void 0 ? targetIndex : direction === 1 ? current < length - 1 ? current + 1 : 0 : current > 0 ? current - 1 : length - 1;
        if (ui.currentNum) ui.currentNum.textContent = current + 1;
        const currentSlide = ui.slides[previous];
        const currentInner = ui.inner[previous];
        const upcomingSlide = ui.slides[current];
        const upcomingInner = ui.inner[current];
        const outgoingLines = splitHeadings[previous] ? splitHeadings[previous].lines : [];
        const incomingLines = splitHeadings[current] ? splitHeadings[current].lines : [];
        const tl = gsap.timeline({
          onStart: function() {
            if (upcomingSlide) upcomingSlide.classList.add("is--current");
            if (ui.thumbs.length > 0) {
              if (ui.thumbs[previous]) ui.thumbs[previous].classList.remove("is--current");
              if (ui.thumbs[current]) ui.thumbs[current].classList.add("is--current");
            }
          },
          onComplete: function() {
            if (currentSlide) currentSlide.classList.remove("is--current");
            animating = false;
            if (observer) observer.enable();
            startAutoplay();
          }
        });
        tl.to(outgoingLines, {
          yPercent: -110,
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: "power2.in"
        }, 0).to(currentSlide, { xPercent: -direction * 100, duration: animationDuration, ease: "slideshow-wipe" }, 0.2).to(currentInner, { xPercent: direction * 50, duration: animationDuration, ease: "slideshow-wipe" }, 0.2).fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0, duration: animationDuration, ease: "slideshow-wipe" }, 0.2).fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0, duration: animationDuration, ease: "slideshow-wipe" }, 0.2).fromTo(
          incomingLines,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "expo.out" },
          "-=0.4"
        );
      }
      function onClick(event) {
        const targetIndex = parseInt(event.currentTarget.getAttribute("data-index"), 10);
        if (targetIndex === current || animating) return;
        navigate(targetIndex > current ? 1 : -1, targetIndex);
      }
      if (ui.thumbs.length > 0) {
        ui.thumbs.forEach((thumb) => thumb.addEventListener("click", onClick));
      }
      observer = Observer.create({
        target: el,
        type: "wheel,touch,pointer",
        onLeft: () => {
          if (!animating) navigate(1);
        },
        onRight: () => {
          if (!animating) navigate(-1);
        },
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
    let wrappers = document.querySelectorAll('[data-slideshow="wrap"]');
    wrappers.forEach((wrap) => initSlideShow(wrap));
  }
  var init_project_slider = __esm({
    "src/components/project-slider.js"() {
    }
  });

  // src/main.js
  var require_main = __commonJS({
    "src/main.js"() {
      init_global();
      init_image_sequence();
      init_process_sequence();
      init_category_hover();
      init_markenversprechen();
      init_anspruch();
      init_project_slider();
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
        console.log("BOOM! Mein Code kommt direkt aus VS Code in Webflow!");
      }
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    }
  });
  require_main();
})();
