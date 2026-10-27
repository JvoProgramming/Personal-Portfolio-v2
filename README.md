# Personal Portfolio v2

Johnny's personal website: a 3D bedroom whose PC boots into a Windows XP style OS. Built with Vite, React, TypeScript, Zustand, XP.css and React Three Fiber.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build to dist/
npm run lint
```

Add `?no3d` to the URL to skip the 3D room, or `?time=19.5` to preview the room at 7:30pm Los Angeles time.

## How it's organized

| Folder | What's in it |
| --- | --- |
| `src/os/` | The XP shell: boot screen, welcome screen, desktop, windows, taskbar, Start menu, and the Zustand store |
| `src/apps/` | One file per desktop app. `registry.ts` lists every app, its icon, and which accounts see it |
| `src/content/` | All the text: resume, projects, recipes, photos, wiki page. `blog/` and `garden/` hold Markdown posts |
| `src/room/` | The 3D room, lazy-loaded. If it fails, the site falls back to the OS. `objects/` has one file per piece of furniture; `time.ts` sets the sky from LA time; `textures.ts` draws posters and photos in code |
| `src/lib/i18n.ts` | English and Vietnamese text for the room, welcome screen, Start menu and app names |
| `src/pages/` | Plain pages outside the OS, like `/resume` |
| `public/wallpapers/` | Desktop wallpapers (SVG) |

## Editing content

- **Resume:** edit `src/content/resume.ts`. The Resume app and `/resume` page both use it.
- **Blog posts and garden notes:** add a `.md` file to `src/content/blog/` or `src/content/garden/` with a `title` and `date` in the frontmatter.
- **Photos:** put images in `public/photos/` and set `src` on the matching entry in `src/content/personal.ts`.

## Deploy

Hosted on Vercel. Vercel auto-detects Vite (build `npm run build`, output `dist`). `vercel.json` sends every path to `index.html` so routes like `/resume` work. Pushes to `main` deploy to production; other branches get preview URLs.
