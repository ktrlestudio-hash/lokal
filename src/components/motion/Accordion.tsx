/**
 * Accordion (Inspirado en shadcn/ui + Motion)
 * Acordeón accesible con animaciones suaves de altura
 * Adaptado para LOKAL con colores brand y dark mode
 */

import React, { createContext, useContext, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

// ── Context ───────────────────────────────────────────────────────────────────
interface AccordionContextValue {
  openItem: string | null;
  setOpenItem: (id: string | null) => void;
}

const AccordionContext = createContext<AccordionContextValue>({
  openItem: null,
  setOpenItem: () => {},
});

// ── Accordion Root ────────────────────────────────────────────────────────────
interface AccordionProps {
  children: React.ReactNode;
  defaultOpen?: string | null;
  className?: string;
}

export function Accordion({ children, defaultOpen = null, className = '' }: AccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(defaultOpen);

  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div className={`space-y-3 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

// ── Accordion Item ────────────────────────────────────────────────────────────
interface AccordionItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ id, children, className = '' }: AccordionItemProps) {
  return (
    <div
      className={`border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-surface-card/50 ${className}`}
    >
      {children}
    </div>
  );
}

// ── Accordion Trigger ─────────────────────────────────────────────────────────
interface AccordionTriggerProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

export function AccordionTrigger({ children, id, className = '' }: AccordionTriggerProps) {
  const { openItem, setOpenItem } = useContext(AccordionContext);
  const isOpen = openItem === id;

  return (
    <motion.button
      onClick={() => setOpenItem(isOpen ? null : id)}
      className={`no-press w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors ${className}`}
      whileTap={{ scale: 0.995 }}
    >
      <span className="font-semibold text-ink text-sm pr-4">
        {children}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <ChevronDown
          className={`w-4 h-4 shrink-0 ${isOpen ? 'text-brand' : 'text-ink-dim'}`}
        />
      </motion.div>
    </motion.button>
  );
}

// ── Accordion Content ─────────────────────────────────────────────────────────
interface AccordionContentProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

export function AccordionContent({ children, id, className = '' }: AccordionContentProps) {
  const { openItem } = useContext(AccordionContext);
  const isOpen = openItem === id;
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: 'auto',
            opacity: 1,
            transition: {
              height: { type: 'spring', stiffness: 400, damping: 30 },
              opacity: { duration: 0.2, delay: 0.05 },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: { type: 'spring', stiffness: 400, damping: 30 },
              opacity: { duration: 0.15 },
            },
          }}
          className="overflow-hidden"
        >
          <div
            ref={contentRef}
            className={`px-6 pb-5 text-ink-dim text-sm leading-relaxed border-t border-slate-100 dark:border-white/5 pt-4 ${className}`}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
