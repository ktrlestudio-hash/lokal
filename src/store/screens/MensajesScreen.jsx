// MensajesScreen — pantalla "Mensajes" del admin (lista de conversaciones +
// panel de chat con adjuntos, chat flotante, swipe/long-press para
// editar/borrar mensajes, panel de info del cliente). Quinta y última
// pantalla grande extraída en la Fase 3 — la más grande y con más estado
// entrelazado; mismo criterio de las anteriores: props explícitas, sin
// rediseñar el manejo de estado (todo sigue viviendo en StoreApp.jsx).
import React from 'react';
import {
  MessageSquare, Tag, Zap, Award, RotateCcw, Search, ListFilter, CheckCircle,
  X, ExternalLink, Archive, ChevronDown, ArrowLeft, User, MapPin, Globe,
  ShoppingBag, Clock, Trash2, Edit3, Send, Loader2, Phone, Camera, Paperclip,
  Hash, MessageCircle, CalendarClock,
} from 'lucide-react';
import { StorePageHeader } from '../components/StorePageHeader.jsx';
import { SkeletonInbox as SkeletonInboxLocal } from '../../Skeletons';

export function MensajesScreen({
  storeId, allThreads, inboxConvos, setInboxConvos,
  inboxSearch, setInboxSearch, msgFilter, setMsgFilter,
  setClosedConvos, showClosed, setShowClosed,
  inboxSelectedKey, setInboxSelectedKey, inboxMobileView, setInboxMobileView,
  unreadTotal, fetchInbox, inboxLoading,
  floatingChats, openFloatingChat, closeFloatingChat,
  avatarColor, fmtTime,
  misProductosSinFiltrar, setProductoEditing, setProductoShowForm, setScreen,
  tiendaInfo, tiendaData,
  swipedMsgId, setSwipedMsgId, deletingMsgId, setDeletingMsgId,
  editingMsg, setEditingMsg, confirmDeleteMsg, setConfirmDeleteMsg,
  storeTyping, setStoreTyping, inboxBottomRef,
  attachOpen, setAttachOpen, chatAttachment, setChatAttachment,
  chatImagePreview, setChatImagePreview, chatImageInputRef,
  inboxReply, setInboxReply, inboxSending, inboxSendReply,
  inboxInfoOpen, setInboxInfoOpen,
  inboxScrollRef, inboxMobileScrollRef,
}) {
  const TYPE_META = {
    chat:     { label: 'Chat',     color: 'bg-info',        textColor: 'text-info dark:text-info',               bg: 'bg-info-muted dark:bg-info/10',        Icon: MessageSquare },
    producto: { label: 'Producto', color: 'bg-violet-500',  textColor: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-500/10',   Icon: Tag           },
    laboral:  { label: 'Laboral',  color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', Icon: Zap           },
    cv:       { label: 'CV',       color: 'bg-warn',        textColor: 'text-warn dark:text-warn',               bg: 'bg-warn-muted dark:bg-warn/10',        Icon: Award         },
    directa:  { label: 'Consulta', color: 'bg-info',        textColor: 'text-info dark:text-info',               bg: 'bg-info-muted dark:bg-info/10',        Icon: MessageSquare },
  };

  const FILTERS = [
    { id: 'todos',    label: 'Todos',    types: null },
    { id: 'chats',    label: 'Chats',    types: ['chat', 'directa'] },
    { id: 'contexto', label: 'Con contexto', types: ['producto', 'laboral', 'cv'] },
  ];

  const q = inboxSearch.toLowerCase();
  const activeFilter = FILTERS.find(f => f.id === msgFilter);
  const matchesFilter = (t) => {
    if (activeFilter?.types && !activeFilter.types.includes(t.type)) return false;
    if (q) return t.title.toLowerCase().includes(q) || t.lastText.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q);
    return true;
  };
  const visibleThreads  = allThreads.filter(t => !t.closed && matchesFilter(t));
  const archivedThreads = allThreads.filter(t =>  t.closed && matchesFilter(t));

  const toggleClose = (key) => {
    setClosedConvos(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const selectedConvo = inboxConvos.find(c => c.key === inboxSelectedKey) || null;
  const selectedThread = allThreads.find(t => t.key === inboxSelectedKey) || null;
  const messages = selectedConvo?.messages || [];

  // ── Panel izquierdo ────────────────────────────────────────────────────
  const ThreadList = () => (
    <div className="flex flex-col h-full bg-surface-card">
      {/* Header — solo visible en desktop (mobile usa StorePageHeader) */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/8 shrink-0">
        <div className="hidden lg:flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base">Comunicaciones</h2>
            {unreadTotal > 0 && (
              <span className="bg-brand text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                {unreadTotal}
              </span>
            )}
          </div>
          <button onClick={fetchInbox} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim" title="Actualizar">
            <RotateCcw className={`w-4 h-4 ${inboxLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Toolbar: búsqueda + filtro tipo */}
        <div className="flex items-center gap-2 mt-1">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-dim" />
            <input value={inboxSearch} onChange={e => setInboxSearch(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full pl-8 pr-8 py-2 bg-surface-card-2 dark:bg-white/5 rounded-xl text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand transition-all border border-transparent focus:border-brand/20" />
            {inboxSearch && <button onClick={() => setInboxSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink-dim"><X className="w-3 h-3" /></button>}
          </div>

          {/* Filtro tipo — dropdown igual que sort de productos */}
          <div className="relative group shrink-0">
            <button className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${msgFilter !== 'todos' ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}
              title="Filtrar por tipo">
              <ListFilter className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 bg-surface-card rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 min-w-[170px] hidden group-focus-within:block animate-dropdown-in">
              {FILTERS.map(f => {
                const count = allThreads.filter(t => !t.closed && t.unread > 0 && (!f.types || f.types.includes(t.type))).length;
                return (
                  <button key={f.id} onClick={() => setMsgFilter(f.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors text-left ${msgFilter === f.id ? 'bg-surface-card-2 dark:bg-white/5 font-bold text-brand' : 'text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5'}`}>
                    {msgFilter === f.id && <CheckCircle className="w-3 h-3 text-brand shrink-0" />}
                    <span className={msgFilter === f.id ? '' : 'pl-4'}>{f.label}</span>
                    {count > 0 && <span className="ml-auto text-[9px] font-black bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {/* Barra de progreso top cuando recarga con datos ya visibles */}
        {inboxLoading && visibleThreads.length > 0 && (
          <div className="top-progress" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
        )}
        <div className="flex-1 divide-y divide-slate-50 dark:divide-white/5">
        {inboxLoading && visibleThreads.length === 0 ? (
          <div className="px-3 pt-3"><SkeletonInboxLocal /></div>
        ) : visibleThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-card-2 dark:bg-white/8 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-ink-dim dark:text-ink-dim" />
            </div>
            <p className="font-bold text-ink-dim">
              {inboxSearch ? 'Sin resultados' : 'Sin comunicaciones'}
            </p>
            <p className="text-xs text-ink-dim leading-relaxed">
              {inboxSearch ? 'Probá con otro término.' : 'Los chats con tus clientes aparecerán acá.'}
            </p>
          </div>
        ) : <div className="stagger-in">{visibleThreads.map((t) => {
          const meta = TYPE_META[t.type] || TYPE_META.chat;
          const isSelected = t.key === inboxSelectedKey;
          const TypeIcon = meta.Icon;

          return (
            <div key={t.key}
              className={`group relative flex items-start gap-3 px-4 py-3.5 lg:px-5 lg:py-4 transition-colors cursor-pointer border-l-2 ${isSelected ? 'bg-brand/8 dark:bg-brand/12 border-brand' : t.unread > 0 ? 'border-brand/60' : 'border-transparent hover:bg-surface-card-2 dark:hover:bg-white/5'}`}
              onClick={() => { setInboxSelectedKey(t.key); setInboxMobileView('chat'); }}>

              {/* Avatar */}
              <div className="relative shrink-0 mt-0.5">
                <div className={`w-12 h-12 rounded-2xl ${t.partnerUid ? avatarColor(t.partnerUid) : meta.bg} flex items-center justify-center font-bold text-sm text-white`}>
                  {t.partnerUid ? (t.partnerUid || 'C').slice(-2).toUpperCase() : <TypeIcon className="w-5 h-5 text-white" />}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${meta.color} border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm`}>
                  <TypeIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                {/* Fila 1: título */}
                <p className={`text-sm leading-tight truncate mb-1 ${t.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink dark:text-ink-dim'}`}>
                  {t.title}
                </p>

                {/* Fila 2: chip tipo + subtítulo */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.textColor}`}>{meta.label}</span>
                  {t.subtitle && <p className="text-[11px] text-ink-dim truncate">{t.subtitle}</p>}
                  {t.price > 0 && <p className="text-[11px] font-bold text-brand shrink-0">${t.price.toLocaleString('es')}</p>}
                </div>

                {/* Fila 3: último mensaje */}
                <p className={`text-xs truncate ${t.unread > 0 ? 'text-ink dark:text-ink-dim font-medium' : 'text-ink-dim'}`}>
                  {t.repliedByStore && !t.unread ? <span className="text-ink-dim">Tú: </span> : null}
                  {t.lastText || <span className="italic">Sin mensajes aún</span>}
                </p>
              </div>

              {/* Columna derecha: hora arriba, badge/acciones abajo */}
              <div className="flex flex-col items-end shrink-0 self-stretch justify-between pt-0.5">
                <span className="text-[11px] text-ink-dim">{fmtTime(t.lastTs)}</span>
                {t.unread > 0 && (
                  <span className="w-5 h-5 bg-brand rounded-full text-white text-[10px] font-black flex items-center justify-center">{t.unread > 9 ? '9+' : t.unread}</span>
                )}
                <div className="flex flex-col items-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Chat flotante"
                    onClick={e => { e.stopPropagation(); if (floatingChats.find(c => c.key === t.key)) { closeFloatingChat(t.key); } else { openFloatingChat(t.key); } }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${floatingChats.find(c => c.key === t.key) ? 'bg-brand/15 text-brand' : 'text-ink-dim hover:text-ink dark:hover:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button title={t.closed ? 'Desarchivar' : 'Archivar'}
                    onClick={e => { e.stopPropagation(); toggleClose(t.key); }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${t.closed ? 'text-amber-500' : 'text-ink-dim hover:text-ink dark:hover:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
                    <Archive className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}</div>}
        </div>

        {/* ── Barra archivados estilo WhatsApp ── */}
        {archivedThreads.length > 0 && (
          <div className="shrink-0 border-t border-slate-100 dark:border-white/8">
            {/* Botón / cabecera archivados */}
            <button
              onClick={() => setShowClosed(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-surface-card-2 dark:bg-white/8 flex items-center justify-center shrink-0">
                <Archive className="w-4 h-4 text-ink-dim" />
              </div>
              <span className="flex-1 text-left text-sm font-semibold text-ink-dim dark:text-ink-dim">Archivadas</span>
              <span className="text-xs font-bold text-ink-dim mr-1">{archivedThreads.length}</span>
              <ChevronDown className={`w-4 h-4 text-ink-dim transition-transform duration-200 ${showClosed ? 'rotate-180' : ''}`} />
            </button>

            {/* Lista expandida de archivados */}
            {showClosed && (
              <div className="divide-y divide-slate-50 dark:divide-white/5 border-t border-slate-100 dark:border-white/8">
                {archivedThreads.map(t => {
                  const meta = TYPE_META[t.type] || TYPE_META.chat;
                  const isSelected = t.key === inboxSelectedKey;
                  const TypeIcon = meta.Icon;
                  return (
                    <div key={t.key}
                      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-brand/8 dark:bg-brand/12' : 'opacity-60 hover:opacity-100 hover:bg-surface-card-2 dark:hover:bg-white/5'}`}
                      onClick={() => { setInboxSelectedKey(t.key); setInboxMobileView('chat'); }}>
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl ${t.partnerUid ? avatarColor(t.partnerUid) : meta.bg} flex items-center justify-center font-bold text-xs`}>
                          {t.partnerUid ? <span className="text-white">{t.partnerUid.slice(-2).toUpperCase()}</span> : <TypeIcon className={`w-4 h-4 ${meta.textColor}`} />}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${meta.color} border-2 border-white dark:border-slate-900 flex items-center justify-center`}>
                          <TypeIcon className="w-1.5 h-1.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-ink-dim truncate">{t.title}</p>
                          <span className="text-[10px] text-ink-dim shrink-0">{fmtTime(t.lastTs)}</span>
                        </div>
                        <p className="text-xs text-ink-dim truncate">
                          {t.repliedByStore && <span className="text-ink-dim">Tú: </span>}
                          {t.lastText || <span className="italic">Sin mensajes</span>}
                        </p>
                      </div>
                      <button title="Desarchivar"
                        onClick={e => { e.stopPropagation(); toggleClose(t.key); }}
                        className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 text-ink-dim transition-all shrink-0">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Panel derecho ──────────────────────────────────────────────────────
  const ChatPanel = ({ scrollRef } = {}) => {
    const meta = selectedThread ? (TYPE_META[selectedThread.type] || TYPE_META.chat) : null;
    const TypeIcon = meta?.Icon || MessageSquare;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/8 shrink-0 bg-surface-card">
          <button onClick={() => setInboxMobileView('list')} className="lg:hidden ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {selectedThread ? (
            <>
              <div className={`w-9 h-9 rounded-xl ${selectedThread.partnerUid ? avatarColor(selectedThread.partnerUid) : meta.bg} flex items-center justify-center font-bold text-sm shrink-0`}>
                {selectedThread.partnerUid
                  ? <span className="text-white">{(selectedThread.partnerUid).slice(-2).toUpperCase()}</span>
                  : <TypeIcon className={`w-4.5 h-4.5 ${meta.textColor}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate">{selectedThread.title}</p>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${meta.color} text-white`}>{meta.label}</span>
                  {selectedThread.closed && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-surface-card-2 dark:bg-white/10 text-ink-dim shrink-0">CERRADA</span>}
                </div>
                <p className="text-xs text-ink-dim">{selectedThread.subtitle}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedThread.type === 'chat' && (
                  <button title="Chat flotante"
                    onClick={() => { if (floatingChats.find(c => c.key === selectedThread.key)) { closeFloatingChat(selectedThread.key); } else { openFloatingChat(selectedThread.key); } }}
                    className={`ui-icon-btn transition-colors ${floatingChats.find(c => c.key === selectedThread.key) ? 'text-brand bg-brand/10' : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button title="Info del cliente" onClick={() => setInboxInfoOpen(v => !v)}
                  className={`ui-icon-btn transition-colors ${inboxInfoOpen ? 'text-brand bg-brand/10' : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
                  <User className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <p className="font-bold text-ink-dim text-sm">Seleccioná una conversación</p>
          )}
        </div>

        {/* Cuerpo */}
        <div ref={scrollRef || null} className="flex-1 overflow-y-auto no-scrollbar p-4 bg-surface-card-2 dark:bg-surface-card-2" onClick={() => setSwipedMsgId(null)}>
          {!selectedThread ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-surface-card border border-slate-100 dark:border-white/8 flex items-center justify-center shadow-sm">
                <MessageSquare className="w-10 h-10 text-ink-dim dark:text-ink-dim" />
              </div>
              <p className="font-bold text-ink-dim">Seleccioná una conversación</p>
              <p className="text-xs text-ink-dim">Los chats directos con clientes aparecen a la izquierda.</p>
            </div>

          ) : (
            /* Chat unificado — con header de contexto si aplica */
            <div className="space-y-3">
              {/* Header de contexto (producto, laboral, cv) */}
              {selectedThread.type !== 'chat' && selectedThread.type !== 'directa' && (() => {
                const cm = TYPE_META[selectedThread.type] || TYPE_META.chat;
                const CIcon = cm.Icon;
                return (
                  <div className={`rounded-2xl border p-3.5 flex items-start gap-3 ${cm.bg} border-current/10`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cm.bg}`}>
                      <CIcon className={`w-4 h-4 ${cm.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-wide mb-0.5 ${cm.textColor}`}>{cm.label}</p>
                      <p className="text-sm font-semibold text-ink dark:text-ink-dim truncate">{selectedThread.subtitle}</p>
                      {selectedThread.price > 0 && (
                        <p className={`text-sm font-black mt-1 ${cm.textColor}`}>$ {selectedThread.price.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <MessageSquare className="w-10 h-10 text-ink-dim dark:text-ink" />
                  <p className="text-sm text-ink-dim">Iniciá la conversación</p>
                </div>
              ) : messages.filter(m => m.attachment?.type !== 'context').map(msg => {
                const isStore = msg.from === storeId;
                return (
                  <div key={msg.id || msg.ts} className={`group/msg flex flex-col ${isStore ? 'items-end' : 'items-start'} gap-1`}>
                    {msg.attachment && isStore && (() => {
                      const att = msg.attachment;
                      const delAtt = () => setInboxConvos(prev => prev.map(c => c.key === inboxSelectedKey
                        ? { ...c, messages: c.messages.map(m => (m.id || m.ts) === (msg.id || msg.ts) ? { ...m, attachment: undefined } : m) }
                        : c));

                      let attContent = null;
                      if (att.type === 'product' || att.type === 'producto') {
                        const fullProd = misProductosSinFiltrar.find(p => String(p.id) === String(att.productoId));
                        const foto = att.foto || fullProd?.fotos?.[0] || fullProd?.foto || fullProd?.imageUrl || null;
                        const nombre = att.nombre || fullProd?.titulo || fullProd?.nombre || 'Producto';
                        const precio = att.precio ?? fullProd?.precio ?? null;
                        const precioOrig = fullProd?.precioOriginal ?? null;
                        const descripcion = fullProd?.descripcion || null;
                        const stock = fullProd?.stock ?? null;
                        attContent = (
                          <button onClick={() => { if (fullProd) { setProductoEditing(fullProd); setProductoShowForm(true); setScreen('productos'); } }}
                            className="w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 active:opacity-60 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                            <div className="aspect-square w-full bg-surface-card-2 dark:bg-white/8 flex items-center justify-center overflow-hidden">
                              {foto ? <img src={foto} alt={nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <ShoppingBag className="w-10 h-10 text-ink-dim dark:text-ink-dim" />}
                            </div>
                            <div className="px-3 py-2.5">
                              <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Producto</p>
                              <p className="text-sm font-bold line-clamp-2 text-ink dark:text-ink-dim">{nombre}</p>
                              {descripcion && <p className="text-[11px] text-ink-dim line-clamp-1 mt-0.5">{descripcion}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                {precio != null && <span className="text-sm font-black text-brand-dark dark:text-brand">${Number(precio).toLocaleString('es')}</span>}
                                {precioOrig && precio && Number(precioOrig) > Number(precio) && <span className="text-xs text-ink-dim line-through">${Number(precioOrig).toLocaleString('es')}</span>}
                                {stock != null && <span className="text-[10px] text-ink-dim ml-auto">Stock: {stock}</span>}
                              </div>
                            </div>
                          </button>
                        );
                      } else if (att.type === 'ubicacion') {
                        const mapsUrl = att.lat && att.lng
                          ? `https://www.google.com/maps?q=${att.lat},${att.lng}`
                          : att.direccion ? `https://www.google.com/maps/search/${encodeURIComponent(`${att.direccion}${att.ciudad ? ` ${att.ciudad}` : ''}`)}` : null;
                        const storeFoto = tiendaInfo?.foto || null;
                        attContent = (
                          <a href={mapsUrl || '#'} target={mapsUrl ? '_blank' : undefined} rel="noopener noreferrer"
                            className="block w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                            <div className="h-28 bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-surface-card-2 dark:to-surface-card-2 flex items-center justify-center relative overflow-hidden">
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px)' }} />
                              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/40 relative bg-surface-card-2 dark:bg-surface-card-2 flex items-center justify-center">
                                {storeFoto
                                  ? <img src={storeFoto} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-ink-dim" />}
                              </div>
                            </div>
                            <div className="px-3 py-2.5">
                              <p className="text-[10px] text-ink-dim font-bold mb-0.5 flex items-center gap-1">Ubicación <ExternalLink className="w-2.5 h-2.5" /></p>
                              {att.nombre && <p className="text-xs font-semibold truncate">{att.nombre}</p>}
                              {att.direccion && <p className="text-[11px] text-ink-dim truncate">{att.direccion}{att.ciudad ? `, ${att.ciudad}` : ''}</p>}
                            </div>
                          </a>
                        );
                      } else if (att.type === 'tienda-info') {
                        const waNum = att.telefono ? att.telefono.replace(/\D/g, '').replace(/^0/, '54') : null;
                        const waUrl = waNum ? `https://wa.me/${waNum}` : null;
                        attContent = (
                          <a href={waUrl || '#'} target={waUrl ? '_blank' : undefined} rel="noopener noreferrer"
                            className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                            {/* Header verde WhatsApp */}
                            <div className="bg-[#25D366] px-3 py-3 flex items-center gap-2.5">
                              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white shrink-0" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.215a.75.75 0 0 0 .928.928l5.36-1.471A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 0 1-4.953-1.352l-.355-.211-3.683 1.01 1.01-3.684-.211-.355A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                              </svg>
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/80 font-semibold">WhatsApp</p>
                                <p className="text-sm font-bold text-white truncate">{att.nombre || 'Contactar'}</p>
                              </div>
                            </div>
                            {/* Footer */}
                            <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                              <p className="text-[11px] text-ink-dim">{att.telefono || 'Ver contacto'}</p>
                              <ExternalLink className="w-3 h-3 text-[#25D366] shrink-0" />
                            </div>
                          </a>
                        );
                      } else if (att.type === 'tienda-publica') {
                        attContent = (
                          <a href={att.url} target="_blank" rel="noopener noreferrer"
                            className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                            <div className="bg-brand px-3 py-3 flex items-center gap-2.5">
                              <Globe className="w-8 h-8 text-white shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/80 font-semibold">Página pública</p>
                                <p className="text-sm font-bold text-white truncate">{att.nombre}</p>
                              </div>
                            </div>
                            <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                              <p className="text-[11px] text-ink-dim truncate">{att.url?.replace(/^https?:\/\//, '')}</p>
                              <ExternalLink className="w-3 h-3 text-brand shrink-0" />
                            </div>
                          </a>
                        );
                      } else if (att.type === 'horarios') {
                        const rows = (() => {
                          if (!att.horarios) return [];
                          if (typeof att.horarios === 'string') return att.horarios.split('\n').filter(Boolean).map(l => ({ label: l, value: '' }));
                          if (Array.isArray(att.horarios)) return att.horarios;
                          if (typeof att.horarios === 'object') return Object.entries(att.horarios).map(([k, v]) => ({ label: k, value: v }));
                          return [];
                        })();
                        attContent = (
                          <div className="w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10">
                            <div className="bg-amber-500 px-3 py-2.5 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-white shrink-0" />
                              <div>
                                <p className="text-[10px] text-white/80 font-semibold">Horarios</p>
                                {att.nombre && <p className="text-xs font-bold text-white truncate">{att.nombre}</p>}
                              </div>
                            </div>
                            <div className="bg-surface-card px-3 py-2.5 flex flex-col gap-1">
                              {rows.length > 0 ? rows.map((r, i) => (
                                <div key={i} className="flex justify-between gap-2 text-[11px]">
                                  <span className="text-ink-dim capitalize">{r.label}</span>
                                  {r.value && <span className="font-semibold text-ink dark:text-ink-dim shrink-0">{r.value}</span>}
                                </div>
                              )) : (
                                <p className="text-[11px] text-ink-dim">Sin horarios configurados</p>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (!attContent) return null;
                      return (
                        <div className="relative w-fit">
                          <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-1.5 transition-opacity duration-150
                            opacity-0 pointer-events-none group-hover/msg:opacity-100 group-hover/msg:pointer-events-auto`}>
                            <button onClick={delAtt}
                              className="w-7 h-7 rounded-xl flex items-center justify-center bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-rose-500 transition-colors"
                              title="Quitar adjunto">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {attContent}
                        </div>
                      );
                    })()}
                    {msg.attachment && !isStore && (() => {
                      const att = msg.attachment;
                      if (att.type === 'product' || att.type === 'producto') {
                        const fullProd = misProductosSinFiltrar.find(p => String(p.id) === String(att.productoId));
                        const foto = att.foto || fullProd?.fotos?.[0] || fullProd?.foto || fullProd?.imageUrl || null;
                        const nombre = att.nombre || fullProd?.titulo || fullProd?.nombre || 'Producto';
                        const precio = att.precio ?? fullProd?.precio ?? null;
                        const precioOrig = fullProd?.precioOriginal ?? null;
                        const descripcion = fullProd?.descripcion || null;
                        const stock = fullProd?.stock ?? null;
                        return (
                          <button onClick={() => { if (fullProd) { setProductoEditing(fullProd); setProductoShowForm(true); setScreen('productos'); } }}
                            className="w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 active:opacity-60 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                            <div className="aspect-square w-full bg-surface-card-2 dark:bg-white/8 flex items-center justify-center overflow-hidden">
                              {foto ? <img src={foto} alt={nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <ShoppingBag className="w-10 h-10 text-ink-dim dark:text-ink-dim" />}
                            </div>
                            <div className="px-3 py-2.5">
                              <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Producto</p>
                              <p className="text-sm font-bold line-clamp-2 text-ink dark:text-ink-dim">{nombre}</p>
                              {descripcion && <p className="text-[11px] text-ink-dim line-clamp-1 mt-0.5">{descripcion}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                {precio != null && <span className="text-sm font-black text-brand-dark dark:text-brand">${Number(precio).toLocaleString('es')}</span>}
                                {precioOrig && precio && Number(precioOrig) > Number(precio) && <span className="text-xs text-ink-dim line-through">${Number(precioOrig).toLocaleString('es')}</span>}
                                {stock != null && <span className="text-[10px] text-ink-dim ml-auto">Stock: {stock}</span>}
                              </div>
                            </div>
                          </button>
                        );
                      }
                      if (att.type === 'ubicacion') {
                        const mapsUrl = att.lat && att.lng ? `https://www.google.com/maps?q=${att.lat},${att.lng}` : att.direccion ? `https://www.google.com/maps/search/${encodeURIComponent(`${att.direccion}${att.ciudad ? ` ${att.ciudad}` : ''}`)}` : null;
                        const storeFoto = tiendaInfo?.foto || null;
                        return (
                          <a href={mapsUrl || '#'} target={mapsUrl ? '_blank' : undefined} rel="noopener noreferrer"
                            className="block w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                            <div className="h-28 bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-surface-card-2 dark:to-surface-card-2 flex items-center justify-center relative overflow-hidden">
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px)' }} />
                              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/40 relative bg-surface-card-2 dark:bg-surface-card-2 flex items-center justify-center">
                                {storeFoto ? <img src={storeFoto} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-ink-dim" />}
                              </div>
                            </div>
                            <div className="px-3 py-2.5">
                              <p className="text-[10px] text-ink-dim font-bold mb-0.5 flex items-center gap-1">Ubicación <ExternalLink className="w-2.5 h-2.5" /></p>
                              {att.nombre && <p className="text-xs font-semibold truncate">{att.nombre}</p>}
                              {att.direccion && <p className="text-[11px] text-ink-dim truncate">{att.direccion}{att.ciudad ? `, ${att.ciudad}` : ''}</p>}
                            </div>
                          </a>
                        );
                      }
                      if (att.type === 'tienda-info') {
                        const waNum = att.telefono ? att.telefono.replace(/\D/g, '').replace(/^0/, '54') : null;
                        const waUrl = waNum ? `https://wa.me/${waNum}` : null;
                        return (
                          <a href={waUrl || '#'} target={waUrl ? '_blank' : undefined} rel="noopener noreferrer"
                            className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                            <div className="bg-[#25D366] px-3 py-3 flex items-center gap-2.5">
                              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white shrink-0" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.215a.75.75 0 0 0 .928.928l5.36-1.471A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 0 1-4.953-1.352l-.355-.211-3.683 1.01 1.01-3.684-.211-.355A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                              </svg>
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/80 font-semibold">WhatsApp</p>
                                <p className="text-sm font-bold text-white truncate">{att.nombre || 'Contactar'}</p>
                              </div>
                            </div>
                            <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                              <p className="text-[11px] text-ink-dim">{att.telefono || 'Ver contacto'}</p>
                              <ExternalLink className="w-3 h-3 text-[#25D366] shrink-0" />
                            </div>
                          </a>
                        );
                      }
                      if (att.type === 'tienda-publica') return (
                        <a href={att.url} target="_blank" rel="noopener noreferrer"
                          className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                          <div className="bg-brand px-3 py-3 flex items-center gap-2.5">
                            <Globe className="w-8 h-8 text-white shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] text-white/80 font-semibold">Página pública</p>
                              <p className="text-sm font-bold text-white truncate">{att.nombre}</p>
                            </div>
                          </div>
                          <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                            <p className="text-[11px] text-ink-dim truncate">{att.url?.replace(/^https?:\/\//, '')}</p>
                            <ExternalLink className="w-3 h-3 text-brand shrink-0" />
                          </div>
                        </a>
                      );
                      if (att.type === 'horarios') {
                        const rows = (() => {
                          if (!att.horarios) return [];
                          if (typeof att.horarios === 'string') return att.horarios.split('\n').filter(Boolean).map(l => ({ label: l, value: '' }));
                          if (Array.isArray(att.horarios)) return att.horarios;
                          if (typeof att.horarios === 'object') return Object.entries(att.horarios).map(([k, v]) => ({ label: k, value: v }));
                          return [];
                        })();
                        return (
                          <div className="w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10">
                            <div className="bg-amber-500 px-3 py-2.5 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-white shrink-0" />
                              <div>
                                <p className="text-[10px] text-white/80 font-semibold">Horarios</p>
                                {att.nombre && <p className="text-xs font-bold text-white truncate">{att.nombre}</p>}
                              </div>
                            </div>
                            <div className="bg-surface-card px-3 py-2.5 flex flex-col gap-1">
                              {rows.length > 0 ? rows.map((r, i) => (
                                <div key={i} className="flex justify-between gap-2 text-[11px]">
                                  <span className="text-ink-dim capitalize">{r.label}</span>
                                  {r.value && <span className="font-semibold text-ink dark:text-ink-dim shrink-0">{r.value}</span>}
                                </div>
                              )) : (
                                <p className="text-[11px] text-ink-dim">Sin horarios configurados</p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {msg.imageUrl && (
                      <div className={`relative w-fit max-w-[72%]`}>
                        <img src={msg.imageUrl} alt="" className="rounded-2xl max-w-full max-h-64 object-cover shadow-sm" />
                      </div>
                    )}
                    {msg.text && (() => {
                      const msgKey = msg.id || msg.ts;
                      const swiped = swipedMsgId === msgKey;
                      const isDeleting = deletingMsgId === msgKey;
                      const isEditing = editingMsg?.id === msgKey;

                      const doDelete = () => {
                        setDeletingMsgId(msgKey);
                        setSwipedMsgId(null);
                        setTimeout(() => {
                          setInboxConvos(prev => prev.map(c => c.key === inboxSelectedKey
                            ? { ...c, messages: c.messages.filter(m => (m.id || m.ts) !== msgKey) }
                            : c
                          ));
                          setDeletingMsgId(null);
                        }, 280);
                      };

                      let lpTimer = null;
                      const longPressHandlers = isStore ? {
                        onContextMenu: e => { e.preventDefault(); setSwipedMsgId(swiped ? null : msgKey); },
                        onTouchStart: () => { lpTimer = setTimeout(() => setSwipedMsgId(swiped ? null : msgKey), 420); },
                        onTouchEnd:   () => clearTimeout(lpTimer),
                        onTouchMove:  () => clearTimeout(lpTimer),
                      } : {};

                      return (
                        <>
                        <div className={`relative w-fit max-w-[72%] transition-all duration-[280ms] ease-out origin-right
                          ${isDeleting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>

                          {/* Botones apilados absolute — no afectan layout de la burbuja */}
                          {isStore && (
                            <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-1.5 flex flex-col gap-1 transition-opacity duration-150
                              ${swiped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover/msg:opacity-100 group-hover/msg:pointer-events-auto'}`}>
                              <button
                                onClick={() => { setEditingMsg({ id: msgKey, text: msg.text }); setInboxReply(msg.text); setSwipedMsgId(null); }}
                                className="w-7 h-7 rounded-xl flex items-center justify-center bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-brand transition-colors"
                                title="Editar">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { setConfirmDeleteMsg({ key: msgKey, doDelete }); setSwipedMsgId(null); }}
                                className="w-7 h-7 rounded-xl flex items-center justify-center bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-rose-500 transition-colors"
                                aria-label="Borrar mensaje" title="Borrar">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div {...longPressHandlers}
                            className={`rounded-2xl px-4 py-2.5 select-none
                              ${isStore ? 'bg-brand text-white' : 'bg-surface-card shadow-sm text-ink dark:text-ink-dim'}
                              ${isEditing ? 'ring-2 ring-brand/50 ring-offset-1' : ''}`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                        </>
                      );
                    })()}
                    <div className={`flex items-center gap-1 px-1 ${isStore ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-[10px] text-ink-dim">{fmtTime(msg.ts)}</p>
                      {isStore && (
                        <span className="text-[10px] text-ink-dim">
                          {msg.seen ? (
                            <svg viewBox="0 0 16 11" className="w-4 h-2.5 fill-brand inline" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.071.336a1 1 0 0 1 1.415 1.415l-6.364 6.364a1 1 0 0 1-1.415 0L1.293 4.7a1 1 0 1 1 1.414-1.414l2.707 2.707L11.07.336z"/>
                              <path d="M15.071.336a1 1 0 0 1 1.415 1.415L10.122 8.115a1 1 0 0 1-1.415 0" opacity=".5"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 16 11" className="w-4 h-2.5 fill-ink-dim inline" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.071.336a1 1 0 0 1 1.415 1.415l-6.364 6.364a1 1 0 0 1-1.415 0L1.293 4.7a1 1 0 1 1 1.414-1.414l2.707 2.707L11.07.336z"/>
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Indicador "escribiendo..." */}
          {storeTyping && (
            <div className="flex items-center gap-2 px-2 pt-1 pb-0">
              <div className="flex items-center gap-1 bg-surface-card rounded-2xl px-3 py-2 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-dim animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-dim animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-dim animate-bounce [animation-delay:300ms]" />
              </div>
              <p className="text-[10px] text-ink-dim">Escribiendo...</p>
            </div>
          )}
          <div ref={inboxBottomRef} />
        </div>

        {/* Footer input — para cualquier chat activo */}
        {selectedThread && selectedConvo && !selectedThread.closed && (() => {
          const td = tiendaInfo || tiendaData;
          const ATTACH_OPTS = [
            {
              id: 'ubicacion',
              icon: MapPin,
              label: 'Ubicación',
              desc: td?.direccion ? `${td.direccion}${td.ciudad ? `, ${td.ciudad}` : ''}` : 'Sin dirección',
              color: 'text-rose-600',
              bg: 'bg-rose-50 dark:bg-rose-900/20',
              disabled: !td?.direccion && !td?.lat,
              build: () => ({ type: 'ubicacion', nombre: td?.nombre, direccion: td?.direccion, ciudad: td?.ciudad, lat: td?.lat ?? null, lng: td?.lng ?? null }),
            },
            {
              id: 'tienda-info',
              icon: Phone,
              label: 'WhatsApp',
              desc: td?.telefono || 'Sin teléfono',
              color: 'text-[#25D366]',
              bg: 'bg-green-50 dark:bg-green-900/20',
              disabled: !td?.telefono,
              build: () => ({ type: 'tienda-info', nombre: td?.nombre, telefono: td?.telefono }),
            },
            {
              id: 'horarios',
              icon: Clock,
              label: 'Horarios',
              desc: td?.horarios ? 'Ver horarios de atención' : 'Sin horarios',
              color: 'text-amber-600',
              bg: 'bg-amber-50 dark:bg-amber-900/20',
              disabled: !td?.horarios,
              build: () => ({ type: 'horarios', nombre: td?.nombre, horarios: td?.horarios }),
            },
            {
              id: 'tienda-publica',
              icon: Globe,
              label: 'Página pública',
              desc: td?.slug ? `${window.location.host}/${td.slug}` : 'Sin slug configurado',
              color: 'text-brand',
              bg: 'bg-violet-50 dark:bg-violet-900/20',
              disabled: !td?.slug,
              build: () => ({ type: 'tienda-publica', slug: td?.slug, nombre: td?.nombre, url: `${window.location.origin}/${td?.slug}` }),
            },
          ];

          // Opciones de productos/ofertas (hasta 20 más recientes) — tolera
          // ambos modelos de datos: catálogo (titulo/precio/fotos[]) y
          // ofertas (nombre/imageUrl), según qué módulo tenga activo la tienda.
          const prodOpts = (misProductosSinFiltrar || []).slice(0, 20).map(p => ({
            id: `prod-${p.id}`,
            icon: ShoppingBag,
            label: p.titulo || p.nombre || 'Producto',
            desc: p.precio ? `$${Number(p.precio).toLocaleString('es')}` : 'Sin precio',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            build: () => ({ type: 'producto', productoId: String(p.id), nombre: p.titulo || p.nombre, precio: p.precio, foto: p.fotos?.[0] || p.imageUrl || null }),
          }));

          const allOpts = [...ATTACH_OPTS, ...prodOpts];
          const selectedOpt = chatAttachment ? allOpts.find(o => {
            if (chatAttachment.type === 'producto') return o.id === `prod-${chatAttachment.productoId}`;
            return o.id === chatAttachment.type;
          }) : null;

          return (
            <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-surface-card" style={{ paddingBottom: 'max(0rem, env(safe-area-inset-bottom))' }}>
              {/* Panel adjuntos */}
              {attachOpen && (
                <div className="border-b border-slate-100 dark:border-white/8 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Adjuntar</p>
                  {/* Opciones de tienda — fila única, ancho fraccionado */}
                  <div className="flex gap-1.5 mb-2">
                    {ATTACH_OPTS.map(opt => {
                      const isOn = chatAttachment?.type === opt.id;
                      return (
                        <button key={opt.id} disabled={opt.disabled}
                          onClick={() => setChatAttachment(isOn ? null : opt.build())}
                          className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-colors disabled:opacity-40 ${isOn ? `border-transparent ${opt.bg}` : 'border-slate-200 dark:border-white/8 bg-surface-card-2 dark:bg-white/4'}`}>
                          <opt.icon className={`w-4 h-4 ${isOn ? opt.color : 'text-ink-dim'}`} />
                          <p className={`text-[10px] font-bold text-center leading-tight ${isOn ? opt.color : 'text-ink-dim dark:text-ink-dim'}`}>{opt.label}</p>
                        </button>
                      );
                    })}
                  </div>
                  {/* Productos */}
                  {prodOpts.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-1.5">Mis productos</p>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {prodOpts.map(opt => {
                          const isOn = chatAttachment?.type === 'producto' && String(chatAttachment.productoId) === opt.id.replace('prod-', '');
                          return (
                            <button key={opt.id}
                              onClick={() => setChatAttachment(isOn ? null : opt.build())}
                              className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors min-w-[80px] ${isOn ? `border-transparent ${opt.bg}` : 'border-slate-200 dark:border-white/8 bg-surface-card-2 dark:bg-white/4'}`}>
                              <ShoppingBag className={`w-4 h-4 ${isOn ? opt.color : 'text-ink-dim'}`} />
                              <p className={`text-[10px] font-bold text-center leading-tight line-clamp-2 ${isOn ? opt.color : 'text-ink-dim dark:text-ink-dim'}`}>{opt.label}</p>
                              <p className={`text-[9px] ${isOn ? 'text-emerald-500' : 'text-ink-dim'}`}>{opt.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Adjunto seleccionado preview */}
              {chatAttachment && !attachOpen && (
                <div className="flex items-center gap-2 px-3 pt-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${selectedOpt?.bg || 'bg-surface-card-2 dark:bg-white/8'} ${selectedOpt?.color || 'text-ink-dim'}`}>
                    {selectedOpt && <selectedOpt.icon className="w-3 h-3" />}
                    <span>{selectedOpt?.label || 'Adjunto'}</span>
                  </div>
                  <button onClick={() => setChatAttachment(null)} className="text-ink-dim hover:text-ink-dim transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {/* Banner edición estilo WhatsApp */}
              {editingMsg && (
                <div className="flex items-center gap-2 px-3 pt-1.5 pb-0">
                  <Edit3 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <p className="flex-1 text-[11px] font-semibold text-brand">Editando mensaje</p>
                  <button onClick={() => { setEditingMsg(null); setInboxReply(''); }}
                    className="w-6 h-6 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim shrink-0 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {/* Preview imagen adjunta */}
              {chatImagePreview && (
                <div className="px-3 pt-2">
                  <div className="relative w-fit">
                    <img src={chatImagePreview} alt="" className="h-20 rounded-xl object-cover shadow-sm" />
                    <button onClick={() => setChatImagePreview(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink/80 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 items-end px-3 pt-2 pb-2">
                <input ref={chatImageInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setChatImagePreview(ev.target.result); r.readAsDataURL(f); e.target.value = ''; }} />
                <button onClick={() => chatImageInputRef.current?.click()}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${chatImagePreview ? 'bg-brand/10 text-brand' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-ink-dim'}`}>
                  <Camera className="w-4 h-4" />
                </button>
                <button onClick={() => setAttachOpen(v => !v)}
                  className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${attachOpen || chatAttachment ? 'bg-brand/10 text-brand' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-ink-dim'}`}>
                  <Paperclip className="w-4 h-4" />
                  {chatAttachment && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand text-white text-[8px] font-bold flex items-center justify-center">1</span>
                  )}
                </button>
                <div className="flex-1 bg-surface-card-2 dark:bg-white/8 rounded-2xl px-4 py-2.5 min-h-[40px] flex items-center">
                  <textarea value={inboxReply} onChange={e => { setInboxReply(e.target.value); setStoreTyping(true); clearTimeout(window._storeTypingTimer); window._storeTypingTimer = setTimeout(() => setStoreTyping(false), 2000); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); inboxSendReply(); setStoreTyping(false); } }}
                    placeholder="Escribí tu respuesta..."
                    rows={1}
                    className="bg-transparent text-sm text-ink dark:text-ink-dim placeholder:text-ink-dim focus:outline-none w-full resize-none" />
                </div>
                <button onClick={inboxSendReply} disabled={(!inboxReply.trim() && !chatAttachment) || inboxSending}
                  className="w-10 h-10 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
                  {inboxSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
              {/* Barra sutil archivar */}
              <button onClick={() => toggleClose(selectedThread.key)}
                className="w-full flex items-center justify-center gap-1.5 pt-0 pb-2 text-[11px] font-semibold text-ink-dim dark:text-ink-dim hover:text-ink-dim dark:hover:text-ink-dim transition-colors">
                <Archive className="w-3 h-3" />
                Archivar conversación
              </button>
            </div>
          );
        })()}
        {selectedThread?.closed && (
          <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-surface-card px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-ink-dim">
              <Archive className="w-3.5 h-3.5" />
              <p className="text-xs">Archivada</p>
            </div>
            <button onClick={() => toggleClose(selectedThread.key)} className="text-xs font-bold text-brand hover:text-brand-dark transition-colors">Desarchivar</button>
          </div>
        )}
      </div>
    );
  };

  // ── Panel de info del cliente ─────────────────────────────────────────
  const ClientInfoPanel = () => {
    if (!selectedThread) return null;
    const meta = TYPE_META[selectedThread.type] || TYPE_META.chat;
    const TypeIcon = meta.Icon;
    const msgs = selectedConvo?.messages || [];
    const msgCount = msgs.length;
    const firstMsg = msgs[0];
    const lastMsg = msgs[msgs.length - 1];
    const uid = selectedThread.partnerUid;

    return (
      <div className="w-64 xl:w-72 border-l border-slate-100 dark:border-white/8 flex flex-col bg-surface-card overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/8 shrink-0 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-dim">Info del cliente</p>
          <button onClick={() => setInboxInfoOpen(false)} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Avatar + nombre */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className={`w-16 h-16 rounded-2xl ${uid ? avatarColor(uid) : 'bg-surface-card-2'} flex items-center justify-center font-black text-xl text-white shadow-sm`}>
              {uid ? uid.slice(-2).toUpperCase() : <User className="w-7 h-7" />}
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">{selectedThread.title}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${meta.color} text-white mt-1`}>
                <TypeIcon className="w-2.5 h-2.5" />
                {meta.label}
              </span>
            </div>
          </div>

          {/* ID del usuario */}
          {uid && (
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex items-center gap-2.5">
              <Hash className="w-3.5 h-3.5 text-ink-dim shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-ink-dim font-medium">ID de usuario</p>
                <p className="text-xs font-mono font-semibold text-ink dark:text-ink-dim truncate">{uid}</p>
              </div>
            </div>
          )}

          {/* Contexto del hilo */}
          {selectedThread.subtitle && (
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex items-start gap-2.5">
              <MessageCircle className="w-3.5 h-3.5 text-ink-dim shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-ink-dim font-medium">Contexto</p>
                <p className="text-xs font-semibold text-ink dark:text-ink-dim line-clamp-2">{selectedThread.subtitle}</p>
              </div>
            </div>
          )}

          {/* Stats mensajes */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 text-center">
              <p className="text-lg font-black text-ink dark:text-ink-dim">{msgCount}</p>
              <p className="text-[10px] text-ink-dim font-medium">mensajes</p>
            </div>
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 text-center">
              <p className="text-lg font-black text-ink dark:text-ink-dim">{selectedThread.unread || 0}</p>
              <p className="text-[10px] text-ink-dim font-medium">sin leer</p>
            </div>
          </div>

          {/* Fechas */}
          {(firstMsg || lastMsg) && (
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                <p className="text-[10px] text-ink-dim font-medium">Actividad</p>
              </div>
              {firstMsg?.ts && (
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-ink-dim">Primer mensaje</p>
                  <p className="text-[10px] font-semibold text-ink-dim">{fmtTime(firstMsg.ts)}</p>
                </div>
              )}
              {lastMsg?.ts && (
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-ink-dim">Último mensaje</p>
                  <p className="text-[10px] font-semibold text-ink-dim">{fmtTime(lastMsg.ts)}</p>
                </div>
              )}
            </div>
          )}

          {/* Estado */}
          <div className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${selectedThread.closed ? 'bg-surface-card-2 dark:bg-white/5' : 'bg-ok/8 dark:bg-ok/10'}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${selectedThread.closed ? 'bg-ink-dim' : 'bg-ok'}`} />
            <p className={`text-xs font-bold ${selectedThread.closed ? 'text-ink-dim' : 'text-ok-dark dark:text-ok'}`}>
              {selectedThread.closed ? 'Conversación cerrada' : 'Conversación activa'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── Bottom sheet info (mobile) ────────────────────────────────────────────
  const ClientInfoSheet = () => {
    if (!inboxInfoOpen || !selectedThread) return null;
    const meta = TYPE_META[selectedThread.type] || TYPE_META.chat;
    const TypeIcon = meta.Icon;
    const msgs = selectedConvo?.messages || [];
    const msgCount = msgs.length;
    const uid = selectedThread.partnerUid;

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" onClick={() => setInboxInfoOpen(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-surface-card rounded-t-3xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto no-scrollbar animate-fade-in"
          onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-1" />
          <div className="flex items-center justify-between">
            <p className="font-bold">Info del cliente</p>
            <button onClick={() => setInboxInfoOpen(false)} className="ui-icon-btn text-ink-dim"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${uid ? avatarColor(uid) : 'bg-surface-card-2'} flex items-center justify-center font-black text-lg text-white`}>
              {uid ? uid.slice(-2).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-bold">{selectedThread.title}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${meta.color} text-white`}>
                <TypeIcon className="w-2.5 h-2.5" />{meta.label}
              </span>
            </div>
          </div>

          {uid && (
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex items-center gap-2.5">
              <Hash className="w-3.5 h-3.5 text-ink-dim shrink-0" />
              <div>
                <p className="text-[10px] text-ink-dim font-medium">ID de usuario</p>
                <p className="text-xs font-mono font-semibold text-ink dark:text-ink-dim">{uid}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-3 text-center">
              <p className="text-xl font-black text-ink dark:text-ink-dim">{msgCount}</p>
              <p className="text-[10px] text-ink-dim font-medium">mensajes</p>
            </div>
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-3 text-center">
              <p className="text-xl font-black text-ink dark:text-ink-dim">{selectedThread.unread || 0}</p>
              <p className="text-[10px] text-ink-dim font-medium">sin leer</p>
            </div>
          </div>

          {selectedThread.subtitle && (
            <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5">
              <p className="text-[10px] text-ink-dim font-medium mb-1">Contexto</p>
              <p className="text-sm font-semibold text-ink dark:text-ink-dim">{selectedThread.subtitle}</p>
            </div>
          )}

          <div className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${selectedThread.closed ? 'bg-surface-card-2 dark:bg-white/5' : 'bg-ok/8 dark:bg-ok/10'}`}>
            <div className={`w-2 h-2 rounded-full ${selectedThread.closed ? 'bg-ink-dim' : 'bg-ok'}`} />
            <p className={`text-sm font-bold ${selectedThread.closed ? 'text-ink-dim' : 'text-ok-dark dark:text-ok'}`}>
              {selectedThread.closed ? 'Conversación cerrada' : 'Conversación activa'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-surface-card" style={{ height: 'calc(100dvh - var(--store-banner-h))' }}>
      {/* Header mobile — desktop usa el header interno del ThreadList */}
      <div className="lg:hidden shrink-0">
        <StorePageHeader
          title="Mensajes"
          subtitle={unreadTotal > 0 ? `${unreadTotal} sin leer` : `${allThreads.length} conversación${allThreads.length !== 1 ? 'es' : ''}`}
          actionSlot={
            <button onClick={fetchInbox} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim" title="Actualizar">
              <RotateCcw className={`w-4 h-4 ${inboxLoading ? 'animate-spin' : ''}`} />
            </button>
          }
        />
      </div>
      <div className="hidden lg:flex flex-1 min-h-0">
        <div className="w-80 xl:w-96 border-r border-slate-100 dark:border-white/8 flex flex-col min-h-0">
          {ThreadList()}
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          {ChatPanel({ scrollRef: inboxScrollRef })}
        </div>
        {inboxInfoOpen && selectedThread && ClientInfoPanel()}
      </div>
      <div className={`lg:hidden flex-1 min-h-0 flex flex-col ${inboxMobileView === 'chat' ? 'pb-0' : 'pb-20'}`}
        onTouchStart={e => { if (inboxMobileView === 'chat') window._swipeStartX = e.touches[0].clientX; }}
        onTouchEnd={e => { if (inboxMobileView === 'chat' && window._swipeStartX != null) { const dx = e.changedTouches[0].clientX - window._swipeStartX; if (dx > 60) setInboxMobileView('list'); window._swipeStartX = null; } }}>
        {inboxMobileView === 'list' ? ThreadList() : ChatPanel({ scrollRef: inboxMobileScrollRef })}
      </div>
      {ClientInfoSheet()}

      {/* Modal confirmar borrado de mensaje — mismo patrón que
          productos/ofertas, único punto donde faltaba (antes borraba
          directo con un solo tap). */}
      {confirmDeleteMsg && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={() => setConfirmDeleteMsg(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-black text-lg text-center mb-1">¿Borrar mensaje?</h3>
            <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteMsg(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={() => { confirmDeleteMsg.doDelete(); setConfirmDeleteMsg(null); }} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">Borrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
