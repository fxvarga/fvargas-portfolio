/**
 * Menu Page CMS Hydration — 1 Stop Wings (menu.html)
 *
 * Fetches menu categories, items, flavors, site-config, navigation,
 * and footer from the CMS, then rebuilds the menu grid dynamically.
 * If the CMS is unreachable, the hardcoded HTML remains untouched.
 *
 * Depends on: cms-client.js (window.CmsClient)
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.CmsClient) {
      console.warn('[Menu] CmsClient not loaded, skipping CMS hydration.');
      return;
    }

    // Fetch all content types in parallel
    Promise.all([
      CmsClient.fetchContentSingle('site-config'),
      CmsClient.fetchContent('menu-category'),
      CmsClient.fetchContent('menu-item'),
      CmsClient.fetchContent('flavor'),
      CmsClient.fetchContentSingle('navigation'),
      CmsClient.fetchContentSingle('footer')
    ]).then(function (results) {
      var siteConfig = results[0] ? results[0].data : null;
      var categories = results[1] || [];
      var items = results[2] || [];
      var flavors = results[3] || [];
      var navigation = results[4] ? results[4].data : null;
      var footer = results[5] ? results[5].data : null;

      if (siteConfig) hydrateSiteConfig(siteConfig);
      if (categories.length && items.length) hydrateMenuGrid(categories, items, flavors);
      if (navigation) hydrateNavigation(navigation);
      if (footer) hydrateFooter(footer);
    });
  });

  // ================================================================
  // SITE CONFIG — header address, phone, hours
  // ================================================================
  function hydrateSiteConfig(config) {
    var addressEl = document.querySelector('[data-cms="store-address"]');
    if (addressEl && config.address) {
      var addr = config.address;
      if (config.city) addr += '; ' + config.city;
      if (config.state) addr += ', ' + config.state;
      if (config.zip) addr += ' ' + config.zip;

      var phoneLink = '';
      if (config.phone) {
        var phoneDigits = config.phone.replace(/\D/g, '');
        phoneLink = ' | <a href="tel:' + phoneDigits + '">' + config.phone + '</a>';
      }
      addressEl.innerHTML = addr + phoneLink;
    }

    var hoursEl = document.querySelector('[data-cms="store-hours"]');
    if (hoursEl && config.hours && config.hours.length) {
      var parts = config.hours.map(function (h) {
        return '<strong>' + h.days + ':</strong> ' + h.open + ' - ' + h.close;
      });
      hoursEl.innerHTML = parts.join(' &nbsp; | &nbsp; ');
    }
  }

  // ================================================================
  // MENU GRID — categories, items, flavors
  // ================================================================
  function hydrateMenuGrid(categoryRecords, itemRecords, flavorRecords) {
    var grid = document.querySelector('[data-cms="menu-grid"]');
    if (!grid) return;

    // Extract data and sort
    var categories = categoryRecords
      .map(function (r) { return r.data; })
      .sort(function (a, b) { return (a.displayOrder || 0) - (b.displayOrder || 0); });

    var items = itemRecords
      .map(function (r) { return r.data; })
      .filter(function (i) { return i.isAvailable !== false; })
      .sort(function (a, b) { return (a.displayOrder || 0) - (b.displayOrder || 0); });

    var flavors = flavorRecords
      .map(function (r) { return r.data; })
      .sort(function (a, b) { return (a.displayOrder || 0) - (b.displayOrder || 0); });

    // Group items by categorySlug
    var itemsByCategory = {};
    items.forEach(function (item) {
      var slug = item.categorySlug;
      if (!itemsByCategory[slug]) itemsByCategory[slug] = [];
      itemsByCategory[slug].push(item);
    });

    // Determine which categories go in which column.
    // The original layout pairs categories into 4 columns:
    //   Col 1: wings-and-tenders (+ flavors + dips)
    //   Col 2: sandwiches, soup-and-specials
    //   Col 3: ribs-and-boxes, drinks
    //   Col 4: salads, sides-and-extras
    // We'll replicate this by grouping into columns.
    var columnMap = [
      { slugs: ['wings-and-tenders', 'dips'], hasFlavors: true },
      { slugs: ['sandwiches', 'soup-and-specials'], hasFlavors: false },
      { slugs: ['ribs-and-boxes', 'drinks'], hasFlavors: false },
      { slugs: ['salads', 'sides-and-extras'], hasFlavors: false }
    ];

    // Build a lookup for categories by slug
    var catBySlug = {};
    categories.forEach(function (c) { catBySlug[c.slug] = c; });

    // Clear and rebuild
    grid.innerHTML = '';

    columnMap.forEach(function (col) {
      var section = document.createElement('section');
      section.className = 'menu-column';

      col.slugs.forEach(function (slug, idx) {
        var cat = catBySlug[slug];
        if (!cat) return;

        var colorClass = cat.colorTheme === 'red' ? 'red-text' : 'blue-text';

        // Add spacing before second+ category in a column
        var h2 = document.createElement('h2');
        h2.className = colorClass + ' underline';
        if (idx > 0) h2.style.marginTop = '40px';
        h2.textContent = cat.name;
        section.appendChild(h2);

        // Render items for this category
        var catItems = itemsByCategory[slug] || [];
        catItems.forEach(function (item) {
          var div = document.createElement('div');
          div.className = 'menu-group';

          var nameSpan = document.createElement('span');
          nameSpan.className = 'item-name';
          nameSpan.textContent = item.name;
          div.appendChild(nameSpan);

          // Build description with sizes and price
          var desc = item.description || '';
          var sizeText = buildSizeText(item);
          if (sizeText) desc += ' ' + sizeText;

          var priceText = buildPriceText(item);
          if (priceText) desc += ' ' + priceText;

          if (desc) {
            var p = document.createElement('p');
            p.className = 'item-desc';
            p.textContent = desc;
            div.appendChild(p);
          }

          section.appendChild(div);
        });

        // If this is a category that shows description (like dips), show it
        if (cat.description && catItems.length === 0) {
          var descP = document.createElement('p');
          descP.className = 'item-desc';
          descP.textContent = cat.description;
          section.appendChild(descP);
        }

        // Insert flavors after wings-and-tenders
        if (col.hasFlavors && slug === 'wings-and-tenders' && flavors.length) {
          var h3 = document.createElement('h3');
          h3.className = 'blue-text';
          h3.textContent = 'FLAVORS';
          section.appendChild(h3);

          var flavorP = document.createElement('p');
          flavorP.className = 'flavor-list';

          flavors.forEach(function (f, fIdx) {
            if (fIdx > 0) {
              flavorP.appendChild(document.createTextNode(', '));
            }
            if (f.isWarning) {
              var span = document.createElement('span');
              span.className = 'warning-text';
              span.textContent = f.name;
              flavorP.appendChild(span);
            } else {
              flavorP.appendChild(document.createTextNode(f.name));
            }
          });

          section.appendChild(flavorP);
        }
      });

      grid.appendChild(section);
    });
  }

  /**
   * Build size text like "Sizes: x6, x12, x24"
   */
  function buildSizeText(item) {
    if (!item.sizes || !item.sizes.length) return '';
    var labels = item.sizes.map(function (s) {
      if (s.price != null) return s.label + ' ($' + Number(s.price).toFixed(2) + ')';
      return s.label;
    });
    return 'Sizes: ' + labels.join(', ') + '.';
  }

  /**
   * Build base price text like "$9.99"
   */
  function buildPriceText(item) {
    if (item.price == null) return '';
    return '$' + Number(item.price).toFixed(2);
  }

  // ================================================================
  // NAVIGATION — back link
  // ================================================================
  function hydrateNavigation(nav) {
    var backLink = document.querySelector('[data-cms="back-link"]');
    if (backLink) {
      if (nav.backLinkText) backLink.textContent = nav.backLinkText;
      if (nav.backLinkUrl) backLink.href = nav.backLinkUrl;
    }
  }

  // ================================================================
  // FOOTER — branding
  // ================================================================
  function hydrateFooter(footer) {
    var logoEl = document.querySelector('[data-cms="footer-logo"]');
    if (logoEl && footer.parentBrandLogo) {
      logoEl.src = footer.parentBrandLogo;
    }

    var textEl = document.querySelector('[data-cms="footer-text"]');
    if (textEl && footer.text && footer.parentBrandName) {
      textEl.innerHTML = footer.text + ' <strong>' + escapeHtml(footer.parentBrandName) + '</strong>';
    }
  }

  /**
   * Minimal HTML escaping for dynamic text.
   */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
