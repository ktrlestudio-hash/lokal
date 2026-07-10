/**
 * FadeIn - Wrapper de animación de entrada
 * Reemplaza las animaciones CSS fade-up con spring physics
 */

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

const directionOffset = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance,
  className = '',
  once = true,
  amount = 0.2,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });

  const offset = directionOffset[direction];
  const customDistance = distance !== undefined
    ? { [direction === 'up' || direction === 'down' ? 'y' : 'x']: direction === 'up' || direction === 'left' ? distance : -distance }
    : offset;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...customDistance }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...customDistance }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInStagger - Contenedor para animar hijos con stagger
 */
interface FadeInStaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

export function FadeInStagger({
  children,
  staggerDelay = 0.08,
  className = '',
  once = true,
  amount = 0.15,
}: FadeInStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInStaggerItem - Hijo para usar dentro de FadeInStagger
 */
interface FadeInStaggerItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeInStaggerItem({
  children,
  className = '',
  direction = 'up',
}: FadeInStaggerItemProps) {
  const offset = directionOffset[direction];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
