import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Card, LoadingSpinner, EmptyState, Badge } from '../components/ui/Shared.jsx';
import { Package, XCircle, MapPin, Clock, Truck, CheckCircle, Edit2, Save, X, Compass, LogIn, Lock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const statusConfig = {
  PROCESSING: { color: 'yellow', icon: Clock, label: 'Processing' },
  SHIPPED: { color: 'blue', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'green', icon: CheckCircle, label: 'Delivered' },
  CANCELED: { color: 'red', icon: XCircle, label: 'Canceled' },
  RETURNED: { color: 'purple', icon: Package, label: 'Returned' },
  REFUNDED: { color: 'gray', icon: Package, label: 'Refunded' },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({ address: '', postalCode: '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/orders/getOrders');
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    if (!user?.otpVerified) {
      toast.error('Please verify your account via OTP before canceling an order.');
      return;
    }
    setCancelingOrderId(orderId);
    try {
      await api.put(`/orders/cancelOrder/${orderId}`, {});
      toast.success('Order canceled successfully');
      if (editingOrderId === orderId) {
        setEditingOrderId(null);
      }
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: 'CANCELED' } : o))
      );
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot cancel order');
    } finally {
      setCancelingOrderId(null);
    }
  };

  const handleUpdateAddress = async (orderId) => {
    if (!user?.otpVerified) {
      toast.error('Please verify your account via OTP before modifying an order.');
      return;
    }
    setUpdateLoading(true);
    try {
      await api.patch(`/orders/updateOrderAddress/${orderId}`, {
        address: editAddressForm.address || undefined,
        postalCode: editAddressForm.postalCode || undefined,
      });
      toast.success('Order address updated');
      setEditingOrderId(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update address');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (authLoading || loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="text-indigo-500" /> My Orders
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track active shipments, update delivery details, or manage processing orders.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No active orders"
          description={
            user
              ? 'When you place an order, your real-time shipment status and items will appear here.'
              : 'You are currently browsing without an account token. Sign in to view existing orders or explore the catalog to start shopping.'
          }
          action={
            <div className="flex items-center gap-3">
              <Link to="/listings">
                <Button size="sm">
                  <Compass size={15} /> Explore Catalog
                </Button>
              </Link>
              {!user && (
                <Link to="/login">
                  <Button size="sm" variant="secondary">
                    <LogIn size={15} /> Sign In
                  </Button>
                </Link>
              )}
            </div>
          }
        />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.PROCESSING;
            const StatusIcon = config.icon;
            const isEditing = editingOrderId === order.orderId;

            return (
              <Card key={order.orderId} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Order #{order.orderId}
                      </h3>
                      <Badge color={config.color}>
                        <StatusIcon size={12} className="mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(order.orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {order.status === 'PROCESSING' ? (
                    user?.otpVerified ? (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isEditing) {
                              setEditingOrderId(null);
                            } else {
                              setEditingOrderId(order.orderId);
                              setEditAddressForm({
                                address: order.address,
                                postalCode: order.postalCode,
                              });
                            }
                          }}
                        >
                          <Edit2 size={14} /> Edit Address
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={cancelingOrderId === order.orderId}
                          onClick={() => handleCancel(order.orderId)}
                        >
                          <XCircle size={14} /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <Link
                        to="/profile"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors"
                      >
                        <ShieldAlert size={13} /> Verify OTP to Cancel or Edit
                      </Link>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      <Lock size={12} /> Stage Locked
                    </div>
                  )}
                </div>

                {isEditing && order.status === 'PROCESSING' && user?.otpVerified && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-3 animate-fade-in">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Update Delivery Address
                    </h4>
                    <Input
                      label="New Address (min 5 chars)"
                      value={editAddressForm.address}
                      onChange={(e) =>
                        setEditAddressForm((f) => ({ ...f, address: e.target.value }))
                      }
                    />
                    <Input
                      label="New Postal Code"
                      value={editAddressForm.postalCode}
                      onChange={(e) =>
                        setEditAddressForm((f) => ({ ...f, postalCode: e.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateAddress(order.orderId)}
                        loading={updateLoading}
                      >
                        <Save size={14} /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingOrderId(null)}
                      >
                        <X size={14} /> Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {order.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.images &&
                        item.images.length > 0 &&
                        typeof item.images[0] === 'string' ? (
                          <img
                            src={item.images[0]}
                            alt={item.productName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="text-gray-400" size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.storeName} · Qty: {item.quantity} · $
                          {item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${item.lineTotal?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin size={14} />
                    <span className="truncate max-w-xs">
                      {order.address} ({order.postalCode})
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${order.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
