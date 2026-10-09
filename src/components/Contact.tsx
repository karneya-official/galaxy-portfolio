import { useState } from 'react';
import type { FormEvent } from 'react';
import { site, isEmail, isUrl } from '../content/site';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

interface LinkItem {
  label: string;
  value: string;
  href: string;
  ok: boolean;
  hint: string;
}

export default function Contact() {
  const emailOk = isEmail(site.email);
  const [message, setMessage] = useState('');
  const [fromName, setFromName] = useState('');

  const links: LinkItem[] = [
    {
      label: 'Email',
      value: site.email,
      href: `mailto:${site.email}`,
      ok: emailOk,
      hint: 'Add your email in src/content/site.ts',
    },
    {
      label: 'LinkedIn',
      value: site.linkedin,
      href: site.linkedin,
      ok: isUrl(site.linkedin),
      hint: 'Add your LinkedIn URL in src/content/site.ts',
    },
    {
      label: 'GitHub',
      value: site.github,
      href: site.github,
      ok: isUrl(site.github),
      hint: 'Add your GitHub URL in src/content/site.ts',
    },
    {
      label: 'Resume',
      value: site.resumeUrl,
      href: site.resumeUrl,
      ok: isUrl(site.resumeUrl),
      hint: 'Add your resume link in src/content/site.ts',
    },
  ];

  // No server needed: the form opens the visitor's own email app with the message pre-filled.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk) return;
    const subject = encodeURIComponent(`Portfolio enquiry${fromName ? ` from ${fromName}` : ''}`);
    const body = encodeURIComponent(`${message}\n\n— ${fromName}`);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="section section--last" aria-labelledby="contact-title">
      <div className="container">
        <SectionHeading
          id="contact-title"
          eyebrow="Contact"
          title="Let's talk about your data"
          intro="Recruiters and collaborators are welcome to get in touch."
        />

        <div className="contact__grid">
          <Reveal as="ul" className="contact__links">
            {links.map((l) => (
              <li key={l.label}>
                {l.ok ? (
                  <a
                    className="contact__link"
                    href={l.href}
                    {...(l.label === 'Email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    <span className="contact__label">{l.label}</span>
                    <span className="contact__value">{l.label === 'Resume' ? 'Open resume' : l.value}</span>
                  </a>
                ) : (
                  <div className="contact__link is-empty">
                    <span className="contact__label">{l.label}</span>
                    <span className="contact__value">Not added yet</span>
                    <span className="contact__hint">{l.hint}</span>
                  </div>
                )}
              </li>
            ))}
          </Reveal>

          <Reveal className="panel contact__form" delay={120}>
            <form onSubmit={onSubmit} aria-describedby="form-note">
              <label htmlFor="cf-name">Your name</label>
              <input
                id="cf-name"
                type="text"
                autoComplete="name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                disabled={!emailOk}
              />
              <label htmlFor="cf-msg">Message</label>
              <textarea
                id="cf-msg"
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!emailOk}
              />
              <button type="submit" className="btn btn--primary" disabled={!emailOk}>
                Compose email
              </button>
              <p id="form-note" className="form-note">
                {emailOk
                  ? 'This opens your email app with the message ready to send.'
                  : 'The form is switched off until an email address is added in src/content/site.ts.'}
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
