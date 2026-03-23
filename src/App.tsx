import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, ShoppingCart, Package, X, ArrowLeft, MapPin, Clock, Phone, Mail, Star, Plus, Minus, Trash2, CheckCircle, Truck, CreditCard, Lock, AlertCircle, User, Gift, Gamepad2, ChevronRight, Shield, Zap, MessageCircle, Send, Leaf, Candy, Droplets, Wind, Pipette, Pill, Wrench, Award, TrendingUp, Users, Cake, Crown, ChevronDown, ChevronUp, Calendar, Instagram, Heart, DollarSign, Target } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Clover: any;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const CLOVER_PAKMS_KEY = "2a720977884442c0c638b21b7746bfc1";
const CLOVER_MERCHANT_ID = "XD21MGSEBV081";

interface CartItem {
  product: Product;
  quantity: number;
}

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem("hemp-cart");
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("hemp-cart", JSON.stringify(cart));
}

const API_URL = import.meta.env.VITE_API_URL || "https://thd-inventory-api.fly.dev";
const LOYALTY_API_URL = API_URL;

interface Product {
  id: string;
  name: string;
  online_name: string;
  slug: string;
  sku: string;
  price: number;
  description: string;
  categories: string[];
  stock: number;
  available: boolean;
  image_url: string | null;
  is_age_restricted: boolean;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  categories: string[];
}

function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return hash;
}

function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatPrice(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

/* Unsplash fallback images for accessory products without real photos */
/* TODO: Replace these Unsplash stand-ins with real product photos when available */
const ACCESSORY_PLACEHOLDER_IMAGES: Record<string, string> = {
  "butane": "https://images.unsplash.com/photo-1605542484282-6e2d79b74f8f?w=400&h=400&fit=crop",
  "lighter": "https://images.unsplash.com/photo-1605542484282-6e2d79b74f8f?w=400&h=400&fit=crop",
  "ignitus": "https://images.unsplash.com/photo-1605542484282-6e2d79b74f8f?w=400&h=400&fit=crop",
  "pipe": "https://images.unsplash.com/photo-1560024802-ec901e5abd1a?w=400&h=400&fit=crop",
  "glass": "https://images.unsplash.com/photo-1560024802-ec901e5abd1a?w=400&h=400&fit=crop",
  "grinder": "https://images.unsplash.com/photo-1616690002498-1435060a1948?w=400&h=400&fit=crop",
  "rolling": "https://images.unsplash.com/photo-1616690002498-1435060a1948?w=400&h=400&fit=crop",
  "tray": "https://images.unsplash.com/photo-1616690002498-1435060a1948?w=400&h=400&fit=crop",
};

function placeholderUrl(name: string, _size = 400): string {
  const nameLower = name.toLowerCase();
  for (const [keyword, url] of Object.entries(ACCESSORY_PLACEHOLDER_IMAGES)) {
    if (nameLower.includes(keyword)) return url;
  }
  return "/images/product-placeholder.webp";
}

/* ======================== HELPER: Product Effect Detection ======================== */
function getProductEffect(product: Product): { label: string; color: string; bg: string; icon: string } {
  const name = (product.name + " " + (product.description || "")).toLowerCase();
  if (name.includes("sleep") || name.includes("night") || name.includes("dream") || name.includes("rest") || name.includes("melatonin") || name.includes("cbn"))
    return { label: "Sleep", color: "#231F20", bg: "#ADD038", icon: "\u{1F634}" };
  if (name.includes("energy") || name.includes("focus") || name.includes("sativa") || name.includes("boost") || name.includes("uplift"))
    return { label: "Energy", color: "#231F20", bg: "#ADD038", icon: "\u26A1" };
  if (name.includes("focus") || name.includes("clarity") || name.includes("brain") || name.includes("mental"))
    return { label: "Focus", color: "#231F20", bg: "#ADD038", icon: "\u{1F9E0}" };
  return { label: "Relax", color: "#231F20", bg: "#ADD038", icon: "\u{1F60C}" };
}

function getProductStrength(product: Product): { label: string; color: string } {
  const price = product.price;
  if (price >= 5000) return { label: "High", color: "#FFCB08" };
  if (price >= 2000) return { label: "Medium", color: "#FFCB08" };
  return { label: "Low", color: "#B3D335" };
}

const LEAFLIFE_KEYWORDS = ["everyday", "premium", "essential", "smalls", "snowcaps"];
function isLeafLife(product: Product): boolean {
  const name = (product.online_name || product.name).toLowerCase();
  return LEAFLIFE_KEYWORDS.some(kw => name.includes(kw));
}

function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const PRODUCT_FALLBACK = "/images/product-placeholder.webp";

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.target as HTMLImageElement;
  if (!img.src.includes("product-placeholder")) {
    img.src = PRODUCT_FALLBACK;
  }
}

function imageSrcSet(url: string | null): string | undefined {
  if (!url || url.includes('product-placeholder')) return undefined;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}w=200 200w, ${url}${sep}w=400 400w, ${url}${sep}w=800 800w`;
}

function getProductBenefit(product: Product): string {
  const effect = getProductEffect(product);
  switch (effect.label) {
    case "Sleep": return "Promotes restful sleep and relaxation";
    case "Energy": return "Uplifting and energizing for your day";
    case "Focus": return "Enhances mental clarity and focus";
    default: return "Calming relief for body and mind";
  }
}


/* ======================== STICKY TOP BAR ======================== */
function StickyTopBar() {
  return (
    <div className="bg-[#231F20] text-[#FFFFFF] text-center py-2 px-4 text-sm font-medium">
      <span className="hidden sm:inline">{"\u{1F680}"} Order Online {"\u2013"} Ready In 5 Minutes | {"\u{1F4CD}"} Spring Hill | Open Late | </span>
      <span className="sm:hidden">{"\u{1F680}"} Ready In 5 Minutes | {"\u{1F4CD}"} Spring Hill | </span>
      <span className="text-[#FFCB08] font-bold">FIRST20 = 20% Off</span>
    </div>
  );
}

/* ======================== HEADER (Light Theme) ======================== */
function Header({ cartCount, onSearch, onCartOpen }: { cartCount: number; onSearch: () => void; onCartOpen: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const categories = ["FLOWER", "EDIBLES", "CONCENTRATES", "VAPOR", "TOPICALS", "TINCTURES", "ACCESSORIES"];

  return (
    <header className="bg-[#FFFFFF] sticky top-0 z-50 border-b border-[#231F20]/15 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[#231F20] hover:text-[#126A44] transition-colors" aria-label="Open navigation menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
            <button onClick={onSearch} className="p-2 text-[#231F20] hover:text-[#126A44] transition-colors" aria-label="Search products"><Search className="h-5 w-5" /></button>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(""); }} className="flex items-center flex-shrink-0">
            <img src="/logo.webp" alt="The Hemp Dispensary" className="h-10 sm:h-12 w-auto object-contain" width="120" height="48" />
          </a>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <a href="#/loyalty" className="p-1.5 sm:p-2 text-[#231F20] hover:text-[#126A44] transition-colors flex items-center gap-1" title="Hemp Rewards">
              <Gift className="h-5 w-5" />
              <span className="hidden md:inline text-xs font-medium">Rewards</span>
            </a>
            <a href="#/account" className="p-1.5 sm:p-2 text-[#231F20] hover:text-[#126A44] transition-colors" title="Account" aria-label="My account">
              <User className="h-5 w-5" />
            </a>
            <a href="#/games" className="hidden sm:flex p-2 text-[#231F20] hover:text-[#126A44] transition-colors items-center gap-1" title="Games">
              <Gamepad2 className="h-5 w-5" />
              <span className="hidden md:inline text-xs font-medium">Games</span>
            </a>
            <button onClick={onCartOpen} className="relative p-1.5 sm:p-2 text-[#231F20] hover:text-[#126A44] transition-colors" aria-label="View cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#B3D335] text-[#231F20] text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center justify-center gap-1 pb-2 overflow-x-auto">
          {categories.map((cat) => (
            <button key={cat} onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className="px-3 py-1.5 text-xs font-medium text-[#231F20] hover:text-[#126A44] hover:bg-[#FFFFFF] rounded-full transition-colors whitespace-nowrap">{cat}</button>
          ))}
        </nav>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-t border-[#231F20]/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => { navigate(`/shop/${cat.toLowerCase()}`); setMobileMenuOpen(false); }} className="text-left px-3 py-2.5 text-sm font-medium text-[#231F20] hover:text-[#126A44] hover:bg-[#FFFFFF] rounded-lg transition-colors">{cat}</button>
            ))}
            <a href="#/games" onClick={() => setMobileMenuOpen(false)} className="sm:hidden text-left px-3 py-2.5 text-sm font-medium text-[#231F20] hover:text-[#126A44] hover:bg-[#FFFFFF] rounded-lg transition-colors flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Games</a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ======================== CART DRAWER (Light Theme) ======================== */
function CartDrawer({ open, onClose, cart, onUpdateQty, onRemove, onClear }: { open: boolean; onClose: () => void; cart: CartItem[]; onUpdateQty: (id: string, qty: number) => void; onRemove: (id: string) => void; onClear: () => void }) {
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-[#231F20]/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#FFFFFF] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#231F20]/15">
          <h2 className="text-lg font-bold text-[#231F20]">Your Cart ({itemCount})</h2>
          <button onClick={onClose} className="p-2 text-[#231F20] hover:text-[#231F20] transition-colors"><X className="h-5 w-5" /></button>
        </div>
        {/* FIRST20 promo banner */}
        <div className="bg-[#FFCB08]/10 border-b border-[#FFCB08]/20 px-4 py-2 text-center">
          <p className="text-sm font-medium text-[#231F20]">{"\u{1F525}"} Use code <span className="font-bold text-[#126A44]">FIRST20</span> for 20% off your first order!</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-[#231F20] mb-3" />
              <p className="text-[#231F20]">Your cart is empty</p>
              <button onClick={() => { onClose(); navigate("/shop"); }} className="mt-4 text-[#126A44] hover:underline font-medium">Start Shopping</button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 bg-[#FFFFFF] rounded-xl p-3 border border-[#231F20]/10">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FFFFFF] flex-shrink-0 border border-[#231F20]/10">
                    <img src={item.product.image_url || placeholderUrl(item.product.name, 100)} alt={item.product.name} className="w-full h-full object-contain" width="64" height="64" loading="lazy" onError={handleImgError} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#231F20] truncate">{item.product.online_name || item.product.name}</h3>
                    <p className="text-[#126A44] font-bold text-sm">{formatPrice(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => onUpdateQty(item.product.id, item.quantity - 1)} className="p-1 text-[#231F20] hover:text-[#231F20]" aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm font-medium text-[#231F20] min-w-[1.5rem] text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.product.id, item.quantity + 1)} className="p-1 text-[#231F20] hover:text-[#231F20]" aria-label="Increase quantity"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => onRemove(item.product.id)} className="ml-auto p-1 text-[#231F20] hover:text-[#D9A32C]"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-[#231F20]/15 p-4 space-y-3">
            <div className="flex justify-between text-lg font-bold text-[#231F20]">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button onClick={() => { onClose(); navigate("/checkout"); }} className="w-full py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-semibold transition-colors text-lg">Checkout</button>
            <button onClick={onClear} className="w-full py-2 text-[#231F20] hover:text-[#D9A32C] text-sm transition-colors">Clear Cart</button>
          </div>
        )}
      </div>
    </div>
  );
}


/* ======================== HERO SECTION (Dark bg for contrast) ======================== */
function HeroSection() {
  return (
    <section className="bg-[#231F20] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-20 text-center relative z-10">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#FFFFFF] mb-3 leading-tight">
          Skip the Line.<br />
          <span className="text-[#B3D335]">Get Your Hemp in Minutes.</span>
        </h1>
        <p className="text-[#FFFFFF]/80 text-base sm:text-xl mb-6 max-w-2xl mx-auto">Fast pickup. Lab-tested. Trusted locally.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate("/shop")} className="px-8 py-3.5 sm:py-4 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-bold text-lg transition-colors shadow-lg">Shop Now</button>
          <button onClick={() => { const el = document.getElementById('locations-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else navigate('/contact'); }} className="px-8 py-3.5 sm:py-4 border-2 border-[#FFFFFF] hover:bg-[#FFFFFF] text-[#FFFFFF] hover:text-[#231F20] rounded-full font-bold text-lg transition-colors">Find Nearest Location</button>
        </div>
        <p className="mt-4 text-[#FFCB08] font-medium text-sm">{"\u{1F525}"} First-time customers: 20% OFF with code FIRST20</p>
      </div>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#231F20]/50 pointer-events-none" />
    </section>
  );
}

/* ======================== TRUST STRIP ======================== */
function TrustStrip() {
  const items = [
    { icon: Shield, label: "Lab Tested", sub: "Clean & Safe" },
    { icon: MapPin, label: "2 Locations", sub: "Spring Hill, FL" },
    { icon: Zap, label: "Ready In 5 Minutes", sub: "Fast Pickup" },
    { icon: Clock, label: "Open Late", sub: "West Til 12am | East Til 10pm" },
  ];
  return (
    <section className="bg-[#FFFFFF] border-b border-[#231F20]/10 cursor-pointer" onClick={() => navigate('/shop')}>
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center">
              <item.icon className="h-5 w-5 text-[#3D8C32] mb-1" />
              <span className="text-xs sm:text-sm font-semibold text-[#231F20] leading-tight">{item.label}</span>
              <span className="text-[10px] sm:text-xs text-[#3D8C32] hidden sm:block">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================== SHOP BY CATEGORY ======================== */
function ShopByCategory({ productsByCategory }: { categories: string[]; productsByCategory: Record<string, Product[]> }) {
  const displayCats = ["Flower", "Edibles", "Concentrates", "Vapor", "Topicals", "Tinctures", "Accessories"].filter(c => {
    const prods = productsByCategory[c] || [];
    return prods.some(p => p.stock > 0);
  });
  if (displayCats.length === 0) return null;

  const catIconComponents: Record<string, React.ComponentType<{ className?: string }>> = { Flower: Leaf, Edibles: Candy, Concentrates: Droplets, Vapor: Wind, Topicals: Pipette, Tinctures: Pill, Accessories: Wrench };

  return (
    <section className="bg-[#FFFFFF] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#231F20] text-center mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {displayCats.map((cat) => {
            const IconComp = catIconComponents[cat] || Package;
            return (
            <button key={cat} onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className="bg-[#FFFFFF] rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg transition-all group border border-[#231F20]/15 hover:border-[#B3D335]">
              <IconComp className="h-10 w-10 text-[#3D8C32] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#231F20] group-hover:text-[#126A44] transition-colors">{cat}</h3>
              <p className="text-sm text-[#231F20] mt-1">{(productsByCategory[cat] || []).filter(p => p.stock > 0).length} products</p>
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ======================== SHOP BY FEELING ======================== */
function ShopByFeeling({ products }: { products: Product[] }) {
  const feelings = [
    { label: "Relax", icon: "\u{1F60C}", color: "#231F20", bg: "#FFFFFF", desc: "Calm your mind", keywords: ["relax", "calm", "chill", "indica", "hybrid"] },
    { label: "Sleep", icon: "\u{1F634}", color: "#231F20", bg: "#FFFFFF", desc: "Rest easy tonight", keywords: ["sleep", "night", "dream", "rest", "melatonin", "cbn"] },
    { label: "Energy", icon: "\u26A1", color: "#231F20", bg: "#FFFFFF", desc: "Power your day", keywords: ["energy", "sativa", "boost", "uplift"] },
    { label: "Focus", icon: "\u{1F9E0}", color: "#231F20", bg: "#FFFFFF", desc: "Sharpen your mind", keywords: ["focus", "clarity", "brain", "mental"] },
  ];

  return (
    <section className="bg-[#FFFFFF] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] text-center mb-2">How Do You Want to Feel?</h2>
        <p className="text-[#231F20] text-center mb-6 text-sm">Tap to browse products by effect</p>
        <div className="grid grid-cols-4 gap-3 sm:gap-6">
          {feelings.map((f) => {
            const count = products.filter(p => p.stock > 0 && getProductEffect(p).label === f.label).length;
            return (
              <button key={f.label} onClick={() => navigate(`/shop/${f.label.toLowerCase()}`)} className="rounded-2xl p-3 sm:p-6 text-center hover:shadow-lg transition-all group border border-[#231F20]/10 hover:border-[#B3D335]" style={{ backgroundColor: f.bg }}>
                <span className="text-2xl sm:text-4xl block mb-1 sm:mb-3">{f.icon}</span>
                <h3 className="text-sm sm:text-lg font-semibold text-[#231F20] group-hover:text-[#126A44] transition-colors">{f.label}</h3>
                <p className="text-xs text-[#231F20] mt-0.5 hidden sm:block">{f.desc}</p>
                {count > 0 && <p className="text-[10px] sm:text-xs text-[#3D8C32] mt-1">{count} items</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ======================== PROMO CTA BANNER ======================== */
function PromoBanner() {
  return (
    <section className="bg-[#231F20] py-8 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-[#FFCB08] font-bold text-lg sm:text-2xl mb-2">{"\u{1F525}"} First-Time Customer?</p>
        <p className="text-[#FFFFFF] text-sm sm:text-base mb-4">Get <span className="text-[#B3D335] font-bold">20% OFF</span> your entire order with code <span className="bg-[#FFFFFF]/10 px-2 py-0.5 rounded font-mono font-bold">FIRST20</span></p>
        <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-bold transition-colors">Shop Now &amp; Save</button>
      </div>
    </section>
  );
}


/* ======================== WHY CHOOSE US ======================== */
function WhyChooseUs() {
  const reasons = [
    { icon: Zap, text: "Ready In 5 Minutes" },
    { icon: MapPin, text: "2 Spring Hill Locations" },
    { icon: Shield, text: "Lab-Tested Clean Products" },
    { icon: Star, text: "Not Gas Station Quality" },
  ];
  return (
    <section className="bg-[#FFFFFF] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#231F20] text-center mb-2">{"\u26A1"} Why Shop With Us?</h2>
        <p className="text-[#231F20] text-center mb-8">Quality you can trust, speed you can count on</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {reasons.map((r) => (
            <div key={r.text} className="bg-[#FFFFFF] rounded-xl p-5 text-center border border-[#231F20]/10">
              <r.icon className="h-8 w-8 text-[#3D8C32] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#231F20]">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================== REVIEWS SECTION ======================== */
const GOOGLE_REVIEWS_URL = "https://www.google.com/search?q=The+Hemp+Dispensary+Spring+Hill+FL+reviews";
const ALL_REVIEWS = [
  { name: "Cindy Clark", rating: 5, text: "Yall are doing it right my grandma is loving your gummies \u2764\uFE0F" },
  { name: "Charley", rating: 5, text: "Shopping here is always a pleasure, fast shipping as always \u{1F601}" },
  { name: "Jorge Palms", rating: 5, text: "Had an amazing experience shopping here, will come back. Highly recommended \u{1F60A}" },
  { name: "Sarah M.", rating: 5, text: "Best hemp products in Spring Hill! Fast pickup and amazing quality." },
  { name: "Kelly Ann G.", rating: 5, text: "If I could give 10 stars I would. The staff made me feel comfortable straight away. Would recommend!" },
  { name: "David Ray", rating: 5, text: "10/10, always so helpful whenever I come in and the products are amazing!" },
  { name: "Maria V.", rating: 5, text: "Excellent help every time I visit. Knowledgeable staff and great selection." },
  { name: "Louie M.", rating: 5, text: "Great atmosphere, friendly people, and the best prices around. Love this place!" },
  { name: "Amanda R.", rating: 5, text: "I love this place and the owners are great people. Very attentive to our needs." },
  { name: "Mike T.", rating: 5, text: "Best dispensary in Spring Hill hands down. Clean store, great staff, quality products." },
  { name: "Jessica H.", rating: 5, text: "Amazing experience! The staff really knows their stuff and helped me find exactly what I needed." },
  { name: "Robert P.", rating: 5, text: "Fast service, great products, and the loyalty program is awesome. My go-to shop!" },
];

function ReviewsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let animId: number;
    let scrollPos = 0;
    const speed = 0.5; // pixels per frame
    const tick = () => {
      if (!isPaused && container) {
        scrollPos += speed;
        // Reset when we've scrolled through the first set of reviews
        if (scrollPos >= container.scrollWidth / 2) scrollPos = 0;
        container.scrollLeft = scrollPos;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  // Duplicate reviews for seamless infinite scroll
  const displayReviews = [...ALL_REVIEWS, ...ALL_REVIEWS];

  return (
    <section className="bg-[#FFFFFF] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#231F20] mb-2">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-[#FFCB08] text-[#FFCB08]" />)}
          </div>
          <p className="text-sm text-[#231F20] mb-1">4.8 out of 5 stars across all locations</p>
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#126A44] hover:underline transition-colors">
            6,000+ Five-Star Reviews on Google {"\u2192"}
          </a>
        </div>
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-hidden"
          style={{ scrollBehavior: 'auto' }}
        >
          {displayReviews.map((r, i) => (
            <div key={i} className="flex-shrink-0 w-72 bg-[#FFFFFF] rounded-xl p-5 border border-[#231F20]/10">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-[#FFCB08] text-[#FFCB08]" />)}
              </div>
              <p className="text-[#231F20] text-sm mb-3 line-clamp-3">"{r.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#B3D335] flex items-center justify-center text-[#231F20] text-xs font-bold">{r.name.charAt(0)}</div>
                <span className="text-sm font-semibold text-[#231F20]">{r.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#FFFFFF] border border-[#231F20]/15 rounded-full px-6 py-2.5 text-sm font-medium text-[#231F20] hover:border-[#B3D335] hover:text-[#126A44] transition-colors">
            See All Reviews on Google
          </a>
        </div>
      </div>
    </section>
  );
}

/* ======================== LOCATION SECTION ======================== */
function LocationSection() {
  const locations = [
    { name: "Spring Hill East", address: "14312 Spring Hill Dr, Spring Hill, FL 34609", hours: "Open Daily 6am\u201310pm", phone: "(352) 515-5370", mapsQuery: "The Hemp Dispensary Cannabis Spring Hill East", googleUrl: "https://www.google.com/maps/search/The+Hemp+Dispensary+Cannabis+Spring+Hill+East+14312+Spring+Hill+Dr" },
    { name: "Spring Hill West", address: "6175 Deltona Blvd, Ste 104, Spring Hill, FL 34606", hours: "Mon\u2013Fri 6am\u201312am | Sat\u2013Sun 10am\u20138pm", phone: "(352) 340-5860", mapsQuery: "The Hemp Dispensary Cannabis Spring Hill West", googleUrl: "https://www.google.com/maps/search/The+Hemp+Dispensary+Cannabis+Spring+Hill+West+6175+Deltona+Blvd" },
  ];
  return (
    <section id="locations-section" className="bg-[#FFFFFF] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#231F20] text-center mb-8">Our Locations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div key={loc.name} className="bg-[#FFFFFF] rounded-xl p-6 border border-[#231F20]/15">
              <h3 className="text-xl font-bold text-[#231F20] mb-3">{loc.name}</h3>
              <div className="space-y-2 text-sm text-[#231F20]">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#3D8C32]" />{loc.address}</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#3D8C32]" />{loc.hours}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#3D8C32]" />{loc.phone}</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => window.open(`https://maps.google.com/maps/search/${encodeURIComponent(loc.mapsQuery)}`, "_blank")} className="text-[#126A44] font-semibold text-sm flex items-center gap-1 hover:text-[#126A44] hover:underline">
                  Get Directions <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => window.open(loc.googleUrl, "_blank")} className="text-[#231F20] font-medium text-sm flex items-center gap-1 hover:text-[#126A44] hover:underline">
                  Google Reviews <Star className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ======================== PRODUCT GRID CARD (Floating Design + Quick Add) ======================== */
