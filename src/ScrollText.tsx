import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** Keep row controls fixed while long text can be read by touch or keyboard. */
export function ScrollText({ children, label, className = '' }: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = () => {
    const element = ref.current;
    if (element) setEdges({ left: element.scrollLeft > 1, right: element.scrollWidth - element.clientWidth - element.scrollLeft > 1 });
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [children]);

  const mask = `linear-gradient(to right, ${edges.left ? 'transparent, black 16px' : 'black, black'}, ${edges.right ? 'black calc(100% - 20px), transparent' : 'black, black'})`;
  return (
    <div ref={ref} onScroll={measure} tabIndex={edges.left || edges.right ? 0 : undefined}
      role="region" aria-label={label} title={label}
      className={`min-w-0 flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar whitespace-nowrap rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-stone-400 ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}>
      <div className="w-max min-w-full pr-1">{children}</div>
    </div>
  );
}
