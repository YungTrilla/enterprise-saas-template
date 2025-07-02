import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const loadingVariants = cva('', {
  variants: {
    variant: {
      spinner: 'animate-spin rounded-full border-2 border-gray-300 border-t-primary',
      pulse: 'animate-pulse bg-muted rounded',
      dots: 'flex space-x-1',
      bars: 'flex space-x-1 items-end',
    },
    size: {
      sm: '',
      default: '',
      lg: '',
      xl: '',
    },
  },
  defaultVariants: {
    variant: 'spinner',
    size: 'default',
  },
});

const sizeClasses = {
  spinner: {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  },
  pulse: {
    sm: 'h-4',
    default: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
  },
  dots: {
    sm: 'h-2 w-2',
    default: 'h-3 w-3',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5',
  },
  bars: {
    sm: 'w-1 h-4',
    default: 'w-1 h-6',
    lg: 'w-1.5 h-8',
    xl: 'w-2 h-10',
  },
};

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string;
  overlay?: boolean;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ 
    className, 
    variant = 'spinner', 
    size = 'default', 
    text,
    overlay = false,
    ...props 
  }, ref) => {
    const renderSpinner = () => (
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses.spinner[size || 'default']
        )}
      />
    );

    const renderPulse = () => (
      <div className="space-y-2 w-full">
        <div className={cn('animate-pulse bg-muted rounded-md', sizeClasses.pulse[size || 'default'])} />
        <div className={cn('animate-pulse bg-muted rounded-md', sizeClasses.pulse[size || 'default'], 'w-3/4')} />
        <div className={cn('animate-pulse bg-muted rounded-md', sizeClasses.pulse[size || 'default'], 'w-1/2')} />
      </div>
    );

    const renderDots = () => (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-primary animate-pulse',
              sizeClasses.dots[size || 'default']
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    );

    const renderBars = () => (
      <div className="flex space-x-1 items-end">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-primary animate-pulse rounded-sm',
              sizeClasses.bars[size || 'default']
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1.2s',
            }}
          />
        ))}
      </div>
    );

    const renderLoading = () => {
      switch (variant) {
        case 'pulse':
          return renderPulse();
        case 'dots':
          return renderDots();
        case 'bars':
          return renderBars();
        case 'spinner':
        default:
          return renderSpinner();
      }
    };

    const content = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center',
          text && 'space-y-2',
          className
        )}
        {...props}
      >
        {renderLoading()}
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    );

    if (overlay) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {content}
        </div>
      );
    }

    return content;
  }
);

Loading.displayName = 'Loading';

export { Loading, loadingVariants };