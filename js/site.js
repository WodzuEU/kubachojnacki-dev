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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof COLLECTIONS === 'undefined') return;
    const ROOT = window.ROOT || '';
    const REDUCE_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the motion tokens of style.css (:root), so CSS and script move alike
    const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const T = { fast: parseFloat(cssVar('--t-fast')) || 200, base: parseFloat(cssVar('--t-base')) || 450, slow: parseFloat(cssVar('--t-slow')) || 900 };
    const EASE = cssVar('--ease') || 'ease', EASE_OUT = cssVar('--ease-out') || 'ease-out';
    // a picture is shown only once it can be drawn whole
    const decoded = im => (im.decode ? im.decode() : Promise.resolve()).catch(() => {});

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
        slidesWrap.innerHTML = picks.map((w, i) =>
            `<div class="slide">
                 <a href="${pageOf(colOf[w.slug])}#${w.slug}" aria-label="${plain(w)}, ${colOf[w.slug].name}">
                     <img ${i ? `data-srcset="${heroSet(w)}"` : `src="${thumb(w, '-hero')}" srcset="${heroSet(w)}" fetchpriority="high"`}
                          sizes="100vw" alt="${altOf(w)}" decoding="async">
                 </a>
             </div>`).join('');

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
        const dotsWrap = document.getElementById('slide-dots');
        const N = slides.length, two = n => String(n).padStart(2, '0');
        dotsWrap.innerHTML = picks.map((w, i) =>
            `<button type="button" class="slide-dot" aria-label="Show ${plain(w)}"></button>`).join('');
        const dots = Array.from(dotsWrap.children);
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

        const hero = slidesWrap.parentElement;
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
        selected.innerHTML = (HOME.selected || []).map(x => {
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
            return `<a class="sel-item" href="${pageOf(colOf[w.slug])}#${w.slug}" aria-label="${plain(w)}, ${colOf[w.slug].name.toLowerCase()}">
                        <img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) 50vw, 25vw"
                             alt="${altOf(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                        ${hoverLabel(w)}
                    </a>`;
        }).join('');
    }

    // ── home: the collections, a row each, the name and its line ──
    const colList = document.getElementById('col-list');
    if (colList) {
        colList.innerHTML = COLS.map(c =>
            `<li><a class="cl-row" href="${pageOf(c)}"><span class="cl-name">${c.name.toLowerCase()}</span><span class="cl-line">${c.line || ''}</span></a></li>`).join('');
    }

    // ── lightbox, as on the original site ───────────────────
    let openWork = () => {}, closeLb = () => {};
    const lb = document.getElementById('lightbox');
    if (lb) {
        const img = document.getElementById('lightbox-img');
        const info = lb.querySelector('.lightbox-info');
        const mail = document.getElementById('lb-inquire-mail');
        let idx = 0, back = null, scrollY = 0, full = false;

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
        const sourceOf = w => {
            const el = document.querySelector(`.tile-img[href="#${w.slug}"] img`);
            if (!el || !el.complete) return null;
            const r = el.getBoundingClientRect();
            return r.width && r.bottom > 0 && r.top < innerHeight ? el : null;
        };
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
            img.classList.remove('is-zoomed');
            img.style.transformOrigin = 'center center';
            lb.classList.add('lb-flip');
            const move = onto(to, w), out = Math.round(T.base * 0.85);
            veil(false, { duration: out, easing: EASE, fill: 'forwards' });
            chrome().forEach(el => el.animate([{ opacity: 0 }], { duration: T.fast * 0.8, easing: EASE, fill: 'forwards' }));
            img.animate([{ transform: 'none' }, { transform: move }], { duration: out, easing: EASE, fill: 'forwards' })
               .onfinish = () => { img.style.transition = ''; finish(); };
        };

        openWork = i => {
            idx = (i + WORKS.length) % WORKS.length;
            const w = WORKS[idx];
            const fresh = !lb.classList.contains('active');
            // stepping closer: grow out of the painting that was clicked, when it was
            const from = fresh && !REDUCE_MOTION && performance.now() - clickedAt < 900 ? sourceOf(w) : null;
            // stepping while zoomed: the next one does not shrink in, it is simply there
            if (!fresh && img.classList.contains('is-zoomed')) {
                img.style.transition = 'none';
                requestAnimationFrame(() => requestAnimationFrame(() => { img.style.transition = ''; }));
            }
            img.classList.remove('is-zoomed');
            img.setAttribute('aria-label', 'Zoom in');
            img.style.transformOrigin = 'center center';
            full = false;
            const loading = sharp(w);
            if (from) {
                // the picture already on screen comes along at once; the sharp one
                // takes its place when it is drawn and the painting has arrived
                setPic(w, from);
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
        const zoom = (ox, oy) => {
            const on = img.classList.toggle('is-zoomed');
            if (on) { fetchFull(); img.style.transformOrigin = `${ox}% ${oy}%`; }
            img.setAttribute('aria-label', on ? 'Zoom out' : 'Zoom in');
        };
        img.addEventListener('click', e => {
            e.stopPropagation();
            const r = img.getBoundingClientRect();
            zoom(((e.clientX - r.left) / r.width * 100).toFixed(1), ((e.clientY - r.top) / r.height * 100).toFixed(1));
        });
        img.addEventListener('keydown', e => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            zoom(50, 50);
        });
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
        const density = document.getElementById('density');

        if (c.kind === 'prints') {
            density.hidden = true;
            panel.innerHTML = `<div class="prints grid">` + c.prints.map(p => {
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
            }).join('') + `</div>`;

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
        } else {
            // 2 / 4 / 6 across on a wide screen, 6 to start, remembered; a phone
            // keeps two. Each choice is an icon of its own grid, as in a shop.
            const CHOICES = [2, 4, 6];
            let cols = 6;
            try { const v = parseInt(localStorage.getItem('kch-grid-cols'), 10); if (CHOICES.includes(v)) cols = v; } catch (e) {}
            // each icon is the row it gives: two, four or six small framed
            // paintings side by side, thinner as there are more
            const gridIcon = n => {
                const w = { 2: 7, 4: 5, 6: 4 }[n], g = 2, H = 14, W = n * w + (n - 1) * g + 1;
                let r = '';
                for (let x = 0; x < n; x++) r += `<rect x="${x * (w + g) + 0.5}" y="0.5" width="${w}" height="${H - 1}"/>`;
                return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" focusable="false">${r}</svg>`;
            };
            density.setAttribute('role', 'group');
            density.setAttribute('aria-label', 'Paintings per row');
            density.innerHTML = CHOICES.map(n =>
                `<button type="button" data-cols="${n}" aria-pressed="${n === cols}" aria-label="${n} per row" title="${n} per row">${gridIcon(n)}</button>`).join('');
            const applyCols = () => {
                const g = panel.querySelector('.works-grid');
                if (!g) return;
                const n = window.innerWidth > 800 ? cols : 2;
                g.style.gridTemplateColumns = n === 2 && window.innerWidth <= 800 ? '' : `repeat(${n}, minmax(0, 1fr))`;
                g.dataset.cols = n;
                // each picture is fetched at the size it is shown
                const sz = `${Math.ceil(100 / n)}vw`;
                g.querySelectorAll('img').forEach(im => { if (im.sizes !== sz) im.sizes = sz; });
            };
            density.addEventListener('click', e => {
                const b = e.target.closest('button[data-cols]');
                if (!b) return;
                cols = parseInt(b.dataset.cols, 10);
                try { localStorage.setItem('kch-grid-cols', cols); } catch (err) {}
                density.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', parseInt(x.dataset.cols, 10) === cols));
                applyCols();
                track('grid/' + cols);
            });
            window.addEventListener('resize', applyCols);

            // the paintings alone; under them the names and prices, in the
            // original site's grid of small tiles
            panel.className = `col-${c.slug}`;
            panel.innerHTML =
                `<div class="works-grid">` +
                c.works.map(w =>
                    `<a class="tile-img" href="#${w.slug}" aria-label="${plain(w)}, ${noOf[w.slug]}">
                         <img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="${window.innerWidth > 800 ? Math.ceil(100 / cols) : 50}vw"
                              alt="${altOf(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                         ${hoverLabel(w)}
                     </a>`).join('') +
                `</div>
                 <div class="legend-grid grid">` +
                c.works.map(w =>
                    `<a class="legend-item${w.sold ? ' is-sold' : (w.unavailable ? ' is-unavailable' : '')}" href="#${w.slug}">
                         <span class="legend-ref">${noOf[w.slug]}</span>
                         <span class="legend-title">${nameOf(w)}</span>
                         <span class="legend-specs">${w.medium}<br>${nb(w.size)}<br>${w.year}</span>
                         <span class="legend-price">${price(w)}</span>
                         <span class="legend-status"><span class="status-dot${w.sold ? '' : (w.unavailable ? ' unavailable' : ' available')}"></span><span class="status-text">${status(w)}</span></span>
                     </a>`).join('') +
                `</div>`;
            applyCols();
            panel.addEventListener('click', e => { if (e.target.closest('.tile-img, .legend-item')) clickedAt = performance.now(); });
        }

        // #<slug>: a work of this collection opens; one of another goes to its page
        const route = () => {
            const h = decodeURIComponent(location.hash.slice(1));
            if (bySlug[h]) {
                if (colOf[h] !== c) { location.replace(pageOf(colOf[h]) + '#' + h); return; }
                openWork(WORKS.indexOf(bySlug[h]));
            } else closeLb(true);
        };
        window.addEventListener('hashchange', route);
        route();
    }

    // ── paintings arrive: each fades in once its picture has loaded ──
    document.querySelectorAll('img.fade').forEach(im => {
        const show = () => decoded(im).then(() => im.classList.add('in'));
        if (im.complete && im.naturalWidth) im.classList.add('in');
        else {
            im.addEventListener('load', show, { once: true });
            im.addEventListener('error', () => im.classList.add('in'), { once: true });
        }
    });

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
        touch = e.target.closest('.hero, .lightbox, .fx-lab, input') || t.clientX < 24 || t.clientX > innerWidth - 24
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
            lab.src = `${ROOT}js/explore.js?v=20261015a`;
            document.body.appendChild(lab);
        }
    } catch (e) {}

    // ── the next page is ready before it is opened: Chrome draws a page
    //    of this site while the pointer rests on its link, so the slide
    //    starts on a finished page. Other browsers ignore it. ──
    if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
        const rules = document.createElement('script');
        rules.type = 'speculationrules';
        rules.textContent = JSON.stringify({ prerender: [{ where: { href_matches: '/*' }, eagerness: 'moderate' }] });
        document.head.appendChild(rules);
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
});
