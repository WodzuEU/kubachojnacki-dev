/* Renders the whole site from COLLECTIONS (js/data.js).
   No artwork data lives in HTML — edit data.js only. */

document.addEventListener('DOMContentLoaded', () => {

    const WORKS = COLLECTIONS.flatMap(c => c.works);
    const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── helpers ──────────────────────────────────────────────
    const displaySrc = w => `IMAGES/works/${w.slug}.jpg`;
    const heroSrc    = w => `IMAGES/works/${w.slug}-hero.jpg`;
    const gridSrcset = w =>
        `IMAGES/thumbs/${w.slug}.webp 400w, IMAGES/thumbs/${w.slug}-800.webp 800w, ${displaySrc(w)} ${w.w}w`;
    const GRID_SIZES = '(max-width: 520px) 50vw, (max-width: 800px) 33vw, (max-width: 1100px) 25vw, 20vw';

    const altText  = w => `${w.title.replace(' | ', ', ')}, ${w.medium}, ${w.size}, ${w.year}`;
    const specsHtml = w => `${w.medium}<br>${w.size}<br>${w.year}`;
    const priceText = w => `${w.price} €`;

    const protectRoman = s => s.replace(/\b(III|II|I)\b/g, '<span style="text-transform:none">$1</span>');
    function titleHtml(title) {
        const [main, sub] = title.split('|').map(s => s.trim());
        return main + (sub ? `<br><span class="color-subtitle">${protectRoman(sub)}</span>` : '');
    }

    // ── hero slideshow (works with a `hero` rank) ────────────
    const heroWorks = WORKS.filter(w => w.hero).sort((a, b) => a.hero - b.hero);
    const slidesWrap = document.getElementById('slides-container');
    heroWorks.forEach((w, i) => {
        const slide = document.createElement('div');
        slide.className = 'slide' + (i === 0 ? ' active' : '');
        slide.innerHTML =
            `<img src="${heroSrc(w)}"
                  srcset="IMAGES/thumbs/${w.slug}-hero.webp 1600w, ${heroSrc(w)} 3024w"
                  sizes="100vw" alt="${altText(w)}"
                  ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` +
            `<div class="slide-vignette"></div>` +
            `<div class="slide-caption">
                 <div class="slide-caption-title">${w.title}</div>
                 <div class="slide-caption-specs">${w.medium} &ensp;&middot;&ensp; ${w.size} &ensp;&middot;&ensp; ${w.year}</div>
             </div>`;
        slide.querySelector('img').addEventListener('click', () => openWork(WORKS.indexOf(w)));
        slidesWrap.appendChild(slide);
    });

    // ── collections: grid + legend ───────────────────────────
    const worksSection = document.getElementById('works');
    COLLECTIONS.forEach((col, ci) => {
        const block = document.createElement('div');
        block.className = 'collection-block collapsible-section open';
        const bodyId = `collection-${col.name.toLowerCase().replace(/\s+/g, '-')}`;
        block.innerHTML =
            `<div class="collection-label collapsible-header" role="button" tabindex="0" aria-expanded="true" aria-controls="${bodyId}">
                 <div class="collection-label-left">
                     <h3>${col.name}</h3>
                     <span class="col-count">${col.works.length} works</span>
                 </div>
                 <span class="col-toggle">Close</span>
             </div>
             <div class="collapsible-content" id="${bodyId}">
                 <div class="visual-grid"></div>
                 <div class="legend-grid"></div>
             </div>`;

        const grid   = block.querySelector('.visual-grid');
        const legend = block.querySelector('.legend-grid');

        col.works.forEach(w => {
            const idx = WORKS.indexOf(w);

            const item = document.createElement('div');
            item.className = 'visual-item';
            item.id = w.slug;
            item.innerHTML =
                `<div class="item-image-wrapper" role="button" tabindex="0" aria-label="View ${w.title.replace('|', '-')}">
                     <img src="IMAGES/thumbs/${w.slug}.webp" srcset="${gridSrcset(w)}" sizes="${GRID_SIZES}"
                          alt="${altText(w)}" width="${w.w}" height="${w.h}" loading="lazy" decoding="async">
                 </div>
                 <span class="ref-number${w.sold ? ' sold' : ''}">${w.ref}${w.sold ? ' <span class="status-dot sold"></span>' : ''}</span>`;
            const wrap = item.querySelector('.item-image-wrapper');
            wrap.addEventListener('click', () => openWork(idx));
            wrap.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWork(idx); }
            });
            grid.appendChild(item);

            const li = document.createElement('div');
            li.className = 'legend-item clickable-ref' + (w.sold ? ' is-sold' : '');
            li.innerHTML =
                `<span class="legend-ref">${w.ref}</span>` +
                `<span class="legend-title">${titleHtml(w.title)}</span>` +
                `<span class="legend-specs">${specsHtml(w)}</span>` +
                `<span class="legend-price">${priceText(w)}</span>` +
                `<div class="legend-status"><span class="status-dot${w.sold ? ' sold' : ''}"></span><span class="status-text">${w.sold ? 'sold' : 'available'}</span></div>`;
            li.addEventListener('click', () => openWork(idx));
            legend.appendChild(li);
        });

        worksSection.appendChild(block);
    });

    // ── accordion ────────────────────────────────────────────
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

    // ── lightbox ─────────────────────────────────────────────
    const lb      = document.getElementById('lightbox');
    const lbImg   = document.getElementById('lightbox-img');
    const lbPrev  = document.getElementById('lb-prev-btn');
    const lbNext  = document.getElementById('lb-next-btn');
    const lbClose = document.getElementById('lb-close-btn');
    const lbInfo  = document.querySelector('.lightbox-info');
    let lbIdx = 0;

    // deep links: kubachojnacki.com/#<slug> opens that work's lightbox
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

        document.getElementById('lb-title').innerHTML = titleHtml(w.title);
        document.getElementById('lb-price').textContent = priceText(w);
        document.getElementById('lb-specs').innerHTML = specsHtml(w);

        const st = document.getElementById('lb-status');
        lbInfo.classList.toggle('is-sold', !!w.sold);
        if (w.sold) {
            st.innerHTML = '<span class="status-dot sold"></span><span class="status-text" style="font-size:11px">Sold</span>';
            st.classList.remove('hidden');
        } else {
            st.classList.add('hidden');
        }

        document.getElementById('lb-inquire-mail').href =
            `mailto:${SITE.email}?subject=` + encodeURIComponent(`Inquiry — ${w.ref} ${w.title.replace(/\|/g, '-')}`);

        ['lb-inquiry-section', 'lb-price'].forEach(id => document.getElementById(id).classList.remove('hidden'));
        [lbPrev, lbNext].forEach(el => el.classList.remove('hidden'));
        lb.classList.add('active');
        setHash(w.slug);
    }

    function openPhoto(src, alt, title) {
        lbImg.classList.remove('is-zoomed');
        lbImg.style.transformOrigin = 'center center';
        lbImg.src = src; lbImg.alt = alt;
        lbInfo.classList.remove('is-sold');
        document.getElementById('lb-title').textContent = title;
        document.getElementById('lb-specs').textContent = alt;
        ['lb-inquiry-section', 'lb-price', 'lb-status'].forEach(id => document.getElementById(id).classList.add('hidden'));
        [lbPrev, lbNext].forEach(el => el.classList.add('hidden'));
        lb.classList.add('active');
    }

    document.querySelectorAll('.about-photo img').forEach(img => {
        img.addEventListener('click', () => openPhoto(img.src, img.alt, 'Studio view'));
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

    // ── slideshow controls ───────────────────────────────────
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
    function startTimer() {
        if (!REDUCE_MOTION) timer = setInterval(() => goTo(cur + 1), 5000);
    }
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
        document.querySelectorAll('.fade-up, .visual-item').forEach(el => io.observe(el));
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
