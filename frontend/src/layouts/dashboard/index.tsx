/**
 * Dashboard Layout
 * Modern responsive layout with shadcn/ui styling
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300" dir="rtl">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className={cn(
            'fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] lg:hidden',
            'animate-in'
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col mr-0 lg:mr-[280px] transition-all duration-300">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
