'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Map,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import ToastContainer from '@/components/ui/ToastContainer';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { getInitials } from '@/lib/utils';
import BrandLogo from '@/components/layout/BrandLogo';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Customer Map', href: '/dashboard/customers/map', icon: Map },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Broodstock Batches', href: '/dashboard/batches', icon: Package },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, canAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();

  const normalizedName = user?.name?.trim();
  const displayName = normalizedName || 'User';
  const initials = normalizedName ? getInitials(normalizedName) || 'U' : 'U';
  const roleLabel = user?.role || 'N/A';

  const handleLogout = () => {
    logout();
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'lg:hidden' : 'hidden lg:flex'} lg:w-64 lg:flex-col lg:fixed lg:inset-y-0`}>
      <div className="relative flex flex-col flex-grow pt-6 pb-8 overflow-y-auto bg-white border-r border-gray-200 shadow-lg">

        <div className="relative flex items-center flex-shrink-0 px-6">
          <BrandLogo 
            showText 
            className="text-gray-900" 
            textClassName="[&>*:first-child]:text-[var(--brand-red)] [&>*:last-child]:text-gray-900 [&>*:last-child]:drop-shadow-none" 
          />
        </div>

        <div className="relative mx-4 mt-6 h-px bg-[var(--border-subtle)]" />

        {/* Navigation */}
        <nav className="relative mt-8 flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const textColorClass = isActive
              ? 'text-white'
              : 'text-[var(--brand-blue)] group-hover:text-white';

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3.5 py-3 text-sm font-semibold tracking-[0.3em] uppercase rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-white bg-[var(--brand-blue)] shadow-lg' 
                    : 'text-[var(--brand-blue)] hover:text-white hover:bg-[var(--brand-blue)] hover:shadow-lg'
                }`}
                onClick={() => mobile && setSidebarOpen(false)}
              >
                <span className={`inline-flex h-2 w-2 rounded-full bg-[var(--brand-red)] mr-3 transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                }`} />
                <Icon className={`mr-3 flex-shrink-0 h-4 w-4 transition-colors ${
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'
                }`} />
                <span className={`tracking-[0.3em] ${textColorClass}`}>{item.name}</span>
              </Link>
            );
          })}
          
          {canAdmin && (
            (() => {
              const isActive = pathname === '/dashboard/settings';
              const textColorClass = isActive
                ? 'text-white'
                : 'text-[var(--brand-blue)] group-hover:text-white';

              return (
                <Link
                  href="/dashboard/settings"
                  className={`group flex items-center px-3.5 py-3 text-sm font-semibold tracking-[0.3em] uppercase rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'text-white bg-[var(--brand-blue)] shadow-lg' 
                      : 'text-[var(--brand-blue)] hover:text-white hover:bg-[var(--brand-blue)] hover:shadow-lg'
                  }`}
                  onClick={() => mobile && setSidebarOpen(false)}
                >
                  <span className={`inline-flex h-2 w-2 rounded-full bg-[var(--brand-red)] mr-3 transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                  }`} />
                  <Settings className={`mr-3 flex-shrink-0 h-4 w-4 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'
                  }`} />
                  <span className={`tracking-[0.3em] ${textColorClass}`}>Settings</span>
                </Link>
              );
            })()
          )}
        </nav>

        {/* User section */}
        <div className="relative flex-shrink-0 flex border-t border-gray-200 px-6 pt-6 mt-6">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[var(--brand-red)] text-white text-sm font-bold ring-4 ring-[var(--brand-red)]/20 shadow-lg">
                {initials}
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate uppercase tracking-wide">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate uppercase tracking-[0.3em]">
                {roleLabel}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <NotificationProvider>
      <div className="min-h-screen">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:text-gray-300 p-2"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <Sidebar mobile />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-white/40 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationDropdown />
                
                <div className="flex items-center space-x-2">
                  <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-[var(--brand-blue)] text-white text-sm font-bold ring-2 ring-[var(--brand-red)]/40">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-900">
                    {displayName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-10">
          <div className="px-4 sm:px-6 lg:px-10 py-10 space-y-8">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer position="top-right" />
    </div>
    </NotificationProvider>
  );
}
