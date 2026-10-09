import type { SkillGroup } from '../types';

/**
 * ============================================================================
 *  YOUR SKILLS — edit this file.
 * ============================================================================
 *  • These names are SUGGESTED categories, not claims. Delete anything you do
 *    not actually use, and add what you do.
 *  • `level` is deliberately `null` everywhere. Set it to one of:
 *      'Learning' | 'Working' | 'Proficient' | 'Advanced'
 *    only when you are happy to stand behind it. `null` shows no level.
 *  • To add a skill: copy one line `{ name: 'X', level: null },` and edit it.
 *  • To reorder: cut and paste lines, or whole groups.
 */
export const skillGroups: SkillGroup[] = [
  {
    title: 'Querying & Preparation',
    skills: [
      { name: 'SQL', level: null },
      { name: 'Excel', level: null },
      { name: 'Data cleaning and preparation', level: null },
    ],
  },
  {
    title: 'Analysis',
    skills: [
      { name: 'Python', level: null },
      { name: 'Exploratory Data Analysis', level: null },
      { name: 'Statistics', level: null },
    ],
  },
  {
    title: 'Visualization & Reporting',
    skills: [
      { name: 'Power BI', level: null },
      { name: 'Tableau', level: null },
      { name: 'Data visualization', level: null },
    ],
  },
  {
    title: 'Communication',
    skills: [{ name: 'Analytical communication', level: null }],
  },
];
