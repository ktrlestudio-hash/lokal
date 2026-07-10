import { useEffect, useRef } from 'react';

// Guarda y restaura la posición de scroll por screen key
export function useScrollMemory(key) {
  const ref = useRef(null);

  // Restaurar al montar
  useEffect(() => {
    if (!ref.current || !key) return;
    const saved = sessionStorage.getItem(`lokal-scroll-${key}`);
    if (saved) ref.current.scrollTop = Number(saved);
  }, [key]);

  // Guardar al desmontar y en scroll (throttled)
  useEffect(() => {
    const el = ref.current;
    if (!el || !key) return;
    let timer;
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(`lokal-scroll-${key}`, String(el.scrollTop));
      }, 150);
    };
    el.addEventListener('scroll', save, { passive: true });
    return () => {
      el.removeEventListener('scroll', save);
      clearTimeout(timer);
      sessionStorage.setItem(`lokal-scroll-${key}`, String(el.scrollTop));
    };
  }, [key]);

  return ref;
}
