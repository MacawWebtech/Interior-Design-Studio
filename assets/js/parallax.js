/* ==========================================================================
   ATELIER FORMA · parallax.js
   Scroll-driven depth, all through requestAnimationFrame + translate3d.

   Attributes
   [data-depth="0.3"]        hero layers. +n moves slower than the page (background),
                             -n moves faster (foreground). Relative to the section top.
   [data-parallax-bg]        section whose .parallax-band__media drifts behind the content.
   [data-parallax-img]       .px wrapper inside a .frame; data-speed sets drift.
   [data-speed="0.15"]       floating decorative elements. +n = faster than the page
                             (closer), -n = slower (further away).
   [data-hmove="-0.3"]       horizontal drift of large typography.
   [data-hx]                 pinned hero that scrubs a --p variable from 0 to 1.
   [data-expand]             frame that opens from an arch to full width (--exp).
   [data-scrub-words]        paragraph whose words light up as you scroll.

   Only items inside (or near) the viewport are updated, effects are reduced on
   small screens and disabled for prefers-reduced-motion.
   ========================================================================== */
(() => {
  'use strict';

  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqMobile = window.matchMedia('(max-width: 767.98px)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d = 0) => { const n = parseFloat(v); return Number.isNaN(n) ? d : n; };

  let vh = window.innerHeight;
  let scrollY = window.pageYOffset;
  let ticking = false;
  const active = new Set();
  const items = [];

  const strength = () => (mqMobile.matches ? 0.4 : 1);
  const dirSign = () => (root.getAttribute('dir') === 'rtl' ? -1 : 1);
  const docTop = (el) => el.getBoundingClientRect().top + window.pageYOffset;
  const visible = (el) => el.getClientRects().length > 0;

  /* ------------------------------------------------------- reduced motion */
  const settleStatic = () => {
    $$('[data-hx]').forEach((s) => s.style.setProperty('--p', '1'));
    $$('[data-expand]').forEach((s) => s.style.setProperty('--exp', '1'));
    $$('[data-scrub-words]').forEach(splitWords);
    $$('.sw').forEach((w) => w.classList.add('is-lit'));
  };

  /* ---------------------------------------------------------- word scrub */
  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'sw';
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  /* ------------------------------------------------------------ register */
  const register = () => {
    items.length = 0;

    // Hero layers (relative to their section)
    $$('[data-depth]').forEach((el) => {
      const section = el.closest('section');
      items.push({ type: 'layer', el, section, depth: num(el.dataset.depth), fade: el.hasAttribute('data-hero-content') });
    });

    // Section background bands
    $$('[data-parallax-bg]').forEach((section) => {
      const media = section.querySelector('.parallax-band__media');
      if (media) items.push({ type: 'band', el: media, section });
    });

    // Images inside frames
    $$('[data-parallax-img]').forEach((el) => {
      items.push({ type: 'img', el, frame: el.parentElement, speed: num(el.dataset.speed, 0.07) });
    });

    // Floating elements and drifting columns
    $$('[data-speed]:not([data-parallax-img])').forEach((el) => {
      items.push({ type: 'float', el, speed: num(el.dataset.speed), center: 0 });
    });

    // Horizontal typography
    $$('[data-hmove]').forEach((el) => {
      items.push({ type: 'hmove', el, factor: num(el.dataset.hmove), center: 0 });
    });

    // Scrubbed sections
    $$('[data-hx]').forEach((el) => items.push({ type: 'hx', el }));
    $$('[data-expand]').forEach((el) => items.push({ type: 'expand', el }));
    $$('[data-scrub-words]').forEach((el) => { splitWords(el); items.push({ type: 'words', el, words: $$('.sw', el), lit: 0 }); });
  };

  const trackTarget = (it) => (it.type === 'layer' ? it.section || it.el : it.type === 'img' ? it.frame : it.type === 'band' ? it.section : it.el);

  /* ------------------------------------------------------------- measure */
  const measure = () => {
    vh = window.innerHeight;
    scrollY = window.pageYOffset;
    // reset transforms so measurements are made on the untransformed layout
    items.forEach((it) => { if (it.type === 'float' || it.type === 'hmove') it.el.style.transform = ''; });
    items.forEach((it) => {
      if (it.type === 'float' || it.type === 'hmove') {
        const r = it.el.getBoundingClientRect();
        it.center = r.top + window.pageYOffset + r.height / 2;
      }
      if (it.type === 'layer' && it.section) it.top = docTop(it.section);
      if (it.type === 'hx') { it.top = docTop(it.el); it.range = Math.max(1, it.el.offsetHeight - vh); }
    });
  };

  /* -------------------------------------------------------------- update */
  const update = () => {
    ticking = false;
    scrollY = window.pageYOffset;
    const k = strength();
    const sign = dirSign();

    active.forEach((it) => {
      const el = it.el;
      switch (it.type) {
        case 'layer': {
          if (!visible(el)) break;
          const isHx = Boolean(el.closest('[data-hx]'));
          const sec = it.section;
          const maxRange = isHx ? Math.max(1, sec.offsetHeight - vh) : sec.offsetHeight;
          const offset = clamp(scrollY - (it.top || 0), 0, maxRange);
          const y = offset * it.depth * (it.depth < 0 ? Math.min(1, k + 0.3) : k);
          el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
          if (it.fade) {
            const o = 1 - clamp(offset / (vh * 0.75), 0, 1);
            el.style.opacity = o.toFixed(3);
          }
          break;
        }
        case 'band': {
          if (!visible(it.section)) break;
          const r = it.section.getBoundingClientRect();
          const dist = r.top + r.height / 2 - vh / 2;
          const limit = r.height * (mqMobile.matches ? 0.07 : 0.13);
          const y = clamp(-dist * 0.14 * k, -limit, limit);
          el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
          break;
        }
        case 'img': {
          const r = it.frame.getBoundingClientRect();
          const dist = r.top + r.height / 2 - vh / 2;
          const limit = r.height * 0.075;
          const y = clamp(-dist * it.speed * k, -limit, limit);
          el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
          break;
        }
        case 'float': {
          if (!visible(el)) break;
          const d = it.center - (scrollY + vh / 2);
          el.style.transform = `translate3d(0, ${(d * it.speed * k).toFixed(1)}px, 0)`;
          break;
        }
        case 'hmove': {
          const d = it.center - (scrollY + vh / 2);
          el.style.transform = `translate3d(${(d * it.factor * sign * (mqMobile.matches ? 0.5 : 1)).toFixed(1)}px, 0, 0)`;
          break;
        }
        case 'hx': {
          if (mqMobile.matches || window.innerWidth < 992) { el.style.setProperty('--p', '1'); break; }
          const p = clamp((scrollY - it.top) / it.range, 0, 1);
          el.style.setProperty('--p', p.toFixed(4));
          break;
        }
        case 'expand': {
          const r = el.getBoundingClientRect();
          const p = clamp((vh * 0.92 - r.top) / (vh * 0.62), 0, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.style.setProperty('--exp', eased.toFixed(4));
          break;
        }
        case 'words': {
          const r = el.getBoundingClientRect();
          const p = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.34), 0, 1);
          const lit = Math.round(p * it.words.length * 1.08);
          if (lit !== it.lit) {
            const [a, b] = lit > it.lit ? [it.lit, lit] : [lit, it.lit];
            for (let i = a; i < b; i += 1) if (it.words[i]) it.words[i].classList.toggle('is-lit', lit > it.lit);
            it.lit = lit;
          }
          break;
        }
        default: break;
      }
    });
  };

  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  /* ---------------------------------------------------- activity tracking */
  let io;
  const observe = () => {
    if (io) io.disconnect();
    active.clear();
    const map = new Map();
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        (map.get(e.target) || []).forEach((it) => { if (e.isIntersecting) active.add(it); else active.delete(it); });
      });
      request();
    }, { rootMargin: '25% 0px 25% 0px' });
    items.forEach((it) => {
      const t = it.type === 'hx' ? it.el : trackTarget(it);
      if (!t) return;
      if (!map.has(t)) { map.set(t, []); io.observe(t); }
      map.get(t).push(it);
    });
  };

  /* ---------------------------------------------------------------- init */
  const init = () => {
    if (mqReduce.matches) { settleStatic(); return; }
    register();
    measure();
    observe();
    window.addEventListener('scroll', request, { passive: true });
    let resizeTimer;
    const remeasure = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { measure(); request(); }, 150); };
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    window.addEventListener('af:layout', remeasure);
    window.addEventListener('af:dir', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    request();
  };
  mqReduce.addEventListener('change', () => window.location.reload());

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
