import { useEffect, useState } from 'react';

/**
 * Ciclo de animación de entrada/salida compartido por todos los bottom
 * sheets de tienda-publica (ShareSheet, HorariosSheet, CartSheet,
 * FiltrosSheet, OrdenarSheet). `open` es la prop externa (booleana); el
 * hook devuelve `mounted` (si hay que renderizar el DOM) y `visible` (si
 * hay que aplicar las clases "entrado" — el toggle en dos pasos con
 * requestAnimationFrame es lo que dispara la transición CSS en vez de
 * aparecer/desaparecer de golpe).
 *
 * También cierra con Escape mientras está abierto — sin esto, un sheet solo
 * se cerraba con click en el overlay o el botón X, lo cual es tanto una
 * brecha de accesibilidad (usuarios de teclado) como una fuente real de UI
 * bloqueada (un sheet abierto sin querer intercepta todos los clicks
 * siguientes hasta que el usuario adivina dónde tocar para cerrarlo).
 *
 * Uso:
 *   const { mounted, visible } = useSheetOpen(open, 220, onClose);
 *   if (!mounted) return null;
 *   <div className={`sheet-overlay ${visible ? 'in' : ''}`} onClick={onClose}>
 *   <div className={`sheet-panel ${visible ? 'in' : ''}`}>
 */
export function useSheetOpen(open, duration = 220, onClose) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf1, raf2, timeout;
    if (open) {
      setMounted(true);
      // Doble rAF: un solo requestAnimationFrame puede caer en el MISMO
      // frame en que el navegador todavía no aplicó el layout inicial
      // (mounted=true, visible=false, panel en translateY(100%)) — la
      // transición "salta" directo al estado final en vez de animar. El
      // segundo rAF espera a que ese primer frame ya se haya pintado.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else if (mounted) {
      setVisible(false);
      timeout = setTimeout(() => setMounted(false), duration);
    }
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return { mounted, visible };
}
