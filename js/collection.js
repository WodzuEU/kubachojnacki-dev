/* A collection page (/<collection>/), in two views.

     grid    the paintings across the whole width, each in the same upright
             frame with its number and name under it, as on the old site
             (prices are in the lightbox); 6 across, 4 for a collection of up
             to 12, 3 for up to 6, so a short collection fills its row
     wall    every painting as wide as it really is, softened (width follows
             cm^0.78) so the small studies stay paintings; largest first,
             hung on a common middle line, number, name and size under each

   ?view=wall keeps the choice in the address. Works from js/data.js, the
   placeholder colour from js/colors.js. A painting opens the work in the
   lightbox (site.js, #<slug>), which grows out of it. Drawn through KCH.put
   (site.js), so scripts/prerender.py saves it into the page. */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const panel = document.getElementById('collection');
    const main = document.querySelector('main[data-collection]');
    if (!panel || !main || typeof COLLECTIONS === 'undefined' || !window.KCH) return;
    const { put, arrive, T, EASE, EASE_OUT } = window.KCH;
    const ROOT = window.ROOT || '../';
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
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

    const items = works.map((w, i) => {
        const cm = (w.size.match(/[\d.]+/g) || ['0']).map(Number);
        const tone = (typeof COLORS !== 'undefined' && COLORS[w.slug]) || null;
        return {
            w, i,
            no: String(i + 1).padStart(2, '0'),
            // the photograph says which side is the width
            wide: (w.w || 1) >= (w.h || 1) ? Math.max(...cm) : Math.min(...cm),
            hex: tone ? tone.hex : '#f1f1ef',
        };
    });
    // four across, one painting to a column of the page (his Canva, 2026-10-21)
    const N = 4, N_MID = 3;

    // the painting's own box inside the upright frame, in its own colour while it arrives
    const ph = w => {
        const a = (w.w || 3) / (w.h || 4), f = 3 / 4;
        const [pw, phh] = a < f ? [a / f * 100, 100] : [100, f / a * 100];
        return `width:${pw.toFixed(1)}%;height:${phh.toFixed(1)}%`;
    };
    const cellHtml = it => {
        const w = it.w, paper = /paper/.test(w.medium);
        return `<li class="cg-item"><a href="#${w.slug}" data-work="${w.slug}" aria-label="${plain(w)}, ${it.no}">` +
            `<span class="sp-frame${paper ? ' is-paper' : ''}"><span class="sp-ph" style="${ph(w)};background:${it.hex}"></span>` +
            `<img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) 41vw, 17vw" ` +
            `width="${w.w}" height="${w.h}" alt="" loading="lazy" decoding="async"></span>` +
            `<span class="sp-cap"><span class="sp-no">${it.no}</span><span class="sp-nm">${roman(plain(w))}</span></span></a></li>`;
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

    panel.className = `col-${main.dataset.collection}`;
    put(panel,
        `<div class="cg grid"><ul class="cg-grid" style="--n:${N};--n-mid:${N_MID}" aria-label="paintings">${items.map(cellHtml).join('')}</ul></div>` +
        `<div class="sp-wall grid" hidden><ul class="wall-list" aria-label="the works at their real size, largest first">${items.map(wallHtml).join('')}</ul></div>`);
    arrive(panel);

    // ── grid or wall ──
    const grid = panel.querySelector('.cg'), wall = panel.querySelector('.sp-wall');
    const switcher = document.getElementById('views');
    let view = 'grid';
    const setView = (v, animate) => {
        view = v;
        if (switcher) switcher.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v));
        const swap = () => {
            grid.hidden = v !== 'grid';
            wall.hidden = v !== 'wall';
            arrive(v === 'wall' ? wall : grid);
        };
        if (!animate || !moving()) { swap(); return; }
        const out = (v === 'wall' ? grid : wall).animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.fast, easing: EASE, fill: 'forwards' });
        out.finished.catch(() => {}).then(() => {
            out.cancel();
            swap();
            const y = panel.getBoundingClientRect().top;
            if (y < topPx()) window.scrollTo({ top: window.scrollY + y - topPx() - 24, behavior: 'instant' });
            (v === 'wall' ? wall : grid).animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: T.base, easing: EASE_OUT });
        });
    };
    if (switcher) switcher.addEventListener('click', e => {
        const b = e.target.closest('button[data-view]');
        if (!b || b.dataset.view === view) return;
        setView(b.dataset.view, true);
        const q = b.dataset.view === 'wall' ? '?view=wall' : '';
        history.replaceState(history.state, '', location.pathname + q + location.hash);
    });
    if (new URLSearchParams(location.search).get('view') === 'wall') setView('wall', false);
});
