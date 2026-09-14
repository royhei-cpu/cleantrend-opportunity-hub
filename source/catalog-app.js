import catalogData from "./catalog.json" with { type: "json" };
import {
  AssessmentGuide,
  ItemDecision,
  ComparisonDirection,
  RefreshNotice,
  SignalTabs,
  CardDecision,
  CheckoutRecords,
  ViralHistory,
} from "./decision-ui.jsx";
import { isFreshViral, hasViralHistory, trendLabel, assess } from "./logic.js";
import { buildSearchText, matchesSearch } from "./search.js";
import { TargetRecommendations } from "./recommendations-ui.jsx";
import * as r from "react/jsx-runtime";
import * as i from "react";
let h = [
    {
      market: "South Korea",
      retailers: [
        { name: "Coupang", url: "https://www.coupang.com/" },
        { name: "Gmarket", url: "https://www.gmarket.co.kr/" },
        { name: "11Street", url: "https://www.11st.co.kr/" },
        { name: "Naver Shopping", url: "https://shopping.naver.com/" },
        { name: "SSG.com", url: "https://www.ssg.com/" },
      ],
    },
    {
      market: "China",
      retailers: [
        { name: "Taobao", url: "https://www.taobao.com/" },
        { name: "Tmall", url: "https://www.tmall.com/" },
        { name: "JD.com", url: "https://www.jd.com/" },
        { name: "Pinduoduo", url: "https://www.pinduoduo.com/" },
        { name: "Douyin Shop", url: "https://www.douyin.com/" },
      ],
    },
    {
      market: "Japan",
      retailers: [
        { name: "Amazon Japan", url: "https://www.amazon.co.jp/" },
        { name: "Rakuten Ichiba", url: "https://www.rakuten.co.jp/" },
        { name: "Yahoo! Shopping Japan", url: "https://shopping.yahoo.co.jp/" },
        { name: "LOHACO", url: "https://lohaco.yahoo.co.jp/" },
        { name: "Aeon", url: "https://shop.aeon.com/netsuper/" },
      ],
    },
    {
      market: "United Kingdom",
      retailers: [
        { name: "Tesco", url: "https://www.tesco.com/" },
        { name: "Amazon UK", url: "https://www.amazon.co.uk/" },
        { name: "Ocado", url: "https://www.ocado.com/" },
        { name: "Boots", url: "https://www.boots.com/" },
        { name: "B&Q", url: "https://www.diy.com/" },
      ],
    },
    {
      market: "Europe",
      retailers: [
        { name: "Amazon Germany", url: "https://www.amazon.de/" },
        { name: "Carrefour", url: "https://www.carrefour.fr/" },
        { name: "dm", url: "https://www.dm.de/" },
        { name: "Rossmann", url: "https://www.rossmann.de/" },
        { name: "Bol.com", url: "https://www.bol.com/" },
      ],
    },
    {
      market: "Canada & Australia",
      retailers: [
        { name: "Amazon Canada", url: "https://www.amazon.ca/" },
        { name: "Canadian Tire", url: "https://www.canadiantire.ca/" },
        { name: "Walmart Canada", url: "https://www.walmart.ca/" },
        { name: "Woolworths", url: "https://www.woolworths.com.au/" },
        { name: "Coles", url: "https://www.coles.com.au/" },
      ],
    },
  ],
  T = (e) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: e.currency,
      maximumFractionDigits: 2,
    }).format(e.amount);
