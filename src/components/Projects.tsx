import { useState } from 'react';
import { projects } from '../content/projects';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';

export default function Projects() {
  const [openId, setOpenId] = useState<string | null>(null);
  const index = projects.findIndex((p) => p.id === openId);
  const current = index >= 0 ? projects[index] : null;

  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <div className="container container--wide">
        <SectionHeading
          id="projects-title"
          eyebrow="Projects"
          title="Selected work"
          intro="Open a project to read the question, method, findings and recommendations."
        />

        <ul className="projects__grid">
          {projects.map((p, i) => (
            <li key={p.id}>
              <Reveal delay={(i % 3) * 90}>
                <ProjectCard project={p} index={i} onOpen={setOpenId} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      <ProjectDetail
        project={current}
        onClose={() => setOpenId(null)}
        onNavigate={(dir) => {
          const next = projects[index + dir];
          if (next) setOpenId(next.id);
        }}
        hasPrev={index > 0}
        hasNext={index >= 0 && index < projects.length - 1}
      />
    </section>
  );
}
