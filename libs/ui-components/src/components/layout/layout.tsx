import * as React from 'react';
import { cn } from '../../lib/utils';

export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: 'sm' | 'default' | 'lg';
  sidebarCollapsed?: boolean;
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ 
    className,
    sidebar,
    header,
    footer,
    sidebarWidth = 'default',
    sidebarCollapsed = false,
    children,
    ...props 
  }, ref) => {
    const sidebarWidthClasses = {
      sm: sidebarCollapsed ? 'w-16' : 'w-48',
      default: sidebarCollapsed ? 'w-16' : 'w-64',
      lg: sidebarCollapsed ? 'w-16' : 'w-80',
    };

    return (
      <div
        ref={ref}
        className={cn('flex h-screen bg-background', className)}
        {...props}
      >
        {/* Sidebar */}
        {sidebar && (
          <aside 
            className={cn(
              'flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
              sidebarWidthClasses[sidebarWidth]
            )}
          >
            {sidebar}
          </aside>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          {header && (
            <header className="flex-shrink-0 border-b border-border bg-card">
              {header}
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>

          {/* Footer */}
          {footer && (
            <footer className="flex-shrink-0 border-t border-border bg-card">
              {footer}
            </footer>
          )}
        </div>
      </div>
    );
  }
);

Layout.displayName = 'Layout';

// Header Component
export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, title, subtitle, actions, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn('flex items-center justify-between p-6', className)}
      {...props}
    >
      <div className="flex flex-col">
        {title && (
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </header>
  )
);

Header.displayName = 'Header';

// Sidebar Component
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, collapsed = false, children, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(
        'flex flex-col h-full p-4',
        collapsed && 'items-center px-2',
        className
      )}
      {...props}
    >
      {children}
    </nav>
  )
);

Sidebar.displayName = 'Sidebar';

// Footer Component
export interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, children, ...props }, ref) => (
    <footer
      ref={ref}
      className={cn('p-4 text-center text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </footer>
  )
);

Footer.displayName = 'Footer';

export { Layout, Header, Sidebar, Footer };