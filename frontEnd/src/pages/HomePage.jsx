import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Card } from '../components/ui/Shared.jsx';
import api from '../lib/api.js';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Heart, Store, Shield, Package, ArrowRight, Sparkles, Zap, Lock, Truck, Plus, CheckCircle2, AlertCircle, Compass
} from 'lucide-react';

function FeatureCard({ icon: Icon, title, description, color }) {
  const colors = {
    indigo: 'from-indigo-500 to-purple-600 shadow-indigo-500/25',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/25',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/25',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/25',
  };
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="text-white" size={22} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [quickListingId, setQuickListingId] = useState('');
  const [quickProductId, setQuickProductId] = useState('');
  const [addingCart, setAddingCart] = useState(false);
  const [addingFav, setAddingFav] = useState(false);

  const handleQuickAddToCart = async (e) => {
    e.preventDefault();
    if (!quickListingId) return;
    setAddingCart(true);
    try {
      await api.post('/users/addCartItem', { listingId: Number(quickListingId) });
      toast.success(`Listing #${quickListingId} added to your cart!`);
      setQuickListingId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add item to cart');
    } finally {
      setAddingCart(false);
    }
  };

  const handleQuickAddToFav = async (e) => {
    e.preventDefault();
    if (!quickProductId) return;
    setAddingFav(true);
    try {
      await api.post(`/users/addFavoritedItems/${quickProductId}`);
      toast.success(`Product #${quickProductId} added to your wishlist!`);
      setQuickProductId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add item to wishlist');
    } finally {
      setAddingFav(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60 dark:opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
              <Sparkles size={16} /> Enterprise Fullstack Marketplace
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
              Buy & Sell with
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Confidence</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Express.js backend with Prisma ORM, Redis OTP, CASL authorization, and a high-performance React front-end in full light and dark mode.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
              {user ? (
                <>
                  <Link to="/cart">
                    <Button size="lg"><ShoppingCart size={18} /> Go to Cart <ArrowRight size={16} /></Button>
                  </Link>
                  <Link to="/seller">
                    <Button variant="outline" size="lg"><Store size={18} /> Seller Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg">Get Started <ArrowRight size={16} /></Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Account Status Banner if unverified */}
      {user && !user.otpVerified && (
        <section className="max-w-7xl mx-auto px-4 -mt-6 mb-8">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={20} />
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                Your email is not OTP-verified yet. Please verify to access all marketplace benefits.
              </p>
            </div>
            <Link to="/profile">
              <Button size="sm" variant="secondary">Verify in Profile</Button>
            </Link>
          </div>
        </section>
      )}

      {/* Quick Interactive Actions */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <ShoppingCart className="text-indigo-500" size={18} /> Quick Add to Cart
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Enter any available seller listing ID to instantly add it to your shopping cart.
              </p>
              <form onSubmit={handleQuickAddToCart} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Listing ID (e.g. 1)"
                  value={quickListingId}
                  onChange={(e) => setQuickListingId(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" loading={addingCart} size="sm">
                  <Plus size={14} /> Add
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Heart className="text-pink-500" size={18} /> Quick Add to Wishlist
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Enter any product ID to save it directly to your favourite items list.
              </p>
              <form onSubmit={handleQuickAddToFav} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Product ID (e.g. 1)"
                  value={quickProductId}
                  onChange={(e) => setQuickProductId(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" loading={addingFav} variant="secondary" size="sm">
                  <Heart size={14} /> Save
                </Button>
              </form>
            </Card>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Full-Stack Architecture</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3">Every feature built to match your backend schemas and security</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard icon={Zap} title="JWT & Strict Cookies" description="Access tokens in-memory with automatic axios refresh interceptor & HTTP-only strict cookies." color="indigo" />
          <FeatureCard icon={Store} title="Seller Dashboard" description="Manage listings, conditions, stock, discounts, and date-range promotions with ease." color="emerald" />
          <FeatureCard icon={Lock} title="Admin Command Center" description="Verify sellers, review non-OTP users, inspect high-spenders, and view brand analytics." color="amber" />
          <FeatureCard icon={Truck} title="Order Lifecycle" description="Create orders, update delivery address in real-time, or cancel processing orders." color="rose" />
        </div>
      </section>

      {/* Quick Navigation Cards */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { to: '/listings', icon: Compass, label: 'Explore Products', color: 'text-purple-500' },
              { to: '/cart', icon: ShoppingCart, label: 'Shopping Cart', color: 'text-indigo-500' },
              { to: '/favourites', icon: Heart, label: 'Wishlist', color: 'text-pink-500' },
              { to: '/orders', icon: Package, label: 'Orders', color: 'text-emerald-500' },
              ...(user?.admin ? [{ to: '/admin', icon: Shield, label: 'Admin Panel', color: 'text-amber-500' }] : []),
            ].map(({ to, icon: Icon, label, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-md transition-all group"
              >
                <Icon className={`${color} group-hover:scale-110 transition-transform`} size={24} />
                <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                <ArrowRight size={16} className="ml-auto text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
