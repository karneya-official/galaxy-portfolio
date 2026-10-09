import type { CSSProperties } from 'react';
import { site, isUrl } from '../content/site';

/** Staggered entrance delay, applied through a CSS variable. */
const delay = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;

export default function Hero() {
  const hasResume = isUrl(site.resumeUrl);
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <p className="eyebrow hero__anim" style={delay(0.1)}>
          {site.title}
        </p>
        <h1 id="hero-title" className="hero__title hero__anim" style={delay(0.25)}>
          {site.name}
        </h1>
        <p className="hero__tagline hero__anim" style={delay(0.45)}>
          {site.tagline}
        </p>
        <p className="hero__summary hero__anim" style={delay(0.6)}>
          {site.summary}
        </p>
        <div className="hero__cta hero__anim" style={delay(0.8)}>
          <a className="btn btn--primary" href="#projects">
            Explore My Work
          </a>
          {hasResume ? (
            <a className="btn btn--ghost" href={site.resumeUrl} target="_blank" rel="noopener noreferrer">
              View Resume
            </a>
          ) : (
            <a className="btn btn--ghost" href="#contact">
              Contact Me
            </a>
          )}
        </div>
      </div>

      <a className="scroll-cue" href="#about" aria-label="Scroll to the About section">
        <span className="scroll-cue__label">Scroll</span>
        <span className="scroll-cue__line" aria-hidden="true" />
      </a>
    </section>
  );
}
