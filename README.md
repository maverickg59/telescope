# 🔭 Telescope

A local Mermaid diagram viewer with hot reloading. Drop `.mmd` files into folders, see them rendered instantly in the browser. Edit a diagram and the browser updates automatically.

## Setup

```
bun install
bun dev
```

Open [http://localhost:3333](http://localhost:3333)

## Adding Diagrams

Create a folder per project under `diagrams/`, then add `.mmd` files:

```
diagrams/
  my-project/
    system-overview.mmd
    data-flow.mmd
  another-project/
    architecture.mmd
```

Projects and diagrams appear in the dropdowns automatically. New files trigger a live reload — no refresh needed.

## Controls

- **Cmd + =** — Zoom in
- **Cmd + -** — Zoom out
- **Cmd + 0** — Reset zoom
- **Click + drag** — Pan the diagram

## Configuration

Theme and layout options are set in `static/index.html` inside `mermaid.initialize()`. Available themes: `default`, `neutral`, `dark`, `forest`, `base`.
