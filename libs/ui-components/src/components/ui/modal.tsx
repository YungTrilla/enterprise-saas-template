import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, closeOnEscape]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      role='dialog'
      aria-modal='true'
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black/50 animate-in fade-in-0'
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden='true'
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-background rounded-lg shadow-xl',
          'animate-in fade-in-0 zoom-in-95',
          'w-full mx-4',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className='flex items-start justify-between p-6 border-b'>
            <div>
              {title && (
                <h2 id='modal-title' className='text-lg font-semibold'>
                  {title}
                </h2>
              )}
              {description && (
                <p id='modal-description' className='mt-1 text-sm text-muted-foreground'>
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button variant='ghost' size='sm' onClick={onClose} className='ml-4'>
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className='p-6 max-h-[calc(100vh-200px)] overflow-y-auto'>{children}</div>

        {/* Footer */}
        {footer && <div className='flex items-center justify-end gap-2 p-6 border-t'>{footer}</div>}
      </div>
    </div>
  );
};

// Convenience component for confirm dialogs
export interface ConfirmModalProps extends Omit<ModalProps, 'footer' | 'children'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'success';
  onConfirm: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'default',
  onConfirm,
  onClose,
  loading = false,
  ...props
}) => {
  return (
    <Modal
      {...props}
      onClose={onClose}
      footer={
        <>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => {
              onConfirm();
              if (!loading) {
                onClose();
              }
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
    >
      <p className='text-sm'>{message}</p>
    </Modal>
  );
};
