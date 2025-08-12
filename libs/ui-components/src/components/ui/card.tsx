import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva('rounded-xl text-card-foreground transition-all duration-300', {
  variants: {
    variant: {
      default: 'border bg-card shadow-sm',
      glass: 'bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg',
      gradient: 'bg-gradient-to-br from-card via-card/95 to-card border border-border/50',
      elevated: 'bg-card shadow-xl hover:shadow-2xl hover:-translate-y-1',
      outlined: 'border-2 border-border bg-transparent',
      ghost: 'border-none shadow-none bg-transparent',
    },
    padding: {
      none: '',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
    glow: {
      none: '',
      subtle: 'shadow-lg shadow-primary/5',
      medium: 'shadow-xl shadow-primary/10',
      strong: 'shadow-2xl shadow-primary/20',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
    glow: 'none',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, glow, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding, glow }),
        hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
