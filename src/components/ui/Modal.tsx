/**
 * Modal Component (MEJORADO con Motion)
 * Diálogo modal para confirmaciones e información
 * Ahora con AnimatePresence para enter/exit animations
 */

import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={`bg-surface-card rounded-lg shadow-xl max-h-screen overflow-y-auto ${sizeClasses[size]}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 28,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              {closeButton && (
                <motion.button
                  onClick={onClose}
                  className="text-ink-dim hover:text-ink text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-card-2 dark:hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-surface-card-2">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
    info: 'text-ink-dim',
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
