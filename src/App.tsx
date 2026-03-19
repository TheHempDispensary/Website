import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, ShoppingCart, Package, X, ArrowLeft, MapPin, Clock, Phone, Mail, Star, Plus, Minus, Trash2, CheckCircle, Truck, CreditCard, Lock, AlertCircle, User, Gift, Gamepad2 } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Clover: any;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const CLOVER_PAKMS_KEY = "2a720977884442c0c638b21b7746bfc1";
const CLOVER_MERCHANT_ID = "XD21MGSEBV081";

// Cart types and helpers
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

function placeholderUrl(name: string, size = 400): string {
  const text = name.split(" ").slice(0, 3).join("\n");
  return `https://placehold.co/${size}x${size}/000000/22c55e?text=${encodeURIComponent(text)}&font=roboto`;
}

function FloatingImage({ src, alt, size = "md" }: { src: string; alt: string; size?: "sm" | "md" | "lg" }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -25, y: x * 25 });
  };

  const sizeClasses: Record<string, string> = { sm: "w-full h-full", md: "w-full aspect-square", lg: "w-full h-full" };
  const hasRealImage = src && !src.includes("placehold.co") && !isPlaceholder;

  return (
    <div
      ref={ref}
      className={`${sizeClasses[size]} relative group`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setTilt({ x: 0, y: 0 }); }}
      style={{ perspective: "800px" }}
    >
      <div
        className="w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: hover
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(30px) scale(1.1)`
            : "rotateX(0) rotateY(0) translateZ(0) scale(1)",
          transformStyle: "preserve-3d",
          animation: hasRealImage ? "productFloat 3s ease-in-out infinite" : undefined,
        }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-contain ${hasRealImage ? "rounded-lg" : ""}`}
          style={{
            filter: hover
              ? hasRealImage ? "none" : "drop-shadow(0 30px 50px rgba(34, 197, 94, 0.4)) drop-shadow(0 10px 20px rgba(34, 197, 94, 0.2))"
              : hasRealImage
                ? "none"
                : "drop-shadow(0 15px 25px rgba(0,0,0,0.4))",
            transition: "filter 0.3s ease",
          }}
          onError={(e) => { setIsPlaceholder(true); (e.target as HTMLImageElement).src = placeholderUrl(alt); }}
        />
      </div>
      {/* Shadow on ground */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-300"
        style={{
          width: hover ? "80%" : hasRealImage ? "0%" : "50%",
          height: hasRealImage ? "0px" : "8px",
          background: hasRealImage
            ? "none"
            : "radial-gradient(ellipse, rgba(34,197,94,0.4) 0%, transparent 70%)",
          filter: hover ? "blur(10px)" : "blur(8px)",
          animation: hasRealImage ? undefined : undefined,
        }}
      />
    </div>
  );
}

