/**
 * Button Component (MEJORADO con Motion)
 * Botón reutilizable con múltiples variantes
 * Ahora con whileHover, whileTap y ripple effect opcional
 */

import React, { ButtonHTMLAttributes, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
}

const variantClasses = {
  primary:
    'bg-cyan-500 hover:bg-cyan-600 text-white dark:bg-cyan-600 dark:hover:bg-cyan-700 shadow-sm',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-900 dark:hover:bg-slate-800 dark:text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 shadow-sm',
  success: 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 shadow-sm',
};

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-6 py-3 text-base font-medium',
};

/**
 * Button Component
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="danger" loading={isDeleting}>Delete</Button>
 * <Button ripple>Con efecto ripple</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled,
  children,
  className,
  ripple = false,
  ...props
}: ButtonProps) {
  const baseClass =
    'font-medium transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 justify-center relative overflow-hidden';

  const widthClass = fullWidth ? 'w-full' : '';
  const combinedClass = `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className || ''}`;

  // Ripple effect state
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples((prev) => [...prev, { x, y, id }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }
      props.onClick?.(e);
    },
    [ripple, props]
  );

  const content = (
    <>
      {icon && iconPosition === 'left' && !loading && <span className="flex items-center">{icon}</span>}
      {loading && (
        <motion.span
          className="inline-flex"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </motion.span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && <span className="flex items-center">{icon}</span>}

      {/* Ripple effects */}
      {ripple &&
        ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
    </>
  );

  return (
    <motion.button
      ref={buttonRef}
      className={combinedClass}
      disabled={disabled || loading}
      onClick={handleClick}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {content}
    </motion.button>
  );
}
