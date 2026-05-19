/**
 * PEPTIVO — main.js  v6
 * ─────────────────────────────────────────────────────────
 * Scroll: 100% native browser — no Lenis, no hijacking.
 *         scroll-behavior:smooth on html handles anchor links.
 *
 * GSAP: hero intro timeline + magnetic buttons only.
 * Reveals: IntersectionObserver + Animate.css.
 * Counters: IntersectionObserver + GSAP number tween.
 * ─────────────────────────────────────────────────────────
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  initCursor();         // ① custom cursor
  initBtnArrow();       // ② CTA arrow animation
  initHeader();
  initHamburger();
  initHeroVideo();      // ③ video safety
  initHeroGSAP();       // ④ hero fade-in
  initTypewriter();     // ⑤ typewriter headline
  initRevealObserver(); // ⑥ scroll reveals
  initCounters();       // ⑦ stat counters
  initHeroCardFloat();  // ⑧ card idle animation
  initMagnetic();       // ⑨ button hover
  initResults();        // ⑩ before/after slider + calculator
  initSpecs();          // ⑪ specifications orbit section
  initHIW();            // ⑫ how it works — horizontal pin + scrub
  // ⑬ doctors section runs via its own IIFE + DOMContentLoaded (no initDoctors fn)
  initCare();           // ⑭ online care — per-element slide + float
  initBeforeAfterStack(); // ⑮ before/after stacking card carousel
  initBenefits();  // ⑯ benefits flip cards
  initFAQ();

  initDnaBg();

  initSpecsMortarAnim()  // ⑪b specs mortar & pestle pharmacy animation


  initBnfAtom()

});


/* ══════════════════════════════════════════════════════════
   1. HEADER scroll border — passive native scroll listener
══════════════════════════════════════════════════════════ */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


/* ══════════════════════════════════════════════════════════
   3. HAMBURGER
══════════════════════════════════════════════════════════ */
function initHamburger() {
  const btn     = document.getElementById('hamburger');
  const drawer  = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const closeBtn = document.getElementById('drawerClose');
  if (!btn || !drawer) return;

  const close = () => {
    btn.classList.remove('open');
    drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const open = () => {
    btn.classList.add('open');
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  btn.addEventListener('click', () => {
    btn.classList.contains('open') ? close() : open();
  });

  // Close on overlay click
  if (overlay) overlay.addEventListener('click', close);

  // Close on in-drawer × button
  if (closeBtn) closeBtn.addEventListener('click', close);

  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}


/* ══════════════════════════════════════════════════════════
   4. HERO VIDEO — safety play + performance
   ──────────────────────────────────────────────────────────
   • Browsers may block autoplay if data-saver is on
   • We catch the rejected promise silently
   • On low-bandwidth / reduced-data: hide video, show poster
   • Video preload="none" — only starts loading on scroll-near
══════════════════════════════════════════════════════════ */
function initHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  // Respect data-saver preference
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
    video.remove();  // use poster image only
    return;
  }

  // autoplay may be blocked — catch silently, poster shows instead
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked — poster image remains visible, no error thrown
    });
  }
}


/* ══════════════════════════════════════════════════════════
   5. HERO GSAP INTRO
   ──────────────────────────────────────────────────────────
   Hero headline (#tw-text) is handled by typewriter —
   its container (.hero-headline) still fades in via hero-anim.
   We delay slightly so headline appears before typewriter starts.
══════════════════════════════════════════════════════════ */
function initHeroGSAP() {
  const leftItems  = document.querySelectorAll('.pep-hero__content .hero-anim');
  const rightBlock = document.querySelector('.hero-anim--right');
  if (!leftItems.length) return;

  gsap.set(leftItems,  { opacity: 0, y: 22 });
  if (rightBlock) gsap.set(rightBlock, { opacity: 0, x: 36 });

  const tl = gsap.timeline({ delay: 0.1 });

  tl.to(leftItems, {
    opacity: 1, y: 0,
    duration: 0.65,
    ease: 'power3.out',
    stagger: { each: 0.09, ease: 'none' },
    clearProps: 'transform',
  });

  if (rightBlock) {
    tl.to(rightBlock, {
      opacity: 1, x: 0,
      duration: 0.7,
      ease: 'power3.out',
      clearProps: 'transform',
    }, '-=0.45');
  }
}


/* ══════════════════════════════════════════════════════════
   6. TYPEWRITER — hero headline
   ──────────────────────────────────────────────────────────
   Sequence: type full phrase → pause → delete → pause → repeat
   Renders HTML (supports <br/> and <em> tags in the phrase).

   Implementation notes:
   • Characters are typed into #tw-text via innerHTML.
   • We type the raw HTML string char-by-char, but only advance
     past complete tags — so <em> and <br/> render correctly
     without showing partial tag strings to the user.
   • .tw-cursor blinks via pure CSS (no JS timers for the blink).
   • .is-typing class pauses cursor blink while animating.
   • No layout shift: min-height on .hero-headline reserves space.
   • Delay starts after GSAP hero intro (≈ 400ms into load).
══════════════════════════════════════════════════════════ */
function initTypewriter() {
  const target = document.getElementById('tw-text');
  const cursor = document.querySelector('.tw-cursor');
  if (!target || !cursor) return;

  // The full phrase as HTML — <em> renders in blue, <br/> breaks lines
  const PHRASE = 'Ready to get<br/><em>serious</em> about<br/>weight loss?';

  // Typing speed settings (ms)
  const SPEED_TYPE   = 42;   // ms per character forward
  const SPEED_DELETE = 22;   // ms per character backward
  const PAUSE_AFTER  = 2200; // ms to pause at full phrase
  const PAUSE_BEFORE = 600;  // ms to pause before re-typing

  // We type the raw HTML string and let innerHTML handle rendering.
  // To avoid flashing partial tags like "<e" or "<br", we skip forward
  // past entire HTML tags when we encounter '<'.
  let pos = 0;   // current position in PHRASE string
  let dir = 1;   // 1 = typing, -1 = deleting
  let timer;

  // Reduce speed on prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Skip animation — just show the full phrase
    target.innerHTML = PHRASE;
    cursor.style.display = 'none';
    return;
  }

  // Start after hero GSAP intro completes (400ms delay)
  setTimeout(tick, 400);

  function tick() {
    cursor.classList.add('is-typing');

    if (dir === 1) {
      // ── TYPING forward ──────────────────────────
      if (pos < PHRASE.length) {
        // If we're at a '<', jump to end of the tag so HTML renders whole
        if (PHRASE[pos] === '<') {
          const closeIdx = PHRASE.indexOf('>', pos);
          if (closeIdx !== -1) pos = closeIdx + 1;
          else pos++; // malformed, skip
        } else {
          pos++;
        }
        target.innerHTML = PHRASE.slice(0, pos);
        timer = setTimeout(tick, SPEED_TYPE);
      } else {
        // Finished typing — pause, then switch to deleting
        cursor.classList.remove('is-typing');
        timer = setTimeout(() => { dir = -1; tick(); }, PAUSE_AFTER);
      }
    } else {
      // ── DELETING backward ───────────────────────
      if (pos > 0) {
        pos--;
        // If we land inside a tag (after '>'), jump back past whole tag
        const slice = PHRASE.slice(0, pos);
        const lastOpen  = slice.lastIndexOf('<');
        const lastClose = slice.lastIndexOf('>');
        if (lastOpen > lastClose) {
          // We're inside a tag — snap back to just before the '<'
          pos = lastOpen;
        }
        target.innerHTML = PHRASE.slice(0, pos);
        timer = setTimeout(tick, SPEED_DELETE);
      } else {
        // Fully deleted — pause, then switch to typing
        cursor.classList.remove('is-typing');
        timer = setTimeout(() => { dir = 1; tick(); }, PAUSE_BEFORE);
      }
    }
  }
}


/* ══════════════════════════════════════════════════════════
   7. SCROLL REVEALS — IntersectionObserver + Animate.css
══════════════════════════════════════════════════════════ */
function initRevealObserver() {
  const els = document.querySelectorAll('.reveal-up');
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = getComputedStyle(el).getPropertyValue('--rd').trim() || '0ms';
        requestAnimationFrame(() => {
          el.style.setProperty('--animate-delay', delay);
          el.style.setProperty('--animate-duration', '0.6s');
          el.classList.add('animate__animated', 'animate__fadeInUp', 'animated');
        });
        io.unobserve(el);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
  );

  els.forEach(el => io.observe(el));
}


/* ══════════════════════════════════════════════════════════
   8. COUNTERS
══════════════════════════════════════════════════════════ */
function initCounters() {
  const items = document.querySelectorAll('[data-count]');
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el      = entry.target;
        const target  = parseInt(el.getAttribute('data-count'), 10);
        const display = el.querySelector('.count-val');
        if (isNaN(target) || !display) return;
        const obj = { n: 0 };
        gsap.to(obj, {
          n: target,
          duration: 1.5,
          ease: 'power3.out',
          onUpdate() { display.textContent = Math.round(obj.n); },
        });
        io.unobserve(el);
      });
    },
    { threshold: 0.25 }
  );

  items.forEach(el => io.observe(el));
}


/* ══════════════════════════════════════════════════════════
   9. HERO CARD FLOAT — CSS keyframe, no RAF cost
══════════════════════════════════════════════════════════ */
function initHeroCardFloat() {
  const card = document.getElementById('heroCard');
  if (!card) return;

  (function injectKeyframe() {
    const s = document.createElement('style');
    s.textContent = `
      @keyframes heroFloat {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-10px); }
      }
      @media (prefers-reduced-motion: reduce) {
        #heroCard { animation: none !important; }
      }
    `;
    document.head.appendChild(s);
  })();

  setTimeout(() => {
    card.style.animation = 'heroFloat 3.8s ease-in-out infinite';
  }, 900);
}


/* ══════════════════════════════════════════════════════════
   10. MAGNETIC BUTTONS
══════════════════════════════════════════════════════════ */
function initMagnetic() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.js-magnetic').forEach(btn => {
    let rect = null;
    const strength = 0.22;

    btn.addEventListener('mouseenter', () => { rect = btn.getBoundingClientRect(); });

    btn.addEventListener('mousemove', e => {
      if (!rect) return;
      const dx = (e.clientX - (rect.left + rect.width  * .5)) * strength;
      const dy = (e.clientY - (rect.top  + rect.height * .5)) * strength;
      gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    });

    btn.addEventListener('mouseleave', () => {
      rect = null;
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    });
  });
}


/* ══════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ──────────────────────────────────────────────────────────
   Strategy:
   • Two variables track real mouse (mx/my) and lerped pos (cx/cy).
   • rAF loop lerps cx/cy toward mx/my each frame — this gives the
     smooth follow without any library.
   • Lerp factor 0.18 = snappy (feels immediate, not laggy).
   • Direct style.transform write — no GSAP overhead per frame.
   • CSS transitions handle size/opacity changes (is-hover, is-click).
   • Cursor is centred on pointer via -50% translate baked into
     the rAF write: translate(cx - half, cy - half).
══════════════════════════════════════════════════════════ */
function initCursor() {
  // Only activate on fine-pointer (mouse) devices
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const el = document.getElementById('pepCursor');
  if (!el) return;

  const HALF    = 11;        // half of 22px base size
  const LERP    = 0.18;      // follow speed — higher = snappier

  let mx = -200, my = -200;  // raw mouse coords (start offscreen)
  let cx = -200, cy = -200;  // current lerped coords
  let rafId;

  // Show native cursor until first mousemove
  document.body.style.cursor = 'none';

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    el.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    el.style.opacity = '1';
  });

  // Click flash
  document.addEventListener('mousedown', () => el.classList.add('is-click'));
  document.addEventListener('mouseup',   () => el.classList.remove('is-click'));

  // Hover detection — buttons, links, interactive elements
  const hoverTargets = 'a, button, [tabindex="0"], .benefit-card, label, input, select';

  document.querySelectorAll(hoverTargets).forEach(t => {
    t.addEventListener('mouseenter', () => el.classList.add('is-hover'));
    t.addEventListener('mouseleave', () => el.classList.remove('is-hover'));
  });

  // rAF loop — lerp and write transform directly
  function loop() {
    // Linear interpolation toward mouse position
    cx += (mx - cx) * LERP;
    cy += (my - cy) * LERP;

    // Centre cursor ring on pointer
    // is-hover enlarges to 34px so HALF becomes 17 — we let CSS handle
    // width/height transition; the translate offset is always -HALF of
    // the base 22px so the ring shifts slightly but stays near pointer
    el.style.transform = `translate(${cx - HALF}px, ${cy - HALF}px)`;

    rafId = requestAnimationFrame(loop);
  }

  loop();
}


