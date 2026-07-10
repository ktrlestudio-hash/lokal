import { useEffect } from 'react';

// Swipe desde el borde izquierdo (≤30px) → dispara onBack
export function useSwipeBack(onBack, enabled = true) {
  useEffect(() => {
    if (!enabled || !onBack) return;
    let startX = null;
    let startY = null;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (t.clientX > 30) return; // solo desde borde izq
      startX = t.clientX;
      startY = t.clientY;
    };

    const onTouchEnd = (e) => {
      if (startX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > 60 && dy < 80) onBack(); // swipe derecha
      startX = null;
      startY = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onBack, enabled]);
}