function A({ items: e, assetUrl: a }) {
  let t,
    i,
    n,
    s,
    o,
    l,
    c,
    d,
    p,
    m,
    g =
      ((i = [
        ...new Set(
          (t = e.map((e) => {
            let a = ((e) => {
                let a = e.priceLabel.trim();
                if (
                  /\d\s*[–—-]\s*(?:[$£€¥₩]\s*)?\d|from|approx|~|estimate/i.test(
                    a,
                  )
                )
                  return null;
                let t = a.match(
                  /^(US\$|CA\$|C\$|AU\$|A\$|\$|£|€|¥|￥|₩)\s*([0-9]+(?:[.,][0-9]+)*)/,
                );
                if (!t) return null;
                let r =
                    {
                      US$: "USD",
                      CA$: "CAD",
                      C$: "CAD",
                      AU$: "AUD",
                      A$: "AUD",
                      "\xa3": "GBP",
                      "€": "EUR",
                      "₩": "KRW",
                    }[t[1]] ??
                    ("$" === t[1]
                      ? /United States/i.test(e.market)
                        ? "USD"
                        : /Canada/i.test(e.market)
                          ? "CAD"
                          : /Australia/i.test(e.market)
                            ? "AUD"
                            : null
                      : /Japan/i.test(e.market)
                        ? "JPY"
                        : /China/i.test(e.market)
                          ? "CNY"
                          : null),
                  i = "EUR" === r && /,\d{1,2}$/.test(t[2]);
                if (
                  !i &&
                  !/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(t[2])
                )
                  return null;
                let n = Number(
                  i
                    ? t[2].replace(/\./g, "").replace(",", ".")
                    : t[2].replace(/,/g, ""),
                );
                return r && n > 0 ? { amount: n, currency: r } : null;
              })(e.listing),
              t = ((e) => {
                let a = e.name;
                if (
                  /\b(?:pack of|[2-9]\d*\s*[- ]?pack|[2-9]\d*\s*x\b|bundle|kit|starter|\+|with\s+\d)|refill.{0,16}\b\d+\b/i.test(
                    a,
                  )
                )
                  return null;
                let t = [
                  ...a.matchAll(
                    /(\d+(?:\.\d+)?)\s*(fl\.?\s*oz\.?|ml\b|mL\b|lit(?:er|re)s?\b|L\b)/gi,
                  ),
                ];
                if (1 === t.length) {
                  let [, a, r] = t[0];
                  return /fl/i.test(r) && !/United States/.test(e.market)
                    ? null
                    : {
                        quantity:
                          (Number(a) *
                            (/fl/i.test(r)
                              ? 29.5735295625
                              : /^ml$/i.test(r)
                                ? 1
                                : 1e3)) /
                          100,
                        unit: "100 mL",
                        detail: t[0][0],
                      };
                }
                if (t.length > 1) return null;
                let r = [
                  ...a.matchAll(/(\d+(?:\.\d+)?)\s*(kg\b|grams?\b|g\b)/gi),
                ];
                if (1 === r.length)
                  return {
                    quantity:
                      Number(r[0][1]) * (/^kg$/i.test(r[0][2]) ? 10 : 0.01),
                    unit: "100 g",
                    detail: r[0][0],
                  };
                if (r.length > 1) return null;
                let i = [
                  ...a.matchAll(
                    /(\d+)\s*(?:count\b|ct\b|sheets\b|wipes\b|tablets\b|pods\b|bags\b)/gi,
                  ),
                ];
                return 1 === i.length && Number(i[0][1]) > 0
                  ? { quantity: Number(i[0][1]), unit: "each", detail: i[0][0] }
                  : null;
              })(e.product),
              r =
                a && t && t.quantity > 0
                  ? { amount: a.amount / t.quantity, currency: a.currency }
                  : null;
            return { ...e, price: a, pack: t, unitPrice: r };
          })).flatMap((e) => (e.price ? [e.price.currency] : [])),
        ),
      ]),
      (n = 1 === new Set(e.map((e) => e.product.category)).size),
      (s = t.every((e) => e.price)),
      (l = [...(o = t.filter((e) => e.price))].sort(
        (e, a) => e.price.amount - a.price.amount,
      )[0]),
      (c = [...o].sort((e, a) => a.price.amount - e.price.amount)[0]),
      (d =
        "The selected products do not all have a usable observed price. Open their retailer sources before making a cost comparison."),
      i.length > 1
        ? (d = `Prices span ${i.join(", ")}. No cross-currency winner is assigned: exchange rates, tax, shipping and import costs are not included.`)
        : s &&
          l &&
          c &&
          (d = `${l.product.brand} ${l.product.name} has the lowest package price, ${T(l.price)}. The selected package-price range is ${T(l.price)}–${T(c.price)}. ${n ? "Pack size, concentration and included accessories can change the value conclusion." : "These products serve different categories, so the cheapest package is not an overall value winner."}`),
      (m = [
        ...(p = t.filter((e) => e.product.rating && e.product.reviews)),
      ].sort((e, a) => a.product.reviews - e.product.reviews)[0]),
      {
        entries: t,
        pricing: d,
        quality: m
          ? `${p.length} of ${e.length} products have a recorded rating and review count. ${m.product.brand} ${m.product.name} has the largest recorded review base (${m.product.reviews.toLocaleString("en-US")}). That gives more feedback to investigate—not proof that it is the highest-quality product.`
          : "No selected product has enough recorded review data for a customer-satisfaction comparison. No lab-test, durability or defect-rate evidence is stored, so no quality winner is assigned.",
        comparability: n
          ? "Same category does not mean equivalent performance. Check formula or material, dilution, pack size, included parts and intended surfaces before choosing a benchmark."
          : "Mixed categories selected. Use this comparison to understand different use cases, not to rank unlike products as direct substitutes.",
      });
  return (0, r.jsxs)(r.Fragment, {
    children: [
      (0, r.jsxs)("section", {
        className: "comparison-analysis",
        "aria-label": "Pricing and quality analysis",
        children: [
          (0, r.jsxs)("div", {
            children: [
              (0, r.jsx)("h3", { children: "Pricing analysis" }),
              (0, r.jsx)("p", { children: g.pricing }),
            ],
          }),
          (0, r.jsxs)("div", {
            children: [
              (0, r.jsx)("h3", { children: "Quality evidence" }),
              (0, r.jsx)("p", { children: g.quality }),
            ],
          }),
          (0, r.jsxs)("div", {
            children: [
              (0, r.jsx)("h3", { children: "Merchant decision" }),
              (0, r.jsx)("p", { children: g.comparability }),
              (0, r.jsx)("p", {
                children:
                  "Use price and customer feedback to shortlist; validate samples, claims and supplier economics before a buy decision.",
              }),
            ],
          }),
        ],
      }),
      (0, r.jsx)("p", {
        className: "comparison-evidence-note",
        children:
          "Analytical read from the recorded catalog snapshot—not a lab-tested quality ranking. Review evidence belongs to the source shown below and may differ from the selected retailer offer. Opportunity scores are not quality scores.",
      }),
      (0, r.jsxs)("div", {
        className: "comparison-table",
        style: {
          gridTemplateColumns: `130px repeat(${e.length}, minmax(260px, 1fr))`,
        },
        children: [
          (0, r.jsx)("div", {
            className: "compare-label",
            children: "Product",
          }),
          g.entries.map(({ product: e }) =>
            (0, r.jsxs)(
              "div",
              {
                className: "compare-product",
                children: [
                  (0, r.jsx)("img", {
                    src: a(e.image),
                    alt: `${e.brand} ${e.name}`,
                  }),
                  (0, r.jsx)("span", { children: e.brand }),
                  (0, r.jsx)("strong", { children: e.name }),
                  (0, r.jsx)("small", { children: e.category }),
                ],
              },
              `${e.id}-name`,
            ),
          ),
          (0, r.jsx)("div", {
            className: "compare-label",
            children: "Observed price",
          }),
          g.entries.map(({ product: e, listing: a }) =>
            (0, r.jsxs)(
              "div",
              {
                children: [
                  (0, r.jsx)("strong", { children: a.priceLabel }),
                  (0, r.jsxs)("small", {
                    children: [a.retailer, " \xb7 ", a.market],
                  }),
                  (0, r.jsx)("p", { children: a.priceNote }),
                  (0, r.jsx)("a", {
                    href: a.link,
                    target: "_blank",
                    rel: "noreferrer",
                    children: "Check price and pack ↗",
                  }),
                  (0, r.jsx)("p", {
                    children: a.evidence
                      ? `Source checked ${a.evidence.checkedAt}.`
                      : "Offer check date not recorded; reconfirm before selection.",
                  }),
                ],
              },
              `${e.id}-price`,
            ),
          ),
          (0, r.jsx)("div", {
            className: "compare-label",
            children: "Unit-price analysis",
          }),
          g.entries.map((e) =>
            (0, r.jsx)(
              "div",
              {
                children: (0, r.jsx)("p", {
                  children: ((e, a) => {
                    if (!e.price)
                      return "Unit cost is not calculated: a usable observed price is missing. Confirm the current price and selected pack at the retailer source.";
                    if (!e.unitPrice || !e.pack)
                      return "Unit cost is not calculated: the name does not establish one unambiguous total pack size. Confirm the pack and quantity at the source.";
                    let t = a.filter(
                        (a) =>
                          a.unitPrice?.currency === e.unitPrice.currency &&
                          a.pack?.unit === e.pack.unit &&
                          a.product.category === e.product.category,
                      ),
                      r = Math.min(...t.map((e) => e.unitPrice.amount)),
                      i = (e.unitPrice.amount / r - 1) * 100,
                      n =
                        t.length < 2
                          ? "No other selected item has a comparable category, currency and size basis."
                          : i < 0.05
                            ? "Lowest calculated unit price in this comparable group."
                            : `${i.toFixed(1)}% above the lowest calculated unit price in this comparable group.`;
                    return `${T(e.unitPrice)} per ${e.pack.unit}, using ${e.pack.detail} from the product name. ${n} Not adjusted for dilution, cleaning efficacy, shipping or tax; confirm package quantity before commitment.`;
                  })(e, g.entries),
                }),
              },
              `${e.product.id}-unit`,
            ),
          ),
          (0, r.jsx)("div", {
            className: "compare-label",
            children: "Quality evidence",
          }),
          g.entries.map(({ product: e }) => {
            let a =
              e.rating && e.reviews
                ? {
                    title:
                      e.reviews >= 1e3
                        ? "Broad review base"
                        : e.reviews >= 100
                          ? "Moderate review base"
                          : "Small review sample",
                    detail: `${e.rating.toFixed(1)}/5 from ${e.reviews.toLocaleString("en-US")} ratings recorded at ${e.retailer}. This measures reported satisfaction, not verified cleaning performance or durability. Counts can include variants or incentivized reviews.`,
                  }
                : {
                    title: "Insufficient review evidence",
                    detail:
                      "A rating with a usable review count is not recorded. Product quality cannot be ranked from the current evidence.",
                  };
            return (0, r.jsxs)(
              "div",
              {
                children: [
                  (0, r.jsx)("strong", { children: a.title }),
                  (0, r.jsx)("p", { children: a.detail }),
                  (0, r.jsxs)("a", {
                    href: e.link,
                    target: "_blank",
                    rel: "noreferrer",
                    children: ["Review source \xb7 ", e.retailer, " ↗"],
                  }),
                ],
              },
              `${e.id}-quality`,
            );
          }),
          (0, r.jsx)("div", {
            className: "compare-label",
            children: "Guest feedback",
          }),
          g.entries.map(({ product: e }) =>
            (0, r.jsx)(
              "div",
              {
                children: e.guestVoice
                  ? (0, r.jsxs)(r.Fragment, {
                      children: [
                        (0, r.jsx)("strong", {
                          children: "Stored review summary",
                        }),
                        (0, r.jsx)("p", { children: e.guestVoice.praise }),
                        (0, r.jsx)("strong", {
                          children: "Concerns to investigate",
                        }),
                        (0, r.jsx)("p", { children: e.guestVoice.friction }),
                        (0, r.jsxs)("small", {
                          children: [
                            e.guestVoice.source,
                            " Summary not independently rechecked in this comparison.",
                          ],
                        }),
                      ],
                    })
                  : (0, r.jsx)("p", {
                      children:
                        "No review-text themes are stored. Ratings alone cannot establish why guests like the product or which quality problems recur.",
                    }),
              },
              `${e.id}-feedback`,
            ),
          ),
          (0, r.jsx)("div", {
            className: "compare-label",
            children: "Features & use case",
          }),
          g.entries.map(({ product: e }) =>
            (0, r.jsxs)(
              "div",
              {
                children: [
                  (0, r.jsx)("p", { children: e.description }),
                  (0, r.jsx)("small", {
                    children:
                      "Catalog description; validate manufacturer claims.",
                  }),
                ],
              },
              `${e.id}-features`,
            ),
          ),
          (0, r.jsx)("div", {
            className: "compare-label",
            children: "Risk & validation",
          }),
          g.entries.map(({ product: e }) =>
            (0, r.jsxs)(
              "div",
              {
                children: [
                  (0, r.jsx)("p", { children: e.watchout }),
                  (0, r.jsx)("p", {
                    className: "comparison-validation",
                    children:
                      "Before selection: sample cleaning performance, material compatibility, durability, safety/claims and cost per use. No measured quality-test results are stored.",
                  }),
                ],
              },
              `${e.id}-risk`,
            ),
          ),
        ],
      }),
    ],
  });
}
let D = [
    "Laundry Care",
    "Dish Care",
    "Surface Cleaners",
    "Disinfecting Sprays",
    "Bathroom Care",
    "Toilet Brushes & Plungers",
    "Glass Care",
    "Floor Care",
    "Manual Tools",
    "Brooms & Dustpans",
    "Dusting",
    "Squeegees",
    "Sponges",
    "Wipes",
    "Cleaning Accessories",
    "Powered Tools",
    "Cleaning Appliances",
    "Appliance Care",
    "Pet Cleaning",
    "Odor Control",
    "Refill Systems",
    "Specialty Cleaners",
    "Auto Care",
    "Outdoor Cleaning Tools",
    "Drain & Septic Care",
    "Trash Bags & Waste",
    "Cleaning Gloves",
  ],
  H = (e) => ({
    retailer: e.retailer,
    channel: e.channel,
    market: e.market,
    priceLabel: e.priceLabel,
    priceUsd: e.priceUsd,
    priceNote: e.priceNote,
    link: e.link,
    evidence: e.evidence,
  });
