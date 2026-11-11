/**
 * Which catalog items get a public product page and a sitemap entry.
 *
 * - Sold-out items KEEP their page (shown as "Out of Stock") so Google doesn't
 *   drop and re-discover them every time stock hits zero. Clover's auto-manage
 *   flips `available` to false when stock reaches 0, so that alone doesn't
 *   mean "hidden".
 * - In stock but switched off in Clover = deliberately hidden (e.g. butane): no page.
 * - In-store-only items and fee line items never get a page.
 * - Items no longer in the catalog at all still 404, which is correct for
 *   discontinued products.
 */
const NOT_A_PRODUCT = [
  /^\$\s*\d+\s*dab$/i,      // "$5 DAB": in-store dab, never sold online
  /^ground shipping$/i,     // shipping fee line item
  /delivery\s*up-?charge/i, // delivery fee line item
];

function isPublicProduct(p) {
  if (!p || !p.slug || /[#?]/.test(p.slug)) return false;
  const name = String(p.online_name || p.name || "").trim();
  if (NOT_A_PRODUCT.some((re) => re.test(name))) return false;
  if (p.is_gift_card) return true;
  const inStock = Number(p.stock) > 0;
  if (inStock && p.available === false) return false; // hidden on purpose
  return true;
}

module.exports = { isPublicProduct, NOT_A_PRODUCT };
