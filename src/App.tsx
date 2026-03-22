import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, ShoppingCart, Package, X, ArrowLeft, MapPin, Clock, Phone, Mail, Star, Plus, Minus, Trash2, CheckCircle, Truck, CreditCard, Lock, AlertCircle, User, Gift, Gamepad2, ChevronRight, Shield, Zap, MessageCircle, Send } from "lucide-react";

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
  "butane": "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
  "lighter": "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
  "ignitus": "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
  "pipe": "https://images.unsplash.com/photo-1560024802-ec901e5abd1a?w=400&h=400&fit=crop",
  "glass": "https://images.unsplash.com/photo-1560024802-ec901e5abd1a?w=400&h=400&fit=crop",
  "grinder": "https://images.unsplash.com/photo-1616690002498-1435060a1948?w=400&h=400&fit=crop",
  "rolling": "https://images.unsplash.com/photo-1616690002498-1435060a1948?w=400&h=400&fit=crop",
  "tray": "https://images.unsplash.com/photo-1616690002498-1435060a1948?w=400&h=400&fit=crop",
};

function placeholderUrl(name: string, size = 400): string {
  const nameLower = name.toLowerCase();
  for (const [keyword, url] of Object.entries(ACCESSORY_PLACEHOLDER_IMAGES)) {
    if (nameLower.includes(keyword)) return url;
  }
  const text = name.split(" ").slice(0, 3).join("\n");
  return `https://placehold.co/${size}x${size}/f8f8f8/231f20?text=${encodeURIComponent(text)}&font=roboto`;
}

/* ======================== HELPER: Product Effect Detection ======================== */
function getProductEffect(product: Product): { label: string; color: string; bg: string; icon: string } {
  const name = (product.name + " " + (product.description || "")).toLowerCase();
  if (name.includes("sleep") || name.includes("night") || name.includes("dream") || name.includes("rest") || name.includes("melatonin") || name.includes("cbn"))
    return { label: "Sleep", color: "#6366f1", bg: "#eef2ff", icon: "\u{1F634}" };
  if (name.includes("energy") || name.includes("focus") || name.includes("sativa") || name.includes("boost") || name.includes("uplift"))
    return { label: "Energy", color: "#f59e0b", bg: "#fffbeb", icon: "\u26A1" };
  if (name.includes("focus") || name.includes("clarity") || name.includes("brain") || name.includes("mental"))
    return { label: "Focus", color: "#8b5cf6", bg: "#f5f3ff", icon: "\u{1F9E0}" };
  return { label: "Relax", color: "#58BA49", bg: "#f0fdf4", icon: "\u{1F60C}" };
}

function getProductStrength(product: Product): { label: string; color: string } {
  const price = product.price;
  if (price >= 5000) return { label: "High", color: "#ef4444" };
  if (price >= 2000) return { label: "Medium", color: "#f59e0b" };
  return { label: "Low", color: "#58BA49" };
}

const LEAFLIFE_KEYWORDS = ["everyday", "premium", "essential", "smalls", "snowcaps"];
function isLeafLife(product: Product): boolean {
  const name = (product.online_name || product.name).toLowerCase();
  return LEAFLIFE_KEYWORDS.some(kw => name.includes(kw));
}