let $ = catalogData,
  V = (e) => (e.availability?.length ? e.availability : [H(e)]),
  I = (e) =>
    V(e).some((e) => "Target" === e.channel && "Target" === e.retailer),
  K = (e, a, t) =>
    V(e).find(
      (e) =>
        ("All" === a || e.channel === a) &&
        ("All retailers" === t || e.retailer === t),
    ) ?? V(e)[0],
  Q = [
    "All",
    "Target",
    "Walmart",
    "Amazon",
    "TikTok Shop",
    "Costco",
    "CVS",
    "Walgreens",
    "Home Depot",
    "Lowe's",
    "Global",
    "Professional / Sourcing",
  ],
  X = h.flatMap((e) => e.retailers.map((a) => ({ ...a, market: e.market }))),
  J = { Viral: 4, Accelerating: 3, Growing: 2, Established: 1 },
  Y = (e) => {
    let a = e.brand
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    return e.brandOwner
      ? e.brandOwner
      : ["up up", "everspring", "dealworthy", "room essentials"].includes(a)
        ? "Target"
        : ["great value", "equate", "mainstays"].includes(a)
          ? "Walmart"
          : ["amazon basics", "solimo", "presto"].includes(a)
            ? "Amazon"
            : ["kirkland signature", "kirkland"].includes(a)
              ? "Costco"
              : ["cvs health", "total home"].includes(a)
                ? "CVS"
                : ["complete home", "nice", "walgreens"].includes(a)
                  ? "Walgreens"
                  : "hdx" === a
                    ? "Home Depot"
                    : ["project source", "moxie", "lowe s essentials"].includes(
                          a,
                        )
                      ? "Lowe's"
                      : "denkmit" === a
                        ? "dm"
                        : "frank" === a
                          ? "Canadian Tire"
                          : [
                                "coastwide",
                                "coastwide professional",
                                "perk",
                                "staples",
                              ].includes(a)
                            ? "Staples"
                            : "highmark" === a
                              ? "Office Depot"
                              : "renown" === a
                                ? "HD Supply"
                                : "grove co" === a
                                  ? "Grove Collaborative"
                                  : null;
  },
  Z = (e) => e.brandType ?? (Y(e) ? "Private label" : "National brand"),
  ee = (() => {
    let e = {
        "Amazon Germany": "Germany",
        dm: "Germany",
        Rossmann: "Germany",
        Carrefour: "France",
        "Bol.com": "Netherlands",
        "Amazon Canada": "Canada",
        "Canadian Tire": "Canada",
        "Walmart Canada": "Canada",
        Woolworths: "Australia",
        Coles: "Australia",
      },
      a = new Map();
    for (let t of X)
      a.set(t.name, {
        ...t,
        market: e[t.name] ?? t.market,
        national: 0,
        privateLabel: 0,
        categories: new Set(),
        total: 0,
        dated: 0,
      });
    for (let e of $) {
      let t = new Set();
      for (let r of V(e)) {
        if (t.has(r.retailer)) continue;
        t.add(r.retailer);
        let i = a.get(r.retailer) ?? {
          name: r.retailer,
          market: r.market,
          url: new URL(r.link).origin,
          national: 0,
          privateLabel: 0,
          categories: new Set(),
          total: 0,
          dated: 0,
        };
        (i.total++,
          V(e).some(
            (e) => e.retailer === r.retailer && e.evidence?.checkedAt,
          ) && i.dated++,
          i["Private label" === Z(e) ? "privateLabel" : "national"]++,
          i.categories.add(e.category),
          a.set(r.retailer, i));
      }
    }
    return [...a.values()].sort((e, a) => e.name.localeCompare(a.name));
  })(),
  ea = [
    ["tablet", /\btablet|tabs\b/i],
    ["sheet", /\bsheet|tile\b/i],
    ["pod", /\bpod|pack\b/i],
    ["paste", /\bpaste\b/i],
    ["powder", /\bpowder\b/i],
    ["foam", /\bfoam|foaming\b/i],
    ["gel", /\bgel\b/i],
    ["spray", /\bspray\b/i],
    ["concentrate", /\bconcentrat/i],
    ["refill", /\brefill|replacement head/i],
    ["wipe", /\bwipe/i],
    ["sponge", /\bsponge/i],
    ["brush", /\bbrush|scrub brush/i],
    ["plunger", /\bplunger\b/i],
    ["mop", /\bmop\b/i],
    ["broom", /\bbroom|dustpan/i],
    ["duster", /\bdust|duster/i],
    ["squeegee", /\bsqueegee|window vacuum/i],
    ["steam", /\bsteam/i],
    ["powered", /\bpowered|electric|cordless|rechargeable/i],
    ["dispenser", /\bdispenser|wand/i],
    ["caddy", /\bcaddy|organizer|storage/i],
    ["glove", /\bglove/i],
    ["bag", /\bbag|liner/i],
  ],
  et = (e) => {
    let a = [e.name, e.description, e.category, ...e.tags].join(" ");
    return ea.filter(([, e]) => e.test(a)).map(([e]) => e);
  },
  er = $.filter(I),
  ei = (e) => {
    let a = ((e) => {
        if (I(e))
          return {
            qualifies: !1,
            type: "Target item captured",
            reason:
              "This product is already represented in the Target catalog captured in this directory, so it is a benchmark—not a whitespace test.",
          };
        let a = er.filter((a) => a.category === e.category);
        if (!a.length)
          return {
            qualifies: !0,
            type: "Target category gap",
            reason: `No Target product is captured in ${e.category}; verify the live Target assortment before advancing the test.`,
          };
        let t = et(e),
          r = a.filter((e) => et(e).some((e) => t.includes(e)));
        return t.length && !r.length
          ? {
              qualifies: !0,
              type: "Target format gap",
              reason: `Target products are captured in ${e.category}, but none uses this ${t.slice(0, 2).join(" + ")} format.`,
            }
          : t.length
            ? {
                qualifies: !1,
                type: "Target equivalent captured",
                reason: `${r.length} captured Target item${1 === r.length ? "" : "s"} already use${1 === r.length ? "s" : ""} a close ${t.slice(0, 2).join(" / ")} format.`,
              }
            : {
                qualifies: !0,
                type: "Target concept gap",
                reason: `Target products are captured in ${e.category}, but this product has no close core-format match in the directory. Confirm against live Target.com before testing.`,
              };
      })(e),
      t = {
        external: !I(e),
        nonviral: "Viral" !== e.trend,
        score: "Pending" !== e.assessmentStatus && e.score >= 78,
        gap: a.qualifies,
        demand:
          "Scout signal" !== e.signalType ||
          (e.reviews ?? 0) >= 25 ||
          ("High" === e.confidence && e.score >= 82),
      };
    return { eligible: Object.values(t).every(Boolean), gap: a, gates: t };
  },
  en = new Set(),
  es = new Set(["category"]),
  eo = new Set(["retailer"]),
  el = new Set(["brandType"]),
  searchIndex = new Map($.map((e) => [e.id, buildSearchText(e)])),
  ed = (e, a, t = en) => {
    var r;
    let i = a.query.trim().toLowerCase();
    return (
      ((!!t.has("channel") && !!t.has("retailer")) ||
        !!V(e).some(
          (e) =>
            (t.has("channel") ||
              "All" === a.channel ||
              e.channel === a.channel) &&
            (t.has("retailer") ||
              "All retailers" === a.retailer ||
              e.retailer === a.retailer),
        )) &&
      (!!t.has("signal") ||
        "all" === a.signal ||
        ("viral" === a.signal
          ? isFreshViral(e)
          : "history" === a.signal
            ? hasViralHistory(e)
            : "research" === a.signal
              ? assess(e, $).tone === "unknown"
              : assess(e, $).isWhitespace)) &&
      (!!t.has("category") ||
        "All categories" === a.category ||
        e.category === a.category) &&
      (t.has("score") ||
        a.score === "all" ||
        {
          90: assess(e, $).ready,
          78: assess(e, $).isWhitespace,
          70: assess(e, $).similar.length > 0,
          below: assess(e, $).status === "Target listing recorded",
          pending: assess(e, $).tone === "unknown",
        }[a.score]) &&
      (!!t.has("brandType") ||
        "all" === a.brandType ||
        Z(e) ===
          ("private-label" === a.brandType
            ? "Private label"
            : "National brand")) &&
      (!!t.has("query") || !i || matchesSearch(searchIndex.get(e.id) || "", i)) &&
      !0
    );
  },
  ep = (e) =>
    e
      ? e >= 1e6
        ? `${(e / 1e6).toFixed(1)}M`
        : e >= 1e3
          ? `${(e / 1e3).toFixed(e >= 1e4 ? 0 : 1)}K`
          : e.toLocaleString()
      : "—",
  em = (e) =>
    e.guestVoice ?? {
      praise:
        e.rating && e.reviews
          ? "A public rating and review-count signal is available, but a verified review-text theme has not been stored for this listing."
          : "No public guest-review theme is stored for this listing.",
      friction:
        "Open the retailer source and validate recurring negative themes before an item commitment.",
      source:
        "Evidence boundary: rating/count only; no review-text theme captured.",
    },
  eg = (e) =>
    "Pending" === e.assessmentStatus
      ? "Assessment pending. This retailer listing is available for comparison and selection. Its opportunity score and Priority Test status require a separate review of demand, differentiation, value, repeat potential and execution."
      : `Unvalidated legacy score: ${e.score}/100. Independent factor assessments and a product-level scoring rationale were not recorded. This number is not a measured quality rating, a proven Target gap, or a confirmed test recommendation. ${I(e) ? "A Target listing is recorded; reconfirm the exact current item at its source." : "A live Target assortment and meaningful-differentiation review are still needed."}`;
function eu({ score: e, pending: a = !1 }) {
  return a
    ? (0, r.jsx)("div", {
        className: "score-pending",
        title: "Opportunity assessment pending",
        "aria-label": "Opportunity assessment pending",
        children: "To assess",
      })
    : (0, r.jsxs)("div", {
        className: "score-ring legacy-score",
        title: `Unvalidated legacy score ${e}/100. Not a quality rating or confirmed recommendation.`,
        style: { "--score": `${3.6 * e}deg` },
        "aria-label": `Unvalidated legacy score ${e} out of 100`,
        children: [
          (0, r.jsx)("span", { children: e }),
          (0, r.jsx)("small", { children: "Legacy" }),
        ],
      });
}
let eh = () => ({
    targetRetailPrice: "",
    targetPmu: "",
    numberOfStores: "",
    potentialLaunchDate: "",
    comments: "",
  }),
  ef = (e) => (e.startsWith("/") ? `/cleantrend-opportunity-hub${e}` : e),
  eb = "cleantrend-checkout-records";
