import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'shimmer';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant = 'default',
    width,
    height,
    animation = 'pulse',
    style,
    ...props 
  }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'text':
          return 'h-4 w-full rounded';
        case 'circular':
          return 'rounded-full';
        case 'rectangular':
          return 'rounded-lg';
        default:
          return 'rounded-lg';
      }
    };

    const getAnimationClasses = () => {
      switch (animation) {
        case 'wave':
          return 'skeleton-wave';
        case 'shimmer':
          return 'skeleton-shimmer';
        default:
          return 'animate-pulse';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-muted',
          getVariantClasses(),
          getAnimationClasses(),
          className
        )}
        style={{
          width: width,
          height: height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Skeleton container for grouping multiple skeletons
interface SkeletonContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  spacing?: 'sm' | 'md' | 'lg';
}

const SkeletonContainer = React.forwardRef<HTMLDivElement, SkeletonContainerProps>(
  ({ className, children, count = 1, spacing = 'md', ...props }, ref) => {
    const spacingClasses = {
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
    };

    if (count > 1 && !children) {
      return (
        <div
          ref={ref}
          className={cn(spacingClasses[spacing], className)}
          {...props}
        >
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SkeletonContainer.displayName = 'SkeletonContainer';

// Card skeleton preset
const SkeletonCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      <Skeleton variant="rectangular" height={200} />
      <div className="space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
};

// Table row skeleton preset
const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  );
};

export { Skeleton, SkeletonContainer, SkeletonCard, SkeletonTableRow };