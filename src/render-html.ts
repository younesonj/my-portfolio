/* content → HTML / plain text. Pure string functions: used at build time (vite.config.ts)
   to bake the resume into index.html, and at runtime for the in-game panels. */
import { about, contact, education, meta, projects, school, sectionNames, sectionOrder, skills, ui, work, type Item, type SectionId } from './content';

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tags = (t?: string[]): string => (t && t.length ? `<ul class="tags">${t.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
const ext = (href: string, label: string): string => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;

const itemLi = (i: Item): string =>
  `<li><h4>${esc(i.name)}</h4><p>${esc(i.text)}${i.link ? ` ${ext(i.link.href, i.link.label)}` : ''}</p>${tags(i.tags)}</li>`;

/** One section as an HTML fragment. `h` is the heading level for the section title. */
export function sectionHtml(id: SectionId, h = 2): string {
  const H = (n: number, text: string) => `<h${h + n}>${esc(text)}</h${h + n}>`;
  switch (id) {
    case 'about':
      return (
        H(0, about.title) +
        about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('') +
        `<ul class="dots">${about.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` +
        H(1, 'Languages') +
        `<p>${about.languages.map(esc).join(' · ')}</p>` +
        H(1, education.title) +
        `<ol class="steps">${education.steps.map((s) => `<li><strong>${esc(s.name)}</strong> ${esc(s.text)}</li>`).join('')}</ol>`
      );
    case 'school':
      return H(0, school.title) + `<p class="sub">${esc(school.subtitle)}</p><p>${esc(school.intro)}</p>` + H(1, 'Projects') + `<ul class="items">${school.projects.map(itemLi).join('')}</ul>`;
    case 'work':
      return (
        H(0, work.title) +
        `<p class="sub">${esc(work.subtitle)}</p><p>${esc(work.intro)}</p>` +
        H(1, work.builtTitle) +
        `<ul class="items">${work.built.map(itemLi).join('')}</ul>` +
        H(1, work.opsTitle) +
        `<ul class="items">${work.ops.map(itemLi).join('')}</ul>` +
        `<p><strong>${esc(work.outro)}</strong></p>`
      );
    case 'projects':
      return H(0, projects.title) + `<p>${esc(projects.intro)}</p><ul class="items">${projects.items.map(itemLi).join('')}</ul>`;
    case 'skills':
      return (
        H(0, skills.title) +
        `<dl class="skills">${skills.groups.map((g) => `<dt>${esc(g.name)}</dt><dd>${g.items.map(esc).join(' · ')}</dd>`).join('')}</dl>`
      );
    case 'contact':
      return (
        H(0, contact.title) +
        `<p>${esc(contact.intro)}</p><ul class="links">` +
        contact.links.map((l) => `<li><span>${esc(l.name)}</span> ${ext(l.href, l.label)}</li>`).join('') +
        (contact.email ? `<li><span>Email</span> <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></li>` : '') +
        `</ul>`
      );
  }
}

/** The whole plain resume (goes inside <main id="resume">). */
export function resumeHtml(): string {
  const nav = sectionOrder.map((id) => `<a href="#resume-${id}">${esc(sectionNames[id].label)}</a>`).join('');
  return (
    `<header class="r-head"><p class="r-kicker">${esc(meta.role)} · ${esc(meta.location)}</p><h1>${esc(meta.name)}</h1>` +
    `<p class="r-lead">${esc(meta.headline)} ${esc(meta.focus)}</p><nav class="r-nav" aria-label="Resume sections">${nav}</nav></header>` +
    sectionOrder.map((id) => `<section id="resume-${id}" class="r-sec" aria-label="${esc(sectionNames[id].label)}">${sectionHtml(id)}</section>`).join('')
  );
}

/** curl-friendly resume. */
export function resumeText(): string {
  const out: string[] = [];
  const rule = (t: string) => out.push('', t.toUpperCase(), '-'.repeat(t.length));
  const item = (i: Item) => {
    out.push(`* ${i.name}: ${i.text}${i.tags ? ` [${i.tags.join(', ')}]` : ''}`);
    if (i.link) out.push(`  ${i.link.href}`);
  };
  out.push(meta.name.toUpperCase(), `${meta.role} · ${meta.location}`, '', meta.headline, meta.focus);
  rule(about.title);
  out.push(...about.paragraphs, `Languages: ${about.languages.join(', ')}`);
  rule('Education');
  education.steps.forEach((s) => out.push(`* ${s.name}: ${s.text}`));
  rule(`${school.title} — projects`);
  school.projects.forEach(item);
  rule(work.title);
  out.push(work.subtitle, work.intro, '', `${work.builtTitle}:`);
  work.built.forEach(item);
  out.push('', `${work.opsTitle}:`);
  work.ops.forEach(item);
  out.push('', work.outro);
  rule(projects.title);
  projects.items.forEach(item);
  rule(skills.title);
  skills.groups.forEach((g) => out.push(`${g.name}: ${g.items.join(', ')}`));
  rule(contact.title);
  contact.links.forEach((l) => out.push(`${l.name}: ${l.href}`));
  if (contact.email) out.push(`Email: ${contact.email}`);
  return out.join('\n') + '\n';
}

/** Static shell text (title screen, banner, meta tags), also baked in at build time. */
export function shellVars(): Record<string, string> {
  return {
    NAME: esc(meta.name),
    PAGE_TITLE: esc(`${meta.name} — ${meta.role}`),
    DESCRIPTION: esc(`${meta.headline} ${meta.focus}`),
    SITE_URL: esc(meta.siteUrl),
    T_KICKER: esc(ui.titleKicker),
    T_SUB: esc(ui.titleSub),
    T_HEADLINE: esc(`${meta.headline} ${meta.focus}`),
    T_START: esc(ui.start),
    T_RESUME: esc(ui.resume),
    T_HINT: esc(ui.resumeHint),
    R_BANNER: esc(ui.resumeBanner),
    R_CTA: esc(ui.resumeBannerCta),
  };
}