function ew() {
  let [e, a] = (0, i.useState)(""),
    [t, n] = (0, i.useState)("All"),
    [s, o] = (0, i.useState)("All categories"),
    [l, c] = (0, i.useState)("All retailers"),
    [d, p] = (0, i.useState)("all"),
    [m, g] = (0, i.useState)("all"),
    [u, f] = (0, i.useState)("recent"),
    [b, w] = (0, i.useState)([]),
    [y, v] = (0, i.useState)(!1),
    [S, k] = (0, i.useState)(null),
    [C, T] = (0, i.useState)(36),
    [R, U] = (0, i.useState)("priority"),
    [P, z] = (0, i.useState)(!1),
    [B, x] = (0, i.useState)([]),
    [L, N] = (0, i.useState)(""),
    [M, E] = (0, i.useState)({ merchantName: "", items: {} }),
    [G, j] = (0, i.useState)("All captured retailers"),
    [clock, setClock] = (0, i.useState)(0);
  (0, i.useEffect)(() => { const timer = window.setInterval(() => setClock(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  (0, i.useEffect)(() => { const params = new URLSearchParams(window.location.search); const query = params.get("q"); const view = params.get("view"); if(query)a(query); if(["priority","research","all","viral","history","recommendations"].includes(view))U(view); else if(query)U("all"); }, []);
  (0, i.useEffect)(() => {
    let e = window.setTimeout(() => {
      try {
        let e = window.localStorage.getItem(eb),
          a = e ? JSON.parse(e) : [],
          t = Array.isArray(a) ? a : [];
        x(t);
      } catch {
        x([]);
      }
    }, 0);
    return () => window.clearTimeout(e);
  }, []);
  let _ = (0, i.useMemo)(
      () => ({
        query: e,
        channel: t,
        category: s,
        retailer: l,
        score: d,
        brandType: m,
        signal: R,
      }),
      [e, t, s, l, d, m, R, clock],
    ),
    H = (0, i.useMemo)(
      () => Array.from(new Set($.map((e) => e.category))).sort(),
      [],
    ),
    F = (0, i.useMemo)(
      () =>
        $.filter((e) => ed(e, _, es)).reduce(
          (e, a) => ((e[a.category] = (e[a.category] ?? 0) + 1), e),
          {},
        ),
      [_],
    ),
    W = (0, i.useMemo)(() => $.filter((e) => ed(e, _, es)).length, [_]),
    q = (0, i.useMemo)(
      () =>
        $.filter((e) => ed(e, _, eo)).reduce(
          (e, a) => (
            new Set(
              V(a)
                .filter((e) => "All" === t || e.channel === t)
                .map((e) => e.retailer),
            ).forEach((a) => {
              e[a] = (e[a] ?? 0) + 1;
            }),
            e
          ),
          {},
        ),
      [_, t],
    ),
    O = (0, i.useMemo)(() => $.filter((e) => ed(e, _, eo)).length, [_]),
    ea = X.find((e) => e.name === l),
    et =
      "Global" === t &&
      !!ea &&
      !$.some((e) =>
        V(e).some((e) => "Global" === e.channel && e.retailer === l),
      ),
    er = (0, i.useMemo)(
      () => [
        "All retailers",
        ...Array.from(
          new Set([...Object.keys(q), ...("All retailers" !== l ? [l] : [])]),
        ).sort(),
      ],
      [q, l],
    ),
    en = (0, i.useMemo)(
      () =>
        Object.fromEntries(
          Q.map((e) => [
            e,
            $.filter((a) => ed(a, { ..._, channel: e }, eo)).length,
          ]),
        ),
      [_],
    ),
    ec = (0, i.useMemo)(
      () =>
        Object.fromEntries(
          ["all", "90", "78", "70", "below", "pending"].map((e) => [
            e,
            $.filter((a) => ed(a, { ..._, score: e })).length,
          ]),
        ),
      [_],
    ),
    ew = (0, i.useMemo)(
      () => ({
        all: $.filter((e) => ed(e, _, el)).length,
        national: $.filter((e) =>
          ed(e, { ..._, brandType: "national" }, el),
        ).filter((e) => "National brand" === Z(e)).length,
        privateLabel: $.filter((e) =>
          ed(e, { ..._, brandType: "private-label" }, el),
        ).filter((e) => "Private label" === Z(e)).length,
      }),
      [_],
    ),
    ey = (0, i.useMemo)(
      () =>
        Array.from(
          new Set([
            ...X.map((e) => e.name),
            ...$.flatMap((e) =>
              V(e)
                .filter((e) => "Global" === e.channel)
                .map((e) => e.retailer),
            ),
          ]),
        ).sort(),
      [],
    ),
    ev = ["All captured retailers", ...ee.map((e) => e.name)],
    eS = (0, i.useMemo)(
      () =>
        "All captured retailers" === G
          ? $
          : $.filter((e) => V(e).some((e) => e.retailer === G)),
      [G],
    ),
    ek = (0, i.useMemo)(
      () =>
        Object.fromEntries(
          D.map((e) => [e, eS.filter((a) => a.category === e).length]),
        ),
      [eS],
    ),
    eC = (0, i.useMemo)(
      () => ({
        national: eS.filter((e) => "National brand" === Z(e)).length,
        privateLabel: eS.filter((e) => "Private label" === Z(e)).length,
      }),
      [eS],
    ),
    eT = D.filter((e) => ek[e] > 0).length,
    eA = D.length - eT,
    eR = $.filter((e) => V(e).some((e) => "Global" === e.channel)),
    eU = $.flatMap((e) => V(e).filter((e) => "Global" === e.channel)),
    eD = new Set(eU.map((e) => e.market)).size,
    eP = new Set(eU.map((e) => e.retailer)).size,
    ez = $.reduce((e, a) => e + new Set(V(a).map((e) => e.retailer)).size, 0),
    eB = $.filter((e) => "Private label" === Z(e)).length,
    ex = $.length - eB,
    eL = (0, i.useMemo)(
      () =>
        $.filter((e) => ed(e, _)).sort((e, a) =>
          "trend" === u
            ? J[a.trend] - J[e.trend] || a.score - e.score
            : "reviews" === u
              ? (a.reviews ?? 0) - (e.reviews ?? 0)
              : "price-low" === u
                ? (K(e, t, l).priceUsd || 1 / 0) -
                  (K(a, t, l).priceUsd || 1 / 0)
                : "recent" === u
                  ? (a.evidence?.checkedAt ?? "").localeCompare(
                      e.evidence?.checkedAt ?? "",
                    ) || e.brand.localeCompare(a.brand)
                  : assess(a, $).checked - assess(e, $).checked ||
                    e.name.localeCompare(a.name),
        ),
      [_, u, t, l],
    ),
    eN = $.filter((e) => b.includes(e.id)),
    eM = S ? K(S, t, l) : null,
    eE = eL.slice(0, C),
    eG = $.filter((e) => assess(e, $).isWhitespace).length,
    ej = $.filter((e) => isFreshViral(e)).length,
    e_ = () => {
      (a(""),
        n("All"),
        o("All categories"),
        c("All retailers"),
        p("all"),
        g("all"),
        f("recent"),
        T(36),
        U("all"));
    },
    searchMatches = $.filter((product) => e.trim() && matchesSearch(searchIndex.get(product.id) || "", e)),
    showSearchMatches = () => { n("All"); o("All categories"); c("All retailers"); p("all"); g("all"); U("all"); T(36); },
    eH = (e) => {
      (U(e),
        n("All"),
        o("All categories"),
        c("All retailers"),
        p("all"),
        g("all"),
        f("recent"),
        T(36),
        document
          .getElementById("directory")
          ?.scrollIntoView({ behavior: "smooth" }));
    },
    eF = (e) => {
      (a(""),
        n("Global"),
        c(e),
        o("All categories"),
        p("all"),
        g("all"),
        f("recent"),
        U("all"),
        T(36),
        document
          .getElementById("directory")
          ?.scrollIntoView({ behavior: "smooth" }));
    },
    eW = (e, t) => {
      (a(""),
        n("All"),
        c(e),
        o("All categories"),
        p("all"),
        g(t),
        f("recent"),
        U("all"),
        T(36),
        document
          .getElementById("directory")
          ?.scrollIntoView({ behavior: "smooth" }));
    },
    eq = (e, a, t) => {
      E((r) => ({
        ...r,
        items: { ...r.items, [e]: { ...(r.items[e] ?? eh()), [a]: t } },
      }));
    },
    eO = async (e) => {
      (e.preventDefault(), N("Saving selection…"));
      let a = eN.map((e) => ({
          productId: e.id,
          productName: `${e.brand} — ${e.name}`,
          image: e.image,
          ...(M.items[e.id] ?? eh()),
        })),
        t = {
          ...{
            merchantName: M.merchantName,
            productIds: eN.map((e) => e.id),
            productNames: a.map((e) => e.productName),
            items: a,
          },
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
      try {
        const records = [t, ...B];
        window.localStorage.setItem(eb, JSON.stringify(records));
        x(records);
      } catch { N("Could not save this record. Browser storage is unavailable."); return; }
      N("Saved in this browser. You can delete the record from Checkout records.");
    };
  return (0, r.jsxs)("main", {
    children: [
      (0, r.jsxs)("header", {
        className: "topbar",
        children: [
          (0, r.jsxs)("a", {
            className: "brand",
            href: "#top",
            "aria-label": "CleanTrend Opportunity Hub home",
            children: [
              (0, r.jsx)("span", {
                className: "brand-mark",
                "aria-hidden": "true",
                children: "CT",
              }),
              (0, r.jsxs)("span", {
                children: [
                  (0, r.jsx)("strong", { children: "CleanTrend" }),
                  (0, r.jsx)("small", { children: "Opportunity Hub" }),
                ],
              }),
            ],
          }),
          (0, r.jsxs)("div", {
            className: "topbar-actions",
            children: [
              (0, r.jsxs)("span", {
                className: "freshness",
                children: [
                  (0, r.jsx)("i", {}),
                  " Partial update · Sep 14, 2026",
                ],
              }),
              (0, r.jsxs)("button", {
                className: "compare-top",
                onClick: () => v(!0),
                disabled: b.length < 2,
                children: [
                  "Compare ",
                  (0, r.jsxs)("span", { children: [b.length, "/6"] }),
                ],
              }),
            ],
          }),
        ],
      }),
      (0, r.jsxs)("div", {
        className: "page-shell",
        id: "top",
        children: [
          (0, r.jsxs)("section", {
            className: "intro-row",
            children: [
              (0, r.jsxs)("div", {
                children: [
                  (0, r.jsx)("p", {
                    className: "eyebrow",
                    children: "CleanTrend · retailer intelligence",
                  }),
                  (0, r.jsx)("h1", {
                    children: "Find the next opportunity for Target.",
                  }),
                  (0, r.jsx)("p", {
                    className: "intro-copy",
                    children:
                      "Find products Target does not currently carry. Review verified whitespace, check the evidence and compare your shortlist.",
                  }),
                ],
              }),
              (0, r.jsxs)("aside", {
                className: "market-pulse",
                children: [
                  (0, r.jsx)("span", {
                    className: "pulse-label",
                    children: "Catalog coverage",
                  }),
                  (0, r.jsx)("strong", { children: "Partial" }),
                  (0, r.jsx)("p", {
                    children:
                      "Retailer inventory reconciliation is still required",
                  }),
                  (0, r.jsxs)("span", {
                    className: "growth",
                    children: [
                      D.length,
                      " cleaning categories \xb7 national and owned brands",
                    ],
                  }),
                  (0, r.jsxs)("span", {
                    className: "store-footprint",
                    children: [
                      "U.S. mass, club, drug, marketplace and DTC \xb7 records from ",
                      eP,
                      " global retailers across ",
                      eD,
                      " markets",
                    ],
                  }),
                ],
              }),
            ],
          }),
          (0, r.jsxs)("section", {
            className: "metric-grid",
            "aria-label": "Opportunity summary",
            children: [
              (0, r.jsxs)("article", {
                children: [
                  (0, r.jsx)("span", { children: "Captured product library" }),
                  (0, r.jsx)("strong", { children: $.length }),
                  (0, r.jsxs)("small", {
                    children: [
                      ez,
                      " recorded retailer offers · partial assortment; full retailer inventories are not collected",
                    ],
                  }),
                ],
              }),
              (0, r.jsxs)("article", {
                className: "clickable-metric",
                onClick: () => eH("priority"),
                children: [
                  (0, r.jsx)("span", { children: "Verified Target whitespace" }),
                  (0, r.jsx)("strong", { children: eG }),
                  (0, r.jsx)("small", {
                    children: "Confirmed absence checks within 24 hours →",
                  }),
                ],
              }),
              (0, r.jsxs)("article", {
                className: "clickable-metric",
                onClick: () => eH("viral"),
                children: [
                  (0, r.jsx)("span", { children: "Fresh viral signals" }),
                  (0, r.jsx)("strong", { children: ej }),
                  (0, r.jsx)("small", {
                    children: "Evidence within 7 days · click to review →",
                  }),
                ],
              }),
              (0, r.jsxs)("article", {
                className: "signal-card",
                children: [
                  (0, r.jsx)("span", { children: "Brand architecture" }),
                  (0, r.jsxs)("strong", { children: [ex, " + ", eB] }),
                  (0, r.jsx)("small", {
                    children:
                      "national-brand products + retailer private-label products",
                  }),
                ],
              }),
            ],
          }),
          (0, r.jsx)(AssessmentGuide, {}),
          (0, r.jsx)(RefreshNotice, {}),
          (0, r.jsxs)("p", {
            className: "comparison-evidence-note",
            children: [
              (0, r.jsx)("strong", { children: "Safety hold:" }),
              " BISSELL Steam Shot OmniReach / Omni entries are withheld from this directory and new selections pending model and replacement-attachment verification. ",
              (0, r.jsx)("a", {
                href: "https://www.cpsc.gov/Recalls/2026/BISSELL-Recalls-Over-One-Million-Steam-Shot-OmniReach-Steam-Cleaners-Due-to-Risk-of-Serious-Burn-Hazard-from-Attachments",
                target: "_blank",
                rel: "noreferrer",
                children: "CPSC recall \xb7 April 9, 2026 ↗",
              }),
              ". This is not a completed safety review of every product.",
            ],
          }),
          (0, r.jsxs)("section", {
            className: "trend-strip",
            "aria-label": "Signals to watch",
            children: [
              (0, r.jsx)("span", {
                className: "trend-strip-title",
                children: "Signals to watch",
              }),
              (0, r.jsx)("span", { children: "Fragrance as ritual" }),
              (0, r.jsx)("span", { children: "Powered scrubbers under $25" }),
              (0, r.jsx)("span", { children: "Hidden appliance hygiene" }),
              (0, r.jsx)("span", { children: "Waterless refills" }),
              (0, r.jsx)("span", { children: "Before / after proof" }),
            ],
          }),
          (0, r.jsxs)("details", {
            className: "coverage-audit",
            "aria-label": "Retailer and category coverage audit",
            children: [
              (0, r.jsx)("summary", {
                children:
                  "Retailer & category coverage · explore all 27 categories",
              }),
              (0, r.jsxs)("div", {
                className: "section-heading",
                children: [
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("p", {
                        className: "eyebrow",
                        children: "Captured coverage",
                      }),
                      (0, r.jsx)("h2", {
                        children: "Retailer \xd7 category coverage audit",
                      }),
                    ],
                  }),
                  (0, r.jsx)("p", {
                    children:
                      "Counts measure this directory, not the retailer’s full assortment. No retailer is marked complete: a full catalog denominator and reconciliation are not available.",
                  }),
                ],
              }),
              (0, r.jsxs)("div", {
                className: "coverage-toolbar",
                children: [
                  (0, r.jsxs)("label", {
                    children: [
                      (0, r.jsx)("span", { children: "Audit retailer" }),
                      (0, r.jsx)("select", {
                        value: G,
                        onChange: (e) => j(e.target.value),
                        children: ev.map((e) =>
                          (0, r.jsx)("option", { children: e }, e),
                        ),
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("span", { children: "Products" }),
                      (0, r.jsx)("strong", { children: eS.length }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("span", { children: "Brand mix" }),
                      (0, r.jsxs)("strong", {
                        children: [
                          eC.national,
                          " national \xb7 ",
                          eC.privateLabel,
                          " private",
                        ],
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("span", { children: "Categories covered" }),
                      (0, r.jsxs)("strong", { children: [eT, "/", D.length] }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("span", { children: "Open gaps" }),
                      (0, r.jsx)("strong", { children: eA }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("span", { children: "Photo status" }),
                      (0, r.jsx)("strong", { children: "100% local" }),
                    ],
                  }),
                ],
              }),
              (0, r.jsx)("div", {
                className: "coverage-grid",
                children: D.map((e) =>
                  (0, r.jsxs)(
                    "button",
                    {
                      className: ek[e] ? "covered" : "gap",
                      disabled: !ek[e],
                      onClick: () => {
                        ek[e] &&
                          (n("All"),
                          o(e),
                          c(
                            "All captured retailers" === G
                              ? "All retailers"
                              : G,
                          ),
                          a(""),
                          p("all"),
                          g("all"),
                          f("recent"),
                          U("all"),
                          T(36),
                          document
                            .getElementById("directory")
                            ?.scrollIntoView({ behavior: "smooth" }));
                      },
                      children: [
                        (0, r.jsx)("span", { children: e }),
                        (0, r.jsx)("b", { children: ek[e] || "Gap" }),
                      ],
                    },
                    e,
                  ),
                ),
              }),
              (0, r.jsxs)("details", {
                className: "international-network",
                children: [
                  (0, r.jsxs)("summary", {
                    children: [
                      "Open international retailer network \xb7 ",
                      X.length,
                      " retailers in scope",
                    ],
                  }),
                  (0, r.jsx)("p", {
                    children:
                      "Every retailer is clickable. A zero count is an explicit verification gap, not a hidden omission.",
                  }),
                  (0, r.jsx)("div", {
                    className: "international-market-grid",
                    children: h.map((e) =>
                      (0, r.jsxs)(
                        "article",
                        {
                          children: [
                            (0, r.jsx)("strong", { children: e.market }),
                            (0, r.jsx)("div", {
                              children: e.retailers.map((e) => {
                                let a = $.filter((a) =>
                                  V(a).some(
                                    (a) =>
                                      "Global" === a.channel &&
                                      a.retailer === e.name,
                                  ),
                                ).length;
                                return (0, r.jsxs)(
                                  "button",
                                  {
                                    className: a ? "verified" : "gap",
                                    onClick: () => eF(e.name),
                                    children: [
                                      (0, r.jsx)("span", { children: e.name }),
                                      (0, r.jsx)("b", { children: a || "Gap" }),
                                    ],
                                  },
                                  e.name,
                                );
                              }),
                            }),
                          ],
                        },
                        e.market,
                      ),
                    ),
                  }),
                ],
              }),
              (0, r.jsxs)("details", {
                className: "retailer-brand-directory",
                children: [
                  (0, r.jsxs)("summary", {
                    children: [
                      "Browse every retailer by brand type \xb7 ",
                      ee.length,
                      " retailers and sourcing channels",
                    ],
                  }),
                  (0, r.jsx)("p", {
                    children:
                      "Click a retailer or brand count to see its products. All assortments are partial. “Dated sources” counts records with a source-check date, not verified live stock. Zero means not captured—not that a retailer sells none.",
                  }),
                  (0, r.jsx)("div", {
                    className: "retailer-table-scroll",
                    children: (0, r.jsxs)("table", {
                      children: [
                        (0, r.jsx)("thead", {
                          children: (0, r.jsxs)("tr", {
                            children: [
                              (0, r.jsx)("th", { children: "Retailer" }),
                              (0, r.jsx)("th", { children: "Market" }),
                              (0, r.jsx)("th", { children: "National brands" }),
                              (0, r.jsx)("th", { children: "Private label" }),
                              (0, r.jsx)("th", { children: "Categories" }),
                              (0, r.jsx)("th", { children: "Captured total" }),
                              (0, r.jsx)("th", { children: "Coverage status" }),
                            ],
                          }),
                        }),
                        (0, r.jsx)("tbody", {
                          children: ee.map((e) =>
                            (0, r.jsxs)(
                              "tr",
                              {
                                "data-retailer": e.name,
                                children: [
                                  (0, r.jsxs)("th", {
                                    scope: "row",
                                    children: [
                                      (0, r.jsx)("button", {
                                        onClick: () => eW(e.name, "all"),
                                        children: e.name,
                                      }),
                                      (0, r.jsx)("a", {
                                        href: e.url,
                                        target: "_blank",
                                        rel: "noreferrer",
                                        "aria-label": `Open ${e.name} website`,
                                        children: "Website ↗",
                                      }),
                                    ],
                                  }),
                                  (0, r.jsx)("td", { children: e.market }),
                                  (0, r.jsx)("td", {
                                    children: (0, r.jsx)("button", {
                                      onClick: () => eW(e.name, "national"),
                                      "aria-label": `${e.name}: ${e.national} national brand products`,
                                      children: e.national,
                                    }),
                                  }),
                                  (0, r.jsx)("td", {
                                    children: (0, r.jsx)("button", {
                                      onClick: () =>
                                        eW(e.name, "private-label"),
                                      "aria-label": `${e.name}: ${e.privateLabel} private label products`,
                                      children: e.privateLabel,
                                    }),
                                  }),
                                  (0, r.jsx)("td", {
                                    children: e.categories.size,
                                  }),
                                  (0, r.jsx)("td", {
                                    children: e.total || "Not captured",
                                  }),
                                  (0, r.jsx)("td", {
                                    children: e.total
                                      ? (0, r.jsxs)(r.Fragment, {
                                          children: [
                                            "Partial",
                                            (0, r.jsx)("br", {}),
                                            (0, r.jsxs)("small", {
                                              children: [
                                                e.dated,
                                                "/",
                                                e.total,
                                                " dated sources",
                                              ],
                                            }),
                                          ],
                                        })
                                      : "Not captured",
                                  }),
                                ],
                              },
                              e.name,
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          (0, r.jsxs)("section", {
            className: "catalog-section",
            id: "directory",
            children: [
              (0, r.jsx)(SignalTabs, { products: $, active: R, onChange: eH, onBrowseHistory: () => { a(""); eH("history"); } }),
              R === "recommendations" ? (0, r.jsx)(TargetRecommendations, {catalog:$,selected:b,onOpen:k,onToggle:id=>w(ids=>ids.includes(id)?ids.filter(value=>value!==id):ids.length<6?[...ids,id]:ids),onResearch:()=>{a("");eH("research");},imagePath:ef}) : (0, r.jsxs)(r.Fragment, {children:[
              e.trim() && searchMatches.length > eL.length && (0, r.jsxs)("div", {
                className: "search-scope-notice", role: "status",
                children: [(0, r.jsx)("p", {children: `${searchMatches.length} matches for “${e}” across all products. ${searchMatches.length-eL.length} are hidden by your current filters. Target listings appear in All products.`}),
                  (0, r.jsx)("button", {onClick: showSearchMatches, children: `Show all ${searchMatches.length} matches`})]
              }),
              (0, r.jsxs)("div", {
                className: "section-heading",
                children: [
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("p", {
                        className: "eyebrow",
                        children: "Opportunity library",
                      }),
                      (0, r.jsx)("h2", {
                        children: R === "priority" ? "Verified Target whitespace" : R === "research" ? "Products needing a Target check" : R === "history" ? "Viral history" : R === "viral" ? "Fresh viral products" : "Explore cleaning products",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("p", {
                    children: [
                      "Showing ",
                      Math.min(C, eL.length),
                      " of ",
                      eL.length,
                      " matches \xb7 ",
                      $.length,
                      " total ",
                      "all" !== R &&
                        (0, r.jsxs)("button", {
                          className: "inline-reset",
                          onClick: () => U("all"),
                          children: ["Show all products ×"],
                        }),
                    ],
                  }),
                ],
              }),
              (0, r.jsxs)("div", {
                className: "filter-panel",
                children: [
                  (0, r.jsxs)("label", {
                    className: "search-box",
                    children: [
                      (0, r.jsx)("span", {
                        "aria-hidden": "true",
                        children: "⌕",
                      }),
                      (0, r.jsx)("input", {
                        type: "search",
                        value: e,
                        onChange: (e) => {
                          (a(e.target.value), T(36));
                        },
                        placeholder: "Search products, e.g. sponge cloth",
                        "aria-label": "Search products",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("label", {
                    className: "select-wrap",
                    children: [
                      (0, r.jsx)("span", { children: "Category" }),
                      (0, r.jsxs)("select", {
                        value: s,
                        onChange: (e) => {
                          (o(e.target.value), c("All retailers"), T(36));
                        },
                        children: [
                          (0, r.jsxs)("option", {
                            value: "All categories",
                            children: ["All categories (", W, ")"],
                          }),
                          H.map((e) =>
                            (0, r.jsxs)(
                              "option",
                              {
                                value: e,
                                disabled: !F[e] && e !== s,
                                children: [e, " (", F[e] ?? 0, ")"],
                              },
                              e,
                            ),
                          ),
                        ],
                      }),
                    ],
                  }),
                  (0, r.jsxs)("label", {
                    className: "select-wrap",
                    children: [
                      (0, r.jsx)("span", { children: "Retailer" }),
                      (0, r.jsx)("select", {
                        value: l,
                        onChange: (e) => {
                          (c(e.target.value), T(36));
                        },
                        children: er.map((e) =>
                          (0, r.jsx)(
                            "option",
                            {
                              value: e,
                              children:
                                "All retailers" === e
                                  ? `All retailers (${O})`
                                  : et && e === l
                                    ? `${e} (verification gap)`
                                    : `${e} (${q[e] ?? 0})`,
                            },
                            e,
                          ),
                        ),
                      }),
                    ],
                  }),
                  (0, r.jsxs)("label", {
                    className: "select-wrap",
                    children: [
                      (0, r.jsx)("span", {
                        children: "Target opportunity",
                      }),
                      (0, r.jsxs)("select", {
                        value: d,
                        onChange: (e) => {
                          (p(e.target.value), T(36));
                        },
                        children: [
                          (0, r.jsxs)("option", {
                            value: "all",
                            children: ["All records (", ec.all, ")"],
                          }),
                          (0, r.jsxs)("option", {
                            value: "90",
                            disabled: !ec["90"],
                            children: ["Ready to propose (", ec["90"], ")"],
                          }),
                          (0, r.jsxs)("option", {
                            value: "78",
                            disabled: !ec["78"],
                            children: ["Verified whitespace (", ec["78"], ")"],
                          }),
                          (0, r.jsxs)("option", {
                            value: "70",
                            disabled: !ec["70"],
                            children: [
                              "Related Target comparisons (",
                              ec["70"],
                              ")",
                            ],
                          }),
                          (0, r.jsxs)("option", {
                            value: "below",
                            disabled: !ec.below,
                            children: [
                              "Target listing recorded (",
                              ec.below,
                              ")",
                            ],
                          }),
                          (0, r.jsxs)("option", {
                            value: "pending",
                            disabled: !ec.pending,
                            children: ["Needs Target check (", ec.pending, ")"],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, r.jsxs)("label", {
                    className: "select-wrap",
                    children: [
                      (0, r.jsx)("span", { children: "Brand type" }),
                      (0, r.jsxs)("select", {
                        value: m,
                        onChange: (e) => {
                          (g(e.target.value), T(36));
                        },
                        children: [
                          (0, r.jsxs)("option", {
                            value: "all",
                            children: ["All brands (", ew.all, ")"],
                          }),
                          (0, r.jsxs)("option", {
                            value: "national",
                            disabled: !ew.national,
                            children: ["National brands (", ew.national, ")"],
                          }),
                          (0, r.jsxs)("option", {
                            value: "private-label",
                            disabled: !ew.privateLabel,
                            children: ["Private label (", ew.privateLabel, ")"],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, r.jsxs)("label", {
                    className: "select-wrap",
                    children: [
                      (0, r.jsx)("span", { children: "Sort" }),
                      (0, r.jsxs)("select", {
                        value: u,
                        onChange: (e) => {
                          (f(e.target.value), T(36));
                        },
                        children: [
                          (0, r.jsx)("option", {
                            value: "score",
                            children: "Evidence readiness",
                          }),
                          (0, r.jsx)("option", {
                            value: "recent",
                            children: "Recently researched",
                          }),
                          (0, r.jsx)("option", {
                            value: "trend",
                            children: "Recorded trend signal",
                          }),
                          (0, r.jsx)("option", {
                            value: "reviews",
                            children: "Review volume",
                          }),
                          (0, r.jsx)("option", {
                            value: "price-low",
                            children: "Price: low to high",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, r.jsxs)("div", {
                className: "filter-utility",
                role: "status",
                "aria-live": "polite",
                children: [
                  (0, r.jsx)("span", {
                    children:
                      "Retailer and Brand type work together. Counts reflect imported records, not the retailer’s total inventory. A zero or small count means a research gap—not limited retailer availability.",
                  }),
                  (0, r.jsx)("button", {
                    type: "button",
                    onClick: e_,
                    disabled:
                      "" === e &&
                      "All" === t &&
                      "All categories" === s &&
                      "All retailers" === l &&
                      "all" === d &&
                      "all" === m &&
                      "recent" === u &&
                      "all" === R,
                    children: "Reset all filters",
                  }),
                ],
              }),
              (0, r.jsx)("div", {
                className: "channel-tabs",
                role: "group",
                "aria-label": "Filter by channel",
                children: Q.map((e) =>
                  (0, r.jsxs)(
                    "button",
                    {
                      className: t === e ? "active" : "",
                      disabled: e !== t && !en[e],
                      onClick: () => {
                        (n(e), c("All retailers"), T(36));
                      },
                      children: [e, (0, r.jsx)("span", { children: en[e] })],
                    },
                    e,
                  ),
                ),
              }),
              "Global" === t &&
                (0, r.jsxs)(r.Fragment, {
                  children: [
                    (0, r.jsxs)("div", {
                      className: "global-balance-note",
                      children: [
                        (0, r.jsx)("strong", {
                          children: "Partial international catalogs",
                        }),
                        (0, r.jsx)("span", {
                          children:
                            "Counts show captured records only. Retailer catalog totals and complete coverage have not been established.",
                        }),
                      ],
                    }),
                    (0, r.jsxs)("div", {
                      className: "global-catalog-tabs",
                      role: "group",
                      "aria-label": "Filter Global catalog by retailer",
                      children: [
                        (0, r.jsx)("span", { children: "Retailers in scope" }),
                        (0, r.jsxs)("button", {
                          className: "All retailers" === l ? "active" : "",
                          onClick: () => eF("All retailers"),
                          children: [
                            "All ",
                            (0, r.jsx)("b", { children: eR.length }),
                          ],
                        }),
                        ey.map((e) => {
                          let a = $.filter((a) =>
                            V(a).some(
                              (a) => "Global" === a.channel && a.retailer === e,
                            ),
                          ).length;
                          return (0, r.jsxs)(
                            "button",
                            {
                              className: l === e ? "active" : "",
                              onClick: () => eF(e),
                              children: [
                                e,
                                (0, r.jsx)("b", { children: a || "Gap" }),
                              ],
                            },
                            e,
                          );
                        }),
                      ],
                    }),
                  ],
                }),
              eL.length
                ? (0, r.jsxs)(r.Fragment, {
                    children: [
                      (0, r.jsx)("div", {
                        className: "product-grid",
                        children: eE.map((e) => {
                          let a = b.includes(e.id),
                            i = K(e, t, l),
                            n = new Set(V(e).map((e) => e.retailer)).size;
                          return (0, r.jsxs)(
                            "article",
                            {
                              className: "product-card",
                              children: [
                                (0, r.jsxs)("div", {
                                  className: "product-image-wrap",
                                  children: [
                                    (0, r.jsx)("div", {
                                      className: "image-fallback",
                                      "aria-hidden": "true",
                                      children: e.brand
                                        .slice(0, 2)
                                        .toUpperCase(),
                                    }),
                                    (0, r.jsx)("img", {
                                      src: ef(e.image),
                                      alt: `${e.brand} ${e.name}`,
                                      loading: "lazy",
                                    }),
                                    (0, r.jsxs)("span", {
                                      className: `trend-badge trend-${e.trend.toLowerCase()}`,
                                      children: [
                                        "Viral" === e.trend &&
                                          (0, r.jsx)("i", {}),
                                        trendLabel(e),
                                      ],
                                    }),
                                    ei(e).eligible &&
                                      (0, r.jsx)("span", {
                                        className: "priority-badge",
                                        children:
                                          "Legacy candidate \xb7 unvalidated",
                                      }),
                                    Y(e) &&
                                      (0, r.jsxs)("span", {
                                        className: "benchmark-badge",
                                        children: [Y(e), " owned brand"],
                                      }),
                                    (0, r.jsx)("button", {
                                      className: `select-button ${a ? "selected" : ""}`,
                                      onClick: () => {
                                        var a;
                                        return (
                                          (a = e.id),
                                          void w((e) =>
                                            e.includes(a)
                                              ? e.filter((e) => e !== a)
                                              : e.length >= 6
                                                ? e
                                                : [...e, a],
                                          )
                                        );
                                      },
                                      "aria-label": a
                                        ? `Remove ${e.name} from comparison`
                                        : `Add ${e.name} to comparison`,
                                      title:
                                        !a && b.length >= 6
                                          ? "Compare up to six products"
                                          : void 0,
                                      children: a ? "✓" : "+",
                                    }),
                                  ],
                                }),
                                (0, r.jsxs)("div", {
                                  className: "product-body",
                                  children: [
                                    (0, r.jsxs)("div", {
                                      className: "retailer-line",
                                      children: [
                                        (0, r.jsx)("span", {
                                          children: i.retailer,
                                        }),
                                        (0, r.jsx)("span", {
                                          children: i.market,
                                        }),
                                      ],
                                    }),
                                    (0, r.jsxs)("div", {
                                      className: "product-title-row",
                                      children: [
                                        (0, r.jsxs)("div", {
                                          children: [
                                            (0, r.jsx)("p", {
                                              children: e.brand,
                                            }),
                                            (0, r.jsx)("h3", {children:(0,r.jsx)("button",{className:"product-name-button",onClick:()=>k(e),children:e.name})}),
                                          ],
                                        }),
                                      ],
                                    }),
                                    (0, r.jsxs)("div", {
                                      className: "brand-availability",
                                      children: [
                                        (0, r.jsx)("span", { children: Z(e) }),
                                        n > 1 &&
                                          (0, r.jsxs)("span", {
                                            children: [
                                              n,
                                              " recorded retailer offers",
                                            ],
                                          }),
                                      ],
                                    }),
                                    (0, r.jsx)("p", {
                                      className: "description",
                                      children: e.description,
                                    }),
                                    (0, r.jsxs)("div", {
                                      className: "commerce-row",
                                      children: [
                                        (0, r.jsxs)("div", {
                                          children: [
                                            (0, r.jsx)("span", {
                                              children: "Retail price",
                                            }),
                                            (0, r.jsx)("strong", {
                                              children: i.priceLabel,
                                            }),
                                            (0, r.jsx)("small", {
                                              children: i.priceNote,
                                            }),
                                          ],
                                        }),
                                        (0, r.jsxs)("div", {
                                          children: [
                                            (0, r.jsx)("span", {
                                              children: hasViralHistory(e) && !isFreshViral(e) ? "Historical demand claim" : "Demand signal",
                                            }),
                                            (0, r.jsx)("strong", {
                                              children: e.salesSignal,
                                            }),
                                            (0, r.jsx)("small", {
                                              children: hasViralHistory(e) && !isFreshViral(e) ? "Saved claim; current demand not verified" : e.signalType,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    (0, r.jsxs)("div", {
                                      className: "rating-row",
                                      children: [
                                        e.rating
                                          ? (0, r.jsxs)("span", {
                                              children: [
                                                (0, r.jsxs)("b", {
                                                  children: ["★ ", e.rating],
                                                }),
                                                " \xb7 ",
                                                ep(e.reviews),
                                                " ratings",
                                              ],
                                            })
                                          : (0, r.jsx)("span", {
                                              children: "Rating not published",
                                            }),
                                        (0, r.jsx)("span", {
                                          className: `confidence confidence-${e.confidence.toLowerCase()}`,
                                          children: e.evidence
                                            ? "Dated source"
                                            : "Source date missing",
                                        }),
                                      ],
                                    }),
                                    (0, r.jsx)(ViralHistory, { product: e }),
                                    (0, r.jsx)(CardDecision, {
                                      product: e,
                                      catalog: $,
                                    }),
                                    (0, r.jsxs)("div", {
                                      className: "card-actions",
                                      children: [
                                        (0, r.jsx)("button", {
                                          onClick: () => k(e),
                                          children: "Check Target opportunity",
                                        }),
                                        (0, r.jsxs)("a", {
                                          href: i.link,
                                          target: "_blank",
                                          rel: "noreferrer",
                                          children: [
                                            "View source ",
                                            (0, r.jsx)("span", {
                                              "aria-hidden": "true",
                                              children: "↗",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            },
                            e.id,
                          );
                        }),
                      }),
                      C < eL.length &&
                        (0, r.jsxs)("div", {
                          className: "show-more-wrap",
                          children: [
                            (0, r.jsxs)("button", {
                              onClick: () => T((e) => e + 36),
                              children: [
                                "Show ",
                                Math.min(36, eL.length - C),
                                " more",
                              ],
                            }),
                            (0, r.jsxs)("button", {
                              className: "show-all-button",
                              onClick: () => T(eL.length),
                              children: ["Show all ", eL.length],
                            }),
                            (0, r.jsxs)("span", {
                              children: [eL.length - C, " products remaining"],
                            }),
                          ],
                        }),
                    ],
                  })
                : (0, r.jsxs)("div", {
                    className: "empty-state",
                    children: [
                      (0, r.jsx)("span", { children: "⌕" }),
                      (0, r.jsx)("h3", {
                        children:
                          R === "priority" ? "No verified Target whitespace yet." : "Global" === t && ea
                            ? `No captured ${ea.name} entries match.`
                            : "No products match those filters.",
                      }),
                      (0, r.jsx)("p", {
                        children:
                          R === "priority" ? "No products in this view have a qualifying current Target absence check. This does not mean Target has no gaps. Browse products needing verification to continue research." : "Global" === t && ea
                            ? "This is a directory coverage gap, not evidence that the retailer has no cleaning products. Exact product listings and photos still need to be captured for this selection."
                            : "Try another keyword or reset the channel and category.",
                      }),
                      "Global" === t && ea
                        ? (0, r.jsxs)("a", {
                            className: "research-retailer-link",
                            href: ea.url,
                            target: "_blank",
                            rel: "noreferrer",
                            children: ["Open ", ea.name, " for research ↗"],
                          })
                        : (0, r.jsx)("button", {
                            onClick: () => R === "priority" ? eH("research") : e_(),
                            children: R === "priority" ? "Browse products to verify" : "Reset filters",
                          }),
                    ],
                  }),
              ]}),
            ],
          }),
          (0, r.jsx)(CheckoutRecords, {records: B, onChange: x, storageKey: eb, imagePath: ef}),
          (0, r.jsxs)("section", {
            className: "methodology",
            children: [
              (0, r.jsxs)("div", {
                children: [
                  (0, r.jsx)("p", {
                    className: "eyebrow",
                    children: "How to read the data",
                  }),
                  (0, r.jsx)("h2", {
                    children: "Directional evidence, clearly labeled.",
                  }),
                ],
              }),
              (0, r.jsxs)("div", {
                className: "method-grid",
                children: [
                  (0, r.jsxs)("article", {
                    children: [
                      (0, r.jsx)("span", { children: "01" }),
                      (0, r.jsx)("strong", { children: "Published demand" }),
                      (0, r.jsx)("p", {
                        children:
                          "Retailer-provided “bought” or bestseller indicators. Useful, but not audited unit sales.",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("article", {
                    children: [
                      (0, r.jsx)("span", { children: "02" }),
                      (0, r.jsx)("strong", { children: "Verified sold count" }),
                      (0, r.jsx)("p", {
                        children:
                          "A sold count displayed by the marketplace at the time this snapshot was captured.",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("article", {
                    children: [
                      (0, r.jsx)("span", { children: "03" }),
                      (0, r.jsx)("strong", { children: "Review proxy" }),
                      (0, r.jsx)("p", {
                        children:
                          "Rating volume used as a directional indicator of cumulative demand and product maturity.",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("article", {
                    children: [
                      (0, r.jsx)("span", { children: "04" }),
                      (0, r.jsx)("strong", {
                        children: "Scout signal + legacy score",
                      }),
                      (0, r.jsx)("p", {
                        children:
                          "Catalog presence does not establish sales. Old scores lack independent factor evidence and are unvalidated. Newly captured products remain unassessed.",
                      }),
                    ],
                  }),
                ],
              }),
              (0, r.jsx)("p", {
                className: "disclaimer",
                children:
                  "Prices, availability, rankings and marketplace signals can change by date, location, membership and seller. This directory is a partial collection, not a live retailer feed or complete market census. Some older records still use broad source links and require exact-item verification. Legacy scores and keyword-based candidate lists are unvalidated. Confirm live assortment, economics, claims, safety and product performance before item commitment.",
              }),
            ],
          }),
        ],
      }),
      b.length > 0 &&
        (0, r.jsxs)("div", {
          className: "compare-dock",
          children: [
            (0, r.jsxs)("div", {
              children: [
                (0, r.jsxs)("span", { children: [b.length, "/6 selected"] }),
                (0, r.jsx)("strong", {
                  children: eN.map((e) => e.brand).join(" \xb7 "),
                }),
              ],
            }),
            (0, r.jsx)("button", {
              className: "clear-button",
              onClick: () => w([]),
              children: "Clear",
            }),
            (0, r.jsx)("button", {
              className: "clear-button checkout-dock-button",
              onClick: () => {
                (N(""),
                  E((e) => ({
                    merchantName: e.merchantName,
                    items: Object.fromEntries(
                      eN.map((a) => [a.id, e.items[a.id] ?? eh()]),
                    ),
                  })),
                  z(!0));
              },
              children: "Checkout selection",
            }),
            (0, r.jsx)("button", {
              className: "compare-button",
              disabled: b.length < 2,
              onClick: () => v(!0),
              children: "Compare products",
            }),
          ],
        }),
      S &&
        (0, r.jsx)("div", {
          className: "modal-backdrop",
          onMouseDown: () => k(null),
          children: (0, r.jsxs)("section", {
            className: "detail-modal",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": `${S.name} decision brief`,
            onMouseDown: (e) => e.stopPropagation(),
            children: [
              (0, r.jsx)("button", {
                className: "modal-close",
                onClick: () => k(null),
                "aria-label": "Close decision brief",
                children: "\xd7",
              }),
              (0, r.jsxs)("div", {
                className: "detail-hero",
                children: [
                  (0, r.jsx)("div", {
                    className: "detail-image",
                    children: (0, r.jsx)("img", {
                      src: ef(S.image),
                      alt: `${S.brand} ${S.name}`,
                    }),
                  }),
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsxs)("p", {
                        className: "eyebrow",
                        children: [
                          eM?.retailer ?? S.retailer,
                          " \xb7 ",
                          S.category,
                        ],
                      }),
                      (0, r.jsx)("h2", { children: S.name }),
                      (0, r.jsxs)("p", {
                        className: "detail-brand",
                        children: [S.brand, " \xb7 ", Z(S)],
                      }),
                    ],
                  }),
                ],
              }),
              (0, r.jsx)(ItemDecision, { product: S, catalog: $ }),
              (0, r.jsxs)("section", {
                className: "customer-review-callout",
                "aria-label": "Voice of guest and customer review signal",
                children: [
                  (0, r.jsxs)("div", {
                    className: "review-rating",
                    children: [
                      (0, r.jsx)("span", { children: "Voice of guest" }),
                      (0, r.jsx)("strong", {
                        children: S.rating
                          ? `★ ${S.rating.toFixed(1)} / 5`
                          : "Rating not published",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    className: "review-depth",
                    children: [
                      (0, r.jsx)("small", { children: "Review depth" }),
                      (0, r.jsx)("b", {
                        children: S.reviews
                          ? `${ep(S.reviews)} retailer ratings`
                          : "Public count unavailable",
                      }),
                      (0, r.jsx)("p", {
                        children: ((e) => {
                          if (!e.rating || !e.reviews)
                            return "A public customer rating is not available for this listing. Treat the stated demand signal as directional and validate customer sentiment before commitment.";
                          let a =
                              e.reviews >= 1e4
                                ? "very deep"
                                : e.reviews >= 1e3
                                  ? "deep"
                                  : e.reviews >= 100
                                    ? "meaningful"
                                    : "early",
                            t =
                              e.rating >= 4.7
                                ? "exceptional satisfaction"
                                : e.rating >= 4.5
                                  ? "strong satisfaction"
                                  : e.rating >= 4.2
                                    ? "positive satisfaction"
                                    : "mixed satisfaction that needs review-theme validation";
                          return `${e.rating.toFixed(1)} out of 5 from ${ep(e.reviews)} retailer ratings indicates ${t} with ${a} review depth. Review volume reflects product maturity, not audited sales.`;
                        })(S),
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    className: "guest-theme-grid",
                    children: [
                      (0, r.jsxs)("article", {
                        children: [
                          (0, r.jsx)("small", {
                            children: "Stored positive feedback",
                          }),
                          (0, r.jsx)("p", { children: em(S).praise }),
                        ],
                      }),
                      (0, r.jsxs)("article", {
                        children: [
                          (0, r.jsx)("small", {
                            children: "Guest friction to validate",
                          }),
                          (0, r.jsx)("p", { children: em(S).friction }),
                        ],
                      }),
                    ],
                  }),
                  (0, r.jsxs)("p", {
                    className: "guest-source",
                    children: [
                      em(S).source,
                      " Stored review summaries have not all been independently rechecked. Ratings measure reported satisfaction, not lab-tested performance.",
                    ],
                  }),
                ],
              }),
              (0, r.jsxs)("details", {
                className: "legacy-note",
                children: [
                  (0, r.jsx)("summary", { children: "Earlier score history" }),
                  (0, r.jsx)("p", {
                    children:
                      "Earlier numeric scores were not validated. They are not used to recommend a Target launch.",
                  }),
                ],
              }),
              (0, r.jsx)("div", {
                className: "detail-tags",
                children: S.tags.map((e) =>
                  (0, r.jsx)("span", { children: e }, e),
                ),
              }),
              (eM?.evidence ?? S.evidence) &&
                (0, r.jsxs)("p", {
                  className: "listing-evidence",
                  children: [
                    "Source checked ",
                    (eM?.evidence ?? S.evidence)?.checkedAt,
                    " \xb7 ",
                    (eM?.evidence ?? S.evidence)?.method,
                    ". Prices and availability may vary by location or seller.",
                  ],
                }),
              (0, r.jsxs)("div", {
                className: "detail-footer",
                children: [
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("small", { children: "Observed retail" }),
                      (0, r.jsx)("strong", {
                        children: eM?.priceLabel ?? S.priceLabel,
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    children: [
                      (0, r.jsx)("small", { children: "Demand evidence" }),
                      (0, r.jsx)("strong", { children: S.salesSignal }),
                    ],
                  }),
                  (0, r.jsx)("a", {
                    href: eM?.link ?? S.link,
                    target: "_blank",
                    rel: "noreferrer",
                    children: "Open source ↗",
                  }),
                ],
              }),
            ],
          }),
        }),
      y &&
        (0, r.jsx)("div", {
          className: "modal-backdrop",
          onMouseDown: () => v(!1),
          children: (0, r.jsxs)("section", {
            className: "compare-modal",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "Product comparison",
            onMouseDown: (e) => e.stopPropagation(),
            children: [
              (0, r.jsx)("button", {
                className: "modal-close",
                onClick: () => v(!1),
                "aria-label": "Close comparison",
                children: "\xd7",
              }),
              (0, r.jsx)("p", {
                className: "eyebrow",
                children: "Side-by-side",
              }),
              (0, r.jsx)("h2", { children: "Your shortlist: what to do next" }),
              (0, r.jsx)(ComparisonDirection, { items: eN, catalog: $ }),
              eN.length >= 2
                ? (0, r.jsx)(A, {
                    items: eN.map((e) => ({ product: e, listing: K(e, t, l) })),
                    assetUrl: ef,
                  })
                : (0, r.jsxs)("div", {
                    className: "compare-empty",
                    children: [
                      (0, r.jsx)("p", {
                        children: "Select at least two products to compare.",
                      }),
                      (0, r.jsx)("button", {
                        onClick: () => v(!1),
                        children: "Return to products",
                      }),
                    ],
                  }),
            ],
          }),
        }),
      P &&
        (0, r.jsx)("div", {
          className: "modal-backdrop",
          onMouseDown: () => z(!1),
          children: (0, r.jsxs)("section", {
            className: "checkout-modal",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "Checkout merchant selection",
            onMouseDown: (e) => e.stopPropagation(),
            children: [
              (0, r.jsx)("button", {
                className: "modal-close",
                onClick: () => z(!1),
                "aria-label": "Close checkout",
                children: "\xd7",
              }),
              (0, r.jsx)("p", {
                className: "eyebrow",
                children: "Merchant selection",
              }),
              (0, r.jsx)("h2", { children: "Checkout selected products" }),
              (0, r.jsx)("p", {
                className: "checkout-intro",
                children:
                  "Enter the merchant name once, then complete a separate commercial entry for every selected product. Your selection saves as one record in this browser.",
              }),
              (0, r.jsxs)("form", {
                onSubmit: eO,
                className: "checkout-form",
                children: [
                  (0, r.jsxs)("label", {
                    className: "full-field checkout-merchant",
                    children: [
                      (0, r.jsx)("span", { children: "Merchant name" }),
                      (0, r.jsx)("input", {
                        required: !0,
                        value: M.merchantName,
                        onChange: (e) =>
                          E({ ...M, merchantName: e.target.value }),
                      }),
                    ],
                  }),
                  (0, r.jsx)("div", {
                    className: "checkout-item-entries full-field",
                    children: eN.map((e, a) => {
                      let t = M.items[e.id] ?? eh();
                      return (0, r.jsxs)(
                        "section",
                        {
                          className: "checkout-item-entry",
                          "aria-label": `Merchant information for ${e.name}`,
                          children: [
                            (0, r.jsxs)("div", {
                              className: "checkout-item-header",
                              children: [
                                (0, r.jsx)("span", {
                                  className: "checkout-item-number",
                                  children: String(a + 1).padStart(2, "0"),
                                }),
                                (0, r.jsx)("img", {
                                  src: ef(e.image),
                                  alt: `${e.brand} ${e.name}`,
                                }),
                                (0, r.jsxs)("div", {
                                  children: [
                                    (0, r.jsx)("small", { children: e.brand }),
                                    (0, r.jsx)("strong", { children: e.name }),
                                  ],
                                }),
                              ],
                            }),
                            (0, r.jsxs)("div", {
                              className: "checkout-item-fields",
                              children: [
                                (0, r.jsxs)("label", {
                                  children: [
                                    (0, r.jsx)("span", {
                                      children: "Targeted retail price",
                                    }),
                                    (0, r.jsx)("input", {
                                      required: !0,
                                      placeholder: "$0.00",
                                      value: t.targetRetailPrice,
                                      onChange: (a) =>
                                        eq(
                                          e.id,
                                          "targetRetailPrice",
                                          a.target.value,
                                        ),
                                    }),
                                  ],
                                }),
                                (0, r.jsxs)("label", {
                                  children: [
                                    (0, r.jsx)("span", {
                                      children: "Targeted PMU",
                                    }),
                                    (0, r.jsx)("input", {
                                      required: !0,
                                      placeholder: "e.g. 45%",
                                      value: t.targetPmu,
                                      onChange: (a) =>
                                        eq(e.id, "targetPmu", a.target.value),
                                    }),
                                  ],
                                }),
                                (0, r.jsxs)("label", {
                                  children: [
                                    (0, r.jsx)("span", {
                                      children: "Number of stores",
                                    }),
                                    (0, r.jsx)("input", {
                                      required: !0,
                                      type: "number",
                                      min: "1",
                                      step: "1",
                                      inputMode: "numeric",
                                      placeholder: "e.g. 500",
                                      value: t.numberOfStores,
                                      onChange: (a) =>
                                        eq(
                                          e.id,
                                          "numberOfStores",
                                          a.target.value,
                                        ),
                                    }),
                                  ],
                                }),
                                (0, r.jsxs)("label", {
                                  children: [
                                    (0, r.jsx)("span", {
                                      children: "Potential launch date",
                                    }),
                                    (0, r.jsx)("input", {
                                      required: !0,
                                      type: "date",
                                      value: t.potentialLaunchDate,
                                      onChange: (a) =>
                                        eq(
                                          e.id,
                                          "potentialLaunchDate",
                                          a.target.value,
                                        ),
                                    }),
                                  ],
                                }),
                                (0, r.jsxs)("label", {
                                  className: "item-full-field",
                                  children: [
                                    (0, r.jsx)("span", {
                                      children: "Other comments",
                                    }),
                                    (0, r.jsx)("textarea", {
                                      rows: 3,
                                      value: t.comments,
                                      onChange: (a) =>
                                        eq(e.id, "comments", a.target.value),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        },
                        e.id,
                      );
                    }),
                  }),
                  (0, r.jsx)("button", {
                    className: "checkout-submit full-field",
                    type: "submit",
                    children: "Save record",
                  }),
                  L &&
                    (0, r.jsx)("p", {
                      className: "checkout-status full-field",
                      children: L,
                    }),
                ],
              }),
            ],
          }),
        }),
    ],
  });
}
export { ew as default, $ as catalog, D as categories, ee as retailers };
