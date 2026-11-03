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

const REGION_BY_COUNTRY = {
  'United States':'North America',Canada:'North America',Mexico:'North America',
  'United Kingdom':'Europe',France:'Europe',Germany:'Europe',Poland:'Europe',Spain:'Europe',Netherlands:'Europe',
  China:'Asia',Japan:'Asia','South Korea':'Asia',India:'Asia',Singapore:'Asia',Malaysia:'Asia',
  'United Arab Emirates':'Middle East',Chile:'South America',Brazil:'South America',
  'South Africa':'Africa',Australia:'Oceania',
};
export function countriesFor(market='') {
  return [...new Set(String(market).split(/\s*\/\s*/).map(name=>({US:'United States',Korea:'South Korea'})[name]||name).filter(name=>name&&name!=='Global'))];
}

// Index every recorded offer while retaining the original product identity for
// comparisons, evidence decisions and saved records. No catalog data is changed.
export function buildRetailListings(catalog) {
  const rows=[], seen=new Set();
  for(const product of catalog) {
    for(const offer of product.availability?.length?product.availability:[product]) {
      const retailer=offer.retailer||product.retailer||'Retailer not recorded';
      const market=offer.market||product.market||'Market not recorded';
      const link=offer.link||product.link||'';
      const listingKey=JSON.stringify([product.id,retailer,market,link]);
      if(seen.has(listingKey))continue;
      seen.add(listingKey);
      const countries=countriesFor(market);
      const regions=[...new Set(countries.map(name=>REGION_BY_COUNTRY[name]).filter(Boolean))];
      if(!regions.length&&product.region)regions.push(product.region);
      const isPrimary=retailer===product.retailer&&market===product.market&&link===product.link;
      const sourceDate=offer.evidence?.checkedAt||(isPrimary?(product.evidence?.checkedAt||product.sourceDiscoveredAt):null)||null;
      rows.push({...product,product,listingKey,retailer,market,link,countries,regions,
        region:regions[0]||'Market not recorded',
        priceLabel:offer.priceLabel||(isPrimary?product.priceLabel:null)||'Price not recorded',
        referencePrice:offer.referencePrice||(isPrimary?product.referencePrice:undefined),
        packLabel:product.packLabel||product.pack?.detail||'Pack details at source',
        sourceScope:product.sourceScope||offer.evidence?.method||product.evidence?.method||'Recorded source',
        sourceDate,
        sourceDateKind:!offer.evidence?.checkedAt&&isPrimary&&!product.evidence?.checkedAt&&product.sourceDiscoveredAt?'Discovered':'Recorded',
      });
    }
  }
  return rows;
}

export function retailDirectory(rows) {
  const groups=new Map();
  for(const row of rows) {
    let group=groups.get(row.retailer);
    if(!group){group={name:row.retailer,count:0,markets:new Set()};groups.set(row.retailer,group);}
    group.count++;for(const country of row.countries||countriesFor(row.market))group.markets.add(country);
  }
  return [...groups.values()].map(g=>({...g,markets:[...g.markets].sort()})).sort((a,b)=>a.name.localeCompare(b.name));
}

export function filterGlobalProducts(products, { region = 'All regions', country = 'All countries', retailer = 'All retailers', query = '' } = {}) {
  const tokens = query.normalize('NFKD').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return products.filter(p => (region === 'All regions' || (p.regions||[p.region]).includes(region))
    && (country === 'All countries' || (p.countries||countriesFor(p.market)).includes(country))
    && (retailer === 'All retailers' || p.retailer === retailer)
    && tokens.every(token => `${p.name||''} ${p.brand||''} ${p.category||''} ${p.market||''} ${p.retailer||''} ${p.description||''} ${(p.tags||[]).join(' ')} ${(p.countries||countriesFor(p.market)).includes('China')?'中国 中国大陆 mainland China':''}`.normalize('NFKD').toLocaleLowerCase().includes(token)));
}

export function csvCell(value) {
  // Prevent spreadsheet formulas from executing when a saved brief is opened.
  const text = String(value ?? '');
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
