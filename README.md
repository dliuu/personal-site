# personal-site

A lab for trying 3D ideas before choosing a direction. See `docs/skeleton.md`
for how it is organised and `wiki/examples.md` for references.

```bash
npm install
npm run dev      # http://localhost:3000/lab
npm run check    # typecheck + lint + tests
```

To add an experiment: create `lab/<slug>/index.tsx` and `README.md`, add an
entry to `lab/registry.ts` and a loader to `lab/loaders.tsx`.

Deploy: `vercel.json` pins the framework because the Vercel project was
linked before the app existed.
