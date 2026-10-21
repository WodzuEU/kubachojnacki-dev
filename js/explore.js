/* The effects lab: switches to try something on the real pages before
   choosing it. site.js loads this file only after a visit to an address with
   ?explore, and then for the rest of that visit (sessionStorage). Not part of
   the site: what is chosen moves into style.css and site.js, and this file
   and css/explore.css go.

   On test now (2026-10-11, his request): on hover, the painting fills its
   square and its number and name turn white over it. */
(() => {
    const ROOT = window.ROOT || '';
    const root = document.documentElement;

    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = `${ROOT}css/explore.css?v=20261015a`;
    document.head.appendChild(sheet);

    const TESTS = [['fill', 'on hover, the painting fills its square; number and name in white']];
    const load = (k, d) => { try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch (e) { return d; } };
    const save = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const on = new Set(load('kch-fx', []).filter(k => TESTS.some(([t]) => t === k)));

    // fill: how far the painting must grow to cover its square, past the white
    // round it in the photograph (about a tenth on each side)
    let fillOff = null;
    const fill = () => {
        if (fillOff) { fillOff(); fillOff = null; }
        if (!on.has('fill')) return;
        const ac = new AbortController();
        document.querySelectorAll('.sel-item, .tile-img').forEach(cell => {
            cell.addEventListener('mouseenter', () => {
                const img = cell.querySelector('img');
                if (!img || !img.naturalWidth) return;
                const W = cell.clientWidth, H = cell.clientHeight, ar = img.naturalWidth / img.naturalHeight;
                let w = W, h = W / ar;
                if (h > H) { h = H; w = H * ar; }
                img.style.setProperty('--fill', (Math.max(W / w, H / h) * 1.22).toFixed(3));
            }, { signal: ac.signal });
        });
        fillOff = () => ac.abort();
    };

    const apply = () => {
        TESTS.forEach(([k]) => root.classList.toggle(`fx-${k}`, on.has(k)));
        fill();
        save('kch-fx', [...on]);
    };

    const panel = document.createElement('aside');
    panel.className = 'fx-lab';
    panel.setAttribute('aria-label', 'Tests');
    panel.innerHTML =
        `<div class="fx-head"><b>test</b><button type="button" class="fx-close">close</button></div>` +
        TESTS.map(([k, label]) => `<label><input type="checkbox" data-fx="${k}"${on.has(k) ? ' checked' : ''}> ${label}</label>`).join('') +
        `<p class="fx-foot">for this visit only; see it on home and on a collection page</p>`;
    document.body.appendChild(panel);
    panel.addEventListener('change', e => {
        const k = e.target.dataset.fx;
        if (!k) return;
        if (e.target.checked) on.add(k); else on.delete(k);
        apply();
    });
    // close: the panel and the tests go, for the rest of the visit
    panel.querySelector('.fx-close').addEventListener('click', () => {
        on.clear(); apply(); panel.remove();
        try { sessionStorage.removeItem('kch-explore'); } catch (e) {}
    });
    apply();
})();