/* ══════════════════════════════════════════════════════════
   BUTTON ARROW ANIMATION — .js-btn-arrow
   ──────────────────────────────────────────────────────────
   On mouseenter: arrow SVG slides +5px right, fades slightly in.
   On mouseleave: returns to 0 with power3.out — no bounce.
   Only animates transform (translateX) + opacity on the SVG
   child — button dimensions are completely untouched.
══════════════════════════════════════════════════════════ */
function initBtnArrow() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.js-btn-arrow').forEach(btn => {
    const arrow = btn.querySelector('.btn-arrow__svg');
    if (!arrow) return;

    // Resting state — GSAP owns x, rotation, opacity, filter from here
    gsap.set(arrow, {
      x: 0,
      rotation: 0,
      opacity: 0.75,
      filter: 'drop-shadow(0 0 0px rgba(255,255,255,0))',
      transformOrigin: 'center center',
    });

    btn.addEventListener('mouseenter', () => {
      gsap.to(arrow, {
        x: 7,                  // 7px forward slide
        rotation: 2.5,         // 2.5° tilt — premium, not gimmicky
        opacity: 1,
        filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.55))', // soft white glow against blue btn
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(arrow, {
        x: 0,
        rotation: 0,
        opacity: 0.75,
        filter: 'drop-shadow(0 0 0px rgba(255,255,255,0))',
        duration: 0.45,
        ease: 'power3.out',    // no elastic — clean, controlled return
        overwrite: 'auto',
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   RESULTS SECTION — Before/After Slider + LBS Calculator
   ──────────────────────────────────────────────────────────
   Slider logic:
   • Pointer/touch events drive handle position (0–100%).
   • Before-panel clip-path follows handle x as percentage.
   • Keyboard: ← → arrows move handle ±2%.
   • handle aria-valuenow updates for accessibility.

   Calculator logic (exact from peptivo-v2):
   • Rate table by duration: 3mo=20%, 6mo=30%, 12mo=40%.
   • estimatedLoss = floor(weight × rate).
   • targetWeight  = weight − estimatedLoss.
   • Progress bar fill = rate %.
   • Number input and range slider stay in sync.
   • Duration tabs toggle active state and recalculate.

   GSAP section-enter animation:
   • IntersectionObserver fires once when section enters viewport.
   • Left col: x:-60→0, opacity:0→1, power3.out, 0.8s.
   • Right col: x:60→0, opacity:0→1, power3.out, 0.8s, delay:0.1s.
   • No ScrollTrigger, no scrub, no pin.
══════════════════════════════════════════════════════════ */
function initResults() {

  /* ── 1. GSAP entrance animation (IntersectionObserver) ── */
  const sliderCol = document.getElementById('resultsSlider');
  const calcCol   = document.getElementById('resultsCalc');

  if (sliderCol && calcCol) {
    // Start hidden — GSAP owns these properties
    gsap.set(sliderCol, { x: -60, opacity: 0 });
    gsap.set(calcCol,   { x:  60, opacity: 0 });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        // Animate both columns in on first viewport entry
        gsap.to(sliderCol, {
          x: 0, opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'transform',
        });
        gsap.to(calcCol, {
          x: 0, opacity: 1,
          duration: 0.8,
          delay: 0.1,
          ease: 'power3.out',
          clearProps: 'transform',
        });

        io.disconnect(); // fire once only
      });
    }, { threshold: 0.15 });

    io.observe(sliderCol);
  }


  /* ── 2. BEFORE/AFTER SLIDER ─────────────────────────────
     Exactly replicating peptivo-v2 drag logic.
     clip-path on .ba-slider__before controls reveal width.
  ────────────────────────────────────────────────────────── */
  const slider     = document.getElementById('baSlider');
  const beforePane = document.getElementById('baSliderBefore');
  const handle     = document.getElementById('baHandle');

  if (slider && beforePane && handle) {
    let pct = 50;   // current position 0–100
    let dragging = false;

    // Apply position — sets clip on before panel and moves handle
    function setPosition(newPct) {
      pct = Math.min(100, Math.max(0, newPct));
      beforePane.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = `${pct}%`;
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    // Convert clientX to percentage within slider bounds
    function clientXtoPct(clientX) {
      const rect = slider.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    // Pointer events (covers both mouse and touch via unified API)
    handle.addEventListener('pointerdown', e => {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      setPosition(clientXtoPct(e.clientX));
    });

    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointercancel', () => { dragging = false; });

    // Click anywhere on slider jumps handle
    slider.addEventListener('click', e => {
      if (e.target === handle || handle.contains(e.target)) return;
      setPosition(clientXtoPct(e.clientX));
    });

    // Keyboard accessibility — ← → keys
    handle.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  setPosition(pct - 2);
      if (e.key === 'ArrowRight') setPosition(pct + 2);
    });

    // Set initial position
    setPosition(50);
  }


  /* ── 3. LBS CALCULATOR ───────────────────────────────────
     Rate table and calculation identical to peptivo-v2.
     weight × rate → estimated loss; weight - loss → target.
  ────────────────────────────────────────────────────────── */
  const weightInput = document.getElementById('calcWeight');
  const rangeInput  = document.getElementById('calcRange');
  const lbsDisplay  = document.getElementById('calcLbs');
  const targetDisp  = document.getElementById('calcTarget');
  const barFill     = document.getElementById('calcBar');
  const pctLabel    = document.getElementById('calcPct');
  const tabs        = document.querySelectorAll('.calc-tab');

  if (!weightInput || !lbsDisplay) return;

  // Duration → loss rate (matches peptivo-v2 exactly)
  const RATE = { 3: 0.20, 6: 0.30, 12: 0.40 };
  let activeMonths = 3;

  function calculate() {
    const weight = parseInt(weightInput.value, 10);
    if (isNaN(weight) || weight < 100 || weight > 500) return;

    const rate = RATE[activeMonths] || 0.20;
    const loss = Math.floor(weight * rate);
    const target = weight - loss;
    const pctNum = Math.round(rate * 100);

    lbsDisplay.textContent  = `${loss} lbs`;
    targetDisp.textContent  = `${target} lbs`;
    pctLabel.textContent    = `${pctNum}%`;

    // Animate bar fill with GSAP (width % of track)
    gsap.to(barFill, {
      width: `${pctNum}%`,
      duration: 0.55,
      ease: 'power2.out',
    });
  }

  // Number input → sync range → recalculate
  weightInput.addEventListener('input', () => {
    const val = parseInt(weightInput.value, 10);
    if (!isNaN(val)) rangeInput.value = val;
    calculate();
  });

  // Range slider → sync number input → recalculate
  rangeInput.addEventListener('input', () => {
    weightInput.value = rangeInput.value;
    calculate();
  });

  // Duration tab toggle
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeMonths = parseInt(tab.dataset.months, 10);
      calculate();
    });
  });

  // Run once on load to populate result
  calculate();
}

/* ══════════════════════════════════════════════════════════
   SPECIFICATIONS SECTION — orbit layout + GSAP entrance
   ──────────────────────────────────────────────────────────
   Animation pattern matches initResults exactly:
   • IntersectionObserver fires once at threshold 0.15.
   • Product: x:-80→0, opacity:0→1, power3.out, 0.8s.
   • Spec nodes: y:20→0, opacity:0→1, power3.out, 0.6s,
     staggered 0.07s each — matches site's reveal timing.
   • clearProps:'transform' after each tween.
   • Reduced-motion: sets everything visible immediately.
══════════════════════════════════════════════════════════ */
function initSpecs() {
  const product = document.getElementById('specsProduct');
  const stage   = document.getElementById('specsStage');
  const orbit   = document.getElementById('specsOrbit');
  if (!product || !stage || !orbit) return;

  const nodes = Array.from(orbit.querySelectorAll('.spec-node'));
  if (!nodes.length) return;

  /* ── Config ──────────────────────────────────────────────
     Stage is 700×700px. Orbit centre = (350, 350).
     8 nodes evenly distributed at 45° increments.
     RADIUS: distance from centre to node's own centre-point.
     Chosen so 172px cards clear the 160px product image and
     rings (outermost ring = 340px diameter = 170px radius).
  ─────────────────────────────────────────────────────────*/
  const CX             = 350;           // stage centre x (px)
  const CY             = 350;           // stage centre y (px)
  const RADIUS         = 272;           // px — orbit radius
  const N              = nodes.length;  // 8
  const STEP           = 360 / N;       // 45° between nodes
  const START          = -90;           // first node at 12 o'clock
  const ORBIT_DURATION = 40;            // seconds per full revolution
  const MOBILE_BP      = 900;           // matches CSS breakpoint

  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth <= MOBILE_BP;

  /* ── Mobile path: CSS handles layout, JS does nothing ───*/
  if (isMobile()) {
    // Ensure no lingering inline styles from a previous desktop run
    orbit.style.transform = '';
    nodes.forEach(n => {
      n.style.left = n.style.top = n.style.transform = '';
      n.style.opacity = '1';
    });
    gsap.set(product, { clearProps: 'all' });
    return;
  }

  /* ── Desktop: position every node once with gsap.set ────
     Each node is centred on its orbit point via x/y offset.
     gsap.set uses GSAP's internal matrix so it doesn't fight
     CSS transform-origin. We then let GSAP own 'rotation'
     on both the orbit wrapper and each node.
  ─────────────────────────────────────────────────────────*/
  const initialAngles = nodes.map((node, i) => {
    const deg = START + i * STEP;
    const rad = (deg * Math.PI) / 180;
    const nx  = CX + RADIUS * Math.cos(rad);
    const ny  = CY + RADIUS * Math.sin(rad);

    // Position node: centre it on the orbit point.
    // Using left/top + translate(-50%,-50%) via inline style once —
    // GSAP's rotation tween will then be applied on top of this base.
    node.style.left   = `${nx}px`;
    node.style.top    = `${ny}px`;
    node.style.right  = 'auto';
    node.style.bottom = 'auto';
    // Base centering transform — GSAP will compose rotation on top
    gsap.set(node, { xPercent: -50, yPercent: -50, rotation: 0 });

    return deg;
  });

  /* ── Entry animation ─────────────────────────────────────
     Product slides in from left (x: -80 → 0).
     Each node nudges inward from its orbit position then settles.
     Orbit rotation starts after last entry tween finishes.
  ─────────────────────────────────────────────────────────*/
  if (reduced) {
    // Show everything immediately, skip orbit
    gsap.set(product, { opacity: 1, x: 0, clearProps: 'transform' });
    nodes.forEach(n => gsap.set(n, { opacity: 1 }));
    startOrbit(0);
    return;
  }

  // Hide nodes for entry — stays hidden until ScrollTrigger fires
  gsap.set(nodes, { opacity: 0 });
  gsap.set(product, { x: -80, opacity: 0 });

  /*
    ScrollTrigger replaces IntersectionObserver here.
    start: "top 80%" — fires when the top of the specs stage
    reaches 80% down the viewport (i.e. section just entering
    from the bottom). This prevents the animation from running
    while the section is completely off-screen.
    once: true — triggers only the first time, then self-removes.
  */
  ScrollTrigger.create({
    trigger: stage,
    start: 'top 80%',
    once: true,
    onEnter() {
      // Product enters from left
      gsap.to(product, {
        x: 0, opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: 'transform',
      });

      // Nodes enter from their orbit positions, nudged inward
      nodes.forEach((node, i) => {
        const rad    = (initialAngles[i] * Math.PI) / 180;
        const nudgeX = -22 * Math.cos(rad);  // toward centre
        const nudgeY = -22 * Math.sin(rad);
        gsap.fromTo(node,
          { opacity: 0, x: nudgeX, y: nudgeY },
          { opacity: 1, x: 0, y: 0,
            duration: 0.55,
            delay: 0.2 + i * 0.07,
            ease: 'power3.out',
          }
        );
      });

      // Orbit starts after last node finishes entering
      const orbitDelay = 0.2 + (N - 1) * 0.07 + 0.55; // ≈ 1.24s
      startOrbit(orbitDelay);
    },
  });

  /* ── Orbit rotation ──────────────────────────────────────
     Strategy: rotate .specs-orbit wrapper with a GSAP tween.
     Counter-rotate every .spec-node by -orbitAngle so their
     content stays perfectly upright.

     We use a proxy object `state.deg` as the animated value
     and write both transforms in onUpdate. Direct style writes
     are faster than queuing 9 separate GSAP tweens per frame.

     The orbit wrapper itself is never visually rendered (it's
     transparent, position:absolute inset:0), so rotating it is
     a pure compositor operation — zero layout cost.
  ─────────────────────────────────────────────────────────*/
  let orbitTween = null;

  function startOrbit(delay) {
    if (reduced) return;

    const state = { deg: 0 };

    orbitTween = gsap.to(state, {
      deg: -360,
      duration: ORBIT_DURATION,
      delay,
      ease: 'none',     // perfectly linear — no speed bumps on repeat
      repeat: -1,
      onUpdate() {
        const d = state.deg;
        // Rotate the wrapper (moves all nodes along the circular path)
        orbit.style.transform = `rotate(${d}deg)`;
        // Counter-rotate each node (keeps card text upright)
        const counter = `translateX(-50%) translateY(-50%) rotate(${-d}deg)`;
        nodes.forEach(n => { n.style.transform = counter; });
      },
    });
  }

  /* ── Resize guard ────────────────────────────────────────
     If user resizes into mobile breakpoint, kill the tween
     and clear all inline styles so CSS takes over cleanly.
  ─────────────────────────────────────────────────────────*/
  let wasDesktop = true;
  window.addEventListener('resize', () => {
    const nowMobile = isMobile();
    if (nowMobile && wasDesktop) {
      if (orbitTween) { orbitTween.kill(); orbitTween = null; }
      orbit.style.transform = '';
      nodes.forEach(n => {
        n.style.left = n.style.top = n.style.transform = '';
        n.style.opacity = '1';
        gsap.set(n, { clearProps: 'all' });
      });
      wasDesktop = false;
    } else if (!nowMobile && !wasDesktop) {
      // Reload page to reinitialise desktop orbit cleanly
      wasDesktop = true;
    }
  }, { passive: true });
}


