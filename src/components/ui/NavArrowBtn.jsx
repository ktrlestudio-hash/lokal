import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function NavArrowBtn({ onClick, dir = 'right', className = '' }) {
  return (
    <button onClick={onClick}
      className={`nav-arrow flex items-center justify-center rounded-full transition-all duration-200 ${className}`}>
      {dir === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );
}
