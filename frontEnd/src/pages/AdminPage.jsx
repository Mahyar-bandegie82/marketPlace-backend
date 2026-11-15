import { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Card, LoadingSpinner, Badge } from '../components/ui/Shared.jsx';
import {
  Shield,
  Users,
  Store,
  Tag,
  MessageSquare,
  Package,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart3,
  Crown,
  DollarSign,
  ThumbsUp,
  AlertTriangle,
  Star,
  Search,
  Plus,
  Lock,
  ArrowLeft,
  LogIn,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const STATUS_OPTIONS = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'RETURNED', 'REFUNDED'];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('sellers');
  const [sellerRequests, setSellerRequests] = useState([]);
  const [unverifiedUsers, setUnverifiedUsers] = useState([]);
  const [loyalCustomers, setLoyalCustomers] = useState([]);
  const [highSpenders, setHighSpenders] = useState([]);
  const [trustedSellers, setTrustedSellers] = useState([]);
  const [bestBrands, setBestBrands] = useState([]);
  const [brandsByCount, setBrandsByCount] = useState([]);
  const [mostLikedComments, setMostLikedComments] = useState([]);
  const [loading, setLoading] = useState({});
  const [forbidden, setForbidden] = useState(false);

  // Forms
  const [categoryName, setCategoryName] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [orderIdStatus, setOrderIdStatus] = useState({ id: '', status: 'SHIPPED' });
  const [commentProductId, setCommentProductId] = useState('');

  const load = async (key, fn) => {
    setLoading((l) => ({ ...l, [key]: true }));
    try {
      await fn();
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setForbidden(true);
      } else {
        toast.error(err.response?.data?.error || `Failed to load ${key}`);
      }
    } finally {
      setLoading((l) => ({ ...l, [key]: false }));
    }
  };

  useEffect(() => {
    if (authLoading || !user?.admin || !user?.otpVerified) return;
    load('sellers', async () => {
      const res = await api.get('/admin/sellerReq');
      setSellerRequests(Array.isArray(res.data) ? res.data : []);
    });
  }, [user, authLoading]);

  const verifySeller = async (userId) => {
    try {
      await api.patch(`/admin/verifySellers/${userId}`);
      toast.success('Seller verified');
      const res = await api.get('/admin/sellerReq');
      setSellerRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const deleteSeller = async (userId) => {
    try {
      await api.delete(`/admin/deleteSellers/${userId}`);
      toast.success('Seller deleted');
      const res = await api.get('/admin/sellerReq');
      setSellerRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const unverifySeller = async (userId) => {
    try {
      await api.put(`/admin/unverifySeller/${userId}`);
      toast.success('Seller unverified');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/addProductCategory', { categoryName });
      toast.success('Category added!');
      setCategoryName('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const fetchUnverified = () =>
    load('unverified', async () => {
      const res = await api.get('/admin/users/unverified');
      setUnverifiedUsers(Array.isArray(res.data) ? res.data : []);
    });

  const deleteStaleUsers = async () => {
    try {
      const res = await api.delete('/admin/users/unverified/stale');
      toast.success(res.data.message);
      fetchUnverified();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const fetchLoyal = () =>
    load('loyal', async () => {
      const res = await api.get('/admin/clients/loyal');
      setLoyalCustomers(res.data.loyals || []);
    });

  const fetchHighSpenders = () =>
    load('spenders', async () => {
      const res = await api.get(
        `/admin/clients/high-spenders?minAmount=${Number(minAmount) || 0}`
      );
      setHighSpenders(res.data.loyals || []);
    });

  const fetchTrusted = () =>
    load('trusted', async () => {
      const res = await api.get('/admin/sellers/trusted');
      setTrustedSellers(Array.isArray(res.data) ? res.data : []);
    });

  const fetchBestBrands = () =>
    load('brands', async () => {
      const res = await api.get('/admin/analytics/brands/best-selling?limit=10');
      setBestBrands(Array.isArray(res.data) ? res.data : []);
    });

  const fetchBrandsByCount = () =>
    load('brandCount', async () => {
      const res = await api.get('/admin/analytics/brands/by-product-count?limit=10');
      setBrandsByCount(Array.isArray(res.data) ? res.data : []);
    });

  const fetchMostLiked = () =>
    load('comments', async () => {
      const res = await api.get('/admin/comments/most-liked?limit=10');
      setMostLikedComments(Array.isArray(res.data) ? res.data : []);
    });

  const fetchProductComments = () => {
    if (!commentProductId) return fetchMostLiked();
    load('comments', async () => {
      const res = await api.get(
        `/admin/products/${commentProductId}/comments/most-liked?limit=10`
      );
      setMostLikedComments(Array.isArray(res.data) ? res.data : []);
    });
  };

  const changeOrderStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/admin/orders/${orderIdStatus.id}/status`, {
        status: orderIdStatus.status,
      });
      toast.success(`Order updated to ${res.data.orderStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (authLoading) {
    return <LoadingSpinner text="Verifying administrator credentials..." />;
  }

  if (forbidden || !user?.admin || !user?.otpVerified) {
    const isUnverifiedAdmin = Boolean(user?.admin && !user?.otpVerified);
    return (
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
              <Lock size={12} /> {isUnverifiedAdmin ? 'Verification Required' : 'Administrator Only'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Access Restricted
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {isUnverifiedAdmin
                ? `Your administrator account (${user.userName}) has not completed OTP verification. Unverified administrators are not permitted to view or access anything in the Admin Panel.`
                : user
                  ? `Your account (${user.userName}) does not have administrator privileges. Only verified administrators are permitted to access the Admin Panel.`
                  : 'You are currently browsing without an administrator token. Only verified administrators are permitted to access the Admin Panel.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full">
                <ArrowLeft size={16} /> Back to Marketplace
              </Button>
            </Link>
            {isUnverifiedAdmin && (
              <Link to="/profile" className="w-full sm:w-auto">
                <Button className="w-full">
                  <Shield size={16} /> Verify Account (OTP)
                </Button>
              </Link>
            )}
            {!user && (
              <Link to="/login" state={{ from: '/admin' }} className="w-full sm:w-auto">
                <Button className="w-full">
                  <LogIn size={16} /> Sign In as Admin
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'sellers', label: 'Seller Requests', icon: Store },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'catalog', label: 'Catalog', icon: Tag },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-8">
        <Shield className="text-indigo-500" /> Admin Panel
      </h1>

      {/* Tab navigation */}
      <div className="flex overflow-x-auto gap-1 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Seller Requests */}
      {activeTab === 'sellers' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Unverified Seller Requests
            </h2>
            {loading.sellers ? (
              <LoadingSpinner />
            ) : sellerRequests.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No pending seller requests.
              </p>
            ) : (
              <div className="space-y-3">
                {sellerRequests.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{s.storeName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {s.user?.userName} · {s.user?.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => verifySeller(s.user?.id)}>
                        <CheckCircle size={14} /> Verify
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unverifySeller(s.user?.id)}
                      >
                        <XCircle size={14} /> Unverify
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteSeller(s.user?.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Trusted Sellers
            </h2>
            <Button variant="secondary" size="sm" onClick={fetchTrusted} className="mb-4">
              Load Trusted Sellers
            </Button>
            {loading.trusted ? (
              <LoadingSpinner />
            ) : (
              trustedSellers.length > 0 && (
                <div className="space-y-2">
                  {trustedSellers.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {s.storeName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {s.userName} · {s.email}
                        </p>
                      </div>
                      <Badge color="green">
                        <Crown size={12} className="mr-1" /> Trusted
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Unverified Users (No OTP)
              </h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={fetchUnverified}>
                  Load
                </Button>
                <Button variant="danger" size="sm" onClick={deleteStaleUsers}>
                  <Trash2 size={14} /> Delete 30d+ Stale
                </Button>
              </div>
            </div>
            {loading.unverified ? (
              <LoadingSpinner />
            ) : (
              unverifiedUsers.length > 0 && (
                <div className="space-y-2">
                  {unverifiedUsers.map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {u.userName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {u.email} · {u.phoneNumber}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(u.dateCreated).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Loyal Customers
            </h2>
            <Button variant="secondary" size="sm" onClick={fetchLoyal} className="mb-4">
              Load Loyal Customers
            </Button>
            {loading.loyal ? (
              <LoadingSpinner />
            ) : (
              loyalCustomers.length > 0 && (
                <div className="space-y-2">
                  {loyalCustomers.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {c.userName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                      </div>
                      <Badge color="indigo">
                        <DollarSign size={12} className="mr-1" />$
                        {c.amountSpent?.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">High Spenders</h2>
            <div className="flex gap-3 mb-4">
              <Input
                placeholder="Min amount"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="secondary" size="sm" onClick={fetchHighSpenders}>
                Search
              </Button>
            </div>
            {loading.spenders ? (
              <LoadingSpinner />
            ) : (
              highSpenders.length > 0 && (
                <div className="space-y-2">
                  {highSpenders.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {c.userName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                      </div>
                      <Badge color="green">
                        <DollarSign size={12} className="mr-1" />$
                        {c.amountSpent?.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </div>
      )}

      {/* Catalog */}
      {activeTab === 'catalog' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Add Product Category
          </h2>
          <form onSubmit={addCategory} className="flex gap-3">
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className="flex-1"
            />
            <Button type="submit">
              <Plus size={16} /> Add
            </Button>
          </form>
        </Card>
      )}

      {/* Orders */}
      {activeTab === 'orders' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Change Order Status
          </h2>
          <form onSubmit={changeOrderStatus} className="space-y-4">
            <Input
              label="Order ID"
              type="number"
              value={orderIdStatus.id}
              onChange={(e) => setOrderIdStatus((f) => ({ ...f, id: e.target.value }))}
              placeholder="Order ID"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Status
              </label>
              <select
                value={orderIdStatus.status}
                onChange={(e) => setOrderIdStatus((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">
              <Package size={16} /> Update Status
            </Button>
          </form>
        </Card>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Best Selling Brands
            </h2>
            <Button variant="secondary" size="sm" onClick={fetchBestBrands} className="mb-4">
              Load Data
            </Button>
            {loading.brands ? (
              <LoadingSpinner />
            ) : (
              bestBrands.length > 0 && (
                <div className="space-y-2">
                  {bestBrands.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-8">
                          #{i + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {b.brand}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {b.unitsSold} units
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${b.revenue?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Brands by Product Count
            </h2>
            <Button variant="secondary" size="sm" onClick={fetchBrandsByCount} className="mb-4">
              Load Data
            </Button>
            {loading.brandCount ? (
              <LoadingSpinner />
            ) : (
              brandsByCount.length > 0 && (
                <div className="space-y-2">
                  {brandsByCount.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {b.brand}
                      </p>
                      <Badge color="indigo">{b.products} products</Badge>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </div>
      )}

      {/* Comments */}
      {activeTab === 'comments' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Most Liked Comments
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <Button variant="secondary" size="sm" onClick={fetchMostLiked}>
              Load All Global
            </Button>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Filter by Product ID"
                type="number"
                value={commentProductId}
                onChange={(e) => setCommentProductId(e.target.value)}
                className="max-w-[200px]"
              />
              <Button variant="secondary" size="sm" onClick={fetchProductComments}>
                <Search size={14} /> Filter Product
              </Button>
            </div>
          </div>
          {loading.comments ? (
            <LoadingSpinner />
          ) : (
            mostLikedComments.length > 0 && (
              <div className="space-y-3">
                {mostLikedComments.map((c) => (
                  <div key={c.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {c.userName || 'Anonymous'}
                        </span>
                        {c.product && (
                          <>
                            <span className="text-xs text-gray-400">on</span>
                            <span className="text-sm text-indigo-600 dark:text-indigo-400 capitalize">
                              {c.product.productName}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color="green">
                          <ThumbsUp size={12} className="mr-1" />
                          {c.like}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs text-gray-500">{c.rating}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{c.massage}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      )}
    </div>
  );
}