function ProductGridCard({ product, onQuickAdd }: { product: Product; onQuickAdd?: (product: Product) => void }) {
  if (product.stock <= 0) return null;
  const effect = getProductEffect(product);
  return (
    <div className="cursor-pointer group" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="bg-[#FFFFFF] rounded-2xl p-[10px] sm:p-4 transition-all duration-300 hover:shadow-xl relative border border-[#231F20]/35">
        {/* Floating product image */}
        <div className="h-[140px] sm:h-48 flex items-center justify-center mb-2 sm:mb-3 bg-[#FFFFFF] rounded-xl overflow-hidden">
          <img
            src={product.image_url || placeholderUrl(product.name)}
            alt={product.name}
            loading="lazy"
            width="300"
            height="300"
            sizes="(max-width: 768px) 150px, 300px"
            srcSet={imageSrcSet(product.image_url)}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: '#FFFFFF' }}
            onError={handleImgError}
          />
        </div>
        {/* Badges row */}
        <div className="flex items-center gap-1 flex-wrap mb-1.5">
                    <span className="inline-block text-[11px] sm:text-xs font-medium px-2 sm:px-2 py-[3px] sm:py-0.5 rounded-full" style={{ backgroundColor: effect.bg, color: effect.color }}>
                      {effect.icon} {effect.label}
                    </span>
          {product.stock <= 5 && <span className="inline-block bg-[#ADD038] text-[#231F20] text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">Only {Math.floor(product.stock)} Left</span>}
        </div>
        <h3 className="text-[#231F20] text-[13px] sm:text-sm font-medium leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-1.5 group-hover:text-[#126A44] transition-colors">{titleCase(product.online_name || product.name)}</h3>
        <div className="flex items-center justify-between mb-2">
                    <span className="text-[#231F20] font-semibold text-[14px] sm:text-lg">{formatPrice(product.price)}</span>
                    <span className="text-[11px] sm:text-[10px] text-[#3D8C32] sm:inline">{isLeafLife(product) ? <><span className="text-[#126A44]">●</span> Shipping Only</> : <><span className="text-[#126A44]">●</span> 5 Minute Pickup</>}</span>
        </div>
        {/* Quick Add to Cart button */}
        {onQuickAdd && product.available && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAdd(product); }}
            className="w-full py-2 sm:py-2.5 h-[40px] sm:h-auto bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-xl font-semibold text-[13px] sm:text-sm transition-colors"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

