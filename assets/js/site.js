async function loadComponent(url, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const html = await res.text();
        mount.outerHTML = html;
    } catch (err) {
        console.error(`Failed to load ${url}:`, err);
        // Fallback warning for local file:// viewing
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
    
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }

    // Assign globally to be accessed by inline onclicks
    window.toggleMobileSub = function(id) {
        const el = document.getElementById(id);
        if(el) {
            el.classList.toggle('open');
        }
    };
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const animateCount = (counter) => {
        const target = +counter.getAttribute('data-target');
        const speed = 150; // The lower the slower
        const inc = target / speed;
        let count = 0;

        const updateCount = () => {
            count += inc;
            if (count < target) {
                counter.innerText = Math.ceil(count).toLocaleString();
                requestAnimationFrame(updateCount); // Much safer than setTimeout for animations
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        updateCount();
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetCounters = entry.target.querySelectorAll('.counter');
                targetCounters.forEach(c => animateCount(c));
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    // Observe the parent container of the counters to trigger them simultaneously
    const gridContainers = document.querySelectorAll('.grid');
    gridContainers.forEach(grid => {
        if(grid.querySelector('.counter')) {
            observer.observe(grid);
        }
    });
}

async function initSiteChrome() {
    // Relative paths ensure it works from /index.html and /about-us.html equally
    await Promise.all([
        loadComponent('components/header.html', 'site-header'),
        loadComponent('components/footer.html', 'site-footer'),
    ]);

    initMobileMenu();

    // Set dynamic year
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
    initSiteChrome();
    initCounters();
});

window.addEventListener('load', () => {
    // Small delay to ensure the smooth transition is visible
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 400);
});
