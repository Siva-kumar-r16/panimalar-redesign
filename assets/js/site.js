/**
 * site.js — shared across every page of the Panimalar site.
 * Loads /header.html and /footer.html into placeholders, then wires up
 * the interactive bits (mobile menu, current year, scroll counters).
 */

async function loadPartial(url, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    
    // Automatically determine the base path in case the project is running in a subfolder
    let basePath = '';
    const script = document.querySelector('script[src*="site.js"]');
    if (script) {
        const src = script.getAttribute('src');
        if (src.includes('/assets/js/site.js')) {
            basePath = src.split('/assets/js/site.js')[0];
        }
    }

    const fullUrl = basePath + url;

    try {
        const res = await fetch(fullUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        mount.outerHTML = html;
    } catch (err) {
        console.error('Failed to load partial:', fullUrl, err);
        
        // Show a helpful UI warning if the user opens the file directly without a server
        if (window.location.protocol === 'file:') {
            mount.innerHTML = `
                <div style="padding: 20px; text-align: center; background: #fff3f3; color: #d32f2f; border: 2px dashed #f44336; margin: 20px; font-family: sans-serif; border-radius: 8px;">
                    <h3 style="margin-top:0;">⚠️ Header/Footer Cannot Load</h3>
                    <p>You are viewing this page directly from your computer (<code>file://</code> protocol).</p>
                    <p>Browsers block fetching other files (like <code>header.html</code>) for security reasons.</p>
                    <p><strong>How to fix:</strong> Open this project using a local web server (e.g., VS Code's "Live Server" extension).</p>
                </div>
            `;
        }
    }
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        const isOpen = !menu.classList.contains('hidden');
        menu.classList.toggle('hidden');
        btn.setAttribute('aria-expanded', String(!isOpen));
    });

    document.querySelectorAll('[data-mobile-toggle]').forEach(el => {
        el.addEventListener('click', () => {
            const target = document.getElementById(el.getAttribute('data-mobile-toggle'));
            if (!target) return;
            const isOpen = target.classList.toggle('open');
            el.setAttribute('aria-expanded', String(isOpen));
        });
    });
}

function initFooterYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    const speed = 200;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Scope animation specifically to the visible counters
                const visibleCounters = entry.target.querySelectorAll('.counter');
                visibleCounters.forEach(counter => {
                    // Prevent duplicate triggers
                    if (counter.dataset.animated) return;
                    counter.dataset.animated = 'true';
                    
                    const target = +counter.getAttribute('data-target');
                    
                    // Isolate the update logic per counter so they don't exponentially multiply
                    const updateCount = () => {
                        const count = +counter.innerText.replace(/,/g, '');
                        const inc = target / speed;
                        if (count < target) {
                            counter.innerText = Math.ceil(count + inc);
                            setTimeout(updateCount, 10);
                        } else {
                            counter.innerText = target.toLocaleString();
                        }
                    };
                    updateCount();
                });
                
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.grid').forEach(g => {
        if (g.querySelector('.counter')) observer.observe(g);
    });
}

async function initSiteChrome() {
    await Promise.all([
        loadPartial('/header.html', 'site-header'),
        loadPartial('/footer.html', 'site-footer'),
    ]);
    initMobileMenu();
    initFooterYear();
}

document.addEventListener('DOMContentLoaded', () => {
    initSiteChrome();
    initCounters();

    const hideLoader = () => {
        setTimeout(() => document.body.classList.add('loaded'), 500);
    };

    // If assets are cached and readyState is complete, the load event has 
    // already fired. In this case, hide immediately. Otherwise, wait for load.
    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
    }
});
