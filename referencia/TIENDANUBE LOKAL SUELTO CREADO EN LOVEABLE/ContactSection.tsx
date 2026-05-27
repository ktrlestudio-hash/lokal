import { MessageCircle, Phone, Instagram, MapPin } from "lucide-react";
import type { Business } from "@/lib/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function ContactSection({ business }: { business: Business }) {
  const waUrl = buildWhatsAppUrl(business, []);
  const mapSrc = business.mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(business.mapQuery)}&output=embed`
    : null;

  return (
    <section className="grid gap-4 px-4 sm:px-6 md:grid-cols-[1fr_1.2fr]">
      <div className="tenant-surface tenant-radius border tenant-border p-5 shadow-soft">
        <h2 className="text-2xl font-bold">Contactanos</h2>
        {business.availability && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-whatsapp pulse-dot" />
            {business.availability}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-semibold text-whatsapp-foreground transition-smooth hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
          </a>
          {business.phone && (
            <a
              href={`tel:${business.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border tenant-border px-4 py-2.5 text-sm font-semibold hover:tenant-muted"
            >
              <Phone className="h-4 w-4" /> {business.phone}
            </a>
          )}
          {business.instagram && (
            <a
              href={`https://instagram.com/${business.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border tenant-border px-4 py-2.5 text-sm font-semibold hover:tenant-muted"
            >
              <Instagram className="h-4 w-4" /> @{business.instagram}
            </a>
          )}
          {business.address && (
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-[hsl(var(--t-muted-foreground))]">
              <MapPin className="h-4 w-4" /> {business.address}
            </p>
          )}
        </div>
      </div>
      {mapSrc && (
        <div className="overflow-hidden tenant-radius border tenant-border shadow-soft">
          <iframe
            title={`Mapa de ${business.name}`}
            src={mapSrc}
            className="h-64 w-full md:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </section>
  );
}
