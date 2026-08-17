// useTiendaPatch — PATCH genérico de datos de tienda (foto, galería,
// horarios, perfil, página pública — 5+ call sites en StoreApp.jsx que
// mandan un patch parcial contra /tiendas-crud). Tercer hook de datos de la
// Fase 3, mismo criterio que useProductosOfertas/useInbox: mueve el
// fetch+wiring, no la lógica de qué campos arma cada formulario (eso sigue
// en cada call site, que sabe su propio dominio — foto, horarios, etc.).
import { useCallback } from 'react';
import { apiFetch } from '../../api';

const API_BASE = '/.netlify/functions';

export function useTiendaPatch({ tiendaId, setTienda, onTiendaUpdate }) {
  return useCallback(async (patch) => {
    const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
      method: 'PATCH',
      authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tiendaId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');
    setTienda(data);
    onTiendaUpdate(data);
    return data;
  }, [tiendaId, setTienda, onTiendaUpdate]);
}