/* ── Orbit rotation ────────────────────────────────────── ENDS HRE */


/* ══════════════════════════════════════════════════════════
   MORTAR & PESTLE ANIMATION — initSpecsMortarAnim()
   ──────────────────────────────────────────────────────────
   Single centered scene (#sphMain) at the section bottom.

   REVEAL (ScrollTrigger, once, top 80%):
     SVG fades in from opacity:0 + slight y-rise.

   LOOPS (start after reveal):
   ① IDLE FLOAT  — whole SVG bobs up/down 10px, 5.5s sine.
   ② PESTLE GRIND — pestle group swings ±8° on a pivot at
      its grinding tip; 0.9s yoyo, repeat forever.
   ③ SPARKLE BURST — 3 cross-shapes pop up from bowl rim,
      stagger 0/0.15/0.30s, rise & fade; repeats every 3s.
   ④ DUST PARTICLES — 6 circles rise from bowl mouth,
      each on its own async cycle.

   Safe: only touches #sphMain and its children.
   Reduced-motion: CSS hides .sph-bg, JS exits early.
══════════════════════════════════════════════════════════ */
function initSpecsMortarAnim() {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof ScrollTrigger === 'undefined') return;

  var section = document.getElementById('specifications');
  if (!section) return;

  var svg     = document.getElementById('sphMain');
  if (!svg) return;

  var pestle   = svg.querySelector('#sphPestle');
  var sparkles = [
    svg.querySelector('#sphSA'),
    svg.querySelector('#sphSB'),
    svg.querySelector('#sphSC'),
  ];
  var dust = Array.from(svg.querySelectorAll('.sph-dust'));

  /* ── Reveal on scroll ────────────────────────────────── */
  gsap.set(svg, { opacity: 0, y: 22 });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 80%',
    once: true,
    onEnter: function () {
      gsap.to(svg, {
        opacity: 1, y: 0,
        duration: 1.2,
        ease: 'power2.out',
        onComplete: startLoops,
      });
    },
  });

  /* ── All looping animations ──────────────────────────── */
  function startLoops() {

    /* ① Idle float — whole SVG bobs gently */
    gsap.to(svg, {
      y: -10,
      duration: 5.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    /* ② Pestle grind — pivot from the grinding tip */
    gsap.set(pestle, { transformOrigin: '60% 75%' });
    gsap.to(pestle, {
      rotation: 8,
      x: 6,
      duration: 0.9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    /* ③ Sparkle bursts */
    function sparkleLoop() {
      gsap.set(sparkles, { opacity: 0, y: 0, scale: 0 });

      var tl = gsap.timeline({
        onComplete: function () { gsap.delayedCall(2.0, sparkleLoop); }
      });

      // A — medium, first
      tl.to(sparkles[0], { opacity: 1, y: -12, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0)
        .to(sparkles[0], { opacity: 0, y: -26, duration: 0.5, ease: 'power1.in' }, 0.38);

      // B — large, slight delay
      tl.to(sparkles[1], { opacity: 1, y: -16, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0.15)
        .to(sparkles[1], { opacity: 0, y: -32, duration: 0.5, ease: 'power1.in' }, 0.53);

      // C — small, last
      tl.to(sparkles[2], { opacity: 1, y: -10, scale: 1, duration: 0.30, ease: 'back.out(2)' }, 0.30)
        .to(sparkles[2], { opacity: 0, y: -22, duration: 0.45, ease: 'power1.in' }, 0.62);
    }
    gsap.delayedCall(0.5, sparkleLoop);

    /* ④ Dust particles — independent async cycles */
    dust.forEach(function (d, i) {
      var rise   = 18 + i * 4;
      var dur    = 1.1 + i * 0.16;
      var pause  = 1.2 + i * 0.20;
      var sx     = (i - 2.5) * 6;   // horizontal spread

      function dustCycle() {
        gsap.set(d, { opacity: 0, y: 0, x: sx });
        gsap.timeline({ onComplete: function () { gsap.delayedCall(pause, dustCycle); } })
          .to(d, { opacity: 0.85, duration: 0.28, ease: 'power1.out' })
          .to(d, { y: -rise, x: sx + (i % 2 === 0 ? 5 : -5), duration: dur, ease: 'power1.out' }, 0.08)
          .to(d, { opacity: 0, duration: dur * 0.5, ease: 'power1.in' }, 0.08 + dur * 0.5);
      }
      gsap.delayedCall(i * 0.25, dustCycle);
    });
  }
}


/* ══════════════════════════════════════════════════════════
   HOW IT WORKS — initHIW()
   Static version — no pin, no scrub, no horizontal scroll.
   Three responsibilities:
     1. SVG idle float (sine yoyo, unchanged from before)
     2. Card entrance — each .hiw-card slides up + fades in
        via ScrollTrigger, staggered 0.15s, fires once.
     3. No resize handler needed (static layout).
══════════════════════════════════════════════════════════ */
function initHIW() {
  var section = document.querySelector('#how-it-works');
  if (!section) return;
  if (typeof gsap === 'undefined') return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -- 1. SVG idle float (kept exactly as before) -------------- */
  if (!reduced) {
    section.querySelectorAll('.hiw-svg').forEach(function(svg, i) {
      gsap.fromTo(svg, { y: 0 }, {
        y: -8, duration: 3.6 + i * 0.7,
        ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.55,
      });
    });
  }

  if (reduced) return;

  /* -- 2. Card entrance — slide up from y:40, fade in ---------- */
  if (typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  var cards = section.querySelectorAll('.hiw-card');
  gsap.set(cards, { opacity: 0, y: 40 });

  ScrollTrigger.create({
    trigger  : section.querySelector('.hiw-steps-wrap'),
    start    : 'top 78%',
    once     : true,
    onEnter  : function() {
      gsap.to(cards, {
        opacity  : 1,
        y        : 0,
        duration : 0.7,
        ease     : 'power3.out',
        stagger  : 0.15,
        clearProps: 'transform',
      });
    },
  });
}


/* ── HOW IT WORKS ────────────────────────────────────── ENDS HRE */

/*
  ═══════════════════════════════════════════════════════════════
  PEPTIVO — Doctors Section JS
  ───────────────────────────────────────────────────────────────
  Self-contained. Does NOT touch any other section or variable.

  What this file does
  ─────────────────────
  1. initDoctorsSection()
     • Reads all doctor data from .pds-card HTML elements —
       no hardcoded arrays or data-* attributes.
     • On click: activates the card + updates .pds-stage.
     • GSAP: fade+slide on stage content swap.

  2. initDoctorsEntrance()  (desktop only, skip on mobile)
     • ScrollTrigger: when section enters viewport, cards fly
       in from their off-screen rotated starting positions.

  3. initDoctorsFloat()     (desktop only, skip on mobile)
     • After entrance: each card gently bobs up and down with
       slightly different timing and amplitude.

  Adding a doctor
  ─────────────────
  Only requires adding a new .pds-card block in the HTML.
  JS automatically picks it up — zero changes needed here.
  ═══════════════════════════════════════════════════════════════
*/

(function () {
  'use strict';

  /* ── Constants ────────────────────────────────────────────── */
  var MOBILE_BP = 768;

  /* ── Credential map ───────────────────────────────────────── */
  /*
    Because credentials aren't stored in the card HTML
    (they'd look odd in the thumbnail), we store them here
    keyed by exact doctor name.

    TO ADD CREDENTIALS FOR A NEW DOCTOR: add one entry below.
    Key = doctor-name text, value = array of badge strings.
  */
  var CREDENTIALS = {
    'Dr. Sophia Taylor':  ['Harvard Medical School', 'Board Certified', '2,400+ Patients'],
    'Dr. James Anderson': ['Johns Hopkins University', 'Board Certified', '3,100+ Patients'],
    'Dr. Michael Carter': ['Stanford Medicine', 'Board Certified', '1,800+ Patients'],
    'Dr. Emily Brown':    ['Yale School of Medicine', 'Board Certified', '2,900+ Patients'],
    'Dr. Lisa Chen':      ['Board Certified', 'Nutritional Medicine', '1,500+ Patients'],
  };

  /* ── Wait for DOM ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var section = document.querySelector('.peptivo-doctors-section');
    if (!section) return;

    /* Guard: GSAP must be loaded */
    if (typeof gsap === 'undefined') {
      console.warn('Doctors section: GSAP not found. Load gsap.min.js before doctors-section.js');
      return;
    }

    initDoctorsSection(section);

    var isMobile = window.innerWidth < MOBILE_BP;
    if (!isMobile) {
      initDoctorsEntrance(section);
      initDoctorsFloat(section);
    }
  });


  /* ══════════════════════════════════════════════════════════
     1. CLICK INTERACTION — activate card + populate stage
  ══════════════════════════════════════════════════════════ */
  function initDoctorsSection(section) {

    var cards    = section.querySelectorAll('.pds-card');
    var stage    = section.querySelector('.pds-stage');
    if (!cards.length || !stage) return;

    var stageImg      = stage.querySelector('.pds-stage__img');
    var stageDegree   = stage.querySelector('.pds-stage__degree-text');
    var stageName     = stage.querySelector('.pds-stage__name');
    var stageFeedback = stage.querySelector('.pds-stage__feedback');
    var stageBadges   = stage.querySelector('.pds-stage__badges');

    var firstActivated = false;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Activate first card immediately (no animation) */
    activateCard(cards[0], false);

    /* Bind click to every card */
    cards.forEach(function (card) {
      card.addEventListener('click', function () {

        // On mobile: open modal instead of populating stage below
        if (window.innerWidth < MOBILE_BP) {
          openDoctorModal(card);
          return;
        }

        if (card.classList.contains('active')) return;
        activateCard(card, true);
      });

      /* Keyboard: Enter / Space also activates */
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateCard(card, true);
        }
      });
    });

    /* ── Activate a card ──────────────────────────────────── */
    function activateCard(card, animate) {
      /* Mark active */
      cards.forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');

      /* Read content directly from card HTML */
      var img      = card.querySelector('img');
      var name     = card.querySelector('.doctor-name');
      var degree   = card.querySelector('.doctor-degree');
      var feedback = card.querySelector('.doctor-feedback');
      var nameText = name ? name.textContent.trim() : '';

      /* Build badge list from CREDENTIALS map */
      var creds = CREDENTIALS[nameText] || [];
      var badgeHTML = creds.map(function (b) {
        return '<li>' + b + '</li>';
      }).join('');

      if (!animate || reduced || !firstActivated) {
        /* Instant swap — no animation */
        writeStage(img, degree, name, feedback, badgeHTML);
        revealStage(stage);
        firstActivated = true;
        return;
      }

      /* GSAP: fade stage body out → swap → fade back in */
      var targets = [stageImg, stageName, stageDegree, stageFeedback, stageBadges];

      gsap.to(targets, {
        opacity: 0,
        y: 10,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: function () {
          writeStage(img, degree, name, feedback, badgeHTML);
          gsap.fromTo(targets,
            { opacity: 0, y: -8 },
            { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out', stagger: 0.05 }
          );
        }
      });
    }

    /* ── Write content into stage ───────────────────────── */
    function writeStage(img, degree, name, feedback, badgeHTML) {
      stageImg.src              = img      ? img.src          : '';
      stageImg.alt              = img      ? img.alt          : '';
      stageDegree.textContent   = degree   ? degree.textContent.trim()  : '';
      stageName.textContent     = name     ? name.textContent.trim()    : '';
      stageFeedback.textContent = feedback ? feedback.textContent.trim(): '';
      stageBadges.innerHTML     = badgeHTML;
    }

    /* ── First reveal of stage ──────────────────────────── */
    function revealStage(stage) {
      if (stage.classList.contains('pds-stage--visible')) return;
      stage.classList.add('pds-stage--visible');
      gsap.fromTo(stage,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
      );
    }
  }


  /* ══════════════════════════════════════════════════════════
     2. ENTRANCE ANIMATION — cards fly in on scroll
     ─────────────────────────────────────────────────────────
     Each card starts:
       • rotated to 2× its natural arc angle (further out)
       • translated further down
       • opacity 0
     Then settles into its natural CSS transform position.

     We DON'T hardcode the final transform — we clear the GSAP
     inline style so CSS takes over. This keeps the arc purely
     CSS-driven and the JS simply animates the approach.
  ══════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════════════
     MOBILE DOCTOR MODAL
     Opens a centered overlay with full doctor details.
     No new libraries — pure DOM + CSS transition.
     Desktop path (activateCard → stage) is completely unchanged.
  ══════════════════════════════════════════════════════════ */
  function openDoctorModal(card) {
    // Read data from the card
    var img      = card.querySelector('img');
    var name     = card.querySelector('.doctor-name');
    var degree   = card.querySelector('.doctor-degree');
    var feedback = card.querySelector('.doctor-feedback');
    var nameText = name ? name.textContent.trim() : '';
    var creds    = CREDENTIALS[nameText] || [];

    // Remove any existing modal
    var old = document.getElementById('pds-modal');
    if (old) old.remove();

    // Build badge HTML
    var badgesHTML = creds.map(function(b) {
      return '<span class="pds-modal__badge">' + b + '</span>';
    }).join('');

    // Build modal HTML
    var modal = document.createElement('div');
    modal.id = 'pds-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', nameText);
    modal.innerHTML =
      '<div class="pds-modal__overlay" id="pds-modal-overlay"></div>' +
      '<div class="pds-modal__box">' +
        '<button class="pds-modal__close" id="pds-modal-close" aria-label="Close">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" fill="none">' +
            '<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
        '<img class="pds-modal__img" src="' + (img ? img.src : '') + '" alt="' + (img ? img.alt : '') + '">' +
        '<p class="pds-modal__degree">' + (degree ? degree.textContent.trim() : '') + '</p>' +
        '<h3 class="pds-modal__name">' + nameText + '</h3>' +
        '<p class="pds-modal__feedback">' + (feedback ? feedback.textContent.trim() : '') + '</p>' +
        (badgesHTML ? '<div class="pds-modal__badges">' + badgesHTML + '</div>' : '') +
      '</div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Animate in (rAF ensures transition fires after display)
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        modal.classList.add('pds-modal--open');
      });
    });

    // Close handlers
    function closeModal() {
      modal.classList.remove('pds-modal--open');
      document.body.style.overflow = '';
      setTimeout(function() { modal.remove(); }, 280);
    }

    document.getElementById('pds-modal-close').addEventListener('click', closeModal);
    document.getElementById('pds-modal-overlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
    });
  }


  function initDoctorsEntrance(section) {

    if (typeof ScrollTrigger === 'undefined') {
      console.warn('Doctors section: ScrollTrigger not found. Entrance animation skipped.');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var cards = section.querySelectorAll('.pds-card');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    /* Set starting state: cards hidden below/off-screen */
    cards.forEach(function (card) {
      gsap.set(card, { opacity: 0, yPercent: 60, scale: 0.85 });
    });

    /* ScrollTrigger: fire once when section is 20% into viewport */
    ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      once: true,
      onEnter: function () {

        /* Stagger each card in with a slight delay per card */
        cards.forEach(function (card, i) {
          var delayBase = parseFloat(card.style.getPropertyValue('--delay') || '0');
          var extraDelay = i * 0.07;

          gsap.to(card, {
            opacity: 1,
            yPercent: 0,
            scale: 1,
            duration: 0.9,
            delay: 0.15 + delayBase + extraDelay,
            ease: 'power3.out',
            clearProps: 'opacity,yPercent,scale', /* hand control back to CSS */
          });
        });
      }
    });
  }


  /* ══════════════════════════════════════════════════════════
     3. FLOATING ANIMATION — subtle ambient motion
     ─────────────────────────────────────────────────────────
     Inspired by Apple / Stripe landing pages:
       • Very small vertical movement (4–5px max)
       • Slight rotation (0.3°–0.5°) for organic feel
       • Long durations (5–7s) — barely perceptible
       • Staggered delays so cards never peak together
     Goal: cards feel alive, not animated.
  ══════════════════════════════════════════════════════════ */
  function initDoctorsFloat(section) {

    var cards = section.querySelectorAll('.pds-card');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    /*
      Per-card config — vertical drift only.
      Rotation tween removed: it compounded with each card's CSS
      --rot fan angle, causing visible jitter and perceived overlap.

      y:   vertical travel in px  (3–5px, well within 10px max)
      dur: half-cycle in seconds  (6.5–8s — slow and smooth)
      del: stagger so cards never all peak simultaneously
    */
    var floatConfig = [
      { y: 4,  dur: 7.5,  del: 0.0  },  /* far left  */
      { y: 5,  dur: 6.5,  del: 1.1  },  /* mid left  */
      { y: 3,  dur: 8.0,  del: 0.6  },  /* center    */
      { y: 5,  dur: 7.0,  del: 1.7  },  /* mid right */
      { y: 4,  dur: 7.8,  del: 0.9  },  /* far right */
    ];

    cards.forEach(function (card, i) {
      var cfg = floatConfig[i] || { y: 4, dur: 7.0, del: i * 0.4 };

      /* Vertical drift only — no rotation */
      gsap.to(card, {
        y: -cfg.y,
        duration: cfg.dur,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: cfg.del,
      });
    });
  }

})(); /* end IIFE */


