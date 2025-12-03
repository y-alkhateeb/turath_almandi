import GLOBAL_CONFIG from '@/global-config';
import { cn } from '@/lib/utils';


interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Image */}
      <img
        src={GLOBAL_CONFIG.logoUrl}
        alt="تراث المندي"
        className={cn(sizeClasses[size], 'object-contain rounded-lg')}
        onError={(e) => {
          // Fallback to SVG if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />

      {/* Fallback SVG Logo (hidden by default) */}
      <svg
        viewBox="0 0 100 100"
        className={cn(sizeClasses[size], 'hidden')}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          className="fill-primary/10 stroke-primary"
          strokeWidth="2"
        />
        <path
          d="M25 45 C25 45 20 75 30 82 C35 85 65 85 70 82 C80 75 75 45 75 45"
          className="fill-primary/20 stroke-primary"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          cx="50"
          cy="45"
          rx="27"
          ry="8"
          className="fill-primary stroke-primary"
          strokeWidth="2"
        />
        <path
          d="M45 38 Q50 32 55 38"
          className="stroke-primary"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M35 28 Q33 22 35 18"
          className="stroke-secondary"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M50 25 Q48 18 50 12"
          className="stroke-secondary"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M65 28 Q67 22 65 18"
          className="stroke-secondary"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-bold text-foreground leading-tight',
              textSizeClasses[size]
            )}
          >
            تراث المندي
          </span>
          <span className="text-xs text-muted-foreground">
            Turath Al-Mandi
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;
