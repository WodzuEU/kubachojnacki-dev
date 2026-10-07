/* Renders the works from COLLECTIONS (js/data.js).

     /              the slideshow of the selected works (hero: 1…n in data.js),
                    framed by one row of words under it; the sentence; one
                    closeup per collection, each opening its page
     /<collection>/ one collection: the line of all collections, the grid,
                    the price list, the next collection. /<collection>/#<slug>
                    opens that work in the original lightbox. Prints and a
                    collection still to come have their own layouts.

   No artwork data lives in HTML: edit data.js only. The collection pages
   themselves are written from data.js by scripts/build_collections.py.
   ROOT (set per page) prefixes paths: '' at the root, '../' in a folder. */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof COLLECTIONS === 'undefined') return;
    const ROOT = window.ROOT || '';
    const REDUCE_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // analytics events (GoatCounter): sent only on the live domain
    const gcQueue = (window.__gcQueue = window.__gcQueue || []);
    const track = (path, title) => {
        const vars = { path, title: title || path, event: true };
        if (window.goatcounter && typeof window.goatcounter.count === 'function') window.goatcounter.count(vars);
        else gcQueue.push(vars);
    };

    // published works only; prints and announced collections have pages before works
    const slugOf = c => c.name.toLowerCase().replace(/\s+/g, '-');
    const COLS = COLLECTIONS
        .map(c => Object.assign({}, c, { slug: slugOf(c), works: (c.works || []).filter(w => !w.draft) }))
        .filter(c => c.works.length || c.kind === 'prints' || c.kind === 'soon');
    const WORKS = COLS.flatMap(c => c.works);
    const colOf = {}, noOf = {};
    COLS.forEach(c => c.works.forEach((w, i) => { colOf[w.slug] = c; noOf[w.slug] = String(i + 1).padStart(2, '0'); }));
    const bySlug = Object.fromEntries(WORKS.map(w => [w.slug, w]));

    const pageOf  = c => `${ROOT}${c.slug}/`;
    const countOf = c => c.kind === 'prints' ? `${(c.prints || []).length} prints`
                       : c.kind === 'soon'   ? `${c.count} works, soon`
                       :                       `${c.works.length} works`;
    const thumb   = (w, t) => `${ROOT}IMAGES/thumbs/${w.slug}${t || ''}.webp`;
    const srcset  = w => `${thumb(w)} 400w, ${thumb(w, '-800')} 800w, ${thumb(w, '-1600')} 1600w`;
    const printImg = (slug, size, px) => `${ROOT}IMAGES/prints/${slug}-${size.toLowerCase()}-${px}.webp`;
    const roman   = s => s.replace(/\b(III|II|I)\b/g, '<span style="text-transform:none">$1</span>');
    const nameOf  = w => roman((w.title.split('|')[1] || w.title).trim());
    const plain   = w => (w.title.split('|')[1] || w.title).trim();
    const altOf   = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const label   = w => w.title.replace(' | ', ' ');
    const price   = w => `${w.price} €`;
    const status  = w => w.sold ? 'sold' : (w.unavailable ? 'currently not available' : 'available');
    const dot     = w => w.sold ? '<span class="dot"></span>' : (w.unavailable ? '<span class="dot held"></span>' : '');
    // "Atmosphere | maroon khaki": the collection, the colours under it
    const titleHtml = w => {
        const [main, sub] = w.title.split('|').map(s => s.trim());
        return main + (sub ? `<span class="color-subtitle">${roman(sub)}</span>` : '');
    };

    // ── home: the slideshow, framed by the row of words under it ──
    const slidesWrap = document.getElementById('slides');
    if (slidesWrap) {
        const picks = WORKS.filter(w => w.hero).sort((a, b) => a.hero - b.hero);
        slidesWrap.innerHTML = picks.map((w, i) =>
            `<div class="slide">
                 <a href="${pageOf(colOf[w.slug])}#${w.slug}" aria-label="${plain(w)}, ${colOf[w.slug].name}">
                     <img src="${ROOT}IMAGES/works/${w.slug}-hero.jpg"
                          srcset="${thumb(w, '-hero')} 1600w, ${ROOT}IMAGES/works/${w.slug}-hero.jpg 3024w"
                          sizes="100vw" alt="${altOf(w)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">
                 </a>
             </div>`).join('');

        const slides = Array.from(slidesWrap.children);
        const cap = document.getElementById('hero-cap');
        const capTitle = cap.querySelector('.hc-title'), capMedium = cap.querySelector('.hc-medium');
        const capSize = cap.querySelector('.hc-size'), capCount = cap.querySelector('.hc-count');
        const N = slides.length, two = n => String(n).padStart(2, '0');
        let cur = 0, timer = null;

        // only the slide on show can be reached with the keyboard
        const goTo = i => {
            cur = (i + N) % N;
            slides.forEach((s, k) => {
                s.classList.toggle('active', k === cur);
                s.setAttribute('aria-hidden', k !== cur);
                s.querySelector('a').tabIndex = k === cur ? 0 : -1;
            });
            const w = picks[cur];
            capTitle.innerHTML = `<a href="${pageOf(colOf[w.slug])}#${w.slug}">${roman(w.title)}</a>`;
            capMedium.textContent = w.medium;
            capSize.textContent = `${w.size}, ${w.year}`;
            capCount.textContent = `${two(cur + 1)} / ${two(N)}`;
        };
        const start = () => { if (!REDUCE_MOTION) timer = setInterval(() => goTo(cur + 1), 5000); };
        const restart = () => { clearInterval(timer); start(); };

        document.querySelector('.prev-btn').addEventListener('click', () => { goTo(cur - 1); restart(); });
        document.querySelector('.next-btn').addEventListener('click', () => { goTo(cur + 1); restart(); });

        const hero = slidesWrap.parentElement;
        let x0 = 0;
        hero.addEventListener('touchstart', e => { x0 = e.changedTouches[0].clientX; }, { passive: true });
        hero.addEventListener('touchend', e => {
            const dx = x0 - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 40) { goTo(dx > 0 ? cur + 1 : cur - 1); restart(); }
        }, { passive: true });

        goTo(0);
        start();
    }

    // ── home: one closeup per collection ────────────────────
    const covers = document.getElementById('covers');
    if (covers) {
        covers.innerHTML = COLS.map(c => {
            let img;
            if (c.kind === 'prints') {
                const p = c.prints[0];
                img = `<img src="${printImg(p.work, 'A2', 1100)}" srcset="${printImg(p.work, 'A2', 600)} 600w, ${printImg(p.work, 'A2', 1100)} 1100w"
                            sizes="(max-width: 800px) 50vw, 33vw" alt="Print of ${plain(bySlug[p.work])}" width="1100" height="1375" loading="lazy" decoding="async">`;
            } else if (c.kind === 'soon') {
                img = `<span class="cover-soon">photographs soon</span>`;
            } else {
                const w = bySlug[c.cover] || c.works[0];
                img = `<img src="${thumb(w, '-hero')}" alt="Closeup of ${altOf(w)}" loading="lazy" decoding="async">`;
            }
            return `<a class="cover" href="${pageOf(c)}">
                        <span class="cover-img">${img}</span>
                        <span class="cover-cap"><span class="cn">${c.name.toLowerCase()}</span><span class="cc">${countOf(c)}</span></span>
                    </a>`;
        }).join('');
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
            const sbw = window.innerWidth - document.documentElement.clientWidth;
            if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
            document.body.style.top = `-${scrollY}px`;
            document.documentElement.classList.add('lb-open');
        };
        const unlock = () => {
            const root = document.documentElement;
            if (!root.classList.contains('lb-open')) return;
            root.classList.remove('lb-open');
            document.body.style.top = '';
            document.body.style.paddingRight = '';
            const prev = root.style.scrollBehavior;
            root.style.scrollBehavior = 'auto';
            window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
            root.style.scrollBehavior = prev;
        };

        closeLb = keepHash => {
            if (!lb.classList.contains('active')) return;
            lb.classList.remove('active');
            unlock();
            if (!keepHash) history.replaceState(null, '', location.pathname + location.search);
            if (back) { back.focus({ preventScroll: true }); back = null; }
        };

        openWork = i => {
            idx = (i + WORKS.length) % WORKS.length;
            const w = WORKS[idx];
            img.classList.remove('is-zoomed');
            img.style.transformOrigin = 'center center';
            full = false;
            img.width = w.w; img.height = w.h;
            img.src = thumb(w, '-1600'); img.srcset = srcset(w); img.sizes = '(max-width: 800px) 88vw, 58vw';
            img.alt = altOf(w);

            document.getElementById('lb-title').innerHTML = titleHtml(w);
            document.getElementById('lb-price').textContent = price(w);
            document.getElementById('lb-specs').innerHTML = `${w.medium}<br>${w.size}<br>${w.year}`;
            const st = document.getElementById('lb-status');
            st.hidden = !(w.sold || w.unavailable);
            st.innerHTML = st.hidden ? '' : `<span class="status-dot${w.sold ? '' : ' unavailable'}"></span><span class="status-text">${status(w)}</span>`;
            info.classList.toggle('is-sold', !!w.sold);
            info.classList.toggle('is-unavailable', !w.sold && !!w.unavailable);
            mail.href = `mailto:${SITE.email}?subject=` + encodeURIComponent(`Inquiry: ${noOf[w.slug]}, ${label(w)}`);

            if (!lb.classList.contains('active')) {
                back = document.activeElement !== document.body ? document.activeElement : null;
                lock();
                lb.classList.add('active');
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
            m.onload = () => { if (WORKS[idx] !== w) return; img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.src = m.src; };
            m.src = `${ROOT}IMAGES/works/${w.slug}.jpg`;
        };
        img.addEventListener('click', e => {
            e.stopPropagation();
            if (img.classList.toggle('is-zoomed')) {
                fetchFull();
                const r = img.getBoundingClientRect();
                img.style.transformOrigin = `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`;
            }
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
                const els = Array.from(lb.querySelectorAll('button, a[href]'));
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

        // every collection in one line, this one in ink
        document.getElementById('sub').innerHTML = COLS.map(x =>
            `<a href="${pageOf(x)}"${x === c ? ' aria-current="page"' : ''}>${x.name.toLowerCase()}</a>`).join('');

        const nx = COLS[(COLS.indexOf(c) + 1) % COLS.length];
        document.getElementById('next').innerHTML =
            `<a href="${pageOf(nx)}"><span class="next-label">next</span>${nx.name.toLowerCase()}</a>`;

        if (c.kind === 'prints') {
            density.hidden = true;
            panel.innerHTML = `<div class="prints grid">` + c.prints.map(p => {
                const w = bySlug[p.work];
                const first = p.formats.find(f => f.size === 'A2') || p.formats[0];
                return `<article class="print" data-work="${p.work}">
                            <div class="print-img">
                                <img src="${printImg(p.work, first.size, 1100)}"
                                     srcset="${printImg(p.work, first.size, 600)} 600w, ${printImg(p.work, first.size, 1100)} 1100w"
                                     sizes="(max-width: 800px) 100vw, 50vw" width="1100" height="1375"
                                     alt="Print of ${plain(w)}, ${first.size}" decoding="async">
                            </div>
                            <p class="cap"><span class="nm">${nameOf(w)}</span><span class="pr">original ${w.size}, ${w.sold ? 'sold' : status(w)}</span></p>
                            <div class="formats">` +
                            p.formats.map(f =>
                                `<div class="fmt">
                                     <button type="button" class="fmt-pick" data-size="${f.size}" aria-pressed="${f === first}">
                                         <span class="fs">${f.size}</span><span class="fc">${f.cm}</span><span class="fp">${f.price ? f.price + ' €' : 'price soon'}</span>
                                     </button>
                                     <a class="fo lb-submit" href="mailto:${SITE.email}?subject=${encodeURIComponent(`Print order: ${plain(w)}, ${f.size}`)}">order</a>
                                 </div>`).join('') +
                            `</div>
                        </article>`;
            }).join('') + `</div>`;

            // a size shows its own framing of the painting
            panel.addEventListener('click', e => {
                const pick = e.target.closest('.fmt-pick');
                const order = e.target.closest('.fo');
                const art = e.target.closest('.print');
                if (order && art) {
                    const size = order.closest('.fmt').querySelector('.fmt-pick').dataset.size;
                    track(`order-print/${art.dataset.work}-${size.toLowerCase()}`, `Print order: ${plain(bySlug[art.dataset.work])}, ${size}`);
                }
                if (!pick || !art) return;
                const size = pick.dataset.size, slug = art.dataset.work, im = art.querySelector('.print-img img');
                im.src = printImg(slug, size, 1100);
                im.srcset = `${printImg(slug, size, 600)} 600w, ${printImg(slug, size, 1100)} 1100w`;
                im.alt = `Print of ${plain(bySlug[slug])}, ${size}`;
                art.querySelectorAll('.fmt-pick').forEach(b => b.setAttribute('aria-pressed', b === pick));
            });
        } else if (c.kind === 'soon') {
            density.hidden = true;
        } else {
            // 2 / 4 / 6 across on a wide screen, remembered; a phone keeps two
            const CHOICES = [2, 4, 6];
            let cols = 4;
            try { const v = parseInt(localStorage.getItem('kch-grid-cols'), 10); if (CHOICES.includes(v)) cols = v; } catch (e) {}
            density.innerHTML = 'grid' + CHOICES.map(n => `<button type="button" data-cols="${n}" aria-pressed="${n === cols}">${n}</button>`).join('');
            const applyCols = () => {
                const g = panel.querySelector('.works-grid');
                if (!g) return;
                if (window.innerWidth > 800) { g.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`; g.dataset.cols = cols; }
                else { g.style.gridTemplateColumns = ''; g.dataset.cols = 2; }
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

            panel.className = `col-${c.slug}`;
            panel.innerHTML =
                `<div class="works-grid">` +
                c.works.map(w =>
                    `<div class="tile${w.sold ? ' sold' : ''}">
                         <a class="tile-img" href="#${w.slug}" aria-label="${plain(w)}">
                             <img src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) 50vw, 25vw"
                                  alt="${altOf(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                         </a>
                         <p class="cap"><span class="no">${noOf[w.slug]}</span><span class="nm">${nameOf(w)}</span><span class="pr">${dot(w)}${price(w)}</span></p>
                     </div>`).join('') +
                `</div>
                 <div class="index">
                     <p class="index-label">price list</p>` +
                c.works.map(w =>
                    `<a class="ix grid${w.sold ? ' sold' : ''}${w.unavailable ? ' held' : ''}" href="#${w.slug}">
                         <span class="no">${noOf[w.slug]}</span>
                         <span class="nm">${nameOf(w)}</span>
                         <span class="md">${w.medium}</span>
                         <span class="sz">${w.size}</span>
                         <span class="pr">${price(w)}</span>
                         <span class="st">${dot(w)}${status(w)}</span>
                     </a>`).join('') +
                `</div>`;
            applyCols();
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

    // ── analytics (live domain only) ────────────────────────
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
