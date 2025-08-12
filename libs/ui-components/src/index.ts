// Styles
import './styles/globals.css';

// Utilities
export { cn, generateId, formatFileSize, truncateText, debounce, get } from './lib/utils';

// UI Components
export { Button, buttonVariants } from './components/ui/button';
export type { ButtonProps } from './components/ui/button';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
} from './components/ui/card';
export type { CardProps } from './components/ui/card';

export { Input, inputVariants } from './components/ui/input';
export type { InputProps } from './components/ui/input';

export { Badge, badgeVariants } from './components/ui/badge';
export type { BadgeProps } from './components/ui/badge';

export { Loading, loadingVariants } from './components/ui/loading';
export type { LoadingProps } from './components/ui/loading';

export {
  Skeleton,
  SkeletonContainer,
  SkeletonCard,
  SkeletonTableRow,
} from './components/ui/skeleton';
export type { SkeletonProps } from './components/ui/skeleton';

export { DataTable, dataTableVariants } from './components/ui/data-table';
export type { DataTableProps, Column } from './components/ui/data-table';

export { Select, selectVariants } from './components/ui/select';
export type { SelectProps, SelectOption } from './components/ui/select';

export { Modal, ConfirmModal } from './components/ui/modal';
export type { ModalProps, ConfirmModalProps } from './components/ui/modal';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from './components/ui/tabs';

export { Tooltip, TooltipProvider } from './components/ui/tooltip';
export type { TooltipProps } from './components/ui/tooltip';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './components/ui/dropdown-menu';
export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
} from './components/ui/dropdown-menu';

export { Textarea, textareaVariants } from './components/ui/textarea';
export type { TextareaProps } from './components/ui/textarea';

// Layout Components
export { Layout, Header, Sidebar, Footer } from './components/layout/layout';
export type {
  LayoutProps,
  HeaderProps,
  SidebarProps,
  FooterProps,
} from './components/layout/layout';

// Re-export commonly used types and utilities from dependencies
export type { VariantProps } from 'class-variance-authority';
