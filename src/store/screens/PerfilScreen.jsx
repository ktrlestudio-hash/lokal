// PerfilScreen — pantalla "Mi perfil"/"Mi tienda" del admin (hero editorial
// con carrusel de portada, checklist de completitud del perfil, resumen de
// suscripción, cuenta Google). Cuarta de las 5 pantallas grandes extraídas
// en la Fase 3 — mismo criterio: props explícitas, sin rediseñar estado.
import React from 'react';
import {
  User, Camera, Edit3, Phone, Instagram, MapPin, Sparkles, Link2, Clock,
  Package, Tag, Palette, Globe, ChevronLeft, ChevronRight, ChevronDown,
  ShieldCheck, LogOut,
} from 'lucide-react';
import { isModuleActive, getEstadoApertura } from '../../tienda-publica/utils.js';
import { StorePageHeader } from '../components/StorePageHeader.jsx';

export function PerfilScreen({
  tiendaData, tiendaInfo, misProductosSinFiltrar,
  heroPhotoIdx, setHeroPhotoIdx,
  openProfileEdit, openDescripcionEditor, navigateTo,
  isDark, firebaseUser, onLogout, renderAccountAvatar,
  editingNombre, setEditingNombre, nombreDraft, setNombreDraft,
  setTienda, onTiendaUpdate,
  setPaginaForm, setPublicPageForm, setPublicPageError, setScreen, setEditingPublicPage,
  isActiva, dias,
  profileChecklistCollapsed, setProfileChecklistCollapsed,
  profileChecklistExpanded, setProfileChecklistExpanded,
  apiFetch, API_BASE,
}) {
  const galeria = tiendaData?.galeria || [];
  // Carrusel del hero — mismo patrón que el hero público real (fotosHero en
  // commerce-modern.jsx): índice de foto activa + navegación LINEAL
  // (flechas desaparecen en los extremos, no loop circular). El estado
  // (heroPhotoIdx) vive arriba, a nivel de StoreApp.
  const heroFotos = galeria.length > 0 ? galeria : [];
  const heroMultiFoto = heroFotos.length > 1;
  const heroPhotoIdxClamped = Math.min(heroPhotoIdx, Math.max(0, heroFotos.length - 1));

  // Profile completion — este array es la ÚNICA fuente de verdad: tanto el
  // anillo de % como las filas visuales de "Contacto e info" (más abajo) se
  // generan desde acá. Antes eran dos cosas separadas: el anillo contaba 12
  // ítems pero solo 4 aparecían como filas, así que el % nunca coincidía
  // con lo que el dueño podía ver/completar desde ahí (auditoría UX,
  // hallazgo A5). Cada ítem es un ACCESO DIRECTO al editor real de esa
  // cosa — la lista no tiene inputs propios, solo invita e indica estado
  // (ver auditoría, hallazgo B5: "invitador", no editor).
  //
  // 4 categorías, en el orden en que un dueño nuevo las necesita:
  //  1) Perfil básico — identidad de la tienda.
  //  2) Configuración — setup de la página pública.
  //  3) Contenido — lo que de verdad hace que la tienda sirva de algo.
  //  4) Personalización — opcional, estético.
  const usaCatalogoPerfil = isModuleActive(tiendaData, 'catalogo');
  const profileItems = [
    // — Perfil básico —
    { key: 'foto',        group: 'perfil', icon: User,     done: !!tiendaInfo.foto,                           label: 'Foto de perfil', action: () => openProfileEdit('foto') },
    { key: 'galeria',     group: 'perfil', icon: Camera,   done: galeria.length >= 1,                         label: 'Portada',        action: () => openProfileEdit('galeria') },
    { key: 'descripcion', group: 'perfil', icon: Edit3,    done: (tiendaInfo.descripcion || '').length >= 20, label: 'Descripción',    action: () => openProfileEdit('descripcion') },
    { key: 'telefono',    group: 'perfil', icon: Phone,    done: !!tiendaInfo.telefono,                       label: 'Teléfono / WhatsApp', action: () => openProfileEdit('telefono') },
    { key: 'instagram',   group: 'perfil', icon: Instagram,done: !!tiendaInfo.instagram,                      label: 'Instagram',      action: () => openProfileEdit('instagram') },
    // Ciudad+dirección fusionados en un solo paso "Ubicación": se completan
    // juntos desde el mismo mapa (LocationEditorModal), contarlos separados
    // infla el checklist con dos pasos que en la práctica son uno.
    { key: 'ubicacion',   group: 'perfil', icon: MapPin,   done: !!(tiendaInfo.direccion || tiendaInfo.ciudad), label: 'Ubicación', action: () => openProfileEdit('direccion') },
    { key: 'tagline',     group: 'perfil', icon: Sparkles, done: (tiendaInfo.tagline || '').length >= 5,      label: 'Tagline',        action: () => openProfileEdit('tagline') },
    // — Configuración —
    { key: 'slug',        group: 'config', icon: Link2,    done: !!tiendaInfo.slug,                           label: 'URL personalizada', action: () => openProfileEdit('slug') },
    { key: 'horarios',    group: 'config', icon: Clock,    done: !!(tiendaInfo.horarios && typeof tiendaInfo.horarios === 'object' ? Object.keys(tiendaInfo.horarios).length > 0 : tiendaInfo.horarios), label: 'Horarios', action: () => openProfileEdit('horarios') },
    // — Contenido — el paso que de verdad hace que la tienda sirva de
    // algo; antes existía SOLO en el cálculo del %, invisible como fila.
    usaCatalogoPerfil
      ? { key: 'primer-producto', group: 'contenido', icon: Package, done: misProductosSinFiltrar.length > 0, label: 'Primer producto', action: () => navigateTo('productos') }
      : { key: 'primera-oferta',  group: 'contenido', icon: Tag,     done: misProductosSinFiltrar.length > 0, label: 'Primera oferta',  action: () => navigateTo('productos') },
    // — Personalización — opcional, estético. Antes vivía enterrada en un
    // acordeón de "Editar diseño" poco descubierto (hallazgo B4).
    { key: 'color', group: 'custom', icon: Palette, done: !!(tiendaInfo.pagina?.color && tiendaInfo.pagina.color !== '#e4002b'), label: 'Color de marca', action: () => navigateTo('mi-pagina') },
  ];
  const profileDone = profileItems.filter(i => i.done).length;
  const profilePct = Math.round((profileDone / profileItems.length) * 100);
  const r = 30; // ring radius
  const circ = 2 * Math.PI * r;
  const dash = circ * (profilePct / 100);

  const { abierta: heroAbierta } = getEstadoApertura(tiendaInfo.horarios);

  return (
    <div className="h-[100dvh] flex flex-col sa-page-bg">
      {/* Sin title: el nombre de la tienda ya se lee grande en el hero de
          abajo — repetirlo acá era ruido. "Ver página" va en leftSlot
          (izquierda, no derecha): es la acción principal de esta pantalla,
          mismo botón sólido que antes vivía en la card "Diseño de mi
          página" (bg-brand, más protagónico que un ícono chico). */}
      <StorePageHeader
        title=""
        leftSlot={tiendaInfo.slug && (
          <a href={`/${tiendaInfo.slug}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shadow-sm shadow-brand/20">
            <Globe className="w-4 h-4" /><span>Ver página</span>
          </a>
        )}
      />
      <div className="flex-1 overflow-y-auto lg:pb-8 no-scrollbar">

      {/* ── Hero — clon LITERAL del hero REALMENTE en uso hoy en la vista
          pública: 'editorial' (HeroEditorial en commerce-modern.jsx, líneas
          ~1266-1430), no 'card' — TiendaPublicaRenderer.jsx tiene
          heroLayout forzado a 'editorial' (comentario "TEMP: forzado para
          preview" en la línea que arma <Template>), así que es lo que el
          dueño ve HOY en su propia tienda. Mismas clases/valores que
          .cm-hero-ed-*: foto banner de ACENTO (150px, no 240 — acá la
          info manda, no la foto), SIN card flotante separada — el logo
          (84px, radius 20) va en una fila (align-items:flex-end,
          marginTop:-40) directo contra el fondo de página, con el nombre
          en columna a su DERECHA (no centrado ni debajo). */}
      {/* Fondo del hero: MISMO azul-negro fijo que usa login (#040a14,
          AdminLogin.jsx línea 58: isDark ? '#040a14' : surface-solid) —
          pero SOLO acá, como color local del hero, NO tocando --surface-
          dim/--surface-solid globales (esa vía se probó y rompió bordes/
          cards/nav en toda la app: esos tokens alimentan --tp-bg/--tp-
          surface de la vista pública Y todo bg-surface-card/-2 del resto
          del admin, así que un valor "casi tan oscuro como el fondo"
          colapsó el contraste que muchos otros componentes daban por
          garantizado). En light sigue el token normal (var(--surface-
          solid)) — el enriquecido es un tratamiento de dark, como en
          login. El degradado de la foto funde hacia ESE MISMO color
          (heroBg), logrando la ilusión de desvanecimiento del banner
          contra el fondo real que lo rodea. */}
      <style>{`
        .sa-hero-ed-row { position: relative; z-index: 2; display: flex; align-items: flex-end; gap: 14px; padding: 0 18px; margin-top: -40px; }
        .sa-hero-ed-logo { width: 84px; height: 84px; border-radius: 20px; flex-shrink: 0; overflow: hidden;
          border: 4px solid rgb(var(--surface-solid-2-rgb)); box-shadow: 0 4px 10px rgba(0,0,0,.15); display: grid; place-items: center; }
        .dark .sa-hero-ed-logo { border-color: rgba(255,255,255,.10); box-shadow: 0 4px 14px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08); }
        .sa-hero-ed-name { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* Flechas del carrusel — clon literal de .cm-hero-arrow (hero público real) */
        .sa-hero-arrow { background: rgba(255,255,255,.9); color: #18181b; border: 1px solid rgba(0,0,0,.08);
          transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        .dark .sa-hero-arrow { background: rgba(82,82,82,.65); color: #fff; border: 1px solid rgba(255,255,255,.12); }
        @media (hover: hover) { .sa-hero-arrow:hover { filter: brightness(0.85); } }
        .sa-hero-arrow:active { transform: scale(0.93); transition: transform .06s ease; }
      `}</style>
      {/* Fondo del hero: MISMO valor que sa-page-bg (surface-dim en light,
          #040a14 en dark) — antes usaba --surface-solid (blanco de card)
          en light, un tono DISTINTO del fondo real de página, así el
          degradado de la foto (que funde hacia este color) no calzaba con
          lo que lo rodea. */}
      <header className="sa-hero-ed" style={{ position: 'relative', background: isDark ? '#040a14' : 'rgb(var(--surface-dim, 245 245 245))' }}>
        <div className="sa-hero-ed-photo" style={{ position: 'relative', overflow: 'hidden', height: 150, background: isDark ? '#040a14' : 'rgb(var(--surface-dim, 245 245 245))' }}>
          {heroFotos.length > 0
            ? heroFotos.map((src, i) => (
                <img key={src} src={src} alt=""
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    opacity: i === heroPhotoIdxClamped ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: i === heroPhotoIdxClamped ? 'auto' : 'none',
                    WebkitMaskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,.2) 40px, #000 110px)',
                    maskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,.2) 40px, #000 110px)',
                  }} />
              ))
            : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--surface-solid-2-rgb)))' }} />}
          {/* Oscurecido superior — legibilidad de flechas/dots sobre
              cualquier foto clara (mismo criterio que .cm-hero-ed-photo::before) */}
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 64, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,.3), transparent)', pointerEvents: 'none' }} />
          {/* Flechas + dots — dots ARRIBA centrado (no abajo): ahí abajo
              pisa el logo de perfil (margin-top:-40px en la fila de
              abajo), y competían por el mismo espacio visual. */}
          {heroMultiFoto && (
            <>
              {heroPhotoIdxClamped > 0 && (
                <button className="sa-hero-arrow" onClick={() => setHeroPhotoIdx(i => i - 1)} aria-label="Foto anterior"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              {heroPhotoIdxClamped < heroFotos.length - 1 && (
                <button className="sa-hero-arrow" onClick={() => setHeroPhotoIdx(i => i + 1)} aria-label="Foto siguiente"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>
                  <ChevronRight size={18} />
                </button>
              )}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[3] flex gap-1.5">
                {heroFotos.map((_, i) => (
                  <button key={i} onClick={() => setHeroPhotoIdx(i)} aria-label={`Foto ${i + 1}`}
                    className="h-[5px] rounded-full transition-all" style={{ width: i === heroPhotoIdxClamped ? 16 : 5, background: i === heroPhotoIdxClamped ? '#fff' : 'rgba(255,255,255,.5)' }} />
                ))}
              </div>
            </>
          )}
          {/* Cambiar portada — botón SIEMPRE visible (no hover): en
              mobile/táctil el hover no es confiable (no hay mouse que
              "entre" al elemento, y algunos navegadores lo disparan mal),
              así que en vez de depender de :hover para revelarlo, queda
              fijo en la esquina superior derecha — mismo lenguaje que las
              flechas del carrusel (sa-hero-arrow). */}
          <button className="sa-hero-arrow" onClick={() => openProfileEdit('portada')} aria-label="Cambiar portada"
            style={{ position: 'absolute', right: 10, top: 10, zIndex: 2, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>
            <Camera size={16} />
          </button>
        </div>

        {/* Fila logo (izquierda) + nombre (derecha) — SIN card flotante,
            directo contra el fondo de página, igual que HeroEditorial real. */}
        <div className="sa-hero-ed-row">
          {/* Wrapper SIN overflow — el badge tiene que sobresalir del
              cuadrado del logo, pero .sa-hero-ed-logo tiene overflow:
              hidden (necesario para recortar la foto/ícono adentro). Sin
              este wrapper aparte, el propio overflow:hidden del logo
              recortaba el badge que sobresalía por encima del borde. */}
          <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
            <div className="sa-hero-ed-logo" style={{ width: '100%', height: '100%', background: tiendaInfo.foto ? 'rgb(var(--brand) / .15)' : 'rgb(var(--brand))' }}>
              {tiendaInfo.foto
                ? <img src={tiendaInfo.foto} alt="" className="w-full h-full object-cover" />
                : <User size={40} color="#fff" />}
            </div>
            {/* Badge de lápiz SIEMPRE visible (no overlay por hover): en
                mobile/táctil el hover no es confiable — mismo criterio
                que el botón de portada de arriba. */}
            <button onClick={() => openProfileEdit('foto')} aria-label="Cambiar foto de perfil"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-md border-2"
              style={{ borderColor: isDark ? '#040a14' : 'var(--surface-solid, #fff)' }}>
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {editingNombre ? (
                <input
                  autoFocus
                  value={nombreDraft}
                  onChange={e => setNombreDraft(e.target.value)}
                  onBlur={async () => {
                    setEditingNombre(false);
                    const trim = nombreDraft.trim();
                    if (!trim || trim === tiendaInfo.nombre) return;
                    try {
                      const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
                        method: 'PATCH', authRequired: true,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: tiendaData.id, nombre: trim }),
                      });
                      if (res.ok) { const u = await res.json(); setTienda(u); onTiendaUpdate(u); }
                    } catch { /* silencioso */ }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.target.blur();
                    if (e.key === 'Escape') { setEditingNombre(false); setNombreDraft(tiendaInfo.nombre || ''); }
                  }}
                  className="sa-hero-ed-name bg-transparent border-b-2 border-brand outline-none max-w-[220px]"
                  maxLength={120}
                />
              ) : (
                <h1
                  className="sa-hero-ed-name cursor-pointer hover:opacity-70 transition-opacity inline-flex items-center gap-1"
                  onClick={() => { setNombreDraft(tiendaInfo.nombre || ''); setEditingNombre(true); }}
                >
                  {tiendaInfo.nombre}
                  {/* Lápiz siempre visible (no hover): en mobile no hay
                      forma de "pasar el mouse" para descubrirlo. */}
                  <Edit3 className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </h1>
              )}
            </div>
            {/* Descripción — reemplaza el botón "Descripción" que vivía en
                la fila separada bajo el hero. Con texto: se muestra
                clickeable (mismo lugar donde se lee en la vista pública).
                Sin texto: placeholder tipo "+ agregar", mismo lenguaje
                punteado que el resto del checklist. */}
            {tiendaInfo.descripcion ? (
              <p onClick={openDescripcionEditor}
                className="text-xs text-ink-dim mt-1 cursor-pointer hover:text-brand transition-colors line-clamp-2">
                {tiendaInfo.descripcion}
              </p>
            ) : (
              <button onClick={openDescripcionEditor}
                className="text-xs text-brand font-semibold mt-1 hover:underline">
                + Agregar descripción
              </button>
            )}
            {(tiendaInfo.horarios && Object.keys(tiendaInfo.horarios).length > 0) && (
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={heroAbierta ? { background: 'color-mix(in srgb, #22C55E 14%, transparent)', color: '#22C55E' } : { background: 'color-mix(in srgb, #ef4444 14%, transparent)', color: '#ef4444' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: heroAbierta ? '#22C55E' : '#ef4444' }} />
                  {heroAbierta ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Acciones rápidas — reemplaza la vieja fila de Ver página /
          Portada / Descripción (esas se integraron donde corresponde
          visualmente: "Ver página" en el header, "Portada" como hover
          sobre la foto, "Descripción" bajo el título del hero). Este
          hueco ahora tiene lo que SÍ quedaba suelto sin atajo rápido:
          editar diseño y editar URL — antes solo vivían más abajo del
          todo, en la card "Diseño de mi página". */}
      <div className="max-w-3xl mx-auto px-5 lg:px-8 pt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setPaginaForm({ template: tiendaInfo.pagina?.template || 'commerce-modern', color: tiendaInfo.pagina?.color || '#e4002b', modoOscuro: tiendaInfo.pagina?.modoOscuro || false });
            setPublicPageForm({ slug: tiendaInfo.slug || '', tagline: tiendaInfo.tagline || '', whatsapp: tiendaInfo.whatsapp || tiendaInfo.telefono || '', instagram: tiendaInfo.instagram || '' });
            setPublicPageError(null);
            setScreen('mi-pagina');
          }}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-card dark:bg-white/8 text-xs font-bold hover:bg-brand/10 hover:text-brand transition-colors">
          <Palette className="w-3.5 h-3.5" /> Editar diseño
        </button>
        <button
          onClick={() => {
            setPublicPageForm(f => ({ ...f, slug: tiendaInfo.slug || '' }));
            setPublicPageError(null);
            setEditingPublicPage(true);
          }}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-card dark:bg-white/8 text-xs font-bold hover:bg-brand/10 hover:text-brand transition-colors">
          <Link2 className="w-3.5 h-3.5" /> Editar URL
        </button>
      </div>

      {/* El chip de "Rubro" se sacó de acá — ver auditoría UX hallazgo A3:
          solo se usa al CREAR la tienda para el preset inicial de módulos
          (Catálogo vs. Ofertas, ver netlify/functions/_lib/modules.js);
          cambiarlo después no mueve nada, y las categorías disponibles
          están cableadas a comida rápida (no aplican a una tienda de
          ofertas). Ocupaba una franja entera sugiriendo una importancia
          que no tiene. El dato tienda.rubros se sigue guardando. */}

      <div className="max-w-3xl mx-auto px-5 lg:px-8 mt-5 space-y-5">

        {/* ── Suscripción — resumen, detalle completo en su propia pantalla.
            El conteo de ofertas activas se sacó de acá: es redundante con
            Estadísticas y tiene más sentido como barra de resumen dentro
            de OfertasScreen (contexto de gestión), no en el perfil general. */}
        <button onClick={() => navigateTo('suscripcion')} className="w-full flex items-center gap-3 bg-surface-card rounded-2xl p-4 border border-slate-100 dark:border-white/8 hover:border-brand/30 transition-colors text-left">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActiva ? 'bg-brand/10 text-brand' : 'bg-rose-500/10 text-rose-500'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              Plan {tiendaData?.suscripcion?.plan ? tiendaData.suscripcion.plan.charAt(0).toUpperCase() + tiendaData.suscripcion.plan.slice(1) : '—'}
            </p>
            <p className={`text-xs font-semibold ${isActiva ? (dias !== null && dias <= 7 ? 'text-amber-500' : 'text-brand') : 'text-rose-500'}`}>
              {isActiva && dias !== null && dias <= 7
                ? `Vence en ${dias} día${dias === 1 ? '' : 's'}`
                : isActiva
                  ? 'Activa'
                  : 'Vencida'}
              {tiendaData?.suscripcion?.vence && (dias === null || dias > 7 || !isActiva) && (
                <span className="text-ink-dim font-medium"> · {isActiva ? 'vence' : 'venció'} {new Date(tiendaData.suscripcion.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
              )}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
        </button>

        {/* La card con el listado de fotos de portada se sacó de acá — el
            dueño ya puede ver y editar sus fotos de portada desde el
            checklist de completitud de perfil (item "Portada", ver
            profileItems arriba) que abre el mismo sheet (MediaEditorModal,
            mediaModal='galeria'). Mostrar el mismo listado dos veces en la
            misma pantalla era redundante. */}

        {/* ── Centro de completitud — generado ÍNTEGRAMENTE desde
            profileItems (mismo array que calcula el anillo, arriba). Antes
            esta lista estaba escrita a mano con solo 4 de los 12 pasos
            (teléfono/IG/ubicación/tagline): el % nunca coincidía con lo
            que el dueño podía ver acá (hallazgo A5). Ahora son la MISMA
            fuente: el anillo y las filas nunca se desincronizan, y las
            4 categorías (perfil/config/contenido/personalización) hacen
            de índice de TODO lo que hay para hacer en la tienda, no solo
            de datos de contacto.
            Cada fila es un ACCESO DIRECTO al editor real de esa cosa — no
            hay inputs acá (ver hallazgo B5: esto es un "invitador", no un
            editor). El valor mostrado cuando está completo sale de
            rowValue(), un mapeo puntual por key (cada campo tiene su
            propio formato de texto). */}
        <div className="bg-surface-card rounded-3xl border border-slate-100 dark:border-white/8 overflow-hidden">
          {/* El padding vive EN el botón (no en el div contenedor de
              afuera) — así el área clickeable cubre toda la tarjeta,
              borde a borde. Antes el p-5 estaba en el div de afuera: tocar
              cerca del borde caía fuera del <button>, y solo el centro
              (donde sí estaba el botón) respondía al toggle. */}
          <button
            onClick={() => setProfileChecklistCollapsed(c => !c)}
            className="w-full flex items-center gap-4 text-left p-5"
            aria-expanded={!profileChecklistCollapsed}
          >
            {/* Ring SVG — pointer-events:none: es puramente decorativo, no
                debe poder "robar" el click del botón que lo envuelve. */}
            <div className="relative shrink-0 w-[56px] h-[56px]" style={{ pointerEvents: 'none' }}>
              <svg width="56" height="56" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" className="stroke-surface-card-2 dark:stroke-white/10" />
                <circle
                  cx="38" cy="38" r={r} fill="none" strokeWidth="7"
                  stroke="rgb(var(--brand))"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={circ / 4}
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black">{profilePct}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold">Completá tu tienda</h3>
              <p className="text-xs text-ink-dim mt-0.5">
                {profilePct === 100 ? '¡Todo listo!' : `${profileDone} de ${profileItems.length} pasos completos`}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-ink-dim shrink-0 transition-transform ${profileChecklistCollapsed ? '' : 'rotate-180'}`} style={{ pointerEvents: 'none' }} />
          </button>
          {/* Grid-rows 0fr↔1fr animado — a diferencia de max-height con un
              valor fijo, esta técnica anima a la altura REAL del contenido
              (que cambia según cuántos pasos falten/Ver más), sin saltos
              ni recortes. El contenido siempre está montado (necesario
              para poder animar), solo cambia el alto disponible. */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: profileChecklistCollapsed ? '0fr' : '1fr',
              transition: 'grid-template-rows .25s ease',
            }}
          >
            <div style={{ overflow: 'hidden', minHeight: 0 }}>
              <div className="px-5 pb-5">
              {(() => {
            // Solo los PENDIENTES ocupan lugar acá — un paso ya hecho
            // cumplió su función de invitar, no necesita seguir listado
            // (antes se mostraban todos, completos o no, forzando el alto
            // de toda la pantalla sin aportar nada nuevo una vez hecho).
            // UNA sola lista aplanada (no un "Ver más" por categoría): el
            // label de grupo se muestra solo cuando cambia respecto al
            // ítem anterior, como separador dentro del mismo recorte.
            const groupLabels = { perfil: 'Perfil', config: 'Configuración', contenido: 'Contenido', custom: 'Personalización' };
            const pending = profileItems.filter(i => !i.done);
            if (!pending.length) {
              return <p className="text-xs text-ink-dim mt-4">Ya completaste todos los pasos de tu perfil.</p>;
            }
            const visible = profileChecklistExpanded ? pending : pending.slice(0, 5);
            const hiddenCount = pending.length - visible.length;
            let lastGroup = null;
            return (
              <div className="mt-4">
                <div className="space-y-2">
                  {visible.map(item => {
                    const Icon = item.icon;
                    const showLabel = item.group !== lastGroup;
                    lastGroup = item.group;
                    return (
                      <React.Fragment key={item.key}>
                        {showLabel && (
                          <p className="text-[11px] font-black text-ink-dim uppercase tracking-widest pt-1 first:pt-0">{groupLabels[item.group]}</p>
                        )}
                        <button onClick={item.action}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand dark:hover:border-brand/40 transition-colors group text-left">
                          <div className="w-9 h-9 bg-surface-card-2 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-ink-dim" />
                          </div>
                          <div>
                            <p className="text-xs text-ink-dim font-medium">{item.label}</p>
                            <p className="text-xs text-brand font-semibold">+ Agregar</p>
                          </div>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                {hiddenCount > 0 && (
                  <button onClick={() => setProfileChecklistExpanded(true)}
                    className="w-full text-center text-xs font-semibold text-brand py-2 mt-2 hover:underline">
                    Ver {hiddenCount} más
                  </button>
                )}
                {profileChecklistExpanded && pending.length > 5 && (
                  <button onClick={() => setProfileChecklistExpanded(false)}
                    className="w-full text-center text-xs font-semibold text-ink-dim py-2 mt-2 hover:underline">
                    Ver menos
                  </button>
                )}
              </div>
            );
              })()}
              </div>
            </div>
          </div>
        </div>

        {/* Card "URL pública" eliminada — quedaba redundante con el botón
            "Editar URL" de la fila de acciones rápidas de arriba, que ya
            cubre mostrar/editar el slug. Esta card no aportaba una función
            propia salvo "Compartir" (navigator.share/copiar link), que no
            tiene reemplazo directo hoy en otro lugar de esta pantalla —
            "Ver página" del header solo ABRE la URL. */}

        {/* Suscripción: la card resumen de arriba (junto a Estadísticas)
            ya muestra estado+plan y navega a la pantalla completa, donde
            viven los botones reales de upgrade/pago por plan — esta card
            grande duplicaba exactamente lo mismo, se sacó. */}

        {/* ── Cuenta Google ────────────────────────────────────────────── */}
        <div className="bg-surface-card rounded-3xl border border-slate-100 dark:border-white/8 p-5">
          <h3 className="font-bold mb-4">Cuenta Google</h3>
          <div className="flex items-center gap-3 mb-4 p-3 bg-surface-card-2 dark:bg-white/5 rounded-2xl">
            <div className="w-11 h-11 bg-brand/15 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
              {renderAccountAvatar()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{firebaseUser?.displayName || 'Usuario'}</p>
              <p className="text-xs text-ink-dim truncate">{firebaseUser?.email || ''}</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full py-3 text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/15 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-rose-200 dark:border-rose-500/20">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>

        {/* Mismo ajuste que en Ofertas: espaciador SOLO de la altura REAL
            del nav (var(--store-bottom-nav-h), medida por ResizeObserver
            en StoreBottomNav — ya no un 84px hardcodeado ni un pb-24
            mezclado con el aire estético). El padding real de esta
            pantalla ya viene de cada bloque interno (px-5 lg:px-8,
            space-y-5), así que este bloque cubre el nav sin sumar aire
            extra encima de eso. */}
        <div style={{ height: 'var(--store-bottom-nav-h)' }} className="lg:hidden" aria-hidden="true" />
      </div>
      </div>{/* fin overflow-y-auto */}
    </div>
  );
}
