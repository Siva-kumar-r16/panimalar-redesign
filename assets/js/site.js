(function () {
    'use strict';

    if (window.__siteChromeInitialized) return;
    window.__siteChromeInitialized = true;

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

    function getSingleMount(id) {
        const mounts = document.querySelectorAll(`#${id}`);
        mounts.forEach((el, i) => { if (i > 0) el.remove(); });
        return mounts[0] || null;
    }

    async function loadComponent(url, mountId) {
        const mount = getSingleMount(mountId);
        if (!mount) return;
        if (mount.dataset.loaded === 'true') return;
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

        window.toggleMobileSub = function (id) {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('open');
        };
    }

    function initCounters() {
        const counters = document.querySelectorAll('.counter');
        if (counters.length === 0) return;

        const animateCount = (counter) => {
            if (counter.dataset.counted === 'true') return;
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

    let chromeLoadPromise = null;
    function initSiteChrome() {
        if (chromeLoadPromise) return chromeLoadPromise;

        chromeLoadPromise = (async () => {
            removeLegacyChrome();
            await Promise.all([
                loadComponent('/components/header.html', 'site-header'),
                loadComponent('/components/footer.html', 'site-footer'),
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.addEventListener('load', () => {
        setTimeout(() => document.body.classList.add('loaded'), 400);
    }, { once: true });

    window.initSiteChrome = initSiteChrome;
})();
