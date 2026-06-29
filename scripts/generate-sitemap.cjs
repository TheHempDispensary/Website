/**
 * generate-sitemap.cjs
 *
 * Fetches all product slugs from the THD inventory API and writes
 * public/sitemap.xml with static pages + one entry per product.
 *
 * Exclusions match robots.txt: no query-string URLs, no /checkout,
 * /account, /cart, /games. Deduplicates all URLs. Uses product
 * modified_time for lastmod when available.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_BASE = "https://thd-inventory-api.fly.dev";
const PRODUCTS_ENDPOINT = `${API_BASE}/api/ecommerce/products?limit=1000`;
const SITE = "https://www.thehempdispensary.com";
const OUT = path.join(__dirname, "..", "public", "sitemap.xml");

const today = new Date().toISOString().slice(0, 10);

// Paths excluded from sitemap (mirrors robots.txt Disallow + utility pages)
const EXCLUDED_PATHS = new Set([
  "/checkout",
  "/account",
  "/cart",
  "/games",
  "/shipping-policy",
]);

// Query string patterns that must never appear in sitemap URLs
const EXCLUDED_QUERY_PATTERNS = [
  "store-page=",
  "cs=",
  "cst=",
  "cp=",
  "sa=",
  "sbp=",
  "q=",
  "ref=",
];

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/products", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/flower", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/edibles", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/concentrates", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/vapor", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/tinctures", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/topicals", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/accessories", priority: "0.9", changefreq: "weekly" },
  { loc: "/products/apparel", priority: "0.8", changefreq: "weekly" },
  { loc: "/products/packaging", priority: "0.8", changefreq: "weekly" },
  { loc: "/wholesale", priority: "0.8", changefreq: "weekly" },
  { loc: "/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/thca", priority: "0.8", changefreq: "weekly" },
  { loc: "/delta-8", priority: "0.8", changefreq: "weekly" },
  { loc: "/delta-9", priority: "0.8", changefreq: "weekly" },
  { loc: "/cbd", priority: "0.8", changefreq: "weekly" },
  { loc: "/cbg", priority: "0.8", changefreq: "weekly" },
  { loc: "/cbn", priority: "0.8", changefreq: "weekly" },
  { loc: "/our-locations", priority: "0.7", changefreq: "monthly" },
  { loc: "/contact", priority: "0.6", changefreq: "monthly" },
  { loc: "/shipping", priority: "0.6", changefreq: "monthly" },
  { loc: "/loyalty", priority: "0.6", changefreq: "monthly" },
  { loc: "/lab-results", priority: "0.6", changefreq: "weekly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function isExcluded(loc) {
  // Exclude paths in the blocklist
  const cleanPath = loc.split("?")[0].replace(/\/+$/, "") || "/";
  if (EXCLUDED_PATHS.has(cleanPath)) return true;
  // Exclude any URL with blocked query parameters
  if (EXCLUDED_QUERY_PATTERNS.some((pat) => loc.includes(pat))) return true;
  // Exclude /products/pages/ (legacy pagination)
  if (cleanPath.includes("/products/pages/")) return true;
  return false;
}

function canonicalizeLoc(loc) {
  // Strip query strings, trailing slashes, lowercase
  let clean = loc.split("?")[0];
  clean = clean.replace(/\/+$/, "") || "/";
  return clean;
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry({ loc, priority, changefreq, lastmod }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(SITE + loc)}</loc>`,
    `    <lastmod>${lastmod || today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function buildXml(products) {
  const seen = new Set();
  const entries = [];

  function addEntry(entry) {
    const key = canonicalizeLoc(entry.loc);
    if (seen.has(key)) return;
    if (isExcluded(entry.loc)) return;
    seen.add(key);
    entries.push(urlEntry({ ...entry, loc: key }));
  }

  // Static pages
  for (const page of STATIC_PAGES) {
    addEntry(page);
  }

  // Product pages — use modified_time for lastmod
  for (const product of products) {
    if (!product.slug) continue;
    const lastmod = product.modified_time
      ? new Date(product.modified_time).toISOString().slice(0, 10)
      : today;
    addEntry({
      loc: `/products/product/${product.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod,
    });
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

function fetchProducts() {
  return new Promise((resolve) => {
    const req = https.get(PRODUCTS_ENDPOINT, { timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("error", (err) => {
        console.warn(
          `[sitemap] Response stream error: ${err.message} — generating static-only sitemap`
        );
        resolve([]);
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const products = (json.products || []).filter(
            (p) => p.slug && p.available !== false
          );
          console.log(
            `[sitemap] Fetched ${products.length} product slugs from API`
          );
          resolve(products);
        } catch (err) {
          console.warn(
            `[sitemap] Failed to parse API response: ${err.message}`
          );
          resolve([]);
        }
      });
    });

    req.on("error", (err) => {
      console.warn(
        `[sitemap] API unreachable: ${err.message} — generating static-only sitemap`
      );
      resolve([]);
    });

    req.on("timeout", () => {
      console.warn(
        "[sitemap] API request timed out — generating static-only sitemap"
      );
      req.destroy();
      resolve([]);
    });
  });
}

async function main() {
  const products = await fetchProducts();
  const xml = buildXml(products);
  fs.writeFileSync(OUT, xml, "utf8");
  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`[sitemap] Wrote ${OUT} (${urlCount} URLs, deduplicated)`);
}

main();
