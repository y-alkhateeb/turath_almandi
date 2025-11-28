/**
 * Switch Component
 * A toggle switch for boolean values
 *
 * Features:
 * - RTL support
 * - Accessible with keyboard navigation
 * - Customizable colors
 * - Disabled state
 * - Optional label
 */

import { forwardRef } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  labelPosition?: 'start' | 'end';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

const sizeClasses = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-3.5 w-3.5',
    translateOn: 'translate-x-1',
    translateOff: 'translate-x-[18px]',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-4 w-4',
    translateOn: 'translate-x-1',
    translateOff: 'translate-x-[22px]',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-5 w-5',
    translateOn: 'translate-x-1',
    translateOff: 'translate-x-8',
  },
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onChange,
      disabled = false,
      label,
      labelPosition = 'start',
      size = 'md',
      className = '',
      id,
    },
    ref
  ) => {
    const sizes = sizeClasses[size];

    const handleClick = () => {
      if (!disabled) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    const switchButton = (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex shrink-0 cursor-pointer items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${sizes.track}
          ${checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block transform rounded-full bg-white shadow-lg
            ring-0 transition-transform duration-200 ease-in-out
            ${sizes.thumb}
            ${checked ? sizes.translateOn : sizes.translateOff}
          `}
        />
      </button>
    );

    if (!label) {
      return switchButton;
    }

    return (
      <div className="flex items-center gap-3">
        {labelPosition === 'start' && (
          <span className="text-sm text-[var(--text-primary)]">{label}</span>
        )}
        {switchButton}
        {labelPosition === 'end' && (
          <span className="text-sm text-[var(--text-primary)]">{label}</span>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
