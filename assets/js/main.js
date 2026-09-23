/* ==========================================================================
   ATELIER FORMA · main.js
   UI behaviour: theme + RTL toggles, sticky header, reveals, counters,
   filters, journal search + pagination, form validation, sliders, gallery.
   Vanilla ES6+. Bootstrap's bundle provides Offcanvas, Dropdown, Modal, Collapse.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isRTL = () => root.getAttribute('dir') === 'rtl';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };

  /* ---------------------------------------------------------------- images */
  const FALLBACK_IMG = 'assets/images/placeholder.svg';
  const useFallback = (img) => {
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = FALLBACK_IMG;
  };
  document.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG') useFallback(e.target);
  }, true);
  const checkBrokenImages = () => $$('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && (img.currentSrc || img.src)) useFallback(img);
  });

  /* ----------------------------------------------------------------- theme */
  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    $$('[data-theme-toggle]').forEach((btn) => {
      const dark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.innerHTML = `<i class="bi bi-${dark ? 'sun' : 'moon-stars'}" aria-hidden="true"></i>`;
    });
  };
  const initTheme = () => {
    applyTheme(root.getAttribute('data-theme') || 'light');
    $$('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      store.set('af-theme', next);
      applyTheme(next);
    }));
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = (e) => { if (!store.get('af-theme')) applyTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', follow);
  };

  /* ------------------------------------------------------------------- RTL */
  let rtlFontsLoaded = false;
  const loadRtlFonts = () => {
    if (rtlFontsLoaded) return;
    rtlFontsLoaded = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600&family=Noto+Sans+Hebrew:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  };
  const applyDir = (dir) => {
    const rtl = dir === 'rtl';
    if (rtl) root.setAttribute('dir', 'rtl'); else root.removeAttribute('dir');
    const bs = $('#bs-css');
    if (bs) {
      const href = rtl ? bs.dataset.rtl : bs.dataset.ltr;
      if (href && bs.getAttribute('href') !== href) bs.setAttribute('href', href);
    }
    if (rtl) loadRtlFonts();
    $$('[data-rtl-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(rtl));
      btn.setAttribute('aria-label', rtl ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout');
    });
    window.dispatchEvent(new CustomEvent('af:dir', { detail: { dir } }));
  };
  const initRTL = () => {
    applyDir(isRTL() ? 'rtl' : 'ltr');
    $$('[data-rtl-toggle]').forEach((btn) => btn.addEventListener('click', () => {
      const next = isRTL() ? 'ltr' : 'rtl';
      store.set('af-dir', next);
      applyDir(next);
    }));
  };

  /* ---------------------------------------------- header, back-to-top, etc. */
  const initScrollUI = () => {
    const header = $('#siteHeader');
    const toTop = $$('[data-back-to-top]');
    const floatingTop = $('.back-to-top');
    const indicators = $$('[data-scroll-indicator]');
    const alwaysSolid = header && header.classList.contains('is-scrolled');
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.pageYOffset;
      if (header && !alwaysSolid) header.classList.toggle('is-scrolled', y > 40);
      if (floatingTop) floatingTop.classList.toggle('is-visible', y > 700);
      indicators.forEach((el) => el.classList.toggle('is-hidden', y > 80));
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    toTop.forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }));
  };

  const initMobileNav = () => {
    const el = $('#mobileNav');
    if (!el || !window.bootstrap) return;
    $$('a', el).forEach((a) => a.addEventListener('click', () => {
      const inst = window.bootstrap.Offcanvas.getInstance(el);
      if (inst) inst.hide();
    }));
    window.matchMedia('(min-width: 992px)').addEventListener('change', (e) => {
      if (e.matches) { const inst = window.bootstrap.Offcanvas.getInstance(el); if (inst) inst.hide(); }
    });
  };

  /* -------------------------------------------- text splitting + reveals */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'w';
            const inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  };

  const initReveals = () => {
    $$('[data-reveal="text"]').forEach(splitWords);
    const targets = $$('[data-reveal], [data-line-draw], [data-line-draw-svg]');
    if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-inview')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        io.unobserve(entry.target);   // play once: never re-trigger on scroll back
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((t) => io.observe(t));
  };

  /* --------------------------------------------------------------- counters */
  const initCounters = () => {
    const els = $$('[data-count]');
    if (!els.length) return;
    const format = (el, n) => (el.dataset.format === 'comma' ? n.toLocaleString('en-IN') : String(n));
    if (reduceMotion() || !('IntersectionObserver' in window)) return;   // final values already in the HTML
    els.forEach((el) => { el.textContent = format(el, 0); });
    const run = (el) => {
      const target = Number(el.dataset.count);
      const duration = 1800;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(el, Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  };

  /* -------------------------------------------------------- project filters */
  const initProjectFilter = () => {
    const grid = $('[data-filter-grid]');
    if (!grid) return;
    const items = $$('.pj', grid);
    const buttons = $$('[data-filter]');
    const status = $('[data-filter-status]');
    const empty = $('[data-empty]');
    const spans = (grid.dataset.spans || '6').split(',').map(Number);
    const labels = { all: 'all', residential: 'residential', commercial: 'commercial', hospitality: 'hospitality', retail: 'retail' };

    const apply = (cat, updateUrl) => {
      let n = 0;
      items.forEach((item) => {
        const show = cat === 'all' || item.dataset.category === cat;
        item.classList.toggle('is-hidden', !show);
        if (!show) return;
        const span = spans[n % spans.length];
        const wide = span >= 6;
        item.style.setProperty('--span', span);
        item.classList.toggle('pj--wide', wide);
        const frame = $('.frame', item);
        if (frame) frame.style.setProperty('--ar', wide ? '4 / 3' : '4 / 5');
        item.classList.remove('is-entering');
        void item.offsetWidth;            // restart the entrance animation
        item.classList.add('is-entering');
        n += 1;
      });
      buttons.forEach((b) => {
        const on = b.dataset.filter === cat;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      if (status) status.textContent = `Showing ${cat === 'all' ? 'all ' : ''}${n} ${cat === 'all' ? '' : labels[cat] + ' '}project${n === 1 ? '' : 's'}`;
      if (empty) empty.hidden = n > 0;
      if (updateUrl && window.history.replaceState) {
        const url = new URL(window.location.href);
        if (cat === 'all') url.searchParams.delete('cat'); else url.searchParams.set('cat', cat);
        window.history.replaceState({}, '', url);
      }
      window.dispatchEvent(new Event('af:layout'));
    };
    buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter, true)));
    const initial = new URLSearchParams(window.location.search).get('cat');
    if (initial && labels[initial]) apply(initial, false);
  };

  /* ---------------------------------------- journal: search, filter, pages */
  const initJournal = () => {
    const grid = $('[data-journal-grid]');
    if (!grid) return;
    const items = $$('[data-jr-item]', grid);
    const chips = $$('.chip[data-cat]');
    const input = $('#j-q');
    const form = $('[data-journal-search]');
    const status = $('[data-journal-status]');
    const empty = $('[data-empty]');
    const pager = $('[data-pagination]');
    const PER_PAGE = 6;
    const params = new URLSearchParams(window.location.search);
    const state = { cat: 'all', q: '', page: 1 };

    const cardData = items.map((item) => {
      const card = item.firstElementChild;
      return { item, cat: card.dataset.category, text: card.dataset.search || '' };
    });

    const render = (scroll) => {
      const q = state.q.trim().toLowerCase();
      const matches = cardData.filter((c) => (state.cat === 'all' || c.cat === state.cat) && (!q || c.text.includes(q)));
      const pages = Math.max(1, Math.ceil(matches.length / PER_PAGE));
      state.page = Math.min(state.page, pages);
      const start = (state.page - 1) * PER_PAGE;
      const visible = new Set(matches.slice(start, start + PER_PAGE));
      cardData.forEach((c) => { c.item.hidden = !visible.has(c); });
      chips.forEach((chip) => {
        const on = chip.dataset.cat === state.cat;
        chip.classList.toggle('is-active', on);
        chip.setAttribute('aria-pressed', String(on));
      });
      if (status) status.textContent = matches.length
        ? `Showing ${start + 1} to ${Math.min(start + PER_PAGE, matches.length)} of ${matches.length} article${matches.length === 1 ? '' : 's'}`
        : 'No articles found';
      if (empty) empty.hidden = matches.length > 0;
      buildPager(pages);
      window.dispatchEvent(new Event('af:layout'));
      if (scroll) grid.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    };

    const buildPager = (pages) => {
      if (!pager) return;
      pager.innerHTML = '';
      if (pages <= 1) return;
      const make = (label, page, opts = {}) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = label;
        if (opts.aria) b.setAttribute('aria-label', opts.aria);
        if (opts.disabled) b.disabled = true;
        if (opts.current) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', () => { state.page = page; render(true); });
        li.appendChild(b);
        pager.appendChild(li);
      };
      make('<i class="bi bi-chevron-left" aria-hidden="true"></i>', state.page - 1, { aria: 'Previous page', disabled: state.page === 1 });
      for (let p = 1; p <= pages; p += 1) make(String(p), p, { aria: `Page ${p}`, current: p === state.page });
      make('<i class="bi bi-chevron-right" aria-hidden="true"></i>', state.page + 1, { aria: 'Next page', disabled: state.page === pages });
    };

    chips.forEach((chip) => chip.addEventListener('click', () => { state.cat = chip.dataset.cat; state.page = 1; render(false); }));
    let timer;
    if (input) input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = input.value; state.page = 1; render(false); }, 160);
    });
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); state.q = input.value; state.page = 1; render(false); });

    const q0 = params.get('q'); const c0 = params.get('cat');
    if (q0 && input) { input.value = q0; state.q = q0; }
    if (c0 && chips.some((c) => c.dataset.cat === c0)) state.cat = c0;
    render(false);
  };

  /* ----------------------------------------------------------- validation */
  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Enter your full name.'),
    email: (v) => (!v.trim() ? 'Enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address, for example name@example.com.'),
    phone: (v) => {
      const digits = v.replace(/[\s\-().+]/g, '');
      if (!v.trim()) return 'Enter your phone number.';
      return /^\d{8,15}$/.test(digits) ? '' : 'Enter a valid phone number with country code, for example +91 98400 12345.';
    },
    type: (v) => (v ? '' : 'Select a project type.'),
    location: (v) => (v.trim().length >= 2 ? '' : 'Enter the project location.'),
    area: (v) => (Number(v) >= 100 ? '' : 'Enter the approximate area in square feet (100 or more).'),
    budget: (v) => (v ? '' : 'Select an estimated budget.'),
    start: (v) => {
      if (!v) return 'Choose a preferred start date.';
      const chosen = new Date(`${v}T00:00:00`);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return chosen >= today ? '' : 'Choose a start date from today onwards.';
    },
    message: (v) => (v.trim().length >= 20 ? '' : 'Tell us a little more about your project (at least 20 characters).'),
    consent: (_v, el) => (el.checked ? '' : 'Please confirm that we can contact you about this enquiry.'),
  };

  const setError = (field, message) => {
    const wrap = field.closest('.field');
    const err = $(`#${field.id}-error`);
    const bad = Boolean(message);
    if (wrap) wrap.classList.toggle('is-invalid', bad);
    field.setAttribute('aria-invalid', String(bad));
    if (err) err.textContent = message;
  };
  const validateField = (field) => {
    const fn = validators[field.name];
    if (!fn) return true;
    const msg = fn(field.value, field);
    setError(field, msg);
    return !msg;
  };

  const initContactForm = () => {
    const form = $('#enquiry-form');
    if (!form) return;
    const fields = $$('input, select, textarea', form).filter((f) => validators[f.name]);
    const start = $('#start', form);
    if (start) {
      const t = new Date();
      start.min = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    }
    fields.forEach((f) => {
      f.addEventListener('blur', () => { if (f.value || f.type === 'checkbox' || f.dataset.touched) { f.dataset.touched = '1'; validateField(f); } });
      const live = () => { if (f.dataset.touched || f.getAttribute('aria-invalid') === 'true') validateField(f); };
      f.addEventListener('input', live);
      f.addEventListener('change', () => { f.dataset.touched = '1'; validateField(f); });
    });
    const success = $('#form-success');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const results = fields.map((f) => { f.dataset.touched = '1'; return validateField(f); });
      const firstBad = fields.find((_f, i) => !results[i]);
      if (firstBad) { firstBad.focus(); return; }
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('Request failed');
        } catch (err) {
          if (success) {
            success.hidden = false;
            success.querySelector('h3').textContent = 'Something went wrong.';
            success.querySelector('p').textContent = 'We could not send your enquiry. Please try again, or email us directly.';
            success.focus();
          }
          return;
        }
      }
      form.reset();
      fields.forEach((f) => { delete f.dataset.touched; setError(f, ''); });
      if (success) { success.hidden = false; success.focus(); }
    });
  };

  const initNewsletters = () => {
    $$('[data-newsletter]').forEach((form) => {
      const input = $('input[type="email"]', form);
      const msg = $('.newsletter__msg', form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ok = validators.email(input.value) === '';
        input.setAttribute('aria-invalid', String(!ok));
        if (msg) {
          msg.classList.toggle('is-error', !ok);
          msg.textContent = ok ? 'Thank you. You are on the list.' : (input.value.trim() ? 'Enter a valid email address.' : 'Enter your email address.');
        }
        if (ok) form.reset(); else input.focus();
      });
    });
  };

  /* --------------------------------------------------------------- sliders */
  const initSliders = () => {
    $$('[data-h-slider]').forEach((slider) => {
      const track = $('.h-slider__track', slider);
      const prev = $('[data-h-prev]', slider);
      const next = $('[data-h-next]', slider);
      const bar = $('[data-h-progress]', slider);
      const section = slider.closest('section');
      const current = section ? $('[data-h-current]', section) : null;
      const total = section ? $('[data-h-total]', section) : null;
      const slides = Array.from(track.children);
      if (total) total.textContent = String(slides.length).padStart(2, '0');

      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        const pos = Math.abs(track.scrollLeft);
        if (bar) bar.parentElement.style.setProperty('--prog', Math.min(1, (track.clientWidth + pos) / track.scrollWidth).toFixed(3));
        if (prev) prev.disabled = pos < 4;
        if (next) next.disabled = pos > max - 4;
        if (current) {
          const step = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
          current.textContent = String(Math.min(slides.length, Math.round(pos / step) + 1)).padStart(2, '0');
        }
      };
      const go = (dir) => {
        const step = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
        track.scrollBy({ left: dir * step * (isRTL() ? -1 : 1), behavior: reduceMotion() ? 'auto' : 'smooth' });
      };
      if (prev) prev.addEventListener('click', () => go(-1));
      if (next) next.addEventListener('click', () => go(1));
      track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
      window.addEventListener('resize', update);
      window.addEventListener('af:dir', () => setTimeout(update, 60));
      update();

      // Mouse drag to scroll (touch already scrolls natively)
      let down = false; let startX = 0; let startLeft = 0; let moved = 0;
      track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
      });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
        if (moved > 6) { track.classList.add('is-dragging'); track.scrollLeft = startLeft - dx; }
      });
      const end = () => { if (!down) return; down = false; track.classList.remove('is-dragging'); };
      window.addEventListener('pointerup', end);
      track.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
      track.addEventListener('dragstart', (e) => e.preventDefault());
    });
  };

  const initTextureStrip = () => {
    const strip = $('[data-tex-strip]');
    if (!strip) return;
    const panels = $$('[data-tex]', strip);
    const toggle = (panel) => {
      const open = panel.classList.contains('is-open');
      panels.forEach((p) => p.classList.remove('is-open'));
      if (!open) panel.classList.add('is-open');
    };
    panels.forEach((p) => {
      p.addEventListener('click', () => toggle(p));
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p); } });
    });
  };

  /* --------------------------------------------- gallery + image lightbox */
  const initLightbox = () => {
    const modalEl = $('#lightbox');
    const links = $$('[data-lightbox]');
    if (!modalEl || !links.length || !window.bootstrap) return;
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    const img = $('#lightboxImg');
    const cap = $('#lightboxCaption');
    let index = 0; let trigger = null;
    const show = (i) => {
      index = (i + links.length) % links.length;
      const a = links[index];
      img.removeAttribute('data-fallback');
      img.src = a.getAttribute('href');
      img.alt = a.dataset.caption || '';
      cap.textContent = `${a.dataset.caption || ''}  (${index + 1} / ${links.length})`;
    };
    links.forEach((a, i) => a.addEventListener('click', (e) => {
      e.preventDefault(); trigger = a; show(i); modal.show();
    }));
    $('[data-lightbox-prev]', modalEl).addEventListener('click', () => show(index - 1));
    $('[data-lightbox-next]', modalEl).addEventListener('click', () => show(index + 1));
    modalEl.addEventListener('keydown', (e) => {
      const dir = isRTL() ? -1 : 1;
      if (e.key === 'ArrowLeft') show(index - dir);
      if (e.key === 'ArrowRight') show(index + dir);
    });
    modalEl.addEventListener('hidden.bs.modal', () => { if (trigger) trigger.focus(); });
  };

  const initBeforeAfter = () => {
    $$('[data-before-after]').forEach((ba) => {
      const range = $('.ba__range', ba);
      const set = () => ba.style.setProperty('--pos', `${range.value}%`);
      range.addEventListener('input', set);
      set();
    });
  };

  /* ---------------------------------------------------------------- share */
  const initShare = () => {
    const url = window.location.href.split('#')[0];
    const enc = encodeURIComponent(url);
    $$('[data-share]').forEach((a) => {
      a.href = a.href.replace(/(u|url)=[^&]*/, (_m, k) => `${k}=${enc}`);
    });
    const mail = $('[data-share-mail]');
    if (mail) mail.href = mail.href.replace(/body=.*$/, `body=${enc}`);
    const copy = $('[data-copy-link]');
    const msg = $('[data-copy-msg]');
    if (copy) copy.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(url); ok = true; } catch (e) { ok = false; }
      if (msg) { msg.textContent = ok ? 'Link copied' : 'Copy the address from your browser bar'; setTimeout(() => { msg.textContent = ''; }, 2600); }
    });
  };

  /* ------------------------------------------------------------ countdown */
  const initCountdown = () => {
    const el = $('[data-countdown]');
    if (!el) return;
    const target = new Date(el.dataset.countdown).getTime();
    const done = $('[data-countdown-done]');
    const cells = { days: $('[data-cd="days"]', el), hours: $('[data-cd="hours"]', el), minutes: $('[data-cd="minutes"]', el), seconds: $('[data-cd="seconds"]', el) };
    const pad = (n) => String(n).padStart(2, '0');
    let timer;
    const tick = () => {
      const diff = target - Date.now();
      if (Number.isNaN(target) || diff <= 0) {
        clearInterval(timer); el.hidden = true; if (done) done.hidden = false; return;
      }
      cells.days.textContent = pad(Math.floor(diff / 864e5));
      cells.hours.textContent = pad(Math.floor(diff / 36e5) % 24);
      cells.minutes.textContent = pad(Math.floor(diff / 6e4) % 60);
      cells.seconds.textContent = pad(Math.floor(diff / 1e3) % 60);
    };
    tick();
    timer = setInterval(tick, 1000);
  };

  /* ------------------------------------------------------------------ boot */
  const boot = () => {
    initTheme();
    initRTL();
    initScrollUI();
    initMobileNav();
    initReveals();
    initCounters();
    initProjectFilter();
    initJournal();
    initContactForm();
    initNewsletters();
    initSliders();
    initTextureStrip();
    initLightbox();
    initBeforeAfter();
    initShare();
    initCountdown();
    $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
    checkBrokenImages();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
