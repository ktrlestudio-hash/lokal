import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', text = null, className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-brand`} />
      {text && <p className="text-sm text-ink-dim">{text}</p>}
    </div>
  );
}
