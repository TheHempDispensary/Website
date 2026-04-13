/**
 * generate-sitemap.cjs
 *
 * Fetches all product slugs from the THD inventory API and writes
 * public/sitemap.xml with static pages + one entry per product.
 *
 * Graceful fallback: if the API is unreachable the sitemap is still
 * generated with static pages only, and the script exits 0 so the
 * build continues.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_BASE = "https://thd-inventory-api.fly.dev";
const PRODUCTS_ENDPOINT = `${API_BASE}/api/ecommerce/products?limit=1000`;
const SITE = "https://www.thehempdispensary.com";
const OUT = path.join(__dirname, "..", "public", "sitemap.xml");

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/shop", priority: "0.9", changefreq: "weekly" },
  { loc: "/shop/flower", priority: "0.9", changefreq: "weekly" },
  { loc: "/shop/edibles", priority: "0.9", changefreq: "weekly" },
  { loc: "/shop/concentrates", priority: "0.9", changefreq: "weekly" },
  { loc: "/shop/vapes", priority: "0.9", changefreq: "weekly" },
  { loc: "/shop/tinctures", priority: "0.9", changefreq: "weekly" },
  { loc: "/shop/topicals", priority: "0.9", changefreq: "weekly" },
  { loc: "/shop/accessories", priority: "0.9", changefreq: "weekly" },
  { loc: "/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/on-sale", priority: "0.8", changefreq: "weekly" },
  { loc: "/exotic_thca_flower", priority: "0.8", changefreq: "weekly" },
];

function urlEntry({ loc, priority, changefreq, lastmod }) {
  return [
    "  <url>",
    `    <loc>${SITE}${loc}</loc>`,
    `    <lastmod>${lastmod || today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function buildXml(productSlugs) {
  const entries = [];

  // Static pages
  for (const page of STATIC_PAGES) {
    entries.push(urlEntry(page));
  }

  // Product pages
  for (const slug of productSlugs) {
    entries.push(
      urlEntry({
        loc: `/shop/product/${slug}`,
        priority: "0.8",
        changefreq: "weekly",
      })
    );
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
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const slugs = (json.products || [])
            .map((p) => p.slug)
            .filter(Boolean);
          console.log(`[sitemap] Fetched ${slugs.length} product slugs from API`);
          resolve(slugs);
        } catch (err) {
          console.warn(`[sitemap] Failed to parse API response: ${err.message}`);
          resolve([]);
        }
      });
    });

    req.on("error", (err) => {
      console.warn(`[sitemap] API unreachable: ${err.message} — generating static-only sitemap`);
      resolve([]);
    });

    req.on("timeout", () => {
      console.warn("[sitemap] API request timed out — generating static-only sitemap");
      req.destroy();
      resolve([]);
    });
  });
}

async function main() {
  const slugs = await fetchProducts();
  const xml = buildXml(slugs);
  fs.writeFileSync(OUT, xml, "utf8");
  const urlCount = STATIC_PAGES.length + slugs.length;
  console.log(`[sitemap] Wrote ${OUT} (${urlCount} URLs)`);
}

main();
