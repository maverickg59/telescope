# Telescope

Local Mermaid diagram viewer with hot reloading. Built with Bun + Hono.

## Run

```
bun dev
```

Serves at http://localhost:3333

## Project Structure

```
index.ts              Hono server — API routes + SSE live reload
static/index.html     Single-page frontend — Mermaid rendering, pan/zoom, dropdowns
diagrams/             Diagram storage
  <project>/          One folder per project
    <name>.mmd        Mermaid diagram files
```

## How It Works

- `index.ts` watches `diagrams/` recursively with `node:fs.watch` (200ms debounce)
- On file change, pushes SSE event to all connected browsers via `/api/reload`
- Browser receives event, re-fetches and re-renders the current diagram
- `GET /api/diagrams` scans all `diagrams/<project>/*.mmd` files dynamically — no manifest needed
- `GET /api/diagram/:project/:name` serves raw `.mmd` content
- Mermaid v11 loaded from CDN, renders client-side to SVG

## Adding Diagrams

Drop a `.mmd` file into `diagrams/<project>/`. It appears in the UI automatically via live reload. No config changes needed.

## Frontend Controls

- **Cmd + =** / **Cmd + -** — Zoom in/out (0.2 step)
- **Cmd + 0** — Reset zoom
- **Click + drag** — Pan diagram
- Zoom/pan reset when switching diagrams

## Mermaid Config

Theme and layout set in `static/index.html` inside `mermaid.initialize()`:

```js
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',           // default | neutral | dark | forest | base
  flowchart: { padding: 15 },
  themeVariables: { fontSize: '20px' },
});
```

Flowchart options (set inside `flowchart: {}`):
- `padding` (15) — padding between label text and node shape
- `nodeSpacing` (50) — horizontal spacing between nodes
- `rankSpacing` (50) — vertical spacing between levels
- `diagramPadding` (20) — padding around entire diagram
- `curve` (rounded) — line style: basis | linear | rounded | cardinal
- `wrappingWidth` (200) — max width before text wraps
- `defaultRenderer` — dagre-wrapper | dagre-d3 | elk

## Key Files

- **`index.ts`** — Server entry. Three API routes + SSE endpoint + static file serving. The fs watcher and SSE client set are module-level singletons.
- **`static/index.html`** — Everything frontend: styles, Mermaid init, dropdown logic, pan/zoom, SSE listener. Single file, no build step.
