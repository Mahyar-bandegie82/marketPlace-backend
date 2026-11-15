import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { addGuestCartItem, addGuestFavourite } from '../lib/guestStorage.js';
import { Button, Input, Card, LoadingSpinner, EmptyState, Badge } from '../components/ui/Shared.jsx';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Star,
  Store,
  ShieldCheck,
  ShieldAlert,
  Award,
  Package,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Edit3,
  Trash2,
  CheckCircle2,
  Tag,
  Layers,
  LogIn,
} from 'lucide-react';
import toast from 'react-hot-toast';

const RATING_PRESETS = [
  { label: '100 · Perfect', value: 100 },
  { label: '90 · Great', value: 90 },
  { label: '75 · Good', value: 75 },
  { label: '50 · Average', value: 50 },
  { label: '25 · Poor', value: 25 },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoadingId, setCartLoadingId] = useState(null);
  const [favLoading, setFavLoading] = useState(false);

  // Review / Rating form state
  const [rating, setRating] = useState(90);
  const [massage, setMassage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditingMyReview, setIsEditingMyReview] = useState(false);
  const [reactingCommentId, setReactingCommentId] = useState(null);

  const fetchProductDetails = useCallback(async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const prod = res.data?.product || null;
      setProduct(prod);

      if (prod && user?.client?.id) {
        const existing = (prod.comments || []).find(
          (c) => c.clientId === user.client.id || c.client?.user?.id === user.id
        );
        if (existing) {
          setRating(existing.rating);
          setMassage(existing.massage);
        }
      }
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    setLoading(true);
    fetchProductDetails();
  }, [fetchProductDetails]);

  const handleAddToCart = async (listing) => {
    if (!listing) return;
    if (!user) {
      addGuestCartItem({
        listingId: listing.id,
        productName: product?.productName || `Listing #${listing.id}`,
        price: listing.discountedPrice || listing.price || 0,
        condition: listing.condition || 'NEW',
        images: product?.images || [],
      });
      toast.success('Added to your shopping cart!');
      return;
    }

    setCartLoadingId(listing.id);
    try {
      await api.post('/users/addCartItem', { listingId: listing.id });
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success('Added to your shopping cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add to cart');
    } finally {
      setCartLoadingId(null);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    if (!user) {
      addGuestFavourite(product);
      toast.success('Saved to your wishlist!');
      return;
    }

    setFavLoading(true);
    try {
      await api.post(`/users/addFavoritedItems/${product.id}`);
      toast.success('Saved to your wishlist!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add to wishlist');
    } finally {
      setFavLoading(false);
    }
  };

  const myExistingComment = product?.comments?.find(
    (c) =>
      (user?.client?.id && c.clientId === user.client.id) ||
      (user?.id && c.client?.user?.id === user.id)
  );

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to rate and review this product');
      return navigate('/login', { state: { from: `/products/${id}` } });
    }
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 100) {
      return toast.error('Rating must be a number between 1 and 100');
    }
    if (!massage.trim()) {
      return toast.error('Please write your comment before submitting');
    }

    setSubmittingReview(true);
    try {
      if (myExistingComment) {
        await api.patch(`/comments/updateComment/${product.id}`, {
          rating: numericRating,
          massage: massage.trim(),
        });
        toast.success('Your review and product rating have been updated!');
        setIsEditingMyReview(false);
      } else {
        await api.post('/comments/createComment', {
          productId: Number(product.id),
          rating: numericRating,
          massage: massage.trim(),
        });
        toast.success('Review posted! Product rating updated.');
      }
      await fetchProductDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!product) return;
    setSubmittingReview(true);
    try {
      await api.delete(`/comments/deleteComment/${product.id}`);
      toast.success('Your review was deleted and product rating recalculated');
      setMassage('');
      setRating(90);
      setIsEditingMyReview(false);
      await fetchProductDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReactComment = async (commentId, type) => {
    if (!user) {
      toast.error('Please sign in to like or dislike comments');
      return;
    }
    setReactingCommentId(`${commentId}:${type}`);
    try {
      const res = await api.post(`/comments/react/${commentId}`, { type });
      const updated = res.data?.comment;
      if (updated) {
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                comments: (prev.comments || []).map((c) =>
                  c.id === commentId ? { ...c, like: updated.like, dislike: updated.dislike } : c
                ),
              }
            : prev
        );
      }
      toast.success(type === 'like' ? 'Liked review!' : 'Disliked review');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to react to comment');
    } finally {
      setReactingCommentId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading product details, sellers, and reviews..." />;
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={Package}
          title="Product Not Found"
          description="The requested product could not be found or is no longer listed in the catalog."
          action={
            <Link to="/listings">
              <Button>
                <ArrowLeft size={16} /> Back to Catalog
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const listings = product.listings || [];
  const comments = product.comments || [];
  const bestListing = listings[0];
  const bestPrice = bestListing ? bestListing.discountedPrice || bestListing.price : null;
  const hasDiscount =
    bestListing?.discountedPrice > 0 && bestListing.discountedPrice < bestListing.price;
  const ratingScore = Number(product.rating || 0);
  const starEquivalent = (ratingScore / 20).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back to Catalog
        </Button>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Product ID #{product.id}</span>
          <span>·</span>
          <span>{listings.length} Active Seller{listings.length === 1 ? '' : 's'}</span>
          <span>·</span>
          <span>{comments.length} Customer Review{comments.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Product Overview Hero Card */}
      <Card className="p-6 sm:p-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Product Image / Visual Box */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-indigo-50/50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-950/30 border border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden shadow-inner">
              {product.images &&
              Array.isArray(product.images) &&
              product.images.length > 0 &&
              typeof product.images[0] === 'string' ? (
                <img
                  src={product.images[0]}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500 p-6 text-center">
                  <Package size={72} className="text-indigo-500/60" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">
                      {product.brand}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Model: {product.model}
                    </p>
                  </div>
                </div>
              )}

              {/* Categories Badges on Image */}
              {product.categories?.length > 0 && (
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {product.categories.map((cat, idx) => (
                    <Badge key={idx} color="indigo">
                      <Tag size={11} className="mr-1" /> {cat.categoryName}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Specifications, Rating & Best Offer */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                <span>{product.brand}</span>
                <span>·</span>
                <span>Model: {product.model}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white capitalize">
                {product.productName}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                {product.description}
              </p>
            </div>

            {/* Product Rating Banner */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex flex-col items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
                  <span className="text-lg font-extrabold leading-none">
                    {ratingScore.toFixed(0)}
                  </span>
                  <span className="text-[10px] font-semibold opacity-90">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Star size={16} className="text-amber-500 fill-amber-400" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {ratingScore.toFixed(1)} / 100 Community Rating
                    </span>
                    <Badge color="yellow">{starEquivalent} ★</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Calculated automatically from {comments.length} verified customer review
                    {comments.length === 1 ? '' : 's'} below.
                  </p>
                </div>
              </div>
              <a href="#product-reviews">
                <Button variant="secondary" size="sm">
                  <MessageSquare size={14} /> Rate & Review Product
                </Button>
              </a>
            </div>

            {/* Best Price & Primary Actions */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-4">
              {bestListing ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                      Best Available Offer ({bestListing.seller?.storeName})
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        ${(bestPrice || 0).toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">
                          ${bestListing.price.toLocaleString()}
                        </span>
                      )}
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
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {bestListing.quantity} units in stock · Sold by{' '}
                      <strong className="text-gray-800 dark:text-gray-200">
                        {bestListing.seller?.storeName}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      size="md"
                      onClick={() => handleAddToCart(bestListing)}
                      loading={cartLoadingId === bestListing.id}
                    >
                      <ShoppingCart size={16} /> Add Best Offer to Cart
                    </Button>
                    <Button
                      size="md"
                      variant="secondary"
                      onClick={handleAddToWishlist}
                      loading={favLoading}
                    >
                      <Heart size={16} className="text-rose-500" /> Wishlist
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Currently Out of Stock
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No active seller inventory offers are available right now.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddToWishlist}
                    loading={favLoading}
                  >
                    <Heart size={14} className="text-rose-500" /> Save to Wishlist
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sellers & Inventory Offers Section */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <Store className="text-indigo-500" size={22} /> Sellers Offering This Product
              <Badge color="indigo">{listings.length}</Badge>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Compare every merchant selling this item, their trust & verification status, warranty coverage, and condition.
            </p>
          </div>
        </div>

        {listings.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
            No active seller listings for this product right now.
          </p>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => {
              const effectivePrice = listing.discountedPrice || listing.price;
              const isDiscounted =
                listing.discountedPrice > 0 && listing.discountedPrice < listing.price;
              const warranty =
                listing.productWaranty && typeof listing.productWaranty === 'object'
                  ? listing.productWaranty
                  : {};

              return (
                <div
                  key={listing.id}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/50 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-bold text-gray-900 dark:text-white capitalize flex items-center gap-1.5">
                        <Store size={16} className="text-indigo-500" />
                        {listing.seller?.storeName || `Seller #${listing.sellerId}`}
                      </span>

                      {/* Trusted vs Standard Seller Status */}
                      {listing.seller?.trusted ? (
                        <Badge color="green">
                          <ShieldCheck size={12} className="mr-1" /> Trusted Seller
                        </Badge>
                      ) : (
                        <Badge color="gray">
                          <ShieldAlert size={12} className="mr-1" /> Standard Seller (Not Trusted)
                        </Badge>
                      )}

                      {/* Verified Store Badge */}
                      {listing.seller?.verified ? (
                        <Badge color="indigo">
                          <CheckCircle2 size={12} className="mr-1" /> Verified Store
                        </Badge>
                      ) : (
                        <Badge color="yellow">Unverified Store</Badge>
                      )}

                      {/* Condition Badge */}
                      <Badge
                        color={
                          listing.condition === 'NEW'
                            ? 'green'
                            : listing.condition === 'BARELY_USED'
                              ? 'blue'
                              : 'yellow'
                        }
                      >
                        Condition: {listing.condition.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <span>
                        Listing ID: <strong>#{listing.id}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Available Stock: <strong>{listing.quantity} units</strong>
                      </span>
                      {warranty.corp && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Award size={13} /> Warranty: {warranty.corp}
                            {warranty.time ? ` (${warranty.time})` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-gray-700">
                    <div className="text-left md:text-right">
                      <div className="text-xl font-extrabold text-gray-900 dark:text-white">
                        ${(effectivePrice || 0).toLocaleString()}
                      </div>
                      {isDiscounted && (
                        <div className="text-xs text-gray-400 line-through">
                          ${listing.price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(listing)}
                      loading={cartLoadingId === listing.id}
                    >
                      <ShoppingCart size={14} /> Add to Cart
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Product Reviews, Rating Form & Likes/Dislikes Section */}
      <div id="product-reviews" className="scroll-mt-20 space-y-6">
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                <MessageSquare className="text-indigo-500" size={22} /> Customer Reviews & Product Rating
                <Badge color="indigo">{comments.length}</Badge>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Submitting a review with a rating score (1–100) directly updates this product&apos;s overall marketplace rating.
              </p>
            </div>
          </div>

          {/* Add or Update Comment & Rating Box */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80">
            {!user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Want to rate or review this product?
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sign in to submit your comment, give this product a rating out of 100, and like or dislike helpful community reviews.
                  </p>
                </div>
                <Link to="/login" state={{ from: `/products/${product.id}` }}>
                  <Button size="sm">
                    <LogIn size={14} /> Sign In to Review
                  </Button>
                </Link>
              </div>
            ) : myExistingComment && !isEditingMyReview ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge color="green">You Reviewed This Product</Badge>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Star size={13} className="fill-amber-400" /> Your Rating: {myExistingComment.rating} / 100
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                    &ldquo;{myExistingComment.massage}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setRating(myExistingComment.rating);
                      setMassage(myExistingComment.massage);
                      setIsEditingMyReview(true);
                    }}
                  >
                    <Edit3 size={14} /> Edit My Review & Rating
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleDeleteMyReview}
                    loading={submittingReview}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star size={17} className="text-amber-500 fill-amber-400" />
                    {myExistingComment ? 'Update Your Rating & Review' : 'Write a Comment & Rate This Product'}
                  </h3>
                  {isEditingMyReview && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingMyReview(false)}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>

                {/* Rating Controls (1 - 100) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Your Product Rating Score (1 – 100)
                    </label>
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                      {rating} / 100
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <div className="w-28">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Quick Rating Preset Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {RATING_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        size="sm"
                        variant={Number(rating) === preset.value ? 'primary' : 'secondary'}
                        onClick={() => setRating(preset.value)}
                      >
                        <Star size={12} className="fill-current" /> {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Your Review Comment
                  </label>
                  <textarea
                    rows={3}
                    value={massage}
                    onChange={(e) => setMassage(e.target.value)}
                    placeholder="Share your experience with this product, performance, build quality, and value..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button type="submit" loading={submittingReview}>
                    <Send size={15} />{' '}
                    {myExistingComment ? 'Save Updated Rating & Comment' : 'Submit Comment & Rating'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Comments List with Like & Dislike */}
          {comments.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No comments on this product yet"
              description="Be the first customer to review and rate this product above!"
            />
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const authorName = comment.client?.user?.userName || 'Verified Customer';
                return (
                  <div
                    key={comment.id}
                    className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {authorName}
                            </span>
                            <Badge color="yellow">
                              <Star size={11} className="mr-1 fill-amber-400 text-amber-500" />
                              Rated {comment.rating} / 100
                            </Badge>
                          </div>
                          {comment.createdAt && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Like & Dislike Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={reactingCommentId === `${comment.id}:like`}
                          onClick={() => handleReactComment(comment.id, 'like')}
                          title="Like this review"
                        >
                          <ThumbsUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Like</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            {comment.like ?? 0}
                          </span>
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          loading={reactingCommentId === `${comment.id}:dislike`}
                          onClick={() => handleReactComment(comment.id, 'dislike')}
                          title="Dislike this review"
                        >
                          <ThumbsDown size={14} className="text-rose-500 dark:text-rose-400" />
                          <span>Dislike</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold">
                            {comment.dislike ?? 0}
                          </span>
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-1">
                      {comment.massage}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
