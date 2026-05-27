import { Minus, Plus, Trash2, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import type { Business } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { buildWhatsAppUrl, formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function CartDrawer({ business }: { business: Business }) {
  const items = useCart((s) => s.byBusiness[business.id]) ?? [];
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const total = items.reduce((a, b) => a + b.price * b.quantity, 0);
  const count = items.reduce((a, b) => a + b.quantity, 0);

  if (count === 0) return null;

  const whatsappUrl = buildWhatsAppUrl(business, items, { note });

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full tenant-primary-bg px-5 py-3 text-sm font-semibold shadow-elevated transition-spring",
          "hover:scale-105 active:scale-95",
        )}
      >
        <span className="relative">
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full tenant-accent-bg text-[10px] font-bold text-[hsl(230_25%_12%)]">
            {count}
          </span>
        </span>
        <span>Ver pedido</span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{formatPrice(total)}</span>
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative tenant-surface flex w-full max-w-lg flex-col tenant-radius-lg overflow-hidden shadow-elevated animate-rise sm:max-h-[85vh]">
            <div className="flex items-center justify-between border-b tenant-border p-4">
              <div>
                <h2 className="text-lg font-bold">Tu pedido</h2>
                <p className="text-xs text-[hsl(var(--t-muted-foreground))]">{count} {count === 1 ? "producto" : "productos"}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:tenant-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-3">
                {items.map((it) => (
                  <li key={it.productId} className="flex items-center gap-3 tenant-muted tenant-radius-sm p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{it.name}</p>
                      <p className="text-xs text-[hsl(var(--t-muted-foreground))]">{formatPrice(it.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border tenant-border tenant-surface">
                      <button onClick={() => setQty(business.id, it.productId, it.quantity - 1)} className="p-1.5">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                      <button onClick={() => setQty(business.id, it.productId, it.quantity + 1)} className="p-1.5">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-20 text-right font-bold tenant-primary-text">{formatPrice(it.price * it.quantity)}</span>
                    <button onClick={() => remove(business.id, it.productId)} className="text-[hsl(var(--t-muted-foreground))] hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <label className="mt-4 block">
                <span className="text-xs font-medium text-[hsl(var(--t-muted-foreground))]">Nota para el comercio (opcional)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 300))}
                  rows={2}
                  placeholder="Ej: sin azúcar, para llevar a las 18hs..."
                  className="mt-1 w-full resize-none tenant-radius-sm border tenant-border tenant-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--t-primary))]"
                />
              </label>
            </div>

            <div className="border-t tenant-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--t-muted-foreground))]">Total estimado</span>
                <span className="text-xl font-bold tenant-primary-text">{formatPrice(total)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => clear(business.id)}
                  className="rounded-full border tenant-border px-4 py-2.5 text-sm font-medium hover:tenant-muted"
                >
                  Vaciar
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-semibold text-whatsapp-foreground transition-smooth hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> Enviar pedido por WhatsApp
                </a>
              </div>
              <p className="mt-2 text-center text-[10px] text-[hsl(var(--t-muted-foreground))]">
                El pago se coordina directamente con el comercio.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
