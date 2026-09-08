/* Renders the catalogue from COLLECTIONS (js/data.js).
   Page-aware: each block runs only if its container is on the page, so one
   file drives the home page (hero + collections + lightbox) and any sub-page
   that carries only some of them. No artwork data lives in HTML — edit
   data.js only.

   ROOT (set per page before this script) prefixes image paths so they resolve
   from sub-folders: '' at the site root, '../' in a sub-folder. */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof COLLECTIONS === 'undefined') return;

    const ROOT = window.ROOT || '';
    const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── analytics events (GoatCounter) ───────────────────────
    // count.js loads only on the live domain (bottom of this file). track()
    // sends the event if the API is ready, otherwise queues it; the loader
    // flushes the queue once count.js is in. Off the live domain the queue
    // is never flushed, so nothing is ever sent from staging or local.
    const gcQueue = (window.__gcQueue = window.__gcQueue || []);
    const track = (path, title) => {
        const vars = { path, title: title || path, event: true };
        if (window.goatcounter && typeof window.goatcounter.count === 'function') window.goatcounter.count(vars);
        else gcQueue.push(vars);
    };
    const workLabel = w => w.title.replace(' | ', ' ');

    const hasHero        = !!document.getElementById('slides-container');
    const hasCollections = !!document.getElementById('works');
    const hasLightbox    = !!document.getElementById('lightbox');

    // works flagged `draft: true` in data.js are held back from the whole site
    // (grid, legend, lightbox, hero, counts, structured data) until published —
    // remove the flag to go live. They never reach the rendered HTML.
    const WORKS = COLLECTIONS.flatMap(c => c.works).filter(w => !w.draft);

    // ── helpers ──────────────────────────────────────────────
    const displaySrc = w => `${ROOT}IMAGES/works/${w.slug}.jpg`;
    const heroSrc    = w => `${ROOT}IMAGES/works/${w.slug}-hero.jpg`;
    const thumb      = (w, tier) => `${ROOT}IMAGES/thumbs/${w.slug}${tier || ''}.webp`;

    // Every rendered work is WebP: 400 / 800 / 1600. The source JPEG is a
    // master, not a delivery format — it is fetched only when someone zooms
    // inside the lightbox, which is the one moment the detail is wanted.
    // (Median 1600px WebP is 107 KB against 505 KB for the JPEG.)
    const workSrcset = w => `${thumb(w)} 400w, ${thumb(w, '-800')} 800w, ${thumb(w, '-1600')} 1600w`;
    const GRID_SIZES = '(max-width: 800px) 33vw, (max-width: 1100px) 25vw, 20vw';
    const LB_SIZES   = '(max-width: 800px) 88vw, 58vw';

    // displayed numbers are sequential per collection (each restarts at 01);
    // w.ref stays the permanent archive number used in file names
    const pad = n => String(n).padStart(2, '0');
    const collNo = {};
    COLLECTIONS.forEach(c => c.works.filter(w => !w.draft).forEach((w, i) => { collNo[w.slug] = pad(i + 1); }));
    const displayNo = w => collNo[w.slug];

    // three availability states: sold (red), unavailable (grey, held back
    // from sale but still shown), available (ink)
    const statusClass = w => w.sold ? ' sold' : (w.unavailable ? ' unavailable' : '');
    const statusText  = w => w.sold ? 'sold' : (w.unavailable ? 'currently not available' : 'available');

    const altText  = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const specsHtml = w => `${w.medium}<br>${w.size}<br>${w.year}`;
    const priceText = w => `${w.price} €`;

    const protectRoman = s => s.replace(/\b(III|II|I)\b/g, '<span style="text-transform:none">$1</span>');
    function titleHtml(title) {
        const [main, sub] = title.split('|').map(s => s.trim());
        return main + (sub ? `<br><span class="color-subtitle">${protectRoman(sub)}</span>` : '');
    }

    const slugIndex = Object.fromEntries(WORKS.map((w, i) => [w.slug, i]));

    // shared scroll-in observer
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.07 });

    // ── lightbox (works page) ────────────────────────────────
    let openWork = () => {};
    if (hasLightbox) {
        const lb      = document.getElementById('lightbox');
        const lbImg   = document.getElementById('lightbox-img');
        const lbPrev  = document.getElementById('lb-prev-btn');
        const lbNext  = document.getElementById('lb-next-btn');
        const lbClose = document.getElementById('lb-close-btn');
        const lbInfo  = document.querySelector('.lightbox-info');
        let lbIdx = 0;
        let lbReturnFocus = null;   // the tile or legend row that opened it
        let lbScrollY = 0;
        let lbFullFetched = false;  // has this work's full-res JPEG been pulled?

        function setHash(slug) {
            history.replaceState(null, '', slug ? '#' + slug : location.pathname + location.search);
        }

        // hold the page still while the lightbox is up: without this a scroll
        // gesture that misses the image drags the catalogue underneath, and
        // closing drops you somewhere you did not choose. The scrollbar width
        // is padded back so nothing shifts while the lightbox fades out.
        function lockScroll() {
            lbScrollY = window.scrollY;
            const sbw = window.innerWidth - document.documentElement.clientWidth;
            if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
            document.body.style.top = `-${lbScrollY}px`;
            document.documentElement.classList.add('lb-open');
        }
        function unlockScroll() {
            const root = document.documentElement;
            if (!root.classList.contains('lb-open')) return;
            root.classList.remove('lb-open');
            document.body.style.top = '';
            document.body.style.paddingRight = '';
            // html has scroll-behavior: smooth for the nav anchors, which would
            // animate this restore all the way down from the top. Put the page
            // back in one frame, then hand smooth scrolling back.
            const prev = root.style.scrollBehavior;
            root.style.scrollBehavior = 'auto';
            window.scrollTo({ top: lbScrollY, left: 0, behavior: 'instant' });
            root.style.scrollBehavior = prev;
        }

        function closeLb() {
            lb.classList.remove('active');
            unlockScroll();
            if (slugIndex[location.hash.slice(1)] !== undefined) setHash(null);
            // hand focus back to whatever opened the work, so a keyboard user
            // lands where they were instead of at the top of the page
            if (lbReturnFocus) { lbReturnFocus.focus(); lbReturnFocus = null; }
        }

        openWork = function (i, trigger) {
            lbIdx = (i + WORKS.length) % WORKS.length;
            const w = WORKS[lbIdx];

            lbImg.classList.remove('is-zoomed');
            lbImg.style.transformOrigin = 'center center';
            lbFullFetched = false;
            // width/height give the browser the ratio before the file lands,
            // so the panel does not jump as each work loads
            lbImg.width  = w.w;
            lbImg.height = w.h;
            lbImg.src    = thumb(w, '-1600');
            lbImg.srcset = workSrcset(w);
            lbImg.sizes  = LB_SIZES;
            lbImg.alt    = altText(w);

            document.getElementById('lb-title').innerHTML = titleHtml(w.title);
            document.getElementById('lb-price').textContent = priceText(w);
            document.getElementById('lb-specs').innerHTML = specsHtml(w);

            const st = document.getElementById('lb-status');
            lbInfo.classList.toggle('is-sold', !!w.sold);
            lbInfo.classList.toggle('is-unavailable', !w.sold && !!w.unavailable);
            if (w.sold || w.unavailable) {
                st.innerHTML = `<span class="status-dot${statusClass(w)}"></span>` +
                               `<span class="status-text" style="font-size:11px">${statusText(w)}</span>`;
                st.classList.remove('hidden');
            } else {
                st.classList.add('hidden');
            }

            document.getElementById('lb-inquire-mail').href =
                `mailto:${SITE.email}?subject=` + encodeURIComponent(`Inquiry: ${displayNo(w)}, ${w.title.replace(/\s*\|\s*/g, ' ')}`);

            ['lb-inquiry-section', 'lb-price'].forEach(id => document.getElementById(id).classList.remove('hidden'));
            [lbPrev, lbNext].forEach(el => el.classList.remove('hidden'));
            // record the opener on the way in only; prev/next must not clobber it
            if (!lb.classList.contains('active')) {
                lbReturnFocus = trigger || null;
                lockScroll();
            }
            lb.classList.add('active');
            setHash(w.slug);
            track('open/' + w.slug, workLabel(w));
        };

        // zooming is the moment someone actually wants the brush detail, so
        // that is when the full-resolution JPEG is fetched — preloaded first,
        // then swapped in, so the picture never blinks. Nobody pays for the
        // master by simply opening a work.
        function fetchFullRes() {
            if (lbFullFetched) return;
            lbFullFetched = true;
            const w = WORKS[lbIdx];
            const master = new Image();
            master.onload = () => {
                if (WORKS[lbIdx] !== w) return;      // moved on before it landed
                lbImg.removeAttribute('srcset');
                lbImg.removeAttribute('sizes');
                lbImg.src = master.src;
            };
            master.src = displaySrc(w);
        }

        lbImg.addEventListener('click', e => {
            e.stopPropagation();
            if (!lbImg.classList.contains('is-zoomed')) {
                fetchFullRes();
                const r = lbImg.getBoundingClientRect();
                lbImg.style.transformOrigin =
                    `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`;
                lbImg.classList.add('is-zoomed');
            } else {
                lbImg.classList.remove('is-zoomed');
                setTimeout(() => { if (!lbImg.classList.contains('is-zoomed')) lbImg.style.transformOrigin = 'center center'; }, 400);
            }
        });
        lbPrev.addEventListener('click', e => { e.stopPropagation(); openWork(lbIdx - 1); });
        lbNext.addEventListener('click', e => { e.stopPropagation(); openWork(lbIdx + 1); });
        lbClose.addEventListener('click', e => { e.stopPropagation(); closeLb(); });

        // inquiry-click events, attributed to the work currently open
        const lbMailBtn = document.getElementById('lb-inquire-mail');
        const lbIgBtn   = document.querySelector('#lb-inquiry-section a[href*="instagram"]');
        lbMailBtn && lbMailBtn.addEventListener('click', () => track('inquire-email/' + WORKS[lbIdx].slug, workLabel(WORKS[lbIdx])));
        lbIgBtn   && lbIgBtn.addEventListener('click',   () => track('inquire-instagram/' + WORKS[lbIdx].slug, workLabel(WORKS[lbIdx])));
        lb.addEventListener('click', e => {
            if (!e.target.closest('.lightbox-info,.lightbox-btn') && e.target !== lbImg) closeLb();
        });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('active')) return;
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowLeft'  && !lbPrev.classList.contains('hidden')) lbPrev.click();
            else if (e.key === 'ArrowRight' && !lbNext.classList.contains('hidden')) lbNext.click();
        });

        // focus trap while lightbox is open
        function focusables(c) {
            return Array.from(c.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'))
                .filter(el => !el.closest('.hidden'));
        }
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('active') || e.key !== 'Tab') return;
            const els = focusables(lb); if (!els.length) return;
            if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
        });
        new MutationObserver(() => {
            if (lb.classList.contains('active')) { const els = focusables(lb); if (els.length) els[0].focus(); }
        }).observe(lb, { attributes: true, attributeFilter: ['class'] });

        // open the lightbox when the URL carries a work slug — the
        // shareable permalink, kubachojnacki.com/#<slug>
        function openFromHash() {
            const idx = slugIndex[location.hash.slice(1)];
            if (idx !== undefined) openWork(idx);
            else if (lb.classList.contains('active')) { lb.classList.remove('active'); unlockScroll(); }
        }
        window.addEventListener('hashchange', openFromHash);
        openFromHash();
    }

    // ── hero slideshow (splash) ──────────────────────────────
    if (hasHero) {
        const slidesWrap = document.getElementById('slides-container');
        const heroWorks = WORKS.filter(w => w.hero).sort((a, b) => a.hero - b.hero);

        heroWorks.forEach((w, i) => {
            const slide = document.createElement('div');
            slide.className = 'slide' + (i === 0 ? ' active' : '');
            slide.innerHTML =
                `<img src="${heroSrc(w)}"
                      srcset="${ROOT}IMAGES/thumbs/${w.slug}-hero.webp 1600w, ${heroSrc(w)} 3024w"
                      sizes="100vw" alt="${altText(w)}"
                      ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` +
                `<div class="slide-vignette"></div>` +
                `<div class="slide-caption">
                     <div class="slide-caption-title">${w.title}</div>
                     <div class="slide-caption-specs">${w.medium} &ensp;&middot;&ensp; ${w.size} &ensp;&middot;&ensp; ${w.year}</div>
                 </div>`;
            // a slide opens its own work in the lightbox
            if (hasLightbox) {
                slide.querySelector('img').addEventListener('click', () => openWork(WORKS.indexOf(w)));
            }
            slidesWrap.appendChild(slide);
        });

        const slides     = Array.from(slidesWrap.querySelectorAll('.slide'));
        const dotsWrap   = document.getElementById('slide-dots');
        const counterEl  = document.getElementById('hero-counter');
        const progressEl = document.getElementById('hero-progress');
        const N = slides.length;
        let cur = 0, timer = null;
        const pad2 = n => String(n).padStart(2, '0');

        const dots = slides.map((_, i) => {
            const d = document.createElement('button');
            d.className = 'slide-dot' + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', `Go to slide ${i + 1}`);
            d.addEventListener('click', e => { e.stopPropagation(); goTo(i); resetTimer(); });
            dotsWrap.appendChild(d);
            return d;
        });

        function goTo(i) {
            slides[cur].classList.remove('active');
            dots[cur].classList.remove('active');
            cur = (i + N) % N;
            slides[cur].classList.add('active');
            dots[cur].classList.add('active');
            counterEl.textContent = `${pad2(cur + 1)} / ${pad2(N)}`;
            progressEl.style.width = ((cur + 1) / N * 100) + '%';
        }
        function startTimer() { if (!REDUCE_MOTION) timer = setInterval(() => goTo(cur + 1), 5000); }
        function resetTimer() { clearInterval(timer); startTimer(); }

        document.querySelector('.prev-btn').addEventListener('click', e => { e.stopPropagation(); goTo(cur - 1); resetTimer(); });
        document.querySelector('.next-btn').addEventListener('click', e => { e.stopPropagation(); goTo(cur + 1); resetTimer(); });

        let tx0 = 0;
        const heroEl = document.querySelector('.hero-section');
        heroEl.addEventListener('touchstart', e => { tx0 = e.changedTouches[0].clientX; }, { passive: true });
        heroEl.addEventListener('touchend', e => {
            const dx = tx0 - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 40) { goTo(dx > 0 ? cur + 1 : cur - 1); resetTimer(); }
        }, { passive: true });

        goTo(0);
        startTimer();
    }

    // ── grid density, chosen by the visitor ──────────────────
    //    2 / 4 / 6 columns. The choice is capped on narrow screens so six
    //    columns never becomes six thumbnails across a phone, and it is
    //    written inline on each grid so the stylesheet stays the no-JS
    //    fallback. Remembered per browser.
    const COL_CHOICES = [2, 4, 6];
    const COL_DEFAULT = 4;
    const COL_KEY = 'kch-grid-cols';

    const readCols = () => {
        try {
            const v = parseInt(localStorage.getItem(COL_KEY), 10);
            return COL_CHOICES.includes(v) ? v : COL_DEFAULT;
        } catch (e) { return COL_DEFAULT; }
    };
    const saveCols = v => { try { localStorage.setItem(COL_KEY, v); } catch (e) {} };

    const fitCols = choice => {
        const w = window.innerWidth || document.documentElement.clientWidth;
        if (!w) return choice;          // width not known yet — do not cap blind
        if (w <= 520)  return Math.min(choice, 3);
        if (w <= 800)  return Math.min(choice, 4);
        if (w <= 1100) return Math.min(choice, 5);
        return choice;
    };
    let colChoice = readCols();
    const applyCols = () => {
        const n = fitCols(colChoice);
        document.querySelectorAll('.visual-grid').forEach(g => {
            g.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        });
    };

    // ── collections: grid + legend (works page) ──────────────
    if (hasCollections) {
        const worksSection = document.getElementById('works');

        const control = document.createElement('div');
        control.className = 'grid-control';
        control.innerHTML =
            `<span class="grid-control-label">grid</span>` +
            COL_CHOICES.map(n =>
                `<button type="button" class="grid-opt" data-cols="${n}"
                         aria-pressed="${n === colChoice}"
                         aria-label="Show ${n} works per row">${n}</button>`).join('');
        control.addEventListener('click', e => {
            const btn = e.target.closest('.grid-opt');
            if (!btn) return;
            colChoice = parseInt(btn.dataset.cols, 10);
            saveCols(colChoice);
            control.querySelectorAll('.grid-opt').forEach(b =>
                b.setAttribute('aria-pressed', parseInt(b.dataset.cols, 10) === colChoice));
            applyCols();
            track('grid/' + colChoice, 'Grid ' + colChoice + ' across');
        });
        worksSection.appendChild(control);
        COLLECTIONS.forEach(col => {
            const visibleWorks = col.works.filter(w => !w.draft);
            if (!visibleWorks.length) return;   // skip a collection with nothing to show yet

            const block = document.createElement('div');
            const colSlug = col.name.toLowerCase().replace(/\s+/g, '-');
            block.className = `collection-block collapsible-section open col-${colSlug}`;
            const bodyId = `collection-${colSlug}`;
            block.innerHTML =
                `<div class="collection-label collapsible-header" role="button" tabindex="0" aria-expanded="true" aria-controls="${bodyId}">
                     <div class="collection-label-left">
                         <h3>${col.name}</h3>
                         <span class="col-count">${visibleWorks.length} works</span>
                     </div>
                     <span class="col-toggle">Close</span>
                 </div>
                 ${col.note ? `<p class="collection-note">${col.note}</p>` : ''}
                 <div class="collapsible-content" id="${bodyId}">
                     <div class="visual-grid"></div>
                     <div class="legend-grid"></div>
                 </div>`;

            const grid   = block.querySelector('.visual-grid');
            const legend = block.querySelector('.legend-grid');

            visibleWorks.forEach(w => {
                const idx = WORKS.indexOf(w);

                const item = document.createElement('div');
                item.className = 'visual-item';
                item.id = w.slug;
                item.innerHTML =
                    `<div class="item-image-wrapper" role="button" tabindex="0" aria-label="View ${w.title.replace('|', '-')}">
                         <img src="${thumb(w)}" srcset="${workSrcset(w)}" sizes="${GRID_SIZES}"
                              alt="${altText(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                     </div>
                     <span class="ref-number${w.sold ? ' sold' : ''}">${displayNo(w)}${w.sold || w.unavailable ? ` <span class="status-dot${statusClass(w)}"></span>` : ''}</span>`;
                const wrap = item.querySelector('.item-image-wrapper');
                wrap.addEventListener('click', () => openWork(idx, wrap));
                wrap.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWork(idx, wrap); }
                });
                grid.appendChild(item);

                const li = document.createElement('div');
                li.className = 'legend-item clickable-ref' + (w.sold ? ' is-sold' : (w.unavailable ? ' is-unavailable' : ''));
                li.setAttribute('role', 'button');
                li.setAttribute('tabindex', '0');
                li.setAttribute('aria-label', `View ${w.title.replace('|', '-')}`);
                li.innerHTML =
                    `<span class="legend-ref">${displayNo(w)}</span>` +
                    `<span class="legend-title">${titleHtml(w.title)}</span>` +
                    `<span class="legend-specs">${specsHtml(w)}</span>` +
                    `<span class="legend-price">${priceText(w)}</span>` +
                    `<div class="legend-status"><span class="status-dot${statusClass(w)}"></span><span class="status-text">${statusText(w)}</span></div>`;
                li.addEventListener('click', () => openWork(idx, li));
                li.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWork(idx, li); }
                });
                legend.appendChild(li);
            });

            worksSection.appendChild(block);
        });

        applyCols();
        let colResize = null;
        window.addEventListener('resize', () => {
            clearTimeout(colResize);
            colResize = setTimeout(applyCols, 150);
        });

        // accordion
        document.querySelectorAll('.collapsible-header').forEach(header => {
            const section  = header.closest('.collapsible-section');
            const toggleEl = section.querySelector('.col-toggle');
            header.addEventListener('click', () => {
                const open = section.classList.toggle('open');
                header.setAttribute('aria-expanded', open);
                toggleEl.textContent = open ? 'Close' : 'View';
                setTimeout(() => {
                    section.querySelectorAll('.visual-item:not(.visible)').forEach(el => io.observe(el));
                }, 50);
            });
            header.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); header.click(); }
            });
        });

        // structured data for search engines (works page only)
        const ld = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": WORKS.map((w, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "VisualArtwork",
                    "name": w.title.replace(/\s*\|\s*/, " "),
                    "artform": "Painting",
                    "artMedium": w.medium,
                    "creator": { "@type": "Person", "name": "Kuba Chojnacki", "url": SITE.url },
                    "image": `${SITE.url}/IMAGES/works/${w.slug}.jpg`,
                    "dateCreated": String(w.year),
                    "offers": {
                        "@type": "Offer",
                        "price": w.price,
                        "priceCurrency": "EUR",
                        "availability": w.sold        ? "https://schema.org/SoldOut"
                                      : w.unavailable ? "https://schema.org/OutOfStock"
                                      :                 "https://schema.org/InStock"
                    }
                }
            }))
        };
        const ldEl = document.createElement('script');
        ldEl.type = 'application/ld+json';
        ldEl.textContent = JSON.stringify(ld);
        document.head.appendChild(ldEl);
    }

    // ── scroll-in animations (any page) ──────────────────────
    setTimeout(() => {
        document.querySelectorAll('.fade-up, .visual-item').forEach(el => io.observe(el));
    }, 100);

    // ── analytics (live domain only) ─────────────────────────
    // site.js and newsletter.js both run on the home page, so the loader is
    // claimed once and the queue is shared — two count.js tags would report
    // every home-page view twice.
    if (SITE.goatcounter && location.hostname === 'kubachojnacki.com' && !window.__gcLoader) {
        window.__gcLoader = true;
        const s = document.createElement('script');
        s.async = true;
        s.dataset.goatcounter = `https://${SITE.goatcounter}.goatcounter.com/count`;
        s.src = 'https://gc.zgo.at/count.js';
        s.onload = () => { gcQueue.splice(0).forEach(v => window.goatcounter.count(v)); };
        document.body.appendChild(s);
    }
});
