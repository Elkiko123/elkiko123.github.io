/* ===================================================
   main.js — JavaScript del portafolio principal
   Usado por: index.html
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

    // ── Mobile nav ──
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    const closeNav = () => {
        if (!navLinks) return;
        navLinks.classList.remove('open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    };

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeNav);
        });

        document.addEventListener('click', (event) => {
            if (!navLinks.classList.contains('open')) return;
            if (!navLinks.contains(event.target) && !navToggle.contains(event.target)) closeNav();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeNav();
        });
    }

    // ── Scroll UI: navbar, progreso, botón y nav activa ──
    const navbar = document.getElementById('navbar');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollProgress = document.getElementById('scrollProgress');
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navLinksItems = Array.from(document.querySelectorAll('.nav-links a'));

    const updateScrollUI = () => {
        const scrollY = window.scrollY;

        if (navbar) navbar.classList.toggle('scrolled', scrollY > 20);
        if (scrollTopBtn) scrollTopBtn.classList.toggle('show', scrollY > 320);

        if (scrollProgress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = max > 0 ? Math.min(1, scrollY / max) : 0;
            scrollProgress.style.width = `${ratio * 100}%`;
        }

        if (sections.length && navLinksItems.length) {
            let current = sections[0].id;
            const probe = scrollY + 160;

            sections.forEach((section) => {
                if (probe >= section.offsetTop) current = section.id;
            });

            navLinksItems.forEach((link) => {
                const active = link.getAttribute('href') === `#${current}`;
                link.classList.toggle('active', active);
                if (active) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            });
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
    const revealTargets = document.querySelectorAll('.fade-up, .timeline');
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
    const thumbs = Array.from(document.querySelectorAll('.project-thumb'));
    let currentIndex = -1;
    let lastFocused = null;

    const updateNavButtons = () => {
        if (prevBtn) prevBtn.style.display = currentIndex > 0 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = currentIndex < thumbs.length - 1 ? 'flex' : 'none';
    };

    const openLightbox = (index) => {
        if (!lightbox || !lightboxImg || index < 0 || index >= thumbs.length) return;
        currentIndex = index;

        const thumb = thumbs[currentIndex];
        const img = thumb.querySelector('img');
        if (!img) return;

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Proyecto';
        const card = thumb.closest('.project-card');
        const title = card ? card.querySelector('h4')?.textContent : 'Proyecto';
        if (lightboxCaption) lightboxCaption.textContent = title || 'Proyecto';

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
        if (newIndex >= 0 && newIndex < thumbs.length) openLightbox(newIndex);
    };

    thumbs.forEach((thumb, index) => {
        const label = thumb.querySelector('img')?.alt || 'Proyecto';
        thumb.setAttribute('tabindex', '0');
        thumb.setAttribute('role', 'button');
        thumb.setAttribute('aria-label', `Ampliar imagen: ${label}`);
        thumb.addEventListener('click', () => openLightbox(index));
        thumb.addEventListener('keydown', (event) => {
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

        document.querySelectorAll('a, button, .project-thumb, .filter-btn').forEach((element) => {
            element.addEventListener('mouseenter', () => cursorOutline.classList.add('hover'));
            element.addEventListener('mouseleave', () => cursorOutline.classList.remove('hover'));
        });
    }

    // ── Typewriter ──
    const typewriter = document.getElementById('typewriter');
    if (typewriter) {
        const text = typewriter.getAttribute('data-text') || '';

        if (motionQuery.matches) {
            typewriter.textContent = text;
        } else {
            let index = 0;
            const type = () => {
                if (index < text.length) {
                    typewriter.textContent += text.charAt(index);
                    index += 1;
                    window.setTimeout(type, 95);
                }
            };
            window.setTimeout(type, 480);
        }
    }

    // ── Contadores ──
    const animateStat = (element) => {
        const target = Number(element.getAttribute('data-target') || 0);

        if (motionQuery.matches) {
            element.textContent = String(target);
            return;
        }

        const duration = 1400;
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 4);
            element.textContent = String(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(step);
            else element.textContent = String(target);
        };

        requestAnimationFrame(step);
    };

    const skillBars = document.querySelectorAll('.skill-progress');
    const statNumbers = document.querySelectorAll('.stat-num');

    if ('IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                if (entry.target.classList.contains('stat-num')) animateStat(entry.target);
                if (entry.target.classList.contains('skill-progress')) {
                    const value = entry.target.getAttribute('data-width') || '0%';
                    entry.target.style.width = value.includes('%') ? value : `${value}%`;
                }

                observer.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        statNumbers.forEach((number) => statsObserver.observe(number));
        skillBars.forEach((bar) => statsObserver.observe(bar));
    }

    // ── Project filters ──
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = Array.from(document.querySelectorAll('.project-card'));

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((item) => item.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');

            projectCards.forEach((card) => {
                const categories = (card.getAttribute('data-category') || '').split(/\s+/);
                const visible = filter === 'all' || categories.includes(filter);

                card.classList.toggle('hide', !visible);
                card.classList.remove('card-enter');

                if (visible) {
                    // Reinicia la animación de entrada al mostrar la tarjeta.
                    void card.offsetWidth;
                    card.classList.add('card-enter');
                    card.addEventListener('animationend', () => card.classList.remove('card-enter'), { once: true });
                }
            });
        });
    });

    // ── Spotlight que sigue al cursor sobre superficies ──
    if (finePointer) {
        const surfaces = document.querySelectorAll('.card, .project-card, .about-card, .contact-card, .terminal');

        surfaces.forEach((surface) => {
            surface.addEventListener('pointermove', (event) => {
                const rect = surface.getBoundingClientRect();
                surface.style.setProperty('--mx', `${event.clientX - rect.left}px`);
                surface.style.setProperty('--my', `${event.clientY - rect.top}px`);
            }, { passive: true });
        });
    }
})();
