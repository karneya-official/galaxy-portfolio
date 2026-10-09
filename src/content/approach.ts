import type { ApproachStep } from '../types';

/**
 * A general analytical workflow. It describes a typical way of working, not a
 * claim that every project follows exactly these steps. Edit the wording to
 * match how YOU work.
 */
export const approachSteps: ApproachStep[] = [
  {
    title: 'Define the problem',
    description: 'Clarify the question, who will use the answer, and what a useful result looks like.',
  },
  {
    title: 'Inspect the data',
    description: 'Understand where the data comes from, what each field means, and what is missing.',
  },
  {
    title: 'Clean and validate',
    description: 'Fix errors, handle gaps and duplicates, and check that the data can be trusted.',
  },
  {
    title: 'Explore',
    description: 'Summarize and visualize the data to see its shape, ranges and relationships.',
  },
  {
    title: 'Find patterns and anomalies',
    description: 'Test ideas, look for trends and outliers, and investigate what does not add up.',
  },
  {
    title: 'Communicate findings',
    description: 'Present results in plain language with visuals that make the point quickly.',
  },
  {
    title: 'Recommend next steps',
    description: 'Turn findings into specific actions, with honest notes on limits and uncertainty.',
  },
];
