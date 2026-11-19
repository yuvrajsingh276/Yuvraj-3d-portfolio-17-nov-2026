import type { Variants } from 'motion/react';

export const PORTFOLIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.04,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62,
      ease: PORTFOLIO_EASE,
    },
  },
};

export const VIEWPORT_CONFIG = { once: true, amount: 0.18 } as const;
