/* Renders the works from COLLECTIONS (js/data.js).

     /              the slideshow (hero: 1…n in data.js) across the first
                    screen, the selected works (HOME.selected), four across,
                    then the collections: the list and tiles. /#<slug> opens
                    that work in the lightbox, here on the same page
     /<collection>/ one collection: the grid. /<collection>/#<slug> opens that
                    work in the lightbox. Prints have their own layout.

   No artwork data lives in HTML: edit data.js only. The collection pages
   themselves are written from data.js by scripts/build_collections.py.
   ROOT (set per page) prefixes paths: '' at the root, '../' in a folder. */

const siteBoot = () => {
    if (typeof COLLECTIONS === 'undefined') return;
    const ROOT = window.ROOT || '';
    const REDUCE_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // a page reached from another page of this visit lets its pictures settle more
    // lightly (style.css, html.came). The first page comes into focus as one: its
    // head sets html.first, and the end of this file starts it
    const rootEl = document.documentElement;
    let seenBefore = true;
    try { seenBefore = !!sessionStorage.getItem('kch-seen'); sessionStorage.setItem('kch-seen', '1'); } catch (e) {}
    if (seenBefore) rootEl.classList.add('came');
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
    // paintings come into focus (the looks are in style.css):
    //  - the ones on the first screen wait for each other and clear together, in
    //    one moment, so nothing pops in on its own clock. They wait 700 ms at
    //    most; one that is later still joins when its picture is there
    //  - one further down that is loaded before you scroll to it waits out of
    //    focus (.soft) and clears as its row comes into view (.late)
    const land = im => {
        if (!im.dataset.ready) return;
        if (im.dataset.seen) {
            if (im.classList.contains('soft')) { im.classList.remove('soft'); im.classList.add('late'); }
            im.classList.add('in');
        } else if (im.dataset.below) im.classList.add('soft');
    };
    const WATCH = 'IntersectionObserver' in window && !REDUCE_MOTION;
    const lead = new Set();
    let sorted = false, gate = false, gateTimer = 0;
    const openGate = () => {
        if (gate) return;
        gate = true; clearTimeout(gateTimer);
        lead.forEach(im => { im.dataset.seen = '1'; land(im); });
    };
    const tryGate = () => { if (sorted && !gate && [...lead].every(im => im.dataset.ready)) openGate(); };
    // a row is "in view" once its top stands a tenth of the window above the foot
    const rows = WATCH ? new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        rows.unobserve(e.target);
        e.target.dataset.seen = '1';
        land(e.target);
    }), { rootMargin: '0px 0px -10% 0px' }) : null;
    // once, as the page opens: what shows at all belongs to the first screen
    const sort = WATCH ? new IntersectionObserver(es => {
        es.forEach(e => {
            const im = e.target;
            sort.unobserve(im);
            if (!e.isIntersecting) { im.dataset.below = '1'; rows.observe(im); land(im); }
            else if (gate) { im.dataset.seen = '1'; land(im); }
            else lead.add(im);
        });
        sorted = true;
        if (!gate && !gateTimer) gateTimer = setTimeout(openGate, 700);
        tryGate();
    }) : null;
    const arrive = root => root.querySelectorAll('img.fade:not(.in)').forEach(im => {
        if (im.dataset.arriving) return;
        im.dataset.arriving = '1';
        const ready = () => { im.dataset.ready = '1'; land(im); tryGate(); };
        if (sort) sort.observe(im); else im.dataset.seen = '1';
        if (im.complete && im.naturalWidth) ready();
        else {
            im.addEventListener('load', () => decoded(im).then(ready), { once: true });
            im.addEventListener('error', ready, { once: true });
        }
    });
    // the painting's place in its photograph (js/boxes.js). Nothing is cropped:
    // only this part of a picture answers the pointer, the white around it does
    // nothing. a = the photograph's proportion, f = its frame's, s = how much of
    // the frame the picture takes
    const boxOf = w => (typeof BOXES !== 'undefined' && BOXES[w.slug]) || [0, 0, 1, 1];
    const hit = (w, f, s = 1) => {
        const b = boxOf(w), a = (w.w || 3) / (w.h || 4);
        const pw = s * (a < f ? a / f : 1), ph = s * (a < f ? 1 : f / a);
        const pc = v => `${(v * 100).toFixed(1)}%`;
        return `<span class="hit" style="left:${pc(0.5 + (b[0] - 0.5) * pw)};top:${pc(0.5 + (b[1] - 0.5) * ph)};width:${pc((b[2] - b[0]) * pw)};height:${pc((b[3] - b[1]) * ph)}"></span>`;
    };
    // what js/collection.js borrows
    window.KCH = { put, arrive, hit };

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
    const printImg = (slug, size, px) => `${ROOT}IMAGES/prints/${slug}-${size.toLowerCase()}-${px}.webp?v=20261125a`;
    const orderHref = (w, size) => `mailto:${SITE.email}?subject=` + encodeURIComponent(`Print order: ${plain(w)}, ${size}`);
    const roman   = s => s.replace(/\b(III|II|IV|V|I)\b/g, '<span class="rn">$1</span>');
    const nameOf  = w => roman((w.title.split('|')[1] || w.title).trim());
    const plain   = w => (w.title.split('|')[1] || w.title).trim();
    const altOf   = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const label   = w => w.title.replace(' | ', ' ');
    // a number never parts from its unit at the end of a line
    const nb      = s => String(s).replace(/ /g, '\u00a0');
    const price   = w => `${w.price}\u00a0€`;
    const status  = w => w.sold ? 'sold' : (w.unavailable ? 'currently not available' : 'available');
    const two     = n => String(n).padStart(2, '0');
    // a click on a painting opens the lightbox out of it, on the same page
    // (see openWork); from the slideshow it simply fades in
    let clickedAt = -Infinity, navAt = -Infinity, fromHero = false, keyed = false;
    document.addEventListener('click', e => {
        if (!e.target.closest) return;
        const now = performance.now();
        keyed = e.detail === 0;   // pressed from the keyboard, not with a mouse
        fromHero = !!e.target.closest('.hero-wrap');
        if (e.target.closest('[data-work]')) clickedAt = navAt = now;
        else if (fromHero && e.target.closest('a')) navAt = now;
    }, true);
    let heroList = [];

    // ── home: the slideshow, as on the live site: the name over the painting,
    //    medium, size and year under it, the count and its arrows ──
    const slidesWrap = document.getElementById('slides');
    if (slidesWrap) {
        const picks = heroList = WORKS.filter(w => w.hero).sort((a, b) => a.hero - b.hero);
        // WebP at 1600 and 2400 px (the JPEG masters stay for zooming). The
        // first painting loads at once (index.html preloads it); the others
        // wait until it is on screen, so they never compete with it.
        const heroSet = w => `${thumb(w, '-hero')} 1600w, ${thumb(w, '-hero-2400')} 2400w`;
        put(slidesWrap, picks.map((w, i) =>
            `<div class="slide">
                 <a href="#${w.slug}" aria-label="${plain(w)}, ${colOf[w.slug].name}">
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
        const N = slides.length;
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
            const w = picks[cur];
            // new words each time, so they rise in again with each painting
            cap.innerHTML =
                `<a class="hc-title" href="#${w.slug}" tabindex="-1">${roman(w.title)}</a>
                 <span class="hc-specs">${w.medium}<i>|</i>${nb(w.size)}<i>|</i>${w.year}${w.sold ? '<i>|</i>sold' : ''}</span>`;
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

    // ── home: the selected works, whole, four across, as on the collection pages:
    //    under each its collection and name, shown only under the mouse (style.css).
    //    They open here, on this page ──
    const selWorks = (typeof HOME !== 'undefined' ? HOME.selected || [] : []).map(s => bySlug[s]).filter(Boolean);
    const selected = document.getElementById('selected');
    if (selected) {
        put(selected, selWorks.map(w =>
            `<a class="sel-item" href="#${w.slug}" data-work="${w.slug}" aria-label="${plain(w)}, ${colOf[w.slug].name.toLowerCase()}${w.sold ? ', sold' : ''}">
                        <span class="sel-frame"><img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) 41vw, (max-width: 1100px) 21vw, 17vw"
                             alt="${altOf(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">${hit(w, 3 / 4)}</span>
                        <span class="sp-cap${w.sold ? ' sold' : ''}"><span class="sp-no">${colOf[w.slug].name}</span><span class="sp-nm">${nameOf(w)}</span></span>
                    </a>`).join(''));
    }

    // ── home: the collections. On the left the word, the numbered list and the
    //    picked collection's note; on the right the tiles, all one size, some
    //    upright and some on their side, in ordered disorder: each starts on a
    //    half-column of the page and they end at the foot of the words. The first
    //    is picked to start; pointing at a row or a tile picks it, a click opens it ──
    const colList = document.getElementById('col-list');
    if (colList) {
        const tileImg = c => `<img class="fade" src="${thumb(bySlug[c.cover], '-tile')}" alt="" width="1600" height="1200" loading="lazy" decoding="async">`;
        const facts = c => {
            if (c.kind === 'prints') return `${c.prints.length} prints, giclée on archival paper, ${PRINT_FORMATS.map(f => f.size).join(', ')}.`;
            const media = [...new Set(c.works.map(w => w.medium))].join(' and ');
            const ys = c.works.map(w => w.year), y0 = Math.min(...ys), y1 = Math.max(...ys);
            return `${c.works.length} ${c.works.length === 1 ? 'work' : 'works'}, ${media}, ${y0 === y1 ? y0 : `${y0}–${y1}`}.`;
        };
        put(colList,
            `<div class="cl-side"><h2 class="cl-head" id="cl-head">collections</h2><ol class="cl-index">` + COLS.map((c, i) =>
                `<li><a href="${pageOf(c)}" data-col="${i}"${i ? '' : ' class="on"'}><span class="cl-no">${two(i + 1)}</span><span class="cl-nm">${c.name.toLowerCase()}</span></a></li>`).join('') +
            `</ol><div class="cl-text">` + COLS.map((c, i) =>
                `<div class="cl-about${i ? '' : ' on'}" data-about="${i}"><p class="cl-note">${c.note || ''}</p><p class="cl-facts">${facts(c)}</p></div>`).join('') +
            `</div></div><div class="cl-tiles">` + COLS.map((c, i) =>
                `<a class="cl-tile t${i + 1}${i ? '' : ' on'}" href="${pageOf(c)}" data-col="${i}" aria-label="${c.name.toLowerCase()}"><span class="cl-img">${tileImg(c)}</span><span class="sp-cap"><span class="sp-no">${two(i + 1)}</span><span class="sp-nm">${c.name.toLowerCase()}</span></span></a>`).join('') +
            `</div>`);
        const pick = i => {
            colList.querySelectorAll('[data-col]').forEach(el => el.classList.toggle('on', el.dataset.col === i));
            colList.querySelectorAll('.cl-about').forEach(el => el.classList.toggle('on', el.dataset.about === i));
        };
        const at = e => { const m = e.target.closest && e.target.closest('[data-col]'); if (m) pick(m.dataset.col); };
        colList.addEventListener('pointerover', at);
        colList.addEventListener('focusin', at);
    }

    // ── lightbox ─────────────────────────────────────────────
    let openWork = () => {}, closeLb = () => {}, onPaint = () => true, canZoom = () => true;
    const lb = document.getElementById('lightbox');
    if (lb) {
        const img = document.getElementById('lightbox-img');
        const info = lb.querySelector('.lightbox-info');
        const mail = document.getElementById('lb-inquire-mail');
        const insta = document.getElementById('lb-inquire-ig');
        const printLink = document.getElementById('lb-print');
        const inPrint = new Set(COLS.flatMap(c => (c.prints || []).map(p => p.work)));
        let idx = 0, back = null, scrollY = 0, full = false;
        // the works the arrows walk through, and whether a click put us here
        // (then closing goes one step back in the browser's history too)
        let list = [], entered = false;
        // a work photographed small (the works on paper) has no zoom, is never drawn
        // past 1.5x its photograph, and opens at most as tall as the smallest one (434px)
        const LARGEST = 1.5, SMALL_H = 434, zoomOK = w => w.w >= 1000;
        const smallScale = w => Math.min(LARGEST, SMALL_H / w.h);
        canZoom = () => zoomOK(WORKS[idx]);
        const behind = () => document.querySelectorAll('.top, main, .foot');
        // zoomed: where the painting stands (x, y) and where it is going (tx, ty)
        let pan = null, raf = 0, drag = null, moved = false;
        // on the main page the arrows stay with what was clicked: the slideshow's
        // works or the selected works; anywhere else with the work's collection
        const listOf = w => {
            if (slidesWrap && fromHero && heroList.includes(w)) return heroList;
            if (slidesWrap && selWorks.includes(w)) return selWorks;
            return colOf[w.slug].works;
        };

        // hold the page still behind the lightbox, and put it back in one frame
        const lock = () => {
            scrollY = window.scrollY;
            document.body.style.top = `-${scrollY}px`;
            document.documentElement.classList.add('lb-open');
            behind().forEach(el => { el.inert = true; });
        };
        const unlock = () => {
            const root = document.documentElement;
            if (!root.classList.contains('lb-open')) return;
            root.classList.remove('lb-open');
            behind().forEach(el => { el.inert = false; });
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
        // its pace and its blur are his numbers (style.css, :root)
        const LB = { t: parseFloat(cssVar('--lb-t')) || 650, blur: parseFloat(cssVar('--lb-blur')) || 7,
                     sideT: parseFloat(cssVar('--side-t')) || 600, sideBlur: parseFloat(cssVar('--side-blur')) || 8 };
        // the words sharpen one after another; the close mark and the neighbours follow
        const wordsIn = delay => {
            [...info.children].filter(el => !el.hidden).forEach((el, n) => el.animate(
                [{ opacity: 0, filter: `blur(${LB.blur / 2}px)` }, { opacity: 1, filter: 'blur(0)' }],
                { duration: LB.t, delay: delay + n * 70, easing: EASE_OUT, fill: 'backwards' }));
            lb.querySelectorAll('.lightbox-btn, .lb-side').forEach(el => el.animate([{ opacity: 0 }, {}],
                { duration: LB.t, delay: delay + LB.t * 0.25, easing: EASE, fill: 'backwards' }));
        };
        // only the painting is drawn, not the white of its photograph (js/boxes.js):
        // toward the edges the page shows through, and a white box would stand on it
        const clip = () => {
            const w = WORKS[idx], b = boxOf(w), W = img.clientWidth, H = img.clientHeight, ar = w.w / w.h;
            if (!W || !H) return;
            let pw = W, ph = pw / ar;
            if (ph > H) { ph = H; pw = ph * ar; }
            const ox = (W - pw) / 2, oy = (H - ph) / 2, px = v => `${v.toFixed(1)}px`;
            img.style.clipPath = `inset(${px(oy + b[1] * ph)} ${px(ox + (1 - b[2]) * pw)} ${px(oy + (1 - b[3]) * ph)} ${px(ox + b[0] * pw)})`;
        };
        addEventListener('resize', () => { if (lb.classList.contains('active')) clip(); });
        img.addEventListener('load', () => { if (lb.classList.contains('active')) clip(); });
        // the works before and after wait at the edges, small and out of focus (wide
        // screens; style.css). A click brings one forward, as the arrows and keys do
        const mkSide = d => {
            const s = document.createElement('span');
            s.className = `lb-side ${d < 0 ? 'lb-side-prev' : 'lb-side-next'}`;
            s.setAttribute('aria-hidden', 'true');
            s.innerHTML = '<img alt="">';
            s.addEventListener('click', e => { e.stopPropagation(); step(d); });
            lb.insertBefore(s, lb.querySelector('.lightbox-content'));
            return s;
        };
        const prevEl = mkSide(-1), nextEl = mkSide(1);
        const pc = v => `${(v * 100).toFixed(2)}%`;
        const sideOf = (el, w, src) => {
            const im = el.firstChild, b = boxOf(w);
            im.width = w.w; im.height = w.h;
            im.src = src || thumb(w, '-800');
            im.style.clipPath = `inset(${pc(b[1])} ${pc(1 - b[2])} ${pc(1 - b[3])} ${pc(b[0])})`;
            el.dataset.slug = w.slug;
            decoded(im);
        };
        // the painting just looked at moves to the edge as it is: a copy of the very
        // picture on screen, so nothing has to load or flash on the way
        const sideAs = (el, w) => {
            const pic = img.cloneNode(false), b = boxOf(w);
            ['id', 'role', 'tabindex', 'aria-label', 'style', 'class'].forEach(a => pic.removeAttribute(a));
            pic.alt = '';
            pic.style.clipPath = `inset(${pc(b[1])} ${pc(1 - b[2])} ${pc(1 - b[3])} ${pc(b[0])})`;
            el.replaceChild(pic, el.firstChild);
            el.dataset.slug = w.slug;
        };
        const sideBlur = () => parseFloat(getComputedStyle(lb).getPropertyValue('--side-blur')) || 0;
        // whatever a finger left on the pictures (their own blur), gone
        const unfinger = () => { img.style.filter = ''; prevEl.style.filter = ''; nextEl.style.filter = ''; };
        const near = (w, d) => list[(list.indexOf(w) + d + list.length) % list.length];
        const setSides = w => {
            lb.classList.toggle('lb-alone', list.length < 2);
            if (list.length < 2) return;
            sideOf(prevEl, near(w, -1)); sideOf(nextEl, near(w, 1));
        };
        const sidesOn = () => list.length > 1 && getComputedStyle(prevEl).display !== 'none';
        // is the pointer on the painting, or on the white of its photograph?
        onPaint = e => {
            if (pan) return true;
            const w = WORKS[idx], b = boxOf(w), s = shown(w), h = s.w / (w.w / w.h);
            const x = (e.clientX - s.x) / s.w + 0.5, y = (e.clientY - s.y) / h + 0.5;
            return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];
        };
        const SIZES = '(max-width: 800px) 88vw, 50vw';
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
        let closing = false, stepDir = 0;

        closeLb = keepHash => {
            if (!lb.classList.contains('active') || closing) return;
            const finish = () => {
                lb.classList.remove('active');
                lb.getAnimations({ subtree: true }).forEach(a => a.cancel());
                lb.style.removeProperty('--drag'); lb.style.removeProperty('--pull'); lb.classList.remove('lb-snap'); unfinger();
                requestAnimationFrame(() => lb.classList.remove('lb-flip'));
                closing = false;
                unlock();
                if (!keepHash) {
                    if (entered) history.back();
                    else history.replaceState(null, '', location.pathname + location.search);
                }
                entered = false;
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
            const move = onto(to, w), out = Math.round(LB.t * 0.8);
            veil(false, { duration: out, easing: EASE, fill: 'forwards' });
            lb.querySelectorAll('.lightbox-info, .lightbox-btn, .lb-side').forEach(el => el.animate([{ opacity: 0 }], { duration: out * 0.45, easing: EASE, fill: 'forwards' }));
            img.animate([{ transform: 'none' }, { transform: move }], { duration: out, easing: EASE, fill: 'forwards' })
               .onfinish = () => { img.style.transition = ''; finish(); };
        };

        openWork = (i, instant) => {
            const was = WORKS[idx], dir = stepDir;
            stepDir = 0;
            let hop = null;
            idx = (i + WORKS.length) % WORKS.length;
            const w = WORKS[idx];
            const fresh = !lb.classList.contains('active');
            if (fresh) entered = performance.now() - navAt < 900;
            if (fresh || !list.includes(w)) list = listOf(w);
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
            img.style.transformOrigin = 'center center';
            full = false;
            const loading = sharp(w);
            if (from) {
                // the picture already on screen comes along at once; the sharp one
                // takes its place when it is drawn and the painting has arrived
                setPic(w, from);
            } else if (fresh) {
                setPic(w, { sizes: SIZES, srcset: srcset(w), src: thumb(w, '-1600') });
            } else if (dir && !REDUCE_MOTION && sidesOn() && (dir > 0 ? nextEl : prevEl).dataset.slug === w.slug && (dir > 0 ? nextEl : prevEl).firstChild.complete) {
                // a step with the neighbours on screen: the one waiting at the edge comes
                // forward (the move itself is below, once the words and sizes are set)
                lb.getAnimations({ subtree: true }).forEach(a => a.finish());
                if (stepFade) { stepFade.cancel(); stepFade = null; }
                const comeEl = dir > 0 ? nextEl : prevEl, cs = getComputedStyle(comeEl);
                hop = { old: was, at: shown(was), come: comeEl.getBoundingClientRect(), blur: cs.filter === 'none' ? 'blur(0px)' : cs.filter, op: cs.opacity };
                // the one looked at goes to the far edge before its picture is replaced
                sideAs(dir > 0 ? prevEl : nextEl, was);
                setPic(w, comeEl.firstChild);
            } else {
                // a step without them (a phone): this one dissolves, the next sharpens once drawn
                const now = getComputedStyle(img).opacity, soft = `blur(${(LB.blur * 0.8).toFixed(1)}px)`;
                if (stepFade) stepFade.cancel();
                const fade = stepFade = REDUCE_MOTION ? null : img.animate([{ opacity: now, filter: 'blur(0)' }, { opacity: 0, filter: soft }], { duration: LB.t * 0.45, easing: EASE, fill: 'forwards' });
                Promise.all([loading, fade ? fade.finished.catch(() => {}) : null]).then(([m]) => {
                    if (WORKS[idx] !== w) return;
                    setPic(w, m);
                    if (fade) { fade.cancel(); stepFade = null; img.animate([{ opacity: 0, filter: soft }, { opacity: 1, filter: 'blur(0)' }], { duration: LB.t * 0.9, easing: EASE_OUT }); }
                });
            }
            if (!hop) setSides(w);
            img.alt = altOf(w);
            const can = zoomOK(w);
            img.style.maxWidth = can ? '' : `${Math.round(w.w * smallScale(w))}px`;
            img.style.maxHeight = can ? '' : `${Math.round(w.h * smallScale(w))}px`;
            clip();
            img.tabIndex = can ? 0 : -1;
            if (can) { img.setAttribute('role', 'button'); img.setAttribute('aria-label', `Zoom in, ${img.alt}`); }
            else { img.removeAttribute('role'); img.removeAttribute('aria-label'); }

            document.getElementById('lb-title').innerHTML = nameOf(w);
            document.getElementById('lb-col').textContent = colOf[w.slug].name;
            document.getElementById('lb-price').textContent = price(w);
            document.getElementById('lb-specs').innerHTML = `${w.medium}<br>${nb(w.size)}, ${w.year}`;
            document.getElementById('lb-count').textContent = `${two(list.indexOf(w) + 1)} / ${two(list.length)}`;
            const st = document.getElementById('lb-status');
            st.hidden = !(w.sold || w.unavailable);
            st.innerHTML = st.hidden ? '' : `<span class="status-text">${status(w)}</span>`;
            info.classList.toggle('is-sold', !!w.sold);
            info.classList.toggle('is-unavailable', !w.sold && !!w.unavailable);
            // a sold work cannot be inquired about: a similar one can, and its print
            mail.textContent = w.sold ? 'ask about a similar work' : 'inquire via email';
            mail.href = `mailto:${SITE.email}?subject=` + encodeURIComponent(`${w.sold ? 'A work like' : 'Inquiry:'} ${noOf[w.slug]}, ${label(w)}`);
            insta.hidden = !!w.sold;
            printLink.hidden = !(w.sold && inPrint.has(w.slug));
            printLink.href = `${ROOT}prints/?work=${w.slug}`;
            lb.querySelector('.lb-extra').hidden = !!w.sold;

            if (hop) {
                const come = dir > 0 ? nextEl : prevEl, go = dir > 0 ? prevEl : nextEl;
                lb.style.removeProperty('--drag'); lb.classList.remove('lb-snap');
                unfinger();
                const is = shown(w), t = LB.sideT;
                // the newcomer grows from the edge into the middle, and sharpens: it
                // starts exactly as it stood (its place, its blur, its strength)
                const grow = img.animate([
                    { transform: `translate(${(hop.come.left + hop.come.width / 2 - is.x).toFixed(1)}px, ${(hop.come.top + hop.come.height / 2 - is.y).toFixed(1)}px) scale(${(hop.come.width / is.w).toFixed(4)})`, filter: hop.blur, opacity: hop.op },
                    { transform: 'none', filter: 'blur(0px)', opacity: 1 }], { duration: t, easing: EASE });
                // the one that was looked at takes its place at the other edge, and softens
                const g = go.getBoundingClientRect();
                go.animate([
                    { transform: `translate(${(hop.at.x - g.left - g.width / 2).toFixed(1)}px, ${(hop.at.y - g.top - g.height / 2).toFixed(1)}px) scale(${(hop.at.w / g.width).toFixed(4)})`, filter: 'blur(0px)', opacity: 1 },
                    { filter: `blur(${sideBlur()}px)` }], { duration: t, easing: EASE });
                // and the next one along appears where the newcomer waited
                sideOf(come, near(w, dir));
                come.animate([{ opacity: 0 }, {}], { duration: t, delay: t * 0.4, easing: EASE, fill: 'backwards' });
                Promise.all([loading, grow.finished.catch(() => {})]).then(([m]) => { if (WORKS[idx] === w && !full) setPic(w, m); });
            }
            if (fresh) {
                // only the keyboard is given its place back: a mouse has no use for the ring
                back = keyed && document.activeElement !== document.body ? document.activeElement : null;
                lock();
                if (from) {
                    lb.classList.add('lb-flip', 'active');
                    const move = onto(from, w);
                    veil(true, { duration: LB.t, easing: EASE });
                    wordsIn(LB.t * 0.4);
                    const grow = img.animate([{ transform: move }, { transform: 'none' }], { duration: LB.t * 1.1, easing: EASE_OUT });
                    grow.onfinish = () => lb.classList.remove('lb-flip');
                    Promise.all([loading, grow.finished.catch(() => {})]).then(([m]) => { if (WORKS[idx] === w && !full) setPic(w, m); });
                } else if (instant) {
                    // arriving at a work's address: the lightbox is simply open
                    lb.classList.add('lb-flip', 'active');
                    requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.remove('lb-flip')));
                } else lb.classList.add('active');
                lb.focus({ preventScroll: true });
            }
            history.replaceState(null, '', '#' + w.slug);
            track('open/' + w.slug, label(w));
        };

        const step = d => {
            const j = list.indexOf(WORKS[idx]);
            stepDir = d;
            openWork(WORKS.indexOf(list[(j + d + list.length) % list.length]));
            // a step that did not carry the neighbour forward: what the finger moved settles back
            if (lb.style.getPropertyValue('--drag')) { lb.classList.add('lb-snap'); lb.style.setProperty('--drag', '0px'); unfinger(); }
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
            img.setAttribute('aria-label', `Zoom out, ${img.alt}`);
        };
        const zoomOut = () => {
            pan = null; cancelAnimationFrame(raf); raf = 0; drag = null;
            img.classList.remove('is-zoomed');
            img.style.transition = REDUCE_MOTION ? 'none' : `transform ${T.base}ms ${EASE_OUT}`;
            img.style.transform = '';
            setTimeout(() => { if (!pan) img.style.transition = ''; }, T.base);
            img.setAttribute('aria-label', `Zoom in, ${img.alt}`);
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
            // the white around the painting closes, as the white beyond it does
            if (!onPaint(e)) { closeLb(); return; }
            if (!canZoom()) return;
            if (pan) zoomOut(); else zoomIn(e.clientX, e.clientY);
        });
        img.addEventListener('pointermove', e => { img.style.cursor = onPaint(e) && canZoom() ? '' : 'default'; });
        // a swipe anywhere in the lightbox carries the painting and its neighbours
        // with the finger (--drag, style.css); let go past a fifth of the screen, or
        // with a flick, and the next one comes forward, otherwise all settle back.
        // Not while zoomed in: then the finger moves about the painting
        let sw = null;
        lb.addEventListener('touchstart', e => {
            if (pan || e.touches.length > 1 || e.target.closest('a, button, input')) { sw = null; return; }
            const t = e.touches[0];
            sw = { x: t.clientX, y: t.clientY, t: performance.now(), dx: 0, dy: 0, on: null };
        }, { passive: true });
        lb.addEventListener('touchmove', e => {
            if (!sw || pan) return;
            const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
            if (sw.on === null && Math.abs(dx) + Math.abs(dy) > 8) sw.on = Math.abs(dx) > 1.2 * Math.abs(dy) ? 'x' : (dy > 0 ? 'down' : 'no');
            lb.classList.remove('lb-snap');
            if (sw.on === 'down') {
                sw.dy = Math.max(0, dy);
                lb.style.setProperty('--pull', `${(sw.dy * 0.6).toFixed(1)}px`);
                return;
            }
            if (sw.on !== 'x') return;
            sw.dx = dx;
            // past the last work there is nothing to carry: the row resists
            lb.style.setProperty('--drag', `${(list.length > 1 ? dx : dx * 0.3).toFixed(1)}px`);
            if (list.length < 2 || !sidesOn()) return;
            // the one coming in sharpens as it nears the middle; this one softens
            const p = Math.min(1, Math.abs(dx) / (innerWidth * 0.55)), sb = sideBlur();
            (dx < 0 ? nextEl : prevEl).style.filter = `blur(${(sb * (1 - p)).toFixed(2)}px)`;
            (dx < 0 ? prevEl : nextEl).style.filter = '';
            img.style.filter = `blur(${(sb * p * 0.5).toFixed(2)}px)`;
        }, { passive: true });
        const settle = () => { lb.classList.add('lb-snap'); lb.style.setProperty('--drag', '0px'); lb.style.setProperty('--pull', '0px'); unfinger(); };
        lb.addEventListener('touchend', () => {
            if (!sw) return;
            const { dx, dy, on } = sw, ms = Math.max(1, performance.now() - sw.t);
            sw = null;
            if (on !== 'x' && on !== 'down') return;
            moved = true;
            if (on === 'down') {
                // far enough, or a flick: the lightbox goes, from where the finger left it
                if (dy > 110 || (dy > 40 && dy / ms > 0.5)) closeLb();
                else settle();
                return;
            }
            const quick = Math.abs(dx) / ms > 0.5;
            if (list.length > 1 && (Math.abs(dx) > innerWidth / 5 || (quick && Math.abs(dx) > 30))) step(dx < 0 ? 1 : -1);
            else settle();
        }, { passive: true });
        lb.addEventListener('touchcancel', () => { sw = null; settle(); }, { passive: true });
        img.addEventListener('keydown', e => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            if (pan) zoomOut(); else zoomIn(null, null);
        });

        lb.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
        lb.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); step(1); });
        lb.querySelector('.lb-close').addEventListener('click', e => { e.stopPropagation(); closeLb(); });
        lb.addEventListener('click', e => { if (!e.target.closest('.lightbox-info, .lightbox-btn') && e.target !== img) closeLb(); });
        mail.addEventListener('click', () => track('inquire-email/' + WORKS[idx].slug, label(WORKS[idx])));
        insta.addEventListener('click', () => track('inquire-instagram/' + WORKS[idx].slug, label(WORKS[idx])));
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('active')) return;
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'Tab') {
                // keep the keyboard inside while it is open
                const els = Array.from(lb.querySelectorAll('button, a[href], [tabindex="0"]')).filter(el => el.offsetParent !== null);
                const first = els[0], last = els[els.length - 1], now = document.activeElement;
                if (e.shiftKey && (now === first || now === lb)) { e.preventDefault(); last.focus(); }
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
            // (his Canva, 2026-10-21) the print chosen on column 2; on column 3 its
            // words: the two paintings, the sizes with the price, the measure and
            // edition, the order link. The choice in use is bold and larger
            const PR = c.prints, F = PR[0].formats;
            const startF = F.find(f => f.size === 'A2') || F[0];
            const pic = (p, f, px) => printImg(p.work, f.size, px);
            put(panel,
                `<div class="pr grid"><div class="pr-pic" data-size="${startF.size}"><span class="pr-sheet"><img class="fade" src="${pic(PR[0], startF, 1100)}" srcset="${pic(PR[0], startF, 600)} 600w, ${pic(PR[0], startF, 1100)} 1100w" sizes="(max-width: 800px) 78vw, 24vw" width="1100" height="1556" alt="Print of ${plain(bySlug[PR[0].work])}, ${startF.size}" decoding="async"><img class="pr-over" alt="" aria-hidden="true" width="1100" height="1556" sizes="(max-width: 800px) 78vw, 24vw"></span></div>` +
                `<div class="pr-info"><span class="pr-k">a print of</span>` +
                PR.map((p, i) => `<button type="button" class="pr-opt" data-print="${i}" aria-pressed="${i === 0}">${nameOf(bySlug[p.work])}</button>`).join('') +
                `<span class="pr-sizes" role="group" aria-label="size"><span class="pr-in">in</span>` +
                F.map(f => `<button type="button" class="pr-opt" data-size="${f.size}" aria-pressed="${f === startF}">${f.size}</button>`).join('') + `</span>` +
                `<span class="pr-price">${nb(startF.price + ' €')}</span>` +
                `<span class="pr-facts">${nb(startF.cm)}, edition of ${startF.edition}</span>` +
                `<a class="lb-submit pr-order" href="${orderHref(bySlug[PR[0].work], startF.size)}">order by email</a>` +
                `<a class="lb-submit pr-ask" href="${SITE.instagram}" target="_blank" rel="noopener">inquire via instagram</a></div></div>`);

            const st = { p: 0, f: startF };
            // the sheet stays where it is; the picture on it turns into the next with
            // no gap between them: the new one fades in over the old, then takes its place
            const PR_T = parseFloat(cssVar('--pr-t')) || 1200;
            let turnNo = 0;
            const turn = (im, src, set) => {
                const over = panel.querySelector('.pr-over'), no = ++turnNo;
                const give = el => { el.srcset = set; el.src = src; };
                // a change while one is under way: what was coming is taken as arrived
                if (over.getAnimations().length) { im.srcset = over.srcset; im.src = over.src; }
                over.getAnimations().forEach(a => a.cancel());
                if (REDUCE_MOTION || !im.classList.contains('in')) { give(im); return; }
                give(over);
                decoded(over).then(() => {
                    if (no !== turnNo) return;
                    const fade = over.animate({ opacity: [0, 1] }, { duration: PR_T, easing: EASE, fill: 'forwards' });
                    fade.onfinish = () => { if (no !== turnNo) return; give(im); decoded(im).then(() => { if (no === turnNo) fade.cancel(); }); };
                });
            };
            const sync = () => {
                const p = PR[st.p], w = bySlug[p.work], f = st.f, im = panel.querySelector('.pr-pic img');
                turn(im, pic(p, f, 1100), `${pic(p, f, 600)} 600w, ${pic(p, f, 1100)} 1100w`);
                im.alt = `Print of ${plain(w)}, ${f.size}`;
                panel.querySelector('.pr-pic').dataset.size = f.size;
                panel.querySelectorAll('.pr-opt[data-print]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.print === st.p));
                panel.querySelectorAll('.pr-opt[data-size]').forEach(b => b.setAttribute('aria-pressed', b.dataset.size === f.size));
                panel.querySelector('.pr-facts').textContent = `${nb(f.cm)}, edition of ${f.edition}`;
                panel.querySelector('.pr-price').textContent = nb(f.price + ' €');
                const o = panel.querySelector('.pr-order');
                o.href = orderHref(w, f.size);
                o.setAttribute('aria-label', `Order the ${f.size} print of ${plain(w)} by email`);
            };
            // arriving from a sold painting's "see the print": that painting's print
            const asked = PR.findIndex(p => p.work === new URLSearchParams(location.search).get('work'));
            if (asked > 0) { st.p = asked; sync(); }
            panel.addEventListener('click', e => {
                if (e.target.closest('.pr-order')) { const w = bySlug[PR[st.p].work]; track(`order-print/${w.slug}-${st.f.size.toLowerCase()}`, `Print order: ${plain(w)}, ${st.f.size}`); return; }
                const b = e.target.closest('[data-print], [data-size]');
                if (!b) return;
                if (b.dataset.print != null) st.p = +b.dataset.print;
                if (b.dataset.size) st.f = F.find(f => f.size === b.dataset.size) || st.f;
                sync();
            });
        }
        // the other collections are drawn by js/collection.js: grid and wall
    }

    // #<slug>: on the main page any work opens right there; on a collection page a
    // work of this collection opens, one of another goes to its page
    if (lb || page) {
        const here = page && (COLS.find(x => x.slug === page.dataset.collection) || COLS[0]);
        const route = first => {
            let h = '';
            try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
            if (bySlug[h]) {
                if (here && colOf[h] !== here) { location.replace(pageOf(colOf[h]) + '#' + h); return; }
                openWork(WORKS.indexOf(bySlug[h]), first === true);
            } else closeLb(true);
        };
        window.addEventListener('hashchange', route);
        route(true);
    }

    // ── paintings arrive: each fades in once its picture has loaded ──
    arrive(document);

    // ── the first page of a visit is held back (html.first, set in its head)
    //    until its first picture can be drawn, then all of it comes into focus
    //    together, from the white of the page ──
    if (rootEl.classList.contains('first')) {
        const lead = document.querySelector('.slide img') || document.querySelector('main img');
        const drawn = !lead ? Promise.resolve()
            : lead.complete ? decoded(lead)
            : new Promise(r => { lead.addEventListener('load', r, { once: true }); lead.addEventListener('error', r, { once: true }); });
        Promise.race([drawn, new Promise(r => setTimeout(r, 1200))]).then(() => {
            rootEl.classList.replace('first', 'first-in');
            document.body.addEventListener('animationend', function end(e) {
                if (e.target !== document.body) return;
                document.body.removeEventListener('animationend', end);
                rootEl.classList.remove('first-in');
            });
        });
    }

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
        touch = e.target.closest('.hero-wrap, .lightbox, input') || t.clientX < 24 || t.clientX > innerWidth - 24
            ? null : { x: t.clientX, y: t.clientY };
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!touch) return;
        const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
        touch = null;
        if (Math.abs(dx) > 80 && Math.abs(dx) > 1.8 * Math.abs(dy)) walk(dx < 0 ? 1 : -1);
    }, { passive: true });

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
        const wordFor = (el, e) => {
            if (!el || !el.closest) return '';
            const big = el.closest('#lightbox-img');
            if (big) return !onPaint(e) || !canZoom() ? '' : big.classList.contains('is-zoomed') ? 'zoom out' : 'zoom';
            return el.closest('[data-work], .slide a') ? 'view' : '';
        };
        document.addEventListener('pointermove', e => {
            if (e.pointerType !== 'mouse') return;
            tx = e.clientX + 14; ty = e.clientY + 18;
            const w = wordFor(e.target, e);
            if (w !== word) {
                if (w && !word) { x = tx; y = ty; tip.style.transform = `translate(${x}px, ${y}px)`; }
                word = w;
                if (w) tip.textContent = w;
                tip.classList.toggle('on', !!w);
            }
            if (REDUCE_MOTION) { x = tx; y = ty; tip.style.transform = `translate(${x}px, ${y}px)`; }
            else if (!raf) raf = requestAnimationFrame(follow);
        }, { passive: true });
        // a click that opens a painting: the word goes with the page it was on
        document.addEventListener('click', e => { if (word && e.target.closest && e.target.closest('[data-work], .slide a')) { word = ''; tip.classList.remove('on'); } });
        // a click on the picture changes what the next click does
        document.addEventListener('click', e => { if (word && e.target.closest && e.target.closest('#lightbox-img')) requestAnimationFrame(() => { word = wordFor(e.target, e); tip.textContent = word; }); });
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
