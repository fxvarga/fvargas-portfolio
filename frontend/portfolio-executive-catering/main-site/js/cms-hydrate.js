/**
 * CMS Hydration — Executive Catering CT Landing Page
 *
 * Fetches content from the CMS and hydrates the hardcoded HTML.
 * If the CMS is unreachable, the original HTML remains untouched as fallback.
 *
 * Depends on: cms-client.js (window.CmsClient)
 *
 * Entity types fetched:
 *   - site-config (contact info for sidebar)
 *   - navigation (nav links + CTA)
 *   - hero (tagline, subtitle, CTA)
 *   - about (Hello section paragraphs + sidebar heading)
 *   - services (What We Do: intro, gallery, stats)
 *   - capabilities (What We Bring: cards, rotating phrases)
 *   - footer (CTA banner, copyright)
 *   - parallax-break (collection: parallax-1, parallax-2)
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.CmsClient) {
      console.warn('[ECCT] CmsClient not loaded, skipping CMS hydration.');
      return;
    }

    // Fetch all singletons + parallax collection in parallel
    Promise.all([
      CmsClient.fetchContentByTypes([
        'site-config', 'navigation', 'hero', 'about',
        'services', 'capabilities', 'footer'
      ]),
      CmsClient.fetchCollection('parallax-break')
    ]).then(function (results) {
      var content = results[0];
      var parallaxRecords = results[1];

      if (content['site-config']) hydrateSiteConfig(content['site-config'].data);
      if (content['navigation']) hydrateNavigation(content['navigation'].data);
      if (content['hero']) hydrateHero(content['hero'].data);
      if (content['about']) hydrateAbout(content['about'].data, content['site-config'] ? content['site-config'].data : null);
      if (content['services']) hydrateServices(content['services'].data);
      if (content['capabilities']) hydrateCapabilities(content['capabilities'].data);
      if (content['footer']) hydrateFooter(content['footer'].data);
      if (parallaxRecords && parallaxRecords.length) hydrateParallax(parallaxRecords);

      console.log('[ECCT] CMS hydration complete.');
    });
  });

  // ─── Helpers ────────────────────────────────────────

  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el && text != null) el.textContent = text;
  }

  function setHTML(selector, html) {
    var el = document.querySelector(selector);
    if (el && html != null) el.innerHTML = html;
  }

  function setAttr(selector, attr, value) {
    var el = document.querySelector(selector);
    if (el && value != null) el.setAttribute(attr, value);
  }

  // ─── Site Config ────────────────────────────────────

  function hydrateSiteConfig(config) {
    if (!config) return;
    // Update page title
    if (config.siteTitle) document.title = config.siteTitle;
    // Update meta description
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && config.siteDescription) metaDesc.setAttribute('content', config.siteDescription);
  }

  // ─── Navigation ─────────────────────────────────────

  function hydrateNavigation(nav) {
    if (!nav) return;

    var navLinksEl = document.querySelector('.nav-links');
    if (navLinksEl && nav.links && nav.links.length) {
      navLinksEl.innerHTML = '';
      nav.links.forEach(function (link) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.label;
        li.appendChild(a);
        navLinksEl.appendChild(li);
      });

      // Add CTA link
      if (nav.ctaText) {
        var ctaLi = document.createElement('li');
        var ctaA = document.createElement('a');
        ctaA.href = nav.ctaLink || 'inquiry/';
        ctaA.className = 'nav-cta';
        ctaA.textContent = nav.ctaText;
        ctaLi.appendChild(ctaA);
        navLinksEl.appendChild(ctaLi);
      }

      // Rebind mobile nav close-on-click
      var toggle = document.querySelector('.nav-toggle');
      if (toggle) {
        navLinksEl.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () {
            toggle.classList.remove('active');
            navLinksEl.classList.remove('open');
          });
        });
      }
    }
  }

  // ─── Hero ───────────────────────────────────────────

  function hydrateHero(hero) {
    if (!hero) return;

    if (hero.tagline) {
      var taglineEl = document.querySelector('[data-cms="hero-tagline"]');
      if (taglineEl) {
        taglineEl.innerHTML = hero.tagline.replace(/\n/g, '<br>');
      }
    }

    setText('[data-cms="hero-subtitle"]', hero.subtitle);

    var ctaBtn = document.querySelector('[data-cms="hero-cta"]');
    if (ctaBtn) {
      if (hero.ctaText) ctaBtn.textContent = hero.ctaText;
      if (hero.ctaLink) ctaBtn.href = hero.ctaLink;
    }

    setText('[data-cms="scroll-indicator"]', hero.scrollIndicatorText);
  }

  // ─── About / Hello ──────────────────────────────────

  function hydrateAbout(about, siteConfig) {
    if (!about) return;

    setText('[data-cms="about-heading"]', about.heading);

    if (about.paragraphs && about.paragraphs.length) {
      var container = document.querySelector('[data-cms="about-paragraphs"]');
      if (container) {
        container.innerHTML = '';
        about.paragraphs.forEach(function (p) {
          var pEl = document.createElement('p');
          pEl.textContent = p.text;
          container.appendChild(pEl);
        });
      }
    }

    setText('[data-cms="sidebar-heading"]', about.sidebarHeading);

    // Hydrate sidebar contact info from site-config
    if (siteConfig) {
      setText('[data-cms="contact-phone"]', siteConfig.phone);
      var phoneLink = document.querySelector('[data-cms="contact-phone-link"]');
      if (phoneLink) {
        if (siteConfig.phone) phoneLink.textContent = siteConfig.phone;
        if (siteConfig.phoneHref) phoneLink.href = siteConfig.phoneHref;
      }

      var emailLink = document.querySelector('[data-cms="contact-email-link"]');
      if (emailLink) {
        if (siteConfig.email) emailLink.textContent = siteConfig.email;
        if (siteConfig.email) emailLink.href = 'mailto:' + siteConfig.email;
      }

      setText('[data-cms="contact-location"]', siteConfig.location);

      if (siteConfig.hours) {
        var hoursEl = document.querySelector('[data-cms="contact-hours"]');
        if (hoursEl) {
          hoursEl.innerHTML = siteConfig.hours.replace(/\n/g, '<br>');
        }
      }
    }
  }

  // ─── Services ───────────────────────────────────────

  function hydrateServices(services) {
    if (!services) return;

    setText('[data-cms="services-heading"]', services.heading);
    setText('[data-cms="services-subtitle"]', services.subtitle);
    setText('[data-cms="services-description"]', services.description);

    // Gallery images
    if (services.galleryImages && services.galleryImages.length) {
      var galleryRow = document.querySelector('[data-cms="gallery-row"]');
      if (galleryRow) {
        galleryRow.innerHTML = '';
        services.galleryImages.forEach(function (img) {
          var div = document.createElement('div');
          div.className = 'gallery-item';
          var imgEl = document.createElement('img');
          imgEl.src = img.src;
          imgEl.alt = img.alt;
          imgEl.loading = 'lazy';
          div.appendChild(imgEl);
          galleryRow.appendChild(div);
        });
      }
    }

    // Stat counters
    if (services.stats && services.stats.length) {
      var grid = document.querySelector('[data-cms="services-grid"]');
      if (grid) {
        grid.innerHTML = '';
        services.stats.forEach(function (stat) {
          var card = document.createElement('div');
          card.className = 'service-card';

          var counter = document.createElement('div');
          counter.className = 'counter';
          counter.setAttribute('data-count', stat.count);
          if (stat.suffix) counter.setAttribute('data-suffix', stat.suffix);
          counter.textContent = '0';

          var h3 = document.createElement('h3');
          h3.textContent = stat.title;

          var p = document.createElement('p');
          p.textContent = stat.description;

          card.appendChild(counter);
          card.appendChild(h3);
          card.appendChild(p);
          grid.appendChild(card);
        });

        // Re-observe the new counters for animation
        observeCounters(grid);
      }
    }
  }

  /**
   * Set up IntersectionObserver for newly created counter elements.
   */
  function observeCounters(container) {
    var counters = container.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 2000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  // ─── Capabilities ───────────────────────────────────

  function hydrateCapabilities(capabilities) {
    if (!capabilities) return;

    setText('[data-cms="capabilities-heading"]', capabilities.heading);
    setText('[data-cms="capabilities-subtitle"]', capabilities.subtitle);

    // Capability cards
    if (capabilities.cards && capabilities.cards.length) {
      var grid = document.querySelector('[data-cms="capabilities-grid"]');
      if (grid) {
        grid.innerHTML = '';
        capabilities.cards.forEach(function (card) {
          var div = document.createElement('div');
          div.className = 'capability-card';

          var icon = document.createElement('div');
          icon.className = 'capability-icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = card.icon || '';

          var h3 = document.createElement('h3');
          h3.textContent = card.title;

          var p = document.createElement('p');
          p.textContent = card.description;

          div.appendChild(icon);
          div.appendChild(h3);
          div.appendChild(p);
          grid.appendChild(div);
        });
      }
    }

    // Rotating phrases
    if (capabilities.rotatingPhrases && capabilities.rotatingPhrases.length) {
      var rotator = document.querySelector('.text-rotator');
      if (rotator) {
        var phrases = capabilities.rotatingPhrases.map(function (p) { return p.text; });
        rotator.setAttribute('data-phrases', JSON.stringify(phrases));
        rotator.textContent = phrases[0];
      }
    }
  }

  // ─── Footer ─────────────────────────────────────────

  function hydrateFooter(footer) {
    if (!footer) return;

    setText('[data-cms="footer-cta-heading"]', footer.ctaHeading);
    setText('[data-cms="footer-cta-subtext"]', footer.ctaSubtext);

    var ctaBtn = document.querySelector('[data-cms="footer-cta-btn"]');
    if (ctaBtn) {
      if (footer.ctaButtonText) ctaBtn.textContent = footer.ctaButtonText;
      if (footer.ctaButtonLink) ctaBtn.href = footer.ctaButtonLink;
    }

    if (footer.copyrightTemplate) {
      var copyrightEl = document.querySelector('[data-cms="footer-copyright"]');
      if (copyrightEl) {
        var year = new Date().getFullYear();
        var text = footer.copyrightTemplate.replace('{year}', year);
        // Keep built-by link if present
        var builtByHtml = '';
        if (footer.builtByText && footer.builtByUrl) {
          builtByHtml = '<br><a href="' + footer.builtByUrl + '" target="_blank" rel="noopener">' + footer.builtByText + '</a>';
        }
        copyrightEl.innerHTML = text + builtByHtml;
      }
    }
  }

  // ─── Parallax Breaks ────────────────────────────────

  function hydrateParallax(records) {
    records.forEach(function (record) {
      if (!record || !record.data) return;
      var data = record.data;

      // Match by slug: parallax-1, parallax-2
      // Try data-cms attributes first
      var selectors = [
        '[data-cms="parallax-1"]',
        '[data-cms="parallax-2"]'
      ];

      // Find the right parallax break by iterating
      selectors.forEach(function (selector) {
        var el = document.querySelector(selector);
        if (!el) return;

        var expectedSlug = selector.match(/parallax-(\d)/);
        if (!expectedSlug) return;

        // Check if this record's entityType slug part matches
        // Records have id based on slug - we need to check
        // We rely on ordering: first record = parallax-1, second = parallax-2
      });
    });

    // Simpler approach: use data-cms-slug attributes on parallax breaks
    records.forEach(function (record) {
      if (!record || !record.data) return;

      // Find element by data-cms-slug attribute
      var el = document.querySelector('[data-cms-slug="' + escapeAttr(record.id) + '"]');

      // Fallback: try matching by slug in a data attribute
      if (!el) {
        // Try the parallax breaks in order
        var breaks = document.querySelectorAll('[data-cms^="parallax-"]');
        breaks.forEach(function (breakEl) {
          var cmsId = breakEl.getAttribute('data-cms');
          // Already hydrated? Skip
          if (breakEl._cmsHydrated) return;

          var headingEl = breakEl.querySelector('h2');
          if (headingEl && record.data.heading) {
            headingEl.textContent = record.data.heading;
          }
          var subtextEl = breakEl.querySelector('p');
          if (subtextEl && record.data.subtext) {
            subtextEl.textContent = record.data.subtext;
          }
          breakEl._cmsHydrated = true;
        });
      } else {
        var headingEl = el.querySelector('h2');
        if (headingEl && record.data.heading) {
          headingEl.textContent = record.data.heading;
        }
        var subtextEl = el.querySelector('p');
        if (subtextEl && record.data.subtext) {
          subtextEl.textContent = record.data.subtext;
        }
      }
    });
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

})();
