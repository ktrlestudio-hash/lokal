import { Clock, MessageCircle } from "lucide-react";
import type { Service, Business } from "@/lib/types";
import { formatPrice, buildWhatsAppUrl } from "@/lib/whatsapp";

export function ServiceList({ services, business }: { services: Service[]; business: Business }) {
  if (!services.length) {
    return (
      <div className="tenant-muted tenant-radius mx-4 p-8 text-center text-sm sm:mx-6">
        No hay servicios cargados todavía.
      </div>
    );
  }
  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-6">
      {services.map((s) => {
        const url = buildWhatsAppUrl(business, [], { isService: true, serviceTitle: s.title });
        return (
          <article key={s.id} className="tenant-surface tenant-radius overflow-hidden border tenant-border p-5 shadow-soft transition-smooth hover:shadow-elevated">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-tight">{s.title}</h3>
                {s.duration && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-[hsl(var(--t-muted-foreground))]">
                    <Clock className="h-3 w-3" /> {s.duration}
                  </span>
                )}
              </div>
              <span className="shrink-0 rounded-full tenant-accent-bg px-2.5 py-1 text-xs font-bold text-[hsl(230_25%_12%)]">
                {formatPrice(s.price)}
              </span>
            </div>
            {s.description && <p className="mt-2 text-sm text-[hsl(var(--t-muted-foreground))]">{s.description}</p>}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-semibold text-whatsapp-foreground transition-smooth hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              {s.price == null ? "Pedir cotización" : "Reservar por WhatsApp"}
            </a>
          </article>
        );
      })}
    </div>
  );
}
