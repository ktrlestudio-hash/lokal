import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Search, Sparkles, Store, Scissors, Leaf } from "lucide-react";
import { useState, useMemo } from "react";
import { useLokalStore } from "@/lib/store";
import { useApplyTenantToRoot } from "@/lib/tenantTheme";

export default function Index() {
  const businesses = useLokalStore((s) => s.businesses);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "shop" | "service" | "hybrid">("all");

  // Make sure root doesn't carry tenant vars on landing.
  useApplyTenantToRoot(undefined, false);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const matchesQ = query
        ? (b.name + b.category + b.tagline).toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesF = filter === "all" ? true : b.mode === filter;
      return matchesQ && matchesF;
    });
  }, [businesses, query, filter]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl gradient-brand text-lg font-bold text-white">L</span>
            <span className="text-xl font-bold tracking-tight">Lokal</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <a href="#descubrir" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-secondary">Descubrir</a>
            <a href="#como-funciona" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-secondary">Cómo funciona</a>
            <a href="#para-comercios" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-secondary">Para comercios</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary sm:inline-block">Panel</Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-smooth hover:opacity-90"
            >
              Crear mi tienda <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-sunrise opacity-90" />
        <div className="absolute inset-0 -z-10 noise" />
        <div className="container grid gap-8 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3 w-3" /> Marketplace de barrio · 2026
            </span>
            <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight text-primary text-balance sm:text-6xl md:text-7xl">
              Tu barrio,
              <br />
              <span className="italic [font-family:'Fraunces',serif] font-semibold">en un tap.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary/80">
              Lokal reúne a los comercios de tu zona en un solo lugar. Cada uno tiene su propio micro-sitio personalizable, y los pedidos se coordinan directo por WhatsApp. Sin complicaciones.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#descubrir" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-smooth hover:opacity-90">
                Descubrir comercios <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-primary shadow-soft hover:bg-white">
                Soy comerciante
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-primary/70">
              <div className="flex items-center gap-2"><Store className="h-4 w-4" /> +500 comercios</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 12 barrios</div>
              <div className="flex items-center gap-2">⚡ Setup en 5 min</div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto animate-rise animate-rise-delay-2 md:ml-auto">
            <div className="relative h-[520px] w-[280px] rounded-[2.5rem] border-[10px] border-primary bg-primary shadow-elevated">
              <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
              <div className="h-full w-full overflow-hidden rounded-[1.8rem] bg-white">
                <div className="h-32 w-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80" className="h-full w-full object-cover" alt="" />
                </div>
                <div className="-mt-6 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-[hsl(18_85%_42%)] text-2xl">🥐</div>
                  <h3 className="mt-2 text-lg font-bold text-[hsl(230_25%_12%)]">El Rosal</h3>
                  <p className="text-xs text-[hsl(230_10%_40%)]">Panadería artesanal · ⭐ 4.9</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {["Pan madre", "Croissant", "Café 250g", "Brownie"].map((n, i) => (
                      <div key={n} className="rounded-xl bg-[hsl(40_20%_96%)] p-2">
                        <div className="h-12 w-full rounded-lg bg-[hsl(18_85%_42%/0.15)]" />
                        <p className="mt-1 text-[10px] font-semibold text-[hsl(230_25%_12%)]">{n}</p>
                        <p className="text-[9px] font-bold text-[hsl(18_85%_42%)]">${(1200 + i * 700).toLocaleString("es-AR")}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-full bg-[hsl(142_70%_45%)] px-3 py-1.5 text-center text-[10px] font-semibold text-white">
                    Enviar pedido por WhatsApp
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-4 top-16 hidden rotate-[-6deg] rounded-2xl bg-white p-3 shadow-elevated md:block">
              <p className="text-[10px] font-semibold text-muted-foreground">Pedido confirmado</p>
              <p className="text-sm font-bold">2× Pan madre · $7.600</p>
            </div>
          </div>
        </div>
      </section>

      {/* DISCOVER */}
      <section id="descubrir" className="container py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Descubrir</span>
            <h2 className="mt-1 text-4xl font-bold tracking-tight">Comercios en Lokal</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">Cada uno con su propio estilo. Entrá, mirá, y escribiles por WhatsApp.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar panadería, peluquería..."
              className="w-48 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { k: "all", label: "Todos", icon: Sparkles },
            { k: "shop", label: "Tiendas", icon: Store },
            { k: "service", label: "Servicios", icon: Scissors },
            { k: "hybrid", label: "Híbridos", icon: Leaf },
          ].map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setFilter(k as typeof filter)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-smooth ${
                filter === k
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Business cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b, idx) => (
            <Link
              key={b.id}
              to={`/tienda/${b.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elevated animate-rise"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="relative h-44 overflow-hidden">
                {b.cover && <img src={b.cover} alt={b.name} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span
                  className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: `hsl(${b.theme.primary})` }}
                >
                  {b.mode === "shop" ? "Tienda" : b.mode === "service" ? "Servicio" : "Híbrido"}
                </span>
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white text-xl"
                    style={{ backgroundColor: `hsl(${b.theme.primary})` }}
                  >
                    {b.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold">{b.name}</h3>
                    <p className="truncate text-xs opacity-80">{b.category}</p>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur">⭐ {b.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">{b.tagline}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.products.length} prod · {b.services.length} serv</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand">
                    Ver tienda <ArrowRight className="h-3 w-3 transition-smooth group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No encontramos comercios con ese filtro.
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="bg-primary text-primary-foreground">
        <div className="container py-20">
          <span className="text-xs font-semibold uppercase tracking-wider text-highlight">Cómo funciona</span>
          <h2 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">Del barrio a tu WhatsApp en 3 pasos.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Descubrí", d: "Explorá comercios cerca tuyo, con su propio estilo y productos." },
              { n: "02", t: "Armá tu pedido", d: "Sumá productos a la lista o elegí un servicio. Total transparente." },
              { n: "03", t: "WhatsApp directo", d: "Enviás un mensaje listo al comercio y coordinás pago y entrega." },
            ].map((s) => (
              <div key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-5xl font-bold text-highlight [font-family:'Fraunces',serif]">{s.n}</div>
                <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-primary-foreground/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR MERCHANTS */}
      <section id="para-comercios" className="container py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Para comercios</span>
            <h2 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">Tu propia web, sin ingenieros.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Elegí colores, tipografía y layout. Subí tus productos o servicios. Tus clientes te escriben directo por WhatsApp — vos seguís con lo que ya sabés hacer.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Micro-sitio 100% personalizable",
                "Pedidos por WhatsApp con total calculado",
                "Modo tienda, servicio o ambos",
                "Visible dentro del marketplace Lokal",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/admin" className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-soft transition-smooth hover:opacity-90">
              Abrir el panel <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {businesses.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="aspect-[4/5] rounded-3xl p-4 shadow-soft"
                style={{ backgroundColor: `hsl(${b.theme.primary})`, color: "white" }}
              >
                <div className="text-3xl">{b.logo}</div>
                <div className="mt-auto">
                  <p className="text-xs opacity-80">{b.category}</p>
                  <p className="text-lg font-bold">{b.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-secondary/40">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg gradient-brand text-sm font-bold text-white">L</span>
            <span className="font-semibold">Lokal</span>
            <span className="text-xs text-muted-foreground">· El marketplace de tu barrio.</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Lokal. Hecho con ❤️ para comercios locales.</p>
        </div>
      </footer>
    </div>
  );
}
