/**
 * TextGenerate (Inspirado en Aceternity UI)
 * Efecto de texto que aparece palabra por palabra
 * Adaptado para LOKAL con colores brand y dark mode
 */

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface TextGenerateProps {
  text: string;
  className?: string;
  wordClassName?: string;
  highlightWords?: string[];
  highlightClassName?: string;
  delay?: number;
  once?: boolean;
}

export function TextGenerate({
  text,
  className = '',
  wordClassName = '',
  highlightWords = [],
  highlightClassName = 'text-brand dark:text-brand',
  delay = 0,
  once = true,
}: TextGenerateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.3 });
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay },
    }),
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 150,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={`flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {words.map((word, index) => {
        const isHighlight = highlightWords.some(
          (hw) => word.toLowerCase().includes(hw.toLowerCase())
        );
        return (
          <motion.span
            key={index}
            variants={child}
            className={`mr-[0.25em] ${isHighlight ? highlightClassName : wordClassName}`}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

/**
 * TextReveal - Texto que se revela de izquierda a derecha
 */
interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function TextReveal({
  text,
  className = '',
  delay = 0,
  once = true,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.5 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ x: '-100%' }}
        animate={isInView ? { x: '100%' } : { x: '-100%' }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.76, 0, 0.24, 1],
        }}
        className="absolute inset-0 bg-brand/20 z-10"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, delay: delay + 0.4 }}
      >
        {text}
      </motion.span>
    </div>
  );
}
