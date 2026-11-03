export function unitEconomics(price, uses) {
  if (!Number.isFinite(price) || !Number.isFinite(uses) || price < 0 || uses <= 0) return null;
  return price / uses;
}

export function coverageSummary(catalog) {
  const countries = new Set();
  const retailers = new Set();
  for (const product of catalog) {
    for (const offer of product.availability?.length ? product.availability : [product]) {
      if (offer.retailer) retailers.add(offer.retailer);
      for (let country of (offer.market || product.market || '').split(' / ')) {
        country = ({ US: 'United States', Korea: 'South Korea' })[country] || country;
        if (country && country !== 'Global') countries.add(country);
      }
    }
  }
  return { records: catalog.length, countries: countries.size, retailers: retailers.size };
}

export function filterGlobalProducts(products, { region = 'All regions', retailer = 'All retailers', query = '' } = {}) {
  const tokens = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return products.filter(p => (region === 'All regions' || p.region === region)
    && (retailer === 'All retailers' || p.retailer === retailer)
    && tokens.every(token => `${p.name} ${p.brand} ${p.category} ${p.market} ${p.retailer} ${p.description}`.toLocaleLowerCase().includes(token)));
}

export function csvCell(value) {
  // Prevent spreadsheet formulas from executing when a saved brief is opened.
  const text = String(value ?? '');
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
