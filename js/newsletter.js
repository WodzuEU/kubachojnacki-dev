/* Renders the newsletter signup form (site-native Kit submission) and, where
   its containers are present, the archive of past issues from
   js/newsletter-data.js. Used on the contact page (signup + archive) and the
   collector page (signup only — the archive block simply doesn't run). */

document.addEventListener('DOMContentLoaded', () => {

    const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.07 });
    const reveal = () => setTimeout(() => document.querySelectorAll('.fade-up').forEach(el => io.observe(el)), 100);

    // ── analytics events (GoatCounter) ───────────────────────
    // count.js loads only on the live domain (bottom of this file); track()
    // queues until it is ready, then the loader flushes. Nothing is sent off
    // the live domain.
    const gcQueue = [];
    const track = (path, title) => {
        const vars = { path, title: title || path, event: true };
        if (window.goatcounter && typeof window.goatcounter.count === 'function') window.goatcounter.count(vars);
        else gcQueue.push(vars);
    };

    // ── signup form ───────────────────────────────────────────
    const signup = document.getElementById('nl-signup');
    if (signup && typeof SITE !== 'undefined' && SITE.newsletter && SITE.newsletter.action) {
        const cta = signup.dataset.cta || 'subscribe';
        signup.innerHTML =
            `<form action="${SITE.newsletter.action}" method="post" target="_blank" class="newsletter-form">
                 <input type="email" name="${SITE.newsletter.field || 'email'}" required placeholder="your email" aria-label="Email address">
                 <button type="submit" class="lb-submit nl-submit">${cta}</button>
             </form>`;

        // submit in the background and confirm inline, in our own typography;
        // if the request fails, fall back to a normal form submission
        const form = signup.querySelector('form');
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = form.querySelector('button');
            btn.disabled = true;
            track('signup/' + (location.pathname.includes('collector') ? 'collector' : 'newsletter'), 'Drop signup');
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
                form.submit();
            }
        });
    }

    // ── the atmosphere drop: sliding closeup carousel ─
    //    (collector landing + newsletter page — wherever .preview-carousel is)
    const preview = document.querySelector('.preview-carousel');
    if (preview && typeof COLLECTIONS !== 'undefined') {
        const ROOT = window.ROOT || '';
        // closeups of the new atmosphere series, in order (works held back
        // from the public site until the drop — each has a -hero crop)
        const SLUGS = [
            '44-atmosphere-lavender-green-ochre',
            '45-atmosphere-deep-violet',
            '46-atmosphere-dark-plum',
            '39-atmosphere-brown-purple',
            '40-atmosphere-blue',
        ];
        const allWorks = COLLECTIONS.reduce((a, c) => a.concat(c.works || []), []);
        const capOf = slug => {
            const w = allWorks.find(x => x.slug === slug);
            const t = w && w.title ? w.title.split('|')[1] : '';
            return (t || '').trim();
        };

        const slides = SLUGS.map((slug, i) => {
            const cap = capOf(slug);
            // light sources only: the carousel is a preview strip, so the
            // 800px thumb is the ceiling (the 1600px hero crops are 3-5x
            // heavier and retina sizing would always select them). First
            // slide loads up front, the rest are warmed right after (below).
            return `<div class="preview-slide">
                        <img src="${ROOT}IMAGES/thumbs/${slug}-800.webp"
                             srcset="${ROOT}IMAGES/thumbs/${slug}.webp 400w, ${ROOT}IMAGES/thumbs/${slug}-800.webp 800w"
                             sizes="(max-width: 800px) 100vw, 55vw"
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
        let idx = 0, timer = null;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

        const go = n => {
            idx = (n + SLUGS.length) % SLUGS.length;
            track.style.transform = `translateX(-${idx * 100}%)`;
            dotEls.forEach((d, i) => d.classList.toggle('active', i === idx));
        };
        const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
        const start = () => { if (!reduce && SLUGS.length > 1 && !timer) timer = setInterval(() => go(idx + 1), 3800); };

        dotEls.forEach((d, i) => d.addEventListener('click', () => { go(i); stop(); start(); }));
        preview.addEventListener('mouseenter', stop);
        preview.addEventListener('mouseleave', start);
        start();
    }

    // ── archive of past issues (only where its containers exist) ─
    const list  = document.getElementById('nl-issues');
    const count = document.getElementById('nl-count');
    if (list && count) {
        const issues = (typeof NEWSLETTER_ISSUES !== 'undefined' ? NEWSLETTER_ISSUES : [])
            .slice()
            .sort((a, b) => String(b.date).localeCompare(String(a.date)));

        const MONTHS = ['january','february','march','april','may','june',
                        'july','august','september','october','november','december'];
        const formatDate = iso => {
            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
            if (!m) return String(iso || '');
            const [, y, mo, d] = m;
            return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`;
        };

        if (!issues.length) {
            count.textContent = '';
            list.innerHTML =
                `<p class="nl-empty">the first issue is on its way. subscribe above and it will land in your inbox — and appear here — as soon as it goes out.</p>`;
        } else {
            count.textContent = `${issues.length} issue${issues.length === 1 ? '' : 's'}`;
            issues.forEach(it => {
                const row = document.createElement('article');
                row.className = 'issue-item fade-up';
                const link = it.url ? String(it.url) : '';
                row.innerHTML =
                    `<div class="issue-date">${formatDate(it.date)}</div>
                     <div class="issue-body">
                         <h3 class="issue-title">${link ? `<a href="${link}" target="_blank" rel="noopener">${it.title || 'untitled'}</a>` : (it.title || 'untitled')}</h3>
                         ${it.excerpt ? `<p class="issue-excerpt">${it.excerpt}</p>` : ''}
                     </div>
                     ${link ? `<a class="issue-link lb-submit" href="${link}" target="_blank" rel="noopener">read</a>` : ''}`;
                list.appendChild(row);
            });
        }
    }

    reveal();

    // ── analytics (live domain only, same rule as the homepage) ─
    if (typeof SITE !== 'undefined' && SITE.goatcounter && location.hostname === 'kubachojnacki.com') {
        const s = document.createElement('script');
        s.async = true;
        s.dataset.goatcounter = `https://${SITE.goatcounter}.goatcounter.com/count`;
        s.src = 'https://gc.zgo.at/count.js';
        s.onload = () => { gcQueue.forEach(v => window.goatcounter.count(v)); gcQueue.length = 0; };
        document.body.appendChild(s);
    }
});
