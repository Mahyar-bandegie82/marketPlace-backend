import { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', loading = false, className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-500/40 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 focus:ring-indigo-500',
    secondary:
      'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-gray-700 dark:hover:text-white dark:hover:border-indigo-500/50 shadow-sm hover:shadow focus:ring-indigo-500',
    danger:
      'bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-500/40 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 focus:ring-red-500',
    success:
      'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-emerald-500/40 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/25 focus:ring-emerald-500',
    ghost:
      'bg-gray-100/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-200/90 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs focus:ring-gray-500',
    outline:
      'bg-white/80 dark:bg-gray-900/80 border-2 border-indigo-500/70 dark:border-indigo-400/70 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white shadow-sm focus:ring-indigo-500',
  };
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ label, error, type = 'text', className = '', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="relative">
        <input
          type={effectiveType}
          className={`w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm ${isPassword ? 'pr-11' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none p-1 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    green: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
    red: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400',
    yellow: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}
