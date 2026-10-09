import { approachSteps } from '../content/approach';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function Approach() {
  return (
    <section id="approach" className="section" aria-labelledby="approach-title">
      <div className="container">
        <SectionHeading
          id="approach-title"
          eyebrow="Analytical approach"
          title="From question to decision"
          intro="A general workflow, adapted to each problem."
        />
        <ol className="steps">
          {approachSteps.map((step, i) => (
            <Reveal as="li" key={step.title} className="step" delay={(i % 4) * 70}>
              <span className="step__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
