"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Standard repeatable entrance from FRONTEND_SPEC 2.1.
 * Every non-pinned section uses this reveal.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 20,
  blur = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  blur?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: blur ? "blur(10px)" : "blur(0px)", y }}
      whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      viewport={{ once: false, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

