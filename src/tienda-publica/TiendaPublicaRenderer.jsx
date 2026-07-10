import React, { useEffect, useMemo, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
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

export function TiendaPublicaRenderer({ tienda, paginaOverride = null, previewMode = false, isDark: isDarkApp, onToggleTheme }) {
  const pagina = useMemo(() => resolvePagina(paginaOverride ?? tienda.pagina), [tienda, paginaOverride]);
  const secciones = useMemo(() => getSeccionesActivas(pagina.secciones), [pagina]);

  const tiendaConDatos = useMemo(() => {
    if (!previewMode) return tienda;
    const base = buildPreviewTienda(tienda, tienda?.productos || []);
    return { ...tienda, ...base, productos: base._productos };
  }, [tienda, previewMode]);

  const [cart, setCart] = useState([]);
  const [note, setNote] = useState('');

  const onAdd = (producto, qty = 1) => setCart(prev => {
    const ex = prev.find(i => i.id === producto.id);
    if (ex) return prev.map(i => i.id === producto.id ? { ...i, qty: i.qty + qty } : i);
    const item = {
      ...producto,
      nombre: producto.nombre || producto.titulo || '',
      foto:   producto.foto || producto.fotos?.[0] || producto.galeria?.[0] || null,
      qty,
    };
    return [...prev, item];
  });
  const onRemove = (id) => setCart(prev => {
    const ex = prev.find(i => i.id === id);
    if (!ex) return prev;
    if (ex.qty === 1) return prev.filter(i => i.id !== id);
    return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
  });
  const onClear = () => setCart([]);

  // El modo claro/oscuro es UNO SOLO para toda la interfaz de LOKAL — no un
  // sub-modo aislado por tienda. Cuando se navega logueado desde dentro de
  // la app, Root.jsx pasa isDark/onToggleTheme (su estado real, compartido
  // por todas las pantallas, con su propia clase .dark en <html>) y este
  // renderer lo usa tal cual. Solo cuando se entra standalone por el link
  // público (/t/:slug, sin sesión) no existe ese theme del que colgarse —
  // ahí el renderer TAMBIÉN pone/saca la clase .dark en <html> (el mismo
  // mecanismo real que usa toda la app, no una variable nueva), sembrada con
  // pagina.modoOscuro. Así --surface-solid/--text-primary de index.css (que
  // solo cambian según esa clase real) se actualizan de verdad en los dos
  // casos, sin un segundo sistema de tokens paralelo.
  const standalone = isDarkApp === undefined;
  const [darkLocal, setDarkLocal] = useState(pagina.modoOscuro);
  const dark = standalone ? darkLocal : isDarkApp;
  const toggleDark = standalone ? () => setDarkLocal(d => !d) : onToggleTheme;

  useEffect(() => {
    if (!standalone) return undefined; // Root.jsx ya maneja su propia clase .dark
    document.documentElement.classList.toggle('dark', dark);
    return () => { if (!pagina.modoOscuro) document.documentElement.classList.remove('dark'); };
  }, [standalone, dark]);

  useEffect(() => {
    const vars = deriveColorPalette(pagina.color, dark);
    const el = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach(k => el.style.removeProperty(k));
  }, [pagina.color, dark]);

  const Template = TEMPLATES[pagina.template] ?? TEMPLATES['detail'];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--tp-bg)', fontFamily: 'inherit' }}>
      <Template
        tienda={tiendaConDatos}
        secciones={secciones}
        cart={cart}
        onAdd={onAdd}
        onRemove={onRemove}
        onClear={onClear}
        note={note}
        setNote={setNote}
        isDark={dark}
      />

      {/* Footer de marca — aparece en todas las plantillas */}
      {!previewMode && (
        <footer id="tp-footer" style={{
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Toggle claro/oscuro — el MISMO modo de toda la app cuando se
                navega logueado (afecta cualquier pantalla, no solo esta
                tienda); solo queda aislado a esta visita en el caso
                standalone del link público sin sesión. */}
            <button
              onClick={toggleDark}
              aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)',
                color: dark ? 'rgba(255,255,255,.5)' : '#64748b',
              }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Creado por KTRL */}
            <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none', color: dark ? 'rgba(255,255,255,.2)' : '#cbd5e1' }}>
              <span style={{ fontSize:10, fontWeight:600, fontFamily:"'Inter', system-ui, sans-serif" }}>Creado por</span>
              <KtrlMark style={{ height:11, color:'currentColor' }} />
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
