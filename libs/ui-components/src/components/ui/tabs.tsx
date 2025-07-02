import React, { useState, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div
        className={cn(
          'w-full',
          orientation === 'vertical' && 'flex gap-4',
          className
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export const TabsList: React.FC<TabsListProps> = ({ className, children }) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsList must be used within Tabs');
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-muted p-1',
        'data-[orientation=vertical]:flex-col data-[orientation=vertical]:h-auto',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
};

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  disabled = false,
  className,
  children,
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1',
        'text-sm font-medium ring-offset-background transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className,
  children,
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const { activeTab } = context;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      id={`tabpanel-${value}`}
      tabIndex={0}
      className={cn(
        'mt-2 ring-offset-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'data-[orientation=vertical]:mt-0',
        className
      )}
    >
      {children}
    </div>
  );
};