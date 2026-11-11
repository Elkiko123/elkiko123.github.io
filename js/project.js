/* ===================================================
   project.js — JavaScript para páginas de proyectos
   Usado por: pages/*.html
================================================== */
(() => {
    'use strict';

    const root = document.documentElement;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ── Theme toggle ──
    const themeToggle = document.getElementById('themeToggle');
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') root.setAttribute('data-theme', 'light');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = root.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    // ── Navbar + progreso de lectura + scroll top ──
    const navbar = document.getElementById('navbar');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const readProgress = document.getElementById('readProgress');

    const updateScrollUI = () => {
        const scrollY = window.scrollY;

        if (navbar) navbar.classList.toggle('scrolled', scrollY > 20);
        if (scrollTopBtn) scrollTopBtn.classList.toggle('show', scrollY > 320);

        if (readProgress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = max > 0 ? Math.min(1, scrollY / max) : 0;
            readProgress.style.width = `${ratio * 100}%`;
        }
    };

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
            updateScrollUI();
            scrollTicking = false;
        });
    }, { passive: true });

    updateScrollUI();

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: motionQuery.matches ? 'auto' : 'smooth' });
        });
    }

    // ── Reveal on scroll ──
    const revealTargets = document.querySelectorAll('.fade-up');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

        revealTargets.forEach((element) => revealObserver.observe(element));
    } else {
        revealTargets.forEach((element) => element.classList.add('visible'));
    }

    // ── Lightbox ──
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    let currentIndex = -1;
    let lastFocused = null;

    const updateNavButtons = () => {
        if (prevBtn) prevBtn.style.display = currentIndex > 0 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = currentIndex < galleryItems.length - 1 ? 'flex' : 'none';
    };

    const openLightbox = (index) => {
        if (!lightbox || !lightboxImg || index < 0 || index >= galleryItems.length) return;
        currentIndex = index;

        const item = galleryItems[currentIndex];
        const img = item.querySelector('img');
        if (!img) return;

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Captura de pantalla';
        const caption = item.dataset.caption || item.querySelector('.caption')?.textContent || 'Captura';
        if (lightboxCaption) lightboxCaption.textContent = caption.trim();

        lastFocused = document.activeElement;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        updateNavButtons();
        closeBtn?.focus({ preventScroll: true });
    };

    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        currentIndex = -1;
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus({ preventScroll: true });
        }
    };

    const navigateLightbox = (direction) => {
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < galleryItems.length) openLightbox(newIndex);
    };

    galleryItems.forEach((item, index) => {
        const label = item.dataset.caption || item.querySelector('.caption')?.textContent || 'Captura';
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `Ampliar imagen: ${label.trim()}`);
        item.addEventListener('click', () => openLightbox(index));
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(index);
            }
        });
    });

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => navigateLightbox(-1));
    nextBtn?.addEventListener('click', () => navigateLightbox(1));

    if (lightbox) {
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) closeLightbox();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (!lightbox || !lightbox.classList.contains('open')) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') navigateLightbox(-1);
        if (event.key === 'ArrowRight') navigateLightbox(1);
        if (event.key === 'Tab') {
            const focusables = [closeBtn, prevBtn, nextBtn].filter(
                (element) => element && element.style.display !== 'none'
            );
            if (!focusables.length) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    // ── Custom cursor ──
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');

    if (cursorDot && cursorOutline && finePointer && !motionQuery.matches) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let outlineX = mouseX;
        let outlineY = mouseY;
        let cursorFrame = null;
        let moved = false;

        const renderCursor = () => {
            outlineX += (mouseX - outlineX) * 0.18;
            outlineY += (mouseY - outlineY) * 0.18;

            cursorOutline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0) translate(-50%, -50%)`;

            if (Math.abs(mouseX - outlineX) > 0.1 || Math.abs(mouseY - outlineY) > 0.1) {
                cursorFrame = requestAnimationFrame(renderCursor);
            } else {
                cursorFrame = null;
            }
        };

        window.addEventListener('pointermove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

            if (!moved) {
                moved = true;
                cursorDot.classList.add('active');
                cursorOutline.classList.add('active');
            }

            if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
        }, { passive: true });

        document.querySelectorAll('a, button, .gallery-item').forEach((element) => {
            element.addEventListener('mouseenter', () => cursorOutline.classList.add('hover'));
            element.addEventListener('mouseleave', () => cursorOutline.classList.remove('hover'));
        });
    }

    // ── Spotlight sobre superficies ──
    if (finePointer) {
        const surfaces = document.querySelectorAll('.features, .gallery-item');

        surfaces.forEach((surface) => {
            surface.addEventListener('pointermove', (event) => {
                const rect = surface.getBoundingClientRect();
                surface.style.setProperty('--mx', `${event.clientX - rect.left}px`);
                surface.style.setProperty('--my', `${event.clientY - rect.top}px`);
            }, { passive: true });
        });
    }
})();
