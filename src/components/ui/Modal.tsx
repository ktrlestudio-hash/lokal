/**
 * Modal Component
 * Diálogo modal para confirmaciones e información
 */

import React, { ReactNode, useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Modal Component
 * @example
 * <Modal isOpen={isOpen} onClose={close} title="Confirmación">
 *   ¿Estás seguro?
 *   <Modal.Footer>
 *     <Button onClick={close}>Cancelar</Button>
 *     <Button variant="primary" onClick={confirm}>Confirmar</Button>
 *   </Modal.Footer>
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-screen overflow-y-auto ${sizeClasses[size]}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {closeButton && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Modal Footer
 */
interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right';
}

function ModalFooter({ align = 'right', className, children, ...props }: ModalFooterProps) {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align];

  return (
    <div className={`flex gap-2 ${alignClass} ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

Modal.Footer = ModalFooter;

/**
 * Alert Dialog Component
 * Modal simplificado para alertas
 */
interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'info',
}: AlertDialogProps) {
  const variantColors = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="mb-4">
        <p className={`text-sm ${variantColors[variant]}`}>{message}</p>
      </div>
      <Modal.Footer align="right">
        <Button variant="ghost" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'error' ? 'danger' : variant === 'success' ? 'success' : 'primary'}
          onClick={() => {
            onConfirm?.();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
