import { Icon as Iconify, IconProps as IconifyProps } from '@iconify/react';
import { cn } from '@/lib/utils';

export interface IconProps extends Omit<IconifyProps, 'icon'> {
  icon: string;
  size?: number;
  className?: string;
}

export function Icon({ icon, size = 24, className, ...props }: IconProps) {
  return (
    <Iconify
      icon={icon}
      width={size}
      height={size}
      className={cn('inline-block', className)}
      {...props}
    />
  );
}

export default Icon;
