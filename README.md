# egeerenler.com

Personal website of Ege Erenler, software and data engineer in London.

Three display modes (Simple, Dark and Art), a portrait that follows the cursor, a drag-to-open CV wheel that downloads, converts and crops the CV, and a globe that turns to London.

## How it is built

The page is a small static app with no server:

- `index.html` and `404.html` load `app.js` and `app.css`.
- `app.js` is generated from the components in `design/components/` by `design/build.mjs`. It uses Preact and htm from `vendor/`.
- `cv/Ege_Erenler_CV.pdf` is the CV the wheel downloads.

## Change something

1. Edit a component in `design/components/`.
2. Rebuild:

```bash
cd design
npm install
npm run build
```

3. Commit and push. GitHub Pages serves the site from this repository.
