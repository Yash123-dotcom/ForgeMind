
'use client';

import { useEffect, useRef } from 'react';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function Reveal({ children, className = '' }: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    // Never hide content or animate when reduced motion is preferred.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Keep content visible if IntersectionObserver is unavailable.
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.remove('fm-reveal-pending');
          element.classList.add('fm-reveal-visible');
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -30px 0px',
      },
    );

    // Hide only after JavaScript has initialized successfully.
    element.classList.add('fm-reveal-pending');
    observer.observe(element);

    return () => {
      observer.disconnect();
      element.classList.remove('fm-reveal-pending');
    };
  }, []);

  return (
    <div ref={elementRef} className={`fm-reveal ${className}`}>
      {children}
    </div>
  );
}
