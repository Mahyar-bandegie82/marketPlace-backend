import { useAuth } from '../context/AuthContext.jsx';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, Lock, LogIn, UserPlus, ArrowLeft, ShieldAlert, MailCheck } from 'lucide-react';
import { Card, Button } from './ui/Shared.jsx';

export default function ProtectedRoute({
  children,
  requireVerified = false,
  title = 'Authentication Required',
  description = 'You need an active account and access token to use this feature.',
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-500/20">
            <Lock className="text-indigo-600 dark:text-indigo-400" size={30} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/login" state={{ from: location.pathname }} className="w-full sm:w-auto">
              <Button className="w-full">
                <LogIn size={16} /> Sign In
              </Button>
            </Link>
            <Link to="/signup" state={{ from: location.pathname }} className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full">
                <UserPlus size={16} /> Create Account
              </Button>
            </Link>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/listings"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft size={14} /> Continue browsing marketplace
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (requireVerified && !user.otpVerified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 animate-fade-in">
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-500/20">
            <ShieldAlert className="text-amber-600 dark:text-amber-400" size={30} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Account Verification Required
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Unverified accounts cannot place orders. Please verify your email address with a 6-digit OTP code in your Personal & Account Info page before checking out.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/profile" className="w-full sm:w-auto">
              <Button className="w-full">
                <MailCheck size={16} /> Verify Account via OTP
              </Button>
            </Link>
            <Link to="/cart" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full">
                <ArrowLeft size={16} /> Back to Cart
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return children;
}
