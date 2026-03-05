# Telescope

Local diagram viewer with hot reloading. Built with Bun + Hono.

## Run

```
bun dev
```

Serves at http://localhost:3333

## Project Structure

```
index.ts                Hono server — API routes + SSE live reload
static/mermaid.html     Mermaid viewer — rendering, pan/zoom, dropdowns
dbml-viewer/            DBML viewer React app (source)
  App.jsx               Main component — nav, React Flow canvas, SSE reload
  TableNode.jsx         Custom React Flow node — table header + columns + handles
  CustomEdge.jsx        Smoothstep edge renderer
  transform.js          Schema JSON → React Flow nodes/edges + dagre layout
  main.jsx              React entry point
  index.html            HTML template
dbml-dist/              Built DBML viewer output (gitignored)
lib/dbml-to-mermaid.ts  Legacy DBML→Mermaid converter (unused, kept for reference)
vite.config.ts          Vite build config for DBML viewer
diagrams/               Diagram storage
  mermaid/<project>/    Mermaid diagram files (.mmd)
  dbml/<project>/       DBML diagram files (.dbml)
```

## How It Works

### Server (index.ts)

- Watches `diagrams/` recursively with `node:fs.watch` (200ms debounce)
- On file change, pushes SSE event to all connected browsers via `/api/reload`
- `GET /api/mermaid/diagrams` — lists all mermaid diagrams
- `GET /api/mermaid/diagram/:project/:name` — serves raw `.mmd` content
- `GET /api/dbml/diagrams` — lists all DBML diagrams
- `GET /api/dbml/diagram/:project/:name` — parses `.dbml` with `@dbml/core`, returns JSON schema (tables + refs)
- Mermaid page served from `static/mermaid.html`
- DBML page served from `dbml-dist/` (Vite build output)

### Mermaid Viewer (static/mermaid.html)

- Mermaid v11 loaded from CDN, renders client-side to SVG
- Pan/zoom with mouse drag and Cmd+/- keyboard shortcuts
- Single file, no build step

### DBML Viewer (dbml-viewer/)

- React app using `@xyflow/react` (React Flow) for interactive rendering
- `@dbml/core` parses DBML server-side, API returns JSON
- `dagre` computes automatic table layout
- Custom `TableNode` renders header + columns with positioned handles
- `CustomEdge` uses smoothstep paths for clean orthogonal routing
- Tables are draggable, edges connect at column level
- Cmd+/- zooms canvas only (not nav), Cmd+0 fits view
- Built with Vite: `bun run build:dbml`

## Adding Diagrams

Drop files into `diagrams/mermaid/<project>/` or `diagrams/dbml/<project>/`. They appear in the UI automatically via live reload.

## Build Commands

- `bun dev` — Start server with auto-restart on server code changes
- `bun run build:dbml` — Rebuild DBML viewer after changing `dbml-viewer/` source

## Mermaid Config

Theme and layout set in `static/mermaid.html` inside `mermaid.initialize()`:

```js
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  flowchart: { padding: 15 },
  themeVariables: { fontSize: "20px" },
});
```
