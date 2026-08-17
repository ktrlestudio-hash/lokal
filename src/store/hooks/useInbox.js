// useInbox — encapsula el estado + fetch del inbox de mensajes de la
// tienda (segundo hook de datos de la Fase 3, mismo criterio que
// useProductosOfertas: separar estado compartido de layout sin tocar JSX).
// Las mutaciones puntuales de una conversación (enviar reply, editar
// mensaje, borrar adjunto) siguen viviendo en StoreApp.jsx — están
// entrelazadas con estado de UI del formulario de chat (inboxReply,
// chatAttachment, editingMsg) que no es del dominio de "datos del inbox" en
// sí, así que moverlas ahora no simplifica nada, solo agrega indirección.
// Este hook solo cubre lo que SÍ es puramente estado+fetch: la lista de
// conversaciones y si está cargando.
import { useState, useCallback } from 'react';
import { apiFetch } from '../../api';

const API_BASE = '/.netlify/functions';

export function useInbox() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInbox = useCallback(async (storeId) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/messages?storeInbox=1&storeId=${storeId}`, { authRequired: true });
      if (res.ok) {
        const data = await res.json();
        setConvos(data.conversations || []);
      }
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, []);

  return { convos, setConvos, loading, fetchInbox };
}
