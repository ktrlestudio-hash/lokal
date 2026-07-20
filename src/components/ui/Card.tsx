/**
 * Card Component
 * Contenedor para agrupar contenido
 */

import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  bordered?: boolean;
}

/**
 * Card Component
 * @example
 * <Card>
 *   <Card.Header>Título</Card.Header>
 *   <Card.Body>Contenido</Card.Body>
 *   <Card.Footer>Pie</Card.Footer>
 * </Card>
 */
export function Card({ hoverable = false, bordered = true, className, children, ...props }: CardProps) {
  const baseClass =
    'bg-surface-card rounded-lg shadow-sm transition-shadow duration-200';
  const hoverClass = hoverable ? 'hover:shadow-md' : '';
  const borderClass = bordered ? 'border border-slate-200 dark:border-slate-700' : '';

  const combinedClass = `${baseClass} ${hoverClass} ${borderClass} ${className || ''}`;

  return (
    <div className={combinedClass} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Header
 */
function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Body
 */
function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 border-t border-slate-200 dark:border-slate-700 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
