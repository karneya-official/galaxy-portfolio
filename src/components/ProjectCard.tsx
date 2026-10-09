import { useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Project } from '../types';
import { isPlaceholder } from '../content/site';

interface Props {
  project: Project;
  index: number;
  onOpen: (id: string) => void;
}

/**
 * A project card. It is a real <button> so it works with keyboard and screen
 * readers. The 3D tilt is applied straight to the DOM (no React state), so
 * moving the mouse over cards never causes a re-render.
 */
export default function ProjectCard({ project, index, onOpen }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const canTilt = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el || !canTilt.current || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * 7).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * 7).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  };

  const placeholder = isPlaceholder(project.title);

  return (
    <button
      ref={ref}
      type="button"
      className="project-card"
      onClick={() => onOpen(project.id)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-haspopup="dialog"
    >
      <span className="project-card__glow" aria-hidden="true" />
      <span className="project-card__media" aria-hidden={project.thumbnail ? undefined : true}>
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.thumbnailAlt ?? ''} loading="lazy" decoding="async" />
        ) : (
          <span className="project-card__placeholder">{String(index + 1).padStart(2, '0')}</span>
        )}
      </span>
      <span className="project-card__body">
        {placeholder && <span className="badge">Placeholder</span>}
        <h3 className="project-card__title">{project.title}</h3>
        <span className="project-card__summary">{project.summary}</span>
        <span className="tags">
          {project.tools.map((t, i) => (
            <span key={`${t}-${i}`} className="tag">
              {t}
            </span>
          ))}
        </span>
        <span className="project-card__more">View project details →</span>
      </span>
    </button>
  );
}
