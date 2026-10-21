/* A collection page (/<collection>/), in two views.

     index   the paintings on columns 1-9, each with its number and name
             under it; on columns 10-12 the index, every work as a catalogue
             entry, its order and filters at its head (after the catalogue
             spreads he sent, "Quiet Forces")
     wall    every painting as wide as it really is, softened (width follows
             cm^0.78) so the small studies stay paintings; largest first,
             hung on a common middle line, number, name and size under each

   ?view=wall  ?sort=color|size|price|year  ?color=…  ?size=…  ?available=1
   keep the reader's choices in the address. Works from js/data.js, colour
   order and the placeholder colour from js/colors.js. A painting, its entry
   and its place on the wall all open the work in the lightbox (site.js,
   #<slug>), which grows out of whichever of them is on screen. Drawn through
   KCH.put (site.js), so scripts/prerender.py saves it into the page.
   Re-ordering glides (FLIP); works that drop out fade first. The index
   follows the paintings through an IntersectionObserver, no scroll handler. */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const panel = document.getElementById('collection');
    const main = document.querySelector('main[data-collection]');
    if (!panel || !main || typeof COLLECTIONS === 'undefined' || !window.KCH) return;
    const { put, arrive, T, EASE, EASE_OUT } = window.KCH;
    const ROOT = window.ROOT || '../';
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
    const NARROW = matchMedia('(max-width: 800px)');
    const HOVER = matchMedia('(hover: hover)');
    const moving = () => !REDUCE.matches;
    const topPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top')) || 58;

    const slugOf = c => c.name.toLowerCase().replace(/\s+/g, '-');
    const col = COLLECTIONS.find(c => slugOf(c) === main.dataset.collection);
    if (!col || col.kind) return;
    const works = (col.works || []).filter(w => !w.draft);

    const roman = s => s.replace(/\b(III|II|I)\b/g, '<span class="rn">$1</span>');
    const plain = w => (w.title.split('|')[1] || w.title).trim();
    const nb = s => String(s).replace(/ /g, ' ');
    const thumb = (w, t = '') => `${ROOT}IMAGES/thumbs/${w.slug}${t}.webp`;
    const srcset = w => `${thumb(w)} 400w, ${thumb(w, '-800')} 800w, ${thumb(w, '-1600')} 1600w`;

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
    const SIZES = { small: 'up to 50 cm', medium: '51 to 100 cm', large: 'over 100 cm' };

    const items = works.map((w, i) => {
        const words = plain(w).toLowerCase().split(/\s+/);
        const cm = (w.size.match(/[\d.]+/g) || ['0']).map(Number);
        const long = Math.max(...cm);
        const tone = (typeof COLORS !== 'undefined' && COLORS[w.slug]) || null;
        // the photograph says which side is the width
        const wide = (w.w || 1) >= (w.h || 1) ? Math.max(...cm) : Math.min(...cm);
        return {
            w, i,
            no: String(i + 1).padStart(2, '0'),
            hue: Object.keys(HUES).filter(h => HUES[h].some(x => words.includes(x))),
            size: long <= 50 ? 'small' : long <= 100 ? 'medium' : 'large',
            area: cm.reduce((a, b) => a * b, 1),
            wide,
            // round the wheel from plum through violet, blue, green and the
            // earths to the reds and burgundies
            tone: tone ? ((330 - tone.hue + 360) % 360) + (1 - tone.light) * 0.01 : 999,
            hex: tone ? tone.hex : '#f1f1ef',
            open: !w.sold && !w.unavailable,
        };
    });

    const byPlace = (a, b) => a.i - b.i;
    const SORTS = {
        number: byPlace,
        color:  (a, b) => a.tone - b.tone || byPlace(a, b),
        size:   (a, b) => b.area - a.area || byPlace(a, b),
        price:  (a, b) => a.w.price - b.w.price || byPlace(a, b),
        year:   (a, b) => b.w.year - a.w.year || byPlace(a, b),
    };
    const FILTERS = ['hue', 'size'];
    const match = (it, k, v) => k === 'hue' ? it.hue.includes(v) : it[k] === v;

    // a short collection gets fewer, larger paintings, so the row fills the
    // page and no white is left under it beside the index
    const N = works.length <= 6 ? 3 : works.length <= 12 ? 4 : 6;
    const N_MID = { 3: 2, 4: 3, 6: 4 }[N];

    // ── the page, as drawn (and saved by scripts/prerender.py) ──
    const status = w => w.sold
        ? `<span class="sp-st is-sold"><i class="sp-dot" aria-hidden="true"></i>sold</span>`
        : w.unavailable
            ? `<span class="sp-st is-off"><i class="sp-dot" aria-hidden="true"></i>currently not available</span>`
            : `<span class="sp-st">${nb(w.price + ' €')}</span>`;
    // the painting's own box inside the upright frame, in its own colour while it arrives
    const ph = w => {
        const a = (w.w || 3) / (w.h || 4), f = 3 / 4;
        const [pw, phh] = a < f ? [a / f * 100, 100] : [100, f / a * 100];
        return `width:${pw.toFixed(1)}%;height:${phh.toFixed(1)}%`;
    };
    const plateHtml = it => {
        const w = it.w, paper = /paper/.test(w.medium);
        return `<li class="sp-plate" data-i="${it.i}"><a href="#${w.slug}" data-work="${w.slug}" aria-label="${plain(w)}, ${it.no}">` +
            `<span class="sp-frame${paper ? ' is-paper' : ''}"><span class="sp-ph" style="${ph(w)};background:${it.hex}"></span>` +
            `<img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) 50vw, ${Math.ceil(72 / N)}vw" ` +
            `width="${w.w}" height="${w.h}" alt="" loading="lazy" decoding="async"></span>` +
            `<span class="sp-cap"><span class="sp-no">${it.no}</span><span class="sp-nm">${roman(plain(w))}</span></span></a></li>`;
    };
    const rowHtml = it => {
        const w = it.w;
        return `<li class="sp-row" data-i="${it.i}"><a href="#${w.slug}">` +
            `<span class="sp-rno">${it.no}</span><span class="sp-rnm">${roman(plain(w))}</span>` +
            `<span class="sp-facts">${w.medium}, ${nb(w.size)}, ${w.year}</span>${status(w)}</a></li>`;
    };
    // the wall: a 2 m canvas a quarter of the page wide, the rest in proportion
    const wallW = it => (Math.pow(it.wide / 200, 0.78) * 100).toFixed(2);
    const wallHtml = it => {
        const w = it.w;
        return `<li class="wall-item" style="--w:${wallW(it)}"><a href="#${w.slug}" data-work="${w.slug}" aria-label="${plain(w)}, ${it.no}, ${w.size}">` +
            `<img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) ${Math.ceil(wallW(it) * 0.64)}vw, ${Math.ceil(wallW(it) * 0.26)}vw" ` +
            `width="${w.w}" height="${w.h}" alt="" loading="lazy" decoding="async">` +
            `<span class="wall-cap"><span class="sp-no">${it.no}</span><span>${roman(plain(w))}</span><span class="wall-cm">${nb(w.size)}</span></span></a></li>`;
    };
    const GROUPS = [
        { k: 'sort', label: 'sort', aria: 'sort by', opts: { number: 'number', color: 'color', size: 'size', price: 'price', year: 'year' } },
        { k: 'hue', label: 'color', aria: 'filter by color', opts: Object.fromEntries(Object.keys(HUES).map(h => [h, h])) },
        { k: 'size', label: 'size', aria: 'filter by size', opts: { small: 'small', medium: 'medium', large: 'large' } },
    ];
    const has = (k, v) => items.some(it => match(it, k, v));
    const headHtml =
        `<h2 class="vh" id="sp-index-h">index</h2>` +
        `<p class="sp-count"><span class="sp-n" aria-live="polite">${items.length} ${items.length === 1 ? 'work' : 'works'}</span>` +
        `<button type="button" class="sp-clear" hidden>clear</button>` +
        `<span class="sp-views" role="group" aria-label="show"><button type="button" data-mode="paintings" aria-pressed="true">paintings</button><button type="button" data-mode="index" aria-pressed="false">index</button></span></p>` +
        GROUPS.map(g =>
            `<div class="sp-ctl" role="group" aria-label="${g.aria}"><span class="sp-lab" aria-hidden="true">${g.label}</span><span class="sp-opts">` +
            Object.entries(g.opts).map(([v, t]) =>
                `<button type="button" data-k="${g.k}" data-v="${v}" aria-pressed="${g.k === 'sort' && v === 'number'}"` +
                (g.k !== 'sort' && !has(g.k, v) ? ' disabled' : '') +
                (g.k === 'size' ? ` aria-label="${t}, ${SIZES[v]}" title="${SIZES[v]}"` : '') + `>${t}</button>`).join('') +
            `</span></div>`).join('') +
        `<div class="sp-ctl"><span class="sp-lab" aria-hidden="true"></span><span class="sp-opts">` +
        `<button type="button" data-k="avail" aria-pressed="false"${items.some(it => it.open) ? '' : ' disabled'}>available only</button></span></div>`;

    panel.className = `col-${main.dataset.collection}`;
    put(panel,
        `<div class="sp-split grid" data-mode="paintings">` +
            `<div class="sp-field"><ul class="sp-plates" style="--n:${N};--n-mid:${N_MID}" aria-label="paintings">${items.map(plateHtml).join('')}</ul>` +
            `<p class="sp-none" hidden>no works in this selection.</p></div>` +
            `<aside class="sp-index" aria-labelledby="sp-index-h"><div class="sp-head">${headHtml}</div>` +
            `<ul class="sp-list" aria-label="index of works">${items.map(rowHtml).join('')}</ul></aside>` +
        `</div>` +
        `<div class="sp-wall grid" hidden><ul class="wall-list" aria-label="the works at their real size, largest first">${items.map(wallHtml).join('')}</ul></div>`);
    arrive(panel);

    // ── the drawn page, taken up ──
    const $ = s => panel.querySelector(s);
    const split = $('.sp-split'), field = $('.sp-field'), plates = $('.sp-plates'), none = $('.sp-none');
    const index = $('.sp-index'), head = $('.sp-head'), list = $('.sp-list');
    const count = $('.sp-n'), clear = $('.sp-clear'), wall = $('.sp-wall');
    items.forEach(it => {
        it.plate = plates.querySelector(`.sp-plate[data-i="${it.i}"]`);
        it.row = list.querySelector(`.sp-row[data-i="${it.i}"]`);
    });
    const ctlButtons = [...head.querySelectorAll('button[data-k]')];
    const switcher = document.getElementById('views');

    // ── state, kept in the address ──
    const state = { view: 'index', sort: 'number', hue: '', size: '', avail: false };
    const readURL = () => {
        const p = new URLSearchParams(location.search);
        state.view = p.get('view') === 'wall' ? 'wall' : 'index';
        state.sort = SORTS[p.get('sort')] ? p.get('sort') : 'number';
        state.hue = HUES[p.get('color')] && has('hue', p.get('color')) ? p.get('color') : '';
        state.size = SIZES[p.get('size')] && has('size', p.get('size')) ? p.get('size') : '';
        state.avail = p.get('available') === '1' && items.some(it => it.open);
    };
    const writeURL = () => {
        const p = new URLSearchParams();
        if (state.view !== 'index') p.set('view', state.view);
        if (state.sort !== 'number') p.set('sort', state.sort);
        if (state.hue) p.set('color', state.hue);
        if (state.size) p.set('size', state.size);
        if (state.avail) p.set('available', '1');
        const q = p.toString();
        history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash);
    };
    const passes = it => FILTERS.every(k => !state[k] || match(it, k, state[k])) && (!state.avail || it.open);
    const filtered = () => FILTERS.some(k => state[k]) || state.avail;

    const syncHead = () => {
        ctlButtons.forEach(b => {
            const { k, v } = b.dataset;
            b.setAttribute('aria-pressed', k === 'avail' ? state.avail : state[k] === v);
        });
        const total = items.length, shown = order.length;
        count.textContent = filtered() ? `${shown} of ${total} works` : `${total} ${total === 1 ? 'work' : 'works'}`;
        clear.hidden = !filtered();
        none.hidden = shown > 0;
    };

    // ── the index keeps the paintings' place ──
    // a reading line 30% down the window: the row of paintings on it leads,
    // and the index brings that row's first entry to its top
    const LINE = 0.3;
    let lead = null, busy = false, io = null;
    const inBand = new Set();
    const follow = () => {
        if (NARROW.matches || busy || state.view !== 'index') return;
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
    const alignNow = () => {
        if (NARROW.matches || state.view !== 'index') return;
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
    // an entry whose painting is out of sight shows it small beside the index
    const peek = document.createElement('img');
    peek.className = 'sp-peek';
    peek.alt = '';
    peek.setAttribute('aria-hidden', 'true');
    document.body.appendChild(peek);
    const showPeek = it => {
        if (!it || NARROW.matches || !HOVER.matches) { peek.classList.remove('on'); return; }
        const r = it.plate.getBoundingClientRect();
        if (r.bottom > topPx() && r.top < innerHeight) { peek.classList.remove('on'); return; }
        const row = it.row.getBoundingClientRect(), side = index.getBoundingClientRect();
        peek.src = thumb(it.w);
        peek.style.width = `${Math.min(180, side.left * 0.22).toFixed(0)}px`;
        peek.style.left = `${(side.left - Math.min(180, side.left * 0.22) - 24).toFixed(0)}px`;
        peek.style.top = `${Math.max(topPx() + 12, Math.min(row.top, innerHeight - 260)).toFixed(0)}px`;
        peek.classList.add('on');
    };
    let on = null, offTimer = 0;
    const mark = it => {
        clearTimeout(offTimer);
        if (on === it) return;
        if (on) { on.plate.classList.remove('on'); on.row.classList.remove('on'); }
        on = it || null;
        if (on) { on.plate.classList.add('on'); on.row.classList.add('on'); }
        split.classList.toggle('is-pointing', !!on);
        if (!on) peek.classList.remove('on');
    };
    const unmark = () => { clearTimeout(offTimer); offTimer = setTimeout(() => mark(null), 140); };
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
        else showPeek(it);
    });
    split.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') unmark(); });
    split.addEventListener('focusin', e => { const it = workOf(e.target); it ? mark(it) : mark(null); });
    split.addEventListener('focusout', e => { if (!workOf(e.relatedTarget)) unmark(); });
    addEventListener('scroll', () => { if (peek.classList.contains('on')) peek.classList.remove('on'); }, { passive: true });

    // ── show, hide and order: works that leave fade, the rest glide ──
    let order = items.slice(), run = 0;
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
                    { duration: T.fast, easing: EASE, fill: 'forwards' }).finished.catch(() => {})));
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

        // then the change itself
        leaving.forEach(it => els(it).forEach(el => { el.hidden = true; }));
        next.forEach(it => {
            it.plate.hidden = false;
            it.row.hidden = false;
            plates.appendChild(it.plate);
            list.appendChild(it.row);
        });
        order = next;
        syncHead();
        if (!opt.instant) {
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
            if (!a) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.base, easing: EASE_OUT }); return; }
            const b = last.get(el), dx = a.left - b.left, dy = a.top - b.top;
            const from = fading.get(el);
            const kf = [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }];
            if (from !== undefined && from < 1) { kf[0].opacity = from; kf[1].opacity = 1; }
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || kf[0].opacity !== undefined) el.animate(kf, { duration: T.base, easing: EASE_OUT });
        }));
    };

    // ── index or wall ──
    const setView = (v, animate) => {
        state.view = v;
        if (switcher) switcher.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v));
        const swap = () => {
            split.hidden = v !== 'index';
            wall.hidden = v !== 'wall';
            mark(null);
            if (v === 'wall') arrive(wall);
            alignNow();
        };
        if (!animate || !moving()) { swap(); return; }
        const out = (v === 'wall' ? split : wall).animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.fast, easing: EASE, fill: 'forwards' });
        out.finished.catch(() => {}).then(() => {
            out.cancel();
            swap();
            const y = panel.getBoundingClientRect().top;
            if (y < topPx()) window.scrollTo({ top: window.scrollY + y - topPx() - 24, behavior: 'instant' });
            (v === 'wall' ? wall : split).animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: T.base, easing: EASE_OUT });
        });
    };
    if (switcher) switcher.addEventListener('click', e => {
        const b = e.target.closest('button[data-view]');
        if (!b || b.dataset.view === state.view) return;
        setView(b.dataset.view, true);
        writeURL();
    });

    // ── what the reader does ──
    head.addEventListener('click', e => {
        const mode = e.target.closest('button[data-mode]');
        if (mode) {
            split.dataset.mode = mode.dataset.mode;
            head.querySelectorAll('button[data-mode]').forEach(b => b.setAttribute('aria-pressed', b === mode));
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
        writeURL();
        apply();
    });
    clear.addEventListener('click', () => {
        FILTERS.forEach(k => { state[k] = ''; });
        state.avail = false;
        writeURL();
        apply();
        head.querySelector('button[data-k="sort"]').focus({ preventScroll: true });
    });
    NARROW.addEventListener('change', () => { watch(); alignNow(); });

    // ── begin: the page as drawn, then the reader's own choices from the address ──
    readURL();
    if (state.sort !== 'number' || filtered()) apply({ instant: true });
    if (state.view !== 'index') setView(state.view, false);
    watch();
});
