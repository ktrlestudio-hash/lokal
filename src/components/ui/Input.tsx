/**
 * Input Component
 * Campo de entrada reutilizable con validación
 */

import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
}

const variantClasses = {
  default:
    'border-slate-300 focus:border-brand dark:border-slate-600 dark:bg-surface-card-2 dark:text-white',
  outlined:
    'border-2 border-slate-300 focus:border-brand dark:border-slate-600 dark:bg-surface-card-2 dark:text-white',
  filled: 'border-b-2 border-slate-300 focus:border-brand bg-surface-card-2 dark:bg-surface-card-2 dark:text-white',
};

/**
 * Input Component
 * @example
 * <Input label="Email" type="email" placeholder="user@example.com" />
 * <Input error="Invalid email" type="email" />
 */
export function Input({
  label,
  error,
  helper,
  icon,
  variant = 'default',
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random()}`;
  const baseClass =
    'w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-0 dark:focus:ring-offset-surface-card';
  const errorClass = error ? 'border-red-500 focus:border-red-500' : '';
  const iconClass = icon ? 'pl-10' : '';

  const combinedClass = `${baseClass} ${variantClasses[variant]} ${errorClass} ${iconClass} ${className || ''}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-2.5 text-ink-dim flex items-center">{icon}</div>}
        <input id={inputId} className={combinedClass} {...props} />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {helper && !error && <p className="text-xs text-ink-dim mt-1">{helper}</p>}
    </div>
  );
}
