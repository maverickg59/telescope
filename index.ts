import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { readdir, readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { join } from "node:path";

const app = new Hono();
const DIAGRAMS_DIR = join(import.meta.dir, "diagrams");

// Live reload via SSE
const clients = new Set<ReadableStreamDefaultController>();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(DIAGRAMS_DIR, { recursive: true }, () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    for (const client of clients) {
      try {
        client.enqueue(new TextEncoder().encode("data: reload\n\n"));
      } catch {
        clients.delete(client);
      }
    }
  }, 200);
});

interface DiagramEntry {
  project: string;
  name: string;
  file: string;
}

async function scanDiagrams(): Promise<DiagramEntry[]> {
  const entries: DiagramEntry[] = [];
  const projects = await readdir(DIAGRAMS_DIR, { withFileTypes: true });

  for (const project of projects) {
    if (!project.isDirectory()) continue;
    const projectDir = join(DIAGRAMS_DIR, project.name);
    const files = await readdir(projectDir);

    for (const file of files) {
      if (!file.endsWith(".mmd")) continue;
      const name = file.replace(/\.mmd$/, "");
      entries.push({
        project: project.name,
        name,
        file: `${project.name}/${file}`,
      });
    }
  }

  return entries.sort((a, b) =>
    a.project.localeCompare(b.project) || a.name.localeCompare(b.name),
  );
}

app.get("/api/diagrams", async (c) => {
  const diagrams = await scanDiagrams();
  return c.json(diagrams);
});

app.get("/api/diagram/:project/:name", async (c) => {
  const { project, name } = c.req.param();
  const filePath = join(DIAGRAMS_DIR, project, `${name}.mmd`);
  try {
    const content = await readFile(filePath, "utf-8");
    return c.text(content);
  } catch {
    return c.text("Diagram not found", 404);
  }
});

app.get("/api/reload", (c) => {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      c.req.raw.signal.addEventListener("abort", () => clients.delete(controller));
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

app.get("/", serveStatic({ path: "./static/index.html" }));

export default {
  port: 3333,
  fetch: app.fetch,
};
