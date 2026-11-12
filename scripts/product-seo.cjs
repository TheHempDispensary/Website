/**
 * Clean product names and descriptions for search results.
 * Mirrors seoProductName / seoProductDescription / seoProductTitle in src/App.tsx.
 */
const UPPER = /\b(CBC|CBD|CBG|CBN|CBT|THC|HHC|OG|GMO|XL|XXL|2XL|THD|LED|UFO|RS11|FF1|MK|CR|XIII|LTR)\b/gi;
const SPECIAL = { thca: "THCa", thcv: "THCv", thcp: "THCp", cbda: "CBDa" };

function seoProductName(raw) {
  let s = String(raw || "").replace(/\s*Batch\s+\d{6,}-\d+/gi, "").replace(/\s{2,}/g, " ").trim();
  s = s.toLowerCase().replace(/(^|[\s\/(\-"])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  s = s.replace(UPPER, (m) => m.toUpperCase());
  s = s.replace(/\b(thca|thcv|thcp|cbda)\b/gi, (m) => SPECIAL[m.toLowerCase()]);
  s = s.replace(/\b(\d+(?:\.\d+)?)\s?(mg|ml|oz|g|mm|pk|d)\b/gi, (m, n, u) => n + u.toLowerCase());
  return s;
}

function seoProductTitle(name, cat) {
  const full = `${name} - ${cat} - The Hemp Dispensary`;
  if (full.length <= 65) return full;
  const short = `${name} | The Hemp Dispensary`;
  return short.length <= 70 ? short : name;
}

function decodeEntities(s) {
  return s.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'").replace(/&reg;/gi, "®").replace(/&trade;/gi, "™")
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
}

/** Plain text of a product description: no HTML, entities, "Description :" label or leading shipping notice. */
function cleanProductText(raw) {
  let s = decodeEntities(decodeEntities(String(raw || "")));
  s = s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^\*[^.]*\.(\s*[A-Z][A-Z ,]*\.)*\s*/, ""); // leading "*PRODUCTS CONTAINING BATTERIES..." shipping notice
  return s.replace(/^(product\s+)?description\s*:\s*/i, "").trim();
}

function seoProductDescription(raw, name) {
  let s = cleanProductText(raw);
  if (s.length > 155) {
    const cut = s.slice(0, 153);
    s = cut.slice(0, Math.max(cut.lastIndexOf(" "), 100)).replace(/[\s,;:|–—-]+$/, "") + "…";
  }
  if (s.length < 50) {
    const tail = `${name} at The Hemp Dispensary in Spring Hill, FL. Order for pickup or shipping.`;
    s = s ? `${s.replace(/[.\s]+$/, "")}. ${tail}` : tail;
    if (s.length > 160) s = tail;
  }
  return s;
}

module.exports = { seoProductName, seoProductTitle, seoProductDescription, cleanProductText };
