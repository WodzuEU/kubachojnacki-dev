/* Renders the works from COLLECTIONS (js/data.js).

     /              the slideshow (hero: 1…n in data.js) across the first
                    screen, the selected works (HOME.selected), four across,
                    then the collections as a list, each with its line
     /<collection>/ one collection: the grid, the price tiles. /<collection>/#<slug>
                    opens that work in the original lightbox. Prints have
                    their own layout.

   No artwork data lives in HTML: edit data.js only. The collection pages
   themselves are written from data.js by scripts/build_collections.py.
   ROOT (set per page) prefixes paths: '' at the root, '../' in a folder. */

const siteBoot = () => {
    if (typeof COLLECTIONS === 'undefined') return;
    const ROOT = window.ROOT || '';
    const REDUCE_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the motion tokens of style.css (:root), so CSS and script move alike
    const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const T = { fast: parseFloat(cssVar('--t-fast')) || 200, base: parseFloat(cssVar('--t-base')) || 450, slow: parseFloat(cssVar('--t-slow')) || 900 };
    const EASE = cssVar('--ease') || 'ease', EASE_OUT = cssVar('--ease-out') || 'ease-out';
    // a picture is shown only once it can be drawn whole
    const decoded = im => (im.decode ? im.decode() : Promise.resolve()).catch(() => {});
    // every block this file draws goes through put(). scripts/prerender.py
    // saves the HTML into the page with its fingerprint (data-pre); while the
    // fingerprint still matches, the block is left as it arrived, and when
    // data.js has changed since, it is drawn again
    const sum = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
    const put = (el, html) => {
        const h = sum(html);
        if (window.__SNAP) window.__SNAP[el.id] = { h, html };
        if (el.dataset.pre === h) return;
        el.innerHTML = html;
        el.dataset.pre = h;
    };
    // a painting fades in once its picture is loaded and decoded
    const arrive = root => root.querySelectorAll('img.fade:not(.in)').forEach(im => {
        if (im.dataset.arriving) return;
        im.dataset.arriving = '1';
        const show = () => decoded(im).then(() => im.classList.add('in'));
        if (im.complete && im.naturalWidth) im.classList.add('in');
        else {
            im.addEventListener('load', show, { once: true });
            im.addEventListener('error', () => im.classList.add('in'), { once: true });
        }
    });
    // what js/collection.js borrows
    window.KCH = { put, arrive, decoded, T, EASE, EASE_OUT };

    // analytics events (GoatCounter): sent only on the live domain
    const gcQueue = (window.__gcQueue = window.__gcQueue || []);
    const track = (path, title) => {
        const vars = { path, title: title || path, event: true };
        if (window.goatcounter && typeof window.goatcounter.count === 'function') window.goatcounter.count(vars);
        else gcQueue.push(vars);
    };

    // published works only; a collection shows once it has works (prints have no works)
    const slugOf = c => c.name.toLowerCase().replace(/\s+/g, '-');
    const COLS = COLLECTIONS
        .map(c => Object.assign({}, c, { slug: slugOf(c), works: (c.works || []).filter(w => !w.draft) }))
        .filter(c => c.works.length || c.kind === 'prints');
    const WORKS = COLS.flatMap(c => c.works);
    const colOf = {}, noOf = {};
    COLS.forEach(c => c.works.forEach((w, i) => { colOf[w.slug] = c; noOf[w.slug] = String(i + 1).padStart(2, '0'); }));
    const bySlug = Object.fromEntries(WORKS.map(w => [w.slug, w]));

    const pageOf  = c => `${ROOT}${c.slug}/`;
    const thumb   = (w, t) => `${ROOT}IMAGES/thumbs/${w.slug}${t || ''}.webp`;
    const srcset  = w => `${thumb(w)} 400w, ${thumb(w, '-800')} 800w, ${thumb(w, '-1600')} 1600w`;
    const printImg = (slug, size, px) => `${ROOT}IMAGES/prints/${slug}-${size.toLowerCase()}-${px}.webp`;
    const orderHref = (w, size) => `mailto:${SITE.email}?subject=` + encodeURIComponent(`Print order: ${plain(w)}, ${size}`);
    const roman   = s => s.replace(/\b(III|II|I)\b/g, '<span class="rn">$1</span>');
    const nameOf  = w => roman((w.title.split('|')[1] || w.title).trim());
    const plain   = w => (w.title.split('|')[1] || w.title).trim();
    const altOf   = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const label   = w => w.title.replace(' | ', ' ');
    // a number never parts from its unit at the end of a line
    const nb      = s => String(s).replace(/ /g, '\u00a0');
    const price   = w => `${w.price}\u00a0€`;
    const status  = w => w.sold ? 'sold' : (w.unavailable ? 'currently not available' : 'available');
    // on hover under a painting: its number, then its name, spaced apart
    const hoverLabel = w => `<span class="hl" aria-hidden="true"><span class="hl-no">${noOf[w.slug]}</span><span class="hl-nm">${plain(w)}</span></span>`;
    // a click on a painting opens the lightbox out of it (see openWork)
    let clickedAt = 0;
    let pressed = null;
    document.addEventListener('click', e => {
        if (!e.target.closest) return;
        pressed = e.target.closest('[data-work]');
        if (pressed || e.target.closest('.sp-row')) clickedAt = performance.now();
    }, true);

    // ── a painting carried across pages: the one pressed here and the open
    //    lightbox on the next page share one name, so the browser grows one
    //    into the other (a cross-document view transition). Its picture goes
    //    along so the lightbox can start with it ──
    let morphInto = () => {};
    addEventListener('pageswap', e => {
        if (!e.viewTransition || !e.activation || !pressed) return;
        const to = new URL(e.activation.entry.url);
        const slug = decodeURIComponent(to.hash.slice(1));
        const im = pressed.dataset.work === slug && pressed.querySelector('img');
        if (!im || to.pathname === location.pathname) return;
        im.style.viewTransitionName = 'work';
        try { sessionStorage.setItem('kch-morph', JSON.stringify({ slug, src: im.currentSrc || im.src })); } catch (x) {}
    });
    addEventListener('pageshow', () => document.querySelectorAll('img').forEach(im => { if (im.style.viewTransitionName) im.style.viewTransitionName = ''; }));
    addEventListener('pagereveal', e => {
        let m = null;
        try { m = JSON.parse(sessionStorage.getItem('kch-morph') || 'null'); sessionStorage.removeItem('kch-morph'); } catch (x) {}
        if (e.viewTransition && m) morphInto(e, m);
    });
    // "Atmosphere | maroon khaki": the collection, the colours under it
    const titleHtml = w => {
        const [main, sub] = w.title.split('|').map(s => s.trim());
        return main + (sub ? `<span class="color-subtitle">${roman(sub)}</span>` : '');
    };

    // ── home: the slideshow, as on the live site: the name over the painting,
    //    medium, size and year under it, the count and the dots ──
    const slidesWrap = document.getElementById('slides');
    if (slidesWrap) {
        const picks = WORKS.filter(w => w.hero).sort((a, b) => a.hero - b.hero);
        // WebP at 1600 and 2400 px (the JPEG masters stay for zooming). The
        // first painting loads at once (index.html preloads it); the others
        // wait until it is on screen, so they never compete with it.
        const heroSet = w => `${thumb(w, '-hero')} 1600w, ${thumb(w, '-hero-2400')} 2400w`;
        put(slidesWrap, picks.map((w, i) =>
            `<div class="slide">
                 <a href="${pageOf(colOf[w.slug])}#${w.slug}" aria-label="${plain(w)}, ${colOf[w.slug].name}">
                     <img ${i ? `data-srcset="${heroSet(w)}"` : `src="${thumb(w, '-hero')}" srcset="${heroSet(w)}" fetchpriority="high"`}
                          sizes="100vw" alt="${altOf(w)}" decoding="async">
                 </a>
             </div>`).join(''));

        const slides = Array.from(slidesWrap.children);
        const pic = k => slides[k].querySelector('img');
        const fill = k => { const im = pic(k); if (im.dataset.srcset) { im.srcset = im.dataset.srcset; im.removeAttribute('data-srcset'); } return im; };
        const later = window.requestIdleCallback || (f => setTimeout(f, 200));
        let ready = false;
        decoded(pic(0)).then(() => {
            ready = true;
            decoded(fill((cur + 1) % slides.length));
            later(() => slides.forEach((s, k) => k && fill(k)));
        });
        const cap = document.getElementById('hero-cap');
        const counter = document.getElementById('hero-counter');
        const N = slides.length, two = n => String(n).padStart(2, '0');
        // no dots: the count and the two arrows in the row under the painting
        const dots = [];
        // it plays one round and comes to rest on the first painting; it
        // waits while the pointer or the keyboard is on it
        let cur = 0, timer = null, shown = 1, held = false;

        // only the slide on show can be reached with the keyboard
        const goTo = i => {
            cur = (i + N) % N;
            slides.forEach((s, k) => {
                s.classList.toggle('active', k === cur);
                s.setAttribute('aria-hidden', k !== cur);
                s.querySelector('a').tabIndex = k === cur ? 0 : -1;
            });
            dots.forEach((d, k) => d.classList.toggle('active', k === cur));
            const w = picks[cur];
            // new words each time, so they rise in again with each painting
            cap.innerHTML =
                `<a class="hc-title" href="${pageOf(colOf[w.slug])}#${w.slug}" tabindex="-1">${roman(w.title)}</a>
                 <span class="hc-specs">${w.medium}<i>·</i>${nb(w.size)}<i>·</i>${w.year}</span>`;
            counter.textContent = `${two(cur + 1)} / ${two(N)}`;
            // the painting on show, and the next one drawn before its turn comes
            fill(cur);
            if (ready) decoded(fill((cur + 1) % N));
        };
        cap.classList.add('in');
        const stop = () => { clearInterval(timer); timer = null; };
        const tick = () => { goTo(cur + 1); if (++shown > N) stop(); };
        const start = () => { if (!REDUCE_MOTION && !held && !timer && shown <= N) timer = setInterval(tick, 5000); };
        const restart = () => { stop(); start(); };

        document.querySelector('.prev-btn').addEventListener('click', () => { goTo(cur - 1); restart(); });
        document.querySelector('.next-btn').addEventListener('click', () => { goTo(cur + 1); restart(); });
        dots.forEach((d, k) => d.addEventListener('click', () => { goTo(k); restart(); }));

        const hero = slidesWrap.closest('.hero-wrap');
        const hold = () => { held = true; stop(); };
        const release = () => { held = false; start(); };
        hero.addEventListener('mouseenter', hold);
        hero.addEventListener('mouseleave', release);
        hero.addEventListener('focusin', hold);
        hero.addEventListener('focusout', e => { if (!hero.contains(e.relatedTarget)) release(); });
        // and while nobody can see it: scrolled away, or another tab in front
        let seen = true;
        const sync = () => { if (seen && !document.hidden && !held) start(); else stop(); };
        if ('IntersectionObserver' in window)
            new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { threshold: 0.5 }).observe(hero);
        document.addEventListener('visibilitychange', sync);
        let x0 = 0;
        hero.addEventListener('touchstart', e => { x0 = e.changedTouches[0].clientX; }, { passive: true });
        hero.addEventListener('touchend', e => {
            const dx = x0 - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 40) { goTo(dx > 0 ? cur + 1 : cur - 1); restart(); }
        }, { passive: true });

        goTo(0);
        start();
    }

    // ── home: the selected works, whole, four across ──
    const selected = document.getElementById('selected');
    if (selected && typeof HOME !== 'undefined') {
        put(selected, (HOME.selected || []).map(x => {
            // a painting not on the site yet: its picture, no link
            if (typeof x === 'object') {
                const t = s => `${ROOT}IMAGES/thumbs/${x.img}${s}.webp`;
                return `<span class="sel-item">
                            <img class="fade" src="${t('')}" srcset="${t('')} 400w, ${t('-800')} 800w, ${t('-1600')} 1600w" sizes="(max-width: 800px) 50vw, 25vw"
                                 alt="${x.alt}" width="${x.w}" height="${x.h}" loading="lazy" decoding="async">
                        </span>`;
            }
            const w = bySlug[x];
            if (!w) return '';
            return `<a class="sel-item" href="${pageOf(colOf[w.slug])}#${w.slug}" data-work="${w.slug}" aria-label="${plain(w)}, ${colOf[w.slug].name.toLowerCase()}">
                        <img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) 50vw, 25vw"
                             alt="${altOf(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                        ${hoverLabel(w)}
                    </a>`;
        }).join(''));
    }

    // ── home: the collections, a row each, the name and its line ──
    const colList = document.getElementById('col-list');
    if (colList) {
        put(colList, COLS.map(c =>
            `<li><a class="cl-row" href="${pageOf(c)}"><span class="cl-name">${c.name.toLowerCase()}</span><span class="cl-line">${c.line || ''}</span></a></li>`).join(''));
    }

    // ── lightbox, as on the original site ───────────────────
    let openWork = () => {}, closeLb = () => {};
    const lb = document.getElementById('lightbox');
    if (lb) {
        const img = document.getElementById('lightbox-img');
        const info = lb.querySelector('.lightbox-info');
        const mail = document.getElementById('lb-inquire-mail');
        let idx = 0, back = null, scrollY = 0, full = false;
        // zoomed: where the painting stands (x, y) and where it is going (tx, ty)
        let pan = null, raf = 0, drag = null, moved = false;
        // a work carried in from another page: its picture comes first
        let arriving = null;
        try { arriving = JSON.parse(sessionStorage.getItem('kch-morph') || 'null'); } catch (e) {}

        // hold the page still behind the lightbox, and put it back in one frame
        const lock = () => {
            scrollY = window.scrollY;
            document.body.style.top = `-${scrollY}px`;
            document.documentElement.classList.add('lb-open');
        };
        const unlock = () => {
            const root = document.documentElement;
            if (!root.classList.contains('lb-open')) return;
            root.classList.remove('lb-open');
            document.body.style.top = '';
            const prev = root.style.scrollBehavior;
            root.style.scrollBehavior = 'auto';
            window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
            root.style.scrollBehavior = prev;
        };

        // the painting a work opened from: on this page, loaded and on screen
        const sourceOf = w => [...document.querySelectorAll(`[data-work="${w.slug}"] img`)].find(el => {
            if (!el.complete || !el.naturalWidth) return false;
            const r = el.getBoundingClientRect();
            return r.width && r.bottom > 0 && r.top < innerHeight;
        }) || null;
        // where the painting shows inside the lightbox picture (contained, not stretched)
        const shown = w => {
            const r = img.getBoundingClientRect(), ar = w.w / w.h;
            let wd = r.width, ht = wd / ar;
            if (ht > r.height) { ht = r.height; wd = ht * ar; }
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: wd };
        };
        // the move that puts the lightbox picture exactly over the painting on the wall
        const onto = (el, w) => {
            const a = el.getBoundingClientRect(), b = shown(w);
            return `translate(${(a.left + a.width / 2 - b.x).toFixed(1)}px, ${(a.top + a.height / 2 - b.y).toFixed(1)}px) scale(${(a.width / b.w).toFixed(4)})`;
        };
        // the white behind is the lightbox's ::before: fading it costs nothing
        const veil = (on, opts) => {
            try { return lb.animate({ opacity: on ? [0, 1] : [1, 0] }, Object.assign({ pseudoElement: '::before' }, opts)); }
            catch (e) { return null; }
        };
        const chrome = () => lb.querySelectorAll('.lightbox-info, .lightbox-btn');
        const SIZES = '(max-width: 800px) 88vw, 58vw';
        let stepFade = null;
        // the sharp picture of a work, loaded and drawn off screen, then put in place
        const setPic = (w, from) => {
            img.width = w.w; img.height = w.h;
            img.sizes = from.sizes || ''; img.srcset = from.srcset || ''; img.src = from.currentSrc || from.src;
        };
        const sharp = w => {
            const m = new Image();
            m.sizes = SIZES; m.srcset = srcset(w); m.src = thumb(w, '-1600');
            return decoded(m).then(() => m);
        };
        let closing = false;

        closeLb = keepHash => {
            if (!lb.classList.contains('active') || closing) return;
            const finish = () => {
                lb.classList.remove('active');
                lb.getAnimations({ subtree: true }).forEach(a => a.cancel());
                requestAnimationFrame(() => lb.classList.remove('lb-flip'));
                closing = false;
                unlock();
                if (!keepHash) history.replaceState(null, '', location.pathname + location.search);
                if (back) { back.focus({ preventScroll: true }); back = null; }
            };
            const w = WORKS[idx], to = REDUCE_MOTION ? null : sourceOf(w);
            if (!to) { finish(); return; }
            // stepping back: the painting shrinks into its place on the wall
            closing = true;
            img.style.transition = 'none';
            pan = null; cancelAnimationFrame(raf); raf = 0; drag = null;
            img.style.transform = '';
            img.classList.remove('is-zoomed');
            img.style.transformOrigin = 'center center';
            lb.classList.add('lb-flip');
            const move = onto(to, w), out = Math.round(T.base * 0.85);
            veil(false, { duration: out, easing: EASE, fill: 'forwards' });
            chrome().forEach(el => el.animate([{ opacity: 0 }], { duration: T.fast * 0.8, easing: EASE, fill: 'forwards' }));
            img.animate([{ transform: 'none' }, { transform: move }], { duration: out, easing: EASE, fill: 'forwards' })
               .onfinish = () => { img.style.transition = ''; finish(); };
        };

        openWork = (i, instant) => {
            idx = (i + WORKS.length) % WORKS.length;
            const w = WORKS[idx];
            const fresh = !lb.classList.contains('active');
            // stepping closer: grow out of the painting that was clicked, when it was
            const from = fresh && !REDUCE_MOTION && performance.now() - clickedAt < 900 ? sourceOf(w) : null;
            // stepping while zoomed: the next one does not shrink in, it is simply there
            if (!fresh && pan) {
                img.style.transition = 'none';
                requestAnimationFrame(() => requestAnimationFrame(() => { img.style.transition = ''; }));
            }
            pan = null; cancelAnimationFrame(raf); raf = 0; drag = null;
            img.style.transform = '';
            img.classList.remove('is-zoomed');
            img.setAttribute('aria-label', 'Zoom in');
            img.style.transformOrigin = 'center center';
            full = false;
            const loading = sharp(w);
            if (from) {
                // the picture already on screen comes along at once; the sharp one
                // takes its place when it is drawn and the painting has arrived
                setPic(w, from);
            } else if (fresh && arriving && arriving.slug === w.slug && arriving.src) {
                // carried in from the page before: the same picture first, then the sharp one
                setPic(w, { src: arriving.src });
                arriving = null;
                loading.then(m => { if (WORKS[idx] === w && !full) setPic(w, m); });
            } else if (fresh) {
                setPic(w, { sizes: SIZES, srcset: srcset(w), src: thumb(w, '-1600') });
            } else {
                // a step to the next work: this one fades, the next comes in once drawn
                const now = getComputedStyle(img).opacity;
                if (stepFade) stepFade.cancel();
                const fade = stepFade = REDUCE_MOTION ? null : img.animate({ opacity: [now, 0] }, { duration: T.fast, easing: EASE, fill: 'forwards' });
                Promise.all([loading, fade ? fade.finished.catch(() => {}) : null]).then(([m]) => {
                    if (WORKS[idx] !== w) return;
                    setPic(w, m);
                    if (fade) { fade.cancel(); stepFade = null; img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.base, easing: EASE_OUT }); }
                });
            }
            img.alt = altOf(w);

            document.getElementById('lb-title').innerHTML = titleHtml(w);
            document.getElementById('lb-price').textContent = price(w);
            document.getElementById('lb-specs').innerHTML = `${w.medium}<br>${nb(w.size)}<br>${w.year}`;
            const st = document.getElementById('lb-status');
            st.hidden = !(w.sold || w.unavailable);
            st.innerHTML = st.hidden ? '' : `<span class="status-dot${w.sold ? '' : ' unavailable'}"></span><span class="status-text">${status(w)}</span>`;
            info.classList.toggle('is-sold', !!w.sold);
            info.classList.toggle('is-unavailable', !w.sold && !!w.unavailable);
            mail.href = `mailto:${SITE.email}?subject=` + encodeURIComponent(`Inquiry: ${noOf[w.slug]}, ${label(w)}`);

            if (fresh) {
                back = document.activeElement !== document.body ? document.activeElement : null;
                lock();
                if (from) {
                    lb.classList.add('lb-flip', 'active');
                    const move = onto(from, w);
                    veil(true, { duration: T.base, easing: EASE });
                    chrome().forEach(el => el.animate([{ opacity: 0, transform: el.classList.contains('lightbox-info') ? 'translateY(10px)' : getComputedStyle(el).transform }, {}],
                                                      { duration: T.base, delay: T.base * 0.5, easing: EASE_OUT, fill: 'backwards' }));
                    const grow = img.animate([{ transform: move }, { transform: 'none' }], { duration: T.base * 1.2, easing: EASE_OUT });
                    grow.onfinish = () => lb.classList.remove('lb-flip');
                    Promise.all([loading, grow.finished.catch(() => {})]).then(([m]) => { if (WORKS[idx] === w && !full) setPic(w, m); });
                } else if (instant) {
                    // arriving at a work's address: the lightbox is simply open
                    lb.classList.add('lb-flip', 'active');
                    requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.remove('lb-flip')));
                } else lb.classList.add('active');
                lb.querySelector('.lb-close').focus({ preventScroll: true });
            }
            history.replaceState(null, '', '#' + w.slug);
            track('open/' + w.slug, label(w));
        };

        // prev / next stay inside the work's collection
        const step = d => {
            const list = colOf[WORKS[idx].slug].works;
            const j = list.indexOf(WORKS[idx]);
            openWork(WORKS.indexOf(list[(j + d + list.length) % list.length]));
        };

        // the full-resolution master only when someone zooms
        const fetchFull = () => {
            if (full) return;
            full = true;
            const w = WORKS[idx], m = new Image();
            m.src = `${ROOT}IMAGES/works/${w.slug}.jpg`;
            decoded(m).then(() => { if (WORKS[idx] !== w || !full) return; img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.src = m.src; });
        };
        // zoom where it was clicked; Enter or Space zooms into the middle
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', 'Zoom in');
        // zoomed in, the painting at 2.2x with the point clicked kept under the
        // pointer; then the view follows the mouse, or the finger as it drags,
        // a little behind (damped), and never past the painting's edge
        const S = 2.2;
        const edge = (v, size) => { const m = (S - 1) * size / 2; return Math.max(-m, Math.min(m, v)); };
        const place = () => { img.style.transform = `translate(${pan.x.toFixed(1)}px, ${pan.y.toFixed(1)}px) scale(${S})`; };
        const glide = () => {
            raf = 0;
            if (!pan) return;
            pan.x += (pan.tx - pan.x) * 0.16;
            pan.y += (pan.ty - pan.y) * 0.16;
            place();
            if (Math.abs(pan.tx - pan.x) > 0.3 || Math.abs(pan.ty - pan.y) > 0.3) raf = requestAnimationFrame(glide);
        };
        const aim = (tx, ty) => {
            pan.tx = edge(tx, pan.w); pan.ty = edge(ty, pan.h);
            if (REDUCE_MOTION) { pan.x = pan.tx; pan.y = pan.ty; place(); }
            else if (!raf) raf = requestAnimationFrame(glide);
        };
        const zoomIn = (cx, cy) => {
            const r = img.getBoundingClientRect();
            pan = { w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
            pan.x = pan.tx = edge(cx == null ? 0 : -(S - 1) * (cx - pan.cx), pan.w);
            pan.y = pan.ty = edge(cy == null ? 0 : -(S - 1) * (cy - pan.cy), pan.h);
            img.classList.add('is-zoomed');
            img.style.transformOrigin = 'center center';
            img.style.transition = REDUCE_MOTION ? 'none' : `transform ${T.base}ms ${EASE_OUT}`;
            place();
            setTimeout(() => { if (pan) img.style.transition = 'none'; }, T.base);
            fetchFull();
            img.setAttribute('aria-label', 'Zoom out');
        };
        const zoomOut = () => {
            pan = null; cancelAnimationFrame(raf); raf = 0; drag = null;
            img.classList.remove('is-zoomed');
            img.style.transition = REDUCE_MOTION ? 'none' : `transform ${T.base}ms ${EASE_OUT}`;
            img.style.transform = '';
            setTimeout(() => { if (!pan) img.style.transition = ''; }, T.base);
            img.setAttribute('aria-label', 'Zoom in');
        };
        img.addEventListener('pointerdown', e => {
            moved = false;
            if (pan && e.pointerType !== 'mouse') {
                drag = { x: e.clientX, y: e.clientY, tx: pan.tx, ty: pan.ty };
                img.setPointerCapture(e.pointerId);
            }
        });
        img.addEventListener('pointermove', e => {
            if (!pan) return;
            if (e.pointerType === 'mouse') aim(-(S - 1) * (e.clientX - pan.cx), -(S - 1) * (e.clientY - pan.cy));
            else if (drag) {
                const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
                if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
                aim(drag.tx + dx, drag.ty + dy);
            }
        });
        img.addEventListener('pointerup', () => { drag = null; });
        img.addEventListener('pointercancel', () => { drag = null; });
        img.addEventListener('click', e => {
            e.stopPropagation();
            if (moved) { moved = false; return; }
            if (pan) zoomOut(); else zoomIn(e.clientX, e.clientY);
        });
        img.addEventListener('keydown', e => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            if (pan) zoomOut(); else zoomIn(null, null);
        });

        // a painting carried in from the page before lands as this lightbox's picture
        morphInto = (e, m) => {
            if (!lb.classList.contains('active') || WORKS[idx].slug !== m.slug) return;
            img.style.viewTransitionName = 'work';
            e.viewTransition.finished.finally(() => { img.style.viewTransitionName = ''; });
        };
        lb.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
        lb.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); step(1); });
        lb.querySelector('.lb-close').addEventListener('click', e => { e.stopPropagation(); closeLb(); });
        lb.addEventListener('click', e => { if (!e.target.closest('.lightbox-info, .lightbox-btn') && e.target !== img) closeLb(); });
        mail.addEventListener('click', () => track('inquire-email/' + WORKS[idx].slug, label(WORKS[idx])));
        lb.querySelector('.lb-inquiry-section a[href*="instagram"]')
          .addEventListener('click', () => track('inquire-instagram/' + WORKS[idx].slug, label(WORKS[idx])));
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('active')) return;
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'Tab') {
                // keep the keyboard inside while it is open
                const els = Array.from(lb.querySelectorAll('button, a[href], [tabindex="0"]'));
                const first = els[0], last = els[els.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
    }

    // ── a collection page ───────────────────────────────────
    const page = document.querySelector('main[data-collection]');
    if (page) {
        const c = COLS.find(x => x.slug === page.dataset.collection) || COLS[0];
        const panel = document.getElementById('collection');

        if (c.kind === 'prints') {
            put(panel, `<div class="prints grid">` + c.prints.map(p => {
                const w = bySlug[p.work];
                const first = p.formats.find(f => f.size === 'A2') || p.formats[0];
                return `<article class="print" data-work="${p.work}">
                            <div class="print-img">
                                <img class="fade" src="${printImg(p.work, first.size, 1100)}"
                                     srcset="${printImg(p.work, first.size, 600)} 600w, ${printImg(p.work, first.size, 1100)} 1100w"
                                     sizes="(max-width: 800px) 80vw, 30vw" width="1100" height="1375"
                                     alt="Print of ${plain(w)}, ${first.size}" decoding="async">
                            </div>
                            <div class="print-text">
                                <h2 class="print-name">${nameOf(w)}<span class="print-orig">original ${nb(w.size)}, ${w.sold ? 'sold' : status(w)}</span></h2>
                                ${p.note ? `<p class="say-text print-note">${p.note}</p>` : ''}
                                <div class="formats">` +
                                p.formats.map(f =>
                                    `<button type="button" class="fmt-pick" data-size="${f.size}" aria-pressed="${f === first}" aria-label="${f.size}, ${f.price ? f.price + ' euro' : 'price soon'}, show this size">
                                         <span class="fs">${f.size}</span><span class="fp">${f.price ? f.price + '\u00a0€' : 'price soon'}</span>
                                     </button>
                                     <a class="fo lb-submit" data-size="${f.size}" href="${orderHref(w, f.size)}" aria-label="Order the ${f.size} print by email">order</a>
                                     <span class="fmt-ed">${f.edition ? `edition of ${f.edition}` : ''}</span>`).join('') +
                                `</div>
                                <p class="fmt-sizes">${p.formats.map(f => `<span><b>${f.size}</b>${nb(f.cm)}</span>`).join('')}</p>
                            </div>
                        </article>`;
            }).join('') + `</div>`);

            // a size shows its own framing of the painting; each has its order link
            panel.addEventListener('click', e => {
                const pick = e.target.closest('.fmt-pick');
                const order = e.target.closest('.fo');
                const art = e.target.closest('.print');
                if (order && art) {
                    const size = order.dataset.size;
                    track(`order-print/${art.dataset.work}-${size.toLowerCase()}`, `Print order: ${plain(bySlug[art.dataset.work])}, ${size}`);
                }
                if (!pick || !art) return;
                const size = pick.dataset.size, slug = art.dataset.work, im = art.querySelector('.print-img img');
                im.src = printImg(slug, size, 1100);
                im.srcset = `${printImg(slug, size, 600)} 600w, ${printImg(slug, size, 1100)} 1100w`;
                im.alt = `Print of ${plain(bySlug[slug])}, ${size}`;
                art.querySelectorAll('.fmt-pick').forEach(b => b.setAttribute('aria-pressed', b === pick));
            });
        }
        // the other collections are drawn by js/collection.js: index and wall

        // #<slug>: a work of this collection opens; one of another goes to its page
        const route = first => {
            const h = decodeURIComponent(location.hash.slice(1));
            if (bySlug[h]) {
                if (colOf[h] !== c) { location.replace(pageOf(colOf[h]) + '#' + h); return; }
                openWork(WORKS.indexOf(bySlug[h]), first === true);
            } else closeLb(true);
        };
        window.addEventListener('hashchange', route);
        route(true);
    }

    // ── paintings arrive: each fades in once its picture has loaded ──
    arrive(document);

    // ── moving through the site. The pages stand in a row, like rooms along
    //    a wall: home, the collections, about, contact. Going on slides the
    //    next page in from the right, going back from the left (the head of
    //    each page reads the direction; the slide itself is in style.css).
    //    The next link, the arrow keys and a swipe all walk the same row. ──
    const ROW = [[0, ROOT || './'], ...COLS.map((c, i) => [i + 1, pageOf(c)]), [80, `${ROOT}about/`], [81, `${ROOT}contact/`]];
    const here = ROW.findIndex(([o]) => o === Number(document.documentElement.dataset.order));
    const heading = d => { try { sessionStorage.setItem('kch-dir', d > 0 ? 'forward' : 'back'); } catch (e) {} };
    const walk = d => {
        if (here < 0) return;
        heading(d);
        location.href = ROW[(here + d + ROW.length) % ROW.length][1];
    };
    document.addEventListener('click', e => { if (e.target.closest('.next a')) heading(1); });
    document.addEventListener('keydown', e => {
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (document.documentElement.classList.contains('lb-open')) return;
        // only when nothing has focus: a focused control keeps its own arrows
        if (e.target !== document.body && e.target !== document.documentElement) return;
        if (e.key === 'ArrowRight') walk(1);
        else if (e.key === 'ArrowLeft') walk(-1);
    });
    let touch = null;
    document.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        // not on the slideshow or the lightbox (they swipe their own pictures),
        // and not at the screen's edges (the browser's own back gesture)
        touch = e.target.closest('.hero-wrap, .lightbox, .fx-lab, input') || t.clientX < 24 || t.clientX > innerWidth - 24
            ? null : { x: t.clientX, y: t.clientY };
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!touch) return;
        const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
        touch = null;
        if (Math.abs(dx) > 80 && Math.abs(dx) > 1.8 * Math.abs(dy)) walk(dx < 0 ? 1 : -1);
    }, { passive: true });

    // ── the effects lab: only with ?explore in the address, then for the rest
    //    of the visit; not part of the site ──
    try {
        if (/[?&]explore\b/.test(location.search)) sessionStorage.setItem('kch-explore', '1');
        if (sessionStorage.getItem('kch-explore')) {
            const lab = document.createElement('script');
            lab.src = `${ROOT}js/explore.js?v=20261021b`;
            document.body.appendChild(lab);
        }
    } catch (e) {}

    // ── the pointer is the computer's own. Over a painting a small word follows
    //    it, a little behind (damped), and says what a click does: "view",
    //    and on the lightbox's picture "zoom" or "zoom out". Only with a mouse ──
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const tip = document.createElement('span');
        tip.className = 'tip';
        tip.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tip);
        let x = 0, y = 0, tx = 0, ty = 0, raf = 0, word = '';
        const follow = () => {
            x += (tx - x) * 0.2; y += (ty - y) * 0.2;
            tip.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(follow) : 0;
        };
        const wordFor = el => {
            if (!el || !el.closest) return '';
            const big = el.closest('#lightbox-img');
            if (big) return big.classList.contains('is-zoomed') ? 'zoom out' : 'zoom';
            return el.closest('[data-work], .slide a, .sp-row a') ? 'view' : '';
        };
        document.addEventListener('pointermove', e => {
            if (e.pointerType !== 'mouse') return;
            tx = e.clientX + 14; ty = e.clientY + 18;
            const w = wordFor(e.target);
            if (w !== word) {
                if (w && !word) { x = tx; y = ty; tip.style.transform = `translate(${x}px, ${y}px)`; }
                word = w;
                if (w) tip.textContent = w;
                tip.classList.toggle('on', !!w);
            }
            if (REDUCE_MOTION) { x = tx; y = ty; tip.style.transform = `translate(${x}px, ${y}px)`; }
            else if (!raf) raf = requestAnimationFrame(follow);
        }, { passive: true });
        // a click on the picture changes what the next click does
        document.addEventListener('click', e => { if (word && e.target.closest && e.target.closest('#lightbox-img')) requestAnimationFrame(() => { word = wordFor(e.target); tip.textContent = word; }); });
        document.documentElement.addEventListener('mouseleave', () => { word = ''; tip.classList.remove('on'); });
    }

    // ── the next page is ready before it is opened: Chrome draws a page
    //    of this site while the pointer rests on its link, so the slide
    //    starts on a finished page. Other browsers ignore it. ──
    if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
        const rules = document.createElement('script');
        rules.type = 'speculationrules';
        const base = new URL(ROOT || './', location.href).pathname;
        rules.textContent = JSON.stringify({ prerender: [{ where: { href_matches: base + '*' }, eagerness: 'moderate' }] });
        document.head.appendChild(rules);
    }

    // the staging copy on github.io is for looking at, not for search engines
    if (/\.github\.io$/.test(location.hostname) && !document.querySelector('meta[name="robots"]')) {
        const m = document.createElement('meta');
        m.name = 'robots'; m.content = 'noindex';
        document.head.appendChild(m);
    }

    // ── analytics (live domain only), counted when a page is really seen,
    //    not while it is drawn ahead ──
    const counted = () => {
        if (!SITE.goatcounter || location.hostname !== 'kubachojnacki.com' || window.__gcLoader) return;
        window.__gcLoader = true;
        const s = document.createElement('script');
        s.async = true;
        s.dataset.goatcounter = `https://${SITE.goatcounter}.goatcounter.com/count`;
        s.src = 'https://gc.zgo.at/count.js';
        s.onload = () => { gcQueue.splice(0).forEach(v => window.goatcounter.count(v)); };
        document.body.appendChild(s);
    };
    if (document.prerendering) document.addEventListener('prerenderingchange', counted, { once: true });
    else counted();
};
// the scripts stand at the end of each page, after everything they draw on,
// so the page is ready before its first frame: a work opened by its address
// is already open when a page change captures the new page
if (document.getElementById('main')) siteBoot();
else document.addEventListener('DOMContentLoaded', siteBoot);
