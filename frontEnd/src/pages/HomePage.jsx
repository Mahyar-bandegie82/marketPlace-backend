import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Badge } from '../components/ui/Shared.jsx';
import api from '../lib/api.js';
import { addGuestCartItem, addGuestFavourite } from '../lib/guestStorage.js';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Heart,
  Store,
  ShieldCheck,
  Package,
  ArrowRight,
  Sparkles,
  Truck,
  AlertCircle,
  Search,
  Star,
  Tag,
  Award,
  CheckCircle2,
  Layers,
} from 'lucide-react';

function ValuePropCard({ icon: Icon, title, description, color }) {
  const colors = {
    indigo: 'from-indigo-600 to-purple-600 shadow-indigo-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/20',
  };
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
      >
        <Icon className="text-white" size={22} />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [cartLoadingId, setCartLoadingId] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/products', { params: { sort: 'rating' } }).catch(() => ({ data: { products: [] } })),
      api.get('/products/categories').catch(() => ({ data: { categories: [] } })),
    ])
      .then(([prodRes, catRes]) => {
        if (!active) return;
        setFeaturedProducts((prodRes.data?.products || []).slice(0, 4));
        setCategories((catRes.data?.categories || []).slice(0, 8));
      })
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const q = heroSearch.trim();
    if (q) {
      navigate(`/listings?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/listings');
    }
  };

  const handleAddToCart = async (product, listing) => {
    if (!listing) return;
    if (!user) {
      addGuestCartItem({
        listingId: listing.id,
        productName: product.productName,
        price: listing.discountedPrice || listing.price,
        condition: listing.condition,
        images: product.images,
      });
      toast.success(`Added ${product.productName} to cart!`);
      return;
    }

    setCartLoadingId(listing.id);
    try {
      await api.post('/users/addCartItem', { listingId: listing.id });
      toast.success('Added to your shopping cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add item to cart');
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!user) {
      addGuestFavourite(product);
      toast.success('Saved to your wishlist!');
      return;
    }
    try {
      await api.post(`/users/addFavoritedItems/${product.id}`);
      toast.success('Saved to wishlist!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save to wishlist');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200/80 dark:border-gray-800/80 bg-gradient-to-b from-indigo-50/70 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
        {/* Ambient Glow Accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Core Pitch & Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tracking-wide">
                <Sparkles size={14} /> Curated Tech & Hardware Marketplace
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.12]">
                Premium Hardware from{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  Verified Sellers.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                Shop high-performance components, peripherals, and electronics directly from vetted merchants. Compare live store offers, warranty coverage, and condition grades in one place.
              </p>

              {/* Hero Search Bar */}
              <form
                onSubmit={handleHeroSearch}
                className="flex flex-col sm:flex-row gap-2.5 max-w-xl pt-2"
              >
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search graphics cards, processors, brands..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <Button type="submit" size="lg" className="py-3.5 px-6 whitespace-nowrap">
                  Explore Deals <ArrowRight size={16} />
                </Button>
              </form>

              {/* Quick Category Pills */}
              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    Popular:
                  </span>
                  {categories.slice(0, 5).map((cat) => (
                    <Link
                      key={cat.id || cat.categoryName}
                      to={`/listings?category=${encodeURIComponent(cat.categoryName)}`}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-400 transition-colors capitalize"
                    >
                      {cat.categoryName}
                    </Link>
                  ))}
                </div>
              )}

              {/* Trust Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/80 dark:border-gray-800/80 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Vetted Stores</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Identity verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <Award size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Warranty Backed</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Official coverage</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Fast Delivery</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Insured shipping</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Marketplace Showcase */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                        <Layers size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Multi-Merchant Comparison
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Real-time stock & promotional pricing
                        </p>
                      </div>
                    </div>
                    <Badge color="green">Live Catalog</Badge>
                  </div>

                  {/* Showcase Items */}
                  <div className="space-y-3">
                    {(featuredProducts.length > 0
                      ? featuredProducts.slice(0, 3)
                      : [
                          {
                            id: 'demo-1',
                            productName: 'Flagship Graphics Accelerator',
                            brand: 'ASUS ROG',
                            model: 'RTX Series',
                            rating: 4.9,
                            listings: [{ price: 1599, condition: 'NEW' }],
                          },
                          {
                            id: 'demo-2',
                            productName: 'Pro Workstation Processor',
                            brand: 'AMD Ryzen',
                            model: '9000 Series',
                            rating: 4.8,
                            listings: [{ price: 649, condition: 'NEW' }],
                          },
                          {
                            id: 'demo-3',
                            productName: 'Ultra-Low Latency NVMe SSD',
                            brand: 'Samsung',
                            model: '990 PRO',
                            rating: 4.9,
                            listings: [{ price: 189, condition: 'NEW' }],
                          },
                        ]
                    ).map((item, idx) => {
                      const offer = item.listings?.[0];
                      const price = offer?.discountedPrice || offer?.price;
                      return (
                        <Link
                          key={item.id || idx}
                          to="/listings"
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-indigo-50/60 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                              <Package size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {item.productName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {item.brand} · {item.model}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            {price ? (
                              <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                                ${Number(price).toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-xs font-medium text-gray-400">View Offers</p>
                            )}
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              {offer?.condition ? offer.condition.replace('_', ' ') : 'Verified'}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Bottom CTA Row */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <Link to="/listings" className="flex-1">
                      <Button variant="secondary" className="w-full" size="sm">
                        View All Products <ArrowRight size={14} />
                      </Button>
                    </Link>
                    <Link to="/seller">
                      <Button variant="outline" size="sm">
                        <Store size={14} /> Open a Store
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Account Status Banner if logged in and unverified */}
      {user && !user.otpVerified && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                Your email address has not been verified yet. Verify your account with a one-time code to unlock full account security.
              </p>
            </div>
            <Link to="/profile">
              <Button size="sm" variant="secondary">
                Verify Email
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {!loadingCatalog && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                <Tag size={13} /> Featured Inventory
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Top-Rated Marketplace Picks
              </h2>
            </div>
            <Link
              to="/listings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Browse full catalog <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => {
              const bestListing = p.listings?.[0];
              const minPrice = bestListing?.discountedPrice || bestListing?.price;
              const hasDiscount =
                bestListing?.discountedPrice > 0 && bestListing.discountedPrice < bestListing.price;

              return (
                <Card
                  key={p.id}
                  className="flex flex-col overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
                    {p.images && Array.isArray(p.images) && p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <Package size={40} />
                        <span className="text-xs uppercase tracking-wider font-semibold">
                          {p.brand} {p.model}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAddToWishlist(p)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/85 dark:bg-gray-900/85 backdrop-blur-md shadow-sm text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors cursor-pointer"
                      aria-label="Save to Wishlist"
                    >
                      <Heart size={15} />
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span className="font-semibold uppercase tracking-wider">{p.brand}</span>
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star size={12} className="fill-amber-400" />
                          {(p.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white capitalize line-clamp-1">
                        {p.productName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                      {bestListing ? (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-lg font-extrabold text-gray-900 dark:text-white">
                              ${(minPrice || 0).toLocaleString()}
                            </div>
                            {hasDiscount && (
                              <div className="text-xs text-gray-400 line-through">
                                ${bestListing.price.toLocaleString()}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(p, bestListing)}
                            loading={cartLoadingId === bestListing.id}
                          >
                            <ShoppingCart size={14} /> Add
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Out of stock</span>
                          <Link to="/listings" className="text-indigo-500 hover:underline">
                            Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Why Shop With Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-gray-200/70 dark:border-gray-800/70">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Built for Confident Buying & Selling
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
            Every transaction is backed by verified merchant standards, transparent condition grading, and real-time order management.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ValuePropCard
            icon={ShieldCheck}
            title="Verified Merchants"
            description="Every seller store is reviewed and verified before listing inventory on the marketplace."
            color="indigo"
          />
          <ValuePropCard
            icon={Store}
            title="Competitive Store Offers"
            description="Compare multiple seller listings, condition grades, warranty terms, and live promotions."
            color="emerald"
          />
          <ValuePropCard
            icon={Truck}
            title="Flexible Order Control"
            description="Track active shipments, update delivery addresses while processing, or cancel with one click."
            color="amber"
          />
          <ValuePropCard
            icon={CheckCircle2}
            title="Community Reviews"
            description="Read authentic ratings and feedback from verified customers across the entire catalog."
            color="rose"
          />
        </div>
      </section>
    </div>
  );
}