function ProductGridCard({ product }: { product: Product }) {
  if (product.stock <= 0) return null;
  return (
    <div className="cursor-pointer group" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="bg-[#000000] rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20">
        <div className="h-48 flex items-center justify-center mb-3">
          <FloatingImage src={product.image_url || placeholderUrl(product.name)} alt={product.name} size="sm" />
        </div>
        {product.stock <= 5 && <span className="inline-block bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded mb-2">Only {Math.floor(product.stock)} remaining</span>}
        <h3 className="text-white text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem] mb-2 group-hover:text-green-400 transition-colors">{product.online_name || product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-green-400 font-bold text-lg">{formatPrice(product.price)}</span>
          {product.is_age_restricted && <span className="text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-0.5 rounded">21+</span>}
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ productId, onAddToCart }: { productId: string; onAddToCart: (product: Product, qty: number) => void }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/ecommerce/products/${productId}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-32">
      <Package className="mx-auto h-16 w-16 text-gray-600 mb-4" />
      <p className="text-gray-400 text-lg">Product not found</p>
      <button onClick={() => navigate("")} className="mt-4 text-green-400 hover:underline">Back to products</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 sm:mb-6 font-medium text-sm sm:text-base">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </button>
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-800">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-4 sm:p-8 flex items-center justify-center bg-black/50 min-h-[250px] sm:min-h-[400px]" style={{ perspective: "1000px" }}>
            <FloatingImage src={product.image_url || placeholderUrl(product.name, 600)} alt={product.name} size="lg" />
          </div>
          <div className="p-5 sm:p-8 md:p-12 flex flex-col">
            {product.categories.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {product.categories.map((cat) => (
                  <span key={cat} className="text-xs font-medium bg-green-900/50 text-green-400 px-3 py-1 rounded-full border border-green-800">{cat}</span>
                ))}
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{product.online_name || product.name}</h1>
            <p className="text-3xl font-bold text-green-400 mb-6">{formatPrice(product.price)}</p>
            {product.is_age_restricted && (
              <div className="flex items-center gap-2 mb-4 bg-amber-900/30 border border-amber-700/50 rounded-lg px-4 py-2">
                <span className="text-amber-400 font-bold">21+</span>
                <span className="text-amber-300 text-sm">Age verification required</span>
              </div>
            )}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">{product.description}</p>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Availability</h3>
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${product.stock <= 5 ? 'bg-amber-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                  <span className={`font-medium ${product.stock <= 5 ? 'text-amber-400' : 'text-green-400'}`}>{product.stock <= 5 ? `Only ${Math.floor(product.stock)} remaining` : `In Stock (${Math.floor(product.stock)} available)`}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-medium">Out of Stock</span>
                </div>
              )}
            </div>
            {product.sku && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">SKU</h3>
                <p className="text-gray-500 font-mono text-sm">{product.sku}</p>
              </div>
            )}
            <div className="mt-auto pt-6 space-y-3">
              {product.available && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">Qty:</span>
                  <div className="flex items-center border border-gray-700 rounded-lg">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-gray-400 hover:text-white transition-colors"><Minus className="h-4 w-4" /></button>
                    <span className="px-4 py-2 text-white font-medium min-w-[3rem] text-center">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 text-gray-400 hover:text-white transition-colors"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
              <button
                disabled={!product.available}
                onClick={() => { if (product.available) { onAddToCart(product, qty); setAdded(true); setTimeout(() => setAdded(false), 2000); } }}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${product.available ? (added ? "bg-green-500 text-white" : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50 hover:shadow-green-800/50") : "bg-gray-800 text-gray-500 cursor-not-allowed"}`}
              >
                {!product.available ? "Out of Stock" : added ? "Added to Cart!" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementBar() {
  return (
    <div className="bg-green-700 text-white overflow-hidden">
      <div className="animate-marquee whitespace-nowrap py-2 text-sm font-medium">
        <span className="mx-8">Premium organic hemp products crafted for your well-being</span>
        <span className="mx-8">Free shipping on orders over $50</span>
        <span className="mx-8">Visit us in Spring Hill, FL - East &amp; West locations</span>
        <span className="mx-8">Premium organic hemp products crafted for your well-being</span>
        <span className="mx-8">Free shipping on orders over $50</span>
        <span className="mx-8">Visit us in Spring Hill, FL - East &amp; West locations</span>
      </div>
    </div>
  );
}

function Header({ cartCount, onSearch, onCartOpen }: { cartCount: number; onSearch: () => void; onCartOpen: () => void }) {
  const categories = ["EVERYDAY", "PREMIUM", "ESSENTIAL", "SMALLS", "SNOWCAPS", "CONCENTRATES", "EDIBLES", "VAPOR", "TOPICALS", "TINCTURES", "ACCESSORIES"];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="bg-black/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="h-14 sm:h-16 flex items-center justify-between">
          {/* Left: hamburger on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors" aria-label="Menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
            <button onClick={onSearch} className="p-2 text-gray-400 hover:text-white transition-colors"><Search className="h-5 w-5" /></button>
          </div>
          {/* Center: logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(""); }} className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="The Hemp Dispensary" className="h-10 sm:h-12 w-auto object-contain drop-shadow-lg" />
          </a>
          {/* Right: icons */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <a href="#/loyalty" className="p-1.5 sm:p-2 text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1" title="Hemp Rewards">
              <Gift className="h-5 w-5" />
              <span className="hidden md:inline text-xs font-medium">Rewards</span>
            </a>
            <a href="#/account" className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors" title="Account">
              <User className="h-5 w-5" />
            </a>
            <a href="#/games" className="hidden sm:flex p-2 text-gray-400 hover:text-purple-400 transition-colors items-center gap-1" title="Games">
              <Gamepad2 className="h-5 w-5" />
              <span className="hidden md:inline text-xs font-medium">Games</span>
            </a>
            <button onClick={onCartOpen} className="relative p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold animate-bounce">{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* Desktop category nav */}
        <nav className="hidden md:block overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex items-center justify-center gap-1 pb-2">
            {categories.map((cat) => (
              <a key={cat} href={`#/shop/${["EVERYDAY","PREMIUM","ESSENTIAL","SMALLS","SNOWCAPS"].includes(cat) ? `leaflife - ${cat.toLowerCase()}` : cat.toLowerCase()}`} className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-green-400 whitespace-nowrap transition-colors tracking-wider">{cat}</a>
            ))}
          </div>
        </nav>
      </div>
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black/98 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-3 py-3 grid grid-cols-2 gap-1">
            {categories.map((cat) => (
              <a key={cat} href={`#/shop/${["EVERYDAY","PREMIUM","ESSENTIAL","SMALLS","SNOWCAPS"].includes(cat) ? `leaflife - ${cat.toLowerCase()}` : cat.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-green-400 hover:bg-gray-900/50 rounded-lg transition-colors tracking-wider">{cat}</a>
            ))}
            <a href="#/games" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-purple-400 hover:bg-gray-900/50 rounded-lg transition-colors tracking-wider flex items-center gap-2 sm:hidden"><Gamepad2 className="h-4 w-4" /> GAMES</a>
          </div>
        </div>
      )}
    </header>
  );
}

function CartDrawer({ open, onClose, cart, onUpdateQty, onRemove, onClear }: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
}) {
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {open && <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[100] bg-gray-950 border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">Your Cart</h2>
              <span className="text-sm text-gray-400">({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="mx-auto h-16 w-16 text-gray-700 mb-4" />
                <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
                <p className="text-gray-600 text-sm mb-6">Browse our products and add items to your cart</p>
                <button onClick={() => { onClose(); navigate("/shop"); }} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-medium transition-colors">Shop Now</button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                    <img
                      src={item.product.image_url || placeholderUrl(item.product.name, 200)}
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(item.product.name, 200); }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium line-clamp-2 mb-1">{item.product.online_name || item.product.name}</h3>
                    <p className="text-green-400 font-bold text-sm mb-2">{formatPrice(item.product.price)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-700 rounded-lg">
                        <button onClick={() => onUpdateQty(item.product.id, item.quantity - 1)} className="p-1.5 text-gray-400 hover:text-white transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="px-3 py-1 text-white text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.product.id, item.quantity + 1)} className="p-1.5 text-gray-400 hover:text-white transition-colors"><Plus className="h-3 w-3" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{formatPrice(item.product.price * item.quantity)}</span>
                        <button onClick={() => onRemove(item.product.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button onClick={onClear} className="text-sm text-gray-500 hover:text-red-400 transition-colors">Clear Cart</button>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">Subtotal</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(total)}</p>
                </div>
              </div>
              {total < 5000 && (
                <p className="text-center text-xs text-green-400">Add {formatPrice(5000 - total)} more for free shipping!</p>
              )}
              {total >= 5000 && (
                <p className="text-center text-xs text-green-400 font-medium">You qualify for free shipping!</p>
              )}
              <button onClick={() => { onClose(); navigate("/checkout"); }} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-green-900/50">
                Checkout
              </button>
              <button onClick={() => { onClose(); navigate("/shop"); }} className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors">
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-green-950"></div>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(34,197,94,0.3) 0%, transparent 50%)" }}></div>
      <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-20 md:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tight">
          <span className="text-green-400 italic">Remedy</span> Your Way
        </h1>
        <p className="text-gray-300 text-base sm:text-lg md:text-xl mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed">
          At <em className="text-green-400 not-italic font-semibold">The Hemp Dispensary</em>, we offer organic, life-conscious cannabis products crafted to support your well-being.
        </p>
        <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto">From soothing CBD to balanced THC blends, our curated selection is rooted in quality, sustainability, and care.</p>
        <p className="text-white italic font-medium text-base sm:text-lg mb-8 sm:mb-10">Feel better, naturally.</p>
        <a href="#/shop" className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-base sm:text-lg transition-all duration-300 shadow-lg shadow-green-900/50 hover:shadow-green-800/50 hover:scale-105">Shop All</a>
      </div>
    </section>
  );
}

function Testimonials() {
  const allReviews = [
    // Spring Hill East & West
    { text: "Moe was the guy that helped me. Knows his products very well and has excellent customer service. Highly recommend!", author: "Frank Brozik", stars: 5, location: "Spring Hill" },
    { text: "Kayla was an amazing budtender. Explained everything so precisely and professionally. They offer QUALITY products!", author: "Dick Jones", stars: 5, location: "Spring Hill" },
    { text: "Staff was very nice, and very informative, I will definitely go back. Very clean inside and very organized.", author: "Terry Miller", stars: 5, location: "Spring Hill" },
    { text: "I'm a regular customer at both locations. Love it!", author: "Loyal Customer", stars: 5, location: "Spring Hill" },
    // Apopka (300 reviews, 4.9 stars)
    { text: "If I could give 10 stars I would. I needed advice and Daniel made me feel comfortable straight away. Would recommend!", author: "Kelly Ann Gleason", stars: 5, location: "Apopka" },
    { text: "Mari is very knowledgeable and I had such an amazing experience, I can't wait to come back!", author: "Ah Ha", stars: 5, location: "Apopka" },
    { text: "10/10, always so helpful whenever I come in and the products are amazing!", author: "David Ray", stars: 5, location: "Apopka" },
    { text: "Daniel was excellent help. Very knowledgeable staff!", author: "Maria Vargas", stars: 5, location: "Apopka" },
    // Crystal River (4.8 stars)
    { text: "Holy smokes the THCA flower quality here is amazing. I was in town from LA and the Gelato Mintz was a hit. Plus 50% off! Super friendly staff!", author: "Jeffrey Robinson", stars: 5, location: "Crystal River" },
    { text: "Great customer service, helped me with buying exactly what I wanted! Jisenia was a big help!", author: "Sonny John", stars: 5, location: "Crystal River" },
    { text: "Love this place! Lots of options, great service from our Budtender Christie! Mondays are Military discount days. AND THEY DELIVER!", author: "Tonja Bigelow", stars: 5, location: "Crystal River" },
    // Clearwater (97 reviews, 5.0 stars)
    { text: "Best hemp dispensary in Clearwater! Staff is incredibly knowledgeable and the product quality is top tier.", author: "Clearwater Regular", stars: 5, location: "Clearwater" },
    { text: "Amazing selection and the prices are fair. The budtenders really take time to explain everything.", author: "CBD Enthusiast", stars: 5, location: "Clearwater" },
    // Pinellas Park
    { text: "Great products. Great service. G'Vontre was very knowledgeable and outstanding with anything we had questions on!", author: "Labrava Escobar", stars: 5, location: "Pinellas Park" },
    // Hudson
    { text: "Wonderful experience! The staff took the time to understand what I needed and recommended the perfect products.", author: "Hudson Shopper", stars: 5, location: "Hudson" },
    // Tampa (4.8 stars)
    { text: "Excellent dispensary! Clean store, friendly staff, and an incredible selection of hemp products. Will be back!", author: "Tampa Visitor", stars: 5, location: "Tampa" },
    { text: "The quality of flower here is unmatched. Staff knows their cannabinoids inside and out.", author: "Tampa Regular", stars: 5, location: "Tampa" },
    // Lady Lake
    { text: "So glad we found this place! Perfect for seniors looking for natural pain relief. Staff is patient and helpful.", author: "Lady Lake Customer", stars: 5, location: "Lady Lake" },
    // Clermont
    { text: "First time visiting and I was blown away by the selection. Prices are competitive and staff is A+!", author: "Clermont Shopper", stars: 5, location: "Clermont" },
    // Port Richey
    { text: "Great place, good prices, employees have great knowledge. My go-to spot!", author: "Port Richey Regular", stars: 5, location: "Port Richey" },
    // Tarpon Springs
    { text: "The best hemp shop in Tarpon Springs! Friendly staff and top quality products. Highly recommend!", author: "Tarpon Springs Fan", stars: 5, location: "Tarpon Springs" },
    // Homosassa
    { text: "Love the variety of products they carry. The edibles are amazing and the flower is always fresh!", author: "Homosassa Customer", stars: 5, location: "Homosassa" },
    // New Port Richey
    { text: "Staff is super friendly and knowledgeable. They helped me find the perfect product for my needs!", author: "NPR Visitor", stars: 5, location: "New Port Richey" },
  ];
  const reviews = allReviews.filter(r => r.stars >= 4);
  return (
    <section className="py-12 bg-black/50 border-y border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span className="text-white font-bold text-base sm:text-lg">Google Reviews</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-bold">4.9</span>
            <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />)}</div>
            <span className="text-gray-400 text-xs sm:text-sm">6,764+ Reviews</span>
          </div>
        </div>
      </div>
      <div className="w-full overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
        <div className="animate-marquee-slow flex items-center gap-8" style={{ width: 'max-content' }}>
          {[...reviews, ...reviews, ...reviews].map((r, i) => (
            <div key={i} className="flex-none flex items-center gap-3 text-gray-300 bg-gray-900/50 rounded-xl px-5 py-3 border border-gray-800 max-w-lg">
              <div className="flex gap-0.5 flex-none">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= r.stars ? "fill-yellow-400 text-yellow-400" : "fill-gray-600 text-gray-600"}`} />)}</div>
              <span className="text-sm italic">&quot;{r.text}&quot;</span>
              <span className="text-green-400 font-semibold text-sm whitespace-nowrap">-- {r.author}</span>
              <span className="text-gray-500 text-xs whitespace-nowrap">{r.location}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Get To Know Us!</h2>
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
          <img src="/bud-puppet.png" alt="Bud Puppet" className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg" style={{ filter: "drop-shadow(0 0 8px rgba(34,197,94,0.4))" }} />
          <p className="text-green-400 font-semibold text-lg">THE HEMP TEAM</p>
          <img src="/bud-puppet.png" alt="Bud Puppet" className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg" style={{ filter: "drop-shadow(0 0 8px rgba(34,197,94,0.4))", transform: "scaleX(-1)" }} />
        </div>
        <p className="text-gray-300 text-lg leading-relaxed mb-6">We&apos;re a small team with a big passion for natural wellness. At our core, we believe in quality, transparency, and creating a space where people can discover real, plant-based relief. Every product we carry is carefully selected, organically sourced, and handled with care because we wouldn&apos;t offer anything we wouldn&apos;t use ourselves.</p>
        <p className="text-gray-400 text-lg leading-relaxed italic">Whether you&apos;re new to hemp or a seasoned believer, we&apos;re here to help you find what works best for your lifestyle.</p>
      </div>
    </section>
  );
}

function MusicSection() {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracks = [
    { title: "Remedy Your Way", file: "/music/RemedyYourWay.mp3" },
    { title: "Spring Hill Groove", file: "/music/SpringHillGroove.mp3" },
    { title: "Cannabichromene CBC", file: "/music/CannabichromeneCBC.mp3" },
    { title: "Cannabidiol CBD", file: "/music/CannabidiolCBD.mp3" },
    { title: "Cannabigerol CBG", file: "/music/CannabigerolCBG.mp3" },
    { title: "Cannabinol CBN", file: "/music/CannabinolCBN.mp3" },
    { title: "Cannabitriol CBT", file: "/music/CannabitriolCBT.mp3" },
    { title: "Cold Brew Coffee", file: "/music/ColdBrewCoffee.mp3" },
    { title: "Concentrates Countdown", file: "/music/ConcentratesCountdown.mp3" },
    { title: "Customer Reviews", file: "/music/CustomerReviews.mp3" },
    { title: "Customer Reviews II", file: "/music/CustomerReviewsII.mp3" },
    { title: "Delta 8 THC", file: "/music/Delta8THC.mp3" },
    { title: "Edible Delights", file: "/music/EdibleDelights.mp3" },
    { title: "Free Dab 420 & 710", file: "/music/FreeDab420and710.mp3" },
    { title: "Healing Hemp Harmony", file: "/music/HealingHempHarmony.mp3" },
    { title: "High Times Delta 9", file: "/music/HighTimesDelta9.mp3" },
    { title: "Lemonade", file: "/music/Lemonade.mp3" },
    { title: "Natural Haven", file: "/music/NaturalHaven.mp3" },
    { title: "Natural Relief", file: "/music/NaturalRelief.mp3" },
    { title: "Organic Bliss", file: "/music/OrganicBliss.mp3" },
    { title: "Pet Wellness with Hemp", file: "/music/PetWellnessWithHemp.mp3" },
    { title: "Reliable Hemp Delivery", file: "/music/ReliableHempDelivery.mp3" },
  ];
  const togglePlay = (idx: number) => {
    if (playingIdx === idx) {
      audioRef.current?.pause();
      setPlayingIdx(null);
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(tracks[idx].file);
    audio.onended = () => setPlayingIdx(null);
    audioRef.current = audio;
    audio.play();
    setPlayingIdx(idx);
  };
  return (
    <section className="py-20 bg-gradient-to-b from-gray-950 to-black border-t border-gray-800">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Our Music</h2>
        <div className="flex flex-col gap-8 items-center">
          <div className="w-full bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-green-400 text-xl font-semibold mb-4">Original Tracks</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {tracks.map((track, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-black/40 rounded-xl px-4 py-3 hover:bg-black/60 transition-colors">
                  <button onClick={() => togglePlay(idx)} className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center flex-shrink-0 transition-colors">
                    {playingIdx === idx ? (
                      <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{track.title}</p>
                    <p className="text-gray-500 text-sm">The Hemp Dispensary</p>
                  </div>
                  <div className="text-gray-600 text-xs">MP3</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LocationSection() {
  return (
    <section className="py-20 bg-black border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Location</h2>
        <div className="text-center mb-12">
          <p className="text-white text-xl font-semibold mb-2">Can&apos;t Wait for Delivery? Come Visit Us!</p>
          <p className="text-gray-400 max-w-2xl mx-auto">We get it -- sometimes you need your remedy <em className="text-green-400">right now.</em> That&apos;s why we&apos;ve got physical stores ready for you to walk in, browse, and shop your favorite organic hemp products in person.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-8 mb-10">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-5 sm:p-8 border border-gray-800">
            <h3 className="text-green-400 font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 flex-shrink-0" /> The Hemp Dispensary</h3>
            <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">14312 Spring Hill Dr, Spring Hill, FL 34609</p>
            <div className="flex items-start gap-2 text-gray-400 mb-4"><Clock className="h-4 w-4 mt-1 flex-shrink-0" /><p className="text-sm">MON - SUN: 6:00 AM -- 10:00 PM</p></div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=14312+Spring+Hill+Dr+Spring+Hill+FL+34609" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"><MapPin className="h-4 w-4" /> Get Directions</a>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-5 sm:p-8 border border-gray-800">
            <h3 className="text-green-400 font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 flex-shrink-0" /> The Hemp Dispensary</h3>
            <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">6175 Deltona Blvd Ste 104, Spring Hill, FL 34606</p>
            <div className="flex items-start gap-2 text-gray-400 mb-4"><Clock className="h-4 w-4 mt-1 flex-shrink-0" /><div className="text-sm"><p>MON - FRI: 6:00 AM -- 12 AM</p><p>SAT - SUN: 10:00 AM -- 8 PM</p></div></div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=6175+Deltona+Blvd+Ste+104+Spring+Hill+FL+34606" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"><MapPin className="h-4 w-4" /> Get Directions</a>
          </div>
        </div>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-gray-300"><Phone className="h-4 w-4 text-green-400" /><a href="tel:3528426185" className="hover:text-green-400 transition-colors">352-842-6185</a></div>
          <div className="flex items-center justify-center gap-2 text-gray-300"><Mail className="h-4 w-4 text-green-400" /><a href="mailto:Support@TheHempDispensary.com" className="hover:text-green-400 transition-colors">Support@TheHempDispensary.com</a></div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-black border-t border-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4"><img src="/logo.png" alt="The Hemp Dispensary" className="h-10 w-auto object-contain drop-shadow-lg" /></div>
            <p className="text-sm leading-relaxed">Premium hemp products for your wellness journey. All products are lab-tested and compliant.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#/shop" className="hover:text-green-400 transition-colors">All Products</a></li>
              <li><a href="#/shop/leaflife - everyday" className="hover:text-green-400 transition-colors">Everyday</a></li>
              <li><a href="#/shop/leaflife - premium" className="hover:text-green-400 transition-colors">Premium</a></li>
              <li><a href="#/shop/leaflife - essential" className="hover:text-green-400 transition-colors">Essential</a></li>
              <li><a href="#/shop/leaflife - smalls" className="hover:text-green-400 transition-colors">Smalls</a></li>
              <li><a href="#/shop/concentrates" className="hover:text-green-400 transition-colors">Concentrates</a></li>
              <li><a href="#/shop/edibles" className="hover:text-green-400 transition-colors">Edibles</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#/about" className="hover:text-green-400 transition-colors">Meet Your Hemp Heroes!</a></li>
              <li><a href="#/contact" className="hover:text-green-400 transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#/terms" className="hover:text-green-400 transition-colors">Terms of Service</a></li>
              <li><a href="#/privacy" className="hover:text-green-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#/shipping" className="hover:text-green-400 transition-colors">Shipping Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-xs"><p>&copy; 2025 TheHempDispensary. All rights reserved.</p></div>
      </div>
    </footer>
  );
}

function SearchOverlay({ open, onClose, products }: { open: boolean; onClose: () => void; products: Product[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (p.stock <= 0) return false;
      const name = p.name.toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const online = (p.online_name || "").toLowerCase();
      return words.every(w => name.includes(w) || desc.includes(w) || online.includes(w));
    }).slice(0, 20);
  }, [query, products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div className="max-w-2xl mx-auto pt-20 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input ref={inputRef} type="text" placeholder="Search products..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-12 pr-12 py-4 rounded-2xl text-white bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg" />
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
        </div>
        {results.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden max-h-96 overflow-y-auto">
            {results.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-0" onClick={() => { navigate(`/product/${p.id}`); onClose(); setQuery(""); }}>
                <img src={p.image_url || placeholderUrl(p.name, 100)} alt={p.name} className="w-12 h-12 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl(p.name, 100); }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{p.name}</p>
                  <p className="text-green-400 font-bold text-sm">{formatPrice(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && <p className="text-gray-500 text-center text-lg">No products found</p>}
      </div>
    </div>
  );
}

function ShopPage({ products, categories, selectedCategory }: { products: Product[]; categories: string[]; selectedCategory: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let items = products.filter((p) => p.stock > 0);
    if (selectedCategory && selectedCategory !== "all") {
      items = items.filter((p) => p.categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase()));
    }
    if (search) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      items = items.filter((p) => {
        const name = p.name.toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const online = (p.online_name || "").toLowerCase();
        return words.every(w => name.includes(w) || desc.includes(w) || online.includes(w));
      });
    }
    return items;
  }, [products, selectedCategory, search]);

  const title = selectedCategory && selectedCategory !== "all" ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : "All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input type="text" placeholder="Filter products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        <a href="#/shop" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory || selectedCategory === "all" ? "bg-green-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white border border-gray-700"}`}>All</a>
        {categories.map((cat) => (
          <a key={cat} href={`#/shop/${cat.toLowerCase()}`} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.toLowerCase() ? "bg-green-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white border border-gray-700"}`}>{cat}</a>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-32"><Package className="mx-auto h-16 w-16 text-gray-600 mb-4" /><p className="text-gray-400 text-lg">No products found</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((product) => <ProductGridCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}

function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Meet Your Hemp Heroes!</h1>
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 md:p-12 border border-gray-800">
        <p className="text-green-400 font-semibold text-lg mb-6 text-center">THE HEMP TEAM</p>
        <p className="text-gray-300 text-lg leading-relaxed mb-6">We&apos;re a small team with a big passion for natural wellness. At our core, we believe in quality, transparency, and creating a space where people can discover real, plant-based relief. Every product we carry is carefully selected, organically sourced, and handled with care because we wouldn&apos;t offer anything we wouldn&apos;t use ourselves.</p>
        <p className="text-gray-400 text-lg leading-relaxed italic mb-8">Whether you&apos;re new to hemp or a seasoned believer, we&apos;re here to help you find what works best for your lifestyle.</p>
        <div className="border-t border-gray-800 pt-8 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed">At The Hemp Dispensary, our mission is simple: to bring the healing power of hemp to everyone. We source our products from trusted, organic farms and ensure every item on our shelves meets the highest standards of quality and compliance. We&apos;re not just selling products -- we&apos;re building a community of wellness-minded individuals who believe in natural alternatives.</p>
        </div>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
        <p>Welcome to The Hemp Dispensary. By accessing or using our website, you agree to be bound by these terms.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Age Requirement</h2>
        <p>You must be at least 21 years of age to purchase products from The Hemp Dispensary. By placing an order, you confirm that you meet this age requirement.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Product Information</h2>
        <p>We make every effort to ensure product descriptions and pricing are accurate. Products are subject to availability and we reserve the right to limit quantities.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Compliance</h2>
        <p>All products sold by The Hemp Dispensary comply with the 2018 Farm Bill and contain less than 0.3% Delta-9 THC by dry weight. It is the buyer&apos;s responsibility to ensure compliance with local laws.</p>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
        <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Information We Collect</h2>
        <p>We collect information you provide directly, including name, email, shipping address, and payment information when you make a purchase.</p>
        <h2 className="text-white text-xl font-semibold mt-6">How We Use Information</h2>
        <p>We use your information to process orders, communicate about your purchases, and improve our services. We do not sell your personal information to third parties.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Contact</h2>
        <p>For privacy-related inquiries, contact us at Support@thehempdispensary.com</p>
      </div>
    </div>
  );
}

function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-white mb-8">Shipping Policy</h1>
      <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
        <p>We ship to all 50 US states where hemp products are legal.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Processing Time</h2>
        <p>Orders are typically processed within 1-2 business days. You&apos;ll receive a tracking number once your order ships.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Shipping Rates</h2>
        <p>Free shipping on orders over $50. Standard shipping rates apply for orders under $50.</p>
        <h2 className="text-white text-xl font-semibold mt-6">Local Pickup</h2>
        <p>Free in-store pickup available at both The Hemp Dispensary locations.</p>
      </div>
    </div>
  );
}

function CheckoutPage({ cart, onUpdateQty: _onUpdateQty, onRemove: _onRemove, onClear }: { cart: CartItem[]; onUpdateQty: (productId: string, qty: number) => void; onRemove: (productId: string) => void; onClear: () => void }) {
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
        let fieldsReady = { number: false, date: false, cvv: false, zip: false };
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
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/lookup?phone=${encodeURIComponent(phone)}`);
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
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/signup?${params.toString()}`);
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
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/lookup?${query}`);
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
      const resp = await fetch(`${LOYALTY_API_URL}/api/loyalty/signup?${params.toString()}`);
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

/* ======================== SCRATCH-OFF CARD GAME ======================== */
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

function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Get in Touch</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-green-400" /><a href="tel:3528426185" className="text-gray-300 hover:text-green-400">352-842-6185</a></div>
            <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-green-400" /><a href="mailto:Support@TheHempDispensary.com" className="text-gray-300 hover:text-green-400">Support@TheHempDispensary.com</a></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Visit Us</h2>
          <div className="space-y-4">
            <div><p className="text-green-400 font-semibold mb-1">The Hemp Dispensary</p><p className="text-gray-400 text-sm">14312 Spring Hill Dr, Spring Hill, FL 34609</p></div>
            <div><p className="text-green-400 font-semibold mb-1">The Hemp Dispensary</p><p className="text-gray-400 text-sm">6175 Deltona Blvd Ste 104, Spring Hill, FL 34606</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    fetch(`${API_URL}/api/ecommerce/products?limit=1000`)
      .then((r) => r.json())
      .then((data: ProductsResponse) => { setProducts(data.products); setCategories(data.categories); setLoading(false); })
      .catch((err) => { console.error("Failed to load products:", err); setLoading(false); });
  }, []);

  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    products.forEach((p) => { p.categories.forEach((cat) => { if (!map[cat]) map[cat] = []; map[cat].push(p); }); });
    return map;
  }, [products]);

  const homeCategories = useMemo(() => {
    const preferred = ["LEAFLIFE - EVERYDAY", "LEAFLIFE - PREMIUM", "LEAFLIFE - ESSENTIAL", "LEAFLIFE - SMALLS", "LEAFLIFE - SNOWCAPS", "Concentrates", "Edibles", "Flower", "Topicals", "Tinctures", "Vapor", "Accessories", "Pets"];
    return preferred.filter((c) => productsByCategory[c]?.length > 0);
  }, [productsByCategory]);

  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-black">
      <AnnouncementBar />
      <Header cartCount={cartCount} onSearch={() => setSearchOpen(true)} onCartOpen={() => setCartOpen(true)} />
      {content}
      <SiteFooter />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} />
    </div>
  );

  if (route.startsWith("#/product/")) return shell(<ProductDetail productId={route.replace("#/product/", "")} onAddToCart={addToCart} />);
  if (route.startsWith("#/shop")) {
    const catSlug = route.replace("#/shop/", "").replace("#/shop", "");
    return shell(loading
      ? <div className="flex flex-col items-center justify-center py-24"><img src="/logo.png" alt="The Hemp Dispensary" className="h-20 w-auto animate-pulse mb-4" /><p className="text-gray-400 text-lg italic">Remedy Your Way</p></div>
      : <ShopPage products={products} categories={categories} selectedCategory={catSlug || "all"} />);
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

  return (
    <div className="min-h-screen bg-black">
      <AnnouncementBar />
      <Header cartCount={cartCount} onSearch={() => setSearchOpen(true)} onCartOpen={() => setCartOpen(true)} />
      <HeroSection />
      <Testimonials />
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24"><img src="/logo.png" alt="The Hemp Dispensary" className="h-20 w-auto animate-pulse mb-4" /><p className="text-gray-400 text-lg italic">Remedy Your Way</p></div>
      ) : homeCategories.map((cat) => {
        const inStock = (productsByCategory[cat] || []).filter(p => p.stock > 0);
        const catProducts = inStock.filter(p => p.image_url && !p.image_url.includes('placehold.co'));
        const displayProducts = catProducts.length >= 4 ? catProducts.slice(0, 4) : inStock.slice(0, 4);
        if (displayProducts.length === 0) return null;
        return (
          <section key={cat} className="py-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white">{cat}</h2>
                <button onClick={() => navigate(`/shop/${cat.toLowerCase()}`)} className="border border-green-600 text-green-400 hover:bg-green-600 hover:text-white px-6 py-2 rounded-full font-medium transition-all duration-300 text-sm">View All</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayProducts.map((product) => (
                  <ProductGridCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
      <AboutSection />
      <MusicSection />
      <LocationSection />
      <SiteFooter />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onClear={clearCart} />
    </div>
  );
}

export default App;
