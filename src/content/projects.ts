import type { Project } from '../types';

/**
 * ============================================================================
 *  YOUR PROJECTS — edit this file.
 * ============================================================================
 *  HOW TO…
 *  • Add a project:    copy one whole `{ ... },` block, paste it at the end of
 *                      the list, and give it a new unique `id`.
 *  • Edit a project:   change the text between the quotes.
 *  • Remove a project: delete its whole `{ ... },` block.
 *  • Reorder:          move blocks up or down. The first one appears first.
 *  • Add a link:       put a full URL in repoUrl / demoUrl. A button appears only
 *                      when the value is not empty ('').
 *  • Add an image:     put the file in the /public/projects folder and set
 *                      thumbnail: '/projects/your-file.png' plus thumbnailAlt.
 *
 *  Everything below is a clearly marked PLACEHOLDER. No real results are claimed.
 */
const placeholder = (n: number): Project => ({
  id: `placeholder-project-${n}`,
  title: `[Project title goes here — ${n}]`,
  summary: '[Add a one- or two-sentence summary of this project.]',
  businessQuestion: '[Add the question this analysis set out to answer.]',
  dataset: '[Describe the dataset: source, size, time period, and any limitations.]',
  tools: ['[Tool]', '[Tool]', '[Tool]'],
  methodology: [
    '[Add the first step of your method.]',
    '[Add the second step of your method.]',
    '[Add the third step of your method.]',
  ],
  findings: ['[Add your findings here.]'],
  recommendations: ['[Add your recommendations here.]'],
  repoUrl: '',
  demoUrl: '',
});

export const projects: Project[] = [
  placeholder(1),
  placeholder(2),
  placeholder(3),
  placeholder(4),
];
