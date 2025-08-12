import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';
import { Check, ChevronRight } from 'lucide-react';

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

export interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return <DropdownContext.Provider value={{ open, setOpen }}>{children}</DropdownContext.Provider>;
};

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  asChild = false,
  className,
}) => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within DropdownMenu');
  }

  const { open, setOpen } = context;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': 'menu',
    } as React.ComponentPropsWithoutRef<typeof children.type>);
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup='menu'
      className={className}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  className,
}) => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('DropdownMenuContent must be used within DropdownMenu');
  }

  const { open, setOpen } = context;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const positionClasses = {
    bottom: 'top-full',
    top: 'bottom-full',
    left: 'right-full',
    right: 'left-full',
  };

  const alignClasses = {
    start: side === 'bottom' || side === 'top' ? 'left-0' : 'top-0',
    center:
      side === 'bottom' || side === 'top'
        ? 'left-1/2 -translate-x-1/2'
        : 'top-1/2 -translate-y-1/2',
    end: side === 'bottom' || side === 'top' ? 'right-0' : 'bottom-0',
  };

  return (
    <div
      ref={contentRef}
      role='menu'
      aria-orientation='vertical'
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        positionClasses[side],
        alignClasses[align],
        className
      )}
      style={{ marginTop: `${sideOffset}px` }}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onSelect,
  disabled = false,
  className,
}) => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('DropdownMenuItem must be used within DropdownMenu');
  }

  const { setOpen } = context;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onSelect?.();
    setOpen(false);
  };

  return (
    <div
      role='menuitem'
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as React.MouseEvent<HTMLDivElement>);
        }
      }}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({
  children,
  checked = false,
  onCheckedChange,
  ...props
}) => {
  return (
    <DropdownMenuItem {...props} onSelect={() => onCheckedChange?.(!checked)}>
      <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
        {checked && <Check className='h-4 w-4' />}
      </span>
      <span className='pl-8'>{children}</span>
    </DropdownMenuItem>
  );
};

export interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ children, className }) => {
  return <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>{children}</div>;
};

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      role='separator'
      aria-orientation='horizontal'
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
    />
  );
};

export interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return <DropdownContext.Provider value={{ open, setOpen }}>{children}</DropdownContext.Provider>;
};

export interface DropdownMenuSubTriggerProps extends DropdownMenuItemProps {}

export const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <DropdownMenuItem {...props} className={cn('flex items-center justify-between', className)}>
      {children}
      <ChevronRight className='ml-auto h-4 w-4' />
    </DropdownMenuItem>
  );
};

export const DropdownMenuSubContent = DropdownMenuContent;
