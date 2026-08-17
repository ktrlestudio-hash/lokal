/**
 * CarritoPublica — contenedor de datos para /:tienda/c/:carrito.
 * Hace el fetch de la tienda + el pedido puntual y monta CarritoIndividual.
 * Mismo patrón que OfertaPublica.jsx.
 *
 * El link lo comparte el CLIENTE con el vendedor (o al revés, como
 * confirmación) por WhatsApp; el SSR (carrito-og edge function) responde a
 * los crawlers con OG y deja pasar a los humanos a esta ruta React.
 */
import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { CarritoIndividual } from './tienda-publica/CarritoIndividual.jsx';
import { InlineLoader } from './LokalLoader.jsx';

const API_BASE = '/.netlify/functions';

export default function CarritoPublica({ tiendaSlug, carritoSlug, firebaseUser, isDark, toggleTheme, onVolver }) {
  const [tienda, setTienda] = useState(null);
  const [carrito, setCarrito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/carrito?tiendaSlug=${encodeURIComponent(tiendaSlug)}&carritoSlug=${encodeURIComponent(carritoSlug)}`);
        if (!res.ok) throw new Error('Pedido no encontrado');
        const data = await res.json();
        if (!data?.carrito || !data?.tienda) throw new Error('Pedido no encontrado');
        if (vivo) { setTienda(data.tienda); setCarrito(data.carrito); }
      } catch (err) {
        if (vivo) setError(err.message);
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [tiendaSlug, carritoSlug]);

  // El dueño puede confirmar/cancelar — comparado por uid de Firebase, mismo
  // criterio que TiendaPublica usa para detectar "el visitante logueado es
  // el dueño de esta tienda". Si nadie inició sesión (el caso normal para
  // quien solo abre el link), esDueno es directamente false.
  const esDueno = !!(firebaseUser && tienda && firebaseUser.uid === tienda.googleUid);

  const cambiarEstado = async (nuevoEstado) => {
    const token = await firebaseUser.getIdToken();
    const res = await fetch(`${API_BASE}/carrito`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: carrito.id, estado: nuevoEstado }),
    });
    if (!res.ok) throw new Error('No se pudo actualizar el pedido');
    const actualizado = await res.json();
    setCarrito(actualizado);
  };

  if (loading) return <InlineLoader />;

  if (error || !carrito || !tienda) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'rgb(var(--surface-dim))' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Pedido no encontrado</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Este link puede estar vencido o el pedido ya no está disponible.</p>
        <a href={`/${tiendaSlug}`} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-2xl text-sm text-white" style={{ background: 'var(--brand-hex)' }}>
          Ver la tienda
        </a>
      </div>
    </div>
  );

  return (
    <CarritoIndividual
      tienda={tienda}
      carrito={carrito}
      esDueno={esDueno}
      onCambiarEstado={cambiarEstado}
      isDark={isDark}
      toggleTheme={toggleTheme}
      onVolver={onVolver}
    />
  );
}
