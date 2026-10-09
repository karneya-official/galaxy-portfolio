import { useEffect, useRef } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';

/**
 * Fades content in once as it scrolls into view. One shared observer is reused
 * by every Reveal so there is almost no cost. CSS handles the animation and
 * switches it off for visitors who prefer reduced motion.
 */
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            sharedObserver?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
  }
  return sharedObserver;
}

interface RevealProps {
  as?: 'div' | 'ul' | 'li' | 'section' | 'p';
  delay?: number; // milliseconds
  className?: string;
  children: ReactNode;
}

export default function Reveal({ as = 'div', delay = 0, className = '', children }: RevealProps) {
  // All allowed tags are plain HTML elements, so one element type is accurate enough here.
  const Tag = as as ElementType as 'div';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const observer = getObserver();
    if (!el) return;
    if (!observer) {
      el.classList.add('is-visible');
      return;
    }
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties;
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}
