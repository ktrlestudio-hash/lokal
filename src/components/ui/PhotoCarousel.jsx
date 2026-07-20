import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function PhotoCarousel({ photos = [], className = '' }) {
  const [idx, setIdx] = React.useState(0);
  if (!photos.length) return null;
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <div className={`relative bg-surface-card-2 dark:bg-black/30 ${className}`}>
      <img
        src={photos[idx]}
        alt=""
        decoding="async"
        className="w-full object-contain max-h-72"
        style={{ aspectRatio: '16/9' }}
      />
      {photos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
