import { skillGroups } from '../content/skills';
import type { SkillLevel } from '../types';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const LEVELS: SkillLevel[] = ['Learning', 'Working', 'Proficient', 'Advanced'];

/** Four small pips. Only rendered when a level has been set. */
function LevelPips({ level }: { level: SkillLevel }) {
  const filled = LEVELS.indexOf(level) + 1;
  return (
    <span className="level" title={level}>
      <span className="level__pips" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <span key={l} className={i < filled ? 'on' : ''} />
        ))}
      </span>
      <span className="level__text">{level}</span>
    </span>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeading
          id="skills-title"
          eyebrow="Skills"
          title="Tools and methods"
          intro="Grouped by what they are used for."
        />
        <div className="skills__grid">
          {skillGroups.map((group, i) => (
            <Reveal key={group.title} className="panel skill-group" delay={i * 80}>
              <h3>{group.title}</h3>
              <ul>
                {group.skills.map((s) => (
                  <li key={s.name}>
                    <span className="skill__name">{s.name}</span>
                    {s.level && <LevelPips level={s.level} />}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
