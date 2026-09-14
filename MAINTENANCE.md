# CleanTrend maintenance

Canonical public site: https://royhei-cpu.github.io/cleantrend-opportunity-hub/

The source folder now builds the active page. Do not roll back to the older 636-product Sites copy. `source/catalog.json` is the authoritative normalized catalog (1,900 products at migration). `catalog-app.js` preserves existing filtering, pack comparison and checkout behavior from the audited release. Update catalog.json for product and retailer-offer changes.

Build: `cd source && npm ci && npm test && npm run build`. This creates root index.html and content-hashed assets/*.js and *.css. Publish the complete changed files together on main. Existing exact-product image folders remain in place. Do not overwrite other applications or reduce the catalog. Keep the source package lock.

Daily research is scheduled in ChatGPT around 08:00 Asia/Shanghai under Daily CleanTrend Catalog Refresh. This is a research-and-publish task, not a built-in comprehensive retailer feed. Report failed or incomplete runs. Never claim full assortment without catalog reconciliation.

For each refresh:

1. Read source/refresh.json, source/catalog.json and research/run-history.json. Preserve source URLs and observation history. Use current original retailer/brand pages and verified public social evidence; access errors are not evidence of no change.
2. Reassess every highlighted viral product. A `trendEvidence` record needs `qualified:true`, `sourceUrl`, `summary`, `observedAt` and `periodEnd`. Qualification requires recent, product-specific viral momentum evidence; cumulative sales, a timeless viral article or a fresh page fetch alone is insufficient. Both dates must be within seven days. The UI expires old flags automatically and retains historical products.
3. Keep a per-retailer/category ledger under research/coverage.json for all categories and listed retailers: attemptedAt, lastSuccessfulCheck, checkedCount, knownCatalogTotal (null if unknown), outstanding work and access failures. Do not mark a retailer complete without its denominator and reconciliation. Prioritize missing coverage and oldest checks.
4. Update exact offers in `availability` along with source/evidence dates and pack conditions. Update root product price/rating fields only for the corresponding primary offer. Add deduplicated listings and exact-product photos. Do not manufacture missing values.
5. `targetAssessment` may contain `status:'potential-gap'`, `reason`, `nextStep`, `reviewedBy`, `checkedAt` and `sourceUrls` only after an actual Target assortment review. Gap findings expire after 30 days. Document exact comparisons, seller/Target Plus status and search limitations. Missing directory products alone cannot confirm whitespace.
6. `demandEvidence` contains a sourceUrl, summary and checkedAt for actual recent demand evidence. `feasibility` contains reviewedBy, sourceUrl, checkedAt and approved:true only after a real supplier/sample/cost review. Never populate these to inflate readiness.
7. Record actual refresh attempts and changes in research/run-history.json and source/refresh.json. Leave lastSuccessfulCatalogRefresh null until a genuine catalog refresh succeeds. Partial refreshes must explicitly name scope; do not give every item today's date. Run tests/build, check desktop/mobile catalog, six-product comparisons and images, commit changes together and verify GitHub Pages deployed the commit.

The current four checks represent evidence readiness, not a subjective product-quality score. Preserve plain-language item decisions and category-specific comparison actions. Existing numeric scores are historical only and must not be restored as validated recommendations.
