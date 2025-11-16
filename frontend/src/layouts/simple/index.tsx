/**
 * Simple Layout
 * Minimal layout for authentication pages (login, register, etc.)
 */

import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/logo';

export function SimpleLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-success-50" dir="rtl">
      {/* Logo Header */}
      <div className="absolute top-6 right-6">
        <Logo size="lg" linkTo="/" />
      </div>

      {/* Content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-gray-600">
          © 2025 تراث المندي. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
