import { Plus, Star } from "lucide-react";
import type { Product, LayoutPreset } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface Props {
  products: Product[];
  layout: LayoutPreset;
  onAdd: (p: Product) => void;
}

export function ProductGrid({ products, layout, onAdd }: Props) {
  if (!products.length) {
    return (
      <div className="tenant-muted tenant-radius mx-4 p-8 text-center text-sm sm:mx-6">
        No hay productos cargados todavía.
      </div>
    );
  }

  const featured = products.filter((p) => p.featured);
  const rest = products.filter((p) => !p.featured);

  if (layout === "hero-list") {
    return (
      <div className="space-y-4 px-4 sm:px-6">
        {featured[0] && (
          <HeroCard product={featured[0]} onAdd={onAdd} />
        )}
        <div className="divide-y tenant-border tenant-surface tenant-radius overflow-hidden border">
          {[...featured.slice(1), ...rest].map((p) => (
            <ListRow key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      </div>
    );
  }

  if (layout === "feed") {
    return (
      <div className="space-y-4 px-4 sm:px-6">
        {products.map((p) => (
          <FeedCard key={p.id} product={p} onAdd={onAdd} />
        ))}
      </div>
    );
  }

  const gridCols = layout === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("grid gap-4 px-4 sm:px-6", gridCols)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} compact={layout === "grid"} />
      ))}
    </div>
  );
}

function ProductCard({ product, onAdd, compact }: { product: Product; onAdd: (p: Product) => void; compact?: boolean }) {
  return (
    <article className="group tenant-surface tenant-radius overflow-hidden border tenant-border shadow-soft transition-smooth hover:shadow-elevated hover:-translate-y-0.5">
      <div className="relative aspect-square overflow-hidden tenant-muted">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🛍️</div>
        )}
        {product.featured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full tenant-primary-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            <Star className="h-2.5 w-2.5" /> Destacado
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className={cn("font-semibold leading-tight", compact ? "text-sm" : "text-base")}>{product.name}</h3>
        {product.description && !compact && (
          <p className="mt-1 line-clamp-2 text-xs text-[hsl(var(--t-muted-foreground))]">{product.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-bold tenant-primary-text">{formatPrice(product.price)}</span>
          <button
            onClick={() => onAdd(product)}
            className="inline-flex items-center gap-1 tenant-primary-bg tenant-radius-sm px-2.5 py-1.5 text-xs font-semibold transition-smooth hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

function HeroCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <article className="relative overflow-hidden tenant-radius-lg border tenant-border shadow-elevated">
      <div className="relative h-64 sm:h-80">
        {product.image && <img src={product.image} alt={product.name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase backdrop-blur">
              <Star className="h-3 w-3" /> Destacado
            </span>
            <h3 className="mt-2 text-2xl font-bold">{product.name}</h3>
            {product.description && <p className="mt-1 max-w-md text-sm opacity-90">{product.description}</p>}
            <div className="mt-2 text-xl font-bold">{formatPrice(product.price)}</div>
          </div>
          <button onClick={() => onAdd(product)} className="inline-flex items-center gap-1 tenant-accent-bg tenant-radius-sm px-3 py-2 text-sm font-semibold text-[hsl(230_25%_12%)] shadow-soft">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

function ListRow({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden tenant-radius-sm tenant-muted">
        {product.image && <img src={product.image} alt={product.name} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{product.name}</h3>
        {product.description && <p className="line-clamp-1 text-xs text-[hsl(var(--t-muted-foreground))]">{product.description}</p>}
        <div className="mt-0.5 font-bold tenant-primary-text">{formatPrice(product.price)}</div>
      </div>
      <button onClick={() => onAdd(product)} className="inline-flex shrink-0 items-center gap-1 tenant-primary-bg tenant-radius-sm px-3 py-1.5 text-xs font-semibold">
        <Plus className="h-3.5 w-3.5" /> Agregar
      </button>
    </div>
  );
}

function FeedCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <article className="tenant-surface overflow-hidden tenant-radius-lg border tenant-border shadow-soft">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {product.featured && <Star className="h-3.5 w-3.5 tenant-primary-text fill-current" />}
          {product.name}
        </div>
        <span className="font-bold tenant-primary-text">{formatPrice(product.price)}</span>
      </div>
      {product.image && (
        <div className="aspect-[4/3] overflow-hidden tenant-muted">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="line-clamp-2 text-sm text-[hsl(var(--t-muted-foreground))]">{product.description}</p>
        <button onClick={() => onAdd(product)} className="inline-flex shrink-0 items-center gap-1 tenant-primary-bg tenant-radius-sm px-3 py-1.5 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>
    </article>
  );
}
