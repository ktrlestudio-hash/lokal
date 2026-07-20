import React, { useRef, useEffect } from 'react';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import CategoryIcon from '../../CategoryIcon';
import { CATEGORIES } from '../../categories';

export default function CategoryFilterBar({ filterCategory, setFilterCategory, categories = CATEGORIES, presentIds, navigate }) {
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    const onWheel = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY + e.deltaX; };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { el.removeEventListener('scroll', checkScroll); el.removeEventListener('wheel', onWheel); ro.disconnect(); };
  }, []);

  const onMouseDown = (e) => { isDragging.current = true; dragStartX.current = e.pageX - scrollRef.current.offsetLeft; dragScrollLeft.current = scrollRef.current.scrollLeft; scrollRef.current.style.cursor = 'grabbing'; };
  const onMouseMove = (e) => { if (!isDragging.current) return; e.preventDefault(); const x = e.pageX - scrollRef.current.offsetLeft; scrollRef.current.scrollLeft = dragScrollLeft.current - (x - dragStartX.current); };
  const onMouseUp   = () => { isDragging.current = false; if (scrollRef.current) scrollRef.current.style.cursor = ''; };

  const cats = categories.filter(c => c.parentId === null && (!presentIds || presentIds.has(c.id)));
  const btnClass = (active) => `shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-primary text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-surface-card-2/70 dark:hover:bg-white/12'}`;

  return (
    <div className="relative w-full min-w-0 overflow-hidden flex items-center">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-none px-5 lg:px-8 py-3 select-none w-full min-w-0"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <button onClick={() => setFilterCategory(null)} className={btnClass(!filterCategory)}>Todas</button>
        {cats.map(cat => (
          <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)} className={btnClass(filterCategory === cat.id)}>
            <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
            <span>{cat.name.split(' ')[0]}</span>
          </button>
        ))}
        {navigate && (
          <button onClick={() => navigate('categorias')} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-surface-card-2/70 dark:hover:bg-white/12 border border-dashed border-slate-300 dark:border-white/20">
            <LayoutGrid className="w-4 h-4" />
            <span>Ver todas</span>
          </button>
        )}
      </div>
      {canScrollRight && (
        <button onClick={() => scrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
          className="absolute right-0 flex items-center justify-center w-10 h-full bg-gradient-to-l from-surface-card-2 to-transparent pr-2 text-ink-dim hover:text-ink transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
