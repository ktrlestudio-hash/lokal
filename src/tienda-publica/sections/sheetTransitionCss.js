// CSS de transición compartido por todos los bottom sheets — overlay fade
// + panel slide-up, en dos pasos vía useSheetOpen (mounted/visible).
export const SHEET_TRANSITION_CSS = `
.tp-sheet-ov { opacity: 0; transition: opacity .22s ease; }
.tp-sheet-ov.in { opacity: 1; }
.tp-sheet-panel { transform: translateY(100%); transition: transform .26s cubic-bezier(0.32,0.72,0,1); }
.tp-sheet-panel.in { transform: translateY(0); }
/* Scroll interno sin barra visible — el contenido sigue siendo scrolleable
   (touch/rueda/teclado), solo se oculta el indicador. Estándar en UI mobile:
   la barra apareciendo/desapareciendo de golpe rompe la sensación de sheet
   "sólido" — Firefox/estándar (scrollbar-width) + WebKit (::-webkit-scrollbar). */
.tp-sheet-scroll { scrollbar-width: none; -ms-overflow-style: none; }
.tp-sheet-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
`;
