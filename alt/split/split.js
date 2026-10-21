/* alt/split: a collection as a page split in two. The paintings on nine
   of the twelve columns, the index on three: every work as a catalogue
   entry, its order and its filters at its head.

     ?c=atmosphere | chromatic | works-on-paper | all   which works
     &sort=color|size|price|year  &color=…  &size=…  &price=…  &available=1

   Works from js/data.js; the colour order from js/colors.js. A work's
   number is its place in its own collection (01, 02…), as the artist
   names them. A painting and its entry mark each other; both open the
   work on its collection page, whose lightbox shows it. Re-ordering
   glides (FLIP, Web Animations); works that drop out fade first. The
   index follows the paintings through an IntersectionObserver: no
   scroll handler. */
(() => {
    'use strict';
    if (typeof COLLECTIONS === 'undefined') return;

    const ROOT = window.ROOT || '../../';
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
    const NARROW = matchMedia('(max-width: 800px)');
    const css = getComputedStyle(document.documentElement);
    const token = (name, fallback) => (css.getPropertyValue(name) || '').trim() || fallback;
    const ms = (name, fallback) => parseFloat(token(name, fallback)) || parseFloat(fallback);
    const FAST = ms('--t-fast', '200'), BASE = ms('--t-base', '450');
    const EASE = token('--ease', 'cubic-bezier(.4, 0, .2, 1)');
    const ARRIVE = token('--ease-out', 'cubic-bezier(.16, 1, .3, 1)');
    const moving = () => !REDUCE.matches;
    const topPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top')) || 58;

    // ── the works ──
    const slugOf = c => c.name.toLowerCase().replace(/\s+/g, '-');
    const COLS = COLLECTIONS
        .filter(c => c.kind !== 'prints')
        .map(c => ({ name: c.name.toLowerCase(), slug: slugOf(c), note: c.note || '', works: (c.works || []).filter(w => !w.draft) }))
        .filter(c => c.works.length);
    if (!COLS.length) return;
    const ALL = 'all';
    const colBy = Object.fromEntries(COLS.map(c => [c.slug, c]));
    const CYCLE = [...COLS.map(c => c.slug), ALL];

    const roman = s => s.replace(/\b(III|II|I)\b/g, '<span class="rn">$1</span>');
    const plain = w => (w.title.split('|')[1] || w.title).trim();
    const nb = s => String(s).replace(/ /g, ' ');
    const thumb = (w, t = '') => `${ROOT}IMAGES/thumbs/${w.slug}${t}.webp`;

    // the artist's own colour words, gathered into six
    const HUES = {
        violet: ['violet', 'purple', 'plum', 'lavender'],
        blue:   ['blue', 'navy', 'azure', 'cyan', 'indigo'],
        green:  ['green'],
        red:    ['red', 'burgundy', 'maroon', 'crimson'],
        orange: ['orange'],
        earth:  ['khaki', 'ochre', 'umber', 'brown', 'black'],
    };
    // size by the longer side
    const SIZES  = { small: 'up to 50 cm', medium: '51 to 100 cm', large: 'over 100 cm' };
    const PRICES = { low: 'under 500 €', mid: '500 to 1500 €', high: 'over 1500 €' };

    let gi = 0;
    const items = COLS.flatMap(c => c.works.map((w, i) => {
        const words = plain(w).toLowerCase().split(/\s+/);
        const cm = (w.size.match(/[\d.]+/g) || ['0']).map(Number);
        const long = Math.max(...cm);
        const tone = (typeof COLORS !== 'undefined' && COLORS[w.slug]) || null;
        return {
            w, c, i: gi++,
            no: String(i + 1).padStart(2, '0'),
            hue: Object.keys(HUES).filter(h => HUES[h].some(x => words.includes(x))),
            size: long <= 50 ? 'small' : long <= 100 ? 'medium' : 'large',
            price: w.price < 500 ? 'low' : w.price <= 1500 ? 'mid' : 'high',
            area: cm.reduce((a, b) => a * b, 1),
            // round the wheel from plum through violet, blue, green and the
            // earths to the reds and burgundies
            tone: tone ? ((330 - tone.hue + 360) % 360) + (1 - tone.light) * 0.01 : 999,
            href: `${ROOT}${c.slug}/#${w.slug}`,
            open: !w.sold && !w.unavailable,
        };
    }));

    const byPlace = (a, b) => a.i - b.i;
    const SORTS = {
        number: byPlace,
        color:  (a, b) => a.tone - b.tone || byPlace(a, b),
        size:   (a, b) => b.area - a.area || byPlace(a, b),
        price:  (a, b) => a.w.price - b.w.price || byPlace(a, b),
        year:   (a, b) => b.w.year - a.w.year || byPlace(a, b),
    };
    const FILTERS = ['hue', 'size', 'price'];
    const match = (it, k, v) => k === 'hue' ? it.hue.includes(v) : k === 'avail' ? it.open : it[k] === v;

    // ── state, kept in the address ──
    const state = { c: COLS[0].slug, sort: 'number', hue: '', size: '', price: '', avail: false, view: 'paintings' };
    const readURL = () => {
        const p = new URLSearchParams(location.search);
        const c = p.get('c');
        state.c = (colBy[c] || c === ALL) ? c : COLS[0].slug;
        state.sort = SORTS[p.get('sort')] ? p.get('sort') : 'number';
        state.hue = HUES[p.get('color')] ? p.get('color') : '';
        state.size = SIZES[p.get('size')] ? p.get('size') : '';
        state.price = PRICES[p.get('price')] ? p.get('price') : '';
        state.avail = p.get('available') === '1';
    };
    const writeURL = push => {
        const p = new URLSearchParams();
        if (state.c !== COLS[0].slug) p.set('c', state.c);
        if (state.sort !== 'number') p.set('sort', state.sort);
        if (state.hue) p.set('color', state.hue);
        if (state.size) p.set('size', state.size);
        if (state.price) p.set('price', state.price);
        if (state.avail) p.set('available', '1');
        const q = p.toString();
        history[push ? 'pushState' : 'replaceState'](null, '', location.pathname + (q ? '?' + q : ''));
    };
    const inView = it => state.c === ALL || it.c.slug === state.c;
    const passes = it => inView(it)
        && FILTERS.every(k => !state[k] || match(it, k, state[k]))
        && (!state.avail || it.open);
    const filtered = () => FILTERS.some(k => state[k]) || state.avail;

    // ── the page ──
    const $ = id => document.getElementById(id);
    const line = $('sp-line'), note = $('sp-note'), density = $('density');
    const split = $('sp-split'), field = $('sp-field'), plates = $('sp-plates'), none = $('sp-none');
    const index = $('sp-index'), head = $('sp-head'), list = $('sp-list');
    const count = $('sp-count'), clear = $('sp-clear'), nextLink = $('sp-next');

    // paintings per row: 3, 6 or 9 across the nine columns
    const CHOICES = [3, 6, 9];
    let n = 6;
    try { n = parseInt(localStorage.getItem('kch-split-n'), 10) || 6; } catch (e) {}
    if (!CHOICES.includes(n)) n = 6;
    const sizesAttr = () => `(max-width: 800px) 50vw, ${Math.ceil(72 / n)}vw`;

    // every work is made once, a painting and an entry; the views only show,
    // hide and order them
    items.forEach(it => {
        const w = it.w, name = roman(plain(w));
        const plate = document.createElement('li');
        plate.className = 'sp-plate';
        plate.hidden = true;
        plate.dataset.i = it.i;
        plate.innerHTML =
            `<a href="${it.href}"><span class="sp-frame${/paper/.test(w.medium) ? ' is-paper' : ''}">` +
            `<img src="${thumb(w)}" srcset="${thumb(w)} 400w, ${thumb(w, '-800')} 800w" sizes="${sizesAttr()}" ` +
            `width="${w.w}" height="${w.h}" alt="" loading="lazy" decoding="async"></span> ` +
            `<span class="sp-cap"><span class="sp-no">${it.no}</span> <span class="sp-nm">${name}</span></span></a>`;
        const img = plate.querySelector('img');
        const show = () => img.classList.add('in');
        img.addEventListener('load', () => (img.decode ? img.decode() : Promise.resolve()).then(show, show), { once: true });
        img.addEventListener('error', show, { once: true });

        const st = w.sold
            ? `<span class="sp-st is-sold"><i class="sp-dot" aria-hidden="true"></i>sold</span>`
            : w.unavailable
                ? `<span class="sp-st is-off"><i class="sp-dot" aria-hidden="true"></i>currently not available</span>`
                : `<span class="sp-st">${w.price} €</span>`;
        const row = document.createElement('li');
        row.className = 'sp-row';
        row.hidden = true;
        row.dataset.i = it.i;
        row.innerHTML =
            `<a href="${it.href}"><span class="sp-rno">${it.no}</span> <span class="sp-rnm">${name}</span> ` +
            `<span class="sp-facts"><span class="sp-in">${it.c.name}, </span>${w.medium}, ${nb(w.size)}, ${w.year}</span> ${st}</a>`;
        it.plate = plate;
        it.row = row;
        plates.appendChild(plate);
        list.appendChild(row);
    });
    // between 800 and 1100 px the paintings have eight columns: 2, 4 or 6
    const setN = () => {
        plates.style.setProperty('--n', n);
        plates.style.setProperty('--n-mid', n * 2 / 3);
    };
    setN();

    // the head of the index: sort, then the filters, as words
    const GROUPS = [
        { k: 'sort',  label: 'sort',  aria: 'sort by',         opts: { number: 'number', color: 'color', size: 'size', price: 'price', year: 'year' } },
        { k: 'hue',   label: 'color', aria: 'filter by color', opts: Object.fromEntries(Object.keys(HUES).map(h => [h, h])) },
        { k: 'size',  label: 'size',  aria: 'filter by size',  opts: { small: 'small', medium: 'medium', large: 'large' } },
        { k: 'price', label: 'price', aria: 'filter by price', opts: PRICES },
    ];
    head.insertAdjacentHTML('beforeend',
        GROUPS.map(g =>
            `<div class="sp-ctl" role="group" aria-label="${g.aria}"><span class="sp-lab" aria-hidden="true">${g.label}</span><span class="sp-opts">` +
            Object.entries(g.opts).map(([v, t]) =>
                `<button type="button" data-k="${g.k}" data-v="${v}" aria-pressed="false"` +
                (g.k === 'size' ? ` aria-label="${t}, ${SIZES[v]}" title="${SIZES[v]}"` : '') + `>${t}</button>`).join(' ') +
            `</span></div>`).join('') +
        `<div class="sp-ctl"><span class="sp-lab" aria-hidden="true"></span><span class="sp-opts">` +
        `<button type="button" data-k="avail" aria-pressed="false">available only</button></span></div>`);
    const ctlButtons = [...head.querySelectorAll('button[data-k]')];

    // the grid icons, as on the collection pages: three, six or nine frames
    const icon = k => {
        const w = { 3: 10, 6: 4, 9: 2 }[k], g = 2, H = 14, W = k * w + (k - 1) * g + 1;
        let r = '';
        for (let x = 0; x < k; x++) r += `<rect x="${x * (w + g) + 0.5}" y="0.5" width="${w}" height="${H - 1}"/>`;
        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" focusable="false">${r}</svg>`;
    };
    density.setAttribute('role', 'group');
    density.setAttribute('aria-label', 'paintings per row');
    density.innerHTML = CHOICES.map(k =>
        `<button type="button" data-n="${k}" aria-pressed="${k === n}" aria-label="${k} per row" title="${k} per row">${icon(k)}</button>`).join('');

    // ── the collection line, its note, the title, the way on ──
    const renderChrome = () => {
        const cur = state.c;
        const word = (slug, label) => slug === cur
            ? `<h1 class="col-title">${label}${slug === ALL ? '<span class="vh"> works</span>' : ''}</h1>`
            : `<a href="?c=${slug}" data-c="${slug}">${label}</a>`;
        line.innerHTML = word(ALL, 'all') + COLS.map(c => word(c.slug, c.name)).join('') + `<a href="${ROOT}prints/">prints</a>`;
        const names = COLS.map(c => c.name);
        note.textContent = cur === ALL
            ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} in one index, each work numbered as in its own collection.`
            : colBy[cur].note;
        const label = cur === ALL ? 'All works' : colBy[cur].name.replace(/^./, s => s.toUpperCase());
        document.title = `${label} | Kuba Chojnacki`;
        const nx = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
        nextLink.href = `?c=${nx}`;
        nextLink.dataset.c = nx;
        nextLink.querySelector('.next-name').textContent = nx === ALL ? 'all works' : colBy[nx].name;
        split.dataset.c = cur === ALL ? 'all' : 'one';
        shownChrome = cur;
    };
    let shownChrome = null;

    // a filter with nothing in this collection rests, and is let go on arrival
    const syncHead = () => {
        const here = items.filter(inView);
        ctlButtons.forEach(b => {
            const { k, v } = b.dataset;
            const on = k === 'avail' ? state.avail : state[k] === v;
            b.setAttribute('aria-pressed', on);
            if (k !== 'sort') b.disabled = !on && !here.some(it => match(it, k, v));
        });
        const total = here.length, shown = order.length;
        count.textContent = filtered() ? `${shown} of ${total} works` : `${total} ${total === 1 ? 'work' : 'works'}`;
        clear.hidden = !filtered();
        none.hidden = shown > 0;
    };
    const dropEmptyFilters = () => {
        const here = items.filter(inView);
        FILTERS.forEach(k => { if (state[k] && !here.some(it => match(it, k, state[k]))) state[k] = ''; });
        if (state.avail && !here.some(it => it.open)) state.avail = false;
    };

    // ── the index keeps the paintings' place ──
    // a reading line 30% down the window: the row of paintings on it leads,
    // and the index brings that row's first entry to its top
    const LINE = 0.3;
    let lead = null, busy = false, io = null;
    const inBand = new Set();
    const follow = () => {
        if (NARROW.matches || busy) return;
        const it = order.find(x => inBand.has(x.plate));
        if (!it || it === lead) return;
        lead = it;
        list.scrollTo({ top: it.row.offsetTop, behavior: moving() ? 'smooth' : 'auto' });
    };
    const watch = () => {
        if (io) io.disconnect();
        inBand.clear();
        io = new IntersectionObserver(entries => {
            entries.forEach(en => en.isIntersecting ? inBand.add(en.target) : inBand.delete(en.target));
            follow();
        }, { rootMargin: `-${LINE * 100}% 0px -${99 - LINE * 100}% 0px` });
        items.forEach(it => io.observe(it.plate));
    };
    // after a change: at once, measured (the band has not been told yet)
    const alignNow = () => {
        if (NARROW.matches) return;
        const y = innerHeight * LINE;
        const it = order.find(x => x.plate.getBoundingClientRect().bottom > y);
        lead = it || null;
        list.scrollTop = it ? it.row.offsetTop : 0;
    };
    index.addEventListener('pointerenter', () => { busy = true; });
    index.addEventListener('pointerleave', () => { busy = false; });
    index.addEventListener('focusin', () => { busy = true; });
    index.addEventListener('focusout', e => { if (!index.contains(e.relatedTarget)) busy = false; });

    // ── a painting and its entry point at each other ──
    let on = null, offTimer = 0;
    const mark = it => {
        clearTimeout(offTimer);
        if (on === it) return;
        if (on) { on.plate.classList.remove('on'); on.row.classList.remove('on'); }
        on = it || null;
        if (on) { on.plate.classList.add('on'); on.row.classList.add('on'); }
        split.classList.toggle('is-pointing', !!on);
    };
    const unmark = () => { clearTimeout(offTimer); offTimer = setTimeout(() => mark(null), 140); };
    // a painting pointed at brings its entry into the index's view, if it is out of it
    let revealTimer = 0;
    const reveal = it => {
        clearTimeout(revealTimer);
        if (NARROW.matches) return;
        revealTimer = setTimeout(() => {
            if (on !== it) return;
            const top = it.row.offsetTop, bottom = top + it.row.offsetHeight;
            const from = list.scrollTop, h = list.clientHeight;
            const to = top < from ? top : bottom > from + h ? bottom - h : from;
            if (to !== from) list.scrollTo({ top: to, behavior: moving() ? 'smooth' : 'auto' });
        }, 160);
    };
    const workOf = el => { const li = el && el.closest && el.closest('.sp-plate, .sp-row'); return li ? items[+li.dataset.i] : null; };
    split.addEventListener('pointerover', e => {
        if (e.pointerType !== 'mouse') return;
        const it = workOf(e.target);
        if (!it) { unmark(); return; }
        mark(it);
        if (e.target.closest('.sp-plate')) reveal(it);
    });
    split.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') unmark(); });
    split.addEventListener('focusin', e => { const it = workOf(e.target); it ? mark(it) : mark(null); });
    split.addEventListener('focusout', e => { if (!workOf(e.relatedTarget)) unmark(); });

    // ── show, hide and order: works that leave fade, the rest glide ──
    let order = [], run = 0;
    const els = it => [it.plate, it.row];
    const apply = async (opt = {}) => {
        const mine = ++run;
        const anim = moving() && !opt.instant;
        const next = items.filter(passes).sort(SORTS[state.sort]);
        const keep = new Set(next);
        const leaving = order.filter(it => !keep.has(it));
        mark(null);

        if (anim && leaving.length) {
            await Promise.all(leaving.flatMap(els).map(el =>
                el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }],
                    { duration: FAST, easing: EASE, fill: 'forwards' }).finished.catch(() => {})));
            if (mine !== run) return;
        }

        // first: where everything that stays stands now (mid-glide included)
        const first = new Map(), fading = new Map();
        if (anim) order.forEach(it => { if (keep.has(it)) els(it).forEach(el => first.set(el, el.getBoundingClientRect())); });
        items.forEach(it => els(it).forEach(el => {
            const running = el.getAnimations();
            if (!running.length) return;
            if (first.has(el)) fading.set(el, parseFloat(getComputedStyle(el).opacity));
            running.forEach(a => a.cancel());
        }));

        // then the change itself, the line and its note with it
        if (shownChrome !== state.c) renderChrome();
        leaving.forEach(it => els(it).forEach(el => { el.hidden = true; }));
        next.forEach(it => {
            it.plate.hidden = false;
            it.row.hidden = false;
            plates.appendChild(it.plate);
            list.appendChild(it.row);
        });
        order = next;
        syncHead();

        // the page comes to the results when they begin above the window
        if (opt.toTop) window.scrollTo({ top: 0, behavior: 'instant' });
        else if (!opt.instant) {
            const y = field.getBoundingClientRect().top;
            if (y < topPx()) window.scrollTo({ top: window.scrollY + y - topPx() - 24, behavior: 'instant' });
        }
        alignNow();

        // last: each glides from where it was, the newcomers fade in
        if (!anim) return;
        const last = new Map();
        next.forEach(it => els(it).forEach(el => last.set(el, el.getBoundingClientRect())));
        next.forEach(it => els(it).forEach(el => {
            const a = first.get(el);
            if (!a) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: BASE, easing: ARRIVE }); return; }
            const b = last.get(el), dx = a.left - b.left, dy = a.top - b.top;
            const from = fading.get(el);
            const kf = [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }];
            if (from !== undefined && from < 1) { kf[0].opacity = from; kf[1].opacity = 1; }
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || kf[0].opacity !== undefined) el.animate(kf, { duration: BASE, easing: ARRIVE });
        }));
    };

    // ── what the reader does ──
    const update = () => { writeURL(false); apply(); };
    head.addEventListener('click', e => {
        const view = e.target.closest('button[data-view]');
        if (view) {
            state.view = view.dataset.view;
            split.dataset.view = state.view;
            head.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', b === view));
            const y = split.getBoundingClientRect().top;
            if (y < topPx()) window.scrollTo({ top: window.scrollY + y - topPx(), behavior: 'instant' });
            return;
        }
        const b = e.target.closest('button[data-k]');
        if (!b || b.disabled) return;
        const { k, v } = b.dataset;
        if (k === 'sort') { if (state.sort === v) return; state.sort = v; }
        else if (k === 'avail') state.avail = !state.avail;
        else state[k] = state[k] === v ? '' : v;
        update();
    });
    clear.addEventListener('click', () => {
        FILTERS.forEach(k => { state[k] = ''; });
        state.avail = false;
        update();
        head.querySelector('button[data-k="sort"]').focus({ preventScroll: true });
    });

    const go = (c, toTop) => {
        if (c === state.c) return;
        state.c = c;
        dropEmptyFilters();
        writeURL(true);
        apply({ toTop });
    };
    const inPlace = e => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
    line.addEventListener('click', e => {
        const a = e.target.closest('a[data-c]');
        if (!a || !inPlace(e)) return;
        e.preventDefault();
        go(a.dataset.c, false);
    });
    nextLink.addEventListener('click', e => {
        if (!inPlace(e)) return;
        e.preventDefault();
        go(nextLink.dataset.c, true);
    });
    window.addEventListener('popstate', () => {
        readURL();
        dropEmptyFilters();
        apply();
    });

    density.addEventListener('click', async e => {
        const b = e.target.closest('button[data-n]');
        if (!b) return;
        const k = parseInt(b.dataset.n, 10);
        if (k === n) return;
        n = k;
        try { localStorage.setItem('kch-split-n', n); } catch (err) {}
        density.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
        const swap = () => {
            setN();
            plates.querySelectorAll('img').forEach(im => { im.sizes = sizesAttr(); });
            alignNow();
        };
        if (!moving()) { swap(); return; }
        // a calm change of scale: out, re-laid, in
        await plates.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FAST, easing: EASE, fill: 'forwards' }).finished.catch(() => {});
        swap();
        plates.getAnimations().forEach(a => a.cancel());
        plates.animate([{ opacity: 0 }, { opacity: 1 }], { duration: BASE, easing: ARRIVE });
    });

    NARROW.addEventListener('change', () => { watch(); alignNow(); });

    // ── begin ──
    readURL();
    dropEmptyFilters();
    apply({ instant: true });
    watch();
})();
