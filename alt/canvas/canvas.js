/* alt/canvas: every painting of every collection on one white plane.

   The works come from COLLECTIONS (js/data.js), their measured colour from
   COLORS (js/colors.js). They stand in a grid of equal cells, bottom left,
   each on the line of its row, its number and name under it. The plane is
   one element moved by one transform: drag or the arrow keys move it, the
   wheel, a pinch or + and - bring it closer, "fit all" shows everything.

   Scale: each painting is drawn at the square root of its real size, so a
   two-metre canvas still reads larger than an 18 cm one while the small
   works stay paintings and not specks when everything is in view.

   Arranging (color, size, price, year, collection) moves the paintings to
   their new places; a filter only dims what it leaves out, so nothing moves
   that you did not ask to move. A click on a painting too small to read
   brings it closer; once its name shows, a click opens it on its
   collection's page (/<collection>/#<slug>, the site's own lightbox). */

(function () {
    'use strict';
    if (typeof COLLECTIONS === 'undefined') return;
    const COLOR = typeof COLORS !== 'undefined' ? COLORS : {};

    const ROOT = '../../';
    const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
    const narrowMq = matchMedia('(max-width: 860px)');
    const still = () => reduceMq.matches;

    // the site's motion: three lengths, two curves (css/style.css)
    const FAST = 200, BASE = 450;
    const EASE = 'cubic-bezier(.4,0,.2,1)', EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
    const bezier = (x1, y1, x2, y2) => {
        const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
        const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t;
        return p => {
            if (p <= 0) return 0;
            if (p >= 1) return 1;
            let lo = 0, hi = 1, t = p;
            for (let i = 0; i < 24; i++) { if (X(t) < p) lo = t; else hi = t; t = (lo + hi) / 2; }
            return Y(t);
        };
    };
    const ease = bezier(.4, 0, .2, 1), easeOut = bezier(.16, 1, .3, 1);

    // where the painting sits inside each photograph (left, top, right, bottom
    // as fractions; measured from the 800 px thumbs, a hair inside the edge).
    // A work missing here shows its whole photograph.
    const CROP = {
        "44-atmosphere-lavender-green-ochre": [0.021, 0.016, 0.979, 0.985],
        "45-atmosphere-deep-violet": [0.021, 0.078, 0.978, 0.896],
        "46-atmosphere-dark-plum": [0.024, 0.078, 0.982, 0.895],
        "01-atmosphere-navy-khaki": [0.096, 0.034, 0.904, 0.943],
        "40-atmosphere-blue": [0.093, 0.045, 0.906, 0.956],
        "43-atmosphere-deep-green-blue": [0.095, 0.045, 0.905, 0.956],
        "02-atmosphere-burgundy-blue": [0.095, 0.044, 0.906, 0.955],
        "41-atmosphere-burgundy-blue-ii": [0.097, 0.045, 0.906, 0.956],
        "03-atmosphere-maroon-khaki": [0.093, 0.045, 0.906, 0.956],
        "38-atmosphere-burgundy-khaki": [0.093, 0.045, 0.906, 0.956],
        "39-atmosphere-brown-purple": [0.093, 0.045, 0.906, 0.958],
        "42-atmosphere-umber-indigo-azure": [0.050, 0.164, 0.959, 0.854],
        "32-atmosphere-burgundy": [0.047, 0.164, 0.962, 0.854],
        "04-atmosphere-cyan-purple-blue": [0.116, 0.161, 0.875, 0.844],
        "37-atmosphere-blue-red": [0.080, 0.117, 0.921, 0.885],
        "35-atmosphere-violet-plum-i": [0.121, 0.147, 0.880, 0.854],
        "36-atmosphere-violet-plum-ii": [0.119, 0.146, 0.881, 0.854],
        "33-atmosphere-blue": [0.121, 0.147, 0.884, 0.854],
        "34-atmosphere-green-blue": [0.121, 0.147, 0.880, 0.854],
        "05-atmosphere-burnt-red-green-i": [0.121, 0.144, 0.883, 0.853],
        "06-atmosphere-burnt-red-green-ii": [0.120, 0.144, 0.884, 0.853],
        "07-atmosphere-burnt-red-green-iii": [0.120, 0.144, 0.883, 0.853],
        "08-atmosphere-navy-red-khaki-i": [0.079, 0.186, 0.926, 0.811],
        "09-atmosphere-navy-red-khaki-ii": [0.080, 0.184, 0.924, 0.815],
        "10-atmosphere-navy-red-khaki-iii": [0.080, 0.184, 0.926, 0.817],
        "11-atmosphere-burgundy-navy": [0.140, 0.231, 0.863, 0.774],
        "12-atmosphere-brown-black-red": [0.093, 0.241, 0.916, 0.692],
        "16-atmosphere-steel-blue-red": [0.264, 0.317, 0.749, 0.683],
        "14-atmosphere-khaki-navy-red": [0.264, 0.315, 0.750, 0.683],
        "15-atmosphere-red-blue": [0.285, 0.336, 0.727, 0.664],
        "17-atmosphere-deep-orange-blue": [0.285, 0.337, 0.724, 0.663],
        "19-chromatic-blue-orange": [0.093, 0.045, 0.904, 0.956],
        "18-chromatic-orange-ii": [0.046, 0.164, 0.963, 0.854],
        "20-chromatic-red": [0.053, 0.165, 0.958, 0.852],
        "21-chromatic-orange": [0.166, 0.167, 0.823, 0.853],
        "22-chromatic-blue-i": [0.170, 0.161, 0.822, 0.839],
        "25-chromatic-blue-red": [0.145, 0.230, 0.860, 0.775],
        "27-chromatic-blue-ii": [0.202, 0.230, 0.799, 0.773],
        "28-chromatic-blue-iii": [0.229, 0.263, 0.770, 0.748],
        "29-chromatic-blue-iv": [0.285, 0.275, 0.715, 0.725],
        "30-chromatic-blue-v": [0.285, 0.336, 0.730, 0.667],
        "47-paper-purple-01": [0.062, 0.048, 0.938, 0.953],
        "48-paper-purple-02": [0.062, 0.049, 0.938, 0.953],
        "49-paper-crimson-01": [0.062, 0.048, 0.938, 0.953],
        "50-paper-crimson-02": [0.062, 0.049, 0.938, 0.953],
        "51-paper-crimson-03": [0.062, 0.048, 0.938, 0.953],
        "52-paper-crimson-04": [0.065, 0.048, 0.935, 0.953],
    };

    // ── the plane, in its own units ──
    const UNIT = 400;      // the longest side of the largest painting
    const GAP_MIN = 40;    // between the cells of a row, at least
    const BAND = 100;      // under a row: room for the words
    const NAME_S = 0.5;    // from this zoom every name shows
    const FACT_S = 0.75;   // from this one the size and the price too
    const MAX_S = 2.5;
    const CLOSE_S = 0.9;   // how close a click or the keyboard brings a painting

    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const nb = s => String(s).replace(/ /g, ' ');
    const roman = s => s.replace(/\b(III|II|IV|I|V)\b/g, '<span class="rn">$1</span>');
    const euro = n => `${n} €`;
    const works = n => `${n} ${n === 1 ? 'work' : 'works'}`;

    // ── the works: published ones, prints and empty collections left out ──
    const COLS = COLLECTIONS
        .filter(c => c.kind !== 'prints')
        .map(c => Object.assign({}, c, { slug: c.name.toLowerCase().replace(/\s+/g, '-'), works: (c.works || []).filter(w => !w.draft) }))
        .filter(c => c.works.length);
    const WORKS = [];
    COLS.forEach(c => c.works.forEach((d, i) => {
        const nums = (d.size.match(/\d+(?:\.\d+)?/g) || ['50']).map(Number);
        WORKS.push({
            d, col: c, slug: d.slug,
            no: String(i + 1).padStart(2, '0'),
            name: (d.title.split('|')[1] || d.title).trim(),
            L: Math.max(...nums), S: Math.min(...nums),
            price: d.price, year: d.year,
            c: COLOR[d.slug],
            order: WORKS.length,
        });
    }));
    const LMAX = Math.max(...WORKS.map(w => w.L));

    // each painting's box: the real proportions, the photograph deciding
    // which way it hangs; the picture cropped to the canvas edge inside it
    WORKS.forEach(w => {
        const cr = CROP[w.slug] || [0, 0, 1, 1];
        const pw = (cr[2] - cr[0]) * w.d.w, ph = (cr[3] - cr[1]) * w.d.h;
        const long = UNIT * Math.sqrt(w.L / LMAX), short = long * w.S / w.L;
        const wide = pw > ph * 1.08;
        w.dw = wide ? long : short;
        w.dh = wide ? short : long;
        w.area = w.L * w.S;
        const k = Math.max(w.dw / pw, w.dh / ph);
        w.img = {
            w: w.d.w * k, h: w.d.h * k,
            l: -cr[0] * w.d.w * k - (pw * k - w.dw) / 2,
            t: -cr[1] * w.d.h * k - (ph * k - w.dh) / 2,
        };
        w.fw = cr[2] - cr[0];
    });
    const CW = Math.max(...WORKS.map(w => w.dw));
    const CH = Math.max(...WORKS.map(w => w.dh));
    const PY = CH + BAND;
    let GAP = GAP_MIN, PX = CW + GAP;

    // ── colour: the artist's own colour words, read from the names, in the
    //    order his note walks them: violets and blues, through green, into
    //    burgundies and earthy tones ──
    const FAMILIES = [
        ['violets',     280, 'violet lavender purple plum'],
        ['blues',       215, 'blue navy azure cyan steel indigo'],
        ['greens',      150, 'green'],
        ['burgundies',  345, 'burgundy maroon'],
        ['reds',          2, 'red crimson'],
        ['oranges',      18, 'orange'],
        ['earth tones',  35, 'khaki ochre umber brown black'],
    ].map(([key, hue, words], i) => ({ key, hue, words: words.split(' '), i, cool: i < 3 }));
    const FAMILY_OF = {};
    FAMILIES.forEach(f => f.words.forEach(word => { FAMILY_OF[word] = f; }));
    const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

    WORKS.forEach(w => {
        // every colour the name holds (a filter finds them all) ...
        const found = [];
        w.name.toLowerCase().split(/\s+/).filter(word => FAMILY_OF[word]).forEach((word, k) => {
            const f = FAMILY_OF[word];
            if (!found.some(x => x.f === f)) found.push({ f, k });
        });
        w.fams = found.map(x => x.f);
        // ... and the one it is grouped under: the named colour nearest the
        // measured one, the first-named a little favoured; when the
        // photograph is nearly grey, simply the first-named
        const c = w.c;
        if (!found.length) {
            w.fam = c ? FAMILIES.reduce((a, f) => hueGap(c.hue, f.hue) < hueGap(c.hue, a.hue) ? f : a) : FAMILIES[6];
            w.fams = [w.fam];
        } else if (!c || c.sat < 0.06) {
            w.fam = found[0].f;
        } else {
            w.fam = found.reduce((a, x) => (hueGap(c.hue, x.f.hue) + 20 * x.k < hueGap(c.hue, a.f.hue) + 20 * a.k ? x : a)).f;
        }
    });
    // a series (one name, I, II, III) stays together, under its most common colour
    const SERIES = {};
    WORKS.forEach(w => {
        const k = w.col.slug + '|' + w.name.toLowerCase().replace(/\s+(i|ii|iii|iv|v)$/, '');
        (SERIES[k] = SERIES[k] || []).push(w);
    });
    Object.values(SERIES).forEach(set => {
        if (set.length < 2) return;
        const n = new Map();
        set.forEach(w => n.set(w.fam, (n.get(w.fam) || 0) + 1));
        let best = set[0].fam;
        n.forEach((v, f) => { if (v > n.get(best)) best = f; });
        set.forEach(w => { w.fam = best; });
    });
    // inside a colour: along the hue, the way the families run
    WORKS.forEach(w => {
        const h = w.c && w.c.sat >= 0.06 ? w.c.hue : w.fam.hue;
        w.walk = w.fam.cool ? -(h < 90 ? h + 360 : h) : (h < 180 ? h + 360 : h);
    });
    Object.values(SERIES).forEach(set => {
        const k = Math.min(...set.map(w => w.walk));
        set.forEach(w => { w.setKey = k; });
    });
    const byColor = (a, b) => a.fam.i - b.fam.i || a.setKey - b.setKey || a.order - b.order;

    // ── bands for size and price ──
    const SIZE_BANDS = [['large', 150], ['medium', 70], ['small', 40], ['intimate', 0]];
    const PRICE_BANDS = [
        ['under 300 €', p => p < 300, `under ${euro(300)}`],
        ['300 to 1000 €', p => p >= 300 && p <= 1000, `300 to ${euro(1000)}`],
        ['over 1000 €', p => p > 1000, `over ${euro(1000)}`],
    ];
    WORKS.forEach(w => {
        w.sizeBand = SIZE_BANDS.find(b => w.L >= b[1])[0];
        w.priceBand = PRICE_BANDS.find(b => b[1](w.price))[0];
    });
    const spanCm = list => {
        const a = Math.min(...list.map(w => w.L)), b = Math.max(...list.map(w => w.L));
        return a === b ? `${a} cm` : `${a} to ${b} cm`;
    };

    // ── the five ways to arrange, the five filters ──
    const DIMS = {
        color: {
            word: 'color',
            bands: FAMILIES.map(f => ({ key: f.key, title: f.key })),
            of: w => w.fam.key,
            has: (w, k) => w.fams.some(f => f.key === k),
            sort: byColor,
        },
        size: {
            word: 'size',
            bands: SIZE_BANDS.map(b => ({ key: b[0], title: b[0] })),
            of: w => w.sizeBand,
            has: (w, k) => w.sizeBand === k,
            sort: (a, b) => b.L - a.L || b.area - a.area || byColor(a, b),
            fact: list => `${works(list.length)}, ${spanCm(list)}`,
            note: k => spanCm(WORKS.filter(w => w.sizeBand === k)),
        },
        price: {
            word: 'price',
            bands: PRICE_BANDS.map(b => ({ key: b[0], title: b[2] })),
            of: w => w.priceBand,
            has: (w, k) => w.priceBand === k,
            sort: (a, b) => a.price - b.price || byColor(a, b),
        },
        year: {
            word: 'year',
            bands: [...new Set(WORKS.map(w => w.year))].sort((a, b) => b - a).map(y => ({ key: String(y), title: String(y) })),
            of: w => String(w.year),
            has: (w, k) => String(w.year) === k,
            sort: byColor,
        },
        collection: {
            word: 'collection',
            bands: COLS.map(c => ({ key: c.slug, title: c.name.toLowerCase() })),
            of: w => w.col.slug,
            has: (w, k) => w.col.slug === k,
            sort: (a, b) => a.order - b.order,
        },
        status: {
            word: 'availability',
            bands: [{ key: 'available', title: 'available' }],
            has: w => !w.d.sold && !w.d.unavailable,
        },
    };
    const ARRANGE = ['color', 'size', 'price', 'year', 'collection'];
    const FILTER = ['color', 'size', 'price', 'collection', 'status'];

    const groupsFor = by => {
        const dim = DIMS[by];
        return dim.bands
            .map(b => ({ key: b.key, title: b.title, works: WORKS.filter(w => dim.of(w) === b.key).sort(dim.sort) }))
            .filter(g => g.works.length)
            .map(g => Object.assign(g, { fact: dim.fact ? dim.fact(g.works) : works(g.works.length) }));
    };

    // ── the page ──
    const $ = id => document.getElementById(id);
    const stage = $('cv-stage'), planeEl = $('cv-plane'), panel = $('cv-panel');
    const bar = document.querySelector('.cv-bar'), arrangeEl = document.querySelector('.cv-arrange');
    const count = $('cv-count'), clearBtn = $('cv-clear'), filterBtn = $('cv-filter'), moreBtn = $('cv-more'), hint = $('cv-hint');
    if (!stage || !planeEl) return;

    const state = { by: 'color', f: {} };
    const saved = (() => { try { return JSON.parse(sessionStorage.getItem('kch-canvas') || 'null'); } catch (e) { return null; } })();
    if (saved && DIMS[saved.by] && ARRANGE.includes(saved.by)) state.by = saved.by;
    if (saved && saved.f) FILTER.forEach(d => {
        const keys = (saved.f[d] || []).filter(k => DIMS[d].bands.some(b => b.key === k));
        if (keys.length) state.f[d] = keys;
    });

    // each painting: a link to its own place on its collection's page
    const statusHtml = w => w.d.sold ? '<span class="cv-dot"></span><span class="cv-sold">sold</span>'
        : w.d.unavailable ? '<span class="cv-dot grey"></span><span>currently not available</span>'
        : `<span class="cv-pr">${euro(w.price)}</span>`;
    const statusWords = w => w.d.sold ? 'sold' : w.d.unavailable ? 'currently not available' : `${w.price} euro`;
    WORKS.forEach(w => {
        const a = document.createElement('a');
        a.className = 'cv-work';
        a.href = `${ROOT}${w.col.slug}/#${w.slug}`;
        a.draggable = false;
        a.setAttribute('aria-label', `${w.no} ${w.name}, ${w.col.name.toLowerCase()}, ${w.d.size}, ${w.d.medium}, ${w.year}, ${statusWords(w)}`);
        a.style.width = `${w.dw}px`;
        a.style.height = `${w.dh}px`;
        a.innerHTML =
            `<span class="cv-frame"><img alt="" draggable="false" decoding="async" style="width:${w.img.w.toFixed(1)}px;height:${w.img.h.toFixed(1)}px;left:${w.img.l.toFixed(1)}px;top:${w.img.t.toFixed(1)}px"></span>` +
            `<span class="cv-cap" aria-hidden="true">` +
                `<span class="cv-l1"><span class="cv-no">${w.no}</span><span class="cv-nm">${roman(esc(w.name))}</span></span>` +
                `<span class="cv-l2">${nb(w.d.size)}</span>` +
                `<span class="cv-l3">${statusHtml(w)}</span>` +
            `</span>`;
        a._w = w;
        w.el = a;
        w.pic = a.querySelector('img');
        w.res = 0;
        w.want = 0;
        w.x = 0;
        w.y = 0;
    });

    // ── the line and the panel ──
    const choice = (attrs, label, note) =>
        `<button type="button" ${attrs} aria-pressed="false">${label}${note ? `<small>${note}</small>` : ''}</button>`;
    arrangeEl.insertAdjacentHTML('beforeend', ARRANGE.map(by => choice(`data-by="${by}"`, DIMS[by].word)).join(''));
    const row = (lead, inner, cls) =>
        `<div class="cv-row${cls ? ' ' + cls : ''}"${lead ? ` role="group" aria-label="${lead}"` : ''}><span class="cv-lead" aria-hidden="true">${lead}</span><div class="cv-opts">${inner}</div></div>`;
    panel.innerHTML = `<div class="cv-rows">` +
        row('arrange', ARRANGE.map(by => choice(`data-by="${by}"`, DIMS[by].word)).join(''), 'cv-row-arrange') +
        FILTER.map(d => row(DIMS[d].word,
            DIMS[d].bands.filter(b => WORKS.some(w => DIMS[d].has(w, b.key)))
                .map(b => choice(`data-dim="${d}" data-key="${esc(b.key)}"`, b.title, DIMS[d].note && DIMS[d].note(b.key))).join(''))).join('') +
        row('', `<button type="button" data-act="clear">show all</button>`, 'cv-row-end') +
        row('', `<button type="button" data-act="fit">fit all</button><button type="button" data-act="close">close</button>`, 'cv-row-phone') +
        `</div>`;
    const byButtons = Array.from(document.querySelectorAll('[data-by]'));
    const filterButtons = Array.from(panel.querySelectorAll('[data-dim]'));

    // ── the view: where the plane is and how close ──
    let SW = 0, SH = 0, K = 8, layoutS = 0;
    let full = { x: 0, y: 0, w: 1, h: 1 }, avail = full;   // the room for the plane; avail less the open filters
    let plane = { W: 1, H: 1 }, minS = 0.1;
    let view = { x: 0, y: 0, s: 1 }, tween = null;

    const measure = () => {
        SW = stage.clientWidth;
        SH = stage.clientHeight;
        const pad = parseFloat(getComputedStyle(bar).paddingLeft) || 24;
        const top = 10, foot = 34;   // the hint stands in the room at the foot
        const pane = !panel.hidden && panel.classList.contains('open') && !narrowMq.matches ? panel.offsetHeight : 0;
        full = { x: pad, y: top, w: Math.max(60, SW - 2 * pad), h: Math.max(60, SH - top - foot) };
        avail = pane ? { x: full.x, y: top + pane, w: full.w, h: Math.max(60, full.h - pane) } : full;
    };

    // how wide each group's name is on screen (it keeps its size at any zoom)
    const ruler = document.createElement('span');
    ruler.className = 'cv-gt';
    ruler.setAttribute('aria-hidden', 'true');
    ruler.style.cssText = 'position:absolute;left:-9999px;top:0;bottom:auto;transform:none;visibility:hidden';
    document.body.append(ruler);
    const nameWidth = {};
    const measureNames = () => {
        let changed = false;
        ARRANGE.forEach(by => DIMS[by].bands.forEach(b => {
            ruler.textContent = `(${b.title})`;
            const w = Math.ceil(ruler.getBoundingClientRect().width);
            if (nameWidth[b.title] !== w) { nameWidth[b.title] = w; changed = true; }
        }));
        ruler.textContent = '';
        return changed;
    };

    // the cells in reading order. A group's name takes as many cells as it
    // needs with everything in view, and never ends a row
    const flow = (groups, k, s) => {
        const cells = [];
        let i = 0;
        groups.forEach(g => {
            const need = s ? ((nameWidth[g.title] || 0) + 14) / s : 0;
            const span = Math.min(k - 1, Math.max(1, Math.ceil(need / PX)));
            if (i % k + span > k - 1) i += k - i % k;
            cells.push({ g, i, span });
            i += span;
            g.works.forEach(w => cells.push({ w, i: i++ }));
        });
        return { cells, rows: Math.ceil(i / k) };
    };
    const sizeOf = (rows, k) => ({ W: k * CW + (k - 1) * GAP, H: rows * PY });
    // as many columns as let the whole plane show largest in this window;
    // when its height decides, the columns spread to the full width
    const plan = () => {
        const all = ARRANGE.map(groupsFor);
        const rowsFor = (k, s) => Math.max(...all.map(g => flow(g, k, s).rows));
        GAP = GAP_MIN;
        PX = CW + GAP;
        let best = { k: 6, s: 0 };
        for (let k = 2; k <= 24; k++) {
            let s = 0;
            for (let pass = 0; pass < 3; pass++) {
                const { W, H } = sizeOf(rowsFor(k, s), k);
                const next = Math.min(full.w / W, full.h / H);
                if (Math.abs(next - s) < 1e-5) break;
                s = next;
            }
            if (s > best.s * 1.001) best = { k, s };
        }
        K = best.k;
        let s = best.s;
        for (let pass = 0; pass < 3; pass++) {
            const sH = full.h / (rowsFor(K, s) * PY);
            GAP = Math.max(GAP_MIN, (full.w / sH - K * CW) / (K - 1));
            PX = CW + GAP;
            s = Math.min(full.w / sizeOf(1, K).W, sH);
        }
        layoutS = s;
    };
    const fitView = () => ({ x: avail.x, y: avail.y, s: Math.min(MAX_S, avail.w / plane.W, avail.h / plane.H) });
    const clampS = s => Math.min(MAX_S, Math.max(minS, s));
    const clamp = v => {
        const s = clampS(v.s), w = plane.W * s, h = plane.H * s;
        return {
            s,
            x: w <= avail.w ? avail.x : Math.min(avail.x, Math.max(avail.x + avail.w - w, v.x)),
            y: h <= avail.h ? avail.y : Math.min(avail.y, Math.max(avail.y + avail.h - h, v.y)),
        };
    };
    const atFit = v => (v || view).s <= minS * 1.0005;
    const goal = () => (tween ? tween.to : view);
    const centre = () => ({ x: avail.x + avail.w / 2, y: avail.y + avail.h / 2 });

    // drawing: one transform on the plane; the words are scaled back by --inv
    let frame = 0, lastS = 0, zoomStep = -1;
    const draw = () => {
        frame = 0;
        planeEl.style.transform = `translate3d(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px, 0) scale(${view.s.toFixed(5)})`;
        if (view.s !== lastS) {
            lastS = view.s;
            planeEl.style.setProperty('--inv', (1 / view.s).toFixed(5));
            // the line under a group's name needs its room under the row
            planeEl.classList.toggle('z-tight', BAND * view.s < 27);
            const z = view.s >= FACT_S - 1e-4 ? 2 : view.s >= NAME_S - 1e-4 ? 1 : 0;
            if (z !== zoomStep) {
                zoomStep = z;
                planeEl.classList.toggle('z-1', z >= 1);
                planeEl.classList.toggle('z-2', z >= 2);
            }
        }
        reveal();
    };
    const redraw = () => { if (!frame) frame = requestAnimationFrame(draw); };

    // while it moves the plane is one picture (will-change); at rest it is
    // drawn sharp again and the visible paintings fetch a finer picture
    let restTimer = 0, dragging = false;
    const stir = () => {
        planeEl.classList.add('is-moving');
        clearTimeout(restTimer);
        restTimer = setTimeout(rest, 180);
    };
    const rest = () => {
        if (tween || dragging) { restTimer = setTimeout(rest, 180); return; }
        planeEl.classList.remove('is-moving');
        sharpen();
        save();
    };

    // a glide from here to there; the point under `at` travels in a straight
    // line while the zoom changes evenly, so the plane never swings
    const goTo = (to, dur, curve, at) => {
        to = clamp(to);
        if (tween) { cancelAnimationFrame(tween.raf); tween = null; }
        if (!dur || still()) { view = to; stir(); redraw(); return; }
        const from = view, a = at || centre(), t0 = performance.now();
        const p0 = { x: (a.x - from.x) / from.s, y: (a.y - from.y) / from.s };
        const p1 = { x: (a.x - to.x) / to.s, y: (a.y - to.y) / to.s };
        const step = now => {
            const p = Math.min(1, (now - t0) / dur), e = curve(p);
            const s = from.s * Math.pow(to.s / from.s, e);
            const px = p0.x + (p1.x - p0.x) * e, py = p0.y + (p1.y - p0.y) * e;
            view = p < 1 ? { x: a.x - px * s, y: a.y - py * s, s } : to;
            stir();
            draw();
            if (p < 1) tween.raf = requestAnimationFrame(step);
            else tween = null;
        };
        tween = { to, raf: requestAnimationFrame(step) };
    };
    const stop = () => { if (tween) { cancelAnimationFrame(tween.raf); tween = null; } };
    const zoomAt = (p, k, dur, curve) => {
        const g = goal(), s = clampS(g.s * k);
        goTo({ s, x: p.x - (p.x - g.x) * s / g.s, y: p.y - (p.y - g.y) * s / g.s }, dur, curve, p);
    };
    const fit = dur => goTo(fitView(), dur, ease);

    // the first move puts the hint away
    const quiet = () => { if (hint && !hint.classList.contains('gone')) hint.classList.add('gone'); };

    // ── pictures: the small one once a painting comes into view, a finer one
    //    for those in view once the plane rests; each decoded before it shows ──
    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    const srcOf = (w, v) => `${ROOT}IMAGES/thumbs/${w.slug}${v === 400 ? '' : '-' + v}.webp`;
    const sizeFor = w => {
        const need = w.dw * view.s * dpr() / w.fw;
        return need <= 400 ? 400 : need <= 800 ? 800 : 1600;
    };
    const inView = (w, margin) => {
        const s = view.s, x = view.x + w.x * s, y = view.y + w.y * s;
        return x + w.dw * s > -SW * margin && x < SW * (1 + margin) && y + w.dh * s > -SH * margin && y < SH * (1 + margin);
    };
    const load = (w, v) => {
        w.want = v;
        const src = srcOf(w, v), im = new Image();
        im.decoding = 'async';
        im.src = src;
        const ready = im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; });
        ready.then(() => {
            if (w.res >= v) return;
            w.pic.src = src;
            w.res = v;
            if (!w.el.classList.contains('is-in')) requestAnimationFrame(() => w.el.classList.add('is-in'));
        }, () => { if (w.want === v) w.want = w.res; });
    };
    const reveal = () => { WORKS.forEach(w => { if (!w.want && inView(w, 0.3)) load(w, 400); }); };
    const sharpen = () => {
        WORKS.forEach(w => {
            if (!inView(w, 0.1)) return;
            const v = sizeFor(w);
            if (v > Math.max(w.res, w.want)) load(w, v);
        });
    };

    // ── arranging: the paintings glide to their new places ──
    let groupEls = [];
    const xyNow = el => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return [m.e, m.f];
    };
    const layout = animate => {
        const moving = animate && !still();
        const wasFit = atFit(goal());
        const { cells, rows } = flow(groupsFor(state.by), K, layoutS);
        const from = moving ? new Map(WORKS.map(w => [w, w.anim ? xyNow(w.el) : [w.x, w.y]])) : null;

        // the names of the old groups go; the new ones come as the paintings arrive
        groupEls.forEach(el => {
            if (moving) el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: FAST, easing: EASE, fill: 'forwards' }).finished.then(() => el.remove(), () => el.remove());
            else el.remove();
        });
        groupEls = [];
        const frag = document.createDocumentFragment();
        cells.forEach(c => {
            const x = (c.i % K) * PX, line = Math.floor(c.i / K) * PY + CH;
            if (c.g) {
                const el = document.createElement('div');
                el.className = 'cv-group';
                el.innerHTML = `<span class="cv-gt" role="heading" aria-level="2">(${esc(c.g.title)})</span><span class="cv-gf">${c.g.fact}</span>`;
                el.style.transform = `translate(${x}px, ${line}px)`;
                el._g = c.g;
                frag.append(el);
                groupEls.push(el);
            } else {
                c.w.x = x;
                c.w.y = line - c.w.dh;
                frag.append(c.w.el);
            }
        });
        // the order you read and tab in is the order you see
        const focused = document.activeElement;
        planeEl.append(frag);
        if (focused && planeEl.contains(focused) && document.activeElement !== focused) focused.focus({ preventScroll: true });
        if (moving) groupEls.forEach(el => el.animate([{ opacity: 0, offset: 0 }], { duration: FAST, delay: BASE - FAST, easing: EASE, fill: 'backwards' }));

        WORKS.forEach(w => {
            const to = `translate(${w.x}px, ${w.y}px)`;
            if (w.anim) { w.anim.cancel(); w.anim = null; }
            w.el.style.transform = to;
            if (!moving) return;
            const [fx, fy] = from.get(w);
            if (Math.abs(fx - w.x) < 0.5 && Math.abs(fy - w.y) < 0.5) return;
            w.anim = w.el.animate([{ transform: `translate(${fx}px, ${fy}px)` }, { transform: to }], { duration: BASE, easing: EASE_OUT });
            w.anim.finished.then(() => { w.anim = null; }, () => {});
        });

        plane = sizeOf(rows, K);
        planeEl.style.width = `${plane.W}px`;
        planeEl.style.height = `${plane.H}px`;
        minS = fitView().s;
        applyFilters();
        byButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.by === state.by)));
        return wasFit;
    };
    const arrange = by => {
        if (by === state.by || !DIMS[by]) return;
        state.by = by;
        const wasFit = layout(true);
        if (wasFit) fit(BASE);
        else goTo(goal(), BASE, ease);
        save();
    };

    // ── filtering: what is left out dims in its place ──
    const applyFilters = () => {
        const act = FILTER.filter(d => state.f[d] && state.f[d].length);
        const pass = (w, skip) => act.every(d => d === skip || state.f[d].some(k => DIMS[d].has(w, k)));
        let n = 0;
        WORKS.forEach(w => {
            const ok = pass(w);
            w.out = !ok;
            if (ok) n++;
            w.el.classList.toggle('is-out', !ok);
            w.el.tabIndex = ok ? 0 : -1;
            if (ok) w.el.removeAttribute('aria-hidden');
            else w.el.setAttribute('aria-hidden', 'true');
        });
        groupEls.forEach(el => el.classList.toggle('is-out', el._g.works.every(w => w.out)));
        count.textContent = n === WORKS.length ? works(n) : `${n} of ${WORKS.length}`;
        clearBtn.hidden = !act.length;
        // a choice that would leave nothing is greyed
        filterButtons.forEach(b => {
            const d = b.dataset.dim, k = b.dataset.key, on = !!(state.f[d] && state.f[d].includes(k));
            b.setAttribute('aria-pressed', String(on));
            b.classList.toggle('is-empty', !on && !WORKS.some(w => DIMS[d].has(w, k) && pass(w, d)));
        });
    };
    const toggleFilter = (d, k) => {
        const list = state.f[d] || [];
        state.f[d] = list.includes(k) ? list.filter(x => x !== k) : list.concat(k);
        if (!state.f[d].length) delete state.f[d];
        applyFilters();
        save();
    };
    const clearFilters = () => { state.f = {}; applyFilters(); save(); };

    // ── the panel: the filters under the line; on a phone a sheet with everything ──
    let panelTimer = 0;
    const openPanel = open => {
        clearTimeout(panelTimer);
        filterBtn.setAttribute('aria-expanded', String(open));
        moreBtn.setAttribute('aria-expanded', String(open));
        if (open) {
            panel.hidden = false;
            void panel.offsetWidth;
            panel.classList.add('open');
        } else {
            panel.classList.remove('open');
            const done = () => { if (!panel.classList.contains('open')) panel.hidden = true; };
            if (still()) done();
            else panelTimer = setTimeout(done, narrowMq.matches ? BASE : FAST);
        }
        if (!narrowMq.matches) reframe();
    };
    // on a wide screen the filters take the top of the plane's room: the
    // plane, if it showed everything, steps down under them, and back
    const reframe = () => {
        const wasFit = atFit(goal());
        measure();
        minS = fitView().s;
        if (wasFit) fit(BASE);
        else goTo(goal(), BASE, ease);
    };
    const panelOpen = () => panel.classList.contains('open');

    bar.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.by) arrange(b.dataset.by);
        else if (b === filterBtn || b === moreBtn) openPanel(!panelOpen());
        else if (b === clearBtn) clearFilters();
        else if (b.dataset.zoom === 'fit') fit(BASE);
        else if (b.dataset.zoom) zoomAt(centre(), b.dataset.zoom === 'in' ? 1.6 : 1 / 1.6, BASE, ease);
        if (b.dataset.zoom) quiet();
    });
    panel.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.by) arrange(b.dataset.by);
        else if (b.dataset.dim) toggleFilter(b.dataset.dim, b.dataset.key);
        else if (b.dataset.act === 'clear') clearFilters();
        else if (b.dataset.act === 'fit') { fit(BASE); openPanel(false); }
        else if (b.dataset.act === 'close') { openPanel(false); moreBtn.focus(); }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panelOpen()) {
            openPanel(false);
            (narrowMq.matches ? moreBtn : filterBtn).focus();
        }
    });
    narrowMq.addEventListener('change', () => { if (panelOpen()) openPanel(false); });

    // ── the wheel: closer and further, about the pointer. With everything in
    //    view, turning further out lets the page go on to the footer ──
    const local = e => {
        const r = stage.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    stage.addEventListener('wheel', e => {
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? SH : 1;
        const dx = e.deltaX * unit, dy = e.deltaY * unit;
        if (!e.ctrlKey) {
            if (window.scrollY > 1) return;
            if (Math.abs(dx) > Math.abs(dy)) {            // sideways on a trackpad: move
                e.preventDefault();
                stop();
                view = clamp({ x: view.x - dx, y: view.y, s: view.s });
                stir(); redraw(); quiet();
                return;
            }
            if (dy > 0 && atFit(goal())) return;
        }
        e.preventDefault();
        zoomAt(local(e), Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)), FAST, easeOut);
        quiet();
    }, { passive: false });

    // ── drag to move, two fingers to come closer ──
    const pointers = new Map();
    let drag = null, pinch = null, suppressClick = false;
    const startPinch = () => {
        const [a, b] = Array.from(pointers.values());
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v: view };
    };
    stage.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (panelOpen() && narrowMq.matches) openPanel(false);
        stop();
        pointers.set(e.pointerId, local(e));
        if (pointers.size === 2) {
            startPinch();
            dragging = true;
            stage.classList.add('is-dragging');
            Array.from(pointers.keys()).forEach(id => { try { stage.setPointerCapture(id); } catch (x) { /* gone */ } });
        } else if (pointers.size === 1) {
            drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, touch: e.pointerType !== 'mouse', trail: [] };
        }
    });
    stage.addEventListener('pointermove', e => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, local(e));
        if (pinch && pointers.size >= 2) {
            const [a, b] = Array.from(pointers.values());
            const d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            const s = clampS(pinch.v.s * d / pinch.d);
            const px = (pinch.m.x - pinch.v.x) / pinch.v.s, py = (pinch.m.y - pinch.v.y) / pinch.v.s;
            view = clamp({ x: m.x - px * s, y: m.y - py * s, s });
            stir(); redraw(); quiet();
            return;
        }
        if (!drag || drag.id !== e.pointerId) return;
        if (!dragging) {
            if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < (drag.touch ? 8 : 4)) return;
            dragging = true;
            stage.classList.add('is-dragging');
            try { stage.setPointerCapture(e.pointerId); } catch (x) { /* gone */ }
            quiet();
        }
        const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
        drag.lx = e.clientX;
        drag.ly = e.clientY;
        drag.trail.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
        while (drag.trail.length > 2 && e.timeStamp - drag.trail[0].t > 90) drag.trail.shift();
        const want = { x: view.x + dx, y: view.y + dy, s: view.s };
        view = clamp(want);
        stir(); redraw();
        // a finger at the edge of the plane moves the page on, towards the footer
        if (drag.touch && Math.abs(want.y - view.y) > 0.5) window.scrollBy(0, -(want.y - view.y));
    });
    const release = e => {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        if (pinch) {
            if (pointers.size < 2) pinch = null;
            if (pointers.size === 1) {
                const [id] = Array.from(pointers.keys());
                const p = pointers.get(id), r = stage.getBoundingClientRect();
                drag = { id, sx: p.x + r.left, sy: p.y + r.top, lx: p.x + r.left, ly: p.y + r.top, touch: true, trail: [] };
            }
            if (pointers.size) return;
        }
        if (pointers.size) return;
        const was = dragging;
        dragging = false;
        stage.classList.remove('is-dragging');
        if (was) {
            suppressClick = true;
            setTimeout(() => { suppressClick = false; }, 0);
            // let go while moving: it glides on a little and comes to rest
            const t = drag && drag.trail;
            if (t && t.length > 1 && e.type === 'pointerup') {
                const a = t[0], b = t[t.length - 1], ms = Math.max(16, b.t - a.t);
                const vx = (b.x - a.x) / ms, vy = (b.y - a.y) / ms;
                if (Math.hypot(vx, vy) > 0.3 && e.timeStamp - b.t < 60) goTo({ x: view.x + vx * 220, y: view.y + vy * 220, s: view.s }, BASE, easeOut);
            }
        }
        drag = null;
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('dragstart', e => e.preventDefault());

    // ── a painting: too small to read, a click brings it closer; else it opens ──
    const comeCloser = w => {
        const s = clampS(Math.max(goal().s, CLOSE_S));
        const cx = w.x + w.dw / 2, cy = w.y + w.dh / 2 + 40 / s;
        const c = centre();
        goTo({ s, x: c.x - cx * s, y: c.y - cy * s }, BASE, ease);
    };
    const showWhole = w => {
        const g = goal(), s = g.s, m = 24;
        const l = g.x + w.x * s, t = g.y + w.y * s, r = l + w.dw * s, b = t + w.dh * s + 70;
        let x = g.x, y = g.y;
        if (l < avail.x + m) x += avail.x + m - l; else if (r > avail.x + avail.w - m) x -= r - (avail.x + avail.w - m);
        if (t < avail.y + m) y += avail.y + m - t; else if (b > avail.y + avail.h) y -= b - (avail.y + avail.h);
        if (x !== g.x || y !== g.y) goTo({ x, y, s }, BASE, ease);
    };
    planeEl.addEventListener('click', e => {
        const a = e.target.closest('.cv-work');
        if (!a) return;
        if (suppressClick) { e.preventDefault(); return; }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (view.s < NAME_S - 1e-3) {
            e.preventDefault();
            comeCloser(a._w);
            quiet();
        } else save();
    });
    planeEl.addEventListener('focusin', e => {
        const a = e.target.closest('.cv-work');
        if (!a || !a.matches(':focus-visible')) return;
        if (window.scrollY) window.scrollTo(0, 0);
        if (goal().s < NAME_S) comeCloser(a._w);
        else showWhole(a._w);
    });

    // ── keys, while the plane has focus ──
    stage.addEventListener('keydown', e => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const g = goal(), sx = avail.w * 0.25, sy = avail.h * 0.25;
        switch (e.key) {
            case 'ArrowLeft':  goTo({ x: g.x + sx, y: g.y, s: g.s }, FAST, easeOut); break;
            case 'ArrowRight': goTo({ x: g.x - sx, y: g.y, s: g.s }, FAST, easeOut); break;
            case 'ArrowUp':    goTo({ x: g.x, y: g.y + sy, s: g.s }, FAST, easeOut); break;
            case 'ArrowDown':  goTo({ x: g.x, y: g.y - sy, s: g.s }, FAST, easeOut); break;
            case '+': case '=': zoomAt(centre(), 1.6, BASE, ease); break;
            case '-': case '_': zoomAt(centre(), 1 / 1.6, BASE, ease); break;
            case '0': fit(BASE); break;
            default: return;
        }
        e.preventDefault();
        quiet();
    });

    // ── kept for the way back from a painting's page ──
    const save = () => {
        try {
            sessionStorage.setItem('kch-canvas', JSON.stringify({ by: state.by, f: state.f, v: goal(), w: SW, h: SH }));
        } catch (e) { /* private window: start afresh next time */ }
    };
    addEventListener('pagehide', save);

    // ── start, and again whenever the window changes size ──
    const start = () => {
        measure();
        measureNames();
        plan();
        layout(false);
        const v = saved && saved.v && Math.abs(saved.w - SW) < 2 && Math.abs(saved.h - SH) < 2 ? saved.v : null;
        view = v && v.s > 0 ? clamp(v) : fitView();
        if (v) quiet();
        draw();
        stir();
    };
    start();
    const replan = () => {
        const wasFit = atFit(goal());
        stop();
        measure();
        plan();
        layout(false);
        view = wasFit ? fitView() : clamp(view);
        draw();
    };
    let sizeFrame = 0;
    new ResizeObserver(() => {
        cancelAnimationFrame(sizeFrame);
        sizeFrame = requestAnimationFrame(() => {
            const w = stage.clientWidth, h = stage.clientHeight;
            if (Math.abs(w - SW) >= 1 || Math.abs(h - SH) >= 1) replan();
        });
    }).observe(stage);
    // the names were measured in the fallback face if Garamond came late
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (measureNames()) replan(); });
})();
