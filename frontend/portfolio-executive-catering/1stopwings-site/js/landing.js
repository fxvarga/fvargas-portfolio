/**
 * Landing Page CMS Hydration — 1 Stop Wings (index.html)
 *
 * Fetches hero and ordering-platform content from the CMS,
 * then enhances the hardcoded HTML. If the CMS is unreachable,
 * the original HTML remains untouched.
 *
 * Depends on: cms-client.js (window.CmsClient)
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.CmsClient) {
      console.warn('[Landing] CmsClient not loaded, skipping CMS hydration.');
      return;
    }

    // Fetch singletons + ordering platforms in parallel
    Promise.all([
      CmsClient.fetchContentSingle('hero'),
      CmsClient.fetchContent('ordering-platform')
    ]).then(function (results) {
      var heroRecord = results[0];
      var platforms = results[1];

      if (heroRecord) hydrateHero(heroRecord.data);
      if (platforms && platforms.length) hydrateOrderingPlatforms(platforms);
    });
  });

  /**
   * Update hero section from CMS data.
   */
  function hydrateHero(hero) {
    if (!hero) return;

    var img = document.querySelector('[data-cms="hero-image"]');
    if (img && hero.image) {
      img.src = hero.image;
      if (hero.imageAlt) img.alt = hero.imageAlt;
    }
  }

  /**
   * Rebuild the ordering button stack from CMS data.
   * Sorted by displayOrder, filtered by isActive.
   */
  function hydrateOrderingPlatforms(records) {
    var list = document.querySelector('[data-cms="ordering-platforms"]');
    if (!list) return;

    // Extract data, sort, filter
    var platforms = records
      .map(function (r) { return r.data; })
      .filter(function (p) { return p.isActive !== false; })
      .sort(function (a, b) { return (a.displayOrder || 0) - (b.displayOrder || 0); });

    if (!platforms.length) return;

    // Clear existing list items and rebuild
    list.innerHTML = '';

    platforms.forEach(function (p) {
      var li = document.createElement('li');
      var a = document.createElement('a');

      a.href = p.url || '#';
      a.textContent = p.name || '';
      a.className = 'btn' + (p.cssClass ? ' ' + p.cssClass : '');

      if (p.opensNewTab) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      li.appendChild(a);
      list.appendChild(li);
    });
  }
})();
