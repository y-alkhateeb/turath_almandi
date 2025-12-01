/**
 * Logo Component
 * Application logo with RTL support and variants
 */

import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import GLOBAL_CONFIG from '@/global-config';

export interface LogoProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'image';
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const imageSizeClasses = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
};

/**
 * Logo component
 *
 * @example
 * <Logo />
 * <Logo variant="minimal" size="sm" />
 * <Logo variant="image" size="lg" />
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
      className={cn('flex items-center gap-2 font-bold', variant !== 'image' && sizeClasses[size], className)}
      onClick={onClick}
    >
      {/* Image variant - uses static logo */}
      {variant === 'image' && GLOBAL_CONFIG.logoUrl && (
        <img
          src={GLOBAL_CONFIG.logoUrl}
          alt={GLOBAL_CONFIG.appName}
          className={cn('object-contain', imageSizeClasses[size])}
        />
      )}

      {/* Text variants */}
      {variant !== 'image' && (
        <>
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
        </>
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
