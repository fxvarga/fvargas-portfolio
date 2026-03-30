// Site registry — maps domains and slugs to portfolio IDs
// Well-known portfolio IDs from ContentMigrationContext.cs

const PORTFOLIOS = {
  fernando: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Fernando Vargas',
    domains: ['fernando-vargas.com', 'blog.fernando-vargas.com'],
  },
  jessica: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Jessica Sutherland',
    domains: ['jessicasutherland.me'],
  },
  busybee: {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Busy Bee Web',
    domains: ['thebusybeeweb.com'],
  },
  '1stopwings': {
    id: '44444444-4444-4444-4444-444444444444',
    name: '1 Stop Wings',
    domains: ['1stopwings.executivecateringct.com'],
  },
  executivecatering: {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Executive Catering',
    domains: ['executivecateringct.fernando-vargas.com'],
  },
  opsblueprint: {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'OpsBlueprint',
    domains: ['opsblueprint.fernando-vargas.com'],
  },
};

// Build a reverse lookup: domain -> portfolio slug
const domainMap = new Map();
for (const [slug, portfolio] of Object.entries(PORTFOLIOS)) {
  for (const domain of portfolio.domains) {
    domainMap.set(domain.toLowerCase(), slug);
  }
}

/**
 * Resolve a full URL to { portfolioId, portfolioName, route }
 * @param {string} url - Full URL like "https://fernando-vargas.com/about"
 * @returns {{ portfolioId: string, portfolioName: string, route: string } | null}
 */
export function resolveFromUrl(url) {
  try {
    // Allow URLs without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const slug = domainMap.get(hostname);
    if (!slug) return null;

    const portfolio = PORTFOLIOS[slug];
    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      route: parsed.pathname || '/',
    };
  } catch {
    return null;
  }
}

/**
 * Resolve from a site slug (from dropdown) + optional page path
 * @param {string} slug - Site slug like "fernando", "jessica"
 * @param {string} [page="/"] - Page path like "/about"
 * @returns {{ portfolioId: string, portfolioName: string, route: string } | null}
 */
export function resolveFromSlug(slug, page = '/') {
  const portfolio = PORTFOLIOS[slug.toLowerCase()];
  if (!portfolio) return null;

  return {
    portfolioId: portfolio.id,
    portfolioName: portfolio.name,
    route: page.startsWith('/') ? page : `/${page}`,
  };
}

/**
 * Get all site choices for slash command dropdown
 * @returns {Array<{ name: string, value: string }>}
 */
export function getSiteChoices() {
  return Object.entries(PORTFOLIOS).map(([slug, portfolio]) => ({
    name: portfolio.name,
    value: slug,
  }));
}

export default PORTFOLIOS;
