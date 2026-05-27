import React from 'react';
import { MessageSquare, Store, Package, Tag, CheckCircle } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

export default function ChatsScreen({
  chatConversations,
  tiendas,
  navRoot,
  openChat,
  pageHeaderProps,
}) {
  const [tab, setTab] = React.useState('todos');

  const CONTEXT_META = {
    product:  { label: 'Producto',  color: 'text-violet-500', bg: 'bg-violet-500/10' },
    demand:   { label: 'Demanda',   color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
    store:    { label: 'Tienda',    color: 'text-brand',      bg: 'bg-brand/10'       },
    received: { label: 'Recibido',  color: 'text-ok',         bg: 'bg-ok/10'          },
  };

  const allConvs = Object.entries(chatConversations)
    .map(([key, c]) => ({ key, ...c }))
    .sort((a, b) => (b.lastTime || '').localeCompare(a.lastTime || ''));

  const tabs = [
    { id: 'todos',     label: 'Todos',     count: allConvs.length },
    { id: 'enviados',  label: 'Enviados',  count: allConvs.filter(c => c.direction !== 'received').length },
    { id: 'recibidos', label: 'Recibidos', count: allConvs.filter(c => c.direction === 'received').length },
  ];

  const filtered = tab === 'enviados'  ? allConvs.filter(c => c.direction !== 'received')
                 : tab === 'recibidos' ? allConvs.filter(c => c.direction === 'received')
                 : allConvs;

  const formatHora = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7)  return d.toLocaleDateString('es-AR', { weekday: 'short' });
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16]">
      <PageHeader title="Mensajes" onBack={() => navRoot('home')} {...pageHeaderProps} />

      <div className="sticky top-0 z-10 bg-[#f7f8fa] dark:bg-[#0a0d16] px-4 pb-3 pt-1">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-slate-900 dark:bg-white/10 text-white dark:text-white' : 'bg-white dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-brand" />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
            {tab === 'recibidos' ? 'Nadie te escribió todavía' : tab === 'enviados' ? 'No iniciaste ningún chat' : 'Sin mensajes todavía'}
          </p>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            {tab === 'recibidos'
              ? 'Cuando alguien consulte sobre tus productos o demandas, aparece acá.'
              : 'Consultale a una tienda sobre un producto para empezar.'}
          </p>
          {tab !== 'recibidos' && (
            <button onClick={() => navRoot('tiendas')}
              className="mt-5 bg-brand text-white font-bold px-5 py-2.5 rounded-2xl text-sm">
              Explorar tiendas
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-3 space-y-1 pb-4">
          {filtered.map(conv => {
            const foto = conv.foto || tiendas.find(t => String(t.id) === String(conv.id))?.logo;
            const ctx = conv.context || { type: 'store' };
            const ctxMeta = CONTEXT_META[ctx.type] || CONTEXT_META.store;
            const status = conv.status || 'read';
            const hasUnread = (conv.unread || 0) > 0 && status !== 'closed';
            const isClosed = status === 'closed';

            return (
              <button key={conv.key}
                onClick={() => openChat({ id: conv.id, tienda: conv.tienda, foto: conv.foto, telefono: conv.telefono })}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors text-left ${
                  isClosed   ? 'bg-slate-50 dark:bg-white/3 opacity-60 hover:opacity-80' :
                  hasUnread  ? 'bg-white dark:bg-brand/8 ring-1 ring-brand/20' :
                               'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/8'
                }`}>
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center ${isClosed ? 'bg-slate-200 dark:bg-white/8 grayscale' : 'bg-brand/10'}`}>
                    {foto
                      ? <img src={foto} alt={conv.tienda} className="w-full h-full object-cover" />
                      : <Store className={`w-6 h-6 ${isClosed ? 'text-slate-400' : 'text-brand'}`} />}
                  </div>
                  {!isClosed && hasUnread && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand border-2 border-white dark:border-[#0a0d16]" />
                  )}
                  {isClosed && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-[#0a0d16] flex items-center justify-center">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {!isClosed && !hasUnread && conv.direction === 'received' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-ok border-2 border-white dark:border-[#0a0d16]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-[15px] truncate ${hasUnread ? 'font-black text-slate-900 dark:text-white' : isClosed ? 'font-medium text-slate-500' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                      {conv.tienda}
                    </p>
                    <p className={`text-xs shrink-0 tabular-nums ${hasUnread ? 'text-brand font-semibold' : 'text-slate-400'}`}>
                      {formatHora(conv.lastTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ctxMeta.bg} ${ctxMeta.color}`}>
                      {ctx.type === 'product' && <Package className="w-2.5 h-2.5" />}
                      {ctx.type === 'demand'  && <Tag className="w-2.5 h-2.5" />}
                      {ctx.type === 'store'   && <Store className="w-2.5 h-2.5" />}
                      {ctx.type === 'product' || ctx.type === 'demand' ? ctx.label : ctxMeta.label}
                    </span>
                    {isClosed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                        <CheckCircle className="w-2.5 h-2.5" /> Resuelto
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate flex-1 ${hasUnread ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      {conv.lastMsg || 'Conversación iniciada'}
                    </p>
                    {hasUnread && (
                      <span className="min-w-[20px] h-5 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white px-1 shrink-0">
                        {conv.unread > 9 ? '9+' : conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
