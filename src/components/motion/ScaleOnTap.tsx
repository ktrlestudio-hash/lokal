/**
 * ScaleOnTap - Wrapper que añade escala al toque/clic
 * Reemplaza el CSS active:scale-[0.93] con spring physics
 */

import React from 'react';
import { motion } from 'motion/react';

interface ScaleOnTapProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function ScaleOnTap({
  children,
  className = '',
  scale = 0.94,
  onClick,
  disabled = false,
}: ScaleOnTapProps) {
  return (
    <motion.div
      className={className}
      whileTap={disabled ? {} : { scale }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={disabled ? undefined : onClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * HoverScale - Wrapper con escala en hover + tap
 */
interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
  onClick?: () => void;
}

export function HoverScale({
  children,
  className = '',
  hoverScale = 1.02,
  tapScale = 0.96,
  onClick,
}: HoverScaleProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
