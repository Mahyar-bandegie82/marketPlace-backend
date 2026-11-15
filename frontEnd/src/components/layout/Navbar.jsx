import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import {
  ShoppingCart,
  User,
  Shield,
  Package,
  Menu,
  Search,
  Store,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ onOpenSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = quickSearch.trim();
    if (q) {
      navigate(`/listings?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/listings');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Hamburger on small screens + Mobile Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Package size={17} className="text-white" />
            </div>
            <span className="text-base font-extrabold text-gray-900 dark:text-white">
              Nexa<span className="text-indigo-600 dark:text-indigo-400">Market</span>
            </span>
          </Link>
        </div>

        {/* Center/Left Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search hardware, brands, models..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </form>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/cart"
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Shopping Cart"
          >
            <ShoppingCart size={19} />
          </Link>

          <ThemeToggle />

          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {(user.userName || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 hidden sm:inline">
                {user.userName}
              </span>
              {user.admin && user.otpVerified && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hidden lg:inline-flex items-center gap-0.5">
                  <Shield size={10} /> Admin
                </span>
              )}
              {user.seller && !user.admin && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hidden lg:inline-flex items-center gap-0.5">
                  <Store size={10} /> Seller
                </span>
              )}
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm shadow-indigo-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
