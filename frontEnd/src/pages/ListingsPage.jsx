import { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { addGuestCartItem, addGuestFavourite } from '../lib/guestStorage.js';
import { Button, Card, LoadingSpinner, EmptyState, Badge } from '../components/ui/Shared.jsx';
import {
  Search,
  ShoppingCart,
  Heart,
  Star,
  ShieldCheck,
  Tag,
  Filter,
  Package,
  ArrowUpDown,
  Layers,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';

export default function ListingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls initialized from URL query params
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || '');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('products'); // 'products' | 'listings'

  // Action Loading
  const [cartLoadingId, setCartLoadingId] = useState(null);
  const [favLoadingId, setFavLoadingId] = useState(null);

  // Sync URL search param changes (e.g. from Navbar search)
  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qCat = searchParams.get('category') || '';
    setSearch(qSearch);
    setSelectedCategory(qCat);
  }, [searchParams]);

  const fetchCatalog = async (overrideSearch) => {
    setLoading(true);
    try {
      const params = {};
      const activeSearch = overrideSearch !== undefined ? overrideSearch : search;
      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedCondition) params.condition = selectedCondition;
      if (sortBy) params.sort = sortBy;

      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params }).catch(() => ({ data: { products: [] } })),
        api.get('/products/categories').catch(() => ({ data: { categories: [] } })),
      ]);

      setProducts(prodRes.data?.products || []);
      setCategories(catRes.data?.categories || []);
    } catch {
      toast.error('Failed to load marketplace products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, selectedCondition, sortBy, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextParams = {};
    if (search.trim()) nextParams.search = search.trim();
    if (selectedCategory) nextParams.category = selectedCategory;
    setSearchParams(nextParams);
    fetchCatalog(search);
  };

  const handleAddToCart = async (listing, product) => {
    const listingId = listing?.id || listing;
    if (!user) {
      addGuestCartItem({
        listingId,
        productName: product?.productName || `Listing #${listingId}`,
        price: listing?.discountedPrice || listing?.price || 0,
        condition: listing?.condition || 'NEW',
        images: product?.images || [],
      });
      toast.success('Added to your shopping cart!');
      return;
    }

    setCartLoadingId(listingId);
    try {
      await api.post('/users/addCartItem', { listingId });
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success('Added to your shopping cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add to cart');
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!user) {
      addGuestFavourite(product);
      toast.success('Saved to wishlist!');
      return;
    }

    setFavLoadingId(product.id);
    try {
      await api.post(`/users/addFavoritedItems/${product.id}`);
      toast.success('Saved to wishlist!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add to wishlist');
    } finally {
      setFavLoadingId(null);
    }
  };

  // Flatten all seller inventory listings for "listings" view
  const allListings = products.flatMap((p) =>
    (p.listings || []).map((l) => ({ ...l, product: p }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Tag size={12} /> Live Marketplace Inventory
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Explore Products & Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse verified hardware, computer parts, and active seller listings.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl w-fit shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('products')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              viewMode === 'products'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs'
            }`}
          >
            <Package size={14} /> By Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('listings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              viewMode === 'listings'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs'
            }`}
          >
            <Layers size={14} /> By Seller Listings ({allListings.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by product name, brand (e.g. ASUS, Intel), model (e.g. RTX 4090)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <Button type="submit">Search</Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch('');
                setSearchParams(selectedCategory ? { category: selectedCategory } : {});
                fetchCatalog('');
              }}
            >
              Reset
            </Button>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
          {/* Category Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-1">
              <Filter size={12} /> Category:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('');
                setSearchParams(search ? { search } : {});
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedCategory === ''
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-400 shadow-xs'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                type="button"
                key={c.id || c.categoryName}
                onClick={() => {
                  const next = selectedCategory === c.categoryName ? '' : c.categoryName;
                  setSelectedCategory(next);
                  const params = {};
                  if (search) params.search = search;
                  if (next) params.category = next;
                  setSearchParams(params);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize border ${
                  selectedCategory === c.categoryName
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-400 shadow-xs'
                }`}
              >
                {c.categoryName}
              </button>
            ))}
          </div>

          {/* Condition and Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Condition:</span>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="BARELY_USED">Barely Used</option>
                <option value="USED">Used</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <ArrowUpDown size={12} /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid View */}
      {loading ? (
        <LoadingSpinner text="Loading marketplace catalog..." />
      ) : viewMode === 'products' ? (
        products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Try adjusting your search keywords or filter criteria."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => {
              const bestListing = p.listings?.[0];
              const minPrice = bestListing?.discountedPrice || bestListing?.price;
              const hasDiscount =
                bestListing?.discountedPrice > 0 && bestListing.discountedPrice < bestListing.price;

              return (
                <Card
                  key={p.id}
                  className="flex flex-col overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-800"
                >
                  {/* Image / Header Preview */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
                    {p.images && Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === 'string' ? (
                      <img
                        src={p.images[0]}
                        alt={p.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <Package size={44} />
                        <span className="text-xs uppercase tracking-wider font-semibold">
                          {p.brand} {p.model}
                        </span>
                      </div>
                    )}

                    {/* Condition badge */}
                    {bestListing && (
                      <span className="absolute top-3 left-3">
                        <Badge
                          color={
                            bestListing.condition === 'NEW'
                              ? 'green'
                              : bestListing.condition === 'BARELY_USED'
                              ? 'blue'
                              : 'yellow'
                          }
                        >
                          {bestListing.condition.replace('_', ' ')}
                        </Badge>
                      </span>
                    )}

                    {/* Wishlist quick button */}
                    <button
                      onClick={() => handleAddToWishlist(p)}
                      disabled={favLoadingId === p.id}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md text-gray-600 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors cursor-pointer"
                      aria-label="Save to Wishlist"
                    >
                      <Heart size={16} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span className="font-semibold uppercase tracking-wider">{p.brand}</span>
                        <span>Model: {p.model}</span>
                      </div>
                      <Link to={`/products/${p.id}`}>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {p.productName}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {p.description}
                      </p>

                      {/* Rating & Categories */}
                      <div className="flex items-center flex-wrap gap-2 mt-2.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <Star size={13} className="fill-amber-400" />
                          <span>
                            {p.rating > 0 ? `${Number(p.rating).toFixed(1)}/100` : 'Unrated'}
                          </span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MessageSquare size={11} /> {p.comments?.length || 0}
                        </span>
                        {p.categories?.length > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <div className="flex flex-wrap gap-1">
                              {p.categories?.slice(0, 2).map((cat, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                >
                                  {cat.categoryName}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Action */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                      {bestListing ? (
                        <div className="space-y-3">
                          <div className="flex items-baseline justify-between">
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
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 text-right">
                              {p.listings.length} seller offer{p.listings.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleAddToCart(bestListing, p)}
                              loading={cartLoadingId === bestListing.id}
                            >
                              <ShoppingCart size={14} /> Add to Cart
                            </Button>
                            <Link to={`/products/${p.id}`} className="w-full">
                              <Button size="sm" variant="secondary" className="w-full">
                                <MessageSquare size={14} /> Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-400 py-1">
                          <span>Currently Out of Stock</span>
                          <Link to={`/products/${p.id}`}>
                            <Button size="sm" variant="secondary">
                              <MessageSquare size={14} /> Details & Reviews
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : /* Seller Listings View */
      allListings.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No seller inventory listings"
          description="No active listings match your current criteria."
        />
      ) : (
        <div className="space-y-4">
          {allListings.map((listing) => (
            <Card
              key={listing.id}
              className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-indigo-500/50 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {listing.product.images?.[0] ? (
                    <img
                      src={listing.product.images[0]}
                      alt={listing.product.productName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package size={24} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/products/${listing.product.id}`}>
                      <h3 className="font-bold text-gray-900 dark:text-white capitalize hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {listing.product.productName}
                      </h3>
                    </Link>
                    <Badge
                      color={
                        listing.condition === 'NEW'
                          ? 'green'
                          : listing.condition === 'BARELY_USED'
                          ? 'blue'
                          : 'yellow'
                      }
                    >
                      {listing.condition.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-400">Listing #{listing.id}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center flex-wrap gap-1.5">
                    <span>
                      Store:{' '}
                      <strong className="text-gray-700 dark:text-gray-200">
                        {listing.seller?.storeName || 'Verified Store'}
                      </strong>
                    </span>
                    {listing.seller?.trusted ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShieldCheck size={12} /> Trusted Seller
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        (Standard Seller)
                      </span>
                    )}
                    <span>·</span>
                    <span>
                      Available Quantity: <strong>{listing.quantity}</strong>
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${(listing.discountedPrice || listing.price).toLocaleString()}
                  </div>
                  {listing.discountedPrice > 0 && listing.discountedPrice < listing.price && (
                    <div className="text-xs text-gray-400 line-through">
                      ${listing.price.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(listing, listing.product)}
                    loading={cartLoadingId === listing.id}
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </Button>
                  <Link to={`/products/${listing.product.id}`}>
                    <Button size="sm" variant="secondary">
                      <ExternalLink size={14} /> Product Page
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
