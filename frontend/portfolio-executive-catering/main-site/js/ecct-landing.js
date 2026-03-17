/* ==============================================================
   INTERACTIVE: Executive Catering CT Landing Page
   DESCRIPTION: Parallax scrolling, animated counters, text rotator,
   scroll-reveal animations, and mobile nav toggle.
   ============================================================== */

(function () {
    'use strict';

    // ---------------------------------------------------------------
    // 1. NAVBAR SCROLL EFFECT
    // ---------------------------------------------------------------
    const nav = document.querySelector('.site-nav');
    if (nav) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 80) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ---------------------------------------------------------------
    // 2. MOBILE NAV TOGGLE
    // ---------------------------------------------------------------
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', function () {
            toggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                toggle.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    // ---------------------------------------------------------------
    // 3. SMOOTH SCROLL FOR ANCHOR LINKS
    // ---------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var navHeight = nav ? nav.offsetHeight : 0;
                var targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        });
    });

    // ---------------------------------------------------------------
    // 4. PARALLAX SCROLLING
    // ---------------------------------------------------------------
    var parallaxBgs = document.querySelectorAll('.parallax-bg');

    function updateParallax() {
        var scrollTop = window.pageYOffset;
        parallaxBgs.forEach(function (bg) {
            var parent = bg.parentElement;
            var rect = parent.getBoundingClientRect();
            // Only update when visible
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
                var speed = 0.3;
                var yPos = -(scrollTop - parent.offsetTop) * speed;
                bg.style.transform = 'translate3d(0, ' + yPos + 'px, 0)';
            }
        });
    }

    if (parallaxBgs.length > 0) {
        window.addEventListener('scroll', updateParallax, { passive: true });
        updateParallax();
    }

    // ---------------------------------------------------------------
    // 5. SCROLL REVEAL ANIMATIONS
    // ---------------------------------------------------------------
    var reveals = document.querySelectorAll('.reveal');

    if (reveals.length > 0) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        reveals.forEach(function (el) {
            revealObserver.observe(el);
        });
    }

    // ---------------------------------------------------------------
    // 6. ANIMATED COUNTERS
    // ---------------------------------------------------------------
    var counters = document.querySelectorAll('[data-count]');

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 2000; // ms
        var start = 0;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(eased * target);
            el.textContent = current.toLocaleString() + suffix;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target.toLocaleString() + suffix;
            }
        }

        requestAnimationFrame(step);
    }

    if (counters.length > 0) {
        var counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(function (el) {
            counterObserver.observe(el);
        });
    }

    // ---------------------------------------------------------------
    // 7. TEXT ROTATOR
    // ---------------------------------------------------------------
    var rotator = document.querySelector('.text-rotator');
    if (rotator) {
        var phrases = JSON.parse(rotator.getAttribute('data-phrases') || '[]');
        if (phrases.length > 0) {
            var currentIndex = 0;
            rotator.textContent = phrases[0];

            setInterval(function () {
                rotator.classList.add('fade-out');
                setTimeout(function () {
                    currentIndex = (currentIndex + 1) % phrases.length;
                    rotator.textContent = phrases[currentIndex];
                    rotator.classList.remove('fade-out');
                }, 500);
            }, 3500);
        }
    }

})();
