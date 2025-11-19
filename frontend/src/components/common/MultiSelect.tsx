/**
 * MultiSelect Component
 *
 * A multi-select dropdown with:
 * - Checkbox list for multiple selection
 * - Select all / Deselect all buttons
 * - Search/filter options
 * - RTL support
 * - React Hook Form integration
 * - Strict TypeScript types
 *
 * Usage:
 * <MultiSelect
 *   options={branches}
 *   value={selectedBranches}
 *   onChange={setSelectedBranches}
 *   placeholder="اختر الفروع"
 * />
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface MultiSelectOption {
  /** Option value */
  value: string;
  /** Option label (display text) */
  label: string;
  /** Optional disabled state for this option */
  disabled?: boolean;
}

export interface MultiSelectProps {
  /** Available options */
  options: MultiSelectOption[];

  /** Selected values (array of option values) */
  value: string[];

  /** Change handler */
  onChange: (value: string[]) => void;

  /** Placeholder text when nothing selected */
  placeholder?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Label text */
  label?: string;

  /** Required field indicator */
  required?: boolean;

  /** Error message */
  error?: string;

  /** Additional CSS classes */
  className?: string;

  /** Show select all / deselect all buttons */
  showSelectAll?: boolean;

  /** Enable search/filter */
  searchable?: boolean;

  /** Search placeholder */
  searchPlaceholder?: string;

  /** Max height for dropdown */
  maxHeight?: string;

  /** Name for accessibility */
  name?: string;
}

// ============================================
// COMPONENT
// ============================================

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  disabled = false,
  label,
  required = false,
  error,
  className = '',
  showSelectAll = true,
  searchable = true,
  searchPlaceholder = 'بحث...',
  maxHeight = '300px',
  name,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Get selected option labels for display
  const selectedLabels = useMemo(() => {
    return value.map((val) => options.find((opt) => opt.value === val)?.label).filter(Boolean);
  }, [value, options]);

  // Check if all options are selected
  const allSelected = useMemo(() => {
    const selectableOptions = options.filter((opt) => !opt.disabled);
    return selectableOptions.length > 0 && value.length === selectableOptions.length;
  }, [value, options]);

  // Check if some (but not all) options are selected
  const _someSelected = value.length > 0 && !allSelected;

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle option toggle
  const handleToggle = (optionValue: string) => {
    const isSelected = value.includes(optionValue);

    if (isSelected) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  // Select all
  const handleSelectAll = () => {
    const selectableOptions = options.filter((opt) => !opt.disabled);
    onChange(selectableOptions.map((opt) => opt.value));
  };

  // Deselect all
  const handleDeselectAll = () => {
    onChange([]);
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} dir="rtl">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border rounded-lg
          flex items-center justify-between gap-2
          bg-[var(--bg-primary)] text-[var(--text-primary)]
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-colors duration-200
          ${error ? 'border-red-500' : 'border-[var(--border-color)]'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-tertiary)]' : 'cursor-pointer hover:border-primary-400'}
          ${isOpen ? 'ring-2 ring-primary-500 border-transparent' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${name}-label` : undefined}
      >
        {/* Selected values or placeholder */}
        <div className="flex-1 text-right truncate">
          {selectedLabels.length > 0 ? (
            <span className="text-sm">
              {selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} محدد`}
            </span>
          ) : (
            <span className="text-[var(--text-tertiary)] text-sm">{placeholder}</span>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2">
          {/* Clear button */}
          {selectedLabels.length > 0 && !disabled && (
            <X
              className="h-4 w-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              onClick={handleClear}
            />
          )}

          {/* Chevron */}
          <ChevronDown
            className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-hidden"
          dir="rtl"
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-[var(--border-color)]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pr-10 pl-3 py-2 text-sm border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Select All / Deselect All */}
          {showSelectAll && filteredOptions.length > 0 && (
            <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                إلغاء الكل
              </button>
            </div>
          )}

          {/* Options List */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight }}
            role="listbox"
            aria-multiselectable="true"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                const isDisabled = option.disabled || false;

                return (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-3 px-4 py-3 cursor-pointer
                      hover:bg-[var(--bg-tertiary)] transition-colors
                      ${isSelected ? 'bg-primary-50' : ''}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isDisabled && handleToggle(option.value)}
                        disabled={isDisabled}
                        className="sr-only"
                        role="option"
                        aria-selected={isSelected}
                      />
                      <div
                        className={`
                          w-5 h-5 border-2 rounded flex items-center justify-center
                          transition-colors
                          ${
                            isSelected
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
                          }
                          ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        flex-1 text-sm text-right
                        ${isSelected ? 'font-medium text-primary-700' : 'text-[var(--text-primary)]'}
                      `}
                    >
                      {option.label}
                    </span>
                  </label>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
                {searchQuery ? 'لا توجد نتائج' : 'لا توجد خيارات'}
              </div>
            )}
          </div>

          {/* Footer - Show count */}
          {selectedLabels.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <p className="text-xs text-[var(--text-secondary)]">
                محدد: {selectedLabels.length} من {options.length}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" dir="rtl">
          {error}
        </p>
      )}
    </div>
  );
}

export default MultiSelect;
