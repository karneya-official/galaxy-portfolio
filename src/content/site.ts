/**
 * ============================================================================
 *  YOUR PERSONAL DETAILS — edit this file first.
 * ============================================================================
 *  Anything written in [square brackets] is a placeholder. Replace it (and
 *  remove the brackets) with your real information.
 *
 *  Links: leave a value as '' (empty quotes) if you do not have it yet. The
 *  website will then show a "not added yet" note instead of a broken link.
 */
export const site = {
  /** Your name. Shown in the hero, the navigation and the footer. */
  name: '[Your Name]',
  /** Short brand shown top-left in the navigation, e.g. your initials. */
  brand: '[YN]',
  title: 'Data Analyst',
  tagline: 'Turning data into clear, actionable insights.',
  summary:
    '[Write one or two sentences about the kind of data work you do and what you enjoy about it.]',

  // ---- Contact (leave '' until you have them) ------------------------------
  email: '', // example: 'you@example.com'
  linkedin: '', // example: 'https://www.linkedin.com/in/your-profile'
  github: '', // example: 'https://github.com/your-username'
  /** A link to your resume. Put a PDF in the /public folder and use '/resume.pdf', or paste a full URL. */
  resumeUrl: '',

  // ---- About section --------------------------------------------------------
  aboutParagraphs: [
    '[Describe your background in a sentence or two: where you studied, worked, or how you got into data.]',
    '[Describe what draws you to analysis: finding patterns, investigating inconsistencies, answering questions with evidence.]',
    '[Describe the kind of problems or teams you would like to work with.]',
  ],
  /** Short facts shown beside the About text. Add, remove or rename rows freely. */
  aboutFacts: [
    { label: 'Focus', value: '[Your focus area]' },
    { label: 'Based in', value: '[Your location]' },
    { label: 'Languages', value: '[Languages you speak]' },
    { label: 'Open to', value: '[Roles or work you are looking for]' },
  ],
};

/** True when the string still looks like an unfilled [placeholder]. */
export const isPlaceholder = (s: string) => /^\s*\[.*\]\s*$/.test(s);

/** Only treat a value as a usable link if it looks like a real URL. */
export const isUrl = (s: string) => /^(https?:\/\/|\/)/i.test(s.trim());
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
