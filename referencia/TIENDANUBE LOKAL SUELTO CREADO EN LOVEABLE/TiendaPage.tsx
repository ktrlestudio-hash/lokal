import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { useLokalStore } from "@/lib/store";
import { useCart } from "@/lib/cart";
import { useTenantVars } from "@/lib/tenantTheme";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { HighlightsRow } from "@/components/tenant/HighlightsRow";
import { ProductGrid } from "@/components/tenant/ProductGrid";
import { ServiceList } from "@/components/tenant/ServiceList";
import { CartDrawer } from "@/components/tenant/CartDrawer";
import { ReviewsSection } from "@/components/tenant/ReviewsSection";
import { ContactSection } from "@/components/tenant/ContactSection";
import { LokalBadge } from "@/components/LokalBadge";

export default function TiendaPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const business = useLokalStore((s) => s.businesses.find((b) => b.slug === slug));
  const addToCart = useCart((s) => s.add);
  const updateBusiness = useLokalStore((s) => s.updateBusiness);
  const vars = useTenantVars(business ?? useLokalStore.getState().businesses[0]);

  if (!business) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl font-semibold">Comercio no encontrado</p>
          <Link to="/" className="mt-4 inline-block underline">Volver a Lokal</Link>
        </div>
      </div>
    );
  }

  const showShop = business.mode === "shop" || business.mode === "hybrid";
  const showService = business.mode === "service" || business.mode === "hybrid";

  return (
    <div className="tenant-scope min-h-screen pb-24" style={vars}>
      {/* Lokal top shell */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b tenant-border bg-[hsl(var(--t-surface)/0.85)] backdrop-blur px-4 py-2.5 sm:px-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <LokalBadge />
        <Link to={`/admin/${business.slug}`} className="inline-flex items-center gap-1.5 rounded-full border tenant-border px-3 py-1.5 text-xs font-medium hover:tenant-muted">
          <Settings className="h-3.5 w-3.5" /> Editar
        </Link>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 pt-4">
        <TenantHeader business={business} />
        <HighlightsRow highlights={business.highlights} />

        {showShop && business.products.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between px-4 sm:px-6">
              <h2 className="text-2xl font-bold">Productos</h2>
              <span className="text-xs text-[hsl(var(--t-muted-foreground))]">{business.products.length} items</span>
            </div>
            <ProductGrid
              products={business.products}
              layout={business.theme.layout}
              onAdd={(p) => addToCart(business.id, p)}
            />
          </section>
        )}

        {showService && business.services.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between px-4 sm:px-6">
              <h2 className="text-2xl font-bold">Servicios</h2>
            </div>
            <ServiceList services={business.services} business={business} />
          </section>
        )}

        <ReviewsSection
          reviews={business.reviews}
          onAdd={(r) => {
            const id = "r" + Math.random().toString(36).slice(2, 8);
            updateBusiness(business.id, { reviews: [{ id, ...r }, ...business.reviews] });
          }}
        />

        <ContactSection business={business} />

        <footer className="px-4 pt-6 text-center text-xs text-[hsl(var(--t-muted-foreground))] sm:px-6">
          <p>
            {business.name} · {business.category}
          </p>
          <p className="mt-1">Este micro-sitio vive en <Link to="/" className="underline">Lokal</Link>.</p>
        </footer>
      </div>

      {showShop && <CartDrawer business={business} />}
    </div>
  );
}
