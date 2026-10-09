export type SkillLevel = 'Learning' | 'Working' | 'Proficient' | 'Advanced';

export interface Skill {
  name: string;
  /** Leave as `null` until you want to show a level. Nothing is shown for null. */
  level: SkillLevel | null;
}

export interface SkillGroup {
  title: string;
  skills: Skill[];
}

export interface Project {
  /** Unique, URL-safe id. Example: "sales-dashboard" */
  id: string;
  title: string;
  summary: string;
  businessQuestion: string;
  dataset: string;
  tools: string[];
  methodology: string[];
  findings: string[];
  recommendations: string[];
  /** Leave '' if there is no link. A link button only appears when this is filled in. */
  repoUrl: string;
  demoUrl: string;
  /** Optional image, e.g. '/projects/my-project.png' (file placed in the /public folder). */
  thumbnail?: string;
  thumbnailAlt?: string;
}

export interface ApproachStep {
  title: string;
  description: string;
}
