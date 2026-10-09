import Reveal from './Reveal';

interface Props {
  eyebrow: string;
  title: string;
  id: string;
  intro?: string;
}

export default function SectionHeading({ eyebrow, title, id, intro }: Props) {
  return (
    <Reveal className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {intro && <p className="section-intro">{intro}</p>}
    </Reveal>
  );
}
