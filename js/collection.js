/* A collection page (/<collection>/): the paintings across the whole width, each
   in the same upright frame with its number and name under it (prices are in the
   lightbox). Four across, three on a narrow window, two on a phone.

   Works from js/data.js, the placeholder colour from js/colors.js. A painting
   opens the work in the lightbox (site.js, #<slug>), which grows out of it. Drawn
   through KCH.put (site.js), so scripts/prerender.py saves it into the page. */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const panel = document.getElementById('collection');
    const main = document.querySelector('main[data-collection]');
    if (!panel || !main || typeof COLLECTIONS === 'undefined' || !window.KCH) return;
    const { put, arrive, hit } = window.KCH;
    const ROOT = window.ROOT || '../';

    const slugOf = c => c.name.toLowerCase().replace(/\s+/g, '-');
    const col = COLLECTIONS.find(c => slugOf(c) === main.dataset.collection);
    if (!col || col.kind) return;
    const works = (col.works || []).filter(w => !w.draft);

    const roman = s => s.replace(/\b(III|II|IV|V|I)\b/g, '<span class="rn">$1</span>');
    const plain = w => (w.title.split('|')[1] || w.title).trim();
    const altOf = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const thumb = (w, t = '') => `${ROOT}IMAGES/thumbs/${w.slug}${t}.webp`;
    const srcset = w => `${thumb(w)} 400w, ${thumb(w, '-800')} 800w, ${thumb(w, '-1600')} 1600w`;

    // the painting's own box inside the upright frame, in its own colour while it arrives
    const ph = w => {
        const a = (w.w || 3) / (w.h || 4), f = 3 / 4;
        const [pw, phh] = a < f ? [a / f * 100, 100] : [100, f / a * 100];
        return `width:${pw.toFixed(1)}%;height:${phh.toFixed(1)}%`;
    };
    const cellHtml = (w, i) => {
        const no = String(i + 1).padStart(2, '0'), paper = /paper/.test(w.medium);
        const tone = (typeof COLORS !== 'undefined' && COLORS[w.slug]) || null;
        return `<li class="cg-item"><a href="#${w.slug}" data-work="${w.slug}" aria-label="${plain(w)}, ${no}${w.sold ? ', sold' : ''}">` +
            `<span class="sp-frame${paper ? ' is-paper' : ''}"><span class="sp-ph" style="${ph(w)};background:${tone ? tone.hex : '#f1f1ef'}"></span>` +
            `<img class="fade" src="${thumb(w)}" srcset="${srcset(w)}" sizes="(max-width: 800px) 41vw, (max-width: 1100px) 21vw, 17vw" ` +
            `width="${w.w}" height="${w.h}" alt="${altOf(w)}" loading="lazy" decoding="async">${hit(w, 3 / 4, paper ? 0.62 : 1)}</span>` +
            `<span class="sp-cap${w.sold ? ' sold' : ''}"><span class="sp-no">${no}</span><span class="sp-nm">${roman(plain(w))}</span></span></a></li>`;
    };

    panel.className = `col-${main.dataset.collection}`;
    put(panel, `<div class="cg grid"><ul class="cg-grid" style="--n:4;--n-mid:3" aria-label="paintings">${works.map(cellHtml).join('')}</ul></div>`);
    arrive(panel);
});
