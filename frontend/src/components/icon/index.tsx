/**
 * Icon Component
 * Wrapper for Iconify React with consistent styling and RTL support
 */

import { Icon as IconifyIcon, type IconProps as IconifyIconProps } from '@iconify/react';
import { cn } from '@/utils';

export interface IconProps extends Omit<IconifyIconProps, 'icon'> {
  icon: string;
  size?: number | string;
  className?: string;
}

/**
 * Icon component using Iconify
 *
 * @example
 * <Icon icon="mdi:home" size={24} />
 * <Icon icon="lucide:user" className="text-primary-500" />
 * <Icon icon="solar:settings-linear" size="1.5rem" />
 */
export function Icon({ icon, size = 20, className, ...props }: IconProps) {
  return (
    <IconifyIcon
      icon={icon}
      width={size}
      height={size}
      className={cn('inline-block', className)}
      {...props}
    />
  );
}

// Re-export IconifyIcon for advanced usage
export { IconifyIcon };
export type { IconifyIconProps };
