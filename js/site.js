/* Renders the works from COLLECTIONS (js/data.js).

     /          the sentence, then the selected works (hero: 1…n in data.js)
                one after another, each under its row: (number), name, details
     /works/    one collection at a time: its note, the grid, the index.
                /works/#chromatic is a collection, /works/#<slug> a work
                open in the lightbox.

   No artwork data lives in HTML: edit data.js only.
   ROOT (set per page) prefixes paths: '' at the root, '../' in a folder. */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof COLLECTIONS === 'undefined') return;
    const ROOT = window.ROOT || '';

    // analytics events (GoatCounter): sent only on the live domain
    const gcQueue = (window.__gcQueue = window.__gcQueue || []);
    const track = (path, title) => {
        const vars = { path, title: title || path, event: true };
        if (window.goatcounter && typeof window.goatcounter.count === 'function') window.goatcounter.count(vars);
        else gcQueue.push(vars);
    };

    // published works only; prints is listed even before there are prints
    const slugOf = c => c.name.toLowerCase().replace(/\s+/g, '-');
    const COLS = COLLECTIONS
        .map(c => Object.assign({}, c, { slug: slugOf(c), works: (c.works || []).filter(w => !w.draft) }))
        .filter(c => c.works.length || c.kind === 'prints');
    const WORKS = COLS.flatMap(c => c.works);
    const colOf = {}, noOf = {};
    COLS.forEach(c => c.works.forEach((w, i) => { colOf[w.slug] = c; noOf[w.slug] = String(i + 1).padStart(2, '0'); }));
    const bySlug = Object.fromEntries(WORKS.map(w => [w.slug, w]));

    const thumb   = (w, t) => `${ROOT}IMAGES/thumbs/${w.slug}${t || ''}.webp`;
    const srcset  = w => `${thumb(w)} 400w, ${thumb(w, '-800')} 800w, ${thumb(w, '-1600')} 1600w`;
    const roman   = s => s.replace(/\b(III|II|I)\b/g, '<span style="text-transform:none">$1</span>');
    const nameOf  = w => roman((w.title.split('|')[1] || w.title).trim());
    const plain   = w => (w.title.split('|')[1] || w.title).trim();
    const altOf   = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const price   = w => `${w.price} €`;
    const status  = w => w.sold ? 'sold' : (w.unavailable ? 'currently not available' : 'available');
    const dot     = w => w.sold ? '<span class="dot"></span>' : (w.unavailable ? '<span class="dot held"></span>' : '');
    const ARROW   = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 8.5L8.5 1.5M3 1.5h5.5V7" fill="none" stroke="currentColor" stroke-width="1"/></svg>';

    // ── home: the selected works, one after another ─────────
    const seq = document.getElementById('sequence');
    if (seq) {
        const picks = WORKS.filter(w => w.hero).sort((a, b) => a.hero - b.hero);
        seq.innerHTML = picks.map((w, i) => {
            const href = `works/#${w.slug}`;
            return `<article class="piece">
                <a class="row grid" href="${href}">
                    <span class="no">(${String(i + 1).padStart(2, '0')})</span>
                    <span class="nm">${nameOf(w)}</span>
                    <span class="dt">${colOf[w.slug].name.toLowerCase()}, ${w.size}</span>
                    <span class="go">${ARROW}</span>
                </a>
                <a class="frame" href="${href}" aria-label="${plain(w)}, ${colOf[w.slug].name}">
                    <img src="${thumb(w, '-hero')}" srcset="${thumb(w, '-hero')} 1600w, ${ROOT}IMAGES/works/${w.slug}-hero.jpg 3024w"
                         sizes="100vw" alt="${altOf(w)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">
                </a>
            </article>`;
        }).join('') +
        `<a class="row grid all" href="works/">
             <span class="no">(all)</span>
             <span class="nm">all works</span>
             <span class="dt">${WORKS.length} works</span>
             <span class="go">${ARROW}</span>
         </a>`;
    }

    // ── lightbox ─────────────────────────────────────────────
    let openWork = () => {}, closeLb = () => {}, current = null;
    const lb = document.getElementById('lightbox');
    if (lb) {
        const img = document.getElementById('lightbox-img');
        const info = lb.querySelector('.lightbox-info');
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
            if (!keepHash) history.replaceState(null, '', '#' + (current || ''));
            if (back) { back.focus(); back = null; }
        };

        openWork = (i, from) => {
            idx = (i + WORKS.length) % WORKS.length;
            const w = WORKS[idx];
            img.classList.remove('is-zoomed');
            img.style.transformOrigin = 'center center';
            full = false;
            img.width = w.w; img.height = w.h;
            img.src = thumb(w, '-1600'); img.srcset = srcset(w); img.sizes = '(max-width: 800px) 88vw, 58vw';
            img.alt = altOf(w);
            document.getElementById('lb-title').innerHTML = `${nameOf(w)}<span class="lb-col">${colOf[w.slug].name.toLowerCase()}, ${noOf[w.slug]}</span>`;
            document.getElementById('lb-facts').innerHTML =
                `<div><dt>medium</dt><dd>${w.medium}</dd></div>
                 <div><dt>size</dt><dd>${w.size}</dd></div>
                 <div><dt>year</dt><dd>${w.year}</dd></div>
                 <div><dt>price</dt><dd>${price(w)}</dd></div>
                 <div><dt>status</dt><dd>${dot(w)}${status(w)}</dd></div>`;
            info.classList.toggle('is-sold', !!w.sold);
            document.getElementById('lb-ask').hidden = !!w.sold;
            document.getElementById('lb-mail').href =
                `mailto:${SITE.email}?subject=` + encodeURIComponent(`Inquiry: ${noOf[w.slug]}, ${w.title.replace(/\s*\|\s*/g, ' ')}`);
            if (!lb.classList.contains('active')) { back = from || null; lock(); }
            lb.classList.add('active');
            history.replaceState(null, '', '#' + w.slug);
            track('open/' + w.slug, w.title.replace(' | ', ' '));
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
        document.getElementById('lb-mail').addEventListener('click', () => track('inquire-email/' + WORKS[idx].slug));
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('active')) return;
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'ArrowRight') step(1);
        });
    }

    // ── works: one collection at a time ─────────────────────
    const panel = document.getElementById('collection');
    if (panel) {
        const sub = document.getElementById('sub');
        const note = document.getElementById('note');
        const signup = document.getElementById('nl-signup');
        const density = document.getElementById('density');

        sub.innerHTML = COLS.map(c => `<a href="#${c.slug}" data-col="${c.slug}">${c.name.toLowerCase()}</a>`).join('');

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

        function show(slug) {
            const c = COLS.find(x => x.slug === slug) || COLS[0];
            if (c.slug === current) return false;
            current = c.slug;
            sub.querySelectorAll('a').forEach(a => a.toggleAttribute('aria-current', a.dataset.col === c.slug));
            note.textContent = c.note || '';
            signup.hidden = c.works.length > 0;
            density.hidden = !c.works.length;
            panel.className = `col-${c.slug}`;
            panel.innerHTML = !c.works.length ? '' :
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
                 <div class="index">` +
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
            return true;
        }

        function route() {
            const h = decodeURIComponent(location.hash.slice(1));
            if (bySlug[h]) {
                show(colOf[h].slug);
                openWork(WORKS.indexOf(bySlug[h]));
                return;
            }
            closeLb(true);
            const changed = show(h);
            if (changed && route.ran) window.scrollTo({ top: 0, behavior: 'instant' });
            route.ran = true;
        }
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