/* ── DOCTORS ─────────────────────────────────────── ENDS HERE */


/* =================================================================
   ONLINE CARE  --  initCare()
   ─────────────────────────────────────────────────────────────
   Per-item entrance: each .care-icon and .care-text-wrap animate
   independently when that .care-item enters the viewport.

   Direction logic (mirrors the CSS zigzag layout):
     Odd  items (no .care-item--even):  icon ← left,  text → right
     Even items (.care-item--even):     icon → right, text ← left

   x offsets are ±80px — enough to feel like a definitive slide
   without requiring the element to travel from the screen edge
   (which would break the SVG measurements and look too dramatic
   for a card-list layout this size).

   After each .care-icon reaches its final position a continuous
   subtle float tween (y: 0 → -12 → 0, sine.inOut, repeat -1)
   keeps the icon alive.  The float targets the SVG element so
   it never conflicts with the slide tween on the wrapper.

   toggleActions: "play none none reverse" — reverses on scroll-up
   so re-scrolling looks clean.

   No scrub. No pin. No scroll hijacking.
================================================================= */
function initCare() {
  var grid = document.getElementById('careGrid');
  if (!grid) return;
  if (typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  var items   = Array.from(grid.querySelectorAll('.care-item'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reduced-motion: show everything immediately */
  if (reduced) {
    items.forEach(function(item) {
      var icon = item.querySelector('.care-icon');
      var text = item.querySelector('.care-text-wrap');
      if (icon) { icon.style.opacity = '1'; icon.style.transform = 'none'; }
      if (text) { text.style.opacity = '1'; text.style.transform = 'none'; }
    });
    return;
  }

  /* ── Recalculate all ScrollTrigger positions ──────────────────
     The HIW section above uses pin:true which inserts a spacer div
     and changes total page height. Without refresh(), the care-item
     trigger positions are calculated BEFORE the spacer height is
     fully accounted for — so they never fire at the right scroll depth.
  ─────────────────────────────────────────────────────────────── */
  ScrollTrigger.refresh();

  items.forEach(function(item) {
    var icon   = item.querySelector('.care-icon');
    var text   = item.querySelector('.care-text-wrap');
    var svg    = icon ? icon.querySelector('svg') : null;
    var isEven = item.classList.contains('care-item--even');

    /* Odd  items: icon ← left (-80),  text → right (+80)
       Even items: icon → right (+80), text ← left  (-80)  */
    var iconX = isEven ?  80 : -80;
    var textX = isEven ? -80 :  80;

    /* ── Paused timeline attached to ScrollTrigger ────────────
       Using `animation: tl` means toggleActions:'play none none reverse'
       actually controls the tween — without this, toggleActions is ignored
       and the reverse direction never works.
       Both icon and text run at position 0 (parallel, same duration).
    ─────────────────────────────────────────────────────────── */
    var tl = gsap.timeline({ paused: true });

    if (icon) {
      tl.fromTo(icon,
        { opacity: 0, x: iconX },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' },
        0
      );
    }

    if (text) {
      tl.fromTo(text,
        { opacity: 0, x: textX },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' },
        0
      );
    }

    ScrollTrigger.create({
      trigger       : item,
      start         : 'top 80%',
      toggleActions : 'play none none reverse',
      animation     : tl,
      onEnter: function() {
        /* Attach float callback — fires once when timeline completes */
        if (svg) {
          tl.eventCallback('onComplete', function() {
            gsap.fromTo(svg,
              { y: 0 },
              { y: -10, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }
            );
          });
        }
      },
      onLeaveBack: function() {
        /* Kill float so it doesn't fight the reverse tween */
        if (svg) { gsap.killTweensOf(svg); gsap.set(svg, { y: 0 }); }
      }
    });
  });
}



/* =================================================================
   BEFORE / AFTER STACK  —  initBeforeAfterStack()
   ─────────────────────────────────────────────────────────────
   Auto-cycling stacked card carousel. No user interaction needed.

   Stack visual model (6 cards, front → back):
     index 0  = front card  : full scale, full opacity, highest z
     index 1  = 2nd card    : slightly scaled down + shifted up
     index 2  = 3rd card    : more scaled + shifted
     index 3+ = hidden      : opacity 0, no layout cost

   Cycle step (fires every INTERVAL ms):
     1. Front card flies forward (scale up + fade out)
     2. It snaps to the back of the stack (z reordered)
     3. All other cards animate into their new position
     4. Dots and aria updated

   Pure GSAP — no new libraries. ScrollTrigger NOT used here;
   the carousel runs as soon as it enters the viewport
   (IntersectionObserver, fires once to start the loop).
================================================================= */
function initBeforeAfterStack() {

  var stage  = document.getElementById('basStage');
  var dotsWp = document.getElementById('basDotsWrap');
  if (!stage) return;

  var cards  = Array.from(stage.querySelectorAll('.bas-card'));
  var dots   = dotsWp ? Array.from(dotsWp.querySelectorAll('.bas-dot')) : [];
  var total  = cards.length;
  if (total < 2) return;

  var INTERVAL  = 3200;   /* ms between advances                    */
  var EASE_OUT  = 'power3.out';
  var EASE_BACK = 'power2.inOut';
  var reduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Stack position config ────────────────────────────────
     pos 0 = front (active), pos 1 = second, pos 2 = third,
     pos 3+ = hidden behind.
     yOffset : upward shift so back cards peek above front card.
     scale   : slight size reduction per level.
     opacity : cards beyond pos 2 are invisible.
  ──────────────────────────────────────────────────────────── */
  /* ── Stack depth model (front → back) ───────────────────────
     y is POSITIVE so back cards shift downward from the shared
     inset:0 origin, peeking out from behind/below the front card.
     scale < 1 shrinks back cards so they appear further away.
     transformOrigin 'center top' anchors the scale to the top
     edge — back cards shrink downward, reinforcing the depth cue.
     Cards at pos 3+ are invisible (no layout cost).
  ──────────────────────────────────────────────────────────── */
  var POSITIONS = [
    /* pos 0 — front (fully visible) */
    { scale: 1,     y:  0,   opacity: 1,    zIndex: 6 },
    /* pos 1 — one behind: nudged down, slightly smaller */
    { scale: 0.95,  y:  18,  opacity: 1,    zIndex: 5 },
    /* pos 2 — two behind: more depth */
    { scale: 0.90,  y:  32,  opacity: 0.75, zIndex: 4 },
    /* pos 3 — three behind: barely peeking */
    { scale: 0.85,  y:  42,  opacity: 0.4,  zIndex: 3 },
    /* pos 4+ — hidden completely */
    { scale: 0.82,  y:  48,  opacity: 0,    zIndex: 2 },
  ];

  function getPos(idx) {
    return POSITIONS[Math.min(idx, POSITIONS.length - 1)];
  }

  /* order[i] = which card is currently at stack position i */
  var order = cards.map(function(_, i) { return i; });

  /* ── Apply stack positions immediately (no animation) ─── */
  function applyInitial() {
    cards.forEach(function(card, cardIdx) {
      var stackPos = order.indexOf(cardIdx);
      var p = getPos(stackPos);
      gsap.set(card, {
        scale   : p.scale,
        y       : p.y,
        opacity : p.opacity,
        zIndex  : p.zIndex,
        transformOrigin: 'center top',
      });
    });
    updateDots(0);
  }

  /* ── Update pagination dots ──────────────────────────────  */
  function updateDots(frontCardIdx) {
    dots.forEach(function(dot, i) {
      var isActive = (i === frontCardIdx);
      dot.classList.toggle('bas-dot--active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  /* ── Advance one step ────────────────────────────────────
     The front card (order[0]) animates forward then moves to back.
     All other cards shift forward by one position.
  ─────────────────────────────────────────────────────────── */
  var animating = false;

  function advance() {
    if (animating) return;
    animating = true;

    var frontCardIdx = order[0];
    var frontCard    = cards[frontCardIdx];

    /* 1. Front card peels back — scale down slightly, lift up, fade out.
          Feels like the card is being lifted off the top of the deck
          and placed behind it, not thrown forward. */
    gsap.to(frontCard, {
      scale    : 0.88,
      y        : -24,
      opacity  : 0,
      duration : 0.42,
      ease     : EASE_BACK,
      onComplete: function() {

        /* 2. Move front card to the back of the order array */
        order.push(order.shift());

        /* 3. Re-assign z-indices instantly (no animation) so the
              just-sent-to-back card doesn't render above others */
        order.forEach(function(cardIdx, stackPos) {
          var p = getPos(stackPos);
          gsap.set(cards[cardIdx], { zIndex: p.zIndex });
        });

        /* 4. Snap the now-back card to its back-of-stack position */
        var backCard = cards[frontCardIdx];
        var backPos  = getPos(order.indexOf(frontCardIdx));
        gsap.set(backCard, {
          scale  : backPos.scale,
          y      : backPos.y,
          opacity: 0,     /* keep invisible until others have moved */
        });

        /* 5. Animate all other cards into their new positions */
        var tl = gsap.timeline({
          onComplete: function() {
            /* 6. Fade the back card in subtly */
            gsap.to(backCard, {
              opacity  : backPos.opacity,
              duration : 0.3,
              ease     : EASE_OUT,
              onComplete: function() { animating = false; }
            });

            /* Update dots to reflect new front card */
            updateDots(order[0]);
          }
        });

        order.forEach(function(cardIdx, stackPos) {
          if (cardIdx === frontCardIdx) return; /* handled above */
          var p = getPos(stackPos);
          tl.to(cards[cardIdx], {
            scale    : p.scale,
            y        : p.y,
            opacity  : p.opacity,
            duration : 0.55,
            ease     : EASE_OUT,
          }, 0);  /* all in parallel */
        });

      }
    });
  }

  /* ── Reduced-motion: skip animation entirely ─────────────  */
  if (reduced) {
    applyInitial();
    return;
  }

  /* ── Start the carousel when section enters viewport ──────
     IntersectionObserver fires once. Loop runs until the
     section leaves viewport (paused to save CPU).
  ─────────────────────────────────────────────────────────── */
  applyInitial();

  var timer   = null;
  var running = false;

  function startLoop() {
    if (running) return;
    running = true;
    timer = setInterval(advance, INTERVAL);
  }

  function stopLoop() {
    running = false;
    clearInterval(timer);
    timer = null;
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        startLoop();
      } else {
        stopLoop();
        animating = false;
      }
    });
  }, { threshold: 0.2 });

  io.observe(stage);

  /* ── Dot clicks jump to a specific card ──────────────────  */
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      var targetIdx = parseInt(dot.getAttribute('data-idx'), 10);
      if (isNaN(targetIdx)) return;

      /* Rotate order until target card is at front */
      var steps = 0;
      while (order[0] !== targetIdx && steps < total) {
        order.push(order.shift());
        steps++;
      }
      animating = false;
      applyInitial();
      /* Restart the timer so dot-click resets the cycle */
      stopLoop();
      startLoop();
    });
  });
}



