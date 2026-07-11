export function initImageSequenceScroll() {
      const wraps = document.querySelectorAll('[data-sequence-wrap]');
      
      wraps.forEach((wrap) => {
        if (wrap.dataset.sequenceInit === 'true') return;
        wrap.dataset.sequenceInit = 'true';

        const element = wrap.querySelector('[data-sequence-element]');
        const canvas = element && element.querySelector('[data-sequence-canvas]');
        if (!element || !canvas) return;

        const stickyContainer = wrap.querySelector('.image-sequence__sticky');
        
        const frames = parseInt(canvas.dataset.frames, 10) || 1;
        const digits = parseInt(canvas.dataset.digits, 10) || 3;
        const indexStart = parseInt(canvas.dataset.indexStart, 10) || 0;
        const desktopSrc = canvas.dataset.desktopSrc || '';
        const mobileSrc = canvas.dataset.mobileSrc || desktopSrc;
        const staticSrc = canvas.dataset.staticSrc;
        const filetype = canvas.dataset.filetype || 'webp';
        const startTrigger = wrap.dataset.scrollStart || 'top top';
        const endTrigger = wrap.dataset.scrollEnd || 'bottom bottom'; 
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        const baseUrl = isMobile ? mobileSrc : desktopSrc;
        const lastIndex = indexStart + frames - 1;

        let lastProgress = 0;
        const ctx = canvas.getContext('2d');

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

        const loaded = new Map();
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

        // WICHTIG: Kein eigener window "resize"-Listener mehr!
        // ScrollTrigger hat bereits eine eigene, intern gedrosselte Resize-Erkennung
        // und refresht sich automatisch. Ein zusätzlicher eigener Resize-Listener
        // lief parallel dazu und führte zu Race Conditions (Canvas wurde teils VOR,
        // teils NACH der ScrollTrigger-Neuberechnung resized -> Lücke unten /
        // Video hakt nach dem Resize).
        // Stattdessen hängen wir uns direkt an das 'refresh'-Event von ScrollTrigger:
        // Das feuert garantiert erst NACHDEM alle Positionen (inkl. Pin-Start/Ende)
        // neu berechnet wurden - also genau zum richtigen Zeitpunkt.
        ScrollTrigger.addEventListener('refresh', () => {
          resizeCanvas();
          if (loaded.size) render(lastProgress);
        });

        function pad(num) { return String(num).padStart(digits, '0'); }
        function getUrl(i) { return `${baseUrl}${pad(i)}.${filetype}`; }
        
        function loadFrame(i, onDone) {
          if (loaded.has(i) || i < indexStart || i > lastIndex) return;
          const img = new Image();
          img.src = getUrl(i);
          img.onload = () => { loaded.set(i, img); if (typeof onDone === 'function') onDone(); };
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
            if (diff < minDiff) { nearest = k; minDiff = diff; }
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
            staticImage.onload = () => { drawCover(staticImage); };
            return;
          }
          loadFrame(indexStart, () => { drawImageAt(indexStart); });
          return;
        }
        
        startLoading();

        // ==========================================
        // NEU: Apple-Style Card-Expand (100% Bug-Free mit CSS Variables)
        // ==========================================
        // 1. Wir verknüpfen den Clip-Path starr mit einer Variablen
        element.style.clipPath = "inset(0% var(--clip) 0% var(--clip) round var(--radius))";
        
        // 2. Wir setzen den Startwert der Variablen auf 5%
        gsap.set(element, { 
            "--clip": "5%", 
            "--radius": "1.25rem" // Hier kannst du den Radius anpassen (z.B. "2rem" oder "40px")
        });

        // 3. Beides synchron auf 0 animieren
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
        // ==========================================

        const masterTimeline = gsap.timeline();

        // Text & Button Setup für die Master Timeline
        const seqText = wrap.querySelector('[data-sequence-text]');
        const seqButton = wrap.querySelector('[data-sequence-button]');
        
        if (seqText) {
          const splitSeqText = new SplitText(seqText, { type: 'lines', mask: 'lines', linesClass: 'line' });
          const animTargets = [...splitSeqText.lines];
          if (seqButton) { animTargets.push(seqButton); }

          gsap.set(animTargets, { yPercent: 110, opacity: 0 });

          masterTimeline.fromTo(animTargets, 
              { yPercent: 110, opacity: 0 },
              { 
                yPercent: 0, 
                opacity: 1, 
                stagger: 0.08,
                ease: 'power2.out',
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