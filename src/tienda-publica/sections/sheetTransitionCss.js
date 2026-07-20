// CSS de transición compartido por todos los bottom sheets — overlay fade
// + panel slide-up, en dos pasos vía useSheetOpen (mounted/visible).
export const SHEET_TRANSITION_CSS = `
.tp-sheet-ov { opacity: 0; transition: opacity .22s ease; }
.tp-sheet-ov.in { opacity: 1; }
.tp-sheet-panel { transform: translateY(100%); transition: transform .26s cubic-bezier(0.32,0.72,0,1); }
.tp-sheet-panel.in { transform: translateY(0); }
`;
