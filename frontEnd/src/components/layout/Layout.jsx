import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 flex">
      {/* Side Panel: Permanently open on md+ screens, Hamburger Drawer on small screens */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area offset by permanent sidebar width on md+ screens */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 lg:pl-72">
        <Navbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t border-gray-200 dark:border-gray-800 py-6 bg-white/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>© {new Date().getFullYear()} NexaMarket. All rights reserved.</span>
            <span>Verified Merchants · Buyer Protection · Official Warranties</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