/* =================================================================
   BENEFITS SECTION  —  initBenefits()
   ─────────────────────────────────────────────────────────────
   Three responsibilities:

   1. ENTRANCE  (GSAP + ScrollTrigger, fires once)
      Left  column (#bnfLeft  items) → slide from x: -60
      Right column (#bnfRight items) → slide from x: +60
      Centre bottle (#bnfCenter)     → slide from y: -50
      Stagger 0.12s per item within each column.
      All trigger at 'top 78%', once: true.

   2. FLOAT LOOP  (GSAP, infinite, post-entrance)
      Each .bnf-item floats:  y: 0 → 15 → 0, sine.inOut, 3.2s loop.
      Items in a column are staggered by 0.8s offset so they don't
      all peak at the same time — looks organic, not robotic.
      Float starts only after the entrance tween completes.
      IntersectionObserver pauses/resumes to save CPU off-screen.

   3. BOTTLE FLOAT  (GSAP, independent loop)
      Bottle image: y: 0 → -12 → 0, 4s, sine.inOut — matches
      the heroFloat / specs-product pattern used elsewhere.

   Pure GSAP + vanilla JS. No new libraries. prefers-reduced-motion
   guard skips all tweens and shows everything immediately.
================================================================= */

function initBenefits() {
  'use strict';

  var colLeft   = document.getElementById('bnfLeft');
  var colCenter = document.getElementById('bnfCenter');
  var colRight  = document.getElementById('bnfRight');

  if (!colLeft || !colCenter || !colRight) return;
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var itemsLeft  = Array.from(colLeft.querySelectorAll('.bnf-item'));
  var itemsRight = Array.from(colRight.querySelectorAll('.bnf-item'));
  var allItems   = itemsLeft.concat(itemsRight);
  var bottle     = colCenter.querySelectorAll('.bnf-bottle__img');

  /* ── Reduced-motion: show everything flat, no animation ────── */
  if (reduced) {
    gsap.set(allItems, { opacity: 1, x: 0, y: 0, clearProps: 'all' });
    if (bottle) gsap.set(bottle, { opacity: 1, y: 0, clearProps: 'all' });
    return;
  }

  /* ═══════════════════════════════════════════════════════════
     1. ENTRANCE ANIMATION
     Set initial hidden states, then reveal on viewport enter.
  ═══════════════════════════════════════════════════════════ */

  gsap.set(itemsLeft,  { opacity: 0, x: -60 });
  gsap.set(itemsRight, { opacity: 0, x:  60 });
  if (bottle) gsap.set(bottle, { opacity: 0, y: -50 });

  /* Left column — slide in from left */
  ScrollTrigger.create({
    trigger : colLeft,
    start   : 'top 78%',
    once    : true,
    onEnter : function () {
      gsap.to(itemsLeft, {
        opacity  : 1,
        x        : 0,
        duration : 0.75,
        ease     : 'power3.out',
        stagger  : 0.12,
        onComplete: function () { startFloat(itemsLeft, 'left'); }
      });
    }
  });

  /* Right column — slide in from right */
  ScrollTrigger.create({
    trigger : colRight,
    start   : 'top 78%',
    once    : true,
    onEnter : function () {
      gsap.to(itemsRight, {
        opacity  : 1,
        x        : 0,
        duration : 0.75,
        ease     : 'power3.out',
        stagger  : 0.12,
        onComplete: function () { startFloat(itemsRight, 'right'); }
      });
    }
  });

  /* Centre bottle — drop in from top */
  if (bottle) {
    ScrollTrigger.create({
      trigger : colCenter,
      start   : 'top 78%',
      once    : true,
      onEnter : function () {
        gsap.to(bottle, {
          opacity  : 1,
          y        : 0,
          duration : 0.85,
          ease     : 'power3.out',
          onComplete: startBottleFloat
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     2. BENEFIT ITEM FLOAT LOOP
     Each item gently bobs y: 0 → 15 → 0 on a repeating sine.
     Items within a column are offset by 0.8s so they phase-shift
     and feel organic rather than mechanical.
     IntersectionObserver pauses the tweens when off-screen.
  ═══════════════════════════════════════════════════════════ */

  var floatTweens = [];   /* keep refs so we can pause/resume */

  function startFloat(items, side) {
    items.forEach(function (item, i) {
      var tw = gsap.fromTo(
        item,
        { y: 0 },
        {
          y       : 15,               /* translateY: 0 → 15 → 0 */
          duration: 3.2,
          ease    : 'sine.inOut',
          yoyo    : true,
          repeat  : -1,
          delay   : i * 0.8           /* phase-stagger per item */
        }
      );
      floatTweens.push(tw);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     3. BOTTLE FLOAT LOOP
     Matches heroFloat (y: 0 → -12) and specs-product__img pattern.
     Opposite direction (up) to contrast with items (down).
  ═══════════════════════════════════════════════════════════ */

  var bottleTween = null;

  function startBottleFloat() {
    if (!bottle) return;
    bottleTween = gsap.fromTo(
      bottle,
      { y: 0 },
      {
        y       : -12,
        duration: 4.0,
        ease    : 'sine.inOut',
        yoyo    : true,
        repeat  : -1
      }
    );
    floatTweens.push(bottleTween);
  }

  /* ── IntersectionObserver — pause floats when off-screen ─── */
  var sectionEl = document.getElementById('benefits');
  if (sectionEl) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        floatTweens.forEach(function (tw) {
          if (entry.isIntersecting) {
            tw.resume();
          } else {
            tw.pause();
          }
        });
      });
    }, { threshold: 0.05 });

    io.observe(sectionEl);
  }
}



/* =================================================================
   SWITCH TO PEPTIVO  —  initSwitch()
   ─────────────────────────────────────────────────────────────
   Entrance animations (ScrollTrigger, fires once on enter):
     #swLeft   (product 1) → slides in from TOP    (y: -80 → 0)
     #swCenter (person)    → slides in from TOP    (y: -60 → 0)
     #swRight  (product 2) → slides in from BOTTOM (y: +80 → 0)

   Float loop (GSAP, runs while section is in viewport):
     Each .swb-badge floats y: 0 → 15 → 0, sine.inOut, phase-staggered.
     Both .swb-product-img also float (y: 0 → -10), opposite direction.

   IntersectionObserver pauses all float tweens when off-screen.
================================================================= */
function initSwitch() {
  'use strict';

  var colLeft   = document.getElementById('swLeft');
  var colCenter = document.getElementById('swCenter');
  var colRight  = document.getElementById('swRight');

  if (!colLeft || !colCenter || !colRight) return;
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var prod1   = document.getElementById('swProd1');
  var prod2   = document.getElementById('swProd2');
  var person  = document.getElementById('swPerson');
  var badges  = Array.from(document.querySelectorAll('.swb-badge'));

  /* ── Reduced-motion: reveal flat, skip all animation ──────── */
  if (reduced) {
    [colLeft, colCenter, colRight].forEach(function(el) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: 'all' });
    });
    badges.forEach(function(b) {
      gsap.set(b, { opacity: 1, y: 0, clearProps: 'all' });
    });
    return;
  }

  /* ═══════════════════════════════════════════════════════════
     1. ENTRANCE — hidden starting states
  ═══════════════════════════════════════════════════════════ */
  gsap.set(colLeft,   { opacity: 0, y: -80 });   /* drop from above */
  gsap.set(colCenter, { opacity: 0, y: -60 });   /* drop from above */
  gsap.set(colRight,  { opacity: 0, y:  80 });   /* rise from below */
  gsap.set(badges,    { opacity: 0, scale: 0.8, transformOrigin: 'center center' });

  /* Use a single trigger on the section so all three fire together */
  var section = document.getElementById('switch');

  ScrollTrigger.create({
    trigger : section,
    start   : 'top 75%',
    once    : true,
    onEnter : function() {

      /* Left — product 1 falls from top */
      gsap.to(colLeft, {
        opacity  : 1,
        y        : 0,
        duration : 0.85,
        ease     : 'power3.out',
      });

      /* Center — person drops in slightly later */
      gsap.to(colCenter, {
        opacity  : 1,
        y        : 0,
        duration : 0.85,
        delay    : 0.12,
        ease     : 'power3.out',
        onComplete: startPersonFloat
      });

      /* Right — product 2 rises from bottom, later still */
      gsap.to(colRight, {
        opacity  : 1,
        y        : 0,
        duration : 0.85,
        delay    : 0.24,
        ease     : 'power3.out',
        onComplete: startProductFloat
      });

      /* Badges pop in after columns settle */
      gsap.to(badges, {
        opacity  : 1,
        scale    : 1,
        duration : 0.5,
        ease     : 'back.out(1.4)',
        stagger  : 0.1,
        delay    : 0.55,
        onComplete: startBadgeFloat
      });
    }
  });

  /* ═══════════════════════════════════════════════════════════
     2. FLOAT LOOPS — all collected for pause/resume
  ═══════════════════════════════════════════════════════════ */
  var floatTweens = [];

  /* Product bottles float upward (y: 0 → -10) — lighter feel */
  function startProductFloat() {
    [prod1, prod2].forEach(function(img, i) {
      if (!img) return;
      var tw = gsap.fromTo(img,
        { y: 0 },
        {
          y       : -10,
          duration: 3.6 + i * 0.4,
          ease    : 'sine.inOut',
          yoyo    : true,
          repeat  : -1,
          delay   : i * 0.9
        }
      );
      floatTweens.push(tw);
    });
  }

  /* Person image very subtle scale breathe */
  function startPersonFloat() {
    if (!person) return;
    var tw = gsap.fromTo(person,
      { scale: 1 },
      {
        scale   : 1.025,
        duration: 5.0,
        ease    : 'sine.inOut',
        yoyo    : true,
        repeat  : -1,
        transformOrigin: 'center bottom'
      }
    );
    floatTweens.push(tw);
  }

  /* Badges float downward (y: 0 → 15) — spec: 0 → 15 → 0 */
  function startBadgeFloat() {
    badges.forEach(function(badge, i) {
      var tw = gsap.fromTo(badge,
        { y: 0 },
        {
          y       : 15,
          duration: 3.0 + i * 0.35,
          ease    : 'sine.inOut',
          yoyo    : true,
          repeat  : -1,
          delay   : i * 0.7    /* phase-stagger so they move independently */
        }
      );
      floatTweens.push(tw);
    });
  }

  /* ── Pause floats when section scrolls off-screen ─────────── */
  if (section) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        floatTweens.forEach(function(tw) {
          if (entry.isIntersecting) { tw.resume(); }
          else                       { tw.pause();  }
        });
      });
    }, { threshold: 0.05 });

    io.observe(section);
  }
}



