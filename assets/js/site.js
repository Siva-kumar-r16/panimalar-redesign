/**
 * site.js — shared across every page of the Panimalar site.
 * Loads /header.html and /footer.html into placeholders, then wires up
 * the interactive bits (mobile menu, current year, scroll counters).
 *
 * IMPORTANT: fetch('/header.html') needs the site served over http(s),
 * not opened directly as a file:// path. Run a local server, e.g.:
 *   npx serve .
 *   python3 -m http.server
 */

async function loadPartial(url, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    try {
        const res = await fetch(url);
        const html = await res.text();
        mount.outerHTML = html;
    } catch (err) {
        console.error('Failed to load partial:', url, err);
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

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace(/,/g, '');
            const inc = target / speed;
            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(animateCounters, 10);
            } else {
                counter.innerText = target.toLocaleString();
            }
        });
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
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

    window.addEventListener('load', () => {
        setTimeout(() => document.body.classList.add('loaded'), 500);
    });
});
