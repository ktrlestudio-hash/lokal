import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function StorePhotoCarousel({ photos = [] }) {
  const [idx, setIdx] = React.useState(0);
  if (!photos.length) return null;
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <div className="relative bg-slate-100 dark:bg-black/30 select-none">
      <img src={photos[idx]} alt="" className="w-full object-contain max-h-64" style={{ aspectRatio: '16/9' }} />
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="no-press absolute left-0 top-0 bottom-0 w-14 flex items-center justify-start pl-2"
            aria-label="Anterior foto"
          >
            <span className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center shadow-lg">
              <ChevronDown className="w-4 h-4 rotate-90" strokeWidth={2.5} />
            </span>
          </button>
          <button
            onClick={next}
            className="no-press absolute right-0 top-0 bottom-0 w-14 flex items-center justify-end pr-2"
            aria-label="Siguiente foto"
          >
            <span className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center shadow-lg">
              <ChevronDown className="w-4 h-4 -rotate-90" strokeWidth={2.5} />
            </span>
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`no-press h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
