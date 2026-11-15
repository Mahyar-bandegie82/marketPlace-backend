import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getGuestCart } from '../../lib/guestStorage.js';
import {
  Home,
  Compass,
  ShoppingCart,
  Package,
  Heart,
  MessageSquare,
  User,
  Store,
  Shield,
  Lock,
  LogOut,
  LogIn,
  UserPlus,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [guestCartCount, setGuestCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const items = getGuestCart();
      const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setGuestCartCount(totalQty);
    };
    updateCount();
    window.addEventListener('cart:updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('cart:updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [user]);

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen) {
      onClose?.();
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigate('/');
  };

  const isAdmin = Boolean(user?.admin && user?.otpVerified);
  const isSeller = Boolean(user?.seller);

  const navSections = [
    {
      title: 'Marketplace',
      items: [
        { to: '/', label: 'Home', icon: Home },
        { to: '/listings', label: 'Explore Catalog', icon: Compass },
      ],
    },
    {
      title: 'Shopping & Orders',
      items: [
        {
          to: '/cart',
          label: 'Cart Items',
          icon: ShoppingCart,
          badge: !user && guestCartCount > 0 ? guestCartCount : null,
        },
        { to: '/orders', label: 'Orders', icon: Package },
        { to: '/favourites', label: 'Wishlist', icon: Heart },
        { to: '/comments', label: 'My Reviews', icon: MessageSquare },
      ],
    },
    {
      title: 'Account & Management',
      items: [
        { to: '/profile', label: 'Personal & Account Info', icon: User },
        {
          to: '/seller',
          label: isSeller ? 'Seller Dashboard' : 'Become a Seller',
          icon: Store,
          tag: isSeller ? 'Seller' : null,
        },
        {
          to: '/admin',
          label: 'Admin Panel',
          icon: Shield,
          locked: !isAdmin,
          tag: isAdmin ? 'Admin' : null,
        },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/listings') {
      return location.pathname === '/listings' || location.pathname === '/products';
    }
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Package size={19} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white block leading-none">
              Nexa<span className="text-indigo-600 dark:text-indigo-400">Market</span>
            </span>
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Verified Commerce
            </span>
          </div>
        </Link>

        {/* Close button only on small screens */}
        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={18}
                        className={`flex-shrink-0 transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : item.tag ? (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {item.tag}
                      </span>
                    ) : item.locked ? (
                      <span
                        title="Admin privileges required"
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <Lock size={11} />
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Account Card */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 flex-shrink-0">
        {user ? (
          <div className="space-y-3">
            <Link
              to="/profile"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                {(user.userName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.userName}
                  </p>
                  {user.otpVerified && (
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email || user.phoneNumber || 'Authenticated Member'}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="px-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Browsing as Guest
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Roam freely — sign in when placing an order or selling.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <LogIn size={13} /> Sign In
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm transition-all"
              >
                <UserPlus size={13} /> Join
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Permanent Side Panel on Medium & Large Screens */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer on Small Screens */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10 animate-fade-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