function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
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
    <div className="bg-[#231F20] text-white text-center py-2 px-4 text-sm font-medium">
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
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 hover:text-[#231F20] transition-colors" aria-label="Menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
            <button onClick={onSearch} className="p-2 text-gray-600 hover:text-[#58BA49] transition-colors"><Search className="h-5 w-5" /></button>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(""); }} className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="The Hemp Dispensary" className="h-10 sm:h-12 w-auto object-contain" />
          </a>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <a href="#/loyalty" className="p-1.5 sm:p-2 text-gray-600 hover:text-[#58BA49] transition-colors flex items-center gap-1" title="Hemp Rewards">
              <Gift className="h-5 w-5" />
              <span className="hidden md:inline text-xs font-medium">Rewards</span>
            </a>
            <a href="#/account" className="p-1.5 sm:p-2 text-gray-600 hover:text-[#58BA49] transition-colors" title="Account">
              <User className="h-5 w-5" />
            </a>
            <a href="#/games" className="hidden sm:flex p-2 text-gray-600 hover:text-purple-500 transition-colors items-center gap-1" title="Games">
              <Gamepad2 className="h-5 w-5" />
              <span className="hidden md:inline text-xs font-medium">Games</span>
            </a>
            <button onClick={onCartOpen} className="relative p-1.5 sm:p-2 text-gray-600 hover:text-[#58BA49] transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#58BA49] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center justify-center gap-1 pb-2 overflow-x-auto">
          {categories.map((cat) => (
            <button key={cat} onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#58BA49] hover:bg-green-50 rounded-full transition-colors whitespace-nowrap">{cat}</button>
          ))}
        </nav>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => { navigate(`/shop/${cat.toLowerCase()}`); setMobileMenuOpen(false); }} className="text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[#58BA49] hover:bg-green-50 rounded-lg transition-colors">{cat}</button>
            ))}
            <a href="#/games" onClick={() => setMobileMenuOpen(false)} className="sm:hidden text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Games</a>
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#231F20]">Your Cart ({itemCount})</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#231F20] transition-colors"><X className="h-5 w-5" /></button>
        </div>
        {/* FIRST20 promo banner */}
        <div className="bg-[#FFCB08]/10 border-b border-[#FFCB08]/20 px-4 py-2 text-center">
          <p className="text-sm font-medium text-[#231F20]">{"\u{1F525}"} Use code <span className="font-bold text-[#58BA49]">FIRST20</span> for 20% off your first order!</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Your cart is empty</p>
              <button onClick={() => { onClose(); navigate("/shop"); }} className="mt-4 text-[#58BA49] hover:underline font-medium">Start Shopping</button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-gray-100">
                    <img src={item.product.image_url || placeholderUrl(item.product.name, 100)} alt={item.product.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(item.product.name, 100); }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#231F20] truncate">{item.product.online_name || item.product.name}</h3>
                    <p className="text-[#58BA49] font-bold text-sm">{formatPrice(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => onUpdateQty(item.product.id, item.quantity - 1)} className="p-1 text-gray-400 hover:text-[#231F20]"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm font-medium text-[#231F20] min-w-[1.5rem] text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.product.id, item.quantity + 1)} className="p-1 text-gray-400 hover:text-[#231F20]"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => onRemove(item.product.id)} className="ml-auto p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex justify-between text-lg font-bold text-[#231F20]">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button onClick={() => { onClose(); navigate("/checkout"); }} className="w-full py-3 bg-[#58BA49] hover:bg-[#4aa83d] text-white rounded-full font-semibold transition-colors text-lg">Checkout</button>
            <button onClick={onClear} className="w-full py-2 text-gray-500 hover:text-red-500 text-sm transition-colors">Clear Cart</button>
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
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 leading-tight">
          Skip the Line.<br />
          <span className="text-[#ADD038]">Get Your Hemp in Minutes.</span>
        </h1>
        <p className="text-gray-300 text-base sm:text-xl mb-6 max-w-2xl mx-auto">Fast pickup. Lab-tested. Trusted locally.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate("/shop")} className="px-8 py-3.5 sm:py-4 bg-[#58BA49] hover:bg-[#4aa83d] text-white rounded-full font-bold text-lg transition-colors shadow-lg">Shop Now</button>
          <button onClick={() => { const el = document.getElementById('locations-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else navigate('/contact'); }} className="px-8 py-3.5 sm:py-4 border-2 border-white/30 hover:border-white text-white rounded-full font-bold text-lg transition-colors">Find Nearest Location</button>
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
    <section className="bg-white border-b border-gray-100 cursor-pointer" onClick={() => navigate('/shop')}>
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center">
              <item.icon className="h-5 w-5 text-[#58BA49] mb-1" />
              <span className="text-xs sm:text-sm font-semibold text-[#231F20] leading-tight">{item.label}</span>
              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">{item.sub}</span>
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

  const catIcons: Record<string, string> = { Flower: "\u{1F33F}", Edibles: "\u{1F36C}", Concentrates: "\u{1F4A7}", Vapor: "\u{1F32C}\uFE0F", Topicals: "\u{1F9F4}", Tinctures: "\u{1F48A}", Accessories: "\u{1F527}" };

  return (
    <section className="bg-[#F8F8F8] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#231F20] text-center mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {displayCats.map((cat) => (
            <button key={cat} onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className="bg-white rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg transition-all group border border-gray-100">
              <span className="text-4xl block mb-3">{catIcons[cat] || "\u{1F4E6}"}</span>
              <h3 className="text-lg font-semibold text-[#231F20] group-hover:text-[#58BA49] transition-colors">{cat}</h3>
              <p className="text-sm text-gray-500 mt-1">{(productsByCategory[cat] || []).filter(p => p.stock > 0).length} products</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================== SHOP BY FEELING ======================== */
function ShopByFeeling({ products }: { products: Product[] }) {
  const feelings = [
    { label: "Relax", icon: "\u{1F60C}", color: "#58BA49", bg: "#f0fdf4", desc: "Calm your mind", keywords: ["relax", "calm", "chill", "indica", "hybrid"] },
    { label: "Sleep", icon: "\u{1F634}", color: "#6366f1", bg: "#eef2ff", desc: "Rest easy tonight", keywords: ["sleep", "night", "dream", "rest", "melatonin", "cbn"] },
    { label: "Energy", icon: "\u26A1", color: "#f59e0b", bg: "#fffbeb", desc: "Power your day", keywords: ["energy", "sativa", "boost", "uplift"] },
    { label: "Focus", icon: "\u{1F9E0}", color: "#8b5cf6", bg: "#f5f3ff", desc: "Sharpen your mind", keywords: ["focus", "clarity", "brain", "mental"] },
  ];

  return (
    <section className="bg-white py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#231F20] text-center mb-2">How Do You Want to Feel?</h2>
        <p className="text-gray-500 text-center mb-6 text-sm">Tap to browse products by effect</p>
        <div className="grid grid-cols-4 gap-3 sm:gap-6">
          {feelings.map((f) => {
            const count = products.filter(p => p.stock > 0 && getProductEffect(p).label === f.label).length;
            return (
              <button key={f.label} onClick={() => navigate(`/shop/${f.label.toLowerCase()}`)} className="rounded-2xl p-3 sm:p-6 text-center hover:shadow-lg transition-all group border border-gray-100" style={{ backgroundColor: f.bg }}>
                <span className="text-2xl sm:text-4xl block mb-1 sm:mb-3">{f.icon}</span>
                <h3 className="text-sm sm:text-lg font-semibold text-[#231F20] group-hover:text-[#58BA49] transition-colors">{f.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{f.desc}</p>
                {count > 0 && <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{count} items</p>}
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
        <p className="text-white text-sm sm:text-base mb-4">Get <span className="text-[#ADD038] font-bold">20% OFF</span> your entire order with code <span className="bg-white/10 px-2 py-0.5 rounded font-mono font-bold">FIRST20</span></p>
        <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-[#58BA49] hover:bg-[#4aa83d] text-white rounded-full font-bold transition-colors">Shop Now &amp; Save</button>
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
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#231F20] text-center mb-2">{"\u26A1"} Why Shop With Us?</h2>
        <p className="text-gray-500 text-center mb-8">Quality you can trust, speed you can count on</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reasons.map((r) => (
            <div key={r.text} className="bg-[#F8F8F8] rounded-xl p-5 text-center">
              <r.icon className="h-8 w-8 text-[#58BA49] mx-auto mb-3" />
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
    <section className="bg-[#F8F8F8] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#231F20] mb-2">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-[#FFCB08] text-[#FFCB08]" />)}
          </div>
          <p className="text-sm text-gray-500 mb-1">4.8 out of 5 stars across all locations</p>
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#58BA49] hover:underline transition-colors">
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
            <div key={i} className="flex-shrink-0 w-72 bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-[#FFCB08] text-[#FFCB08]" />)}
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">"{r.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#58BA49] flex items-center justify-center text-white text-xs font-bold">{r.name.charAt(0)}</div>
                <span className="text-sm font-semibold text-[#231F20]">{r.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="inline-block bg-white border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium text-[#231F20] hover:border-[#58BA49] hover:text-[#58BA49] transition-colors">
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
    { name: "Spring Hill East", address: "14312 Spring Hill Dr, Spring Hill, FL 34609", hours: "Open Daily 6am\u201310pm", phone: "(352) 515-5370", mapsQuery: "The Hemp Dispensary Spring Hill Dr", googleUrl: "https://www.google.com/maps/place/The+Hemp+Dispensary/@28.4786,-82.5535,15z" },
    { name: "Spring Hill West", address: "6175 Deltona Blvd, Ste 104, Spring Hill, FL 34606", hours: "Open Daily 6am\u201312am", phone: "(352) 340-5860", mapsQuery: "The Hemp Dispensary Deltona Blvd", googleUrl: "https://www.google.com/maps/place/The+Hemp+Dispensary/@28.4631,-82.6016,15z" },
  ];
  return (
    <section id="locations-section" className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#231F20] text-center mb-8">Our Locations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div key={loc.name} className="bg-[#F8F8F8] rounded-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-[#231F20] mb-3">{loc.name}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#58BA49]" />{loc.address}</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#58BA49]" />{loc.hours}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#58BA49]" />{loc.phone}</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => window.open(`https://maps.google.com/maps/search/${encodeURIComponent(loc.mapsQuery)}`, "_blank")} className="text-[#58BA49] font-semibold text-sm flex items-center gap-1 hover:underline">
                  Get Directions <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => window.open(loc.googleUrl, "_blank")} className="text-gray-500 font-medium text-sm flex items-center gap-1 hover:text-[#58BA49] hover:underline">
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
      <div className="bg-white rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:shadow-xl relative">
        {/* Floating product image */}
        <div className="h-36 sm:h-48 flex items-center justify-center mb-2 sm:mb-3 bg-white rounded-xl overflow-hidden">
          <img
            src={product.image_url || placeholderUrl(product.name)}
            alt={product.name}
            loading="lazy"
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: 'white' }}
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(product.name); }}
          />
        </div>
        {/* Badges row */}
        <div className="flex items-center gap-1 flex-wrap mb-1.5">
          <span className="inline-block text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full" style={{ backgroundColor: effect.bg, color: effect.color }}>
            {effect.icon} {effect.label}
          </span>
          {product.stock <= 5 && <span className="inline-block bg-amber-100 text-amber-700 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">Only {Math.floor(product.stock)} Left</span>}
        </div>
        <h3 className="text-[#231F20] text-xs sm:text-sm font-medium leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-1.5 group-hover:text-[#58BA49] transition-colors">{titleCase(product.online_name || product.name)}</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#58BA49] font-bold text-base sm:text-lg">{formatPrice(product.price)}</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">{isLeafLife(product) ? `${"\u{1F4E6}"} Shipping Only` : `${"\u26A1"} 5 Minute Pickup`}</span>
        </div>
        {/* Quick Add to Cart button */}
        {onQuickAdd && product.available && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAdd(product); }}
            className="w-full py-2 sm:py-2.5 bg-[#58BA49] hover:bg-[#4aa83d] text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors"
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58BA49]"></div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-32">
      <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg">Product not found</p>
      <button onClick={() => navigate("")} className="mt-4 text-[#58BA49] hover:underline">Back to products</button>
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
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-[#58BA49] hover:text-[#4aa83d] mb-4 sm:mb-6 font-medium text-sm sm:text-base">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </button>

      {/* FIRST20 promo */}
      <div className="bg-[#FFCB08]/10 border border-[#FFCB08]/30 rounded-xl px-4 py-3 mb-6 text-center">
        <p className="text-sm font-medium text-[#231F20]">{"\u{1F525}"} First-time customers: <span className="font-bold">20% OFF</span> with code <span className="font-bold text-[#58BA49]">FIRST20</span></p>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Product image - floating design */}
          <div className="p-4 sm:p-8 flex items-center justify-center bg-white min-h-[250px] sm:min-h-[400px]">
            <img
              src={product.image_url || placeholderUrl(product.name, 600)}
              alt={product.name}
              className="max-h-[350px] max-w-full object-contain"
              style={{ backgroundColor: 'white' }}
              onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(product.name, 600); }}
            />
          </div>

          {/* Product info */}
          <div className="p-5 sm:p-8 md:p-10 flex flex-col">
            {/* Category badges */}
            {product.categories.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {product.categories.map((cat) => (
                  <span key={cat} className="text-xs font-medium bg-green-50 text-[#58BA49] px-3 py-1 rounded-full border border-green-100">{cat}</span>
                ))}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-[#231F20] mb-2">{titleCase(product.online_name || product.name)}</h1>

            {/* Effect & Strength badges */}
            <div className="flex gap-2 mb-4">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: effect.bg, color: effect.color }}>{effect.icon} {effect.label}</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100" style={{ color: strength.color }}>Strength: {strength.label}</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <p className="text-3xl font-bold text-[#58BA49]">{formatPrice(product.price)}</p>
              {savingsVsBuying > 0 && (
                <span className="inline-block bg-green-100 text-[#58BA49] text-xs font-bold px-2.5 py-1 rounded-full">
                  Save {formatPrice(savingsVsBuying)} vs buying {currentGrams}{"\u00D7"}1g
                </span>
              )}
            </div>

            {/* Benefit description */}
            <p className="text-gray-600 text-sm mb-4">{benefit}</p>

            {product.is_age_restricted && (
              <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <span className="text-amber-600 font-bold">21+</span>
                <span className="text-amber-700 text-sm">Age verification required</span>
              </div>
            )}

            {product.description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
              </div>
            )}

            {/* Availability */}
            <div className="mb-4">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${product.stock <= 5 ? 'bg-amber-500' : 'bg-[#58BA49]'}`}></div>
                  <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-amber-600' : 'text-[#58BA49]'}`}>
                    {product.stock <= 5 ? `Only ${Math.floor(product.stock)} remaining` : `In Stock (${Math.floor(product.stock)} available)`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 bg-red-500 rounded-full"></div>
                  <span className="text-red-500 font-medium text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Ready for pickup message */}
            <div className={`${isLeafLife(product) ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'} border rounded-lg px-4 py-2 mb-4`}>
              <p className={`text-sm font-medium ${isLeafLife(product) ? 'text-blue-600' : 'text-[#58BA49]'}`}>{isLeafLife(product) ? <>{"\u{1F4E6}"} This Product Ships From Our Partner {"\u2013"} Shipping Only</> : <>{"\u26A1"} Ready For Pickup Today In About 5 Minutes</>}</p>
            </div>

            {/* Add to cart */}
            <div className="mt-auto pt-4 space-y-3">
              {product.available && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">Qty:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-gray-400 hover:text-[#231F20] transition-colors"><Minus className="h-4 w-4" /></button>
                    <span className="px-4 py-2 text-[#231F20] font-medium min-w-[3rem] text-center">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 text-gray-400 hover:text-[#231F20] transition-colors"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
              <button
                disabled={!product.available}
                onClick={() => { if (product.available) { onAddToCart(product, qty); setAdded(true); setTimeout(() => setAdded(false), 2000); } }}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${product.available ? (added ? "bg-[#ADD038] text-white" : "bg-[#58BA49] hover:bg-[#4aa83d] text-white shadow-lg") : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
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
              <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={p.image_url || placeholderUrl(p.name, 200)} alt={p.name} className="max-h-full max-w-full object-contain" style={{ backgroundColor: '#FFFFFF' }} onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(p.name, 200); }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#231F20] line-clamp-2 hover:text-[#58BA49] transition-colors">{titleCase(p.online_name || p.name)}</h3>
                  <p className="text-[#58BA49] font-bold text-sm mt-1">{formatPrice(p.price)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onAddToCart(p, 1); }} className="flex-shrink-0 bg-[#58BA49] hover:bg-[#4aa83d] text-white rounded-lg px-3 py-2 text-xs font-semibold transition-colors">Add</button>
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
                <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl border ${v.id === product.id ? 'border-[#58BA49] bg-green-50' : 'border-gray-100 bg-white hover:border-[#58BA49]'} cursor-pointer transition-all`} onClick={() => { if (v.id !== product.id) navigate(`/product/${v.id}`); }}>
                  <div>
                    <span className="text-sm font-medium text-[#231F20]">{vGrams > 0 ? `${vGrams}g` : titleCase(v.online_name || v.name)}</span>
                    {vSavings > 0 && <span className="ml-2 text-xs font-bold text-[#58BA49] bg-green-100 px-2 py-0.5 rounded-full">Save {formatPrice(vSavings)}</span>}
                  </div>
                  <span className="text-sm font-bold text-[#58BA49]">{formatPrice(v.price)}</span>
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
    <div className="fixed inset-0 z-[70] bg-white">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full pl-12 pr-4 py-3 bg-[#F8F8F8] border border-gray-200 rounded-full text-[#231F20] placeholder-gray-400 focus:outline-none focus:border-[#58BA49] focus:ring-1 focus:ring-[#58BA49]" />
          </div>
          <button onClick={() => { onClose(); setQuery(""); }} className="p-2 text-gray-400 hover:text-[#231F20]"><X className="h-6 w-6" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
          {results.map((product) => (
            <div key={product.id} className="cursor-pointer group" onClick={() => { navigate(`/product/${product.id}`); onClose(); setQuery(""); }}>
              <div className="bg-[#F8F8F8] rounded-xl p-3 transition-all hover:shadow-md">
                <div className="h-28 flex items-center justify-center mb-2 bg-white rounded-lg overflow-hidden">
                  <img src={product.image_url || placeholderUrl(product.name, 200)} alt={product.name} loading="lazy" className="max-h-full object-contain" style={{ backgroundColor: 'white' }} onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(product.name, 200); }} />
                </div>
                <h3 className="text-xs font-medium text-[#231F20] line-clamp-2 group-hover:text-[#58BA49] transition-colors">{titleCase(product.online_name || product.name)}</h3>
                <p className="text-[#58BA49] font-bold text-sm mt-1">{formatPrice(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
        {query && results.length === 0 && <p className="text-center text-gray-400 py-12">No products found for "{query}"</p>}
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
          <h1 className="text-3xl font-bold text-[#231F20]">{selectedCategory && selectedCategory !== "all" ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : "All Products"}</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} products</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#F8F8F8] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#231F20] focus:outline-none focus:border-[#58BA49]">
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
      {/* Category pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => navigate("/shop")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory || selectedCategory === "all" ? "bg-[#58BA49] text-white" : "bg-[#F8F8F8] text-gray-600 hover:bg-gray-200"}`}>All</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.toLowerCase() ? "bg-[#58BA49] text-white" : "bg-[#F8F8F8] text-gray-600 hover:bg-gray-200"}`}>{cat}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((product) => <ProductGridCard key={product.id} product={product} onQuickAdd={(p) => onAddToCart(p)} />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No products found in this category</p>
        </div>
      )}
    </div>
  );
}

/* ======================== STATIC PAGES (Light Theme) ======================== */
function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#231F20] mb-6">About The Hemp Dispensary</h1>
      <div className="prose prose-lg text-gray-600">
        <p className="mb-4">The Hemp Dispensary is Spring Hill's premier destination for high-quality hemp products. We're committed to providing lab-tested, clean products that you can trust.</p>
        <p className="mb-4">With two convenient locations in Spring Hill, Florida, we make it easy to find the perfect hemp product for your needs. Our knowledgeable staff is always ready to help you find exactly what you're looking for.</p>
        <p>Whether you're looking for flower, edibles, concentrates, or topicals, we have a wide selection of premium products at competitive prices.</p>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-[#231F20] mb-6">Terms of Service</h1>
      <div className="prose prose-lg text-gray-600">
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
      <div className="prose prose-lg text-gray-600">
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
      <div className="prose prose-lg text-gray-600">
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
      <div className="prose prose-lg text-gray-600">
        <p className="mb-4">Have questions? We'd love to hear from you!</p>
        <div className="space-y-3">
          <p className="flex items-center gap-2"><Phone className="h-5 w-5 text-[#58BA49]" /> (352) 340-2861</p>
          <p className="flex items-center gap-2"><Mail className="h-5 w-5 text-[#58BA49]" /> support@thehempdispensary.com</p>
          <p className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#58BA49]" /> Spring Hill, FL</p>
        </div>
      </div>
    </div>
  );
}


/* ======================== FOOTER (Dark Background) ======================== */
function SiteFooter() {
  return (
    <footer className="bg-[#231F20] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt="The Hemp Dispensary" className="h-12 w-auto mb-4" />
            <p className="text-gray-400 text-sm">Spring Hill's trusted source for premium hemp products.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Shop</h3>
            <div className="space-y-2">
              <a href="#/shop/flower" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Flower</a>
              <a href="#/shop/edibles" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Edibles</a>
              <a href="#/shop/concentrates" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Concentrates</a>
              <a href="#/shop/vapor" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Vapor</a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Company</h3>
            <div className="space-y-2">
              <a href="#/about" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">About Us</a>
              <a href="#/contact" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Contact</a>
              <a href="#/loyalty" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Rewards</a>
              <a href="#/games" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Games</a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Legal</h3>
            <div className="space-y-2">
              <a href="#/terms" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Terms of Service</a>
              <a href="#/privacy" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Privacy Policy</a>
              <a href="#/shipping" className="block text-gray-400 hover:text-[#ADD038] text-sm transition-colors">Shipping & Pickup</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} The Hemp Dispensary. All rights reserved.</p>
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
        <button onClick={openChat} className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-[#58BA49] hover:bg-[#4aa83d] shadow-lg flex items-center justify-center transition-all hover:scale-110" aria-label="Chat with Bud">
          <img src="/bud-puppet.png" alt="Bud" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <MessageCircle className="h-6 w-6 text-white absolute" style={{ display: 'none' }} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[340px] sm:w-[380px] max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#58BA49] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/bud-puppet.png" alt="Bud" className="w-8 h-8 object-contain rounded-full bg-white/20 p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <p className="font-bold text-sm">Bud</p>
                <p className="text-xs text-white/80">Your hemp guide</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="h-5 w-5" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.from === "user" ? "bg-[#58BA49] text-white rounded-2xl rounded-br-md px-3 py-2" : "bg-[#F8F8F8] text-[#231F20] rounded-2xl rounded-bl-md px-3 py-2"}`}>
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  {/* Product cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.products.map(p => (
                        <div key={p.id} className="bg-white rounded-lg p-2 border border-gray-100 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => { navigate(`/product/${p.id}`); setOpen(false); }}>
                          <div className="flex items-center gap-2">
                            <img src={p.image_url || placeholderUrl(p.name, 60)} alt={p.name} className="w-10 h-10 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(p.name, 60); }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#231F20] truncate">{p.online_name || p.name}</p>
                              <p className="text-xs text-[#58BA49] font-bold">{formatPrice(p.price)}</p>
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
                        <button key={j} onClick={() => handleButtonClick(btn.value)} className="px-3 py-1.5 bg-white border border-[#58BA49] text-[#58BA49] rounded-full text-xs font-medium hover:bg-[#58BA49] hover:text-white transition-colors">
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
          <div className="border-t border-gray-200 p-3 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Ask Bud anything..."
              className="flex-1 bg-[#F8F8F8] border border-gray-200 rounded-full px-4 py-2 text-sm text-[#231F20] placeholder-gray-400 focus:outline-none focus:border-[#58BA49]"
            />
            <button onClick={handleSend} className="p-2 bg-[#58BA49] hover:bg-[#4aa83d] text-white rounded-full transition-colors">
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

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

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
            color: "#ffffff",
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "12px 16px",
            height: "48px",
          },
          "input:focus": { border: "1px solid #22c55e" },
          "input::placeholder": { color: "#6b7280" },
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
        <ShoppingCart className="mx-auto h-16 w-16 text-gray-700 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
        <p className="text-gray-400 mb-6">Add some products before checking out.</p>
        <button onClick={() => navigate("/shop")} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-medium transition-colors">Shop Now</button>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="bg-green-600/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Payment Successful!</h1>
        <p className="text-gray-400 mb-2">Thank you for your order, {form.firstName}!</p>
        <p className="text-gray-500 text-sm mb-6">Order #{orderNumber}</p>
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-3">What happens next?</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex gap-3"><Mail className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" /><p>A confirmation email will be sent to <span className="text-white">{form.email}</span></p></div>
            <div className="flex gap-3"><Package className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" /><p>Your order will be prepared and packaged</p></div>
            <div className="flex gap-3"><Truck className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" /><p>You'll receive shipping details once dispatched</p></div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate("")} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-medium transition-colors">Continue Shopping</button>
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
              step === s.key ? "bg-green-600 text-white" : steps.findIndex((x) => x.key === step) > i ? "bg-green-600/20 text-green-400" : "bg-gray-800 text-gray-500"
            }`}>
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-1 ${steps.findIndex((x) => x.key === step) > i ? "bg-green-600" : "bg-gray-800"}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-3">
          {step === "info" && (
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>First Name *</label><input type="text" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} placeholder="John" className={inputClass} /></div>
                  <div><label className={labelClass}>Last Name *</label><input type="text" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} placeholder="Doe" className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Email *</label><input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="john@example.com" className={inputClass} /></div>
                <div><label className={labelClass}>Phone *</label><input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="(352) 555-0123" className={inputClass} /></div>
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => navigate("/shop")} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Shop</button>
                <button onClick={() => setStep("shipping")} disabled={!canProceedInfo} className={`px-8 py-3 rounded-full font-medium transition-all ${canProceedInfo ? "bg-green-600 hover:bg-green-500 text-white" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}>Continue to Shipping</button>
              </div>
            </div>
          )}

          {step === "shipping" && (
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-6">Shipping Address</h2>
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
                    <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {addressSuggestions.map((s, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700/50 last:border-b-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, address: s.address, city: s.city, state: s.state, zip: s.zip }));
                            setShowSuggestions(false);
                            setAddressSuggestions([]);
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
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
                <button onClick={() => setStep("info")} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => setStep("payment")} disabled={!canProceedShipping} className={`px-8 py-3 rounded-full font-medium transition-all ${canProceedShipping ? "bg-green-600 hover:bg-green-500 text-white" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}>Continue to Payment</button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-6">Review & Pay</h2>

              {/* Contact summary */}
              <div className="mb-4 p-4 bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-300">Contact</h3>
                  <button onClick={() => setStep("info")} className="text-xs text-green-400 hover:text-green-300">Edit</button>
                </div>
                <p className="text-white text-sm">{form.firstName} {form.lastName}</p>
                <p className="text-gray-400 text-sm">{form.email} &bull; {form.phone}</p>
              </div>

              {/* Shipping summary */}
              <div className="mb-4 p-4 bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-300">Shipping Address</h3>
                  <button onClick={() => setStep("shipping")} className="text-xs text-green-400 hover:text-green-300">Edit</button>
                </div>
                <p className="text-white text-sm">{form.address}{form.apartment ? `, ${form.apartment}` : ""}</p>
                <p className="text-gray-400 text-sm">{form.city}, {form.state} {form.zip}</p>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Items ({itemCount})</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        <img src={item.product.image_url || placeholderUrl(item.product.name, 100)} alt={item.product.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(item.product.name, 100); }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.product.online_name || item.product.name}</p>
                        <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-white text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Card Entry */}
              <div className="mb-6 p-5 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-green-400" />
                  <h3 className="text-white font-semibold">Payment Details</h3>
                  <Lock className="h-3.5 w-3.5 text-gray-500 ml-auto" />
                  <span className="text-xs text-gray-500">Secure</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Card Number</label>
                    <div id="clover-card-number" className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Expiration</label>
                      <div id="clover-card-date" className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                    </div>
                    <div>
                      <label className={labelClass}>CVV</label>
                      <div id="clover-card-cvv" className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                    </div>
                    <div>
                      <label className={labelClass}>ZIP Code</label>
                      <div id="clover-card-zip" className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden" style={{ minHeight: "48px" }}></div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Your payment is securely processed by Clover
                </p>
              </div>

              {/* Loyalty Number */}
              <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-4 w-4 text-green-400" />
                  <h3 className="text-white text-sm font-semibold">Hemp Rewards (optional)</h3>
                </div>
                <input
                  type="text"
                  value={form.loyaltyNumber}
                  onChange={(e) => setField("loyaltyNumber", e.target.value)}
                  placeholder="Enter your loyalty number or phone number"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-2">Enter your rewards number to earn points on this purchase</p>
              </div>

              {/* Error display */}
              {paymentError && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 text-sm font-medium">Payment Error</p>
                    <p className="text-red-400/80 text-sm">{paymentError}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep("shipping")} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <img src={item.product.image_url || placeholderUrl(item.product.name, 100)} alt={item.product.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(item.product.name, 100); }} />
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{item.product.online_name || item.product.name}</p>
                  </div>
                  <p className="text-white text-xs font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Shipping</span><span className="text-white">{shippingCost === 0 ? <span className="text-green-400">Free</span> : formatPrice(shippingCost)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Tax (7%)</span><span className="text-white">{formatPrice(tax)}</span></div>
              <div className="border-t border-gray-800 pt-3 flex justify-between"><span className="text-white font-semibold">Total</span><span className="text-xl font-bold text-white">{formatPrice(total)}</span></div>
            </div>
            {shippingCost > 0 && <p className="text-center text-xs text-green-400 mt-3">Add {formatPrice(5000 - subtotal)} more for free shipping!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ======================== LOYALTY PAGE (Preserved) ======================== */

function LoyaltyPage() {
  const [phone, setPhone] = useState("");
  const [lookupResult, setLookupResult] = useState<{ found: boolean; points?: number; name?: string } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({ first_name: "", last_name: "", phone: "", email: "" });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<{ status: string; message: string; points?: number } | null>(null);

  const handleLookup = async () => {
    if (!phone) return;
    setLookupLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/lookup?phone=${encodeURIComponent(phone)}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data.found && data.customer) {
          setLookupResult({ found: true, points: data.customer.points_balance || 0, name: `${data.customer.first_name} ${data.customer.last_name || ""}`.trim() || "Member" });
        } else if (data.found) {
          setLookupResult({ found: true, points: data.points_balance || data.points || 0, name: data.name || data.first_name || "Member" });
        } else {
          setLookupResult({ found: false });
        }
      } else {
        setLookupResult({ found: false });
      }
    } catch {
      setLookupResult({ found: false });
    }
    setLookupLoading(false);
  };

  const handleSignup = async () => {
    if (!signupForm.first_name || !signupForm.phone) return;
    setSignupLoading(true);
    setSignupResult(null);
    try {
      const params = new URLSearchParams({ phone: signupForm.phone, first_name: signupForm.first_name, last_name: signupForm.last_name || "", email: signupForm.email || "" });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/signup?${params.toString()}`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await resp.json();
      if (resp.ok) {
        setSignupResult({ status: data.status, message: data.message, points: data.points });
        setShowSignup(false);
      } else {
        setSignupResult({ status: "error", message: data.detail || "Something went wrong. Please try again." });
      }
    } catch {
      setSignupResult({ status: "error", message: "Unable to connect. Please try again." });
    }
    setSignupLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600/20 rounded-full mb-6">
          <Gift className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Hemp Rewards</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Earn points on every purchase, in-store and online. Redeem for discounts on your favorite products.</p>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">1</div>
          <h3 className="text-white font-semibold mb-2">Sign Up</h3>
          <p className="text-gray-400 text-sm">Create your rewards account with your phone number at any location or online.</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">2</div>
          <h3 className="text-white font-semibold mb-2">Earn Points</h3>
          <p className="text-gray-400 text-sm">Earn 1 point for every $1 spent. Points work across East, West, and online.</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">3</div>
          <h3 className="text-white font-semibold mb-2">Redeem</h3>
          <p className="text-gray-400 text-sm">Use your points for discounts: 100 pts = $5 off, 200 pts = $12 off, 500 pts = $35 off.</p>
        </div>
      </div>

      {/* Sign Up Result */}
      {signupResult && (
        <div className={`max-w-lg mx-auto mb-8 p-4 rounded-lg text-center ${signupResult.status === "error" ? "bg-red-900/30 border border-red-700/50" : "bg-green-900/30 border border-green-700/50"}`}>
          <p className={`font-semibold ${signupResult.status === "error" ? "text-red-400" : "text-green-400"}`}>{signupResult.message}</p>
          {signupResult.points !== undefined && signupResult.points > 0 && <p className="text-white mt-1">You earned <span className="font-bold text-green-400">{signupResult.points} bonus points</span> for signing up!</p>}
        </div>
      )}

      {/* Points lookup */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800 max-w-lg mx-auto mb-8">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Check Your Points</h2>
        <div className="flex gap-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
          />
          <button
            onClick={handleLookup}
            disabled={lookupLoading || !phone}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {lookupLoading ? "..." : "Look Up"}
          </button>
        </div>
        {lookupResult && (
          <div className={`mt-4 p-4 rounded-lg ${lookupResult.found ? "bg-green-900/30 border border-green-700/50" : "bg-gray-800 border border-gray-700"}`}>
            {lookupResult.found ? (
              <div className="text-center">
                <p className="text-green-400 font-semibold text-lg">Welcome back, {lookupResult.name}!</p>
                <p className="text-white text-3xl font-bold mt-2">{lookupResult.points} <span className="text-sm text-gray-400 font-normal">points</span></p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400">No rewards account found for this number.</p>
                <button onClick={() => { setShowSignup(true); setSignupForm(f => ({ ...f, phone })); }} className="mt-3 text-green-400 hover:text-green-300 font-medium underline transition-colors">Sign up for Hemp Rewards</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sign Up Form */}
      {showSignup && (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-green-700/50 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Join Hemp Rewards</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Create your free rewards account and start earning points!</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">First Name *</label>
                <input type="text" value={signupForm.first_name} onChange={(e) => setSignupForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Last Name</label>
                <input type="text" value={signupForm.last_name} onChange={(e) => setSignupForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number *</label>
              <input type="tel" value={signupForm.phone} onChange={(e) => setSignupForm(f => ({ ...f, phone: e.target.value }))} placeholder="(352) 555-0123" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email (optional)</label>
              <input type="email" value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
            </div>
            <button onClick={handleSignup} disabled={signupLoading || !signupForm.first_name || !signupForm.phone} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {signupLoading ? "Creating account..." : "Create My Rewards Account"}
            </button>
            <button onClick={() => setShowSignup(false)} className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Sign up CTA when no form shown */}
      {!showSignup && !signupResult && (
        <div className="text-center">
          <p className="text-gray-500 text-sm">Don't have an account? <button onClick={() => setShowSignup(true)} className="text-green-400 hover:text-green-300 font-medium underline">Sign up for free</button></p>
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
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-4">
              <User className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">{memberData.name}</h1>
            <p className="text-gray-400">{memberData.phone} {memberData.email ? `| ${memberData.email}` : ""}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">Your Reward Points</p>
            <p className="text-4xl font-bold text-green-400">{memberData.points}</p>
            <p className="text-gray-500 text-xs mt-1">Points work across all locations + online</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
              <span className="text-gray-300">100 points</span>
              <span className="text-green-400 font-semibold">$5 off</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
              <span className="text-gray-300">200 points</span>
              <span className="text-green-400 font-semibold">$12 off</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
              <span className="text-gray-300">500 points</span>
              <span className="text-green-400 font-semibold">$35 off</span>
            </div>
          </div>
          <button onClick={() => { setLoggedIn(false); setMemberData(null); setSignupResult(null); }} className="w-full mt-6 py-3 border border-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors">
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
        <div className={`mb-6 p-4 rounded-lg text-center ${signupResult.status === "error" ? "bg-red-900/30 border border-red-700/50" : "bg-green-900/30 border border-green-700/50"}`}>
          <p className={`font-semibold ${signupResult.status === "error" ? "text-red-400" : "text-green-400"}`}>{signupResult.message}</p>
        </div>
      )}

      {!showSignup ? (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-4">
              <User className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-gray-400 text-sm">Access your Hemp Rewards account</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={loginForm.phone}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(352) 555-0123"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
            </div>
            <div className="text-center text-gray-600 text-sm">— or —</div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
            </div>
            {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
          <div className="text-center mt-6 border-t border-gray-800 pt-6">
            <p className="text-gray-500 text-sm mb-3">Don't have an account?</p>
            <button onClick={() => setShowSignup(true)} className="w-full py-3 border border-green-600 text-green-400 hover:bg-green-600/10 rounded-lg font-medium transition-colors">
              Sign Up for Hemp Rewards
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-green-700/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-4">
              <Gift className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Join Hemp Rewards</h1>
            <p className="text-gray-400 text-sm">Create your free rewards account and start earning points!</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">First Name *</label>
                <input type="text" value={signupForm.first_name} onChange={(e) => setSignupForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Last Name</label>
                <input type="text" value={signupForm.last_name} onChange={(e) => setSignupForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number *</label>
              <input type="tel" value={signupForm.phone} onChange={(e) => setSignupForm(f => ({ ...f, phone: e.target.value }))} placeholder="(352) 555-0123" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email (optional)</label>
              <input type="email" value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
            </div>
            {signupResult && signupResult.status === "error" && <p className="text-red-400 text-sm text-center">{signupResult.message}</p>}
            <button onClick={handleSignup} disabled={signupLoading || !signupForm.first_name || !signupForm.phone} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {signupLoading ? "Creating account..." : "Create My Rewards Account"}
            </button>
            <button onClick={() => { setShowSignup(false); setSignupResult(null); }} className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">Already have an account? Sign in</button>
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
    grad.addColorStop(0, "#2d5a27");
    grad.addColorStop(0.5, "#1a3d15");
    grad.addColorStop(1, "#2d5a27");
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
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => { setIsScratching(true); setHasStarted(true); scratch(e.clientX, e.clientY); };
  const handleMouseMove = (e: React.MouseEvent) => { if (isScratching) scratch(e.clientX, e.clientY); };
  const handleMouseUp = () => setIsScratching(false);
  const handleTouchStart = (e: React.TouchEvent) => { setHasStarted(true); const t = e.touches[0]; scratch(t.clientX, t.clientY); };
  const handleTouchMove = (e: React.TouchEvent) => { e.preventDefault(); const t = e.touches[0]; scratch(t.clientX, t.clientY); };

  const resetCard = () => {
    setRevealed(false); setHasStarted(false); setScratchPercent(0); scratchedPixels.current = 0;
    const p = prizes[Math.floor(Math.random() * prizes.length)];
    setPrize(p.text); setPrizeEmoji(p.emoji);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#2d5a27"); grad.addColorStop(0.5, "#1a3d15"); grad.addColorStop(1, "#2d5a27");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    for (let i = -canvas.height; i < canvas.width; i += 12) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + canvas.height, canvas.height); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "14px sans-serif"; ctx.fillText("to reveal your prize!", canvas.width / 2, canvas.height / 2 + 15);
    ctx.font = "24px serif"; ctx.fillText("\u{1F33F} \u{1F33F} \u{1F33F}", canvas.width / 2, canvas.height - 20);
  };

  const currentPrize = prizes.find(p => p.text === prize);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Scratch & Win!</h1>
        <p className="text-gray-400">Scratch the card below to reveal your prize</p>
      </div>
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-8 text-center">
        <div className="relative inline-block rounded-xl overflow-hidden border-4 border-green-600 shadow-lg shadow-green-900/30" style={{ width: 320, height: 200 }}>
          {/* Prize underneath */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-900 via-black to-green-900">
            <span className="text-5xl mb-2">{prizeEmoji}</span>
            <span className="text-2xl font-bold text-green-400">{prize}</span>
            {currentPrize && <span className="text-sm text-gray-400 mt-1">{currentPrize.desc}</span>}
          </div>
          {/* Scratch canvas on top */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-pointer" style={{ width: 320, height: 200, touchAction: "none" }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
          />
        </div>
        {hasStarted && !revealed && <div className="mt-4"><div className="w-64 mx-auto bg-gray-800 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${scratchPercent}%` }} /></div><p className="text-xs text-gray-500 mt-1">{Math.round(scratchPercent)}% scratched</p></div>}
        {revealed && (
          <div className="mt-6 animate-pulse">
            <p className="text-green-400 text-lg font-semibold mb-4">Congratulations! You won {prize}!</p>
            <button onClick={resetCard} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-medium transition-all">Try Again</button>
          </div>
        )}
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {prizes.map((p, i) => (
          <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center">
            <span className="text-2xl">{p.emoji}</span>
            <p className="text-xs text-gray-400 mt-1 font-medium">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================== ROLL A JOINT GAME ======================== */
const STRAINS = [
  { name: "OG Kush", color: "#4a7c3f", desc: "Classic earthy pine" },
  { name: "Purple Haze", color: "#6b3fa0", desc: "Sweet berry vibes" },
  { name: "Sour Diesel", color: "#8fa03f", desc: "Energizing citrus" },
  { name: "Blue Dream", color: "#3f6fa0", desc: "Calm & creative" },
];

function BudPuppet({ size = 80, className = "", action = "idle" }: { size?: number; className?: string; action?: string }) {
  const actionClass = action === "grind" ? "animate-spin-slow" : action === "roll" ? "animate-wiggle" : action === "light" ? "animate-pulse" : action === "smoke" ? "animate-float" : action === "celebrate" ? "animate-bounce" : "";
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <img src="/bud-puppet.png" alt="Bud Puppet" className={`w-full h-full object-contain drop-shadow-lg ${actionClass}`} style={{ filter: "drop-shadow(0 0 12px rgba(34,197,94,0.4))" }} />
      {action === "grind" && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-green-400 animate-pulse whitespace-nowrap">Grinding...</div>}
      {action === "roll" && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-amber-400 animate-pulse whitespace-nowrap">Rolling!</div>}
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
        <h1 className="text-4xl font-bold text-white mb-2">Roll a Joint!</h1>
        <p className="text-gray-400">Help Bud Puppet grind, roll, light, and enjoy</p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <span className="text-green-400 font-bold">Round {round}</span>
          <span className="text-yellow-400 font-bold">Score: {score}</span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-8">
        {/* Bud Puppet mascot */}
        <div className="flex justify-center mb-6">
          <BudPuppet size={100} action={budAction} />
        </div>

        {/* Step 0: Pick Flower */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Step 1: Pick Your Flower</h2>
            <p className="text-gray-500 text-center text-sm mb-4">Bud Puppet wants to roll one up! Choose a strain:</p>
            <div className="grid grid-cols-2 gap-4">
              {STRAINS.map(s => (
                <button key={s.name} onClick={() => pickStrain(s)}
                  className="p-4 rounded-xl border-2 border-gray-700 hover:border-green-500 bg-gray-800/50 hover:bg-gray-800 transition-all group">
                  <div className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110" style={{ background: s.color }}>
                    <img src="/bud-puppet.png" alt={s.name} className="w-12 h-12 object-contain" />
                  </div>
                  <p className="text-white font-semibold">{s.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Grind - Bud Puppet grinds the flower */}
        {step === 1 && selectedStrain && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Step 2: Grind the {selectedStrain.name}</h2>
            <p className="text-gray-500 text-sm mb-4">Bud Puppet is grinding it up!</p>
            <div className="relative w-48 h-48 mx-auto mb-4">
              {/* Grinder with Bud Puppet inside */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-600 overflow-hidden" style={{ background: `conic-gradient(${selectedStrain.color} ${grindProgress}%, #374151 ${grindProgress}%)` }}>
                <div className="absolute inset-4 rounded-full bg-gray-800/80 border-2 border-gray-600 flex items-center justify-center">
                  <div style={{ transform: `rotate(${grindProgress * 3.6}deg)`, transition: "transform 0.1s" }}>
                    <img src="/bud-puppet.png" alt="Grinding" className="w-16 h-16 object-contain" />
                  </div>
                </div>
              </div>
              {/* Grinding particles */}
              {grindProgress > 20 && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm text-green-400 animate-pulse">{"Crunch crunch..."}</div>}
            </div>
            <div className="w-56 mx-auto bg-gray-800 rounded-full h-4 mb-4 overflow-hidden">
              <div className="h-4 rounded-full transition-all flex items-center justify-center text-xs font-bold text-white" style={{ width: `${grindProgress}%`, background: `linear-gradient(90deg, ${selectedStrain.color}, #22c55e)` }}>
                {grindProgress > 15 && `${Math.round(grindProgress)}%`}
              </div>
            </div>
            <button onMouseDown={startGrind} onMouseUp={stopGrind} onMouseLeave={stopGrind}
              onTouchStart={startGrind} onTouchEnd={stopGrind}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-lg transition-all active:scale-95 shadow-lg shadow-green-900/50">
              Hold to Grind
            </button>
          </div>
        )}

        {/* Step 2: Roll - Bud Puppet rolls it */}
        {step === 2 && selectedStrain && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Step 3: Roll the Joint</h2>
            <p className="text-gray-500 text-sm mb-4">Bud Puppet is rolling it tight!</p>
            <div className="relative w-72 h-28 mx-auto mb-6">
              {/* Rolling paper background */}
              <div className="absolute inset-0 rounded-xl bg-amber-900/20 border-2 border-amber-700/30 overflow-hidden">
                {/* Filled portion */}
                <div className="h-full rounded-xl transition-all duration-200 flex items-center" style={{ width: `${rollProgress}%`, background: `linear-gradient(90deg, ${selectedStrain.color}44, ${selectedStrain.color})` }}>
                  {rollProgress > 10 && <img src="/bud-puppet.png" alt="Rolling" className="h-16 w-16 object-contain ml-auto mr-2 animate-wiggle" />}
                </div>
              </div>
              {/* Rolling paper texture lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {rollProgress < 100 && <span className="text-amber-200/40 text-sm">{"~ rolling paper ~"}</span>}
                {rollProgress >= 100 && <span className="text-green-400 font-bold text-lg animate-bounce">{"Perfect roll!"}</span>}
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">Tap to roll! ({Math.round(rollProgress)}%)</p>
            <button onClick={handleRollClick}
              className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-bold text-lg transition-all active:scale-90 shadow-lg shadow-amber-900/50">
              Tap to Roll
            </button>
          </div>
        )}

        {/* Step 3: Light - Bud Puppet lights it */}
        {step === 3 && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Step 4: Light It Up!</h2>
            <p className="text-gray-500 text-sm mb-4">Bud Puppet is sparking it up!</p>
            <div className="relative w-56 h-56 mx-auto mb-4">
              {/* Joint */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-8 h-36 rounded-t-sm overflow-hidden" style={{ background: `linear-gradient(180deg, ${selectedStrain?.color || "#4a7c3f"}, #f5f0dc)` }}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  {lightProgress > 0 && <span className="text-4xl animate-pulse">{"\uD83D\uDD25"}</span>}
                </div>
                {/* Glow effect */}
                {lightProgress > 0 && <div className="absolute top-0 left-0 right-0 h-4" style={{ background: `linear-gradient(180deg, orange, transparent)`, opacity: lightProgress / 100 }} />}
              </div>
              {/* Bud Puppet holding the joint */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <img src="/bud-puppet.png" alt="Lighting" className="w-20 h-20 object-contain" style={{ filter: `brightness(${1 + lightProgress / 200})` }} />
              </div>
              {/* Lighter */}
              {lightProgress < 100 && <div className="absolute top-8 right-4 text-4xl animate-bounce">{"\uD83E\uDE94"}</div>}
            </div>
            <div className="w-56 mx-auto bg-gray-800 rounded-full h-4 mb-4 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-500 h-4 rounded-full transition-all flex items-center justify-center text-xs font-bold text-white" style={{ width: `${lightProgress}%` }}>
                {lightProgress > 15 && `${Math.round(lightProgress)}%`}
              </div>
            </div>
            <button onClick={handleLightClick}
              className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold text-lg transition-all active:scale-95 shadow-lg shadow-orange-900/50">
              {"\uD83D\uDD25"} Click to Light
            </button>
          </div>
        )}

        {/* Step 4: Smoke animation - Bud Puppet enjoys */}
        {step === 4 && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">Bud Puppet is Enjoying It!</h2>
            <div className="relative w-72 h-72 mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${selectedStrain?.color || "#4a7c3f"}66, transparent)`, opacity: smokeOpacity }} />
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
            <h2 className="text-2xl font-bold text-green-400 mb-2">Round {round} Complete!</h2>
            <p className="text-gray-400 mb-2">Bud Puppet rolled a perfect {selectedStrain?.name} joint!</p>
            <p className="text-yellow-400 font-bold text-xl mb-6">+{100 + round * 10} points!</p>
            <BudPuppet size={100} action="celebrate" className="mx-auto mb-6" />
            <button onClick={nextRound}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-green-900/50">
              Next Round
            </button>
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {["Pick", "Grind", "Roll", "Light", "Smoke"].map((label, i) => (
          <div key={i} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${i <= step ? "bg-green-900/50 text-green-400 border border-green-700" : "bg-gray-900 text-gray-600 border border-gray-800"}`}>
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
      <div className="max-w-2xl mx-auto px-4 pt-8"><button onClick={() => setActiveGame("none")} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Games</button></div>
      <ScratchCardGame />
    </div>
  );
  if (activeGame === "roll") return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-8"><button onClick={() => setActiveGame("none")} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Games</button></div>
      <RollAJointGame />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">Hemp Games</h1>
        <p className="text-gray-400 text-lg">Play games, win prizes, and have fun!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scratch Card */}
        <button onClick={() => setActiveGame("scratch")}
          className="bg-gradient-to-br from-green-900/50 to-gray-900 border-2 border-green-700/50 hover:border-green-500 rounded-2xl p-8 text-left transition-all hover:scale-105 group">
          <div className="text-5xl mb-4">{"\u{1F3B0}"}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Scratch & Win</h2>
          <p className="text-gray-400">Scratch the card to reveal exclusive prizes — discounts, free shipping, bonus points, and more!</p>
          <span className="inline-block mt-4 text-green-400 font-semibold group-hover:translate-x-1 transition-transform">        Play Now {"\u2192"}</span>
                </button>
                {/* Roll a Joint */}
        <button onClick={() => setActiveGame("roll")}
          className="bg-gradient-to-br from-amber-900/30 to-gray-900 border-2 border-amber-700/50 hover:border-amber-500 rounded-2xl p-8 text-left transition-all hover:scale-105 group">
          <div className="text-5xl mb-4">{"\u{1F525}"}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Roll a Joint</h2>
          <p className="text-gray-400">Pick your flower, grind it, roll it, light it! Watch your cannabis nut character enjoy the ride.</p>
          <span className="inline-block mt-4 text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">      Play Now {"\u2192"}</span>
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

    // Always fetch fresh data in background
    fetch(`${API_URL}/api/ecommerce/products?limit=1000`)
      .then((r) => r.json())
      .then((data: ProductsResponse) => {
        setProducts(data.products);
        setCategories(data.categories);
        setLoading(false);
        try { localStorage.setItem("thd-products-cache", JSON.stringify({ products: data.products, categories: data.categories, timestamp: Date.now() })); } catch { /* quota */ }
      })
      .catch((err) => { console.error("Failed to load products:", err); setLoading(false); });
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
    <div className="min-h-screen bg-white">
      <StickyTopBar />
      <Header cartCount={cartCount} onSearch={() => setSearchOpen(true)} onCartOpen={() => setCartOpen(true)} />
      {content}
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
      ? <div className="flex flex-col items-center justify-center py-24"><img src="/logo.png" alt="The Hemp Dispensary" className="h-20 w-auto animate-pulse mb-4" /><p className="text-gray-500 text-lg italic">Remedy Your Way</p></div>
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
    <div className="min-h-screen bg-white">
      <StickyTopBar />
      <Header cartCount={cartCount} onSearch={() => setSearchOpen(true)} onCartOpen={() => setCartOpen(true)} />
      <HeroSection />
      <TrustStrip />
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24"><img src="/logo.png" alt="The Hemp Dispensary" className="h-20 w-auto animate-pulse mb-4" /><p className="text-gray-500 text-lg italic">Remedy Your Way</p></div>
      ) : (
        <>
          <ShopByCategory categories={categories} productsByCategory={productsByCategory} />
          <ShopByFeeling products={products} />
          {/* Product carousels by category */}
          {homeCategories.map((cat) => {
            const inStock = (productsByCategory[cat] || []).filter(p => p.stock > 0);
            const catProducts = inStock.filter(p => p.image_url && !p.image_url.includes('placehold.co'));
            const displayProducts = catProducts.length >= 4 ? catProducts.slice(0, 4) : inStock.slice(0, 4);
            if (displayProducts.length === 0) return null;
            return (
              <section key={cat} className="py-10 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-[#231F20]">{cat}</h2>
                    <button onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className="border border-[#58BA49] text-[#58BA49] hover:bg-[#58BA49] hover:text-white px-6 py-2 rounded-full font-medium transition-all duration-300 text-sm">View All</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <SiteFooter />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} />
      <ChatbotBud products={products} />
    </div>
  );
}

export default App;
