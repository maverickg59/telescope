# Telescope

A local diagram viewer with hot reloading. Supports Mermaid (flowcharts, sequences, state diagrams) and DBML (entity relationship diagrams). Drop files into folders, see them rendered instantly in the browser.

## Setup

```
bun install
bun run build:dbml
bun dev
```

Open [http://localhost:3333](http://localhost:3333)

## Adding Diagrams

Create a folder per project under `diagrams/mermaid/` or `diagrams/dbml/`, then add files:

```
diagrams/
  mermaid/
    my-project/
      system-overview.mmd
      data-flow.mmd
  dbml/
    my-project/
      schema.dbml
```

Projects and diagrams appear in the dropdowns automatically. New files trigger a live reload.

## Viewers

### Mermaid

Renders `.mmd` files using Mermaid v11 (loaded from CDN). Supports flowcharts, sequence diagrams, state diagrams, and more. Pan and zoom with mouse and keyboard.

### DBML

Renders `.dbml` files as interactive entity relationship diagrams using React Flow. Tables are draggable, edges connect at the column level with smoothstep routing, and the layout is computed automatically with dagre.

## Controls

- **Cmd + =** / **Cmd + -** — Zoom in/out
- **Cmd + 0** — Reset zoom / fit view
- **Click + drag** — Pan the diagram or drag tables (DBML only)
- **Scroll wheel** — Zoom

## Development

The Mermaid viewer is a single static HTML file — no build step needed.

The DBML viewer is a React app built with Vite:

```
bun run build:dbml        # one-time build
```

DBML diagram file changes are picked up automatically via SSE hot reload. Only rebuild when changing the viewer source code in `dbml-viewer/`.

## Acknowledgments

DBML viewer approach inspired by [DBML Previewer](https://github.com/kykurniawan/vscode-dbml-previewer) by Rizky Kurniawan (MIT License).
