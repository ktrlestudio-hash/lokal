import React, { useEffect, useMemo, useState } from 'react';
import { deriveColorPalette, resolvePagina, getSeccionesActivas } from './utils.js';
import { buildPreviewTienda } from './mockData.js';
import { LogoSymbol, KtrlMark } from '../Brand.jsx';

// Auto-detecta todos los templates en ./templates/*.jsx
// Cada template exporta su componente (TemplateXxx) + META { label, desc }
const TEMPLATE_MODULES = import.meta.glob('./templates/*.jsx', { eager: true });

function buildTemplateMaps() {
  const components = {};
  const meta = {};
  for (const [path, mod] of Object.entries(TEMPLATE_MODULES)) {
    const key = path.replace('./templates/', '').replace('.jsx', '');
    const comp = Object.entries(mod).find(([k, v]) => k.startsWith('Template') && typeof v === 'function');
    if (comp) components[key] = comp[1];
    if (mod.META) meta[key] = mod.META;
  }
  return { components, meta };
}

const { components: TEMPLATES, meta: TEMPLATES_META } = buildTemplateMaps();
export { TEMPLATES_META };

export function TiendaPublicaRenderer({ tienda, paginaOverride = null, previewMode = false }) {
  const pagina = useMemo(() => resolvePagina(paginaOverride ?? tienda.pagina), [tienda, paginaOverride]);
  const secciones = useMemo(() => getSeccionesActivas(pagina.secciones), [pagina]);

  const tiendaConDatos = useMemo(() => {
    if (!previewMode) return tienda;
    const base = buildPreviewTienda(tienda, tienda?.productos || []);
    return { ...tienda, ...base, productos: base._productos };
  }, [tienda, previewMode]);

  const [cart, setCart] = useState([]);
  const [note, setNote] = useState('');

  const onAdd = (producto) => setCart(prev => {
    const ex = prev.find(i => i.id === producto.id);
    if (ex) return prev.map(i => i.id === producto.id ? { ...i, qty: i.qty + 1 } : i);
    const item = {
      ...producto,
      nombre: producto.nombre || producto.titulo || '',
      foto:   producto.foto || producto.fotos?.[0] || producto.galeria?.[0] || null,
      qty: 1,
    };
    return [...prev, item];
  });
  const onRemove = (id) => setCart(prev => {
    const ex = prev.find(i => i.id === id);
    if (!ex) return prev;
    if (ex.qty === 1) return prev.filter(i => i.id !== id);
    return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
  });

  useEffect(() => {
    const vars = deriveColorPalette(pagina.color, pagina.modoOscuro);
    const el = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach(k => el.style.removeProperty(k));
  }, [pagina.color, pagina.modoOscuro]);

  const Template = TEMPLATES[pagina.template] ?? TEMPLATES['detail'];

  const dark = pagina.modoOscuro;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--tp-bg)', fontFamily: 'inherit' }}>
      <Template
        tienda={tiendaConDatos}
        secciones={secciones}
        cart={cart}
        onAdd={onAdd}
        onRemove={onRemove}
        note={note}
        isDark={dark}
      />

      {/* Footer de marca — aparece en todas las plantillas */}
      {!previewMode && (
        <footer style={{
          borderTop: `1px solid ${dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`,
          padding: '20px 24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: dark ? '#060d1a' : '#f1f5f9',
        }}>
          {/* Logo Lokal */}
          <a href="https://lokalbovril.netlify.app" target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:7, textDecoration:'none', color: dark ? 'rgba(255,255,255,.35)' : '#94a3b8' }}>
            <LogoSymbol size={18} color="currentColor" />
            <span style={{ fontSize:13, fontWeight:800, letterSpacing:'0.01em', fontFamily:"'Inter', system-ui, sans-serif" }}>lokal</span>
          </a>

          {/* Creado por KTRL */}
          <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none', color: dark ? 'rgba(255,255,255,.2)' : '#cbd5e1' }}>
            <span style={{ fontSize:10, fontWeight:600, fontFamily:"'Inter', system-ui, sans-serif" }}>Creado por</span>
            <KtrlMark style={{ height:11, color:'currentColor' }} />
          </a>
        </footer>
      )}
    </div>
  );
}
