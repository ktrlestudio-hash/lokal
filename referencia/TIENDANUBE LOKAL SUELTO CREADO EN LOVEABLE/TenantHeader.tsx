import { Star, Instagram, Phone, MapPin } from "lucide-react";
import type { Business } from "@/lib/types";

export function TenantHeader({ business }: { business: Business }) {
  return (
    <header className="relative">
      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden tenant-radius-lg md:h-72">
        {business.cover ? (
          <img src={business.cover} alt={`Portada de ${business.name}`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full tenant-primary-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>

      {/* Profile row */}
      <div className="relative -mt-10 flex flex-col gap-4 px-4 sm:-mt-14 sm:flex-row sm:items-end sm:px-6">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center border-4 border-[hsl(var(--t-surface))] bg-[hsl(var(--t-surface))] text-4xl shadow-elevated tenant-radius sm:h-28 sm:w-28 sm:text-5xl"
        >
          {business.logo?.startsWith("http") ? (
            <img src={business.logo} alt={business.name} className="h-full w-full object-cover tenant-radius" />
          ) : (
            <span>{business.logo ?? "🏪"}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full tenant-accent-bg px-2.5 py-0.5 text-xs font-semibold text-[hsl(230_25%_12%)]">
              {business.category}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-[hsl(var(--t-muted-foreground))]">
              <Star className="h-3.5 w-3.5 fill-current tenant-primary-text" />
              <span className="font-semibold text-[hsl(var(--t-surface-foreground))]">{business.rating.toFixed(1)}</span>
              <span>({business.reviewCount})</span>
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-5xl">{business.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[hsl(var(--t-muted-foreground))] sm:text-base">
            {business.tagline}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[hsl(var(--t-muted-foreground))]">
            {business.address && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {business.address}</span>
            )}
            {business.phone && (
              <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {business.phone}</span>
            )}
            {business.instagram && (
              <span className="inline-flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> @{business.instagram}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
