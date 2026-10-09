import { useEffect, useRef } from 'react';
import type { Project } from '../types';
import { isUrl } from '../content/site';

interface Props {
  project: Project | null;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="detail__list">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

/**
 * The expanded project view. Uses the browser's native <dialog>, which gives us
 * a proper focus trap, Escape-to-close, and screen-reader semantics for free.
 */
export default function ProjectDetail({ project, onClose, onNavigate, hasPrev, hasNext }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (project && !dlg.open) {
      dlg.showModal();
      document.documentElement.classList.add('modal-open'); // stops the page scrolling behind
    }
    if (!project && dlg.open) dlg.close();
    if (project) bodyRef.current?.scrollTo({ top: 0 });
  }, [project]);

  useEffect(
    () => () => document.documentElement.classList.remove('modal-open'),
    [],
  );

  const handleClose = () => {
    document.documentElement.classList.remove('modal-open');
    onClose();
  };

  return (
    <dialog
      ref={ref}
      className="detail"
      aria-labelledby="detail-title"
      onClose={handleClose}
      onClick={(e) => {
        // Clicking the dark backdrop (the dialog element itself) closes it.
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      {project && (
        <div className="detail__panel">
          <div className="detail__top">
            <p className="eyebrow">Project</p>
            <button type="button" className="icon-btn" onClick={() => ref.current?.close()} aria-label="Close project details">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="detail__body" ref={bodyRef} tabIndex={-1}>
            <h2 id="detail-title" className="detail__title">
              {project.title}
            </h2>
            <p className="detail__summary">{project.summary}</p>

            {project.thumbnail && (
              <img className="detail__image" src={project.thumbnail} alt={project.thumbnailAlt ?? ''} />
            )}

            <div className="detail__grid">
              <section>
                <h3>Business question</h3>
                <p>{project.businessQuestion}</p>
              </section>
              <section>
                <h3>Dataset</h3>
                <p>{project.dataset}</p>
              </section>
              <section>
                <h3>Tools and technologies</h3>
                <p className="tags">
                  {project.tools.map((t, i) => (
                    <span key={`${t}-${i}`} className="tag">
                      {t}
                    </span>
                  ))}
                </p>
              </section>
            </div>

            <section>
              <h3>Analytical methodology</h3>
              <List items={project.methodology} />
            </section>
            <section>
              <h3>Key findings</h3>
              <List items={project.findings} />
            </section>
            <section>
              <h3>Recommendations</h3>
              <List items={project.recommendations} />
            </section>

            <div className="detail__links">
              {isUrl(project.repoUrl) ? (
                <a className="btn btn--ghost" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  View repository
                </a>
              ) : (
                <span className="muted-note">Repository link not added yet.</span>
              )}
              {isUrl(project.demoUrl) ? (
                <a className="btn btn--primary" href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  Live demonstration
                </a>
              ) : (
                <span className="muted-note">Live demonstration link not added yet.</span>
              )}
            </div>
          </div>

          <div className="detail__footer">
            <button type="button" className="btn btn--ghost btn--small" disabled={!hasPrev} onClick={() => onNavigate(-1)}>
              ← Previous
            </button>
            <button type="button" className="btn btn--ghost btn--small" disabled={!hasNext} onClick={() => onNavigate(1)}>
              Next →
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
