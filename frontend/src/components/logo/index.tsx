/**
 * Logo Component
 * Application logo with RTL support and variants
 */

import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import GLOBAL_CONFIG from '@/global-config';

export interface LogoProps {
  className?: string;
  variant?: 'default' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

/**
 * Logo component
 *
 * @example
 * <Logo />
 * <Logo variant="minimal" size="sm" />
 * <Logo linkTo="/dashboard" />
 */
export function Logo({
  className,
  variant = 'default',
  size = 'md',
  linkTo = '/',
  onClick,
}: LogoProps) {
  const content = (
    <div
      className={cn('flex items-center gap-2 font-bold', sizeClasses[size], className)}
      onClick={onClick}
    >
      {/* Logo Icon */}
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-brand">
        <span className="text-white text-lg">ت</span>
      </div>

      {/* Logo Text */}
      {variant === 'default' && (
        <span className="bg-gradient-to-l from-brand-600 to-brand-500 bg-clip-text text-transparent">
          {GLOBAL_CONFIG.appName}
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
