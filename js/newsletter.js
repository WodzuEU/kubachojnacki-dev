/* Renders the newsletter signup forms (site-native Kit submission) and the sliding
   closeups of the contact page. A signup goes into every .nl-signup; data-cta names
   its button, data-where the placement it reports. */

document.addEventListener('DOMContentLoaded', () => {

    // ── analytics events (GoatCounter) ───────────────────────
    // count.js loads only on the live domain (bottom of this file); track()
    // queues until it is ready, then the loader flushes. Nothing is sent off
    // the live domain.
    const gcQueue = (window.__gcQueue = window.__gcQueue || []);
    const track = (path, title) => {
        const vars = { path, title: title || path, event: true };
        if (window.goatcounter && typeof window.goatcounter.count === 'function') window.goatcounter.count(vars);
        else gcQueue.push(vars);
    };

    // ── signup forms ──────────────────────────────────────────
    const signups = document.querySelectorAll('.nl-signup, #nl-signup');
    if (signups.length && typeof SITE !== 'undefined' && SITE.newsletter && SITE.newsletter.action) {
        signups.forEach(signup => {
            const cta = signup.dataset.cta || 'subscribe';
            signup.innerHTML =
                `<form action="${SITE.newsletter.action}" method="post" target="_blank" class="newsletter-form">
                     <input type="email" name="${SITE.newsletter.field || 'email'}" required placeholder="your email" aria-label="Email address" autocomplete="email" spellcheck="false" autocapitalize="off">
                     <button type="submit" class="lb-submit nl-submit">${cta}</button>
                 </form>`;

            // the thank-you is read out when it replaces the form
            signup.setAttribute('aria-live', 'polite');
            // submit in the background and confirm inline, in our own typography;
            // if the request fails, fall back to a normal form submission
            const form = signup.querySelector('form');
            form.addEventListener('submit', async e => {
                e.preventDefault();
                const btn = form.querySelector('button');
                btn.disabled = true;
                btn.textContent = 'sending…';
                const where = signup.dataset.where || (location.pathname.includes('contact') ? 'contact' : 'home');
                track('signup/' + where, 'Newsletter signup');
                try {
                    const res = await fetch(form.action, {
                        method: 'POST',
                        body: new FormData(form),
                        headers: { 'Accept': 'application/json' },
                    });
                    if (!res.ok) throw new Error('subscribe failed: ' + res.status);
                    signup.innerHTML =
                        '<p class="newsletter-confirm">thank you. now check your inbox to confirm the subscription.</p>';
                } catch (err) {
                    btn.disabled = false;
                    btn.textContent = cta;
                    form.submit();
                }
            });
        });
    }

    // ── sliding closeups (the contact page): data-slides picks the works,
    //    data-interval how long each holds, in ms
    const preview = document.querySelector('.preview-carousel');
    if (preview && typeof COLLECTIONS !== 'undefined') {
        const ROOT = window.ROOT || '';
        const SLUGS = (preview.dataset.slides || '').split(',').map(s => s.trim()).filter(Boolean);

        const allWorks = COLLECTIONS.reduce((a, c) => a.concat(c.works || []), []);
        const capOf = slug => {
            const w = allWorks.find(x => x.slug === slug);
            const t = w && w.title ? w.title.split('|')[1] : '';
            return (t || '').trim();
        };

        const slides = SLUGS.map((slug, i) => {
            const cap = capOf(slug);
            // the slides render zoomed 1.5x, so effective width is ~1.5x the
            // pane: offer the 800px thumb and the 1600px hero crop and let
            // sizes reflect the zoom. First slide loads up front, the rest
            // are warmed right after (below).
            return `<div class="preview-slide">
                        <img src="${ROOT}IMAGES/thumbs/${slug}-hero.webp"
                             srcset="${ROOT}IMAGES/thumbs/${slug}-800.webp 800w, ${ROOT}IMAGES/thumbs/${slug}-hero.webp 1600w"
                             sizes="(max-width: 800px) 150vw, 85vw"
                             alt="${cap ? 'atmosphere closeup, ' + cap : 'atmosphere closeup'}"
                             ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.style.opacity=0">
                        ${cap ? `<span class="preview-caption">${cap}</span>` : ''}
                    </div>`;
        }).join('');
        const dots = SLUGS.map((_, i) =>
            `<button class="preview-dot${i === 0 ? ' active' : ''}" type="button" aria-label="Show closeup ${i + 1}"></button>`).join('');
        preview.innerHTML = `<div class="preview-track">${slides}</div><div class="preview-dots">${dots}</div>`;

        const track  = preview.querySelector('.preview-track');
        const dotEls = Array.from(preview.querySelectorAll('.preview-dot'));

        // once the first slide is in, quietly load the rest so no slide
        // ever transitions in blank
        const slideImgs = Array.from(track.querySelectorAll('img'));
        const warmRest = () => slideImgs.slice(1).forEach(im => { im.loading = 'eager'; });
        if (slideImgs[0] && !slideImgs[0].complete) slideImgs[0].addEventListener('load', warmRest, { once: true });
        else warmRest();
        // one round, then it rests on the first; it waits under the pointer or the keyboard
        let idx = 0, timer = null, shown = 1;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

        const go = n => {
            idx = (n + SLUGS.length) % SLUGS.length;
            track.style.transform = `translateX(-${idx * 100}%)`;
            dotEls.forEach((d, i) => d.classList.toggle('active', i === idx));
        };
        const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
        const hold  = Number(preview.dataset.interval) || 3800;
        const tick  = () => { go(idx + 1); if (++shown > SLUGS.length) stop(); };
        const start = () => { if (!reduce && SLUGS.length > 1 && !timer && shown <= SLUGS.length) timer = setInterval(tick, hold); };

        dotEls.forEach((d, i) => d.addEventListener('click', () => { go(i); stop(); start(); }));
        preview.addEventListener('mouseenter', stop);
        preview.addEventListener('mouseleave', start);
        preview.addEventListener('focusin', stop);
        preview.addEventListener('focusout', e => { if (!preview.contains(e.relatedTarget)) start(); });
        start();
    }

    // ── analytics (live domain only) ─────────────────────────
    // site.js and newsletter.js both run on the home page, so the loader is
    // claimed once and the queue is shared — two count.js tags would report
    // every home-page view twice. A page Chrome draws ahead (site.js) is
    // counted only once it is really opened.
    const counted = () => {
        if (typeof SITE === 'undefined' || !SITE.goatcounter || location.hostname !== 'kubachojnacki.com' || window.__gcLoader) return;
        window.__gcLoader = true;
        const s = document.createElement('script');
        s.async = true;
        s.dataset.goatcounter = `https://${SITE.goatcounter}.goatcounter.com/count`;
        s.src = 'https://gc.zgo.at/count.js';
        s.onload = () => { gcQueue.splice(0).forEach(v => window.goatcounter.count(v)); };
        document.body.appendChild(s);
    };
    if (document.prerendering) document.addEventListener('prerenderingchange', counted, { once: true });
    else counted();
});
