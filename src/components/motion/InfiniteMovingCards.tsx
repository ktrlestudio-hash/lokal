/**
 * InfiniteMovingCards (Inspirado en Aceternity UI)
 * Carrusel infinito de testimonios/cards con animación suave
 * Adaptado para LOKAL con colores brand y dark mode
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface CardItem {
  id: string | number;
  content: React.ReactNode;
}

interface InfiniteMovingCardsProps {
  items: CardItem[];
  direction?: 'left' | 'right';
  speed?: 'slow' | 'normal' | 'fast';
  pauseOnHover?: boolean;
  className?: string;
  cardClassName?: string;
}

export function InfiniteMovingCards({
  items,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className = '',
  cardClassName = '',
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      // Duplicar items para el efecto infinito
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        scrollerRef.current?.appendChild(duplicatedItem);
      });

      // Configurar dirección
      if (containerRef.current) {
        containerRef.current.style.setProperty(
          '--animation-direction',
          direction === 'left' ? 'forwards' : 'reverse'
        );
      }

      // Configurar velocidad
      const speedMap = {
        slow: '40s',
        normal: '25s',
        fast: '15s',
      };
      if (containerRef.current) {
        containerRef.current.style.setProperty('--animation-duration', speedMap[speed]);
      }

      setStart(true);
    }
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] ${className}`}
    >
      <div
        ref={scrollerRef}
        className={`flex w-max gap-4 ${
          start ? 'animate-scroll-infinite' : ''
        } ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
        style={{
          animationDirection: 'var(--animation-direction, forwards)',
          animationDuration: 'var(--animation-duration, 25s)',
        }}
      >
        {items.map((item) => (
          <motion.div
            key={item.id}
            className={`flex-shrink-0 ${cardClassName}`}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {item.content}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
