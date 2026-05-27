export default function PremiumStorefront2026() {
  const products = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    title: 'Placeholder Product',
    category: 'Category',
    price: '$49.99',
    oldPrice: '$79.99',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
    badge: '-35%',
  }))

  const categories = [
    'Featured',
    'Trending',
    'Gaming',
    'Audio',
    'Lifestyle',
    'Accessories',
    'Premium',
  ]

  return (
    <div className="min-h-screen bg-[#070b14] text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-orange-400/10 blur-[140px] rounded-full" />
        <div className="absolute top-[20%] -right-32 w-[420px] h-[420px] bg-amber-300/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-white/[0.03] blur-[160px] rounded-full" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-[#0a0f1bcc]/80 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-[72px] flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-black/40">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-300 to-orange-500" />
          </div>

          <div className="hidden md:flex flex-col leading-none mr-3">
            <span className="text-[15px] font-black tracking-[-0.04em]">
              STORE NAME
            </span>
            <span className="text-[11px] text-white/45 uppercase tracking-[0.2em]">
              Premium Experience
            </span>
          </div>

          <div className="flex-1 relative">
            <div className="h-[44px] rounded-full border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl flex items-center px-4 shadow-xl shadow-black/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                className="w-5 h-5 text-white/45"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>

              <div className="ml-3 text-[14px] text-white/35 font-medium">
                Search products...
              </div>
            </div>
          </div>

          <button className="relative w-11 h-11 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl flex items-center justify-center shadow-xl shadow-black/20 hover:scale-[1.03] transition-all duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386a.75.75 0 0 1 .728.568l.651 2.606m0 0 1.5 6A.75.75 0 0 0 7.242 15h9.516a.75.75 0 0 0 .728-.568l1.742-6.968a.75.75 0 0 0-.728-.932H5.015m0 0L4.5 4.5M7.5 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm12 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
              />
            </svg>

            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-b from-orange-300 to-orange-500 text-[10px] font-black flex items-center justify-center text-black shadow-lg shadow-orange-500/30">
              3
            </div>
          </button>
        </div>
      </header>

      <main className="pt-[88px] pb-[120px] lg:pb-10 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <section className="relative overflow-hidden rounded-[34px] h-[440px] lg:h-[560px] border border-white/[0.05] shadow-[0_40px_120px_rgba(0,0,0,.65)]">
            <img
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1600&auto=format&fit=crop"
              className="absolute inset-0 w-full h-full object-cover scale-[1.04] brightness-[.82] saturate-110"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

            <div className="relative z-10 h-full flex flex-col justify-end p-6 lg:p-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl w-fit mb-5">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-white/70 font-bold">
                  Featured Collection
                </span>
              </div>

              <div className="max-w-[620px]">
                <h1 className="text-[44px] lg:text-[76px] leading-[0.9] font-black tracking-[-0.06em]">
                  PREMIUM
                  <br />
                  DARK STORE
                </h1>

                <p className="mt-5 text-[15px] lg:text-[17px] leading-relaxed text-white/70 max-w-[520px]">
                  Placeholder description for a premium modern storefront
                  experience with cinematic visuals and immersive UI.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="h-[50px] px-6 rounded-full bg-gradient-to-b from-orange-300 to-orange-500 text-black font-black tracking-[-0.02em] shadow-[0_12px_40px_rgba(255,170,80,.35)] hover:scale-[1.02] transition-all duration-300">
                    Explore Now
                  </button>

                  <button className="h-[50px] px-6 rounded-full border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl text-white font-semibold hover:bg-white/[0.1] transition-all duration-300">
                    View Collection
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 lg:grid lg:grid-cols-[280px_1fr] gap-8 items-start">
            <aside className="hidden lg:block sticky top-[100px]">
              <div className="rounded-[28px] border border-white/[0.05] bg-[#0b0f18]/95 backdrop-blur-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,.45)]">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[14px] uppercase tracking-[0.18em] text-white/45 font-black">
                    Categories
                  </h2>

                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.05] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  {categories.map((cat, i) => (
                    <button
                      key={cat}
                      className={`w-full h-[52px] rounded-2xl px-4 flex items-center justify-between transition-all duration-300 border ${
                        i === 0
                          ? 'bg-gradient-to-r from-orange-400/20 to-orange-500/10 border-orange-400/20 text-white'
                          : 'bg-white/[0.03] border-white/[0.03] text-white/70 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="font-semibold tracking-[-0.02em]">
                        {cat}
                      </span>

                      <div className="w-2 h-2 rounded-full bg-white/25" />
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section>
              <div className="flex items-center justify-between mb-5 px-1">
                <div>
                  <h2 className="text-[26px] lg:text-[34px] font-black tracking-[-0.05em] leading-none">
                    Trending Products
                  </h2>
                  <p className="mt-2 text-white/45 text-[14px]">
                    Curated premium selection placeholder.
                  </p>
                </div>

                <button className="hidden lg:flex h-[46px] px-5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl items-center gap-2 text-[14px] font-semibold text-white/70 hover:bg-white/[0.06] transition-all duration-300">
                  Filter
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[14px] lg:gap-[18px]">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group relative rounded-[28px] overflow-hidden border border-white/[0.04] bg-[#0b0f18] shadow-[0_20px_50px_rgba(0,0,0,.55)] hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,.7)] transition-all duration-500"
                  >
                    <div className="relative aspect-[1/1.38] overflow-hidden">
                      <img
                        src={product.image}
                        className="absolute inset-0 w-full h-full object-cover brightness-[.96] contrast-110 saturate-110 group-hover:scale-[1.05] transition-all duration-700"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

                      <div className="absolute top-3 left-3 h-[30px] px-3 rounded-full bg-gradient-to-b from-orange-300 to-orange-500 text-black text-[11px] font-black tracking-[-0.02em] flex items-center justify-center shadow-[0_10px_24px_rgba(255,180,77,.35)]">
                        {product.badge}
                      </div>

                      <button className="absolute top-3 right-3 w-9 h-9 rounded-full border border-white/[0.12] bg-black/35 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m21 8.25-8.25 8.25-4.5-4.5"
                          />
                        </svg>
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-2">
                          {product.category}
                        </div>

                        <h3 className="text-[17px] lg:text-[18px] font-black tracking-[-0.04em] leading-tight">
                          {product.title}
                        </h3>

                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div>
                            <div className="text-white/35 line-through text-[13px] font-medium">
                              {product.oldPrice}
                            </div>

                            <div className="text-[18px] lg:text-[20px] font-black tracking-[-0.04em]">
                              {product.price}
                            </div>
                          </div>

                          <button className="w-12 h-12 rounded-full bg-gradient-to-b from-orange-300 to-orange-500 text-black font-black shadow-[0_10px_24px_rgba(255,180,77,.35)] flex items-center justify-center hover:scale-[1.06] transition-all duration-300">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50 rounded-[26px] border border-white/[0.06] bg-[#0a0f1bcc] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,.45)] px-2 py-2">
        <div className="grid grid-cols-4 gap-2">
          {['Home', 'Search', 'Saved', 'Cart'].map((item, i) => (
            <button
              key={item}
              className={`h-[58px] rounded-2xl flex flex-col items-center justify-center text-[11px] font-semibold transition-all duration-300 ${
                i === 0
                  ? 'bg-gradient-to-b from-orange-300 to-orange-500 text-black'
                  : 'text-white/55 hover:bg-white/[0.05]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-current opacity-80 mb-1" />
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
