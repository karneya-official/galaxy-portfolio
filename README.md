# Galaxy Portfolio — Data Analyst

A cosmic sky above a dark, glowing ocean. The sky and water are drawn live in WebGL,
react to your mouse, and ripple where you move over the water. All personal details and
projects are **placeholders in [square brackets]** for you to replace.

> Nothing here has been published, and your existing GitHub repository
> (`karneya-official/Portfolio`) has not been touched.

---

## 1. Run it on your computer (first time)

You need **Node.js** (the free tool that runs the website's build system).

1. Install the **LTS** version from <https://nodejs.org>. Accept the defaults.
2. Put this project in `D:\Data Analystics\Galaxy Portfolio` (check that folder first: don't overwrite anything already there).
3. Open that folder in File Explorer, click the address bar, type `cmd`, press **Enter**. A black terminal window opens in the right place.
4. Type these, pressing **Enter** after each:

```
npm install
npm run dev
```

- `npm install` downloads the libraries (React, Vite). Only needed the first time. It takes a minute.
- `npm run dev` starts a local test server. Leave the window open.

5. Open **http://localhost:5173** in your browser. Edit a file, save, and the page updates itself.
6. Press **Ctrl+C** in the terminal to stop.

## 2. Replace the placeholders

All content lives in `src/content/`. These are plain text files: change the words between quotes.

| File | What it controls |
| --- | --- |
| `site.ts` | Your name, tagline, summary, About text, email, LinkedIn, GitHub, resume link |
| `skills.ts` | Skill groups and levels (all levels start empty on purpose) |
| `projects.ts` | The project gallery (see below) |
| `approach.ts` | The 7 analytical-workflow steps |

Anything in `[square brackets]` is a placeholder. Links left as `''` show a "not added yet" note
instead of a broken link, and the contact form stays switched off until you add an email.

**Add a real project:** open `src/content/projects.ts`, copy one whole `{ ... },` block, give it a new unique `id`, and fill in the fields. Delete a block to remove a project. Move blocks to reorder. Put images in `public/projects/` and set `thumbnail: '/projects/my-image.png'`.

**Resume:** put `resume.pdf` in the `public/` folder and set `resumeUrl: '/resume.pdf'` in `site.ts`. The hero button then changes from "Contact Me" to "View Resume".

**Browser tab title and description:** edit `index.html`. Replace `public/favicon.svg` with your own icon.

**Colours and fonts:** the top of `src/styles/global.css` (the `:root` block). Sky and water colours are in `src/scene/shaders.ts` (the palette constants at the top).

## 3. How it is built (plain-language)

- **React + TypeScript + Vite**: React builds the page from small reusable pieces; TypeScript catches typing mistakes; Vite runs and packages the site.
- **The background is one WebGL shader** (`src/scene/`). WebGL lets the graphics chip draw the stars, nebula, planet, water and ripples. I deliberately did *not* use Three.js: a single full-screen shader does the whole job with a much smaller download and less to maintain.
- **Everything else is normal HTML and CSS**, so text, buttons and navigation stay fast and accessible.

| Path | Purpose |
| --- | --- |
| `src/scene/shaders.ts` | The sky/water/ripple drawing code (commented) |
| `src/scene/OceanEngine.ts` | Render loop, mouse parallax, ripple pool, quality adaptation, clean-up |
| `src/scene/CosmicOcean.tsx` | React wrapper, CSS fallback, error boundary |
| `src/components/` | Nav, Hero, About, Skills, Projects (+card, +detail), Approach, Contact, Footer |
| `src/styles/global.css` | Design tokens and all styling |
| `src/content/` | **Your content** |

**Performance choices:** capped pixel ratio; lower resolution on weaker/touch devices; automatic quality step-down if frames run slowly; paused when the tab is hidden; mouse movement never triggers React re-renders; at most 6 ripples alive at once, throttled; no `backdrop-filter` blur over the animated canvas; background loaded as its own chunk so text paints first. Falls back to a CSS gradient sky if WebGL is unavailable.

**Accessibility:** semantic landmarks, skip link, one `h1`, ordered headings, visible focus rings, keyboard-operable menu and project dialog (native `<dialog>`: Escape closes, focus returns), decorative canvas hidden from assistive tech, and `prefers-reduced-motion` gives a calm static scene with no parallax, ripples or reveals.

## 4. Build the production version

```
npm run build
npm run preview
```

`build` creates a `dist/` folder (the finished website; also type-checks your code). `preview` serves it locally so you can test exactly what visitors will get.

## 5. Test checklist

- Move the mouse: sky, planet and water shift slightly, with easing.
- Move over the **water** (below the horizon): ripples spread. Over buttons/links/cards: no ripple.
- On a phone (or browser device mode): tap the water for a ripple.
- Press **Tab** through the page: every control shows a focus ring; open a project with **Enter**, close with **Esc**.
- Resize to phone width: no sideways scrolling; the menu button works.
- Turn on your OS "reduce motion" setting and reload: the scene should be still.
- Browser DevTools → Console should show no red errors.

## 6. Deploying later (not done, needs your approval)

Any static host works with the `dist/` folder. Suggested for beginners: **Cloudflare Pages**, **Netlify** or **Vercel** (free tiers, HTTPS included). Build command `npm run build`, output folder `dist`. GitHub Pages also works. Before publishing: replace all placeholders, add your real links, set a real page title/description, and add an `og:image` URL in `index.html`.

When you are ready, tell me and we can decide together whether to use a **new** repository or your existing one. I will not push to or change `karneya-official/Portfolio` without your explicit go-ahead.
