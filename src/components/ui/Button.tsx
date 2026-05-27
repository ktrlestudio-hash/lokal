/**
 * Button Component
 * Botón reutilizable con múltiples variantes
 */

import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
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
  ...props
}: ButtonProps) {
  const baseClass =
    'font-medium transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 justify-center';

  const widthClass = fullWidth ? 'w-full' : '';
  const combinedClass = `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className || ''}`;

  const content = (
    <>
      {icon && iconPosition === 'left' && !loading && <span className="flex items-center">{icon}</span>}
      {loading && (
        <span className="inline-flex">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && <span className="flex items-center">{icon}</span>}
    </>
  );

  return (
    <button className={combinedClass} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
