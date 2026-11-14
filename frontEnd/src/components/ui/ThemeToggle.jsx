import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label="Toggle dark mode"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          dark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {dark ? (
          <Moon size={14} className="text-indigo-400" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
