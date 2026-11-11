/* ===================================================
   orb.js — Orbe de partículas bioluminiscente
   Sistema visual: Auros (DESIGN.md)
   Se usa en index.html (hero) y en pages/*.html
================================================== */
(() => {
    'use strict';

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = reduceQuery.matches;
    const TAU = Math.PI * 2;
    const instances = [];

    const getPalette = () => {
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        return light
            ? { primary: 'rgb(6, 122, 108)', accent: 'rgb(140, 59, 138)', glow: 'rgba(0, 130, 124, ', ring: 'rgba(6, 122, 108, 0.26)' }
            : { primary: 'rgb(203, 255, 252)', accent: 'rgb(253, 233, 255)', glow: 'rgba(0, 130, 124, ', ring: 'rgba(203, 255, 252, 0.20)' };
    };

    class ParticleOrb {
        constructor(canvas, options) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.opts = Object.assign({
                count: 560,
                radius: 0.37,
                alpha: 0.95,
                speed: 0.00016,
                parallax: true,
                glow: true
            }, options);

            this.points = [];
            this.angle = Math.random() * TAU;
            this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
            this.visible = true;
            this.palette = getPalette();
            this.frame = 0;
            this.running = false;

            this.build();
            this.resize();
            this.bind();
            this.start();
        }

        build() {
            const count = this.opts.count;
            const golden = Math.PI * (3 - Math.sqrt(5));

            for (let i = 0; i < count; i++) {
                const y = 1 - (i / (count - 1)) * 2;
                const radius = Math.sqrt(Math.max(0, 1 - y * y));
                const theta = golden * i;

                this.points.push({
                    x: Math.cos(theta) * radius,
                    y,
                    z: Math.sin(theta) * radius,
                    size: 0.9 + Math.random() * 1.9,
                    tint: Math.random() < 0.13,
                    twinkle: Math.random() * TAU
                });
            }
        }

        bind() {
            this.onResize = () => this.resize();
            window.addEventListener('resize', this.onResize);

            if ('ResizeObserver' in window) {
                this.ro = new ResizeObserver(() => this.resize());
                this.ro.observe(this.canvas);
            }

            if (this.opts.parallax) {
                window.addEventListener('pointermove', (event) => {
                    this.pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
                    this.pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
                }, { passive: true });
            }

            if ('IntersectionObserver' in window) {
                this.io = new IntersectionObserver((entries) => {
                    this.visible = entries[0].isIntersecting;
                }, { threshold: 0 });
                this.io.observe(this.canvas);
            }
        }

        resize() {
            const rect = this.canvas.getBoundingClientRect();
            const width = Math.max(1, Math.round(rect.width || 400));
            const height = Math.max(1, Math.round(rect.height || 400));
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);

            const ctx = this.ctx;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.width = width;
            this.height = height;

            if (reduced) this.draw(0);
        }

        updateTheme() {
            this.palette = getPalette();
            if (reduced) this.draw(0);
        }

        start() {
            if (this.running || reduced) {
                if (reduced) this.draw(0);
                return;
            }
            this.running = true;
            this.frame = requestAnimationFrame((time) => this.tick(time));
        }

        stop() {
            this.running = false;
            if (this.frame) cancelAnimationFrame(this.frame);
            this.frame = 0;
        }

        tick(time) {
            if (!this.running) return;
            if (this.visible && !document.hidden) this.draw(time);
            this.frame = requestAnimationFrame((next) => this.tick(next));
        }

        draw(time) {
            const ctx = this.ctx;
            const width = this.width;
            const height = this.height;
            if (!ctx || !width || !height) return;

            ctx.clearRect(0, 0, width, height);

            const palette = this.palette;
            const radius = Math.min(width, height) * this.opts.radius;
            const cx = width * 0.5;
            const cy = height * 0.51;

            this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.045;
            this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.045;

            const timeValue = reduced ? 0 : time;
            const angleY = this.angle + timeValue * this.opts.speed + this.pointer.x * 0.38;
            const angleX = -0.26 + this.pointer.y * 0.16;
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);

            /* Halo bioluminiscente */
            if (this.opts.glow) {
                const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.35);
                halo.addColorStop(0, palette.glow + '0.22)');
                halo.addColorStop(0.55, palette.glow + '0.07)');
                halo.addColorStop(1, palette.glow + '0)');
                ctx.fillStyle = halo;
                ctx.fillRect(0, 0, width, height);
            }

            /* Anillos orbitales */
            ctx.save();
            ctx.strokeStyle = palette.ring;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(cx, cy, radius * 1.06, radius * 0.32, -0.24, 0, TAU);
            ctx.stroke();
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.ellipse(cx, cy, radius * 0.98, radius * 0.24, 0.62, 0, TAU);
            ctx.stroke();
            ctx.restore();

            ctx.globalCompositeOperation = 'lighter';
            const scale = Math.max(0.7, Math.min(width, height) / 560);

            for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];

                const x1 = point.x * cosY - point.z * sinY;
                const z1 = point.x * sinY + point.z * cosY;
                const y1 = point.y * cosX - z1 * sinX;
                const z2 = point.y * sinX + z1 * cosX;

                const perspective = 1 + z2 * 0.24;
                const pgX = cx + x1 * radius * perspective;
                const pgY = cy + y1 * radius * perspective;
                const depth = (z2 + 1) / 2;

                let alpha = (0.20 + depth * 0.9) * this.opts.alpha;
                if (!reduced) alpha *= 0.86 + 0.14 * Math.sin(timeValue * 0.0016 + point.twinkle);

                const dot = point.size * (0.7 + depth * 1.2) * scale;
                ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
                ctx.fillStyle = point.tint ? palette.accent : palette.primary;
                ctx.beginPath();
                ctx.arc(pgX, pgY, dot, 0, TAU);
                ctx.fill();

                /* Estela en los puntos más cercanos */
                if (depth > 0.68 && dot > 1.35) {
                    ctx.globalAlpha = alpha * 0.20;
                    ctx.beginPath();
                    ctx.arc(pgX, pgY, dot * 2.3, 0, TAU);
                    ctx.fill();
                }
            }

            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    const heroCanvas = document.getElementById('heroOrb');
    if (heroCanvas) {
        instances.push(new ParticleOrb(heroCanvas, {
            count: 620,
            radius: 0.37,
            alpha: 0.95,
            speed: 0.00016,
            parallax: true
        }));
    }

    /* En páginas de proyecto, el orbe se inyecta dentro del hero */
    document.querySelectorAll('.project-hero').forEach((hero) => {
        if (hero.querySelector('.project-orb')) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'project-orb';
        canvas.setAttribute('aria-hidden', 'true');
        hero.prepend(canvas);
        instances.push(new ParticleOrb(canvas, {
            count: 240,
            radius: 0.42,
            alpha: 0.72,
            speed: 0.00012,
            parallax: false
        }));
    });

    if (!instances.length) return;

    /* Reaccionar al cambio de tema */
    const themeObserver = new MutationObserver(() => {
        instances.forEach((orb) => orb.updateTheme());
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

    /* Reaccionar a preferencias de movimiento */
    const onMotionChange = (event) => {
        reduced = event.matches;
        instances.forEach((orb) => {
            if (reduced) {
                orb.stop();
                orb.draw(0);
            } else {
                orb.start();
            }
        });
    };

    if (typeof reduceQuery.addEventListener === 'function') {
        reduceQuery.addEventListener('change', onMotionChange);
    } else if (typeof reduceQuery.addListener === 'function') {
        reduceQuery.addListener(onMotionChange);
    }

    /* Pausar cuando la pestaña no es visible */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            instances.forEach((orb) => orb.stop());
        } else if (!reduced) {
            instances.forEach((orb) => orb.start());
        }
    });
})();
