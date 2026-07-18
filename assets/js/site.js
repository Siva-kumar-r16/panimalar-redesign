(function () {
    'use strict';

    // Guard: if this script gets included twice on the same page
    // (leftover old <script> tag + the new one), do nothing the second time.
    if (window.__siteChromeInitialized) return;
    window.__siteChromeInitialized = true;

    // Any old hardcoded chrome that might still be lingering in a page's HTML.
    // Selectors are taken from the original (pre-redesign) template.
    const LEGACY_HEADER_SELECTORS = ['#mainheader', '.kode-header-absolute', '.mobile-view-mini-header'];
    const LEGACY_FOOTER_SELECTORS = ['.sitemap-bg', '#sub-footer'];

    function removeLegacyChrome() {
        LEGACY_HEADER_SELECTORS.forEach(sel =>
            document.querySelectorAll(sel).forEach(el => el.remove())
        );
        LEGACY_FOOTER_SELECTORS.forEach(sel =>
            document.querySelectorAll(sel).forEach(el => el.remove())
        );
    }

    // If a page accidentally has more than one mount point with the same id,
    // keep only the first and drop the rest so we never inject twice.
    function getSingleMount(id) {
        const mounts = document.querySelectorAll(`#${id}`);
        mounts.forEach((el, i) => { if (i > 0) el.remove(); });
        return mounts[0] || null;
    }

    async function loadComponent(url, mountId) {
        const mount = getSingleMount(mountId);
        if (!mount) return;
        if (mount.dataset.loaded === 'true') return; // already injected, never do it again
        mount.dataset.loaded = 'true';

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            const html = await res.text();
            mount.outerHTML = html;
        } catch (err) {
            console.error(`Failed to load ${url}:`, err);
            if (window.location.protocol === 'file:') {
                mount.innerHTML = `<div class="bg-red-100 text-red-600 p-4 rounded text-center my-4 font-bold border border-red-200">
                    ⚠️ Security Block: You are viewing this via the <code>file://</code> protocol. Please use a local web server (like VS Code Live Server) to see the Header and Footer.
                </div>`;
            }
        }
    }

    function initMobileMenu() {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');

        if (btn && menu && btn.dataset.bound !== 'true') {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });
        }

        // Assigned once, safe to reassign — it's a plain function reference, not a listener
        window.toggleMobileSub = function (id) {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('open');
        };
    }

    function initCounters() {
        const counters = document.querySelectorAll('.counter');
        if (counters.length === 0) return;

        const animateCount = (counter) => {
            if (counter.dataset.counted === 'true') return; // never double-animate
            counter.dataset.counted = 'true';

            const target = +counter.getAttribute('data-target');
            const speed = 150;
            const inc = target / speed;
            let count = 0;

            const updateCount = () => {
                count += inc;
                if (count < target) {
                    counter.innerText = Math.ceil(count).toLocaleString();
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = target.toLocaleString();
                }
            };
            updateCount();
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.querySelectorAll('.counter').forEach(c => animateCount(c));
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.grid').forEach(grid => {
            if (grid.querySelector('.counter')) observer.observe(grid);
        });
    }

    // initSiteChrome is re-entrant safe: no matter how many times it's called
    // (or from how many places), the header/footer are fetched and injected
    // exactly once per page load.
    let chromeLoadPromise = null;
    function initSiteChrome() {
        if (chromeLoadPromise) return chromeLoadPromise;

        chromeLoadPromise = (async () => {
            removeLegacyChrome();
            await Promise.all([
                loadComponent('components/header.html', 'site-header'),
                loadComponent('components/footer.html', 'site-footer'),
            ]);
            initMobileMenu();

            const yearEl = document.getElementById('year');
            if (yearEl) yearEl.textContent = new Date().getFullYear();
        })();

        return chromeLoadPromise;
    }

    function boot() {
        initSiteChrome();
        initCounters();
    }

    // Handles the case where this script (deferred or placed late in <body>)
    // runs after DOMContentLoaded has already fired.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.addEventListener('load', () => {
        setTimeout(() => document.body.classList.add('loaded'), 400);
    }, { once: true });

    // Exposed in case a page needs to trigger it manually — safe to call
    // repeatedly since it's re-entrancy guarded above.
    window.initSiteChrome = initSiteChrome;
})();
