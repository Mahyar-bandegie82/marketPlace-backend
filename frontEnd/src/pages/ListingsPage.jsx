import { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Card, LoadingSpinner, EmptyState, Badge } from '../components/ui/Shared.jsx';
import {
  Search, ShoppingCart, Heart, Star, Store, ShieldCheck, Tag, Filter,
  SlidersHorizontal, Package, Check, X, ArrowUpDown, ChevronDown, Layers, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ListingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('products'); // 'products' | 'listings'

  // Action Loading
  const [cartLoadingId, setCartLoadingId] = useState(null);
  const [favLoadingId, setFavLoadingId] = useState(null);

  // Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedCondition) params.condition = selectedCondition;
      if (sortBy) params.sort = sortBy;

      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params }).catch(() => ({ data: { products: [] } })),
        api.get('/products/categories').catch(() => ({ data: { categories: [] } })),
      ]);

      setProducts(prodRes.data?.products || []);
      setCategories(catRes.data?.categories || []);
    } catch (err) {
      toast.error('Failed to load marketplace products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, selectedCondition, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleAddToCart = async (listingId) => {
    if (!user) {
      toast.error('Please log in to add items to your cart');
      return navigate('/login');
    }
    setCartLoadingId(listingId);
    try {
      await api.post('/users/addCartItem', { listingId });
      toast.success('Added to your shopping cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add to cart');
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please log in to save items to your wishlist');
      return navigate('/login');
    }
    setFavLoadingId(productId);
    try {
      await api.post(`/users/addFavoritedItems/${productId}`);
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
            Browse verified hardware, computer parts, and active seller listings in the database.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'products'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Package size={14} /> By Products ({products.length})
          </button>
          <button
            onClick={() => setViewMode('listings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'listings'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
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
                setTimeout(fetchCatalog, 0);
              }}
            >
              Reset
            </Button>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
          {/* Category Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-1">
              <Filter size={12} /> Category:
            </span>
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id || c.categoryName}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === c.categoryName ? '' : c.categoryName
                  )
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                  selectedCategory === c.categoryName
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
        <LoadingSpinner text="Querying database products and listings..." />
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
              const hasDiscount = bestListing?.discountedPrice > 0 && bestListing.discountedPrice < bestListing.price;

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
                      onClick={() => handleAddToWishlist(p.id)}
                      disabled={favLoadingId === p.id}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md text-gray-600 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
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
                      <h3 className="font-bold text-base text-gray-900 dark:text-white capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {p.productName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {p.description}
                      </p>

                      {/* Rating & Categories */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <Star size={13} className="fill-amber-400" />
                          <span>{(p.rating || 0).toFixed(1)}</span>
                        </div>
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

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleAddToCart(bestListing.id)}
                              loading={cartLoadingId === bestListing.id}
                            >
                              <ShoppingCart size={14} /> Add to Cart
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedProduct(p)}
                            >
                              <Info size={14} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-gray-400 py-1">
                          <span>Currently Out of Stock</span>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(p)}>
                            Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Seller Listings View */
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                        {listing.product.productName}
                      </h3>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Store: <strong className="text-gray-700 dark:text-gray-200">{listing.seller?.storeName || 'Verified Store'}</strong>
                      {listing.seller?.trusted && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <ShieldCheck size={12} /> Trusted
                        </span>
                      )}
                      <span className="mx-2">·</span>
                      Available Quantity: <strong>{listing.quantity}</strong>
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
                      onClick={() => handleAddToCart(listing.id)}
                      loading={cartLoadingId === listing.id}
                    >
                      <ShoppingCart size={14} /> Buy Now
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedProduct(listing.product)}
                    >
                      Info
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedProduct.brand} · {selectedProduct.model}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                  {selectedProduct.productName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {selectedProduct.description}
            </p>

            {/* Seller Offers */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                Seller Inventory Offers ({selectedProduct.listings?.length || 0})
              </h3>
              <div className="space-y-2">
                {selectedProduct.listings?.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {l.seller?.storeName || 'Official Seller'}
                        </span>
                        <Badge
                          color={
                            l.condition === 'NEW'
                              ? 'green'
                              : l.condition === 'BARELY_USED'
                              ? 'blue'
                              : 'yellow'
                          }
                        >
                          {l.condition.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Stock: {l.quantity} units · Listing #{l.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        ${(l.discountedPrice || l.price).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(l.id)}
                        loading={cartLoadingId === l.id}
                      >
                        <ShoppingCart size={14} /> Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {selectedProduct.comments?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                  Customer Reviews ({selectedProduct.comments.length})
                </h3>
                <div className="space-y-3">
                  {selectedProduct.comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {c.client?.user?.userName || 'Customer'}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={12} className="fill-amber-400" />
                          <span>{c.rating}/100</span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">{c.massage}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
