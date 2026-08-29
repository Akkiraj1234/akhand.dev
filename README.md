# akhand.dev

Akhand.dev is the personal website and portfolio of Akhand Raj (Akki) showcasing projects, philosophy, and current work. It's a small Vite + Preact site that reads site content from `public/master.json`.

**Features:**

- **Personal site**: Portfolio, projects, and short blog ideas.
- **Data-driven**: Content is stored in `public/master.json` and imported by the app.
- **Lightweight stack**: Built with Vite and Preact for fast local development.

**Tech stack:**

- **Framework**: Preact
- **Bundler**: Vite
- **Testing**: Vitest

## Getting started

Requirements: Node.js (16+) and npm or a compatible package manager.

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

Run tests:

```bash
npm test
```

## Project structure

- public/: static assets and `master.json` content source
- src/: application source
  - data/master.json import: `src/data/site.js`
  - pages/: page components
  - layout/: main layout component

## Contributing

This repository hosts a personal website. Contributions are welcome (content updates, accessibility fixes, or improvements to the site layout). For code changes, please open a PR with a clear description of the change.

## License

See the `LICENCE` file in the repository.

## Contact

Akhand's contact and profile links are in `public/master.json` under the `social` and `profiles` sections. Email: `akhandraj402@gmail.com`
