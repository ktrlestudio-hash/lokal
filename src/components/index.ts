/**
 * Components Index
 * Exporta todos los componentes reutilizables
 */

// UI Components
export { Button, Input, Card, Badge, Tag, Avatar, Modal, AlertDialog } from './ui';

// Cards
export { DemandaCard, DemandaCardGrid, DemandaCardList } from './cards';

// Layout
export { Header, Sidebar } from './layout';

// Motion Components (nuevos - 2026)
export { FadeIn, FadeInStagger, FadeInStaggerItem } from './motion/FadeIn';
export { ScaleOnTap, HoverScale } from './motion/ScaleOnTap';
export { InfiniteMovingCards } from './motion/InfiniteMovingCards';
export { TextGenerate, TextReveal } from './motion/TextGenerate';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './motion/Accordion';

// Re-exportar motion/react para conveniencia
export { motion, AnimatePresence, useInView } from 'motion/react';