/* =================================================================
   FAQ SECTION  —  initFAQ()
   ─────────────────────────────────────────────────────────────
   Three responsibilities:

   1. CUSTOM ACCORDION
      Pure vanilla JS — no Bootstrap JS loaded on this page.
      Each .faq-q button toggles its sibling .faq-a panel.
      Height animation: max-height transition (CSS 0.38s).
      Only one item open at a time (close others on open).
      aria-expanded kept in sync for accessibility.

   2. ENTRANCE ANIMATIONS (GSAP + ScrollTrigger, once:true)
      .faq-visual — slides from x:-40 + fade, triggers at 'top 72%'
      .faq-item   — each staggered y:24 + fade, trigger at 'top 82%'
      Both fire once. prefers-reduced-motion guard skips both.

   3. LEFT PANEL STICKY FLOAT
      A gentle GSAP yoyo on .faq-visual__img (y: 0 → -10 → 0)
      starts after the entrance animation completes.
      IntersectionObserver pauses/resumes to save CPU off-screen.
      The CSS position:sticky does the actual pinning —
      GSAP only adds the subtle idle float on the image.

   No new libraries. No scrub. No pin:true ScrollTrigger
   (CSS sticky is sufficient and avoids the spacer-div side effects
   that affected the HIW section).
================================================================= */

