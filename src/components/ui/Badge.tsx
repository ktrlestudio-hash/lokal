/**
 * Badge Component
 * Etiqueta pequeña para mostrar estado o categoría
 */

import React, { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs font-medium',
  md: 'px-2.5 py-1 text-sm font-medium',
  lg: 'px-3 py-1.5 text-base font-medium',
};

/**
 * Badge Component
 * @example
 * <Badge variant="success">Activo</Badge>
 * <Badge variant="error">Rechazado</Badge>
 */
export function Badge({ variant = 'default', size = 'md', className, children, ...props }: BadgeProps) {
  const baseClass = 'inline-flex items-center rounded-full font-medium';
  const combinedClass = `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;

  return (
    <span className={combinedClass} {...props}>
      {children}
    </span>
  );
}

/**
 * Tag Component
 * Etiqueta para marcar contenido
 */
interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  removable?: boolean;
  onRemove?: () => void;
}

export function Tag({ removable = false, onRemove, className, children, ...props }: TagProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${className || ''}`} {...props}>
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-bold"
        >
          ✕
        </button>
      )}
    </span>
  );
}

/**
 * Avatar Component
 * Imagen de perfil redondeada
 */
interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'square';
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function Avatar({
  src,
  alt,
  initials,
  size = 'md',
  variant = 'circle',
  className,
  ...props
}: AvatarProps) {
  const shapeClass = variant === 'circle' ? 'rounded-full' : 'rounded-lg';
  const baseClass = `${avatarSizes[size]} ${shapeClass} bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-sm`;

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`${baseClass} object-cover ${className || ''}`}
        {...props}
      />
    );
  }

  return (
    <div className={`${baseClass} text-slate-600 dark:text-slate-300 ${className || ''}`} {...props}>
      {initials}
    </div>
  );
}
