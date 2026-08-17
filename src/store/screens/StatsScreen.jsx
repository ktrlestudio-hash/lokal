// StatsScreen — pantalla "Estadísticas" del admin (visitas mock, análisis
// IA vía /store-insights). Tercera de las 5 pantallas grandes extraídas en
// la Fase 3. Mucho más chica de lo que sugería el conteo de líneas
// original — lo que seguía después en StoreApp.jsx eran otros
// modales/overlays (RubrosEditor, MediaEditorModal, etc.), no parte de
// esta pantalla.
import React from 'react';
import { TrendingUp, Sparkles, Loader2, Lightbulb, Award } from 'lucide-react';
import { StorePageHeader } from '../components/StorePageHeader.jsx';

export function StatsScreen({
  mockMode, MOCK_STATS,
  aiLoading, setAiLoading, aiError, setAiError, aiData, setAiData,
  apiFetch, API_BASE,
}) {
  const fetchInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await apiFetch(`${API_BASE}/store-insights`, { authRequired: true });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al generar análisis');
      }
      setAiData(await res.json());
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const prioColor = (p) => p === 'alta' ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
    : p === 'media' ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    : 'text-ink-dim bg-surface-card-2 dark:bg-white/5 border-slate-200 dark:border-white/10';

  return (
    <div className="min-h-screen sa-page-bg pb-24 lg:pb-8">
      <StorePageHeader title="Estadísticas" subtitle="Rendimiento de tu tienda" icon={TrendingUp} />

      <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        {/* Cards visitas mock */}
        {mockMode && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Visitas hoy', value: MOCK_STATS.visitasHoy, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Esta semana', value: MOCK_STATS.visitasSemana, color: 'text-brand' },
              { label: 'Este mes', value: MOCK_STATS.visitasMes, color: 'text-violet-600 dark:text-violet-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-4 text-center">
                <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs text-ink-dim mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
        {mockMode && (
          <div className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-5">
            <h3 className="font-bold text-sm mb-3">Productos más vistos</h3>
            <div className="space-y-2">
              {MOCK_STATS.productosVistos.map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-dim w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold truncate">{p.nombre}</span>
                      <span className="text-xs text-ink-dim shrink-0 ml-2">{p.visitas}</span>
                    </div>
                    <div className="h-1.5 bg-surface-card-2 dark:bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${Math.round(p.visitas / MOCK_STATS.productosVistos[0].visitas * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Análisis IA ──────────────────────────────────────────────── */}
        <div className="bg-surface-card rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" /> Análisis IA
              </h3>
              <p className="text-xs text-ink-dim mt-0.5">Guía personalizada basada en tu actividad</p>
            </div>
            {!aiData && (
              <button
                onClick={fetchInsights}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? 'Analizando...' : 'Analizar'}
              </button>
            )}
            {aiData && (
              <button onClick={() => { setAiData(null); setAiError(null); }} className="text-xs text-ink-dim hover:text-ink-dim">Actualizar</button>
            )}
          </div>

          {aiError && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-400">
              {aiError}
            </div>
          )}

          {!aiData && !aiLoading && !aiError && (
            <div className="text-center py-6 text-ink-dim">
              <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Presioná &quot;Analizar&quot; para obtener consejos personalizados sobre tu tienda</p>
            </div>
          )}

          {aiLoading && (
            <div className="flex flex-col items-center py-8 gap-3 text-ink-dim">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
              <p className="text-sm">Analizando tu tienda...</p>
            </div>
          )}

          {aiData && (
            <div className="space-y-4">
              {/* Score + resumen */}
              <div className="flex items-center gap-4 bg-surface-card-2 dark:bg-white/5 rounded-2xl p-4">
                <div className="w-14 h-14 rounded-2xl bg-brand/15 dark:bg-brand/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xl font-black text-brand-dark dark:text-brand">{aiData.insights?.score ?? '—'}</span>
                  <span className="text-[9px] text-ink-dim font-semibold">/ 10</span>
                </div>
                <p className="text-sm font-semibold flex-1">{aiData.insights?.resumen}</p>
              </div>

              {/* Consejos */}
              {(aiData.insights?.consejos || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-ink-dim uppercase tracking-wider">Consejos</p>
                  {aiData.insights.consejos.map((c, i) => (
                    <div key={i} className={`flex gap-3 p-3.5 rounded-2xl border ${prioColor(c.prioridad)}`}>
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">{c.titulo}</p>
                        <p className="text-xs mt-0.5 opacity-80">{c.detalle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fortalezas */}
              {(aiData.insights?.fortalezas || []).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-2">Puntos fuertes</p>
                  <div className="flex flex-wrap gap-2">
                    {aiData.insights.fortalezas.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand px-3 py-1.5 rounded-full font-semibold">
                        <Award className="w-3 h-3" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