/* ======================== PRODUCT DETAIL (Light Theme) ======================== */
function ProductDetail({ productId, products, onAddToCart }: { productId: string; products: Product[]; onAddToCart: (product: Product, qty: number) => void }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    // Try to find in local products first
    const local = products.find(p => p.id === productId);
    if (local) { setProduct(local); setLoading(false); return; }
    fetch(`${API_URL}/api/ecommerce/products/${productId}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId, products]);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B3D335]"></div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-32">
      <Package className="mx-auto h-16 w-16 text-[#231F20] mb-4" />
      <p className="text-[#231F20] text-lg">Product not found</p>
      <button onClick={() => navigate("")} className="mt-4 text-[#126A44] hover:underline">Back to products</button>
    </div>
  );

  const effect = getProductEffect(product);
  const strength = getProductStrength(product);
  const benefit = getProductBenefit(product);

  // Find related products for "You Might Also Like"
  const related = products
    .filter(p => p.id !== product.id && p.stock > 0 && p.categories.some(c => product.categories.includes(c)))
    .slice(0, 3);

  // Find size variants for savings badge (e.g., "Apples & Bananas Live Rosin 1 Gram" / "4 Grams")
  const baseName = (product.online_name || product.name).replace(/\d+\s*(gram|grams|g)\b/gi, "").trim().toLowerCase();
  const sizeVariants = products.filter(p =>
    p.id !== product.id && p.stock > 0 &&
    (p.online_name || p.name).replace(/\d+\s*(gram|grams|g)\b/gi, "").trim().toLowerCase() === baseName
  );
  const extractGrams = (p: Product): number => {
    const match = (p.online_name || p.name).match(/(\d+)\s*(gram|grams|g)\b/i);
    return match ? parseInt(match[1]) : 0;
  };
  const currentGrams = extractGrams(product);
  const smallestVariant = [product, ...sizeVariants]
    .filter(p => extractGrams(p) > 0)
    .sort((a, b) => extractGrams(a) - extractGrams(b))[0];
  const perGramSmallest = smallestVariant && extractGrams(smallestVariant) > 0 ? smallestVariant.price / extractGrams(smallestVariant) : 0;
  const savingsVsBuying = currentGrams > 0 && perGramSmallest > 0 && smallestVariant?.id !== product.id
    ? (perGramSmallest * currentGrams) - product.price
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-[#126A44] hover:text-[#126A44] mb-4 sm:mb-6 font-medium text-sm sm:text-base">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </button>

      {/* FIRST20 promo */}
      <div className="bg-[#FFCB08]/10 border border-[#FFCB08]/30 rounded-xl px-4 py-3 mb-6 text-center">
        <p className="text-sm font-medium text-[#231F20]">{"\u{1F525}"} First-time customers: <span className="font-bold">20% OFF</span> with code <span className="font-bold text-[#126A44]">FIRST20</span></p>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#231F20]/10 shadow-sm">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Product image - floating design */}
          <div className="p-4 sm:p-8 flex items-center justify-center bg-[#FFFFFF] min-h-[250px] sm:min-h-[400px]">
            <img
              src={product.image_url || placeholderUrl(product.name, 600)}
              alt={product.name}
              loading="eager"
              fetchPriority="high"
              width="600"
              height="600"
              sizes="(max-width: 768px) 100vw, 50vw"
              srcSet={imageSrcSet(product.image_url)}
              className="max-h-[350px] max-w-full object-contain"
              style={{ backgroundColor: '#FFFFFF' }}
              onError={handleImgError}
            />
          </div>

          {/* Product info */}
          <div className="p-5 sm:p-8 md:p-10 flex flex-col">
            {/* Category badges */}
            {product.categories.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {product.categories.map((cat) => (
                  <span key={cat} className="text-xs font-medium bg-[#FFFFFF] text-[#231F20] px-3 py-1 rounded-full border border-[#B3D335] border-l-4">{cat}</span>
                ))}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-[#231F20] mb-2">{titleCase(product.online_name || product.name)}</h1>

            {/* Effect & Strength badges */}
            <div className="flex gap-2 mb-4">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: effect.bg, color: effect.color }}>{effect.icon} {effect.label}</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FFCB08]" style={{ color: "#231F20" }}>Strength: {strength.label}</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <p className="text-3xl font-bold text-[#126A44]">{formatPrice(product.price)}</p>
              {savingsVsBuying > 0 && (
                <span className="inline-block bg-[#ADD038] text-[#231F20] text-xs font-bold px-2.5 py-1 rounded-full">
                  Save {formatPrice(savingsVsBuying)} vs buying {currentGrams}{"\u00D7"}1g
                </span>
              )}
            </div>

            {/* Benefit description */}
            <p className="text-[#231F20] text-sm mb-4">{benefit}</p>

            {product.is_age_restricted && (
              <div className="flex items-center gap-2 mb-4 bg-[#FFCB08]/10 border border-[#FFCB08]/30 rounded-lg px-4 py-2">
                <span className="text-[#D9A32C] font-bold">21+</span>
                <span className="text-[#231F20] text-sm">Age verification required</span>
              </div>
            )}

            {product.description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#231F20] uppercase tracking-wider mb-2">Description</h3>
                <p className="text-[#231F20] leading-relaxed text-sm">{product.description}</p>
              </div>
            )}

            {/* Availability */}
            <div className="mb-4">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${product.stock <= 5 ? 'bg-[#FFCB08]' : 'bg-[#58BA49]'}`}></div>
                  <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-[#D9A32C]' : 'text-[#126A44]'}`}>
                    {product.stock <= 5 ? `Only ${Math.floor(product.stock)} remaining` : `In Stock (${Math.floor(product.stock)} available)`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 bg-[#D9A32C] rounded-full"></div>
                  <span className="text-[#D9A32C] font-medium text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Ready for pickup message */}
            <div className={`${isLeafLife(product) ? 'bg-[#ADD038]/20 border-[#ADD038]/30' : 'bg-[#ADD038]/20 border-[#ADD038]/30'} border rounded-lg px-4 py-2 mb-4`}>
              <p className={`text-sm font-medium ${isLeafLife(product) ? 'text-[#126A44]' : 'text-[#126A44]'}`}>{isLeafLife(product) ? <>{"\u{1F4E6}"} This Product Ships From Our Partner {"\u2013"} Shipping Only</> : <>{"\u26A1"} Ready For Pickup Today In About 5 Minutes</>}</p>
            </div>

            {/* Add to cart */}
            <div className="mt-auto pt-4 space-y-3">
              {product.available && (
                <div className="flex items-center gap-3">
                  <span className="text-[#231F20] text-sm">Qty:</span>
                  <div className="flex items-center border border-[#231F20]/15 rounded-lg">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-[#231F20] hover:text-[#231F20] transition-colors" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                    <span className="px-4 py-2 text-[#231F20] font-medium min-w-[3rem] text-center">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 text-[#231F20] hover:text-[#231F20] transition-colors" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
              <button
                disabled={!product.available}
                onClick={() => { if (product.available) { onAddToCart(product, qty); setAdded(true); setTimeout(() => setAdded(false), 2000); } }}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${product.available ? (added ? "bg-[#ADD038] text-[#231F20]" : "bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] shadow-lg") : "bg-[#231F20]/10 text-[#231F20] cursor-not-allowed"}`}
              >
                {!product.available ? "Out of Stock" : added ? "Added to Cart!" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* You Might Also Like */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-[#231F20] mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-[#FFFFFF] rounded-xl p-3 border border-[#231F20]/10 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                <div className="w-20 h-20 flex-shrink-0 bg-[#FFFFFF] rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={p.image_url || placeholderUrl(p.name, 200)} alt={p.name} className="max-h-full max-w-full object-contain" style={{ backgroundColor: '#FFFFFF' }} onError={handleImgError} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#231F20] line-clamp-2 hover:text-[#126A44] transition-colors">{titleCase(p.online_name || p.name)}</h3>
                  <p className="text-[#126A44] font-bold text-sm mt-1">{formatPrice(p.price)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onAddToCart(p, 1); }} className="flex-shrink-0 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-lg px-3 py-2 text-xs font-semibold transition-colors">Add</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size variants with savings */}
      {sizeVariants.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-[#231F20] mb-4">Available Sizes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[product, ...sizeVariants].sort((a, b) => extractGrams(a) - extractGrams(b)).map((v) => {
              const vGrams = extractGrams(v);
              const vSavings = vGrams > 0 && perGramSmallest > 0 && smallestVariant?.id !== v.id ? (perGramSmallest * vGrams) - v.price : 0;
              return (
                <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl border ${v.id === product.id ? 'border-[#B3D335] bg-[#FFFFFF]' : 'border-[#231F20]/10 bg-[#FFFFFF] hover:border-[#B3D335]'} cursor-pointer transition-all`} onClick={() => { if (v.id !== product.id) navigate(`/product/${v.id}`); }}>
                  <div>
                    <span className="text-sm font-medium text-[#231F20]">{vGrams > 0 ? `${vGrams}g` : titleCase(v.online_name || v.name)}</span>
                    {vSavings > 0 && <span className="ml-2 text-xs font-bold text-[#231F20] bg-[#FFCB08] px-2 py-0.5 rounded-full">Save {formatPrice(vSavings)}</span>}
                  </div>
                  <span className="text-sm font-bold text-[#126A44]">{formatPrice(v.price)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


/* ======================== SEARCH OVERLAY (Light Theme) ======================== */
function SearchOverlay({ open, onClose, products }: { open: boolean; onClose: () => void; products: Product[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) => p.stock > 0 && (
        p.name.toLowerCase().includes(q) ||
        (p.online_name && p.online_name.toLowerCase().includes(q)) ||
        p.categories.some((c) => c.toLowerCase().includes(q))
      ))
      .slice(0, 12);
  }, [query, products]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-[#FFFFFF]">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#231F20]" />
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full pl-12 pr-4 py-3 bg-[#FFFFFF] border border-[#231F20]/15 rounded-full text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335] focus:ring-1 focus:ring-[#B3D335]" />
          </div>
          <button onClick={() => { onClose(); setQuery(""); }} className="p-2 text-[#231F20] hover:text-[#231F20]"><X className="h-6 w-6" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
          {results.map((product) => (
            <div key={product.id} className="cursor-pointer group" onClick={() => { navigate(`/product/${product.id}`); onClose(); setQuery(""); }}>
              <div className="bg-[#FFFFFF] rounded-xl p-3 transition-all hover:shadow-md">
                <div className="h-28 flex items-center justify-center mb-2 bg-[#FFFFFF] rounded-lg overflow-hidden">
                  <img src={product.image_url || placeholderUrl(product.name, 200)} alt={product.name} loading="lazy" className="max-h-full object-contain" style={{ backgroundColor: '#FFFFFF' }} onError={handleImgError} />
                </div>
                <h3 className="text-xs font-medium text-[#231F20] line-clamp-2 group-hover:text-[#126A44] transition-colors">{titleCase(product.online_name || product.name)}</h3>
                <p className="text-[#126A44] font-bold text-sm mt-1">{formatPrice(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
        {query && results.length === 0 && <p className="text-center text-[#231F20] py-12">No products found for "{query}"</p>}
      </div>
    </div>
  );
}

/* ======================== SHOP PAGE (Light Theme) ======================== */
function ShopPage({ products, categories, selectedCategory, onAddToCart }: { products: Product[]; categories: string[]; selectedCategory: string; onAddToCart: (product: Product) => void }) {
  const [sortBy, setSortBy] = useState("name");
  const feelingLabels = ["relax", "sleep", "energy", "focus"];
  const isFeelingFilter = feelingLabels.includes(selectedCategory.toLowerCase());

  const filtered = useMemo(() => {
    let items = products.filter(p => p.stock > 0);
    if (selectedCategory && selectedCategory !== "all") {
      const catLower = selectedCategory.toLowerCase();
      if (isFeelingFilter) {
        items = items.filter((p) => getProductEffect(p).label.toLowerCase() === catLower);
      } else {
        items = items.filter((p) => p.categories.some((c) => c.toLowerCase() === catLower));
      }
    }
    if (sortBy === "price-low") items.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") items.sort((a, b) => b.price - a.price);
    else items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [products, selectedCategory, sortBy, isFeelingFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[18px] sm:text-3xl font-semibold sm:font-bold text-[#231F20]">{selectedCategory && selectedCategory !== "all" ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : "All Products"}</h1>
          <p className="text-[#231F20] text-sm mt-1">{filtered.length} products</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#FFFFFF] border border-[#231F20]/15 rounded-lg px-3 py-2 text-sm text-[#231F20] focus:outline-none focus:border-[#B3D335]">
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
      {/* Category pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => navigate("/shop")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory || selectedCategory === "all" ? "bg-[#B3D335] text-[#231F20]" : "bg-[#FFFFFF] text-[#231F20] border border-[#231F20]/15 hover:border-[#B3D335]"}`}>All</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.toLowerCase() ? "bg-[#B3D335] text-[#231F20]" : "bg-[#FFFFFF] text-[#231F20] border border-[#231F20]/15 hover:border-[#B3D335]"}`}>{cat}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((product) => <ProductGridCard key={product.id} product={product} onQuickAdd={(p) => onAddToCart(p)} />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-[#231F20] mb-3" />
          <p className="text-[#231F20]">No products found in this category</p>
        </div>
      )}
    </div>
  );
}

/* ======================== STATIC PAGES (Light Theme) ======================== */

const ABOUT_TIMELINE = [
  { year: "April 2018", text: "HEMP wholesale company founded by Anthoney & Jimmy" },
  { year: "February 2019", text: "The Hemp Dispensary concept born during a trip to Colorado" },
  { year: "December 1, 2019", text: "Spring Hill West opens (6175 Deltona Blvd)" },
  { year: "Early 2020", text: "Crystal River opens (location #2)" },
  { year: "2020\u20132021", text: "New Port Richey, Clearwater, Homosassa, Tarpon Springs, Spring Hill East" },
  { year: "2021\u20132022", text: "Clermont, Hudson, Lady Lake, Pinellas Park, Tampa, Zephyrhills" },
  { year: "2022\u20132023", text: "Apopka, Port Richey \u2014 15 locations total" },
  { year: "2023", text: "8,000 sq ft manufacturing & distribution center opens in Brooksville" },
  { year: "2024", text: "6-county same-day delivery + national e-commerce at peak" },
  { year: "2024", text: "FDACS THCA reversal \u2014 13 locations closed, warehouse vacated" },
  { year: "2025", text: "Rebuilding \u2014 new website, new platform, same mission" },
  { year: "November 2026", text: "New federal hemp law \u2014 we\u2019re ready" },
];

function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#231F20] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#FFFFFF] mb-4 leading-tight">
            Built in Spring Hill.<br />
            <span className="text-[#B3D335]">Built to Last.</span>
          </h1>
          <p className="text-[#FFFFFF]/80 text-lg sm:text-xl max-w-2xl mx-auto">Two locals. One idea. A lot of fights worth having.</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#231F20]/50 pointer-events-none" />
      </section>

      {/* Section 1 — The Beginning */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-6">It started with a road trip</h2>
          <p className="text-[#231F20] text-base sm:text-lg leading-relaxed">
            In April 2018, Anthoney and Jimmy &mdash; two Spring Hill residents &mdash; started Healing Emotionally Mentally Physically (HEMP), a wholesale hemp company. Early 2019, sourcing problems pushed them to Colorado. Standing inside a marijuana dispensary in Colorado, they looked at each other and knew exactly what Spring Hill was missing. They came home with one idea: open a Hemp Dispensary.
          </p>
        </div>
      </section>

      {/* Section 2 — Nobody Believed */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20 border-t border-[#231F20]/10">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-6">Nobody would give us a chance</h2>
          <p className="text-[#231F20] text-base sm:text-lg leading-relaxed">
            Anthoney was in real estate. Jimmy was in landscaping. They spent months searching for a building before they even opened &mdash; landlord after landlord turned them away because they didn&rsquo;t understand what hemp was and assumed it was illegal. Finally, one landlord sat down with them, listened, and took a chance. On December 1, 2019, The Hemp Dispensary opened its doors at 6175 Deltona Blvd, Spring Hill, FL &mdash; the store we still call Spring Hill West. Once the doors were open, the real hustle began. When Anthoney had to show a house, Jimmy covered the store. When Jimmy had to run a landscaping estimate, Anthoney held things down. They built it shift by shift.
          </p>
        </div>
      </section>

      {/* Section 3 — We Grew */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20 border-t border-[#231F20]/10">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-6">We built something</h2>
          <p className="text-[#231F20] text-base sm:text-lg leading-relaxed">
            A few months after opening West, they opened a second location in Crystal River. Then more followed. New Port Richey. Clearwater. Homosassa. Tarpon Springs. Spring Hill East. Clermont. Hudson. Lady Lake. Pinellas Park. Tampa. Zephyrhills. Apopka. Port Richey. By 2024, The Hemp Dispensary had grown to 15 retail locations across Florida, an 8,000 square foot manufacturing and distribution center in Brooksville, an in-house same-day delivery service covering 6 counties, and an e-commerce store shipping nationally and internationally. Along the way they received cease and desist letters from Reese&rsquo;s Peanut Butter, the American Red Cross, and the NFL &mdash; which is how you know you&rsquo;ve built something worth noticing.
          </p>
        </div>
      </section>

      {/* Section 4 — The Hardest Part */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20 border-t border-[#231F20]/10">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-6">We did everything right. Then the rules changed.</h2>
          <p className="text-[#231F20] text-base sm:text-lg leading-relaxed">
            Florida law around hemp has always been complicated. We&rsquo;ve been targeted more than most because we were one of the biggest brands in the state. When THCA products started appearing everywhere, we stayed on the sideline &mdash; Florida had no clear legal path. Then in 2024, we received a written email from FDACS (Florida Department of Agriculture and Consumer Services) confirming THCA was legal to sell. We invested millions building out a full THCA product line. Months later, FDACS walked into our stores and red-tagged every THCA product. Our competitors continue selling THCA to this day. We cannot. We followed the rules. We paid the price. That decision cost us 13 retail locations, our delivery service, our warehouse, and nearly everything we&rsquo;d built. We went from 15 locations to 2. We went from 64 employees to 9.
          </p>
        </div>
      </section>

      {/* Section 5 — Why We're Still Here */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20 border-t border-[#231F20]/10">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-6">Two locations. Same mission.</h2>
          <p className="text-[#231F20] text-base sm:text-lg leading-relaxed mb-8">
            Spring Hill West opened December 1, 2019. It&rsquo;s still open. Spring Hill East is still open. We still source the highest quality lab-tested hemp products we can find. We still know most of our customers by name. We&rsquo;re not a corporate chain. We&rsquo;re two guys from Spring Hill who believed in this plant before most people knew what it was &mdash; and we still do. With another federal law change on the horizon, we&rsquo;re facing new challenges again. We&rsquo;ve been here before. We&rsquo;re not going anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/shop")} className="px-8 py-3.5 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] rounded-full font-bold text-lg transition-colors shadow-lg">Shop Now</button>
            <button onClick={() => { const el = document.getElementById('locations-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else navigate('/contact'); }} className="px-8 py-3.5 border-2 border-[#231F20] text-[#231F20] hover:bg-[#231F20] hover:text-[#FFFFFF] rounded-full font-bold text-lg transition-colors">Visit Us</button>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20 border-t border-[#231F20]/10">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-10 text-center">Our Timeline</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-[#B3D335]" />
            <div className="space-y-8">
              {ABOUT_TIMELINE.map((item, i) => (
                <div key={i} className="relative pl-12 sm:pl-16">
                  {/* Dot */}
                  <div className="absolute left-2.5 sm:left-4.5 top-1 w-3.5 h-3.5 rounded-full bg-[#FFCB08] border-2 border-[#FFFFFF] shadow" />
                  <p className="text-sm font-bold text-[#126A44] mb-1">{item.year}</p>
                  <p className="text-[#231F20] text-base leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing Banner */}
      <section className="bg-[#231F20] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFCB08] italic leading-relaxed">
            &ldquo;We didn&rsquo;t build this to quit.&rdquo;
          </p>
          <p className="text-[#FFFFFF]/70 mt-4 text-lg">&mdash; Anthoney & Jimmy</p>
        </div>
      </section>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#231F20] mb-6">Terms of Service</h1>
      <div className="prose prose-lg text-[#231F20]">
        <p className="mb-4">By using our website and services, you agree to these terms. All products are sold in compliance with federal and state hemp regulations.</p>
        <p className="mb-4">You must be 21 years or older to purchase age-restricted products. We reserve the right to verify age at the time of pickup.</p>
        <p>All sales are final. Products cannot be returned once purchased due to the nature of our products.</p>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#231F20] mb-6">Privacy Policy</h1>
      <div className="prose prose-lg text-[#231F20]">
        <p className="mb-4">We respect your privacy and are committed to protecting your personal information. We collect only the information necessary to process your orders and improve your experience.</p>
        <p className="mb-4">We do not sell or share your personal information with third parties except as necessary to fulfill your orders.</p>
        <p>Your payment information is processed securely through Clover and is never stored on our servers.</p>
      </div>
    </div>
  );
}

function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#231F20] mb-6">Shipping & Pickup</h1>
      <div className="prose prose-lg text-[#231F20]">
        <p className="mb-4">Most orders are ready for pickup in about 5 minutes! We offer fast, convenient pickup at both of our Spring Hill locations.</p>
        <p className="mb-4">Free shipping on orders over $50. Standard shipping typically takes 3-5 business days.</p>
        <p>For local customers, we recommend our pickup option for the fastest service.</p>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#231F20] mb-6">Contact Us</h1>
      <div className="prose prose-lg text-[#231F20]">
        <p className="mb-4">Have questions? We'd love to hear from you!</p>
        <div className="space-y-3">
          <p className="flex items-center gap-2"><Phone className="h-5 w-5 text-[#126A44]" /> (352) 340-2861</p>
          <p className="flex items-center gap-2"><Mail className="h-5 w-5 text-[#126A44]" /> support@thehempdispensary.com</p>
          <p className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#126A44]" /> Spring Hill, FL</p>
        </div>
      </div>
    </div>
  );
}


/* ======================== FOOTER (Dark Background) ======================== */
function SiteFooter() {
  return (
    <footer className="bg-[#231F20] text-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.webp" alt="The Hemp Dispensary" width="240" height="96" className="h-12 w-auto mb-4" />
            <p className="text-[#FFFFFF]/70 text-sm">Spring Hill's trusted source for premium hemp products.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#3D8C32] mb-3">Shop</h3>
            <div className="space-y-2">
              <a href="#/shop/flower" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Flower</a>
              <a href="#/shop/edibles" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Edibles</a>
              <a href="#/shop/concentrates" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Concentrates</a>
              <a href="#/shop/vapor" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Vapor</a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-[#3D8C32] mb-3">Company</h3>
            <div className="space-y-2">
              <a href="#/about" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">About Us</a>
              <a href="#/contact" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Contact</a>
              <a href="#/loyalty" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Rewards</a>
              <a href="#/games" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Games</a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-[#3D8C32] mb-3">Legal</h3>
            <div className="space-y-2">
              <a href="#/terms" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Terms of Service</a>
              <a href="#/privacy" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Privacy Policy</a>
              <a href="#/shipping" className="block text-[#FFFFFF]/70 hover:text-[#B3D335] text-sm transition-colors">Shipping & Pickup</a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#FFFFFF]/20 mt-8 pt-8 text-center">
          <p className="text-[#FFFFFF]/50 text-sm">&copy; {new Date().getFullYear()} The Hemp Dispensary. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


/* ======================== CHATBOT BUD (Sales-Focused) ======================== */
interface ChatMessage {
  from: "bot" | "user";
  text: string;
  buttons?: { label: string; value: string }[];
  products?: Product[];
}

function ChatbotBud({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = () => {
    setOpen(true);
    if (!initialized) {
      setMessages([{
        from: "bot",
        text: "\u{1F44B} I'm Bud. What kind of vibe are you going for today?",
        buttons: [
          { label: "Relax \u{1F60C}", value: "relax" },
          { label: "Sleep \u{1F634}", value: "sleep" },
          { label: "Energy \u26A1", value: "energy" },
          { label: "Focus \u{1F9E0}", value: "focus" },
        ],
      }]);
      setInitialized(true);
    }
  };

  const findProducts = (vibe: string): Product[] => {
    const keywords: Record<string, string[]> = {
      relax: ["relax", "calm", "chill", "indica", "hybrid", "cbd"],
      sleep: ["sleep", "night", "dream", "rest", "melatonin", "cbn", "indica"],
      energy: ["energy", "sativa", "boost", "uplift", "focus"],
      focus: ["focus", "clarity", "brain", "mental", "sativa"],
    };
    const terms = keywords[vibe] || keywords.relax;
    const matches = products.filter(p => {
      if (p.stock <= 0) return false;
      const text = (p.name + " " + (p.description || "")).toLowerCase();
      return terms.some(t => text.includes(t));
    });
    if (matches.length > 0) return matches.slice(0, 3);
    // Fallback: return top in-stock products
    return products.filter(p => p.stock > 0).slice(0, 3);
  };

  const handleVibeSelect = (vibe: string) => {
    const vibeLabels: Record<string, string> = { relax: "Relax \u{1F60C}", sleep: "Sleep \u{1F634}", energy: "Energy \u26A1", focus: "Focus \u{1F9E0}" };
    setMessages(prev => [...prev, { from: "user", text: vibeLabels[vibe] || vibe }]);

    const recommended = findProducts(vibe);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        from: "bot",
        text: `Great choice! Here are my top picks for ${vibe}:`,
        products: recommended,
      }]);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          from: "bot",
          text: `\u{1F525} Most people pair these with something from our edibles. Want me to show you some?`,
          buttons: [
            { label: "Yes, show me!", value: "upsell_edibles" },
            { label: "Take me to checkout", value: "checkout" },
            { label: "Browse more", value: "browse" },
          ],
        }]);
      }, 800);
    }, 500);
  };

  const handleButtonClick = (value: string) => {
    if (["relax", "sleep", "energy", "focus"].includes(value)) {
      handleVibeSelect(value);
      return;
    }

    const labelMap: Record<string, string> = {
      upsell_edibles: "Yes, show me!",
      checkout: "Take me to checkout",
      browse: "Browse more",
      go_checkout: "Go to checkout",
      keep_shopping: "Keep shopping",
    };
    setMessages(prev => [...prev, { from: "user", text: labelMap[value] || value }]);

    if (value === "checkout" || value === "go_checkout") {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          from: "bot",
          text: "\u{1F525} You're all set! Taking you to checkout. \u26A1 Ready in about 5 minutes for pickup!",
        }]);
        setTimeout(() => { navigate("/checkout"); setOpen(false); }, 1000);
      }, 400);
      return;
    }

    if (value === "upsell_edibles") {
      const edibles = products.filter(p => p.stock > 0 && p.categories.some(c => c.toLowerCase().includes("edible"))).slice(0, 3);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          from: "bot",
          text: "Here are some popular edibles to pair with your order:",
          products: edibles.length > 0 ? edibles : products.filter(p => p.stock > 0).slice(0, 3),
        }]);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            from: "bot",
            text: "\u{1F525} Want me to take you to checkout?",
            buttons: [
              { label: "Go to checkout", value: "go_checkout" },
              { label: "Keep shopping", value: "keep_shopping" },
            ],
          }]);
        }, 600);
      }, 500);
      return;
    }

    if (value === "browse" || value === "keep_shopping") {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          from: "bot",
          text: "No problem! Browse our full selection. \u26A1 Remember, orders are ready in about 5 minutes for pickup!",
          buttons: [
            { label: "Relax \u{1F60C}", value: "relax" },
            { label: "Sleep \u{1F634}", value: "sleep" },
            { label: "Energy \u26A1", value: "energy" },
            { label: "Focus \u{1F9E0}", value: "focus" },
          ],
        }]);
      }, 400);
      return;
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const msg = input.trim().toLowerCase();
    setMessages(prev => [...prev, { from: "user", text: input.trim() }]);
    setInput("");

    let response: ChatMessage;

    if (msg.includes("sleep") || msg.includes("night")) {
      handleVibeSelect("sleep");
      return;
    } else if (msg.includes("relax") || msg.includes("calm") || msg.includes("chill")) {
      handleVibeSelect("relax");
      return;
    } else if (msg.includes("energy") || msg.includes("boost") || msg.includes("wake")) {
      handleVibeSelect("energy");
      return;
    } else if (msg.includes("focus") || msg.includes("clarity") || msg.includes("brain")) {
      handleVibeSelect("focus");
      return;
    } else if (msg.includes("location") || msg.includes("where") || msg.includes("address") || msg.includes("store")) {
      response = { from: "bot", text: "\u{1F4CD} We have 2 locations in Spring Hill, FL:\n\n\u2022 HQ: 1233 Pinehurst Dr\n\u2022 East: 2480 Commercial Way\n\nBoth open Mon-Sat 10am-9pm, Sun 11am-7pm!" };
    } else if (msg.includes("pickup") || msg.includes("fast") || msg.includes("how long") || msg.includes("ready")) {
      response = { from: "bot", text: "\u26A1 Most orders are ready in about 5 minutes for pickup! Just place your order and swing by." };
    } else if (msg.includes("safe") || msg.includes("test") || msg.includes("lab") || msg.includes("quality")) {
      response = { from: "bot", text: "\u{1F6E1}\uFE0F All our products are lab-tested and sourced carefully. Quality and safety are our top priority!" };
    } else if (msg.includes("first") || msg.includes("new") || msg.includes("discount") || msg.includes("code") || msg.includes("coupon")) {
      response = { from: "bot", text: "\u{1F389} Use code FIRST20 for 20% off your first order! Works on everything in the store." };
    } else if (msg.includes("recommend") || msg.includes("suggest") || msg.includes("what should")) {
      response = {
        from: "bot",
        text: "What kind of vibe are you going for?",
        buttons: [
          { label: "Relax \u{1F60C}", value: "relax" },
          { label: "Sleep \u{1F634}", value: "sleep" },
          { label: "Energy \u26A1", value: "energy" },
          { label: "Focus \u{1F9E0}", value: "focus" },
        ],
      };
    } else {
      response = {
        from: "bot",
        text: "I can help you find the perfect product! What vibe are you going for?",
        buttons: [
          { label: "Relax \u{1F60C}", value: "relax" },
          { label: "Sleep \u{1F634}", value: "sleep" },
          { label: "Energy \u26A1", value: "energy" },
          { label: "Focus \u{1F9E0}", value: "focus" },
        ],
      };
    }

    setTimeout(() => setMessages(prev => [...prev, response]), 400);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={openChat} className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-[#B3D335] hover:bg-[#58BA49] shadow-lg flex items-center justify-center transition-all hover:scale-110" aria-label="Open Bud hemp guide">
          <img src="/bud-puppet.webp" alt="Bud" className="w-10 h-10 object-contain" width="70" height="70" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <MessageCircle className="h-6 w-6 text-[#FFFFFF] absolute" style={{ display: 'none' }} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[340px] sm:w-[380px] max-h-[500px] bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#231F20]/15 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#B3D335] text-[#231F20] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/bud-puppet.webp" alt="Bud" className="w-8 h-8 object-contain rounded-full bg-[#FFFFFF]/20 p-0.5" width="70" height="70" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <p className="font-bold text-sm">Bud</p>
                <p className="text-xs text-[#FFFFFF]/80">Your hemp guide</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-[#FFFFFF]/20 rounded-full transition-colors" aria-label="Close chat"><X className="h-5 w-5" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.from === "user" ? "bg-[#B3D335] text-[#231F20] rounded-2xl rounded-br-md px-3 py-2" : "bg-[#FFFFFF] text-[#231F20] rounded-2xl rounded-bl-md px-3 py-2"}`}>
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  {/* Product cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.products.map(p => (
                        <div key={p.id} className="bg-[#FFFFFF] rounded-lg p-2 border border-[#231F20]/10 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => { navigate(`/product/${p.id}`); setOpen(false); }}>
                          <div className="flex items-center gap-2">
                            <img src={p.image_url || placeholderUrl(p.name, 60)} alt={p.name} className="w-10 h-10 object-contain rounded" onError={handleImgError} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#231F20] truncate">{p.online_name || p.name}</p>
                              <p className="text-xs text-[#126A44] font-bold">{formatPrice(p.price)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.buttons.map((btn, j) => (
                        <button key={j} onClick={() => handleButtonClick(btn.value)} className="px-3 py-1.5 bg-[#B3D335] text-[#231F20] rounded-full text-xs font-medium hover:bg-[#58BA49] transition-colors border-0">
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#231F20]/15 p-3 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Ask Bud anything..."
              className="flex-1 bg-[#FFFFFF] border border-[#231F20]/15 rounded-full px-4 py-2 text-sm text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]"
            />
            <button onClick={handleSend} className="p-2 bg-[#58BA49] hover:bg-[#126A44] text-[#FFFFFF] rounded-full transition-colors" aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}


/* ======================== CHECKOUT PAGE (Preserved) ======================== */

function CheckoutPage({ cart, onClear }: { cart: CartItem[]; onUpdateQty: (productId: string, qty: number) => void; onRemove: (productId: string) => void; onClear: () => void }) {
  const [step, setStep] = useState<"info" | "shipping" | "payment" | "confirmed">("info");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display: string; address: string; city: string; state: string; zip: string }>>([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", apartment: "", city: "", state: "FL", zip: "",
    notes: "", loyaltyNumber: "",
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const cloverRef = useRef<any>(null);
  const elementsRef = useRef<Record<string, any>>({});
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const sdkLoadedRef = useRef(false);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = subtotal >= 5000 ? 0 : 799;
  const tax = Math.round(subtotal * 0.07);
  const total = subtotal + shippingCost + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const setField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const inputClass = "w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335] focus:ring-1 focus:ring-[#B3D335] transition-colors";
  const labelClass = "block text-sm font-medium text-[#231F20] mb-1.5";

  // Address autocomplete using Nominatim (free, no API key)
  const searchAddress = useCallback((query: string) => {
    if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
    if (query.length < 3) { setAddressSuggestions([]); setShowSuggestions(false); return; }
    addressTimeoutRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=us&limit=5`,
          { headers: { "Accept": "application/json" } }
        );
        const data = await resp.json();
        const suggestions = data
          .filter((r: Record<string, unknown>) => r.address && (r.type === "house" || r.type === "residential" || r.class === "place" || r.class === "building" || r.type === "yes" || r.type === "commercial" || r.type === "retail" || r.osm_type === "way" || r.osm_type === "node"))
          .map((r: Record<string, Record<string, string>>) => {
            const a = r.address || {};
            const house = a.house_number || "";
            const road = a.road || "";
            const street = house ? `${house} ${road}` : road;
            return {
              display: r.display_name as unknown as string,
              address: street,
              city: a.city || a.town || a.village || a.hamlet || "",
              state: a.state || "FL",
              zip: a.postcode || "",
            };
          })
          .filter((s: { address: string }) => s.address);
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch {
        setShowSuggestions(false);
      }
    }, 400);
  }, []);

  // Load Clover SDK script once
  useEffect(() => {
    if (sdkLoadedRef.current) return;
    if (document.querySelector('script[src*="checkout.clover.com/sdk.js"]')) {
      sdkLoadedRef.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.clover.com/sdk.js";
    script.async = true;
    script.onload = () => { sdkLoadedRef.current = true; };
    document.head.appendChild(script);
  }, []);

  // Initialize Clover elements when entering payment step
  useEffect(() => {
    if (step !== "payment") return;

    let cancelled = false;
    const initClover = () => {
      if (cancelled) return;
      if (!window.Clover) {
        setTimeout(initClover, 300);
        return;
      }
      try {
        const clover = new window.Clover(CLOVER_PAKMS_KEY, { merchantId: CLOVER_MERCHANT_ID });
        cloverRef.current = clover;
        const elements = clover.elements();

        const styles = {
          body: { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
          input: {
            fontSize: "16px",
            color: "#231F20",
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(35,31,32,0.2)",
            borderRadius: "8px",
            padding: "12px 16px",
            height: "48px",
          },
          "input:focus": { border: "1px solid #B3D335" },
          "input::placeholder": { color: "rgba(35,31,32,0.4)" },
        };

        const cardNumber = elements.create("CARD_NUMBER", styles);
        const cardDate = elements.create("CARD_DATE", styles);
        const cardCvv = elements.create("CARD_CVV", styles);
        const cardPostalCode = elements.create("CARD_POSTAL_CODE", styles);

        cardNumber.mount("#clover-card-number");
        cardDate.mount("#clover-card-date");
        cardCvv.mount("#clover-card-cvv");
        cardPostalCode.mount("#clover-card-zip");

        elementsRef.current = { cardNumber, cardDate, cardCvv, cardPostalCode };

        // Track readiness
        const fieldsReady = { number: false, date: false, cvv: false, zip: false };
        const checkReady = () => {
          if (!cancelled) { Object.values(fieldsReady).every(Boolean); /* track readiness */ }
        };
        cardNumber.addEventListener("change", (e: { complete: boolean }) => { fieldsReady.number = e.complete; checkReady(); });
        cardDate.addEventListener("change", (e: { complete: boolean }) => { fieldsReady.date = e.complete; checkReady(); });
        cardCvv.addEventListener("change", (e: { complete: boolean }) => { fieldsReady.cvv = e.complete; checkReady(); });
        cardPostalCode.addEventListener("change", (e: { complete: boolean }) => { fieldsReady.zip = e.complete; checkReady(); });
      } catch (err) {
        console.error("Failed to initialize Clover:", err);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initClover, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      Object.values(elementsRef.current).forEach((el) => {
        try { el.destroy(); } catch { /* ignore */ }
      });
      elementsRef.current = {};
      cloverRef.current = null;
      // reset on cleanup
    };
  }, [step]);

  if (cart.length === 0 && step !== "confirmed") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-[#231F20] mb-4" />
        <h1 className="text-2xl font-bold text-[#FFFFFF] mb-2">Your cart is empty</h1>
        <p className="text-[#231F20] mb-6">Add some products before checking out.</p>
        <button onClick={() => navigate("/shop")} className="bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] px-8 py-3 rounded-full font-medium transition-colors">Shop Now</button>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="bg-[#B3D335]/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-[#126A44]" />
        </div>
        <h1 className="text-3xl font-bold text-[#FFFFFF] mb-3">Payment Successful!</h1>
        <p className="text-[#231F20] mb-2">Thank you for your order, {form.firstName}!</p>
        <p className="text-[#231F20] text-sm mb-6">Order #{orderNumber}</p>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#231F20]/20 p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="text-[#FFFFFF] font-semibold mb-3">What happens next?</h3>
          <div className="space-y-3 text-sm text-[#231F20]">
            <div className="flex gap-3"><Mail className="h-5 w-5 text-[#126A44] flex-shrink-0 mt-0.5" /><p>A confirmation email will be sent to <span className="text-[#FFFFFF]">{form.email}</span></p></div>
            <div className="flex gap-3"><Package className="h-5 w-5 text-[#126A44] flex-shrink-0 mt-0.5" /><p>Your order will be prepared and packaged</p></div>
            <div className="flex gap-3"><Truck className="h-5 w-5 text-[#126A44] flex-shrink-0 mt-0.5" /><p>You'll receive shipping details once dispatched</p></div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate("")} className="bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] px-8 py-3 rounded-full font-medium transition-colors">Continue Shopping</button>
        </div>
      </div>
    );
  }

  const canProceedInfo = form.firstName && form.lastName && form.email && form.phone;
  const canProceedShipping = form.address && form.city && form.state && form.zip;

  const handlePlaceOrder = async () => {
    if (!cloverRef.current) {
      setPaymentError("Payment system is still loading. Please wait a moment and try again.");
      return;
    }
    setSubmitting(true);
    setPaymentError("");

    try {
      // Step 1: Tokenize the card via Clover SDK
      const tokenResult = await cloverRef.current.createToken();

      if (tokenResult.errors) {
        const errorMessages = Object.values(tokenResult.errors).join(", ");
        setPaymentError(errorMessages || "Please check your card details.");
        setSubmitting(false);
        return;
      }

      if (!tokenResult.token) {
        setPaymentError("Could not process card. Please try again.");
        setSubmitting(false);
        return;
      }

      // Step 2: Send token + order data to backend for charge + order creation
      const orderData = {
        customer: { first_name: form.firstName, last_name: form.lastName, email: form.email, phone: form.phone },
        shipping_address: { address: form.address, apartment: form.apartment, city: form.city, state: form.state, zip: form.zip },
        items: cart.map((item) => ({ product_id: item.product.id, name: item.product.name, sku: item.product.sku, price: item.product.price, quantity: item.quantity })),
        subtotal, shipping_cost: shippingCost, tax, total, notes: form.notes,
        payment_token: tokenResult.token,
        loyalty_number: form.loyaltyNumber,
      };

      const resp = await fetch(`${API_URL}/api/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (resp.ok) {
        const data = await resp.json();
        setOrderNumber(data.order_number || "HD-" + Date.now().toString(36).toUpperCase());
        onClear();
        setStep("confirmed");
      } else {
        const data = await resp.json().catch(() => ({ detail: "Payment failed. Please try again." }));
        setPaymentError(data.detail || "Payment was declined. Please check your card and try again.");
      }
    } catch {
      setPaymentError("An error occurred processing your payment. Please try again.");
    }
    setSubmitting(false);
  };

  const steps = [
    { key: "info", label: "Contact", icon: Phone },
    { key: "shipping", label: "Shipping", icon: Truck },
    { key: "payment", label: "Payment", icon: CreditCard },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              step === s.key ? "bg-[#B3D335] text-[#231F20]" : steps.findIndex((x) => x.key === step) > i ? "bg-[#B3D335]/20 text-[#231F20]" : "bg-[#FFFFFF] text-[#231F20] border border-[#231F20]/20"
            }`}>
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-1 ${steps.findIndex((x) => x.key === step) > i ? "bg-[#B3D335]" : "bg-[#231F20]/20"}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-3">
          {step === "info" && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#231F20]/20 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[#231F20] mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>First Name *</label><input type="text" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} placeholder="John" className={inputClass} /></div>
                  <div><label className={labelClass}>Last Name *</label><input type="text" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} placeholder="Doe" className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Email *</label><input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="john@example.com" className={inputClass} /></div>
                <div><label className={labelClass}>Phone *</label><input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="(352) 555-0123" className={inputClass} /></div>
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => navigate("/shop")} className="text-[#231F20] hover:text-[#231F20] transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Shop</button>
                <button onClick={() => setStep("shipping")} disabled={!canProceedInfo} className={`px-8 py-3 rounded-full font-medium transition-all ${canProceedInfo ? "bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF]" : "bg-[#231F20]/10 text-[#231F20] cursor-not-allowed"}`}>Continue to Shipping</button>
              </div>
            </div>
          )}

          {step === "shipping" && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#231F20]/20 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[#231F20] mb-6">Shipping Address</h2>
              <div className="space-y-4">
                <div className="relative">
                  <label className={labelClass}>Street Address *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => { setField("address", e.target.value); searchAddress(e.target.value); }}
                    onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Start typing your address..."
                    autoComplete="street-address"
                    className={inputClass}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {addressSuggestions.map((s, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-4 py-3 text-sm text-[#231F20] hover:bg-[#FFFFFF] transition-colors border-b border-[#231F20]/10 last:border-b-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, address: s.address, city: s.city, state: s.state, zip: s.zip }));
                            setShowSuggestions(false);
                            setAddressSuggestions([]);
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#126A44] flex-shrink-0" />
                            <span className="truncate">{s.display}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div><label className={labelClass}>Apartment, suite, etc.</label><input type="text" value={form.apartment} onChange={(e) => setField("apartment", e.target.value)} placeholder="Apt 4B" autoComplete="address-line2" className={inputClass} /></div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className={labelClass}>City *</label><input type="text" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="Spring Hill" autoComplete="address-level2" className={inputClass} /></div>
                  <div><label className={labelClass}>State *</label><input type="text" value={form.state} onChange={(e) => setField("state", e.target.value)} placeholder="FL" autoComplete="address-level1" className={inputClass} /></div>
                  <div><label className={labelClass}>ZIP Code *</label><input type="text" value={form.zip} onChange={(e) => setField("zip", e.target.value)} placeholder="34609" autoComplete="postal-code" className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Order Notes (optional)</label><textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Any special instructions..." rows={3} className={inputClass} /></div>
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep("info")} className="text-[#231F20] hover:text-[#231F20] transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => setStep("payment")} disabled={!canProceedShipping} className={`px-8 py-3 rounded-full font-medium transition-all ${canProceedShipping ? "bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF]" : "bg-[#231F20]/10 text-[#231F20] cursor-not-allowed"}`}>Continue to Payment</button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#231F20]/20 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[#231F20] mb-6">Review & Pay</h2>

              {/* Contact summary */}
              <div className="mb-4 p-4 bg-[#FFFFFF] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#231F20]">Contact</h3>
                  <button onClick={() => setStep("info")} className="text-xs text-[#B3D335] hover:text-[#126A44]">Edit</button>
                </div>
                <p className="text-[#FFFFFF] text-sm">{form.firstName} {form.lastName}</p>
                <p className="text-[#231F20] text-sm">{form.email} &bull; {form.phone}</p>
              </div>

              {/* Shipping summary */}
              <div className="mb-4 p-4 bg-[#FFFFFF] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#231F20]">Shipping Address</h3>
                  <button onClick={() => setStep("shipping")} className="text-xs text-[#B3D335] hover:text-[#126A44]">Edit</button>
                </div>
                <p className="text-[#FFFFFF] text-sm">{form.address}{form.apartment ? `, ${form.apartment}` : ""}</p>
                <p className="text-[#231F20] text-sm">{form.city}, {form.state} {form.zip}</p>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#231F20] mb-3">Items ({itemCount})</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-[#FFFFFF] rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#FFFFFF] flex-shrink-0">
                        <img src={item.product.image_url || placeholderUrl(item.product.name, 100)} alt={item.product.name} className="w-full h-full object-contain" width="64" height="64" loading="lazy" onError={handleImgError} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#FFFFFF] text-sm font-medium truncate">{item.product.online_name || item.product.name}</p>
                        <p className="text-[#231F20] text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-[#FFFFFF] text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Card Entry */}
              <div className="mb-6 p-5 bg-[#FFFFFF] rounded-xl border border-[#231F20]/20">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-[#126A44]" />
                  <h3 className="text-[#231F20] font-semibold">Payment Details</h3>
                  <Lock className="h-3.5 w-3.5 text-[#231F20] ml-auto" />
                  <span className="text-xs text-[#231F20]">Secure</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Card Number</label>
                    <div id="clover-card-number" className="bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Expiration</label>
                      <div id="clover-card-date" className="bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                    </div>
                    <div>
                      <label className={labelClass}>CVV</label>
                      <div id="clover-card-cvv" className="bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                    </div>
                    <div>
                      <label className={labelClass}>ZIP Code</label>
                      <div id="clover-card-zip" className="bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#231F20] mt-3 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Your payment is securely processed by Clover
                </p>
              </div>

              {/* Loyalty Number */}
              <div className="mb-6 p-4 bg-[#FFFFFF] rounded-xl border border-[#231F20]/20">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-4 w-4 text-[#126A44]" />
                  <h3 className="text-[#231F20] text-sm font-semibold">Hemp Rewards (optional)</h3>
                </div>
                <input
                  type="text"
                  value={form.loyaltyNumber}
                  onChange={(e) => setField("loyaltyNumber", e.target.value)}
                  placeholder="Enter your loyalty number or phone number"
                  className={inputClass}
                />
                <p className="text-xs text-[#231F20] mt-2">Enter your rewards number to earn points on this purchase</p>
              </div>

              {/* Error display */}
              {paymentError && (
                <div className="mb-4 p-4 bg-[#D9A32C]/20/30 border border-[#D9A32C]/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#D9A32C] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#D9A32C]/70 text-sm font-medium">Payment Error</p>
                    <p className="text-[#D9A32C]/80 text-sm">{paymentError}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep("shipping")} className="text-[#231F20] hover:text-[#231F20] transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="px-8 py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  {submitting ? "Processing Payment..." : `Pay ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#231F20]/20 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-[#231F20] mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#FFFFFF] flex-shrink-0">
                    <img src={item.product.image_url || placeholderUrl(item.product.name, 100)} alt={item.product.name} className="w-full h-full object-contain" width="64" height="64" loading="lazy" onError={handleImgError} />
                    <span className="absolute -top-1 -right-1 bg-[#B3D335] text-[#231F20] text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#FFFFFF] text-xs font-medium truncate">{item.product.online_name || item.product.name}</p>
                  </div>
                  <p className="text-[#FFFFFF] text-xs font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#231F20]/20 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#231F20]">Subtotal</span><span className="text-[#231F20]">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#231F20]">Shipping</span><span className="text-[#FFFFFF]">{shippingCost === 0 ? <span className="text-[#126A44]">Free</span> : formatPrice(shippingCost)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#231F20]">Tax (7%)</span><span className="text-[#231F20]">{formatPrice(tax)}</span></div>
              <div className="border-t border-[#231F20]/20 pt-3 flex justify-between"><span className="text-[#231F20] font-semibold">Total</span><span className="text-xl font-bold text-[#231F20]">{formatPrice(total)}</span></div>
            </div>
            {shippingCost > 0 && <p className="text-center text-xs text-[#126A44] mt-3">Add {formatPrice(5000 - subtotal)} more for free shipping!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ======================== LOYALTY PAGE (Full Upgrade) ======================== */

interface LoyaltyTransaction { type: string; points: number; description: string; created_at: string; }
interface LoyaltyCustomer { id: number; first_name: string; last_name: string; phone: string; email: string; points_balance: number; lifetime_points: number; birthday: string; }

const VIP_TIERS = [
  { name: "Budding", min: 0, max: 249, multiplier: "1x", color: "#B3D335", icon: Leaf, benefits: ["1 point per $1 spent", "Birthday bonus: 100 pts", "Access to all redemptions"] },
  { name: "Grower", min: 250, max: 499, multiplier: "1.25x", color: "#58BA49", icon: TrendingUp, benefits: ["1.25x points on every purchase", "Birthday bonus: 150 pts", "Early access to new drops"] },
  { name: "Premium", min: 500, max: 999, multiplier: "1.5x", color: "#3D8C32", icon: Award, benefits: ["1.5x points on every purchase", "Birthday bonus: 250 pts", "Early access + mystery gift"] },
  { name: "Elite", min: 1000, max: Infinity, multiplier: "2x", color: "#126A44", icon: Crown, benefits: ["2x points on every purchase", "Birthday bonus: 500 pts", "Early access + VIP mystery gift"] },
];

const REDEMPTION_TIERS = [
  { points: 100, discount: "$5 Off", minPurchase: 25, desc: "Any purchase $25+" },
  { points: 250, discount: "$15 Off", minPurchase: 40, desc: "Any purchase $40+" },
  { points: 500, discount: "$35 Off", minPurchase: 60, desc: "Any purchase $60+" },
  { points: 1000, discount: "$75 Off", minPurchase: 100, desc: "Any purchase $100+" },
  { points: 2000, discount: "Free 3.5g Flower", minPurchase: 0, desc: "Pickup only — any strain" },
];

const WAYS_TO_EARN = [
  { label: "Sign Up Bonus", pts: 200, icon: Gift, desc: "Create your free account" },
  { label: "Every $1 Spent", pts: 1, icon: DollarSign, desc: "In-store & online" },
  { label: "Follow on Instagram", pts: 25, icon: Instagram, desc: "@thehempdispensary" },
  { label: "Follow on TikTok", pts: 25, icon: Heart, desc: "@thehempdispensary" },
  { label: "Email Signup", pts: 30, icon: Mail, desc: "Join our mailing list" },
  { label: "Google Review", pts: 150, icon: Star, desc: "Pending staff approval" },
  { label: "Refer a Friend", pts: 500, icon: Users, desc: "After friend's first purchase" },
  { label: "Birthday Bonus", pts: 100, icon: Cake, desc: "Awarded in your birthday month" },
  { label: "Daily Bud Puppet", pts: 10, icon: Gamepad2, desc: "Play once per day" },
  { label: "Scratch Card Win", pts: 25, icon: Target, desc: "Win the daily scratch card" },
];

function LoyaltyPage() {
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({ first_name: "", last_name: "", phone: "", email: "", birthday_month: "", birthday_day: "" });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<{ status: string; message: string; points?: number } | null>(null);
  const [showAllTx, setShowAllTx] = useState(false);
  const [referralForm, setReferralForm] = useState({ friend_name: "", friend_email: "" });
  const [referralMsg, setReferralMsg] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!phone) return;
    setLookupLoading(true);
    setLookupDone(false);
    setCustomer(null);
    setTransactions([]);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/lookup?phone=${encodeURIComponent(phone)}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.found && data.customer) {
          setCustomer(data.customer);
          setTransactions(data.transactions || []);
          setLifetimeEarned(data.lifetime_earned || 0);
        }
      }
    } catch { /* timeout or network error */ }
    setLookupLoading(false);
    setLookupDone(true);
  };

  const handleSignup = async () => {
    if (!signupForm.first_name || !signupForm.phone) return;
    setSignupLoading(true);
    setSignupResult(null);
    try {
      const birthday = signupForm.birthday_month && signupForm.birthday_day ? `${signupForm.birthday_month}/${signupForm.birthday_day}` : "";
      const params = new URLSearchParams({ phone: signupForm.phone, first_name: signupForm.first_name, last_name: signupForm.last_name || "", email: signupForm.email || "", birthday });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/signup?${params.toString()}`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await resp.json();
      if (resp.ok) {
        setSignupResult({ status: data.status, message: data.message, points: data.points });
        setShowSignup(false);
        setPhone(signupForm.phone);
        setTimeout(() => handleLookup(), 500);
      } else {
        setSignupResult({ status: "error", message: data.detail || "Something went wrong. Please try again." });
      }
    } catch {
      setSignupResult({ status: "error", message: "Unable to connect. Please try again." });
    }
    setSignupLoading(false);
  };

  const handleReferral = async () => {
    if (!referralForm.friend_name || !referralForm.friend_email || !customer) return;
    setReferralLoading(true);
    setReferralMsg("");
    try {
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrer_phone: customer.phone, friend_name: referralForm.friend_name, friend_email: referralForm.friend_email }),
      });
      if (resp.ok) {
        setReferralMsg("Referral sent! You'll earn 500 points when your friend makes their first purchase.");
        setReferralForm({ friend_name: "", friend_email: "" });
      } else {
        const data = await resp.json();
        setReferralMsg(data.detail || "Could not send referral. Please try again.");
      }
    } catch {
      setReferralMsg("Unable to connect. Please try again.");
    }
    setReferralLoading(false);
  };

  const currentTier = VIP_TIERS.find(t => lifetimeEarned >= t.min && lifetimeEarned <= t.max) || VIP_TIERS[0];
  const nextTier = VIP_TIERS[VIP_TIERS.indexOf(currentTier) + 1] || null;
  const tierProgress = nextTier ? Math.min(100, ((lifetimeEarned - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  const isBirthdayMonth = () => {
    if (!customer?.birthday) return false;
    const parts = customer.birthday.split("/");
    if (parts.length < 2) return false;
    const now = new Date();
    return parseInt(parts[0]) === (now.getMonth() + 1);
  };

  const toggleSection = (s: string) => setActiveSection(activeSection === s ? null : s);

  const displayedTx = showAllTx ? transactions : transactions.slice(0, 10);

  const inputClass = "w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[#B3D335] rounded-full mb-6">
                  <Gift className="h-10 w-10 text-[#231F20]" />
        </div>
        <h1 className="text-4xl font-bold text-[#231F20] mb-3">Hemp Rewards</h1>
        <p className="text-[#231F20] text-lg max-w-2xl mx-auto">Earn points on every purchase, unlock VIP tiers, and redeem for discounts.</p>
      </div>

      {/* Sign Up Result Toast */}
      {signupResult && (
        <div className={`max-w-lg mx-auto mb-8 p-4 rounded-lg text-center ${signupResult.status === "error" ? "bg-[#D9A32C]/10 border border-[#D9A32C]/30" : "bg-[#B3D335]/10 border border-[#B3D335]/30"}`}>
          <p className={`font-semibold ${signupResult.status === "error" ? "text-[#D9A32C]" : "text-[#126A44]"}`}>{signupResult.message}</p>
          {signupResult.points !== undefined && signupResult.points > 0 && <p className="text-[#231F20] mt-1">You earned <span className="font-bold text-[#B3D335]">{signupResult.points} bonus points</span> for signing up!</p>}
        </div>
      )}

      {/* Points Lookup */}
      <div className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#231F20]/20 max-w-lg mx-auto mb-10 shadow-sm">
        <h2 className="text-xl font-bold text-[#231F20] mb-4 text-center">Check Your Points</h2>
        <div className="flex gap-3">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number"
            className="flex-1 bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]"
            onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }} />
          <button onClick={handleLookup} disabled={lookupLoading || !phone}
            className="px-6 py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-lg font-medium transition-colors disabled:opacity-50">
            {lookupLoading ? "..." : "Look Up"}
          </button>
        </div>

        {lookupDone && !customer && (
          <div className="mt-4 p-4 rounded-lg bg-[#FFFFFF] border border-[#231F20]/20 text-center">
            <p className="text-[#231F20]">No rewards account found for this number.</p>
            <button onClick={() => { setShowSignup(true); setSignupForm(f => ({ ...f, phone })); }} className="mt-3 text-[#B3D335] hover:text-[#126A44] font-medium underline transition-colors">Sign up for Hemp Rewards</button>
          </div>
        )}

        {customer && (
          <div className="mt-4 p-5 rounded-lg bg-[#B3D335]/10 border border-[#B3D335]/30">
            <div className="text-center">
              <p className="text-[#126A44] font-semibold text-lg">Welcome back, {customer.first_name} {customer.last_name}!</p>
              <p className="text-[#231F20] font-bold text-3xl mt-1">{customer.points_balance} <span className="text-base font-normal text-[#231F20]">points</span></p>
              {/* VIP Tier Progress */}
              <div className="mt-4 pt-4 border-t border-[#231F20]/10">
                <div className="flex items-center gap-2 mb-2">
                  <currentTier.icon className="h-5 w-5" style={{ color: currentTier.color }} />
                  <span className="text-[#231F20] font-semibold text-sm">{currentTier.name} Member</span>
                </div>
                {nextTier ? (
                  <>
                    <div className="w-full h-3 bg-[#231F20]/15 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#B3D335] rounded-full transition-all duration-500" style={{ width: `${tierProgress}%` }} />
                    </div>
                    <p className="text-[#231F20] text-sm">Spend <span className="font-bold text-[#231F20]">${nextTier.min - lifetimeEarned} more</span> to reach <span className="font-bold" style={{ color: nextTier.color }}>{nextTier.name}</span> and earn {nextTier.multiplier} points on every purchase.</p>
                  </>
                ) : (
                  <p className="text-[#126A44] text-sm font-medium">You&apos;ve reached the highest tier — {currentTier.multiplier} points on every purchase!</p>
                )}
              </div>
              {isBirthdayMonth() && (
                <div className="mt-3 inline-flex items-center gap-2 bg-[#FFCB08]/20 border border-[#FFCB08]/40 rounded-full px-4 py-1.5">
                  <Cake className="h-4 w-4 text-[#D9A32C]" />
                  <span className="text-[#D9A32C] font-semibold text-sm">Happy Birthday Month!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== PROFILE SECTIONS (shown after lookup) ===== */}
      {customer && (
        <div className="space-y-6">

          {/* --- VIP TIER STATUS --- */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("vip")}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTier.color + "20" }}>
                  <currentTier.icon className="h-5 w-5" style={{ color: currentTier.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#231F20]">VIP Tier: {currentTier.name}</h3>
                  <p className="text-[#231F20] text-sm">{currentTier.multiplier} points multiplier</p>
                </div>
              </div>
              {activeSection === "vip" ? <ChevronUp className="h-5 w-5 text-[#231F20]" /> : <ChevronDown className="h-5 w-5 text-[#231F20]" />}
            </div>

            {activeSection === "vip" && (
              <div className="space-y-4">
                {/* Progress bar */}
                {nextTier && (
                  <div>
                    <div className="flex justify-between text-xs text-[#231F20] mb-1">
                      <span>{currentTier.name} (${currentTier.min}+)</span>
                      <span>{nextTier.name} (${nextTier.min}+)</span>
                    </div>
                    <div className="w-full h-3 bg-[#231F20]/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${tierProgress}%`, backgroundColor: currentTier.color }} />
                    </div>
                    <p className="text-xs text-[#231F20] mt-1">${nextTier.min - lifetimeEarned} more in earnings to reach {nextTier.name}</p>
                  </div>
                )}
                {!nextTier && <p className="text-sm text-[#126A44] font-medium">You've reached the highest tier!</p>}

                {/* All tiers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {VIP_TIERS.map(tier => {
                    const TierIcon = tier.icon;
                    const isActive = tier.name === currentTier.name;
                    return (
                      <div key={tier.name} className={`rounded-xl p-4 border text-center ${isActive ? "border-2" : "border border-[#231F20]/10 opacity-60"}`} style={isActive ? { borderColor: tier.color, backgroundColor: tier.color + "10" } : {}}>
                        <TierIcon className="h-6 w-6 mx-auto mb-2" style={{ color: tier.color }} />
                        <p className="font-bold text-[#231F20] text-sm">{tier.name}</p>
                        <p className="text-xs text-[#231F20]">{tier.multiplier} points</p>
                        <p className="text-xs text-[#231F20] mt-1">${tier.min}{tier.max === Infinity ? "+" : `–$${tier.max}`}</p>
                        <ul className="mt-2 space-y-0.5">
                          {tier.benefits.map((b, i) => <li key={i} className="text-[10px] text-[#231F20]">{b}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* --- POINTS ACTIVITY LOG --- */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("activity")}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFCB08]/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#D9A32C]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#231F20]">Points Activity</h3>
                  <p className="text-[#231F20] text-sm">{transactions.length} transactions</p>
                </div>
              </div>
              {activeSection === "activity" ? <ChevronUp className="h-5 w-5 text-[#231F20]" /> : <ChevronDown className="h-5 w-5 text-[#231F20]" />}
            </div>

            {activeSection === "activity" && (
              <div>
                {transactions.length === 0 ? (
                  <p className="text-[#231F20] text-sm text-center py-4">No transactions yet. Start earning points!</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#231F20]/10">
                            <th className="text-left py-2 text-[#231F20] font-medium">Activity</th>
                            <th className="text-right py-2 text-[#231F20] font-medium">Points</th>
                            <th className="text-right py-2 text-[#231F20] font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedTx.map((tx, i) => (
                            <tr key={i} className="border-b border-[#231F20]/5">
                              <td className="py-2.5 text-[#231F20]">{tx.description || (tx.type === "earn" ? "Points Earned" : tx.type === "redeem" ? "Points Redeemed" : tx.type)}</td>
                              <td className={`py-2.5 text-right font-semibold ${tx.type === "earn" || tx.points > 0 ? "text-[#126A44]" : "text-[#D9A32C]"}`}>
                                {tx.type === "earn" || tx.points > 0 ? "+" : ""}{tx.points}
                              </td>
                              <td className="py-2.5 text-right text-[#231F20]">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {transactions.length > 10 && (
                      <button onClick={() => setShowAllTx(!showAllTx)} className="mt-3 text-[#B3D335] hover:text-[#126A44] text-sm font-medium transition-colors">
                        {showAllTx ? "Show Less" : `Show All ${transactions.length} Transactions`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* --- REDEMPTION LADDER --- */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("redeem")}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#58BA49]/20 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-[#126A44]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#231F20]">Redeem Points</h3>
                  <p className="text-[#231F20] text-sm">{customer.points_balance} points available</p>
                </div>
              </div>
              {activeSection === "redeem" ? <ChevronUp className="h-5 w-5 text-[#231F20]" /> : <ChevronDown className="h-5 w-5 text-[#231F20]" />}
            </div>

            {activeSection === "redeem" && (
              <div className="space-y-3">
                {REDEMPTION_TIERS.map(tier => {
                  const canAfford = customer.points_balance >= tier.points;
                  const needed = tier.points - customer.points_balance;
                  return (
                    <div key={tier.points} className={`flex items-center justify-between p-4 rounded-xl border ${canAfford ? "border-[#58BA49]/30 bg-[#58BA49]/5" : "border-[#231F20]/10 opacity-50"}`}>
                      <div>
                        <p className={`font-bold ${canAfford ? "text-[#231F20]" : "text-[#231F20]"}`}>{tier.discount}</p>
                        <p className="text-xs text-[#231F20]">{tier.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${canAfford ? "text-[#126A44]" : "text-[#231F20]"}`}>{tier.points} pts</p>
                        {!canAfford && <p className="text-[10px] text-[#D9A32C]">{needed} more needed</p>}
                        {canAfford && <p className="text-[10px] text-[#126A44] font-medium">Available!</p>}
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-[#231F20] text-center mt-2">Visit any location to redeem your points</p>
              </div>
            )}
          </div>

          {/* --- REFERRAL PROGRAM --- */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("referral")}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#B3D335]/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#3D8C32]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#231F20]">Refer a Friend</h3>
                  <p className="text-[#231F20] text-sm">Give $20, Get $20</p>
                </div>
              </div>
              {activeSection === "referral" ? <ChevronUp className="h-5 w-5 text-[#231F20]" /> : <ChevronDown className="h-5 w-5 text-[#231F20]" />}
            </div>

            {activeSection === "referral" && (
              <div>
                <div className="bg-[#B3D335]/10 border border-[#B3D335]/20 rounded-xl p-4 mb-4 text-center">
                  <p className="text-[#231F20] font-semibold">Your friend gets <span className="text-[#126A44]">$20 off</span> their first order</p>
                  <p className="text-[#231F20] text-sm">You earn <span className="font-bold text-[#126A44]">500 points</span> when they make their first purchase</p>
                </div>
                <div className="space-y-3">
                  <input type="text" value={referralForm.friend_name} onChange={(e) => setReferralForm(f => ({ ...f, friend_name: e.target.value }))} placeholder="Friend's name" className={inputClass} />
                  <input type="email" value={referralForm.friend_email} onChange={(e) => setReferralForm(f => ({ ...f, friend_email: e.target.value }))} placeholder="Friend's email" className={inputClass} />
                  <button onClick={handleReferral} disabled={referralLoading || !referralForm.friend_name || !referralForm.friend_email}
                    className="w-full py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-lg font-medium transition-colors disabled:opacity-50">
                    {referralLoading ? "Sending..." : "Send Referral"}
                  </button>
                  {referralMsg && <p className="text-sm text-center text-[#126A44]">{referralMsg}</p>}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ===== GENERAL SECTIONS (always visible) ===== */}
      <div className="mt-10 space-y-6">

        {/* --- WAYS TO EARN --- */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#ADD038]/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[#3D8C32]" />
            </div>
            <h3 className="text-lg font-bold text-[#231F20]">Ways to Earn</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {WAYS_TO_EARN.map(way => {
              const WayIcon = way.icon;
              return (
                <div key={way.label} className="flex items-start gap-3 p-3 rounded-xl border border-[#231F20]/10 hover:border-[#B3D335]/40 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-[#B3D335]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <WayIcon className="h-4 w-4 text-[#126A44]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#231F20] font-semibold text-sm leading-tight">{way.label}</p>
                    <p className="text-[#126A44] font-bold text-xs">+{way.pts} pts</p>
                    <p className="text-[#231F20] text-[11px] leading-tight">{way.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- HOW IT WORKS --- */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10 text-center">
            <div className="text-3xl font-bold text-[#B3D335] mb-2">1</div>
            <h3 className="text-[#231F20] font-semibold mb-2">Sign Up</h3>
            <p className="text-[#231F20] text-sm">Create your rewards account with your phone number at any location or online.</p>
          </div>
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10 text-center">
            <div className="text-3xl font-bold text-[#B3D335] mb-2">2</div>
            <h3 className="text-[#231F20] font-semibold mb-2">Earn Points</h3>
            <p className="text-[#231F20] text-sm">Earn 1 point for every $1 spent. Points work across East, West, and online.</p>
          </div>
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10 text-center">
            <div className="text-3xl font-bold text-[#B3D335] mb-2">3</div>
            <h3 className="text-[#231F20] font-semibold mb-2">Redeem</h3>
            <p className="text-[#231F20] text-sm">100 pts = $5 off, 250 pts = $15 off, 500 pts = $35 off, 1000 pts = $75 off.</p>
          </div>
        </div>

        {/* --- VIP TIER OVERVIEW (for non-logged-in users) --- */}
        {!customer && (
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#231F20]/10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#FFCB08]/20 flex items-center justify-center">
                <Crown className="h-5 w-5 text-[#D9A32C]" />
              </div>
              <h3 className="text-lg font-bold text-[#231F20]">VIP Tiers</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {VIP_TIERS.map(tier => {
                const TierIcon = tier.icon;
                return (
                  <div key={tier.name} className="rounded-xl p-4 border border-[#231F20]/10 text-center">
                    <TierIcon className="h-6 w-6 mx-auto mb-2" style={{ color: tier.color }} />
                    <p className="font-bold text-[#231F20] text-sm">{tier.name}</p>
                    <p className="text-xs text-[#231F20]">{tier.multiplier} points</p>
                    <p className="text-xs text-[#231F20] mt-1">${tier.min}{tier.max === Infinity ? "+" : `–$${tier.max}`}</p>
                    <ul className="mt-2 space-y-0.5">
                      {tier.benefits.map((b, i) => <li key={i} className="text-[10px] text-[#231F20]">{b}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sign Up Form */}
      {showSignup && (
        <div className="fixed inset-0 bg-[#231F20]/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSignup(false)}>
          <div className="bg-[#FFFFFF] rounded-2xl p-8 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-[#231F20] mb-2 text-center">Join Hemp Rewards</h2>
            <p className="text-[#231F20] text-sm text-center mb-6">Create your free rewards account and start earning points!</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#231F20] mb-1.5">First Name *</label>
                  <input type="text" value={signupForm.first_name} onChange={(e) => setSignupForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#231F20] mb-1.5">Last Name</label>
                  <input type="text" value={signupForm.last_name} onChange={(e) => setSignupForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#231F20] mb-1.5">Phone Number *</label>
                <input type="tel" value={signupForm.phone} onChange={(e) => setSignupForm(f => ({ ...f, phone: e.target.value }))} placeholder="(352) 555-0123" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#231F20] mb-1.5">Email (optional)</label>
                <input type="email" value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#231F20] mb-1.5">Birthday (optional, for bonus points)</label>
                <div className="grid grid-cols-2 gap-3">
                  <select value={signupForm.birthday_month} onChange={(e) => setSignupForm(f => ({ ...f, birthday_month: e.target.value }))} className={inputClass}>
                    <option value="">Month</option>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                      <option key={m} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                  <select value={signupForm.birthday_day} onChange={(e) => setSignupForm(f => ({ ...f, birthday_day: e.target.value }))} className={inputClass}>
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={String(d)}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={handleSignup} disabled={signupLoading || !signupForm.first_name || !signupForm.phone}
                className="w-full py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-lg font-medium transition-colors disabled:opacity-50">
                {signupLoading ? "Creating account..." : "Create My Rewards Account"}
              </button>
              <button onClick={() => setShowSignup(false)} className="w-full py-2 text-[#231F20] hover:text-[#231F20] text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sign up CTA */}
      {!customer && !showSignup && !signupResult && (
        <div className="text-center mt-8">
          <p className="text-[#231F20] text-sm">Don't have an account? <button onClick={() => setShowSignup(true)} className="text-[#126A44] hover:text-[#3D8C32] font-medium underline">Sign up for free</button></p>
        </div>
      )}
    </div>
  );
}


/* ======================== ACCOUNT PAGE (Preserved) ======================== */

function AccountPage() {
  const [loginForm, setLoginForm] = useState({ phone: "", email: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  const [memberData, setMemberData] = useState<{ name: string; phone: string; points: number; email: string } | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({ first_name: "", last_name: "", phone: "", email: "" });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<{ status: string; message: string; points?: number } | null>(null);

  const handleLogin = async () => {
    if (!loginForm.phone && !loginForm.email) { setLoginError("Enter your phone number or email."); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const query = loginForm.phone ? `phone=${encodeURIComponent(loginForm.phone)}` : `email=${encodeURIComponent(loginForm.email)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/lookup?${query}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.found && data.customer) {
          setMemberData({ name: `${data.customer.first_name} ${data.customer.last_name || ""}`.trim() || "Member", phone: data.customer.phone || loginForm.phone, points: data.customer.points_balance || 0, email: data.customer.email || loginForm.email });
          setLoggedIn(true);
        } else if (data.found) {
          setMemberData({ name: data.name || data.first_name || "Member", phone: data.phone || loginForm.phone, points: data.points_balance || data.points || 0, email: data.email || loginForm.email });
          setLoggedIn(true);
        } else {
          setLoginError("Account not found. Sign up below to create your rewards account!");
        }
      } else {
        setLoginError("Account not found. Sign up below to create your rewards account!");
      }
    } catch {
      setLoginError("Unable to connect. Please try again.");
    }
    setLoginLoading(false);
  };

  const handleSignup = async () => {
    if (!signupForm.first_name || !signupForm.phone) return;
    setSignupLoading(true);
    setSignupResult(null);
    try {
      const params = new URLSearchParams({ phone: signupForm.phone, first_name: signupForm.first_name, last_name: signupForm.last_name || "", email: signupForm.email || "" });
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 10000);
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/signup?${params.toString()}`, { signal: controller2.signal });
      clearTimeout(timeout2);
      const data = await resp.json();
      if (resp.ok) {
        setSignupResult({ status: data.status, message: data.message, points: data.points });
        if (data.status === "created" || data.status === "existing") {
          setMemberData({ name: signupForm.first_name + (signupForm.last_name ? ` ${signupForm.last_name}` : ""), phone: signupForm.phone, points: data.points || 0, email: signupForm.email });
          setLoggedIn(true);
          setShowSignup(false);
        }
      } else {
        setSignupResult({ status: "error", message: data.detail || "Something went wrong. Please try again." });
      }
    } catch {
      setSignupResult({ status: "error", message: "Unable to connect. Please try again." });
    }
    setSignupLoading(false);
  };

  if (loggedIn && memberData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#231F20]/20 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B3D335]/20 rounded-full mb-4">
              <User className="h-8 w-8 text-[#126A44]" />
            </div>
            <h1 className="text-2xl font-bold text-[#231F20]">{memberData.name}</h1>
            <p className="text-[#231F20]">{memberData.phone} {memberData.email ? `| ${memberData.email}` : ""}</p>
          </div>
          <div className="bg-[#FFFFFF] rounded-xl p-6 text-center mb-6">
            <p className="text-[#231F20] text-sm mb-1">Your Reward Points</p>
            <p className="text-4xl font-bold text-[#B3D335]">{memberData.points}</p>
            <p className="text-[#231F20] text-xs mt-1">Points work across all locations + online</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#FFFFFF] rounded-lg">
              <span className="text-[#231F20]">100 points</span>
              <span className="text-[#126A44] font-semibold">$5 off</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#FFFFFF] rounded-lg">
              <span className="text-[#231F20]">200 points</span>
              <span className="text-[#126A44] font-semibold">$12 off</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#FFFFFF] rounded-lg">
              <span className="text-[#231F20]">500 points</span>
              <span className="text-[#126A44] font-semibold">$35 off</span>
            </div>
          </div>
          <button onClick={() => { setLoggedIn(false); setMemberData(null); setSignupResult(null); }} className="w-full mt-6 py-3 border border-[#231F20]/20 text-[#231F20] hover:text-[#231F20] rounded-lg transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      {/* Sign Up Result */}
      {signupResult && !loggedIn && (
        <div className={`mb-6 p-4 rounded-lg text-center ${signupResult.status === "error" ? "bg-[#D9A32C]/10 border border-[#D9A32C]/30" : "bg-[#B3D335]/10 border border-[#B3D335]/30"}`}>
          <p className={`font-semibold ${signupResult.status === "error" ? "text-[#D9A32C]" : "text-[#126A44]"}`}>{signupResult.message}</p>
        </div>
      )}

      {!showSignup ? (
        <div className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#231F20]/20 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B3D335]/20 rounded-full mb-4">
              <User className="h-8 w-8 text-[#126A44]" />
            </div>
            <h1 className="text-2xl font-bold text-[#231F20] mb-2">Sign In</h1>
            <p className="text-[#231F20] text-sm">Access your Hemp Rewards account</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#231F20] mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={loginForm.phone}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(352) 555-0123"
                className="w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]"
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
            </div>
            <div className="text-center text-[#231F20] text-sm">— or —</div>
            <div>
              <label className="block text-sm font-medium text-[#231F20] mb-1.5">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]"
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
            </div>
            {loginError && <p className="text-[#D9A32C] text-sm text-center">{loginError}</p>}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
          <div className="text-center mt-6 border-t border-[#231F20]/20 pt-6">
            <p className="text-[#231F20] text-sm mb-3">Don't have an account?</p>
            <button onClick={() => setShowSignup(true)} className="w-full py-3 border border-[#B3D335] text-[#231F20] hover:bg-[#B3D335]/10 rounded-lg font-medium transition-colors">
              Sign Up for Hemp Rewards
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#B3D335]/50 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B3D335]/20 rounded-full mb-4">
              <Gift className="h-8 w-8 text-[#126A44]" />
            </div>
            <h1 className="text-2xl font-bold text-[#231F20] mb-2">Join Hemp Rewards</h1>
            <p className="text-[#231F20] text-sm">Create your free rewards account and start earning points!</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#231F20] mb-1.5">First Name *</label>
                <input type="text" value={signupForm.first_name} onChange={(e) => setSignupForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" className="w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#231F20] mb-1.5">Last Name</label>
                <input type="text" value={signupForm.last_name} onChange={(e) => setSignupForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className="w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#231F20] mb-1.5">Phone Number *</label>
              <input type="tel" value={signupForm.phone} onChange={(e) => setSignupForm(f => ({ ...f, phone: e.target.value }))} placeholder="(352) 555-0123" className="w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#231F20] mb-1.5">Email (optional)</label>
              <input type="email" value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full bg-[#FFFFFF] border border-[#231F20]/20 rounded-lg px-4 py-3 text-[#231F20] placeholder-[#231F20]/30 focus:outline-none focus:border-[#B3D335]" />
            </div>
            {signupResult && signupResult.status === "error" && <p className="text-[#D9A32C] text-sm text-center">{signupResult.message}</p>}
            <button onClick={handleSignup} disabled={signupLoading || !signupForm.first_name || !signupForm.phone} className="w-full py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-lg font-medium transition-colors disabled:opacity-50">
              {signupLoading ? "Creating account..." : "Create My Rewards Account"}
            </button>
            <button onClick={() => { setShowSignup(false); setSignupResult(null); }} className="w-full py-2 text-[#231F20] hover:text-[#231F20] text-sm transition-colors">Already have an account? Sign in</button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ======================== GAMES (Preserved) ======================== */

function ScratchCardGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [prize, setPrize] = useState("");
  const [prizeEmoji, setPrizeEmoji] = useState("");
  const [scratchPercent, setScratchPercent] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const scratchedPixels = useRef(0);
  const totalPixels = useRef(0);

  // Auth gating state
  const [scratchPhone, setScratchPhone] = useState("");
  const [scratchAuthed, setScratchAuthed] = useState(false);
  const [scratchAuthName, setScratchAuthName] = useState("");
  const [scratchAuthLoading, setScratchAuthLoading] = useState(false);
  const [scratchAuthError, setScratchAuthError] = useState("");
  const [scratchCooldown, setScratchCooldown] = useState(false);
  const [shared, setShared] = useState(false);

  // Check cooldown on mount / after auth
  useEffect(() => {
    if (scratchAuthed && scratchPhone) {
      const key = `thd-scratch-${scratchPhone}`;
      const lastPlay = localStorage.getItem(key);
      if (lastPlay && Date.now() - Number(lastPlay) < 86400000) {
        setScratchCooldown(true);
      }
    }
  }, [scratchAuthed, scratchPhone]);

  const handleScratchAuth = async () => {
    if (!scratchPhone) return;
    setScratchAuthLoading(true);
    setScratchAuthError("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/lookup?phone=${encodeURIComponent(scratchPhone)}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.found) {
          const name = data.customer ? `${data.customer.first_name} ${data.customer.last_name || ""}`.trim() : (data.name || data.first_name || "Member");
          setScratchAuthName(name);
          setScratchAuthed(true);
          // Check cooldown
          const key = `thd-scratch-${scratchPhone}`;
          const lastPlay = localStorage.getItem(key);
          if (lastPlay && Date.now() - Number(lastPlay) < 86400000) {
            setScratchCooldown(true);
          }
        } else {
          setScratchAuthError("No rewards account found. Sign up at the Rewards page first!");
        }
      } else {
        setScratchAuthError("Could not verify your account. Please try again.");
      }
    } catch {
      setScratchAuthError("Connection error. Please try again.");
    }
    setScratchAuthLoading(false);
  };

  const prizes = [
    { text: "10% OFF", emoji: "\u{1F389}", desc: "Use code HEMP10 at checkout" },
    { text: "15% OFF", emoji: "\u{1F38A}", desc: "Use code HEMP15 at checkout" },
    { text: "20% OFF", emoji: "\u{1F525}", desc: "Use code HEMP20 at checkout" },
    { text: "FREE SHIPPING", emoji: "\u{1F69A}", desc: "Use code FREESHIP at checkout" },
    { text: "500 POINTS", emoji: "\u2B50", desc: "Added to your Hemp Rewards" },
    { text: "BUY 1 GET 1", emoji: "\u{1F381}", desc: "On select products" },
    { text: "$5 OFF", emoji: "\u{1F4B5}", desc: "Use code SAVE5 at checkout" },
    { text: "MYSTERY GIFT", emoji: "\u{1F381}", desc: "Free gift with next purchase" },
  ];

  useEffect(() => {
    const p = prizes[Math.floor(Math.random() * prizes.length)];
    setPrize(p.text);
    setPrizeEmoji(p.emoji);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 320;
    canvas.height = 200;
    totalPixels.current = canvas.width * canvas.height;
    // Draw scratch overlay
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#126A44");
    grad.addColorStop(0.5, "#126A44");
    grad.addColorStop(1, "#126A44");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw pattern
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = -canvas.height; i < canvas.width; i += 12) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + canvas.height, canvas.height); ctx.stroke();
    }
    // Draw text
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "14px sans-serif";
    ctx.fillText("to reveal your prize!", canvas.width / 2, canvas.height / 2 + 15);
    // Cannabis leaf symbols
    ctx.font = "24px serif";
    ctx.fillText("\u{1F33F} \u{1F33F} \u{1F33F}", canvas.width / 2, canvas.height - 20);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (x - rect.left) * (canvas.width / rect.width);
    const cy = (y - rect.top) * (canvas.height / rect.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    scratchedPixels.current += 22 * 22 * Math.PI;
    const pct = Math.min(100, (scratchedPixels.current / totalPixels.current) * 100);
    setScratchPercent(pct);
    if (pct > 55 && !revealed) {
      setRevealed(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Record play time for 24h cooldown
      if (scratchPhone) {
        localStorage.setItem(`thd-scratch-${scratchPhone}`, String(Date.now()));
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => { setIsScratching(true); setHasStarted(true); scratch(e.clientX, e.clientY); };
  const handleMouseMove = (e: React.MouseEvent) => { if (isScratching) scratch(e.clientX, e.clientY); };
  const handleMouseUp = () => setIsScratching(false);
  const handleTouchStart = (e: React.TouchEvent) => { setHasStarted(true); const t = e.touches[0]; scratch(t.clientX, t.clientY); };
  const handleTouchMove = (e: React.TouchEvent) => { e.preventDefault(); const t = e.touches[0]; scratch(t.clientX, t.clientY); };

  const handleShareWin = () => {
    const shareText = `I just won ${prize} at The Hemp Dispensary! Use code FIRST20 for 20% off your first order \u2192 https://its420here.com`;
    if (navigator.share) {
      navigator.share({ title: "I won at The Hemp Dispensary!", text: shareText, url: "https://its420here.com" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => setShared(true)).catch(() => {});
    }
  };

  const currentPrize = prizes.find(p => p.text === prize);

  // Auth gate
  if (!scratchAuthed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#231F20] mb-2">Scratch & Win!</h1>
          <p className="text-[#231F20]">Enter your rewards number to play</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#231F20]/15 p-8 text-center max-w-md mx-auto">
          <Gift className="h-12 w-12 text-[#126A44] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#231F20] mb-2">Rewards Members Only</h2>
          <p className="text-[#231F20] text-sm mb-6">Enter your rewards phone number to unlock your daily scratch card. Not a member? <a href="#/loyalty" className="text-[#126A44] underline">Sign up free</a></p>
          <input type="tel" placeholder="(555) 555-5555" value={scratchPhone} onChange={(e) => setScratchPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScratchAuth()}
            className="w-full px-4 py-3 rounded-xl border border-[#231F20]/15 text-[#231F20] text-center text-lg mb-4 focus:outline-none focus:border-[#B3D335]" />
          {scratchAuthError && <p className="text-[#231F20] text-sm mb-3">{scratchAuthError}</p>}
          <button onClick={handleScratchAuth} disabled={scratchAuthLoading || !scratchPhone}
            className="w-full py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-xl font-semibold transition-colors disabled:opacity-50">
            {scratchAuthLoading ? "Verifying..." : "Unlock My Scratch Card"}
          </button>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {prizes.map((p, i) => (
            <div key={i} className="bg-[#FFFFFF] border border-[#231F20]/10 rounded-lg p-3 text-center">
              <span className="text-2xl">{p.emoji}</span>
              <p className="text-xs text-[#231F20] mt-1 font-medium">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cooldown gate
  if (scratchCooldown) {
    const key = `thd-scratch-${scratchPhone}`;
    const lastPlay = Number(localStorage.getItem(key) || "0");
    const nextPlay = lastPlay + 86400000;
    const hoursLeft = Math.max(0, Math.ceil((nextPlay - Date.now()) / 3600000));
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#231F20] mb-2">Scratch & Win!</h1>
          <p className="text-[#231F20]">Welcome back, {scratchAuthName}!</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#231F20]/15 p-8 text-center max-w-md mx-auto">
          <Clock className="h-12 w-12 text-[#D9A32C] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#231F20] mb-2">Come Back Tomorrow!</h2>
          <p className="text-[#231F20] text-sm mb-4">You already played today. Your next scratch card unlocks in <span className="font-bold text-[#231F20]">{hoursLeft} hour{hoursLeft !== 1 ? "s" : ""}</span>.</p>
          <p className="text-[#231F20] text-xs mb-6">Make a purchase to earn an extra scratch card!</p>
          <button onClick={() => navigate("/shop")} className="w-full py-3 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-xl font-semibold transition-colors">Shop Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#231F20] mb-2">Scratch & Win!</h1>
        <p className="text-[#231F20]">Welcome, {scratchAuthName}! Scratch the card below to reveal your prize</p>
      </div>
      <div className="bg-[#231F20] rounded-2xl border border-[#231F20] p-8 text-center">
        <div className="relative inline-block rounded-xl overflow-hidden border-4 border-[#B3D335] shadow-lg shadow-[#B3D335]/30" style={{ width: 320, height: 200 }}>
          {/* Prize underneath */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#231F20] via-[#231F20] to-[#231F20]">
            <span className="text-5xl mb-2">{prizeEmoji}</span>
            <span className="text-2xl font-bold text-[#B3D335]">{prize}</span>
            {currentPrize && <span className="text-sm text-[#231F20] mt-1">{currentPrize.desc}</span>}
          </div>
          {/* Scratch canvas on top */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-pointer" style={{ width: 320, height: 200, touchAction: "none" }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
          />
        </div>
        {hasStarted && !revealed && <div className="mt-4"><div className="w-64 mx-auto bg-[#231F20]/10 rounded-full h-2"><div className="bg-[#B3D335] h-2 rounded-full transition-all" style={{ width: `${scratchPercent}%` }} /></div><p className="text-xs text-[#231F20] mt-1">{Math.round(scratchPercent)}% scratched</p></div>}
        {revealed && (
          <div className="mt-6">
            <p className="text-[#B3D335] text-lg font-semibold mb-4 animate-pulse">Congratulations, {scratchAuthName}! You won {prize}!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleShareWin}
                className="px-6 py-2 bg-[#58BA49] hover:bg-[#3D8C32] text-[#FFFFFF] rounded-full font-medium transition-all">
                {shared ? "Copied!" : "Share your win \u{1F389}"}
              </button>
              <button onClick={() => navigate("/loyalty")}
                className="px-6 py-2 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-medium transition-all">
                Check Rewards Balance
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {prizes.map((p, i) => (
          <div key={i} className="bg-[#231F20]/50 border border-[#231F20] rounded-lg p-3 text-center">
            <span className="text-2xl">{p.emoji}</span>
            <p className="text-xs text-[#231F20] mt-1 font-medium">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================== ROLL A JOINT GAME ======================== */
const STRAINS = [
  { name: "OG Kush", color: "#3D8C32", desc: "Classic earthy pine" },
  { name: "Purple Haze", color: "#231F20", desc: "Sweet berry vibes" },
  { name: "Sour Diesel", color: "#ADD038", desc: "Energizing citrus" },
  { name: "Blue Dream", color: "#231F20", desc: "Calm & creative" },
];

function BudPuppet({ size = 80, className = "", action = "idle" }: { size?: number; className?: string; action?: string }) {
  const actionClass = action === "grind" ? "animate-spin-slow" : action === "roll" ? "animate-wiggle" : action === "light" ? "animate-pulse" : action === "smoke" ? "animate-float" : action === "celebrate" ? "animate-bounce" : "";
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <img src="/bud-puppet.webp" alt="Bud Puppet" className={`w-full h-full object-contain drop-shadow-lg ${actionClass}`} style={{ filter: "drop-shadow(0 0 12px rgba(88,186,73,0.4))" }} />
      {action === "grind" && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-[#B3D335] animate-pulse whitespace-nowrap">Grinding...</div>}
      {action === "roll" && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-[#FFCB08] animate-pulse whitespace-nowrap">Rolling!</div>}
      {action === "light" && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce">{"\uD83D\uDD25"}</div>}
      {action === "smoke" && <>
        <div className="absolute -top-6 left-1/4 text-xl animate-float opacity-70">{"\uD83D\uDCA8"}</div>
        <div className="absolute -top-8 right-1/4 text-lg animate-pulse opacity-50">{"\uD83D\uDCA8"}</div>
      </>}
    </div>
  );
}

function RollAJointGame() {
  const [step, setStep] = useState(0); // 0=pick, 1=grind, 2=roll, 3=light, 4=smoke, 5=done
  const [selectedStrain, setSelectedStrain] = useState<typeof STRAINS[0] | null>(null);
  const [grindProgress, setGrindProgress] = useState(0);
  const [rollProgress, setRollProgress] = useState(0);
  const [lightProgress, setLightProgress] = useState(0);
  const [smokeOpacity, setSmokeOpacity] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const grindInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const budAction = step === 0 ? "idle" : step === 1 ? "grind" : step === 2 ? "roll" : step === 3 ? "light" : step === 4 ? "smoke" : "celebrate";

  const pickStrain = (strain: typeof STRAINS[0]) => {
    setSelectedStrain(strain);
    setStep(1);
  };

  const startGrind = () => {
    if (grindInterval.current) return;
    grindInterval.current = setInterval(() => {
      setGrindProgress(p => {
        if (p >= 100) { clearInterval(grindInterval.current!); grindInterval.current = null; setStep(2); return 100; }
        return p + 3;
      });
    }, 50);
  };

  const stopGrind = () => {
    if (grindInterval.current) { clearInterval(grindInterval.current); grindInterval.current = null; }
  };

  const handleRollClick = () => {
    setRollProgress(p => {
      const next = Math.min(100, p + 8);
      if (next >= 100) setTimeout(() => setStep(3), 300);
      return next;
    });
  };

  const handleLightClick = () => {
    setLightProgress(p => {
      const next = Math.min(100, p + 12);
      if (next >= 100) {
        setTimeout(() => {
          setStep(4);
          let op = 0;
          const smokeAnim = setInterval(() => {
            op += 0.02;
            setSmokeOpacity(op);
            if (op >= 1) {
              clearInterval(smokeAnim);
              setTimeout(() => { setStep(5); setScore(s => s + 100 + round * 10); }, 1500);
            }
          }, 50);
        }, 300);
      }
      return next;
    });
  };

  const nextRound = () => {
    setStep(0); setSelectedStrain(null); setGrindProgress(0); setRollProgress(0); setLightProgress(0); setSmokeOpacity(0);
    setRound(r => r + 1);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-[#FFFFFF] mb-2">Roll a Joint!</h1>
        <p className="text-[#231F20]">Help Bud Puppet grind, roll, light, and enjoy</p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <span className="text-[#B3D335] font-bold">Round {round}</span>
          <span className="text-[#FFCB08] font-bold">Score: {score}</span>
        </div>
      </div>

      <div className="bg-[#231F20] rounded-2xl border border-[#231F20] p-8">
        {/* Bud Puppet mascot */}
        <div className="flex justify-center mb-6">
          <BudPuppet size={100} action={budAction} />
        </div>

        {/* Step 0: Pick Flower */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-[#FFFFFF] text-center mb-2">Step 1: Pick Your Flower</h2>
            <p className="text-[#231F20] text-center text-sm mb-4">Bud Puppet wants to roll one up! Choose a strain:</p>
            <div className="grid grid-cols-2 gap-4">
              {STRAINS.map(s => (
                <button key={s.name} onClick={() => pickStrain(s)}
                  className="p-4 rounded-xl border-2 border-[#231F20]/20 hover:border-[#B3D335] bg-[#FFFFFF] hover:bg-[#FFFFFF] transition-all group">
                  <div className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110" style={{ background: s.color }}>
                    <img src="/bud-puppet.webp" alt={s.name} className="w-12 h-12 object-contain" />
                  </div>
                  <p className="text-[#FFFFFF] font-semibold">{s.name}</p>
                  <p className="text-[#231F20] text-xs mt-1">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Grind - Bud Puppet grinds the flower */}
        {step === 1 && selectedStrain && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">Step 2: Grind the {selectedStrain.name}</h2>
            <p className="text-[#231F20] text-sm mb-4">Bud Puppet is grinding it up!</p>
            <div className="relative w-48 h-48 mx-auto mb-4">
              {/* Grinder with Bud Puppet inside */}
              <div className="absolute inset-0 rounded-full border-4 border-[#231F20]/30 overflow-hidden" style={{ background: `conic-gradient(${selectedStrain.color} ${grindProgress}%, rgba(35,31,32,0.15) ${grindProgress}%)` }}>
                <div className="absolute inset-4 rounded-full bg-[#231F20]/80 border-2 border-[#231F20]/30 flex items-center justify-center">
                  <div style={{ transform: `rotate(${grindProgress * 3.6}deg)`, transition: "transform 0.1s" }}>
                    <img src="/bud-puppet.webp" alt="Grinding" className="w-16 h-16 object-contain" />
                  </div>
                </div>
              </div>
              {/* Grinding particles */}
              {grindProgress > 20 && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm text-[#B3D335] animate-pulse">{"Crunch crunch..."}</div>}
            </div>
            <div className="w-56 mx-auto bg-[#231F20]/10 rounded-full h-4 mb-4 overflow-hidden">
              <div className="h-4 rounded-full transition-all flex items-center justify-center text-xs font-bold text-[#FFFFFF]" style={{ width: `${grindProgress}%`, background: `linear-gradient(90deg, ${selectedStrain.color}, #B3D335)` }}>
                {grindProgress > 15 && `${Math.round(grindProgress)}%`}
              </div>
            </div>
            <button onMouseDown={startGrind} onMouseUp={stopGrind} onMouseLeave={stopGrind}
              onTouchStart={startGrind} onTouchEnd={stopGrind}
              className="px-8 py-4 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-bold text-lg transition-all active:scale-95 shadow-lg shadow-[#B3D335]/50">
              Hold to Grind
            </button>
          </div>
        )}

        {/* Step 2: Roll - Bud Puppet rolls it */}
        {step === 2 && selectedStrain && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">Step 3: Roll the Joint</h2>
            <p className="text-[#231F20] text-sm mb-4">Bud Puppet is rolling it tight!</p>
            <div className="relative w-72 h-28 mx-auto mb-6">
              {/* Rolling paper background */}
              <div className="absolute inset-0 rounded-xl bg-[#D9A32C]/20/20 border-2 border-[#D9A32C]/30 overflow-hidden">
                {/* Filled portion */}
                <div className="h-full rounded-xl transition-all duration-200 flex items-center" style={{ width: `${rollProgress}%`, background: `linear-gradient(90deg, ${selectedStrain.color}44, ${selectedStrain.color})` }}>
                  {rollProgress > 10 && <img src="/bud-puppet.webp" alt="Rolling" className="h-16 w-16 object-contain ml-auto mr-2 animate-wiggle" />}
                </div>
              </div>
              {/* Rolling paper texture lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {rollProgress < 100 && <span className="text-[#FFCB08]/60/40 text-sm">{"~ rolling paper ~"}</span>}
                {rollProgress >= 100 && <span className="text-[#B3D335] font-bold text-lg animate-bounce">{"Perfect roll!"}</span>}
              </div>
            </div>
            <p className="text-[#231F20] text-sm mb-4">Tap to roll! ({Math.round(rollProgress)}%)</p>
            <button onClick={handleRollClick}
              className="px-8 py-4 bg-[#D9A32C] hover:bg-[#FFCB08] text-[#FFFFFF] rounded-full font-bold text-lg transition-all active:scale-90 shadow-lg shadow-[#D9A32C]/30/50">
              Tap to Roll
            </button>
          </div>
        )}

        {/* Step 3: Light - Bud Puppet lights it */}
        {step === 3 && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">Step 4: Light It Up!</h2>
            <p className="text-[#231F20] text-sm mb-4">Bud Puppet is sparking it up!</p>
            <div className="relative w-56 h-56 mx-auto mb-4">
              {/* Joint */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-8 h-36 rounded-t-sm overflow-hidden" style={{ background: `linear-gradient(180deg, ${selectedStrain?.color || "#3D8C32"}, #FFFFFF)` }}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  {lightProgress > 0 && <span className="text-4xl animate-pulse">{"\uD83D\uDD25"}</span>}
                </div>
                {/* Glow effect */}
                {lightProgress > 0 && <div className="absolute top-0 left-0 right-0 h-4" style={{ background: `linear-gradient(180deg, orange, transparent)`, opacity: lightProgress / 100 }} />}
              </div>
              {/* Bud Puppet holding the joint */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <img src="/bud-puppet.webp" alt="Lighting" className="w-20 h-20 object-contain" style={{ filter: `brightness(${1 + lightProgress / 200})` }} />
              </div>
              {/* Lighter */}
              {lightProgress < 100 && <div className="absolute top-8 right-4 text-4xl animate-bounce">{"\uD83E\uDE94"}</div>}
            </div>
            <div className="w-56 mx-auto bg-[#231F20]/10 rounded-full h-4 mb-4 overflow-hidden">
              <div className="bg-gradient-to-r from-[#D9A32C] to-[#D9A32C] h-4 rounded-full transition-all flex items-center justify-center text-xs font-bold text-[#FFFFFF]" style={{ width: `${lightProgress}%` }}>
                {lightProgress > 15 && `${Math.round(lightProgress)}%`}
              </div>
            </div>
            <button onClick={handleLightClick}
              className="px-8 py-4 bg-[#D9A32C] hover:bg-[#D9A32C] text-[#FFFFFF] rounded-full font-bold text-lg transition-all active:scale-95 shadow-lg shadow-[#D9A32C]/30/50">
              {"\uD83D\uDD25"} Click to Light
            </button>
          </div>
        )}

        {/* Step 4: Smoke animation - Bud Puppet enjoys */}
        {step === 4 && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#FFFFFF] mb-4">Bud Puppet is Enjoying It!</h2>
            <div className="relative w-72 h-72 mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${selectedStrain?.color || "#3D8C32"}66, transparent)`, opacity: smokeOpacity }} />
              </div>
              {/* Bud Puppet smoking */}
              <div className="absolute inset-0 flex items-center justify-center">
                <BudPuppet size={120} action="smoke" />
              </div>
              {/* Smoke puffs */}
              {smokeOpacity > 0.1 && <div className="absolute top-8 left-1/2 -translate-x-1/2 text-5xl animate-pulse" style={{ opacity: smokeOpacity }}>{"\uD83D\uDCA8"}</div>}
              {smokeOpacity > 0.3 && <div className="absolute top-2 left-1/4 text-4xl animate-bounce" style={{ opacity: smokeOpacity * 0.8 }}>{"\uD83D\uDCA8"}</div>}
              {smokeOpacity > 0.5 && <div className="absolute top-0 right-1/4 text-3xl animate-pulse" style={{ opacity: smokeOpacity * 0.6 }}>{"\u2601\uFE0F"}</div>}
              {smokeOpacity > 0.7 && <div className="absolute top-4 right-1/3 text-2xl animate-bounce" style={{ opacity: smokeOpacity * 0.5 }}>{"\uD83D\uDCA8"}</div>}
            </div>
          </div>
        )}

        {/* Step 5: Round Complete */}
        {step === 5 && (
          <div className="text-center">
            <div className="text-6xl mb-4">{"\uD83C\uDF89"}</div>
            <h2 className="text-2xl font-bold text-[#B3D335] mb-2">Round {round} Complete!</h2>
            <p className="text-[#231F20] mb-2">Bud Puppet rolled a perfect {selectedStrain?.name} joint!</p>
            <p className="text-[#FFCB08] font-bold text-xl mb-2">+{100 + round * 10} game points!</p>
            <div className="bg-[#B3D335]/10 border border-[#B3D335]/30 rounded-xl p-4 mb-6 inline-block">
              <p className="text-[#126A44] font-semibold text-sm mb-1">{"\u{1F3C6}"} Bonus Rewards Points Earned!</p>
              <p className="text-[#231F20] font-bold text-2xl">{score >= 500 ? "+25" : "+10"} <span className="text-sm font-normal text-[#231F20]">rewards points</span></p>
              <p className="text-[#231F20] text-xs mt-1">{score >= 500 ? "High score bonus!" : "Complete more rounds for 25 pts!"}</p>
            </div>
            <BudPuppet size={100} action="celebrate" className="mx-auto mb-6" />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={nextRound}
                className="px-8 py-4 bg-[#B3D335] hover:bg-[#58BA49] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-bold text-lg transition-all shadow-lg shadow-[#B3D335]/50">
                Next Round
              </button>
              <button onClick={() => navigate("/loyalty")}
                className="px-6 py-3 border-2 border-[#B3D335] text-[#B3D335] hover:bg-[#B3D335] hover:text-[#231F20] rounded-full font-semibold transition-all">
                Check Rewards Balance
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {["Pick", "Grind", "Roll", "Light", "Smoke"].map((label, i) => (
          <div key={i} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${i <= step ? "bg-[#B3D335]/20 text-[#231F20] border border-[#B3D335]" : "bg-[#FFFFFF] text-[#231F20] border border-[#231F20]/15"}`}>
            {i < step ? "\u2713" : i + 1}. {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================== GAMES HUB PAGE ======================== */
function GamesPage() {
  const [activeGame, setActiveGame] = useState<"none" | "scratch" | "roll">("none");

  if (activeGame === "scratch") return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-8"><button onClick={() => setActiveGame("none")} className="text-[#231F20] hover:text-[#231F20] transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Games</button></div>
      <ScratchCardGame />
    </div>
  );
  if (activeGame === "roll") return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-8"><button onClick={() => setActiveGame("none")} className="text-[#231F20] hover:text-[#231F20] transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Games</button></div>
      <RollAJointGame />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[#FFFFFF] mb-3">Hemp Games</h1>
        <p className="text-[#231F20] text-lg">Play games, win prizes, and have fun!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scratch Card */}
        <button onClick={() => setActiveGame("scratch")}
          className="bg-[#FFFFFF] border-2 border-[#B3D335]/50 hover:border-[#B3D335] rounded-2xl p-8 text-left transition-all hover:scale-105 group">
          <div className="text-5xl mb-4">{"\u{1F3B0}"}</div>
          <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">Scratch & Win</h2>
          <p className="text-[#231F20]">Scratch the card to reveal exclusive prizes — discounts, free shipping, bonus points, and more!</p>
          <span className="inline-block mt-4 text-[#126A44] font-semibold group-hover:translate-x-1 transition-transform">        Play Now {"\u2192"}</span>
                </button>
                {/* Roll a Joint */}
        <button onClick={() => setActiveGame("roll")}
          className="bg-[#FFFFFF] border-2 border-[#FFCB08]/50 hover:border-[#FFCB08] rounded-2xl p-8 text-left transition-all hover:scale-105 group">
          <div className="text-5xl mb-4">{"\u{1F525}"}</div>
          <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">Roll a Joint</h2>
          <p className="text-[#231F20]">Pick your flower, grind it, roll it, light it! Watch your cannabis nut character enjoy the ride.</p>
          <span className="inline-block mt-4 text-[#FFCB08] font-semibold group-hover:translate-x-1 transition-transform">      Play Now {"\u2192"}</span>
              </button>
            </div>
    </div>
  );
}


/* ======================== MAIN APP ======================== */
function App() {
  const route = useRoute();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    saveCart(newCart);
  }, []);

  const addToCart = useCallback((product: Product, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let newCart: CartItem[];
      if (existing) {
        newCart = prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      } else {
        newCart = [...prev, { product, quantity: qty }];
      }
      saveCart(newCart);
      return newCart;
    });
    setCartOpen(true);
  }, []);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => {
        const newCart = prev.filter((item) => item.product.id !== productId);
        saveCart(newCart);
        return newCart;
      });
    } else {
      setCart((prev) => {
        const newCart = prev.map((item) => item.product.id === productId ? { ...item, quantity: qty } : item);
        saveCart(newCart);
        return newCart;
      });
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.product.id !== productId);
      saveCart(newCart);
      return newCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    updateCart([]);
  }, [updateCart]);

  // Dynamic meta descriptions per route
  useEffect(() => {
    const descriptions: Record<string, string> = {
      "": "The Hemp Dispensary — Spring Hill FL's trusted hemp store. Shop premium flower, edibles, concentrates, vapes, topicals, and tinctures online. Ready in 5 minutes or shipped to your door.",
      "#/shop/flower": "Shop premium hemp flower at The Hemp Dispensary — Everyday, Premium, Essential, Smalls, and Snowcaps tiers. Lab-tested, locally trusted, ready in 5 minutes.",
      "#/shop/edibles": "Hemp edibles including Delta-9 gummies, CBD chocolates, and CBN sleep chews. Lab-tested, legally compliant, available for pickup or shipping.",
      "#/shop/concentrates": "Premium hemp concentrates including live rosin, diamonds, shatter, and badder. Solventless and hydrocarbon options, lab-tested for purity.",
      "#/shop/vapor": "CBD and THC vape cartridges, disposables, and 510-thread batteries. Lab-tested hemp vapor products ready for pickup in Spring Hill FL.",
      "#/shop/topicals": "Hemp topicals including CBD muscle creams, balms, roll-ons, and transdermal patches. Targeted relief, lab-tested, available in-store and online.",
      "#/shop/tinctures": "CBD, CBG, CBN and full spectrum hemp tinctures. Sublingual oils for sleep, pain, focus, and daily wellness. Lab-tested, fast pickup or shipping.",
      "#/shop/accessories": "Hemp accessories including glass pipes, rolling papers, grinders, storage, and butane. Everything you need in one stop.",
      "#/loyalty": "Hemp Rewards — earn points on every purchase, unlock VIP tiers, and redeem for discounts. Join the loyalty program at The Hemp Dispensary.",
      "#/games": "Play games and win prizes at The Hemp Dispensary. Scratch cards, Roll-a-Joint, and more — all free to play for rewards members.",
      "#/about": "Our Story — how two Spring Hill locals built The Hemp Dispensary from a road trip idea to 15 locations, lost 13 overnight, and kept going.",
    };
    const key = route.startsWith("#/shop/") ? route : (route === "" || route === "#" || route === "#/" ? "" : route);
    const desc = descriptions[key] || descriptions[""];
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, [route]);

  useEffect(() => {
    // Load from localStorage cache first for instant display
    try {
      const cached = localStorage.getItem("thd-products-cache");
      if (cached) {
        const { products: cp, categories: cc, timestamp: ct } = JSON.parse(cached);
        if (Date.now() - ct < 600000) {
          setProducts(cp);
          setCategories(cc);
          setLoading(false);
        }
      }
    } catch { /* ignore parse errors */ }

    // Always fetch fresh data in background with 15s timeout + 2 retries
    const fetchWithTimeout = (url: string, timeoutMs: number): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    };
    const fetchProducts = async (retries = 2): Promise<void> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const r = await fetchWithTimeout(`${API_URL}/api/ecommerce/products?limit=1000`, 15000);
          const data: ProductsResponse = await r.json();
          setProducts(data.products);
          setCategories(data.categories);
          setLoading(false);
          setFetchError(false);
          try { localStorage.setItem("thd-products-cache", JSON.stringify({ products: data.products, categories: data.categories, timestamp: Date.now() })); } catch { /* quota */ }
          return;
        } catch (err) {
          console.error(`Failed to load products (attempt ${attempt + 1}/${retries + 1}):`, err);
          if (attempt < retries) await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      setLoading(false);
      setFetchError(true);
    };
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryFetch = useCallback(() => {
    setLoading(true);
    setFetchError(false);
    const fetchWithTimeout2 = (url: string, timeoutMs: number): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    };
    (async () => {
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          const r = await fetchWithTimeout2(`${API_URL}/api/ecommerce/products?limit=1000`, 15000);
          const data: ProductsResponse = await r.json();
          setProducts(data.products);
          setCategories(data.categories);
          setLoading(false);
          setFetchError(false);
          try { localStorage.setItem("thd-products-cache", JSON.stringify({ products: data.products, categories: data.categories, timestamp: Date.now() })); } catch { /* quota */ }
          return;
        } catch (err) {
          console.error(`Retry failed (attempt ${attempt + 1}/3):`, err);
          if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      setLoading(false);
      setFetchError(true);
    })();
  }, []);

  // Keepalive: ping backend every 5 minutes to prevent Fly.io cold starts
  useEffect(() => {
    const ping = () => { fetch(`${API_URL}/healthz`, { method: "GET" }).catch(() => {}); };
    ping();
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    products.forEach((p) => { p.categories.forEach((cat) => { if (!map[cat]) map[cat] = []; map[cat].push(p); }); });
    return map;
  }, [products]);

  const homeCategories = useMemo(() => {
    const preferred = ["Flower", "Concentrates", "Edibles", "Topicals", "Tinctures", "Vapor", "Accessories", "Pets"];
    return preferred.filter((c) => {
      const prods = productsByCategory[c] || [];
      return prods.some(p => p.stock > 0);
    });
  }, [productsByCategory]);

  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-[#FFFFFF]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-[9999] focus:bg-[#FFFFFF] focus:px-4 focus:py-2 focus:text-[#231F20] focus:underline">Skip to main content</a>
      <StickyTopBar />
      <Header cartCount={cartCount} onSearch={() => setSearchOpen(true)} onCartOpen={() => setCartOpen(true)} />
      <main id="main-content">{content}</main>
      <SiteFooter />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} />
      <ChatbotBud products={products} />
    </div>
  );

  if (route.startsWith("#/product/")) return shell(<ProductDetail productId={route.replace("#/product/", "")} products={products} onAddToCart={addToCart} />);
  if (route.startsWith("#/shop")) {
    const catSlug = route.replace("#/shop/", "").replace("#/shop", "");
    return shell(loading
      ? <div className="flex flex-col items-center justify-center py-24"><img src="/logo.webp" alt="The Hemp Dispensary" width="240" height="96" className="h-20 w-auto animate-pulse mb-4" /><p className="text-[#231F20] text-lg italic">Remedy Your Way</p></div>
      : fetchError ? <div className="flex flex-col items-center justify-center py-24"><AlertCircle className="h-12 w-12 text-[#D9A32C] mb-4" /><p className="text-[#231F20] text-lg font-medium mb-2">Unable to load products</p><p className="text-[#231F20] text-sm mb-4">Please check your connection and try again.</p><button onClick={retryFetch} className="px-6 py-3 bg-[#B3D335] hover:bg-[#126A44] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-semibold transition-colors">Try Again</button></div>
      : <ShopPage products={products} categories={categories} selectedCategory={catSlug || "all"} onAddToCart={(p) => addToCart(p, 1)} />);
  }
  if (route === "#/checkout") return shell(<CheckoutPage cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} />);
  if (route === "#/about") return shell(<AboutPage />);
  if (route === "#/terms") return shell(<TermsPage />);
  if (route === "#/privacy") return shell(<PrivacyPage />);
  if (route === "#/shipping") return shell(<ShippingPage />);
  if (route === "#/loyalty") return shell(<LoyaltyPage />);
  if (route === "#/account") return shell(<AccountPage />);
  if (route === "#/games") return shell(<GamesPage />);
  if (route === "#/contact") return shell(<><ContactPage /><LocationSection /></>);

  // Homepage
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-[9999] focus:bg-[#FFFFFF] focus:px-4 focus:py-2 focus:text-[#231F20] focus:underline">Skip to main content</a>
      <StickyTopBar />
      <Header cartCount={cartCount} onSearch={() => setSearchOpen(true)} onCartOpen={() => setCartOpen(true)} />
      <main id="main-content">
      <HeroSection />
      <TrustStrip />
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24"><img src="/logo.webp" alt="The Hemp Dispensary" width="240" height="96" className="h-20 w-auto animate-pulse mb-4" /><p className="text-[#231F20] text-lg italic">Remedy Your Way</p></div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-24">
          <AlertCircle className="h-12 w-12 text-[#D9A32C] mb-4" />
          <p className="text-[#231F20] text-lg font-medium mb-2">Unable to load products</p>
          <p className="text-[#231F20] text-sm mb-4">Please check your connection and try again.</p>
          <button onClick={retryFetch} className="px-6 py-3 bg-[#B3D335] hover:bg-[#126A44] text-[#231F20] hover:text-[#FFFFFF] rounded-full font-semibold transition-colors">Try Again</button>
        </div>
      ) : (
        <>
          <ShopByCategory categories={categories} productsByCategory={productsByCategory} />
          <ShopByFeeling products={products} />
          {/* Product carousels by category */}
          {homeCategories.map((cat) => {
            const inStock = (productsByCategory[cat] || []).filter(p => p.stock > 0);
            const catProducts = inStock.filter(p => p.image_url && !p.image_url.includes('product-placeholder'));
            const displayProducts = catProducts.length >= 4 ? catProducts.slice(0, 4) : inStock.slice(0, 4);
            if (displayProducts.length === 0) return null;
            return (
              <section key={cat} className="py-10 bg-[#FFFFFF]">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[18px] sm:text-3xl font-semibold sm:font-bold text-[#231F20]">{cat}</h2>
                    <button onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className="border border-[#231F20] text-[#231F20] hover:bg-[#FFFFFF] px-6 py-2 rounded-full font-medium transition-all duration-300 text-sm">View All</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {displayProducts.map((product) => (
                      <ProductGridCard key={product.id} product={product} onQuickAdd={(p) => addToCart(p, 1)} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
          <PromoBanner />
        </>
      )}
      <WhyChooseUs />
      <ReviewsSection />
      <LocationSection />
      </main>
      <SiteFooter />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} />
      <ChatbotBud products={products} />
    </div>
  );
}

export default App;
