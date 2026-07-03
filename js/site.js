/* Renders the whole catalogue from COLLECTIONS (js/data.js).
   No artwork data lives in HTML — edit data.js only. */

document.addEventListener('DOMContentLoaded', () => {

    const WORKS = COLLECTIONS.flatMap(c => c.works);

    // ── helpers ──────────────────────────────────────────────
    const displaySrc = w => `IMAGES/works/${w.slug}.jpg`;
    const plateSrcset = w =>
        `IMAGES/thumbs/${w.slug}.webp 400w, IMAGES/thumbs/${w.slug}-800.webp 800w, ${displaySrc(w)} ${w.w}w`;

    const altText   = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const priceText = w => w.sold ? 'sold' : `${w.price} €`;

    const protectRoman = s => s.replace(/\b(III|II|I)\b/g, '<span style="text-transform:none">$1</span>');
    const subtitleOf = w => {
        const parts = w.title.split('|').map(s => s.trim());
        return parts[1] || parts[0];
    };

    // physical width in cm (second number of "150 × 100 cm") → plate width in vw
    const cmWidth = w => parseFloat(w.size.split('×')[1]) || 50;
    const plateVw = w => {
        const cm = Math.min(Math.max(cmWidth(w), 18), 100);
        return +(13 + (cm - 18) * 37 / 82).toFixed(1);
    };

    // ── cover ────────────────────────────────────────────────
    const years = WORKS.map(w => w.year);
    const yearsRange = `${Math.min(...years)}–${Math.max(...years)}`;
    document.getElementById('cover-years').textContent = yearsRange;

    const coverWork = WORKS.find(w => w.cover) || WORKS[0];
    const fp = document.getElementById('frontispiece');
    fp.innerHTML =
        `<img src="IMAGES/thumbs/${coverWork.slug}-800.webp"
              srcset="${plateSrcset(coverWork)}" sizes="(max-width: 800px) 88vw, 520px"
              alt="${altText(coverWork)}" width="${coverWork.w}" height="${coverWork.h}"
              fetchpriority="high" decoding="async">
         <figcaption>
             <div class="plate-no">plate ${coverWork.ref}</div>
             <div class="plate-title">${protectRoman(coverWork.title.replace(' | ', ' — '))}</div>
             <div class="plate-specs" style="margin-top:0.2rem">${coverWork.medium} · ${coverWork.size} · ${coverWork.year}</div>
         </figcaption>`;
    fp.querySelector('img').addEventListener('click', () => openWork(WORKS.indexOf(coverWork)));

    // ── contents ─────────────────────────────────────────────
    const tocRows = document.getElementById('toc-rows');
    COLLECTIONS.forEach(col => {
        const refs = col.works.map(w => w.ref);
        const row = document.createElement('a');
        row.className = 'toc-row';
        row.href = `#${col.name.toLowerCase().replace(/\s+/g, '-')}`;
        row.innerHTML =
            `<span class="toc-name">${col.name.toLowerCase()}</span>
             <span class="toc-leader"></span>
             <span class="toc-detail">plates ${refs[0]}–${refs[refs.length - 1]} · ${col.works.length} works</span>`;
        tocRows.appendChild(row);
    });

    // ── chapters with scale-proportional plates ──────────────
    const worksMain = document.getElementById('works');
    COLLECTIONS.forEach(col => {
        const colYears = col.works.map(w => w.year);
        const chapter = document.createElement('section');
        chapter.className = 'chapter';
        chapter.id = col.name.toLowerCase().replace(/\s+/g, '-');
        chapter.innerHTML =
            `<div class="chapter-head">
                 <h3>${col.name.toLowerCase()}</h3>
                 <span class="chapter-meta">${col.works.length} works · ${Math.min(...colYears)}–${Math.max(...colYears)}</span>
             </div>
             ${col.note ? `<p class="chapter-note">${col.note}</p>` : ''}
             <div class="plates"></div>`;

        const plates = chapter.querySelector('.plates');
        col.works.forEach(w => {
            const idx = WORKS.indexOf(w);
            const plate = document.createElement('figure');
            plate.className = 'plate fade-up' + (w.sold ? ' is-sold' : '');
            plate.id = w.slug;
            plate.style.setProperty('--pw', plateVw(w) + 'vw');
            plate.innerHTML =
                `<div class="plate-media" role="button" tabindex="0" aria-label="View plate ${w.ref}, ${w.title.replace('|', '-')}">
                     <img src="IMAGES/thumbs/${w.slug}.webp" srcset="${plateSrcset(w)}"
                          sizes="(max-width: 800px) ${Math.round(plateVw(w) * 1.7)}vw, ${plateVw(w)}vw"
                          alt="${altText(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                 </div>
                 <figcaption class="plate-caption">
                     <div class="plate-title"><span class="plate-no">plate ${w.ref}</span>${protectRoman(subtitleOf(w))}</div>
                     <div class="plate-specs">${w.medium} · ${w.size} · ${w.year}</div>
                     <div class="plate-price${w.sold ? ' sold' : ''}">${priceText(w)}</div>
                 </figcaption>`;
            const media = plate.querySelector('.plate-media');
            media.addEventListener('click', () => openWork(idx));
            media.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWork(idx); }
            });
            plates.appendChild(plate);
        });
        worksMain.appendChild(chapter);
    });

    // ── lightbox ─────────────────────────────────────────────
    const lb      = document.getElementById('lightbox');
    const lbImg   = document.getElementById('lightbox-img');
    const lbPrev  = document.getElementById('lb-prev-btn');
    const lbNext  = document.getElementById('lb-next-btn');
    const lbClose = document.getElementById('lb-close-btn');
    let lbIdx = 0;

    const slugIndex = Object.fromEntries(WORKS.map((w, i) => [w.slug, i]));
    function setHash(slug) {
        history.replaceState(null, '', slug ? '#' + slug : location.pathname + location.search);
    }
    function closeLb() {
        lb.classList.remove('active');
        if (slugIndex[location.hash.slice(1)] !== undefined) setHash(null);
    }

    function openWork(i) {
        lbIdx = (i + WORKS.length) % WORKS.length;
        const w = WORKS[lbIdx];

        lbImg.classList.remove('is-zoomed');
        lbImg.style.transformOrigin = 'center center';
        lbImg.src = displaySrc(w);
        lbImg.alt = altText(w);

        document.getElementById('lb-plate-no').textContent = `plate ${w.ref}`;
        document.getElementById('lb-title').innerHTML =
            protectRoman(w.title.replace(' | ', ' — '));
        document.getElementById('lb-specs').innerHTML = `${w.medium}<br>${w.size}<br>${w.year}`;

        const prc = document.getElementById('lb-price');
        prc.textContent = priceText(w);
        prc.classList.toggle('sold', !!w.sold);

        document.getElementById('lb-inquire-mail').href =
            `mailto:${SITE.email}?subject=` + encodeURIComponent(`Inquiry — plate ${w.ref} — ${w.title.replace(/\|/g, '-')}`);

        ['lb-plate-no', 'lb-inquiry-section', 'lb-price'].forEach(id => document.getElementById(id).classList.remove('hidden'));
        [lbPrev, lbNext].forEach(el => el.classList.remove('hidden'));
        lb.classList.add('active');
        setHash(w.slug);
    }

    function openPhoto(src, alt, title) {
        lbImg.classList.remove('is-zoomed');
        lbImg.style.transformOrigin = 'center center';
        lbImg.src = src; lbImg.alt = alt;
        document.getElementById('lb-title').textContent = title;
        document.getElementById('lb-specs').textContent = alt;
        ['lb-plate-no', 'lb-inquiry-section', 'lb-price'].forEach(id => document.getElementById(id).classList.add('hidden'));
        [lbPrev, lbNext].forEach(el => el.classList.add('hidden'));
        lb.classList.add('active');
    }

    document.querySelectorAll('.about-photo img, .about-portrait img').forEach(img => {
        img.addEventListener('click', () => openPhoto(img.src, img.alt, 'studio view'));
    });

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

    // open lightbox when the URL carries a work slug (shareable links)
    function openFromHash() {
        const idx = slugIndex[location.hash.slice(1)];
        if (idx !== undefined) openWork(idx);
        else if (lb.classList.contains('active')) lb.classList.remove('active');
    }
    window.addEventListener('hashchange', openFromHash);
    openFromHash();

    // ── newsletter signup (renders only when configured) ─────
    if (SITE.newsletter && SITE.newsletter.action) {
        const nl = document.createElement('div');
        nl.className = 'newsletter-block fade-up';
        nl.innerHTML =
            `<h4>Newsletter</h4>
             <p class="newsletter-note">occasional updates about new works and exhibitions. no spam.</p>
             <form action="${SITE.newsletter.action}" method="post" target="_blank" class="newsletter-form">
                 <input type="email" name="${SITE.newsletter.field || 'email'}" required placeholder="your email" aria-label="Email address">
                 <button type="submit" class="lb-submit">subscribe</button>
             </form>`;
        document.querySelector('#contact .contact-inner').after(nl);
    }

    // ── scroll-in animations ─────────────────────────────────
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.07 });
    setTimeout(() => {
        document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
    }, 100);

    // ── structured data for search engines ───────────────────
    const ld = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": WORKS.map((w, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "VisualArtwork",
                "name": w.title.replace(/\s*\|\s*/, " — "),
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

    // ── analytics (live domain only, so staging/local visits
    //    never pollute the statistics) ───────────────────────
    if (SITE.goatcounter && location.hostname === 'kubachojnacki.com') {
        const s = document.createElement('script');
        s.async = true;
        s.dataset.goatcounter = `https://${SITE.goatcounter}.goatcounter.com/count`;
        s.src = 'https://gc.zgo.at/count.js';
        document.body.appendChild(s);
    }
});
