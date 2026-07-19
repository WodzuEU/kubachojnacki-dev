/* Renders the works pages from COLLECTIONS (js/data.js).
   Page-aware: each block runs only if its container is on the page, so the
   same file drives the splash (hero only) and the works page (collections +
   lightbox). No artwork data lives in HTML — edit data.js only.

   ROOT (set per page before this script) prefixes image paths so they resolve
   from sub-folders: '' on the splash at site root, '../' on /works/. */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof COLLECTIONS === 'undefined') return;

    const ROOT = window.ROOT || '';
    const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── analytics events (GoatCounter) ───────────────────────
    // count.js loads only on the live domain (bottom of this file). track()
    // sends the event if the API is ready, otherwise queues it; the loader
    // flushes the queue once count.js is in. Off the live domain the queue
    // is never flushed, so nothing is ever sent from staging or local.
    const gcQueue = [];
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
    const gridSrcset = w =>
        `${ROOT}IMAGES/thumbs/${w.slug}.webp 400w, ${ROOT}IMAGES/thumbs/${w.slug}-800.webp 800w, ${displaySrc(w)} ${w.w}w`;
    const GRID_SIZES = '(max-width: 800px) 33vw, (max-width: 1100px) 25vw, 20vw';

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

        function setHash(slug) {
            history.replaceState(null, '', slug ? '#' + slug : location.pathname + location.search);
        }
        function closeLb() {
            lb.classList.remove('active');
            if (slugIndex[location.hash.slice(1)] !== undefined) setHash(null);
        }

        openWork = function (i) {
            lbIdx = (i + WORKS.length) % WORKS.length;
            const w = WORKS[lbIdx];

            lbImg.classList.remove('is-zoomed');
            lbImg.style.transformOrigin = 'center center';
            lbImg.src = displaySrc(w);
            lbImg.alt = altText(w);

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
            lb.classList.add('active');
            setHash(w.slug);
            track('open/' + w.slug, workLabel(w));
        };

        lbImg.addEventListener('click', e => {
            e.stopPropagation();
            if (!lbImg.classList.contains('is-zoomed')) {
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

        // open lightbox when the URL carries a work slug (shareable links,
        // and hero → works/#slug navigation from the splash)
        function openFromHash() {
            const idx = slugIndex[location.hash.slice(1)];
            if (idx !== undefined) openWork(idx);
            else if (lb.classList.contains('active')) lb.classList.remove('active');
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
            // on the splash there is no lightbox: a slide leads into the works
            // page and opens that work; on a page with a lightbox it opens inline
            slide.querySelector('img').addEventListener('click', () => {
                if (hasLightbox) openWork(WORKS.indexOf(w));
                else location.href = `${ROOT}works/#${w.slug}`;
            });
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

    // ── collections: grid + legend (works page) ──────────────
    if (hasCollections) {
        const worksSection = document.getElementById('works');
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
                         <img src="${ROOT}IMAGES/thumbs/${w.slug}.webp" srcset="${gridSrcset(w)}" sizes="${GRID_SIZES}"
                              alt="${altText(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                     </div>
                     <span class="ref-number${w.sold ? ' sold' : ''}">${displayNo(w)}${w.sold || w.unavailable ? ` <span class="status-dot${statusClass(w)}"></span>` : ''}</span>`;
                const wrap = item.querySelector('.item-image-wrapper');
                wrap.addEventListener('click', () => openWork(idx));
                wrap.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWork(idx); }
                });
                grid.appendChild(item);

                const li = document.createElement('div');
                li.className = 'legend-item clickable-ref' + (w.sold ? ' is-sold' : (w.unavailable ? ' is-unavailable' : ''));
                li.innerHTML =
                    `<span class="legend-ref">${displayNo(w)}</span>` +
                    `<span class="legend-title">${titleHtml(w.title)}</span>` +
                    `<span class="legend-specs">${specsHtml(w)}</span>` +
                    `<span class="legend-price">${priceText(w)}</span>` +
                    `<div class="legend-status"><span class="status-dot${statusClass(w)}"></span><span class="status-text">${statusText(w)}</span></div>`;
                li.addEventListener('click', () => openWork(idx));
                legend.appendChild(li);
            });

            worksSection.appendChild(block);
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
                        "availability": w.sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock"
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
    if (SITE.goatcounter && location.hostname === 'kubachojnacki.com') {
        const s = document.createElement('script');
        s.async = true;
        s.dataset.goatcounter = `https://${SITE.goatcounter}.goatcounter.com/count`;
        s.src = 'https://gc.zgo.at/count.js';
        s.onload = () => { gcQueue.forEach(v => window.goatcounter.count(v)); gcQueue.length = 0; };
        document.body.appendChild(s);
    }
});
