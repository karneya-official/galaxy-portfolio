import { site } from '../content/site';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const LOOKS_FOR = [
  { title: 'Patterns', text: 'Trends, segments and relationships hidden in the numbers.' },
  { title: 'Inconsistencies', text: 'Gaps, duplicates and values that do not add up.' },
  { title: 'Decisions', text: 'Findings translated into actions people can take.' },
];

/** Decorative concentric "ripple" motif that echoes the ocean background. */
function RippleMotif() {
  return (
    <svg className="ripple-motif" viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      {[18, 36, 56, 78, 102].map((r, i) => (
        <ellipse
          key={r}
          cx="120"
          cy="60"
          rx={r * 1.15}
          ry={r * 0.36}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.75 - i * 0.13}
          strokeWidth="1"
        />
      ))}
      <circle cx="120" cy="60" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container">
        <SectionHeading id="about-title" eyebrow="About" title="Finding the signal in the data" />

        <div className="about__grid">
          <Reveal className="about__text">
            {site.aboutParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <ul className="about__looks" aria-label="What I look for in data">
              {LOOKS_FOR.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="panel about__card" delay={120}>
            <RippleMotif />
            <dl className="facts">
              {site.aboutFacts.map((f) => (
                <div key={f.label} className="facts__row">
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
