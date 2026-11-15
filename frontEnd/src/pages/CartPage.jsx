import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getGuestCart,
  incrementGuestCartItem,
  decrementGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
} from '../lib/guestStorage.js';
import { Button, Card, LoadingSpinner, EmptyState, Badge } from '../components/ui/Shared.jsx';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Package, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setItems(getGuestCart());
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/users/getCartItems');
      setItems(res.data.cartItems || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleIncrement = async (listingId) => {
    if (!user) {
      setItems(incrementGuestCartItem(listingId));
      return;
    }
    setActionLoading(listingId + '-inc');
    try {
      await api.put('/users/incrementCartItemquantity', { listingId });
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecrement = async (listingId) => {
    if (!user) {
      setItems(decrementGuestCartItem(listingId));
      return;
    }
    setActionLoading(listingId + '-dec');
    try {
      await api.put('/users/decrementCartItemquantity', { listingId });
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (listingId) => {
    if (!user) {
      setItems(removeGuestCartItem(listingId));
      toast.success('Removed from cart');
      return;
    }
    setActionLoading(listingId + '-del');
    try {
      await api.delete('/users/deleteCartItem', { data: { listingId } });
      toast.success('Removed from cart');
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClear = async () => {
    if (!user) {
      setItems(clearGuestCart());
      toast.success('Cart cleared');
      return;
    }
    try {
      await api.delete('/users/clearCartItems');
      toast.success('Cart cleared');
      setItems([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clear');
    }
  };

  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  if (authLoading || loading) return <LoadingSpinner text="Loading cart..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="text-indigo-500" /> Shopping Cart
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {!user && ' (Guest Session)'}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" onClick={handleClear} size="sm">
            <Trash2 size={14} /> Clear All
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Explore our catalog and add items to your cart — no account token needed until you place an order."
          action={
            <Link to="/listings">
              <Button size="sm">
                <Compass size={15} /> Browse Marketplace
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.listingId} className="p-5 flex gap-5 items-start">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.images && item.images.length > 0 && typeof item.images[0] === 'string' ? (
                    <img
                      src={item.images[0]}
                      alt={item.productName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="text-gray-400" size={28} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white capitalize truncate">
                    {item.productName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      color={
                        item.condition === 'NEW'
                          ? 'green'
                          : item.condition === 'BARELY_USED'
                          ? 'blue'
                          : 'yellow'
                      }
                    >
                      {(item.condition || 'NEW').replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDecrement(item.listingId)}
                        loading={actionLoading === item.listingId + '-dec'}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleIncrement(item.listingId)}
                        loading={actionLoading === item.listingId + '-inc'}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(item.listingId)}
                        loading={actionLoading === item.listingId + '-del'}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal ({items.length} items)</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className="text-green-600 dark:text-green-400">Free</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
              <Button
                className="w-full mt-6"
                onClick={() => {
                  if (user && !user.otpVerified) {
                    toast.error('Please verify your email via OTP before placing an order');
                  }
                  navigate('/checkout');
                }}
              >
                <CreditCard size={16} /> Place Order
              </Button>
              {!user ? (
                <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-3">
                  You will be prompted to sign in when placing your order.
                </p>
              ) : !user.otpVerified ? (
                <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 mt-3">
                  Your account must be OTP-verified before you can place an order.
                </p>
              ) : null}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
