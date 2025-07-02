import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  sideOffset?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className,
  sideOffset = 8,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    // Calculate position based on side
    switch (side) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - sideOffset;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + sideOffset;
        break;
      case 'left':
        left = triggerRect.left + scrollX - tooltipRect.width - sideOffset;
        break;
      case 'right':
        left = triggerRect.right + scrollX + sideOffset;
        break;
    }

    // Calculate position based on alignment
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left + scrollX;
          break;
        case 'center':
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'end':
          left = triggerRect.right + scrollX - tooltipRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          top = triggerRect.top + scrollY;
          break;
        case 'center':
          top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
          break;
        case 'end':
          top = triggerRect.bottom + scrollY - tooltipRect.height;
          break;
      }
    }

    // Ensure tooltip stays within viewport
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }

    if (top < padding + scrollY) top = padding + scrollY;
    if (top + tooltipRect.height > viewportHeight + scrollY - padding) {
      top = viewportHeight + scrollY - tooltipRect.height - padding;
    }

    setPosition({ top, left });
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible]);

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    if (isVisible) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'fixed z-50 px-3 py-1.5 text-xs rounded-md',
            'bg-popover text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95',
            'pointer-events-none',
            className
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-solid',
              side === 'top' && [
                'top-full left-1/2 -translate-x-1/2',
                'border-t-[6px] border-x-[6px] border-x-transparent',
                'border-t-popover',
              ],
              side === 'bottom' && [
                'bottom-full left-1/2 -translate-x-1/2',
                'border-b-[6px] border-x-[6px] border-x-transparent',
                'border-b-popover',
              ],
              side === 'left' && [
                'left-full top-1/2 -translate-y-1/2',
                'border-l-[6px] border-y-[6px] border-y-transparent',
                'border-l-popover',
              ],
              side === 'right' && [
                'right-full top-1/2 -translate-y-1/2',
                'border-r-[6px] border-y-[6px] border-y-transparent',
                'border-r-popover',
              ]
            )}
          />
        </div>
      )}
    </>
  );
};

// Simple tooltip provider for managing multiple tooltips
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};