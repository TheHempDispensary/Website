/**
 * prerender.cjs — Option B pre-rendering
 *
 * After `vite build`, this script injects route-specific meta tags,
 * visible <h1>, body copy, canonical URLs, and JSON-LD structured data
 * into static HTML snapshots for the top routes so Google's crawler
 * sees meaningful content on the initial HTML response.
 *
 * React hydrates on top and replaces the prerender shell seamlessly.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const API_BASE = "https://thd-inventory-api.fly.dev";
const SITE = "https://www.thehempdispensary.com";

// ─── Route metadata (mirrors PAGE_META in App.tsx) ──────────────────────

const ROUTE_META = {
  "/": {
    title: "Florida Hemp & THCA Dispensary - The Hemp Dispensary",
    description: "Lab-tested THCA flower, edibles & concentrates. 2 Spring Hill FL stores + nationwide shipping. Ready in 5 min.",
    h1: "Florida Hemp & THCA Dispensary",
    body: "The Hemp Dispensary is Spring Hill Florida's trusted hemp store. We carry over 500 lab-tested products including THCA flower, Delta-8, Delta-9 edibles, CBD tinctures, concentrates, vapes, topicals, and accessories. Founded in 2019 by Anthoney and Jimmy, we survived the 2024 FDACS reversal and continue operating two Spring Hill locations. Every product comes with a Certificate of Analysis (COA) from independent labs. Shop online for nationwide shipping or pick up in-store in as little as 5 minutes. Open daily at both Spring Hill West (6175 Deltona Blvd) and Spring Hill East (14312 Spring Hill Dr). We offer a loyalty rewards program, wholesale pricing, and local delivery. Whether you're looking for premium indoor flower, live rosin concentrates, or sleep-focused CBN gummies, The Hemp Dispensary has what you need. All products are federally compliant under the 2018 Farm Bill and Florida hemp regulations.",
  },
  "/products": {
    title: "Shop Hemp & THCA Products - The Hemp Dispensary FL",
    description: "Browse 500+ lab-tested THCA, \u03948, \u03949, kratom & mushroom products. Florida-compliant. Ship to all 50 states.",
    h1: "Shop Hemp & THCA Products",
    body: "Browse our full catalog of over 500 lab-tested hemp products. Filter by category: flower, edibles, concentrates, vapes, tinctures, topicals, accessories, and apparel. Every product is tested by independent laboratories with full panel COAs available. We ship to all 50 states and offer 5-minute in-store pickup at our Spring Hill FL locations. Sort by price, popularity, or effect — find products for sleep, energy, focus, or relaxation. THCA flower starts at $20, edibles from $10, and concentrates from $30. All products comply with the 2018 Farm Bill and Florida hemp law. First-time customers save 10% with code FIRST10.",
  },
  "/products/flower": {
    title: "THCA Flower - Lab-Tested Indoor & Greenhouse - Hemp Dispensary",
    description: "Premium THCA flower strains from $20. Full panel COAs. Ships nationwide. Pick up in Spring Hill FL today.",
    h1: "THCA Flower",
    body: "Shop our selection of premium THCA flower strains. We carry indoor, greenhouse, and outdoor tiers including Everyday, Premium, Essential, Smalls, and Snowcaps. Every strain comes with a full panel Certificate of Analysis (COA) testing for cannabinoids, terpenes, heavy metals, pesticides, and microbials. Popular strains include Apples & Bananas, Gelato, Runtz, and Zkittlez. Prices start at $20 for Everyday tier and range up to premium indoor selections. Available in 1g, 3.5g, 7g, 14g, and 28g sizes with volume discounts on larger quantities. Ships nationwide or pick up in as little as 5 minutes at our Spring Hill FL stores. All flower is federally compliant with less than 0.3% Delta-9 THC by dry weight.",
  },
  "/products/edibles": {
    title: "THC Edibles & Gummies - Florida-Compliant - Hemp Dispensary",
    description: "\u03949 THC gummies, chocolates & drinks. Lab-tested, FL hemp law compliant. Same-day pickup or nationwide shipping.",
    h1: "THC Edibles & Gummies",
    body: "Shop hemp-derived THC edibles including Delta-9 gummies, chocolates, drinks, and CBN sleep chews. All edibles are lab-tested and comply with Florida hemp regulations and the 2018 Farm Bill. Choose from a variety of effects: relaxation, sleep, energy, and focus. Popular brands and flavors available in various potencies. Gummies start at $10 and come in fruit variety packs, sour options, and specialty blends. COA available for every batch. Same-day pickup at our Spring Hill FL stores or nationwide shipping. Must be 21+ to purchase.",
  },
  "/products/concentrates": {
    title: "Hemp Concentrates: Dabs, Rosin, Diamonds - Hemp Dispensary",
    description: "THCA diamonds, live rosin, badder & sauce. Lab-tested concentrates from $30. FL hemp dispensary.",
    h1: "Hemp Concentrates",
    body: "Premium hemp concentrates including THCA diamonds, live rosin, badder, sauce, shatter, and wax. Both solventless and hydrocarbon extraction options available. Every concentrate is lab-tested with full panel COAs for cannabinoid potency, residual solvents, heavy metals, and pesticides. Prices start at $30 for 1 gram with volume discounts on larger sizes. Available for in-store pickup at our Spring Hill FL locations or nationwide shipping. Popular options include live rosin from top cultivators, diamond sauce for dabbing, and badder for versatile use. All concentrates are federally compliant hemp products.",
  },
  "/about": {
    title: "About Us - Florida Hemp Survivors Since 2019",
    description: "Founded by Anthoney & Jimmy. Survived the 2024 FDACS reversal. Two Spring Hill stores still standing.",
    h1: "About Us - Florida Hemp Survivors Since 2019",
    body: "The Hemp Dispensary was founded in 2019 by Anthoney and Jimmy, two Spring Hill locals who saw the potential of legal hemp after the 2018 Farm Bill. What started as a road trip idea grew into 15 locations across Florida. In 2024, the FDACS reversal forced us to close 13 stores overnight. But we didn't give up. Today, our two remaining Spring Hill locations — West (6175 Deltona Blvd) and East (14312 Spring Hill Dr) — continue serving the community with the same commitment to quality, transparency, and lab-tested products that built our reputation. We have over 6,000 Google reviews with a 4.8 average rating. Every product we sell comes with a Certificate of Analysis from an independent lab.",
  },
  "/lab-results": {
    title: "Lab Results & COAs - Every Product Tested - Hemp Dispensary",
    description: "Full panel certificates of analysis for every THCA, \u03948, and \u03949 product we sell. Updated weekly.",
    h1: "Lab Results & Certificates of Analysis",
    body: "At The Hemp Dispensary, every product we sell is independently lab-tested with full panel Certificates of Analysis (COAs). Our COAs test for cannabinoid potency (THCA, Delta-8, Delta-9, CBD, CBG, CBN), terpene profiles, heavy metals, pesticides, residual solvents, and microbial contaminants. We update our lab results weekly as new batches arrive. Transparency is central to our business — we believe you deserve to know exactly what's in the products you consume. Click on any product in our store to view its specific COA. If you have questions about our testing standards or need a COA for a specific batch, contact us and we'll provide it.",
  },
  "/contact": {
    title: "Contact Us | The Hemp Dispensary - Spring Hill, FL",
    description: "Get in touch with The Hemp Dispensary. Visit us at our Spring Hill locations, call, email, or reach out online.",
    h1: "Contact Us",
    body: "Get in touch with The Hemp Dispensary. Visit our Spring Hill West location at 6175 Deltona Blvd, Suite 104, Spring Hill, FL 34606 — call (352) 340-5860. Or visit Spring Hill East at 14312 Spring Hill Dr, Spring Hill, FL 34609 — call (352) 515-5370. Both locations are open daily. Email us at support@thehempdispensary.com for questions about products, orders, wholesale inquiries, or general support. Follow us on social media for the latest product drops, promotions, and community events.",
  },
  "/our-locations": {
    title: "Store Locations | The Hemp Dispensary - Spring Hill, FL",
    description: "Find The Hemp Dispensary near you. Two Spring Hill, FL locations with daily hours and 5-minute pickup.",
    h1: "Our Store Locations",
    body: "The Hemp Dispensary has two Spring Hill, Florida locations. Spring Hill West at 6175 Deltona Blvd, Suite 104, Spring Hill, FL 34606 is open daily 9am to 10pm. Phone: (352) 340-5860. Spring Hill East at 14312 Spring Hill Dr, Spring Hill, FL 34609 is open daily 7am to 10pm. Phone: (352) 515-5370. Both locations offer 5-minute in-store pickup for online orders, a full selection of lab-tested hemp products, knowledgeable staff, and a welcoming atmosphere. Stop by to browse our flower, edibles, concentrates, vapes, and more.",
  },
  "/wholesale": {
    title: "Bulk Bargains - Wholesale Pricing | The Hemp Dispensary",
    description: "Bulk Bargains at The Hemp Dispensary — wholesale pricing on vape cartridges, edibles, flower, and more. Mix and match flavors, submit your order, and pay via invoice.",
    h1: "Bulk Bargains - Wholesale Pricing",
    body: "Save big with our Bulk Bargains wholesale pricing. Buy in quantity and get steep discounts on vape cartridges, edibles, flower, concentrates, and more. Mix and match flavors and strains within each deal. Submit your order through our wholesale form and pay via invoice. Perfect for retailers, smoke shops, and high-volume consumers. All products are lab-tested with COAs available. Contact us for custom wholesale arrangements.",
  },
  "/shipping": {
    title: "Shipping & Pickup Info | The Hemp Dispensary",
    description: "Shipping and pickup information for The Hemp Dispensary. 5-minute in-store pickup, next-day local delivery, and nationwide shipping.",
    h1: "Shipping & Pickup Information",
    body: "The Hemp Dispensary offers multiple fulfillment options. In-store pickup is available at both Spring Hill locations — your order is ready in as little as 5 minutes. We also offer next-day local delivery within the Spring Hill area. For nationwide shipping, orders are processed and shipped within 1-2 business days via USPS or UPS. All shipments are discreetly packaged. Shipping is available to all 50 states for federally compliant hemp products. Free shipping on orders over $75.",
  },
  "/loyalty": {
    title: "Hemp Rewards - Loyalty Program | The Hemp Dispensary",
    description: "Hemp Rewards — earn points on every purchase, unlock VIP tiers, and redeem for discounts. Join the loyalty program at The Hemp Dispensary.",
    h1: "Hemp Rewards Loyalty Program",
    body: "Join Hemp Rewards and earn points on every purchase at The Hemp Dispensary. Earn 1 point per dollar spent, unlock VIP tiers for bonus multipliers, and redeem points for discounts on future orders. Track your points and tier status through your account. Our loyalty program rewards our most valued customers with exclusive perks, early access to new products, and special member-only promotions.",
  },
  "/thca": {
    title: "THCA Products | The Hemp Dispensary - Spring Hill, FL",
    description: "Shop THCA flower, pre-rolls, concentrates, and vapes at The Hemp Dispensary in Spring Hill, FL. Federally compliant hemp, lab-tested, COA available on every product.",
    h1: "THCA Products",
    body: "Shop our full selection of THCA products at The Hemp Dispensary. THCA (tetrahydrocannabinolic acid) is the naturally occurring precursor to THC found in raw hemp flower. Our THCA products include premium flower strains, pre-rolls, concentrates, and vape cartridges. Every product is independently lab-tested with full panel COAs. All products are federally compliant under the 2018 Farm Bill with less than 0.3% Delta-9 THC by dry weight. Available for in-store pickup at our Spring Hill FL locations or nationwide shipping.",
  },
  "/delta-8": {
    title: "Delta-8 THC Products | The Hemp Dispensary",
    description: "Shop Delta-8 THC flower, gummies, vapes, wax, and tinctures at The Hemp Dispensary in Spring Hill, FL. Lab-tested, federally compliant hemp products.",
    h1: "Delta-8 THC Products",
    body: "Browse Delta-8 THC products at The Hemp Dispensary including flower, gummies, vape cartridges, wax, and tinctures. Delta-8 THC is a hemp-derived cannabinoid known for a milder, clearer experience compared to Delta-9. All our Delta-8 products are lab-tested with COAs for potency and purity. Federally compliant under the 2018 Farm Bill. Available at our Spring Hill FL stores or via nationwide shipping.",
  },
  "/delta-9": {
    title: "Delta-9 THC Products | The Hemp Dispensary",
    description: "Shop hemp-derived Delta-9 THC edibles, beverages, and tinctures at The Hemp Dispensary in Spring Hill, FL. Lab-tested, compliant with Florida hemp regulations.",
    h1: "Delta-9 THC Products",
    body: "Shop hemp-derived Delta-9 THC edibles, beverages, and tinctures. All products contain less than 0.3% Delta-9 THC by dry weight, making them federally compliant under the 2018 Farm Bill and Florida hemp law. Lab-tested with full panel COAs. Popular options include gummies, chocolates, and drinks in various potencies and flavors. Available for pickup at our Spring Hill FL locations or nationwide shipping.",
  },
  "/cbd": {
    title: "CBD Products | The Hemp Dispensary",
    description: "Shop CBD tinctures, topicals, edibles, and flower at The Hemp Dispensary in Spring Hill, FL. Full-spectrum, broad-spectrum, and isolate options. Lab-tested.",
    h1: "CBD Products",
    body: "Shop CBD products at The Hemp Dispensary including tinctures, topicals, edibles, and flower. Available in full-spectrum, broad-spectrum, and isolate formulations. CBD (cannabidiol) is known for its wellness benefits without the psychoactive effects. All products are lab-tested with COAs. Choose from oils, creams, balms, gummies, and more. Available at our Spring Hill FL stores or via nationwide shipping.",
  },
  "/cbg": {
    title: "CBG Products | The Hemp Dispensary",
    description: "Shop CBG tinctures, wax, gummies, and flower at The Hemp Dispensary in Spring Hill, FL. The mother cannabinoid, lab-tested and federally compliant.",
    h1: "CBG Products",
    body: "Shop CBG products at The Hemp Dispensary. CBG (cannabigerol) is known as the 'mother cannabinoid' because it's the precursor from which other cannabinoids are synthesized. Our CBG products include tinctures, wax, gummies, and flower. All products are lab-tested with full panel COAs. Federally compliant under the 2018 Farm Bill. Available at our Spring Hill FL stores or via nationwide shipping.",
  },
  "/cbn": {
    title: "CBN Products | The Hemp Dispensary",
    description: "Shop CBN gummies, tinctures, and nighttime blends at The Hemp Dispensary in Spring Hill, FL. Formulated for relaxation and sleep. Lab-tested.",
    h1: "CBN Products",
    body: "Shop CBN products at The Hemp Dispensary. CBN (cannabinol) is known for its relaxation and sleep-promoting properties. Our CBN products include gummies, tinctures, and nighttime blends formulated to support restful sleep. All products are lab-tested with COAs. Perfect for those seeking natural sleep support. Available at our Spring Hill FL stores or via nationwide shipping.",
  },
};

// ─── JSON-LD Structured Data ────────────────────────────────────────────

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Hemp Dispensary",
  url: "https://www.thehempdispensary.com",
  logo: "https://www.thehempdispensary.com/logo.webp",
  description: "Lab-tested THCA flower, edibles & concentrates. 2 Spring Hill FL stores + nationwide shipping.",
  foundingDate: "2019",
  founders: [
    { "@type": "Person", name: "Anthoney" },
    { "@type": "Person", name: "Jimmy" },
  ],
  address: [
    {
      "@type": "PostalAddress",
      streetAddress: "6175 Deltona Blvd, Suite 104",
      addressLocality: "Spring Hill",
      addressRegion: "FL",
      postalCode: "34606",
      addressCountry: "US",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "14312 Spring Hill Dr",
      addressLocality: "Spring Hill",
      addressRegion: "FL",
      postalCode: "34609",
      addressCountry: "US",
    },
  ],
  sameAs: [
    "https://www.google.com/maps/search/The+Hemp+Dispensary+Spring+Hill+West",
    "https://www.google.com/maps/search/The+Hemp+Dispensary+Spring+Hill+East",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "6000",
    bestRating: "5",
    worstRating: "1",
  },
};

function buildCategoryJsonLd(routePath, title) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Products", item: SITE + "/products" },
    ],
  };
  if (routePath !== "/products") {
    breadcrumb.itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: title,
      item: SITE + routePath,
    });
  }
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: SITE + routePath,
    isPartOf: { "@type": "WebSite", url: SITE + "/" },
  };
  return [breadcrumb, collection];
}

function buildProductJsonLd(product) {
  const canonical = `${SITE}/products/product/${product.slug}`;
  const name =
    (product.online_name || product.name)
      .replace(/\s{2,}/g, " ")
      .trim();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name,
    url: canonical,
    description: (product.description || "").slice(0, 500),
    brand: { "@type": "Brand", name: "The Hemp Dispensary" },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "USD",
      price: (product.price / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "The Hemp Dispensary" },
    },
  };
  if (product.image_url) schema.image = product.image_url;
  if (product.categories && product.categories.length > 0) {
    schema.category = product.categories[0];
  }
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Products", item: SITE + "/products" },
    ],
  };
  if (product.categories && product.categories[0]) {
    breadcrumb.itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: product.categories[0],
      item: SITE + "/products/" + product.categories[0].toLowerCase(),
    });
    breadcrumb.itemListElement.push({
      "@type": "ListItem",
      position: 4,
      name: name,
      item: canonical,
    });
  } else {
    breadcrumb.itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: name,
      item: canonical,
    });
  }
  return [schema, breadcrumb];
}

// ─── HTML Injection ─────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectIntoHtml(baseHtml, { title, description, canonical, h1, body, jsonLdBlocks }) {
  let html = baseHtml;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${escapeHtml(canonical)}"`
  );

  // Replace og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`
  );

  // Replace og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );

  // Replace og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );

  // Build JSON-LD script tags
  const jsonLdHtml = jsonLdBlocks
    .map((block) => `<script type="application/ld+json">${JSON.stringify(block)}</script>`)
    .join("\n    ");

  // Inject JSON-LD before </head>
  html = html.replace("</head>", `    ${jsonLdHtml}\n  </head>`);

  // Inject prerender content into the #root div
  // The loading shell is kept but SEO content is added before it
  const prerenderContent =
    `<div id="prerender-shell"><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(body)}</p></div>`;

  html = html.replace(
    /(<div id="root">)/,
    `$1\n      ${prerenderContent}`
  );

  return html;
}

// ─── API Fetch ──────────────────────────────────────────────────────────

function fetchProducts() {
  return new Promise((resolve) => {
    const req = https.get(
      `${API_BASE}/api/ecommerce/products?limit=1000`,
      { timeout: 15000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("error", () => resolve([]));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.products || []);
          } catch {
            resolve([]);
          }
        });
      }
    );
    req.on("error", () => resolve([]));
    req.on("timeout", () => { req.destroy(); resolve([]); });
  });
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const indexPath = path.join(DIST, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("[prerender] dist/index.html not found — run vite build first");
    process.exit(1);
  }
  const baseHtml = fs.readFileSync(indexPath, "utf8");
  let prerendered = 0;

  // Pre-render static routes
  const categoryRoutes = ["/products", "/products/flower", "/products/edibles", "/products/concentrates"];
  for (const [routePath, meta] of Object.entries(ROUTE_META)) {
    const canonical = routePath === "/" ? SITE + "/" : SITE + routePath;
    const jsonLdBlocks = [ORG_JSONLD];

    // Add category-specific JSON-LD
    if (categoryRoutes.includes(routePath)) {
      jsonLdBlocks.push(...buildCategoryJsonLd(routePath, meta.h1));
    }

    const html = injectIntoHtml(baseHtml, {
      title: meta.title,
      description: meta.description,
      canonical,
      h1: meta.h1,
      body: meta.body,
      jsonLdBlocks,
    });

    // Write to dist/<path>/index.html
    const outDir = routePath === "/" ? DIST : path.join(DIST, routePath);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
    prerendered++;
  }

  // Pre-render top product pages
  console.log("[prerender] Fetching products from API...");
  const products = await fetchProducts();
  const available = products
    .filter((p) => p.slug && p.stock > 0 && p.available !== false)
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 50);

  console.log(`[prerender] Pre-rendering ${available.length} product pages...`);
  for (const product of available) {
    const routePath = `/products/product/${product.slug}`;
    const canonical = SITE + routePath;
    const name = (product.online_name || product.name).replace(/\s{2,}/g, " ").trim();
    const cat = (product.categories && product.categories[0]) || "Products";
    const title = `${name} - ${cat} - The Hemp Dispensary`;
    const desc = product.description
      ? product.description.slice(0, 155).replace(/\s+/g, " ").trim()
      : `${name} — lab-tested hemp product at The Hemp Dispensary. Available for pickup or shipping.`;

    const priceFmt = "$" + (product.price / 100).toFixed(2);
    const body = [
      name,
      `Category: ${cat}`,
      `Price: ${priceFmt}`,
      product.stock > 0 ? "In Stock" : "Out of Stock",
      product.description || "",
      product.lab_results && product.lab_results.length > 0
        ? `COA available — ${product.lab_results.length} lab result(s) on file.`
        : "Lab-tested with Certificate of Analysis available.",
      "Available at The Hemp Dispensary — 2 Spring Hill FL locations + nationwide shipping.",
    ]
      .filter(Boolean)
      .join(". ");

    const jsonLdBlocks = [ORG_JSONLD, ...buildProductJsonLd(product)];

    const html = injectIntoHtml(baseHtml, {
      title,
      description: desc,
      canonical,
      h1: name,
      body,
      jsonLdBlocks,
    });

    const outDir = path.join(DIST, routePath);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
    prerendered++;
  }

  console.log(`[prerender] Done — ${prerendered} pages pre-rendered`);
}

main().catch((err) => {
  console.error("[prerender] Fatal error:", err);
  process.exit(1);
});
