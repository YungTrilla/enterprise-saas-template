import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, X } from 'lucide-react';

const selectVariants = cva(
  'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input bg-background hover:bg-muted/50',
        ghost: 'border-transparent bg-transparent hover:bg-muted',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 text-xs',
        lg: 'h-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'value'>,
    VariantProps<typeof selectVariants> {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  maxHeight?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className,
      variant,
      size,
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      multiple = false,
      searchable = false,
      clearable = false,
      disabled = false,
      error = false,
      maxHeight = '200px',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Convert value to array for easier handling
    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    // Filter options based on search
    const filteredOptions = searchable
      ? options.filter(option => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : options;

    // Get display text
    const getDisplayText = () => {
      if (selectedValues.length === 0) return placeholder;
      if (multiple) {
        if (selectedValues.length === 1) {
          const option = options.find(opt => opt.value === selectedValues[0]);
          return option?.label || selectedValues[0];
        }
        return `${selectedValues.length} selected`;
      }
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    };

    // Handle option selection
    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
        setIsOpen(false);
      }
      setSearchQuery('');
    };

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(multiple ? [] : '');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
      if (isOpen && searchable && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen, searchable]);

    return (
      <div ref={containerRef} className='relative'>
        <div
          ref={ref}
          className={cn(
            selectVariants({ variant, size, className }),
            error && 'border-destructive focus:ring-destructive',
            'cursor-pointer'
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          {...props}
        >
          <span className={cn('truncate', !selectedValues.length && 'text-muted-foreground')}>
            {getDisplayText()}
          </span>
          <div className='flex items-center gap-1'>
            {clearable && selectedValues.length > 0 && !disabled && (
              <button
                type='button'
                onClick={handleClear}
                className='rounded-sm hover:bg-muted p-0.5'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </div>
        </div>

        {isOpen && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md',
              'animate-in fade-in-0 zoom-in-95'
            )}
            style={{ maxHeight }}
          >
            {searchable && (
              <div className='border-b p-2'>
                <input
                  ref={inputRef}
                  type='text'
                  className='w-full px-2 py-1 text-sm outline-none bg-transparent'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}

            <div
              className='overflow-auto'
              style={{ maxHeight: `calc(${maxHeight} - ${searchable ? '48px' : '0px'})` }}
            >
              {filteredOptions.length === 0 ? (
                <div className='px-3 py-2 text-sm text-muted-foreground'>No options found</div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-sm cursor-pointer',
                        'hover:bg-muted',
                        isSelected && 'bg-muted/50',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className='h-4 w-4' />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Export variants for external use
export { selectVariants };