function initFAQ() {
  'use strict';

  var section = document.getElementById('faq');
  var visual  = document.getElementById('faqVisual');
  var list    = document.getElementById('faqList');

  if (!section) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth <= 991;

  /* ═══════════════════════════════════════════════════════════
     1. CUSTOM ACCORDION
     ─────────────────────────────────────────────────────────
     .faq-a starts with max-height:0 (CSS).
     Opening: remove [hidden], then set max-height to scrollHeight.
     Closing: set max-height:0, restore [hidden] after transition.
  ═══════════════════════════════════════════════════════════ */

  var items   = Array.from(section.querySelectorAll('.faq-item'));
  var buttons = Array.from(section.querySelectorAll('.faq-q'));

  function openItem(btn) {
    var panelId = btn.getAttribute('aria-controls');
    var panel   = document.getElementById(panelId);
    if (!panel) return;

    btn.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');
    /* Force a layout read so the transition fires from 0 */
    panel.getBoundingClientRect();
    panel.style.maxHeight = panel.scrollHeight + 'px';
    panel.classList.add('is-open');
  }

  function closeItem(btn) {
    var panelId = btn.getAttribute('aria-controls');
    var panel   = document.getElementById(panelId);
    if (!panel) return;

    btn.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0';
    panel.classList.remove('is-open');

    /* Re-apply [hidden] after transition completes so keyboard
       focus skips the collapsed content */
    panel.addEventListener('transitionend', function onEnd() {
      panel.removeEventListener('transitionend', onEnd);
      if (panel.style.maxHeight === '0px') {
        panel.setAttribute('hidden', '');
      }
    });
  }

  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      /* Close all other items first */
      buttons.forEach(function(other) {
        if (other !== btn && other.getAttribute('aria-expanded') === 'true') {
          closeItem(other);
        }
      });

      if (isOpen) {
        closeItem(btn);
      } else {
        openItem(btn);
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════
     2. ENTRANCE ANIMATIONS
  ═══════════════════════════════════════════════════════════ */

  if (reduced) {
    /* Show everything immediately */
    if (visual) gsap.set(visual, { opacity: 1, x: 0, clearProps: 'all' });
    items.forEach(function(item) {
      gsap.set(item, { opacity: 1, y: 0, clearProps: 'all' });
    });
    startFloat();   /* float still runs even under reduced-motion? No — guard below */
    return;
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* Visual panel — slide from left */
  if (visual && !isMobile) {
    ScrollTrigger.create({
      trigger : visual,
      start   : 'top 72%',
      once    : true,
      onEnter : function() {
        gsap.to(visual, {
          opacity  : 1,
          x        : 0,
          duration : 0.85,
          ease     : 'power3.out',
          onComplete: startFloat
        });
      }
    });
  } else if (visual) {
    /* Mobile: just show it */
    gsap.set(visual, { opacity: 1, x: 0, clearProps: 'transform' });
  }

  /* FAQ items — stagger from y:24 */
  if (list) {
    ScrollTrigger.create({
      trigger : list,
      start   : 'top 82%',
      once    : true,
      onEnter : function() {
        gsap.to(items, {
          opacity  : 1,
          y        : 0,
          duration : 0.6,
          ease     : 'power3.out',
          stagger  : 0.08,
          clearProps: 'transform'
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     3. PRODUCT IMAGE FLOAT
     Gentle yoyo on the bottle image only — same technique as
     bnf-bottle (y: 0 → -10 → 0, sine.inOut, repeat -1).
     IntersectionObserver pauses when section is off-screen.
  ═══════════════════════════════════════════════════════════ */

  var floatTween = null;

  function startFloat() {
    if (reduced) return;
    var img = visual ? visual.querySelectorAll('.faq-visual__img') : null;
    if (!img) return;

    floatTween = gsap.fromTo(img,
      { y: 0 },
      {
        y       : -10,
        duration: 3.8,
        ease    : 'sine.inOut',
        yoyo    : true,
        repeat  : -1
      }
    );
  }

  /* Pause float when section is out of view */
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!floatTween) return;
      if (entry.isIntersecting) { floatTween.resume(); }
      else                       { floatTween.pause();  }
    });
  }, { threshold: 0.05 });

  if (section) io.observe(section);
}





/* ══════════════════════════════════════════════════════════
   LAB EQUIPMENT BACKGROUND — initDnaBg()
   ─────────────────────────────────────────────────────────
   Pure Canvas 2D + native requestAnimationFrame.
   Replaces the DNA helix animation with laboratory
   equipment visuals: Erlenmeyer flasks, test tubes,
   rising bubbles, and drifting particles — all at low
   opacity so text content remains the clear focal point.

   ① Two Erlenmeyer flasks (left + right) — subtle float
      + gentle tilt, liquid fill + rising bubble columns.
   ② Two test tubes (inner left + inner right) — slow
      rotation yoyo and droplet drip animation.
   ③ 15 lone drifting particles (was 12 — 3 added).
   ④ IntersectionObserver pauses rAF when off-screen.
══════════════════════════════════════════════════════════ */
function initDnaBg() {

  var canvas  = document.getElementById('dnaBgCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var section = canvas.closest('section');
  if (!section) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ── Brand colour ─────────────────────────────────────────────
  var C  = '37,99,235';   // #2563eb — blue
  var CL = '99,163,255';  // lighter blue for liquid fills

  // ── Live dimensions ──────────────────────────────────────────
  var W = 0, H = 0, mobile = false;

  function resize() {
    var r = section.getBoundingClientRect();
    W = Math.round(r.width  || section.offsetWidth);
    H = Math.round(r.height || section.offsetHeight);
    canvas.width  = W;
    canvas.height = H;
    mobile = W < 768;
  }
  resize();

  var rsTimer;
  window.addEventListener('resize', function () {
    clearTimeout(rsTimer);
    rsTimer = setTimeout(resize, 150);
  }, { passive: true });


  /* ══════════════════════════════════════════════════════
     LAB EQUIPMENT DEFINITIONS
     Each piece of equipment is a plain data object.
     All positions are fractional (0–1) of W/H so they
     scale correctly at any viewport width.
  ══════════════════════════════════════════════════════ */

  // ── Erlenmeyer flask definitions ─────────────────────
  // Left flask  : left-center of section (behind stats row)
  // Right flask : right-center (has the pouring interaction)
  // fy ~0.52 keeps them vertically centred in the section,
  // sitting behind the statistics row as subtle bg elements.
  // scale 1.15 keeps them visually recessed vs foreground text.
  var flasks = [
    {
      // LEFT — normal beaker with rising bubbles
      fx: 0.10, fy: 0.56,
      scale: 1.15,
      fillRatio: 0.48,
      pour: false,
      bubbles: [
        { ox: -18, cycleMs: 2600, size: 2.8, phase: 0.0  },
        { ox:  -6, cycleMs: 3200, size: 2.2, phase: 0.9  },
        { ox:   4, cycleMs: 2000, size: 3.2, phase: 1.8  },
        { ox:  14, cycleMs: 3600, size: 1.8, phase: 2.6  },
        { ox:  22, cycleMs: 2800, size: 2.5, phase: 3.4  },
      ],
    },
    {
      // RIGHT — receiving flask; pouring scene above it
      fx: 0.90, fy: 0.52,
      scale: 1.15,
      fillRatio: 0.38,
      pour: true,
      bubbles: [
        { ox: -20, cycleMs: 2400, size: 2.6, phase: 1.2  },
        { ox:  -7, cycleMs: 2900, size: 2.0, phase: 2.5  },
        { ox:   5, cycleMs: 3300, size: 3.0, phase: 0.7  },
        { ox:  16, cycleMs: 2100, size: 1.9, phase: 3.1  },
        { ox:  24, cycleMs: 3500, size: 2.3, phase: 1.9  },
      ],
    },
  ];



  /* ══════════════════════════════════════════════════════
     DRAW HELPERS
  ══════════════════════════════════════════════════════ */

  // ── Draw one Erlenmeyer flask ────────────────────────
  // cx, cy : centre of the flat base (bottom anchor)
  // sc     : scale multiplier
  // fill   : 0-1 fill ratio
  // t      : current timestamp ms (drives bubbles + wave)
  // def    : flask definition object (bubbles array)
  function drawFlask(cx, cy, sc, fill, t, def) {
    ctx.save();
    ctx.translate(cx, cy);

    var bW   = 60  * sc;   // body half-width
    var bH   = 16  * sc;   // base height
    var nW   = 10  * sc;   // neck half-width
    var nH   = 38  * sc;   // neck height
    var shH  = 72  * sc;   // shoulder/body height
    var totalH = bH + shH + nH;

    var bY   = 0;
    var shY  = -(bH + shH);   // neck start (top of shoulder)
    var nTop = shY - nH;      // neck top / mouth

    // ── Clip: full flask interior ─────────────────────────────
    ctx.beginPath();
    ctx.moveTo(-bW, bY);
    ctx.lineTo( bW, bY);
    ctx.quadraticCurveTo( bW, -bH,  nW, shY);
    ctx.lineTo( nW, nTop);
    ctx.lineTo(-nW, nTop);
    ctx.lineTo(-nW, shY);
    ctx.quadraticCurveTo(-bW, -bH, -bW, bY);
    ctx.closePath();
    ctx.save();
    ctx.clip();

    // ── Liquid fill gradient ──────────────────────────────────
    var liquidTopY = bY - totalH * fill;
    var lGrad = ctx.createLinearGradient(0, liquidTopY, 0, bY);
    lGrad.addColorStop(0,   'rgba(' + CL + ', 0.25)');
    lGrad.addColorStop(0.5, 'rgba(' + C  + ', 0.20)');
    lGrad.addColorStop(1,   'rgba(' + C  + ', 0.28)');
    ctx.fillStyle = lGrad;
    ctx.fillRect(-bW, liquidTopY, bW * 2, bY - liquidTopY);

    // ── Animated surface wave ─────────────────────────────────
    var waveT    = t * 0.0022;
    var waveAmp  = 2.2 * sc;
    var waveFreq = (Math.PI * 2) / (bW * 1.6);
    ctx.beginPath();
    var sx = -bW * 0.9;
    var ex =  bW * 0.9;
    for (var wx = sx; wx <= ex; wx += 2) {
      var wy = liquidTopY + Math.sin(wx * waveFreq + waveT) * waveAmp;
      if (wx === sx) ctx.moveTo(wx, wy);
      else           ctx.lineTo(wx, wy);
    }
    ctx.strokeStyle = 'rgba(' + CL + ', 0.55)';
    ctx.lineWidth   = 1.1;
    ctx.stroke();

    // ── Bubbles rising through the liquid ─────────────────────
    var liquidH = bY - liquidTopY;
    def.bubbles.forEach(function (b) {
      // cyclePos 0 = base, 1 = liquid surface
      var cyclePos = ((t + b.phase * 1000) % b.cycleMs) / b.cycleMs;
      var bYpos    = bY - cyclePos * liquidH;
      // Horizontal wobble increases as bubble rises
      var wobble   = Math.sin(cyclePos * Math.PI * 5 + b.phase) * 3 * sc;
      var bXpos    = b.ox * sc + wobble;

      // Opacity: fades in quickly at bottom, fades out near surface
      var fadeIn   = Math.min(cyclePos * 10, 1);
      var fadeOut  = Math.max(1 - Math.max(cyclePos - 0.72, 0) * 3.5, 0);
      var alpha    = fadeIn * fadeOut * 0.65;

      if (alpha > 0.01) {
        var r = b.size * sc;
        // Filled bubble body
        ctx.beginPath();
        ctx.arc(bXpos, bYpos, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + CL + ',' + (alpha * 0.55) + ')';
        ctx.fill();
        // Bubble outline ring (more visible than fill alone)
        ctx.beginPath();
        ctx.arc(bXpos, bYpos, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + CL + ',' + alpha + ')';
        ctx.lineWidth   = 0.9;
        ctx.stroke();
        // Tiny specular dot (top-left of bubble)
        ctx.beginPath();
        ctx.arc(bXpos - r * 0.32, bYpos - r * 0.30, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.7) + ')';
        ctx.fill();
      }
    });

    ctx.restore(); // release clip

    // ── Glass outline ─────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(-bW, bY);
    ctx.lineTo( bW, bY);
    ctx.quadraticCurveTo( bW, -bH,  nW, shY);
    ctx.lineTo( nW, nTop);
    ctx.lineTo(-nW, nTop);
    ctx.lineTo(-nW, shY);
    ctx.quadraticCurveTo(-bW, -bH, -bW, bY);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(' + C + ', 0.28)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // ── Neck mouth rim ────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(-nW - 4 * sc, nTop);
    ctx.lineTo( nW + 4 * sc, nTop);
    ctx.strokeStyle = 'rgba(' + C + ', 0.32)';
    ctx.lineWidth   = 2.4 * sc;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // ── Glass highlight streak ────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(-bW * 0.55, -bH - shH * 0.80);
    ctx.quadraticCurveTo(-bW * 0.44, -bH - shH * 0.38, -nW * 1.05, shY + 4 * sc);
    ctx.strokeStyle = 'rgba(255,255,255, 0.10)';
    ctx.lineWidth   = 3.5 * sc;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // ── Steam wisps above mouth ───────────────────────────────
    def.bubbles.forEach(function (b, bi) {
      var cyclePos = ((t + b.phase * 1000) % b.cycleMs) / b.cycleMs;
      // Only render in upper 30% of cycle (above neck)
      if (cyclePos < 0.70) return;
      var wp = (cyclePos - 0.70) / 0.30;   // 0 -> 1 as wisp rises above neck
      var wX = b.ox * sc + Math.sin(wp * Math.PI * 2.5 + bi) * 6 * sc;
      var wY = nTop - wp * 24 * sc;
      var wA = (1 - wp) * 0.20;
      if (wA > 0.01) {
        ctx.beginPath();
        ctx.arc(wX, wY, b.size * sc * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + CL + ',' + wA + ')';
        ctx.fill();
      }
    });

    ctx.restore(); // translate
  }


  // ── drawPouring(cx, cy, sc, t) ───────────────────────
  // Draws a tilted test-tube above-right of the flask neck,
  // a continuous liquid stream falling from its tip into the
  // flask mouth, and small splash/droplet particles at the
  // impact point.
  //
  // cx, cy : flask base centre (same origin as drawFlask)
  // sc     : same scale multiplier as the parent flask
  // t      : current rAF timestamp in ms
  function drawPouring(cx, cy, sc, t) {

    // ── Flask geometry (mirrors drawFlask, read-only) ─────────
    var bH  = 16 * sc;
    var nW  = 10 * sc;
    var nH  = 38 * sc;
    var shH = 72 * sc;
    var nTop = -(bH + shH) - nH;   // y of flask mouth (relative to cx,cy)

    // ── Tube geometry ─────────────────────────────────────────
    // Tube tip is positioned above and to the right of the mouth.
    // tiltAngle: how far the tube is rotated (positive = clockwise)
    var tiltAngle = 0.62;           // ~35° tilt
    var tubeLen   = 44 * sc;        // tube body length
    var tubeR     = 6  * sc;        // tube inner radius
    // Tube pivot point (mouth of the tube = where liquid exits)
    // Offset from the flask's base origin
    var pivX = cx + 22 * sc;
    var pivY = cy + nTop - 28 * sc; // above flask neck

    ctx.save();

    // ── 1. Draw the tilted test tube ──────────────────────────
    ctx.save();
    ctx.translate(pivX, pivY);
    ctx.rotate(tiltAngle);

    // Tube body clip path
    ctx.beginPath();
    ctx.moveTo(-tubeR, 0);
    ctx.lineTo(-tubeR, -tubeLen);
    ctx.arc(0, -tubeLen, tubeR, Math.PI, 0);
    ctx.lineTo(tubeR, 0);
    ctx.closePath();
    ctx.save();
    ctx.clip();

    // Liquid fill inside the tube (top 60%)
    var tubeFillY = -tubeLen * 0.55;
    var tGrad = ctx.createLinearGradient(0, tubeFillY, 0, 0);
    tGrad.addColorStop(0,   'rgba(' + CL + ', 0.22)');
    tGrad.addColorStop(1,   'rgba(' + C  + ', 0.28)');
    ctx.fillStyle = tGrad;
    ctx.fillRect(-tubeR, tubeFillY, tubeR * 2, -tubeFillY);

    // Liquid surface shimmer
    ctx.beginPath();
    ctx.moveTo(-tubeR * 0.75, tubeFillY);
    ctx.lineTo( tubeR * 0.75, tubeFillY);
    ctx.strokeStyle = 'rgba(' + CL + ', 0.40)';
    ctx.lineWidth   = 0.9;
    ctx.stroke();

    ctx.restore(); // release tube clip

    // Tube outline
    ctx.beginPath();
    ctx.moveTo(-tubeR, 0);
    ctx.lineTo(-tubeR, -tubeLen);
    ctx.arc(0, -tubeLen, tubeR, Math.PI, 0);
    ctx.lineTo(tubeR, 0);
    ctx.strokeStyle = 'rgba(' + C + ', 0.24)';
    ctx.lineWidth   = 1.2;
    ctx.stroke();

    // Tube mouth rim
    ctx.beginPath();
    ctx.moveTo(-tubeR - 2 * sc, 0);
    ctx.lineTo( tubeR + 2 * sc, 0);
    ctx.strokeStyle = 'rgba(' + C + ', 0.28)';
    ctx.lineWidth   = 1.8 * sc;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Glass highlight on tube
    ctx.beginPath();
    ctx.moveTo(-tubeR * 0.5, -4 * sc);
    ctx.lineTo(-tubeR * 0.5, -tubeLen * 0.7);
    ctx.strokeStyle = 'rgba(255,255,255, 0.09)';
    ctx.lineWidth   = 2 * sc;
    ctx.lineCap     = 'round';
    ctx.stroke();

    ctx.restore(); // tube translate+rotate

    // ── 2. Liquid stream from tube tip to flask mouth ─────────
    // The stream runs from pivX,pivY (tube tip, after rotation)
    // down to the flask neck opening.
    // We add a subtle side-sway so it looks fluid, not rigid.

    // Stream endpoint: centre of flask neck mouth (canvas coords)
    var endX = cx;
    var endY = cy + nTop;

    // Stream sway — very gentle, sine-driven
    var swayAmp  = 3 * sc;
    var swayT    = t * 0.0014;
    var midX     = (pivX + endX) / 2 + Math.sin(swayT) * swayAmp;
    var midY     = (pivY + endY) / 2;

    // Stream itself: two parallel bezier lines for a ribbon effect
    var sw = 1.8 * sc;   // half-width of the liquid ribbon
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pivX - sw, pivY);
    ctx.quadraticCurveTo(midX - sw, midY, endX - sw * 0.5, endY);
    ctx.lineTo(endX + sw * 0.5, endY);
    ctx.quadraticCurveTo(midX + sw, midY, pivX + sw, pivY);
    ctx.closePath();
    var sGrad = ctx.createLinearGradient(pivX, pivY, endX, endY);
    sGrad.addColorStop(0,   'rgba(' + CL + ', 0.45)');
    sGrad.addColorStop(0.5, 'rgba(' + C  + ', 0.30)');
    sGrad.addColorStop(1,   'rgba(' + CL + ', 0.20)');
    ctx.fillStyle = sGrad;
    ctx.fill();
    ctx.restore();

    // ── 3. Falling droplets along the stream ─────────────────
    // Four droplets at different progress positions (0→1 = top→bottom).
    // Each has its own cycle so they're always staggered.
    var DROP_COUNT = 4;
    var dropCycleMs = 1800;
    for (var di = 0; di < DROP_COUNT; di++) {
      var dPhaseMs = di * (dropCycleMs / DROP_COUNT);
      var dPos     = ((t + dPhaseMs) % dropCycleMs) / dropCycleMs; // 0→1

      // Interpolate position along the bezier (linear approximation)
      var dX = pivX + (endX - pivX) * dPos + Math.sin(swayT + di * 1.2) * swayAmp * dPos;
      var dY = pivY + (endY - pivY) * dPos;

      // Droplet fades in, then fades out at impact
      var dA = Math.min(dPos * 5, 1) * Math.max(1 - (dPos - 0.75) * 4, 0) * 0.60;
      if (dA > 0.01) {
        var dR = (1.6 + di * 0.3) * sc;
        ctx.beginPath();
        ctx.arc(dX, dY, dR, 0, Math.PI * 2);
        ctx.fillStyle   = 'rgba(' + CL + ',' + (dA * 0.6) + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dX, dY, dR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + CL + ',' + dA + ')';
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      }
    }

    // ── 4. Splash / impact particles at flask mouth ───────────
    // Six tiny particles that radiate outward from the impact
    // point in a continuous loop, fading as they travel.
    var SPLASH = 6;
    var splashCycleMs = 1200;
    for (var si = 0; si < SPLASH; si++) {
      var sPhaseMs  = si * (splashCycleMs / SPLASH);
      var sPos      = ((t + sPhaseMs) % splashCycleMs) / splashCycleMs; // 0→1
      // Angle: fan out around the mouth, biased left-right
      var sAngle    = -Math.PI * 0.8 + si * (Math.PI * 1.6 / (SPLASH - 1));
      var sDist     = sPos * 14 * sc;
      var sX        = endX + Math.cos(sAngle) * sDist;
      var sY        = endY + Math.sin(sAngle) * sDist - sPos * 4 * sc; // slight upward arc
      var sA        = Math.max(0, (1 - sPos) * 0.45);

      if (sA > 0.01) {
        var sR = (1.2 + (si % 3) * 0.4) * sc;
        ctx.beginPath();
        ctx.arc(sX, sY, sR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + CL + ',' + sA + ')';
        ctx.fill();
      }
    }

    ctx.restore(); // outer save
  }

  /* ══════════════════════════════════════════════════════
     LONE DRIFTING PARTICLES  (15 total — was 12)
     3 extra particles added at mid-section positions
     to make the background slightly richer.
  ══════════════════════════════════════════════════════ */
  var particles = (function () {
    var raw = [
      // ── original 12 ───────────────────────────────────
      [0.28, 0.10], [0.44, 0.07], [0.62, 0.05], [0.76, 0.12],
      [0.35, 0.91], [0.56, 0.95], [0.70, 0.89], [0.84, 0.93],
      [0.17, 0.48], [0.93, 0.42], [0.47, 0.55], [0.80, 0.60],
      // ── 3 new particles ────────────────────────────────
      [0.38, 0.30], [0.60, 0.72], [0.52, 0.18],
    ];
    return raw.map(function (p, i) {
      return {
        fx: p[0], fy: p[1],
        r:  1.8 + (i % 3) * 0.9,
        a:  0.13 + (i % 4) * 0.04,
        px: i * 1.1,  py: i * 0.8,
        sx: 0.00016 + i * 0.000019,
        sy: 0.00013 + i * 0.000015,
        ax: 9  + (i % 5) * 3,
        ay: 11 + (i % 4) * 4,
      };
    });
  }());

  function drawParticles(t) {
    particles.forEach(function (p) {
      var x = W * p.fx + Math.sin(t * p.sx + p.px) * p.ax;
      var y = H * p.fy + Math.sin(t * p.sy + p.py) * p.ay;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + C + ',' + p.a + ')';
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }


  /* ══════════════════════════════════════════════════════
     MAIN RENDER LOOP
  ══════════════════════════════════════════════════════ */
  var raf     = null;
  var running = false;

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // ── Drifting particles — completely unchanged ─────────────
    drawParticles(t);

    // ── Scale: slightly smaller on mobile ────────────────────
    var sc = W < 600 ? 0.75 : 1.0;

    // ── Draw each flask at its left/right position ────────────
    flasks.forEach(function (f) {
      var cx = W * f.fx;
      var cy = H * f.fy;

      // Draw the beaker with its liquid and rising bubbles
      drawFlask(cx, cy, sc * f.scale, f.fillRatio, t, f);

      // Right flask only: draw the pouring scene above it
      if (f.pour) {
        drawPouring(cx, cy, sc * f.scale, t);
      }
    });

    raf = requestAnimationFrame(draw);
  }

  // ── IntersectionObserver: pause when off-screen ──────────────
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(draw);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
  }, { threshold: 0.05 });

  io.observe(section);
}










/* ══════════════════════════════════════════════════════════════
   BENEFITS SECTION — ATOM ORBITAL ANIMATION
   initBnfAtom()
   ──────────────────────────────────────────────────────────────
   Animates the .bnf-atom SVG that sits behind the product bottle:

   1. ORBIT GROUP ROTATION — each <g> group slowly rotates,
      spinning the orbit ring plane. Three different speeds so
      the three rings never synchronise and always look distinct.

   2. ELECTRON PARAMETRIC MOTION — each electron (SVG <circle>)
      travels along its elliptical orbit using a proxy object
      with an "angle" property. onUpdate recalculates cx/cy
      from the ellipse equation and sets SVG attributes directly.
      This avoids needing MotionPathPlugin.

      Electron orbit equation (in local <g> space before rotation):
        cx = groupCx + rx * cos(angle)
        cy = groupCy + ry * sin(angle)
      where groupCx/Cy = 200, rx = 165, ry = 52.

   3. NUCLEUS PULSE — gentle scale oscillation on the nucleus
      ring, subtle breathing effect.

   4. PARTICLE FLOAT — each micro-particle drifts upward slowly
      with yoyo, staggered delays for organic feel.

   5. IntersectionObserver pauses all tweens when the benefits
      section scrolls off-screen — zero GPU cost when not visible.

   6. prefers-reduced-motion: exits immediately (SVG hidden by CSS).

   Called from DOMContentLoaded. No scroll-trigger dependency.
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   BENEFITS SECTION — ATOM ORBITAL ANIMATION
   initBnfAtom()
   ──────────────────────────────────────────────────────────────
   Animates the .bnf-atom SVG that sits behind the product bottle:

   1. ORBIT GROUP ROTATION — each <g> group slowly rotates,
      spinning the orbit ring plane. Three different speeds so
      the three rings never synchronise and always look distinct.

   2. ELECTRON PARAMETRIC MOTION — each electron (SVG <circle>)
      travels along its elliptical orbit using a proxy object
      with an "angle" property. onUpdate recalculates cx/cy
      from the ellipse equation and sets SVG attributes directly.
      This avoids needing MotionPathPlugin.

      Electron orbit equation (in local <g> space before rotation):
        cx = groupCx + rx * cos(angle)
        cy = groupCy + ry * sin(angle)
      where groupCx/Cy = 200, rx = 165, ry = 52.

   3. NUCLEUS PULSE — gentle scale oscillation on the nucleus
      ring, subtle breathing effect.

   4. PARTICLE FLOAT — each micro-particle drifts upward slowly
      with yoyo, staggered delays for organic feel.

   5. IntersectionObserver pauses all tweens when the benefits
      section scrolls off-screen — zero GPU cost when not visible.

   6. prefers-reduced-motion: exits immediately (SVG hidden by CSS).

   Called from DOMContentLoaded. No scroll-trigger dependency.
══════════════════════════════════════════════════════════════ */
function initBnfAtom() {
  'use strict';

  /* ── Guards ─────────────────────────────────────────────── */
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Animate every .bnf-atom SVG on the page independently ──
     Fixes the multi-instance problem: querySelector only found
     the first SVG; getElementById returned first-match IDs only.
     Now we loop over all instances and scope everything to each SVG.
  ──────────────────────────────────────────────────────────── */
  var allSvgs = document.querySelectorAll('.bnf-atom');
  if (!allSvgs.length) return;

  /* Config arrays — shared across all instances */
  var CX = 200, CY = 200, RX = 165, RY = 52;

  var orbitConfig = [
    { duration: 22, direction:  1 },
    { duration: 34, direction: -1 },
    { duration: 28, direction:  1 },
  ];

  var electronConfig = [
    { startAngle: 0,    duration: 12, direction:  1 },
    { startAngle: 2.09, duration: 16, direction: -1 },
    { startAngle: 4.19, duration: 14, direction:  1 },
  ];

  var particleFloats = [8, -10, 6, -12, 9, -7];
  var particleDurs   = [6.0, 7.5, 5.5, 8.0, 6.8, 7.2];
  var particleDelay  = [0, 1.2, 2.6, 0.8, 3.1, 1.8];

  allSvgs.forEach(function (svg) {

    /* Collect elements scoped to THIS svg */
    var orbitGroups = svg.querySelectorAll('.bnf-atom__orbit-group');
    var electrons   = svg.querySelectorAll('.bnf-atom__electron');
    var nucleusRing = svg.querySelector('.bnf-atom__nucleus-ring');
    var particles   = svg.querySelectorAll('.bnf-atom__particle');

    var tweens = [];

    /* 1. ORBIT GROUP ROTATION */
    orbitGroups.forEach(function (group, i) {
      var cfg = orbitConfig[i];
      var tw = gsap.to(group, {
        rotation : cfg.direction * 360,
        svgOrigin: '200 200',
        duration : cfg.duration,
        ease     : 'none',
        repeat   : -1,
        paused   : true,
      });
      tweens.push(tw);
    });

    /* 2. ELECTRON PARAMETRIC MOTION
       Each electron is found via querySelectorAll scoped to this SVG —
       no getElementById, no cross-instance ID collisions. */
    electrons.forEach(function (elec, i) {
      var cfg = electronConfig[i];
      if (!cfg) return;
      var proxy    = { angle: cfg.startAngle };
      var endAngle = cfg.startAngle + cfg.direction * Math.PI * 2;

      var tw = gsap.to(proxy, {
        angle    : endAngle,
        duration : cfg.duration,
        ease     : 'none',
        repeat   : -1,
        paused   : true,
        onUpdate : (function (e, p) {
          return function () {
            var cx = CX + RX * Math.cos(p.angle);
            var cy = CY + RY * Math.sin(p.angle);
            e.setAttribute('cx', cx.toFixed(3));
            e.setAttribute('cy', cy.toFixed(3));
          };
        }(elec, proxy)),
      });
      tweens.push(tw);
    });

    /* 3. NUCLEUS PULSE */
    if (nucleusRing) {
      var nTw = gsap.to(nucleusRing, {
        scale    : 1.35,
        opacity  : 0.22,
        svgOrigin: '200 200',
        duration : 3.2,
        ease     : 'sine.inOut',
        yoyo     : true,
        repeat   : -1,
        paused   : true,
      });
      tweens.push(nTw);
    }

    /* 4. PARTICLE FLOAT */
    particles.forEach(function (p, i) {
      var tw = gsap.to(p, {
        y       : particleFloats[i] || -8,
        duration: particleDurs[i]   || 6.5,
        ease    : 'sine.inOut',
        yoyo    : true,
        repeat  : -1,
        delay   : particleDelay[i] || 0,
        paused  : true,
      });
      tweens.push(tw);
    });

    /* 5. IntersectionObserver — observe the closest section ancestor.
       Pauses tweens when THIS atom's section scrolls off-screen. */
    var sectionAncestor = svg.closest('section') || svg.parentElement;
    if (sectionAncestor) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          tweens.forEach(function (tw) {
            if (entry.isIntersecting) { tw.resume(); } else { tw.pause(); }
          });
        });
      }, { threshold: 0.05 });
      io.observe(sectionAncestor);
    }

  }); /* end allSvgs.forEach */
}


